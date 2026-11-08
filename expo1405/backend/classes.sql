-- A class owns its questions, identities, votes, display state and reports.
-- Existing main-class votes are preserved. No public class directory exists.
alter table public.expo1405_rooms add column parent_id text references public.expo1405_rooms(id);
alter table public.expo1405_rooms add column created_at timestamptz not null default now();
create index expo1405_rooms_parent_created_idx on public.expo1405_rooms(parent_id,created_at desc);

create function public.expo1405_classes() returns jsonb
language sql stable security invoker set search_path = '' as $$
 select coalesce(jsonb_agg(jsonb_build_object('id',r.id,'title',r.title,'phase',r.phase,
   'createdAt',r.created_at,'questionCount',(select count(*) from public.expo1405_questions q where q.room_id=r.id and not q.archived))
   order by r.created_at desc,r.id),'[]'::jsonb)
 from public.expo1405_rooms r where r.id='main' or r.parent_id='main';
$$;

create function public.expo1405_create_class(p_source text,p_title text,p_copy boolean,p_close_previous boolean,p_request uuid) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare source public.expo1405_rooms; root public.expo1405_rooms; new_id text := 'cls-'||p_request::text;
 class_title text := nullif(btrim(p_title),''); existing public.expo1405_rooms;
begin
 -- Serialize class creation and make retries safe after a network timeout.
 select * into strict root from public.expo1405_rooms where id='main' for update;
 select * into existing from public.expo1405_rooms where id=new_id;
 if found then
   if existing.parent_id<>'main' then raise exception 'invalid_class'; end if;
   return jsonb_build_object('id',existing.id,'title',existing.title);
 end if;
 select * into source from public.expo1405_rooms where id=p_source and (id='main' or parent_id='main') for update;
 if not found then raise exception 'class_not_found'; end if;
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
 if p_close_previous then
   update public.expo1405_rooms set phase='finished',active_question=null,deadline=null,updated_at=now() where id=p_source;
   perform public.expo1405_publish(p_source);
 end if;
 perform public.expo1405_publish(new_id);
 return jsonb_build_object('id',new_id,'title',class_title);
end $$;

create function public.expo1405_rename_class(p_room text,p_title text) returns jsonb
language plpgsql security invoker set search_path = '' as $$
begin
 if char_length(btrim(coalesce(p_title,''))) not between 2 and 100 then raise exception 'invalid_class_title'; end if;
 update public.expo1405_rooms set title=btrim(p_title),updated_at=now()
 where id=p_room and (id='main' or parent_id='main');
 if not found then raise exception 'class_not_found'; end if;
 perform public.expo1405_publish(p_room);
 return jsonb_build_object('ok',true);
end $$;

-- Broadcast only a question-state invalidation. Never broadcast an answer or count.
create function public.expo1405_question_changed() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
 perform realtime.send('{}'::jsonb,'changed','expo1405-question:'||new.id,false);
 return null;
end $$;
create trigger expo1405_question_changed after insert or update on public.expo1405_public
for each row execute function public.expo1405_question_changed();

-- Class discovery and question access go through the room-scoped Edge API.
revoke all on public.expo1405_public from anon,authenticated;
drop policy expo1405_public_read on public.expo1405_public;
revoke all on function public.expo1405_classes(),public.expo1405_create_class(text,text,boolean,boolean,uuid),
 public.expo1405_rename_class(text,text),public.expo1405_question_changed() from public,anon,authenticated;
grant execute on function public.expo1405_classes(),public.expo1405_create_class(text,text,boolean,boolean,uuid),
 public.expo1405_rename_class(text,text),public.expo1405_question_changed() to service_role;

update public.expo1405_rooms set title='کلاس ۱' where id='main' and title='هم‌صدا | نمایشگاه بورس، بانک و بیمه ۱۴۰۵';
select public.expo1405_publish('main');
