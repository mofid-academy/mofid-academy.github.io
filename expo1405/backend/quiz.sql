-- Private, round-specific answer keys. No question content or keys are seeded here.
alter table public.expo1405_rooms add column is_quiz boolean not null default false;
create table public.expo1405_quiz_keys (
 room_id text not null references public.expo1405_rooms(id),
 round integer not null check(round>0),
 question_id uuid not null references public.expo1405_questions(id),
 position integer not null check(position>0),
 question_text text not null,
 options jsonb not null check(jsonb_typeof(options)='array'),
 correct_choice integer,
 points integer not null default 0,
 primary key(room_id,round,question_id),
 check((correct_choice is null and points=0) or (correct_choice is not null and correct_choice>=0 and correct_choice<jsonb_array_length(options) and points=1))
);
create index expo1405_quiz_keys_question_idx on public.expo1405_quiz_keys(question_id);
alter table public.expo1405_quiz_keys enable row level security;
revoke all on public.expo1405_quiz_keys from public,anon,authenticated;
grant select,insert,update,delete on public.expo1405_quiz_keys to service_role;

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
   if r.is_quiz then
     insert into public.expo1405_quiz_keys(room_id,round,question_id,position,question_text,options,correct_choice,points)
     select p_room,r.round+1,k.question_id,source_q.position,source_q.text,source_q.options,k.correct_choice,k.points
     from public.expo1405_quiz_keys k join public.expo1405_questions source_q on source_q.id=k.question_id and source_q.room_id=k.room_id
     where k.room_id=p_room and k.round=r.round and not source_q.archived;
   end if;
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
     insert into public.expo1405_questions(room_id,position,text,options) values(p_room,pos,txt,opts) returning id into qid;
   else
     qid=(p_action->>'questionId')::uuid;
     if r.phase='open' and r.active_question=qid then raise exception 'close_first'; end if;
     if exists(select 1 from public.expo1405_votes where room_id=p_room and round=r.round and question_id=qid) then raise exception 'question_has_votes'; end if;
     update public.expo1405_questions set text=txt,options=opts where room_id=p_room and id=qid and not archived;
     if not found then raise exception 'question_not_found'; end if;
   end if;
   if r.is_quiz then
     if not (p_action ? 'correctChoice') then raise exception 'quiz_answer_required'; end if;
     if p_action->'correctChoice'<>'null'::jsonb then
       if jsonb_typeof(p_action->'correctChoice')<>'number' or (p_action->>'correctChoice') !~ '^[0-7]$' then raise exception 'invalid_quiz_answer'; end if;
       if (p_action->>'correctChoice')::integer>=jsonb_array_length(opts) then raise exception 'invalid_quiz_answer'; end if;
     end if;
     insert into public.expo1405_quiz_keys(room_id,round,question_id,position,question_text,options,correct_choice,points)
     select p_room,r.round,qid,position,txt,opts,(p_action->>'correctChoice')::integer,case when p_action->>'correctChoice' is null then 0 else 1 end
     from public.expo1405_questions where id=qid and room_id=p_room
     on conflict(room_id,round,question_id) do update set position=excluded.position,question_text=excluded.question_text,options=excluded.options,correct_choice=excluded.correct_choice,points=excluded.points;
   end if;
 elsif a='delete' then
   qid=(p_action->>'questionId')::uuid;
   if r.active_question=qid then raise exception 'active_question'; end if;
   update public.expo1405_questions set archived=true where room_id=p_room and id=qid;
   if not exists(select 1 from public.expo1405_votes where room_id=p_room and round=r.round and question_id=qid) then
     delete from public.expo1405_quiz_keys where room_id=p_room and round=r.round and question_id=qid;
   end if;
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
 if p_close_previous and source.deleted_at is null then
   update public.expo1405_rooms set phase='finished',active_question=null,deadline=null,updated_at=now() where id=p_source;
   perform public.expo1405_publish(p_source);
 end if;
 perform public.expo1405_publish(new_id);
 return jsonb_build_object('id',new_id,'title',class_title);
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
   'quiz',r.is_quiz,'namePolicy',r.name_policy,'target',r.target,'participants',(select count(*) from public.expo1405_participants where room_id=p_room),
   'questionCount',(select count(*) from public.expo1405_questions where room_id=p_room and not archived),
   'question',case when q.id is null then null else jsonb_build_object('id',q.id,'text',q.text,'graded',exists(select 1 from public.expo1405_quiz_keys k where k.room_id=p_room and k.round=r.round and k.question_id=q.id and k.correct_choice is not null),'position',(select count(*) from public.expo1405_questions where room_id=p_room and not archived and position<=q.position),'options',counts) end,
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

