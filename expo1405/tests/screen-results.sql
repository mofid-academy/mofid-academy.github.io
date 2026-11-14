begin;
do $test$
declare
 room text:='qa-screen-'||gen_random_uuid()::text;
 q1 uuid; q2 uuid; result jsonb; public_data jsonb; before_revision bigint; after_revision bigint;
begin
 insert into public.expo1405_rooms(id,title,host_key_hash,admin_key_hash,name_policy)
 values(room,'Screen reveal fixture',repeat('0',64),repeat('1',64),'named');
 insert into public.expo1405_questions(room_id,position,text,options)
 values(room,1,'First fixture question','["Option A","Option B"]') returning id into q1;
 insert into public.expo1405_questions(room_id,position,text,options)
 values(room,2,'Second fixture question','["Option C","Option D"]') returning id into q2;

 result=public.expo1405_publish(room);
 if result->'question'<>'null'::jsonb or result#>>'{previewQuestion,id}'<>q1::text
    or result->>'resultsRevealed'<>'false' then raise exception 'Waiting preview is incorrect'; end if;
 select payload into public_data from public.expo1405_public where id=room;
 if public_data ? 'previewQuestion' or public_data->'question'<>'null'::jsonb then
   raise exception 'Unopened question leaked to participant state'; end if;

 result=public.expo1405_host_action(room,jsonb_build_object('action','activate','questionId',q1,'seconds',0));
 if result->>'resultsRevealed'<>'false' then raise exception 'New question starts revealed'; end if;
 select revision into before_revision from public.expo1405_public where id=room;
 perform public.expo1405_join_with_credits(room,'screen-fixture-one','کاربر آزمایشی یک',true);
 perform public.expo1405_vote(room,'screen-fixture-one',q1,1,0);
 select payload,revision into public_data,after_revision from public.expo1405_public where id=room;
 if before_revision<>after_revision then raise exception 'Votes exposed in public revision'; end if;
 if public_data ?| array['previewQuestion','credits','total','participants']
    or public_data#>'{question,options,0}' ? 'count' then raise exception 'Private results leaked'; end if;

 begin
   perform public.expo1405_host_action(room,jsonb_build_object('action','results','questionId',q2,'round',1,'visible',true));
   raise exception 'Stale question reveal was accepted';
 exception when others then if sqlerrm<>'question_not_found' then raise; end if; end;
 begin
   perform public.expo1405_host_action(room,jsonb_build_object('action','results','questionId',q1,'round',0,'visible',true));
   raise exception 'Stale round reveal was accepted';
 exception when others then if sqlerrm<>'question_not_found' then raise; end if; end;

 result=public.expo1405_host_action(room,jsonb_build_object('action','results','questionId',q1,'round',1,'visible',true));
 if result->>'resultsRevealed'<>'true' or result->>'phase'<>'open' or (result->>'total')::int<>1 then
   raise exception 'Reveal closed voting or lost a vote'; end if;
 perform public.expo1405_join_with_credits(room,'screen-fixture-two','کاربر آزمایشی دو',true);
 result=public.expo1405_vote(room,'screen-fixture-two',q1,1,1);
 select payload into result from public.expo1405_display where id=room;
 if result->>'resultsRevealed'<>'true' or (result->>'total')::int<>2 then raise exception 'Live votes stopped after reveal'; end if;

 result=public.expo1405_host_action(room,jsonb_build_object('action','results','questionId',q1,'round',1,'visible',false));
 if result->>'resultsRevealed'<>'false' or (result->>'total')::int<>2 then raise exception 'Concealing changed votes'; end if;
 perform public.expo1405_host_action(room,jsonb_build_object('action','results','questionId',q1,'round',1,'visible',true));
 result=public.expo1405_host_action(room,jsonb_build_object('action','activate','questionId',q2,'seconds',0));
 if result->>'resultsRevealed'<>'false' then raise exception 'Reveal carried into next question'; end if;
 perform public.expo1405_host_action(room,jsonb_build_object('action','close'));
 result=public.expo1405_host_action(room,jsonb_build_object('action','results','questionId',q2,'round',1,'visible',true));
 if result->>'resultsRevealed'<>'true' or result->>'phase'<>'closed' then raise exception 'Closed question cannot be revealed'; end if;
 result=public.expo1405_host_action(room,jsonb_build_object('action','waiting'));
 if result#>>'{previewQuestion,id}'<>q1::text or result->>'resultsRevealed'<>'false' then raise exception 'Reset did not restore concealed preview'; end if;
 result=public.expo1405_host_action(room,jsonb_build_object('action','new_round'));
 if result->>'resultsRevealed'<>'false' or (result->>'round')::int<>2 then raise exception 'New round retained reveal'; end if;
 if has_function_privilege('anon','public.expo1405_host_action(text,jsonb)','execute')
    or has_function_privilege('authenticated','public.expo1405_publish(text)','execute') then raise exception 'Organizer function became public'; end if;
end $test$;
rollback;
