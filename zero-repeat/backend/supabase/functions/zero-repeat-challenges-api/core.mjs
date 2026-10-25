import {createHash,createHmac,timingSafeEqual} from 'node:crypto';
import {Buffer} from 'node:buffer';

export class ChallengeError extends Error {
  constructor(code,message,status=400){super(message);this.code=code;this.status=status;}
}
const fail=(code,message,status=400)=>{throw new ChallengeError(code,message,status);};
const hash=value=>createHash('sha256').update(value,'utf8').digest('hex');
const equal=(a,b)=>{const x=Buffer.from(String(a)),y=Buffer.from(String(b));return x.length===y.length&&timingSafeEqual(x,y);};
const isUuid=value=>typeof value==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
const text=(value,max,required=false)=>{
  if(value===undefined||value===null)value='';
  if(typeof value!=='string'||value.length>max||/[\u0000-\u001f\u007f]/.test(value))fail('INVALID_INPUT','یکی از اطلاعات واردشده معتبر نیست.');
  value=value.normalize('NFC').trim();
  if(required&&!value)fail('REQUIRED_FIELD','نام، نام سازمانی و واحد سازمانی را تکمیل کنید.');
  return value;
};
export function normalizeEntry(input){
  if(!input||typeof input!=='object'||Array.isArray(input))fail('INVALID_INPUT','اطلاعات ثبت معتبر نیست.');
  const username=text(input.username,64,true).toLowerCase();
  if(!/^[a-z][a-z0-9._-]{0,63}$/.test(username))fail('ORG_NAME','نام سازمانی را مانند M.mirsheri و بدون ایمیل وارد کنید.');
  if(![1,2].includes(input.challenge_id))fail('CHALLENGE_REQUIRED','یکی از دو چالش را انتخاب کنید.');
  if(input.accepted!==true)fail('READ_REQUIRED','مطالعه توضیحات چالش انتخابی و تمایل به شرکت را تأیید کنید.');
  return {username,full_name:text(input.full_name,120,true),department:text(input.department,100,true),job_title:text(input.job_title,100),challenge_id:input.challenge_id};
}

export function createChallengeApi({db,config,now=Date.now}){
  if(typeof config.signingKey!=='string'||config.signingKey.length<32||!/^[a-f0-9]{64}$/.test(config.adminKeyHash||''))throw new Error('Private configuration missing');
  const adminUsername=String(config.adminUsername||'').toLowerCase();
  const epoch=()=>Math.floor(now()/1000);
  function sign(){
    const payload=Buffer.from(JSON.stringify({v:1,aud:config.siteOrigin,kind:'challenge_admin',username:adminUsername,exp:epoch()+7200})).toString('base64url');
    const prefix='zrc1.'+payload;
    return prefix+'.'+createHmac('sha256',config.signingKey).update(prefix).digest('base64url');
  }
  function verify(token){
    if(typeof token!=='string'||token.length>4096)fail('ACCESS_DENIED','برای مشاهده ثبت‌ها وارد پنل مدیریت شوید.',401);
    const parts=token.split('.');
    if(parts.length!==3||parts[0]!=='zrc1'||!equal(createHmac('sha256',config.signingKey).update(parts[0]+'.'+parts[1]).digest('base64url'),parts[2]))fail('ACCESS_DENIED','نشست مدیریت معتبر نیست.',401);
    let claims;try{claims=JSON.parse(Buffer.from(parts[1],'base64url').toString('utf8'));}catch{fail('ACCESS_DENIED','نشست مدیریت معتبر نیست.',401);}
    if(claims.v!==1||claims.aud!==config.siteOrigin||claims.kind!=='challenge_admin'||claims.username!==adminUsername||!Number.isSafeInteger(claims.exp)||claims.exp<=epoch())fail('ACCESS_DENIED','اعتبار نشست مدیریت پایان یافته است؛ دوباره وارد شوید.',401);
    return claims;
  }
  async function rate(kind,ip){
    const result=await db('rate_limit',{key:createHmac('sha256',config.signingKey).update('challenges:'+kind+':'+ip).digest('hex'),limit:kind==='login'?10:600});
    if(!result.allowed)fail('RATE_LIMIT','تعداد تلاش‌ها زیاد است؛ چند دقیقه بعد دوباره تلاش کنید.',429);
  }
  async function handle(body,{origin,ip='unknown'}={}){
    if(origin&&origin!==config.siteOrigin)fail('ORIGIN_DENIED','این مبدأ مجاز نیست.',403);
    if(!body||typeof body!=='object'||Array.isArray(body))fail('INVALID_REQUEST','درخواست معتبر نیست.');
    if(body.action==='health'){await db('health',{});return {ok:true,ready:true,service:'zero-repeat-challenges/1'};}
    if(body.action==='submit'){
      if(!isUuid(body.request_id))fail('INVALID_ID','شناسه ثبت معتبر نیست؛ صفحه را دوباره باز کنید.');
      const entry=normalizeEntry(body.data);
      await rate('submit',ip);
      const receipt=await db('submit',{id:body.request_id,...entry,fingerprint:hash(JSON.stringify(entry))});
      return {ok:true,receipt};
    }
    if(body.action==='admin_login'){
      await rate('login',ip);
      if(typeof body.secret!=='string'||body.secret.length<28||body.secret.length>256||String(body.username||'').trim().toLowerCase()!==adminUsername||!equal(hash(body.secret),config.adminKeyHash))fail('ACCESS_DENIED','نام سازمانی یا رمز مدیریت معتبر نیست.',401);
      return {ok:true,token:sign()};
    }
    if(body.action==='admin_entries'){
      verify(body.token);
      const offset=body.offset??0;
      if(!Number.isSafeInteger(offset)||offset<0||offset>100000)fail('INVALID_PAGE','صفحه درخواست‌شده معتبر نیست.');
      const result=await db('list',{offset,limit:250});
      return {ok:true,...result};
    }
    if(body.action==='admin_delete'){
      verify(body.token);
      if(!isUuid(body.id))fail('INVALID_ID','شناسه ثبت معتبر نیست.');
      const id=body.id.toLowerCase();
      const deleted=await db('delete',{id});
      if(deleted?.id!==id||!Number.isFinite(Date.parse(deleted?.deleted_at)))fail('DELETE_UNCONFIRMED','حذف تأیید نشد؛ فهرست را به‌روزرسانی و دوباره تلاش کنید.',503);
      return {ok:true,deleted};
    }
    fail('UNKNOWN_ACTION','درخواست پشتیبانی نمی‌شود.',404);
  }
  return {handle};
}

