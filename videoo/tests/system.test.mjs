import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {createApi,createHandler,normalizeCourses,mergeRanges} from '../backend/core.mjs';
import {signedURL,storageConfig,objectKey,parseListing,createStorage} from '../backend/storage.mjs';
import {courseProgress,mergeWatch,moveLesson,newCourse,newLesson} from '../model.mjs';

const password='test-only-password-with-sufficient-entropy',config={adminUsername:'owner.test',adminKeyHash:createHash('sha256').update(password).digest('hex'),signingKey:'test-only-signing-material-that-never-reaches-production',siteOrigin:'https://mofid-academy.github.io'};
const s3={endpoint:'https://s3.ir-central1.arvanstorage.ir',region:'ir-central1',bucket:'test-video-bucket',accessKey:'test-only-access-key',secretKey:'test-only-secret-key-never-used'};
function fixture(){
  const lesson={id:randomUUID(),title:'قسمت اول',description:'توضیح',duration:100,objectKey:'J1.mp4',size:100};
  let catalog={revision:0,courses:[{id:randomUUID(),title:'اکسل',description:'',category:'مهارت',instructor:'',level:'همه',kind:'course',status:'draft',art:'excel',sections:[{id:randomUUID(),title:'فصل اول',lessons:[lesson]}]}]},savedStorage=null,progress=new Map(),calls=[];
  const db=async(action,data={})=>{
    calls.push({action,data});
    if(action==='rate_limit')return true;
    if(action==='settings_read')return {release_enabled:false};
    if(action==='catalog')return structuredClone(catalog);
    if(action==='catalog_save'){if(data.revision!==catalog.revision){const e=Error('Conflict');e.code='REVISION_CONFLICT';throw e;}catalog={courses:data.courses,revision:catalog.revision+1};return structuredClone(catalog);}
    if(action==='storage_read')return savedStorage;
    if(action==='storage_save'){savedStorage=data.config;return true;}
    if(action==='progress_list')return [...progress.values()].filter(p=>p.actor===data.actor);
    if(action==='progress_get')return progress.get(data.actor+'/'+data.lessonId)||null;
    if(action==='progress_save'){const row={...data,lesson_id:data.lessonId,revision:data.revision+1,updated_at:new Date().toISOString()};progress.set(data.actor+'/'+data.lessonId,row);return row;}
    throw Error(action);
  };
  const storage={list:async()=>({files:[{key:'J1.mp4',size:100}],cursor:''}),configureCors:async()=>true,play:()=> 'https://example.invalid/private-signed-video',begin:async()=> 'upload-id',part:()=> 'https://example.invalid/private-upload',complete:async()=>({size:100}),abort:async()=>{}};
  const api=createApi({db,config,storage,now:()=>1800000000000});
  const token=api.sign({kind:'admin',username:config.adminUsername,exp:1800000600});
  return {api,token,db,calls,lesson,catalog,storage,progress};
}

