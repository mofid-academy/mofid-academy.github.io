-- Parent survey. All operations go through the authenticated Edge API.
create table public.ps_settings (
  id text primary key default 'ten-years-ahead-parents-v1',
  is_open boolean not null default true,
  schools text[] not null default '{}',
  cohorts text[] not null default '{}',
  updated_at timestamptz not null default now(),
  check (id = 'ten-years-ahead-parents-v1')
);
insert into public.ps_settings(id) values ('ten-years-ahead-parents-v1');
create table public.ps_responses (
  id uuid primary key,
  survey_id text not null references public.ps_settings(id),
  created_at timestamptz not null default now(),
  payload_hash text not null,
  first_name text not null default '' check(length(first_name)<=80),
  last_name text not null default '' check(length(last_name)<=80),
  school text not null default '' check(length(school)<=120),
  grade text not null default '' check(length(grade)<=40),
  cohort text not null default '' check(length(cohort)<=120),
  relationship text not null default '' check(relationship in ('','مادر','پدر','سرپرست')),
  duration_seconds integer not null check(duration_seconds between 0 and 86400),
  p01 smallint not null check(p01 between 1 and 5),
  p02 smallint not null check(p02 between 1 and 5),
  p03 smallint not null check(p03 between 1 and 5),
  p04 smallint not null check(p04 between 1 and 4),
  p05 smallint not null check(p05 between 1 and 3),
  p06 smallint not null check(p06 between 1 and 5),
  p07 smallint not null check(p07 between 1 and 5),
  p08 smallint not null check(p08 between 1 and 5),
  p09 smallint not null check(p09 between 0 and 10),
  p10 smallint not null check(p10 between 0 and 10),
  p11 text check(length(p11)<=2000),
  p12 text check(length(p12)<=2000),
  p13 smallint check(p13 between 1 and 5),
  p14 boolean not null,
  p15 text check(length(p15)<=2000),
  is_test boolean not null default false
);
create index ps_responses_created_idx on public.ps_responses(created_at desc, id desc);
create index ps_responses_school_idx on public.ps_responses(school,created_at desc) where not is_test;
create index ps_responses_cohort_idx on public.ps_responses(cohort,created_at desc) where not is_test;
create table public.ps_rate_limits (
  key text not null,
  window_start timestamptz not null,
  hits integer not null default 1,
  primary key(key,window_start)
);
alter table public.ps_settings enable row level security;
alter table public.ps_responses enable row level security;
alter table public.ps_rate_limits enable row level security;
revoke all on public.ps_settings,public.ps_responses,public.ps_rate_limits from public,anon,authenticated;
grant select,insert,update,delete on public.ps_settings,public.ps_responses,public.ps_rate_limits to service_role;

create function public.ps_rate_limit(p_key text,p_max integer,p_minutes integer)
returns boolean language plpgsql security invoker set search_path='' as $$
declare v_hits integer; v_window timestamptz;
begin
  v_window := to_timestamp(floor(extract(epoch from now())/(p_minutes*60))*(p_minutes*60));
  insert into public.ps_rate_limits(key,window_start) values(p_key,v_window)
  on conflict(key,window_start) do update set hits=public.ps_rate_limits.hits+1 returning hits into v_hits;
  delete from public.ps_rate_limits where window_start < now()-interval '2 days';
  return v_hits<=p_max;
end $$;

