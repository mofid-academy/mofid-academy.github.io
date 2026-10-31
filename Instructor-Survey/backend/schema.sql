-- Only instructor_survey objects are changed. Existing survey data is retained.
create table if not exists public.instructor_survey_settings(id text primary key,is_open boolean not null default true,updated_at timestamptz not null default now());
insert into public.instructor_survey_settings(id) values('main') on conflict do nothing;
create table if not exists public.instructor_survey_responses(
  id uuid primary key,created_at timestamptz not null default now(),academy text not null check(academy in('call-center','19','20')),
  team_name text not null check(length(team_name) between 1 and 100),organizational_name text not null check(length(organizational_name) between 1 and 120),
  instructor_name text not null check(length(instructor_name) between 1 and 140),course_title text not null default '' check(length(course_title)<=200),
  teaching_score smallint not null check(teaching_score between 1 and 5),interaction_score smallint not null check(interaction_score between 1 and 5),
  management_score smallint not null check(management_score between 1 and 5),usefulness_score smallint not null check(usefulness_score between 1 and 5),overall_score smallint not null check(overall_score between 1 and 5),
  average_score numeric generated always as ((teaching_score+interaction_score+management_score+usefulness_score+overall_score)::numeric/5.0) stored,
  feedback text not null default '' check(length(feedback)<=2000),duration_seconds integer not null default 0 check(duration_seconds between 0 and 86400),source_url text not null default '' check(length(source_url)<=500),
  sync_status text not null default 'pending' check(sync_status in('pending','sent','failed')),sync_error text not null default '' check(length(sync_error)<=500),synced_at timestamptz
);
create table if not exists public.instructor_survey_rate_limits(key text primary key,hits integer not null default 1,resets_at timestamptz not null);
alter table public.instructor_survey_responses
  add column if not exists request_hash text,
  add column if not exists is_test boolean not null default false,
  add column if not exists deleted_at timestamptz;
alter table public.instructor_survey_settings add column if not exists catalog jsonb not null default '[]'::jsonb;
update public.instructor_survey_settings set catalog='[
 {"id":"call-center","label":"مرکز تماس","team_name":"دوره‌های آموزشی مرکز تماس","is_open":true,"instructors":["رضوان زکریا","محمدرضا داودآبادی","مریم سلطانی","سمیعی","نفیسه هاشمی","زهرا کوکبی"],"classes":["پیگیری ثبت نام و اکانت حقیقی","پیگیری اعتبار و تقاضای وجه","پیگیری دارایی","طرح حامی","اپ مفید","پیگیری معاملات آپشن"]},
 {"id": "19", "label": "آکادمی ۱۹", "team_name": "آکادمی دوره نوزدهم", "is_open": true, "class_required": false, "instructors": ["امیرحسین عباسی", "محمد میثاق فتوگرافی", "فاطمه شمسی", "آرمین شفیع‌نژاد", "مرجان مهردل", "کامبیز گروسیان", "ملیکا سینایی", "نازنین قاسمی", "نگین قاسمی", "رویا قلاوند", "مصطفی زارع", "مرجان محمدهاشم", "فائزه منور", "سجاد زعفرانی", "علیرضا صفایی", "حدیث برزگر", "محمد نظیری", "فرخنده رحیمی", "ریحانه نوروزی زاده", "علی حصارخانی", "سارا کریمی", "مینا حبیب اله", "مهدی حائری", "محمدرضا شهاب", "عطیه خوش طینت", "صبا حائری", "دانیال حسن بیگی", "پیام رحیمی", "حسین باقری", "الهه نصیری", "پارسا هاشمی", "مریم سخنگو", "بهزاد فرهمندپور", "محدثه بهشتی نژاد", "سجاد علیرضایی", "حامد ستاری", "حسن مرادآبادی"], "classes": ["ساختار بازار سرمایه و معاملات آتی", "مراحل ثبت نام، انجام ثبت نام در کارگزاری مفید", "سامانه ذینفعان", "قوانین معاملاتی و رضایت مشتریان", "آشنایی با عرضه اولیه و پذیره نویسی", "tsetmc و کدال", "تفاوت و توقف نمادها", "معرفی سایت های بورسی", "تخلف های معاملاتی", "معرفی سامانه های معاملاتی", "اوراق تبعی", "انواع مجامع", "افزایش سرمایه", "آموزش n8n", "صندوق حامی", "پرتفوی عملکرد", "ثبت‌نام بورس کالا", "انواع روش های سرمایه گذاری و صندوق ها 1", "پنل فینس و ثبت تیکت", "اوراق درامد ثابت و بدهی و اکسل", "فلوچارت دارایی و ادمین ها", "فلوچارت سفارشات و ادمین ها", "مفید کارت و جت کارت", "اختیار معاملات", "مهارت نرم ورودی و سمپل تماس", "انواع روش های سرمایه گذاری و صندوق ها 3", "فلوچارت ثبت نام - ادمین رج و اکانت", "DISC و HOLLAND", "آشنایی با kpi های مرکز تماس", "آموزش بورس ویو", "پلکان و اعتبار و فلوچارت و ادمین ها", "فرایند های پایش", "معرفی مسیرهای شغلی", "تحلیل بنیادی", "آموزش چت", "آموزش چارگون", "سامانه ی گذر", "آموزش حامی"]},
 {"id": "20", "label": "آکادمی ۲۰", "team_name": "آکادمی دوره بیستم", "is_open": true, "class_required": true, "instructors": ["حدیث برزگر", "سارا کریمی", "نگین قاسمی", "علیرضا صفایی", "کامبیز گروسیان", "فائزه منور", "فرخنده رحیمی", "ریحانه نوروزی زاده", "محمدرضا شهاب", "محمد نظیری", "علی حصارخانی", "مینا حبیب اله"], "classes": ["پرتفوی عملکرد", "فلوچارت دارایی و ادمین ها", "تخلف های معاملاتی", "انواع مجامع و حامی", "اوراق تبعی", "افزایش سرمایه", "انواع روش های سرمایه گذاری و صندوق ها 1", "پنل فینس و ثبت تیکت", "اختیار معاملات", "ثبت‌نام بورس کالا", "اکسل 1", "فلوچارت سفارشات و ادمین ها"]}
]'::jsonb where id='main' and catalog='[]'::jsonb;
alter table public.instructor_survey_responses enable row level security;
alter table public.instructor_survey_settings enable row level security;
alter table public.instructor_survey_rate_limits enable row level security;
revoke all on public.instructor_survey_responses,public.instructor_survey_settings,public.instructor_survey_rate_limits from anon,authenticated;
grant all on public.instructor_survey_responses,public.instructor_survey_settings,public.instructor_survey_rate_limits to service_role;
create index if not exists idx_instructor_survey_course on public.instructor_survey_responses(academy,course_title,created_at desc) where deleted_at is null and not is_test;
create index if not exists idx_instructor_survey_created on public.instructor_survey_responses(created_at desc);
create index if not exists idx_instructor_survey_academy on public.instructor_survey_responses(academy,created_at desc);

