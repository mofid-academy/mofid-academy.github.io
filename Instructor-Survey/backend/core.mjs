import {createHash,createHmac,timingSafeEqual} from 'node:crypto';
import {Buffer} from 'node:buffer';
import {SCORE_QUESTIONS,SURVEY_ID,DEFAULT_CATALOG} from '../questions.mjs';
export class ApiError extends Error{constructor(message,status=400){super(message);this.status=status;}}
const fail=(m,s=400)=>{throw new ApiError(m,s);};
const hash=v=>createHash('sha256').update(v).digest('hex');
const equal=(a,b)=>{const x=Buffer.from(String(a)),y=Buffer.from(String(b));return x.length===y.length&&timingSafeEqual(x,y);};
const uuid=v=>{if(typeof v!=='string'||!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(v))fail('شناسهٔ پاسخ معتبر نیست.');return v.toLowerCase();};
const clean=(v,max,required=false)=>{if(v==null)v='';if(typeof v!=='string'||v.length>max||v.includes('\0'))fail('طول یا نوع یکی از فیلدها معتبر نیست.');v=v.trim();if(required&&!v)fail('مشخصات الزامی را کامل کنید.');return v;};
export function normalizeSubmission(data){
  if(!data||typeof data!=='object'||Array.isArray(data)||data.survey_id!==SURVEY_ID)fail('نسخهٔ پرسشنامه معتبر نیست. صفحه را تازه کنید.');
  if(!DEFAULT_CATALOG.some(c=>c.id===data.academy))fail('دوره معتبر نیست.');
  const out={id:uuid(data.id),academy:data.academy,organizational_name:clean(data.organizational_name,120,true),instructor_name:clean(data.instructor_name,140,true),course_title:clean(data.course_title,200,data.academy!=='19')};
  for(const q of SCORE_QUESTIONS){const value=data.answers?.[q.code];if(!Number.isInteger(value)||value<1||value>5)fail('برای هر پنج سؤال امتیاز ۱ تا ۵ انتخاب کنید.');out[q.code]=value;}
  out.feedback=clean(data.answers?.feedback,2000);
  if(!Number.isInteger(data.duration_seconds)||data.duration_seconds<0||data.duration_seconds>86400)fail('زمان پاسخ‌گویی معتبر نیست.');
  out.duration_seconds=data.duration_seconds;out.source_url='';
  if(data.source_url){try{const u=new URL(clean(data.source_url,500));if(!['https:','http:'].includes(u.protocol))fail('نشانی منبع معتبر نیست.');out.source_url=u.origin+u.pathname;}catch{fail('نشانی منبع معتبر نیست.');}}
  return out;
}
export const fingerprint=data=>hash(JSON.stringify(data));
export function normalizeFilters(data={}){
  if(!data||typeof data!=='object'||Array.isArray(data))fail('فیلترها معتبر نیستند.');const out={};
  for(const k of ['academy','instructor_name','course_title','team_name','search'])if(data[k])out[k]=clean(data[k],200);
  if(out.academy&&!DEFAULT_CATALOG.some(c=>c.id===out.academy))fail('دورهٔ فیلتر معتبر نیست.');
  for(const k of ['from','to'])if(data[k]){const v=data[k];if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v)||!Number.isFinite(Date.parse(v))||new Date(v).toISOString().slice(0,10)!==v)fail('تاریخ میلادی معتبر وارد کنید.');out[k]=v;}
  if(out.from&&out.to&&out.from>out.to)fail('تاریخ پایان باید پس از تاریخ شروع باشد.');
  for(const k of ['min_score','max_score'])if(data[k]!==undefined&&data[k]!==''){const n=Number(data[k]);if(!Number.isFinite(n)||n<1||n>5)fail('فیلتر امتیاز باید بین ۱ تا ۵ باشد.');out[k]=n;}
  if(out.min_score&&out.max_score&&out.min_score>out.max_score)fail('بازهٔ امتیاز معتبر نیست.');
  if(data.comment==='yes')out.comment='yes';
  if(data.sync_status){if(!['pending','sent','failed'].includes(data.sync_status))fail('وضعیت همگام‌سازی معتبر نیست.');out.sync_status=data.sync_status;}
  if(data.snapshot){if(typeof data.snapshot!=='string'||!Number.isFinite(Date.parse(data.snapshot)))fail('زمان گزارش معتبر نیست.');out.snapshot=new Date(data.snapshot).toISOString();}
  if(data.is_test===true)out.is_test=true;
  return out;
}
export function normalizeCatalog(catalog){
  if(!Array.isArray(catalog)||catalog.length!==DEFAULT_CATALOG.length)fail('هر سه دوره باید در فهرست باشند.');
  return DEFAULT_CATALOG.map(base=>{const c=catalog.find(c=>c?.id===base.id);if(!c||typeof c.is_open!=='boolean')fail('تنظیمات دوره معتبر نیست.');
    const list=k=>{if(!Array.isArray(c[k])||c[k].length>200)fail('فهرست مدرس یا کلاس معتبر نیست.');return [...new Set(c[k].map(v=>clean(v,k==='classes'?200:140,true)))];};
    return {id:base.id,label:clean(c.label,100,true),team_name:clean(c.team_name,100,true),is_open:c.is_open,class_required:base.id!=='19',instructors:list('instructors'),classes:list('classes')};});
}
export function createApi({db,config,now=Date.now,schedule=()=>{}}){
  const username=String(config.adminUsername||'').toLowerCase();if(!username||!config.signingKey||!/^[a-f0-9]{64}$/.test(config.adminKeyHash||''))throw Error('Management configuration unavailable');
  const epoch=()=>Math.floor(now()/1000);
  function sign(){const p=Buffer.from(JSON.stringify({kind:'instructor-survey-admin',username,exp:epoch()+7200})).toString('base64url');return 'is1.'+p+'.'+createHmac('sha256',config.signingKey).update('is1.'+p).digest('base64url');}
  function verify(token){if(typeof token!=='string'||token.length>4096)fail('برای ادامه وارد پنل مدیریت شوید.',401);const p=token.split('.');if(p.length!==3||p[0]!=='is1'||!equal(createHmac('sha256',config.signingKey).update(p[0]+'.'+p[1]).digest('base64url'),p[2]))fail('نشست مدیریت معتبر نیست.',401);let c;try{c=JSON.parse(Buffer.from(p[1],'base64url').toString());}catch{fail('نشست مدیریت معتبر نیست.',401);}if(c.kind!=='instructor-survey-admin'||c.username!==username||!Number.isInteger(c.exp)||c.exp<=epoch())fail('نشست شما پایان یافته است. دوباره وارد شوید.',401);return c;}
  async function gate(kind,ip,max,minutes){const key=createHmac('sha256',config.signingKey).update('instructor-survey:'+kind+':'+ip).digest('hex');if(!await db('rate',{p_key:key,p_max:max,p_window_minutes:minutes}))fail('تعداد تلاش‌ها زیاد است؛ کمی بعد تلاش کنید.',429);}
  return {sign,verify,async handle(body,{ip='unknown'}={}){
    if(!body||typeof body!=='object'||Array.isArray(body))fail('درخواست معتبر نیست.');
    const {action}=body;
    if(action==='health'){const s=await db('settings');return {ok:true,ready:!!s,version:'instructor-survey/2'};}
    if(action==='config'){const s=await db('settings');if(!s)fail('تنظیمات فرم در دسترس نیست.',503);return {ok:true,survey_id:SURVEY_ID,settings:{is_open:s.is_open,catalog:s.catalog}};}
    if(action==='admin_login'){await gate('login',ip,12,15);const secret=body.secret;if(typeof secret!=='string'||secret.length>256||clean(body.username,64).toLowerCase()!==username||!equal(hash(secret),config.adminKeyHash))fail('نام کاربری یا رمز مدیریت معتبر نیست.',401);return {ok:true,token:sign(),expires_at:new Date(now()+7200000).toISOString()};}
    if(action==='submit'||action==='admin_test_submit'){
      const test=action==='admin_test_submit';if(test)verify(body.token);await gate('submit',ip,120,60);
      const data=normalizeSubmission(body.data),result=await db('record',{p_payload:data,p_hash:fingerprint(data),p_test:test});
      if(result?.stored!==true||result.id!==data.id)fail('ذخیرهٔ پاسخ تأیید نشد. دوباره تلاش کنید.',503);
      if(!test&&!result.duplicate)schedule(result.id);return {ok:true,...result};
    }
    verify(body.token);
    if(action==='admin_list'){const page=body.page??0,limit=body.limit??25;if(!Number.isInteger(page)||page<0||page>10000000||!Number.isInteger(limit)||limit<1||limit>1000)fail('صفحه یا تعداد ردیف معتبر نیست.');return {ok:true,...await db('report',{p_filters:normalizeFilters(body.filters),p_page:page,p_limit:limit})};}
    if(action==='admin_settings')return {ok:true,settings:await db('settings')};
    if(action==='admin_settings_save'){if(typeof body.settings?.is_open!=='boolean')fail('وضعیت فرم معتبر نیست.');const catalog=normalizeCatalog(body.settings.catalog);return {ok:true,settings:await db('settings_save',{is_open:body.settings.is_open,catalog})};}
    if(action==='admin_delete'){const id=uuid(body.id);if(body.confirm!==true)fail('حذف پاسخ را تأیید کنید.');const rows=await db('delete',{id});if(rows.length!==1)fail('پاسخ پیدا نشد یا قبلاً حذف شده است.',404);return {ok:true,id,deleted:true};}
    if(action==='admin_retry_sync'){const id=uuid(body.id),rows=await db('sync_lookup',{id});if(!rows[0]||rows[0].is_test||rows[0].deleted_at)fail('پاسخ قابل همگام‌سازی نیست.');schedule(id);return {ok:true,queued:true};}
    fail('عملیات شناخته نشد.',404);
  }};
}
export function createStore({url,key,fetchImpl=fetch}){
  const headers={apikey:key,'Content-Type':'application/json'};if(key.startsWith('eyJ'))headers.Authorization='Bearer '+key;
  return async(action,data={})=>{
    let path,method='GET',body,prefer;
    if(action==='settings')path='/rest/v1/instructor_survey_settings?id=eq.main&select=is_open,catalog,updated_at';
    else if(action==='settings_save'){path='/rest/v1/instructor_survey_settings?id=eq.main&select=is_open,catalog,updated_at';method='PATCH';body={...data,updated_at:new Date().toISOString()};prefer='return=representation';}
    else if(action==='delete'){path='/rest/v1/instructor_survey_responses?id=eq.'+uuid(data.id)+'&deleted_at=is.null&select=id';method='PATCH';body={deleted_at:new Date().toISOString()};prefer='return=representation';}
    else if(action==='sync_lookup')path='/rest/v1/instructor_survey_responses?id=eq.'+uuid(data.id)+'&select=*';
    else if(action==='sync_update'){path='/rest/v1/instructor_survey_responses?id=eq.'+uuid(data.id);method='PATCH';body=data.update;}
    else{path='/rest/v1/rpc/'+({record:'instructor_survey_record',report:'instructor_survey_report',rate:'instructor_survey_check_rate'}[action]||'');if(path.endsWith('/'))throw Error('Unknown store operation');method='POST';body=data;}
    let r;try{r=await fetchImpl(url+path,{method,headers:{...headers,...(prefer?{Prefer:prefer}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(25000)});}catch{fail('ارتباط با پایگاه داده برقرار نشد.',503);}
    const result=r.status===204?null:await r.json();
    if(!r.ok){const msg=String(result?.message||'');if(msg.includes('SURVEY_CLOSED'))fail('پاسخ‌گویی این دوره پایان یافته است.',409);if(msg.includes('ID_CONFLICT'))fail('این شناسه قبلاً با اطلاعات دیگری ثبت شده است.',409);fail('ذخیره یا دریافت اطلاعات تأیید نشد. دوباره تلاش کنید.',503);}
    return ['settings','settings_save'].includes(action)?result[0]:result;
  };
}
export async function syncResponse(db,id,{fetchImpl=fetch,webhook='https://nazarsanjimofid.app.n8n.cloud/webhook/instructor-survey'}={}){
  const rows=await db('sync_lookup',{id}),row=rows[0];if(!row||row.is_test||row.deleted_at||row.sync_status==='sent')return;
  try{
    const payload={...row,submission_id:row.id,submitted_at:row.created_at};delete payload.request_hash;delete payload.deleted_at;delete payload.is_test;
    const r=await fetchImpl(webhook,{method:'POST',headers:{'Content-Type':'application/json','X-Idempotency-Key':row.id},body:JSON.stringify(payload),signal:AbortSignal.timeout(15000)});
    if(!r.ok)throw Error('HTTP '+r.status);await db('sync_update',{id,update:{sync_status:'sent',sync_error:'',synced_at:new Date().toISOString()}});
  }catch{await db('sync_update',{id,update:{sync_status:'failed',sync_error:'ارسال به گردش‌کار تأیید نشد؛ از پنل دوباره تلاش کنید.'}});}
}
export function createHandler(api,{origins}){
  return async request=>{
    const origin=request.headers.get('origin'),allowed=!origin||origins.includes(origin);
    const headers={'Content-Type':'application/json;charset=UTF-8','Access-Control-Allow-Origin':allowed?(origin||origins[0]):origins[0],'Access-Control-Allow-Methods':'POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type,Accept','Vary':'Origin','Cache-Control':'no-store,private','X-Content-Type-Options':'nosniff'};
    if(!allowed)return Response.json({ok:false,message:'مبدأ درخواست مجاز نیست.'},{status:403,headers});if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
    try{
      if(request.method!=='POST')fail('از فرم سامانه استفاده کنید.',405);
      const reader=request.body?.getReader();if(!reader)fail('درخواست خالی است.');const chunks=[];let size=0;
      try{while(true){const p=await reader.read();if(p.done)break;size+=p.value.length;if(size>131072){await reader.cancel();fail('حجم درخواست بیش از حد مجاز است.',413);}chunks.push(p.value);}}finally{reader.releaseLock();}
      let body;try{body=JSON.parse(Buffer.concat(chunks).toString());}catch{fail('درخواست معتبر نیست.');}
      return Response.json(await api.handle(body,{ip:request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown'}),{headers});
    }catch(e){return Response.json({ok:false,message:e instanceof ApiError?e.message:'سامانه موقتاً در دسترس نیست. دوباره تلاش کنید.'},{status:e instanceof ApiError?e.status:503,headers});}
  };
}
