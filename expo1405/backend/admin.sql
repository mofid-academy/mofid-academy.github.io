-- Private owner access is distinct from moderator control access.
alter table public.expo1405_rooms add column admin_key_hash text;
create index expo1405_votes_room_round_time_idx on public.expo1405_votes(room_id,round,created_at,id);

create function public.expo1405_admin_summary(p_room text,p_round integer default null) returns jsonb
language sql stable security invoker set search_path = '' as $$
 select jsonb_build_object(
  'title',r.title,'currentRound',r.round,'selectedRound',p_round,
  'totalResponses',(select count(*) from public.expo1405_votes v where v.room_id=p_room and (p_round is null or v.round=p_round)),
  'totalPeople',(select count(distinct v.participant_id) from public.expo1405_votes v where v.room_id=p_room and (p_round is null or v.round=p_round)),
  'rounds',(select jsonb_agg(n order by n desc) from generate_series(1,r.round) n),
  'questions',coalesce((select jsonb_agg(jsonb_build_object('id',q.id,'position',q.position,'text',q.text,'archived',q.archived,
    'responseCount',(select count(*) from public.expo1405_votes v where v.room_id=p_room and v.question_id=q.id and (p_round is null or v.round=p_round))) order by q.archived,q.position,q.created_at)
    from public.expo1405_questions q where q.room_id=p_room),'[]'::jsonb))
 from public.expo1405_rooms r where r.id=p_room;
$$;

create function public.expo1405_admin_responses(p_room text,p_round integer,p_question uuid,p_page integer default 1) returns jsonb
language sql stable security invoker set search_path = '' as $$
 select jsonb_build_object(
 'total',(select count(*) from public.expo1405_votes v where v.room_id=p_room and (p_round is null or v.round=p_round) and (p_question is null or v.question_id=p_question)),
 'page',greatest(1,p_page),'pageSize',50,
 'responses',coalesce((select jsonb_agg(to_jsonb(t) order by t.created_at desc,t.id desc) from (
   select v.id,v.round,v.question_id,v.participant_id,v.display_name,v.question_text,v.option_text,v.created_at
   from public.expo1405_votes v where v.room_id=p_room and (p_round is null or v.round=p_round) and (p_question is null or v.question_id=p_question)
   order by v.created_at desc,v.id desc limit 50 offset (greatest(1,p_page)-1)*50
 ) t),'[]'::jsonb));
$$;

create function public.expo1405_admin_report(p_room text,p_round integer default null) returns jsonb
language sql stable security invoker set search_path = '' as $$
 select jsonb_build_object('title',r.title,'selectedRound',p_round,'exportedAt',now(),
 'questions',coalesce((select jsonb_agg(jsonb_build_object('id',q.id,'position',q.position,'text',q.text,'archived',q.archived) order by q.archived,q.position,q.created_at)
    from public.expo1405_questions q where q.room_id=p_room),'[]'::jsonb),
 'responses',coalesce((select jsonb_agg(to_jsonb(v) order by v.created_at,v.id) from (
   select id,round,question_id,participant_id,display_name,question_text,option_text,created_at from public.expo1405_votes
   where room_id=p_room and (p_round is null or round=p_round) order by created_at,id limit 50001
 ) v),'[]'::jsonb)) from public.expo1405_rooms r where r.id=p_room;
$$;

revoke all on function public.expo1405_admin_summary(text,integer),public.expo1405_admin_responses(text,integer,uuid,integer),public.expo1405_admin_report(text,integer) from public,anon,authenticated;
grant execute on function public.expo1405_admin_summary(text,integer),public.expo1405_admin_responses(text,integer,uuid,integer),public.expo1405_admin_report(text,integer) to service_role;