export function createPostgresStore({url,key,fetchImpl=fetch}){
  if(!url||!key)throw new Error('Database configuration missing');
  return async(action,args)=>{
    const headers={apikey:key,'Content-Type':'application/json'};
    if(key.startsWith('eyJ'))headers.Authorization='Bearer '+key;
    const response=await fetchImpl(url+'/rest/v1/rpc/zr_challenges_store',{method:'POST',headers,body:JSON.stringify({p_action:action,p_args:args}),signal:AbortSignal.timeout(15000)});
    let data;try{data=await response.json();}catch{fail('STORAGE_UNAVAILABLE','ثبت در سامانه تأیید نشد؛ دوباره تلاش کنید.',503);}
    if(!response.ok){
      if(data?.message==='CHALLENGE_REQUEST_CONFLICT')fail('REQUEST_CONFLICT','اطلاعات این درخواست تغییر کرده است؛ ثبت را دوباره انجام دهید.',409);
      if(data?.message==='CHALLENGE_ENTRY_DELETED')fail('ENTRY_DELETED','این ثبت توسط مدیر حذف شده است؛ برای ثبت جدید دوباره تلاش کنید.',410);
      if(data?.message==='CHALLENGE_ENTRY_NOT_FOUND')fail('ENTRY_NOT_FOUND','ثبت انتخاب‌شده در سامانه پیدا نشد؛ فهرست را به‌روزرسانی کنید.',404);
      fail('STORAGE_UNAVAILABLE','ثبت در سامانه تأیید نشد؛ دوباره تلاش کنید.',503);
    }
    return data;
  };
}

export function createHttpHandler(api,siteOrigin){
  const base={'Access-Control-Allow-Origin':siteOrigin,'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type, Accept','Access-Control-Max-Age':'600','Vary':'Origin','Cache-Control':'no-store, private, max-age=0','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'};
  return async request=>{
    if(request.method==='OPTIONS')return new Response(null,{status:204,headers:base});
    if(request.method!=='POST')return Response.json({ok:false,code:'METHOD_NOT_ALLOWED'},{status:405,headers:{...base,Allow:'POST, OPTIONS'}});
    try{
      if(Number(request.headers.get('content-length')||0)>16384)fail('PAYLOAD_TOO_LARGE','حجم درخواست بیش از حد مجاز است.',413);
      const reader=request.body?.getReader();
      if(!reader)fail('INVALID_JSON','درخواست معتبر نیست.');
      const chunks=[];let size=0;
      while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>16384){await reader.cancel();fail('PAYLOAD_TOO_LARGE','حجم درخواست بیش از حد مجاز است.',413);}chunks.push(value);}
      const bytes=new Uint8Array(size);let pos=0;for(const chunk of chunks){bytes.set(chunk,pos);pos+=chunk.byteLength;}
      let body;try{body=parseRequestBody(new TextDecoder().decode(bytes), request.headers.get('content-type'));}catch{fail('INVALID_JSON','درخواست معتبر نیست.');}
      const ip=request.headers.get('cf-connecting-ip')||request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown';
      const result=await api.handle(body,{origin:request.headers.get('origin')||'',ip});
      return Response.json(result,{headers:base});
    }catch(error){
      const known=error instanceof ChallengeError;
      return Response.json({ok:false,code:known?error.code:'SERVER_UNAVAILABLE',message:known?error.message:'ارتباط با سامانه برقرار نشد؛ دوباره تلاش کنید.'},{status:known?error.status:503,headers:base});
    }
  };
}


// Accept ordinary browser form posts as well as the existing JSON transport.
export function parseRequestBody(raw, contentType = '') {
  if ((contentType || '').split(';', 1)[0].trim().toLowerCase() === 'application/x-www-form-urlencoded') {
    const fields = new URLSearchParams(raw);
    if ([...fields.keys()].length !== 1 || !fields.has('payload')) throw new Error('Invalid form payload');
    raw = fields.get('payload');
  }
  return JSON.parse(raw);
}