create or replace function public.instructor_survey_check_rate(p_key text,p_max integer,p_window_minutes integer)
returns boolean language plpgsql security invoker set search_path='' as $$
declare v_hits integer;
begin
 if p_key is null or length(p_key)>128 or p_max not between 1 and 1000 or p_window_minutes not between 1 and 1440 then return false; end if;
 insert into public.instructor_survey_rate_limits(key,hits,resets_at) values(p_key,1,now()+make_interval(mins=>p_window_minutes))
 on conflict(key) do update set hits=case when public.instructor_survey_rate_limits.resets_at<=now() then 1 else public.instructor_survey_rate_limits.hits+1 end,
 resets_at=case when public.instructor_survey_rate_limits.resets_at<=now() then now()+make_interval(mins=>p_window_minutes) else public.instructor_survey_rate_limits.resets_at end returning hits into v_hits;
 return v_hits<=p_max;
end;
$$;

create or replace function public.instructor_survey_record(p_payload jsonb,p_hash text,p_test boolean default false)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare v_row public.instructor_survey_responses; v_settings public.instructor_survey_settings; v_course jsonb;
begin
  if p_hash !~ '^[a-f0-9]{64}$' or p_test is null then raise exception 'INVALID_REQUEST'; end if;
  select * into v_row from public.instructor_survey_responses where id=(p_payload->>'id')::uuid;
  if found then
    if v_row.request_hash is distinct from p_hash or v_row.is_test is distinct from p_test or v_row.deleted_at is not null then raise exception 'ID_CONFLICT'; end if;
    return jsonb_build_object('stored',true,'id',v_row.id,'created_at',v_row.created_at,'duplicate',true);
  end if;
  select * into v_settings from public.instructor_survey_settings where id='main' for share;
  select c into v_course from jsonb_array_elements(v_settings.catalog) c where c->>'id'=p_payload->>'academy';
  if v_course is null or (not p_test and (not v_settings.is_open or not coalesce((v_course->>'is_open')::boolean,false))) then raise exception 'SURVEY_CLOSED'; end if;
  insert into public.instructor_survey_responses(id,academy,team_name,organizational_name,instructor_name,course_title,teaching_score,interaction_score,management_score,usefulness_score,overall_score,feedback,duration_seconds,source_url,request_hash,is_test)
  values((p_payload->>'id')::uuid,p_payload->>'academy',v_course->>'team_name',p_payload->>'organizational_name',p_payload->>'instructor_name',p_payload->>'course_title',(p_payload->>'teaching_score')::smallint,(p_payload->>'interaction_score')::smallint,(p_payload->>'management_score')::smallint,(p_payload->>'usefulness_score')::smallint,(p_payload->>'overall_score')::smallint,p_payload->>'feedback',(p_payload->>'duration_seconds')::integer,p_payload->>'source_url',p_hash,p_test)
  on conflict(id) do nothing returning * into v_row;
  if not found then
    select * into v_row from public.instructor_survey_responses where id=(p_payload->>'id')::uuid;
    if v_row.request_hash is distinct from p_hash or v_row.is_test is distinct from p_test or v_row.deleted_at is not null then raise exception 'ID_CONFLICT'; end if;
    return jsonb_build_object('stored',true,'id',v_row.id,'created_at',v_row.created_at,'duplicate',true);
  end if;
  return jsonb_build_object('stored',true,'id',v_row.id,'created_at',v_row.created_at,'duplicate',false);
