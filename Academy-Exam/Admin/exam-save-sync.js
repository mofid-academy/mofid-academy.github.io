/* Academy Admin -> n8n question-sheet synchronization v12. */
(function(){
"use strict";
const EXAM_SAVE_URL="https://miladmirsheriseyed.app.n8n.cloud/webhook/exam-save";
const VERSION="12";
window.__ACADEMY_EXAM_SAVE_SYNC_VERSION__=VERSION;
let questionsDirty=false;

function setStatus(message,type){
  try{if(typeof status==="function")return status(message,type);}catch{}
  const el=document.getElementById("status");
  if(el){el.textContent=message;el.className="status"+(type?" "+type:"");}
}
function safeClone(value){try{return JSON.parse(JSON.stringify(value));}catch{return value;}}
function markQuestionsDirty(){questionsDirty=true;window.__ACADEMY_QUESTIONS_DIRTY__=true;}
function markQuestionsClean(){questionsDirty=false;window.__ACADEMY_QUESTIONS_DIRTY__=false;}
function hasQuestionChanges(){return questionsDirty===true||window.__ACADEMY_QUESTIONS_DIRTY__===true;}

function patchQuestionsApi(){
  try{
    if(!window.AcademyQuestions)return false;
    if(window.AcademyQuestions.__examSaveV12)return true;
    const originalFromInput=window.AcademyQuestions.fromInput;
    const originalTouch=window.AcademyQuestions.touch;
    window.AcademyQuestions.fromInput=function(raw){
      const clone=raw&&typeof raw==="object"?safeClone(raw):raw;
      const root=Array.isArray(clone)&&clone.length===1&&clone[0]&&typeof clone[0]==="object"?clone[0]:clone;
      if(root&&!Array.isArray(root)&&typeof root==="object"){
        if(root.examId==null&&root.exam_id!=null)root.examId=String(root.exam_id);
        if(root.formId==null&&root.form_id!=null)root.formId=String(root.form_id);
        if(root.examTitle==null&&root.exam_title!=null)root.examTitle=String(root.exam_title);
      }
      const list=Array.isArray(root)?root:(Array.isArray(root?.questions)?root.questions:null);
      if(list)list.forEach(q=>{if(q&&q.question_id==null&&q.id==null&&q.qid!=null)q.question_id=String(q.qid);});
      const normalized=originalFromInput(clone);
      if(list&&normalized&&Array.isArray(normalized.questions)){
        normalized.questions.forEach((q,i)=>{
          const source=list[i]||{};
          q.correct_answer=String(source.correct_answer??source.correctAnswer??source["گزینه صحیح"]??"");
          q.sample_answer=String(source.sample_answer??source.sampleAnswer??source["پاسخ نمونه (تشریحی)"]??source["مدل_پاسخ"]??"");
          let idx=Number(source.correct_option_index??source.correctOptionIndex);
          if(!Number.isInteger(idx)||idx<0)idx=Array.isArray(q.options)?q.options.findIndex(o=>String(o).trim()===q.correct_answer.trim()):-1;
          q.correct_option_index=idx>=0?idx:-1;
        });
      }
      return normalized;
    };
    if(typeof originalTouch==="function"){
      window.AcademyQuestions.touch=function(){
        const result=originalTouch.apply(this,arguments);
        markQuestionsDirty();
        return result;
      };
    }
    window.AcademyQuestions.__examSaveV11=true;
    return true;
  }catch{return false;}
}

function currentQuestionBank(){
  try{
    if(typeof window.__ACADEMY_GET_QUESTION_BANK__==="function")return window.__ACADEMY_GET_QUESTION_BANK__();
  }catch{}
  return null;
}
function snapshotBank(){
  const bank=currentQuestionBank();
  if(!bank)throw new Error("بانک سؤال در حافظه پنل پیدا نشد. نسخه v12 فعال است؛ صفحه را یک‌بار تازه‌سازی کن.");
  return safeClone(bank);
}
function validFormId(value){
  const v=String(value||"").trim();
  return !v||/^https?:\/\//i.test(v)?"mofid-exam":v;
}
function buildPayload(bank){
  if(!bank||typeof bank!=="object")throw new Error("اطلاعات بانک سؤال در دسترس نیست.");
  const examId=String(bank.originalExamId||bank.examId||bank.exam_id||"").trim();
  if(!examId)throw new Error("شناسه آزمون از n8n دریافت نشده است. دکمه «دریافت سؤال‌های فعلی از n8n» را بزن.");
  const questions=(Array.isArray(bank.questions)?bank.questions:[]).map((q,index)=>{
    const stableId=String(q.id||q.question_id||q.qid||(examId+"-Q"+(index+1))).trim();
    const options=q.type==="mcq"&&Array.isArray(q.options)?q.options.map(String):[];
    let correctIndex=Number(q.correct_option_index);
    if(!Number.isInteger(correctIndex)||correctIndex<0||correctIndex>=options.length){
      const existing=String(q.correct_answer||"").trim();
      correctIndex=existing?options.findIndex(o=>String(o).trim()===existing):-1;
    }
    const correctAnswer=q.type==="mcq"&&correctIndex>=0?String(options[correctIndex]):"";
    const sampleAnswer=q.type==="desc"?String(q.sample_answer||""):"";
    return {
      question_id:stableId,id:stableId,qid:stableId,order:index+1,position:index+1,
      question:String(q.question||""),type:q.type==="mcq"?"mcq":"desc",
      options,
      max_score:Number.isFinite(Number(q.max_score))?Number(q.max_score):0,
      required:q.required===true,
      correct_answer:correctAnswer,
      correct_option_index:correctIndex,
      sample_answer:sampleAnswer,
      "گزینه صحیح":correctAnswer,
      "پاسخ نمونه (تشریحی)":sampleAnswer
    };
  });
  if(!questions.length)throw new Error("بانک سؤال خالی است.");
  const formId=validFormId(bank.formId||bank.form_id);
  const examTitle=String(bank.examTitle||bank.exam_title||"");
  return {
    event_type:"exam_save",action:"sync_questions",source:"academy-admin",sent_at:new Date().toISOString(),
    examId,exam_id:examId,examTitle,exam_title:examTitle,formId,form_id:formId,
    durationMin:0,status:"published",bank_id:String(bank.bankId||""),bank_version:String(bank.revision||""),
    question_count:questions.length,preserve_correct_answer:true,sort_by:"order",questions
  };
}
async function postPayload(payload){
  const url=EXAM_SAVE_URL+"?source=academy-admin&v="+VERSION+"&ts="+Date.now();
  const body=JSON.stringify(payload);
  await fetch(url,{method:"POST",mode:"no-cors",headers:{"Content-Type":"text/plain;charset=UTF-8"},body,credentials:"omit",cache:"no-store"});
  return payload;
}
async function sendCurrent(){return postPayload(buildPayload(snapshotBank()));}

function watchQuestionImports(){
  document.addEventListener("click",event=>{
    const remote=event.target.closest?.("#qb-load-remote");
    const imp=event.target.closest?.("#qb-import");
    if(!remote&&!imp)return;
    const before=currentQuestionBank();
    let tries=0;
    const timer=setInterval(()=>{
      tries++;
      const now=currentQuestionBank();
      if(now&&now!==before){
        clearInterval(timer);
        if(remote)markQuestionsClean();else markQuestionsDirty();
      }else if(tries>30)clearInterval(timer);
    },150);
  },true);
}

function install(){
  patchQuestionsApi();
  const confirmButton=document.getElementById("confirmYes");
  if(!confirmButton||typeof confirmButton.onclick!=="function"){setTimeout(install,100);return;}
  if(confirmButton.dataset.examSaveSync===VERSION)return;
  confirmButton.dataset.examSaveSync=VERSION;
  const original=confirmButton.onclick;
  const dialog=document.getElementById("confirmPublish");
  if(dialog){
    let note=document.getElementById("exam-save-sync-note");
    if(!note){note=document.createElement("p");note.id="exam-save-sync-note";note.className="tip";const input=dialog.querySelector("#commitNote");if(input)dialog.insertBefore(note,input);else dialog.append(note);}
    note.textContent="همگام‌سازی سؤال‌ها فعال است (v11). فقط وقتی خود سؤال‌ها تغییر کرده باشند به exam-save ارسال می‌شوند؛ تغییر تایمر، رنگ یا متن فرم سؤال‌ها را دوباره به شیت نمی‌فرستد.";
    let test=document.getElementById("exam-save-test");
    if(!test){const actions=dialog.querySelector(".dialog-actions");if(actions){test=document.createElement("button");test.id="exam-save-test";test.type="button";test.textContent="تست ارسال به n8n";actions.insertBefore(test,actions.firstChild);}}
    if(test)test.onclick=async()=>{
      if(!hasQuestionChanges()){setStatus("سؤال‌ها تغییری نکرده‌اند؛ برای جلوگیری از ثبت تکراری، چیزی به n8n ارسال نشد.","success");return;}
      test.disabled=true;const old=test.textContent;test.textContent="در حال ارسال تست…";
      try{const p=await sendCurrent();markQuestionsClean();setStatus("تغییرات "+p.questions.length+" سؤال به exam-save ارسال شد. انتشار بعدی آن‌ها را دوباره ارسال نمی‌کند.","success");}
      catch(e){setStatus("تست n8n ناموفق بود: "+String(e.message||e),"error");}
      finally{test.disabled=false;test.textContent=old;}
    };
  }
  confirmButton.onclick=async function(event){
    if(confirmButton.dataset.syncing==="1")return;
    const bank=currentQuestionBank();
    if(!bank){setStatus("انتشار متوقف شد؛ بانک سؤال پیدا نشد.","error");return;}
    if(bank.mode!=="managed"||!hasQuestionChanges()){
      if(bank.mode==="managed"&&!hasQuestionChanges())setStatus("سؤال‌ها تغییر نکرده‌اند؛ ارسال به n8n رد شد و فقط سایر تغییرات منتشر می‌شوند.","success");
      return original.call(this,event);
    }
    confirmButton.dataset.syncing="1";const old=confirmButton.textContent;confirmButton.disabled=true;confirmButton.textContent="در حال ارسال سؤال‌های تغییرکرده به n8n…";
    try{
      const payload=await sendCurrent();
      markQuestionsClean();
      const liveBank=currentQuestionBank();if(liveBank){liveBank.mode="remote";liveBank.submitApproved=false;}
      setStatus("سؤال‌های تغییرکرده به n8n ارسال شدند؛ انتشار فرم ادامه پیدا می‌کند.","success");
      confirmButton.disabled=false;confirmButton.textContent=old;confirmButton.dataset.syncing="0";
      return original.call(this,event);
    }catch(error){
      confirmButton.disabled=false;confirmButton.textContent=old;confirmButton.dataset.syncing="0";
      setStatus("انتشار متوقف شد؛ ارسال به n8n انجام نشد: "+String(error&&error.message||error),"error");
    }
  };
}

window.__ACADEMY_QUESTIONS_DIRTY__=false;
patchQuestionsApi();
watchQuestionImports();
install();
})();