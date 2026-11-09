import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,randomUUID} from 'node:crypto';
import {createApi,createStore,ApiError} from '../backend/core.mjs';
import {passwordHash,passwordMatches,publicStudent} from '../backend/learners.mjs';
import {passwordPanel,bindPasswordForm} from '../account.mjs';

const initial='initial-password-fixture',personal='personal-password-fixture';
const config={adminUsername:'fixture-owner',adminKeyHash:createHash('sha256').update('owner-password-fixture').digest('hex'),signingKey:'fixture-only-signing-key-for-password-tests',siteOrigin:'https://mofid-academy.github.io'};
async function fixture({forced=true}={}){
  const account={id:randomUUID(),username:'learner.one',full_name:'Learner One',password_hash:await passwordHash(initial),is_active:true,session_version:randomUUID(),must_change_password:forced};
  const other={...account,id:randomUUID(),username:'learner.two',session_version:randomUUID()};
  const lessonId=randomUUID(),progress={lesson_id:lessonId,position:25,duration:100,ranges:[[0,25]],revision:1};
  const calls=[];let enabled=true,allowed=true,race=false;
  const db=async(action,d={})=>{
    calls.push({action,data:d});
    if(action==='rate_limit')return allowed;
    if(action==='settings_read')return {release_enabled:enabled};
    if(action==='student_get')return structuredClone(d.id===account.id?account:d.id===other.id?other:null);
    if(action==='student_by_username')return structuredClone(d.username===account.username?account:d.username===other.username?other:null);
    if(action==='student_change_password'){
      if(race)account.session_version=randomUUID();
      if(d.id!==account.id||d.sessionVersion!==account.session_version||d.expectedHash!==account.password_hash||!account.is_active)throw new ApiError('ACCESS_DENIED','Credentials changed',401);
      account.password_hash=d.newHash;account.must_change_password=false;account.session_version=randomUUID();return structuredClone(account);
    }
    if(action==='catalog')return {revision:1,courses:[{id:randomUUID(),title:'Private course',status:'published',sections:[{id:randomUUID(),title:'Section',lessons:[{id:lessonId,title:'Lesson',objectKey:'private.mp4'}]}]}]};
    if(action==='progress_list')return [structuredClone(progress)];
    throw Error(action);
  };
  const api=createApi({db,config}),claims=()=>({kind:'student',sub:account.id,jti:account.session_version,username:account.username,exp:Math.floor(Date.now()/1000)+7200});
  const token=api.sign(claims()),admin=api.sign({kind:'admin',username:config.adminUsername,exp:Math.floor(Date.now()/1000)+7200});
  const call=(action,data={},session=token)=>api.handle({action,data,token:session},{ip:'fixture-ip'});
  return {account,other,api,token,admin,call,calls,progress,lessonId,setEnabled:value=>enabled=value,setAllowed:value=>allowed=value,setRace:value=>race=value};
}

