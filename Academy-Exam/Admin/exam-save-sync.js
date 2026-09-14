/* Academy Admin -> n8n question-sheet synchronization.
   Uses a CORS-simple POST (text/plain JSON) so the browser does not need a preflight OPTIONS request.
   The live exam keeps reading questions from the existing n8n exam-questions workflow. */
(function(){
"use strict";
const EXAM_SAVE_URL="https://miladmirsheriii.app.n8n.cloud/webhook/exam-save";

function setStatus(message,type){
  try{ if(typeof status==="function") return status(message,type); }catch{}
  const el=document.getElementById("status");
  if(el){el.textContent=message;el.className="status"+(type?" "+type:"");}
}

function patchQuestionImporter(){
  try{
    if(!window.AcademyQuestions||window.AcademyQuestions.__qidPatched) return;
    const original=window.AcademyQuestions.fromInput;
    window.AcademyQuestions.fromInput=function(raw){
      const clone=raw&&typeof raw==="object"?JSON.parse(JSON.stringify(raw)):raw;
      const list=Array.isArray(clone)?clone:(Array.isArray(clone?.questions)?clone.questions:null);
      if(list){
        list.forEach(q=>{
          if(q&&q.question_id==null&&q.id==null&&q.qid!=null) q.question_id=String(q.qid);
        });
      }
      return original(clone);
    };
    window.AcademyQuestions.__qidPatched=true;
  }catch{}
}
patchQuestionImporter();

function currentQuestionBank(){
  try{return (typeof model!=="undefined"&&model&&model.questionBank)?model.questionBank:null;}catch{return null;}
}

function buildPayload(bank){
  const examId=String(bank.originalExamId||bank.examId||bank.exam_id||"").trim();
  if(!examId) throw new Error("شناسه امتحان از منبع سؤال‌ها دریافت نشده است. ابتدا سؤال‌ها را از منبع فعلی n8n دریافت کن.");
  const examTitle=String(bank.examTitle||bank.exam_title||"");
  const formId=String(bank.formId||bank.form_id||"");
  const questions=(Array.isArray(bank.questions)?bank.questions:[]).map((q,index)=>{
    const stableId=String(q.id||q.question_id||q.qid||`${examId}-Q${index+1}`).trim();
    return {
      question_id:stableId,
      id:stableId,
      qid:stableId,
      order:index+1,
      position:index+1,
      question:String(q.question||""),
      type:q.type==="mcq"?"mcq":"desc",
      options:q.type==="mcq"&&Array.isArray(q.options)?q.options.map(x=>String(x)):[],
      max_score:Number.isFinite(Number(q.max_score))?Number(q.max_score):0,
      required:q.required===true
    };
  });
  return {
    event_type:"exam_save",
    action:"sync_questions",
    source:"academy-admin",
    sent_at:new Date().toISOString(),
    examId,
    examTitle,
    formId,
    durationMin:0,
    status:"published",
    exam_id:examId,
    exam_title:examTitle,
    form_id:formId,
    bank_id:String(bank.bankId||""),
    bank_version:String(bank.revision||""),
    question_count:questions.length,
    preserve_correct_answer:true,
    sort_by:"order",
    questions
  };
}

async function syncQuestions(bank){
  const payload=buildPayload(bank);
  if(!payload.questions.length) throw new Error("بانک سؤال خالی است؛ چیزی برای ذخیره در شیت وجود ندارد.");

  /* Do not use application/json here. That header causes a browser CORS preflight.
     Sending the JSON text as text/plain makes the POST itself reach n8n directly. */
  const response=await fetch(EXAM_SAVE_URL,{
    method:"POST",
    headers:{"Content-Type":"text/plain;charset=UTF-8"},
    body:JSON.stringify(payload),
    credentials:"omit",
    cache:"no-store",
    referrerPolicy:"no-referrer",
    signal:AbortSignal.timeout(30000)
  });

  if(!response.ok) throw new Error("n8n HTTP "+response.status);
  const text=await response.text();
  if(text.trim()){
    try{
      const ack=JSON.parse(text);
      if(ack&&typeof ack==="object"&&(ack.ok===false||ack.success===false||ack.saved===false)){
        throw new Error(String(ack.message||ack.error||"n8n ذخیره سؤال‌ها را تأیید نکرد."));
      }
    }catch(e){ if(!(e instanceof SyntaxError)) throw e; }
  }
  return payload;
}

function install(){
  patchQuestionImporter();
  const confirmButton=document.getElementById("confirmYes");
  if(!confirmButton||typeof confirmButton.onclick!=="function"){
    setTimeout(install,80);return;
  }
  if(confirmButton.dataset.examSaveSync==="5") return;
  confirmButton.dataset.examSaveSync="5";
  const original=confirmButton.onclick;

  const dialog=document.getElementById("confirmPublish");
  if(dialog&&!document.getElementById("exam-save-sync-note")){
    const note=document.createElement("p");
    note.id="exam-save-sync-note";
    note.className="tip";
    note.textContent="در صورت ویرایش سؤال‌ها، قبل از انتشار یک POST مستقیم به exam-save ارسال و شیت همگام می‌شود. پاسخ صحیح از پنل ارسال نمی‌شود.";
    const input=dialog.querySelector("#commitNote");
    if(input) dialog.insertBefore(note,input); else dialog.append(note);
  }

  confirmButton.onclick=async function(event){
    if(confirmButton.dataset.syncing==="1") return;
    const bank=currentQuestionBank();
    if(!bank||bank.mode!=="managed"||!Array.isArray(bank.questions)||!bank.questions.length){
      return original.call(this,event);
    }

    confirmButton.dataset.syncing="1";
    const oldText=confirmButton.textContent;
    confirmButton.disabled=true;
    confirmButton.textContent="در حال ارسال به n8n…";
    setStatus("در حال POST کردن سؤال‌ها و ترتیب جدید به exam-save…");
    try{
      const payload=await syncQuestions(bank);
      bank.mode="remote";
      bank.submitApproved=false;
      setStatus("n8n ذخیره "+payload.questions.length+" سؤال را تأیید کرد؛ حالا نسخه فرم روی سایت منتشر می‌شود.","success");
      confirmButton.disabled=false;
      confirmButton.textContent=oldText;
      confirmButton.dataset.syncing="0";
      return original.call(this,event);
    }catch(error){
      confirmButton.disabled=false;
      confirmButton.textContent=oldText;
      confirmButton.dataset.syncing="0";
      const message=String(error&&error.message||error);
      setStatus("انتشار متوقف شد؛ ارسال به n8n ناموفق بود: "+message,"error");
    }
  };
}

install();
})();
