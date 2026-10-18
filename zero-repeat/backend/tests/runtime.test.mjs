import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const settings={siteOrigin:'https://mofid-academy.github.io',siteUrl:'https://mofid-academy.github.io/zero-repetition/',adminUsername:'m.mirsheri',adminKeyHash:createHash('sha256').update('synthetic-administrator-key-123456789').digest('hex'),signingKey:'synthetic-runtime-signing-key-0123456789abcdef',sheetsWebhook:'',sheetsSyncKey:''};
const calls=[];let handler,offline=false;
globalThis.Deno={env:{get:name=>({SUPABASE_URL:'https://private-database.invalid',SUPABASE_SERVICE_ROLE_KEY:'eyJsynthetic-server-key'}[name])},serve:fn=>{handler=fn;}};
globalThis.fetch=async(url,options)=>{
 calls.push({url,options});
 assert.equal(options.headers.apikey,'eyJsynthetic-server-key');
 if(url.endsWith('/zr_runtime_config'))return offline?Response.json({message:'private upstream detail'},{status:500}):Response.json(settings);
 assert(url.endsWith('/zr_store'));assert.equal(JSON.parse(options.body).p_action,'health');return Response.json({ready:true});
};
await import('../supabase/functions/zero-repetition-api/index.ts?healthy');
const req=()=>new Request('https://api.invalid',{method:'POST',headers:{Origin:settings.siteOrigin},body:JSON.stringify({action:'health'})});
let result=await handler(req());assert.equal(result.status,200);assert.equal((await result.json()).apiVersion,'zero-repetition/3');console.log('PASS Edge bootstrap loads server configuration from private Vault RPC');
result=await handler(req());assert.equal(result.status,200);assert.equal(calls.filter(c=>c.url.endsWith('/zr_runtime_config')).length,1);console.log('PASS runtime configuration is cached only on the server');
const before=calls.length;result=await handler(new Request('https://api.invalid',{method:'OPTIONS'}));assert.equal(result.status,204);assert.equal(calls.length,before);console.log('PASS preflight needs no database or secret query');
offline=true;await import('../supabase/functions/zero-repetition-api/index.ts?offline');result=await handler(req());assert.equal(result.status,503);const body=await result.text();assert(!body.includes(settings.signingKey));assert(!body.includes('upstream'));console.log('PASS secret-store failure returns a redacted error');
console.log('PASS 4 Edge runtime checks');
