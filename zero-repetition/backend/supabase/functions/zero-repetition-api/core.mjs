import {createHash,createHmac,timingSafeEqual,randomUUID} from 'node:crypto';
import {Buffer} from 'node:buffer';

export class ApiError extends Error {
  constructor(code,message,status=400){super(message);this.code=code;this.status=status;}
}
const fail=(code,message,status=400)=>{throw new ApiError(code,message,status);};
const hash=value=>createHash('sha256').update(value,'utf8').digest('hex');
const equal=(a,b)=>{const x=Buffer.from(String(a)),y=Buffer.from(String(b));return x.length===y.length&&timingSafeEqual(x,y);};
const uuid=value=>typeof value==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
const text=(value,max,required=false)=>{
  if(value===undefined||value===null)value='';
  if(typeof value!=='string'||value.length>max||value.includes('\0'))fail('INVALID_INPUT','یکی از فیلدها معتبر نیست.');
  value=value.trim();if(required&&!value)fail('REQUIRED_FIELD','فیلدهای الزامی را تکمیل کنید.');return value;
};
export const usernameOf=value=>{value=text(value,64,true).toLowerCase();if(!/^[a-z][a-z0-9._-]{0,63}$/.test(value))fail('ORG_USERNAME','نام کاربری سازمانی مثل M.mirsheri وارد کنید.');return value;};
const requireId=id=>{if(!uuid(id))fail('INVALID_ID','شناسه معتبر نیست.');return id;};
const publicAccount=a=>({id:a.id,slot:a.slot,username:a.username,full_name:a.full_name,department:a.department,is_active:a.is_active});

export function normalizeSurvey(input,owner,final){
  if(!input||typeof input!=='object'||!Array.isArray(input.tasks)||input.tasks.length!==3)fail('THREE_TASKS','دقیقاً سه فعالیت وارد کنید.');
  const number=(value,integer=false)=>{
    if(value===''||value===null||value===undefined){if(final)fail('REQUIRED_NUMBER','تعداد دفعات و زمان را وارد کنید.');return '';}
    if(!['number','string'].includes(typeof value))fail('INVALID_NUMBER','تعداد یا زمان معتبر نیست.');
    const n=Number(value);if(!Number.isFinite(n)||n<(integer?1:.01)||n>100000||(integer&&!Number.isInteger(n)))fail('INVALID_NUMBER','تعداد یا زمان معتبر نیست.');return n;
  };
  const tasks=input.tasks.map(t=>{
    if(!t||typeof t!=='object'||!['daily','weekly','monthly'].includes(t.frequency))fail('INVALID_TASK','فعالیت یا دوره تکرار معتبر نیست.');
    return {title:text(t.title,160,final),steps:text(t.steps,4000,final),count:number(t.count,true),frequency:t.frequency,minutes:number(t.minutes),tools:text(t.tools,500,final),human_decision:text(t.human_decision,1000)};
  });
  const factors={daily:22,weekly:4.33,monthly:1};
  return {username:owner.username,full_name:text(input.full_name,120,final),department:text(input.department,100,final),job_title:text(input.job_title,100),tasks,
    monthly_hours:Math.round(tasks.reduce((s,t)=>s+(+t.count||0)*(+t.minutes||0)*factors[t.frequency]/60,0)*100)/100};
}

