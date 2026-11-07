import {createApi,createStore,createHandler} from './core.mjs';
const origin='https://mofid-academy.github.io';
const url=Deno.env.get('SUPABASE_URL')!;
const key=JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')||'{}').default||Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
let cached:{handler:(request:Request)=>Promise<Response>;expires:number}|null=null;
async function handler(){
  if(cached&&cached.expires>Date.now())return cached.handler;
  const headers:Record<string,string>={apikey:key,'Content-Type':'application/json'};if(key.startsWith('eyJ'))headers.Authorization='Bearer '+key;
  const response=await fetch(url+'/rest/v1/rpc/zr_runtime_config',{method:'POST',headers,body:'{}',signal:AbortSignal.timeout(10000)});
  if(!response.ok)throw Error('Private configuration unavailable');
  const config=await response.json();
  cached={handler:createHandler(createApi({db:createStore({url,key}),config}),{origin}),expires:Date.now()+60000};return cached.handler;
}
Deno.serve(async(request:Request)=>{
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type, Accept','Vary':'Origin'}});
  try{return await(await handler())(request);}
  catch{return Response.json({ok:false,message:'ارتباط با سامانه برقرار نشد؛ دوباره تلاش کنید.'},{status:503,headers:{'Access-Control-Allow-Origin':origin,'Vary':'Origin','Cache-Control':'no-store, private'}});}
});
