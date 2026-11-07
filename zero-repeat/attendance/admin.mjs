import {call,loadEntries,modes} from './api.mjs?v=20261107.1';
import {filterEntries,buildXlsx} from './report.mjs?v=20261107.1';
const $=selector=>document.querySelector(selector),fa=value=>Number(value).toLocaleString('fa-IR');
const date=new Intl.DateTimeFormat('fa-IR',{dateStyle:'short',timeStyle:'short',timeZone:'Asia/Tehran'});
let token='',entries=[],filtered=[],loading=false,complete=false,deleting='',generation=0;
const error=(id,message)=>{$(id).textContent=message;$(id).hidden=!message;};
function stats(){for(const [id,value] of [['#stat-total',entries.length],['#stat-in-person',entries.filter(r=>r.attendance_mode==='in_person').length],['#stat-online',entries.filter(r=>r.attendance_mode==='online').length]])$(id).textContent=complete?fa(value):'—';}
function render(){
  filtered=filterEntries(entries,{query:$('#search-filter').value,mode:$('#mode-filter').value});
  const fragment=document.createDocumentFragment();
  filtered.forEach((entry,i)=>{
    const row=document.createElement('tr');
    [fa(i+1),entry.full_name,entry.username||'—',modes[entry.attendance_mode],date.format(new Date(entry.created_at))].forEach((value,j)=>{
      const td=document.createElement('td');if(j===1)td.className='person-name';if(j===2)td.dir='ltr';
      if(j===3){const pill=document.createElement('span');pill.className='mode-pill '+(entry.attendance_mode==='online'?'online':'');pill.textContent=value;td.append(pill);}else td.textContent=value;
      row.append(td);
    });
    const td=document.createElement('td'),button=document.createElement('button');button.type='button';button.className='button danger row-delete';button.textContent=deleting===entry.id?'در حال حذف…':'حذف پاسخ';button.dataset.deleteId=entry.id;button.setAttribute('aria-label','حذف پاسخ '+entry.full_name);button.disabled=loading||!complete||!!deleting;td.append(button);row.append(td);fragment.append(row);
  });
  $('#entry-rows').replaceChildren(fragment);$('#empty-state').hidden=loading||!complete||!!filtered.length;
  $('#table-count').textContent=complete?`${fa(filtered.length)} پاسخ در این نما از ${fa(entries.length)} پاسخ`:'فهرست کامل هنوز دریافت نشده است.';
  $('#export-button').disabled=loading||!complete||!!deleting||!filtered.length;
}
function logout(message=''){
  generation++;token='';entries=[];filtered=[];loading=false;complete=false;deleting='';
  $('#admin-panel').hidden=true;$('#login-panel').hidden=false;$('#login-form').reset();$('#search-filter').value='';$('#mode-filter').value='';stats();render();error('#login-error',message);$('#admin-username').focus();
}
async function refresh(){
  if(!token||loading||deleting)return;const current=++generation;loading=true;complete=false;entries=[];$('#refresh-button').disabled=true;error('#admin-error','');error('#admin-status','در حال دریافت پاسخ‌ها…');stats();render();
  try{const rows=await loadEntries(body=>call(body),token);if(current!==generation)return;entries=rows;complete=true;}
  catch(err){if(current!==generation)return;if(err.status===401){logout('نشست مدیریت پایان یافته است؛ دوباره وارد شوید.');return;}error('#admin-error',err.message);}
  finally{if(current===generation){loading=false;$('#refresh-button').disabled=false;error('#admin-status','');stats();render();}}
}
$('#login-form').addEventListener('submit',async event=>{
  event.preventDefault();const button=$('#login-button');if(button.disabled||!$('#login-form').reportValidity())return;
  button.disabled=true;button.textContent='در حال ورود…';error('#login-error','');
  try{const result=await call({action:'admin_login',username:$('#admin-username').value.trim(),secret:$('#admin-secret').value});if(typeof result.token!=='string'||!result.token)throw Error('ورود تأیید نشد.');token=result.token;$('#admin-secret').value='';$('#login-panel').hidden=true;$('#admin-panel').hidden=false;await refresh();}
  catch(err){error('#login-error',err.message);}finally{button.disabled=false;button.textContent='ورود به مدیریت';}
});
$('#refresh-button').addEventListener('click',refresh);$('#logout-button').addEventListener('click',()=>logout());
$('#search-filter').addEventListener('input',render);$('#mode-filter').addEventListener('change',render);$('#clear-filters').addEventListener('click',()=>{$('#search-filter').value='';$('#mode-filter').value='';render();});
$('#entry-rows').addEventListener('click',async event=>{
  const button=event.target.closest('button[data-delete-id]');if(!button||!complete||loading||deleting)return;
  const entry=entries.find(r=>r.id===button.dataset.deleteId);if(!entry)return;
  if(!window.confirm(`پاسخ «${entry.full_name}» برای شرکت «${modes[entry.attendance_mode]}» حذف شود؟\nاین ردیف از فهرست و خروجی‌های اکسل بعدی کنار گذاشته می‌شود.`))return;
  const current=generation;deleting=entry.id;$('#refresh-button').disabled=true;error('#admin-error','');render();
  try{const result=await call({action:'admin_delete',token,id:entry.id,confirm:true});if(current!==generation)return;if(result.deleted?.id!==entry.id)throw Error('حذف تأیید نشد؛ فهرست را به‌روز کنید.');entries=entries.filter(r=>r.id!==entry.id);error('#admin-status','پاسخ انتخاب‌شده حذف شد.');}
  catch(err){if(current!==generation)return;if(err.status===401){logout('نشست مدیریت پایان یافته است؛ دوباره وارد شوید.');return;}error('#admin-error',err.message);}
  finally{if(current===generation){deleting='';$('#refresh-button').disabled=false;stats();render();}}
});
$('#export-button').addEventListener('click',()=>{
  if(!complete||loading||deleting||!filtered.length)return;
  try{const mode=$('#mode-filter').value,query=$('#search-filter').value.trim();const bytes=buildXlsx(filtered,{scope:[modes[mode]||'همهٔ پاسخ‌ها',query&&'جست‌وجو: '+query].filter(Boolean).join(' · ')});const url=URL.createObjectURL(new Blob([bytes],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));const link=document.createElement('a');link.href=url;link.download='Zero-Repeat-Attendance-'+(mode||'All')+'.xlsx';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);}
  catch{error('#admin-error','ساخت فایل اکسل انجام نشد؛ دوباره تلاش کنید.');}
});
