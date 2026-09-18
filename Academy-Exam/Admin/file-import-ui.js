/* Academy Admin file question importer v1 */
(function(){
"use strict";
const IMPORT_URL="https://miladmirsh.app.n8n.cloud/webhook/exam-import-file";
const QUESTIONS_URL="https://miladmirsh.app.n8n.cloud/webhook/exam-questions";
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
  .qb-file-import select,.qb-file-import button{width:100%;font-size:11px}
  .qb-file-import .import-result{display:block;font-size:10px;margin-top:8px;line-height:1.8;color:#507369}
  .qb-file-import .import-result.error{color:#a3412d}
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
    <h3>ورود خودکار سؤال‌ها از PDF / Word</h3>
    <p>سؤال‌ها، گزینه‌ها و پاسخ‌هایی که داخل فایل نوشته شده‌اند عیناً استخراج می‌شوند. سیستم سؤال یا پاسخ جدید اختراع نمی‌کند.</p>
    <div class="qb-file-import-row">
      <div><label>نحوه وارد کردن</label><select id="academyImportMode">
        <option value="replace">جایگزینی سؤال‌های فعلی با فایل</option>
        <option value="append">افزودن به سؤال‌های فعلی</option>
      </select></div>
      <div><label>فایل سؤال‌ها</label><button id="academyImportBtn" type="button">انتخاب PDF یا Word</button></div>
    </div>
    <input id="academyImportFile" type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" hidden>
    <span id="academyImportResult" class="import-result">حداکثر حجم فایل: ۱۰ مگابایت.</span>
  `;
  tools.insertAdjacentElement("afterend",box);

  const mode=box.querySelector("#academyImportMode");
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
    if(mode.value==="replace"&&!confirm("سؤال‌های داخل فایل جایگزین سؤال‌های فعلی شوند؟")){file.value="";return;}

    const bank=currentBank()||{};
    const fd=new FormData();
    fd.append("file",f,f.name);
    fd.append("mode",mode.value);
    fd.append("exam_id",String(bank.originalExamId||bank.examId||bank.exam_id||""));
    fd.append("exam_title",String(bank.examTitle||bank.exam_title||""));
    fd.append("form_id",String(bank.formId||bank.form_id||"mofid-exam"));
    fd.append("bank_id",String(bank.bankId||""));
    fd.append("bank_version",String(bank.revision||""));

    btn.disabled=true;mode.disabled=true;file.disabled=true;
    btn.textContent="در حال خواندن فایل…";
    result.textContent="فایل به n8n ارسال شد؛ در حال استخراج سؤال‌ها و پاسخ‌ها…";
    setStatus("در حال وارد کردن سؤال‌ها از فایل…");

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
      result.textContent=(count?count+" سؤال وارد شد. ":"سؤال‌ها وارد شدند. ")+(missing?missing+" سؤال در فایل پاسخ صریح نداشت. ":"")+"در حال تازه‌سازی پنل…";

      const refreshed=await refreshQuestions();
      if(refreshed){
        result.textContent=(count?count+" سؤال با موفقیت وارد شد. ":"ورود سؤال‌ها موفق بود. ")+(missing?missing+" سؤال بدون پاسخ صریح در فایل بود. ":"")+"حالا «انتشار روی سایت» را بزن.";
        setStatus("فایل با موفقیت پردازش شد؛ سؤال‌های جدید در پنل آماده‌اند. برای نمایش در فرم اصلی، «انتشار روی سایت» را بزن.","success");
      }else{
        result.textContent="ورود موفق بود. برای دیدن سؤال‌ها دکمه «دریافت سؤال‌های فعلی از n8n» را بزن.";
        setStatus("فایل پردازش شد. سؤال‌ها را دوباره از n8n دریافت کن.","success");
      }
    }catch(e){
      result.textContent="ورود فایل ناموفق بود: "+String(e.message||e);
      result.classList.add("error");
      setStatus("ورود فایل ناموفق بود: "+String(e.message||e),"error");
    }finally{
      btn.disabled=false;mode.disabled=false;file.disabled=false;btn.textContent="انتخاب PDF یا Word";file.value="";
    }
  };
}

const observer=new MutationObserver(()=>install());
observer.observe(document.documentElement,{subtree:true,childList:true});
document.addEventListener("click",()=>setTimeout(install,0),true);
setTimeout(install,300);
})();
