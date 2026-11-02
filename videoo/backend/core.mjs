import {createHash,createHmac,timingSafeEqual,randomUUID} from 'node:crypto';
import {Buffer} from 'node:buffer';
import {createStorage,storageConfig,objectKey} from './storage.mjs';

export class ApiError extends Error {constructor(code,message,status=400){super(message);this.code=code;this.status=status;}}
const fail=(code,message,status=400)=>{throw new ApiError(code,message,status);};
const sha=v=>createHash('sha256').update(v).digest('hex');
const equal=(a,b)=>{const x=Buffer.from(String(a)),y=Buffer.from(String(b));return x.length===y.length&&timingSafeEqual(x,y);};
const text=(v,max=200,required=false)=>{if(typeof v!=='string'||v.length>max||v.includes('\0'))fail('INVALID_INPUT','اطلاعات واردشده معتبر نیست.');v=v.trim();if(required&&!v)fail('REQUIRED_INPUT','عنوان را تکمیل کنید.');return v;};
const number=(v,min=0,max=86400)=>{if(!Number.isFinite(v)||v<min||v>max)fail('INVALID_INPUT','مقدار واردشده معتبر نیست.');return v;};
const id=v=>{if(typeof v!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v))fail('INVALID_ID','شناسه معتبر نیست.');return v;};
const safeKey=v=>{try{return objectKey(v);}catch{fail('INVALID_OBJECT','مسیر فایل معتبر نیست.');}};

export function normalizeCourses(input){
  if(!Array.isArray(input)||input.length>300)fail('INVALID_CATALOG','حداکثر ۳۰۰ مجموعه قابل ثبت است.');
  const seen=new Set();let total=0;
  const unique=v=>{id(v);if(seen.has(v))fail('DUPLICATE_ID','شناسهٔ تکراری در فهرست وجود دارد.');seen.add(v);return v;};
  return input.map(c=>{
    if(!c||!['course','single'].includes(c.kind)||!['draft','ready'].includes(c.status)||!Array.isArray(c.sections)||c.sections.length>100)fail('INVALID_CATALOG','ساختار مجموعه معتبر نیست.');
    return {id:unique(c.id),title:text(c.title,180,true),description:text(c.description||'',3000),category:text(c.category||'عمومی',100),instructor:text(c.instructor||'',120),level:text(c.level||'همهٔ سطوح',80),kind:c.kind,status:c.status,art:['excel','industry','video','data'].includes(c.art)?c.art:'video',
      sections:c.sections.map(s=>{
        if(!s||!Array.isArray(s.lessons)||s.lessons.length>300)fail('INVALID_CATALOG','ساختار فصل معتبر نیست.');
        return {id:unique(s.id),title:text(s.title,180,true),lessons:s.lessons.map(l=>{
          if(++total>5000)fail('INVALID_CATALOG','تعداد قسمت‌ها بیش از حد است.');
          const key=l.objectKey?safeKey(l.objectKey):'';
          return {id:unique(l.id),title:text(l.title,180,true),description:text(l.description||'',5000),objectKey:key,duration:number(l.duration||0),size:number(l.size||0,0,5e12)};
        })};
      })};
  });
}
export function mergeRanges(ranges,duration){
  if(!Array.isArray(ranges)||ranges.length>2500)fail('INVALID_PROGRESS','پیشرفت تماشا معتبر نیست.');
  const sorted=ranges.map(r=>{if(!Array.isArray(r)||r.length!==2)fail('INVALID_PROGRESS','پیشرفت تماشا معتبر نیست.');const a=number(r[0],0,duration),b=number(r[1],0,duration);if(b<a)fail('INVALID_PROGRESS','پیشرفت تماشا معتبر نیست.');return [Math.round(a*10)/10,Math.round(b*10)/10];}).sort((a,b)=>a[0]-b[0]);
  const result=[];for(const r of sorted){const last=result.at(-1);if(last&&r[0]<=last[1]+.5)last[1]=Math.max(last[1],r[1]);else result.push([...r]);}return result;
}
export const watchedSeconds=ranges=>ranges.reduce((n,r)=>n+r[1]-r[0],0);
const findLesson=(courses,lessonId)=>{for(const c of courses)for(const s of c.sections){const l=s.lessons.find(l=>l.id===lessonId);if(l)return {course:c,section:s,lesson:l};}fail('NOT_FOUND','قسمت موردنظر پیدا نشد.',404);};
const storageError=e=>{if(e instanceof ApiError)throw e;if(e.message==='STORAGE_ACCESS_DENIED')fail('STORAGE_DENIED','کلید یا دسترسی فضای آروان تأیید نشد. اطلاعات اتصال و مجوزها را بررسی کنید.',409);if(e.message?.startsWith('INVALID_STORAGE'))fail('STORAGE_CONFIG','اطلاعات اتصال آروان معتبر نیست.',400);if(e.message==='STORAGE_CORS_DENIED')fail('STORAGE_CORS','اتصال برقرار است، اما اجازهٔ تنظیم آپلود داخل سایت داده نشد.',409);fail('STORAGE_UNAVAILABLE','ارتباط با فضای آروان برقرار نشد؛ دوباره تلاش کنید.',502);};

