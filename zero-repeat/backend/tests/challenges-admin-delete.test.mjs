import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createChallengeApi,createHttpHandler,createPostgresStore} from '../supabase/functions/zero-repeat-challenges-api/core.mjs';

const first='4a2d2361-101e-4cf5-b664-5ea89c416d45';
const second='a2e63876-9aa4-4b2b-9ec0-83f8599e71a7';
const secret='synthetic-admin-secret-for-tests-only';
const config={siteOrigin:'https://mofid-academy.github.io',adminUsername:'qa.admin',signingKey:'synthetic-signing-key-for-unit-tests-only',adminKeyHash:createHash('sha256').update(secret).digest('hex')};
const make=()=>{
  const rows=new Map([[first,{id:first,username:'same.user',challenge_id:1}],[second,{id:second,username:'same.user',challenge_id:2}]]),calls=[];
  const db=async(action,data)=>{
    calls.push({action,data});
    if(action==='rate_limit')return {allowed:true};
    if(action==='delete'){
      const row=rows.get(data.id);assert(row);
      row.deleted_at||='2026-10-25T08:00:00.000Z';
      return {id:row.id,deleted_at:row.deleted_at};
    }
    if(action==='list')return {entries:[...rows.values()].filter(row=>!row.deleted_at),total:[...rows.values()].filter(row=>!row.deleted_at).length,has_more:false};
    throw new Error('Unexpected operation: '+action);
  };
  const api=createChallengeApi({db,config});
  const login=()=>api.handle({action:'admin_login',username:config.adminUsername,secret});
  return {api,rows,calls,login};
};
test('deletion requires a valid challenge administrator token before storage access',async()=>{
  const {api,calls}=make();
  for(const token of [undefined,'invalid','zr2.synthetic-participant-token'])await assert.rejects(api.handle({action:'admin_delete',token,id:first}),e=>e.code==='ACCESS_DENIED'&&e.status===401);
  assert.equal(calls.length,0);
});
test('administrator removes one registration while another registration for the same username remains',async()=>{
  const {api,rows,login}=make(),{token}=await login();
  const deleted=await api.handle({action:'admin_delete',token,id:first});
  assert.equal(deleted.deleted.id,first);assert(rows.get(first).deleted_at);assert(!rows.get(second).deleted_at);
  const page=await api.handle({action:'admin_entries',token});
  assert.deepEqual(page.entries.map(row=>row.id),[second]);assert.equal(page.total,1);
  assert.deepEqual(await api.handle({action:'admin_delete',token,id:first}),deleted);
});
test('invalid IDs, forged tokens and expired sessions cannot delete',async()=>{
  const {api,calls,login}=make(),{token}=await login();
  for(const id of ['same.user','',first+'bad'])await assert.rejects(api.handle({action:'admin_delete',token,id}),e=>e.code==='INVALID_ID');
  await assert.rejects(api.handle({action:'admin_delete',token:token.slice(0,-1)+'!',id:first}),e=>e.status===401);
  const expired=createChallengeApi({db:async()=>{throw new Error('Must not access storage');},config,now:()=>Date.now()+3*60*60*1000});
  await assert.rejects(expired.handle({action:'admin_delete',token,id:first}),e=>e.status===401);
  assert.equal(calls.filter(call=>call.action==='delete').length,0);
});
test('storage errors and an unconfirmed deletion never return a success receipt',async()=>{
  const {login}=make(),{token}=await login();
  const broken=createChallengeApi({config,db:async()=>({id:second,deleted_at:'invalid'})});
  await assert.rejects(broken.handle({action:'admin_delete',token,id:first}),e=>e.code==='DELETE_UNCONFIRMED');
  const offline=createHttpHandler(createChallengeApi({config,db:async()=>{throw new Error('private upstream detail');}}),config.siteOrigin);
  const response=await offline(new Request('https://api.invalid',{method:'POST',headers:{Origin:config.siteOrigin},body:JSON.stringify({action:'admin_delete',token,id:first})}));
  assert.equal(response.status,503);assert(!(await response.text()).includes('private upstream'));
});
test('deleted IDs and missing registrations have distinct recoverable error codes',async()=>{
  for(const [message,code,status] of [['CHALLENGE_ENTRY_DELETED','ENTRY_DELETED',410],['CHALLENGE_ENTRY_NOT_FOUND','ENTRY_NOT_FOUND',404]]){
    const store=createPostgresStore({url:'https://database.invalid',key:'synthetic-server-key',fetchImpl:async()=>Response.json({message},{status:400})});
    await assert.rejects(store('delete',{id:first}),error=>error.code===code&&error.status===status);
  }
});
