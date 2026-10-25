'use strict';
(() => {
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fa = v => Number(v || 0).toLocaleString('fa-IR', {maximumFractionDigits: 1});
  const freq = {daily:'روزانه', weekly:'هفتگی', monthly:'ماهانه'};
  const months = {daily:22, weekly:4.33, monthly:1};
  const ordinals = ['اول', 'دوم', 'سوم'];
  const labels = ['مشخصات', 'وضعیت فعالیت', 'کار اول', 'کار دوم', 'کار سوم', 'بازبینی'];
  const blankTask = () => ({title:'', steps:'', count:'', frequency:'daily', minutes:'', tools:'', human_decision:''});
  const blankSurvey = () => ({full_name:'', department:'', job_title:'', no_repetitive_tasks:false, tasks:[blankTask(),blankTask(),blankTask()], revision:0, status:'draft'});
  const state = {user:null, survey:blankSurvey(), step:0, dirty:false, busy:false, responses:[], accounts:[], isAdmin:false, sheetsConfigured:false};
  let toastTimer;
  let apiToken='',inviteToken='',loginMode='participant',apiReady=false,pendingSave=null,pendingStart=null;
  const config=window.ZERO_REPETITION_CONFIG || {};
  let preferredApiUrl='';
  const tools=window.ZERO_REPETITION_TOOLS;
  let currentMatches=[];
  let guideAccepted=false;
  function updateGuideGate(){
    const needsGuide=!state.user&&loginMode==='participant'&&!inviteToken&&!guideAccepted;
    $('#event-guide').hidden=!needsGuide;
    $('#login-card').hidden=!!state.user||needsGuide;
    if(needsGuide)requestAnimationFrame(checkGuideEnd);
  }
  function checkGuideEnd(){
    const area=$('#event-guide-scroll');
    if(!$('#event-guide').hidden&&area.clientHeight>0&&area.scrollHeight-area.scrollTop-area.clientHeight<=12){
      $('#guide-read').disabled=false;
      $('#guide-read-status').textContent='پس از تأیید مطالعه می‌توانید پرسشنامه را شروع کنید';
    }
  }

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
    const address = config.apiUrl;
    if (!address) throw new Error('اتصال سامانه هنوز فعال نشده است');
    const url = new URL(address);
    if (url.protocol !== 'https:') throw new Error('آدرس اتصال سامانه معتبر نیست');
    
    const endpoints = [url.href];
    // Supabase serves both hostnames from the same project and database.
    const project = /^([a-z]{20})\.supabase\.co$/.exec(url.hostname);
    const route = /^\/functions\/v1\/([a-z0-9-]+)$/.exec(url.pathname);
    if (project && route && !url.port && !url.username && !url.password && !url.search && !url.hash) {
      endpoints.push('https://' + project[1] + '.functions.supabase.co/' + route[1]);
    }
    if (endpoints.includes(preferredApiUrl)) {
      endpoints.splice(endpoints.indexOf(preferredApiUrl), 1);
      endpoints.unshift(preferredApiUrl);
    }
    const payload = JSON.stringify(body);
    const readActions = ['health', 'admin_login', 'invite_login', 'survey_get', 'responses_list', 'response_get', 'invites_list'];
    const canReadAgain = readActions.includes(body.action);
    const hasRequestId = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.request_id || '');
    // A second write uses the exact same ID and payload. The server deduplicates it.
    const canFailOver = canReadAgain || (hasRequestId && ['participant_start', 'survey_save'].includes(body.action));
    const temporary = error => error.name === 'AbortError' || error.name === 'TypeError' || [502, 503, 504].includes(error.status);
    async function send(endpoint, controller) {
      const timer = setTimeout(() => controller.abort(), 45000);
      try {
        const response = await fetch(endpoint, {
          method: 'POST', mode: 'cors', credentials: 'omit', cache: 'no-store',
          redirect: 'error', referrerPolicy: 'no-referrer', signal: controller.signal,
          headers: { 'Content-Type': 'text/plain;charset=UTF-8', Accept: binary ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/json' },
          body: payload
        });
        const type = response.headers.get('Content-Type') || '';
        if (binary && response.ok && !type.includes('application/json')) {
          const blob = await response.blob();
          const signature = new Uint8Array(await blob.slice(0, 4).arrayBuffer());
          if (signature[0] !== 80 || signature[1] !== 75 || signature[2] !== 3 || signature[3] !== 4) throw new Error('فایل اکسل معتبر دریافت نشد');
          return blob;
        }
        let result;
        try { result = await response.json(); }
        catch { const error = new Error('پاسخ معتبر از سامانه دریافت نشد؛ دوباره تلاش کنید'); error.status = response.status; throw error; }
        if (!response.ok || result?.ok !== true) {
          const error = new Error(result?.message || 'درخواست انجام نشد؛ دوباره تلاش کنید');
          error.status = response.status; error.code = result?.code; throw error;
        }
        return result;
      } finally { clearTimeout(timer); }
    }
    try {
      if (body.action === 'health' && endpoints.length > 1) {
        // Probe both routes without participant data; use the first healthy route.
        const controllers = endpoints.map(() => new AbortController());
        try {
          const winner = await Promise.any(endpoints.map(async (endpoint, i) => ({ endpoint, result: await send(endpoint, controllers[i]) })));
          preferredApiUrl = winner.endpoint;
          return winner.result;
        } catch (error) {
          throw error.errors.find(item => !temporary(item)) || error.errors[0];
        } finally { controllers.forEach(controller => controller.abort()); }
      }
      const attempts = endpoints.length > 1 ? (canFailOver ? endpoints : [endpoints[0]]) : (canReadAgain ? [endpoints[0], endpoints[0]] : endpoints);
      for (let i = 0; i < attempts.length; i++) {
        try {
          const result = await send(attempts[i], new AbortController());
          preferredApiUrl = attempts[i];
          return result;
        } catch (error) {
          if (i + 1 < attempts.length && temporary(error)) continue;
          throw error;
        }
      }
    } catch (error) {
      if (error.name === 'AbortError') throw new Error('پاسخ سرور دیر رسید. اطلاعات واردشده حفظ شده است؛ دوباره تلاش کنید');
      if (error.name === 'TypeError') throw new Error('ارتباط با سرور برقرار نشد. اطلاعات واردشده حفظ شده است؛ اتصال اینترنت را بررسی و دوباره تلاش کنید');
      throw error;
    }
  }
  async function request(path,method='GET',data) {
    if(path==='/api/logout')return {ok:true};
    let action,payload=data || {},token=apiToken;
    if(path==='/api/login'){
      if(loginMode==='admin')return apiCall({action:'admin_login',username:data.username,secret:data.password});
      if(inviteToken)return apiCall({action:'invite_login',token:inviteToken,username:data.username});
      if(!pendingStart||pendingStart.data.username!==data.username)pendingStart={action:'participant_start',request_id:crypto.randomUUID(),data:{username:data.username,access_key:(crypto.randomUUID()+crypto.randomUUID()).replaceAll('-','')}};
      return apiCall(pendingStart);
    }
    if(path==='/api/survey')action=method==='GET'?'survey_get':'survey_save';
    else if(path==='/api/admin/responses')action='responses_list';
    else if(path.startsWith('/api/admin/response/')){action='response_get';payload={id:decodeURIComponent(path.split('/').pop())};}
    else if(path==='/api/admin/accounts')action=method==='GET'?'invites_list':'invite_create';
    else if(path==='/api/admin/reopen')action='reopen';
    else if(path==='/api/admin/account-delete')action='account_delete';
    else if(path==='/api/admin/invite-reset')action='invite_reset';
    else if(path==='/api/admin/sheets-sync')action='sheets_sync';
    else throw new Error('عملیات معتبر نیست');
    const body={action,token,data:payload};
    if(['survey_save','reopen','invite_create','invite_reset','account_delete','sheets_sync'].includes(action)){
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
    $('#login-username-field').hidden=false;
    $('#login-username').required=true;
    $('#login-username').autocomplete=admin?'username':'off';
    $('#login-username').type=admin?'text':'search';
    $('#login-username').name=admin?'username':'survey-handle';
    $('#login-password').disabled=!admin;
    if(!admin&&!inviteToken){$('#login-username').value='';$('#login-username').readOnly=true;}else $('#login-username').readOnly=false;
    $('#login-password').required=admin;
    $('#login-password').value='';
    $('#login-submit').textContent=admin?'ورود به مدیریت ←':inviteToken?'ادامه پرسشنامه ←':'شروع پرسشنامه ←';
    $('#login-submit').disabled=!apiReady;
    $('#login-intro').textContent=admin?'با نام کاربری و رمز اختصاصی مدیریت وارد شوید':'نام سازمانی خود را وارد کنید';
    $('#login-foot-text').textContent=admin?'دسترسی مدیریت فقط با رمز اختصاصی مسئول طرح فعال می‌شود':inviteToken?'این لینک برای ادامه و مشاهده پاسخ‌های شماست':'شرکت برای همه همکاران آزاد است؛ حساب شما هنگام شروع ساخته می‌شود. پاسخ‌ها عمومی نیستند';
    $('#participant-entry-button').hidden=admin===false;
    errorBox('','login-error');
    updateGuideGate();
  }
  function updateHeader() {
    const logged = !!state.user;
    updateGuideGate();
    $('#app-content').hidden=!logged;
    $('#logout-button').hidden=!logged;
    $('#my-form-button').hidden=!logged || state.user.is_admin;
    $('#admin-button').hidden=!logged || !state.user.is_admin || state.user.must_change_password;
    $('#header-username').textContent=state.user?.username || '';
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
  function resumeNote() {
    if(!inviteToken)return '';
    const url=location.origin+location.pathname+'#invite='+inviteToken;
    return `<div class="soft-note resume-note"><p>برای ادامه در زمان دیگر، لینک خصوصی خود را نگه دارید و فقط برای خودتان ذخیره کنید</p><button type="button" class="button secondary" id="copy-resume-link">کپی لینک ادامه</button><input type="text" id="resume-link-input" value="${esc(url)}" dir="ltr" readonly hidden aria-label="لینک خصوصی ادامه پرسشنامه"></div>`;
  }
  function bindResumeLink() {
    const button=$('#copy-resume-link');if(!button)return;
    button.onclick=async()=>{const input=$('#resume-link-input');try{await navigator.clipboard.writeText(input.value);toast('لینک خصوصی ادامه کپی شد');}catch{input.hidden=false;input.focus();input.select();toast('لینک نمایش‌داده‌شده را برای خودتان کپی کنید');}};
  }
  async function loadMine() {
    state.isAdmin=false;updateHeader();
    $('#app-content').innerHTML='<div class="card form-card"><p class="muted">در حال دریافت پاسخ شما…</p></div>';
    try {
      const data=await request('/api/survey');
      state.survey=data.survey || {...blankSurvey(),full_name:state.user.full_name || '',department:state.user.department || ''};
      state.dirty=false;state.step=0;renderForm();
    } catch(e) {$('#app-content').innerHTML='<div class="card form-card"><p class="muted">دریافت اطلاعات انجام نشد</p><button type="button" id="retry-mine" class="button secondary">تلاش دوباره</button></div>';$('#retry-mine').onclick=loadMine;toast(e.message,true);}
  }
  function stepper() {
    return `<ol class="stepper" aria-label="مراحل پرسشنامه">${labels.map((label,i)=>({label,i})).filter(({i})=>!state.survey.no_repetitive_tasks||i<2||i===5).map(({label,i})=>`<li class="${i===state.step?'current':i<state.step?'complete':''}"><button type="button" class="step-button" data-step="${i}" ${i>state.step?'disabled':''} ${i===state.step?'aria-current="step"':''}><span class="step-number">${i<state.step?'✓':fa(i+1)}</span><span>${label}</span></button></li>`).join('')}</ol>`;
  }
  function field(label,key,value,{required=false,max=120,placeholder='',type='text',extra=''}={}) {
    return `<label class="field"><span>${label}${required?'': ' <span class="optional">(اختیاری)</span>'}</span><input type="${type}" data-field="${key}" value="${esc(value)}" ${required?'required':''} maxlength="${max}" placeholder="${esc(placeholder)}" ${extra}></label>`;
  }
  function information() {
    const s=state.survey;
    return `<h3 class="form-section-title">ابتدا کمی از خودتان بگویید</h3><p class="section-description">این اطلاعات کمک می‌کند فعالیت‌ها را به واحد مربوط پیوند دهیم</p><div class="fields-grid">${field('نام و نام خانوادگی','full_name',s.full_name,{required:true,max:120,placeholder:'نام و نام خانوادگی شما',extra:'autocomplete="name"'})}${field('واحد سازمانی','department',s.department,{required:true,max:100,placeholder:'مثلاً پشتیبانی'})}<div class="full-row">${field('سمت شغلی','job_title',s.job_title,{max:100,placeholder:'مثلاً کارشناس'})}</div></div><div class="soft-note">پرسشنامه برای حساب <bdi>${esc(state.user.username)}</bdi> ثبت می‌شود</div>`;
  }
  function activityChoice() {
    return `<h3 class="form-section-title">آیا کار تکراری دارید؟</h3><p class="section-description activity-purpose">یک تا سه کار تکراری معرفی کنید یا اعلام کنید که در حال حاضر کار تکراری ندارید</p><div class="activity-options"><label class="activity-option"><input type="radio" name="activity-choice" value="yes" ${!state.survey.no_repetitive_tasks?'checked':''}><span><strong>کار تکراری دارم</strong></span></label><label class="activity-option"><input type="radio" name="activity-choice" value="no" ${state.survey.no_repetitive_tasks?'checked':''}><span><strong>کار تکراری ندارم</strong><small>بدون واردکردن فعالیت، پاسخ شما ثبت می‌شود</small></span></label></div>`;
  }
  function taskUsed(t) {return ['title','steps','count','minutes','tools','human_decision'].some(k=>String(t?.[k]??'').trim());}
  function syncTaskRequired() {
    if(state.step<2||state.step>4)return;
    const required=state.step===2||taskUsed(state.survey.tasks[state.step-2]);
    $$('[data-field]',$('#app-content')).forEach(el=>{el.required=required&&!['frequency','human_decision'].includes(el.dataset.field);});
  }
  function taskForm(index) {
    const t=state.survey.tasks[index];
    return `<h3 class="form-section-title">کار تکراری ${ordinals[index]}</h3><p class="section-description">کاری را توصیف کنید که در روزها یا هفته‌های کاری بارها انجام می‌دهید</p>
      ${field('عنوان فعالیت','title',t.title,{required:true,max:160,placeholder:'مثلاً تجمیع گزارش‌های روزانه'})}
      <label class="field"><span>این کار را الان چگونه انجام می‌دهید؟</span><textarea data-field="steps" maxlength="4000" required placeholder="از دریافت اطلاعات تا پایان کار، مراحل فعلی را کوتاه و روشن بنویسید">${esc(t.steps)}</textarea></label>
      <div class="fields-grid"><div class="field"><label for="task-count">تعداد دفعات انجام</label><div class="number-group"><input id="task-count" data-field="count" type="number" inputmode="numeric" min="1" max="100000" step="1" value="${esc(t.count)}" required aria-label="تعداد دفعات"><select data-field="frequency" aria-label="دوره تکرار">${Object.entries(freq).map(([key,label])=>`<option value="${key}" ${t.frequency===key?'selected':''}>${label}</option>`).join('')}</select></div></div>
      <label class="field"><span>زمان تقریبی هر بار انجام</span><span class="input-unit"><input data-field="minutes" type="number" inputmode="decimal" min="0.01" max="100000" step="0.01" value="${esc(t.minutes)}" placeholder="مثلاً ۲۰" required><span class="unit">دقیقه</span></span></label></div>
      <label class="field"><span>از چه ابزارهایی استفاده می‌کنید؟</span><input data-field="tools" maxlength="500" value="${esc(t.tools)}" placeholder="نام نرم‌افزارها یا سامانه‌های مورد استفاده" required><span class="tool-chips"><button class="tool-chip" type="button" data-tool="Excel">Excel +</button><button class="tool-chip" type="button" data-tool="ایمیل">ایمیل +</button><button class="tool-chip" type="button" data-tool="سامانه داخلی">سامانه داخلی +</button><button class="tool-chip" type="button" data-tool="Google Sheets">Google Sheets +</button></span></label>
      <label class="field"><span>کدام مرحله به تصمیم یا تأیید انسان نیاز دارد؟ <span class="optional">(اختیاری)</span></span><textarea class="small-area" data-field="human_decision" maxlength="1000" placeholder="اگر مرحله‌ای نیاز به بررسی یا تأیید دارد، اینجا بنویسید">${esc(t.human_decision)}</textarea></label>`;
  }
  function summary(s) {
    return `<dl class="profile-summary"><div><dt>نام و نام خانوادگی</dt><dd>${esc(s.full_name)}</dd></div><div><dt>واحد سازمانی</dt><dd>${esc(s.department)}</dd></div><div><dt>سمت</dt><dd>${esc(s.job_title || '—')}</dd></div></dl>${s.no_repetitive_tasks?'<div class="soft-note">کار تکراری ندارم</div>':''}${s.tasks.filter(taskUsed).map((t,i)=>`<article class="review-task"><div class="review-task-top"><span class="task-bullet">${fa(i+1)}</span><h3>${esc(t.title || 'عنوان وارد نشده')}</h3></div><p>${esc(t.steps || 'مراحل هنوز وارد نشده است')}</p><div class="task-meta"><span>${fa(t.count)} بار ${freq[t.frequency]||''}</span><span>${fa(t.minutes)} دقیقه در هر بار</span><span>${esc(t.tools || 'ابزار مشخص نشده')}</span></div>${t.human_decision?`<p>تصمیم یا تأیید انسانی: ${esc(t.human_decision)}</p>`:''}</article>`).join('')}<div class="estimate"><div><span class="text-small">برآورد زمان این فعالیت‌ها در ماه</span><small>با فرض ۲۲ روز کاری و ۴٫۳۳ هفته در ماه</small></div><div><strong>${fa(surveyHours(s))}</strong> <span class="text-small">ساعت</span></div></div>`;
  }
  function review() {
    return `<h3 class="form-section-title">یک نگاه آخر به پاسخ‌ها</h3><p class="section-description">پس از ثبت نهایی، پاسخ‌ها برای بررسی در اختیار مدیران طرح قرار می‌گیرد</p>${summary(state.survey)}<label class="check-label"><input type="checkbox" id="confirm-survey" required><span>مشخصات و پاسخ خود را بررسی کرده‌ام و ثبت نهایی را تأیید می‌کنم</span></label>`;
  }
  function capture() {
    if(state.step===1){
      const none=$('input[name="activity-choice"]:checked')?.value==='no';
      if(none&&!state.survey.no_repetitive_tasks&&state.survey.tasks.some(taskUsed)){
        if(!confirm('با انتخاب کار تکراری ندارم، فعالیت‌های واردشده پاک می‌شوند؛ ادامه می‌دهید؟')){const yes=$('input[name="activity-choice"][value="yes"]');if(yes)yes.checked=true;return;}
      }
      if(none)state.survey.tasks=[blankTask(),blankTask(),blankTask()];
      state.survey.no_repetitive_tasks=none;return;
    }
    const target=state.step===0?state.survey:state.step>=2&&state.step<=4?state.survey.tasks[state.step-2]:null;
    if(target)$$('[data-field]',$('#app-content')).forEach(el=>{target[el.dataset.field]=el.value;});
  }
  function renderForm(turn = 0) {
    setBackground(state.step);
    if(state.survey.status==='submitted') return renderReceipt();
    document.body.classList.remove('is-admin');
    $('#app-content').innerHTML=`<div class="card form-card${turn > 0 ? ' turn-forward' : turn < 0 ? ' turn-back' : ''}"><div class="form-heading"><div><div class="card-kicker"><span class="status-dot"></span> پرسشنامه شناسایی فعالیت‌ها</div><h2>یک قدم برای کار بهتر</h2></div><span class="status-pill">پیش‌نویس</span></div>${stepper()}<form id="survey-form" class="question-panel">${state.step===0?information():state.step===1?activityChoice():state.step<5?taskForm(state.step-2):review()}<div id="form-error" class="error-box" role="alert" hidden></div><div class="form-actions"><button type="button" class="button quiet" id="save-draft">ذخیره پیش‌نویس</button><div class="form-actions-group">${state.step>0?'<button type="button" class="button secondary" id="previous-step">مرحله قبل</button>':''}<button type="submit" class="button primary" id="next-step">${state.step===5?'ثبت نهایی پاسخ‌ها':'ادامه'} <span aria-hidden="true">←</span></button></div></div><div class="save-indicator" id="save-indicator">${state.survey.updated_at?'آخرین ذخیره: '+new Date(state.survey.updated_at).toLocaleString('fa-IR'):'برای نگهداری دائمی، ذخیره پیش‌نویس یا ثبت نهایی را بزنید'}</div></form></div>`;
    $('#app-content').insertAdjacentHTML('beforeend',resumeNote());bindResumeLink();
    syncTaskRequired();
    $('#survey-form').oninput=()=>{capture();syncTaskRequired();state.dirty=true;$('#save-indicator').textContent='تغییرات جدید هنوز ذخیره نشده است';};
    $('#survey-form').onsubmit=async e=>{e.preventDefault();capture();if(state.step===5){if(!$('#confirm-survey').checked)return;return save('submit');}state.step=state.step===1&&state.survey.no_repetitive_tasks?5:state.step+1;renderForm(1);focusStep();};
    if(state.step>=2&&state.step<=4){
      $('.form-actions-group').insertAdjacentHTML('afterbegin','<button type="button" class="button secondary" id="finish-tasks">بازبینی و ثبت همین کارها</button>');
      $('#finish-tasks').onclick=()=>{capture();syncTaskRequired();if(!$('#survey-form').reportValidity())return;state.step=5;renderForm(1);focusStep();};
    }
    $('#save-draft').onclick=()=>save('draft');
    $('#previous-step')?.addEventListener('click',()=>{capture();state.step=state.step===5&&state.survey.no_repetitive_tasks?1:state.step-1;renderForm(-1);focusStep();});
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
      else {const indicator=$('#save-indicator');if(indicator)indicator.textContent='ذخیره شد · '+new Date().toLocaleTimeString('fa-IR',{hour:'2-digit',minute:'2-digit'});if(notify)toast('پیش‌نویس شما در سامانه ذخیره شد');}
      return true;
    }catch(e){errorBox(e.message);return false;}
    finally{state.busy=false;$$('.form-actions button').forEach(b=>b.disabled=false);}
  }
  function renderReceipt() {
    setBackground(5);
    const s=state.survey;
    $('#app-content').innerHTML=`<div class="card form-card"><div class="receipt-heading"><div class="receipt-icon" aria-hidden="true">✓</div><div class="card-kicker receipt-kicker">ثبت نهایی در سامانه</div><h2>${s.no_repetitive_tasks?'پاسخ «کار تکراری ندارم» ثبت شد':'پاسخ شما ثبت شد'}</h2><p>سپاس که برای بهتر شدن فرایندهای کاری همراه شدید</p><div class="tracking">کد پیگیری <b dir="ltr">${esc(s.id?.replaceAll('-','').slice(0,12).toUpperCase() || '')}</b></div></div>${summary(s)}<div class="soft-note">پاسخ‌ها در حساب شما قابل مشاهده است. برای اصلاح پاسخ ثبت‌شده، از مسئول طرح بخواهید ویرایش را باز کند</div></div>`;
    $('#app-content').insertAdjacentHTML('beforeend',resumeNote());bindResumeLink();
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
      const data=await request('/api/admin/responses');state.responses=data.responses;state.sheetsConfigured=Boolean(data.sheets_configured);
      renderAdmin(data);
    }catch(e){$('#app-content').innerHTML='<div class="card admin-card"><p>دریافت پاسخ‌ها انجام نشد</p><button class="button secondary" id="retry-admin" type="button">تلاش دوباره</button></div>';$('#retry-admin').onclick=loadAdmin;toast(e.message,true);}
  }
  function renderAdmin(data) {
    const submitted=state.responses.filter(s=>s.status==='submitted');
    const departments=[...new Set(state.responses.map(s=>s.department).filter(Boolean))].sort();
    const positions=[...new Set(state.responses.map(s=>s.job_title).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'fa'));
    $('#app-content').innerHTML=`<div class="card admin-card"><div class="admin-title-row"><div><div class="card-kicker"><span class="status-dot"></span> پنل مدیریت طرح</div><h2>فرصت‌ها از همین‌جا شروع می‌شوند</h2><p>پاسخ‌های همکاران، در یک نمای منظم و قابل جست‌وجو</p></div><div class="admin-buttons"><button class="button secondary" type="button" id="accounts-button">حساب‌های همکاران</button><button class="button secondary" type="button" id="refresh-responses">به‌روزرسانی</button><button class="button secondary" type="button" id="sync-sheets-button">ارسال این نما به شیت</button><button class="button primary" type="button" id="export-button">اکسل این نما ↓</button></div></div><div class="stats"><div class="stat"><span class="stat-label">پاسخ ثبت نهایی</span><span class="stat-value">${fa(submitted.length)}<span class="stat-unit">نفر</span></span></div><div class="stat"><span class="stat-label">فعالیت ثبت‌شده</span><span class="stat-value">${fa(submitted.reduce((sum,s)=>sum+s.tasks.filter(t=>t.title).length,0))}<span class="stat-unit">فعالیت</span></span></div><div class="stat"><span class="stat-label">حساب‌های شرکت‌کننده</span><span class="stat-value">${fa(data.registered_users)}<span class="stat-unit">نفر</span></span></div><div class="stat"><span class="stat-label">زمان فعالیت‌های ثبت‌شده در ماه</span><span class="stat-value">${fa(submitted.reduce((sum,s)=>sum+surveyHours(s),0))}<span class="stat-unit">ساعت</span></span></div></div><div class="filters"><input class="filter-input" id="response-search" placeholder="جست‌وجوی نام، نام کاربری یا عنوان فعالیت…" aria-label="جست‌وجو"><select class="filter-select" id="department-filter" aria-label="واحد"><option value="">همه واحدها</option>${departments.map(d=>`<option value="${esc(d)}">${esc(d)}</option>`).join('')}</select><select class="filter-select" id="position-filter" aria-label="پوزیشن"><option value="">همه پوزیشن‌ها</option>${positions.map(p=>`<option value="${esc(p)}">${esc(p)}</option>`).join('')}<option value="__empty__">سمت وارد نشده</option></select><select class="filter-select" id="status-filter" aria-label="وضعیت پاسخ"><option value="">همه وضعیت‌ها</option><option value="submitted">ثبت نهایی</option><option value="draft">پیش‌نویس</option></select></div><div class="table-scroll"><table class="responses-table"><thead><tr><th>نام و نام کاربری سازمانی</th><th>واحد</th><th>پوزیشن / سمت</th><th>فعالیت‌ها</th><th>زمان ماهانه</th><th>وضعیت پاسخ</th><th>ثبت در شیت</th><th>جزئیات</th></tr></thead><tbody id="response-rows"></tbody></table><div class="empty-state" id="empty-state" hidden><strong>هنوز پاسخی در این نما نیست</strong>با تغییر فیلترها یا دریافت پاسخ‌های جدید، موارد اینجا نمایش داده می‌شود</div></div><div class="table-foot"><span id="table-count"></span><span>زمان ماهانه، برآورد فعالیت‌هاست؛ معادل صرفه‌جویی قطعی نیست</span></div><div class="integration-note"><span>${state.sheetsConfigured?'پاسخ‌ها در سامانه محفوظ‌اند. ارسال این نمای فیلترشده به شیت، اختیاری است':'پاسخ‌ها در سامانه محفوظ‌اند. اتصال اختیاری شیت هنوز تنظیم نشده است'}</span></div></div>`;
    $('#response-search').oninput=renderRows;
    $('#department-filter').onchange=renderRows;
    $('#status-filter').onchange=renderRows;
    $('#position-filter').onchange=renderRows;
    $('#refresh-responses').onclick=loadAdmin;
    $('#sync-sheets-button').onclick=syncSheets;
    $('#accounts-button').onclick=loadAccounts;
    $('#export-button').onclick=exportExcel;
    renderRows();
  }
  function renderRows() {
    const matches=tools.selectResponses(state.responses,{query:$('#response-search').value,department:$('#department-filter').value,job_title:$('#position-filter').value,status:$('#status-filter').value});
    currentMatches=matches;
    $('#sync-sheets-button').disabled=!state.sheetsConfigured||!matches.length;
    $('#response-rows').innerHTML=matches.map(s=>`<tr><td class="person-cell"><b>${esc(s.full_name || 'نام وارد نشده')}</b><small dir="ltr">${esc(s.username)}</small></td><td>${esc(s.department || '—')}</td><td>${esc(s.job_title || '—')}</td><td>${s.no_repetitive_tasks?'کار تکراری ندارد':fa(s.tasks.filter(t=>t.title).length)+' فعالیت'}</td><td>${fa(surveyHours(s))} ساعت</td><td>${pill(s.status)}</td><td>${pill(s.sync_state)}</td><td><button type="button" class="table-button" data-detail="${esc(s.id)}">مشاهده ←</button> <button type="button" class="table-button delete-user-button" data-delete-user="${esc(s.id)}">حذف کاربر</button></td></tr>`).join('');
    $('#empty-state').hidden=matches.length>0;$('#table-count').textContent=`نمایش ${fa(matches.length)} پاسخ از ${fa(state.responses.length)}`;
    bindDeleteUsers();
    $$('[data-detail]').forEach(b=>b.onclick=()=>showDetail(b.dataset.detail));
  }
  async function showDetail(id) {
    let s;
    try {s=(await request('/api/admin/response/'+encodeURIComponent(id))).survey;}
    catch(e){toast(e.message,true);return;}
    if(!s)return;
    $('#detail-content').innerHTML=`<div class="dialog-head"><span class="eyebrow-dark">جزئیات پاسخ</span><button class="icon-button" type="button" data-close-dialog aria-label="بستن">×</button></div><h2>${esc(s.full_name || s.username)}</h2><p dir="ltr">${esc(s.username)}</p>${summary(s)}<div class="form-actions"><span>${pill(s.status)}</span>${s.status==='submitted'?'<button type="button" class="button secondary" id="reopen-button">بازکردن ویرایش برای فرد</button>':''}</div>`;
    bindDialogClose($('#detail-dialog'));
    $('#reopen-button')?.addEventListener('click',async()=>{if(!confirm('ویرایش این پاسخ برای صاحب حساب باز شود؟'))return;try{await request('/api/admin/reopen','POST',{id});$('#detail-dialog').close();await loadAdmin();toast('ویرایش پاسخ باز شد');}catch(e){toast(e.message,true);}});
    if(!$('#detail-dialog').open)$('#detail-dialog').showModal();
  }
  function downloadBlob(blob,name) {
    const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
  }
  async function exportExcel() {
    const button=$('#export-button');button.disabled=true;
    try{const bytes=tools.buildXlsx(currentMatches);downloadBlob(new Blob([bytes],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),'Zero-Repeat-Responses-'+new Date().toISOString().slice(0,10)+'.xlsx');toast('اکسل همین نمای فیلترشده آماده شد');}
    catch(e){toast(e.message,true);}finally{button.disabled=false;}
  }
  async function syncSheets(){
    const button=$('#sync-sheets-button');button.disabled=true;
    const ids=currentMatches.map(s=>s.id);
    try{const result=await request('/api/admin/sheets-sync','POST',{ids});toast(fa(result.count)+' پاسخ به شیت ارسال شد');}
    catch(e){toast(e.message,true);}
    finally{await loadAdmin();}
  }
  async function loadAccounts() {
    try{
      const data=await request('/api/admin/accounts');
      state.accounts=data.accounts.map(a=>{const r=state.responses.find(r=>r.id===a.id);return {...a,full_name:r?.full_name||a.full_name||a.username,department:r?.department||a.department||''};});
      const publicUrl=location.origin+location.pathname;
      $('#accounts-content').innerHTML=`<div class="dialog-head"><span class="eyebrow-dark">حساب‌های همکاران</span><button class="icon-button" type="button" data-close-dialog aria-label="بستن">×</button></div><h2>شرکت برای همه همکاران آزاد است</h2><p>همین لینک عمومی را برای همکاران بفرستید. هر فرد با نام کاربری سازمانی خودش شروع می‌کند و حساب او خودکار ساخته می‌شود؛ نیازی به انتخاب افراد یا ساخت حساب توسط مدیر نیست. ظرفیت طرح ۳۰۰ نفر است</p><label class="field"><span>لینک عمومی پرسشنامه</span><input id="public-form-link" type="text" dir="ltr" readonly value="${esc(publicUrl)}"></label><button class="button secondary" type="button" id="copy-public-link">کپی لینک عمومی</button><div id="invite-results"></div><div class="account-list" id="account-list"></div>`;
      renderAccounts();bindDialogClose($('#accounts-dialog'));if(!$('#accounts-dialog').open)$('#accounts-dialog').showModal();
      $('#copy-public-link').onclick=async()=>{const input=$('#public-form-link');try{await navigator.clipboard.writeText(input.value);toast('لینک عمومی کپی شد');}catch{input.focus();input.select();toast('لینک عمومی را از کادر انتخاب‌شده کپی کنید');}};
    }catch(e){toast(e.message,true);}
  }
  function showInviteResults(invites) {
    if(!Array.isArray(invites)||!invites.length)return;
    $('#invite-results').innerHTML=`<div class="soft-note"><strong>لینک‌ها آماده‌اند</strong><p>هر لینک را فقط برای همان همکار بفرستید</p><button type="button" class="button secondary" id="download-invites">دریافت فهرست لینک‌ها</button></div>${invites.map((p,i)=>`<label class="field"><span>${esc(p.full_name)} · <bdi>${esc(p.username)}</bdi></span><input dir="ltr" type="text" readonly value="${esc(p.url)}" id="invite-link-${i}"><button class="button secondary" type="button" data-copy-invite="${i}">کپی لینک</button></label>`).join('')}`;
    $$('[data-copy-invite]').forEach(b=>b.onclick=async()=>{const input=$('#invite-link-'+b.dataset.copyInvite);try{await navigator.clipboard.writeText(input.value);toast('لینک کپی شد');}catch{input.focus();input.select();toast('لینک را از کادر انتخاب‌شده کپی کنید');}});
    $('#download-invites').onclick=()=>{const safe=v=>{v=String(v??'');if(/^[=+\-@\t\r]/.test(v))v="'"+v;return '"'+v.replaceAll('"','""')+'"';};const rows=[['نام و نام خانوادگی','نام کاربری سازمانی','واحد','لینک اختصاصی'],...invites.map(p=>[p.full_name,p.username,p.department,p.url])];downloadBlob(new Blob(['\uFEFF'+rows.map(r=>r.map(safe).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}),'Zero-Repeat-Private-Invites.csv');};
    $('#invite-results').scrollIntoView({block:'nearest',behavior:'smooth'});
  }
  function renderAccounts() {
    $('#account-list').innerHTML=state.accounts.length?state.accounts.map(a=>`<div class="account-row"><div><strong>${esc(a.full_name)}</strong><small><bdi>${esc(a.username)}</bdi> · ${esc(a.department)}</small></div><button type="button" class="table-button" data-renew="${esc(a.id)}">بازیابی لینک ادامه</button><button type="button" class="table-button delete-user-button" data-delete-user="${esc(a.id)}">حذف کاربر</button></div>`).join(''):'<p>هنوز همکار جدیدی اضافه نشده است</p>';
    bindDeleteUsers();
    $$('[data-renew]').forEach(b=>b.onclick=async()=>{const a=state.accounts.find(a=>a.id===b.dataset.renew);if(!a||!confirm('لینک قبلی '+a.full_name+' غیرفعال و لینک جدید ساخته شود؟'))return;b.disabled=true;try{const result=await request('/api/admin/invite-reset','POST',{id:a.id});await loadAccounts();showInviteResults(result.invites);}catch(e){toast(e.message,true);b.disabled=false;}});
  }
  function bindDeleteUsers() {
    $$('[data-delete-user]').forEach(button=>button.onclick=async()=>{
      const id=button.dataset.deleteUser;
      const person=state.responses.find(x=>x.id===id)||state.accounts?.find(x=>x.id===id);
      if(!person)return;
      if(!confirm('حساب '+(person.full_name||person.username)+' ('+person.username+') و همه پاسخ‌های او از سامانه حذف شود؟\nاین کار برگشت‌پذیر نیست و لینک ادامه قبلی غیرفعال می‌شود. نسخه‌های قبلی در شیت و اکسل حذف نمی‌شوند'))return;
      button.disabled=true;
      try{
        await request('/api/admin/account-delete','POST',{id});
        const accountsOpen=$('#accounts-dialog').open;
        $('#detail-dialog').close();
        await loadAdmin();
        if(accountsOpen)await loadAccounts();
        toast('حساب و پاسخ‌های کاربر از سامانه حذف شد');
      }catch(e){toast(e.message,true);button.disabled=false;}
    });
  }
  function bindDialogClose(dialog) {$$('[data-close-dialog]',dialog).forEach(b=>b.onclick=()=>dialog.close());}
  $$('dialog').forEach(dialog=>{bindDialogClose(dialog);dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});});
  $('#help-button').onclick=()=>$('#help-dialog').showModal();
  $('#my-form-button').onclick=()=>{if(!state.dirty||confirm('تغییرات ذخیره نشده است. پاسخ ذخیره‌شده دوباره دریافت شود؟'))loadMine();};
  $('#admin-button').onclick=loadAdmin;
  $('#logout-button').onclick=async()=>{if(state.dirty&&!confirm('تغییرات ذخیره نشده است. از حساب خارج شوید؟'))return;state.user=null;state.isAdmin=false;state.dirty=false;state.survey=blankSurvey();apiToken='';inviteToken='';pendingSave=null;pendingStart=null;history.replaceState(null,'',location.pathname+location.search+(loginMode==='admin'?'#admin':''));$('#app-content').innerHTML='';$('#login-form').reset();setLoginMode(loginMode);updateHeader();};
  $('#toggle-password').onclick=()=>{const input=$('#login-password'),show=input.type==='password';input.type=show?'text':'password';$('#toggle-password').textContent=show?'پنهان':'نمایش';$('#toggle-password').setAttribute('aria-pressed',String(show));};
  $('#admin-entry-button').onclick=()=>setLoginMode('admin');
  $('#participant-entry-button').onclick=()=>setLoginMode('participant');
  function enableHandleEntry(){
    const input=$('#login-username');
    if(loginMode==='participant'&&!inviteToken&&input.readOnly){input.value='';input.readOnly=false;}
  }
  $('#login-username').addEventListener('focus',enableHandleEntry);
  $('#login-username').addEventListener('pointerdown',enableHandleEntry);
  $('#login-username').addEventListener('keydown',enableHandleEntry);
  $('#event-guide-scroll').addEventListener('scroll',checkGuideEnd,{passive:true});
  window.addEventListener('resize',checkGuideEnd);
  $('#guide-read').addEventListener('change',()=>{$('#guide-continue').disabled=$('#guide-read').disabled||!$('#guide-read').checked;});
  $('#guide-continue').onclick=()=>{
    if($('#guide-read').disabled||!$('#guide-read').checked)return;
    guideAccepted=true;updateGuideGate();$('#login-username').focus({preventScroll:true});
  };
  $('#login-form').onsubmit=async e=>{
    e.preventDefault();errorBox('','login-error');if(!apiReady)return;$('#login-submit').disabled=true;
    if(loginMode==='participant'&&!inviteToken&&!guideAccepted){$('#login-submit').disabled=false;updateGuideGate();return;}
    try{
      const data=await request('/api/login','POST',{username:$('#login-username').value.trim().toLowerCase(),password:$('#login-password').value});
      $('#connection-status').hidden=true;$('#connection-retry').hidden=true;
      if(loginMode==='admin')apiToken=data.token;
      else{inviteToken=data.token||inviteToken;apiToken=inviteToken;pendingStart=null;history.replaceState(null,'',location.pathname+location.search+'#invite='+inviteToken);}
      $('#login-password').value='';await afterLogin(data.user,data.survey);
    }catch(ex){errorBox(ex.message,'login-error');}finally{$('#login-submit').disabled=!apiReady;}
  };
  window.addEventListener('beforeunload',e=>{if(state.dirty){e.preventDefault();e.returnValue='';}});
  async function checkConnection(){
    const status=$('#connection-status'),retry=$('#connection-retry');
    status.hidden=false;retry.hidden=true;retry.disabled=true;
    status.textContent='در حال اتصال به سامانه…';
    try{
      const data=await apiCall({action:'health'});
      if(data.apiVersion!=='zero-repetition/3'||data.ready!==true)throw new Error('تنظیمات اتصال سامانه کامل نیست');
      status.hidden=true;
    }catch(e){status.textContent=e.message;retry.hidden=false;}
    finally{retry.disabled=false;}
  }
  $('#connection-retry').onclick=checkConnection;
  async function initialize() {
    const fragment=new URLSearchParams(location.hash.slice(1));
    inviteToken=fragment.get('invite') || '';
    if(location.hash==='#admin')loginMode='admin';
    if(!inviteToken&&loginMode==='participant')$('#login-username').value='';
    if(inviteToken){
      try{const claim=JSON.parse(atob(inviteToken.split('.')[1].replaceAll('-','+').replaceAll('_','/')));if(typeof claim.username==='string'&&/^[a-z][a-z0-9._-]{0,63}$/.test(claim.username))$('#login-username').value=claim.username;}catch{}
    }
    apiReady=Boolean(config.apiUrl);setLoginMode(loginMode);updateHeader();
    const status=$('#connection-status');
    if(!config.apiUrl){status.textContent='اتصال ثبت پاسخ‌ها در حال آماده‌سازی است';return;}
    await checkConnection();
    if(inviteToken&&loginMode==='participant')$('#login-username').focus({preventScroll:true});
  }
  initialize();
})();

