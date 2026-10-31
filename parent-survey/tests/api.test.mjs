import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createApi,createHandler,createStore,normalizeSubmission,normalizeFilters,submissionFingerprint} from '../backend/core.mjs';
import {ACTIVE_QUESTIONS as QUESTIONS,QUESTIONS as LEGACY_QUESTIONS,SURVEY_ID} from '../questions.mjs';
import {DEFAULT_SCHOOL,GRADES,QUESTION_CODES,restoreSurveyStep} from '../survey-config.mjs';
const secret='test-management-password-never-for-production';
const config={adminUsername:'M.mirsheri',adminKeyHash:createHash('sha256').update(secret).digest('hex'),signingKey:'test-only-signing-key-for-parent-survey'};
export const payload=()=>({id:crypto.randomUUID(),survey_id:SURVEY_ID,first_name:'نام آزمایشی',last_name:'خانوادگی نمونه',school:'مدرسه آزمایش',grade:'ششم',cohort:'آزمایش خودکار',relationship:'مادر',duration_seconds:120,answers:Object.fromEntries(QUESTIONS.map(q=>[q.code,q.kind==='text'?'':q.code==='P14'?'خیر':q.options[0].value]))});
const db=async action=>action==='ps_rate_limit'?true:action==='settings'?{is_open:true,schools:[],cohorts:[]}:{};
test('active survey has 14 questions with P13 removed and consent retained',()=>{assert.equal(QUESTIONS.length,14);assert.equal(QUESTIONS.filter(q=>q.required).length,11);assert.deepEqual(QUESTIONS.filter(q=>!q.required).map(q=>q.code),['P11','P12','P15']);assert.equal(QUESTIONS.some(q=>q.code==='P13'),false);assert.equal(QUESTIONS[12].code,'P14');});
test('zero is a valid answer to both 0–10 questions',()=>{const p=payload();assert.equal(normalizeSubmission(p).answers.P09,0);assert.equal(normalizeSubmission(p).answers.P10,0);});
test('missing consent, wrong types and out-of-range answers are rejected',()=>{for(const [k,v] of [['P14',undefined],['P01','5'],['P01',6],['P10',11],['P04',0],['P05',4]]){const p=payload();p.answers[k]=v;assert.throws(()=>normalizeSubmission(p));}});
test('optional blanks are retained as missing and no consent is preselected',()=>{const p=payload();delete p.answers.P13;assert.equal(normalizeSubmission(p).answers.P13,null);p.answers.P11='';assert.equal(normalizeSubmission(p).answers.P11,'');delete p.answers.P14;assert.throws(()=>normalizeSubmission(p));});
test('admin calls require a valid survey-scoped session',async()=>{const api=createApi({db,config});await assert.rejects(api.handle({action:'admin_list'}),e=>e.status===401);const s=await api.handle({action:'admin_login',username:'M.mirsheri',secret});assert.equal(api.verify(s.token).username,'m.mirsheri');await assert.rejects(api.handle({action:'admin_list',token:s.token+'x'}),e=>e.status===401);});
test('Excel template is only returned after administrator authentication',async()=>{const api=createApi({db,config,templateBase64:'test-template'});await assert.rejects(api.handle({action:'admin_template'}),e=>e.status===401);assert.equal((await api.handle({action:'admin_template',token:api.sign()})).template,'test-template');});
test('sessions expire and a participant cannot submit a test record',async()=>{let clock=Date.now();const api=createApi({db,config,now:()=>clock});const token=api.sign();clock+=7201000;assert.throws(()=>api.verify(token),e=>e.status===401);await assert.rejects(api.handle({action:'admin_test_submit',data:payload()}),e=>e.status===401);});
test('submission normalizes text and only confirms matching database acknowledgement',async()=>{const p=payload();p.school='  آزمایش  ';const api=createApi({config,db:async(a,d)=>a==='ps_rate_limit'?true:a==='ps_record'?{stored:true,id:d.p_id,created_at:new Date().toISOString()}:null});assert.equal((await api.handle({action:'submit',data:p})).stored,true);const broken=createApi({config,db:async a=>a==='ps_rate_limit'?true:{stored:true,id:crypto.randomUUID()}});await assert.rejects(broken.handle({action:'submit',data:p}));});
test('filters retain zero scores and reject invalid ranges and dates',()=>{assert.equal(normalizeFilters({qcode:'P10',qvalue:'0'}).qvalue,'0');assert.throws(()=>normalizeFilters({from:'2026-11-01',to:'2026-10-01'}));assert.throws(()=>normalizeFilters({qcode:'P01',qvalue:'6'}));assert.equal(normalizeFilters({consent:'false'}).consent,'false');});
test('HTTP transport rejects unknown origins, oversized bodies and malformed JSON',async()=>{const handle=createHandler(createApi({db,config}),{origins:['https://mofid-academy.github.io']});assert.equal((await handle(new Request('https://test/',{method:'POST',headers:{Origin:'https://untrusted.test'},body:'{}'}))).status,403);assert.equal((await handle(new Request('https://test/',{method:'POST',body:'x'.repeat(33000)}))).status,413);assert.equal((await handle(new Request('https://test/',{method:'POST',body:'not json'}))).status,400);});

