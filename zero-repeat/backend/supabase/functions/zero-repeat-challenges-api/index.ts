import {createChallengeApi,createPostgresStore,createHttpHandler} from './core.mjs';

const origin='https://mofid-academy.github.io';
const url=Deno.env.get('SUPABASE_URL');
const key=JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')||'{}').default||Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
let cached:{handler:(request:Request)=>Promise<Response>,expires:number}|null=null;

async function runtimeHandler(){
  if(cached&&cached.expires>Date.now())return cached.handler;
  const headers:Record<string,string>={apikey:key,'Content-Type':'application/json'};
  if(key?.startsWith('eyJ'))headers.Authorization='Bearer '+key;
  // Read the existing protected configuration. Never update it or the survey.
  const response=await fetch(url+'/rest/v1/rpc/zr_runtime_config',{method:'POST',headers,body:'{}',signal:AbortSignal.timeout(10000)});
  if(!response.ok)throw new Error('Private runtime configuration unavailable');
  const config=await response.json();
  const handler=createHttpHandler(createChallengeApi({db:createPostgresStore({url,key}),config}),config.siteOrigin);
  cached={handler,expires:Date.now()+60000};return handler;
}

Deno.serve(async(request:Request)=>{
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type, Accept','Vary':'Origin'}});
  try{return await (await runtimeHandler())(request);}
  catch{return Response.json({ok:false,code:'SERVER_UNAVAILABLE',message:'ارتباط با سامانه برقرار نشد؛ دوباره تلاش کنید.'},{status:503,headers:{'Access-Control-Allow-Origin':origin,'Vary':'Origin','Cache-Control':'no-store, private, max-age=0'}});}
});

