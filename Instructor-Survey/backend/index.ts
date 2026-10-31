import {createApi,createStore,createHandler,syncResponse} from './core.mjs';
const url=Deno.env.get('SUPABASE_URL')!;
const key=JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')||'{}').default||Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const origins=['https://mofid-academy.github.io'];
let cached:{handler:(r:Request)=>Promise<Response>;expires:number}|null=null;
async function handler(){
  if(cached&&cached.expires>Date.now())return cached.handler;
  const headers:Record<string,string>={apikey:key,'Content-Type':'application/json'};if(key.startsWith('eyJ'))headers.Authorization='Bearer '+key;
  const r=await fetch(url+'/rest/v1/rpc/zr_runtime_config',{method:'POST',headers,body:'{}',signal:AbortSignal.timeout(10000)});
  if(!r.ok)throw Error('Management configuration unavailable');
  const config=await r.json(),db=createStore({url,key});
  const schedule=(id:string)=>{EdgeRuntime.waitUntil(syncResponse(db,id).catch(()=>{}));};
  cached={handler:createHandler(createApi({db,config,schedule}),{origins}),expires:Date.now()+60000};return cached.handler;
}
Deno.serve(async(req:Request)=>{try{return await(await handler())(req);}catch{return Response.json({ok:false,message:'ارتباط با سامانه برقرار نشد؛ دوباره تلاش کنید.'},{status:503,headers:{'Access-Control-Allow-Origin':origins.includes(req.headers.get('origin')||'')?req.headers.get('origin')!:origins[0],'Vary':'Origin','Cache-Control':'no-store'}});}});
