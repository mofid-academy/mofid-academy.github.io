-- Private, server-written activity history for the video portal.
-- Browser roles cannot read, insert, change or delete these records.
create table public.av_activity_log (
  id bigint generated always as identity primary key,
  occurred_at timestamptz not null default now(),
  actor text,
  username text not null check (length(username) between 3 and 64),
  role text not null check (role in ('student','admin')),
  event text not null check (event in ('login','login_failed','logout','portal_open','lesson_opened','watch_started','watch_progress','lesson_completed','password_changed')),
  session_hash text check (session_hash ~ '^[a-f0-9]{64}$'),
  course_id uuid,
  course_title text not null default '' check (length(course_title)<=180),
  lesson_id uuid,
  lesson_title text not null default '' check (length(lesson_title)<=180),
  percent integer check (percent between 0 and 100),
  watched_seconds integer check (watched_seconds between 0 and 86400)
);
create index av_activity_time_idx on public.av_activity_log(occurred_at desc,id desc);
create index av_activity_user_time_idx on public.av_activity_log(username,occurred_at desc,id desc);
create index av_activity_event_time_idx on public.av_activity_log(event,occurred_at desc,id desc);
create index av_activity_session_time_idx on public.av_activity_log(session_hash,event,occurred_at desc);
create unique index av_activity_lesson_once_idx on public.av_activity_log(actor,lesson_id,event)
  where event in ('watch_started','lesson_completed');

create table public.av_activity_sessions (
  session_hash text primary key check (session_hash ~ '^[a-f0-9]{64}$'),
  actor text not null,
  username text not null check (length(username) between 3 and 64),
  role text not null check (role in ('student','admin')),
  session_version uuid,
  started_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  expires_at timestamptz not null,
  ended_at timestamptz,
  course_title text not null default '' check (length(course_title)<=180),
  lesson_title text not null default '' check (length(lesson_title)<=180)
);
create index av_activity_sessions_seen_idx on public.av_activity_sessions(last_seen_at desc);
create index av_activity_sessions_user_idx on public.av_activity_sessions(username,last_seen_at desc);
alter table public.av_activity_log enable row level security;
alter table public.av_activity_sessions enable row level security;
revoke all on public.av_activity_log,public.av_activity_sessions from public,anon,authenticated;
revoke all on sequence public.av_activity_log_id_seq from public,anon,authenticated;
revoke all on public.av_activity_log,public.av_activity_sessions from service_role;
grant select,insert on public.av_activity_log to service_role;
grant select,insert,update on public.av_activity_sessions to service_role;
grant usage,select on sequence public.av_activity_log_id_seq to service_role;

create function public.av_activity_touch(p_session jsonb)
returns void language plpgsql security invoker set search_path='' as $$
begin
  insert into public.av_activity_sessions as current_session
    (session_hash,actor,username,role,session_version,expires_at,course_title,lesson_title)
  values(p_session->>'sessionHash',p_session->>'actor',p_session->>'username',p_session->>'role',
    (p_session->>'sessionVersion')::uuid,(p_session->>'expiresAt')::timestamptz,
    coalesce(p_session->>'courseTitle',''),coalesce(p_session->>'lessonTitle',''))
  on conflict(session_hash) do update set
    last_seen_at=now(),
    course_title=coalesce(nullif(excluded.course_title,''),current_session.course_title),
    lesson_title=coalesce(nullif(excluded.lesson_title,''),current_session.lesson_title)
  where current_session.ended_at is null;
end $$;

create function public.av_activity_write(p_entry jsonb)
returns void language plpgsql security invoker set search_path='' as $$
declare event_name text=p_entry->>'event';
begin
  if event_name not in ('login','login_failed','logout','portal_open','lesson_opened','watch_started','watch_progress','lesson_completed','password_changed') then
    raise exception 'INVALID_ACTIVITY';
  end if;
  if p_entry->>'sessionHash' is not null then
    perform public.av_activity_touch(p_entry);
    if event_name in ('logout','password_changed') then
      update public.av_activity_sessions set ended_at=coalesce(ended_at,now()) where session_hash=p_entry->>'sessionHash';
    elsif event_name='portal_open' then
      update public.av_activity_sessions set ended_at=null,last_seen_at=now() where session_hash=p_entry->>'sessionHash';
    end if;
  end if;
  -- Restores and repeated signing requests are not separate playback starts.
  if event_name in ('portal_open','lesson_opened') and exists (
    select 1 from public.av_activity_log where session_hash=p_entry->>'sessionHash'
      and event=event_name and lesson_id is not distinct from (p_entry->>'lessonId')::uuid
      and occurred_at>now()-interval '1 minute'
  ) then return; end if;
  insert into public.av_activity_log
    (actor,username,role,event,session_hash,course_id,course_title,lesson_id,lesson_title,percent,watched_seconds)
  values(p_entry->>'actor',p_entry->>'username',p_entry->>'role',event_name,p_entry->>'sessionHash',
    (p_entry->>'courseId')::uuid,coalesce(p_entry->>'courseTitle',''),(p_entry->>'lessonId')::uuid,
    coalesce(p_entry->>'lessonTitle',''),(p_entry->>'percent')::integer,(p_entry->>'watchedSeconds')::integer)
  on conflict do nothing;
