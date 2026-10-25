import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
const require = createRequire(import.meta.url);
const transportPath = require.resolve('../../connection.js');
const requestId = 'abb69df1-6d18-4cba-a780-3638a4736f3c';
const origin = 'https://mofid-academy.github.io';
const config = {siteOrigin: origin, adminUsername:'synthetic', signingKey:'synthetic-signing-key-0123456789abcdef', adminKeyHash:createHash('sha256').update('synthetic-secret').digest('hex')};

function fixture(slug, respond) {
  delete require.cache[transportPath];
  const transport = require(transportPath);
  const calls = [];
  const primary = `https://siwmzffadbbhcyyppwzn.supabase.co/functions/v1/${slug}`;
  const secondary = `https://siwmzffadbbhcyyppwzn.functions.supabase.co/${slug}`;
  class Xhr {
    headers = {};
    open(method, url) {this.url=url;this.method=method;}
    setRequestHeader(key,value) {this.headers[key]=value;}
    getResponseHeader() {return this.contentType;}
    abort() {this.aborted=true;this.onabort?.();}
    send(payload) {
      const body=JSON.parse(new URLSearchParams(payload).get('payload'));
      const call={mode:'xhr',url:this.url,payload,body,headers:this.headers,credentials:this.withCredentials};calls.push(call);
      Promise.resolve().then(()=>respond(call)).then(async response=>{
        if(this.aborted)return;
        this.status=response.status;this.responseURL=this.url;this.contentType=response.headers.get('content-type');
        this.response=this.responseType==='blob'?await response.blob():await response.text();this.onload();
      },()=>{if(!this.aborted)this.onerror();});
    }
  }
  const fetchImpl=async(url,options)=>{
    const call={mode:'fetch',url,payload:options.body,body:JSON.parse(options.body),headers:options.headers,credentials:options.credentials};calls.push(call);
    return respond(call);
  };
  const options={xhrFactory:Xhr,fetchImpl,readActions:['health','admin_login','admin_entries','survey_get'],writeActions:slug==='zero-repetition-api'?['participant_start','survey_save']:['submit']};
  return {calls,primary,secondary,call:(body,extra={})=>transport.call(primary,body,{...options,...extra})};
}
const ok=()=>Response.json({ok:true,ready:true});
for(const slug of ['zero-repetition-api','zero-repeat-challenges-api']) {
  const isSurvey=slug==='zero-repetition-api';
  const module=await import(pathToFileURL(new URL(`../supabase/functions/${slug}/core.mjs`,import.meta.url).pathname));
  const payload={action:isSurvey?'survey_save':'submit',request_id:requestId,data:{full_name:'نام فارسی + & =',accepted:true}};
  test(`${slug}: ordinary XHR form POST works when fetch is unavailable`,async()=>{
    const app=fixture(slug,call=>{assert.equal(call.mode,'xhr');return ok();});
    assert.equal((await app.call(payload)).ok,true);assert.equal(app.calls.length,1);assert.equal(app.calls[0].credentials,false);
    assert.deepEqual(module.parseRequestBody(app.calls[0].payload,app.calls[0].headers['Content-Type']),payload);
  });
  test(`${slug}: a lost response retries with the identical ID and data`,async()=>{
    const records=new Map();
    const app=fixture(slug,call=>{
      const encoded=JSON.stringify(call.body);if(records.has(call.body.request_id))assert.equal(records.get(call.body.request_id),encoded);else records.set(call.body.request_id,encoded);
      if(call.mode==='xhr')throw new TypeError('XHR blocked');
      return Response.json({ok:true,receipt:{id:call.body.request_id}});
    });
    assert.equal((await app.call(payload)).receipt.id,requestId);assert.equal(records.size,1);assert.equal(app.calls.length,3);
  });
  test(`${slug}: authentication and destructive requests never replay`,async()=>{
    for(const body of [{action:'admin_login'},{action:'admin_delete',id:requestId},{action:payload.action}]) {
      const app=fixture(slug,()=>{throw new TypeError('Unavailable');});
      if(body.action==='admin_login') {
        const denied=fixture(slug,()=>Response.json({ok:false,code:'ACCESS_DENIED'},{status:401}));
        await assert.rejects(denied.call(body),e=>e.status===401);assert.equal(denied.calls.length,1);
      } else {await assert.rejects(app.call(body));assert.equal(app.calls.length,1);}
    }
  });
  test(`${slug}: failure of both APIs and transports never reports success`,async()=>{
    const app=fixture(slug,()=>{throw new TypeError('Unavailable');});
    await assert.rejects(app.call(payload),e=>e.code==='NETWORK_UNREACHABLE');assert.equal(app.calls.length,4);
  });
  test(`${slug}: health selects the functioning transport for later requests`,async()=>{
    const app=fixture(slug,call=>{if(call.mode==='xhr')throw new TypeError('XHR unavailable');return ok();});
    assert.equal((await app.call({action:'health'})).ready,true);
    await app.call(payload);assert.equal(app.calls.at(-1).mode,'fetch');
  });
  test(`${slug}: server accepts both encodings, preserves CORS and validates before storage`,async()=>{
    let storageCalls=0;
    const api=(isSurvey?module.createApi:module.createChallengeApi)({config,db:async action=>{storageCalls++;assert.equal(action,'health');return {ready:true};}});
    const handler=module.createHttpHandler(api,origin);
    for(const type of ['text/plain;charset=UTF-8','application/x-www-form-urlencoded;charset=UTF-8']) {
      const health=JSON.stringify({action:'health'});
      const encode=value=>type.startsWith('application/x')?new URLSearchParams({payload:value}).toString():value;
      const response=await handler(new Request('https://api.invalid',{method:'POST',headers:{origin,'content-type':type},body:encode(health)}));
      assert.equal(response.status,200);assert.equal((await response.json()).ready,true);assert.equal(response.headers.get('access-control-allow-origin'),origin);
      const before=storageCalls;
      const bad=await handler(new Request('https://api.invalid',{method:'POST',headers:{origin,'content-type':type},body:encode(JSON.stringify({action:isSurvey?'participant_start':'submit',request_id:requestId,data:{}}))}));
      assert.equal(bad.status,400);assert.equal(storageCalls,before);
      const alien=await handler(new Request('https://api.invalid',{method:'POST',headers:{origin:'https://untrusted.invalid','content-type':type},body:encode(health)}));
      assert.equal(alien.status,403);assert.equal(storageCalls,before);
    }
    assert.throws(()=>module.parseRequestBody('payload=%7B%7D&payload=%7B%7D','application/x-www-form-urlencoded'));
  });
}
test('Excel downloads still validate the actual file signature',async()=>{
  const app=fixture('zero-repetition-api',()=>new Response(new Uint8Array([80,75,3,4,0]),{headers:{'Content-Type':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}}));
  assert.equal((await app.call({action:'admin_entries'},{binary:true})).size,5);
  const bad=fixture('zero-repetition-api',()=>new Response('invalid',{headers:{'Content-Type':'application/octet-stream'}}));
  await assert.rejects(bad.call({action:'admin_entries'},{binary:true}),/فایل اکسل معتبر/);
});

