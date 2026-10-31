import {createApi,createStore,createHandler} from './core.mjs';
import {REPORT_TEMPLATE,LEGACY_REPORT_TEMPLATE} from './report-template.mjs';

const url=Deno.env.get('SUPABASE_URL')!;
const key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')||'{}').default;
const origins=['https://mofid-academy.github.io'];
let cached:{handler:(req:Request)=>Promise<Response>;expires:number}|null=null;
async function handler(){
  if(cached&&cached.expires>Date.now())return cached.handler;
  const headers:Record<string,string>={apikey:key,'Content-Type':'application/json'};
  if(key.startsWith('eyJ'))headers.Authorization='Bearer '+key;
  const r=await fetch(url+'/rest/v1/rpc/zr_runtime_config',{method:'POST',headers,body:'{}',signal:AbortSignal.timeout(10000)});
  if(!r.ok)throw Error('Management configuration unavailable');
  const config=await r.json();
  const h=createHandler(createApi({db:createStore({url,key}),config,templateBase64:REPORT_TEMPLATE,legacyTemplateBase64:LEGACY_REPORT_TEMPLATE}),{origins});
  cached={handler:h,expires:Date.now()+60000};return h;
}
Deno.serve(async(req:Request)=>{
  try{return await (await handler())(req);}catch{return Response.json({ok:false,message:'ارتباط با سامانه برقرار نشد؛ دوباره تلاش کنید.'},{status:503,headers:{'Access-Control-Allow-Origin':origins[0],'Cache-Control':'no-store'}});}
});
