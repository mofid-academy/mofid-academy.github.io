-- Transactional integration test: all synthetic rows are rolled back.
begin;
do $$
declare p jsonb; a jsonb; b jsonb; v_id uuid:=gen_random_uuid(); v_name text:='integration-test-'||gen_random_uuid()::text; v_conflict boolean:=false;
begin
  p:=jsonb_build_object('id',v_id,'academy','19','organizational_name',v_name,'instructor_name','مدرس آزمایشی','course_title','کلاس آزمایشی','teaching_score',4,'interaction_score',4,'management_score',4,'usefulness_score',4,'overall_score',4,'feedback','آزمون فنی موقت','duration_seconds',60,'source_url','');
  a:=public.instructor_survey_record(p,repeat('a',64),true);
  assert (a->>'stored')::boolean and not (a->>'duplicate')::boolean,'record acknowledgement';
  b:=public.instructor_survey_record(p,repeat('a',64),true);
  assert (b->>'duplicate')::boolean,'idempotent retry';
  begin perform public.instructor_survey_record(p,repeat('b',64),true);exception when others then v_conflict:=sqlerrm='ID_CONFLICT';end;
  assert v_conflict,'conflicting retry is rejected';
  a:=public.instructor_survey_report(jsonb_build_object('search',v_name,'is_test',true,'academy','19'),0,25);
  assert (a->>'total')::integer=1 and (a->'summary'->>'average_score')::numeric=4,'course report and generated mean';
  a:=public.instructor_survey_report(jsonb_build_object('search',v_name,'is_test',true,'academy','20'),0,25);
  assert (a->>'total')::integer=0,'course isolation';
  a:=public.instructor_survey_report(jsonb_build_object('search',v_name),0,25);
  assert (a->>'total')::integer=0,'synthetic rows excluded from production report';
  update public.instructor_survey_responses set created_at='2026-10-30T20:30:00Z' where id=v_id;
  a:=public.instructor_survey_report(jsonb_build_object('search',v_name,'is_test',true,'from','2026-10-31','to','2026-10-31'),0,25);
  assert (a->>'total')::integer=1,'Tehran start of day is inclusive';
  update public.instructor_survey_responses set created_at='2026-10-31T20:30:00Z' where id=v_id;
  a:=public.instructor_survey_report(jsonb_build_object('search',v_name,'is_test',true,'from','2026-10-31','to','2026-10-31'),0,25);
  assert (a->>'total')::integer=0,'Tehran end of day is exclusive';
  insert into public.instructor_survey_responses(id,academy,team_name,organizational_name,instructor_name,course_title,teaching_score,interaction_score,management_score,usefulness_score,overall_score,feedback,is_test)
  select gen_random_uuid(),'19','تیم آزمایشی',v_name,'مدرس آزمایشی','کلاس آزمایشی',3,3,3,3,3,'',true from generate_series(1,1005);
  a:=public.instructor_survey_report(jsonb_build_object('search',v_name,'is_test',true,'academy','19'),0,1000);
  b:=public.instructor_survey_report(jsonb_build_object('search',v_name,'is_test',true,'academy','19'),1,1000);
  assert (a->>'total')::integer=1006 and jsonb_array_length(a->'rows')=1000 and jsonb_array_length(b->'rows')=6,'all pages beyond 1000 responses';
  assert not exists(select 1 from jsonb_array_elements(a->'rows') x join jsonb_array_elements(b->'rows') y on x->>'id'=y->>'id'),'pages do not overlap';
  update public.instructor_survey_responses set deleted_at=now() where id=v_id;
  a:=public.instructor_survey_report(jsonb_build_object('search',v_name,'is_test',true),0,1000);
  assert (a->>'total')::integer=1005,'soft deleted row is excluded';
  assert not has_function_privilege('anon','public.instructor_survey_report(jsonb,integer,integer)','execute'),'public report RPC denied';
  assert not has_function_privilege('authenticated','public.instructor_survey_record(jsonb,text,boolean)','execute'),'direct record RPC denied';
  assert not has_table_privilege('anon','public.instructor_survey_responses','select'),'public response reads denied';
end;
$$;
rollback;
select 'PASS: storage, retries, conflict detection, course filtering, Tehran dates, 1000+ pagination, deletion, and public access restrictions; synthetic rows rolled back' as verification;
