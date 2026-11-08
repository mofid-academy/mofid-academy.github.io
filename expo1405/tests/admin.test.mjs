import test from 'node:test';
import assert from 'node:assert/strict';
import {makeHandler,digest,withoutResults} from '../backend/core.mjs';
import {buildWorkbook} from '../backend/excel.mjs';
const host='TEST_MODERATOR_KEY_123456789',owner='TEST_OWNER_KEY_987654321';
const q='11111111-1111-4111-8111-111111111111';
const snapshot={payload:{room:'main',total:1,participants:1,credits:[{id:'private-vote',name:'PRIVATE_NAME',answer:'PRIVATE_ANSWER'}],question:{id:q,text:'Question',options:[{label:'A',index:0,count:1}]}},revision:1};
const fixture={title:'Private report',selectedRound:1,exportedAt:'2026-11-08T12:00:00Z',questions:[{id:q,text:'First question',position:1},{id:'q2',text:'Empty question',position:2}],responses:[{id:'vote1',round:1,participant_id:'person1',question_id:q,display_name:'=HYPERLINK("https://example.invalid")',question_text:'Original question',option_text:'PRIVATE_ANSWER',created_at:'2026-11-08T12:00:00Z'}]};
async function server(){
 const hashes={host_key_hash:await digest(host),admin_key_hash:await digest(owner),round:1,title:'test'};const calls=[];
 const handler=makeHandler({url:'https://db.invalid',key:'private-server-test-key',fetcher:async(url,options={})=>{
  calls.push(url);
  if(url.includes('expo1405_rooms?'))return Response.json([hashes]);
  if(url.includes('expo1405_limits?'))return Response.json([]);
  if(url.includes('/rpc/expo1405_rate_limit'))return Response.json(true);
  if(url.includes('/rpc/expo1405_admin_report'))return Response.json(fixture);
  if(url.includes('/rpc/expo1405_admin_summary'))return Response.json({private:'OWNER_ONLY'});
  if(url.includes('/rpc/expo1405_admin_responses'))return Response.json({responses:fixture.responses});
  if(url.includes('/rpc/expo1405_host_action'))return Response.json(snapshot.payload);
  if(url.includes('expo1405_questions?'))return Response.json([{id:q,text:'Question',options:['A','B']}]);
  if(url.includes('expo1405_votes?'))return Response.json([{question_id:q}]);
  if(url.includes('expo1405_public?')||url.includes('expo1405_display?'))return Response.json([snapshot]);
  throw Error('Unexpected request '+url);
 }});
 return {handler,calls};
}
function request(path,{admin,moderator,display,method='GET'}={}){const headers={Origin:'https://mofid-academy.github.io'};if(admin)headers['X-Admin-Key']=admin;if(moderator)headers['X-Host-Key']=moderator;if(display)headers['X-Display-Key']=display;return new Request('https://app.invalid/functions/v1/expo1405-api'+path,{method,headers,body:method==='POST'?'{}':undefined});}
for(const path of ['/admin/summary','/admin/responses','/admin/export','/host/export'])test('moderator cannot read '+path,async()=>{const {handler,calls}=await server();const r=await handler(request(path,{moderator:host}));assert.equal(r.status,403);assert.equal(calls.length,0);});
test('incorrect owner key is rejected',async()=>{const {handler}=await server();const r=await handler(request('/admin/export',{admin:'INCORRECT_OWNER_KEY_12345'}));assert.equal(r.status,401);assert(!(await r.text()).includes('PRIVATE_ANSWER'));});
test('owner can download a real Excel workbook',async()=>{const {handler}=await server();const r=await handler(request('/admin/export',{admin:owner}));assert.equal(r.status,200);assert.match(r.headers.get('Content-Type'),/spreadsheetml/);assert.match(r.headers.get('Cache-Control'),/no-store/);const bytes=new Uint8Array(await r.arrayBuffer());assert.deepEqual([...bytes.slice(0,2)],[80,75]);const text=new TextDecoder().decode(bytes);assert(text.includes('xl/worksheets/sheet3.xml'));assert(!text.includes('<f>'));assert(text.includes('PRIVATE_ANSWER'));});
test('public and moderator state never contains results',async()=>{const {handler}=await server();for(const [path,auth] of [['/state',{}],['/host',{moderator:host}]]){const r=await handler(request(path,auth)),body=await r.json();assert.equal(r.status,200);const s=JSON.stringify(body);assert(!s.includes('PRIVATE_NAME'));assert(!s.includes('PRIVATE_ANSWER'));assert(!Object.hasOwn(body.payload,'total'));assert(!Object.hasOwn(body.payload.question.options[0],'count'));}});
test('moderator actions cannot return aggregate results',async()=>{const {handler}=await server();const r=await handler(request('/host/action',{moderator:host,method:'POST'})),body=await r.json();assert.equal(r.status,200);assert(!('total' in body.payload));assert(!('credits' in body.payload));});
test('only a moderator-issued display token opens real display results',async()=>{const {handler}=await server();assert.equal((await handler(request('/display/state'))).status,401);const issued=await handler(request('/host/display-token',{moderator:host,method:'POST'}));assert.equal(issued.status,200);const {token}=await issued.json();const r=await handler(request('/display/state',{display:token}));assert.equal(r.status,200);assert((await r.text()).includes('PRIVATE_ANSWER'));assert.equal((await handler(request('/display/state',{display:'invalid-display-token'}))).status,401);});
test('sanitization preserves question labels without mutating authorized state',()=>{const safe=withoutResults(snapshot);assert.equal(safe.payload.question.options[0].label,'A');assert.equal(snapshot.payload.total,1);assert.equal(snapshot.payload.question.options[0].count,1);});
test('workbook includes empty questions and treats all respondent text as text',()=>{const bytes=buildWorkbook(fixture),text=new TextDecoder().decode(bytes);assert(text.includes('Empty question'));assert(text.includes('rightToLeft="1"'));assert(text.includes('Pinar-VF'));assert(!text.includes('<f>'));assert(text.includes('HYPERLINK'));});