create function public.ps_record(p_id uuid,p_payload jsonb,p_hash text,p_test boolean default false)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare v_existing public.ps_responses; v_open boolean; v_answers jsonb; v_first text; v_last text;
begin
  v_first:=btrim(coalesce(p_payload->>'first_name',''));
  v_last:=btrim(coalesce(p_payload->>'last_name',''));
  if length(v_first)>80 or length(v_last)>80 then raise exception 'NAME_TOO_LONG'; end if;
  select * into v_existing from public.ps_responses where id=p_id for update;
  if found then
    if v_existing.payload_hash<>p_hash then raise exception 'ID_CONFLICT'; end if;
    if v_existing.first_name='' and v_existing.last_name='' then
      update public.ps_responses set first_name=v_first,last_name=v_last where id=p_id returning * into v_existing;
    elsif v_existing.first_name<>v_first or v_existing.last_name<>v_last then
      raise exception 'ID_CONFLICT';
    end if;
    return jsonb_build_object('stored',true,'id',v_existing.id,'created_at',v_existing.created_at,'is_test',v_existing.is_test);
  end if;
  select is_open into v_open from public.ps_settings where id='ten-years-ahead-parents-v1' for share;
  if not v_open and not p_test then raise exception 'SURVEY_CLOSED'; end if;
  v_answers:=p_payload->'answers';
  insert into public.ps_responses(id,survey_id,payload_hash,first_name,last_name,school,grade,cohort,relationship,duration_seconds,
    p01,p02,p03,p04,p05,p06,p07,p08,p09,p10,p11,p12,p13,p14,p15,is_test)
  values(p_id,'ten-years-ahead-parents-v1',p_hash,v_first,v_last,p_payload->>'school',p_payload->>'grade',p_payload->>'cohort',p_payload->>'relationship',
    (p_payload->>'duration_seconds')::integer,(v_answers->>'P01')::smallint,(v_answers->>'P02')::smallint,(v_answers->>'P03')::smallint,
    (v_answers->>'P04')::smallint,(v_answers->>'P05')::smallint,(v_answers->>'P06')::smallint,(v_answers->>'P07')::smallint,
    (v_answers->>'P08')::smallint,(v_answers->>'P09')::smallint,(v_answers->>'P10')::smallint,
    nullif(v_answers->>'P11',''),nullif(v_answers->>'P12',''),nullif(v_answers->>'P13','')::smallint,
    (v_answers->>'P14')='بله',nullif(v_answers->>'P15',''),p_test)
  on conflict(id) do nothing;
  select * into v_existing from public.ps_responses where id=p_id;
  if v_existing.payload_hash<>p_hash or v_existing.first_name<>v_first or v_existing.last_name<>v_last then raise exception 'ID_CONFLICT'; end if;
  return jsonb_build_object('stored',true,'id',v_existing.id,'created_at',v_existing.created_at,'is_test',v_existing.is_test);
end $$;

