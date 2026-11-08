import test from 'node:test';
import assert from 'node:assert/strict';
import {makeHandler} from '../backend/core.mjs';
const origin='https://mofid-academy.github.io';
for(const [label,input,want] of [['old client',undefined,false],['string is not consent','true',false],['explicit opt-in',true,true]]){
  test('join privacy: '+label,async()=>{
    let received;
    const handler=makeHandler({url:'https://example.invalid',key:'server-test-key',fetcher:async(url,options)=>{
      if(url.endsWith('/rpc/expo1405_rate_limit'))return Response.json(true);
      if(url.endsWith('/rpc/expo1405_join_with_credits')){received=JSON.parse(options.body);return Response.json('test-participant');}
      throw Error('Unexpected request');
    }});
    const r=await handler(new Request('https://example.invalid/functions/v1/expo1405-api/join',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({name:'Private name',shareOnScreen:input})}));
    assert.equal(r.status,200);assert.equal(received.p_shared,want);assert.equal(received.p_name,'Private name');
  });
}
test('profile requires the participant token',async()=>{
  const handler=makeHandler({url:'https://example.invalid',key:'server-test-key',fetcher:async()=>{throw Error('Must not reach database');}});
  const r=await handler(new Request('https://example.invalid/functions/v1/expo1405-api/profile',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({name:'Someone else',shareOnScreen:true})}));
  assert.equal(r.status,401);
});
test('profile changes are bound to the authenticated participant hash',async()=>{
  let received;
  const handler=makeHandler({url:'https://example.invalid',key:'server-test-key',fetcher:async(url,options)=>{
    if(url.includes('expo1405_participants?'))return Response.json([{id:'owned-participant',display_name:'Private',share_on_screen:false}]);
    if(url.endsWith('/rpc/expo1405_profile')){received=JSON.parse(options.body);return Response.json({name:'Public',shareOnScreen:true});}
    throw Error('Unexpected request');
  }});
  const r=await handler(new Request('https://example.invalid/functions/v1/expo1405-api/profile',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','X-Participant-Token':'test-token-with-more-than-32-characters'},body:JSON.stringify({name:'Public',shareOnScreen:true,participantId:'not-owned'})}));
  assert.equal(r.status,200);assert.equal(received.p_shared,true);assert.equal(received.p_hash.length,64);assert(!('participantId' in received));
});
