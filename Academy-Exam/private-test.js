/* Authenticated admin testing uses the real submission and grading path. */
(function(){
 'use strict';
 const assets=new URL('.',document.currentScript.src),origin=location.origin;
 const messageType='academy-admin-test-v1';
 function bridge(){
  if(typeof window.__ACADEMY_ADMIN_REQUEST__==='function')return Promise.resolve();
  return new Promise((resolve,reject)=>{
   const script=document.createElement('script');
   const url=new URL('Admin/admin-bridge.js',assets);url.searchParams.set('academy_live',Date.now()+'-'+Math.random().toString(36).slice(2));script.src=url.href;
   script.onload=resolve;script.onerror=()=>reject(Error('مسیر بررسی ورود ادمین بارگذاری نشد.'));
   document.head.append(script);
  });
 }
 async function authorize(){
  if(new URL(location.href).searchParams.get('academy-test')!=='1')return null;
  const owner=window.opener;
  if(!owner||owner.closed)throw Error('آزمایش خصوصی را با دکمهٔ «آزمایش خصوصی سایت» از پنل ادمین باز کنید.');
  const nonce=crypto.randomUUID();
  let grant=await new Promise((resolve,reject)=>{
   const timeout=setTimeout(()=>finish(Error('جلسهٔ ادمین برای آزمایش تأیید نشد؛ آزمایش را دوباره از پنل باز کنید.')),20000);
   const receive=event=>{
    if(event.origin!==origin||event.source!==owner||event.data?.type!==messageType||event.data?.nonce!==nonce)return;
    if(event.data.action==='grant'&&typeof event.data.key==='string')finish(null,{key:event.data.key,id:event.data.id});
    else if(event.data.action==='end')finish(Error('برای آزمایش، ابتدا وارد پنل ادمین شوید.'));
   };
   function finish(error,value){clearTimeout(timeout);window.removeEventListener('message',receive);error?reject(error):resolve(value);}
   window.addEventListener('message',receive);
   owner.postMessage({type:messageType,action:'ready',nonce},origin);
  });
  const sessionId=/^[0-9a-f-]{36}$/.test(grant.id||'')?grant.id:nonce;
  let key=grant.key;grant=null;
  try{
   await bridge();
   const response=await window.__ACADEMY_ADMIN_REQUEST__({method:'GET',path:'/user',key,signal:AbortSignal.timeout(20000)});
   const user=await response.json();
   if(!response.ok||typeof user?.login!=='string'||!user.login)throw Error('ورود ادمین برای آزمایش تأیید نشد.');
  }finally{key='';}
  let active=true,attached=false,lastCheck=0,check=null,endHandler=null,pending=null,closeTimer=0;
  function end(){
   if(!active)return;active=false;clearInterval(closeTimer);
   if(pending){pending(false);pending=null;}
   endHandler?.();
  }
  function attach(){
   if(attached)return;attached=true;
   window.addEventListener('message',event=>{
    if(event.origin!==origin||event.source!==owner||event.data?.type!==messageType||event.data?.nonce!==nonce)return;
    if(event.data.action==='end')end();
    else if(event.data.action==='pong'&&event.data.request===check&&pending){
     if(event.data.active===true){lastCheck=Date.now();const resolve=pending;pending=null;resolve(true);}
     else end();
    }
   });
   closeTimer=setInterval(()=>{if(owner.closed)end();},3000);
   // Only the normal public answer endpoint may receive writes from this tab.
   const original=window.fetch.bind(window);
   window.fetch=async(input,options={})=>{
    const method=String(options.method||(input instanceof Request?input.method:'GET')).toUpperCase();
    if(!['GET','HEAD'].includes(method)){
     const url=new URL(input instanceof Request?input.url:String(input),location.href);
     if(method!=='POST'||url.href!=='https://miladmirsheriam.app.n8n.cloud/webhook/academy-submit-v5')throw Error('این مسیر ارسال در آزمایش ادمین مجاز نیست.');
     if(!await ensure())throw Error('جلسهٔ آزمایش پایان یافته است؛ پاسخ‌ها حفظ شده‌اند.');
    }
    return original(input,options);
   };
  }
  async function ensure(){
   if(!active||owner.closed){end();return false;}
   if(Date.now()-lastCheck<500)return true;
   if(pending)return false;
   check=crypto.randomUUID();
   return new Promise(resolve=>{
    const timeout=setTimeout(()=>end(),6000);
    pending=value=>{clearTimeout(timeout);resolve(value);};
    owner.postMessage({type:messageType,action:'ping',nonce,request:check},origin);
   });
  }
  return Object.freeze({attach,ensure,isActive:()=>active,onEnd:handler=>{endHandler=handler;if(!active)handler();},id:sessionId});
 }
 window.__ACADEMY_ADMIN_TEST__=Object.freeze({authorize});
})();
