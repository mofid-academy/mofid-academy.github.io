import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createApi,createHandler,createStore,normalizeEntry} from '../backend/core.mjs';
import {loadEntries} from '../api.mjs';
import {filterEntries,buildXlsx} from '../report.mjs';
import {unzipStored,decode} from '../../../Instructor-Survey/zip.mjs';

const id='3c8db20b-99af-4ea7-a111-cd610479f8cb';
const entry={full_name:'کاربر آزمایشی',username:'Example.Test',attendance_mode:'in_person'};
const secret='synthetic-test-secret-not-a-real-password';
const config={adminUsername:'test.admin',adminKeyHash:createHash('sha256').update(secret).digest('hex'),signingKey:'synthetic-signing-key-for-unit-tests-only'};
function fixture(){
  let now=Date.parse('2026-11-07T06:00:00Z');const calls=[],rows=new Map();
  const db=async(action,args)=>{calls.push({action,args});if(action==='rate')return {allowed:true};if(action==='health')return {ready:true};if(action==='submit'){const previous=rows.get(args.id);if(previous&&previous.fingerprint!==args.fingerprint)throw Error('ID_CONFLICT');rows.set(args.id,previous||args);return {stored:true,id:args.id,attendance_mode:args.attendance_mode,created_at:new Date(now).toISOString()};}if(action==='list')return {entries:[...rows.values()],total:rows.size,has_more:false,snapshot:new Date(now).toISOString()};if(action==='delete')return {id:args.id,deleted_at:new Date(now).toISOString()};throw Error(action);};
  return {api:createApi({db,config,now:()=>now}),db,calls,rows,advance:ms=>{now+=ms;}};
}
test('attendance is required, accepts only the two modes, and organizational name is optional',()=>{
  assert.deepEqual(normalizeEntry({...entry,username:''}),{...entry,username:''});
  assert.equal(normalizeEntry(entry).username,'example.test');
  assert.equal(normalizeEntry({...entry,attendance_mode:'online'}).attendance_mode,'online');
  for(const attendance_mode of [undefined,'','حضوری','both',null])assert.throws(()=>normalizeEntry({...entry,attendance_mode}));
  assert.throws(()=>normalizeEntry({...entry,full_name:' '}));assert.throws(()=>normalizeEntry({...entry,username:'person@example.test'}));
});
test('a retry keeps one record and the receipt confirms the exact ID and mode',async()=>{
  const f=fixture(),request={action:'submit',request_id:id,data:entry};
  const a=await f.api.handle(request),b=await f.api.handle(request);
  assert.equal(a.receipt.id,id);assert.deepEqual(a,b);assert.equal(f.rows.size,1);
  const api=createApi({db:async action=>action==='rate'?{allowed:true}:{stored:true,id:'wrong',attendance_mode:'online',created_at:new Date().toISOString()},config});
  await assert.rejects(api.handle(request),error=>error.status===503);
});
test('listing and deletion require a valid scoped, unexpired admin token and explicit delete confirmation',async()=>{
  const f=fixture();
  for(const action of ['admin_entries','admin_delete'])await assert.rejects(f.api.handle({action,id,confirm:true}),error=>error.status===401);
  assert.equal(f.calls.length,0);
  await assert.rejects(f.api.handle({action:'admin_login',username:'test.admin',secret:'incorrect'}),error=>error.status===401);
  const {token}=await f.api.handle({action:'admin_login',username:'TEST.ADMIN',secret});
  await f.api.handle({action:'admin_entries',token});
  await assert.rejects(f.api.handle({action:'admin_delete',token,id}),error=>error.status===400);
  assert.equal(f.calls.filter(c=>c.action==='delete').length,0);
  await f.api.handle({action:'admin_delete',token,id,confirm:true});
  assert.deepEqual(f.calls.find(c=>c.action==='delete').args,{id});
  await assert.rejects(f.api.handle({action:'admin_entries',token:token+'x'}),error=>error.status===401);
  await assert.rejects(f.api.handle({action:'admin_entries',token:token.replace('zra1.','zrc1.')}),error=>error.status===401);
  f.advance(7200001);await assert.rejects(f.api.handle({action:'admin_entries',token}),error=>error.status===401);
});
test('rate limiting uses a server hash, never stores raw IPs, and blocks writes',async()=>{
  const f=fixture();await f.api.handle({action:'submit',request_id:id,data:entry},{ip:'192.0.2.1'});
  const rate=f.calls.find(c=>c.action==='rate');assert.match(rate.args.key,/^[a-f0-9]{64}$/);assert.ok(!JSON.stringify(f.calls).includes('192.0.2.1'));
  const api=createApi({config,db:async()=>({allowed:false})});await assert.rejects(api.handle({action:'submit',request_id:id,data:entry}),error=>error.status===429);
});
test('HTTP rejects forbidden origins, oversized input and invalid JSON without writing',async()=>{
  const f=fixture(),handler=createHandler(f.api);
  const req=(body,origin='https://mofid-academy.github.io')=>new Request('https://example.test',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body});
  assert.equal((await handler(req('{}','https://wrong.example'))).status,403);
  assert.equal((await handler(req('x'.repeat(13000)))).status,413);
  assert.equal((await handler(req('{'))).status,400);assert.equal(f.calls.length,0);
  const r=await handler(req(JSON.stringify({action:'submit',request_id:id,data:entry})));assert.equal(r.status,200);assert.equal((await r.json()).receipt.id,id);
});
test('database adapter never acknowledges a failed storage write',async()=>{
  const store=createStore({url:'https://example.test',key:'sb_secret_synthetic',fetchImpl:async(_url,options)=>{assert.equal(options.headers.apikey,'sb_secret_synthetic');assert.equal(options.headers.Authorization,undefined);return Response.json({message:'storage unavailable'},{status:500});}});
  await assert.rejects(store('submit',{}),error=>error.status===503);
});
test('the report fetches every page using one snapshot and refuses incomplete or changed reports',async()=>{
  const snapshot='2026-11-07T06:00:00Z',all=Array.from({length:501},(_,i)=>({id:String(i),full_name:'نام '+i,username:'',attendance_mode:i%2?'online':'in_person'}));let count=0;
  const result=await loadEntries(async req=>{if(count++)assert.equal(req.snapshot,snapshot);const entries=all.slice(req.offset,req.offset+250);return {entries,total:all.length,snapshot,has_more:req.offset+250<all.length};},'test-token');assert.equal(result.length,501);assert.equal(count,3);
  await assert.rejects(loadEntries(async()=>({entries:all.slice(0,1),total:2,snapshot,has_more:false}),'test-token'));
  let page=0;await assert.rejects(loadEntries(async()=>({entries:[all[page++]],total:page===1?2:3,snapshot,has_more:page===1}),'test-token'));
});
test('mode/search filtering and Excel preserve user text without formulas',()=>{
  const entries=[{id,full_name:'علي كریمی',username:'Example.Test',attendance_mode:'in_person',created_at:'2026-11-07T06:00:00Z'},{id:'other',full_name:'=HYPERLINK("https://example.test")',username:'',attendance_mode:'online',created_at:'2026-11-07T06:01:00Z'}];
  assert.equal(filterEntries(entries,{query:'علی کریمی',mode:'in_person'}).length,1);assert.equal(filterEntries(entries,{mode:'online'})[0].id,'other');
  const files=unzipStored(buildXlsx(entries));const sheet=decode(files['xl/worksheets/sheet1.xml']);
  assert.match(sheet,/rightToLeft="1"/);assert.match(sheet,/حضوری/);assert.match(sheet,/آنلاین/);assert.match(sheet,/t="inlineStr"><is><t xml:space="preserve">=HYPERLINK/);assert.ok(!sheet.includes('<f>'));
});
