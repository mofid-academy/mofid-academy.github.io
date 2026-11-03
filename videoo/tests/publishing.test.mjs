import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,randomUUID} from 'node:crypto';
import {createApi,normalizeCourses} from '../backend/core.mjs';
import {passwordHash,passwordMatches} from '../backend/learners.mjs';
import {newCourse,newLesson} from '../model.mjs';

const config={adminUsername:'test-owner',adminKeyHash:createHash('sha256').update('owner-test-password').digest('hex'),signingKey:'test-only-video-signing-key-long-enough-for-fixtures',siteOrigin:'https://mofid-academy.github.io'};
const s3={endpoint:'https://s3.ir-central1.arvanstorage.ir',region:'ir-central1',bucket:'video-test-bucket',accessKey:'test-access-key',secretKey:'test-only-secret-key'};
function fixture(){
  let catalog={revision:0,courses:[newCourse(),newCourse()]},enabled=false;catalog.courses.forEach((c,i)=>{c.title=i?'Draft secret course':'Published learning';c.sections[0].lessons=[{...newLesson(),objectKey:i?'hidden.mp4':'part-2.mp4',duration:100}];});
  const students=new Map(),progress=new Map(),calls=[];let head={size:100,type:'image/png'};
  const db=async(action,d={})=>{calls.push({action,data:d});
    if(action==='rate_limit')return true;
    if(action==='settings_read')return {release_enabled:enabled};
    if(action==='release_set'){enabled=d.enabled;return enabled;}
    if(action==='catalog')return structuredClone(catalog);
    if(action==='catalog_save'){if(d.revision!==catalog.revision){const e=Error('conflict');e.code='REVISION_CONFLICT';throw e;}catalog={revision:catalog.revision+1,courses:structuredClone(d.courses)};return structuredClone(catalog);}
    if(action==='storage_read')return s3;
    if(action==='student_create'){if([...students.values()].some(s=>s.username===d.username)){const e=Error('duplicate');e.code='USERNAME_TAKEN';throw e;}const s={id:randomUUID(),session_version:randomUUID(),username:d.username,full_name:d.fullName,password_hash:d.passwordHash,is_active:true};students.set(s.id,s);return structuredClone(s);}
    if(action==='student_by_username')return [...students.values()].find(s=>s.username===d.username)||null;
    if(action==='student_get')return students.get(d.id)||null;
    if(action==='student_update'){const s=students.get(d.id);if(d.isActive!==null)s.is_active=d.isActive;if(d.passwordHash!==null)s.password_hash=d.passwordHash;s.session_version=randomUUID();return structuredClone(s);}
    if(action==='student_list')return [...students.values()].slice(d.offset,d.offset+101);
    if(action==='progress_list')return [...progress.values()].filter(p=>p.actor===d.actor);
    if(action==='progress_get')return progress.get(d.actor+'/'+d.lessonId)||null;
    if(action==='progress_save'){const row={...d,lesson_id:d.lessonId,revision:d.revision+1};progress.set(d.actor+'/'+d.lessonId,row);return row;}
    throw Error(action);
  };
  const storage={head:async()=>head,play:(s,key)=>'https://media.invalid/signed/'+encodeURIComponent(key),put:(s,key,type)=>'https://media.invalid/upload/'+key+'?type='+encodeURIComponent(type)};
  const api=createApi({db,config,storage}),admin=api.sign({kind:'admin',username:config.adminUsername,exp:Math.floor(Date.now()/1000)+7200});
  const owner=(action,data={})=>api.handle({action,data,token:admin});
  const start=async()=>{await owner('course_publish',{courseId:catalog.courses[0].id,revision:catalog.revision,publish:true});await owner('release_set',{enabled:true});};
  const student=async(username='learner.one')=>{await owner('student_create',{username,fullName:username,password:'test-only-student-password'});return api.handle({action:'student_login',data:{username,password:'test-only-student-password'}});};
  return {api,admin,owner,start,student,students,progress,calls,get catalog(){return catalog;},setHead:value=>head=value};
}
test('learner passwords have unique salts and a slow one-way hash',async()=>{
  const a=await passwordHash('test-only-password'),b=await passwordHash('test-only-password');assert.notEqual(a,b);assert.match(a,/^pbkdf2-sha256\$600000\$/);assert.ok(!a.includes('test-only-password'));assert.equal(await passwordMatches('test-only-password',a),true);assert.equal(await passwordMatches('wrong',a),false);assert.equal(await passwordMatches('anything',null),false);
});
test('publication is an explicit two-step action and the public route remains closed by default',async()=>{
  const f=fixture();assert.equal((await f.api.handle({action:'health'})).publicState,'coming-soon');await assert.rejects(f.api.handle({action:'student_login',data:{username:'learner.one',password:'test-only'}}),e=>e.code==='NOT_RELEASED');
  await assert.rejects(f.owner('release_set',{enabled:true}),e=>e.code==='PUBLISH_EMPTY');
  await f.owner('course_publish',{courseId:f.catalog.courses[0].id,revision:0,publish:true});assert.equal((await f.api.handle({action:'health'})).publicState,'coming-soon');
  await f.owner('release_set',{enabled:true});assert.equal((await f.api.handle({action:'health'})).publicState,'live');
});
test('learners only receive published playable lessons and their own progress, without storage keys or management controls',async()=>{
  const f=fixture();await f.start();const one=await f.student(),two=await f.student('learner.two'),lesson=f.catalog.courses[0].sections[0].lessons[0];
  await f.api.handle({action:'progress_save',token:one.token,data:{lessonId:lesson.id,position:10,duration:100,ranges:[[0,10]],actor:'another-user'}});
  const a=await f.api.handle({action:'bootstrap',token:one.token}),b=await f.api.handle({action:'bootstrap',token:two.token});
  assert.equal(a.catalog.courses.length,1);assert.equal(a.role,'student');assert.equal(a.catalog.courses[0].sections[0].lessons[0].available,true);assert.equal(a.progress.length,1);assert.equal(b.progress.length,0);assert.equal(a.progress[0].actor,'student:'+f.api.verify(one.token,'student').sub);
  const raw=JSON.stringify(a);for(const secret of ['Draft secret course','hidden.mp4','part-2.mp4','password_hash','session_version','secretKey','accessKey','objectKey'])assert.ok(!raw.includes(secret),secret);assert.equal(a.storage,undefined);
  for(const action of ['catalog_save','course_publish','release_set','student_list','student_create','student_update','storage_status','storage_files','storage_connect','upload_begin','cover_upload_begin','cover_upload_complete'])await assert.rejects(f.api.handle({action,token:one.token}),e=>e.status===403,action);
  await assert.rejects(f.api.handle({action:'video_play',token:one.token,data:{lessonId:f.catalog.courses[1].sections[0].lessons[0].id}}),e=>e.status===404);
});
test('deactivation, password changes, unpublishing and the global switch revoke the corresponding access',async()=>{
  const f=fixture();await f.start();let user=await f.student(),account=[...f.students.values()][0],lesson=f.catalog.courses[0].sections[0].lessons[0];
  await f.owner('student_update',{studentId:account.id,isActive:false});await assert.rejects(f.api.handle({action:'bootstrap',token:user.token}),e=>e.status===401);
  await f.owner('student_update',{studentId:account.id,isActive:true});user=await f.api.handle({action:'student_login',data:{username:account.username,password:'test-only-student-password'}});
  await f.owner('student_update',{studentId:account.id,password:'replacement-test-password'});await assert.rejects(f.api.handle({action:'bootstrap',token:user.token}),e=>e.status===401);
  user=await f.api.handle({action:'student_login',data:{username:account.username,password:'replacement-test-password'}});
  await f.owner('course_publish',{courseId:f.catalog.courses[0].id,revision:f.catalog.revision,publish:false});await assert.rejects(f.api.handle({action:'video_play',token:user.token,data:{lessonId:lesson.id}}),e=>e.status===404);
  await f.owner('release_set',{enabled:false});await assert.rejects(f.api.handle({action:'bootstrap',token:user.token}),e=>e.code==='NOT_RELEASED');
});
test('image uploads bind type, size and purpose, and reject SVG and oversized covers',async()=>{
  const f=fixture();for(const data of [{type:'image/svg+xml',size:100},{type:'image/png',size:6*1024*1024}])await assert.rejects(f.owner('cover_upload_begin',data));
  const upload=await f.owner('cover_upload_begin',{type:'image/png',size:100});assert.match(upload.url,/academy\/covers\/.*\.png/);assert.match(upload.url,/image%2Fpng/);
  await assert.rejects(f.api.handle({action:'bootstrap',token:upload.ticket}),e=>e.status===401);
  const image=await f.owner('cover_upload_complete',{ticket:upload.ticket});assert.match(image.objectKey,/\.png$/);assert.ok(!image.url.includes(s3.secretKey));
  f.setHead({size:99,type:'image/png'});await assert.rejects(f.owner('cover_upload_complete',{ticket:upload.ticket}),e=>e.code==='INVALID_COVER');
});
test('student listings are paginated and never expose hashes or session versions',async()=>{
  const f=fixture();for(let i=0;i<105;i++)f.students.set(String(i),{id:String(i),username:'user.'+i,full_name:'Learner',is_active:true,password_hash:'must-never-return',session_version:'must-never-return'});
  const first=await f.owner('student_list');assert.equal(first.students.length,100);assert.equal(first.nextOffset,100);assert.ok(!JSON.stringify(first).includes('must-never-return'));const second=await f.owner('student_list',{offset:100});assert.equal(second.students.length,5);assert.equal(second.nextOffset,null);
});
test('catalogue normalization strips ephemeral cover URLs and restricts cover object types',()=>{
  const courses=[newCourse()];courses[0].coverObjectKey='academy/covers/test.png';courses[0].coverUrl='https://temporary.invalid/private';assert.equal(normalizeCourses(courses)[0].coverUrl,undefined);
  courses[0].coverObjectKey='test.svg';assert.throws(()=>normalizeCourses(courses));
});
