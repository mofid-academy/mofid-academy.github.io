/* Academy Studio. Only GitHub authorizes writes; no passwords in this file. */
(function(){
"use strict";
const REPO="mofid-academy/mofid-academy.github.io",PATH="Academy-Exam/index.html",BRANCH="main";
const API="https://api.github.com",ENDPOINT="/repos/"+REPO+"/contents/"+PATH;
const LIVE="https://mofid-academy.github.io/Academy-Exam/index.html",DRAFT="academy-studio-draft-v2";
const OFFLINE="__ACADEMY_OFFLINE_BASE64__";
const $=id=>document.getElementById(id);
let token="",login="",model=null,loadedSHA="",publishedSource="",active="questions",undoStack=[],timer=0,publishing=false,checking=0;
const titles={questions:"مدیریت سؤال‌ها",text:"نوشته‌ها",color:"رنگ‌ها",style:"فونت و چیدمان",image:"لوگو و تصاویر",connect:"اتصال n8n",advanced:"ویرایش پیشرفته",history:"نسخه‌ها و پشتیبان"};
const help={
questions:"سؤال بساز، با کشیدن یا دکمه‌های ↑ ↓ جابه‌جا کن و نوع پاسخ را تغییر بده. ظاهر فرم اصلی حفظ می‌شود.",
text:"متن‌های ثابت و پیام‌های تمام مراحل. متغیرهای {1} و {2} را حفظ کن؛ مقدارشان هنگام آزمون جایگزین می‌شود.",
color:"رنگ‌های موجود در فایل خودت. تغییر هر مقدار در همه قسمت‌هایی که همان رنگ را دارند اعمال می‌شود.",
style:"یک بخش و اندازه نمایش را انتخاب کن. خانه خالی یعنی حفظ تنظیم فعلی. اندازه‌ها را با px، rem یا % بنویس.",
image:"تصویر کامل جایگزین می‌شود؛ برش یا بازطراحی نمی‌شود. لوگوی بالا و صفحه پایان مستقل هستند.",
connect:"دریافت سؤال‌های فعلی و ارسال پاسخ‌ها. سؤال‌های دلخواه در بخش مدیریت سؤال‌ها هستند؛ کلید تصحیح محرمانه در سرور می‌ماند.",
advanced:"برای تغییرهای تخصصی: CSS تکمیلی و کل کد HTML. شناسه‌های اصلی فرم را حفظ کن و پیش‌نمایش را بررسی کن.",
history:"نسخه‌های قبلی در GitHub باقی می‌مانند. بازگردانی ابتدا در پیش‌نمایش انجام می‌شود؛ تغییر سایت نیاز به انتشار دارد."
};
function el(tag,text,cls){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;}
function status(s,kind=""){$("status").textContent=s;$("status").className="status "+kind;}
function fail(e){status(e.message||String(e),"error");}
function decode64(s){return new TextDecoder().decode(Uint8Array.from(atob(s.replace(/\s/g,"")),c=>c.charCodeAt(0)));}
function encode64(s){const b=new TextEncoder().encode(s);let raw="";for(let i=0;i<b.length;i+=8192)raw+=String.fromCharCode(...b.subarray(i,i+8192));return btoa(raw);}
async function api(path,opt={}){
 if(!path.startsWith("/repos/"+REPO+"/")&&path!=="/repos/"+REPO&&path!=="/user")throw Error("مسیر API مجاز نیست.");
 const headers={Accept:"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28",...opt.headers};
 if(token)headers.Authorization="Bearer "+token;if(opt.body)headers["Content-Type"]="application/json";
 const r=await fetch(API+path,{...opt,headers,cache:"no-store",credentials:"omit",redirect:"error",referrerPolicy:"no-referrer",signal:AbortSignal.timeout(25000)});
 if(!r.ok){
  const errors={401:"کلید نامعتبر یا منقضی است. دوباره متصل شو.",403:"GitHub اجازه این درخواست را نداد. مجوز Contents: Read and write، تأیید سازمان و محدودیت تعداد درخواست‌ها را بررسی کن.",404:"فایل یا دسترسی پیدا نشد. Resource owner باید mofid-academy باشد.",409:"فایل روی GitHub هم‌زمان تغییر کرده است. پیش‌نویس را دانلود کن و نسخه جدید سایت را دریافت کن.",422:"GitHub تغییر را نپذیرفت. قوانین شاخه یا محتوای درخواست را بررسی کن."};
  throw Error(errors[r.status]||"خطای GitHub: "+r.status);
 }return r;
}
async function readFile(ref=BRANCH){
 const path=ENDPOINT+"?ref="+encodeURIComponent(ref),d=await(await api(path)).json();
 const source=d.encoding==="base64"?decode64(d.content):await(await api(path,{headers:{Accept:"application/vnd.github.raw+json"}})).text();
 return {source,sha:d.sha};
}
function download(s,name,type="text/html;charset=utf-8"){const url=URL.createObjectURL(new Blob([s],{type})),a=el("a");a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),2500);}
function current(){if(!model)throw Error("ابتدا فرم را بارگذاری کن.");return model.build();}
function dirty(){try{return !!model&&current()!==publishedSource;}catch{return true;}}
function state(){
 document.querySelector(".studio").inert=publishing;
 const d=dirty();$("dirty").textContent=!loadedSHA?"نسخه آفلاین":d?"تغییر منتشرنشده":"همگام با نسخه سایت";$("dirty").className="badge"+(d?" changed":"");
 $("publish").disabled=!model||!token||publishing||!d||!loadedSHA;$("undo").disabled=!undoStack.length||publishing;
 $("loginBtn").textContent=login?"متصل: "+login:"اتصال ادمین";
}
function snapshot(){try{const s=current();if(undoStack.at(-1)!==s){undoStack.push(s);if(undoStack.length>20)undoStack.shift();}}catch{}}
function changed(){
 clearTimeout(timer);timer=setTimeout(()=>{
  try{const s=current();model.validate(s);let storageOK=true;
   try{localStorage.setItem(DRAFT,JSON.stringify({source:s,baseSHA:loadedSHA,at:new Date().toISOString()}));}catch{storageOK=false;}
   state();preview();if(!storageOK)status("پیش‌نویس فقط در حافظه است؛ برای حفظ آن از بخش نسخه‌ها فایل HTML را دانلود کن.");
  }catch(e){fail(e);$("publish").disabled=true;}
 },300);
}
function setSource(s,remember=true){
 const next=new AcademyModel(s);next.validate(s);
 if(model&&remember)snapshot();model=next;if(!model.questionBank.questions.some(q=>q.id===selectedQuestionId))selectedQuestionId=model.questionBank.questions[0]?.id||"";render();state();preview();
}
async function loadLatest(initial=false){
 if(!initial&&dirty()&&!confirm("تغییرهای منتشرنشده کنار گذاشته شود؟ پیش از ادامه می‌توانی آن‌ها را دانلود کنی."))return;
 status("در حال خواندن آخرین نسخه از GitHub…");
 try{const d=await readFile();loadedSHA=d.sha;publishedSource=d.source;undoStack=[];setSource(d.source,false);status("آخرین نسخه آماده است. تغییرها تا انتشار فقط در پیش‌نمایش هستند.");}
 catch(e){
  if(!model){try{publishedSource=decode64(OFFLINE);setSource(publishedSource,false);status("GitHub در دسترس نبود؛ نسخه مرجع برای ویرایش آفلاین باز شد. انتشار تا دریافت نسخه سایت غیرفعال است.","error");}catch{fail(e);}}
  else fail(e);
 }
}
function box(label,helpText,id){
 const n=el("div",undefined,"field");if(id)n.dataset.field=id;const labelEl=el("label",label);n.append(labelEl);if(helpText)n.append(el("small",helpText));return n;
}
function tab(t){active=t;document.querySelector(".studio").classList.toggle("questions-mode",t==="questions");$("search").value="";document.querySelectorAll("[data-tab]").forEach(n=>n.classList.toggle("active",n.dataset.tab===t));render();}
function render(){
 $("panelTitle").textContent=titles[active];$("panelHelp").textContent=help[active];$("search").hidden=!["text","color"].includes(active);
 const root=$("fields");root.replaceChildren();if(!model){root.append(el("p","در حال دریافت فرم…"));return;}
 if(active==="questions")questionControls(root);
 else if(active==="text"){
  const q=$("search").value.trim().toLowerCase();let group="";
  const types=["static","attr","display","text"];
  const fs=model.fields.filter(f=>types.includes(f.kind)).sort((a,b)=>types.indexOf(a.kind)-types.indexOf(b.kind));
  for(const f of fs){
   if(q&&!String(model.values[f.id]).toLowerCase().includes(q)&&!f.group.includes(q))continue;
   if(group!==f.group){group=f.group;root.append(el("h2",group,"group-title"));}
   const b=box(f.label,f.help,f.id),input=el("textarea");input.rows=2;input.value=model.values[f.id];input.id="field-"+f.id;b.querySelector("label").htmlFor=input.id;
   input.onfocus=snapshot;input.oninput=()=>{model.values[f.id]=input.value;changed();};b.insertBefore(input,b.querySelector("small"));root.append(b);
  }
 }else if(active==="color"){
  root.append(el("p","مقادیر rgba شامل شفافیت هستند. برای حفظ شفافیت، کد را ویرایش کن؛ انتخابگر رنگ، رنگ مات می‌سازد.","tip"));
  for(const f of model.fields.filter(f=>f.kind==="color")){
   if($("search").value&&!f.value.includes($("search").value))continue;
   const b=box("رنگ "+f.value,"در تمام استفاده‌های همین مقدار رنگ اعمال می‌شود.",f.id),row=el("div",undefined,"color-row");
   const picker=el("input"),input=el("input");picker.type="color";picker.value=hex(model.values[f.id]);picker.setAttribute("aria-label","انتخاب رنگ");input.type="text";input.value=model.values[f.id];input.dir="ltr";input.setAttribute("aria-label","کد رنگ");
   input.onfocus=picker.onfocus=snapshot;input.oninput=()=>{if(CSS.supports("color",input.value)){model.values[f.id]=input.value;picker.value=hex(input.value);changed();}};
   picker.oninput=()=>{model.values[f.id]=input.value=picker.value;changed();};row.append(picker,input);b.insertBefore(row,b.querySelector("small"));root.append(b);
  }
 }else if(active==="style")styles(root);
 else if(active==="image")images(root);
 else if(active==="connect"){
  root.append(el("p","آدرس‌های فعلی حفظ شده‌اند. کلید API، رمز n8n یا پاسخ صحیح سؤال‌ها را وارد نکن؛ فایل فرم عمومی است.","tip"));
  for(const f of model.fields.filter(f=>f.kind==="url")){
   const b=box(f.label,"باید HTTPS و با تنظیم CORS مناسب در سرور باشد.",f.id),input=el("textarea");input.dir="ltr";input.value=model.values[f.id];input.onfocus=snapshot;input.oninput=()=>{model.values[f.id]=input.value.trim();changed();};b.insertBefore(input,b.querySelector("small"));root.append(b);
  }
 }else if(active==="advanced")advanced(root);
 else if(active==="history")history(root);
}