export function createApi({db,config,fetchImpl=fetch,now=Date.now}){
  if(!config.signingKey||config.signingKey.length<32||!/^[a-f0-9]{64}$/.test(config.adminKeyHash||''))throw new Error('Private configuration missing');
  const adminName=usernameOf(config.adminUsername),epoch=()=>Math.floor(now()/1000);
  function sign(claims){
    const payload=Buffer.from(JSON.stringify({...claims,v:2,aud:config.siteOrigin})).toString('base64url');
    const prefix='zr2.'+payload;return prefix+'.'+createHmac('sha256',config.signingKey).update(prefix).digest('base64url');
  }
  function verify(token,kind){
    if(typeof token!=='string'||token.length>4096)fail('ACCESS_DENIED','لینک یا نشست معتبر نیست.',401);
    const parts=token.split('.');if(parts.length!==3||parts[0]!=='zr2')fail('ACCESS_DENIED','لینک یا نشست معتبر نیست.',401);
    if(!equal(createHmac('sha256',config.signingKey).update(parts[0]+'.'+parts[1]).digest('base64url'),parts[2]))fail('ACCESS_DENIED','لینک یا نشست معتبر نیست.',401);
    let claims;try{claims=JSON.parse(Buffer.from(parts[1],'base64url').toString('utf8'));}catch{fail('ACCESS_DENIED','لینک معتبر نیست.',401);}
    if(claims.v!==2||claims.aud!==config.siteOrigin||claims.kind!==kind)fail('ACCESS_DENIED','لینک یا نشست معتبر نیست.',401);
    if(!Number.isSafeInteger(claims.exp)||claims.exp<=epoch())fail('EXPIRED_ACCESS','اعتبار لینک یا نشست پایان یافته است.',401);
    if(kind==='admin'){if(claims.username!==adminName)fail('ACCESS_DENIED','دسترسی مدیر معتبر نیست.',401);}
    else if(!uuid(claims.sub)||!uuid(claims.jti)||!Number.isInteger(claims.slot)||claims.slot<1||claims.slot>300||usernameOf(claims.username)!==claims.username)fail('ACCESS_DENIED','لینک معتبر نیست.',401);
    return claims;
  }
  function invite(a){return {username:a.username,full_name:a.full_name,department:a.department,url:config.siteUrl+'#invite='+sign({kind:'invite',sub:a.id,username:a.username,slot:a.slot,jti:a.jti,exp:Math.floor(Date.parse(a.expires_at)/1000)})};}
  async function ownerOf(claims){
    const a=await db('account_get',{id:claims.sub});
    if(!a||!a.is_active||Date.parse(a.expires_at)<=now()||a.id!==claims.sub||a.jti!==claims.jti||a.slot!==claims.slot||a.username!==claims.username)fail('ACCESS_DENIED','لینک اختصاصی فعال نیست.',401);
    return a;
  }
  function mutation(action,body,args,scope){
    return db(action,{...args,request_id:requireId(body.request_id),scope,fingerprint:hash(JSON.stringify({action,data:body.data||{}}))});
  }
  const sheetsReady=()=>Boolean(config.sheetsWebhook&&config.sheetsSyncKey);
  async function handle(body,{origin,ip='unknown'}={}){
    if(origin&&origin!==config.siteOrigin)fail('ORIGIN_DENIED','این مبدأ مجاز نیست.',403);
    if(!body||typeof body!=='object'||Array.isArray(body)||Buffer.byteLength(JSON.stringify(body))>262144)fail('INVALID_REQUEST','درخواست معتبر نیست.');
    const {action}=body,data=body.data||{};
    if(action==='health'){
      await db('health',{});return {ok:true,ready:true,apiVersion:'zero-repetition/3',storage:'private-database'};
    }
    if(action==='admin_login'){
      const gate=await db('rate_limit',{key:createHmac('sha256',config.signingKey).update('login:'+ip).digest('hex')});
      if(!gate.allowed)fail('RATE_LIMIT','تعداد تلاش‌ها زیاد است؛ کمی بعد دوباره امتحان کنید.',429);
      const secret=String(body.secret||'');
      if(secret.length<28||secret.length>256||usernameOf(body.username)!==adminName||!equal(hash(secret),config.adminKeyHash))fail('ACCESS_DENIED','نام کاربری یا رمز مدیریت معتبر نیست.',401);
      return {ok:true,user:{username:adminName,full_name:'مدیر طرح',department:'آکادمی',is_admin:true},token:sign({kind:'admin',username:adminName,exp:epoch()+7200})};
    }
    if(['invite_login','survey_get','survey_save'].includes(action)){
      const claims=verify(body.token,'invite');
      if(action==='invite_login'&&usernameOf(body.username)!==claims.username)fail('USERNAME_MISMATCH','نام کاربری با لینک اختصاصی شما مطابقت ندارد.',403);
      const a=await ownerOf(claims);
      if(action==='survey_save'){
        if(!['draft','submit'].includes(data.action))fail('INVALID_SAVE','نوع ثبت معتبر نیست.');
        if(!Number.isInteger(data.revision)||data.revision<0)fail('REVISION_CONFLICT','نسخه پاسخ معتبر نیست.',409);
        const survey=normalizeSurvey(data,a,data.action==='submit');
        const saved=await mutation('save',body,{id:a.id,jti:a.jti,revision:data.revision,mode:data.action,survey},'save:'+a.id);
        return {ok:true,survey:saved};
      }
      const survey=await db('response_get',{id:a.id});
      return {ok:true,survey,...(action==='invite_login'?{user:{username:a.username,full_name:a.full_name,department:a.department,is_admin:false}}:{})};
    }
    if(!['responses_list','response_get','reopen','invites_list','invite_create','invite_reset','sheets_sync'].includes(action))fail('UNKNOWN_ACTION','عملیات معتبر نیست.',404);
    verify(body.token,'admin');
    if(action==='responses_list')return {ok:true,...await db('responses_list',{}),sheets_configured:sheetsReady()};
    if(action==='response_get')return {ok:true,survey:await db('response_get',{id:requireId(data.id)})};
    if(action==='reopen')return {ok:true,survey:await mutation('reopen',body,{id:requireId(data.id)},'admin:reopen')};
    if(action==='invites_list')return {ok:true,accounts:(await db('accounts_list',{})).map(publicAccount),capacity:300};
    if(action==='invite_create'){
      if(!Array.isArray(data.people)||!data.people.length||data.people.length>300)fail('INVALID_PEOPLE','فهرست باید بین ۱ تا ۳۰۰ نفر داشته باشد.');
      const seen=new Set(),expires_at=new Date(now()+180*86400000).toISOString();
      const people=data.people.map(p=>{const username=usernameOf(p.username);if(seen.has(username))fail('DUPLICATE_USERNAME','نام کاربری در فهرست تکراری است.',409);seen.add(username);return {id:randomUUID(),jti:randomUUID(),username,full_name:text(p.full_name,120,true),department:text(p.department,100,true),expires_at};});
      const list=await mutation('invite_create',body,{people},'admin:invite_create');
      return {ok:true,invites:list.map(invite)};
    }
    if(action==='invite_reset'){
      const a=await mutation('invite_reset',body,{id:requireId(data.id),jti:randomUUID(),expires_at:new Date(now()+180*86400000).toISOString()},'admin:invite_reset');
      return {ok:true,invites:[invite(a)]};
    }
    if(action==='sheets_sync'){
      if(!sheetsReady())fail('SHEETS_NOT_CONFIGURED','ارسال به شیت هنوز تنظیم نشده؛ پاسخ‌ها در سامانه محفوظ‌اند.',409);
      const url=new URL(config.sheetsWebhook);
      if(url.protocol!=='https:'||!url.hostname.endsWith('.app.n8n.cloud')||!url.pathname.startsWith('/webhook/'))fail('SHEETS_NOT_CONFIGURED','آدرس ارسال به شیت معتبر نیست.',503);
      if(!Array.isArray(data.ids)||!data.ids.length||data.ids.length>300||new Set(data.ids).size!==data.ids.length)fail('INVALID_IDS','پاسخ‌ها را برای ارسال انتخاب کنید.');
      const ids=data.ids.map(requireId),job_id=requireId(body.request_id);
      const plan=await db('sync_claim',{job_id,ids});
      if(plan.done)return {ok:true,count:plan.count};
      try{
        const response=await fetchImpl(url.href,{method:'POST',redirect:'error',signal:AbortSignal.timeout(30000),headers:{'Content-Type':'application/json','X-ZR-Sync-Key':config.sheetsSyncKey},body:JSON.stringify({schema:'zero-repetition-sync/1',batch_id:job_id,rows:plan.rows})});
        const ack=await response.json();
        const expected=plan.rows.map(x=>x.survey.id).sort();
        if(!response.ok||ack.ok!==true||ack.batch_id!==job_id||!Array.isArray(ack.written)||JSON.stringify([...ack.written].sort())!==JSON.stringify(expected))throw new Error('Sync not acknowledged');
        const result=await db('sync_finish',{job_id,success:true});return {ok:true,count:result.count};
      }catch{
        await db('sync_finish',{job_id,success:false});
        fail('SHEETS_UNAVAILABLE','ارسال به شیت انجام نشد؛ پاسخ‌ها در سامانه ذخیره‌اند و می‌توانید دوباره ارسال کنید.',502);
      }
    }
  }
  return {handle,sign,verify};
}