create function public.ps_report(p_filters jsonb default '{}',p_page integer default 0,p_limit integer default 25)
returns jsonb language sql stable security invoker set search_path='' as $$
with filtered as materialized (
  select r.* from public.ps_responses r where
  r.is_test=coalesce((p_filters->>'is_test')::boolean,false)
  and (coalesce(p_filters->>'school','')='' or r.school=p_filters->>'school')
  and (coalesce(p_filters->>'grade','')='' or r.grade=p_filters->>'grade')
  and (coalesce(p_filters->>'cohort','')='' or r.cohort=p_filters->>'cohort')
  and (coalesce(p_filters->>'relationship','')='' or r.relationship=p_filters->>'relationship')
  and (coalesce(p_filters->>'from','')='' or r.created_at>=((p_filters->>'from')::date::timestamp at time zone 'Asia/Tehran'))
  and (coalesce(p_filters->>'to','')='' or r.created_at<(((p_filters->>'to')::date+1)::timestamp at time zone 'Asia/Tehran'))
  and (coalesce(p_filters->>'snapshot','')='' or r.created_at<=(p_filters->>'snapshot')::timestamptz)
  and (coalesce(p_filters->>'consent','')='' or r.p14=(p_filters->>'consent')::boolean)
  and (coalesce(p_filters->>'nps','')='' or case when r.p10>=9 then 'promoter' when r.p10>=7 then 'passive' else 'detractor' end=p_filters->>'nps')
  and (coalesce(p_filters->>'comment','')<>'yes' or coalesce(r.p11,'')<>'' or coalesce(r.p12,'')<>'' or coalesce(r.p15,'')<>'')
  and (coalesce(p_filters->>'qcode','')='' or case when p_filters->>'qcode'='P14' then case when r.p14 then 'بله' else 'خیر' end else to_jsonb(r)->>lower(p_filters->>'qcode') end=p_filters->>'qvalue')
  and (coalesce(p_filters->>'search','')='' or position(lower(p_filters->>'search') in lower(concat_ws(' ',r.first_name,r.last_name,r.id::text,r.school,r.grade,r.cohort,r.p11,r.p12,r.p15)))>0)
), summary as (
  select jsonb_build_object(
    'count',count(*),'satisfaction',avg(p01),'satisfied',100.0*count(*) filter(where p01>=4)/nullif(count(*),0),
    'need',avg(p02),'age_fit',avg(p03),'family_talk',100.0*count(*) filter(where p04>=3)/nullif(count(*),0),
    'change',100.0*count(*) filter(where p05>=2)/nullif(count(*),0),'clear_change',100.0*count(*) filter(where p05=3)/nullif(count(*),0),
    'family_learning',avg(p06),'decision',avg(p07),'method',avg(p08),'support',avg(p09),
    'support_high',100.0*count(*) filter(where p09>=9)/nullif(count(*),0),
    'nps',100.0*(count(*) filter(where p10>=9)-count(*) filter(where p10<=6))/nullif(count(*),0),
    'promoters',count(*) filter(where p10>=9),'passives',count(*) filter(where p10 between 7 and 8),'detractors',count(*) filter(where p10<=6),
    'sponsor',avg(p13),'sponsor_count',count(p13),'consent_count',count(*) filter(where p14),
    'comments',count(*) filter(where coalesce(p11,'')<>'' or coalesce(p12,'')<>'' or coalesce(p15,'')<>'')) as value from filtered
), counts as (
 select v.code,v.val,count(*) n from filtered f cross join lateral(values
 ('P01',p01::text),('P02',p02::text),('P03',p03::text),('P04',p04::text),('P05',p05::text),('P06',p06::text),
 ('P07',p07::text),('P08',p08::text),('P09',p09::text),('P10',p10::text),('P13',p13::text),('P14',case when p14 then 'بله' else 'خیر' end)) v(code,val)
 where v.val is not null group by v.code,v.val
), dist as (
 select code,jsonb_object_agg(val,n) value from counts group by code
), page_rows as (
 select to_jsonb(f)-'payload_hash' value from filtered f order by created_at desc,id desc limit least(greatest(p_limit,1),1000) offset greatest(p_page,0)*least(greatest(p_limit,1),1000)
)
select jsonb_build_object('stats',(select value from summary),'total',(select count(*) from filtered),
 'distributions',coalesce((select jsonb_object_agg(code,value) from dist),'{}'),
 'rows',coalesce((select jsonb_agg(value) from page_rows),'[]'),
 'options',jsonb_build_object(
   'schools',coalesce((select jsonb_agg(school order by school) from (select distinct school from public.ps_responses where school<>'' and not is_test) a),'[]'),
   'grades',coalesce((select jsonb_agg(grade order by grade) from (select distinct grade from public.ps_responses where grade<>'' and not is_test) a),'[]'),
   'cohorts',coalesce((select jsonb_agg(cohort order by cohort) from (select distinct cohort from public.ps_responses where cohort<>'' and not is_test) a),'[]')),
 'snapshot',now());
$$;
revoke all on function public.ps_rate_limit(text,integer,integer),public.ps_record(uuid,jsonb,text,boolean),public.ps_report(jsonb,integer,integer) from public,anon,authenticated;
grant execute on function public.ps_rate_limit(text,integer,integer),public.ps_record(uuid,jsonb,text,boolean),public.ps_report(jsonb,integer,integer) to service_role;
