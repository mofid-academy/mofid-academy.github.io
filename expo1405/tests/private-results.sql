begin;
do $$
declare room text:='qa-private-'||gen_random_uuid()::text; q uuid; before_rev bigint; after_rev bigint; data jsonb; p uuid;
begin
 insert into public.expo1405_rooms(id,title,host_key_hash,admin_key_hash) values(room,'Private QA',repeat('0',64),repeat('1',64));
 insert into public.expo1405_questions(room_id,position,text,options) values(room,1,'Private test question','["A","B"]') returning id into q;
 perform public.expo1405_host_action(room,jsonb_build_object('action','activate','questionId',q,'seconds',0));
 select revision into before_rev from public.expo1405_public where id=room;
 p=public.expo1405_join_with_credits(room,'test-private-hash','PRIVATE_FIXTURE',true);
 perform public.expo1405_vote(room,'test-private-hash',q,1,0);
 select payload,revision into data,after_rev from public.expo1405_public where id=room;
 if before_rev<>after_rev then raise exception 'public_vote_activity_leak'; end if;
 if data ?| ARRAY['total','credits','participants'] or data#>'{question,options,0}'?'count' then raise exception 'public_results_leak'; end if;
 if data::text like '%PRIVATE_FIXTURE%' then raise exception 'public_name_leak'; end if;
 select payload into data from public.expo1405_display where id=room;
 if (data->>'total')::integer<>1 or data#>>'{credits,0,name}'<>'PRIVATE_FIXTURE' then raise exception 'private_display_missing_results'; end if;
 data=public.expo1405_admin_report(room,1);
 if jsonb_array_length(data->'responses')<>1 or data#>>'{responses,0,display_name}'<>'PRIVATE_FIXTURE' then raise exception 'private_admin_report_incomplete'; end if;
 if has_table_privilege('anon','public.expo1405_votes','select') or has_table_privilege('authenticated','public.expo1405_votes','select') or has_table_privilege('anon','public.expo1405_display','select') or has_table_privilege('authenticated','public.expo1405_display','select') then raise exception 'private_table_grants_open'; end if;
 if has_function_privilege('anon','public.expo1405_admin_report(text,integer)','execute') or has_function_privilege('authenticated','public.expo1405_admin_report(text,integer)','execute') then raise exception 'private_rpc_open'; end if;
end $$;
rollback;
