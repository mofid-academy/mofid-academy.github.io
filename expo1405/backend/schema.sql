-- Exhibition polling. Future questions and participant records are service-only.
create table public.expo1405_rooms (
  id text primary key,
  title text not null,
  host_key_hash text not null,
  round integer not null default 1 check (round > 0),
  phase text not null default 'waiting' check (phase in ('waiting','open','closed','finished')),
  active_question uuid,
  deadline timestamptz,
  name_policy text not null default 'optional' check (name_policy in ('optional','anonymous','named')),
  target integer not null default 100 check (target between 1 and 10000),
  updated_at timestamptz not null default now()
);
create table public.expo1405_questions (
  id uuid primary key default gen_random_uuid(),
  room_id text not null references public.expo1405_rooms(id),
  position integer not null check (position > 0),
  text text not null check (char_length(text) between 3 and 600),
  options jsonb not null check (jsonb_typeof(options) = 'array' and jsonb_array_length(options) between 2 and 8),
  archived boolean not null default false,
  created_at timestamptz not null default now()
);
create index expo1405_questions_room_idx on public.expo1405_questions(room_id,position);
alter table public.expo1405_rooms add constraint expo1405_active_fk foreign key (active_question) references public.expo1405_questions(id);
create table public.expo1405_participants (
  id uuid primary key default gen_random_uuid(),
  room_id text not null references public.expo1405_rooms(id),
  token_hash text not null unique,
  display_name text check (char_length(display_name) <= 80),
  joined_at timestamptz not null default now()
);
create index expo1405_participants_room_idx on public.expo1405_participants(room_id);
create table public.expo1405_votes (
  id uuid primary key default gen_random_uuid(),
  room_id text not null references public.expo1405_rooms(id),
  round integer not null,
  question_id uuid not null references public.expo1405_questions(id),
  participant_id uuid not null references public.expo1405_participants(id),
  choice integer not null,
  question_text text not null,
  option_text text not null,
  display_name text,
  created_at timestamptz not null default now(),
  unique (room_id,round,question_id,participant_id)
);
create index expo1405_votes_question_idx on public.expo1405_votes(question_id,room_id,round);
create index expo1405_votes_participant_idx on public.expo1405_votes(participant_id);
create table public.expo1405_public (
  id text primary key references public.expo1405_rooms(id),
  payload jsonb not null,
  revision bigint not null default 1
);
create table public.expo1405_limits (
  key text primary key,
  bucket bigint not null,
  hits integer not null default 1
);
alter table public.expo1405_rooms enable row level security;
alter table public.expo1405_questions enable row level security;
alter table public.expo1405_participants enable row level security;
alter table public.expo1405_votes enable row level security;
alter table public.expo1405_public enable row level security;
alter table public.expo1405_limits enable row level security;
revoke all on public.expo1405_rooms,public.expo1405_questions,public.expo1405_participants,public.expo1405_votes,public.expo1405_public,public.expo1405_limits from anon,authenticated;
grant all on public.expo1405_rooms,public.expo1405_questions,public.expo1405_participants,public.expo1405_votes,public.expo1405_public,public.expo1405_limits to service_role;
grant select on public.expo1405_public to anon,authenticated;
create policy expo1405_public_read on public.expo1405_public for select to anon,authenticated using (id = 'main');
alter publication supabase_realtime add table public.expo1405_public;

