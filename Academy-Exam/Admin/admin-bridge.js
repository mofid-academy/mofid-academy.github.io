/* Opt-in Academy admin transport. No GitHub token belongs in this document. */
(function(){
 'use strict';
 const nativeFetch=window.fetch.bind(window);
 const endpoint='https://miladmirsheriseyed.app.n8n.cloud/webhook/academy-admin-api';
 async function bridgeFetch(input,options={}){
   const url=new URL(typeof input==='string'?input:input.url,location.href);
   if(url.origin!=='https://api.github.com')return nativeFetch(input,options);
   const h=new Headers(options.headers||{});
   const auth=h.get('Authorization')||'';
   const key=auth.startsWith('Bearer ')?auth.slice(7):'';
   if(!/^[\x21-\x7e]{16,128}$/.test(key)||/^(github_pat_|ghp_)/.test(key))throw Error('رمز مخصوص ادمین را وارد کنید؛ توکن GitHub فقط در n8n تنظیم می‌شود.');
   let body;
   if(options.body){try{body=JSON.parse(options.body);}catch{throw Error('درخواست ذخیره معتبر نیست.');}}
   let r;
   try{r=await nativeFetch(endpoint,{method:'POST',mode:'cors',credentials:'omit',redirect:'error',cache:'no-store',referrerPolicy:'no-referrer',signal:options.signal||AbortSignal.timeout(30000),headers:{'Content-Type':'text/plain;charset=UTF-8','X-Academy-Admin-Key':key},body:JSON.stringify({method:options.method||'GET',path:url.pathname+url.search,body,accept:h.get('Accept')})});}
   catch{throw Error('پاسخ سرور مدیریت دریافت نشد؛ اگر در حال ذخیره بودید، قبل از تکرار وضعیت فایل را بررسی کنید.');}
   if(r.status===401||r.status===403)throw Error('رمز ادمین پذیرفته نشد؛ رمز Credential وب‌هوک را بررسی کنید.');
   if(r.status===404)throw Error('مسیر مدیریت هنوز فعال نیست؛ ورک‌فلوی Academy Admin Bridge را در n8n منتشر کنید.');
   if(!r.ok)throw Error('سرور مدیریت پاسخ معتبر نداد؛ اجرای n8n را بررسی کنید.');
   let data;try{data=await r.json();}catch{throw Error('پاسخ سرور مدیریت قابل بررسی نیست.');}
   if(data?.bridge!=='academy-admin-v1'||!Number.isInteger(data.status)||data.status<200||data.status>599||!["json","text"].includes(data.format))throw Error('نسخه یا ساختار پاسخ سرور مدیریت معتبر نیست.');
   if(data.status>=400){
     const messages={400:'درخواست مدیریت معتبر نیست.',401:'Credential گیت‌هاب در n8n نامعتبر یا منقضی است.',403:'دسترسی Credential گیت‌هاب کافی نیست یا محدودیت درخواست فعال شده است.',404:'فایل یا دسترسی مخزن در n8n پیدا نشد.',409:'نسخه فایل تغییر کرده است؛ پیش‌نویس را نگه دارید و نسخه سایت را دوباره دریافت کنید.',422:'ذخیره توسط GitHub پذیرفته نشد؛ مجوز و قوانین مخزن را بررسی کنید.',502:'اتصال n8n به GitHub تایید نشد؛ ذخیره ممکن است انجام شده باشد. قبل از تکرار بررسی کنید.'};
     const error=Error(messages[data.status]||'ذخیره توسط سرور مدیریت تایید نشد.');error.httpStatus=data.status;throw error;
   }
   return new Response(data.format==='text'?data.body:JSON.stringify(data.body),{status:data.status,headers:{'Content-Type':data.format==='text'?'text/plain;charset=UTF-8':'application/json'}});
 }
 window.fetch=bridgeFetch;
 window.__ACADEMY_ADMIN_TRANSPORT__='n8n-v1';
})();
