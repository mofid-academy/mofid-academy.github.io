/* Academy Admin file question importer v2 - every file creates a separate exam */
(function(){
"use strict";
const IMPORT_URL="https://miladmirsheriseyed.app.n8n.cloud/webhook/exam-import-file";
const QUESTIONS_URL="https://miladmirsheriseyed.app.n8n.cloud/webhook/exam-questions";
const MAX_FILE_BYTES=10*1024*1024;

function setStatus(message,type){
  const el=document.getElementById("status");
  if(el){el.textContent=message;el.className="status"+(type?" "+type:"");}
}
function currentBank(){
  try{return typeof window.__ACADEMY_GET_QUESTION_BANK__==="function"?window.__ACADEMY_GET_QUESTION_BANK__():null;}catch{return null;}
}
async function refreshQuestions(){
  const r=await fetch(QUESTIONS_URL+"?ts="+Date.now(),{
    headers:{Accept:"application/json"},credentials:"omit",cache:"no-store",referrerPolicy:"no-referrer",
    signal:AbortSignal.timeout(30000)
  });
  if(!r.ok)throw new Error("دریافت سؤال‌های جدید ناموفق بود: HTTP "+r.status);
  const data=await r.json();
  if(window.AcademyQuestions&&typeof window.AcademyQuestions.fromInput==="function"&&typeof window.adoptQuestions==="function"){
    window.adoptQuestions(window.AcademyQuestions.fromInput(data));
    return true;
  }
  return false;
}
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

    btn.disabled=true;title.disabled=true;file.disabled=true;
    btn.textContent="در حال ساخت آزمون جدید…";
    result.textContent="فایل به n8n ارسال شد؛ سؤال‌ها و پاسخ‌ها در حال استخراج هستند…";
    setStatus("در حال ساخت آزمون جدید از فایل…");

    try{
      const r=await fetch(IMPORT_URL,{
        method:"POST",body:fd,credentials:"omit",cache:"no-store",referrerPolicy:"no-referrer",
        signal:AbortSignal.timeout(150000)
      });
      let data=null;try{data=await r.json();}catch{}
      if(!r.ok)throw new Error((data&&data.error)||("HTTP "+r.status));
      if(data&&data.accepted===false)throw new Error(data.error||"فایل پذیرفته نشد.");

      const count=Number(data?.imported_count||data?.question_count||0);
      const missing=Number(data?.missing_answer_count||0);
      const examId=String(data?.exam_id||"");
      result.textContent=(count?count+" سؤال برای آزمون جدید ثبت شد. ":"آزمون جدید ثبت شد. ")+(examId?"شناسه: "+examId+". ":"")+(missing?missing+" سؤال پاسخ صریح نداشت. ":"")+"در حال تازه‌سازی پنل…";

      const refreshed=await refreshQuestions();
      if(refreshed){
        result.textContent=(count?count+" سؤال در آزمون جدید و مستقل وارد شد. ":"آزمون جدید آماده است. ")+(examId?"شناسه: "+examId+". ":"")+(missing?missing+" سؤال بدون پاسخ صریح بود. ":"")+"سؤال‌های آزمون قبلی با این آزمون ادغام نشده‌اند.";
        setStatus("آزمون جدید با موفقیت ساخته شد؛ پنل فقط سؤال‌های همین آزمون را نمایش می‌دهد.","success");
      }else{
        result.textContent="آزمون جدید ساخته شد. دکمه «دریافت سؤال‌های فعلی از n8n» را بزن تا همین آزمون جدید لود شود.";
        setStatus("آزمون جدید ساخته شد. سؤال‌ها را دوباره از n8n دریافت کن.","success");
      }
    }catch(e){
      result.textContent="ورود فایل ناموفق بود: "+String(e.message||e);
      result.classList.add("error");
      setStatus("ورود فایل ناموفق بود: "+String(e.message||e),"error");
    }finally{
      btn.disabled=false;title.disabled=false;file.disabled=false;btn.textContent="انتخاب PDF یا Word";file.value="";
    }
  };
}

const observer=new MutationObserver(()=>install());
observer.observe(document.documentElement,{subtree:true,childList:true});
document.addEventListener("click",()=>setTimeout(install,0),true);
setTimeout(install,300);
})();
