-- The former attendance data stays in zr_attendance_responses.
create table public.zr_mentor_requests (
  id uuid primary key,
  full_name text not null check (char_length(btrim(full_name)) between 2 and 120),
  username text not null check (username ~ '^[a-z][a-z0-9._-]{0,63}$'),
  wants_mentor boolean not null,
  mentor_name text not null default '' check (char_length(mentor_name) <= 120 and btrim(mentor_name) = mentor_name),
  assignment_revision integer not null default 0 check (assignment_revision >= 0),
  assigned_at timestamptz,
  fingerprint text not null check (fingerprint ~ '^[a-f0-9]{64}$'),
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (wants_mentor or mentor_name = ''),
  check ((mentor_name = '') = (assigned_at is null))
);

alter table public.zr_mentor_requests enable row level security;
revoke all on public.zr_mentor_requests from public, anon, authenticated;
grant select, insert, update on public.zr_mentor_requests to service_role;
create index zr_mentor_requests_active_created
  on public.zr_mentor_requests (created_at desc, id desc) where deleted_at is null;

create function public.zr_mentor_store(p_action text, p_args jsonb default '{}'::jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  v_row public.zr_mentor_requests;
  v_offset integer;
  v_snapshot timestamptz;
  v_total bigint;
  v_entries jsonb;
  v_mentor_name text;
begin
  if p_action = 'health' then
    perform 1 from public.zr_mentor_requests limit 1;
    return jsonb_build_object('ready', true);
  elsif p_action = 'submit' then
    -- An exact retry receives the original receipt. A conflicting ID never overwrites a response.
    insert into public.zr_mentor_requests (id, full_name, username, wants_mentor, fingerprint)
    values ((p_args->>'id')::uuid, p_args->>'full_name', p_args->>'username',
      (p_args->>'wants_mentor')::boolean, p_args->>'fingerprint')
    on conflict (id) do nothing;

    select * into strict v_row from public.zr_mentor_requests where id = (p_args->>'id')::uuid;
    if v_row.fingerprint is distinct from p_args->>'fingerprint' or v_row.deleted_at is not null then
      raise exception 'ID_CONFLICT';
    end if;
    return jsonb_build_object('stored', true, 'id', v_row.id,
      'wants_mentor', v_row.wants_mentor, 'created_at', v_row.created_at);
  elsif p_action = 'list' then
    v_offset := coalesce((p_args->>'offset')::integer, 0);
    if v_offset not between 0 and 100000 then raise exception 'INVALID_PAGE'; end if;
    v_snapshot := coalesce((p_args->>'snapshot')::timestamptz, now());
    with page as (
      select id, full_name, username, wants_mentor, mentor_name, assignment_revision, assigned_at, created_at
      from public.zr_mentor_requests
      where deleted_at is null and created_at <= v_snapshot
      order by created_at desc, id desc limit 250 offset v_offset
    )
    select
      (select count(*) from public.zr_mentor_requests where deleted_at is null and created_at <= v_snapshot),
      coalesce(jsonb_agg(to_jsonb(page) order by created_at desc, id desc), '[]'::jsonb)
      into v_total, v_entries
    from page;
    return jsonb_build_object('entries', v_entries, 'total', v_total, 'snapshot', v_snapshot,
      'has_more', v_offset + jsonb_array_length(v_entries) < v_total);
  elsif p_action = 'assign' then
    v_mentor_name := p_args->>'mentor_name';
    select * into v_row from public.zr_mentor_requests
      where id = (p_args->>'id')::uuid and deleted_at is null for update;
    if not found then raise exception 'NOT_FOUND'; end if;
    if not v_row.wants_mentor then raise exception 'MENTOR_NOT_REQUESTED'; end if;

    if v_mentor_name is distinct from v_row.mentor_name then
      if v_row.assignment_revision is distinct from (p_args->>'assignment_revision')::integer then
        raise exception 'ASSIGNMENT_CHANGED';
      end if;
      update public.zr_mentor_requests set
        mentor_name = v_mentor_name,
        assigned_at = case when v_mentor_name = '' then null else now() end,
        assignment_revision = assignment_revision + 1
      where id = v_row.id returning * into v_row;
    end if;
    return jsonb_build_object('id', v_row.id, 'mentor_name', v_row.mentor_name,
      'assigned_at', v_row.assigned_at, 'assignment_revision', v_row.assignment_revision);
  elsif p_action = 'delete' then
    update public.zr_mentor_requests set deleted_at = coalesce(deleted_at, now())
      where id = (p_args->>'id')::uuid returning * into v_row;
    if not found then raise exception 'NOT_FOUND'; end if;
    return jsonb_build_object('id', v_row.id, 'deleted_at', v_row.deleted_at);
  end if;
  raise exception 'UNKNOWN_ACTION';
end;
$$;

revoke all on function public.zr_mentor_store(text, jsonb) from public, anon, authenticated;
grant execute on function public.zr_mentor_store(text, jsonb) to service_role;
notify pgrst, 'reload schema';