test('initial credentials require a personal password before catalogue, media or progress access',async()=>{
  const f=await fixture();const login=await f.call('student_login',{username:f.account.username,password:initial});assert.equal(login.mustChangePassword,true);
  const boot=await f.call('bootstrap');assert.equal(boot.mustChangePassword,true);assert.deepEqual(boot.catalog.courses,[]);assert.deepEqual(boot.progress,[]);
  for(const action of ['video_play','progress_save'])await assert.rejects(f.call(action,{lessonId:f.lessonId}),e=>e.code==='PASSWORD_CHANGE_REQUIRED');
  assert.ok(!f.calls.some(x=>['catalog','progress_list','storage_read','progress_save'].includes(x.action)));
});
test('wrong current, short, unchanged or invalid passwords cannot modify credentials',async()=>{
  const f=await fixture(),hash=f.account.password_hash,version=f.account.session_version;
  for(const data of [{currentPassword:'incorrect',newPassword:personal},{currentPassword:initial,newPassword:'short'},{currentPassword:initial,newPassword:initial},{currentPassword:null,newPassword:personal}])await assert.rejects(f.call('student_password_change',data),e=>e.status===400);
  assert.equal(f.account.password_hash,hash);assert.equal(f.account.session_version,version);assert.ok(!f.calls.some(x=>x.action==='student_change_password'));
});
test('changing a password rotates all prior sessions and preserves identity and watch progress',async()=>{
  const f=await fixture(),id=f.account.id,otherHash=f.other.password_hash;
  const changed=await f.call('student_password_change',{currentPassword:initial,newPassword:personal,studentId:f.other.id});
  assert.notEqual(changed.token,f.token);assert.equal(f.account.id,id);assert.equal(f.account.must_change_password,false);assert.equal(f.other.password_hash,otherHash);
  assert.equal(await passwordMatches(personal,f.account.password_hash),true);assert.equal(await passwordMatches(initial,f.account.password_hash),false);
  assert.ok(!JSON.stringify(changed).includes('password_hash'));assert.ok(!JSON.stringify(publicStudent(f.account)).includes('session_version'));
  await assert.rejects(f.call('bootstrap'),e=>e.status===401);await assert.rejects(f.call('student_login',{username:f.account.username,password:initial}),e=>e.code==='LOGIN_FAILED');
  const login=await f.call('student_login',{username:f.account.username,password:personal});assert.equal(login.mustChangePassword,false);
  const boot=await f.call('bootstrap',{},changed.token);assert.equal(boot.progress[0].position,25);assert.equal(boot.catalog.courses.length,1);
});
test('a learner can change their personal password again while public video access is paused',async()=>{
  const f=await fixture({forced:false});f.setEnabled(false);
  const changed=await f.call('student_password_change',{currentPassword:initial,newPassword:personal});assert.equal(changed.mustChangePassword,false);assert.equal(await passwordMatches(personal,f.account.password_hash),true);
});
test('rate limits and concurrent administrator resets prevent password writes',async()=>{
  const f=await fixture();f.setAllowed(false);await assert.rejects(f.call('student_password_change',{currentPassword:initial,newPassword:personal}),e=>e.status===429);
  f.setAllowed(true);f.setRace(true);const before=f.account.password_hash;await assert.rejects(f.call('student_password_change',{currentPassword:initial,newPassword:personal}),e=>e.status===401);assert.equal(f.account.password_hash,before);
});
test('password self-service does not grant learner management access or change owner credentials',async()=>{
  const f=await fixture();await assert.rejects(f.call('student_update',{studentId:f.other.id,password:personal}),e=>e.status===403);
  await assert.rejects(f.call('student_password_change',{currentPassword:initial,newPassword:personal},f.admin),e=>e.status===403);
});
test('the database adapter sends an atomic credential check and maps stale credentials to sign-in',async()=>{
  let request;
  const db=createStore({url:'https://database.invalid',key:'fixture-service-key',fetchImpl:async(url,options)=>{request={url,body:JSON.parse(options.body)};return Response.json({id:'returned-id'});}});
  await db('student_change_password',{id:'own-id',sessionVersion:'old-session',expectedHash:'old-hash',newHash:'new-hash'});
  assert.match(request.url,/rpc\/av_student_change_password$/);assert.deepEqual(request.body,{p_id:'own-id',p_session_version:'old-session',p_expected_hash:'old-hash',p_new_hash:'new-hash'});
  const stale=createStore({url:'https://database.invalid',key:'fixture-service-key',fetchImpl:async()=>new Response('STUDENT_CREDENTIALS_CHANGED',{status:400})});
  await assert.rejects(stale('student_change_password',{}),e=>e.status===401);
});

function formFixture(values){
  const elements=Object.fromEntries(Object.entries(values).map(([k,value])=>[k,{value}]));const error={textContent:''},button={disabled:false},handlers={};
  const form={elements,isConnected:true,querySelector:s=>s==='.form-error'?error:button,addEventListener:(name,fn)=>handlers[name]=fn,removeEventListener(){},reset(){for(const input of Object.values(elements))input.value='';}};
  return {form,error,button,submit:()=>handlers.submit({preventDefault(){}})};
}
test('password forms offer native password autofill and mandatory users cannot cancel into the library',()=>{
  assert.match(passwordPanel(true),/autocomplete="current-password"/);assert.match(passwordPanel(true),/autocomplete="new-password"/);assert.ok(!passwordPanel(true).includes('data-action="library"'));assert.match(passwordPanel(false),/data-action="library"/);
});
test('a confirmation mismatch is caught before any server request',async()=>{
  const f=formFixture({currentPassword:initial,newPassword:personal,confirmation:'not-matching'});let calls=0;
  bindPasswordForm(f.form,{api:async()=>calls++,onSaved(){}});await f.submit();assert.equal(calls,0);assert.match(f.error.textContent,/یکسان/);assert.equal(f.button.disabled,false);
});
test('a successful form clears password inputs before rotating the client session',async()=>{
  const f=formFixture({currentPassword:initial,newPassword:personal,confirmation:personal});let saved=false;
  bindPasswordForm(f.form,{api:async(action,data)=>{assert.equal(action,'student_password_change');assert.deepEqual(data,{currentPassword:initial,newPassword:personal});return {token:'fresh-fixture-token'};},onSaved:async result=>{assert.equal(result.token,'fresh-fixture-token');assert.equal(f.form.elements.newPassword.value,'');saved=true;}});
  await f.submit();assert.equal(saved,true);assert.equal(f.button.disabled,false);
});
test('leaving a password form during submission cannot restore a logged-out session',async()=>{
  const f=formFixture({currentPassword:initial,newPassword:personal,confirmation:personal});let resolve,saved=false;
  bindPasswordForm(f.form,{api:()=>new Promise(r=>resolve=r),onSaved:()=>saved=true});const pending=f.submit();f.form.isConnected=false;resolve({token:'stale-fixture-token'});await pending;assert.equal(saved,false);
});
test('server validation errors remain on the form and allow a retry',async()=>{
  const f=formFixture({currentPassword:initial,newPassword:personal,confirmation:personal});bindPasswordForm(f.form,{api:async()=>{throw Error('رمز فعلی درست نیست.');},onSaved(){throw Error('Unexpected session change');}});
  await f.submit();assert.equal(f.button.disabled,false);assert.match(f.error.textContent,/رمز فعلی/);
});
