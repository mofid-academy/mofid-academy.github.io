/* The existing authenticated bridge owns writes to the public access flag. */
(function(){
 'use strict';
 const path='/repos/mofid-academy/mofid-academy.github.io/contents/Academy-Exam/timing.json';
 const origin=location.origin,testURL=new URL('../?academy-test=1',location.href);
 const type='academy-admin-test-v1',sessions=new Map();
 let busy=false,epoch=0,shown=null;
 const api=()=>window.__ACADEMY_ADMIN__;
 const copy=x=>JSON.parse(JSON.stringify(x));
 function message(text){const node=shown?.querySelector('#site-lock-message');if(node){node.textContent=text;node.hidden=!text;}}
 function currentKey(){return String(api()?.token()||'');}
 function access(config){return config?.accessLock?.locked===true;}
 function update(config){
  const value=config.accessLock?copy(config.accessLock):null;
  const timing={...(window.__ACADEMY_TIMING__||{})};
  if(value)timing.accessLock=value;else delete timing.accessLock;
  window.__ACADEMY_TIMING__=timing;
  window.dispatchEvent(new CustomEvent('academy-site-access-changed',{detail:value}));
  render();
 }
 function render(){
  if(!shown?.isConnected)return;
  const locked=access(window.__ACADEMY_TIMING__);
  const status=shown.querySelector('#site-lock-state'),toggle=shown.querySelector('#site-lock-toggle');
  status.textContent=locked?'ورود شرکت‌کننده‌های جدید بسته است':'ورود شرکت‌کننده‌ها باز است؛ زمان‌بندی آزمون اجرا می‌شود';
  status.dataset.locked=String(locked);
  toggle.textContent=locked?'باز کردن ورود شرکت‌کننده‌ها':'بستن ورود شرکت‌کننده‌ها';
  toggle.disabled=busy;
 }
 async function request(method,key,body){
  if(typeof window.__ACADEMY_ADMIN_REQUEST__!=='function')throw Error('مسیر امن ادمین آماده نیست؛ پنل را دوباره باز کنید.');
  const r=await window.__ACADEMY_ADMIN_REQUEST__({method,path:path+(method==='GET'?'?ref=main&live='+Date.now():''),body,key,signal:AbortSignal.timeout(20000)});
  if(!r.ok)throw Error('پاسخ ذخیرهٔ تنظیمات معتبر نیست.');
  return r.json();
 }
 async function read(key){
  const meta=await request('GET',key);
  let config;
  try{config=JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(meta.content.replace(/\s/g,'')),c=>c.charCodeAt(0))));}catch{throw Error('فایل تنظیمات سایت معتبر نیست؛ تغییری ذخیره نشد.');}
  if(!config||typeof config!=='object'||Array.isArray(config)||!/^[0-9a-f]{40}$/.test(meta.sha||''))throw Error('نسخهٔ تنظیمات سایت معتبر نیست.');
  return {config,sha:meta.sha};
 }
 function sessionMatches(key,version){
  if(currentKey()!==key||version!==epoch)throw Error('جلسهٔ مدیریت تغییر کرده است؛ دوباره وارد شوید و وضعیت قفل را بررسی کنید.');
 }
 async function setLocked(locked){
  if(busy)return;
  const key=currentKey(),version=epoch;
  if(!key){message('ابتدا با دکمهٔ «اتصال ادمین» وارد مدیریت شوید.');return;}
  busy=true;render();message('در حال ذخیره و بررسی قفل ورود…');
  const target={version:1,locked,revision:'lock_'+crypto.randomUUID(),updatedAt:new Date().toISOString()};
  const matches=c=>c?.accessLock?.revision===target.revision&&c.accessLock.locked===locked;
  try{
   let saved=null,lastError=null;
   for(let attempt=0;attempt<3&&!saved;attempt++){
    sessionMatches(key,version);
    const current=await read(key);
    sessionMatches(key,version);
    if(matches(current.config)){saved=current.config;break;}
    const config={...current.config,accessLock:target};
    const bytes=new TextEncoder().encode(JSON.stringify(config,null,2)+'\n');
    let binary='';for(const b of bytes)binary+=String.fromCharCode(b);
    try{
     await request('PUT',key,{branch:'main',sha:current.sha,content:btoa(binary),message:'Academy: '+(locked?'close':'open')+' participant entry'});
    }catch(error){lastError=error;if(error.httpStatus&&![408,409,429,500,502,503,504].includes(error.httpStatus))throw error;}
    sessionMatches(key,version);
    // A green workflow or a lost write response is not proof; read it back.
    const verified=await read(key);
    sessionMatches(key,version);
    if(matches(verified.config))saved=verified.config;
    else if(!lastError)throw Error('تنظیمات هم‌زمان تغییر کرده است؛ وضعیت قفل را تازه بررسی کنید.');
   }
   if(!saved)throw lastError||Error('ذخیرهٔ قفل تأیید نشد؛ پیش از تکرار، وضعیت فعلی را بررسی کنید.');
   update(saved);
   const revision=target.revision;
   try{localStorage.setItem('academy-timing-live',revision);const channel=new BroadcastChannel('academy-timing-live');channel.postMessage({revision});channel.close();}catch{}
   message(locked?'بسته‌شدن ورود ذخیره و تأیید شد. برای بررسی سایت، «آزمایش خصوصی سایت» را بزنید.':'بازشدن ورود ذخیره و تأیید شد. شرکت‌کننده‌ها می‌توانند طبق زمان‌بندی آزمون را شروع کنند.');
   api()?.status(locked?'ورود شرکت‌کننده‌ها بسته شد؛ انتشار آزمون همچنان فعال است.':'قفل ورود برداشته شد.','success');
  }catch(error){
   if(currentKey()===key&&version===epoch){
    try{update((await read(key)).config);}catch{}
    message(String(error.message||error)+' قبل از تکرار، وضعیت قفل را بررسی کنید.');
   }
  }finally{busy=false;render();}
 }
 function revoke(){
  epoch++;
  for(const [win,session]of sessions){try{win.postMessage({type,action:'end',nonce:session.nonce},origin);}catch{}}
  sessions.clear();
 }
 function openTest(){
  const key=currentKey();
  if(!key){message('ابتدا وارد ادمین شوید؛ آزمایش فقط از همین پنل باز می‌شود.');return;}
  testURL.searchParams.set('live',String(Date.now()));
  const win=window.open(testURL.href,'_blank');
  if(!win){message('مرورگر پنجرهٔ آزمایش را باز نکرد؛ اجازهٔ بازشدن پنجره را برای این سایت بدهید.');return;}
  sessions.set(win,{key,nonce:'',id:crypto.randomUUID()});
  message('آزمایش ادمین در پنجرهٔ جدا باز شد. پنل را باز نگه دارید؛ پاسخ مانند آزمون اصلی ثبت و تصحیح می‌شود. پس از بررسی می‌توانید آن را از نتایج حذف کنید.');
 }
 window.addEventListener('message',event=>{
  const data=event.data,session=sessions.get(event.source);
  if(event.origin!==origin||!session||data?.type!==type)return;
  if(currentKey()!==session.key){
   event.source.postMessage({type,action:'end',nonce:data.nonce},origin);sessions.delete(event.source);return;
  }
  if(data.action==='ready'&&/^[0-9a-f-]{36}$/.test(data.nonce||'')){
   session.nonce=data.nonce;
   event.source.postMessage({type,action:'grant',nonce:data.nonce,key:session.key,id:session.id},origin);
  }else if(data.nonce===session.nonce&&data.action==='ping'){
   event.source.postMessage({type,action:'pong',nonce:session.nonce,request:data.request,active:true},origin);
  }else if(data.nonce===session.nonce&&data.action==='closed')sessions.delete(event.source);
 });
 setInterval(()=>{
  for(const [win,session]of sessions){
   if(win.closed){sessions.delete(win);continue;}
   if(currentKey()!==session.key){try{win.postMessage({type,action:'end',nonce:session.nonce},origin);}catch{}sessions.delete(win);}
  }
 },1500);
 window.addEventListener('pagehide',revoke);
 window.addEventListener('academy-site-access-changed',render);
 document.getElementById('logout')?.addEventListener('click',revoke);
 function mount(host){
  shown=host;host.className='academy-time-hero academy-site-access';
  host.innerHTML='<b>قفل موقت ورود به آزمون</b><p id="site-lock-state" role="status"></p><div class="academy-time-actions"><button id="site-lock-toggle"></button><button id="site-admin-test">آزمایش خصوصی سایت</button></div><p class="tip">قفل فقط شروع جدید را می‌بندد؛ آزمون افراد شروع‌کرده قطع نمی‌شود. انتشار سؤال‌ها و تنظیم ساعت مستقل از قفل است. صفحات منتظر وضعیت را هر ۱۰ ثانیه و پیش از شروع بررسی می‌کنند.</p><p id="site-lock-message" class="tip" role="status"></p>';
  host.querySelector('#site-lock-toggle').onclick=()=>setLocked(!access(window.__ACADEMY_TIMING__));
  host.querySelector('#site-admin-test').onclick=openTest;
  message('');render();
  if(!busy)window.__ACADEMY_PUBLIC_NETWORK__?.readTiming().then(config=>{if(shown===host&&!busy)update(config);}).catch(()=>message('وضعیت زنده دریافت نشد؛ هنگام تغییر قفل، نسخهٔ تازهٔ تنظیمات بررسی می‌شود.'));
 }
 window.__ACADEMY_SITE_ACCESS__=Object.freeze({mount});
 const host=document.getElementById('academy-site-access');if(host)mount(host);
})();
