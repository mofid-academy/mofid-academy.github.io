import {questionArtwork,questionArtMarkup} from './question-art.mjs?v=12';
import {API_URL,PROJECT_URL,PUBLIC_KEY} from './config.mjs';
import {CreditsRoll} from './credits.mjs?v=3';
import {AdminPanel} from './admin.mjs?v=7';
import {ClassesPanel} from './classes.mjs?v=9';
import {roomFromUrl,roomStorageKey,classUrl} from './class-context.mjs?v=7';
const $=s=>document.querySelector(s),all=s=>document.querySelectorAll(s),view=document.body.dataset.view;
const fa=n=>Number(n||0).toLocaleString('fa-IR');
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const read=(key,session=false)=>{try{return (session?sessionStorage:localStorage).getItem(key)||''}catch{return ''}};
const save=(key,value,session=false)=>{try{const s=session?sessionStorage:localStorage;value?s.setItem(key,value):s.removeItem(key)}catch{}};
let classId=roomFromUrl(location.href);
if(view==='host'&&!new URL(location.href).searchParams.has('class'))classId=read('expo1405-selected-class',true)||classId;
const participantKey=roomStorageKey('expo1405-participant',classId),displayStorageKey=()=>roomStorageKey('expo1405-display',classId);
let classAbort=new AbortController(),classesPanel=null,displayWindow=null;
let state=null,revision=0,lastSuccess=0,realtime=false,hostData=null,hostKey=read('expo1405-host',true),token=read(participantKey),joined=false,myRound=0,myVotes={},voteBusy=false,joinBusy=false,hostBusy=false,toastTimer,hostLoading=false,lastMeKey='',refreshBusy=false;
let meInfo={name:null,shareOnScreen:false},profileDirty=false,creditsRoll=null,screenMode=read('expo1405-screen-mode')==='chart'?'chart':'credits';
let adminKey='',adminPanel=null,panelTab=['admin','classes'].includes(new URL(location.href).searchParams.get('tab'))?new URL(location.href).searchParams.get('tab'):'execution';
let displayKey=read(displayStorageKey(),true);
let panelEpoch=0,hostLoadPromise=null,classUnavailable=0;
const demoMode=view==='screen'&&new URL(location.href).searchParams.get('demo')==='credits';
if(demoMode)screenMode='credits';
let joinUrl=classUrl('./',classId,location.href).href;
all('.brand').forEach(a=>a.href=joinUrl);
if(view==='host'){const url=new URL(location.href);url.searchParams.set('class',classId);history.replaceState(null,'',url);}
function notify(message,error=false){const t=$('#toast');t.textContent=message;t.classList.toggle('error',error);t.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.hidden=true,6500)}
async function api(path,{method='GET',body,exportFile=false}={}) {
  const headers={};if(body!==undefined)headers['Content-Type']='application/json';
  if(path.startsWith('/host')){if(adminKey)headers['X-Admin-Key']=adminKey;else headers['X-Host-Key']=hostKey;}
  if(path.startsWith('/admin'))headers['X-Admin-Key']=adminKey;
  if(path.startsWith('/display'))headers['X-Display-Key']=displayKey;
  if(token&&(path==='/me'||path==='/vote'||path==='/profile'))headers['X-Participant-Token']=token;
  const url=new URL(API_URL+path);url.searchParams.set('class',classId);
  const r=await fetch(url,{method,headers,body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.any([AbortSignal.timeout(20000),classAbort.signal]),cache:'no-store'});
  if(exportFile&&r.ok)return r.blob();
  let b;try{b=await r.json()}catch{b={};}
  if(!r.ok){const e=new Error(b.error||'ارتباط برقرار نشد؛ دوباره تلاش کنید.');e.status=r.status;throw e;}
  lastSuccess=Date.now();return b;
}
function isOpen(){return !!state&&state.phase==='open'&&(!state.deadline||Date.parse(state.deadline)>Date.now())}
function phaseLabel(){if(!state)return 'در حال اتصال';return state.phase==='open'?(isOpen()?'رأی‌گیری باز است':'زمان پاسخ تمام شد'):({waiting:'در انتظار شروع مجری',closed:'رأی‌گیری بسته است',finished:'پایان گفت‌وگو'}[state.phase]||'انتظار')}
function updateConnection(){const fresh=Date.now()-lastSuccess<20000;all('[data-connection]').forEach(e=>{e.classList.toggle('online',fresh);e.classList.toggle('offline',!!lastSuccess&&!fresh);e.textContent=demoMode?'پیش‌نمایش نمایشی':fresh?(realtime?'متصل · زنده':'متصل · همگام‌سازی خودکار'):(lastSuccess?'ارتباط قطع است · تلاش دوباره':'در حال اتصال…')})}
function snapshot(row){if(!row?.payload||(!demoMode&&row.payload.room!==classId)||Number(row.revision||0)<revision)return;revision=Number(row.revision||revision);state=row.payload;lastSuccess=Date.now();render();const k=state.round+':'+(state.question?.id||'waiting');if(view==='participant'&&joined&&k!==lastMeKey){lastMeKey=k;refreshMe().catch(e=>notify(e.message,true))}}
function showDisplayLogin(){if(view!=='screen')return;$('#unavailableNotice').hidden=true;$('#displayLogin').hidden=false;$('#screenContainer').hidden=true;state=null;revision=0;creditsRoll?.sync([],'locked');}
function showUnavailable(status){
 classUnavailable=status;state=null;revision=0;creditsRoll?.sync([],'unavailable');
 const title=status===410?'این پنل حذف شده است':'این پنل پیدا نشد';
 if(view==='participant'){$('#entryCard').hidden=true;$('#questionCard').hidden=false;$('#questionBody').innerHTML='<div class="waiting-state"><h2>'+title+'</h2><p>لینک یا QR پنل را از برگزارکننده دریافت کنید.</p></div>';$('#participantNote').hidden=true;$('#screenIdentity').hidden=true;}
 if(view==='screen'){$('#displayLogin').hidden=true;$('#screenContainer').hidden=true;$('#unavailableNotice').hidden=false;$('#unavailableTitle').textContent=title;$('#screenQuestion').replaceChildren();$('#resultsBody').replaceChildren();}
}
async function refreshState(){if(view==='host')return loadHost();if(refreshBusy)return;if(view==='screen'&&!displayKey&&!demoMode){showDisplayLogin();return;}refreshBusy=true;try{const row=await api(view==='screen'?'/display/state':'/state'),wasUnavailable=classUnavailable;classUnavailable=0;snapshot(row);if(wasUnavailable&&view==='participant'&&token)await refreshMe();if(view==='screen'){$('#unavailableNotice').hidden=true;$('#displayLogin').hidden=true;$('#screenContainer').hidden=false;}}catch(e){if(e.status===404||e.status===410){showUnavailable(e.status);}else if(view==='screen'&&e.status===401){displayKey='';save(displayStorageKey(),'',true);showDisplayLogin();}}finally{refreshBusy=false;updateConnection()}}
function emptyChart(){return '<div class="empty-chart"><span class="chart-lines"><i></i><i></i><i></i><i></i></span><h3>هر رأی، یک تغییر</h3><p>با شروع سؤال، نتیجه‌ها اینجا شکل می‌گیرند.</p></div>'}
function renderResults(){const node=$('#resultsBody');if(!node)return;if(!state?.question){node.innerHTML=emptyChart();return;}
  node.innerHTML='<p class="result-question">'+esc(state.question.text)+'</p><div class="results-summary"><strong>'+fa(state.total)+'</strong><span>پاسخ ثبت‌شده</span></div><div class="bars">'+state.question.options.map(o=>{const pct=state.total?Math.round(o.count*100/state.total):0;return '<div class="bar-row"><div class="bar-label"><span>'+esc(o.label)+'</span><span class="bar-numbers"><strong>'+fa(pct)+'٪</strong><span>'+fa(o.count)+' رأی</span></span></div><div class="bar-track" role="meter" aria-label="'+esc(o.label)+'" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+pct+'"><div class="bar-fill" style="width:'+pct+'%"></div></div></div>'}).join('')+'</div>';
}
function renderParticipant(){
  if(classUnavailable){showUnavailable(classUnavailable);return;}
  if(!$('#entryCard'))return;$('#entryCard').hidden=joined;$('#questionCard').hidden=!joined;$('#participantNote').hidden=!joined;$('#joinButton').disabled=!state||joinBusy;
  if($('#screenIdentity')){$('#screenIdentity').hidden=!joined||state?.namePolicy==='anonymous';$('#identitySummary').textContent=meInfo.shareOnScreen?'نام من در تیتراژ: '+meInfo.name:'تنظیم نام من در تیتراژ';}
  if(state){const policy=state.namePolicy;$('#anonymousWrap').hidden=policy!=='optional';if(policy==='anonymous')$('#anonymous').checked=true;if(policy==='named')$('#anonymous').checked=false;$('#nameWrap').hidden=$('#anonymous').checked;$('#displayName').required=!$('#anonymous').checked;}
  if(!joined&&state?.phase==='finished'){$('#entryCard').hidden=true;$('#questionCard').hidden=false;$('#questionBody').innerHTML='<div class="waiting-state"><span class="waiting-icon">✓</span><h2>این پنل پایان یافت</h2><p>برای پنل بعد، لینک یا QR تازه از برگزارکننده دریافت کنید.</p></div>';return;}
  if(!joined)return;const body=$('#questionBody');
  if(!state?.question){const done=state?.phase==='finished';body.innerHTML='<div class="waiting-state"><span class="waiting-icon" aria-hidden="true">'+(done?'✓':'◌')+'</span><h2>'+(done?'ممنون که هم‌صدا شدید.':'منتظر شروع مجری هستیم')+'</h2><p>'+(done?'گفت‌وگوی این نوبت به پایان رسید.':'صفحه را باز نگه دارید؛ سؤال همین‌جا ظاهر می‌شود.')+'</p></div>';return;}
  const q=state.question,voted=myRound===state.round&&Object.hasOwn(myVotes,q.id),choice=myVotes[q.id];
  body.innerHTML='<div class="question-heading"><div class="question-heading-copy"><div class="question-kicker"><span>پرسش '+fa(q.position)+' از '+fa(state.questionCount)+'</span><span>'+esc(phaseLabel())+'</span></div><h2 id="questionTitle">'+esc(q.text)+'</h2></div>'+questionArtMarkup(q)+'</div><div class="options">'+q.options.map((o,i)=>'<button class="option-button '+(voted&&choice===i?'selected':'')+'" data-choice="'+i+'" '+(!isOpen()||voted||voteBusy?'disabled':'')+'><span class="option-letter">'+(voted&&choice===i?'✓':['الف','ب','ج','د','هـ','و','ز','ح'][i])+'</span><span>'+esc(o.label)+'</span></button>').join('')+'</div>'+(voted?'<div class="success-note" role="status">✓ پاسخ شما ثبت شد. برای سؤال بعدی منتظر مجری بمانید.</div>':'<p class="tiny">'+(voteBusy?'در حال ثبت پاسخ…':isOpen()?'با انتخاب گزینه، پاسخ شما ثبت می‌شود.':'ثبت پاسخ برای این سؤال بسته است.')+'</p>');
  all('[data-choice]').forEach(b=>b.addEventListener('click',()=>castVote(Number(b.dataset.choice))));
}
function renderHost(){if(!hostData||!state)return;$('#voteCount').textContent=fa(state.total);$('#questionCount').textContent=fa(state.questionCount);$('#roundCount').textContent=fa(state.round);$('#phaseLabel').textContent=phaseLabel();
  $('#hostCurrent').innerHTML=state.question?'<div class="question-heading question-heading-host"><div class="question-heading-copy"><span class="eyebrow">روی گوشی مخاطبان · پرسش '+fa(state.question.position)+'</span><h2>'+esc(state.question.text)+'</h2></div>'+questionArtMarkup(state.question)+'</div>':'<div class="waiting-state"><span class="waiting-icon">'+(state.phase==='finished'?'✓':'◌')+'</span><h2>'+(state.phase==='finished'?'گفت‌وگو به پایان رسید':'صفحهٔ انتظار فعال است')+'</h2><p>برای شروع، یکی از سؤال‌های صف را باز کنید.</p></div>';
  const qi=hostData.questions.findIndex(q=>q.id===state.question?.id);const next=hostData.questions[qi+1];
  $('#nextQuestion').textContent=next?(qi<0?'شروع سؤال اول ←':'شروع سؤال بعد ←'):'همهٔ سؤال‌ها نمایش داده شدند';$('#nextQuestion').disabled=!next||hostBusy;$('#closeVoting').disabled=state.phase!=='open'||hostBusy;
  $('#questionList').innerHTML=hostData.questions.length?hostData.questions.map((q,i)=>{const active=state.question?.id===q.id,count=active?state.total:q.votes;return '<article class="question-item '+(active?'active':'')+'"><div class="question-item-top"><span>پرسش '+fa(i+1)+' · '+fa(q.options.length)+' گزینه</span><span class="'+(active?'question-votes':'')+'">'+(active?'روی نمایشگر':hostData.role==='admin'&&count?fa(count)+' پاسخ':q.hasVotes?'پاسخ ثبت شده':'هنوز باز نشده')+'</span></div><div class="question-item-heading"><h3>'+esc(q.text)+'</h3><img class="question-art-thumb" src="'+questionArtwork(q).src+'" alt="" width="48" height="48" loading="lazy" decoding="async"></div><div class="question-item-actions"><button class="button '+(active&&isOpen()?'ghost':'secondary')+' small" data-open="'+q.id+'" '+(hostBusy?'disabled':'')+'>'+(active&&isOpen()?'شروع دوبارهٔ زمان':'بازکردن سؤال')+'</button><button class="button ghost small" data-edit="'+q.id+'" '+(q.hasVotes||count||hostBusy?'disabled':'')+'>ویرایش</button><button class="icon-button" aria-label="انتقال سؤال به بالا" data-move="'+q.id+'" data-direction="up" '+(i===0||state.phase==='open'||hostBusy?'disabled':'')+'>↑</button><button class="icon-button" aria-label="انتقال سؤال به پایین" data-move="'+q.id+'" data-direction="down" '+(i===hostData.questions.length-1||state.phase==='open'||hostBusy?'disabled':'')+'>↓</button><button class="icon-button" aria-label="حذف سؤال" data-delete="'+q.id+'" '+(active||hostBusy?'disabled':'')+'>×</button></div></article>'}).join(''):'<p class="muted">هنوز سؤالی تعریف نشده است.</p>';
  all('[data-open]').forEach(b=>b.addEventListener('click',()=>hostAction({action:'activate',questionId:b.dataset.open,seconds:Number($('#timer').value)})));
  all('[data-edit]').forEach(b=>b.addEventListener('click',()=>openEditor(b.dataset.edit)));
  all('[data-move]').forEach(b=>b.addEventListener('click',()=>hostAction({action:'move',questionId:b.dataset.move,direction:b.dataset.direction})));
  all('[data-delete]').forEach(b=>b.addEventListener('click',async()=>{if(await confirmAction('حذف این سؤال؟','سؤال از صف اجرا کنار می‌رود؛ پاسخ‌های بایگانی‌شده حفظ می‌شوند.'))await hostAction({action:'delete',questionId:b.dataset.delete})}));
}
function renderScreen(){if(!state)return;const done=state.phase==='finished';$('#screenQuestion').innerHTML=state.question?'<div class="question-heading"><div class="question-heading-copy"><span class="eyebrow">'+esc(state.title)+' · پرسش '+fa(state.question.position)+' از '+fa(state.questionCount)+'</span><h1 class="active-title">'+esc(state.question.text)+'</h1></div>'+questionArtMarkup(state.question)+'</div>':'<span class="eyebrow">'+esc(state.title)+'</span><h1>'+(done?'این پنل پایان یافت':'منتظر شروع مجری')+'</h1><p class="muted">'+(done?'برای پنل بعد، لینک و QR تازه از مجری دریافت کنید.':'برای ورود به همین پنل، کد را اسکن کنید.')+'</p>';$('#screenPhase').textContent=phaseLabel();
  document.body.dataset.screenMode=screenMode;$('#creditsStage').hidden=!state.question||screenMode!=='credits';$('#creditsControls').hidden=!state.question||screenMode!=='credits';$('#resultsBody').hidden=!state.question||screenMode!=='chart';$('#creditsTally').textContent=fa(state.total)+' پاسخ';
  $('#modeCredits').setAttribute('aria-pressed',String(screenMode==='credits'));$('#modeChart').setAttribute('aria-pressed',String(screenMode==='chart'));
  creditsRoll?.sync(state.credits||[],classId+':'+state.round+':'+(state.question?.id||'waiting'));
}
function render(){all('[data-class-title]').forEach(e=>e.textContent=state?.title||'پنل');all('[data-participants]').forEach(e=>e.textContent=fa(state?.participants));renderResults();if(view==='participant')renderParticipant();if(view==='host')renderHost();if(view==='screen')renderScreen();updateConnection();tick()}
async function refreshMe(){if(!token)return;try{const me=await api('/me');joined=true;myRound=me.round;myVotes=Object.fromEntries(me.votes.map(v=>[v.question_id,v.choice]));meInfo={name:me.name,shareOnScreen:me.shareOnScreen===true};if($('#identityName')&&!profileDirty){$('#identityName').value=me.name||'';$('#identityShare').checked=meInfo.shareOnScreen;$('#identityName').required=meInfo.shareOnScreen;}renderParticipant()}catch(e){if(e.status===401){token='';joined=false;save(participantKey,'');renderParticipant()}else throw e}}
async function castVote(choice){if(!isOpen()||voteBusy||!joined)return;const q=state.question,round=state.round;voteBusy=true;renderParticipant();try{const r=await api('/vote',{method:'POST',body:{questionId:q.id,round,choice}});if(state.round===round){if(myRound!==round)myVotes={};myRound=round;myVotes[q.id]=r.choice;}notify(r.already?'پاسخ قبلی شما ثبت شده است.':'پاسخ شما ثبت شد.');await refreshState()}catch(e){notify(e.message,true);await refreshState()}finally{voteBusy=false;renderParticipant()}}
function showPanel(tab){if(document.body.classList.contains('class-directory-only')&&tab!=='classes')tab='classes';panelTab=tab;for(const [name,id] of [['execution','Execution'],['classes','Classes'],['admin','Admin']]){$('#'+name+'View').hidden=tab!==name;$('#tab'+id).setAttribute('aria-pressed',String(tab===name));}if(tab==='admin')adminPanel?.show().catch(e=>notify(e.message,true));else adminPanel?.hide();if(tab==='classes')classesPanel?.load().catch(e=>notify(e.message,true));}
async function switchClass(id,force=false){
 if(hostBusy)throw Error('ابتدا منتظر پایان عملیات سؤال بمانید.');if(id===classId&&!force)return;
 panelEpoch++;classAbort.abort();classAbort=new AbortController();hostLoadPromise=null;hostLoading=false;state=null;revision=0;hostData=null;adminPanel?.clear();
 classId=id;joinUrl=classUrl('./',classId,location.href).href;save('expo1405-selected-class',id,true);const url=new URL(location.href);url.searchParams.set('class',id);history.replaceState(null,'',url);all('.brand').forEach(a=>a.href=joinUrl);
 $('#questionList').replaceChildren();$('#hostCurrent').textContent='در حال دریافت پنل…';$('#adminTimestamp').textContent='';$('#adminTotal').textContent='۰';$('#adminPeople').textContent='۰';$('#adminQuestionsCount').textContent='۰';
 await loadHost();classesPanel?.render();
 if(!hostData?.directoryOnly&&displayWindow&&!displayWindow.closed){try{const {token}=await api('/host/display-token',{method:'POST',body:{}});const display=classUrl('./screen.html',classId,location.href);display.hash='display='+token;displayWindow.location.href=display.href;}catch{notify('برای پنل تازه، نمایشگر را دوباره از همین پنل باز کنید.',true);}}
}
function logoutPanel(){panelEpoch++;classAbort.abort();classAbort=new AbortController();adminKey='';hostKey='';hostData=null;state=null;revision=0;save('expo1405-host','',true);adminPanel?.clear();classesPanel?.clear();$('#dashboard').hidden=true;$('#loginCard').hidden=false;$('#logout').hidden=true;$('#hostKey').value='';$('#questionList').replaceChildren();$('#hostCurrent').replaceChildren();$('#resultsBody')?.replaceChildren();}
async function authenticateOwner(code){panelEpoch++;adminKey=code;try{await api('/admin/session');if(hostLoadPromise)await hostLoadPromise.catch(()=>{});await loadHost();}catch(e){adminKey='';throw e;}}
async function loadHost(){
 if(!hostKey&&!adminKey)return;if(hostLoadPromise)return hostLoadPromise;const epoch=panelEpoch;hostLoading=true;
 const promise=(async()=>{const first=!hostData,data=await api('/host');if(epoch!==panelEpoch||(!hostKey&&!adminKey))return;
  if(data.directoryOnly){state=null;revision=0;adminPanel?.clear();$('#questionList').replaceChildren();$('#hostCurrent').replaceChildren();}
  else if(hostData&&hostData.role!==data.role){state=null;revision=0;}
  hostData=data;if(!data.directoryOnly){document.body.classList.remove('class-directory-only');snapshot(data);}
  $('#loginCard').hidden=true;$('#dashboard').hidden=false;$('#logout').hidden=false;save('expo1405-host',hostKey,true);
  if(data.directoryOnly){showPanel('classes');await classesPanel?.load();}
  else{renderHost();if(first){showPanel(panelTab);classesPanel?.load().catch(e=>notify(e.message,true));}}
 })();hostLoadPromise=promise;try{await promise;}finally{if(hostLoadPromise===promise){hostLoading=false;hostLoadPromise=null;}}
}
async function hostAction(body){if(hostBusy||classesPanel?.busy)return;hostBusy=true;renderHost();try{await api('/host/action',{method:'POST',body});await loadHost();classesPanel?.load().catch(()=>{});return true}catch(e){notify(e.message,true);return false}finally{hostBusy=false;renderHost()}}
function confirmAction(title,message,{name='',label='تأیید',danger=false}={}){
 return new Promise(resolve=>{const d=$('#confirmDialog'),yes=$('#confirmYes'),input=$('#confirmName');
  $('#confirmTitle').textContent=title;$('#confirmText').textContent=message;$('#confirmNameWrap').hidden=!name;$('#confirmNameHint').textContent=name;input.value='';
  yes.textContent=label;yes.classList.toggle('danger',danger);yes.classList.toggle('primary',!danger);yes.disabled=!!name;
  input.oninput=()=>yes.disabled=!!name&&input.value.trim()!==name;
  const finish=value=>{d.close();yes.onclick=null;$('#confirmNo').onclick=null;input.oninput=null;input.value='';d.oncancel=null;resolve(value);};
  yes.onclick=()=>{if(!yes.disabled)finish(true);};$('#confirmNo').onclick=()=>finish(false);d.oncancel=e=>{e.preventDefault();finish(false);};d.showModal();
 });
}
function openEditor(id=''){const q=hostData?.questions.find(q=>q.id===id);$('#questionId').value=q?.id||'';$('#questionText').value=q?.text||'';$('#questionOptions').value=q?.options.join('\n')||'';$('#editorTitle').textContent=q?'ویرایش سؤال':'سؤال تازه';$('#editorError').hidden=true;$('#questionDialog').showModal()}
function tick(){updateConnection();const seconds=state?.deadline?Math.max(0,Math.ceil((Date.parse(state.deadline)-Date.now())/1000)):null;all('[data-countdown]').forEach(n=>n.textContent=state?.phase==='open'&&seconds!==null?fa(seconds)+' ثانیه':'');if(state?.phase==='open'&&seconds===0){if(view==='participant'&&isOpen._expired!==state.deadline){isOpen._expired=state.deadline;renderParticipant()}if(view==='host'&&$('#phaseLabel'))$('#phaseLabel').textContent=phaseLabel();if(view==='screen')$('#screenPhase').textContent=phaseLabel()}}
if(view==='participant'){
  $('#joinButton').disabled=true;$('#anonymous').addEventListener('change',()=>{$('#nameWrap').hidden=$('#anonymous').checked;$('#displayName').required=!$('#anonymous').checked});
  $('#joinForm').addEventListener('submit',async e=>{e.preventDefault();if(joinBusy||!state)return;joinBusy=true;$('#joinButton').disabled=true;try{const anonymous=$('#anonymous').checked,name=anonymous?null:$('#displayName').value.trim();const data=await api('/join',{method:'POST',body:{name,shareOnScreen:!anonymous&&$('#joinShare').checked}});token=data.token;save(participantKey,token);await refreshMe();await refreshState()}catch(e){notify(e.message,true)}finally{joinBusy=false;renderParticipant()}});
  $('#identityForm').addEventListener('input',()=>{profileDirty=true;$('#identityName').required=$('#identityShare').checked;});
  $('#identityForm').addEventListener('submit',async e=>{e.preventDefault();const button=$('#saveIdentity');button.disabled=true;try{const data=await api('/profile',{method:'POST',body:{name:$('#identityName').value.trim()||null,shareOnScreen:$('#identityShare').checked}});meInfo={name:data.name,shareOnScreen:data.shareOnScreen};profileDirty=false;$('#screenIdentity').open=false;await refreshState();renderParticipant();notify(data.shareOnScreen?'نام و پاسخ شما در تیتراژ نمایش داده می‌شود.':'نام شما در تیتراژ نمایش داده نمی‌شود.')}catch(e){notify(e.message,true)}finally{button.disabled=false;}});
}
if(view==='host'){
  classesPanel=new ClassesPanel({request:api,current:()=>classId,switchClass,confirm:confirmAction,notify});
  adminPanel=new AdminPanel({request:api,className:()=>state?.title||classId,authenticate:authenticateOwner,isAuthenticated:()=>!!adminKey,onLock:logoutPanel,notify});
  if(panelTab==='admin')$('#loginRole').value='admin';
  const setRoleLabel=()=>{const admin=$('#loginRole').value==='admin';$('#loginKeyLabel').textContent=admin?'کد اختصاصی ادمین':'کد ورود مجری';$('#loginTitle').textContent=admin?'ورود ادمین':'ورود برگزارکننده';};setRoleLabel();$('#loginRole').addEventListener('change',setRoleLabel);
  $('#tabExecution').addEventListener('click',()=>showPanel('execution'));$('#tabClasses').addEventListener('click',()=>showPanel('classes'));$('#tabAdmin').addEventListener('click',()=>showPanel('admin'));$('#openAdminReport').addEventListener('click',()=>showPanel('admin'));
  const fragment=new URLSearchParams(location.hash.slice(1));const invite=fragment.get('key');if(invite){hostKey=invite;history.replaceState(null,'',location.pathname+location.search)}
  $('#loginForm').addEventListener('submit',async e=>{e.preventDefault();const code=$('#hostKey').value.trim();$('#loginButton').disabled=true;$('#loginError').hidden=true;try{if($('#loginRole').value==='admin'){panelTab='admin';await authenticateOwner(code);showPanel('admin');}else{hostKey=code;await loadHost();}$('#hostKey').value=''}catch(e){$('#loginError').textContent=e.message;$('#loginError').hidden=false}finally{$('#loginButton').disabled=false}});
  $('#logout').addEventListener('click',logoutPanel);
  document.querySelectorAll('[data-open-display]').forEach(b=>b.addEventListener('click',async()=>{const win=window.open('about:blank','mofid-expo-display');displayWindow=win;try{const {token}=await api('/host/display-token',{method:'POST',body:{}});const url=classUrl('./screen.html',classId,location.href);url.hash='display='+token;if(win)win.location.href=url.href;else notify('لینک نمایشگر: '+url.href);}catch(e){win?.close();notify(e.message,true);}}));
  $('#copyDisplay').addEventListener('click',async()=>{try{const {token}=await api('/host/display-token',{method:'POST',body:{}}),url=classUrl('./screen.html',classId,location.href);url.hash='display='+token;await navigator.clipboard.writeText(url.href);notify('لینک خصوصی نمایشگر کپی شد.');}catch(e){notify(e.message,true);}});
  $('#copyJoin').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(joinUrl);notify('لینک مخاطب کپی شد.')}catch{notify('لینک مخاطب: '+joinUrl)}});
  $('#nextQuestion').addEventListener('click',()=>{const i=hostData.questions.findIndex(q=>q.id===state.question?.id),next=hostData.questions[i+1];if(next)hostAction({action:'activate',questionId:next.id,seconds:Number($('#timer').value)})});
  $('#closeVoting').addEventListener('click',()=>hostAction({action:'close'}));$('#showWaiting').addEventListener('click',()=>hostAction({action:'waiting'}));$('#finishEvent').addEventListener('click',async()=>{if(await confirmAction('پایان این گفت‌وگو؟','رأی‌گیری بسته می‌شود و پیام پایان روی صفحهٔ مخاطبان می‌آید.'))await hostAction({action:'finish'})});
  $('#newRound').addEventListener('click',async()=>{if(await confirmAction('آغاز اجرای تازه؟','پاسخ‌های قبلی بایگانی می‌شوند. شمارش رأی‌ها برای اجرای تازه از صفر شروع می‌شود و می‌توانید سؤال‌ها را ویرایش کنید.'))await hostAction({action:'new_round'});});
  $('#addQuestion').addEventListener('click',()=>openEditor());$('#closeEditor').addEventListener('click',()=>$('#questionDialog').close());
  $('#questionForm').addEventListener('submit',async e=>{e.preventDefault();const options=$('#questionOptions').value.split('\n').map(s=>s.trim()).filter(Boolean),text=$('#questionText').value.trim();if(options.length<2||options.length>8||options.some(o=>o.length>160)||new Set(options).size!==options.length){$('#editorError').textContent='بین ۲ تا ۸ گزینهٔ متفاوت بنویسید؛ هر گزینه حداکثر ۱۶۰ نویسه.';$('#editorError').hidden=false;return;}$('#saveQuestion').disabled=true;try{const ok=await hostAction({action:'save',questionId:$('#questionId').value||null,text,options});if(ok){$('#questionDialog').close();notify('سؤال ذخیره شد.')}}finally{$('#saveQuestion').disabled=false}});
  if(hostKey)loadHost().catch(e=>{hostKey='';save('expo1405-host','',true);$('#loginError').textContent=e.message;$('#loginError').hidden=false});
  setInterval(()=>{if(hostData&&!document.hidden&&panelTab==='execution'&&!classesPanel?.busy)loadHost().catch(()=>{})},3000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&hostData)loadHost().catch(()=>{})});
}
if(view==='screen'){
  const fragment=new URLSearchParams(location.hash.slice(1));if(fragment.get('display')){displayKey=fragment.get('display');save(displayStorageKey(),displayKey,true);history.replaceState(null,'',location.pathname+location.search);}
  $('#displayLoginForm').addEventListener('submit',async e=>{e.preventDefault();displayKey=$('#displayCode').value.trim();$('#displayError').hidden=true;try{const row=await api('/display/state');save(displayStorageKey(),displayKey,true);snapshot(row);$('#displayCode').value='';$('#displayLogin').hidden=true;$('#screenContainer').hidden=false;}catch(e){displayKey='';$('#displayError').textContent=e.message;$('#displayError').hidden=false;}});
  creditsRoll=new CreditsRoll($('#creditsStage'));
  $('#modeCredits').addEventListener('click',()=>{screenMode='credits';save('expo1405-screen-mode',screenMode);renderScreen()});$('#modeChart').addEventListener('click',()=>{screenMode='chart';save('expo1405-screen-mode',screenMode);renderScreen()});
  $('#creditsSpeed').addEventListener('change',()=>creditsRoll.setSpeed($('#creditsSpeed').value));$('#creditsPause').addEventListener('click',()=>{creditsRoll.setPaused(!creditsRoll.paused);$('#creditsPause').textContent=creditsRoll.paused?'ادامهٔ حرکت ▶':'مکث حرکت Ⅱ';$('#creditsPause').setAttribute('aria-pressed',String(creditsRoll.paused));});
  $('#demoLiveLink').href=classUrl('./screen.html',classId,location.href).href;
  $('#joinLink').textContent=joinUrl.replace('https://','');$('#joinLink').href=joinUrl;
  if(window.qrcode){const qr=window.qrcode(0,'M');qr.addData(joinUrl);qr.make();$('#joinQr').innerHTML=qr.createSvgTag({cellSize:4,margin:0,scalable:true,alt:'ورود به نظرسنجی هم‌صدا'})}
  $('#fullscreen').addEventListener('click',async()=>{try{document.fullscreenElement?await document.exitFullscreen():await document.documentElement.requestFullscreen()}catch{notify('از گزینهٔ تمام‌صفحهٔ مرورگر استفاده کنید.')}});
}
if(view==='participant'&&token)refreshMe().catch(()=>{});
if(demoMode){
  $('#displayLogin').hidden=true;$('#screenContainer').hidden=false;
  $('#demoBanner').hidden=false;$('#demoBanner').textContent='پیش‌نمایش تیتراژ · نام‌ها و پاسخ‌ها فرضی‌اند';$('#demoLiveLink').hidden=false;
  const answers=['یادگیری و تجربهٔ تازه','گفت‌وگو با کارشناسان','شرکت در کارگاه‌های کوتاه','آشنایی با خدمات نوین'];
  const names=['مریم رضایی','علی احمدی','شرکت‌کنندهٔ ناشناس','سارا محمدی','امیر کریمی','نرگس موسوی','شرکت‌کنندهٔ ناشناس','رضا کریمی'];
  const entries=names.map((name,i)=>({id:'demo-credit-'+i,name,answer:answers[i%answers.length]}));let n=3;
  const show=()=>{lastSuccess=Date.now();state={phase:'open',round:0,questionCount:1,participants:Math.max(8,n),total:n,credits:entries.slice(0,n),question:{id:'demo-only',position:1,text:'دوست دارید در نمایشگاه چه تجربه‌ای داشته باشید؟',options:answers.map((label,i)=>({label,index:i,count:entries.slice(0,n).filter((_,j)=>j%4===i).length}))}};render();};show();setInterval(()=>{if(n<entries.length)n++;show()},3000);
}else if(view==='participant'){
 await refreshState();
 let db,channel,lastBroadcast=0,pollCount=0;
 const disconnect=()=>{if(db&&channel){db.removeChannel(channel);channel=null;}realtime=false;};
 const connect=()=>{if(document.hidden||classUnavailable||state?.phase==='finished'||channel||!db)return;channel=db.channel('expo1405-question:'+classId).on('broadcast',{event:'changed'},()=>{if(Date.now()-lastBroadcast<400)return;lastBroadcast=Date.now();refreshState();}).subscribe(status=>{realtime=status==='SUBSCRIBED';updateConnection();if(realtime)refreshState();});};
 try{if(window.supabase){db=window.supabase.createClient(PROJECT_URL,PUBLIC_KEY,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});connect();}}catch{}
 setInterval(()=>{if(document.hidden)return;pollCount++;if(classUnavailable||state?.phase==='finished'){disconnect();if(pollCount%5===0)refreshState();}else{connect();refreshState();}},3000);
 window.addEventListener('pagehide',disconnect);window.addEventListener('pageshow',()=>{connect();refreshState();});window.addEventListener('online',()=>{connect();refreshState();});document.addEventListener('visibilitychange',()=>{if(document.hidden)disconnect();else{connect();refreshState();if(token)refreshMe().catch(()=>{})}});
}else if(view==='screen'){
 await refreshState();setInterval(()=>{if(!document.hidden)refreshState()},1000);window.addEventListener('online',refreshState);
}
setInterval(tick,1000);
