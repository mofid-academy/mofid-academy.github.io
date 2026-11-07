import {createHash,createHmac,timingSafeEqual} from 'node:crypto';
import {Buffer} from 'node:buffer';

export class AttendanceError extends Error {constructor(message,status=400){super(message);this.status=status;}}
const fail=(message,status=400)=>{throw new AttendanceError(message,status);};
const hash=value=>createHash('sha256').update(value).digest('hex');
const equal=(a,b)=>{const x=Buffer.from(String(a)),y=Buffer.from(String(b));return x.length===y.length&&timingSafeEqual(x,y);};
const uuid=value=>{if(typeof value!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value))fail('شناسهٔ ثبت معتبر نیست؛ صفحه را تازه کنید.');return value.toLowerCase();};
const text=(value,max)=>{if(value==null)value='';if(typeof value!=='string'||value.length>max||/[\u0000-\u001f\u007f]/.test(value))fail('اطلاعات واردشده معتبر نیست.');return value.normalize('NFC').trim();};
export function normalizeEntry(input){
  if(!input||typeof input!=='object'||Array.isArray(input))fail('اطلاعات ثبت معتبر نیست.');
  const full_name=text(input.full_name,120),username=text(input.username,64).toLowerCase();
  if(full_name.length<2)fail('نام و نام خانوادگی را وارد کنید.');
  if(!username)fail('نام سازمانی الزامی است؛ آن را مانند M.mirsheri وارد کنید.');
  if(!/^[a-z][a-z0-9._-]{0,63}$/.test(username))fail('نام سازمانی را مانند M.mirsheri و بدون نشانی ایمیل وارد کنید.');
  if(!['in_person','online'].includes(input.attendance_mode))fail('یکی از گزینه‌های حضوری یا آنلاین را انتخاب کنید.');
  return {full_name,username,attendance_mode:input.attendance_mode};
}
export function createApi({db,config,now=Date.now}){
  const username=String(config.adminUsername||'').toLowerCase();
  if(!username||typeof config.signingKey!=='string'||config.signingKey.length<32||!/^[a-f0-9]{64}$/.test(config.adminKeyHash||''))throw Error('Private configuration unavailable');
  function sign(){const payload=Buffer.from(JSON.stringify({kind:'zero-repeat-attendance-admin',username,exp:Math.floor(now()/1000)+7200})).toString('base64url');const prefix='zra1.'+payload;return prefix+'.'+createHmac('sha256',config.signingKey).update(prefix).digest('base64url');}
  function verify(token){
    if(typeof token!=='string'||token.length>4096)fail('برای ادامه وارد پنل مدیریت شوید.',401);
    const parts=token.split('.');
    if(parts.length!==3||parts[0]!=='zra1'||!equal(createHmac('sha256',config.signingKey).update(parts[0]+'.'+parts[1]).digest('base64url'),parts[2]))fail('نشست مدیریت معتبر نیست.',401);
    let claims;try{claims=JSON.parse(Buffer.from(parts[1],'base64url').toString());}catch{fail('نشست مدیریت معتبر نیست.',401);}
    if(claims.kind!=='zero-repeat-attendance-admin'||claims.username!==username||!Number.isSafeInteger(claims.exp)||claims.exp<=Math.floor(now()/1000))fail('نشست مدیریت پایان یافته است؛ دوباره وارد شوید.',401);
  }
  async function rate(kind,ip){const result=await db('rate',{key:createHmac('sha256',config.signingKey).update('attendance:'+kind+':'+ip).digest('hex'),limit:kind==='login'?12:600});if(result?.allowed!==true)fail('تعداد تلاش‌ها زیاد است؛ چند دقیقه بعد دوباره تلاش کنید.',429);}
  return {async handle(body,{ip='unknown'}={}){
    if(!body||typeof body!=='object'||Array.isArray(body))fail('درخواست معتبر نیست.');
    if(body.action==='health'){await db('health');return {ok:true,ready:true,version:'zero-repeat-attendance/2'};}
    if(body.action==='submit'){
      const id=uuid(body.request_id),entry=normalizeEntry(body.data);await rate('submit',ip);
      const receipt=await db('submit',{id,...entry,fingerprint:hash(JSON.stringify(entry))});
      if(receipt?.stored!==true||receipt.id!==id||receipt.attendance_mode!==entry.attendance_mode||!Number.isFinite(Date.parse(receipt.created_at)))fail('ثبت پاسخ تأیید نشد؛ دوباره تلاش کنید.',503);
      return {ok:true,receipt};
    }
    if(body.action==='admin_login'){
      await rate('login',ip);
      if(text(body.username,64).toLowerCase()!==username||typeof body.secret!=='string'||body.secret.length>256||!equal(hash(body.secret),config.adminKeyHash))fail('نام کاربری یا رمز مدیریت معتبر نیست.',401);
      return {ok:true,token:sign()};
    }
    verify(body.token);
    if(body.action==='admin_entries'){
      const offset=body.offset??0;
      if(!Number.isSafeInteger(offset)||offset<0||offset>100000)fail('صفحهٔ گزارش معتبر نیست.');
      const args={offset};
      if(body.snapshot!==undefined){if(typeof body.snapshot!=='string'||!Number.isFinite(Date.parse(body.snapshot)))fail('زمان گزارش معتبر نیست.');args.snapshot=new Date(body.snapshot).toISOString();}
      return {ok:true,...await db('list',args)};
    }
    if(body.action==='admin_delete'){
      const id=uuid(body.id);if(body.confirm!==true)fail('حذف این پاسخ را تأیید کنید.');
      const deleted=await db('delete',{id});
      if(deleted?.id!==id||!Number.isFinite(Date.parse(deleted.deleted_at)))fail('حذف تأیید نشد؛ فهرست را به‌روز کنید.',503);
      return {ok:true,deleted};
    }
    fail('این عملیات شناخته نشد.',404);
  }};
}
export function createStore({url,key,fetchImpl=fetch}){
  const headers={apikey:key,'Content-Type':'application/json'};if(key.startsWith('eyJ'))headers.Authorization='Bearer '+key;
  return async(action,args={})=>{
    let response,result;
    try{response=await fetchImpl(url+'/rest/v1/rpc/zr_attendance_store',{method:'POST',headers,body:JSON.stringify({p_action:action,p_args:args}),signal:AbortSignal.timeout(20000)});result=await response.json();}
    catch{fail('ارتباط با سامانه برقرار نشد؛ دوباره تلاش کنید.',503);}
    if(!response.ok){if(String(result?.message).includes('ID_CONFLICT'))fail('این پاسخ قبلاً ثبت شده است. برای ثبت شخص دیگری صفحه را دوباره باز کنید.',409);if(String(result?.message).includes('NOT_FOUND'))fail('پاسخ پیدا نشد.',404);fail('دریافت یا ذخیرهٔ اطلاعات تأیید نشد؛ دوباره تلاش کنید.',503);}
    return result;
  };
}
export function createHandler(api,{origin='https://mofid-academy.github.io'}={}){
  return async request=>{
    const from=request.headers.get('origin');
    const headers={'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type, Accept','Vary':'Origin','Cache-Control':'no-store, private','X-Content-Type-Options':'nosniff'};
    try{
      if(from&&from!==origin)fail('مبدأ درخواست مجاز نیست.',403);
      if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
      if(request.method!=='POST')fail('از فرم سایت استفاده کنید.',405);
      const reader=request.body?.getReader();if(!reader)fail('درخواست خالی است.');let size=0;const chunks=[];
      try{while(true){const chunk=await reader.read();if(chunk.done)break;size+=chunk.value.length;if(size>12288){await reader.cancel();fail('حجم درخواست بیش از حد مجاز است.',413);}chunks.push(chunk.value);}}finally{reader.releaseLock();}
      let body;try{body=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{fail('درخواست معتبر نیست.');}
      return Response.json(await api.handle(body,{ip:request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown'}),{headers});
    }catch(error){return Response.json({ok:false,message:error instanceof AttendanceError?error.message:'سامانه موقتاً در دسترس نیست؛ دوباره تلاش کنید.'},{status:error instanceof AttendanceError?error.status:503,headers});}
  };
}
