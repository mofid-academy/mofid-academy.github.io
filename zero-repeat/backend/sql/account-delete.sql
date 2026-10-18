create table if not exists public.zr_deleted_accounts(id uuid primary key,deleted_at timestamptz not null default now());
alter table public.zr_deleted_accounts enable row level security;
revoke all on public.zr_deleted_accounts from public,anon,authenticated;
grant select,insert on public.zr_deleted_accounts to service_role;
-- Admin-only deletion; existing table grants remain private.
create or replace function public.zr_store(p_action text,p_data jsonb default '{}') returns jsonb
language plpgsql security invoker set search_path = public as $$
declare
 a public.zr_accounts; r public.zr_responses; prior public.zr_requests; job public.zr_sync_jobs;
 item jsonb; result jsonb; accounts jsonb; snapshots jsonb;
 req uuid; next_slot integer; n integer; target uuid; now_at timestamptz := now();
begin
 if p_action='health' then return jsonb_build_object('ready',true); end if;
 if p_action='rate_limit' then
   delete from public.zr_rate_limits where resets_at < now_at - interval '1 day';
   insert into public.zr_rate_limits values(p_data->>'key',1,now_at+interval '15 minutes')
   on conflict(key) do update set count=case when zr_rate_limits.resets_at<=now_at then 1 else zr_rate_limits.count+1 end,
    resets_at=case when zr_rate_limits.resets_at<=now_at then now_at+interval '15 minutes' else zr_rate_limits.resets_at end
   returning count into n;
   return jsonb_build_object('allowed',n<=30);
 end if;
 if p_action='account_get' then
   select * into a from public.zr_accounts where id=(p_data->>'id')::uuid;
   return to_jsonb(a);
 end if;
 if p_action='accounts_list' then
   select coalesce(jsonb_agg(to_jsonb(x) order by x.slot),'[]') into accounts from public.zr_accounts x;
   return accounts;
 end if;
 if p_action='response_get' then return public.zr_record((p_data->>'id')::uuid); end if;
 if p_action='responses_list' then
   select coalesce(jsonb_agg(public.zr_record(x.id) order by x.updated_at desc),'[]') into result from public.zr_responses x;
   return jsonb_build_object('responses',result,'registered_users',(select count(*) from public.zr_accounts));
 end if;
 -- Serializes bounded writes, including first-save races and invite capacity checks.
 perform pg_advisory_xact_lock(170031003);
 if p_action in ('invite_create','invite_reset','save','reopen','account_delete') then
   req := (p_data->>'request_id')::uuid;
   if req is null then raise exception 'REQUEST_ID_REQUIRED'; end if;
   select * into prior from public.zr_requests where id=req;
   if found then
     if prior.scope<>p_data->>'scope' or prior.fingerprint<>p_data->>'fingerprint' then raise exception 'REQUEST_ID_REUSED'; end if;
     return prior.result;
   end if;
 end if;
 if p_action='invite_create' then
   accounts := '[]';
   for item in select value from jsonb_array_elements(p_data->'people') loop
     if exists(select 1 from public.zr_deleted_accounts where id=(item->>'id')::uuid) then raise exception 'ACCESS_DENIED'; end if;
     select * into a from public.zr_accounts where username=item->>'username';
     if found then
       if not a.is_active or a.expires_at<=now_at then raise exception 'INACTIVE_INVITE'; end if;
     else
       select s into next_slot from generate_series(1,300) s where not exists(select 1 from public.zr_accounts x where x.slot=s) order by s limit 1;
       if next_slot is null then raise exception 'CAPACITY'; end if;
       insert into public.zr_accounts(id,slot,username,full_name,department,jti,expires_at)
       values((item->>'id')::uuid,next_slot,item->>'username',item->>'full_name',item->>'department',(item->>'jti')::uuid,(item->>'expires_at')::timestamptz)
       returning * into a;
     end if;
     accounts := accounts || jsonb_build_array(to_jsonb(a));
   end loop;
   result := accounts;
 elsif p_action='account_delete' then
   target := (p_data->>'id')::uuid;
   select * into a from public.zr_accounts where id=target for update;
   if found then
     if exists(select 1 from public.zr_sync_jobs j where j.state='processing' and j.created_at>now_at-interval '90 seconds' and exists(select 1 from jsonb_array_elements(j.snapshots) v where v->'survey'->>'id'=target::text)) then raise exception 'SYNC_BUSY'; end if;
     delete from public.zr_requests q where q.scope='save:'||target::text or q.scope='public:start:'||a.username or q.result->>'id'=target::text or q.result @> jsonb_build_array(jsonb_build_object('id',target));
     update public.zr_sync_jobs j set snapshots=(select coalesce(jsonb_agg(v),'[]'::jsonb) from jsonb_array_elements(j.snapshots) v where v->'survey'->>'id'<>target::text)
       where exists(select 1 from jsonb_array_elements(j.snapshots) v where v->'survey'->>'id'=target::text);
     delete from public.zr_responses where id=target;
     insert into public.zr_deleted_accounts(id) values(target) on conflict do nothing;
     delete from public.zr_accounts where id=target;
   end if;
   result := jsonb_build_object('deleted',true);
 elsif p_action='invite_reset' then
   update public.zr_accounts set jti=(p_data->>'jti')::uuid,expires_at=(p_data->>'expires_at')::timestamptz,is_active=true
   where id=(p_data->>'id')::uuid returning * into a;
   if not found then raise exception 'NOT_FOUND'; end if;
   result := to_jsonb(a);
 elsif p_action in ('save','reopen') then
   target := (p_data->>'id')::uuid;
   select * into a from public.zr_accounts where id=target for update;
   if not found then raise exception 'NOT_FOUND'; end if;
   if p_action='save' and (not a.is_active or a.expires_at<=now_at or a.jti<>(p_data->>'jti')::uuid) then raise exception 'ACCESS_DENIED'; end if;
   select * into r from public.zr_responses where id=target for update;
   if p_action='reopen' then
     if not found then raise exception 'NOT_FOUND'; end if;
     if r.status='submitted' then update public.zr_responses set status='draft',submitted_at=null,revision=revision+1,updated_at=now_at where id=target; end if;
   else
     if r.status='submitted' then raise exception 'ALREADY_SUBMITTED'; end if;
     if coalesce(r.revision,0)<>(p_data->>'revision')::integer then raise exception 'REVISION_CONFLICT'; end if;
     insert into public.zr_responses(id,revision,status,survey,updated_at,submitted_at)
     values(target,1,case when p_data->>'mode'='submit' then 'submitted' else 'draft' end,p_data->'survey',now_at,case when p_data->>'mode'='submit' then now_at end)
     on conflict(id) do update set revision=zr_responses.revision+1,status=excluded.status,survey=excluded.survey,updated_at=now_at,submitted_at=excluded.submitted_at;
   end if;
   result := public.zr_record(target);
 elsif p_action='sync_claim' then
   req := (p_data->>'job_id')::uuid;
   select * into job from public.zr_sync_jobs where id=req;
   if found then
     if jsonb_array_length(job.snapshots)<>jsonb_array_length(p_data->'ids') or exists(select 1 from jsonb_array_elements(job.snapshots) s where not (p_data->'ids' ? (s.value->'survey'->>'id'))) then raise exception 'REQUEST_ID_REUSED'; end if;
     if job.state='done' then return jsonb_build_object('done',true,'count',jsonb_array_length(job.snapshots)); end if;
     raise exception 'SYNC_BUSY';
   end if;
   if jsonb_array_length(p_data->'ids')<1 or jsonb_array_length(p_data->'ids')>300 then raise exception 'INVALID_IDS'; end if;
   if exists(select 1 from public.zr_responses x join public.zr_sync_jobs j on j.id=x.sync_lock where x.id in(select value::uuid from jsonb_array_elements_text(p_data->'ids')) and j.state='processing' and j.created_at>now_at-interval '90 seconds') then raise exception 'SYNC_BUSY'; end if;
   select coalesce(jsonb_agg(jsonb_build_object('slot',x.slot,'survey',public.zr_record(x.id)) order by x.slot),'[]') into snapshots
   from public.zr_accounts x join public.zr_responses y using(id) where x.id in(select value::uuid from jsonb_array_elements_text(p_data->'ids'));
   if jsonb_array_length(snapshots)<>jsonb_array_length(p_data->'ids') then raise exception 'NOT_FOUND'; end if;
   insert into public.zr_sync_jobs(id,state,snapshots) values(req,'processing',snapshots);
   update public.zr_responses set sync_lock=req,last_sync_error=null where id in(select (s.value->'survey'->>'id')::uuid from jsonb_array_elements(snapshots) s);
   return jsonb_build_object('done',false,'rows',snapshots);
 elsif p_action='sync_finish' then
   select * into job from public.zr_sync_jobs where id=(p_data->>'job_id')::uuid for update;
   if not found then raise exception 'NOT_FOUND'; end if;
   if job.state='processing' then
     for item in select value from jsonb_array_elements(job.snapshots) loop
       update public.zr_responses set
         synced_revision=case when (p_data->>'success')::boolean then (item->'survey'->>'revision')::integer else synced_revision end,
         synced_at=case when (p_data->>'success')::boolean then now_at else synced_at end,
         last_sync_error=case when (p_data->>'success')::boolean then null else 'SHEETS_UNAVAILABLE' end,sync_lock=null
       where id=(item->'survey'->>'id')::uuid and sync_lock=job.id;
     end loop;
     update public.zr_sync_jobs set state=case when (p_data->>'success')::boolean then 'done' else 'failed' end,finished_at=now_at where id=job.id;
   end if;
   return jsonb_build_object('count',jsonb_array_length(job.snapshots));
 else raise exception 'UNKNOWN_ACTION';
 end if;
 insert into public.zr_requests(id,scope,fingerprint,result) values(req,p_data->>'scope',p_data->>'fingerprint',result);
 return result;
end;
$$;
revoke all on function public.zr_store(text,jsonb) from public,anon,authenticated;
grant execute on function public.zr_store(text,jsonb) to service_role;