test('student name is optional but supplied name values remain bounded and normalized',()=>{
  const blank=payload();delete blank.first_name;delete blank.last_name;assert.equal(normalizeSubmission(blank).first_name,'');assert.equal(normalizeSubmission(blank).last_name,'');
  for(const key of ['first_name','last_name']){for(const value of ['',null,undefined,'   ']){const p=payload();p[key]=value;assert.equal(normalizeSubmission(p)[key],'');}for(const value of ['x'.repeat(81),123]){const p=payload();p[key]=value;assert.throws(()=>normalizeSubmission(p));}}
  const p=payload();p.first_name='  نام   آزمایشی  ';assert.equal(normalizeSubmission(p).first_name,'نام آزمایشی');
});
test('adding respondent names preserves the fingerprint of a legacy pending response',()=>{const n=normalizeSubmission(payload());const {first_name,last_name,...legacy}=n;assert.equal(submissionFingerprint(n),createHash('sha256').update(JSON.stringify(legacy)).digest('hex'));});
test('removing P13 preserves the fingerprint of an already pending legacy submission',()=>{
  const p=payload();p.answers=Object.fromEntries(LEGACY_QUESTIONS.map(q=>[q.code,q.code==='P13'?4:p.answers[q.code]]));
  const {first_name,last_name,...legacy}=p;
  assert.equal(submissionFingerprint(normalizeSubmission(p)),createHash('sha256').update(JSON.stringify(legacy)).digest('hex'));
});
test('drafts resume at the same retained question or review after P13 removal',()=>{
  assert.equal(restoreSurveyStep(11),11);assert.equal(restoreSurveyStep(12),12);assert.equal(restoreSurveyStep(13),12);assert.equal(restoreSurveyStep(14),13);assert.equal(restoreSurveyStep(15),14);
  for(let i=0;i<=14;i++)assert.equal(restoreSurveyStep(i,QUESTION_CODES),i);
  assert.equal(restoreSurveyStep(-1),-1);assert.equal(DEFAULT_SCHOOL,'مدرسه ی دانش');assert.deepEqual(GRADES,['هفتم','هشتم','نهم']);
});
test('new and already-open export clients receive matching template layouts',async()=>{
  const api=createApi({db,config,templateBase64:'new-14-questions',legacyTemplateBase64:'legacy-15-questions'}),token=api.sign();
  assert.equal((await api.handle({action:'admin_template',token,template_version:2})).template,'new-14-questions');
  assert.equal((await api.handle({action:'admin_template',token})).template,'legacy-15-questions');
});

test('deleting a response requires a valid administrator session before accessing the database',async()=>{
  let calls=0;const api=createApi({config,db:async()=>{calls++;return [];}}),id=crypto.randomUUID();
  for(const token of [undefined,'invalid',api.sign()+'x'])await assert.rejects(api.handle({action:'admin_delete',token,id,confirm:true}),e=>e.status===401);
  assert.equal(calls,0);
});
test('deletion rejects missing IDs, filter injection and unconfirmed requests',async()=>{
  let calls=0;const api=createApi({config,db:async()=>{calls++;return [];}}),token=api.sign(),id=crypto.randomUUID();
  for(const invalid of [undefined,'','*','eq.'+id,id+'&id=neq.x',[],42])await assert.rejects(api.handle({action:'admin_delete',token,id:invalid,confirm:true}),e=>e.status===400);
  for(const confirm of [undefined,false,'true'])await assert.rejects(api.handle({action:'admin_delete',token,id,confirm}),e=>e.status===400);
  assert.equal(calls,0);
});
test('deletion removes only the selected response and confirms the database acknowledgement',async()=>{
  const id=crypto.randomUUID(),other=crypto.randomUUID(),rows=new Map([[id,{id}],[other,{id:other}]]);
  const api=createApi({config,db:async(action,data)=>{assert.equal(action,'response_delete');const row=rows.get(data.id);rows.delete(data.id);return row?[row]:[];}}),token=api.sign();
  assert.deepEqual(await api.handle({action:'admin_delete',token,id,confirm:true}),{ok:true,deleted:true,id});
  assert.equal(rows.has(id),false);assert.equal(rows.has(other),true);
  await assert.rejects(api.handle({action:'admin_delete',token,id,confirm:true}),e=>e.status===404);
  for(const reply of [null,{},[{id:other}],[{id},{id:other}]]){
    const broken=createApi({config,db:async()=>reply});
    await assert.rejects(broken.handle({action:'admin_delete',token:broken.sign(),id,confirm:true}),e=>e.status===503);
  }
});
test('database deletion is scoped to one ID and this survey and returns only its ID',async()=>{
  const id=crypto.randomUUID();let calls=0;
  const store=createStore({url:'https://database.test',key:'test-service-key',fetchImpl:async(url,options)=>{
    calls++;const u=new URL(url);assert.equal(options.method,'DELETE');assert.equal(u.pathname,'/rest/v1/ps_responses');
    assert.deepEqual(Object.fromEntries(u.searchParams),{id:'eq.'+id,survey_id:'eq.'+SURVEY_ID,select:'id'});
    assert.equal(options.headers.Prefer,'return=representation');return Response.json([{id}]);
  }});
  assert.deepEqual(await store('response_delete',{id}),[{id}]);
  await assert.rejects(store('response_delete',{id:id+'&or=(id.not.is.null)'}),e=>e.status===400);
  assert.equal(calls,1);
});
