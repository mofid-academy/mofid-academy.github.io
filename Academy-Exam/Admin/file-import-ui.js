/* Academy Admin importer v3 - confirmed imports are loaded without a second upload. */
(function(){
"use strict";
const IMPORT_URL="https://miladmirsheriam.app.n8n.cloud/webhook/exam-import-file";
const QUESTIONS_URL="https://miladmirsheriam.app.n8n.cloud/webhook/exam-questions";
const MAX_FILE_BYTES=10*1024*1024;
const QUESTIONS_TIMEOUT_MS=60000;
const PENDING_KEY="academy-pending-question-import-v3";
let activeRead=null,readSerial=0,importInProgress=false;

function pendingImport(){
  try{const x=JSON.parse(sessionStorage.getItem(PENDING_KEY)||"null");return x&&typeof x.examId==="string"&&x.examId?x:null;}catch{return null;}
}
function savePending(value){try{sessionStorage.setItem(PENDING_KEY,JSON.stringify(value));}catch{}}
function clearPending(examId){if(pendingImport()?.examId===examId)try{sessionStorage.removeItem(PENDING_KEY);}catch{}}
function cancelRead(){
  readSerial++;
  activeRead?.controller.abort();
  activeRead=null;
}

function setStatus(message,type){
  const el=document.getElementById("status");
  if(el){el.textContent=message;el.className="status"+(type?" "+type:"");}
}
function currentBank(){
  try{return typeof window.__ACADEMY_GET_QUESTION_BANK__==="function"?window.__ACADEMY_GET_QUESTION_BANK__():null;}catch{return null;}
}
function responseRoot(data){
  return Array.isArray(data)&&data.length===1&&Array.isArray(data[0]?.questions)?data[0]:data;
}
function applyQuestions(data,expected){
  const root=responseRoot(data),questions=Array.isArray(root)?root:root?.questions;
  if(root?.accepted===false||root?.ok===false)throw Error(String(root.message||root.error||"سرور دریافت سؤال‌ها را تأیید نکرد.").slice(0,400));
  if(!Array.isArray(questions)||!questions.length)throw Error("پاسخ سرور بانک سؤال معتبر و غیرخالی نداشت. سؤال‌های قبلی پنل حفظ شده‌اند.");
  const examId=String(root?.examId||root?.exam_id||root?.originalExamId||"").trim();
  if(expected?.examId&&examId!==expected.examId)throw Error("سؤال‌های دریافتی مربوط به آزمون ساخته‌شده نیستند؛ برای جلوگیری از جایگزینی اشتباه، سؤال‌های قبلی حفظ شدند.");
  if(expected?.count>0&&questions.length!==expected.count)throw Error("تعداد سؤال‌های دریافتی با تأیید ساخت آزمون مطابقت ندارد. سؤال‌های قبلی حفظ شدند.");
  const api=window.__ACADEMY_ADMIN__;
  if(typeof api?.adopt!=="function")throw Error("نسخهٔ تازهٔ پنل بارگذاری نشده است. صفحه را دوباره باز کنید؛ فایل را دوباره ارسال نکنید.");
  const bank=api.adopt(root);
  document.dispatchEvent(new CustomEvent("academy-remote-questions-loaded",{detail:{examId:bank.originalExamId||examId,count:bank.questions.length}}));
  clearPending(examId);
  return bank;
}
async function refreshQuestions({url=QUESTIONS_URL,expected=pendingImport(),fromImport=false}={}){
  if(importInProgress&&!fromImport)throw Error("فایل در حال پردازش است؛ سؤال‌ها پس از پایان ساخت به‌صورت خودکار دریافت می‌شوند.");
  const u=new URL(url);
  if(u.protocol!=="https:"||u.username||u.password||!["https://miladmirsheriam.app.n8n.cloud","https://mofid-academy.github.io"].includes(u.origin))throw Error("آدرس دریافت سؤال‌ها در فهرست امن پنل نیست.");
  const key=u.href+"::"+(expected?.examId||"")+"::"+(expected?.count||"");
  if(activeRead){if(activeRead.key===key)return activeRead.promise;throw Error("یک درخواست دریافت سؤال در حال انجام است؛ تا پایان آن صبر کنید.");}
  const serial=++readSerial,controller=new AbortController();
  let timedOut=false;
  const timeout=setTimeout(()=>{timedOut=true;controller.abort();},QUESTIONS_TIMEOUT_MS);
  const slow=setTimeout(()=>setStatus("سرور هنوز در حال آماده‌سازی سؤال‌هاست؛ دریافت تا ۶۰ ثانیه ادامه دارد. فایل را دوباره ارسال نکنید."),20000);
  const record={key,controller,promise:null};
  activeRead=record;
  record.promise=(async()=>{
    try{
      u.searchParams.set("ts",String(Date.now()));
      const r=await fetch(u.href,{
        headers:{Accept:"application/json"},credentials:"omit",redirect:"error",cache:"no-store",
        referrerPolicy:"no-referrer",signal:controller.signal
      });
      if(!r.ok){
        if(r.status===404)throw Error("وب‌هوک exam-questions پیدا نشد. مسیر و Published بودن همان ورک‌فلو را بررسی کنید.");
        throw Error("سرور دریافت سؤال‌ها پاسخ HTTP "+r.status+" برگرداند. اجرای ورک‌فلوی exam-questions را بررسی کنید.");
      }
      const text=await r.text();
      if(text.length>2000000)throw Error("پاسخ سؤال‌ها بیش از حد مجاز بزرگ است.");
      let data;try{data=JSON.parse(text);}catch{throw Error("پاسخ exam-questions فایل JSON معتبر نبود؛ سؤال‌های قبلی حفظ شدند.");}
      if(serial!==readSerial||controller.signal.aborted)throw Error("دریافت قبلی لغو شد؛ سؤال‌های پنل تغییر نکردند.");
      return applyQuestions(data,expected);
    }catch(e){
      if(timedOut)throw Error("سرور exam-questions تا ۶۰ ثانیه پاسخ نداد. فایل را دوباره ارسال نکنید؛ اجرای همان ورک‌فلو را بررسی کنید.");
      if(serial!==readSerial)throw Error("دریافت قبلی لغو شد؛ سؤال‌های پنل تغییر نکردند.");
      if(e instanceof TypeError)throw Error("ارتباط با exam-questions برقرار نشد. سؤال‌های قبلی پنل حفظ شده‌اند.");
      throw e;
    }finally{
      clearTimeout(timeout);clearTimeout(slow);
      if(activeRead===record)activeRead=null;
    }
  })();
  return record.promise;
}
window.__ACADEMY_REFRESH_QUESTIONS__=refreshQuestions;
window.addEventListener("pagehide",cancelRead);
function styles(){
  if(document.getElementById("academy-file-import-style"))return;
  const s=document.createElement("style");s.id="academy-file-import-style";
  s.textContent=`
  .qb-file-import{border:1px solid #bfe3d5;background:#f3fbf7;border-radius:13px;padding:12px;margin:12px 0 16px}
  .qb-file-import h3{font-size:12px;margin:0 0 5px;color:#125d4d}
  .qb-file-import p{font-size:10px;line-height:1.9;color:#66867d;margin:0 0 10px}
  .qb-file-import-row{display:grid;grid-template-columns:1fr 1.2fr;gap:8px;align-items:end}
  .qb-file-import label{font-size:10px;font-weight:600;display:block;margin-bottom:4px}
  .qb-file-import input,.qb-file-import button{width:100%;font-size:11px}
  .qb-file-import .import-result{display:block;font-size:10px;margin-top:8px;line-height:1.8;color:#507369}
  .qb-file-import .import-result.error{color:#a3412d}
  .qb-file-import .notice{background:#e7f6f1;border:1px solid #cce9df;border-radius:10px;padding:8px 10px;margin:8px 0;color:#32675a;font-size:10px;line-height:1.8}
  @media(max-width:640px){.qb-file-import-row{grid-template-columns:1fr}}
  `;
  document.head.appendChild(s);
}
function install(){
  styles();
  const load=document.getElementById("qb-load-remote");
  if(!load)return;
  const tools=load.closest(".qb-tools");
  if(!tools||document.querySelector(".qb-file-import"))return;

  const box=document.createElement("div");box.className="qb-file-import";
  box.innerHTML=`
    <h3>ساخت آزمون جدید از PDF / Word</h3>
    <p>سؤال‌ها، گزینه‌ها و پاسخ‌هایی که داخل فایل نوشته شده‌اند استخراج می‌شوند. هر فایل همیشه یک آزمون جدید و مستقل می‌سازد.</p>
    <div class="notice">سؤال‌های آزمون قبلی به این فایل اضافه نمی‌شوند و هیچ بانکی با آزمون قبلی ادغام نمی‌شود.</div>
    <div class="qb-file-import-row">
      <div><label>عنوان آزمون — اختیاری</label><input id="academyImportTitle" type="text" placeholder="اگر خالی باشد از نام فایل/عنوان داخل فایل استفاده می‌شود"></div>
      <div><label>فایل سؤال‌ها</label><button id="academyImportBtn" type="button">انتخاب PDF یا Word</button></div>
    </div>
    <input id="academyImportFile" type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" hidden>
    <span id="academyImportResult" class="import-result">حداکثر حجم فایل: ۱۰ مگابایت. هر آپلود یک شناسه آزمون جدید می‌گیرد.</span>
  `;
  tools.insertAdjacentElement("afterend",box);

  const title=box.querySelector("#academyImportTitle");
  const btn=box.querySelector("#academyImportBtn");
  const file=box.querySelector("#academyImportFile");
  const result=box.querySelector("#academyImportResult");
  btn.onclick=()=>file.click();

  file.onchange=async()=>{
    if(importInProgress)return;
    const f=file.files&&file.files[0]; if(!f)return;
    result.classList.remove("error");
    const ext=(f.name.split(".").pop()||"").toLowerCase();
    if(!["pdf","docx"].includes(ext)){result.textContent="فقط فایل PDF یا DOCX قابل قبول است.";result.classList.add("error");return;}
    if(f.size>MAX_FILE_BYTES){result.textContent="حجم فایل بیشتر از ۱۰ مگابایت است.";result.classList.add("error");return;}
    if(!confirm("از این فایل یک آزمون جدید و جدا ساخته شود؟")){file.value="";return;}

    const bank=currentBank()||{};
    const fd=new FormData();
    fd.append("file",f,f.name);

    // IMPORTANT: blank exam_id/bank_id forces the workflow to create a NEW exam.
    // We deliberately never use the currently loaded exam id here.
    fd.append("mode","replace");
    fd.append("exam_id","");
    fd.append("exam_title",String(title.value||"").trim());
    fd.append("form_id",String(bank.formId||bank.form_id||"mofid-exam"));
    fd.append("bank_id","");
    fd.append("bank_version","");
    fd.append("create_new_exam","true");

    cancelRead();
    importInProgress=true;
    const remoteButton=document.getElementById("qb-load-remote");
    if(remoteButton)remoteButton.disabled=true;
    btn.disabled=true;title.disabled=true;file.disabled=true;
    btn.textContent="در حال ساخت آزمون جدید…";
    result.textContent="فایل به n8n ارسال شد؛ سؤال‌ها و پاسخ‌ها در حال استخراج هستند…";
    setStatus("در حال ساخت آزمون جدید از فایل…");

    let acceptedImport=null;
    try{
      const r=await fetch(IMPORT_URL,{
        method:"POST",body:fd,credentials:"omit",cache:"no-store",referrerPolicy:"no-referrer",
        signal:AbortSignal.timeout(150000)
      });
      let data=null;try{data=await r.json();}catch{}
      if(!r.ok)throw new Error((data&&data.error)||("HTTP "+r.status));
      data=responseRoot(data);
      if(!data||typeof data!=="object"||Array.isArray(data))throw Error("پاسخ سرور ساخت آزمون قابل بررسی نبود؛ وضعیت آزمون را پیش از تکرار بررسی کنید.");
      if(data&&(data.accepted===false||data.ok===false))throw new Error(data.error||data.message||"فایل پذیرفته نشد.");

      const count=Number(data?.imported_count||data?.question_count||data?.saved||data?.questions?.length||0);
      const missing=Number(data?.missing_answer_count||0);
      const examId=String(data?.exam_id||data?.examId||"").trim();
      if(data.accepted!==true&&data.ok!==true&&!(examId&&count>0))throw Error("سرور ساخت آزمون را تأیید نکرد؛ وضعیت آزمون را پیش از تکرار بررسی کنید.");
      acceptedImport={examId,count,title:String(title.value||f.name)};
      if(examId)savePending(acceptedImport);
      result.textContent=(count?count+" سؤال برای آزمون جدید ثبت شد. ":"آزمون جدید ثبت شد. ")+(examId?"شناسه: "+examId+". ":"")+(missing?missing+" سؤال پاسخ صریح نداشت. ":"")+"در حال تازه‌سازی پنل…";

      if(!examId)throw Error("پاسخ ساخت آزمون شناسهٔ آزمون نداشت؛ برای بررسی، دریافت سؤال‌ها را بزنید و فایل را دوباره ارسال نکنید.");
      const bank=Array.isArray(data?.questions)&&data.questions.length
        ?applyQuestions(data,acceptedImport)
        :await refreshQuestions({expected:acceptedImport,fromImport:true});
      result.textContent=bank.questions.length+" سؤال در آزمون جدید و مستقل وارد شد. شناسه: "+examId+". "+(missing?missing+" سؤال بدون پاسخ صریح بود. ":"")+"سؤال‌های آزمون قبلی با این آزمون ادغام نشده‌اند.";
      setStatus("آزمون جدید با موفقیت ساخته و در پنل بارگذاری شد؛ برای دریافت سؤال‌ها نیازی به زدن دکمهٔ دیگری نیست.","success");
    }catch(e){
      result.textContent=acceptedImport
        ?"فایل پذیرفته شده است؛ فقط بارگذاری سؤال‌ها در پنل تأیید نشد. "+String(e.message||e)+" فایل را دوباره ارسال نکنید؛ دکمهٔ دریافت سؤال‌ها را بزنید."
        :"تأیید ورود فایل دریافت نشد: "+String(e.message||e)+" پیش از ارسال دوباره، وضعیت آزمون را بررسی کنید.";
      result.classList.add("error");
      setStatus(result.textContent,"error");
    }finally{
      importInProgress=false;
      btn.disabled=false;title.disabled=false;file.disabled=false;btn.textContent="انتخاب PDF یا Word";file.value="";
      if(remoteButton?.isConnected)remoteButton.disabled=false;
    }
  };
}

const observer=new MutationObserver(()=>install());
observer.observe(document.documentElement,{subtree:true,childList:true});
document.addEventListener("click",()=>setTimeout(install,0),true);
setTimeout(install,300);
})();


