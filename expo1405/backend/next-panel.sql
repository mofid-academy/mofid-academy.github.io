-- Keep participant identities and responses separate while allowing one-click continuation.
alter table public.expo1405_rooms add column next_room_id text references public.expo1405_rooms(id);
create index expo1405_rooms_next_room_idx on public.expo1405_rooms(next_room_id) where next_room_id is not null;
alter table public.expo1405_rooms add constraint expo1405_rooms_next_not_self check(next_room_id is distinct from id);

create function public.expo1405_resolve_next_panel(p_room text) returns jsonb
language sql stable security invoker set search_path='' as $$
 select (select jsonb_build_object('id',n.id,'title',n.title)
 from public.expo1405_rooms n
 where (n.id='main' or n.parent_id='main') and n.id<>r.id and n.deleted_at is null and n.phase<>'finished'
 and exists(select 1 from public.expo1405_questions q where q.room_id=n.id and not q.archived)
 and (case when r.next_room_id is not null then n.id=r.next_room_id else (n.created_at,n.id)>(r.created_at,r.id) end)
 order by n.created_at,n.id limit 1)
 from public.expo1405_rooms r where r.id=p_room and (r.id='main' or r.parent_id='main') and r.deleted_at is null;
$$;

create function public.expo1405_set_next_panel(p_room text,p_target text) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare r public.expo1405_rooms;
begin
 select * into r from public.expo1405_rooms where id=p_room and (id='main' or parent_id='main') for update;
 if not found then raise exception 'class_not_found';end if;
 if r.deleted_at is not null then raise exception 'class_deleted';end if;
 if p_target is not null and (p_target=p_room or not exists(select 1 from public.expo1405_rooms where id=p_target and (id='main' or parent_id='main') and deleted_at is null and phase<>'finished')) then raise exception 'invalid_next_panel';end if;
 update public.expo1405_rooms set next_room_id=p_target,updated_at=clock_timestamp() where id=p_room;
 return jsonb_build_object('ok',true,'nextPanelId',p_target);
end $$;

create function public.expo1405_next_panel(p_room text,p_hash text) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare r public.expo1405_rooms;
begin
 if not exists(select 1 from public.expo1405_participants where room_id=p_room and token_hash=p_hash) then raise exception 'invalid_participant';end if;
 select * into r from public.expo1405_rooms where id=p_room;
 if r.deleted_at is not null then raise exception 'class_deleted';end if;
 if r.phase<>'finished' then return jsonb_build_object('finished',false,'nextPanel',null);end if;
 return jsonb_build_object('finished',true,'nextPanel',public.expo1405_resolve_next_panel(p_room));
end $$;

create function public.expo1405_continue_panel(p_room text,p_hash text,p_target text,p_new_hash text,p_existing_hash text default null) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare r public.expo1405_rooms; target_room public.expo1405_rooms; person public.expo1405_participants; dest public.expo1405_participants; selected jsonb; existing boolean:=false;
begin
 select * into r from public.expo1405_rooms where id=p_room for share;
 select * into person from public.expo1405_participants where room_id=p_room and token_hash=p_hash;
 if person.id is null then raise exception 'invalid_participant';end if;
 if r.deleted_at is not null then raise exception 'class_deleted';end if;
 if r.phase<>'finished' then raise exception 'panel_not_finished';end if;
 selected=public.expo1405_resolve_next_panel(p_room);
 if selected is null or selected->>'id' is distinct from p_target then raise exception 'next_panel_unavailable';end if;
 select * into target_room from public.expo1405_rooms where id=p_target for update;
 if target_room.deleted_at is not null or target_room.phase='finished' then raise exception 'next_panel_unavailable';end if;
 if p_existing_hash is not null then
   select * into dest from public.expo1405_participants where room_id=p_target and token_hash=p_existing_hash;
   existing=dest.id is not null;
 end if;
 if dest.id is null then select * into dest from public.expo1405_participants where room_id=p_target and token_hash=p_new_hash;end if;
 if dest.id is null then
   if nullif(btrim(person.display_name),'') is null then raise exception 'name_required';end if;
   if p_new_hash is null or p_new_hash !~ '^[0-9a-f]{64}$' or p_new_hash=p_hash then raise exception 'invalid_participant';end if;
   insert into public.expo1405_participants(room_id,token_hash,display_name,share_on_screen)
   values(p_target,p_new_hash,person.display_name,true) returning * into dest;
   perform public.expo1405_publish(p_target);
 end if;
 return jsonb_build_object('room',p_target,'title',target_room.title,'id',dest.id,'name',dest.display_name,'usedExisting',existing);
end $$;

revoke all on function public.expo1405_resolve_next_panel(text),public.expo1405_set_next_panel(text,text),public.expo1405_next_panel(text,text),public.expo1405_continue_panel(text,text,text,text,text) from public,anon,authenticated;
grant execute on function public.expo1405_resolve_next_panel(text),public.expo1405_set_next_panel(text,text),public.expo1405_next_panel(text,text),public.expo1405_continue_panel(text,text,text,text,text) to service_role;

CREATE OR REPLACE FUNCTION public.expo1405_create_class(p_source text, p_title text, p_copy boolean, p_close_previous boolean, p_request uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare source public.expo1405_rooms; root public.expo1405_rooms; new_id text := 'cls-'||p_request::text;
 class_title text := nullif(btrim(p_title),''); existing public.expo1405_rooms; source_question public.expo1405_questions; new_question uuid;
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
   select 'پنل '||(count(*)+1)::text into class_title from public.expo1405_rooms where id='main' or parent_id='main';
 end if;
 if char_length(class_title) not between 2 and 100 then raise exception 'invalid_class_title'; end if;
 insert into public.expo1405_rooms(id,parent_id,title,host_key_hash,name_policy,target,is_quiz)
 values(new_id,'main',class_title,root.host_key_hash,source.name_policy,source.target,p_copy and source.is_quiz);
 if p_copy then
   for source_question in select * from public.expo1405_questions where room_id=p_source and not archived order by position,created_at loop
     insert into public.expo1405_questions(room_id,position,text,options)
     values(new_id,source_question.position,source_question.text,source_question.options) returning id into new_question;
     if source.is_quiz then
       insert into public.expo1405_quiz_keys(room_id,round,question_id,position,question_text,options,correct_choice,points)
       select new_id,1,new_question,source_question.position,source_question.text,source_question.options,k.correct_choice,k.points
       from public.expo1405_quiz_keys k where k.room_id=p_source and k.round=source.round and k.question_id=source_question.id;
     end if;
   end loop;
 end if;
 if source.deleted_at is null and (source.next_room_id is null or p_close_previous) then
   update public.expo1405_rooms set next_room_id=new_id where id=p_source;
 end if;
 if p_close_previous and source.deleted_at is null then
   update public.expo1405_rooms set phase='finished',active_question=null,deadline=null,updated_at=now() where id=p_source;
   perform public.expo1405_publish(p_source);
 end if;
 perform public.expo1405_publish(new_id);
 return jsonb_build_object('id',new_id,'title',class_title);
end $function$
;
CREATE OR REPLACE FUNCTION public.expo1405_classes()
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
 select coalesce(jsonb_agg(jsonb_build_object('id',r.id,'title',r.title,'phase',r.phase,
   'nextPanelId',r.next_room_id,'createdAt',r.created_at,'deletedAt',r.deleted_at,
   'questionCount',(select count(*) from public.expo1405_questions q where q.room_id=r.id and not q.archived))
   order by r.created_at desc,r.id),'[]'::jsonb)
 from public.expo1405_rooms r where r.id='main' or r.parent_id='main';
$function$
;