/* Question editing controls. All edits remain local until the existing publish confirmation. */
let selectedQuestionId="",optionDrafts=new Map();
function updateQuestionSummary(){
 const s=model?.questionBank;if(!s)return;
 const e=AcademyQuestions.errors(s),n=$("qb-summary");
 if(n)n.textContent=s.mode==="remote"?"منبع فعال: n8n فعلی":s.questions.length+" سؤال · "+
  s.questions.filter(q=>q.type==="mcq").length+" تستی · "+
  s.questions.filter(q=>q.type==="desc").length+" تشریحی";
 const err=$("qb-errors");if(err){err.replaceChildren();e.slice(0,6).forEach(t=>err.append(el("p",t)));
  err.hidden=!e.length;}
 const backend=$("qb-backend-check");if(backend)backend.checked=s.submitApproved;
 const badge=$("qb-version");if(badge)badge.textContent=s.revision||"هنوز نسخه‌ای ساخته نشده";
}
function qChanged(){AcademyQuestions.touch(model.questionBank);changed();updateQuestionSummary();}
function qAction(fn){snapshot();fn();qChanged();render();}
function adoptQuestions(s){
 snapshot();model.questionBank=s;selectedQuestionId=s.questions[0]?.id||"";
 optionDrafts=new Map();changed();render();
 status("بانک سؤال در پیش‌نویس آماده شد. هیچ سؤال یا تنظیمی هنوز روی سایت تغییر نکرده است.");
}
function selectedIndex(){
 const i=model?.questionBank?.questions.findIndex(q=>q.id===selectedQuestionId);return i>=0?i:0;
}
function questionControls(root){
 const s=model.questionBank;
 const summary=el("div",undefined,"qb-summary");summary.id="qb-summary";root.append(summary);
 const srcBox=box("منبع سؤال‌های فرم","در حالت n8n، رفتار فعلی فرم حفظ می‌شود. برای استفاده از سؤال‌های دلخواه، منبع را «سؤال‌های این پنل» قرار بده.");
 const source=el("select");source.id="qb-source";
 [["remote","n8n فعلی"],["managed","سؤال‌های این پنل"]].forEach(([v,t])=>{const o=el("option",t);o.value=v;source.append(o);});
 source.value=s.mode;source.onchange=()=>{
  if(source.value==="remote"){
   if(!confirm("دریافت سؤال‌ها دوباره از n8n باشد؟ سؤال‌های پیش‌نویس در پنل حفظ می‌شوند.")){source.value=s.mode;return;}
   snapshot();s.mode="remote";s.submitApproved=false;changed();render();
  }else {snapshot();if(!s.bankId)AcademyQuestions.touch(s);else s.mode="managed";changed();render();}
 };srcBox.append(source);root.append(srcBox);
 const imports=el("div",undefined,"qb-tools");
 const load=el("button","دریافت سؤال‌های فعلی از n8n");load.id="qb-load-remote";
 load.onclick=async()=>{
  if(s.questions.length&&!confirm("سؤال‌های پیش‌نویس با سؤال‌های دریافتی جایگزین شوند؟"))return;
  const f=model.fields.find(f=>f.kind==="url"&&f.label.includes("GET"));
  try{
   if(!f)throw Error("آدرس دریافت سؤال در این فایل پیدا نشد.");
   const u=new URL(model.values[f.id]);
   if(u.protocol!=="https:"||u.username||u.password)throw Error("آدرس دریافت سؤال باید HTTPS و بدون نام کاربری یا رمز باشد.");