create function public.expo1405_publish(p_room text) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare r public.expo1405_rooms; q public.expo1405_questions; result jsonb; counts jsonb; total integer;
begin
 select * into strict r from public.expo1405_rooms where id=p_room;
 if r.active_question is not null then
   select * into q from public.expo1405_questions where id=r.active_question and room_id=p_room;
   select count(*) into total from public.expo1405_votes where room_id=p_room and round=r.round and question_id=q.id;
   select jsonb_agg(jsonb_build_object('label',o.label,'index',o.ordinality-1,'count',
     (select count(*) from public.expo1405_votes v where v.room_id=p_room and v.round=r.round and v.question_id=q.id and v.choice=o.ordinality-1)) order by o.ordinality)
   into counts from jsonb_array_elements_text(q.options) with ordinality o(label,ordinality);
 end if;
 result=jsonb_build_object('room',p_room,'title',r.title,'round',r.round,'phase',r.phase,'deadline',r.deadline,
   'namePolicy',r.name_policy,'target',r.target,'participants',(select count(*) from public.expo1405_participants where room_id=p_room),
   'questionCount',(select count(*) from public.expo1405_questions where room_id=p_room and not archived),
   'question',case when q.id is null then null else jsonb_build_object('id',q.id,'text',q.text,'position',(select count(*) from public.expo1405_questions where room_id=p_room and not archived and position<=q.position),'options',counts) end,
   'total',coalesce(total,0),'updatedAt',clock_timestamp());
 insert into public.expo1405_public(id,payload) values(p_room,result)
 on conflict(id) do update set payload=excluded.payload,revision=public.expo1405_public.revision+1;
 return result;
end $$;

create function public.expo1405_rate_limit(p_key text,p_limit integer,p_seconds integer) returns boolean
language plpgsql security invoker set search_path = '' as $$
declare b bigint := floor(extract(epoch from clock_timestamp())/p_seconds); n integer;
begin
 insert into public.expo1405_limits(key,bucket,hits) values(p_key,b,1)
 on conflict(key) do update set bucket=b,hits=case when public.expo1405_limits.bucket=b then public.expo1405_limits.hits+1 else 1 end
 returning hits into n;
 return n<=p_limit;
end $$;

create function public.expo1405_join(p_room text,p_hash text,p_name text) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare r public.expo1405_rooms; pid uuid; n text := nullif(btrim(p_name),'');
begin
 select * into strict r from public.expo1405_rooms where id=p_room for update;
 if r.name_policy='anonymous' then n=null; end if;
 if r.name_policy='named' and n is null then raise exception 'name_required'; end if;
 if char_length(n)>80 then raise exception 'invalid_name'; end if;
 insert into public.expo1405_participants(room_id,token_hash,display_name) values(p_room,p_hash,n) returning id into pid;
 perform public.expo1405_publish(p_room);
 return pid;
end $$;

create function public.expo1405_vote(p_room text,p_hash text,p_question uuid,p_round integer,p_choice integer) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare r public.expo1405_rooms; q public.expo1405_questions; p public.expo1405_participants; existing integer;
begin
 select * into strict r from public.expo1405_rooms where id=p_room for update;
 select * into p from public.expo1405_participants where room_id=p_room and token_hash=p_hash;
 if p.id is null then raise exception 'invalid_participant'; end if;
 select choice into existing from public.expo1405_votes where room_id=p_room and round=p_round and question_id=p_question and participant_id=p.id;
 if found then return jsonb_build_object('already',true,'choice',existing); end if;
 if r.phase<>'open' or r.active_question is distinct from p_question or r.round<>p_round
   or (r.deadline is not null and r.deadline<=clock_timestamp()) then raise exception 'voting_closed'; end if;
 select * into strict q from public.expo1405_questions where id=p_question and room_id=p_room and not archived;
 if p_choice<0 or p_choice>=jsonb_array_length(q.options) then raise exception 'invalid_choice'; end if;
 if r.name_policy='named' and p.display_name is null then raise exception 'name_required'; end if;
 insert into public.expo1405_votes(room_id,round,question_id,participant_id,choice,question_text,option_text,display_name)
 values(p_room,r.round,q.id,p.id,p_choice,q.text,q.options->>p_choice,case when r.name_policy='anonymous' then null else p.display_name end);
 perform public.expo1405_publish(p_room);
 return jsonb_build_object('already',false,'choice',p_choice);
end $$;