end $$;

create function public.av_activity_report(p_username text default null,p_event text default null,p_days integer default 7,p_before_at timestamptz default null,p_before_id bigint default null)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare
  since_time timestamptz;
  report_rows jsonb;
  next_cursor jsonb;
  report_summary jsonb;
  report_users jsonb;
  active_count integer;
begin
  if p_days not in (1,7,30,90) or (p_username is not null and p_username !~ '^[a-z0-9][a-z0-9._-]{2,63}$')
    or (p_event is not null and p_event not in ('login','login_failed','logout','portal_open','lesson_opened','watch_started','watch_progress','lesson_completed','password_changed'))
    or ((p_before_at is null)<>(p_before_id is null)) then raise exception 'INVALID_ACTIVITY_FILTER'; end if;
  since_time=now()-make_interval(days=>p_days);
  with page as materialized (
    select * from public.av_activity_log where occurred_at>=since_time
      and (p_username is null or username=p_username) and (p_event is null or event=p_event)
      and (p_before_at is null or (occurred_at,id)<(p_before_at,p_before_id))
    order by occurred_at desc,id desc limit 51
  ), visible as materialized (select * from page order by occurred_at desc,id desc limit 50)
  select
    coalesce((select jsonb_agg(jsonb_build_object('id',id::text,'occurred_at',occurred_at,'username',username,'role',role,'event',event,
      'course_title',course_title,'lesson_title',lesson_title,'percent',percent,'watched_seconds',watched_seconds) order by occurred_at desc,id desc) from visible),'[]'::jsonb),
    case when (select count(*) from page)>50 then (select jsonb_build_object('id',id::text,'at',occurred_at) from visible order by occurred_at,id limit 1) else null end
  into report_rows,next_cursor;
  select jsonb_build_object('events',count(*),'logins',count(*) filter(where event='login'),
    'failedLogins',count(*) filter(where event='login_failed'),'completedLessons',count(*) filter(where event='lesson_completed'))
  into report_summary from public.av_activity_log where occurred_at>=since_time
    and (p_username is null or username=p_username) and (p_event is null or event=p_event);
  with sessions as (
    select session.*,
      (session.ended_at is null and session.expires_at>now() and session.last_seen_at>now()-interval '5 minutes'
       and (session.role='admin' or (student.is_active and student.session_version=session.session_version))) as is_online
    from public.av_activity_sessions session left join public.av_students student on session.actor='student:'||student.id::text
    where session.last_seen_at>=since_time and (p_username is null or session.username=p_username)
  ), actors as (
    select distinct on (actor) username,role,last_seen_at,course_title,lesson_title,
      bool_or(is_online) over(partition by actor) as is_online from sessions order by actor,last_seen_at desc
  ), recent as (select * from actors order by last_seen_at desc limit 20)
  select (select count(*) from actors where is_online and role='student'),
    coalesce((select jsonb_agg(jsonb_build_object('username',username,'role',role,'last_seen_at',last_seen_at,'is_online',is_online,
      'course_title',course_title,'lesson_title',lesson_title) order by last_seen_at desc) from recent),'[]'::jsonb)
  into active_count,report_users;
  return jsonb_build_object('events',report_rows,'nextCursor',next_cursor,'summary',report_summary||jsonb_build_object('activeUsers',active_count),
    'users',report_users,'generatedAt',now());
end $$;

revoke all on function public.av_activity_touch(jsonb),public.av_activity_write(jsonb),public.av_activity_report(text,text,integer,timestamptz,bigint) from public,anon,authenticated;
grant execute on function public.av_activity_touch(jsonb),public.av_activity_write(jsonb),public.av_activity_report(text,text,integer,timestamptz,bigint) to service_role;
