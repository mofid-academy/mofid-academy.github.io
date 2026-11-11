-- Synthetic data only; transaction rolls back every fixture.
begin;
set local role service_role;
do $$
declare room text; copied text; q uuid; person uuid; other uuid; result jsonb; n integer; rejected boolean;
begin
 room=public.expo1405_create_class('main','Quiz synthetic test',false,false,gen_random_uuid())->>'id';
 update public.expo1405_rooms set is_quiz=true where id=room;
 for n in 1..7 loop
   perform public.expo1405_host_action(room,jsonb_build_object('action','save','text','Synthetic question '||n,'options',jsonb_build_array('A','B','C','D'),'correctChoice',case when n=7 then null else 1 end));
 end loop;
 person=public.expo1405_join_with_credits(room,'QUIZ_TEST_HASH','TEST ONLY',false);
 other=public.expo1405_join_with_credits(room,'QUIZ_OTHER_HASH','OTHER TEST ONLY',false);
 if public.expo1405_quiz_score(room,'QUIZ_TEST_HASH')<>jsonb_build_object('available',false) then raise exception 'Key leaked before finish';end if;
 for q in select id from public.expo1405_questions where room_id=room order by position loop
   perform public.expo1405_host_action(room,jsonb_build_object('action','activate','questionId',q));
   perform public.expo1405_vote(room,'QUIZ_TEST_HASH',q,1,1);
   perform public.expo1405_vote(room,'QUIZ_OTHER_HASH',q,1,0);
   if (select payload::text from public.expo1405_public where id=room) like '%correctChoice%' then raise exception 'Public key leak';end if;
 end loop;
 perform public.expo1405_host_action(room,jsonb_build_object('action','finish'));
 result=public.expo1405_quiz_score(room,'QUIZ_TEST_HASH');
 if result->>'score'<>'6' or result->>'maxScore'<>'6' or result->>'correctCount'<>'6' or jsonb_array_length(result->'questions')<>7 then raise exception 'Full score incorrect: %',result;end if;
 result=public.expo1405_quiz_score(room,'QUIZ_OTHER_HASH');
 if result->>'score'<>'0' or result->>'wrongCount'<>'6' then raise exception 'Wrong score incorrect';end if;
 rejected=false;begin perform public.expo1405_quiz_score('main','QUIZ_TEST_HASH');exception when others then if sqlerrm like '%invalid_participant%' then rejected=true;else raise;end if;end;
 if not rejected then raise exception 'Cross panel token accepted';end if;
 copied=public.expo1405_create_class(room,'Copied synthetic quiz',true,false,gen_random_uuid())->>'id';
 if (select count(*) from public.expo1405_quiz_keys where room_id=copied)<>7 or not(select is_quiz from public.expo1405_rooms where id=copied) then raise exception 'Keys not copied';end if;
 perform public.expo1405_host_action(room,jsonb_build_object('action','new_round'));
 result=public.expo1405_quiz_grade(room,2,person);
 if result->>'score'<>'0' or result->>'unansweredCount'<>'6' or result->>'maxScore'<>'6' then raise exception 'New round contaminated';end if;
 if public.expo1405_quiz_grade(room,1,person)->>'score'<>'6' then raise exception 'Old score lost';end if;
 if has_function_privilege('anon','public.expo1405_quiz_score(text,text)','execute') or has_function_privilege('authenticated','public.expo1405_quiz_grade(text,integer,uuid)','execute') or has_table_privilege('anon','public.expo1405_quiz_keys','select') then raise exception 'Public key permissions';end if;
end $$;
rollback;
