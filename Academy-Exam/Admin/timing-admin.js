/* Academy timing controls for the admin studio. */
(function(){
"use strict";
async function readLiveTiming(){
 const url='https://raw.githubusercontent.com/mofid-academy/mofid-academy.github.io/main/Academy-Exam/timing.json';
 const r=await fetch(url+'?live='+Date.now()+'-'+Math.random().toString(36).slice(2),{cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(10000)});
 if(!r.ok)throw Error('خواندن زمان‌بندی تازه ناموفق بود؛ دوباره تلاش کنید.');
 const c=await r.json();
 if(typeof c.enabled!=='boolean'||!Number.isFinite(Number(c.durationMinutes))||Number(c.durationMinutes)<1||Number(c.durationMinutes)>480)throw Error('تنظیمات زمان‌بندی معتبر نیست.');
 for(const k of ['openAt','lastStartAt'])if(c[k]&&(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(c[k])||!Number.isFinite(Date.parse(c[k]+':00+03:30'))))throw Error('تاریخ زمان‌بندی معتبر نیست.');
 const epoch=Date.parse(r.headers.get('Date')||'');
 return {...c,durationMinutes:Number(c.durationMinutes),serverEpoch:Number.isFinite(epoch)?epoch:Date.now()};
}

const initial={version:1,enabled:true,openAt:"",lastStartAt:"",durationMinutes:15,timeZone:"Asia/Tehran",timeEndpoint:"",...(window.__ACADEMY_TIMING__||{})};
let cfg={...initial},previewRefreshTimer=0;

function el(tag,text,cls){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;}
function fa(v){return String(v).replace(/[0-9]/g,d=>"۰۱۲۳۴۵۶۷۸۹"[d]);}
function adminToken(){try{if(typeof window.__ACADEMY_GET_ADMIN_TOKEN__==="function")return String(window.__ACADEMY_GET_ADMIN_TOKEN__()||"").trim();}catch{}try{return typeof token!=="undefined"?String(token||"").trim():"";}catch{return "";}}
function setStatus(message,type){try{if(typeof status==="function")return status(message,type);}catch{}const s=document.getElementById("status");if(s){s.textContent=message;s.className="status"+(type?" "+type:"");}}
function previewRefreshSoon(){clearTimeout(previewRefreshTimer);previewRefreshTimer=setTimeout(()=>{const scene=document.getElementById("scene");if(scene)scene.dispatchEvent(new Event("change",{bubbles:true}));},120);}
function escHtml(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));}
function previewClock(){const m=Math.max(1,Math.min(480,Number(cfg.durationMinutes)||15));return String(m).padStart(2,"0")+":00";}

function patchPreview(){
 if(typeof window.AcademyPreview!=="function"){setTimeout(patchPreview,80);return;}
 if(window.AcademyPreview.__academyTimingPreview)return;
 const original=window.AcademyPreview;
 const wrapped=function(source,scene,settings={}){
  let out=original(source,scene,settings);
  if(cfg.enabled===false)return out;
  const clock=previewClock();
  const openText=cfg.openAt?"شروع تنظیم‌شده: "+fa(String(cfg.openAt).replace("T"," — "))+" تهران":"شروع آزمون فعلاً باز است";
  const css=`<style id="academy-preview-timing-style">.academy-preview-timer{display:flex;align-items:center;gap:7px;background:#fff;border:1px solid var(--line,#dbeae6);border-radius:99px;padding:7px 12px;font-size:.78rem;color:var(--ink-2,#496b67);white-space:nowrap;box-shadow:0 6px 18px rgba(11,110,106,.08)}.academy-preview-timer b{font:700 1rem/1.2 ui-monospace,Consolas,monospace;color:var(--teal-800,#0a6d65);direction:ltr}.academy-preview-time-note{margin-top:14px}.academy-preview-time-note strong{display:block;color:var(--teal-800,#0a6d65);margin-bottom:3px}@media(max-width:880px){.top{flex-wrap:wrap}.academy-preview-timer{order:4;margin-inline-start:auto}.pill{margin-inline-start:0}}</style>`;
  const badge=`<div class="academy-preview-timer" aria-label="پیش‌نمایش تایمر"><span>زمان آزمون</span><b>${clock}</b></div>`;
  out=out.replace("</head>",css+"</head>");
  out=out.replace(/(<div class="pill">[\s\S]*?<\/div>)/,`$1${badge}`);
  if(scene==="intro"){
   const noteText=escHtml(openText);
   const script=`<script>(function(){let n=0;function add(){const h=document.querySelector('#view .fade');if(!h){if(n++<40)setTimeout(add,60);return;}if(document.getElementById('academyPreviewTimingNote'))return;const d=document.createElement('div');d.id='academyPreviewTimingNote';d.className='note academy-preview-time-note';d.innerHTML='<div><strong>پیش‌نمایش زمان‌بندی</strong><span>${noteText}</span><br><span>هر شرکت‌کننده بعد از زدن «شروع آزمون»، ${fa(cfg.durationMinutes||15)} دقیقه کامل فرصت دارد.</span></div>';h.append(d);}setTimeout(add,80);})();<\/script>`;
   out=out.replace("</body>",script+"</body>");
  }
  return out;
 };
 wrapped.__academyTimingPreview=true;
 window.AcademyPreview=wrapped;
 previewRefreshSoon();
}

