import {api,fa,esc,dateFa,icons,initTheme} from './shared.mjs?v=20261031.3-instructor';
import {SCORE_QUESTIONS,DEFAULT_CATALOG,academyLabel} from './questions.mjs?v=20261031.3-instructor';
import {buildWorkbook} from './excel-export.mjs?v=20261031.3-instructor';
import {collectExportRows} from './report.mjs?v=20261031.3-instructor';
initTheme();
const $=s=>document.querySelector(s),AUTH='mofid-instructor-admin-v1';
let token='',filters={},page=0,tabName='overview',report=null,settings=null,editorId='call-center',editingCatalog=[],loadingVersion=0,exporting=false,deleteId='';
try{token=sessionStorage.getItem(AUTH)||'';}catch{}
const syncLabel=s=>({sent:'ارسال‌شده',pending:'در انتظار ارسال',failed:'نیازمند تلاش مجدد'}[s]||s);
const label=id=>settings?.catalog.find(c=>c.id===id)?.label||academyLabel(id);
function message(id,text){const el=$(id);el.textContent=text;el.hidden=!text;}
function toast(text){message('#toast',text);setTimeout(()=>$('#toast').hidden=true,3500);}
function loggedIn(value){$('#loginView').hidden=value;$('#dashboard').hidden=!value;$('#logout').hidden=!value;}
async function request(action,data={}){try{return await api(action,data,token);}catch(e){if(e.status===401){token='';try{sessionStorage.removeItem(AUTH);}catch{}loggedIn(false);message('#loginError',e.message);}throw e;}}
$('#loginForm').onsubmit=async e=>{e.preventDefault();const b=$('#loginButton');b.disabled=true;message('#loginError','');try{const r=await api('admin_login',{username:$('#username').value,secret:$('#password').value});token=r.token;$('#password').value='';try{sessionStorage.setItem(AUTH,token);}catch{}await initialize();}catch(e){message('#loginError',e.message);}finally{b.disabled=false;}};
$('#showPassword').onclick=()=>{const p=$('#password');p.type=p.type==='password'?'text':'password';$('#showPassword').textContent=p.type==='password'?'نمایش':'پنهان';};
$('#logout').onclick=()=>{loadingVersion++;token='';report=null;settings=null;editingCatalog=[];try{sessionStorage.removeItem(AUTH);}catch{}loggedIn(false);$('#detailDialog').close();$('#deleteDialog').close();$('#password').value='';};
async function initialize(){settings=(await request('admin_settings')).settings;editingCatalog=structuredClone(settings.catalog);loggedIn(true);populateSettings();await load();}
const getFilters=()=>Object.fromEntries([...new FormData($('#filterForm'))].filter(([,v])=>v!==''));
$('#filterForm').onsubmit=e=>{e.preventDefault();filters=getFilters();page=0;load();};
$('#resetFilters').onclick=()=>{$('#filterForm').reset();filters={};page=0;load();};
$('#refreshButton').onclick=()=>load();
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{tabName=b.dataset.tab;page=0;document.querySelectorAll('[data-tab]').forEach(x=>x.classList.toggle('active',x===b));document.querySelectorAll('.tab-section').forEach(x=>x.hidden=x.id!=='tab-'+tabName);$('#filterSection').hidden=tabName==='settings';if(tabName!=='settings')load();});
async function load(){
  const current=++loadingVersion;message('#reportError','');$('#reportLoading').hidden=false;
  try{const f={...filters,...(tabName==='comments'?{comment:'yes'}:{})};const result=await request('admin_list',{filters:f,page,limit:25});if(current!==loadingVersion)return;report=result;
    if(page>0&&page*25>=report.total){page=Math.max(0,Math.ceil(report.total/25)-1);return load();}
    $('#reportTimestamp').textContent='به‌روزرسانی '+dateFa(new Date())+'، به وقت تهران';$('#filterCount').textContent=Object.keys(filters).length?fa(report.total)+' پاسخ با فیلترهای انتخابی':'تمام پاسخ‌ها';
    populateFacets();overview();responses();comments();
  }catch(e){if(current===loadingVersion)message('#reportError',e.message);}finally{if(current===loadingVersion)$('#reportLoading').hidden=true;}
}
function selectOptions(id,items,title){const element=$(id),value=element.value;const unique=[...new Set([...items,...(value?[value]:[])])];element.innerHTML='<option value="">'+title+'</option>'+unique.map(x=>'<option value="'+esc(x)+'">'+esc(x)+'</option>').join('');element.value=value;}
function populateFacets(){const c=settings.catalog.filter(c=>!filters.academy||c.id===filters.academy);selectOptions('#fInstructor',[...report.facets.instructors,...c.flatMap(c=>c.instructors)],'همه مدرسان');selectOptions('#fClass',[...report.facets.classes,...c.flatMap(c=>c.classes)],'همه کلاس‌ها');selectOptions('#fTeam',[...report.facets.teams,...settings.catalog.map(c=>c.team_name)],'همه تیم‌ها');}
function overview(){
  const s=report.summary;
  $('#kpis').innerHTML=[['تعداد پاسخ‌ها',fa(s.count),'پاسخ ثبت‌شده'],['میانگین ارزیابی',fa(s.average_score,2),'از ۵ امتیاز'],['رضایت از کلاس',fa(s.satisfaction,1)+(s.satisfaction===null?'':'٪'),'امتیاز ۴ و ۵ در رضایت کلی'],['نظرهای متنی',fa(s.comment_count),'نظر و پیشنهاد']].map(([title,value,sub])=>'<div class="kpi-card"><span>'+title+'</span><strong>'+value+'</strong><small>'+sub+'</small></div>').join('');
  $('#courseCards').innerHTML=settings.catalog.map(c=>{const s=report.by_academy.find(r=>r.academy===c.id);return '<section class="course-card"><h2>'+esc(c.label)+'</h2><p>'+fa(s?.count||0)+' پاسخ · میانگین '+fa(s?.average_score,2)+' از ۵</p><button class="button subtle" data-export-academy="'+c.id+'">'+icons.download+' اکسل این دوره</button></section>';}).join('');
  $('#courseCards').querySelectorAll('[data-export-academy]').forEach(b=>b.onclick=()=>exportExcel(b.dataset.exportAcademy));
  $('#scoreBars').innerHTML=SCORE_QUESTIONS.map(q=>{const n=report.scores.find(x=>x.code===q.code)?.average;return bar(q.axis,n===null?0:n/5*100,fa(n,2)+' از ۵');}).join('');
  $('#distributionBars').innerHTML=report.distribution.map(x=>bar('امتیاز '+fa(x.score),s.count?x.count/s.count*100:0,fa(x.count)+' پاسخ')).join('');
}
const bar=(name,pct,value)=>'<div class="metric-line"><div class="metric-label"><span>'+esc(name)+'</span><b>'+esc(value)+'</b></div><div class="metric-track"><span style="width:'+Math.max(0,Math.min(100,Number(pct)||0))+'%"></span></div></div>';
function responses(){
  $('#responseCount').textContent=fa(report.total)+' پاسخ';
  $('#responsesBody').innerHTML=report.rows.map(r=>'<tr><td><b>'+esc(r.organizational_name)+'</b><br><small>'+dateFa(r.created_at)+'</small></td><td>'+esc(label(r.academy))+'<br><small>'+esc(r.course_title)+'</small></td><td>'+esc(r.instructor_name)+'</td><td>'+fa(Number(r.average_score),2)+'</td><td>'+fa(r.overall_score)+' از ۵</td><td><span class="status-label '+r.sync_status+'">'+syncLabel(r.sync_status)+'</span></td><td><button class="button text" data-detail="'+r.id+'">مشاهده</button></td></tr>').join('')||'<tr><td colspan="7" class="empty-state">پاسخی با این فیلترها پیدا نشد.</td></tr>';
  $('#responseCards').innerHTML=report.rows.map(r=>'<article class="response-card"><b>'+esc(r.organizational_name)+'</b><p>'+esc(label(r.academy))+' · '+esc(r.instructor_name)+'</p><p>'+esc(r.course_title)+'</p><small>'+dateFa(r.created_at)+' · میانگین '+fa(Number(r.average_score),2)+'</small><button class="button text" data-detail="'+r.id+'">جزئیات پاسخ</button></article>').join('')||'<p class="empty-state">پاسخی با این فیلترها پیدا نشد.</p>';
  document.querySelectorAll('[data-detail]').forEach(b=>b.onclick=()=>detail(b.dataset.detail));pagination();
}
function pagination(){const pages=Math.max(1,Math.ceil(report.total/25));for(const id of ['#pageInfo','#commentPageInfo'])$(id).textContent='صفحه '+fa(page+1)+' از '+fa(pages);for(const id of ['#prevPage','#commentPrev'])$(id).disabled=page===0;for(const id of ['#nextPage','#commentNext'])$(id).disabled=page+1>=pages;}
for(const id of ['#prevPage','#commentPrev'])$(id).onclick=()=>{if(page>0){page--;load();}};for(const id of ['#nextPage','#commentNext'])$(id).onclick=()=>{if((page+1)*25<report.total){page++;load();}};
function comments(){$('#commentsList').innerHTML=report.rows.filter(r=>r.feedback.trim()).map(r=>'<article class="comment-card"><small>'+esc(label(r.academy))+' · '+dateFa(r.created_at)+'</small><h3>'+esc(r.organizational_name)+' · '+esc(r.instructor_name)+'</h3><p class="comment-text">'+esc(r.feedback)+'</p><small>'+esc(r.course_title)+'</small></article>').join('')||'<p class="empty-state">نظری با این فیلترها پیدا نشد.</p>';}
function detail(id){const r=report.rows.find(r=>r.id===id);if(!r)return;$('#detailContent').innerHTML='<div class="detail-meta">'+[['نام سازمانی',r.organizational_name],['دوره',label(r.academy)],['تیم',r.team_name],['مدرس',r.instructor_name],['کلاس',r.course_title],['زمان ثبت',dateFa(r.created_at)],['مدت پاسخ‌گویی',fa(r.duration_seconds)+' ثانیه'],['ارسال به گردش‌کار',syncLabel(r.sync_status)]].map(([k,v])=>'<div><small>'+esc(k)+'</small><b>'+esc(v)+'</b></div>').join('')+'</div><div class="review-list">'+SCORE_QUESTIONS.map(q=>'<div class="review-row"><b>'+esc(q.axis)+'</b><span>'+fa(r[q.code])+' از ۵</span></div>').join('')+'</div><p class="comment-text">'+esc(r.feedback||'بدون نظر متنی')+'</p><div class="receipt">'+r.id+'</div><div class="detail-actions">'+(r.sync_status!=='sent'?'<button id="retrySync" class="button subtle">تلاش مجدد ارسال به گردش‌کار</button>':'')+'<button id="deleteResponse" class="button danger">حذف از گزارش</button></div>';$('#detailDialog').showModal();$('#deleteResponse').onclick=()=>{deleteId=r.id;$('#deleteName').textContent=r.organizational_name+' · '+label(r.academy);message('#deleteError','');$('#deleteDialog').showModal();};if($('#retrySync'))$('#retrySync').onclick=async()=>{try{await request('admin_retry_sync',{id:r.id});toast('برای ارسال مجدد در صف قرار گرفت.');$('#detailDialog').close();}catch(e){toast(e.message);}};}
$('#closeDetail').onclick=()=>$('#detailDialog').close();$('#cancelDelete').onclick=()=>$('#deleteDialog').close();$('#confirmDelete').onclick=async()=>{const b=$('#confirmDelete');b.disabled=true;try{await request('admin_delete',{id:deleteId,confirm:true});$('#deleteDialog').close();$('#detailDialog').close();toast('پاسخ از گزارش حذف شد.');await load();}catch(e){message('#deleteError',e.message);}finally{b.disabled=false;}};
function refreshCourseSelectors(){const options=settings.catalog.map(c=>'<option value="'+esc(c.id)+'">'+esc(c.label)+'</option>').join('');for(const id of ['#settingsAcademy','#fAcademy']){const el=$(id),value=el.value;el.innerHTML=(id==='#fAcademy'?'<option value="">همه دوره‌ها</option>':'')+options;if([...el.options].some(o=>o.value===value))el.value=value;}}
function populateSettings(){refreshCourseSelectors();$('#surveyOpen').checked=settings.is_open;editorId=settings.catalog[0].id;renderEditor();}
function saveEditor(){const c=editingCatalog.find(c=>c.id===editorId);if(!c||!$('#courseOpen'))return;c.is_open=$('#courseOpen').checked;c.label=$('#courseLabel').value.trim();c.team_name=$('#teamName').value.trim();c.instructors=$('#instructorList').value.split('\n').map(x=>x.trim()).filter(Boolean);c.classes=$('#classList').value.split('\n').map(x=>x.trim()).filter(Boolean);}
function renderEditor(){const c=editingCatalog.find(c=>c.id===editorId);$('#catalogEditor').innerHTML='<label class="toggle-label"><input type="checkbox" id="courseOpen" '+(c.is_open?'checked':'')+'> پاسخ‌گویی این دوره باز باشد</label><label for="courseLabel">عنوان دوره</label><input id="courseLabel" maxlength="100" required value="'+esc(c.label)+'"><label for="teamName">نام تیم</label><input id="teamName" maxlength="100" required value="'+esc(c.team_name)+'"><label for="instructorList">مدرسان <small>(هر نام در یک خط)</small></label><textarea id="instructorList" rows="5">'+esc(c.instructors.join('\n'))+'</textarea><label for="classList">کلاس‌ها <small>(هر عنوان در یک خط)</small></label><textarea id="classList" rows="5">'+esc(c.classes.join('\n'))+'</textarea><p class="small-note">این نام‌ها در فهرست کشویی مدرس و عنوان کلاس نمایش داده می‌شوند.</p>';}
$('#settingsAcademy').onchange=e=>{saveEditor();editorId=e.target.value;renderEditor();};
$('#settingsForm').onsubmit=async e=>{e.preventDefault();saveEditor();const b=$('#saveSettings');b.disabled=true;try{settings=(await request('admin_settings_save',{settings:{is_open:$('#surveyOpen').checked,catalog:editingCatalog}})).settings;editingCatalog=structuredClone(settings.catalog);refreshCourseSelectors();$('#settingsMessage').textContent='تنظیمات ذخیره شد.';}catch(e){$('#settingsMessage').textContent=e.message;}finally{b.disabled=false;}};
$('#generateLink').onclick=async()=>{const u=new URL('./',location.href);$('#generatedLink').value=u.href;try{await navigator.clipboard.writeText(u.href);toast('لینک فرم کپی شد.');}catch{$('#generatedLink').select();toast('لینک آماده است؛ آن را کپی کنید.');}};
async function exportExcel(academy){
  if(exporting)return;exporting=true;$('#exportButton').disabled=true;document.querySelectorAll('[data-export-academy]').forEach(b=>b.disabled=true);message('#reportError','');
  const selectedFilters={...filters,...(tabName==='comments'?{comment:'yes'}:{}),...(academy?{academy}:{})};
  try{
    const result=await collectExportRows((f,p,l)=>request('admin_list',{filters:f,page:p,limit:l}),selectedFilters,n=>message('#exportStatus','در حال آماده‌سازی اکسل: '+fa(n)+' پاسخ…'));
    const bytes=buildWorkbook(result.rows,{filters:selectedFilters,exportedAt:result.snapshot,catalog:settings.catalog});
    const blob=new Blob([bytes],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='Instructor-Survey-'+(selectedFilters.academy||'all')+'-'+new Date().toISOString().slice(0,10)+'.xlsx';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);message('#exportStatus','اکسل '+fa(result.rows.length)+' پاسخ، مطابق فیلترهای انتخابی آماده شد.');
  }catch(e){message('#reportError',e.message);$('#exportStatus').hidden=true;}finally{exporting=false;$('#exportButton').disabled=false;document.querySelectorAll('[data-export-academy]').forEach(b=>b.disabled=false);}
}
$('#exportButton').innerHTML=icons.download+' خروجی اکسل';$('#exportButton').onclick=()=>exportExcel();
loggedIn(false);if(token)initialize().catch(e=>{loggedIn(false);message('#loginError',e.message);});
