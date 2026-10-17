'use strict';
(() => {
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fa = v => Number(v || 0).toLocaleString('fa-IR', {maximumFractionDigits: 1});
  const freq = {daily:'روزانه', weekly:'هفتگی', monthly:'ماهانه'};
  const months = {daily:22, weekly:4.33, monthly:1};
  const ordinals = ['اول', 'دوم', 'سوم'];
  const labels = ['مشخصات', 'کار اول', 'کار دوم', 'کار سوم', 'بازبینی'];
  const blankTask = () => ({title:'', steps:'', count:'', frequency:'daily', minutes:'', tools:'', human_decision:''});
  const blankSurvey = () => ({full_name:'', department:'', job_title:'', tasks:[blankTask(),blankTask(),blankTask()], revision:0, status:'draft'});
  const state = {user:null, survey:blankSurvey(), step:0, dirty:false, busy:false, responses:[], accounts:[], isAdmin:false};
  let toastTimer;
  let apiToken='',inviteToken='',loginMode='participant',apiReady=false,pendingSave=null;
  const config=window.ZERO_REPETITION_CONFIG || {};

  function setBackground(step = 0) {
    const scenes = ['leafy', 'night-sign', 'day-elevated', 'night', 'sunset', 'night-low-angle'];
    document.body.dataset.scene = scenes[Math.abs(Math.trunc(Number(step) || 0)) % scenes.length];
  }

  function hours(tasks) {
    return Math.round(tasks.reduce((sum,t) => sum + (+t.count || 0) * (+t.minutes || 0) * (months[t.frequency] || 0) / 60, 0) * 10) / 10;
  }
  function toast(message, bad = false) {
    clearTimeout(toastTimer);
    $('#toast').textContent = message;
    $('#toast').classList.toggle('error-toast', bad);
    $('#toast').hidden = false;
    toastTimer = setTimeout(() => { $('#toast').hidden = true; }, 4500);
  }
  function errorBox(message, id='form-error') {
    const target = document.getElementById(id);
    if (target) { target.textContent=message; target.hidden=!message; if(message) target.scrollIntoView({block:'nearest',behavior:'smooth'}); }
    else if(message) toast(message,true);
  }
  function surveyHours(s) { return s.tasks?.every(t => 'count' in t && 'minutes' in t) ? hours(s.tasks) : Number(s.monthly_hours || 0); }
  async function apiCall(body,{binary=false}={}) {
    if(!config.apiUrl)throw new Error('اتصال سامانه هنوز فعال نشده است.');
    const url=new URL(config.apiUrl);
    if(url.protocol!=='https:')throw new Error('آدرس اتصال سامانه معتبر نیست.');
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),90000);
    try{
      const res=await fetch(url.href,{method:'POST',credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer',signal:controller.signal,headers:{'Content-Type':'text/plain;charset=UTF-8',Accept:binary?'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':'application/json'},body:JSON.stringify(body)});
      const type=res.headers.get('Content-Type') || '';
      if(binary && res.ok && !type.includes('application/json')){
        const blob=await res.blob(),signature=new Uint8Array(await blob.slice(0,4).arrayBuffer());
        if(signature[0]!==80||signature[1]!==75||signature[2]!==3||signature[3]!==4)throw new Error('فایل اکسل معتبر دریافت نشد.');
        return blob;
      }
      let result;try{result=await res.json();}catch{throw new Error('پاسخ معتبر از سامانه دریافت نشد. دوباره تلاش کنید.');}
      if(!res.ok || result.ok!==true){const e=new Error(result.message || 'درخواست انجام نشد.');e.status=res.status;e.code=result.code;throw e;}
      return result;
    }catch(e){if(e.name==='AbortError')throw new Error('پاسخ سرور دیر رسید. اطلاعات واردشده حفظ شده است؛ دوباره تلاش کنید.');throw e;}
    finally{clearTimeout(timer);}
  }
  async function request(path,method='GET',data) {
    if(path==='/api/logout')return {ok:true};
    let action,payload=data || {},token=apiToken;
    if(path==='/api/login'){
      if(loginMode==='admin')return apiCall({action:'admin_login',email:data.email,secret:data.password});
      return apiCall({action:'invite_login',token:inviteToken});
    }
    if(path==='/api/survey')action=method==='GET'?'survey_get':'survey_save';
    else if(path==='/api/admin/responses')action='responses_list';
    else if(path.startsWith('/api/admin/response/')){action='response_get';payload={id:decodeURIComponent(path.split('/').pop())};}
    else if(path==='/api/admin/accounts')action=method==='GET'?'invites_list':'invite_create';
    else if(path==='/api/admin/reopen')action='reopen';
    else if(path==='/api/admin/invite-reset')action='invite_reset';
    else throw new Error('عملیات معتبر نیست.');
    const body={action,token,data:payload};
    if(['survey_save','reopen','invite_create','invite_reset'].includes(action)){
      if(action==='survey_save'){
        const signature=JSON.stringify(payload);
        if(!pendingSave || pendingSave.signature!==signature)pendingSave={signature,id:crypto.randomUUID()};
        body.request_id=pendingSave.id;
      }else body.request_id=crypto.randomUUID();
    }
    const result=await apiCall(body);
    if(action==='survey_save')pendingSave=null;
    return result;
  }
  function setLoginMode(mode) {
    loginMode=mode;
    const admin=mode==='admin';
    $('#admin-password-field').hidden=!admin;
    $('#login-email-field').hidden=!admin;
    $('#login-email').required=admin;
    $('#login-password').required=admin;
    $('#login-password').value='';
    $('#login-submit').textContent=admin?'ورود به مدیریت ←':'ورود به پرسشنامه ←';
    $('#login-submit').disabled=!apiReady || (!admin&&!inviteToken);
    $('#login-intro').textContent=admin?'با ایمیل و رمز اختصاصی مدیریت وارد شوید.':'پرسشنامه از طریق لینک اختصاصی ارسال‌شده به ایمیل سازمانی شما باز می‌شود.';
    $('#login-foot-text').textContent=admin?'دسترسی مدیریت فقط با رمز اختصاصی مسئول طرح فعال می‌شود.':'هر لینک فقط به پاسخ همان همکار دسترسی دارد. پاسخ‌ها در شیت خصوصی طرح نگهداری می‌شوند.';
    $('#participant-entry-button').hidden=admin===false;
    errorBox('','login-error');
  }
  function updateHeader() {
    const logged = !!state.user;
    $('#login-card').hidden=logged;
    $('#app-content').hidden=!logged;
    $('#logout-button').hidden=!logged;
    $('#my-form-button').hidden=!logged || state.user.is_admin;
    $('#admin-button').hidden=!logged || !state.user.is_admin || state.user.must_change_password;
    $('#header-email').textContent=state.user?.email || '';
    $('#admin-entry-button').hidden=logged;
    $('#participant-entry-button').hidden=logged || loginMode!=='admin';
    document.body.classList.toggle('is-app',logged);
    document.body.classList.toggle('is-admin',state.isAdmin && logged);
    setBackground(logged ? (state.isAdmin ? 1 : state.step) : 0);
  }
  async function afterLogin(user,initialSurvey) {
    state.user=user;state.isAdmin=false;updateHeader();
    if(user.is_admin)return loadAdmin();
    if(initialSurvey!==undefined){state.survey=initialSurvey || {...blankSurvey(),full_name:user.full_name || '',department:user.department || ''};state.dirty=false;state.step=0;renderForm();return;}
    await loadMine();
  }
  async function loadMine() {
    state.isAdmin=false;updateHeader();
    $('#app-content').innerHTML='<div class="card form-card"><p class="muted">در حال دریافت پاسخ شما…</p></div>';
    try {
      const data=await request('/api/survey');
      state.survey=data.survey || {...blankSurvey(),full_name:state.user.full_name || '',department:state.user.department || ''};
      state.dirty=false;state.step=0;renderForm();
    } catch(e) {$('#app-content').innerHTML='<div class="card form-card"><p class="muted">دریافت اطلاعات انجام نشد.</p><button type="button" id="retry-mine" class="button secondary">تلاش دوباره</button></div>';$('#retry-mine').onclick=loadMine;toast(e.message,true);}
  }
  function stepper() {
    return `<ol class="stepper" aria-label="مراحل پرسشنامه">${labels.map((label,i)=>`<li class="${i===state.step?'current':i<state.step?'complete':''}"><button type="button" class="step-button" data-step="${i}" ${i>state.step?'disabled':''} ${i===state.step?'aria-current="step"':''}><span class="step-number">${i<state.step?'✓':fa(i+1)}</span><span>${label}</span></button></li>`).join('')}</ol>`;
  }
  function field(label,key,value,{required=false,max=120,placeholder='',type='text',extra=''}={}) {
    return `<label class="field"><span>${label}${required?'': ' <span class="optional">(اختیاری)</span>'}</span><input type="${type}" data-field="${key}" value="${esc(value)}" ${required?'required':''} maxlength="${max}" placeholder="${esc(placeholder)}" ${extra}></label>`;
  }
  function information() {
    const s=state.survey;
    return `<h3 class="form-section-title">ابتدا کمی از خودتان بگویید</h3><p class="section-description">این اطلاعات کمک می‌کند فعالیت‌ها را به واحد مربوط پیوند دهیم.</p><div class="fields-grid">${field('نام و نام خانوادگی','full_name',s.full_name,{required:true,max:120,placeholder:'نام و نام خانوادگی شما',extra:'autocomplete="name"'})}${field('واحد سازمانی','department',s.department,{required:true,max:100,placeholder:'مثلاً پشتیبانی'})}<div class="full-row">${field('سمت شغلی','job_title',s.job_title,{max:100,placeholder:'مثلاً کارشناس'})}</div></div><div class="soft-note">پرسشنامه برای حساب <bdi>${esc(state.user.email)}</bdi> ثبت می‌شود.</div>`;
  }
  function taskForm(index) {
    const t=state.survey.tasks[index];
    return `<h3 class="form-section-title">کار تکراری ${ordinals[index]}</h3><p class="section-description">کاری را توصیف کنید که در روزها یا هفته‌های کاری بارها انجام می‌دهید.</p>
      ${field('عنوان فعالیت','title',t.title,{required:true,max:160,placeholder:'مثلاً تجمیع گزارش‌های روزانه'})}
      <label class="field"><span>این کار را الان چگونه انجام می‌دهید؟</span><textarea data-field="steps" maxlength="4000" required placeholder="از دریافت اطلاعات تا پایان کار، مراحل فعلی را کوتاه و روشن بنویسید.">${esc(t.steps)}</textarea></label>
      <div class="fields-grid"><div class="field"><label for="task-count">تعداد دفعات انجام</label><div class="number-group"><input id="task-count" data-field="count" type="number" inputmode="numeric" min="1" max="100000" step="1" value="${esc(t.count)}" required aria-label="تعداد دفعات"><select data-field="frequency" aria-label="دوره تکرار">${Object.entries(freq).map(([key,label])=>`<option value="${key}" ${t.frequency===key?'selected':''}>${label}</option>`).join('')}</select></div></div>
      <label class="field"><span>زمان تقریبی هر بار انجام</span><span class="input-unit"><input data-field="minutes" type="number" inputmode="decimal" min="0.01" max="100000" step="0.01" value="${esc(t.minutes)}" placeholder="مثلاً ۲۰" required><span class="unit">دقیقه</span></span></label></div>
      <label class="field"><span>از چه ابزارهایی استفاده می‌کنید؟</span><input data-field="tools" maxlength="500" value="${esc(t.tools)}" placeholder="نام نرم‌افزارها یا سامانه‌های مورد استفاده" required><span class="tool-chips"><button class="tool-chip" type="button" data-tool="Excel">Excel +</button><button class="tool-chip" type="button" data-tool="ایمیل">ایمیل +</button><button class="tool-chip" type="button" data-tool="سامانه داخلی">سامانه داخلی +</button><button class="tool-chip" type="button" data-tool="Google Sheets">Google Sheets +</button></span></label>
      <label class="field"><span>کدام مرحله به تصمیم یا تأیید انسان نیاز دارد؟ <span class="optional">(اختیاری)</span></span><textarea class="small-area" data-field="human_decision" maxlength="1000" placeholder="اگر مرحله‌ای نیاز به بررسی یا تأیید دارد، اینجا بنویسید.">${esc(t.human_decision)}</textarea></label>`;
  }
  function summary(s) {
    return `<dl class="profile-summary"><div><dt>نام و نام خانوادگی</dt><dd>${esc(s.full_name)}</dd></div><div><dt>واحد سازمانی</dt><dd>${esc(s.department)}</dd></div><div><dt>سمت</dt><dd>${esc(s.job_title || '—')}</dd></div></dl>${s.tasks.map((t,i)=>`<article class="review-task"><div class="review-task-top"><span class="task-bullet">${fa(i+1)}</span><h3>${esc(t.title || 'عنوان وارد نشده')}</h3></div><p>${esc(t.steps || 'مراحل هنوز وارد نشده است.')}</p><div class="task-meta"><span>${fa(t.count)} بار ${freq[t.frequency]||''}</span><span>${fa(t.minutes)} دقیقه در هر بار</span><span>${esc(t.tools || 'ابزار مشخص نشده')}</span></div>${t.human_decision?`<p>تصمیم یا تأیید انسانی: ${esc(t.human_decision)}</p>`:''}</article>`).join('')}<div class="estimate"><div><span class="text-small">برآورد زمان این فعالیت‌ها در ماه</span><small>با فرض ۲۲ روز کاری و ۴٫۳۳ هفته در ماه</small></div><div><strong>${fa(surveyHours(s))}</strong> <span class="text-small">ساعت</span></div></div>`;
  }
  function review() {
    return `<h3 class="form-section-title">یک نگاه آخر به پاسخ‌ها</h3><p class="section-description">پس از ثبت نهایی، پاسخ‌ها برای بررسی در اختیار مدیران طرح قرار می‌گیرد.</p>${summary(state.survey)}<label class="check-label"><input type="checkbox" id="confirm-survey" required><span>مشخصات و سه فعالیت خود را بررسی کرده‌ام و ثبت نهایی را تأیید می‌کنم.</span></label>`;
  }
  function capture() {
    const target=state.step===0?state.survey:state.survey.tasks[state.step-1];
    if(state.step<4) $$('[data-field]',$('#app-content')).forEach(el=>{target[el.dataset.field]=el.value;});
  }
  function renderForm(turn = 0) {
    setBackground(state.step);
    if(state.survey.status==='submitted') return renderReceipt();
    document.body.classList.remove('is-admin');
    $('#app-content').innerHTML=`<div class="card form-card${turn > 0 ? ' turn-forward' : turn < 0 ? ' turn-back' : ''}"><div class="form-heading"><div><div class="card-kicker"><span class="status-dot"></span> پرسشنامه شناسایی فعالیت‌ها</div><h2>سه کار تا یک تغییر</h2></div><span class="status-pill">پیش‌نویس</span></div>${stepper()}<form id="survey-form" class="question-panel">${state.step===0?information():state.step<4?taskForm(state.step-1):review()}<div id="form-error" class="error-box" role="alert" hidden></div><div class="form-actions"><button type="button" class="button quiet" id="save-draft">ذخیره پیش‌نویس</button><div class="form-actions-group">${state.step>0?'<button type="button" class="button secondary" id="previous-step">مرحله قبل</button>':''}<button type="submit" class="button primary" id="next-step">${state.step===4?'ثبت نهایی پاسخ‌ها':'ذخیره و ادامه'} <span aria-hidden="true">←</span></button></div></div><div class="save-indicator" id="save-indicator">${state.survey.updated_at?'آخرین ذخیره: '+new Date(state.survey.updated_at).toLocaleString('fa-IR'):'پاسخ‌های شما پس از ذخیره در حساب‌تان نگهداری می‌شود.'}</div></form></div>`;
    $('#survey-form').oninput=()=>{state.dirty=true;$('#save-indicator').textContent='تغییرات جدید هنوز ذخیره نشده است.';};
    $('#survey-form').onsubmit=async e=>{e.preventDefault();capture();if(state.step===4){if(!$('#confirm-survey').checked)return;return save('submit');}const saved=await save('draft',false);if(saved){state.step++;renderForm(1);focusStep();}};
    $('#save-draft').onclick=()=>save('draft');
    $('#previous-step')?.addEventListener('click',()=>{capture();state.step--;renderForm(-1);focusStep();});
    $$('[data-step]').forEach(button=>button.onclick=()=>{capture();const nextStep=+button.dataset.step;const turn=Math.sign(nextStep-state.step);state.step=nextStep;renderForm(turn);focusStep();});
    $$('[data-tool]').forEach(button=>button.onclick=()=>{const input=$('[data-field="tools"]');const values=input.value.split(/[،,]/).map(v=>v.trim()).filter(Boolean);if(!values.includes(button.dataset.tool)){values.push(button.dataset.tool);input.value=values.join('، ');input.dispatchEvent(new Event('input',{bubbles:true}));}});
  }
  function focusStep() {
    $('.form-section-title')?.scrollIntoView({behavior:'smooth',block:'nearest'});
    const heading=$('.form-section-title'); if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});}
  }
  async function save(action,notify=true) {
    if(state.busy)return false;
    capture();state.busy=true;
    $$('.form-actions button').forEach(b=>b.disabled=true);
    errorBox('');
    try{
      const data=await request('/api/survey','POST',{...state.survey,action});
      state.survey=data.survey;state.dirty=false;
      if(action==='submit') renderReceipt();
      else {const indicator=$('#save-indicator');if(indicator)indicator.textContent='ذخیره شد · '+new Date().toLocaleTimeString('fa-IR',{hour:'2-digit',minute:'2-digit'});if(notify)toast('پیش‌نویس شما در سامانه ذخیره شد.');}
      return true;
    }catch(e){errorBox(e.message);return false;}
    finally{state.busy=false;$$('.form-actions button').forEach(b=>b.disabled=false);}
  }
  function renderReceipt() {
    setBackground(5);
    const s=state.survey;
    $('#app-content').innerHTML=`<div class="card form-card"><div class="receipt-heading"><div class="receipt-icon" aria-hidden="true">✓</div><div class="card-kicker receipt-kicker">ثبت نهایی در سامانه</div><h2>سه فعالیت شما ثبت شد.</h2><p>سپاس که برای بهتر شدن فرایندهای کاری همراه شدید.</p><div class="tracking">کد پیگیری <b dir="ltr">${esc(s.id?.replaceAll('-','').slice(0,12).toUpperCase() || '')}</b></div></div>${summary(s)}<div class="soft-note">پاسخ‌ها در حساب شما قابل مشاهده است. برای اصلاح پاسخ ثبت‌شده، از مسئول طرح بخواهید ویرایش را باز کند.</div></div>`;
  }
  function pill(status) {
    const map={submitted:['submitted','ثبت نهایی'],draft:['','پیش‌نویس'],done:['submitted','ذخیره شد'],pending:['pending','در صف'],processing:['pending','در حال انتقال'],failed:['failed','خطای انتقال'],none:['','—'],superseded:['','نسخه پیشین']};
    const info=map[status] || map.none;
    return `<span class="status-pill ${info[0]}">${info[1]}</span>`;
  }
  async function loadAdmin() {
    if(!state.user?.is_admin)return;
    if(state.dirty&&!confirm('تغییرات ذخیره نشده است. بدون ذخیره به مدیریت بروید؟'))return;
    state.isAdmin=true;updateHeader();
    $('#app-content').innerHTML='<div class="card admin-card"><p class="muted">در حال دریافت پاسخ‌ها…</p></div>';
    try{
      const data=await request('/api/admin/responses');state.responses=data.responses;
      renderAdmin(data);
    }catch(e){$('#app-content').innerHTML='<div class="card admin-card"><p>دریافت پاسخ‌ها انجام نشد.</p><button class="button secondary" id="retry-admin" type="button">تلاش دوباره</button></div>';$('#retry-admin').onclick=loadAdmin;toast(e.message,true);}
  }
  function renderAdmin(data) {
    const submitted=state.responses.filter(s=>s.status==='submitted');
    const departments=[...new Set(state.responses.map(s=>s.department).filter(Boolean))].sort();
    $('#app-content').innerHTML=`<div class="card admin-card"><div class="admin-title-row"><div><div class="card-kicker"><span class="status-dot"></span> پنل مدیریت طرح</div><h2>فرصت‌ها از همین‌جا شروع می‌شوند.</h2><p>پاسخ‌های همکاران، در یک نمای منظم و قابل جست‌وجو.</p></div><div class="admin-buttons"><button class="button secondary" type="button" id="accounts-button">مدیریت حساب‌ها</button><button class="button primary" type="button" id="export-button">دریافت اکسل ↓</button></div></div><div class="stats"><div class="stat"><span class="stat-label">پاسخ ثبت نهایی</span><span class="stat-value">${fa(submitted.length)}<span class="stat-unit">نفر</span></span></div><div class="stat"><span class="stat-label">فعالیت ثبت‌شده</span><span class="stat-value">${fa(submitted.length*3)}<span class="stat-unit">فعالیت</span></span></div><div class="stat"><span class="stat-label">حساب‌های شرکت‌کننده</span><span class="stat-value">${fa(data.registered_users)}<span class="stat-unit">نفر</span></span></div><div class="stat"><span class="stat-label">زمان فعالیت‌های ثبت‌شده در ماه</span><span class="stat-value">${fa(submitted.reduce((sum,s)=>sum+surveyHours(s),0))}<span class="stat-unit">ساعت</span></span></div></div><div class="filters"><input class="filter-input" id="response-search" placeholder="جست‌وجوی نام، ایمیل یا عنوان فعالیت…" aria-label="جست‌وجو"><select class="filter-select" id="department-filter" aria-label="واحد"><option value="">همه واحدها</option>${departments.map(d=>`<option value="${esc(d)}">${esc(d)}</option>`).join('')}</select><select class="filter-select" id="status-filter" aria-label="وضعیت پاسخ"><option value="">همه وضعیت‌ها</option><option value="submitted">ثبت نهایی</option><option value="draft">پیش‌نویس</option></select></div><div class="table-scroll"><table class="responses-table"><thead><tr><th>نام و ایمیل سازمانی</th><th>واحد</th><th>فعالیت‌ها</th><th>زمان ماهانه</th><th>وضعیت پاسخ</th><th>ثبت در شیت</th><th>جزئیات</th></tr></thead><tbody id="response-rows"></tbody></table><div class="empty-state" id="empty-state" hidden><strong>هنوز پاسخی در این نما نیست.</strong>با تغییر فیلترها یا دریافت پاسخ‌های جدید، موارد اینجا نمایش داده می‌شود.</div></div><div class="table-foot"><span id="table-count"></span><span>زمان ماهانه، برآورد فعالیت‌هاست؛ معادل صرفه‌جویی قطعی نیست.</span></div><div class="integration-note"><span>پاسخ‌ها در شیت خصوصی طرح ذخیره می‌شوند.</span></div></div>`;
    $('#response-search').oninput=renderRows;
    $('#department-filter').onchange=renderRows;
    $('#status-filter').onchange=renderRows;
    $('#accounts-button').onclick=loadAccounts;
    $('#export-button').onclick=exportExcel;
    renderRows();
  }
  function renderRows() {
    const q=$('#response-search').value.trim().toLowerCase(),dept=$('#department-filter').value,status=$('#status-filter').value;
    const matches=state.responses.filter(s=>(!dept||s.department===dept)&&(!status||s.status===status)&&(!q||[s.full_name,s.email,...s.tasks.map(t=>t.title)].join(' ').toLowerCase().includes(q)));
    $('#response-rows').innerHTML=matches.map(s=>`<tr><td class="person-cell"><b>${esc(s.full_name || 'نام وارد نشده')}</b><small dir="ltr">${esc(s.email)}</small></td><td>${esc(s.department || '—')}</td><td>${fa(s.tasks.filter(t=>t.title).length)} فعالیت</td><td>${fa(surveyHours(s))} ساعت</td><td>${pill(s.status)}</td><td>${pill(s.sync_state)}</td><td><button type="button" class="table-button" data-detail="${esc(s.id)}">مشاهده ←</button></td></tr>`).join('');
    $('#empty-state').hidden=matches.length>0;$('#table-count').textContent=`نمایش ${fa(matches.length)} پاسخ از ${fa(state.responses.length)}`;
    $$('[data-detail]').forEach(b=>b.onclick=()=>showDetail(b.dataset.detail));
  }
  async function showDetail(id) {
    let s;
    try {s=(await request('/api/admin/response/'+encodeURIComponent(id))).survey;}
    catch(e){toast(e.message,true);return;}
    if(!s)return;
    $('#detail-content').innerHTML=`<div class="dialog-head"><span class="eyebrow-dark">جزئیات پاسخ</span><button class="icon-button" type="button" data-close-dialog aria-label="بستن">×</button></div><h2>${esc(s.full_name || s.email)}</h2><p dir="ltr">${esc(s.email)}</p>${summary(s)}<div class="form-actions"><span>${pill(s.status)}</span>${s.status==='submitted'?'<button type="button" class="button secondary" id="reopen-button">بازکردن ویرایش برای فرد</button>':''}</div>`;
    bindDialogClose($('#detail-dialog'));
    $('#reopen-button')?.addEventListener('click',async()=>{if(!confirm('ویرایش این پاسخ برای صاحب حساب باز شود؟'))return;try{await request('/api/admin/reopen','POST',{id});$('#detail-dialog').close();await loadAdmin();toast('ویرایش پاسخ باز شد.');}catch(e){toast(e.message,true);}});
    if(!$('#detail-dialog').open)$('#detail-dialog').showModal();
  }
  function downloadBlob(blob,name) {
    const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
  }
  async function exportExcel() {
    const button=$('#export-button');button.disabled=true;
    try{const blob=await apiCall({action:'export',token:apiToken},{binary:true});downloadBlob(blob,'Zero-Repetition-Responses-'+new Date().toISOString().slice(0,10)+'.xlsx');toast('فایل اکسل آماده شد.');}
    catch(e){toast(e.message,true);}finally{button.disabled=false;}
  }
  async function loadAccounts() {
    try{
      const data=await request('/api/admin/accounts');state.accounts=data.accounts;
      $('#accounts-content').innerHTML=`<div class="dialog-head"><span class="eyebrow-dark">لینک‌های اختصاصی</span><button class="icon-button" type="button" data-close-dialog aria-label="بستن">×</button></div><h2>دسترسی همکاران</h2><p>هر همکار با لینک اختصاصی خود وارد می‌شود. ظرفیت طرح ۳۰۰ نفر است.</p><form id="create-account-form"><div class="fields-grid"><label class="field"><span>نام و نام خانوادگی</span><input name="full_name" maxlength="120" required></label><label class="field"><span>واحد</span><input name="department" maxlength="100" required></label><label class="field full-row"><span>ایمیل سازمانی</span><input name="email" type="email" dir="ltr" placeholder="name@emofid.com" maxlength="254" required></label></div><div id="account-error" class="error-box" role="alert" hidden></div><button class="button primary" type="submit">ایجاد لینک اختصاصی</button></form><details class="bulk-invites"><summary>ایجاد گروهی لینک‌ها</summary><form id="bulk-invite-form"><label class="field"><span>فهرست همکاران؛ هر سطر: ایمیل، نام و نام خانوادگی، واحد</span><textarea id="bulk-invite-text" maxlength="180000" placeholder="name@emofid.com,نام و نام خانوادگی,واحد" required></textarea></label><label class="field"><span>یا فایل CSV همین فهرست</span><input id="bulk-invite-file" type="file" accept=".csv,text/csv"></label><button class="button secondary" type="submit">ساخت لینک‌های گروهی</button></form></details><div id="invite-results"></div><div class="account-list" id="account-list"></div>`;
      renderAccounts();bindDialogClose($('#accounts-dialog'));if(!$('#accounts-dialog').open)$('#accounts-dialog').showModal();
      $('#create-account-form').onsubmit=async e=>{e.preventDefault();const person=Object.fromEntries(new FormData(e.currentTarget));const button=$('button[type=submit]',e.currentTarget);button.disabled=true;try{const result=await request('/api/admin/accounts','POST',{people:[person]});await loadAccounts();showInviteResults(result.invites);}catch(ex){errorBox(ex.message,'account-error');button.disabled=false;}};
      $('#bulk-invite-file').onchange=async e=>{const file=e.target.files?.[0];if(!file)return;if(file.size>250000){toast('حجم فایل فهرست بیش از حد مجاز است.',true);return;}$('#bulk-invite-text').value=await file.text();};
      $('#bulk-invite-form').onsubmit=async e=>{e.preventDefault();const button=$('button[type=submit]',e.currentTarget);button.disabled=true;try{const people=parsePeopleCsv($('#bulk-invite-text').value);const result=await request('/api/admin/accounts','POST',{people});await loadAccounts();showInviteResults(result.invites);}catch(ex){toast(ex.message,true);button.disabled=false;}};
    }catch(e){toast(e.message,true);}
  }
  function parsePeopleCsv(text) {
    text=text.replace(/^\uFEFF/,'');const first=text.split(/\r?\n/)[0] || '',sep=first.includes('\t')?'\t':first.includes(';')?';':',';
    const rows=[];let row=[],value='',quoted=false;
    for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){value+='"';i++;}else quoted=!quoted;}else if(c===sep&&!quoted){row.push(value.trim());value='';}else if(c==='\n'&&!quoted){row.push(value.trim());rows.push(row);row=[];value='';}else if(c!=='\r')value+=c;}
    if(quoted)throw new Error('علامت نقل‌قول در فایل CSV کامل نیست.');row.push(value.trim());rows.push(row);
    const clean=rows.filter(r=>r.some(v=>v));if(!clean.length)throw new Error('فهرست خالی است.');
    const head=clean[0].map(v=>v.toLowerCase()),emailIndex=head.findIndex(v=>['email','ایمیل','ایمیل سازمانی'].includes(v));
    let indexes=[0,1,2];if(emailIndex>=0){indexes=[emailIndex,head.findIndex(v=>['full_name','name','نام','نام و نام خانوادگی'].includes(v)),head.findIndex(v=>['department','واحد','واحد سازمانی'].includes(v))];clean.shift();if(indexes.some(i=>i<0))throw new Error('سرستون‌ها باید شامل ایمیل، نام و واحد باشند.');}
    if(!clean.length||clean.length>300)throw new Error('فهرست باید بین ۱ تا ۳۰۰ نفر داشته باشد.');
    return clean.map(r=>({email:r[indexes[0]] || '',full_name:r[indexes[1]] || '',department:r[indexes[2]] || ''}));
  }
  function showInviteResults(invites) {
    if(!Array.isArray(invites)||!invites.length)return;
    $('#invite-results').innerHTML=`<div class="soft-note"><strong>لینک‌ها آماده‌اند.</strong><p>هر لینک را فقط برای همان همکار بفرستید.</p><button type="button" class="button secondary" id="download-invites">دریافت فهرست لینک‌ها</button></div>${invites.map((p,i)=>`<label class="field"><span>${esc(p.full_name)} · <bdi>${esc(p.email)}</bdi></span><input dir="ltr" type="text" readonly value="${esc(p.url)}" id="invite-link-${i}"><button class="button secondary" type="button" data-copy-invite="${i}">کپی لینک</button></label>`).join('')}`;
    $$('[data-copy-invite]').forEach(b=>b.onclick=async()=>{const input=$('#invite-link-'+b.dataset.copyInvite);try{await navigator.clipboard.writeText(input.value);toast('لینک کپی شد.');}catch{input.focus();input.select();toast('لینک را از کادر انتخاب‌شده کپی کنید.');}});
    $('#download-invites').onclick=()=>{const safe=v=>{v=String(v??'');if(/^[=+\-@\t\r]/.test(v))v="'"+v;return '"'+v.replaceAll('"','""')+'"';};const rows=[['نام و نام خانوادگی','ایمیل','واحد','لینک اختصاصی'],...invites.map(p=>[p.full_name,p.email,p.department,p.url])];downloadBlob(new Blob(['\uFEFF'+rows.map(r=>r.map(safe).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}),'Zero-Repetition-Private-Invites.csv');};
    $('#invite-results').scrollIntoView({block:'nearest',behavior:'smooth'});
  }
  function renderAccounts() {
    $('#account-list').innerHTML=state.accounts.length?state.accounts.map(a=>`<div class="account-row"><div><strong>${esc(a.full_name)}</strong><small><bdi>${esc(a.email)}</bdi> · ${esc(a.department)}</small></div><button type="button" class="table-button" data-renew="${esc(a.id)}">تولید لینک جدید</button></div>`).join(''):'<p>هنوز همکار جدیدی اضافه نشده است.</p>';
    $$('[data-renew]').forEach(b=>b.onclick=async()=>{const a=state.accounts.find(a=>a.id===b.dataset.renew);if(!a||!confirm('لینک قبلی '+a.full_name+' غیرفعال و لینک جدید ساخته شود؟'))return;b.disabled=true;try{const result=await request('/api/admin/invite-reset','POST',{id:a.id});await loadAccounts();showInviteResults(result.invites);}catch(e){toast(e.message,true);b.disabled=false;}});
  }
  function bindDialogClose(dialog) {$$('[data-close-dialog]',dialog).forEach(b=>b.onclick=()=>dialog.close());}
  $$('dialog').forEach(dialog=>{bindDialogClose(dialog);dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});});
  $('#help-button').onclick=()=>$('#help-dialog').showModal();
  $('#my-form-button').onclick=()=>{if(!state.dirty||confirm('تغییرات ذخیره نشده است. پاسخ ذخیره‌شده دوباره دریافت شود؟'))loadMine();};
  $('#admin-button').onclick=loadAdmin;
  $('#logout-button').onclick=async()=>{if(state.dirty&&!confirm('تغییرات ذخیره نشده است. از حساب خارج شوید؟'))return;state.user=null;state.isAdmin=false;state.dirty=false;state.survey=blankSurvey();apiToken='';inviteToken='';pendingSave=null;$('#app-content').innerHTML='';$('#login-form').reset();setLoginMode(loginMode);updateHeader();};
  $('#toggle-password').onclick=()=>{const input=$('#login-password'),show=input.type==='password';input.type=show?'text':'password';$('#toggle-password').textContent=show?'پنهان':'نمایش';$('#toggle-password').setAttribute('aria-pressed',String(show));};
  $('#admin-entry-button').onclick=()=>setLoginMode('admin');
  $('#participant-entry-button').onclick=()=>setLoginMode('participant');
  $('#login-form').onsubmit=async e=>{e.preventDefault();errorBox('','login-error');if(!apiReady)return;if(loginMode==='participant'&&!inviteToken)return errorBox('از لینک اختصاصی ایمیل خود وارد شوید.','login-error');$('#login-submit').disabled=true;try{const data=await request('/api/login','POST',{email:$('#login-email').value.trim().toLowerCase(),password:$('#login-password').value});apiToken=loginMode==='admin'?data.token:inviteToken;$('#login-password').value='';await afterLogin(data.user,data.survey);}catch(ex){errorBox(ex.message,'login-error');}finally{$('#login-submit').disabled=!apiReady||(!inviteToken&&loginMode==='participant');}};
  window.addEventListener('beforeunload',e=>{if(state.dirty){e.preventDefault();e.returnValue='';}});
  async function initialize() {
    const fragment=new URLSearchParams(location.hash.slice(1));
    inviteToken=fragment.get('invite') || '';
    if(location.hash==='#admin')loginMode='admin';
    if(inviteToken)history.replaceState(null,'',location.pathname+location.search);
    setLoginMode(loginMode);updateHeader();
    const status=$('#connection-status');
    if(!config.apiUrl){status.textContent='اتصال ثبت پاسخ‌ها در حال آماده‌سازی است.';return;}
    status.textContent='در حال اتصال به سامانه…';
    try{
      const data=await apiCall({action:'health'});
      if(data.apiVersion!=='zero-repetition/1'||data.ready!==true)throw new Error('تنظیمات اتصال سامانه کامل نیست.');
      apiReady=true;status.hidden=true;setLoginMode(loginMode);
      if(inviteToken){const login=await request('/api/login','POST',{});apiToken=inviteToken;await afterLogin(login.user,login.survey);}
    }catch(e){status.textContent='اتصال به سامانه برقرار نشد؛ پاسخ جدیدی ثبت نمی‌شود.';errorBox(e.message,'login-error');}
  }
  initialize();
})();