const style=document.createElement("style");
style.textContent=`.academy-time-hero{background:linear-gradient(145deg,#e8f7f1,#f8fcfa);border:1px solid #cbe8de;border-radius:14px;padding:14px;margin-bottom:18px}.academy-time-hero b{display:block;color:#0b6f5d;font-size:13px}.academy-time-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.academy-time-field{margin-bottom:14px}.academy-time-field label{display:block;font-weight:600;font-size:12px;margin-bottom:6px}.academy-time-field small{display:block;color:#728783;font-size:10px;line-height:1.8;margin-top:5px}.academy-time-field input{width:100%}.academy-time-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:18px}.academy-time-actions button{flex:1}.academy-time-summary{padding:12px;border:1px solid #dce9e5;background:#fbfdfc;border-radius:12px;font-size:11px;line-height:2;margin-top:12px}.academy-time-summary b{color:#087f75}@media(max-width:640px){.academy-time-grid{grid-template-columns:1fr}}`;
document.head.append(style);


async function saveTimingToGitHub(target,t){
 const apiUrl="https://api.github.com/repos/mofid-academy/mofid-academy.github.io/contents/Academy-Exam/timing.json";
 const headers={Accept:"application/vnd.github+json",Authorization:"Bearer "+t};
 const matches=value=>value&&value.updatedAt===target.updatedAt&&value.enabled===target.enabled&&value.durationMinutes===target.durationMinutes&&value.openAt===target.openAt&&value.lastStartAt===target.lastStartAt&&value.timeEndpoint===target.timeEndpoint;
 function decode(meta){try{return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(meta.content.replace(/\s/g,'')),c=>c.charCodeAt(0))));}catch{return null;}}
 async function request(url,options={}){
  const response=await fetch(url,{...options,headers:{...headers,...options.headers},credentials:"omit",referrerPolicy:"no-referrer",cache:"no-store",signal:AbortSignal.timeout(15000)});
  if(!response.ok){
   const error=new Error(response.status===401?"توکن GitHub معتبر نیست یا منقضی شده؛ از «اتصال ادمین» دوباره متصل شوید.":response.status===403?"GitHub اجازه ذخیره نداد؛ دسترسی Contents: Read and write و محدودیت درخواست‌ها را بررسی کنید.":response.status===404?"فایل زمان‌بندی یا دسترسی توکن به مخزن پیدا نشد.":"ذخیره زمان‌بندی در GitHub ناموفق بود ("+response.status+").");
   error.httpStatus=response.status;throw error;
  }
  return response.json();
 }
 const bytes=new TextEncoder().encode(JSON.stringify(target,null,2)+"\n");
 let binary="";for(const byte of bytes)binary+=String.fromCharCode(byte);
 let lastError;
 for(let attempt=0;attempt<3;attempt++){
  if(attempt)await new Promise(resolve=>setTimeout(resolve,700*attempt));
  try{
   // Re-read before every write: a lost response may follow a successful commit.
   const meta=await request(apiUrl+"?ref=main&live="+Date.now());
   if(matches(decode(meta)))return;
   await request(apiUrl,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:"Academy Studio: update exam timing",content:btoa(binary),sha:meta.sha,branch:"main"})});
   return;
  }catch(error){
   lastError=error;
   if(error.httpStatus&&![408,409,429,500,502,503,504].includes(error.httpStatus))throw error;
   // Public reading can confirm a commit even if the API response was lost.
   try{if(matches(await readLiveTiming()))return;}catch{}
  }
 }
 if(lastError&&lastError.httpStatus)throw lastError;
 throw Error("ارتباط با GitHub برقرار نشد و ذخیره تأیید نشد. ساعت‌های واردشده حفظ شده‌اند؛ اتصال اینترنت یا VPN را بررسی کنید و دوباره ذخیره را بزنید.");
}

