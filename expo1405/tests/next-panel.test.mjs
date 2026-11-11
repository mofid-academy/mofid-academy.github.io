import test from 'node:test';
import assert from 'node:assert/strict';
import {makeHandler,digest} from '../backend/core.mjs';
import {PanelContinuation} from '../continuation.mjs';
const room='cls-11111111-1111-4111-8111-111111111111',target='cls-22222222-2222-4222-8222-222222222222';
const endpoint='https://app.invalid/functions/v1/expo1405-api/next-panel?class='+room;
const token='SOURCE_PARTICIPANT_TOKEN_AT_LEAST_32_CHARS';
const req=(body,credential=token)=>new Request(endpoint,{method:body?'POST':'GET',headers:credential?{'X-Participant-Token':credential}:{},body:body?JSON.stringify(body):undefined});
test('next-panel metadata and handoff require a participant credential',async()=>{
 let calls=0;const handler=makeHandler({url:'https://db.invalid',key:'TEST_SERVER_KEY',fetcher:async()=>{calls++;throw Error('Unexpected access');}});
 assert.equal((await handler(req(null,null))).status,401);assert.equal((await handler(req({targetId:target},null))).status,401);assert.equal(calls,0);
});
test('metadata is scoped to the current panel and authenticated token hash',async()=>{
 let args;const handler=makeHandler({url:'https://db.invalid',key:'TEST_SERVER_KEY',fetcher:async(url,options)=>{assert(url.endsWith('/rpc/expo1405_next_panel'));args=JSON.parse(options.body);return Response.json({finished:true,nextPanel:{id:target,title:'Next'}});}});
 const r=await handler(req());assert.equal(r.status,200);assert.deepEqual(args,{p_room:room,p_hash:await digest(token)});assert.match(r.headers.get('Cache-Control'),/no-store/);
});
test('handoff uses a different stable token and ignores client-supplied name or scores',async()=>{
 const calls=[];const handler=makeHandler({url:'https://db.invalid',key:'TEST_SERVER_KEY',fetcher:async(url,options)=>{assert(url.endsWith('/rpc/expo1405_continue_panel'));calls.push(JSON.parse(options.body));return Response.json({room:target,id:'target-person',name:'SERVER NAME',usedExisting:false});}});
 const first=await(await handler(req({targetId:target,name:'SPOOFED',score:100,participantId:'victim'}))).json();
 const again=await(await handler(req({targetId:target}))).json();
 assert.equal(first.token,again.token);assert.notEqual(first.token,token);assert.equal(first.name,'SERVER NAME');assert.equal(calls[0].p_new_hash,await digest(first.token));assert.notEqual(calls[0].p_hash,calls[0].p_new_hash);assert.deepEqual(Object.keys(calls[0]).sort(),['p_existing_hash','p_hash','p_new_hash','p_room','p_target']);
});
test('an existing target token is returned only when verified by the server',async()=>{
 const existing='EXISTING_TARGET_TOKEN_AT_LEAST_32_CHARACTERS';let supplied;
 const handler=makeHandler({url:'https://db.invalid',key:'TEST_SERVER_KEY',fetcher:async(url,options)=>{supplied=JSON.parse(options.body);return Response.json({room:target,usedExisting:true});}});
 const result=await(await handler(req({targetId:target,existingToken:existing}))).json();assert.equal(result.token,existing);assert.equal(supplied.p_existing_hash,await digest(existing));
});
function control(){return{hidden:true,disabled:false,textContent:'',addEventListener(){}};}
test('the next control stays hidden until finish, then navigates using the verified handoff',async()=>{
 const root=control(),button=control(),label=control(),calls=[],navigation=[];let eligible=false;
 const c=new PanelContinuation({root,button,label,eligible:()=>eligible,request:async(path,options)=>{calls.push({path,options});return options?{room:target,token:'NEW_TOKEN'}:{finished:true,nextPanel:{id:target,title:'Next panel'}};},existingToken:()=>'',navigate:r=>navigation.push(r),notify:()=>{}});
 c.sync();assert(root.hidden);assert.equal(calls.length,0);
 eligible=true;await c.refresh(true);assert(!root.hidden);assert(!button.disabled);assert.equal(label.textContent,'Next panel');await c.continue();
 assert.equal(navigation.length,1);assert.deepEqual(calls[1].options.body,{targetId:target,existingToken:null});
});
test('duplicate taps send one request and a changed target does not navigate',async()=>{
 let finish;let calls=0;const root=control(),button=control(),label=control(),navigation=[];
 const c=new PanelContinuation({root,button,label,eligible:()=>true,request:async(path,options)=>{if(!options)return{finished:true,nextPanel:null};calls++;return new Promise(r=>finish=r);},existingToken:()=>'',navigate:r=>navigation.push(r),notify:()=>{}});c.target={id:target,title:'Next'};
 const pending=c.continue();await c.continue();assert.equal(calls,1);finish({room:room});await pending;assert.equal(navigation.length,0);assert(button.disabled);
});
