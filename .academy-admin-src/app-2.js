   if(!["https://miladmirsheriii.app.n8n.cloud","https://mofid-academy.github.io"].includes(u.origin)){
    throw Error("این دامنه در فهرست امن پنل نیست. خروجی JSON سؤال‌ها را با دکمهٔ «ورود JSON» باز کن.");
   }
   load.disabled=true;load.textContent="در حال دریافت…";
   const r=await fetch(u.href,{headers:{Accept:"application/json"},credentials:"omit",redirect:"error",
    cache:"no-store",referrerPolicy:"no-referrer",signal:AbortSignal.timeout(20000)});
   if(!r.ok)throw Error("دریافت سؤال‌ها ناموفق بود: HTTP "+r.status);
   const text=await r.text();if(text.length>2000000)throw Error("پاسخ سرور بیش از حد بزرگ است.");
   adoptQuestions(AcademyQuestions.fromInput(JSON.parse(text)));
   status("سؤال‌ها وارد شدند. فقط متن و مشخصات عمومی نگه داشته شد؛ پاسخ صحیح و اطلاعات خصوصی وارد نمی‌شود.","success");
  }catch(e){status((e.message||e)+" — در خطای CORS یا اتصال، از ورود فایل JSON استفاده کن.","error");}
  finally{load.disabled=false;load.textContent="دریافت سؤال‌های فعلی از n8n";}
 };
 const imp=el("button","ورود JSON"),file=el("input");imp.id="qb-import";file.type="file";file.accept=".json,application/json";file.hidden=true;
 imp.onclick=()=>file.click();file.onchange=async()=>{
  try{const f=file.files[0];if(!f)return;if(f.size>2000000)throw Error("فایل JSON باید کمتر از ۲ مگابایت باشد.");
   if(s.questions.length&&!confirm("سؤال‌ها با فایل واردشده جایگزین شوند؟"))return;
   const data=JSON.parse(await f.text());adoptQuestions(AcademyQuestions.fromInput(data));
  }catch(e){fail(e);}finally{file.value="";}
 };
 imports.append(load,imp,file);root.append(imports);
 const err=el("div",undefined,"qb-error");err.id="qb-errors";err.setAttribute("role","status");root.append(err);
 const fields=el("div",undefined,"qb-exam-fields");
 for(const [k,label,hint]of [["examTitle","عنوان آزمون","عنوان بانک سؤال و نام آزمون ارسالی به سرور"],["formId","شناسهٔ فرم","معمولاً همین مقدار را نگه دار؛ تغییر آن باید با n8n هماهنگ شود."]]){
  const b=box(label,hint),input=el("input");input.id="qb-"+k;input.value=s[k];input.maxLength=k==="examTitle"?240:160;if(k==="formId")input.dir="ltr";
  input.onfocus=snapshot;input.oninput=()=>{s[k]=input.value;qChanged();};
  b.querySelector("label").htmlFor=input.id;b.append(input);fields.append(b);
 }root.append(fields);
 const tools=el("div",undefined,"qb-tools qb-add");
 for(const [type,label]of [["desc","+ سؤال تشریحی"],["mcq","+ سؤال تستی"]]){
  const b=el("button",label,type==="mcq"?"primary":"");b.id="qb-add-"+type;
  b.disabled=s.questions.length>=AcademyQuestions.MAX_QUESTIONS;b.onclick=()=>qAction(()=>{
   const q={id:AcademyQuestions.uid(),question:"",type,options:type==="mcq"?["","","",""]:[],max_score:type==="mcq"?1:5,required:false};
   s.questions.push(q);selectedQuestionId=q.id;
  });tools.append(b);
 }root.append(tools);
 if(!s.questions.length)root.append(el("p","از دکمه‌های بالا سؤال بساز یا سؤال‌های فعلی را دریافت کن. سؤال‌ها هنگام انتشار به‌صورت خودکار شماره‌گذاری می‌شوند.","tip"));
 const list=el("div",undefined,"qb-list");root.append(list);
 function move(id,delta){
  const idx=s.questions.findIndex(q=>q.id===id),dest=idx+delta;if(dest<0||dest>=s.questions.length)return;
  qAction(()=>{const [q]=s.questions.splice(idx,1);s.questions.splice(dest,0,q);selectedQuestionId=id;});
 }
 s.questions.forEach((q,index)=>{
  const card=el("details",undefined,"qb-card");card.dataset.questionId=q.id;card.open=q.id===selectedQuestionId;
  const head=el("summary"),handle=el("span","⠿","qb-drag"),num=el("span",String(index+1),"qb-number"),
    title=el("span",q.question.trim()||"سؤال جدید","qb-card-title"),type=el("span",q.type==="mcq"?"تستی":"تشریحی","qb-type");
  handle.draggable=true;handle.title="برای جابه‌جایی بکش";handle.setAttribute("aria-label","دستگیرهٔ جابه‌جایی");
  handle.ondragstart=e=>{e.dataTransfer.setData("text/plain",q.id);e.dataTransfer.effectAllowed="move";};
  card.ondragover=e=>{e.preventDefault();e.dataTransfer.dropEffect="move";card.classList.add("qb-drop");};
  card.ondragleave=()=>card.classList.remove("qb-drop");
  card.ondrop=e=>{e.preventDefault();card.classList.remove("qb-drop");
   const id=e.dataTransfer.getData("text/plain"),from=s.questions.findIndex(x=>x.id===id),to=s.questions.findIndex(x=>x.id===q.id);
   if(from<0||to<0||from===to)return;
   qAction(()=>{const [item]=s.questions.splice(from,1);s.questions.splice(to,0,item);selectedQuestionId=id;});
  };
  head.append(handle,num,title,type);card.append(head);
  card.addEventListener("toggle",()=>{if(card.open){selectedQuestionId=q.id;}});
  const content=el("div",undefined,"qb-card-body");
  const bar=el("div",undefined,"qb-tools qb-question-actions");
  for(const [text,action,disabled,aria]of [
   ["↑",()=>move(q.id,-1),index===0,"انتقال سؤال به بالا"],["↓",()=>move(q.id,1),index===s.questions.length-1,"انتقال سؤال به پایین"],
   ["کپی",()=>qAction(()=>{const c=JSON.parse(JSON.stringify(q));c.id=AcademyQuestions.uid();s.questions.splice(index+1,0,c);selectedQuestionId=c.id;}),s.questions.length>=200,"ساخت کپی سؤال"],
   ["حذف",()=>{if(confirm("سؤال "+(index+1)+" حذف شود؟"))qAction(()=>{s.questions.splice(index,1);selectedQuestionId=s.questions[Math.min(index,s.questions.length-1)]?.id||"";});},false,"حذف سؤال"]
  ]){
   const b=el("button",text);b.type="button";b.disabled=disabled;b.setAttribute("aria-label",aria);b.onclick=action;bar.append(b);
  }
  const show=el("button","پیش‌نمایش");show.type="button";show.onclick=()=>{selectedQuestionId=q.id;$("scene").value="selected";preview();};bar.append(show);content.append(bar);
  const qt=box("متن سؤال"),textarea=el("textarea");textarea.className="qb-question-text";textarea.rows=3;textarea.value=q.question;textarea.maxLength=8000;textarea.id="question-"+q.id;qt.querySelector("label").htmlFor=textarea.id;
  textarea.onfocus=snapshot;textarea.oninput=()=>{q.question=textarea.value;title.textContent=q.question.trim()||"سؤال جدید";qChanged();};qt.append(textarea);content.append(qt);
  const row=el("div",undefined,"qb-meta");
  const tb=box("نوع پاسخ"),select=el("select");select.setAttribute("aria-label","نوع پاسخ سؤال "+(index+1));select.className="qb-question-type";
  [["desc","تشریحی"],["mcq","تستی (تک‌گزینه‌ای)"]].forEach(([v,t])=>{const o=el("option",t);o.value=v;select.append(o);});select.value=q.type;
  select.onchange=()=>qAction(()=>{
   if(q.type==="mcq")optionDrafts.set(q.id,q.options.slice());
   q.type=select.value;q.options=q.type==="mcq"?(optionDrafts.get(q.id)||["","","",""]):[];
   selectedQuestionId=q.id;
  });tb.append(select);row.append(tb);
  const mb=box("بارم"),score=el("input");score.type="number";score.min=.01;score.max=1000;score.step=.25;score.value=q.max_score;score.className="qb-score";
  score.setAttribute("aria-label","بارم سؤال "+(index+1));score.onfocus=snapshot;score.oninput=()=>{q.max_score=score.value===""?0:Number(score.value);qChanged();};mb.append(score);row.append(mb);
  content.append(row);
  const req=el("label",undefined,"qb-required"),check=el("input");check.type="checkbox";check.checked=q.required;
  check.onchange=()=>qAction(()=>{q.required=check.checked;selectedQuestionId=q.id;});
  req.append(check,document.createTextNode("پاسخ به این سؤال الزامی باشد"));content.append(req);
  if(q.type==="mcq"){
   const opts=el("div",undefined,"qb-options");opts.append(el("h3","گزینه‌ها (۲ تا ۸ گزینه)","group-title"));
   q.options.forEach((value,j)=>{
    const opt=el("div",undefined,"qb-option"),n=el("span",String(j+1)),text=el("textarea");text.rows=1;text.className="qb-option-text";text.value=value;text.maxLength=2000;
    text.setAttribute("aria-label","متن گزینه "+(j+1)+" سؤال "+(index+1));text.onfocus=snapshot;text.oninput=()=>{q.options[j]=text.value;qChanged();};
    const actions=el("div",undefined,"qb-option-actions");
    for(const [symbol,delta,label]of [["↑",-1,"گزینه به بالا"],["↓",1,"گزینه به پایین"]]){
     const b=el("button",symbol);b.setAttribute("aria-label",label);b.disabled=j+delta<0||j+delta>=q.options.length;
     b.onclick=()=>qAction(()=>{const [v]=q.options.splice(j,1);q.options.splice(j+delta,0,v);selectedQuestionId=q.id;});actions.append(b);
    }
    const del=el("button","×");del.setAttribute("aria-label","حذف گزینه");del.disabled=q.options.length<=2;
    del.onclick=()=>{if(value.trim()&&!confirm("این گزینه حذف شود؟"))return;qAction(()=>{q.options.splice(j,1);selectedQuestionId=q.id;});};actions.append(del);
    opt.append(n,text,actions);opts.append(opt);
   });
   const add=el("button","+ افزودن گزینه");add.className="qb-add-option";add.disabled=q.options.length>=8;
   add.onclick=()=>qAction(()=>{q.options.push("");selectedQuestionId=q.id;});opts.append(add);content.append(opts);
  }
  const identity=el("small","شناسه ثابت: "+q.id,"qb-id");identity.dir="ltr";content.append(identity);
  card.append(content);list.append(card);
 });
 const transfer=el("details",undefined,"qb-transfer");transfer.append(el("summary","ورود گروهی و خروجی بانک"));
 const lines=el("textarea");lines.placeholder="هر سؤال در یک خط؛ سؤال‌ها به‌صورت تشریحی اضافه می‌شوند.";lines.id="qb-bulk";
 const bulk=el("button","افزودن گروهی");bulk.onclick=()=>{
  const a=lines.value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  if(!a.length)return;if(a.length+s.questions.length>200){fail(Error("حداکثر ۲۰۰ سؤال مجاز است."));return;}
  qAction(()=>{a.forEach(question=>s.questions.push({id:AcademyQuestions.uid(),question:question.slice(0,8000),type:"desc",options:[],max_score:5,required:false}));selectedQuestionId=s.questions.at(-1)?.id||"";});
 };
 const draft=el("button","دانلود پیش‌نویس سؤال‌ها");draft.onclick=()=>download(JSON.stringify(s,null,2),"academy-questions-draft.json","application/json;charset=utf-8");
 const manifest=el("button","خروجی بانک برای n8n");manifest.id="qb-export-manifest";manifest.onclick=()=>{
  try{if(s.mode!=="managed")throw Error("ابتدا منبع «سؤال‌های این پنل» را انتخاب کن.");
   AcademyQuestions.checkPublication(s);download(JSON.stringify(AcademyQuestions.exam(s),null,2),"academy-bank-"+s.revision+".json","application/json;charset=utf-8");
  }catch(e){fail(e);}
 };
 const guard=el("button","دانلود کد اعتبارسنجی n8n");guard.id="qb-export-guard";guard.onclick=()=>{
  try{if(s.mode!=="managed")throw Error("ابتدا بانک دلخواه را فعال کن.");
   download(AcademyQuestions.serverGuard(s),"n8n-validate-question-bank.js","text/javascript;charset=utf-8");
  }catch(e){fail(e);}
 };
 transfer.append(guard);
 transfer.append(lines,bulk,el("p","خروجی بانک شامل متن سؤال، شناسهٔ ثابت، ترتیب، نوع و بارم است؛ کلید پاسخ صحیح در آن نیست.","tip"),draft,manifest);root.append(transfer);
 const back=el("details",undefined,"qb-backend");back.append(el("summary","اتصال پاسخ‌ها به n8n"));
 back.append(el("p","سؤال‌های جدید نسخهٔ مستقل می‌گیرند. قبل از فعال‌کردن ارسال، همین نسخه را در سرور ثبت و تست کن. پس از هر تغییر در بانک، تأیید ارسال دوباره خاموش می‌شود. تغییرهای رنگ و ظاهر آن را خاموش نمی‌کنند.","tip"));
 const label=el("label",undefined,"qb-required"),ok=el("input");ok.type="checkbox";ok.id="qb-backend-check";ok.checked=s.submitApproved;
 ok.onchange=()=>{
  if(ok.checked){
   try{if(s.mode!=="managed")throw Error("بانک مدیریت‌شده فعال نیست.");AcademyQuestions.checkPublication(s);}catch(e){ok.checked=false;fail(e);return;}
   if(!confirm("تأیید می‌کنی همین نسخه بانک در n8n ثبت شده، پاسخ‌ها ذخیره می‌شوند و قرارداد تأیید دریافت طبق راهنما پیاده شده است؟ این انتخاب بررسی خودکار سرور نیست.")){ok.checked=false;return;}
  }
  snapshot();s.submitApproved=ok.checked;changed();updateQuestionSummary();
 };
 label.append(ok,document.createTextNode("هماهنگی این نسخه با n8n را انجام داده‌ام؛ ارسال فعال شود"));
 back.append(label,el("p","سرور باید پس از ذخیرهٔ موفق پاسخ‌ها accepted=true و مقادیر برابر submission_id، exam_id و bank_version را برگرداند. بدون این تأیید، پیام موفقیت نشان داده نمی‌شود.","tip"));
 const version=el("code");version.id="qb-version";back.append(version);
 back.append(el("p","بانک و فرم روی GitHub عمومی هستند. پاسخ صحیح، کلید دسترسی و معیار تصحیح محرمانه را در این پنل یا متن سؤال وارد نکن.","tip"));root.append(back);
 updateQuestionSummary();
}

