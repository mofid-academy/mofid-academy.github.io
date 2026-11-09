import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {makeHandler,digest} from '../backend/core.mjs';
import {ClassesPanel} from '../classes.mjs';
const code='TEST_MODERATOR_CLASS_LIFECYCLE_12345',owner='TEST_OWNER_CLASS_LIFECYCLE_12345';
const gone='cls-11111111-1111-4111-8111-111111111111',live='cls-22222222-2222-4222-8222-222222222222';
async function server({allDeleted=false}={}){
 const calls=[],root={host_key_hash:await digest(code),admin_key_hash:await digest(owner),round:1,title:'Root class',deleted_at:allDeleted?'2026-11-09T00:00:00Z':null};
 const handler=makeHandler({url:'https://db.invalid',key:'LIFECYCLE_PRIVATE_SERVER_KEY',fetcher:async(url,options={})=>{
  const body=options.body?JSON.parse(options.body):null;calls.push({url,body});
  if(url.includes('expo1405_rooms?id=eq.main'))return Response.json([root]);
  if(url.includes('expo1405_rooms?'))return Response.json([{title:'Deleted class',round:1,deleted_at:'2026-11-09T00:00:00Z'}]);
  if(url.includes('expo1405_limits?'))return Response.json([]);
  if(url.includes('expo1405_public?')||url.includes('expo1405_display?'))return Response.json([{payload:{room:gone,deleted:true,phase:'finished',question:null},revision:4}]);
  if(url.includes('/rpc/expo1405_classes'))return Response.json([{id:gone,title:'Deleted class',deletedAt:'2026-11-09T00:00:00Z'},...(!allDeleted?[{id:live,title:'Live class',deletedAt:null}]:[])]);
  if(url.includes('/rpc/expo1405_class_lifecycle')){
   if(body.p_action==='delete'&&body.p_confirm_title!=='Deleted class')return Response.json({message:'class_confirmation_required'},{status:400});
   return Response.json({ok:true,id:body.p_room,action:body.p_action});
  }
  if(url.includes('/rpc/expo1405_create_class'))return Response.json({id:live,title:'New class'});
  throw Error('Unexpected request');
 }});return{handler,calls};
}
function req(path,{auth=code,admin=false,body,display}={}){const headers={Origin:'https://mofid-academy.github.io'};if(auth)headers[admin?'X-Admin-Key':'X-Host-Key']=auth;if(display)headers['X-Display-Key']=display;return new Request('https://app.invalid/functions/v1/expo1405-api'+path+(path.includes('?')?'&':'?')+'class='+gone,{headers,method:body?'POST':'GET',body:body?JSON.stringify(body):undefined});}
test('class deletion requires an authenticated operator and an explicit matching title',async()=>{
 const{handler,calls}=await server();const body={classId:gone,action:'delete'};
 assert.equal((await handler(req('/host/class-lifecycle',{auth:null,body}))).status,401);
 assert.equal((await handler(req('/host/class-lifecycle',{body}))).status,409);
 assert(!calls.some(c=>c.url.includes('/rpc/expo1405_class_lifecycle')));
 assert.equal((await handler(req('/host/class-lifecycle',{body:{...body,confirmTitle:'Another class'}}))).status,409);
 const r=await handler(req('/host/class-lifecycle',{body:{...body,confirmTitle:'Deleted class'}}));assert.equal(r.status,200);
 assert.deepEqual(calls.at(-1).body,{p_room:gone,p_action:'delete',p_confirm_title:'Deleted class'});
});
test('deleted classes are separated from the active directory without exposing answers',async()=>{const{handler}=await server();const r=await handler(req('/host/classes')),data=await r.json();assert.equal(data.classes.length,1);assert.equal(data.trash.length,1);assert.equal(data.classes[0].id,live);assert.equal(data.trash[0].id,gone);assert(!JSON.stringify(data).includes('responses'));});
test('a deleted class public link returns 410 and never returns the old question',async()=>{const{handler}=await server();const r=await handler(req('/state',{auth:null}));assert.equal(r.status,410);assert(!('payload' in await r.json()));});
test('host login remains usable for recovery even when every class is deleted',async()=>{const{handler}=await server({allDeleted:true});const r=await handler(req('/host')),data=await r.json();assert.equal(r.status,200);assert.equal(data.directoryOnly,true);assert.deepEqual(data.questions,[]);const directory=await(await handler(req('/host/classes'))).json();assert.equal(directory.classes.length,0);assert.equal(directory.trash.length,1);assert.equal((await handler(req('/host/class-lifecycle',{body:{classId:gone,action:'restore'}}))).status,200);});
test('owner login remains usable for recovery from a deleted class',async()=>{const{handler}=await server({allDeleted:true});const r=await handler(req('/admin/session',{auth:owner,admin:true}));assert.equal(r.status,200);assert.equal((await r.json()).directoryOnly,true);assert.equal((await handler(req('/admin/export',{auth:owner,admin:true}))).status,410);});
test('operations on deleted classes cannot activate, rename or issue new display links',async()=>{const{handler,calls}=await server();for(const path of ['/host/action','/host/class-title','/host/display-token'])assert.equal((await handler(req(path,{body:{title:'Renamed'}}))).status,410);assert(!calls.some(c=>c.url.includes('/rpc/expo1405_host_action')));});
test('class recovery targets the chosen row, independently of the selected class',async()=>{const{handler,calls}=await server();for(const action of ['reopen','restore']){assert.equal((await handler(req('/host/class-lifecycle',{body:{classId:live,action}}))).status,200);assert.equal(calls.at(-1).body.p_room,live);}});
test('cancelling a delete dialog makes no API call',async()=>{const panel=Object.create(ClassesPanel.prototype);panel.busy=false;panel.confirm=async()=>false;panel.request=()=>{throw Error('Cancellation sent an API request');};await panel.lifecycle({id:gone,title:'Deleted class'},'delete');});
test('confirmed deletion carries the title and falls back to the directory when no classes remain',async()=>{const panel=Object.create(ClassesPanel.prototype),calls=[];Object.assign(panel,{busy:false,current:()=>gone,items:[],confirm:async(...args)=>{assert.deepEqual(args[2],{name:'Deleted class',label:'حذف پنل',danger:true});return true;},setBusy:()=>{},request:async(...a)=>calls.push(a),load:async()=>{},switchClass:async(...a)=>calls.push(a),render:()=>{},notify:()=>{}});await panel.lifecycle({id:gone,title:'Deleted class'},'delete');assert.equal(calls[0][1].body.confirmTitle,'Deleted class');assert.deepEqual(calls[1],[gone,true]);});
test('delete confirmation requires typing the exact class name; cancel and subsequent dialogs reset it',async()=>{
 const source=fs.readFileSync(new URL('../app.mjs',import.meta.url),'utf8'),code=source.slice(source.indexOf('function confirmAction('),source.indexOf('function openEditor('));
 const nodes=new Map(),classes={toggle:()=>{}};const $=selector=>{if(!nodes.has(selector))nodes.set(selector,{value:'',classList:classes,showModal(){this.open=true;},close(){this.open=false;}});return nodes.get(selector);};
 const confirm=Function('$','return ('+code.trim()+')')($),pending=confirm('Delete?','Preserved in trash',{name:'My class',label:'حذف پنل',danger:true});
 assert.equal($('#confirmYes').disabled,true);$('#confirmName').value='Wrong';$('#confirmName').oninput();$('#confirmYes').onclick();assert.equal($('#confirmDialog').open,true);
 $('#confirmName').value='My class';$('#confirmName').oninput();assert.equal($('#confirmYes').disabled,false);$('#confirmNo').onclick();assert.equal(await pending,false);
 const next=confirm('Continue?','Safe action');assert.equal($('#confirmYes').disabled,false);assert.equal($('#confirmName').value,'');$('#confirmYes').onclick();assert.equal(await next,true);
});
