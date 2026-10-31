import {QUESTIONS,SURVEY_ID} from './questions.mjs';
import {api,fa,esc,dateFa,icons,initTheme} from './shared.mjs';
import {respondentNameParts} from './respondent-name.mjs?v=20261031.6';
import {mountQuestionEffects} from './question-effects.mjs?v=20261031.6';
initTheme();
document.querySelector('#clockIcon').innerHTML=icons.clock;
document.querySelector('#shieldIcon').innerHTML=icons.shield;
const $=s=>document.querySelector(s),view=$('#view'),actions=$('#formActions');
const preview=new URL(location.href).searchParams.get('preview')==='1';
const KEY='mofid-parent-survey-v1'+(preview?'-preview':'');
let storageOK=true,settings=null,loading=false,sending=false,pending=null,receipt=null,step=-1,returnToReview=false;
let autoAdvanceTimer=0,sceneVersion=0,cleanupQuestionEffects=()=>{};
let state={id:crypto.randomUUID(),answers:{},first_name:'',last_name:'',school:'',grade:'',cohort:'',relationship:'',started_at:0,updated_at:Date.now()};
try{
  const old=JSON.parse(localStorage.getItem(KEY)||'null');
  if(old?.survey_id===SURVEY_ID&&old.state&&Date.now()-old.state.updated_at<14*86400000){state=old.state;step=old.step??-1;pending=old.pending;receipt=old.receipt;}
}catch{storageOK=false;}
state.first_name=state.first_name||'';state.last_name=state.last_name||'';
if(pending){for(const k of ['id','school','grade','cohort','relationship','first_name','last_name'])if(pending[k]!==undefined)state[k]=pending[k];state.answers={...pending.answers};}
state.full_name=pending?[state.first_name,state.last_name].filter(Boolean).join(' '):(state.full_name??[state.first_name,state.last_name].filter(Boolean).join(' '));
const namesComplete=()=>Boolean(state.first_name?.trim()&&state.last_name?.trim());
if(!receipt&&!namesComplete())step=-1;
const params=new URL(location.href).searchParams;
for(const k of ['school','cohort','grade'])if(!state[k]&&params.get(k))state[k]=params.get(k).slice(0,k==='grade'?40:120);
function save(){state.updated_at=Date.now();try{localStorage.setItem(KEY,JSON.stringify({survey_id:SURVEY_ID,state,step,pending,receipt}));}catch{storageOK=false;}}
function error(message){const e=$('#formError');e.textContent=message;e.hidden=!message;if(message)e.focus({preventScroll:true});}
function focusTitle(){const h=view.querySelector('h2');if(h){h.tabIndex=-1;h.classList.add('section-focus');h.focus({preventScroll:true});}if(matchMedia('(max-width:700px)').matches&&step>=0)$('#survey').scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});}
function answered(q){return state.answers[q.code]!==undefined&&state.answers[q.code]!==null&&state.answers[q.code]!=='';}
function missing(){return QUESTIONS.findIndex(q=>q.required&&!answered(q));}
function choiceText(q,v){if(v===null||v===undefined||v==='')return 'بدون پاسخ (اختیاری)';const o=q.options.find(o=>o.value===v);if(q.kind==='text')return v;if(q.kind==='scale10')return fa(v)+' از ۱۰';return (typeof v==='number'?fa(v)+' — ':'')+(o?.label||v);}
function render(){
  clearTimeout(autoAdvanceTimer);autoAdvanceTimer=0;sceneVersion++;
  cleanupQuestionEffects();cleanupQuestionEffects=()=>{};
  error('');actions.classList.remove('intro-actions');$('#previewBanner').hidden=!preview;
  $('#survey').classList.toggle('is-question',step>=0&&!receipt);
  const pct=receipt?15:Math.max(0,Math.min(step,15));
  $('#progressFill').style.width=pct/15*100+'%';
  $('.progress-track').setAttribute('aria-valuenow',pct);
  $('#sectionLabel').textContent=receipt?'با سپاس از همراهی شما':step<0?'خوش آمدید':step===15?'بازبینی پاسخ‌ها':QUESTIONS[step].axis;
  $('#stepLabel').textContent=receipt?(receipt.preview?'پیش‌نمایش کامل شد':'ثبت نهایی تأیید شد'):step<0?'پیش از شروع':step===15?'آمادهٔ ثبت نهایی':'سؤال '+fa(step+1)+' از ۱۵';
  const map=$('#questionMap');map.hidden=step<0||!!receipt;
  map.innerHTML=QUESTIONS.map((q,i)=>'<button type="button" data-jump="'+i+'" class="'+(answered(q)?'answered ':'')+(step===i?'current':'')+'" aria-label="سؤال '+fa(i+1)+'، '+esc(q.axis)+(answered(q)?'، پاسخ داده شده':'')+'" '+(step===i?'aria-current="step"':'')+(pending?' disabled':'')+'>'+fa(i+1)+'</button>').join('');
  map.querySelectorAll('button').forEach(b=>b.onclick=()=>{step=+b.dataset.jump;returnToReview=false;save();render();focusTitle();});
  if(receipt)return renderSuccess();
  if(step<0)return renderIntro();
  if(step===15)return renderReview();
  renderQuestion();
}
function renderIntro(){
  view.innerHTML=`<p class="intro-description">ولی گرامی، تجربه و نگاه شما به ما کمک می‌کند اثر این دوره را بهتر بشناسیم و آن را برای دانش‌آموزان بهتر کنیم.</p>
  <form id="identityForm" class="intro-form" aria-label="مشخصات پاسخ‌دهنده"><div class="identity-fields">
    <div><label for="full_name">نام و نام خانوادگی پاسخ‌دهنده <span class="required-mark" aria-hidden="true">*</span></label><input id="full_name" name="full_name" autocomplete="name" maxlength="161" required placeholder="نام و نام خانوادگی" value="${esc(state.full_name)}"></div>
  </div><div class="context-fields">
    <div><label for="school">مدرسه <small>(اختیاری)</small></label><input id="school" name="school" list="schools" maxlength="120" placeholder="نام مدرسه" autocomplete="off" value="${esc(state.school)}"><datalist id="schools">${(settings?.schools||[]).map(s=>'<option value="'+esc(s)+'">').join('')}</datalist></div>
    <div><label for="grade">پایه تحصیلی <small>(اختیاری)</small></label><select id="grade" name="grade"><option value="">انتخاب پایه</option>${['اول','دوم','سوم','چهارم','پنجم','ششم','هفتم','هشتم','نهم','دهم','یازدهم','دوازدهم'].map(g=>'<option '+(state.grade===g?'selected':'')+'>'+g+'</option>').join('')}</select></div>
    <div><label for="relationship">نسبت با دانش‌آموز <small>(اختیاری)</small></label><select id="relationship" name="relationship"><option value="">انتخاب نسبت</option>${['مادر','پدر','سرپرست'].map(g=>'<option '+(state.relationship===g?'selected':'')+'>'+g+'</option>').join('')}</select></div>
  </div></form>`;
  $('#full_name').addEventListener('input',e=>{const previous={first_name:state.first_name,last_name:state.last_name};Object.assign(state,respondentNameParts(e.target.value,previous),{full_name:e.target.value});e.target.setCustomValidity('');save();});
  for(const k of ['school','grade','relationship'])$('#'+k).addEventListener('input',e=>{state[k]=e.target.value;save();});
  const hasAnswers=Object.keys(state.answers).length>0,closed=settings?.is_open===false;
  actions.classList.add('intro-actions');
  actions.innerHTML='<button type="submit" form="identityForm" class="button primary" id="start" '+(!settings||closed?'disabled':'')+'>'+(closed?'پاسخ‌گویی بسته است':!settings?'<span class="loading-dot"></span> در حال اتصال…':hasAnswers?'ادامهٔ پاسخ‌گویی':'شروع نظرسنجی')+icons.arrow+'</button>';
  $('#identityForm').onsubmit=e=>{
    e.preventDefault();if(!settings?.is_open)return;
    Object.assign(state,respondentNameParts($('#full_name').value,state));
    if(!namesComplete()||state.first_name.length>80||state.last_name.length>80){const message=!namesComplete()?'نام و نام خانوادگی را کامل وارد کنید.':'نام واردشده بیش از حد طولانی است.';$('#full_name').setCustomValidity(message);$('#full_name').reportValidity();return;}
    if(pending){pending={...pending,first_name:state.first_name,last_name:state.last_name};step=15;}
    else{state.started_at=state.started_at||Date.now();step=hasAnswers&&missing()===-1?15:Math.max(0,QUESTIONS.findIndex(q=>!answered(q)));}
    save();render();focusTitle();
  };
  if(closed)error('پاسخ‌گویی به این نظرسنجی در حال حاضر بسته است.');
}
function renderQuestion(){
  const q=QUESTIONS[step],value=state.answers[q.code];
  let options='';
  if(q.kind==='text'){
    options='<label class="sr-only" for="answerText">پاسخ شما</label><textarea id="answerText" maxlength="2000" rows="5" placeholder="نظر شما برای ما ارزشمند است…">'+esc(value||'')+'</textarea><span class="text-counter" id="counter">'+fa((value||'').length)+' / ۲٬۰۰۰ نویسه</span>';
  }else if(q.kind==='scale10'||(['P02','P03','P06','P07','P08'].includes(q.code))){
    options='<div class="number-scale '+(q.options.length===5?'five':'')+'" role="radiogroup" aria-labelledby="questionTitle">'+q.options.map(o=>'<label class="number-option"><input type="radio" name="answer" value="'+esc(o.value)+'" '+(value===o.value?'checked':'')+' aria-label="'+fa(o.value)+(o===q.options[0]||o===q.options.at(-1)?'، '+esc(o.label):'')+'"><span>'+fa(o.value)+'</span></label>').join('')+'</div><div class="scale-labels"><span>'+esc(q.options[0].label)+'</span><span>'+esc(q.options.at(-1).label)+'</span></div>';
  }else{
    options='<div class="choice-list" role="radiogroup" aria-labelledby="questionTitle">'+q.options.map(o=>'<label class="choice"><input type="radio" name="answer" value="'+esc(o.value)+'" '+(value===o.value?'checked':'')+'><span class="choice-radio" aria-hidden="true"></span><span>'+esc(o.label)+'</span>'+(typeof o.value==='number'?'<span class="choice-number">'+fa(o.value)+'</span>':'')+'</label>').join('')+'</div>';
  }
  view.innerHTML='<div class="question-kicker" data-question-code="'+q.code+'"><span>'+esc(q.axis)+'</span><span class="optional">'+(q.required?'پاسخ الزامی':'اختیاری')+'</span></div><h2 id="questionTitle" class="question-title">'+esc(q.text)+'</h2><p class="question-help" id="questionHelp">'+(q.kind==='text'?'می‌توانید کوتاه بنویسید یا از این سؤال بگذرید.':(q.code==='P14'?'انتخاب شما دربارهٔ استفاده از نقل‌قول‌ها رعایت می‌شود. ':'')+'با انتخاب گزینه، سؤال بعدی نمایش داده می‌شود.')+'</p>'+options+(!q.required&&q.kind!=='text'?'<button type="button" class="clear-answer" id="clearAnswer">پاک کردن پاسخ این سؤال</button>':'');
  const selectedValue=input=>q.code==='P14'?input.value:Number(input.value);
  function advanceAfterSelection(input){
    clearTimeout(autoAdvanceTimer);
    const version=sceneVersion,questionStep=step;
    autoAdvanceTimer=setTimeout(()=>{
      autoAdvanceTimer=0;
      if(version!==sceneVersion||step!==questionStep||!input.isConnected||!input.checked||sending||receipt||pending)return;
      $('#next')?.click();
    },matchMedia('(prefers-reduced-motion:reduce)').matches?180:320);
  }
  view.querySelector('[role="radiogroup"]')?.setAttribute('aria-describedby','questionHelp');
  view.querySelectorAll('input[name="answer"]').forEach(input=>{
    input.onchange=()=>{state.answers[q.code]=selectedValue(input);save();error('');updateMap();advanceAfterSelection(input);};
    // A tap on an already selected answer also continues after revisiting a question.
    input.onclick=()=>{if(input.checked&&state.answers[q.code]===selectedValue(input))advanceAfterSelection(input);};
  });
  if(q.kind==='text')$('#answerText').oninput=e=>{state.answers[q.code]=e.target.value;$('#counter').textContent=fa(e.target.value.length)+' / ۲٬۰۰۰ نویسه';save();updateMap();};
  if($('#clearAnswer'))$('#clearAnswer').onclick=()=>{delete state.answers[q.code];save();render();};
  actions.innerHTML='<button type="button" class="button text" id="back">بازگشت</button>'+(!q.required?'<button type="button" class="button text" id="skip">رد کردن</button>':'')+'<button type="button" class="button primary" id="next">'+(returnToReview?'بازگشت به بازبینی':step===14?'بازبینی پاسخ‌ها':'سؤال بعدی')+icons.arrow+'</button>';
  $('#back').onclick=()=>{step--;returnToReview=false;save();render();focusTitle();};
  if($('#skip'))$('#skip').onclick=()=>{step=returnToReview?15:step+1;returnToReview=false;save();render();focusTitle();};
  $('#next').onclick=()=>{if(q.required&&!answered(q)){error('لطفاً یک گزینه برای این سؤال انتخاب کنید.');return;}step=returnToReview?15:step+1;returnToReview=false;save();render();focusTitle();};
  cleanupQuestionEffects=mountQuestionEffects($('#survey'),view);
}
function updateMap(){document.querySelector('[data-jump="'+step+'"]').classList.toggle('answered',answered(QUESTIONS[step]));}
function renderReview(){
  view.innerHTML='<span class="intro-kicker">یک قدم تا پایان</span><h2>پاسخ‌ها را مرور کنید.</h2><p class="intro-description">'+(pending?'پاسخ‌ها آمادهٔ ارسال‌اند. برای تأیید ثبت، دوباره تلاش کنید.':'می‌توانید قبل از ثبت نهایی، هر پاسخ را ویرایش کنید.')+'</p><div class="review-list">'+QUESTIONS.map((q,i)=>'<div class="review-row"><div><b>'+fa(i+1)+'. '+esc(q.axis)+'</b><p>'+esc(choiceText(q,state.answers[q.code]))+'</p></div><button type="button" data-edit="'+i+'" '+(pending?'disabled':'')+' aria-label="ویرایش '+esc(q.axis)+'">ویرایش</button></div>').join('')+'</div><div class="privacy-note">'+(state.answers.P14==='بله'?'اجازهٔ استفادهٔ بدون نام از نظر خود را داده‌اید.':'اجازهٔ انتشار بیرونی نظر خود را نداده‌اید؛ این انتخاب رعایت می‌شود.')+'</div>';
  const person=document.createElement('div');person.className='respondent-review';person.innerHTML='<span>پاسخ‌دهنده: <b>'+esc(state.first_name+' '+state.last_name)+'</b></span>'+(!pending?'<button type="button" id="editIdentity" class="button text">ویرایش مشخصات</button>':'');view.prepend(person);if($('#editIdentity'))$('#editIdentity').onclick=()=>{step=-1;save();render();focusTitle();};
  view.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>{step=+b.dataset.edit;returnToReview=true;save();render();focusTitle();});
  actions.innerHTML='<button type="button" id="back" class="button text" '+(pending?'disabled':'')+'>بازگشت</button><button type="button" class="button primary" id="submit">'+(preview?'پایان پیش‌نمایش':pending?'تلاش مجدد برای ثبت':'ثبت نهایی پاسخ‌ها')+icons.check+'</button>';
  $('#back').onclick=()=>{step=14;save();render();focusTitle();};
  $('#submit').onclick=submit;
}
async function submit(){
  if(sending)return;if(!namesComplete()){step=-1;render();error('نام و نام خانوادگی پاسخ‌دهنده را کامل وارد کنید.');return;}const m=missing();if(m>=0){step=m;render();error('این سؤال الزامی است؛ لطفاً پاسخ آن را انتخاب کنید.');return;}
  sending=true;error('');const b=$('#submit');b.disabled=true;b.innerHTML='<span class="loading-dot"></span> در حال ثبت…';
  try{
    if(preview){receipt={id:state.id,created_at:new Date().toISOString(),preview:true};save();render();focusTitle();return;}
    pending=pending||{...Object.fromEntries(['id','first_name','last_name','school','grade','cohort','relationship'].map(k=>[k,state[k]])),survey_id:SURVEY_ID,answers:{...state.answers},duration_seconds:Math.min(86400,Math.max(0,Math.round((Date.now()-state.started_at)/1000)))};
    save();renderReview();$('#submit').disabled=true;$('#submit').innerHTML='<span class="loading-dot"></span> در حال ثبت…';
    const ack=await api('submit',{data:pending});
    if(ack.stored!==true||ack.id!==pending.id)throw Error('ثبت پاسخ تأیید نشد. دوباره تلاش کنید.');
    receipt={id:ack.id,created_at:ack.created_at};pending=null;state.answers={};save();render();focusTitle();
  }catch(e){renderReview();error(e.message+' پاسخ‌ها حفظ شده‌اند.');}finally{sending=false;}
}
function renderSuccess(){
  view.innerHTML='<div class="success-icon">'+icons.check+'</div><span class="intro-kicker">'+(receipt.preview?'پیش‌نمایش به پایان رسید':'پاسخ شما با موفقیت ذخیره شد')+'</span><h2>از همراهی شما<br>سپاسگزاریم.</h2><p class="intro-description">'+(receipt.preview?'در حالت پیش‌نمایش هیچ پاسخی به پایگاه داده ارسال نشده است.':'نظر شما به ما کمک می‌کند تجربهٔ یادگیری بهتری برای دانش‌آموزان بسازیم. پاسخ‌تان در سامانه ثبت شد و نیازی به ارسال دوباره نیست.')+'</p><label style="font-size:11px;color:var(--muted)">شناسهٔ '+(receipt.preview?'آزمایشی':'پیگیری پاسخ')+'</label><div class="receipt">'+esc(receipt.id)+'</div><p class="action-hint">'+dateFa(receipt.created_at)+'، به وقت تهران</p>';
  actions.innerHTML='<button type="button" class="button subtle" id="copyReceipt">'+icons.copy+' کپی شناسه</button><button type="button" class="button text" id="another">پاسخ برای فرزند دیگر</button>';
  $('#copyReceipt').onclick=async()=>{try{await navigator.clipboard.writeText(receipt.id);$('#copyReceipt').textContent='شناسه کپی شد';}catch{error('برای کپی، شناسهٔ بالا را انتخاب کنید.');}};
  $('#another').onclick=()=>{state={...state,id:crypto.randomUUID(),answers:{},first_name:'',last_name:'',full_name:'',started_at:0};receipt=null;pending=null;step=-1;save();render();focusTitle();};
}
function network(){const n=$('#offlineNotice');n.hidden=navigator.onLine;}
window.addEventListener('offline',network);window.addEventListener('online',network);network();
window.addEventListener('beforeunload',save);
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.isComposing&&step>=0&&step<15&&!['TEXTAREA','BUTTON'].includes(document.activeElement.tagName)){e.preventDefault();$('#next')?.click();}});
render();
async function loadConfig(){
  if(loading)return;loading=true;
  try{settings=preview?{is_open:true,schools:[],cohorts:[]}:(await api('config')).settings;if(step<0&&!receipt)render();}
  catch(e){if(step<0&&!receipt){render();error(e.message);actions.innerHTML='<button type="button" id="retryConfig" class="button primary">تلاش دوباره برای اتصال</button>';$('#retryConfig').onclick=loadConfig;}}
  finally{loading=false;}
}
loadConfig();
