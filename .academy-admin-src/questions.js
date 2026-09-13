/* Academy Studio 2 - public question bank. Answer keys and tokens are never serialized here. */
(function(){
"use strict";
const STATE_ID="academy-question-bank", LOADER_ID="academy-question-loader", RUNTIME_ID="academy-question-runtime";
const MAX_QUESTIONS=200, MAX_OPTIONS=8;
const str=(x,n=8000)=>String(x??"").slice(0,n);
const uid=(prefix="q")=>prefix+"_"+(globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+"_"+Math.random().toString(36).slice(2)).replace(/-/g,"");
const safeId=x=>/^[A-Za-z0-9_-]{1,100}$/.test(String(x||""));
const cleanJSON=x=>JSON.stringify(x).replace(/</g,"\\u003c").replace(/\u2028/g,"\\u2028").replace(/\u2029/g,"\\u2029");
const base=()=>({schemaVersion:2,mode:"remote",bankId:"",revision:"",examTitle:"آزمون آکادمی مفید",formId:"mofid-exam",originalExamId:"",submitApproved:false,questions:[]});
function normalizeQuestion(q={},seen=new Set()){
 let id=str(q.id||q.question_id||"",100);
 if(!safeId(id)||seen.has(id))id=uid();seen.add(id);
 const type=(q.type==="desc"||q.type==="essay"||q.type==="textarea")?"desc":
    ((q.type==="mcq"||q.type==="radio"||Array.isArray(q.options)&&q.options.length)?"mcq":"desc");
 const options=Array.isArray(q.options)?q.options.map(o=>str(typeof o==="object"?(o.text??o.label??""):o,2000)):[];
 const score=Number(q.max_score??q.score??(type==="mcq"?1:5));
 return {id,question:str(q.question??q.text??""),type,options:type==="mcq"?options:[],
   max_score:Number.isFinite(score)?score:1,required:q.required===true};
}
function normalizeState(raw){
 const out=base(),seen=new Set();
 if(!raw||typeof raw!=="object"||!Array.isArray(raw.questions))throw Error("ساختار بانک سؤال معتبر نیست.");
 if(raw.questions.length>MAX_QUESTIONS)throw Error("در این نسخه حداکثر ۲۰۰ سؤال پشتیبانی می‌شود.");
 out.mode=raw.mode==="managed"?"managed":"remote";
 out.bankId=safeId(raw.bankId)?raw.bankId:"";
 out.revision=safeId(raw.revision)?raw.revision:"";
 out.examTitle=str(raw.examTitle,240);out.formId=str(raw.formId||"mofid-exam",160);
 out.originalExamId=str(raw.originalExamId,200);out.submitApproved=raw.submitApproved===true;
 out.questions=raw.questions.map(q=>normalizeQuestion(q,seen));
 return out;
}
function read(doc){
 const tag=doc.getElementById(STATE_ID);
 if(!tag)return base();
 try{return normalizeState(JSON.parse(tag.textContent));}
 catch(e){throw Error("بانک سؤال ذخیره‌شده قابل خواندن نیست: "+e.message);}
}
function remove(doc){doc.querySelectorAll("#"+STATE_ID+",#"+LOADER_ID+",#"+RUNTIME_ID).forEach(n=>n.remove());}
function touch(s){
 if(!s.bankId)s.bankId=uid("bank");
 s.revision=uid("v");s.submitApproved=false;s.mode="managed";
}
function fromInput(raw){
 if(Array.isArray(raw)&&raw.length===1&&Array.isArray(raw[0]?.questions))raw=raw[0];
 if(raw?.schemaVersion===2&&Array.isArray(raw.questions)){
  const state=normalizeState(raw);touch(state);return state;
 }
 const list=Array.isArray(raw)?raw:raw?.questions;
 if(!Array.isArray(list))throw Error("فایل باید آرایهٔ سؤال‌ها یا یک شیء دارای questions باشد.");
 const s=base();s.examTitle=str(raw?.examTitle||raw?.title||s.examTitle,240);
 s.formId=str(raw?.formId||"mofid-exam",160);s.originalExamId=str(raw?.examId||"",200);
 const seen=new Set();s.questions=list.map(q=>normalizeQuestion(q,seen));
 if(s.questions.length>MAX_QUESTIONS)throw Error("بیش از ۲۰۰ سؤال وارد شده است.");
 touch(s);return s;
}
const norm=x=>String(x).normalize("NFKC").replace(/\s+/g," ").trim();
function errors(s){
 const e=[];if(s.mode!=="managed")return e;
 if(!s.examTitle.trim())e.push("عنوان آزمون را وارد کن.");
 if(!safeId(s.bankId)||!safeId(s.revision))e.push("شناسه یا نسخهٔ بانک معتبر نیست.");
 if(!s.questions.length)e.push("حداقل یک سؤال اضافه کن.");
 if(s.questions.length>MAX_QUESTIONS)e.push("حداکثر ۲۰۰ سؤال مجاز است.");
 const seen=new Set();
 s.questions.forEach((q,i)=>{
  const n=i+1;
  if(!q.question.trim())e.push("متن سؤال "+n+" خالی است.");
  if(!safeId(q.id)||seen.has(q.id))e.push("شناسهٔ سؤال "+n+" تکراری یا نامعتبر است.");seen.add(q.id);
  if(!["mcq","desc"].includes(q.type))e.push("نوع سؤال "+n+" نامعتبر است.");
  if(!Number.isFinite(q.max_score)||q.max_score<=0||q.max_score>1000)e.push("بارم سؤال "+n+" باید بزرگ‌تر از صفر و حداکثر ۱۰۰۰ باشد.");
  if(q.type==="mcq"){
   if(q.options.length<2||q.options.length>MAX_OPTIONS)e.push("سؤال "+n+" باید ۲ تا ۸ گزینه داشته باشد.");
   if(q.options.some(o=>!o.trim()))e.push("گزینهٔ خالی در سؤال "+n+" وجود دارد.");
   if(new Set(q.options.map(norm)).size!==q.options.length)e.push("گزینه‌های سؤال "+n+" نباید تکراری باشند.");
  }
 });
 return e;
}
function exam(s){
 return {schemaVersion:2,examId:s.bankId+"__"+s.revision,examTitle:s.examTitle,formId:s.formId,
   bankId:s.bankId,bankVersion:s.revision,questions:s.questions.map((q,i)=>({
    qid:i+1,question_id:q.id,question:q.question,type:q.type,options:q.type==="mcq"?q.options.slice():[],
    max_score:q.max_score,required:q.required
   }))};
}
function checkPublication(s){const e=errors(s);if(e.length)throw Error(e.slice(0,5).join("\n"));return true;}

/* Runs only inside the candidate form, never in the privileged admin document. */
function candidateRuntime(){
 "use strict";
 const node=document.getElementById("academy-question-bank");if(!node)return;
 const bank=JSON.parse(node.textContent);if(bank.mode!=="managed")return;
 const expectedId=bank.bankId+"__"+bank.revision;
 const copy=x=>JSON.parse(JSON.stringify(x));
 const qs=copy(bank.questions);let submissionId="",submitted=false;
 function notice(text){
  document.getElementById("academy-question-notice")?.remove();
  const n=document.createElement("div");n.id="academy-question-notice";n.className="note warn";
  n.setAttribute("role","alert");n.textContent=text;document.getElementById("view")?.prepend(n);
  n.scrollIntoView({block:"nearest",behavior:"smooth"});
 }
 function missing(){return qs.findIndex((q,i)=>q.required&&!String(answers[i+1]??"").trim());}
 function decorate(){
  document.getElementById("academy-required-label")?.remove();
  const q=qs[step];if(q?.required){
   const n=document.createElement("p");n.id="academy-required-label";n.className="eyebrow";n.textContent="پاسخ به این سؤال الزامی است.";
   document.getElementById("view")?.prepend(n);
  }
 }
 const oldGo=go,oldReview=review,oldDone=done;
 go=function(i){
  if(i>step&&step>=0&&qs[step]?.required&&!String(answers[step+1]??"").trim()){
   notice("برای ادامه، به این سؤال پاسخ بده.");return;
  }
  oldGo(i);decorate();
 };
 review=function(){
  const j=missing();if(j>=0){oldGo(j);decorate();notice("سؤال‌های الزامی را پیش از مرور نهایی کامل کن.");return;}
  oldReview();
 };
 done=function(){
  oldDone();
  const p=document.querySelector("#view .sub");
  if(p)p.textContent=String(name)+" عزیز، پاسخ‌های شما دریافت شد. نتیجهٔ بررسی از طریق برگزارکننده اعلام می‌شود.";
 };
 send=async function(){
  if(sending||submitted)return;
  const j=missing();if(j>=0){oldGo(j);decorate();notice("پاسخ سؤال الزامی کامل نشده است.");return;}
  if(!bank.submitApproved&&!window.__ACADEMY_PREVIEW__){
   notice("این نسخهٔ آزمون هنوز برای دریافت پاسخ فعال نشده است. لطفاً با برگزارکننده هماهنگ کنید. پاسخ‌ها در همین صفحه باقی مانده‌اند.");return;
  }
  const id=()=>globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+"_"+Math.random().toString(36).slice(2);
  if(!submissionId)submissionId="sub_"+id();
  const values=qs.map((q,i)=>String(answers[i+1]??""));
  if(values.some(a=>a.length>20000)){notice("طول یکی از پاسخ‌ها بیش از حد مجاز است.");return;}
  const payload={
   event_type:"submission",schema_version:2,question_bank_source:"academy-studio",
   form_id:bank.formId||"mofid-exam",form_name:bank.examTitle,exam_id:expectedId,
   bank_id:bank.bankId,bank_version:bank.revision,submission_id:submissionId,
   completed_at:new Date().toISOString(),grading_status:"pending_server_validation",
   fields:[
    {id:"exam_id",question:"exam_id",type:"hidden",answer:expectedId,position:0},
    {id:"name",question:"نام و نام خانوادگی",type:"input",answer:String(name),position:1},
    ...qs.map((q,i)=>({id:"q"+(i+1),question_id:q.id,question:`Q${i+1}) ${q.question}`,
      type:q.type==="mcq"?"radio":"textarea",answer:values[i],position:i+2}))
   ],
   answers_v2:qs.map((q,i)=>({question_id:q.id,position:i+1,answer:values[i]}))
  };
  sending=true;
  paint('<div class="center"><div class="spin"></div><p class="sub">در حال ارسال پاسخ‌ها…</p></div>',"");
  try{
   const r=await fetch(CONFIG.submitUrl,{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify(payload),credentials:"omit",referrerPolicy:"no-referrer",signal:AbortSignal.timeout(30000)});
   if(!r.ok)throw Error("HTTP "+r.status);
   let ack;try{ack=await r.json();}catch{throw Error("پاسخ سرور معتبر نیست؛ ثبت نهایی تأیید نشد.");}
   if(ack.accepted!==true||ack.submission_id!==submissionId||ack.exam_id!==expectedId||ack.bank_version!==bank.revision){
    throw Error("سرور دریافت همین نسخهٔ آزمون را تأیید نکرد. با برگزارکننده هماهنگ کن؛ ممکن است درخواست قبلی به سرور رسیده باشد.");
   }
   submitted=true;done();
  }catch(e){
   sending=false;oldReview();
   notice("ثبت نهایی تأیید نشد. پاسخ‌ها حفظ شده‌اند؛ در تلاش مجدد، همان شناسهٔ ارسال استفاده می‌شود. "+String(e.message||e));
  }
 };
 if(!bank.submitApproved&&!window.__ACADEMY_PREVIEW__){
  const banner=document.createElement("div");banner.className="note warn";
  banner.style.cssText="max-width:1124px;margin:12px auto;padding:12px 16px";
  banner.textContent="حالت بررسی: دریافت پاسخ این نسخه تا هماهنگی با سرور توسط ادمین غیرفعال است.";
  document.querySelector(".top")?.insertAdjacentElement("afterend",banner);
 }
 const description=document.querySelector(".side > p");
 if(description)description.textContent="با آرامش و دقت کامل پاسخ دهید. پس از ثبت نهایی، پاسخ‌ها برای بررسی به برگزارکننده ارسال می‌شوند.";
}
function inject(doc,s){
 remove(doc);
 if(!s.questions.length&&s.mode==="remote")return;
 const state=doc.createElement("script");state.id=STATE_ID;state.type="application/json";
 state.textContent=cleanJSON(normalizeState(s));doc.head.append(state);
 if(s.mode!=="managed")return;
 const loader=doc.createElement("script");loader.id=LOADER_ID;
 loader.textContent="if(!window.__ACADEMY_PREVIEW__){window.EXAM_DATA="+cleanJSON(exam(s))+";}";
 doc.head.append(loader);
 const runtime=doc.createElement("script");runtime.id=RUNTIME_ID;
 runtime.textContent="("+candidateRuntime.toString()+")();";doc.body.append(runtime);
}
const GUARD_TEMPLATE="// n8n Code node: Run Once for All Items.\n// Put this node ONLY on the \"question_bank_source === academy-studio\" branch.\n// Replace/append approved manifests here. Never use a client-supplied bank as an authority.\n// Then: deduplicate submission_id -> store canonical fields -> Respond to Webhook.\n// Do NOT send submission_ack before durable storage succeeds.\n// New and old published versions can coexist in KNOWN_BANKS.\nconst KNOWN_BANKS = __BANKS_JSON__;\n\nfunction validateSubmission(body) {\n  if (!body || body.schema_version !== 2 || body.question_bank_source !== \"academy-studio\") {\n    throw new Error(\"Unsupported submission schema.\");\n  }\n  const bank = KNOWN_BANKS.find(x => x.examId === body.exam_id && x.bankVersion === body.bank_version);\n  if (!bank) throw new Error(\"This exact exam version has not been approved on the server.\");\n  if (body.bank_id !== bank.bankId) throw new Error(\"Bank identifier mismatch.\");\n  const submissionId = String(body.submission_id || \"\");\n  if (!/^sub_[a-zA-Z0-9_-]{8,150}$/.test(submissionId)) throw new Error(\"Invalid submission identifier.\");\n  const nameFields = (Array.isArray(body.fields) ? body.fields : []).filter(f => f.id === \"name\");\n  if (nameFields.length !== 1) throw new Error(\"Missing or duplicate participant name.\");\n  const name = String(nameFields[0].answer ?? \"\").trim();\n  if (!name || name.length > 200) throw new Error(\"Invalid participant name.\");\n  if (!Array.isArray(body.answers_v2) || body.answers_v2.length !== bank.questions.length) {\n    throw new Error(\"Answer count does not match the approved bank.\");\n  }\n  const answerMap = new Map();\n  const validIds = new Set(bank.questions.map(q => q.question_id));\n  for (const a of body.answers_v2) {\n    if (!validIds.has(a.question_id) || answerMap.has(a.question_id) || typeof a.answer !== \"string\") {\n      throw new Error(\"Unknown/duplicate question or invalid answer.\");\n    }\n    if (a.answer.length > 20000) throw new Error(\"Answer is too long.\");\n    answerMap.set(a.question_id, a.answer);\n  }\n  const responses = bank.questions.map((q, i) => {\n    const answer = answerMap.get(q.question_id);\n    if (q.required && !answer.trim()) throw new Error(\"Required question is unanswered.\");\n    if (q.type === \"mcq\" && answer !== \"\" && !q.options.includes(answer)) {\n      throw new Error(\"Answer does not match an approved option.\");\n    }\n    return {question_id:q.question_id,position:i+1,type:q.type,question:q.question,\n      max_score:q.max_score,answer};\n  });\n  // Authoritative question text, type, order, and maximum score come from KNOWN_BANKS.\n  return {\n    event_type:\"submission\",schema_version:2,question_bank_source:\"academy-studio\",\n    exam_id:bank.examId,bank_id:bank.bankId,bank_version:bank.bankVersion,\n    form_id:bank.formId,form_name:bank.examTitle,submission_id:submissionId,\n    received_at:new Date().toISOString(),participant_name:name,\n    grading_status:\"pending_review\",requires_manual_review:true,\n    fields:[\n      {id:\"exam_id\",question:\"exam_id\",type:\"hidden\",answer:bank.examId,position:0},\n      {id:\"name\",question:\"نام و نام خانوادگی\",type:\"input\",answer:name,position:1},\n      ...responses.map((r,i)=>({id:\"q\"+(i+1),question_id:r.question_id,question:`Q${i+1}) ${r.question}`,\n        type:r.type===\"mcq\"?\"radio\":\"textarea\",answer:r.answer,position:i+2}))\n    ],\n    responses,\n    total_max_score:responses.reduce((sum,r)=>sum+r.max_score,0),\n    submission_ack:{accepted:true,submission_id:submissionId,exam_id:bank.examId,bank_version:bank.bankVersion}\n  };\n}\nreturn $input.all().map(item => ({json:validateSubmission(item.json.body ?? item.json)}));\n";
function serverGuard(s){checkPublication(s);return GUARD_TEMPLATE.replace("__BANKS_JSON__",JSON.stringify([exam(s)],null,2));}
window.AcademyQuestions={base,read,remove,touch,uid,normalizeState,fromInput,errors,exam,inject,checkPublication,serverGuard,MAX_QUESTIONS,MAX_OPTIONS};
})();
