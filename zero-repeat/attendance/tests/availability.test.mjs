import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {normalizeCapacity,capacityView,fullCapacity,renderCapacity} from '../availability.mjs';
import {createApi,createHandler,createStore} from '../backend/core.mjs';
import {call} from '../api.mjs';

test('availability validates remaining seats at zero, fourteen, fifteen and legacy over-capacity counts',()=>{
  for(const registered of [0,14,15,16]){
    const state=normalizeCapacity({limit:15,registered,remaining:Math.max(0,15-registered),full:registered>=15});
    assert.equal(capacityView(state).disabled,registered>=15);
    assert.equal(state.remaining,Math.max(0,15-registered));
  }
  for(const value of [null,{}, {limit:15,registered:14,remaining:2,full:false},{limit:15,registered:15,remaining:0,full:false}])assert.throws(()=>normalizeCapacity(value));
});
function controls(){
  const classes=()=>({values:new Map(),toggle(name,on){this.values.set(name,on);}});
  return {radio:{checked:true,disabled:false},option:{classList:classes()},badge:{textContent:''},message:{textContent:'',hidden:true,classList:classes()},retry:{hidden:true,disabled:false}};
}
test('a full state disables and unchecks in-person attendance, displays online guidance, and reopens after a seat is freed',()=>{
  const c=controls();renderCapacity(c,fullCapacity());
  assert.equal(c.radio.disabled,true);assert.equal(c.radio.checked,false);assert.match(c.message.textContent,/آنلاین/);assert.equal(c.message.hidden,false);
  renderCapacity(c,normalizeCapacity({limit:15,registered:14,remaining:1,full:false}));
  assert.equal(c.radio.disabled,false);assert.equal(c.radio.checked,false);assert.equal(c.message.hidden,true);assert.match(c.badge.textContent,/۱/);
});
test('an uncertain submission keeps its selection so an idempotent retry is possible even after capacity fills',()=>{
  const c=controls();renderCapacity(c,fullCapacity(),{locked:true,hasPending:true});
  assert.equal(c.radio.checked,true);assert.equal(c.radio.disabled,true);
});
test('unknown capacity disables in-person attendance and offers a retry only after a failed check',()=>{
  const c=controls();renderCapacity(c,{status:'loading'});assert.equal(c.radio.disabled,true);assert.equal(c.retry.hidden,true);
  renderCapacity(c,{status:'error'});assert.equal(c.radio.disabled,true);assert.equal(c.retry.hidden,false);assert.match(c.message.textContent,/آنلاین/);
});
const config={adminUsername:'test.admin',adminKeyHash:createHash('sha256').update('synthetic').digest('hex'),signingKey:'synthetic-test-signing-key-at-least-32-characters'};
test('the public availability response exposes aggregate counts only',async()=>{
  const api=createApi({config,db:async action=>{assert.equal(action,'availability');return {registered:15,entries:[{full_name:'must never be exposed'}]};}});
  const result=await api.handle({action:'availability'});
  assert.deepEqual(result,{ok:true,capacity:{limit:15,registered:15,remaining:0,full:true}});
});
test('a database capacity conflict reaches the browser with a distinct code and an online alternative',async()=>{
  const db=createStore({url:'https://example.test',key:'sb_secret_synthetic',fetchImpl:async(_url,options)=>{
    const {p_action}=JSON.parse(options.body);
    return p_action==='rate'?Response.json({allowed:true}):Response.json({message:'IN_PERSON_FULL'},{status:400});
  }});
  const handler=createHandler(createApi({db,config}));
  await assert.rejects(call({action:'submit',request_id:'c9ab651f-851f-49e4-ad51-701eaa5a7250',data:{full_name:'آزمون ظرفیت',username:'test.user',attendance_mode:'in_person'}},async(url,options)=>handler(new Request(url,options))),error=>error.status===409&&error.code==='IN_PERSON_FULL'&&error.message.includes('آنلاین'));
});