create function public.expo1405_host_action(p_room text,p_action jsonb) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare r public.expo1405_rooms; q public.expo1405_questions; a text:=p_action->>'action'; qid uuid; opts jsonb; txt text; pos integer; other_id uuid; other_pos integer;
begin
 select * into strict r from public.expo1405_rooms where id=p_room for update;
 if a='activate' then
   qid=(p_action->>'questionId')::uuid;
   select * into strict q from public.expo1405_questions where id=qid and room_id=p_room and not archived;
   update public.expo1405_rooms set active_question=qid,phase='open',deadline=case when coalesce((p_action->>'seconds')::integer,0)>0 then clock_timestamp()+make_interval(secs=>least((p_action->>'seconds')::integer,600)) else null end where id=p_room;
 elsif a='close' then
   update public.expo1405_rooms set phase=case when active_question is null then 'waiting' else 'closed' end,deadline=null where id=p_room;
 elsif a='waiting' or a='finish' then
   update public.expo1405_rooms set phase=case when a='finish' then 'finished' else 'waiting' end,active_question=null,deadline=null where id=p_room;
 elsif a='new_round' then
   update public.expo1405_rooms set round=round+1,phase='waiting',active_question=null,deadline=null where id=p_room;
 elsif a='settings' then
   if (p_action->>'namePolicy') not in ('optional','anonymous','named') then raise exception 'invalid_settings'; end if;
   if r.phase='open' then raise exception 'close_first'; end if;
   update public.expo1405_rooms set name_policy=p_action->>'namePolicy' where id=p_room;
 elsif a='save' then
   txt=btrim(p_action->>'text'); opts=p_action->'options';
   if txt is null or char_length(txt) not between 3 and 600 or jsonb_typeof(opts)<>'array' then raise exception 'invalid_question'; end if;
   if jsonb_array_length(opts) not between 2 and 8 or exists(select 1 from jsonb_array_elements(opts) o where jsonb_typeof(o)<>'string' or char_length(btrim(o#>>'{}')) not between 1 and 160) then raise exception 'invalid_question'; end if;
   if nullif(p_action->>'questionId','') is null then
     select coalesce(max(position),0)+1 into pos from public.expo1405_questions where room_id=p_room and not archived;
     insert into public.expo1405_questions(room_id,position,text,options) values(p_room,pos,txt,opts);
   else
     qid=(p_action->>'questionId')::uuid;
     if r.phase='open' and r.active_question=qid then raise exception 'close_first'; end if;
     if exists(select 1 from public.expo1405_votes where room_id=p_room and round=r.round and question_id=qid) then raise exception 'question_has_votes'; end if;
     update public.expo1405_questions set text=txt,options=opts where room_id=p_room and id=qid and not archived;
     if not found then raise exception 'question_not_found'; end if;
   end if;
 elsif a='delete' then
   qid=(p_action->>'questionId')::uuid;
   if r.active_question=qid then raise exception 'active_question'; end if;
   update public.expo1405_questions set archived=true where room_id=p_room and id=qid;
 elsif a='move' then
   qid=(p_action->>'questionId')::uuid;
   select * into strict q from public.expo1405_questions where room_id=p_room and id=qid and not archived;
   if r.phase='open' then raise exception 'close_first'; end if;
   if p_action->>'direction'='up' then
     select id,position into other_id,other_pos from public.expo1405_questions where room_id=p_room and not archived and position<q.position order by position desc limit 1;
   else
     select id,position into other_id,other_pos from public.expo1405_questions where room_id=p_room and not archived and position>q.position order by position limit 1;
   end if;
   if other_id is not null then
     update public.expo1405_questions set position=other_pos where id=qid;
     update public.expo1405_questions set position=q.position where id=other_id;
   end if;
 else raise exception 'invalid_action';
 end if;
 update public.expo1405_rooms set updated_at=clock_timestamp() where id=p_room;
 return public.expo1405_publish(p_room);
end $$;

revoke all on function public.expo1405_publish(text),public.expo1405_rate_limit(text,integer,integer),public.expo1405_join(text,text,text),public.expo1405_vote(text,text,uuid,integer,integer),public.expo1405_host_action(text,jsonb) from public,anon,authenticated;
grant execute on function public.expo1405_publish(text),public.expo1405_rate_limit(text,integer,integer),public.expo1405_join(text,text,text),public.expo1405_vote(text,text,uuid,integer,integer),public.expo1405_host_action(text,jsonb) to service_role;