function install(){
 const rail=document.querySelector(".rail"),fields=document.getElementById("fields"),studio=document.querySelector(".studio");
 if(!rail||!fields||!studio){setTimeout(install,80);return;}
 if(document.querySelector('[data-tab="timing"]'))return;
 const btn=document.createElement("button");btn.dataset.tab="timing";btn.innerHTML="<span>05</span>زمان‌بندی و تایمر";
 const connect=rail.querySelector('[data-tab="connect"]');rail.insertBefore(btn,connect||rail.lastElementChild);
 rail.querySelectorAll('[data-tab="connect"] span').forEach(x=>x.textContent="06");
 rail.querySelectorAll('[data-tab="advanced"] span').forEach(x=>x.textContent="07");
 rail.querySelectorAll('[data-tab="history"] span').forEach(x=>x.textContent="08");

 function draw(){
  const title=document.getElementById("panelTitle"),help=document.getElementById("panelHelp"),search=document.getElementById("search");
  if(title)title.textContent="زمان‌بندی و تایمر";
  if(help)help.textContent="هر نفر مدت کامل خودش را از لحظه شروع دریافت می‌کند؛ سؤال‌ها همچنان از n8n فعلی می‌آیند.";
  if(search)search.hidden=true;
  fields.replaceChildren();
  const root=el("div");
  root.innerHTML=`<div class="academy-time-hero"><b>زمان شخصی برای هر شرکت‌کننده</b><p>مثلاً اگر مدت ۱۵ دقیقه باشد، فردی که ساعت ۱۰:۰۸ شروع کند تا ۱۰:۲۳ فرصت دارد. Refresh زمان را ریست نمی‌کند.</p></div>
  <div class="field"><label><input id="tm-enabled" type="checkbox"> فعال بودن تایمر</label><small>در حالت خاموش، آزمون مثل قبل بدون محدودیت زمان است.</small></div>
  <div class="academy-time-grid">
   <div class="academy-time-field"><label>مدت آزمون برای هر نفر (دقیقه)</label><input id="tm-duration" type="number" min="1" max="480"><small>از لحظه زدن «شروع آزمون».</small></div>
   <div class="academy-time-field"><label>زمان باز شدن آزمون — تهران</label><input id="tm-open" type="datetime-local"><small>قبل از این زمان شروع امکان‌پذیر نیست. خالی = همین حالا باز.</small></div>
   <div class="academy-time-field"><label>آخرین زمان مجاز برای شروع — اختیاری</label><input id="tm-last" type="datetime-local"><small>بعد از این زمان شروع جدید بسته می‌شود؛ افراد شروع‌کرده زمان کامل خود را دارند.</small></div>
   <div class="academy-time-field"><label>سرویس زمان سرور — اختیاری</label><input id="tm-endpoint" type="url" dir="ltr" placeholder="https://.../webhook/exam-time"><small>خالی = زمان سرور GitHub Pages. سؤال‌ساز n8n تغییر نمی‌کند.</small></div>
  </div><div id="tm-summary" class="academy-time-summary"></div>
  <div class="academy-time-actions"><button id="tm-reset">پاک کردن ساعت‌های ورود</button><button class="primary" id="tm-save">ذخیره زمان‌بندی روی سایت</button></div><p id="tm-msg" class="tip"></p>`;
  fields.append(root);
  const en=root.querySelector("#tm-enabled"),du=root.querySelector("#tm-duration"),op=root.querySelector("#tm-open"),la=root.querySelector("#tm-last"),ep=root.querySelector("#tm-endpoint"),sum=root.querySelector("#tm-summary"),msg=root.querySelector("#tm-msg");
  en.checked=!!cfg.enabled;du.value=cfg.durationMinutes||15;op.value=cfg.openAt||"";la.value=cfg.lastStartAt||"";ep.value=cfg.timeEndpoint||"";
  const sync=()=>{cfg.enabled=en.checked;cfg.durationMinutes=Math.max(1,Math.min(480,+du.value||15));cfg.openAt=op.value;cfg.lastStartAt=la.value;cfg.timeEndpoint=ep.value.trim();sum.innerHTML="<b>رفتار فعلی:</b><br>"+(cfg.enabled?"هر نفر "+fa(cfg.durationMinutes)+" دقیقه کامل از شروع خودش فرصت دارد.":"تایمر غیرفعال است.")+"<br>"+(cfg.openAt?"باز شدن: "+fa(cfg.openAt.replace("T"," — "))+" تهران":"شروع آزمون فعلاً باز است.")+"<br>"+(cfg.lastStartAt?"آخرین شروع مجاز: "+fa(cfg.lastStartAt.replace("T"," — "))+" تهران":"آخرین زمان شروع محدود نشده است.")+"<br>مرجع زمان: "+(cfg.timeEndpoint?"سرویس اختصاصی":"زمان سرور GitHub Pages");previewRefreshSoon();};
  [en,du,op,la,ep].forEach(x=>x.addEventListener("input",sync));sync();
  root.querySelector("#tm-reset").onclick=()=>{op.value="";la.value="";sync();};
  root.querySelector("#tm-save").onclick=async()=>{
   sync();if(cfg.openAt&&cfg.lastStartAt&&cfg.lastStartAt<cfg.openAt){msg.textContent="آخرین زمان شروع نمی‌تواند قبل از زمان باز شدن باشد.";return;}
   if(cfg.timeEndpoint){try{const u=new URL(cfg.timeEndpoint);if(u.protocol!=="https:")throw 0;}catch{msg.textContent="آدرس سرویس زمان باید HTTPS باشد.";return;}}
   const t=adminToken();if(!t){msg.textContent="ابتدا از دکمه «اتصال ادمین» بالای صفحه به GitHub متصل شو.";return;}
   const saveButton=root.querySelector("#tm-save");saveButton.disabled=true;
   msg.textContent="در حال ذخیره و بررسی تنظیمات زنده…";
   try{
    const target={...cfg,version:1,timeZone:"Asia/Tehran",updatedAt:new Date().toISOString()};
    await saveTimingToGitHub(target,t);
    let verified=false;
    // Verify the exact version at the same source used by participants.
    for(let attempt=0;attempt<4;attempt++){
     if(attempt)await new Promise(resolve=>setTimeout(resolve,1200));
     try{const fresh=await readLiveTiming();verified=fresh.updatedAt===target.updatedAt&&fresh.enabled===target.enabled&&fresh.durationMinutes===target.durationMinutes&&fresh.openAt===target.openAt&&fresh.lastStartAt===target.lastStartAt;if(verified)break;}catch{}
    }
    cfg={...target};window.__ACADEMY_TIMING__={...target};
    try{localStorage.setItem('academy-timing-live',target.updatedAt);const c=new BroadcastChannel('academy-timing-live');c.postMessage({revision:target.updatedAt});c.close();}catch{}
    if(verified){msg.textContent='ذخیره و خواندن نسخه جدید تأیید شد؛ صفحات منتظر حداکثر در بررسی بعدی (۱۰ ثانیه) به‌روز می‌شوند. مهلت افراد شروع‌کرده ثابت می‌ماند.';setStatus('زمان‌بندی زنده به‌روز شد.','success');}
    else{msg.textContent='در GitHub ذخیره شد، اما خواندن نسخه تازه هنوز تأیید نشده است. انتشار Pages لازم نیست؛ کمی بعد سایت را دوباره بررسی کنید.';setStatus('ذخیره انجام شد؛ تأیید دسترسی به نسخه تازه در انتظار است.','warning');}
    previewRefreshSoon();
   }catch(e){msg.textContent='ذخیره یا تأیید ناموفق: '+String(e.message||e);}
   finally{saveButton.disabled=false;}

  };
 }
 btn.onclick=()=>{document.querySelectorAll("[data-tab]").forEach(x=>x.classList.toggle("active",x===btn));studio.classList.remove("questions-mode");draw();};
}
patchPreview();
install();
})();