end;
$$;

create or replace function public.instructor_survey_report(p_filters jsonb default '{}'::jsonb,p_page integer default 0,p_limit integer default 25)
returns jsonb language sql stable security invoker set search_path='' as $$
with base as materialized (
  select r.* from public.instructor_survey_responses r
  where r.deleted_at is null and r.is_test=coalesce((p_filters->>'is_test')::boolean,false)
  and (p_filters->>'snapshot' is null or r.created_at<=(p_filters->>'snapshot')::timestamptz)
), filtered as materialized (
  select * from base r where
    (nullif(p_filters->>'academy','') is null or r.academy=p_filters->>'academy')
    and (nullif(p_filters->>'instructor_name','') is null or r.instructor_name=p_filters->>'instructor_name')
    and (nullif(p_filters->>'course_title','') is null or r.course_title=p_filters->>'course_title')
    and (nullif(p_filters->>'team_name','') is null or r.team_name=p_filters->>'team_name')
    and (nullif(p_filters->>'sync_status','') is null or r.sync_status=p_filters->>'sync_status')
    and (nullif(p_filters->>'from','') is null or r.created_at>=((p_filters->>'from')::date::timestamp at time zone 'Asia/Tehran'))
    and (nullif(p_filters->>'to','') is null or r.created_at<(((p_filters->>'to')::date+1)::timestamp at time zone 'Asia/Tehran'))
    and (p_filters->>'min_score' is null or r.average_score>=(p_filters->>'min_score')::numeric)
    and (p_filters->>'max_score' is null or r.average_score<=(p_filters->>'max_score')::numeric)
    and (coalesce(p_filters->>'comment','')<>'yes' or length(trim(r.feedback))>0)
    and (nullif(p_filters->>'search','') is null or position(lower(p_filters->>'search') in lower(r.organizational_name||' '||r.instructor_name||' '||r.course_title||' '||r.feedback||' '||r.id::text))>0)
), paged as (
  select to_jsonb(r)-'request_hash'-'deleted_at' as row_data from filtered r order by created_at desc,id desc limit least(greatest(p_limit,1),1000) offset greatest(p_page,0)::bigint*least(greatest(p_limit,1),1000)
), grouped as (
  select academy,count(*) as count,round(avg(average_score),2) as average_score,round(100.0*count(*) filter(where overall_score>=4)/nullif(count(*),0),1) as satisfaction
  from filtered group by academy
), scores as (
  select unnest(array['teaching_score','interaction_score','management_score','usefulness_score','overall_score']) as code,
         unnest(array[avg(teaching_score),avg(interaction_score),avg(management_score),avg(usefulness_score),avg(overall_score)]) as average from filtered
), distribution as (
  select n as score,count(r.id) as count from generate_series(1,5) n left join filtered r on r.overall_score=n group by n order by n
)
select jsonb_build_object(
  'rows',coalesce((select jsonb_agg(row_data) from paged),'[]'::jsonb),
  'total',(select count(*) from filtered),'page',p_page,'limit',p_limit,
  'summary',(select jsonb_build_object('count',count(*),'average_score',round(avg(average_score),2),'satisfaction',round(100.0*count(*) filter(where overall_score>=4)/nullif(count(*),0),1),'comment_count',count(*) filter(where length(trim(feedback))>0),'sync_failed',count(*) filter(where sync_status='failed')) from filtered),
  'by_academy',coalesce((select jsonb_agg(to_jsonb(g) order by g.academy) from grouped g),'[]'::jsonb),
  'scores',(select jsonb_agg(jsonb_build_object('code',code,'average',round(average,2))) from scores),
  'distribution',(select jsonb_agg(to_jsonb(d)) from distribution d),
  'facets',jsonb_build_object(
    'instructors',coalesce((select jsonb_agg(x.instructor_name order by x.instructor_name) from (select distinct instructor_name from base where nullif(p_filters->>'academy','') is null or academy=p_filters->>'academy') x),'[]'::jsonb),
    'classes',coalesce((select jsonb_agg(x.course_title order by x.course_title) from (select distinct course_title from base where nullif(p_filters->>'academy','') is null or academy=p_filters->>'academy') x),'[]'::jsonb),
    'teams',coalesce((select jsonb_agg(x.team_name order by x.team_name) from (select distinct team_name from base) x),'[]'::jsonb)
  )
);
$$;
revoke all on function public.instructor_survey_record(jsonb,text,boolean) from public,anon,authenticated;
revoke all on function public.instructor_survey_report(jsonb,integer,integer) from public,anon,authenticated;
revoke all on function public.instructor_survey_check_rate(text,integer,integer) from public,anon,authenticated;
grant execute on function public.instructor_survey_record(jsonb,text,boolean),public.instructor_survey_report(jsonb,integer,integer),public.instructor_survey_check_rate(text,integer,integer) to service_role;
notify pgrst,'reload schema';