export function createApi({db,config,storage=createStorage(),now=Date.now}){
  if(!config.signingKey||!/^[a-f0-9]{64}$/.test(config.adminKeyHash||'')||!config.adminUsername)throw Error('Management configuration unavailable');
  const adminName=config.adminUsername.toLowerCase(),epoch=()=>Math.floor(now()/1000);
  const key=createHmac('sha256',config.signingKey).update('mofid-academy-video/v1').digest();
  const sign=(claims)=>{const p='av1.'+Buffer.from(JSON.stringify({aud:'academy-video',...claims})).toString('base64url');return p+'.'+createHmac('sha256',key).update(p).digest('base64url');};
  function verify(token,kind='admin'){
    if(typeof token!=='string'||token.length>10000)fail('ACCESS_DENIED','برای پیش‌نمایش وارد حساب مدیریت شوید.',401);
    const p=token.split('.');if(p.length!==3||p[0]!=='av1'||!equal(createHmac('sha256',key).update(p[0]+'.'+p[1]).digest('base64url'),p[2]))fail('ACCESS_DENIED','نشست معتبر نیست؛ دوباره وارد شوید.',401);
    let c;try{c=JSON.parse(Buffer.from(p[1],'base64url').toString());}catch{fail('ACCESS_DENIED','نشست معتبر نیست.',401);}
    if(c.aud!=='academy-video'||c.kind!==kind||c.username!==adminName||!Number.isSafeInteger(c.exp)||c.exp<=epoch())fail('ACCESS_DENIED','اعتبار نشست پایان یافته؛ دوباره وارد شوید.',401);
    return c;
  }
  const storageReady=async()=>{const s=await db('storage_read');if(!s)fail('STORAGE_NOT_CONNECTED','ابتدا اتصال آروان را از تنظیمات کامل کنید.',409);return storageConfig(s);};
  const storageStatus=s=>({connected:!!s,endpoint:s?.endpoint||'https://s3.ir-central1.arvanstorage.ir',region:s?.region||'ir-central1',bucket:s?.bucket||'mofid-academy-videos',accessKeyHint:s?.accessKey?'••••'+s.accessKey.slice(-4):'',corsReady:!!s?.corsReady});
  async function handle(body,{ip='unknown'}={}){
    if(!body||typeof body!=='object'||Array.isArray(body))fail('INVALID_REQUEST','درخواست معتبر نیست.');
    const a=body.action,d=body.data||{};
    if(a==='health')return {ok:true,version:'academy-video/1',publicState:'coming-soon'};
    if(a==='admin_login'){
      const allowed=await db('rate_limit',{key:createHmac('sha256',key).update('login:'+ip).digest('hex')});
      if(!allowed)fail('RATE_LIMIT','تعداد تلاش‌ها زیاد است؛ کمی بعد دوباره امتحان کنید.',429);
      if(typeof d.password!=='string'||d.password.length>256||String(d.username||'').trim().toLowerCase()!==adminName||!equal(sha(d.password),config.adminKeyHash))fail('LOGIN_FAILED','نام کاربری یا رمز مدیریت معتبر نیست.',401);
      return {ok:true,token:sign({kind:'admin',username:adminName,exp:epoch()+7200}),username:adminName};
    }
    const actor=verify(body.token).username;
    if(a==='bootstrap')return {ok:true,catalog:await db('catalog'),progress:await db('progress_list',{actor}),storage:storageStatus(await db('storage_read')),username:actor,publicState:'coming-soon'};
    if(a==='catalog_save')return {ok:true,catalog:await db('catalog_save',{revision:number(d.revision,0,1e9),courses:normalizeCourses(d.courses)})};
    if(a==='storage_status')return {ok:true,storage:storageStatus(await db('storage_read'))};
    if(a==='storage_connect'){
      const old=await db('storage_read');
      let s;try{s=storageConfig({...d,accessKey:d.accessKey||old?.accessKey,secretKey:d.secretKey||old?.secretKey});await storage.list(s);}
      catch(e){storageError(e);}
      let corsReady=false;
      if(d.setupCors!==false){try{await storage.configureCors(s,config.siteOrigin);corsReady=true;}catch(e){storageError(e);}}
      await db('storage_save',{config:{...s,corsReady,connectedAt:new Date(now()).toISOString()}});
      return {ok:true,storage:storageStatus({...s,corsReady})};
    }
    if(a==='storage_files'){
      const s=await storageReady();try{return {ok:true,...await storage.list(s,text(d.prefix||'',500),text(d.cursor||'',3000))};}catch(e){storageError(e);}
    }
    if(a==='video_play'){
      const found=findLesson((await db('catalog')).courses,id(d.lessonId));
      if(!found.lesson.objectKey)fail('VIDEO_NOT_ADDED','فیلم این قسمت هنوز اضافه نشده است.',409);
      const s=await storageReady();
      return {ok:true,url:storage.play(s,found.lesson.objectKey),expiresAt:new Date(now()+3600000).toISOString(),lessonId:found.lesson.id};
    }
    if(a==='progress_save'){
      findLesson((await db('catalog')).courses,id(d.lessonId));
      const duration=number(d.duration,0,86400),position=number(d.position,0,duration||86400),incoming=mergeRanges(d.ranges||[],duration||86400);
      for(let attempt=0;attempt<3;attempt++){
        const old=await db('progress_get',{actor,lessonId:d.lessonId});
        const ranges=mergeRanges([...(old?.ranges||[]),...incoming],Math.max(duration,old?.duration||0,1));
        try{return {ok:true,progress:await db('progress_save',{actor,lessonId:d.lessonId,revision:old?.revision||0,position,duration:duration||old?.duration||0,ranges})};}
        catch(e){if(e.code!=='REVISION_CONFLICT'||attempt===2)throw e;}
      }
    }
    if(a==='upload_begin'){
      const size=number(d.size,1,500*1024*1024),name=text(d.name,240,true),type=['video/mp4','video/webm','video/x-m4v'].includes(d.type)?d.type:/\.webm$/i.test(name)?'video/webm':'video/mp4';
      if(!/\.(mp4|webm|m4v)$/i.test(name))fail('INVALID_VIDEO','فایل MP4 یا WebM انتخاب کنید.');
      const safeName=name.replace(/[^a-zA-Z0-9._-]/g,'-').replace(/^-+/,'')||'video.mp4';
      const object='academy/'+randomUUID()+'/'+safeName,s=await storageReady();
      try{const uploadId=await storage.begin(s,object,type);return {ok:true,objectKey:object,uploadId,partSize:10*1024*1024,ticket:sign({kind:'upload',username:actor,exp:epoch()+86400,key:object,uploadId,size,type})};}catch(e){storageError(e);}
    }
    if(['upload_part','upload_complete','upload_abort'].includes(a)){
      const ticket=verify(d.ticket,'upload'),s=await storageReady();
      if(a==='upload_part'){const part=number(d.number,1,Math.ceil(ticket.size/(10*1024*1024)));if(!Number.isInteger(part))fail('INVALID_PART','بخش بارگذاری معتبر نیست.');return {ok:true,url:storage.part(s,ticket.key,ticket.uploadId,part)};}
      try{
        if(a==='upload_abort'){await storage.abort(s,ticket.key,ticket.uploadId);return {ok:true};}
        if(!Array.isArray(d.parts)||d.parts.length!==Math.ceil(ticket.size/(10*1024*1024)))fail('INCOMPLETE_UPLOAD','همهٔ بخش‌های فیلم بارگذاری نشده‌اند.');
        const parts=d.parts.map((p,i)=>{if(p.number!==i+1||typeof p.etag!=='string'||!/^"?[a-f0-9]{32}(?:-\d+)?"?$/i.test(p.etag))fail('INVALID_PART','تأیید بخش بارگذاری دریافت نشد؛ تنظیمات اتصال را بررسی کنید.');return p;});
        const meta=await storage.complete(s,ticket.key,ticket.uploadId,parts);
        if(meta.size!==ticket.size)fail('INCOMPLETE_UPLOAD','حجم فایل ذخیره‌شده تأیید نشد.',409);
        return {ok:true,objectKey:ticket.key,size:meta.size,type:ticket.type};
      }catch(e){storageError(e);}
    }
    fail('UNKNOWN_ACTION','عملیات پیدا نشد.',404);
  }
  return {handle,sign,verify};
}

