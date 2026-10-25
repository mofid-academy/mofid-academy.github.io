-- Hide only the chosen registration; retain its ID so a delayed retry cannot restore it.
ALTER TABLE public.zr_challenges_registrations ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE OR REPLACE FUNCTION public.zr_challenges_store(p_action text, p_args jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  stored public.zr_challenges_registrations;
  hits integer;
  page_size integer;
  page_offset integer;
  total_rows bigint;
  items jsonb;
begin
  if p_action='health' then
    perform id from public.zr_challenges_registrations limit 1;
    return jsonb_build_object('ready',true);
  elsif p_action='rate_limit' then
    delete from public.zr_challenges_limits where resets_at<now()-interval '1 hour';
    insert into public.zr_challenges_limits(key,count,resets_at)
    values(p_args->>'key',1,now()+interval '10 minutes')
    on conflict(key) do update set
      count=case when public.zr_challenges_limits.resets_at<=now() then 1 else public.zr_challenges_limits.count+1 end,
      resets_at=case when public.zr_challenges_limits.resets_at<=now() then now()+interval '10 minutes' else public.zr_challenges_limits.resets_at end
    returning count into hits;
    return jsonb_build_object('allowed',hits<=least(greatest(coalesce((p_args->>'limit')::integer,10),1),600));
  elsif p_action='submit' then
    insert into public.zr_challenges_registrations(id,username,full_name,department,job_title,challenge_id,fingerprint)
    values((p_args->>'id')::uuid,p_args->>'username',p_args->>'full_name',p_args->>'department',coalesce(p_args->>'job_title',''),(p_args->>'challenge_id')::smallint,p_args->>'fingerprint')
    on conflict(id) do nothing;
    select * into strict stored from public.zr_challenges_registrations where id=(p_args->>'id')::uuid;
    if stored.deleted_at is not null then raise exception 'CHALLENGE_ENTRY_DELETED'; end if;
    if stored.fingerprint<>p_args->>'fingerprint' then raise exception 'CHALLENGE_REQUEST_CONFLICT'; end if;
    return jsonb_build_object('id',stored.id,'challenge_id',stored.challenge_id,'created_at',stored.created_at);
  elsif p_action='list' then
    page_size:=least(greatest(coalesce((p_args->>'limit')::integer,250),1),500);
    page_offset:=greatest(coalesce((p_args->>'offset')::integer,0),0);
    select count(*) into total_rows from public.zr_challenges_registrations where deleted_at is null;
    select coalesce(jsonb_agg(to_jsonb(r) order by r.created_at desc,r.id desc),'[]'::jsonb) into items from (
      select id,username,full_name,department,job_title,challenge_id,created_at
      from public.zr_challenges_registrations where deleted_at is null order by created_at desc,id desc limit page_size offset page_offset
    ) r;
    return jsonb_build_object('entries',items,'total',total_rows,'has_more',page_offset+page_size<total_rows);
  elsif p_action='delete' then
    update public.zr_challenges_registrations set deleted_at=coalesce(deleted_at,clock_timestamp())
    where id=(p_args->>'id')::uuid returning * into stored;
    if not found then raise exception 'CHALLENGE_ENTRY_NOT_FOUND'; end if;
    return jsonb_build_object('id',stored.id,'deleted_at',stored.deleted_at);
  end if;
  raise exception 'UNKNOWN_CHALLENGE_ACTION';
end;
$function$;

REVOKE ALL ON FUNCTION public.zr_challenges_store(text,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.zr_challenges_store(text,jsonb) TO service_role;

