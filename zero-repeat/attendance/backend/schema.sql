-- Private attendance records, independent of questionnaires and challenges.
create table public.zr_attendance_responses (
  id uuid primary key,
  full_name text not null check (length(trim(full_name)) between 2 and 120),
  username text not null default '' check (length(username)<=64),
  attendance_mode text not null check (attendance_mode in ('in_person','online')),
  fingerprint text not null check (fingerprint ~ '^[a-f0-9]{64}$'),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
create table public.zr_attendance_limits (
  key text primary key,
  hits integer not null,
  resets_at timestamptz not null
);
alter table public.zr_attendance_responses enable row level security;
alter table public.zr_attendance_limits enable row level security;
revoke all on public.zr_attendance_responses,public.zr_attendance_limits from public,anon,authenticated;
grant select,insert,update,delete on public.zr_attendance_responses,public.zr_attendance_limits to service_role;
create index zr_attendance_active_created on public.zr_attendance_responses(created_at desc,id desc) where deleted_at is null;
create index zr_attendance_in_person_active on public.zr_attendance_responses(id) where deleted_at is null and attendance_mode='in_person';
create index zr_attendance_expired_limits on public.zr_attendance_limits(resets_at);

create function public.zr_attendance_store(p_action text,p_args jsonb default '{}'::jsonb)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare
  v_row public.zr_attendance_responses;
  v_hits integer;
  v_total bigint;
  v_offset integer;
  v_snapshot timestamptz;
  v_entries jsonb;
  v_registered integer;
begin
  if p_action='health' then
    perform 1 from public.zr_attendance_responses limit 1;
    return jsonb_build_object('ready',true);
  elsif p_action='availability' then
    select count(*) into v_registered from public.zr_attendance_responses where attendance_mode='in_person' and deleted_at is null;
    return jsonb_build_object('registered',v_registered);
  elsif p_action='rate' then
    if (p_args->>'key') !~ '^[a-f0-9]{64}$' or (p_args->>'limit')::integer not between 1 and 1000 then raise exception 'INVALID_INPUT'; end if;
    delete from public.zr_attendance_limits where resets_at<now()-interval '1 day';
    insert into public.zr_attendance_limits(key,hits,resets_at)
    values(p_args->>'key',1,now()+interval '15 minutes')
    on conflict(key) do update set
      hits=case when public.zr_attendance_limits.resets_at<=now() then 1 else public.zr_attendance_limits.hits+1 end,
      resets_at=case when public.zr_attendance_limits.resets_at<=now() then now()+interval '15 minutes' else public.zr_attendance_limits.resets_at end
    returning hits into v_hits;
    return jsonb_build_object('allowed',v_hits<=(p_args->>'limit')::integer);
  elsif p_action='submit' then
    -- Serialize attendance writes, including retries and soft deletions.
    -- The next SQL statement sees the last committed writer at READ COMMITTED.
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('zr_attendance'),pg_catalog.hashtext('capacity'));
    select * into v_row from public.zr_attendance_responses where id=(p_args->>'id')::uuid;
    if found then
      if v_row.fingerprint is distinct from p_args->>'fingerprint' or v_row.deleted_at is not null then raise exception 'ID_CONFLICT'; end if;
      return jsonb_build_object('stored',true,'id',v_row.id,'attendance_mode',v_row.attendance_mode,'created_at',v_row.created_at);
    end if;
    if p_args->>'attendance_mode'='in_person' then
      select count(*) into v_registered from public.zr_attendance_responses where attendance_mode='in_person' and deleted_at is null;
      if v_registered>=15 then raise exception 'IN_PERSON_FULL'; end if;
    end if;
    insert into public.zr_attendance_responses(id,full_name,username,attendance_mode,fingerprint)
    values((p_args->>'id')::uuid,p_args->>'full_name',p_args->>'username',p_args->>'attendance_mode',p_args->>'fingerprint')
    on conflict(id) do nothing;
    select * into strict v_row from public.zr_attendance_responses where id=(p_args->>'id')::uuid;
    if v_row.fingerprint is distinct from p_args->>'fingerprint' or v_row.deleted_at is not null then raise exception 'ID_CONFLICT'; end if;
    return jsonb_build_object('stored',true,'id',v_row.id,'attendance_mode',v_row.attendance_mode,'created_at',v_row.created_at);
  elsif p_action='list' then
    v_offset:=coalesce((p_args->>'offset')::integer,0);
    if v_offset not between 0 and 100000 then raise exception 'INVALID_PAGE'; end if;
    v_snapshot:=coalesce((p_args->>'snapshot')::timestamptz,now());
    select count(*) into v_total from public.zr_attendance_responses where deleted_at is null and created_at<=v_snapshot;
    select coalesce(jsonb_agg(to_jsonb(r) order by r.created_at desc,r.id desc),'[]'::jsonb) into v_entries
    from (select id,full_name,username,attendance_mode,created_at from public.zr_attendance_responses
      where deleted_at is null and created_at<=v_snapshot order by created_at desc,id desc limit 250 offset v_offset) r;
    return jsonb_build_object('entries',v_entries,'total',v_total,'snapshot',v_snapshot,'has_more',v_offset+jsonb_array_length(v_entries)<v_total);
  elsif p_action='delete' then
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('zr_attendance'),pg_catalog.hashtext('capacity'));
    update public.zr_attendance_responses set deleted_at=coalesce(deleted_at,now()) where id=(p_args->>'id')::uuid returning * into v_row;
    if not found then raise exception 'NOT_FOUND'; end if;
    return jsonb_build_object('id',v_row.id,'deleted_at',v_row.deleted_at);
  end if;
  raise exception 'UNKNOWN_ACTION';
end;
$$;
revoke all on function public.zr_attendance_store(text,jsonb) from public,anon,authenticated;
grant execute on function public.zr_attendance_store(text,jsonb) to service_role;
notify pgrst,'reload schema';