-- Internal grading helper; never exposed to browser roles.
create function public.expo1405_quiz_grade(p_room text,p_round integer,p_participant uuid)
returns jsonb language sql stable set search_path='' as $$
 with answers as (
 select k.*,v.choice from public.expo1405_quiz_keys k
 left join public.expo1405_votes v on v.room_id=k.room_id and v.round=k.round and v.question_id=k.question_id and v.participant_id=p_participant
 where k.room_id=p_room and k.round=p_round
 ) select jsonb_build_object(
 'round',p_round,'score',coalesce(sum(case when choice=correct_choice then points else 0 end),0),
 'maxScore',coalesce(sum(points),0),
 'correctCount',count(*) filter(where correct_choice is not null and choice=correct_choice),
 'wrongCount',count(*) filter(where correct_choice is not null and choice is not null and choice<>correct_choice),
 'unansweredCount',count(*) filter(where correct_choice is not null and choice is null),
 'percentage',case when sum(points)>0 then round(100.0*sum(case when choice=correct_choice then points else 0 end)/sum(points),1) else 0 end,
 'questions',coalesce(jsonb_agg(jsonb_build_object('id',question_id,'text',question_text,'options',options,'choice',choice,'correctChoice',correct_choice,'points',points,'earned',case when choice=correct_choice then points else 0 end) order by position,question_id),'[]'::jsonb)
 ) from answers;
$$;
create function public.expo1405_quiz_score(p_room text,p_hash text)
returns jsonb language plpgsql set search_path='' as $$
declare r public.expo1405_rooms; person uuid;
begin
 select * into r from public.expo1405_rooms where id=p_room;
 select id into person from public.expo1405_participants where room_id=p_room and token_hash=p_hash;
 if person is null then raise exception 'invalid_participant'; end if;
 if r.deleted_at is not null then raise exception 'class_deleted'; end if;
 if not r.is_quiz or r.phase<>'finished' then return jsonb_build_object('available',false); end if;
 return public.expo1405_quiz_grade(p_room,r.round,person)||jsonb_build_object('available',true);
end $$;
create function public.expo1405_quiz_results(p_room text,p_round integer default null)
returns jsonb language sql stable set search_path='' as $$
 with runs as (select distinct round from public.expo1405_quiz_keys where room_id=p_room and (p_round is null or round=p_round)),
 people as (
 select p.id,p.display_name,r.round from public.expo1405_participants p cross join runs r
 where p.room_id=p_room and (r.round=(select round from public.expo1405_rooms where id=p_room)
 or exists(select 1 from public.expo1405_votes v where v.room_id=p_room and v.round=r.round and v.participant_id=p.id))
 ), grades as (
 select id,display_name,round,public.expo1405_quiz_grade(p_room,round,id)-'questions' as result from people
 ) select jsonb_build_object('quiz',(select is_quiz from public.expo1405_rooms where id=p_room),
 'results',coalesce(jsonb_agg(result||jsonb_build_object('participantId',id,'name',display_name) order by round desc,(result->>'score')::integer desc,id),'[]'::jsonb)) from grades;
$$;
revoke all on function public.expo1405_quiz_grade(text,integer,uuid),public.expo1405_quiz_score(text,text),public.expo1405_quiz_results(text,integer) from public,anon,authenticated;
grant execute on function public.expo1405_quiz_grade(text,integer,uuid),public.expo1405_quiz_score(text,text),public.expo1405_quiz_results(text,integer) to service_role;
