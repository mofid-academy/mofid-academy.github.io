-- Persistent execution order. Existing explicit next-panel choices are preserved.
create sequence public.expo1405_room_order_seq as bigint;
alter table public.expo1405_rooms add column sort_order bigint;
with ranked as (select id,row_number() over(order by created_at,id) as position from public.expo1405_rooms)
update public.expo1405_rooms r set sort_order=ranked.position from ranked where ranked.id=r.id;
select setval('public.expo1405_room_order_seq',coalesce(max(sort_order),1),count(*)>0) from public.expo1405_rooms;
alter table public.expo1405_rooms alter column sort_order set default nextval('public.expo1405_room_order_seq');
alter table public.expo1405_rooms alter column sort_order set not null;
alter sequence public.expo1405_room_order_seq owned by public.expo1405_rooms.sort_order;
revoke all on sequence public.expo1405_room_order_seq from public,anon,authenticated;
grant usage,select on sequence public.expo1405_room_order_seq to service_role;
create index expo1405_rooms_execution_order_idx on public.expo1405_rooms(sort_order,created_at,id) where deleted_at is null and (id='main' or parent_id='main');

CREATE OR REPLACE FUNCTION public.expo1405_classes()
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
 select coalesce(jsonb_agg(jsonb_build_object('id',r.id,'title',r.title,'phase',r.phase,
   'nextPanelId',r.next_room_id,'sortOrder',r.sort_order,'createdAt',r.created_at,'deletedAt',r.deleted_at,
   'questionCount',(select count(*) from public.expo1405_questions q where q.room_id=r.id and not q.archived))
   order by r.sort_order,r.created_at,r.id),'[]'::jsonb)
 from public.expo1405_rooms r where r.id='main' or r.parent_id='main';
$function$;

CREATE OR REPLACE FUNCTION public.expo1405_resolve_next_panel(p_room text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
 select (select jsonb_build_object('id',n.id,'title',n.title)
 from public.expo1405_rooms n
 where (n.id='main' or n.parent_id='main') and n.id<>r.id and n.deleted_at is null and n.phase<>'finished'
 and exists(select 1 from public.expo1405_questions q where q.room_id=n.id and not q.archived)
 and (case when r.next_room_id is not null then n.id=r.next_room_id else (n.sort_order,n.created_at,n.id)>(r.sort_order,r.created_at,r.id) end)
 order by n.sort_order,n.created_at,n.id limit 1)
 from public.expo1405_rooms r where r.id=p_room and (r.id='main' or r.parent_id='main') and r.deleted_at is null;
$function$;

-- Normal creation appends to the schedule; Quick Next remains an explicit jump.
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
 if source.deleted_at is null and p_close_previous then
   update public.expo1405_rooms set next_room_id=new_id where id=p_source;
 end if;
 if p_close_previous and source.deleted_at is null then
   update public.expo1405_rooms set phase='finished',active_question=null,deadline=null,updated_at=now() where id=p_source;
   perform public.expo1405_publish(p_source);
 end if;
 perform public.expo1405_publish(new_id);
 return jsonb_build_object('id',new_id,'title',class_title);
end $function$;

create function public.expo1405_reorder_classes(p_order text[],p_expected text[]) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare current_order text[]; slots bigint[];
begin
 -- Same root lock as create/delete/restore; a stale mobile tab cannot overwrite newer changes.
 perform 1 from public.expo1405_rooms where id='main' for update;
 if p_order is null or p_expected is null or cardinality(p_order) not between 1 and 1000
    or array_ndims(p_order)<>1 or array_ndims(p_expected)<>1
    or array_position(p_order,null) is not null or array_position(p_expected,null) is not null
    or cardinality(p_order)<>(select count(distinct id) from unnest(p_order) id) then
   raise exception 'invalid_class_order';
 end if;
 select coalesce(array_agg(id order by sort_order,created_at,id),array[]::text[]),
        coalesce(array_agg(sort_order order by sort_order,created_at,id),array[]::bigint[])
 into current_order,slots from public.expo1405_rooms
 where (id='main' or parent_id='main') and deleted_at is null;
 if cardinality(p_order)<>cardinality(current_order) or not(p_order @> current_order and current_order @> p_order) then
   raise exception 'invalid_class_order';
 end if;
 -- Repeating a successful request after a lost response is safe.
 if current_order=p_order then return jsonb_build_object('ok',true,'order',p_order);end if;
 if current_order is distinct from p_expected then raise exception 'class_order_changed';end if;
 with desired as (select id,n from unnest(p_order) with ordinality o(id,n)),
      positions as (select position,n from unnest(slots) with ordinality s(position,n))
 update public.expo1405_rooms r set sort_order=p.position
 from desired d join positions p using(n) where r.id=d.id and r.sort_order is distinct from p.position;
 return jsonb_build_object('ok',true,'order',p_order);
end $$;
revoke all on function public.expo1405_reorder_classes(text[],text[]) from public,anon,authenticated;
grant execute on function public.expo1405_reorder_classes(text[],text[]) to service_role;
