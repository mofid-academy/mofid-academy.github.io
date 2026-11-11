create function public.expo1405_participant_completed(p_room text,p_person uuid) returns boolean
language sql stable security invoker set search_path='' as $$
 select coalesce(r.phase='finished' or exists(
  select 1 from public.expo1405_votes v join public.expo1405_questions q on q.id=v.question_id and q.room_id=v.room_id
  where v.room_id=r.id and v.round=r.round and v.participant_id=p_person and not q.archived
  and q.id=(select last_q.id from public.expo1405_questions last_q where last_q.room_id=r.id and not last_q.archived order by last_q.position desc,last_q.created_at desc,last_q.id desc limit 1)
 ),false) from public.expo1405_rooms r where r.id=p_room and r.deleted_at is null;
$$;
revoke all on function public.expo1405_participant_completed(text,uuid) from public,anon,authenticated;
grant execute on function public.expo1405_participant_completed(text,uuid) to service_role;

CREATE OR REPLACE FUNCTION public.expo1405_next_panel(p_room text, p_hash text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare r public.expo1405_rooms; person uuid; complete boolean;
begin
 select id into person from public.expo1405_participants where room_id=p_room and token_hash=p_hash;
 if person is null then raise exception 'invalid_participant';end if;
 select * into r from public.expo1405_rooms where id=p_room;
 if r.deleted_at is not null then raise exception 'class_deleted';end if;
 complete=public.expo1405_participant_completed(p_room,person);
 if not complete then return jsonb_build_object('finished',false,'canContinue',false,'nextPanel',null);end if;
 return jsonb_build_object('finished',r.phase='finished','canContinue',true,'nextPanel',public.expo1405_resolve_next_panel(p_room));
end $function$
;
CREATE OR REPLACE FUNCTION public.expo1405_continue_panel(p_room text, p_hash text, p_target text, p_new_hash text, p_existing_hash text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare r public.expo1405_rooms; target_room public.expo1405_rooms; person public.expo1405_participants; dest public.expo1405_participants; selected jsonb; existing boolean:=false;
begin
 select * into r from public.expo1405_rooms where id=p_room for share;
 select * into person from public.expo1405_participants where room_id=p_room and token_hash=p_hash;
 if person.id is null then raise exception 'invalid_participant';end if;
 if r.deleted_at is not null then raise exception 'class_deleted';end if;
 if not public.expo1405_participant_completed(p_room,person.id) then raise exception 'panel_not_finished';end if;
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
end $function$
;
