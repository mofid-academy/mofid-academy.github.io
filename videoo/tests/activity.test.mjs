import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,randomUUID} from 'node:crypto';
import {createApi,createStore} from '../backend/core.mjs';
import {passwordHash} from '../backend/learners.mjs';
import {activityQuery,createActivityLogger,progressActivity} from '../backend/activity.mjs';
import {activityBody,installActivity,startActivityPresence} from '../activity-ui.mjs';
import {newCourse,newLesson} from '../model.mjs';

async function fixture(){
  const password='fixture-personal-password',username='learner.audit',account={id:randomUUID(),username,full_name:'Activity learner',password_hash:await passwordHash(password),is_active:true,session_version:randomUUID(),must_change_password:false};
  const course=newCourse();course.title='Training course';course.status='published';const lesson={...newLesson(),title:'First lesson',duration:100,objectKey:'private-lesson.mp4'};course.sections[0].lessons=[lesson];
  const entries=[],calls=[],progress=new Map();let failAudit=false,enabled=true;
  const config={adminUsername:'fixture-owner',adminKeyHash:createHash('sha256').update('fixture-admin-password').digest('hex'),signingKey:'fixture-audit-signing-key-not-a-production-secret',siteOrigin:'https://mofid-academy.github.io'};
  const db=async(action,data={})=>{calls.push({action,data});
    if(action==='activity_write'){if(failAudit)throw Error('fixture log unavailable');entries.push(structuredClone(data));return;}
    if(action==='activity_touch'){if(failAudit)throw Error('fixture presence unavailable');return;}
    if(action==='activity_report')return {events:entries,summary:{events:entries.length},users:[],nextCursor:null};
    if(action==='rate_limit')return true;
    if(action==='settings_read')return {release_enabled:enabled};
    if(action==='student_by_username')return data.username===username?account:null;
    if(action==='student_get')return data.id===account.id?account:null;
    if(action==='catalog')return {revision:1,courses:[course]};
    if(action==='progress_list')return [...progress.values()];
    if(action==='progress_get')return progress.get(data.lessonId)||null;
    if(action==='progress_save'){const row={...data,lesson_id:data.lessonId,revision:data.revision+1};progress.set(data.lessonId,row);return row;}
    if(action==='storage_read')return {endpoint:'https://s3.ir-central1.arvanstorage.ir',region:'ir-central1',bucket:'fixture-private',accessKey:'fixture-access',secretKey:'fixture-storage-secret'};
    throw Error('Unexpected fixture storage operation: '+action);
  };
  const api=createApi({config,db,storage:{play:()=> 'https://media.invalid/signed-sensitive-url'}});
  const owner=api.sign({kind:'admin',username:config.adminUsername,exp:Math.floor(Date.now()/1000)+7200});
  const token=api.sign({kind:'student',sub:account.id,jti:account.session_version,username,exp:Math.floor(Date.now()/1000)+7200});
  return {api,owner,token,account,course,lesson,entries,calls,password,setFailAudit:value=>failAudit=value,setEnabled:value=>enabled=value,call:(action,data={},auth=token)=>api.handle({action,data,token:auth})};
}

