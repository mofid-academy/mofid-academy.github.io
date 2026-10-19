/* Academy archive/results UI. Private data is fetched with Header Auth and kept in memory. */
(function(){
  'use strict';
  const ENDPOINT='https://miladmirsheriam.app.n8n.cloud/webhook/academy-archive-v5';
  const protocol='academy-private-v5',controllers=new Set();
  let ready=false,healthPromise=null,view='',archives=[],runs=[],results=[],selectedRun='',resultEpoch=0,busy=false,publishAttempt=null,panel,archiveBtn,resultBtn,dialog,deletionDialog;
  let features=new Set(),hiddenKeys=new Set(),privateEpoch=0;
  const TIMING_PATH='/repos/mofid-academy/mofid-academy.github.io/contents/Academy-Exam/timing.json';
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
  async function health(force=false){
    if(ready&&!force)return true;
    if(!healthPromise)healthPromise=call('health').then(r=>{if(r.protocol!==protocol||r.ready!==true)throw Error('نسخهٔ سرور خصوصی با پنل هماهنگ نیست.');features=new Set(Array.isArray(r.features)?r.features:[]);ready=true;return true;}).finally(()=>{healthPromise=null;});
    return healthPromise;
  }
  function visibilityKeys(config){
    const value=config.hiddenResults;if(value===undefined)return new Set();
    if(!value||value.version!==1||!Array.isArray(value.keys)||value.keys.length>10000||value.keys.some(k=>typeof k!=='string'||!/^[0-9a-f]{64}$/.test(k)))throw Error('فهرست حذف‌های سامانه قابل بررسی نیست. تنظیمات مدیریت را بررسی کنید.');
    return new Set(value.keys);
  }
  async function visibilityKey(row){
    if(!/^run_[A-Za-z0-9_-]{16,100}$/.test(row.run_id||'')||!/^sub_[A-Za-z0-9_-]{8,150}$/.test(row.submission_id||''))throw Error('شناسهٔ پاسخ برای حذف از نمایش معتبر نیست.');
    const bytes=new TextEncoder().encode('academy-result-visibility-v1\u0000'+row.run_id+'\u0000'+row.submission_id);
    return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join('');
  }
  async function visibleRows(items,keys){
    const pairs=await Promise.all(items.map(async row=>({row,key:await visibilityKey(row)})));
    return pairs.filter(x=>!keys.has(x.key)&&x.row.grading?.status!=='deleted').map(x=>x.row);
  }
  async function configRequest(key,options={}){
    if(window.__ACADEMY_ADMIN_TRANSPORT__!=='n8n-v1'||typeof window.__ACADEMY_ADMIN_REQUEST__!=='function')throw Error('مسیر امن ادمین آماده نیست. پنل را دوباره باز کنید.');
    const epoch=privateEpoch,ctrl=new AbortController();controllers.add(ctrl);const timer=setTimeout(()=>ctrl.abort(),25000);
    try{
      const method=options.method||'GET',path=TIMING_PATH+(method==='PUT'?'':'?ref=main&live='+Date.now());
      const response=await window.__ACADEMY_ADMIN_REQUEST__({method,path,key,body:options.body?JSON.parse(options.body):undefined,signal:ctrl.signal});
      if(api()?.token()!==key||epoch!==privateEpoch)throw Error('جلسهٔ مدیریت پایان یافته است. دوباره وارد شوید.');
      if(!response.ok){const e=Error('ثبت یا دریافت تنظیمات حذف تأیید نشد.');e.httpStatus=response.status;throw e;}
      return await response.json();
    }finally{clearTimeout(timer);controllers.delete(ctrl);}
  }
  async function readVisibility(key=api()?.token()){
    if(!key)throw Error('ابتدا از «اتصال ادمین» وارد شوید.');
    const meta=await configRequest(key);let config;
    try{config=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(atob(meta.content.replace(/\s/g,'')),c=>c.charCodeAt(0))));}catch{throw Error('تنظیمات حذف از نمایش قابل خواندن نیست.');}
    if(!/^[0-9a-f]{40}$/.test(meta.sha||'')||!config||typeof config!=='object'||Array.isArray(config))throw Error('نسخهٔ تنظیمات حذف معتبر نیست.');
    return {meta,config,keys:visibilityKeys(config)};
  }
  async function hideResults(rows){
    const key=api()?.token(),epoch=privateEpoch,wanted=await Promise.all(rows.map(visibilityKey));let lastError;
    for(let attempt=0;attempt<3;attempt++){
      if(!key||api()?.token()!==key||epoch!==privateEpoch)throw Error('جلسهٔ مدیریت پایان یافته است. دوباره وارد شوید.');
      try{
        const current=await readVisibility(key);
        if(wanted.every(k=>current.keys.has(k)))return current.keys;
        const merged=new Set([...current.keys,...wanted]);if(merged.size>10000)throw Error('ظرفیت فهرست حذف‌ها تکمیل شده است.');
        const config={...current.config,hiddenResults:{version:1,keys:[...merged].sort(),revision:'vis_'+crypto.randomUUID().replace(/-/g,''),updatedAt:new Date().toISOString()}};
        const bytes=new TextEncoder().encode(JSON.stringify(config,null,2)+'\n');if(bytes.length>900000)throw Error('حجم تنظیمات حذف بیش از حد مجاز است.');
        let binary='';for(const byte of bytes)binary+=String.fromCharCode(byte);
        await configRequest(key,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({branch:'main',sha:current.meta.sha,message:'Academy: hide selected exam results',content:btoa(binary)})});
        const verified=await readVisibility(key);if(wanted.every(k=>verified.keys.has(k)))return verified.keys;
        throw Error('تأیید ذخیرهٔ حذف از نتایج دریافت نشد.');
      }catch(e){lastError=e;if(e.httpStatus&&![408,409,429,500,502,503,504].includes(e.httpStatus))throw e;}
    }
    throw Error('ثبت حذف از نتایج تأیید نشد. '+String(lastError?.message||'نتایج را تازه‌سازی کنید.'));
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
  async function refreshRuns(){await health(true);runs=(await pages('runs')).sort((a,b)=>b.created.localeCompare(a.created));if(!runs.some(r=>r.key===selectedRun))selectedRun=runs.find(r=>r.state==='active')?.key||runs[0]?.key||'';}
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
    await refreshRuns();const run=selectedRun;
    const [incoming,visibility]=await Promise.all([run?pages('results',{run_id:run}):Promise.resolve([]),readVisibility()]);
    const mergedKeys=new Set([...hiddenKeys,...visibility.keys]),visible=await visibleRows(uniqueRows(incoming),mergedKeys);
    if(epoch!==resultEpoch||run!==selectedRun)return false;hiddenKeys=mergedKeys;results=visible;
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
    function draw(){wrap.replaceChildren();const table=el('table'),head=el('tr');['نام واردشده','دریافت','وضعیت','نمره / بارم','درصد','شیت','عملیات'].forEach(t=>head.append(el('th',t)));const thead=el('thead');thead.append(head);table.append(thead);const tbody=el('tbody');
      const names=new Map();for(const r of results){if(!names.has(r.username))names.set(r.username,[]);names.get(r.username).push(r);}
      for(const r of results.filter(r=>r.username.includes(search.value.trim()))){const g=r.grading||{},tr=el('tr');[r.username,date(r.received),g.status==='graded'?'تصحیح شده':'در انتظار بررسی',g.total_score==null?'—':fa(g.total_score)+' / '+fa(g.total_max),g.percent==null?'—':fa(g.percent)+'٪',r.sheet_synced?'ثبت شده':'در انتظار'].forEach(v=>tr.append(el('td',v)));const td=el('td'),rowTools=el('div',undefined,'academy-result-actions');td.append(rowTools);rowTools.append(action('مشاهده پاسخ‌ها',async()=>showDetail(r)),deleteButton('حذف این ارسال',[r],'submission'));
        const same=names.get(r.username);if(same.length>1)rowTools.append(deleteButton('حذف همهٔ '+fa(same.length)+' ارسال این نام',same,'participant'));
        tr.append(td);tbody.append(tr);}table.append(tbody);wrap.append(table);if(!results.length)wrap.append(el('p','در نوبت انتخابی هنوز پاسخی دریافت نشده است.','tip'));
    }search.oninput=draw;draw();
  }
  function deleteButton(label,rows,scope){
    const button=action(label,async()=>deleteResults(rows,scope));button.classList.add('academy-delete');
    button.setAttribute('aria-label',label+' برای '+rows[0].username);return button;
  }
  function confirmDeletion(rows,scope){
    deletionDialog.replaceChildren();const name=rows[0].username,run=runs.find(r=>r.key===rows[0].run_id);
    deletionDialog.append(el('h2',scope==='participant'?'حذف شرکت‌کننده از نتایج این نوبت':'حذف این ارسال از نتایج'),el('p','نام واردشده: '+name),el('p','آزمون: '+(run?.title||'نوبت انتخاب‌شده')),el('p',fa(rows.length)+' ارسال انتخاب شده است. این رکوردها از فهرست نتایج و اکسل سامانه حذف می‌شوند.','academy-delete-warning'));
    if(scope==='participant')deletionDialog.append(el('p','همهٔ رکوردهای انتخاب‌شده با همین نام در این نوبت حذف می‌شوند. نام‌ها همان متن واردشده در فرم هستند.','tip'));
    const list=el('ul');for(const r of rows)list.append(el('li',date(r.received)+' — '+r.submission_id));deletionDialog.append(list);
    deletionDialog.append(el('p','اطلاعات ثبت‌شده در شیت حفظ می‌شود. حذف از نمایش در سامانه ذخیره می‌شود و با تازه‌سازی صفحه یا ورود از مرورگر دیگر برنمی‌گردد.','tip'));
    const tools=el('div',undefined,'academy-private-tools'),cancel=el('button','انصراف'),confirm=el('button','حذف '+fa(rows.length)+' ارسال','academy-delete');cancel.type=confirm.type='button';tools.append(cancel,confirm);deletionDialog.append(tools);
    return new Promise(resolve=>{let accepted=false;deletionDialog.addEventListener('close',()=>resolve(accepted),{once:true});cancel.onclick=()=>deletionDialog.close();confirm.onclick=()=>{accepted=true;deletionDialog.close();};deletionDialog.showModal();cancel.focus();});
  }
  async function deleteResults(rows,scope){
    if(!rows.length||rows.length>100)throw Error('در هر مرحله بین ۱ تا ۱۰۰ ارسال را حذف کنید.');
    const key=api()?.token(),run=rows[0].run_id,username=rows[0].username,epoch=privateEpoch;
    if(!key||rows.some(r=>r.run_id!==run||r.username!==username))throw Error('انتخاب رکوردهای حذف معتبر نیست. نتایج را تازه‌سازی کنید.');
    if(!await confirmDeletion(rows,scope))return;
    if(api()?.token()!==key||epoch!==privateEpoch)throw Error('جلسهٔ مدیریت پایان یافته است. دوباره وارد شوید.');
    resultEpoch++;
    say('در حال ثبت حذف از نتایج سامانه…');
    let saved;
    try{saved=await hideResults(rows);}
    catch(e){if(api()?.token()===key&&epoch===privateEpoch){try{await refreshResults();}catch{}}throw Error(String(e.message||e)+' پیش از تلاش مجدد، فهرست نتایج را بررسی کنید.');}
    if(epoch!==privateEpoch)throw Error('جلسهٔ مدیریت پایان یافته است. دوباره وارد شوید.');
    const remaining=await visibleRows(results,saved);
    if(epoch!==privateEpoch||api()?.token()!==key)throw Error('جلسهٔ مدیریت پایان یافته است. دوباره وارد شوید.');
    resultEpoch++;hiddenKeys=saved;results=remaining;dialog.close();
    if(view==='results')drawResults();
    say(fa(rows.length)+' ارسال از نتایج و اکسل سامانه حذف شد. اطلاعات شیت حفظ شده است.','success');
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
  function purge(){privateEpoch++;resultEpoch++;for(const c of controllers)c.abort();controllers.clear();ready=false;healthPromise=null;features=new Set();hiddenKeys=new Set();archives=[];runs=[];results=[];selectedRun='';publishAttempt=null;api()?.clearPrivate();dialog?.close();dialog?.replaceChildren();deletionDialog?.close();deletionDialog?.replaceChildren();if(view)open(view);}
  function install(){
    if(!api()||!document.querySelector('.rail')){setTimeout(install,80);return;}
    const style=el('style');style.id='academy-private-style';style.textContent='.academy-private-mode .controls,.academy-private-mode .preview-zone{display:none}.academy-private-mode{grid-template-columns:176px minmax(0,1fr)!important}.academy-private-panel{grid-column:2/-1;overflow:auto;padding:clamp(16px,3vw,32px);min-width:0;background:#f6f9f8}.academy-private-panel[hidden]{display:none}.academy-private-panel h1{font-size:23px}.academy-private-lead{color:#55776b;max-width:900px}.academy-private-message{white-space:pre-wrap}.academy-private-message.error{color:#a03f39}.academy-private-message.success{color:#12634e}.academy-private-tools{display:flex;gap:9px;flex-wrap:wrap;margin:18px 0}.academy-private-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:16px;margin-top:20px}.academy-private-card{border:1px solid #d7e7e0;border-radius:14px;background:#fff;padding:16px;overflow-wrap:anywhere}.academy-private-card h2,.academy-private-card h3{font-size:15px}.academy-private-card button{margin:10px 0 0 8px}.academy-private-card p{white-space:pre-wrap}.academy-private-card small{color:#668578}.academy-private-stats{display:flex;gap:20px;flex-wrap:wrap;padding:16px 0}.academy-private-table-wrap{overflow:auto;margin-top:18px}.academy-private-panel table{width:100%;border-collapse:collapse;background:#fff}.academy-private-panel th,.academy-private-panel td{padding:12px;border-bottom:1px solid #d7e7e0;text-align:right;white-space:nowrap}.academy-private-panel th{background:#e7f6ef}.academy-private-panel input[type=search],.academy-private-panel select{max-width:650px;width:100%;padding:12px}.academy-private-detail{width:min(880px,90vw);max-width:90vw;max-height:88vh;overflow:auto}.academy-private-detail .academy-private-card{margin:12px 0}.academy-private-detail input{max-width:100px}.academy-grade.correct{color:#146548}.academy-grade.wrong{color:#a03f39}.academy-grade.partial,.academy-grade.pending{color:#906600}@media(max-width:640px){.academy-private-mode{display:flex!important}.academy-private-panel{width:100%;min-height:70vh;box-sizing:border-box}.academy-private-detail{padding:16px}}';document.head.append(style);
    panel=el('section',undefined,'academy-private-panel');panel.hidden=true;panel.setAttribute('aria-label','آرشیو و نتایج خصوصی');document.querySelector('.studio').append(panel);
    dialog=el('dialog',undefined,'academy-private-detail');dialog.setAttribute('aria-label','جزئیات خصوصی پاسخ‌ها');document.body.append(dialog);
    deletionDialog=el('dialog',undefined,'academy-private-detail academy-delete-dialog');deletionDialog.setAttribute('aria-label','تأیید حذف پاسخ‌های انتخابی');document.body.append(deletionDialog);
    const deleteStyle=el('style');deleteStyle.textContent='.academy-result-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap;min-width:200px}.academy-delete{color:#a03f39;border-color:#dba9a5;background:#fff7f6}.academy-delete:disabled{opacity:.45;cursor:not-allowed}.academy-delete:not(:disabled):hover{background:#fbe9e7}.academy-delete-warning{color:#a03f39;font-weight:700}.academy-delete-dialog ul{max-height:230px;overflow:auto;overflow-wrap:anywhere}.academy-delete-dialog li{margin-block:10px}';document.head.append(deleteStyle);
    archiveBtn=el('button','آزمون‌های گذشته');archiveBtn.dataset.academyTab='archive';archiveBtn.onclick=()=>open('archive');resultBtn=el('button','پاسخ‌ها و نتایج');resultBtn.dataset.academyTab='results';resultBtn.onclick=()=>open('results');
    const rail=document.querySelector('.rail');rail.insertBefore(archiveBtn,rail.querySelector('.rail-foot'));rail.insertBefore(resultBtn,rail.querySelector('.rail-foot'));
    rail.addEventListener('click',e=>{if(e.target.closest('[data-tab]'))leave();});
    document.getElementById('confirmYes').onclick=publish;
    const connect=document.getElementById('connect'),originalConnect=connect.onclick;
    connect.onclick=async()=>{
      if(connect.disabled)return;
      ready=false;healthPromise=null;
      // Restore the existing bridge login; private operations keep their own Header Auth.
      await originalConnect();
    };
    document.getElementById('logout').addEventListener('click',purge);window.addEventListener('pagehide',purge);
    const originalAdopt=window.__ACADEMY_ON_BANK_ADOPTED__;
    window.__ACADEMY_ON_BANK_ADOPTED__=bank=>{originalAdopt?.(bank);if(!ready||!api().token())return;setTimeout(async()=>{if(busy)return;try{await saveBank(clone(bank));say('آزمون واردشده در آرشیو خصوصی ذخیره شد.','success');}catch(e){error(e);}},500);};
    window.__ACADEMY_ARCHIVE__={health,open,refreshArchive,refreshResults,publish,version:7,deletionMode:'display-only'};
  }
  install();
})();


