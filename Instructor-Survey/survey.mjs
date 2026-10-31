import {QUESTIONS,SCORE_QUESTIONS,SURVEY_ID,DEFAULT_CATALOG,academyLabel,answerProvided} from './questions.mjs?v=20261031.3-instructor';
import {api,fa,esc,dateFa,icons,initTheme} from './shared.mjs?v=20261031.3-instructor';
import {mountQuestionEffects} from './question-effects.mjs?v=20261031.3-instructor';
initTheme();
const $=s=>document.querySelector(s),view=$('#view'),actions=$('#formActions'),params=new URL(location.href).searchParams;
const preview=params.get('preview')==='1';
const initialAcademy=document.body.dataset.surveyAcademy||'call-center';
const freeEntry=document.body.dataset.entryMode==='free-text';
const KEY='mofid-instructor-v2:'+location.pathname+':'+initialAcademy+(preview?':preview':'');
let state={id:crypto.randomUUID(),academy:initialAcademy,organizational_name:'',instructor_name:'',course_title:'',answers:{},started_at:0,updated_at:Date.now()};
let step=-1,pending=null,receipt=null,settings=null,loading=false,sending=false,returnToReview=false,timer=0,version=0,cleanup=()=>{},storageOK=true;
try{const saved=JSON.parse(localStorage.getItem(KEY)||'null');if(saved?.survey_id===SURVEY_ID&&saved.state?.academy===initialAcademy&&Date.now()-saved.state.updated_at<14*86400000){state=saved.state;step=Number.isInteger(saved.step)?Math.min(QUESTIONS.length,Math.max(-1,saved.step)):-1;pending=saved.pending;receipt=saved.receipt;}}catch{storageOK=false;}
if(pending)state={...state,...pending,answers:{...pending.answers}};
const catalog=()=>settings?.catalog||DEFAULT_CATALOG;
const selected=()=>catalog().find(c=>c.id===state.academy)||catalog()[0];
const answered=q=>answerProvided(q,state.answers[q.code]);
const missing=()=>QUESTIONS.findIndex(q=>q.required&&!answered(q));
const avg=()=>SCORE_QUESTIONS.reduce((s,q)=>s+(Number(state.answers[q.code])||0),0)/5;
function save(){state.updated_at=Date.now();try{localStorage.setItem(KEY,JSON.stringify({survey_id:SURVEY_ID,state,step,pending,receipt}));}catch{storageOK=false;}}
function error(m=''){const e=$('#formError');e.textContent=m;e.hidden=!m;if(m)e.focus({preventScroll:true});}
function focus(){const h=view.querySelector('h2');if(h){h.tabIndex=-1;h.focus({preventScroll:true});}if(step>=0&&matchMedia('(max-width:700px)').matches)$('#survey').scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});}
function go(n){step=n;save();render();focus();}
function render(){
  clearTimeout(timer);version++;cleanup();cleanup=()=>{};error();
  $('#clockIcon').innerHTML=icons.clock;$('#shieldIcon').innerHTML=icons.shield;
  $('#previewBanner').hidden=!preview;
  const count=receipt?QUESTIONS.length:Math.max(0,Math.min(step,QUESTIONS.length));
  $('#progressFill').style.width=count/QUESTIONS.length*100+'%';$('.progress-track').setAttribute('aria-valuenow',count);
  $('#sectionLabel').textContent=receipt?'با سپاس از همراهی شما':step<0?'خوش آمدید':step===QUESTIONS.length?'بازبینی نهایی':QUESTIONS[step].axis;
  $('#stepLabel').textContent=receipt?'ثبت نهایی':step<0?'پیش از شروع':step===QUESTIONS.length?'یک قدم تا پایان':fa(step+1)+' از '+fa(QUESTIONS.length);
  $('#survey').classList.toggle('is-question',step>=0&&!receipt);
  actions.classList.toggle('intro-actions',step<0&&!receipt);
  const map=$('#questionMap');map.hidden=step<0||!!receipt||!!pending;
  map.innerHTML=QUESTIONS.map((q,i)=>'<button type="button" class="'+(i===step?'current ':'')+(answered(q)&&state.answers[q.code]!==undefined?'answered':'')+'" data-jump="'+i+'" aria-label="رفتن به '+esc(q.axis)+'" '+(i===step?'aria-current="step"':'')+'>'+fa(i+1)+'</button>').join('');
  map.querySelectorAll('button').forEach(b=>b.onclick=()=>{returnToReview=false;go(+b.dataset.jump);});
  if(receipt)success();else if(step<0)intro();else if(step>=QUESTIONS.length)review();else question();
}
function intro(){
  const c=selected(),closed=settings&&(!settings.is_open||!c.is_open),lock=!!pending,classRequired=c.class_required!==false;
  const options=(values,current,placeholder)=>'<option value="" '+(!values.includes(current)?'selected':'')+' disabled>'+placeholder+'</option>'+values.map(value=>'<option value="'+esc(value)+'" '+(value===current?'selected':'')+'>'+esc(value)+'</option>').join('');
  const textField=(id,max,placeholder,required)=>'<input type="text" id="'+id+'" autocomplete="off" maxlength="'+max+'" placeholder="'+placeholder+'" value="'+esc(state[id])+'" '+(required?'required ':'')+(lock?'disabled':'')+'>';
  view.innerHTML='<p class="intro-description">'+(freeEntry?'نام مدرس و عنوان کلاس را خودتان بنویسید و بازخوردتان را ثبت کنید.':'بازخورد شما، به بهبود کیفیت آموزش‌ها کمک می‌کند. نام سازمانی برای ثبت نتیجه الزامی است.')+'</p><form id="identityForm" class="context-fields">'+
    '<div class="identity-name"><label for="organizational_name">نام سازمانی <span class="req">*</span></label><input id="organizational_name" dir="auto" autocomplete="username" maxlength="120" placeholder="m.mirsheri" value="'+esc(state.organizational_name)+'" required '+(lock?'disabled':'')+'></div>'+
    '<div><label for="instructor_name">نام مدرس <span class="req">*</span></label>'+(freeEntry?textField('instructor_name',140,'نام مدرس را بنویسید',true):'<select id="instructor_name" required '+(lock?'disabled':'')+'>'+options(c.instructors,state.instructor_name,'نام مدرس را انتخاب کنید')+'</select>')+'</div>'+
    '<div><label for="course_title">عنوان کلاس '+(classRequired?'<span class="req">*</span>':'<small>(اختیاری)</small>')+'</label>'+(freeEntry?textField('course_title',200,'عنوان کلاس را بنویسید',classRequired):'<select id="course_title" '+(classRequired?'required ':'')+(lock?'disabled':'')+'>'+(!classRequired?'<option value="">انتخاب عنوان کلاس (اختیاری)</option>':'')+options(c.classes,state.course_title,'عنوان کلاس را انتخاب کنید')+'</select>')+'</div></form>';
  for(const k of ['organizational_name','instructor_name','course_title'])$('#'+k).oninput=e=>{state[k]=e.target.value;save();};
  actions.innerHTML='<button type="submit" form="identityForm" class="button primary" id="start" '+(!settings||closed?'disabled':'')+'>'+(!settings?'در حال اتصال…':closed?'پاسخ‌گویی بسته است':pending?'بازگشت به ارسال':state.started_at?'ادامهٔ پاسخ‌گویی':'شروع نظرسنجی')+icons.arrow+'</button>';
  $('#identityForm').onsubmit=e=>{e.preventDefault();if(!settings||closed)return;if(!pending){for(const k of ['organizational_name','instructor_name','course_title']){state[k]=$('#'+k).value.trim();if(!state[k]&&(k!=='course_title'||classRequired)){error('لطفاً همهٔ مشخصات الزامی را تکمیل کنید.');$('#'+k).focus();return;}}state.started_at=state.started_at||Date.now();}go(pending||missing()===-1?QUESTIONS.length:missing());};
  if(closed)error('پاسخ‌گویی این دوره در حال حاضر بسته است.');
}
function question(){
  const q=QUESTIONS[step],value=state.answers[q.code];
  const options=q.kind==='text'?'<label class="sr-only" for="answerText">نظر یا پیشنهاد شما</label><textarea id="answerText" required maxlength="2000" rows="5" placeholder="نقطهٔ قوت یا پیشنهاد بهبود…" aria-describedby="questionHelp">'+esc(value||'')+'</textarea><span class="text-counter" id="counter">'+fa((value||'').length)+' / ۲٬۰۰۰ نویسه</span>':
    '<div class="number-scale five" role="radiogroup" aria-labelledby="questionTitle" aria-describedby="questionHelp">'+q.options.map(o=>'<label class="number-option"><input type="radio" name="answer" value="'+o.value+'" '+(value===o.value?'checked':'')+' aria-label="'+fa(o.value)+'، '+esc(o.label)+'"><span>'+fa(o.value)+'</span></label>').join('')+'</div><div class="scale-labels"><span>خیلی ضعیف</span><span>عالی</span></div>';
  view.innerHTML='<div class="question-kicker"><span>'+esc(q.axis)+'</span><span class="optional">'+(q.required?'پاسخ الزامی':'اختیاری')+'</span></div><h2 class="question-title" id="questionTitle">'+esc(q.text)+'</h2><p class="question-help" id="questionHelp">'+(q.kind==='text'?'پاسخ این پرسش الزامی است؛ یک نقطهٔ قوت یا پیشنهاد بهبود بنویسید.':'با انتخاب امتیاز، سؤال بعدی نمایش داده می‌شود.')+'</p>'+options;
  function schedule(input){clearTimeout(timer);const v=version;timer=setTimeout(()=>{if(v===version&&input.isConnected&&input.checked&&!sending)$('#next')?.click();},matchMedia('(prefers-reduced-motion:reduce)').matches?180:350);}
  view.querySelectorAll('input[name="answer"]').forEach(input=>{input.onchange=()=>{state.answers[q.code]=+input.value;save();error();schedule(input);};input.onclick=()=>{if(input.checked&&state.answers[q.code]===+input.value)schedule(input);};});
  if(q.kind==='text')$('#answerText').oninput=e=>{state.answers[q.code]=e.target.value;$('#counter').textContent=fa(e.target.value.length)+' / ۲٬۰۰۰ نویسه';save();};
  actions.innerHTML='<button type="button" class="button text" id="back">بازگشت</button>'+(!q.required?'<button type="button" class="button text" id="skip">رد کردن</button>':'')+'<button type="button" class="button primary" id="next">'+(returnToReview?'بازگشت به بازبینی':step===QUESTIONS.length-1?'بازبینی پاسخ‌ها':'سؤال بعدی')+icons.arrow+'</button>';
  $('#back').onclick=()=>{returnToReview=false;go(step-1);};
  const next=()=>{if(q.required&&!answered(q)){error(q.kind==='text'?'لطفاً نظر یا پیشنهاد خود را بنویسید.':'لطفاً یک امتیاز برای این سؤال انتخاب کنید.');if(q.kind==='text')$('#answerText').focus();return;}const target=returnToReview?QUESTIONS.length:step+1;returnToReview=false;go(target);};
  $('#next').onclick=next;if($('#skip'))$('#skip').onclick=next;
  cleanup=mountQuestionEffects($('#survey'),view);
}
function review(){
  view.innerHTML='<span class="intro-kicker">یک قدم تا پایان</span><h2>پاسخ‌ها را مرور کنید.</h2><p class="intro-description">'+(pending?'پاسخ‌ها آمادهٔ ارسال‌اند؛ برای تأیید ثبت دوباره تلاش کنید.':'پیش از ثبت، می‌توانید مشخصات و پاسخ‌ها را ویرایش کنید.')+'</p><div class="respondent-review"><span>'+esc(selected()?.label||academyLabel(state.academy))+' · '+esc(state.organizational_name)+'<br>'+esc(state.instructor_name)+' · '+esc(state.course_title)+'</span>'+(!pending?'<button id="editIdentity" class="button text">ویرایش مشخصات</button>':'')+'</div><div class="review-list">'+QUESTIONS.map((q,i)=>'<div class="review-row"><div><b>'+esc(q.axis)+'</b><p>'+esc(q.kind==='text'?(state.answers[q.code]||'بدون نظر'):fa(state.answers[q.code])+' از ۵')+'</p></div><button data-edit="'+i+'" '+(pending?'disabled':'')+'>ویرایش</button></div>').join('')+'</div><div class="privacy-note">میانگین امتیاز شما: <b>'+fa(avg(),2)+' از ۵</b></div>';
  if($('#editIdentity'))$('#editIdentity').onclick=()=>go(-1);
  view.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>{returnToReview=true;go(+b.dataset.edit);});
  actions.innerHTML='<button id="back" class="button text" '+(pending?'disabled':'')+'>بازگشت</button><button id="submit" class="button primary">'+(preview?'پایان پیش‌نمایش':pending?'تلاش مجدد برای ثبت':'ثبت نهایی پاسخ‌ها')+icons.check+'</button>';
  $('#back').onclick=()=>go(QUESTIONS.length-1);$('#submit').onclick=submit;
}
async function submit(){
  if(sending)return;if(missing()>=0){go(missing());error('پاسخ این سؤال الزامی است.');return;}sending=true;$('#submit').disabled=true;error();
  try{
    if(preview){receipt={id:state.id,created_at:new Date().toISOString(),preview:true};save();render();focus();return;}
    pending=pending||{id:state.id,survey_id:SURVEY_ID,academy:state.academy,organizational_name:state.organizational_name,instructor_name:state.instructor_name,course_title:state.course_title,answers:{...state.answers},duration_seconds:Math.min(86400,Math.max(0,Math.round((Date.now()-state.started_at)/1000))),source_url:location.origin+location.pathname};
    save();review();$('#submit').disabled=true;$('#submit').innerHTML='<span class="loading-dot"></span> در حال ثبت…';
    const ack=await api('submit',{data:pending});if(ack.stored!==true||ack.id!==pending.id)throw Error('ذخیرهٔ پاسخ تأیید نشد.');
    receipt={id:ack.id,created_at:ack.created_at};pending=null;state.answers={};save();render();focus();
  }catch(e){review();error(e.message+' پاسخ‌ها حفظ شده‌اند.');}finally{sending=false;}
}
function success(){
  view.innerHTML='<div class="success-icon">'+icons.check+'</div><span class="intro-kicker">'+(receipt.preview?'پیش‌نمایش به پایان رسید':'پاسخ شما با موفقیت ذخیره شد')+'</span><h2>از همراهی شما<br>سپاسگزاریم.</h2><p class="intro-description">'+(receipt.preview?'در حالت پیش‌نمایش، هیچ پاسخی در سامانه ثبت نشده است.':'بازخورد شما به بهبود کیفیت آموزش کمک می‌کند. پاسخ‌تان ثبت شده و نیازی به ارسال دوباره نیست.')+'</p><label>شناسهٔ پیگیری</label><div class="receipt">'+esc(receipt.id)+'</div><p class="action-hint">'+dateFa(receipt.created_at)+'، به وقت تهران</p>';
  actions.innerHTML='<button id="copyReceipt" class="button subtle">'+icons.copy+' کپی شناسه</button><button id="another" class="button text">ارزیابی کلاس دیگر</button>';
  $('#copyReceipt').onclick=async()=>{try{await navigator.clipboard.writeText(receipt.id);$('#copyReceipt').textContent='شناسه کپی شد';}catch{error('شناسهٔ بالا را انتخاب و کپی کنید.');}};
  $('#another').onclick=()=>{state={...state,id:crypto.randomUUID(),instructor_name:'',course_title:'',answers:{},started_at:0};pending=null;receipt=null;go(-1);};
}
async function load(){if(loading)return;loading=true;try{settings=preview?{is_open:true,catalog:DEFAULT_CATALOG}:(await api('config')).settings;if(step<0&&!receipt)render();}catch(e){if(step<0&&!receipt){render();error(e.message);actions.innerHTML='<button id="retry" class="button primary">تلاش دوباره برای اتصال</button>';$('#retry').onclick=load;}}finally{loading=false;}}
function network(){$('#offlineNotice').hidden=navigator.onLine;}
window.addEventListener('offline',network);window.addEventListener('online',network);window.addEventListener('beforeunload',save);network();render();load();