test('successful and failed sign-ins are recorded without credentials or tokens',async()=>{
  const f=await fixture();await assert.rejects(f.call('student_login',{username:'LEARNER.AUDIT',password:'wrong-sensitive-password'}),error=>error.code==='LOGIN_FAILED');
  const login=await f.call('student_login',{username:'LEARNER.AUDIT',password:f.password});assert.equal(login.username,'learner.audit');
  const repeated=await f.call('student_login',{username:'learner.audit',password:f.password});assert.notEqual(repeated.token,login.token);
  assert.deepEqual(f.entries.map(e=>e.event),['login_failed','login','login']);assert.equal(f.entries[1].actor,'student:'+f.account.id);
  const encoded=JSON.stringify(f.entries);for(const value of [f.password,'wrong-sensitive-password',login.token,f.account.password_hash,'secretKey'])assert.ok(!encoded.includes(value));
});
test('only the administrator can read reports, including when a learner needs a password change',async()=>{
  const f=await fixture();for(const token of [undefined,f.token])await assert.rejects(f.api.handle({action:'activity_report',token}),error=>[401,403].includes(error.status));
  f.account.must_change_password=true;await assert.rejects(f.call('activity_report'),error=>error.status===403);
  const before=f.calls.filter(c=>c.action==='activity_report').length;assert.equal(before,0);
  const result=await f.call('activity_report',{username:'LEARNER.AUDIT',days:30},f.owner);assert.equal(result.ok,true);
  const query=f.calls.find(c=>c.action==='activity_report').data;assert.equal(query.username,'learner.audit');assert.equal(query.days,30);
});
test('logout and presence use the authenticated identity even when publication is paused',async()=>{
  const f=await fixture();f.account.must_change_password=true;f.setEnabled(false);
  await f.call('activity_ping',{username:'another.person',actor:'admin:forged'});await f.call('logout',{username:'another.person'});
  assert.equal(f.entries.at(-1).event,'logout');assert.equal(f.entries.at(-1).username,'learner.audit');
  const touch=f.calls.find(c=>c.action==='activity_touch').data;assert.equal(touch.actor,'student:'+f.account.id);assert.match(touch.sessionHash,/^[a-f0-9]{64}$/);
  assert.equal(f.entries.filter(e=>e.event==='activity_ping').length,0);
});
test('opening an episode logs resolved titles while progress only logs meaningful milestones',async()=>{
  const f=await fixture();await f.call('video_play',{lessonId:f.lesson.id,courseTitle:'forged'});
  assert.equal(f.entries.at(-1).event,'lesson_opened');assert.equal(f.entries.at(-1).courseTitle,'Training course');
  for(const seconds of [5,10,24,26,40,55,91,100])await f.call('progress_save',{lessonId:f.lesson.id,position:seconds,duration:100,ranges:[[0,seconds]],actor:'forged'});
  assert.deepEqual(f.entries.map(e=>e.event),['lesson_opened','watch_started','watch_progress','watch_progress','lesson_completed']);
  assert.equal(f.entries.at(-1).percent,91);assert.equal(f.entries.at(-1).watchedSeconds,91);
  for(const entry of f.entries)assert.equal(entry.actor,'student:'+f.account.id);
  assert.ok(!JSON.stringify(f.entries).includes('signed-sensitive-url'));assert.ok(!JSON.stringify(f.entries).includes('private-lesson.mp4'));
});
test('activity storage failures do not prevent sign-in or saving watch progress',async t=>{
  t.mock.method(console,'warn',()=>{});const f=await fixture();f.setFailAudit(true);
  assert.equal((await f.call('student_login',{username:f.account.username,password:f.password})).ok,true);
  assert.equal((await f.call('progress_save',{lessonId:f.lesson.id,position:5,duration:100,ranges:[[0,5]]})).progress.position,5);
  assert.equal((await f.call('logout')).ok,true);
});
test('report filters reject malformed users, unsupported events, excessive history and invalid cursors',()=>{
  for(const value of [{username:'bad%name'},{event:'password-value'},{days:365},{cursor:{id:'-1',at:'yesterday'}},{cursor:{id:'1',at:'invalid'}}])assert.throws(()=>activityQuery(value));
  const query=activityQuery({username:'Person.Name',days:7,cursor:{id:'123',at:'2026-11-10T09:00:00.123+00:00'}});assert.equal(query.username,'person.name');assert.equal(query.beforeId,'123');
});
test('the activity logger persists only its approved schema even if a caller supplies extra fields',async()=>{
  let saved;const log=createActivityLogger(async(action,data)=>{saved=data;});await log('watch_started',{username:'learner.audit',role:'student',password:'not-to-store',token:'not-to-store'},{percent:25,watchedSeconds:15,password:'not-to-store',url:'not-to-store',objectKey:'not-to-store'});
  assert.ok(!JSON.stringify(saved).includes('not-to-store'));assert.equal(saved.percent,25);
});
test('watch completion uses watched ranges rather than the seek position',()=>{
  assert.equal(progressActivity(null,{duration:100,position:99,ranges:[]}),null);
  assert.equal(progressActivity({ranges:[[0,85]]},{duration:100,ranges:[[0,91]]}).event,'lesson_completed');
  assert.equal(progressActivity({ranges:[[0,91]]},{duration:100,ranges:[[0,100]]}),null);
});
test('private store routes activity through server-only RPCs with a stable cursor',async()=>{
  const calls=[];const store=createStore({url:'https://database.invalid',key:'fixture-service-key',fetchImpl:async(url,options)=>{calls.push({url,body:JSON.parse(options.body)});return Response.json({events:[],nextCursor:null});}});
  await store('activity_report',{username:'learner.audit',event:'login',days:7,beforeAt:'2026-11-10T09:00:00Z',beforeId:'4'});
  assert.match(calls[0].url,/rpc\/av_activity_report$/);assert.equal(calls[0].body.p_before_id,'4');assert.equal(calls[0].body.p_username,'learner.audit');
});
test('report markup escapes stored titles and includes clear presence and completion meanings',()=>{
  const html=activityBody({summary:{},events:[{username:'person.test',role:'student',event:'watch_progress',course_title:'<img src=x onerror=alert(1)>',lesson_title:'<script>bad()</script>',percent:25,watched_seconds:150,occurred_at:'2026-11-10T09:00:00Z'}],users:[{username:'person.test',is_online:true,last_seen_at:'2026-11-10T09:00:00Z'}],generatedAt:'2026-11-10T09:00:00Z'});
  assert.ok(!html.includes('<script>'));assert.ok(!html.includes('<img src=x'));assert.match(html,/&lt;script&gt;/);assert.match(html,/زمان تهران/);assert.match(html,/بستن مرورگر/);
  class App{}installActivity(App);assert.equal(App.prototype.activity.call({readOnly:true}), '');
});
test('presence pings pause in hidden tabs, avoid overlapping requests and stop on cleanup',async()=>{
  let tick,visible,cleared=false,resolve,calls=0;const doc={visibilityState:'visible',addEventListener:(event,fn)=>visible=fn,removeEventListener:()=>visible=null};
  const stop=startActivityPresence(()=>{calls++;return new Promise(r=>resolve=r);},{document:doc,setInterval:fn=>{tick=fn;return 9;},clearInterval:id=>{assert.equal(id,9);cleared=true;}});
  tick();tick();assert.equal(calls,1);resolve();await new Promise(r=>setImmediate(r));doc.visibilityState='hidden';tick();assert.equal(calls,1);
  doc.visibilityState='visible';visible();assert.equal(calls,2);stop();tick();assert.equal(calls,2);assert.equal(cleared,true);assert.equal(visible,null);resolve();
});
