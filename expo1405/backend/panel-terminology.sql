-- Use panel terminology for generated names; preserve custom titles and all identities/data.
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
   select 'پنل '||(count(*)+1)::text into class_title from public.expo1405_rooms where id='main' or parent_id='main';
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

do $$
declare panel_id text;
begin
 for panel_id in
   update public.expo1405_rooms set title=regexp_replace(title,'^کلاس','پنل'),updated_at=clock_timestamp()
   where (id='main' or parent_id='main') and title ~ '^کلاس[[:space:]]+[0-9۰-۹٠-٩]+$'
   returning id
 loop
   perform public.expo1405_publish(panel_id);
 end loop;
end $$;

