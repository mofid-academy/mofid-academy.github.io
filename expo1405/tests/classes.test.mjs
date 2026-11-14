import test from 'node:test';
import assert from 'node:assert/strict';
import {makeHandler,digest} from '../backend/core.mjs';
import {classUrl,roomStorageKey,roomFromUrl} from '../class-context.mjs';
const moderator='TEST_MODERATOR_FOR_ALL_CLASSES_12345',owner='TEST_OWNER_FOR_ALL_CLASSES_12345';
const a='cls-11111111-1111-4111-8111-111111111111',b='cls-22222222-2222-4222-8222-222222222222';
async function fixture(){
 const calls=[];const root={host_key_hash:await digest(moderator),admin_key_hash:await digest(owner),round:3,title:'Initial class'};
 const handler=makeHandler({url:'https://db.invalid',key:'SERVER_KEY_FOR_TEST',fetcher:async(url,options={})=>{
  const body=options.body?JSON.parse(options.body):null;calls.push({url,body});
  if(url.includes('expo1405_rooms?id=eq.main'))return Response.json([root]);
  if(url.includes('expo1405_rooms?id=eq.cls-'))return Response.json([{round:1,title:'Selected class'}]);
  if(url.includes('expo1405_limits?'))return Response.json([]);
  if(url.includes('expo1405_public?')||url.includes('expo1405_display?')){
   const room=url.includes(a)?a:b;return Response.json([{payload:{room,title:room,round:1,phase:'waiting',question:null,total:room===a?20:0,credits:room===a?[{name:'CLASS_A_ONLY'}]:[]},revision:1}]);
  }
  if(url.includes('/rpc/expo1405_classes'))return Response.json([{id:a,title:'Class A',phase:'finished',questionCount:6},{id:b,title:'Class B',phase:'waiting',questionCount:6}]);
  if(url.includes('/rpc/expo1405_reorder_classes'))return Response.json({ok:true});
  if(url.includes('/rpc/expo1405_create_class'))return Response.json({id:b,title:'Next class'});
  if(url.includes('/rpc/expo1405_vote'))return Response.json({choice:0,already:false});
  if(url.includes('/rpc/expo1405_admin_report'))return Response.json({title:body.p_room,selectedRound:1,exportedAt:new Date().toISOString(),questions:[],responses:[]});
  throw Error('Unexpected request');
 }});return {handler,calls};
}
function request(path,room,{admin,host,display,participant,body}={}){const headers={Origin:'https://mofid-academy.github.io'};if(admin)headers['x-admin-key']=admin;if(host)headers['x-host-key']=host;if(display)headers['x-display-key']=display;if(participant)headers['x-participant-token']=participant;return new Request('https://app.invalid/functions/v1/expo1405-api'+path+(path.includes('?')?'&':'?')+'class='+encodeURIComponent(room),{method:body?'POST':'GET',headers,body:body?JSON.stringify(body):undefined});}
test('each class has a distinct link and persisted participant/display identity',()=>{
 const first=classUrl('./',a,'https://mofid-academy.github.io/expo1405/host.html?class='+b),second=classUrl('./',b,first);
 assert.equal(roomFromUrl(first.href),a);assert.equal(roomFromUrl(second.href),b);assert.notEqual(first.href,second.href);
 assert.notEqual(roomStorageKey('person',a),roomStorageKey('person',b));assert.equal(roomStorageKey('expo1405-participant','main'),'expo1405-participant');
});
test('invalid class never falls back to the main class',async()=>{const {handler,calls}=await fixture();assert.equal((await handler(request('/state','unknown-class'))).status,404);assert.equal(calls.length,0);});
test('public class state is scoped and has no results',async()=>{const {handler}=await fixture();for(const room of[a,b]){const r=await handler(request('/state',room)),row=await r.json();assert.equal(r.status,200);assert.equal(row.payload.room,room);assert(!('credits' in row.payload));assert(!('total' in row.payload));}});
test('only authenticated operators see the class directory',async()=>{const {handler}=await fixture();assert.equal((await handler(request('/host/classes',a))).status,401);const r=await handler(request('/host/classes',a,{host:moderator})),data=await r.json();assert.equal(r.status,200);assert.equal(data.classes.length,2);assert(!JSON.stringify(data).includes('CLASS_A_ONLY'));});
test('class creation authenticates the root code and copies only selected source questions',async()=>{const {handler,calls}=await fixture();const r=await handler(request('/host/classes',a,{host:moderator,body:{title:'Class B',copyQuestions:true,closePrevious:true,requestId:'22222222-2222-4222-8222-222222222222'}}));assert.equal(r.status,200);const {body}=calls.find(c=>c.url.includes('/rpc/expo1405_create_class'));assert.deepEqual(body,{p_source:a,p_title:'Class B',p_copy:true,p_close_previous:true,p_request:'22222222-2222-4222-8222-222222222222'});assert(calls.some(c=>c.url.includes('rooms?id=eq.main')));});
test('a display token for one class cannot open another class',async()=>{const {handler}=await fixture();const issued=await handler(request('/host/display-token',a,{host:moderator,body:{}})),{token}=await issued.json();assert.equal((await handler(request('/display/state',a,{display:token}))).status,200);assert.equal((await handler(request('/display/state',b,{display:token}))).status,401);});
test('vote takes one authenticated RPC and is bound to the requested class',async()=>{const {handler,calls}=await fixture();const r=await handler(request('/vote',b,{participant:'PRIVATE_PARTICIPANT_TOKEN_FOR_CLASS_B_12345',body:{questionId:'33333333-3333-4333-8333-333333333333',round:1,choice:0}}));assert.equal(r.status,200);assert.equal(calls.length,1);assert.equal(calls[0].body.p_room,b);assert.equal(calls[0].body.p_hash.length,64);});
test('owner export is room-scoped and still denied to a moderator',async()=>{const {handler,calls}=await fixture();assert.equal((await handler(request('/admin/export',b,{host:moderator}))).status,403);const r=await handler(request('/admin/export',b,{admin:owner}));assert.equal(r.status,200);assert.equal(calls.find(c=>c.url.includes('/rpc/expo1405_admin_report')).body.p_room,b);assert(r.headers.get('Content-Disposition').includes(b));});

 test('panel ordering requires an operator and forwards both desired and expected order',async()=>{
 const {handler,calls}=await fixture();const body={order:[b,a],expectedOrder:[a,b]};
 assert.equal((await handler(request('/host/classes/order',a,{body}))).status,401);
 const r=await handler(request('/host/classes/order',a,{host:moderator,body}));assert.equal(r.status,200);
 const call=calls.find(c=>c.url.includes('/rpc/expo1405_reorder_classes'));assert.deepEqual(call.body,{p_order:[b,a],p_expected:[a,b]});
});
 test('duplicate and invalid panel ordering requests are rejected before the RPC',async()=>{
 const {handler,calls}=await fixture();for(const body of [{order:[a,a],expectedOrder:[a,b]},{order:[a,'foreign'],expectedOrder:[a,b]},{order:[b],expectedOrder:[a,b]}]){
 assert.equal((await handler(request('/host/classes/order',a,{host:moderator,body}))).status,400);}
 assert.equal(calls.filter(c=>c.url.includes('/rpc/expo1405_reorder_classes')).length,0);
});
