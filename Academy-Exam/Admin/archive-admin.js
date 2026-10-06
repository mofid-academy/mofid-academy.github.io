/* Academy archive/results UI. Private data is fetched with Header Auth and kept in memory. */
(function(){
  'use strict';
  const ENDPOINT='https://miladmirsheriseyed.app.n8n.cloud/webhook/academy-archive-v5';
  const protocol='academy-private-v5',controllers=new Set();
  let ready=false,healthPromise=null,view='',archives=[],runs=[],results=[],selectedRun='',resultEpoch=0,busy=false,publishAttempt=null,panel,archiveBtn,resultBtn,dialog;
  const api=()=>window.__ACADEMY_ADMIN__;
  const clone=x=>JSON.parse(JSON.stringify(x));
  const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
  const date=s=>{try{return new Date(s).toLocaleString('fa-IR',{timeZone:'Asia/Tehran'});}catch{return s;}};
  const fa=n=>Number(n).toLocaleString('fa-IR');
  const say=(m,type='')=>{api()?.status(m,type);const n=panel?.querySelector('.academy-private-message');if(n){n.textContent=m;n.className='academy-private-message '+type;}};
  const error=e=>say(String(e?.message||e),'error');
  async function call(action,data={},timeout=60000){
    const key=api()?.token();if(!key)throw Error('ابتدا از «اتصال ادمین» وارد شوید.');
    const ctrl=new AbortController();controllers.add(ctrl);const timer=setTimeout(()=>ctrl.abort(),timeout);
    try{
      const r=await fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'text/plain;charset=UTF-8','X-Academy-Admin-Key':key},body:JSON.stringify({action,...data}),cache:'no-store',credentials:'omit',redirect:'error',referrerPolicy:'no-referrer',signal:ctrl.signal});
      if(r.status===401||r.status===403)throw Error('رمز ادمین پذیرفته نشد. همان Credential ادمین را برای وب‌هوک آرشیو انتخاب کنید.');
      if(r.status===404){const e=Error('آرشیو هنوز فعال نشده است. ورک‌فلوی Academy Private Suite v5 را Import و Publish کنید.');e.code='NOT_INSTALLED';throw e;}
      if(!r.ok)throw Error('دریافت از سرور تأیید نشد. پاسخ قبلی را حفظ و دوباره بررسی کنید.');
      let out;try{out=await r.json();}catch{throw Error('سرور پاسخ قابل بررسی برنگرداند. ورک‌فلوی خصوصی را بررسی کنید.');}
      if(api()?.token()!==key)throw Error('جلسهٔ مدیریت پایان یافته است. دوباره وارد شوید.');
      if(out?.ok!==true)throw Error(typeof out?.message==='string'?out.message:'عملیات تأیید نشد.');
      return out;
    }catch(e){if(e.name==='AbortError'||e instanceof TypeError)throw Error('پاسخ سرور به‌موقع دریافت نشد. اطلاعات محفوظ است؛ با همان نسخه دوباره بررسی کنید.');throw e;}
    finally{clearTimeout(timer);controllers.delete(ctrl);}
  }
  async function health(){
    if(ready)return true;
    if(!healthPromise)healthPromise=call('health').then(r=>{if(r.protocol!==protocol||r.ready!==true)throw Error('نسخهٔ سرور خصوصی با پنل هماهنگ نیست.');ready=true;return true;}).finally(()=>{healthPromise=null;});
    return healthPromise;
  }
  async function pages(action,data={}){
    let out=[],after=0,seen=new Set();
    for(let page=0;page<1000;page++){
      const r=await call(action,{...data,after});if(!Array.isArray(r.items))throw Error('ساختار فهرست دریافت‌شده معتبر نیست.');out.push(...r.items);
      if(r.next===null||r.next===undefined)return out;
      if(!Number.isSafeInteger(r.next)||r.next<=after||seen.has(r.next))throw Error('صفحه‌بندی سرور تأیید نشد.');seen.add(r.next);after=r.next;
    }
    throw Error('فهرست بسیار بزرگ است؛ دریافت را در چند نوبت انجام دهید.');
  }
  function publicSource(bank){return api().sourceForBank({...clone(bank),mode:'managed',submitApproved:true});}
  function savedTiming(){const c=window.__ACADEMY_TIMING__||{};return {version:1,enabled:c.enabled!==false,durationMinutes:Number(c.durationMinutes||15),openAt:c.openAt||'',lastStartAt:c.lastStartAt||'',timeZone:'Asia/Tehran',timeEndpoint:c.timeEndpoint||''};}
  async function saveBank(bank,adopt=true){
    const before=JSON.stringify(api().bank());
    const r=await call('save',{bank:{...bank,mode:'managed',submitApproved:true},source:publicSource(bank),timing:savedTiming()});
    if(r.stored!==true||!r.template_id||!r.bank)throw Error('ثبت نسخهٔ آرشیو تأیید نشد.');
    if(adopt&&JSON.stringify(api().bank())===before)api().questions(r.bank);return r;
  }
  function action(label,fn,primary=false){const b=el('button',label,primary?'primary':'');b.type='button';b.onclick=()=>task(b,fn);return b;}
  async function task(button,fn){if(busy)return;busy=true;button.disabled=true;try{await fn();}catch(e){error(e);}finally{busy=false;button.disabled=false;}}
  function open(which){
    view=which;document.querySelector('.studio').classList.add('academy-private-mode');panel.hidden=false;
    document.querySelectorAll('.rail>button').forEach(b=>b.classList.toggle('active',b===(which==='archive'?archiveBtn:resultBtn)));
    which==='archive'?drawArchive():drawResults();
  }
  function leave(){view='';panel.hidden=true;document.querySelector('.studio').classList.remove('academy-private-mode');dialog?.close();}
  function frame(title,description){
    panel.replaceChildren(el('h1',title),el('p',description,'academy-private-lead'));
    panel.append(el('p','','academy-private-message'));const tools=el('div',undefined,'academy-private-tools');panel.append(tools);return tools;
  }
  function authHint(){panel.append(el('p','برای مشاهدهٔ اطلاعات خصوصی، از دکمهٔ اتصال ادمین بالای صفحه وارد شوید.','tip'));}
  async function refreshArchive(){await health();archives=await pages('list');if(view==='archive')drawArchive();}
  async function refreshRuns(){await health();runs=(await pages('runs')).sort((a,b)=>b.created.localeCompare(a.created));if(!runs.some(r=>r.key===selectedRun))selectedRun=runs.find(r=>r.state==='active')?.key||runs[0]?.key||'';}
  function drawArchive(){
    const tools=frame('آزمون‌های گذشته','هر نسخه، سؤال‌ها، کلید خصوصی و ظاهر فرم را نگه می‌دارد. انتشار دوباره، نوبت مستقل برای پاسخ‌های جدید می‌سازد.');
    tools.append(action('بررسی اتصال و دریافت آرشیو',async()=>{await refreshArchive();say('اتصال خصوصی و دریافت آرشیو تأیید شد.','success');}),action('ذخیرهٔ آزمون فعلی در آرشیو',async()=>{await health();const b=api().bank();if(!b?.questions?.length)throw Error('ابتدا سؤال‌ها را وارد کنید.');const r=await saveBank(b);await refreshArchive();say(r.ready?'نسخهٔ آزمون در آرشیو خصوصی ثبت شد.':'پیش‌نویس ثبت شد؛ گزینهٔ صحیح سؤال‌های تستی را کامل کنید.','success');},true),action('افزودن آزمون‌های قبلی از شیت',importSheet));
    if(!api()?.token()){authHint();return;}
    const search=el('input');search.type='search';search.placeholder='جست‌وجوی عنوان آزمون';search.setAttribute('aria-label','جست‌وجوی آرشیو');panel.append(search);
    const list=el('div',undefined,'academy-private-cards');panel.append(list);
    function draw(){list.replaceChildren();const filtered=archives.filter(a=>a.title.includes(search.value.trim())).sort((a,b)=>b.created.localeCompare(a.created));
      if(!filtered.length)list.append(el('p',ready?'آرشیو هنوز خالی است. آزمون فعلی یا آزمون‌های شیت را ذخیره کنید.':'برای شروع، بررسی اتصال و دریافت آرشیو را بزنید.','tip'));
      for(const a of filtered){const c=el('article',undefined,'academy-private-card');c.append(el('h2',a.title),el('p',fa(a.question_count)+' سؤال · '+date(a.created)+' · '+(a.state==='ready'?'آمادهٔ انتشار':'پیش‌نویس')));const id=el('small',a.exam_id||a.bank_id);id.dir='ltr';c.append(id);
        c.append(action('باز کردن در ویرایشگر',async()=>{const r=await call('load',{key:a.key});api().load(r.snapshot.source,r.snapshot.bank);leave();document.querySelector('[data-tab="questions"]').click();say('آزمون آرشیوی در ویرایشگر آماده شد. زمان‌بندی نوبت جدید را تنظیم و سپس منتشر کنید.','success');}),action('انتشار نوبت جدید',async()=>{const r=await call('load',{key:a.key});api().load(r.snapshot.source,r.snapshot.bank);api().confirm();},true));list.append(c);}
    }search.oninput=draw;draw();
  }
  async function importSheet(){
    await health();say('در حال دریافت آزمون‌های قبلی…');const r=await call('sheet_list');
    const known=new Set(archives.map(a=>a.exam_id)),pending=r.items.filter(a=>!known.has(a.exam_id));
    if(!pending.length){say('آزمون تازه‌ای برای افزودن از شیت وجود ندارد.','success');return;}
    let count=0;for(const exam of pending){say('ثبت در آرشیو: '+exam.title+' ('+fa(++count)+' از '+fa(pending.length)+')');const data=await call('sheet_load',{exam_id:exam.exam_id});await saveBank(data.bank,false);}
    await refreshArchive();say(fa(count)+' آزمون از شیت به آرشیو خصوصی اضافه شد.','success');
  }
  function uniqueRows(items){const map=new Map();for(const r of items.sort((a,b)=>a.id-b.id)){if(!map.has(r.submission_id))map.set(r.submission_id,r);else if(map.get(r.submission_id).submission?.fingerprint!==r.submission?.fingerprint)throw Error('ارسال‌های متفاوت با یک شناسه وجود دارند؛ بررسی ادمین لازم است.');}return [...map.values()];}
  async function refreshResults(){
    const epoch=++resultEpoch;
    await refreshRuns();const run=selectedRun;const incoming=run?uniqueRows(await pages('results',{run_id:run})):[];
    if(epoch!==resultEpoch||run!==selectedRun)return false;results=incoming;
    if(view==='results')drawResults();
    return true;
  }
  function drawResults(){
    const tools=frame('پاسخ‌ها و نتایج','نتایج و پاسخ صحیح فقط در این بخشِ مخصوص ادمین نمایش داده می‌شوند. نام‌ها همان نام واردشده در فرم هستند.');
    tools.append(action('دریافت / تازه‌سازی نتایج',async()=>{await refreshResults();say('نتایج دریافت شد.','success');}),action('دریافت فایل اکسل',async()=>{await refreshResults();if(!results.length)throw Error('در این نوبت هنوز پاسخی ثبت نشده است.');const bytes=window.AcademyExcel.create(results),url=URL.createObjectURL(new Blob([bytes],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'})),a=el('a');a.href=url;a.download='Academy-Results-'+selectedRun+'.xlsx';a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);say('فایل اکسل شامل خلاصهٔ نمرات و جزئیات پاسخ‌ها آماده شد.','success');},true));
    if(!api()?.token()){authHint();return;}
    const select=el('select');select.setAttribute('aria-label','انتخاب نوبت آزمون');
    if(!runs.length)select.append(el('option','پس از دریافت، نوبت‌های آزمون اینجا نمایش داده می‌شوند.'));
    for(const r of runs){const o=el('option',r.title+' — '+date(r.created)+(r.state==='active'?'':' — آمادهٔ انتشار'));o.value=r.key;select.append(o);}select.value=selectedRun;
    select.onchange=async()=>{selectedRun=select.value;results=[];try{await refreshResults();}catch(e){error(e);}};panel.append(select);
    const stats=el('div',undefined,'academy-private-stats');stats.append(el('span',fa(results.length)+' پاسخ ثبت‌شده'),el('span',fa(results.filter(r=>r.grading?.status==='graded').length)+' تصحیح‌شده'),el('span',fa(results.filter(r=>!r.sheet_synced).length)+' در انتظار شیت'));panel.append(stats);
    const search=el('input');search.type='search';search.placeholder='جست‌وجوی نام شرکت‌کننده';search.setAttribute('aria-label','جست‌وجوی نام شرکت‌کننده');panel.append(search);const wrap=el('div',undefined,'academy-private-table-wrap');panel.append(wrap);
    function draw(){wrap.replaceChildren();const table=el('table'),head=el('tr');['نام واردشده','دریافت','وضعیت','نمره / بارم','درصد','شیت','جزئیات'].forEach(t=>head.append(el('th',t)));const thead=el('thead');thead.append(head);table.append(thead);const tbody=el('tbody');
      for(const r of results.filter(r=>r.username.includes(search.value.trim()))){const g=r.grading||{},tr=el('tr');[r.username,date(r.received),g.status==='graded'?'تصحیح شده':'در انتظار بررسی',g.total_score==null?'—':fa(g.total_score)+' / '+fa(g.total_max),g.percent==null?'—':fa(g.percent)+'٪',r.sheet_synced?'ثبت شده':'در انتظار'].forEach(v=>tr.append(el('td',v)));const td=el('td');td.append(action('مشاهده پاسخ‌ها',async()=>showDetail(r)));tr.append(td);tbody.append(tr);}table.append(tbody);wrap.append(table);if(!results.length)wrap.append(el('p','در نوبت انتخابی هنوز پاسخی دریافت نشده است.','tip'));
    }search.oninput=draw;draw();
  }
  function showDetail(r){
    if(!api()?.token())throw Error('ابتدا وارد مدیریت شوید.');dialog.replaceChildren();const close=action('بستن',async()=>dialog.close());dialog.append(close,el('h2',r.username),el('p',(r.submission?.exam_title||'')+' — '+date(r.received)));
    const g=r.grading||{},scores=[];
    if(!g.details?.length){for(const a of r.submission?.answers||[]){const box=el('article',undefined,'academy-private-card');box.append(el('h3',a.question_id),el('p',a.answer||'بدون پاسخ'));dialog.append(box);}dialog.append(el('p','پاسخ محفوظ است؛ جزئیات تصحیح پس از تکمیل کار سرور نمایش داده می‌شود.','tip'));}
    for(const d of g.details||[]){const c=el('article',undefined,'academy-private-card');c.append(el('h3',fa(d.position)+'. '+d.question),el('p','پاسخ شرکت‌کننده: '+(d.answer||'بدون پاسخ')),el('p',(d.type==='mcq'?'پاسخ صحیح: ':'پاسخ نمونه: ')+(d.type==='mcq'?d.correct_answer:d.sample_answer)));
      const badge=el('p',({correct:'صحیح',wrong:'غلط',partial:'بخشی صحیح',unanswered:'بدون پاسخ',pending:'در انتظار بررسی'})[d.status]||'در انتظار بررسی','academy-grade '+d.status);c.append(badge);const label=el('label','نمره از '+fa(d.max_score)+' '),input=el('input');input.type='number';input.min='0';input.max=String(d.max_score);input.step='0.01';input.value=d.score===null?'':String(d.score);input.setAttribute('aria-label','نمره سؤال '+d.position);label.append(input);scores.push({question_id:d.question_id,max:d.max_score,input});c.append(label);dialog.append(c);
    }
    const feedback=el('textarea');feedback.rows=2;feedback.maxLength=1600;feedback.value=g.analysis||'';feedback.placeholder='یادداشت خصوصی ادمین';feedback.setAttribute('aria-label','یادداشت خصوصی ادمین');dialog.append(feedback);
    const tools=el('div',undefined,'academy-private-tools');
    if(scores.length)tools.append(action('ثبت نمرات بررسی‌شده',async()=>{const values=scores.map(s=>{if(s.input.value==='')throw Error('نمرهٔ همهٔ سؤال‌ها را کامل کنید.');const n=Number(s.input.value);if(!Number.isFinite(n)||n<0||n>s.max)throw Error('نمره باید در محدودهٔ بارم باشد.');return {question_id:s.question_id,score:n};});await call('manual_grade',{submission_id:r.submission_id,run_id:r.run_id,expected_grade:r.grade_revision,scores:values,analysis:feedback.value});dialog.close();await refreshResults();say('نمرات خصوصی ثبت شد؛ همگام‌سازی شیت ادامه پیدا می‌کند.','success');},true));
    tools.append(action('تلاش مجدد تصحیح / شیت',async()=>{await call('retry',{submission_id:r.submission_id,run_id:r.run_id});dialog.close();await refreshResults();say('پاسخ برای تصحیح و همگام‌سازی مجدد آماده شد.','success');}));dialog.append(tools);dialog.showModal();
  }
  async function publish(){
    if(busy)return;const a=api();if(!a?.token())return;a.busy(true);busy=true;document.getElementById('confirmPublish').close();
    try{
      await health();const bank=a.bank();if(!bank?.questions?.length)throw Error('بانک سؤال خالی است.');
      const source=publicSource(bank),timing=savedTiming(),signature=JSON.stringify({bank,source,timing});
      if(!publishAttempt||publishAttempt.signature!==signature)publishAttempt={signature,run_id:'run_'+crypto.randomUUID().replace(/-/g,'')};
      say('در حال ذخیرهٔ نسخهٔ خصوصی و آماده‌سازی نوبت جدید…');
      const prepared=await call('prepare',{bank:{...bank,mode:'managed',submitApproved:true},source,timing,run_id:publishAttempt.run_id});
      if(prepared.stored!==true||prepared.run_id!==publishAttempt.run_id||typeof prepared.source!=='string')throw Error('تأیید نوبت آزمون دریافت نشد.');
      const latest=await a.read();let sha;
      if(latest.source===prepared.source)sha=latest.sha;
      else {
        if(latest.sha!==a.sha())throw Error('فایل سایت هم‌زمان تغییر کرده است. پیش‌نویس در آرشیو محفوظ است؛ نسخهٔ سایت را تازه دریافت کنید.');
        say('آرشیو تأیید شد؛ در حال انتشار روی سایت…');
        try{const r=await a.write(prepared.source,latest.sha,'Academy: publish archived exam '+prepared.run_id);sha=r.content?.sha;if(!sha)throw Error('تأیید ذخیره دریافت نشد.');}
        catch(e){const check=await a.read();if(check.source!==prepared.source)throw e;sha=check.sha;}
      }
      a.published(prepared.source,sha,prepared.bank);selectedRun=prepared.run_id;publishAttempt=null;
      try{await call('activate',{key:prepared.run_id});}catch{say('فایل منتشرشده ذخیره شد؛ نشان‌گذاری نوبت در انتظار است. پاسخ‌ها به همین نوبت وصل خواهند شد.');}
      say('نسخهٔ خصوصی و فایل سایت ذخیره شد؛ انتشار Pages در حال بررسی است.','success');a.checkLive(prepared.source);
      archives=[];runs=[];results=[];
    }catch(e){error(e);}finally{busy=false;a.busy(false);}
  }
  function purge(){for(const c of controllers)c.abort();controllers.clear();ready=false;healthPromise=null;archives=[];runs=[];results=[];selectedRun='';publishAttempt=null;api()?.clearPrivate();dialog?.close();dialog?.replaceChildren();if(view)open(view);}
  function install(){
    if(!api()||!document.querySelector('.rail')){setTimeout(install,80);return;}
    const style=el('style');style.id='academy-private-style';style.textContent='.academy-private-mode .controls,.academy-private-mode .preview-zone{display:none}.academy-private-mode{grid-template-columns:176px minmax(0,1fr)!important}.academy-private-panel{grid-column:2/-1;overflow:auto;padding:clamp(16px,3vw,32px);min-width:0;background:#f6f9f8}.academy-private-panel[hidden]{display:none}.academy-private-panel h1{font-size:23px}.academy-private-lead{color:#55776b;max-width:900px}.academy-private-message{white-space:pre-wrap}.academy-private-message.error{color:#a03f39}.academy-private-message.success{color:#12634e}.academy-private-tools{display:flex;gap:9px;flex-wrap:wrap;margin:18px 0}.academy-private-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:16px;margin-top:20px}.academy-private-card{border:1px solid #d7e7e0;border-radius:14px;background:#fff;padding:16px;overflow-wrap:anywhere}.academy-private-card h2,.academy-private-card h3{font-size:15px}.academy-private-card button{margin:10px 0 0 8px}.academy-private-card p{white-space:pre-wrap}.academy-private-card small{color:#668578}.academy-private-stats{display:flex;gap:20px;flex-wrap:wrap;padding:16px 0}.academy-private-table-wrap{overflow:auto;margin-top:18px}.academy-private-panel table{width:100%;border-collapse:collapse;background:#fff}.academy-private-panel th,.academy-private-panel td{padding:12px;border-bottom:1px solid #d7e7e0;text-align:right;white-space:nowrap}.academy-private-panel th{background:#e7f6ef}.academy-private-panel input[type=search],.academy-private-panel select{max-width:650px;width:100%;padding:12px}.academy-private-detail{width:min(880px,90vw);max-width:90vw;max-height:88vh;overflow:auto}.academy-private-detail .academy-private-card{margin:12px 0}.academy-private-detail input{max-width:100px}.academy-grade.correct{color:#146548}.academy-grade.wrong{color:#a03f39}.academy-grade.partial,.academy-grade.pending{color:#906600}@media(max-width:640px){.academy-private-mode{display:flex!important}.academy-private-panel{width:100%;min-height:70vh;box-sizing:border-box}.academy-private-detail{padding:16px}}';document.head.append(style);
    panel=el('section',undefined,'academy-private-panel');panel.hidden=true;panel.setAttribute('aria-label','آرشیو و نتایج خصوصی');document.querySelector('.studio').append(panel);
    dialog=el('dialog',undefined,'academy-private-detail');dialog.setAttribute('aria-label','جزئیات خصوصی پاسخ‌ها');document.body.append(dialog);
    archiveBtn=el('button','آزمون‌های گذشته');archiveBtn.dataset.academyTab='archive';archiveBtn.onclick=()=>open('archive');resultBtn=el('button','پاسخ‌ها و نتایج');resultBtn.dataset.academyTab='results';resultBtn.onclick=()=>open('results');
    const rail=document.querySelector('.rail');rail.insertBefore(archiveBtn,rail.querySelector('.rail-foot'));rail.insertBefore(resultBtn,rail.querySelector('.rail-foot'));
    rail.addEventListener('click',e=>{if(e.target.closest('[data-tab]'))leave();});
    document.getElementById('confirmYes').onclick=publish;
    const connect=document.getElementById('connect'),originalConnect=connect.onclick;
    connect.onclick=async()=>{
      const t=document.getElementById('token').value.trim(),msg=document.getElementById('authMessage');
      if(!/^[\x21-\x7e]{16,128}$/.test(t)||/^(github_pat_|ghp_)/.test(t)){msg.textContent='رمز مخصوص ادمین را وارد کنید.';return;}
      connect.disabled=true;msg.textContent='در حال بررسی ورود خصوصی…';ready=false;healthPromise=null;api().session(t);
      try{await health();document.getElementById('auth').close();say('ورود مدیریت تأیید شد؛ آرشیو و نتایج خصوصی آماده است.','success');}
      catch(e){ready=false;api().session('');if(e.code==='NOT_INSTALLED'){document.getElementById('token').value=t;await originalConnect();}else msg.textContent=e.message;}
      finally{connect.disabled=false;}
    };
    document.getElementById('logout').addEventListener('click',purge);window.addEventListener('pagehide',purge);
    const originalAdopt=window.__ACADEMY_ON_BANK_ADOPTED__;
    window.__ACADEMY_ON_BANK_ADOPTED__=bank=>{originalAdopt?.(bank);if(!ready||!api().token())return;setTimeout(async()=>{if(busy)return;try{await saveBank(clone(bank));say('آزمون واردشده در آرشیو خصوصی ذخیره شد.','success');}catch(e){error(e);}},500);};
    window.__ACADEMY_ARCHIVE__={health,open,refreshArchive,refreshResults,publish,version:5};
  }
  install();
})();
