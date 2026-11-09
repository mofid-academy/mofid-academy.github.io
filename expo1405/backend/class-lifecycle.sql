-- Reversible class deletion and reopening. No participant, question or response is deleted.
alter table public.expo1405_rooms add column deleted_at timestamptz;
create index expo1405_rooms_deleted_idx on public.expo1405_rooms(deleted_at) where deleted_at is not null;

CREATE OR REPLACE FUNCTION public.expo1405_create_class(p_source text, p_title text, p_copy boolean, p_close_previous boolean, p_request uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare source public.expo1405_rooms; root public.expo1405_rooms; new_id text := 'cls-'||p_request::text;
 class_title text := nullif(btrim(p_title),''); existing public.expo1405_rooms;
begin
 -- Serialize class creation and make retries safe after a network timeout.
 select * into strict root from public.expo1405_rooms where id='main' for update;
 select * into existing from public.expo1405_rooms where id=new_id;
 if found then
   if existing.parent_id is distinct from 'main' then raise exception 'invalid_class'; end if;
   if existing.deleted_at is not null then raise exception 'class_deleted'; end if;
   return jsonb_build_object('id',existing.id,'title',existing.title);
 end if;
 select * into source from public.expo1405_rooms where id=p_source and (id='main' or parent_id='main') for update;
 if not found then raise exception 'class_not_found'; end if;
 if source.deleted_at is not null and p_copy then raise exception 'class_deleted'; end if;
 if class_title is null then
   select 'کلاس '||(count(*)+1)::text into class_title from public.expo1405_rooms where id='main' or parent_id='main';
 end if;
 if char_length(class_title) not between 2 and 100 then raise exception 'invalid_class_title'; end if;
 insert into public.expo1405_rooms(id,parent_id,title,host_key_hash,name_policy,target)
 values(new_id,'main',class_title,root.host_key_hash,source.name_policy,source.target);
 if p_copy then
   insert into public.expo1405_questions(room_id,position,text,options)
   select new_id,position,text,options from public.expo1405_questions
   where room_id=p_source and not archived order by position,created_at;
 end if;
 if p_close_previous and source.deleted_at is null then
   update public.expo1405_rooms set phase='finished',active_question=null,deadline=null,updated_at=now() where id=p_source;
   perform public.expo1405_publish(p_source);
 end if;
 perform public.expo1405_publish(new_id);
 return jsonb_build_object('id',new_id,'title',class_title);
end $function$
;

CREATE OR REPLACE FUNCTION public.expo1405_host_action(p_room text, p_action jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare r public.expo1405_rooms; q public.expo1405_questions; a text:=p_action->>'action'; qid uuid; opts jsonb; txt text; pos integer; other_id uuid; other_pos integer;
begin
 select * into strict r from public.expo1405_rooms where id=p_room for update;
 if r.deleted_at is not null then raise exception 'class_deleted'; end if;
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
end $function$
;

CREATE OR REPLACE FUNCTION public.expo1405_join(p_room text, p_hash text, p_name text)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare r public.expo1405_rooms; pid uuid; n text := nullif(btrim(p_name),'');
begin
 select * into strict r from public.expo1405_rooms where id=p_room for update;
 if r.deleted_at is not null then raise exception 'class_deleted'; end if;
 if r.name_policy='anonymous' then n=null; end if;
 if r.name_policy='named' and n is null then raise exception 'name_required'; end if;
 if char_length(n)>80 then raise exception 'invalid_name'; end if;
 insert into public.expo1405_participants(room_id,token_hash,display_name) values(p_room,p_hash,n) returning id into pid;
 perform public.expo1405_publish(p_room);
 return pid;
end $function$
;

CREATE OR REPLACE FUNCTION public.expo1405_profile(p_room text, p_hash text, p_name text, p_shared boolean)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare r public.expo1405_rooms; p public.expo1405_participants; n text:=nullif(btrim(p_name),''); shared boolean:=coalesce(p_shared,false);
begin
 select * into strict r from public.expo1405_rooms where id=p_room for update;
 if r.deleted_at is not null then raise exception 'class_deleted'; end if;
 select * into p from public.expo1405_participants where room_id=p_room and token_hash=p_hash for update;
 if p.id is null then raise exception 'invalid_participant'; end if;
 if char_length(n)>80 then raise exception 'invalid_name'; end if;
 if r.name_policy='anonymous' then n=null;shared=false; end if;
 if (shared or r.name_policy='named') and n is null then raise exception 'name_required'; end if;
 update public.expo1405_participants set display_name=n,share_on_screen=shared where id=p.id;
 perform public.expo1405_publish(p_room);
 return jsonb_build_object('name',n,'shareOnScreen',shared);
end $function$
;

CREATE OR REPLACE FUNCTION public.expo1405_publish(p_room text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare r public.expo1405_rooms; q public.expo1405_questions; result jsonb; counts jsonb; total integer; public_result jsonb;
begin
 select * into strict r from public.expo1405_rooms where id=p_room;
 if r.deleted_at is not null then
   result=jsonb_build_object('room',p_room,'title',r.title,'round',r.round,'phase','finished','deleted',true,'question',null);
   insert into public.expo1405_display(id,payload) values(p_room,result)
   on conflict(id) do update set payload=excluded.payload,revision=public.expo1405_display.revision+1;
   insert into public.expo1405_public(id,payload) values(p_room,result)
   on conflict(id) do update set payload=excluded.payload,revision=public.expo1405_public.revision+1;
   return result;
 end if;
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
   'credits',coalesce((select jsonb_agg(jsonb_build_object('id',feed.id,'name',feed.name,'answer',feed.answer) order by feed.created_at,feed.id) from (
     select v.id,v.created_at,v.option_text as answer,
       case when r.name_policy<>'anonymous' and p.share_on_screen then coalesce(nullif(btrim(p.display_name),''),'شرکت‌کنندهٔ ناشناس') else 'شرکت‌کنندهٔ ناشناس' end as name
     from public.expo1405_votes v join public.expo1405_participants p on p.id=v.participant_id and p.room_id=v.room_id
     where v.room_id=p_room and v.round=r.round and v.question_id=r.active_question
     order by v.created_at desc,v.id desc limit 300
   ) feed),'[]'::jsonb),
   'total',coalesce(total,0),'updatedAt',clock_timestamp());
 insert into public.expo1405_display(id,payload) values(p_room,result)
 on conflict(id) do update set payload=excluded.payload,revision=public.expo1405_display.revision+1;
 public_result=result-ARRAY['credits','total','participants','updatedAt'];
 if q.id is not null then
   public_result=jsonb_set(public_result,'{question,options}',coalesce((select jsonb_agg(o-'count') from jsonb_array_elements(public_result#>'{question,options}') o),'[]'::jsonb));
 end if;
 insert into public.expo1405_public(id,payload) values(p_room,public_result||jsonb_build_object('updatedAt',clock_timestamp()))
 on conflict(id) do update set payload=excluded.payload,revision=public.expo1405_public.revision+1
 where (public.expo1405_public.payload-'updatedAt') is distinct from public_result;
 return result;
end $function$
;

CREATE OR REPLACE FUNCTION public.expo1405_vote(p_room text, p_hash text, p_question uuid, p_round integer, p_choice integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare r public.expo1405_rooms; q public.expo1405_questions; p public.expo1405_participants; existing integer;
begin
 select * into strict r from public.expo1405_rooms where id=p_room for update;
 if r.deleted_at is not null then raise exception 'class_deleted'; end if;
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
end $function$
;


create or replace function public.expo1405_classes() returns jsonb
language sql stable security invoker set search_path = '' as $$
 select coalesce(jsonb_agg(jsonb_build_object('id',r.id,'title',r.title,'phase',r.phase,
   'createdAt',r.created_at,'deletedAt',r.deleted_at,
   'questionCount',(select count(*) from public.expo1405_questions q where q.room_id=r.id and not q.archived))
   order by r.created_at desc,r.id),'[]'::jsonb)
 from public.expo1405_rooms r where r.id='main' or r.parent_id='main';
$$;

create function public.expo1405_class_lifecycle(p_room text,p_action text,p_confirm_title text default null) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare r public.expo1405_rooms;
begin
 -- Use the same lock order as class creation, including deletion of the root class.
 perform 1 from public.expo1405_rooms where id='main' for update;
 select * into r from public.expo1405_rooms where id=p_room and (id='main' or parent_id='main') for update;
 if not found then raise exception 'class_not_found'; end if;
 if p_action='delete' then
   if btrim(coalesce(p_confirm_title,'')) is distinct from r.title then raise exception 'class_confirmation_required'; end if;
   if r.deleted_at is null then
     update public.expo1405_rooms set deleted_at=clock_timestamp(),phase='finished',active_question=null,deadline=null,updated_at=clock_timestamp() where id=p_room;
   end if;
 elsif p_action='restore' then
   if r.deleted_at is not null then
     update public.expo1405_rooms set deleted_at=null,phase='waiting',active_question=null,deadline=null,updated_at=clock_timestamp() where id=p_room;
   end if;
 elsif p_action='reopen' then
   if r.deleted_at is not null then raise exception 'class_deleted'; end if;
   if r.phase='finished' then
     update public.expo1405_rooms set phase='waiting',active_question=null,deadline=null,updated_at=clock_timestamp() where id=p_room;
   end if;
 else raise exception 'invalid_class_action';
 end if;
 perform public.expo1405_publish(p_room);
 return jsonb_build_object('ok',true,'id',r.id,'action',p_action);
end $$;
revoke all on function public.expo1405_class_lifecycle(text,text,text) from public,anon,authenticated;
grant execute on function public.expo1405_class_lifecycle(text,text,text) to service_role;