test('every catalogue, video, upload and configuration action requires server authentication',async()=>{
  const f=fixture();for(const action of ['bootstrap','catalog_save','storage_status','storage_files','storage_connect','video_play','progress_save','upload_begin','upload_part','upload_complete','upload_abort','cover_upload_begin','cover_upload_complete','course_publish','release_set','student_list','student_create','student_update'])await assert.rejects(f.api.handle({action}),e=>e.status===401);
  assert.equal(f.calls.length,0,'unauthenticated requests must not read any private rows or Vault');
});
test('forged signatures, wrong audiences, upload tokens and expired tokens cannot act as administrator',async()=>{
  const f=fixture(),claims={kind:'admin',username:config.adminUsername,exp:1800000600};
  for(const token of [f.token+'x',f.api.sign({...claims,exp:1799999999}),f.api.sign({...claims,kind:'upload'}),f.api.sign({...claims,aud:'another-app'}),f.api.sign({...claims,username:'another-owner'})])await assert.rejects(f.api.handle({action:'bootstrap',token}),e=>e.status===401);
});
test('valid existing management credentials issue a scoped administrator session; wrong password fails',async()=>{
  const f=fixture();await assert.rejects(f.api.handle({action:'admin_login',data:{username:config.adminUsername,password:'wrong'}}),e=>e.status===401);
  const result=await f.api.handle({action:'admin_login',data:{username:config.adminUsername,password}});assert.equal(f.api.verify(result.token).kind,'admin');
});
test('public health returns no catalogue, object path or credentials',async()=>{const f=fixture(),r=await f.api.handle({action:'health'});assert.deepEqual(Object.keys(r).sort(),['ok','publicState','version']);});
test('courses persist with revision conflict protection',async()=>{
  const f=fixture(),courses=structuredClone(f.catalog.courses);courses[0].title='عنوان جدید';
  const r=await f.api.handle({action:'catalog_save',token:f.token,data:{revision:0,courses}});assert.equal(r.catalog.courses[0].title,'عنوان جدید');assert.equal(r.catalog.revision,1);
  await assert.rejects(f.api.handle({action:'catalog_save',token:f.token,data:{revision:0,courses}}),e=>e.code==='REVISION_CONFLICT');
});
test('catalogue validation rejects duplicate identities, traversal and unknown visibility states',()=>{
  const f=fixture();let c=structuredClone(f.catalog.courses);c.push(structuredClone(c[0]));assert.throws(()=>normalizeCourses(c));
  c=structuredClone(f.catalog.courses);c[0].sections[0].lessons[0].objectKey='../private-file';assert.throws(()=>normalizeCourses(c));
  c=structuredClone(f.catalog.courses);c[0].status='public';assert.throws(()=>normalizeCourses(c));
});
test('storage credentials are encrypted by the database path and are never returned by bootstrap',async()=>{
  const f=fixture();await f.api.handle({action:'storage_connect',token:f.token,data:{...s3,setupCors:true}});
  const r=await f.api.handle({action:'bootstrap',token:f.token});assert.equal(r.storage.connected,true);assert.equal(r.storage.corsReady,true);assert.ok(!JSON.stringify(r).includes(s3.secretKey));assert.ok(!JSON.stringify(r).includes(s3.accessKey));
  assert.equal(f.calls.filter(c=>c.action==='storage_save').length,1);
});
test('failed connection does not overwrite previously valid credentials',async()=>{
  const f=fixture();f.storage.list=async()=>{throw Error('STORAGE_ACCESS_DENIED');};
  await assert.rejects(f.api.handle({action:'storage_connect',token:f.token,data:s3}),e=>e.code==='STORAGE_DENIED');assert.equal(f.calls.filter(c=>c.action==='storage_save').length,0);
});
test('unconfigured storage cannot return a video URL or upload ticket',async()=>{
  const f=fixture();await assert.rejects(f.api.handle({action:'video_play',token:f.token,data:{lessonId:f.lesson.id}}),e=>e.code==='STORAGE_NOT_CONNECTED');
  await assert.rejects(f.api.handle({action:'upload_begin',token:f.token,data:{name:'lesson.mp4',type:'video/mp4',size:100}}),e=>e.code==='STORAGE_NOT_CONNECTED');
});
test('progress actor is derived from the session and replayed watch ranges do not inflate completion',async()=>{
  const f=fixture();for(const ranges of [[[0,25]],[[0,25]],[[20,50]]])await f.api.handle({action:'progress_save',token:f.token,data:{lessonId:f.lesson.id,position:50,duration:100,ranges,actor:'someone-else'}});
  const r=(await f.api.handle({action:'bootstrap',token:f.token})).progress[0];assert.equal(r.actor,config.adminUsername);assert.deepEqual(r.ranges,[[0,50]]);
  assert.equal(courseProgress(f.catalog.courses[0],{[f.lesson.id]:r}).done,0);
});
test('moving the playback cursor to the end does not complete an unwatched video',()=>{
  const f=fixture();assert.equal(courseProgress(f.catalog.courses[0],{[f.lesson.id]:{position:100,duration:100,ranges:[[0,2]]}}).done,0);
  assert.equal(courseProgress(f.catalog.courses[0],{[f.lesson.id]:{position:95,duration:100,ranges:[[0,92]]}}).done,1);
});
test('watch range union handles overlap and out-of-order intervals',()=>{assert.deepEqual(mergeRanges([[20,30],[0,10],[8,25]],100),[[0,30]]);assert.deepEqual(mergeWatch([[0,10]],8,15),[[0,15]]);assert.throws(()=>mergeRanges([[0,101]],100));});
test('moving a lesson between courses retains its identity and watch history key',()=>{
  const a=newCourse(),b=newCourse(),lesson=newLesson();a.sections[0].lessons.push(lesson);moveLesson([a,b],lesson.id,b.id,b.sections[0].id);assert.equal(a.sections[0].lessons.length,0);assert.equal(b.sections[0].lessons[0].id,lesson.id);
});
test('server refuses arbitrary endpoints, credentials in URLs and invalid bucket traversal',()=>{
  for(const endpoint of ['http://s3.ir-central1.arvanstorage.ir','https://127.0.0.1','https://169.254.169.254','https://s3.ir-central1.arvanstorage.ir.evil.test','https://user:password@s3.ir-central1.arvanstorage.ir','https://s3.ir-central1.arvanstorage.ir/path'])assert.throws(()=>storageConfig({...s3,endpoint}));
  for(const key of ['/file','../file','a/../../file','a\\file','a\0file'])assert.throws(()=>objectKey(key));
});
test('S3 signatures scope method, path, expiry and canonical query without exposing secret material',()=>{
  const now=new Date('2026-11-02T10:15:20Z'),url=new URL(signedURL(s3,{key:'آموزش اکسل/J1.mp4',now,expires:600}));
  assert.equal(url.searchParams.get('X-Amz-Date'),'20261102T101520Z');assert.equal(url.searchParams.get('X-Amz-Expires'),'600');assert.match(decodeURIComponent(url.pathname),/آموزش اکسل\/J1.mp4$/);assert.ok(!url.href.includes(s3.secretKey));
  assert.notEqual(url.searchParams.get('X-Amz-Signature'),new URL(signedURL(s3,{method:'PUT',key:'آموزش اکسل/J1.mp4',now,expires:600})).searchParams.get('X-Amz-Signature'));
});
test('S3 list parsing keeps private object keys, handles entities and pagination, and excludes unrelated files',()=>{
  const r=parseListing('<ListBucketResult><Contents><Key>آموزش &amp; تست.mp4</Key><Size>100</Size></Contents><Contents><Key>document.pdf</Key></Contents><IsTruncated>true</IsTruncated><NextContinuationToken>a&amp;b</NextContinuationToken></ListBucketResult>');
  assert.equal(r.files.length,1);assert.equal(r.files[0].key,'آموزش & تست.mp4');assert.equal(r.cursor,'a&b');assert.equal(r.truncated,true);assert.throws(()=>parseListing('<!DOCTYPE bad><Contents/>'));
});
test('CORS setup preserves existing bucket rules and only adds the academy origin',async()=>{
  let stored='';const storage=createStorage({fetchImpl:async(url,options={})=>{if(options.method==='PUT'){stored=options.body;assert.match(stored,/xmlns="http:\/\/s3.amazonaws.com\/doc\/2006-03-01\/"/);assert.equal(options.headers['content-md5'],createHash('md5').update(stored).digest('base64'));assert.match(new URL(url).searchParams.get('X-Amz-SignedHeaders'),/content-md5/);return new Response('',{status:200});}return new Response('<CORSConfiguration><CORSRule><ID>other-app</ID><AllowedOrigin>https://other.example</AllowedOrigin></CORSRule></CORSConfiguration>');}});
  await storage.configureCors(s3,config.siteOrigin);assert.match(stored,/other-app/);assert.match(stored,/https:\/\/mofid-academy.github.io/);assert.match(stored,/<ExposeHeader>ETag/);assert.ok(!stored.includes('<AllowedOrigin>*</AllowedOrigin>'));
});
test('HTTP interface rejects foreign origins and malformed or oversized requests',async()=>{
  const f=fixture(),handle=createHandler(f.api);
  assert.equal((await handle(new Request('https://api.test',{method:'POST',headers:{Origin:'https://evil.example'},body:'{}'}))).status,403);
  assert.equal((await handle(new Request('https://api.test',{method:'POST',body:'not json'}))).status,400);
  assert.equal((await handle(new Request('https://api.test',{method:'GET'}))).status,405);
  const result=await handle(new Request('https://api.test',{method:'POST',headers:{Origin:config.siteOrigin},body:JSON.stringify({action:'bootstrap'})}));assert.equal(result.status,401);assert.match(result.headers.get('Cache-Control'),/no-store/);
});
test('public entry starts with a neutral loader and has no private course content or video source',async()=>{
  const html=await readFile(new URL('../index.html',import.meta.url),'utf8');assert.ok(!html.includes('Coming Soon'));assert.match(html,/<main id="academyHome"[^>]*hidden/);assert.match(html,/aria-busy="true"/);assert.match(html,/role="status"/);assert.ok(!html.includes('J1.mp4'));assert.ok(!html.includes('secretKey'));assert.ok(!html.includes('app.mjs'));assert.ok(!/<video[^>]*src=/.test(html));
});
test('home and common navigation expose the video section while preserving existing destinations',async()=>{
  const html=await readFile(new URL('../../index.html',import.meta.url),'utf8'),nav=await readFile(new URL('../../academy-assets/navigation.js',import.meta.url),'utf8');
  for(const path of ['/videoo/','/Academy-Exam/','/learning-studio/']){assert.ok(html.includes(path));assert.ok(nav.includes(path));}
});