function hex(c){const ctx=document.createElement("canvas").getContext("2d");ctx.fillStyle=c;const s=ctx.fillStyle;if(/^#[0-9a-f]{6}$/i.test(s))return s;const a=s.match(/[\d.]+/g);return a?.length>=3?"#"+a.slice(0,3).map(x=>Math.round(+x).toString(16).padStart(2,"0")).join(""):"#ffffff";}
const targets=[["body","کل صفحه"],[".top","نوار بالا"],[".logo-box","قاب لوگو"],[".logo-box img","تصویر لوگو"],[".brand-txt b","عنوان آکادمی"],[".brand-txt span","زیرعنوان انگلیسی"],[".pill","برچسب بالای صفحه"],[".wrap","چیدمان کلی"],[".side","پنل کناری"],[".side h2","عنوان پنل"],[".side p","توضیح پنل"],[".side .tag","برچسب پنل"],[".facts","تعداد و زمان"],[".facts b","عددهای تعداد و زمان"],[".steps","مراحل"],[".step","هر مرحله"],[".card","کادر اصلی فرم"],["h1","عنوان اصلی"],[".sub","توضیحات فرم"],[".qtext","متن سؤال"],["input[type=text]","فیلد نام"],["textarea","پاسخ تشریحی"],[".opt","گزینه‌ها"],[".opt .key","شماره گزینه"],[".note","پیام راهنما"],[".note.warn","پیام هشدار"],[".chip","برچسب‌های پایان"],[".foot","پایین فرم"],[".hint","راهنمای صفحه‌کلید"],["button.b","دکمه‌ها"],["button.p","دکمه اصلی"],[".big","لوگوی پایان"],[".bar","نوار پیشرفت"],[".bar i","قسمت پرشده نوار"],[".crumbs","متن پیشرفت"]];
const props=[["font-family","فونت"],["font-size","اندازه نوشته"],["font-weight","ضخامت نوشته"],["line-height","فاصله سطرها"],["text-align","تراز نوشته"],["color","رنگ نوشته"],["background","پس‌زمینه یا گرادیان"],["width","عرض"],["height","ارتفاع"],["max-width","حداکثر عرض"],["min-height","حداقل ارتفاع"],["padding","فاصله داخلی"],["margin","فاصله بیرونی"],["gap","فاصله اجزا"],["border-radius","گردی گوشه‌ها"],["border","حاشیه"],["box-shadow","سایه"],["opacity","شفافیت"],["display","نمایش (none برای مخفی)"],["grid-template-columns","ستون‌های چیدمان"]];
function defaults(selector,scope){
 const out={};try{const sheet=new CSSStyleSheet();sheet.replaceSync(model.styles.join("\n"));
 const walk=rs=>{for(const r of rs){if(r.cssRules){if(scope==="mobile"||!/max-width/.test(r.conditionText||""))walk(r.cssRules);continue;}if(r.selectorText?.split(",").map(x=>x.trim()).includes(selector))for(const k of r.style)out[k]=r.style.getPropertyValue(k);}};walk(sheet.cssRules);
 }catch{}return out;
