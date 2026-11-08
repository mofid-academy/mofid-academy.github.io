-- Public participants receive only the active question, never aggregate results.
create table public.expo1405_display (
 id text primary key references public.expo1405_rooms(id),
 payload jsonb not null,
 revision bigint not null default 1
);
alter table public.expo1405_display enable row level security;
revoke all on public.expo1405_display from anon,authenticated;
grant all on public.expo1405_display to service_role;

create or replace function public.expo1405_publish(p_room text) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare r public.expo1405_rooms; q public.expo1405_questions; result jsonb; counts jsonb; total integer; public_result jsonb;
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
end $$;
