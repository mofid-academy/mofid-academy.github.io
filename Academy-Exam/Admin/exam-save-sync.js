/* Academy Admin -> n8n question-sheet synchronization.
   Question edits are sent only when the admin confirms publication.
   The live exam remains in remote mode so questions continue to come from the existing n8n exam-questions workflow. */
(function(){
"use strict";
const EXAM_SAVE_URL="https://miladmirsheriii.app.n8n.cloud/webhook/exam-save";

function setStatus(message,type){
  try{
    if(typeof status==="function") return status(message,type);
  }catch{}
  const el=document.getElementById("status");
  if(el){el.textContent=message;el.className="status"+(type?" "+type:"");}
}

function currentQuestionBank(){
  try{return (typeof model!=="undefined"&&model&&model.questionBank)?model.questionBank:null;}catch{return null;}
}

function buildPayload(bank){
  const questions=(Array.isArray(bank.questions)?bank.questions:[]).map((q,index)=>({
    question_id:String(q.id||""),
    id:String(q.id||""),
    qid:index+1,
    order:index+1,
    position:index+1,
    question:String(q.question||""),
    type:q.type==="mcq"?"mcq":"desc",
    options:q.type==="mcq"&&Array.isArray(q.options)?q.options.map(x=>String(x)):[],
    max_score:Number.isFinite(Number(q.max_score))?Number(q.max_score):0,
    required:q.required===true
  }));
  return {
    event_type:"exam_save",
    action:"sync_questions",
    source:"academy-admin",
    sent_at:new Date().toISOString(),
    exam_id:String(bank.originalExamId||""),
    exam_title:String(bank.examTitle||""),
    form_id:String(bank.formId||""),
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
  const response=await fetch(EXAM_SAVE_URL,{
    method:"POST",
    headers:{"Content-Type":"application/json","Accept":"application/json"},
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
    }catch(e){
      if(e instanceof SyntaxError){/* Empty/non-JSON success responses are accepted. */}
      else throw e;
    }
  }
  return payload;
}

function install(){
  const confirmButton=document.getElementById("confirmYes");
  if(!confirmButton||typeof confirmButton.onclick!=="function"){
    setTimeout(install,80);return;
  }
  if(confirmButton.dataset.examSaveSync==="1") return;
  confirmButton.dataset.examSaveSync="1";
  const original=confirmButton.onclick;

  const dialog=document.getElementById("confirmPublish");
  if(dialog&&!document.getElementById("exam-save-sync-note")){
    const note=document.createElement("p");
    note.id="exam-save-sync-note";
    note.className="tip";
    note.textContent="اگر سؤال‌ها را در پنل ویرایش کرده باشی، قبل از انتشار سایت کل بانک سؤال با ترتیب جدید به n8n (exam-save) ارسال می‌شود تا شیت همگام شود. پاسخ صحیح ارسال نمی‌شود و باید در ورک‌فلو/شیت حفظ شود.";
    const input=dialog.querySelector("#commitNote");
    if(input) dialog.insertBefore(note,input.previousElementSibling||input); else dialog.append(note);
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
    confirmButton.textContent="در حال همگام‌سازی شیت…";
    setStatus("در حال ارسال سؤال‌ها و ترتیب جدید به n8n و شیت…");
    try{
      await syncQuestions(bank);
      /* The sheet/n8n stays the source of truth. Keep the edited bank only as admin state,
         but do not embed it as the live question source in the candidate form. */
      bank.mode="remote";
      bank.submitApproved=false;
      setStatus("سؤال‌ها و ترتیب جدید در n8n ارسال شد؛ حالا نسخه فرم روی سایت منتشر می‌شود.","success");
      confirmButton.disabled=false;
      confirmButton.textContent=oldText;
      confirmButton.dataset.syncing="0";
      return original.call(this,event);
    }catch(error){
      confirmButton.disabled=false;
      confirmButton.textContent=oldText;
      confirmButton.dataset.syncing="0";
      const message=String(error&&error.message||error);
      const cors=/Failed to fetch|NetworkError|Load failed/i.test(message)?" اگر Webhook اجرا نمی‌شود، CORS پاسخ n8n را برای https://mofid-academy.github.io مجاز کن.":"";
      setStatus("انتشار متوقف شد؛ همگام‌سازی شیت ناموفق بود: "+message+cors,"error");
    }
  };
}

install();
})();