const databaseErrors={
 ACCESS_DENIED:[401,'دسترسی معتبر نیست.'],NOT_FOUND:[404,'پاسخ یا حساب پیدا نشد.'],CAPACITY:[409,'ظرفیت ۳۰۰ نفر تکمیل شده است.'],
 INACTIVE_INVITE:[409,'برای این همکار لینک جدید بسازید.'],ALREADY_SUBMITTED:[409,'پاسخ نهایی شده است؛ برای ویرایش با مسئول طرح هماهنگ کنید.'],
 REVISION_CONFLICT:[409,'نسخه جدیدتری ذخیره شده؛ پاسخ را دوباره دریافت کنید.'],REQUEST_ID_REUSED:[409,'شناسه درخواست برای دادهٔ دیگری استفاده شده است.'],
 REQUEST_ID_REQUIRED:[400,'شناسه درخواست معتبر نیست.'],SYNC_BUSY:[409,'ارسال قبلی هنوز در حال انجام است؛ کمی بعد تلاش کنید.'],INVALID_IDS:[400,'فهرست پاسخ‌ها معتبر نیست.']
};
export function databaseError(message){
  const entry=Object.entries(databaseErrors).find(([code])=>String(message).includes(code));
  if(entry)return new ApiError(entry[0],entry[1][1],entry[1][0]);
  return new ApiError('DATABASE_UNAVAILABLE','ذخیره در سامانه تأیید نشد؛ پاسخ واردشده را نگه دارید و دوباره تلاش کنید.',503);
}

