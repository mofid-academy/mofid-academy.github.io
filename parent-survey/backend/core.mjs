import {createHash,createHmac,timingSafeEqual} from 'node:crypto';
import {Buffer} from 'node:buffer';
import {QUESTIONS,SURVEY_ID} from '../questions.mjs';

export class ApiError extends Error { constructor(message,status=400){super(message);this.status=status;} }
const fail=(message,status=400)=>{throw new ApiError(message,status);};
const hash=v=>createHash('sha256').update(v).digest('hex');
const equal=(a,b)=>{const x=Buffer.from(String(a)),y=Buffer.from(String(b));return x.length===y.length&&timingSafeEqual(x,y);};
function responseId(value){
  if(typeof value!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value))fail('شناسه پاسخ معتبر نیست.');
  return value.toLowerCase();
}
export function normalizeSubmission(data){
  if(!data||typeof data!=='object'||Array.isArray(data))fail('پاسخ‌ها معتبر نیستند.');
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(data.id||''))fail('شناسه پاسخ معتبر نیست.');
  if(data.survey_id!==SURVEY_ID)fail('نسخه پرسشنامه معتبر نیست. صفحه را تازه کنید.');
  const clean=(v,max)=>{if(v===undefined||v===null)return '';if(typeof v!=='string'||v.length>max||v.includes('\0'))fail('طول یا نوع یکی از فیلدها معتبر نیست.');return v.trim();};
  const answers={};
  for(const q of QUESTIONS){
    const v=data.answers?.[q.code];
    if(q.kind==='text'){answers[q.code]=clean(v,2000);continue;}
    if((v===undefined||v===null||v==='')&&!q.required){answers[q.code]=null;continue;}
    if(!q.options.some(o=>o.value===v))fail('پاسخ سؤال '+q.code+' را انتخاب کنید.');
    answers[q.code]=v;
  }
  const relationship=clean(data.relationship,20);
  if(!['','مادر','پدر','سرپرست'].includes(relationship))fail('نسبت با دانش‌آموز معتبر نیست.');
  if(!Number.isInteger(data.duration_seconds)||data.duration_seconds<0||data.duration_seconds>86400)fail('زمان پاسخ معتبر نیست.');
  const first_name=clean(data.first_name,80).replace(/\s+/g,' '),last_name=clean(data.last_name,80).replace(/\s+/g,' ');
  if(!first_name||!last_name)fail('نام و نام خانوادگی پاسخ‌دهنده را کامل وارد کنید. اگر این فیلدها را نمی‌بینید، صفحه را تازه کنید.');
  return {id:data.id,survey_id:SURVEY_ID,school:clean(data.school,120),grade:clean(data.grade,40),cohort:clean(data.cohort,120),relationship,duration_seconds:data.duration_seconds,answers,first_name,last_name};
}
// Keep existing response fingerprints stable when an older pending response gains a name.
// The database separately enforces that an already recorded name cannot be changed on retry.
export function submissionFingerprint(data){
  const {first_name,last_name,...response}=data;
  return hash(JSON.stringify(response));
}
export function normalizeFilters(f={}){
  if(!f||typeof f!=='object'||Array.isArray(f))fail('فیلترها معتبر نیستند.');
  const out={};
  for(const k of ['school','grade','cohort','relationship','search']){
    if(f[k]){if(typeof f[k]!=='string'||f[k].length>200)fail('فیلتر معتبر نیست.');out[k]=f[k].trim();}
  }
  for(const k of ['from','to'])if(f[k]){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(f[k])||!Number.isFinite(Date.parse(f[k])))fail('تاریخ را به قالب میلادی وارد کنید.');
    out[k]=f[k];
  }
  if(out.from&&out.to&&out.from>out.to)fail('تاریخ پایان باید پس از تاریخ آغاز باشد.');
  if(f.snapshot){if(typeof f.snapshot!=='string'||!Number.isFinite(Date.parse(f.snapshot)))fail('زمان گزارش معتبر نیست.');out.snapshot=new Date(f.snapshot).toISOString();}
  if(f.consent!==undefined&&f.consent!==''){if(!['true','false'].includes(f.consent))fail('فیلتر مجوز معتبر نیست.');out.consent=f.consent;}
  if(f.nps){if(!['promoter','passive','detractor'].includes(f.nps))fail('فیلتر توصیه معتبر نیست.');out.nps=f.nps;}
  if(f.comment==='yes')out.comment='yes';
  if(f.is_test===true)out.is_test=true;
  if(f.qcode){const q=QUESTIONS.find(q=>q.code===f.qcode&&q.kind!=='text');if(!q||!q.options.some(o=>String(o.value)===String(f.qvalue)))fail('گزینه فیلتر سؤال را انتخاب کنید.');out.qcode=q.code;out.qvalue=String(f.qvalue);}
  return out;
}
export function createApi({db,config,templateBase64='',now=Date.now}){
  const epoch=()=>Math.floor(now()/1000);
  const name=String(config.adminUsername||'').toLowerCase();
  if(!name||!config.signingKey||!/^[a-f0-9]{64}$/.test(config.adminKeyHash||''))throw Error('Management configuration unavailable');
  function sign(){
    const payload=Buffer.from(JSON.stringify({kind:'parent-survey-admin',username:name,exp:epoch()+7200})).toString('base64url');
    return 'ps1.'+payload+'.'+createHmac('sha256',config.signingKey).update('ps1.'+payload).digest('base64url');
  }
  function verify(token){
    if(typeof token!=='string'||token.length>4096)fail('برای ادامه وارد پنل مدیریت شوید.',401);
    const p=token.split('.');
    if(p.length!==3||p[0]!=='ps1'||!equal(createHmac('sha256',config.signingKey).update(p[0]+'.'+p[1]).digest('base64url'),p[2]))fail('نشست مدیریت معتبر نیست.',401);
    let c;try{c=JSON.parse(Buffer.from(p[1],'base64url').toString());}catch{fail('نشست مدیریت معتبر نیست.',401);}
    if(c.kind!=='parent-survey-admin'||c.username!==name||!Number.isInteger(c.exp)||c.exp<=epoch())fail('نشست شما پایان یافته است. دوباره وارد شوید.',401);
    return c;
  }
  const gate=async(kind,ip,max,minutes)=>{
    const key=createHmac('sha256',config.signingKey).update('parent-survey:'+kind+':'+ip).digest('hex');
    if(!await db('ps_rate_limit',{p_key:key,p_max:max,p_minutes:minutes}))fail('تعداد تلاش‌ها زیاد است؛ کمی بعد دوباره امتحان کنید.',429);
  };
  return {sign,verify,async handle(body,{ip='unknown'}={}){
    if(!body||typeof body!=='object'||Array.isArray(body))fail('درخواست معتبر نیست.');
    const {action}=body;
    if(action==='health')return {ok:true,version:'parent-survey/3',ready:Boolean(await db('settings'))};
    if(action==='config'){const c=await db('settings');return {ok:true,settings:{is_open:c.is_open,schools:c.schools,cohorts:c.cohorts},survey_id:SURVEY_ID};}
    if(action==='admin_login'){
      await gate('login',ip,12,15);
      const username=String(body.username||'').trim().toLowerCase(),secret=body.secret;
      if(typeof secret!=='string'||secret.length>256||username!==name||!equal(hash(secret),config.adminKeyHash))fail('نام کاربری یا رمز مدیریت معتبر نیست.',401);
      return {ok:true,token:sign(),username:name,expires_at:new Date(now()+7200000).toISOString()};
    }
    if(action==='submit'||action==='admin_test_submit'){
      const test=action==='admin_test_submit';if(test)verify(body.token);
      const data=normalizeSubmission(body.data);
      await gate('submit',ip,120,60);
      const result=await db('ps_record',{p_id:data.id,p_payload:data,p_hash:submissionFingerprint(data),p_test:test});
      if(result.stored!==true||result.id!==data.id)fail('ذخیره پاسخ تأیید نشد؛ دوباره تلاش کنید.',503);
      return {ok:true,...result};
    }
    verify(body.token);
    if(action==='admin_delete'){
      const id=responseId(body.id);
      if(body.confirm!==true)fail('حذف پاسخ را تأیید کنید.');
      const rows=await db('response_delete',{id});
      if(Array.isArray(rows)&&rows.length===0)fail('این پاسخ پیدا نشد؛ ممکن است قبلاً حذف شده باشد.',404);
      if(!Array.isArray(rows)||rows.length!==1||rows[0]?.id!==id)fail('حذف پاسخ تأیید نشد. فهرست را تازه‌سازی کنید.',503);
      return {ok:true,deleted:true,id};
    }
    if(action==='admin_template'){
      if(!templateBase64)fail('قالب خروجی در دسترس نیست. با مدیر سامانه تماس بگیرید.',503);
      return {ok:true,template:templateBase64};
    }
    if(action==='admin_list'){
      const page=body.page??0,limit=body.limit??25;
      if(!Number.isInteger(page)||page<0||!Number.isInteger(limit)||limit<1||limit>1000)fail('شماره صفحه معتبر نیست.');
      return {ok:true,...await db('ps_report',{p_filters:normalizeFilters(body.filters),p_page:page,p_limit:limit})};
    }
    if(action==='admin_settings')return {ok:true,settings:await db('settings')};
    if(action==='admin_settings_save'){
      if(typeof body.settings?.is_open!=='boolean')fail('وضعیت فرم معتبر نیست.');
      const lists={};for(const k of ['schools','cohorts']){
        const a=body.settings[k];if(!Array.isArray(a)||a.length>200||a.some(x=>typeof x!=='string'||x.length>120))fail('فهرست مدرسه یا دوره معتبر نیست.');
        lists[k]=[...new Set(a.map(x=>x.trim()).filter(Boolean))];
      }
      return {ok:true,settings:await db('settings_save',{...lists,is_open:body.settings.is_open})};
    }
    if(action==='admin_test_clear'){await db('test_clear');return {ok:true};}
    fail('عملیات شناخته نشد.',404);
  }};
}
export function createStore({url,key,fetchImpl=fetch}){
  const headers={apikey:key,'Content-Type':'application/json'};
  if(key.startsWith('eyJ'))headers.Authorization='Bearer '+key;
  return async(action,data={})=>{
    let path,options={headers,signal:AbortSignal.timeout(20000)};
    if(action==='settings')path='/rest/v1/ps_settings?id=eq.ten-years-ahead-parents-v1&select=*';
    else if(action==='settings_save'){path='/rest/v1/ps_settings?id=eq.ten-years-ahead-parents-v1';options={...options,method:'PATCH',headers:{...headers,Prefer:'return=representation'},body:JSON.stringify({...data,updated_at:new Date().toISOString()})};}
    else if(action==='test_clear'){path='/rest/v1/ps_responses?is_test=eq.true';options={...options,method:'DELETE'};}
    else if(action==='response_delete'){
      const id=responseId(data.id);
      path='/rest/v1/ps_responses?id=eq.'+id+'&survey_id=eq.'+encodeURIComponent(SURVEY_ID)+'&select=id';
      options={...options,method:'DELETE',headers:{...headers,Prefer:'return=representation'}};
    }
    else {path='/rest/v1/rpc/'+action;options={...options,method:'POST',body:JSON.stringify(data)};}
    let r;try{r=await fetchImpl(url+path,options);}catch{fail('ارتباط با پایگاه داده برقرار نشد. دوباره تلاش کنید.',503);}
    const result=r.status===204?null:await r.json();
    if(!r.ok){const msg=String(result?.message||'');if(msg.includes('SURVEY_CLOSED'))fail('مهلت پاسخ‌گویی پایان یافته است.',409);if(msg.includes('NAME_REQUIRED'))fail('نام و نام خانوادگی پاسخ‌دهنده را کامل وارد کنید.');if(msg.includes('ID_CONFLICT'))fail('این شناسه قبلاً با اطلاعات دیگری ثبت شده است.',409);fail('ذخیره یا دریافت اطلاعات تأیید نشد. دوباره تلاش کنید.',503);}
    return ['settings','settings_save'].includes(action)?result[0]:result;
  };
}
export function createHandler(api,{origins}){
  return async request=>{
    const origin=request.headers.get('origin'),allowed=!origin||origins.includes(origin);
    const headers={'Content-Type':'application/json;charset=UTF-8','Access-Control-Allow-Origin':allowed?(origin||origins[0]):origins[0],'Access-Control-Allow-Methods':'POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type,Accept','Vary':'Origin','Cache-Control':'no-store,private','X-Content-Type-Options':'nosniff'};
    if(!allowed)return Response.json({ok:false,message:'مبدأ درخواست مجاز نیست.'},{status:403,headers});
    if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
    try{
      if(request.method!=='POST')fail('از فرم سامانه استفاده کنید.',405);
      const reader=request.body?.getReader();if(!reader)fail('درخواست خالی است.');let bytes=0;const chunks=[];
      try{while(true){const p=await reader.read();if(p.done)break;bytes+=p.value.length;if(bytes>32768){await reader.cancel();fail('حجم درخواست بیش از حد مجاز است.',413);}chunks.push(p.value);}}finally{reader.releaseLock();}
      const raw=Buffer.concat(chunks).toString();let body;try{body=JSON.parse(raw);}catch{fail('درخواست معتبر نیست.');}
      const result=await api.handle(body,{ip:request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown'});
      return Response.json(result,{headers});
    }catch(e){return Response.json({ok:false,message:e instanceof ApiError?e.message:'سامانه موقتاً در دسترس نیست. دوباره تلاش کنید.'},{status:e instanceof ApiError?e.status:503,headers});}
  };
}
