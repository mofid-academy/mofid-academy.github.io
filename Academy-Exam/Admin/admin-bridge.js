/* Opt-in Academy admin transport. No GitHub token belongs in this document. */
(function(){
 'use strict';
 const nativeFetch=window.fetch.bind(window);
 const endpoint='https://miladmirsheriam.app.n8n.cloud/webhook/academy-admin-api';
 async function requestViaBridge({method='GET',path,body,key,accept='application/vnd.github+json',signal}={}){
   method=String(method).toUpperCase();
   if(!['GET','PUT'].includes(method)||typeof path!=='string'||!path.startsWith('/')||path.length>1000||/[\\#\r\n]/.test(path))throw Error('درخواست مدیریت معتبر نیست.');
   if(!/^[\x21-\x7e]{16,128}$/.test(key)||/^(github_pat_|ghp_)/.test(key))throw Error('رمز مخصوص ادمین را وارد کنید؛ توکن GitHub فقط در n8n تنظیم می‌شود.');
   let r;
   try{r=await nativeFetch(endpoint,{method:'POST',mode:'cors',credentials:'omit',redirect:'error',cache:'no-store',referrerPolicy:'no-referrer',signal:signal||AbortSignal.timeout(30000),headers:{'Content-Type':'text/plain;charset=UTF-8','X-Academy-Admin-Key':key},body:JSON.stringify({method,path,body,accept})});}
   catch{throw Error('پاسخ سرور مدیریت دریافت نشد؛ اگر در حال ذخیره بودید، قبل از تکرار وضعیت فایل را بررسی کنید.');}
   if(r.status===401||r.status===403)throw Error('رمز ادمین پذیرفته نشد؛ رمز Credential وب‌هوک را بررسی کنید.');
   if(r.status===404)throw Error('مسیر مدیریت هنوز فعال نیست؛ ورک‌فلوی Academy Admin Bridge را در n8n منتشر کنید.');
   if(!r.ok)throw Error('سرور مدیریت پاسخ معتبر نداد؛ اجرای n8n را بررسی کنید.');
   let data;try{data=await r.json();}catch{throw Error('پاسخ سرور مدیریت قابل بررسی نیست.');}
   if(data?.bridge!=='academy-admin-v1'||!Number.isInteger(data.status)||data.status<200||data.status>599||!["json","text"].includes(data.format))throw Error('نسخه یا ساختار پاسخ سرور مدیریت معتبر نیست.');
   if(data.status>=400){
     const messages={400:'درخواست مدیریت معتبر نیست.',401:'Credential گیت‌هاب در n8n نامعتبر یا منقضی است.',403:'دسترسی Credential گیت‌هاب کافی نیست یا محدودیت درخواست فعال شده است.',404:'فایل یا دسترسی مخزن در n8n پیدا نشد.',409:'نسخه فایل تغییر کرده است؛ پیش‌نویس را نگه دارید و نسخه سایت را دوباره دریافت کنید.',422:'ذخیره توسط GitHub پذیرفته نشد؛ مجوز و قوانین مخزن را بررسی کنید.',502:'اتصال n8n به GitHub تایید نشد؛ ذخیره ممکن است انجام شده باشد. قبل از تکرار بررسی کنید.'};
     let message=messages[data.status]||'ذخیره توسط سرور مدیریت تایید نشد.';
     if(data.status===400&&data.body?.source==='github')message='گیت‌هاب درخواست انتشار را نپذیرفت؛ ذخیره انجام نشد.';
     if(data.body?.code==='GITHUB_BODY_FORMAT')message='بدنه انتشار در n8n با قالب درست ارسال نشده است؛ تنظیم ارسال ورک‌فلوی مدیریت باید اصلاح شود.';
     if(data.status===400&&data.body?.source==='validation')message='اطلاعات درخواست انتشار کامل یا معتبر نیست.';
     if(typeof data.body?.code==='string'&&/^[A-Z_0-9]{1,64}$/.test(data.body.code))message+=' کد: '+data.body.code;
     const error=Error(message);error.httpStatus=data.status;throw error;
   }
   return new Response(data.format==='text'?data.body:JSON.stringify(data.body),{status:data.status,headers:{'Content-Type':data.format==='text'?'text/plain;charset=UTF-8':'application/json'}});
 }
 async function bridgeFetch(input,options={}){
   const url=new URL(typeof input==='string'?input:input.url,location.href);
   if(url.origin!=='https://api.github.com')return nativeFetch(input,options);
   const h=new Headers(options.headers||{}),auth=h.get('Authorization')||'',key=auth.startsWith('Bearer ')?auth.slice(7):'';
   let body;if(options.body){try{body=JSON.parse(options.body);}catch{throw Error('درخواست ذخیره معتبر نیست.');}}
   return requestViaBridge({method:options.method||'GET',path:url.pathname+url.search,body,key,accept:h.get('Accept')||'application/vnd.github+json',signal:options.signal});
 }
 window.__ACADEMY_ADMIN_REQUEST__=requestViaBridge;
 window.fetch=bridgeFetch;
 window.__ACADEMY_ADMIN_TRANSPORT__='n8n-v1';
})();