export function createPostgresStore({url,key,fetchImpl=fetch}){
  if(!url||!key)throw new Error('Database connection missing');
  return async(action,data)=>{
    let response;
    const headers={apikey:key,'Content-Type':'application/json'};
    if(key.startsWith('eyJ'))headers.Authorization='Bearer '+key;
    try{response=await fetchImpl(url+'/rest/v1/rpc/zr_store',{method:'POST',headers,body:JSON.stringify({p_action:action,p_data:data}),signal:AbortSignal.timeout(15000)});}catch{throw databaseError('connection');}
    const body=await response.json();if(!response.ok)throw databaseError(body.message);return body;
  };
}

export function createHttpHandler(api,origin){
  const headers={'Content-Type':'application/json;charset=utf-8','Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type, Accept','Vary':'Origin','Cache-Control':'no-store, private, max-age=0','X-Content-Type-Options':'nosniff'};
  return async request=>{
    if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
    try{
      if(request.method!=='POST')fail('METHOD_NOT_ALLOWED','از فرم سامانه استفاده کنید.',405);
      if(Number(request.headers.get('content-length'))>262144)fail('PAYLOAD_TOO_LARGE','حجم درخواست بیش از حد مجاز است.',413);
      const reader=request.body?.getReader();if(!reader)fail('INVALID_JSON','درخواست معتبر نیست.');
      const chunks=[];let bytes=0;
      try{while(true){const part=await reader.read();if(part.done)break;bytes+=part.value.length;if(bytes>262144){await reader.cancel();fail('PAYLOAD_TOO_LARGE','حجم درخواست بیش از حد مجاز است.',413);}chunks.push(part.value);}}finally{reader.releaseLock();}
      let body;try{body=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{fail('INVALID_JSON','درخواست معتبر نیست.');}
      const result=await api.handle(body,{origin:request.headers.get('origin'),ip:request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown'});
      return new Response(JSON.stringify(result),{status:200,headers});
    }catch(error){
      const known=error instanceof ApiError;
      return new Response(JSON.stringify({ok:false,code:known?error.code:'SERVER_UNAVAILABLE',message:known?error.message:'ارتباط با سامانه برقرار نشد؛ دوباره تلاش کنید.'}),{status:known?error.status:503,headers});
    }
  };
}
