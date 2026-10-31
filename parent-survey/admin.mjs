import {QUESTIONS} from './questions.mjs';
import {api,fa,esc,dateFa,icons,initTheme} from './shared.mjs';
import {buildWorkbook} from './excel-export.mjs?v=20261031.6';
initTheme();
const $=s=>document.querySelector(s),demo=new URL(location.href).searchParams.get('demo')==='1';
const SESSION='mofid-parent-admin-v1',PAGE_SIZE=25;
let session=null,report=null,filters={},page=0,tab='overview',requestId=0,settings=null,baseSnapshot=null,exporting=false;
try{const v=JSON.parse(sessionStorage.getItem(SESSION)||'null');if(v&&Date.parse(v.expires_at)>Date.now())session=v;}catch{}
let toastTimer;
function toast(message){const t=$('#toast');t.textContent=message;t.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.hidden=true,4500);}
function setError(message){$('#reportError').textContent=message;$('#reportError').hidden=!message;}
function logout(){session=null;report=null;settings=null;requestId++;try{sessionStorage.removeItem(SESSION);}catch{}$('#dashboard').hidden=true;$('#loginView').hidden=false;$('#logout').hidden=true;$('#password').value='';for(const id of ['kpis','scoreBars','npsChart','impactMetrics','supportMetrics','distributionBars','responsesBody','responseCards','commentsList','detailContent'])$('#'+id).innerHTML='';$('#detailDialog').close();$('#settingsForm').reset();}
async function call(action,data={}){
  if(!demo&&(!session||Date.parse(session.expires_at)<=Date.now())){logout();throw Error('نشست شما پایان یافته است؛ دوباره وارد شوید.');}
  try{return await api(action,data,session?.token);}catch(e){if(e.status===401)logout();throw e;}
}
async function copy(text){try{await navigator.clipboard.writeText(text);toast('کپی شد.');}catch{toast('مرورگر اجازه کپی نداد؛ متن را انتخاب و کپی کنید.');}}
function surveyURL(){return new URL('./?v=20261031.6',location.href).href;}
$('#logout').onclick=logout;
$('#showPassword').onclick=()=>{const p=$('#password');p.type=p.type==='password'?'text':'password';$('#showPassword').textContent=p.type==='password'?'نمایش':'پنهان';};
$('#loginForm').onsubmit=async e=>{
  e.preventDefault();$('#loginError').hidden=true;const b=$('#loginButton');b.disabled=true;b.textContent='در حال ورود…';
  try{const s=await api('admin_login',{username:$('#username').value.trim(),secret:$('#password').value});session=s;try{sessionStorage.setItem(SESSION,JSON.stringify(s));}catch{}$('#password').value='';await enter();}
  catch(e){$('#loginError').textContent=e.message;$('#loginError').hidden=false;}finally{b.disabled=false;b.textContent='ورود به پنل مدیریت';}
};
async function enter(){
  $('#loginView').hidden=true;$('#dashboard').hidden=false;$('#logout').hidden=demo;
  if(demo){$('#adminNotice').textContent='نمایش آزمایشی پنل؛ همهٔ اعداد و نظرها نمونه‌اند و هیچ تغییری در داده‌های واقعی ایجاد نمی‌شود.';$('#adminNotice').hidden=false;}
  await loadReport();
}
$('#shareLink').innerHTML=icons.copy+' کپی لینک والدین';
$('#exportButton').innerHTML=icons.download+' خروجی اکسل';
$('#shareLink').onclick=()=>copy(surveyURL());
const refresh=document.createElement('button');refresh.className='button subtle';refresh.textContent='تازه‌سازی';refresh.onclick=()=>{page=0;baseSnapshot=null;loadReport();};$('.dashboard-actions').prepend(refresh);
$('#fQuestion').innerHTML='<option value="">همه سؤال‌ها</option>'+QUESTIONS.filter(q=>q.kind!=='text').map(q=>'<option value="'+q.code+'">'+q.code+' — '+esc(q.axis)+'</option>').join('');
$('#fQuestion').onchange=()=>{
  const q=QUESTIONS.find(q=>q.code===$('#fQuestion').value),s=$('#fAnswer');s.disabled=!q;
  s.innerHTML=q?q.options.map(o=>'<option value="'+esc(o.value)+'">'+(typeof o.value==='number'?fa(o.value)+' — ':'')+esc(o.label)+'</option>').join(''):'<option value="">ابتدا سؤال را انتخاب کنید</option>';
};
$('#distributionQuestion').innerHTML=QUESTIONS.filter(q=>q.kind!=='text').map(q=>'<option value="'+q.code+'">'+q.code+' — '+esc(q.axis)+'</option>').join('');
$('#distributionQuestion').onchange=renderDistribution;
$('#filterForm').onsubmit=e=>{e.preventDefault();const f=Object.fromEntries(new FormData(e.target));if(f.from&&f.to&&f.from>f.to){setError('تاریخ پایان باید پس از تاریخ آغاز باشد.');return;}filters=Object.fromEntries(Object.entries(f).filter(([k,v])=>v!==''&&!(k==='qvalue'&&!f.qcode)));page=0;baseSnapshot=null;loadReport();};
$('#resetFilters').onclick=()=>{$('#filterForm').reset();$('#fQuestion').onchange();filters={};page=0;baseSnapshot=null;loadReport();};
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=async()=>{
  tab=b.dataset.tab;document.querySelectorAll('[data-tab]').forEach(n=>n.classList.toggle('active',n===b));
  document.querySelectorAll('.tab-section').forEach(n=>n.hidden=n.id!=='tab-'+tab);
  $('#filterSection').hidden=tab==='settings';
  if(tab==='comments'&&filters.comment!=='yes'){filters.comment='yes';$('#fComment').value='yes';page=0;baseSnapshot=null;await loadReport();}
  if(tab==='settings')await loadSettings();
});
function options(s,values,placeholder){const current=s.value;s.innerHTML='<option value="">'+placeholder+'</option>'+[...new Set(values)].sort((a,b)=>a.localeCompare(b,'fa')).map(v=>'<option value="'+esc(v)+'" '+(current===v?'selected':'')+'>'+esc(v)+'</option>').join('');}
async function loadReport(){
  const id=++requestId;$('#reportLoading').hidden=false;setError('');$('#applyFilters').disabled=true;
  try{
    const result=demo?demoReport(filters,page,PAGE_SIZE):await call('admin_list',{filters:{...filters,...(baseSnapshot?{snapshot:baseSnapshot}:{})},page,limit:PAGE_SIZE});
    if(id!==requestId)return;report=result;baseSnapshot=baseSnapshot||result.snapshot;
    if(page>0&&!report.rows.length&&report.total){page=Math.max(0,Math.ceil(report.total/PAGE_SIZE)-1);return loadReport();}
    options($('#fSchool'),[...(result.options?.schools||[]),...(filters.school?[filters.school]:[])],'همه مدارس');
    options($('#fGrade'),result.options?.grades||[],'همه پایه‌ها');options($('#fCohort'),result.options?.cohorts||[],'همه نوبت‌ها');
    $('#filterCount').textContent=fa(report.total)+' پاسخ'+(Object.keys(filters).length?' مطابق فیلترها':' ثبت‌شده');
    $('#reportTimestamp').textContent=(demo?'دادهٔ نمونه · ':'')+'آخرین دریافت: '+dateFa(result.snapshot)+'، به وقت تهران';
    renderReport();
  }catch(e){if(id===requestId)setError(e.message+(report?' آخرین گزارش دریافت‌شده همچنان نمایش داده می‌شود.':''));}
  finally{if(id===requestId){$('#reportLoading').hidden=true;$('#applyFilters').disabled=false;}}
}
const pct=v=>v===null||v===undefined?'—':fa(v,1)+'٪';
const metric=(label,value,note='')=>'<div class="metric-row"><span>'+label+(note?'<small>'+note+'</small>':'')+'</span><strong>'+value+'</strong></div>';
function renderReport(){
  const s=report.stats,count=Number(s.count),nps=s.nps===null?'—':(Number(s.nps)>0?'+':'')+fa(s.nps,1);
  $('#kpis').innerHTML=[['پاسخ‌های ثبت‌شده',fa(count),'در محدودهٔ فیلترهای فعال',icons.grid],['رضایت کلی',fa(s.satisfaction,2)+'<small>از ۵</small>',pct(s.satisfied)+' رضایت زیاد و بسیار زیاد',icons.chart],['شاخص توصیه والدین',nps,'دامنه شاخص: ۱۰۰− تا ۱۰۰+',icons.chart],['تغییر مشاهده‌شده',pct(s.change),'تا حدی یا به‌وضوح، پرسش P05',icons.check]].map(([l,v,c,i])=>'<div class="kpi"><div class="kpi-label">'+l+i+'</div><div class="kpi-value">'+v+'</div><div class="kpi-caption">'+c+'</div></div>').join('');
  $('#scoreBars').innerHTML=[['رضایت کلی',s.satisfaction],['ضرورت آموزش',s.need],['تناسب سنی',s.age_fit],['گفت‌وگوی خانوادگی',s.family_learning],['تصمیم‌گیری آگاهانه',s.decision],['روش آموزش',s.method]].map(([l,v])=>'<div class="score-row"><span>'+l+'</span><div class="score-track"><span style="width:'+Math.max(0,Math.min(100,Number(v||0)/5*100))+'%"></span></div><strong>'+fa(v,2)+'</strong></div>').join('');
  $('#npsChart').innerHTML='<div class="nps-score"><b>'+nps+'</b><span>شاخص خالص توصیه (NPS)</span></div><div class="nps-stack" role="img" aria-label="مروجان '+fa(s.promoters)+'، منفعلان '+fa(s.passives)+'، منتقدان '+fa(s.detractors)+'">'+[['promoters','#00af9d'],['passives','#e5bf72'],['detractors','#d9847c']].map(([k,c])=>'<span style="width:'+(count?Number(s[k])/count*100:0)+'%;background:'+c+'"></span>').join('')+'</div><div class="nps-legend">'+[['مروج','promoters','#00af9d','۹ و ۱۰'],['منفعل','passives','#e5bf72','۷ و ۸'],['منتقد','detractors','#d9847c','۰ تا ۶']].map(([l,k,c,n])=>'<div><span class="legend-dot" style="background:'+c+'"></span>'+l+'<b>'+fa(s[k])+' <small>نفر</small></b><small>'+n+'</small></div>').join('')+'</div>';
  $('#impactMetrics').innerHTML=metric('گفت‌وگو دربارهٔ کلاس در خانه',pct(s.family_talk),'پاسخ‌های چندبار و مرتب در P04')+metric('تغییر در نگاه فرزند به مسائل مالی',pct(s.change),'پاسخ‌های «تا حدی» و «بله، واضح» در P05')+metric('تغییر به‌وضوح مشاهده شده',pct(s.clear_change),'فقط پاسخ «بله، واضح» در P05');
  $('#supportMetrics').innerHTML=metric('حمایت از تداوم دوره',fa(s.support,2)+' <small>از ۱۰</small>','میانگین پاسخ به P09')+metric('حمایت قوی از ادامهٔ دوره',pct(s.support_high),'نمره‌های ۹ و ۱۰ در P09')+metric('اثر حمایت کارگزاری مفید',fa(s.sponsor,2)+' <small>از ۵</small>',fa(s.sponsor_count)+' پاسخ به سؤال اختیاری P13');
  renderDistribution();renderRows();renderComments();
}
function renderDistribution(){
  if(!report)return;const q=QUESTIONS.find(q=>q.code===$('#distributionQuestion').value),dist=report.distributions?.[q.code]||{},n=Object.values(dist).reduce((a,b)=>a+Number(b),0);
  $('#distributionTitle').textContent=q.text;
  $('#distributionBars').innerHTML=q.options.map(o=>{const c=Number(dist[String(o.value)]||0),p=n?c/n*100:0;return '<div class="distribution-row"><span>'+(q.kind==='scale10'?fa(o.value):esc(o.label))+'</span><div class="score-track"><span style="width:'+p+'%"></span></div><span>'+fa(c)+' نفر · '+(n?pct(p):'—')+'</span></div>';}).join('');
}
const consentBadge=r=>'<span class="consent-badge '+(r.p14?'yes':'')+'">'+(r.p14?'اجازهٔ انتشار':'فقط بررسی داخلی')+'</span>';
const respondentName=r=>[r.first_name,r.last_name].filter(Boolean).join(' ')||'پاسخ قدیمی بدون نام';
const groupNps=n=>n>=9?'مروج':n>=7?'منفعل':'منتقد';
function renderRows(){
  const rows=report.rows,total=report.total;
  $('#responseCount').textContent=fa(total)+' پاسخ';
  $('#responsesBody').innerHTML=rows.length?rows.map(r=>'<tr><td><strong class="respondent-name">'+esc(respondentName(r))+'</strong><span class="response-id">'+esc(r.id.slice(0,8))+'</span><small>'+dateFa(r.created_at)+'</small></td><td>'+esc(r.school||'نامشخص')+'<small>'+esc(r.grade||'بدون پایه')+'</small></td><td>'+esc(r.cohort||'—')+'</td><td><span class="score-badge">'+fa(r.p01)+' / ۵</span></td><td>'+fa(r.p10)+' <small>'+groupNps(r.p10)+'</small></td><td>'+consentBadge(r)+'</td><td><button class="detail-button" data-detail="'+esc(r.id)+'">مشاهده</button></td></tr>').join(''):'<tr><td colspan="7">'+empty()+'</td></tr>';
  $('#responseCards').innerHTML=rows.length?rows.map(r=>'<article class="response-mobile"><header><strong>'+esc(respondentName(r))+'</strong><span class="response-id">'+esc(r.id.slice(0,8))+'</span></header><p>'+esc(r.school||'مدرسه نامشخص')+' · '+dateFa(r.created_at)+' · '+esc(r.grade||'بدون پایه')+' · '+esc(r.cohort||'بدون نوبت')+'</p><footer><span class="score-badge">رضایت '+fa(r.p01)+' از ۵</span>'+consentBadge(r)+'<button class="detail-button" data-detail="'+esc(r.id)+'">جزئیات</button></footer></article>').join(''):empty();
  document.querySelectorAll('[data-detail]').forEach(b=>b.onclick=()=>showDetail(rows.find(r=>r.id===b.dataset.detail)));
  for(const p of ['','#comment']){const prev=$(p?'#commentPrev':'#prevPage'),next=$(p?'#commentNext':'#nextPage'),info=$(p?'#commentPageInfo':'#pageInfo');prev.disabled=page===0;next.disabled=(page+1)*PAGE_SIZE>=total;info.textContent=total?'صفحه '+fa(page+1)+' از '+fa(Math.ceil(total/PAGE_SIZE)):'بدون پاسخ';prev.onclick=()=>{page--;loadReport();};next.onclick=()=>{page++;loadReport();};}
}
function empty(){return '<div class="empty-state"><strong>هنوز پاسخی برای نمایش نیست.</strong>پس از ثبت نظر والدین، گزارش‌ها در این بخش نمایش داده می‌شوند.</div>';}
function renderComments(){
  const rows=report.rows.filter(r=>r.p11||r.p12||r.p15);
  $('#commentsList').innerHTML=rows.length?rows.map(r=>'<article class="comment-card"><header><div><strong>'+esc(respondentName(r))+'</strong><small>'+esc(r.school||'مدرسه نامشخص')+' · '+esc(r.grade||'پایه نامشخص')+' · '+dateFa(r.created_at)+'</small></div>'+consentBadge(r)+'</header>'+[['ارزش اصلی دوره',r.p11],['پیشنهاد بهبود',r.p12],['معرفی دوره',r.p15]].filter(([,t])=>t).map(([l,t])=>'<h3>'+l+'</h3><p>'+esc(t)+'</p>').join('')+'<footer><span class="response-id">'+esc(r.id.slice(0,8))+'</span>'+(r.p14?'<button class="button subtle" data-copy-comment="'+esc(r.id)+'">کپی متن بدون مشخصات</button>':'<span>اجازهٔ استفادهٔ بیرونی داده نشده است.</span>')+'</footer></article>').join(''):empty();
  document.querySelectorAll('[data-copy-comment]').forEach(b=>b.onclick=()=>{const r=rows.find(r=>r.id===b.dataset.copyComment);if(r?.p14)copy([r.p11,r.p12,r.p15].filter(Boolean).join('\n\n'));});
}
$('#consentedOnly').onclick=()=>{filters={...filters,consent:'true',comment:'yes'};$('#fConsent').value='true';$('#fComment').value='yes';page=0;baseSnapshot=null;loadReport();};
function showDetail(r){
  $('#detailContent').innerHTML='<div class="detail-metadata"><strong>'+esc(respondentName(r))+'</strong><span>'+esc(r.school||'مدرسه نامشخص')+'</span><span>'+esc(r.grade)+'</span><span>'+esc(r.cohort)+'</span><span>'+dateFa(r.created_at)+'</span>'+consentBadge(r)+'</div><div class="receipt">'+esc(r.id)+'</div>'+QUESTIONS.map(q=>{const v=q.code==='P14'?(r.p14?'بله':'خیر'):r[q.code.toLowerCase()];const o=q.options.find(o=>o.value===v);return '<div class="detail-question"><h3>'+q.code+' — '+esc(q.text)+'</h3><p>'+esc(v===null||v===undefined||v===''?'بدون پاسخ (اختیاری)':q.kind==='text'?v:q.kind==='scale10'?fa(v)+' از ۱۰':(typeof v==='number'?fa(v)+' — ':'')+(o?.label||v))+'</p></div>';}).join('');
  $('#detailDialog').showModal();
}
$('#closeDetail').onclick=()=>$('#detailDialog').close();
$('#detailDialog').addEventListener('click',e=>{if(e.target===$('#detailDialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
async function loadSettings(){
  try{settings=demo?{is_open:true,schools:['مدرسه نمونه الف','مدرسه نمونه ب'],cohorts:['پاییز ۱۴۰۵']}:(await call('admin_settings')).settings;$('#surveyOpen').checked=settings.is_open;$('#schoolList').value=settings.schools.join('\n');$('#cohortList').value=settings.cohorts.join('\n');}catch(e){setError(e.message);}
}
$('#settingsForm').onsubmit=async e=>{
  e.preventDefault();if(demo){toast('تنظیمات در نسخهٔ آزمایشی ذخیره نمی‌شوند.');return;}
  const b=$('#saveSettings');b.disabled=true;$('#settingsMessage').textContent='در حال ذخیره…';
  try{const s={is_open:$('#surveyOpen').checked,schools:$('#schoolList').value.split('\n'),cohorts:$('#cohortList').value.split('\n')};settings=(await call('admin_settings_save',{settings:s})).settings;$('#settingsMessage').textContent='تنظیمات ذخیره شد.';}catch(e){$('#settingsMessage').textContent=e.message;}finally{b.disabled=false;}
};
$('#generateLink').onclick=()=>{const u=new URL(surveyURL());if($('#linkSchool').value.trim())u.searchParams.set('school',$('#linkSchool').value.trim());if($('#linkCohort').value.trim())u.searchParams.set('cohort',$('#linkCohort').value.trim());$('#generatedLink').value=u.href;copy(u.href);};
$('#exportButton').onclick=async()=>{
  if(exporting||!report)return;if(demo){toast('خروجی اکسل پس از ورود به پنل واقعی در دسترس است.');return;}exporting=true;const b=$('#exportButton');b.disabled=true;setError('');
  try{
    const all=[],snapshot=baseSnapshot||report.snapshot;let p=0,total=report.total;
    do{b.textContent='دریافت پاسخ‌ها: '+fa(all.length)+' / '+fa(total);const r=demo?demoReport(filters,p,1000):await call('admin_list',{filters:{...filters,snapshot},page:p,limit:1000});total=r.total;all.push(...r.rows);if(!r.rows.length&&all.length<total)throw Error('دریافت همهٔ پاسخ‌ها کامل نشد. دوباره خروجی بگیرید.');p++;}while(all.length<total);
    b.textContent='در حال آماده‌سازی اکسل…';const response=await call('admin_template');const templateBytes=Uint8Array.from(atob(response.template),c=>c.charCodeAt(0));const bytes=await buildWorkbook(all,{filters,exportedAt:new Date().toISOString(),demo,templateBytes});
    const url=URL.createObjectURL(new Blob([bytes],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));const a=document.createElement('a');a.href=url;a.download='Mofid-Parent-Survey'+(demo?'-DEMO':'')+'-'+new Date().toISOString().slice(0,10)+'.xlsx';a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);toast('خروجی اکسل شامل '+fa(all.length)+' پاسخ آماده شد.');
  }catch(e){setError(e.message);}finally{exporting=false;b.disabled=false;b.innerHTML=icons.download+' خروجی اکسل';}
};
// Explicitly selected, isolated sample mode for training and interface review.
const sampleRows=Array.from({length:36},(_,i)=>{
 const r={first_name:'نام نمونه '+(i+1),last_name:'آزمایشی',id:'00000000-0000-4000-8000-'+String(i+1).padStart(12,'0'),created_at:new Date(Date.UTC(2026,9,31-i%7,7+i%9,12)).toISOString(),school:i%2?'مدرسه نمونه الف':'مدرسه نمونه ب',grade:['پنجم','ششم','هفتم'][i%3],cohort:'پاییز ۱۴۰۵',relationship:i%3?'مادر':'پدر',duration_seconds:160+i,p01:3+i%3,p02:4+i%2,p03:3+i%3,p04:1+i%4,p05:1+i%3,p06:2+i%4,p07:3+i%3,p08:3+i%3,p09:6+i%5,p10:[10,9,8,10,7,6,9,8,5][i%9],p11:i%3===0?'پاسخ نمونه: فرزندم دربارهٔ پس‌انداز بیشتر صحبت می‌کند.':'',p12:i%5===0?'پاسخ نمونه: تمرین‌های بیشتری برای خانه در نظر بگیرید.':'',p13:i%4===0?null:3+i%3,p14:i%4!==0,p15:i%7===0?'پاسخ نمونه: فرصتی برای فکر کردن به انتخاب‌های مالی در زندگی روزمره.':'',is_test:false};return r;
});
export function demoReport(f={},p=0,limit=25){
 const rows=sampleRows.filter(r=>(!f.school||r.school===f.school)&&(!f.grade||r.grade===f.grade)&&(!f.cohort||r.cohort===f.cohort)&&(!f.relationship||r.relationship===f.relationship)&&(!f.consent||r.p14===(f.consent==='true'))&&(!f.nps||(r.p10>=9?'promoter':r.p10>=7?'passive':'detractor')===f.nps)&&(!f.comment||r.p11||r.p12||r.p15)&&(!f.search||JSON.stringify(r).toLowerCase().includes(f.search.toLowerCase()))&&(!f.qcode||String(f.qcode==='P14'?(r.p14?'بله':'خیر'):r[f.qcode.toLowerCase()])===f.qvalue)&&(!f.from||r.created_at>=f.from+'T00:00:00+03:30')&&(!f.to||new Date(r.created_at)<new Date(new Date(f.to+'T00:00:00+03:30').getTime()+86400000)));
 const n=rows.length,mean=k=>n?rows.filter(r=>r[k]!==null).reduce((s,r)=>s+r[k],0)/rows.filter(r=>r[k]!==null).length:null,count=fn=>rows.filter(fn).length,percent=fn=>n?100*count(fn)/n:null;
 const stats={count:n,satisfaction:mean('p01'),satisfied:percent(r=>r.p01>=4),need:mean('p02'),age_fit:mean('p03'),family_learning:mean('p06'),decision:mean('p07'),method:mean('p08'),family_talk:percent(r=>r.p04>=3),change:percent(r=>r.p05>=2),clear_change:percent(r=>r.p05===3),support:mean('p09'),support_high:percent(r=>r.p09>=9),promoters:count(r=>r.p10>=9),passives:count(r=>r.p10>=7&&r.p10<=8),detractors:count(r=>r.p10<=6),nps:n?100*(count(r=>r.p10>=9)-count(r=>r.p10<=6))/n:null,sponsor:rows.some(r=>r.p13!==null)?mean('p13'):null,sponsor_count:count(r=>r.p13!==null),consent_count:count(r=>r.p14),comments:count(r=>r.p11||r.p12||r.p15)};
 const distributions={};for(const q of QUESTIONS.filter(q=>q.kind!=='text')){distributions[q.code]={};for(const r of rows){const v=q.code==='P14'?(r.p14?'بله':'خیر'):r[q.code.toLowerCase()];if(v!==null)distributions[q.code][v]=(distributions[q.code][v]||0)+1;}}
 return {ok:true,rows:rows.slice(p*limit,p*limit+limit),total:n,stats,distributions,snapshot:new Date().toISOString(),options:{schools:[...new Set(sampleRows.map(r=>r.school))],grades:[...new Set(sampleRows.map(r=>r.grade))],cohorts:['پاییز ۱۴۰۵']}};
}
if(session||demo)enter();