export function createStore({url,key,fetchImpl=fetch}){
  const headers={apikey:key,'Content-Type':'application/json'};if(key.startsWith('eyJ'))headers.Authorization='Bearer '+key;
  async function request(path,body,method=body===undefined?'GET':'POST'){
    let r;try{r=await fetchImpl(url+'/rest/v1/'+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(20000)});}catch{fail('DATABASE_UNAVAILABLE','ارتباط با سامانه برقرار نشد؛ دوباره تلاش کنید.',503);}
    if(!r.ok){const message=await r.text();if(message.includes('REVISION_CONFLICT'))fail('REVISION_CONFLICT','نسخهٔ جدیدتری ذخیره شده است؛ صفحه را تازه کنید.',409);fail('DATABASE_UNAVAILABLE','ذخیره در سامانه تأیید نشد؛ دوباره تلاش کنید.',503);}
    return r.status===204?null:r.json();
  }
  return async(action,d={})=>{
    if(action==='catalog'){const list=await request('av_catalog?id=eq.true&select=courses,revision,updated_at');if(!list[0])throw Error('CATALOG_MISSING');return list[0];}
    if(action==='catalog_save')return request('rpc/av_catalog_save',{p_revision:d.revision,p_courses:d.courses});
    if(action==='storage_read')return request('rpc/av_storage_read',{});
    if(action==='storage_save')return request('rpc/av_storage_save',{p_config:d.config});
    if(action==='rate_limit')return request('rpc/av_rate_limit',{p_key:d.key,p_limit:12});
    if(action==='progress_list')return request('av_progress?actor=eq.'+encodeURIComponent(d.actor)+'&select=lesson_id,position,duration,ranges,revision,updated_at');
    if(action==='progress_get')return (await request('av_progress?actor=eq.'+encodeURIComponent(d.actor)+'&lesson_id=eq.'+d.lessonId+'&select=lesson_id,position,duration,ranges,revision'))[0]||null;
    if(action==='progress_save')return request('rpc/av_progress_save',{p_actor:d.actor,p_lesson:d.lessonId,p_revision:d.revision,p_position:d.position,p_duration:d.duration,p_ranges:d.ranges});
    throw Error('Unknown storage action');
  };
}
export function createHandler(api,{origins=['https://mofid-academy.github.io']}={}){
  return async req=>{
    const origin=req.headers.get('origin');
    const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store, private','Vary':'Origin','X-Content-Type-Options':'nosniff'};
    if(origin&&origins.includes(origin))headers['Access-Control-Allow-Origin']=origin;
    headers['Access-Control-Allow-Methods']='POST, OPTIONS';headers['Access-Control-Allow-Headers']='Content-Type, Accept';
    const respond=(b,status=200)=>new Response(JSON.stringify(b),{status,headers});
    if(origin&&!origins.includes(origin))return respond({ok:false,code:'ORIGIN_DENIED',message:'این مبدأ مجاز نیست.'},403);
    if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
    if(req.method!=='POST')return respond({ok:false,message:'روش درخواست معتبر نیست.'},405);
    try{
      if(Number(req.headers.get('content-length'))>2200000)return respond({ok:false,message:'درخواست بیش از حد بزرگ است.'},413);
      const raw=await req.text();if(raw.length>2200000)return respond({ok:false,message:'درخواست بیش از حد بزرگ است.'},413);
      let body;try{body=JSON.parse(raw);}catch{return respond({ok:false,message:'درخواست معتبر نیست.'},400);}
      return respond(await api.handle(body,{ip:req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown'}));
    }catch(e){return respond({ok:false,code:e.code||'SERVER_UNAVAILABLE',message:e instanceof ApiError?e.message:'ارتباط با سامانه برقرار نشد؛ دوباره تلاش کنید.'},e instanceof ApiError?e.status:503);}
  };
}
