-- Run after sql/challenges-admin-delete.sql. All synthetic rows are rolled back.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;
DO $verify$
DECLARE
  first_id uuid := gen_random_uuid();
  second_id uuid := gen_random_uuid();
  original_total bigint;
  receipt jsonb;
  retry_receipt jsonb;
  page jsonb;
BEGIN
  SELECT count(*) INTO original_total FROM public.zr_challenges_registrations WHERE deleted_at IS NULL;
  INSERT INTO public.zr_challenges_registrations(id,username,full_name,department,job_title,challenge_id,fingerprint)
  VALUES (first_id,'qa.delete.same','Synthetic first','QA','',1,repeat('a',64)),(second_id,'qa.delete.same','Synthetic second','QA','',2,repeat('b',64));
  receipt := public.zr_challenges_store('delete',jsonb_build_object('id',first_id));
  ASSERT receipt->>'id'=first_id::text AND receipt->>'deleted_at' IS NOT NULL,'Deletion receipt missing';
  ASSERT (SELECT deleted_at IS NOT NULL FROM public.zr_challenges_registrations WHERE id=first_id),'Chosen row still active';
  ASSERT (SELECT deleted_at IS NULL FROM public.zr_challenges_registrations WHERE id=second_id),'Other registration changed';
  retry_receipt := public.zr_challenges_store('delete',jsonb_build_object('id',first_id));
  ASSERT retry_receipt=receipt,'Deletion retry changed its receipt';
  page := public.zr_challenges_store('list','{}'::jsonb);
  ASSERT (page->>'total')::bigint=original_total+1,'Active total incorrect';
  ASSERT NOT EXISTS(SELECT FROM jsonb_array_elements(page->'entries') e WHERE e->>'id'=first_id::text),'Deleted row returned in list';
  BEGIN
    PERFORM public.zr_challenges_store('submit',jsonb_build_object('id',first_id,'username','qa.delete.same','full_name','Synthetic first','department','QA','job_title','','challenge_id',1,'fingerprint',repeat('a',64)));
    RAISE EXCEPTION 'Delayed submit restored a deleted registration';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM<>'CHALLENGE_ENTRY_DELETED' THEN RAISE; END IF;
  END;
  BEGIN
    PERFORM public.zr_challenges_store('delete',jsonb_build_object('id',gen_random_uuid()));
    RAISE EXCEPTION 'Missing registration reported success';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM<>'CHALLENGE_ENTRY_NOT_FOUND' THEN RAISE; END IF;
  END;
  ASSERT NOT has_function_privilege('anon','public.zr_challenges_store(text,jsonb)','EXECUTE'),'Anonymous RPC access enabled';
  ASSERT NOT has_function_privilege('authenticated','public.zr_challenges_store(text,jsonb)','EXECUTE'),'Browser RPC access enabled';
  ASSERT (SELECT relrowsecurity FROM pg_class WHERE oid='public.zr_challenges_registrations'::regclass),'RLS disabled';
END;
$verify$;
ROLLBACK;
SELECT true AS deletion_checks_passed;
