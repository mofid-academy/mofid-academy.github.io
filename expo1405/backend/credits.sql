-- Append-only upgrade: movie-style live credits with explicit participant opt-in.
-- Previously stored names remain private by default.
alter table public.expo1405_participants add column share_on_screen boolean not null default false;

create or replace function public.expo1405_publish(p_room text) returns jsonb
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
   'credits',coalesce((select jsonb_agg(jsonb_build_object('id',feed.id,'name',feed.name,'answer',feed.answer) order by feed.created_at,feed.id) from (
     select v.id,v.created_at,v.option_text as answer,
       case when r.name_policy<>'anonymous' and p.share_on_screen then coalesce(nullif(btrim(p.display_name),''),'شرکت‌کنندهٔ ناشناس') else 'شرکت‌کنندهٔ ناشناس' end as name
     from public.expo1405_votes v join public.expo1405_participants p on p.id=v.participant_id and p.room_id=v.room_id
     where v.room_id=p_room and v.round=r.round and v.question_id=r.active_question
     order by v.created_at desc,v.id desc limit 300
   ) feed),'[]'::jsonb),
   'total',coalesce(total,0),'updatedAt',clock_timestamp());
 insert into public.expo1405_public(id,payload) values(p_room,result)
 on conflict(id) do update set payload=excluded.payload,revision=public.expo1405_public.revision+1;
 return result;
end $$;


create function public.expo1405_join_with_credits(p_room text,p_hash text,p_name text,p_shared boolean) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare pid uuid;
begin
 pid=public.expo1405_join(p_room,p_hash,p_name);
 update public.expo1405_participants set share_on_screen=(coalesce(p_shared,false) and display_name is not null) where id=pid;
 return pid;
end $$;

create function public.expo1405_profile(p_room text,p_hash text,p_name text,p_shared boolean) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare r public.expo1405_rooms; p public.expo1405_participants; n text:=nullif(btrim(p_name),''); shared boolean:=coalesce(p_shared,false);
begin
 select * into strict r from public.expo1405_rooms where id=p_room for update;
 select * into p from public.expo1405_participants where room_id=p_room and token_hash=p_hash for update;
 if p.id is null then raise exception 'invalid_participant'; end if;
 if char_length(n)>80 then raise exception 'invalid_name'; end if;
 if r.name_policy='anonymous' then n=null;shared=false; end if;
 if (shared or r.name_policy='named') and n is null then raise exception 'name_required'; end if;
 update public.expo1405_participants set display_name=n,share_on_screen=shared where id=p.id;
 perform public.expo1405_publish(p_room);
 return jsonb_build_object('name',n,'shareOnScreen',shared);
end $$;
revoke all on function public.expo1405_join_with_credits(text,text,text,boolean),public.expo1405_profile(text,text,text,boolean) from public,anon,authenticated;
grant execute on function public.expo1405_join_with_credits(text,text,text,boolean),public.expo1405_profile(text,text,text,boolean) to service_role;
