-- Private video catalogue. Only the authenticated application backend accesses these objects.
create table public.av_catalog (
  id boolean primary key default true check (id),
  revision integer not null default 0 check (revision >= 0),
  courses jsonb not null default '[]'::jsonb check (jsonb_typeof(courses) = 'array'),
  updated_at timestamptz not null default now()
);
insert into public.av_catalog(id) values (true);

create table public.av_progress (
  actor text not null,
  lesson_id uuid not null,
  position double precision not null default 0 check (position >= 0),
  duration double precision not null default 0 check (duration >= 0),
  ranges jsonb not null default '[]'::jsonb check (jsonb_typeof(ranges) = 'array'),
  revision integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key(actor,lesson_id)
);

create table public.av_rate_limits (
  key text primary key,
  window_start timestamptz not null default now(),
  hits integer not null default 1
);

alter table public.av_catalog enable row level security;
alter table public.av_progress enable row level security;
alter table public.av_rate_limits enable row level security;
revoke all on public.av_catalog,public.av_progress,public.av_rate_limits from public,anon,authenticated;
grant all on public.av_catalog,public.av_progress,public.av_rate_limits to service_role;

create function public.av_catalog_save(p_revision integer,p_courses jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare result jsonb;
begin
  if jsonb_typeof(p_courses) <> 'array' or pg_column_size(p_courses) > 2097152 then
    raise exception 'INVALID_CATALOG';
  end if;
  update public.av_catalog set courses=p_courses,revision=revision+1,updated_at=now()
    where id=true and revision=p_revision
    returning jsonb_build_object('courses',courses,'revision',revision,'updated_at',updated_at) into result;
  if result is null then raise exception 'REVISION_CONFLICT'; end if;
  return result;
end $$;

create function public.av_progress_save(p_actor text,p_lesson uuid,p_revision integer,p_position double precision,p_duration double precision,p_ranges jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare result jsonb;
begin
  insert into public.av_progress(actor,lesson_id,position,duration,ranges,revision)
    values(p_actor,p_lesson,p_position,p_duration,p_ranges,1)
    on conflict(actor,lesson_id) do update
      set position=excluded.position,duration=excluded.duration,ranges=excluded.ranges,
          revision=public.av_progress.revision+1,updated_at=now()
      where public.av_progress.revision=p_revision
    returning to_jsonb(av_progress) into result;
  if result is null then raise exception 'REVISION_CONFLICT'; end if;
  return result;
end $$;

create function public.av_rate_limit(p_key text,p_limit integer default 12)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare count_now integer;
begin
  delete from public.av_rate_limits where window_start < now()-interval '1 day';
  insert into public.av_rate_limits(key) values(p_key)
    on conflict(key) do update set
      hits=case when av_rate_limits.window_start<now()-interval '15 minutes' then 1 else av_rate_limits.hits+1 end,
      window_start=case when av_rate_limits.window_start<now()-interval '15 minutes' then now() else av_rate_limits.window_start end
    returning hits into count_now;
  return count_now<=p_limit;
end $$;

-- R2/S3 credentials never enter the public catalogue or browser-readable tables.
create function public.av_storage_read()
returns jsonb language sql security invoker set search_path = '' as $$
  select decrypted_secret::jsonb from vault.decrypted_secrets where name='academy_video_arvan';
$$;

create function public.av_storage_save(p_config jsonb)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare secret_id uuid;
begin
  perform pg_advisory_xact_lock(hashtext('academy_video_arvan'));
  select id into secret_id from vault.secrets where name='academy_video_arvan';
  if secret_id is null then
    perform vault.create_secret(p_config::text,'academy_video_arvan','Private Arvan video storage credentials');
  else
    perform vault.update_secret(secret_id,p_config::text,'academy_video_arvan','Private Arvan video storage credentials');
  end if;
  return true;
end $$;

revoke all on function public.av_catalog_save(integer,jsonb),public.av_progress_save(text,uuid,integer,double precision,double precision,jsonb),public.av_rate_limit(text,integer),public.av_storage_read(),public.av_storage_save(jsonb) from public,anon,authenticated;
grant execute on function public.av_catalog_save(integer,jsonb),public.av_progress_save(text,uuid,integer,double precision,double precision,jsonb),public.av_rate_limit(text,integer),public.av_storage_read(),public.av_storage_save(jsonb) to service_role;
