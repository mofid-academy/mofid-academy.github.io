-- Transactional regression checks; all fixture writes are rolled back.
begin;
do $$
declare room text:='qa-credits-'||gen_random_uuid()::text; q1 uuid; q2 uuid; pid uuid; anon uuid; payload jsonb;
begin
 insert into public.expo1405_rooms(id,title,host_key_hash) values(room,'Credits transaction QA',repeat('0',64));
 insert into public.expo1405_questions(room_id,position,text,options) values(room,1,'QA active question','["First answer","Second answer"]') returning id into q1;
 insert into public.expo1405_questions(room_id,position,text,options) values(room,2,'QA UNRELEASED QUESTION MUST STAY PRIVATE','["Hidden A","Hidden B"]') returning id into q2;
 pid=public.expo1405_join_with_credits(room,'qa-private-token','QA-CONFIDENTIAL',false);
 anon=public.expo1405_join_with_credits(room,'qa-anonymous-token',null,true);
 perform public.expo1405_host_action(room,jsonb_build_object('action','activate','questionId',q1,'seconds',0));
 perform public.expo1405_vote(room,'qa-private-token',q1,1,0);
 perform public.expo1405_vote(room,'qa-anonymous-token',q1,1,1);
 payload=public.expo1405_publish(room);
 if jsonb_array_length(payload->'credits')<>2 then raise exception 'credits_count_failed'; end if;
 if payload::text like '%QA-CONFIDENTIAL%' then raise exception 'private_name_exposed'; end if;
 if payload::text like '%UNRELEASED%' then raise exception 'future_question_exposed'; end if;
 if exists(select 1 from jsonb_array_elements(payload->'credits') c where c->>'name'<>'شرکت‌کنندهٔ ناشناس') then raise exception 'anonymous_label_failed'; end if;
 if payload::text like '%token_hash%' or payload::text like '%participant_id%' or payload::text like '%host_key_hash%' then raise exception 'private_fields_exposed'; end if;
 perform public.expo1405_profile(room,'qa-private-token','QA-PUBLIC',true);
 payload=public.expo1405_publish(room);
 if not exists(select 1 from jsonb_array_elements(payload->'credits') c where c->>'name'='QA-PUBLIC' and c->>'answer'='First answer') then raise exception 'opt_in_name_answer_failed'; end if;
 perform public.expo1405_profile(room,'qa-private-token','QA-PRIVATE-AGAIN',false);
 payload=public.expo1405_publish(room);
 if payload::text like '%QA-PUBLIC%' or payload::text like '%QA-PRIVATE-AGAIN%' then raise exception 'opt_out_failed'; end if;
 begin
  perform public.expo1405_vote(room,'qa-anonymous-token',q2,1,0);
  raise exception 'future_vote_accepted';
 exception when others then
  if sqlerrm<>'voting_closed' then raise; end if;
 end;
 update public.expo1405_rooms set name_policy='anonymous' where id=room;
 perform public.expo1405_profile(room,'qa-private-token','QA-NO-NAME',true);
 if exists(select 1 from public.expo1405_participants where id=pid and (share_on_screen or display_name is not null)) then raise exception 'anonymous_policy_failed'; end if;
 perform public.expo1405_host_action(room,jsonb_build_object('action','activate','questionId',q2,'seconds',0));
 payload=public.expo1405_publish(room);
 if jsonb_array_length(payload->'credits')<>0 then raise exception 'previous_question_credits_not_cleared'; end if;
end $$;
rollback;
