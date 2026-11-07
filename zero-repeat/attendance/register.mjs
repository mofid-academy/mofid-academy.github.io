import {call,modes} from './api.mjs?v=20261107.3';
import {normalizeCapacity,fullCapacity,renderCapacity} from './availability.mjs?v=20261107.3';
const $=selector=>document.querySelector(selector);
const preview=new URLSearchParams(location.search).get('preview')==='1';
const previewFull=preview&&new URLSearchParams(location.search).get('capacity')==='full';
const form=$('#attendance-form'),button=$('#submit-button'),error=$('#form-error');
const controls={radio:$('#in-person-mode'),option:$('#in-person-option'),badge:$('#in-person-capacity'),message:$('#capacity-message'),retry:$('#retry-capacity')};
let pending=null,busy=false,completed=false,checking=false,capacityRevision=0;
let capacity={status:'loading'};
$('#preview-note').hidden=!preview;
function syncControls(){
  const locked=busy||!!pending&&!completed;
  for(const input of form.querySelectorAll('input'))input.disabled=locked;
  renderCapacity(controls,capacity,{locked,hasPending:!!pending});
  button.disabled=busy||completed;
  button.firstElementChild.textContent=busy?(preview?'در حال نمایش پیش‌نمایش…':'در حال ثبت…'):pending&&!completed?'تلاش دوباره برای ثبت':'ثبت نحوهٔ شرکت';
}
async function refreshCapacity(){
  if(checking||completed)return;
  const revision=capacityRevision;
  checking=true;controls.retry.disabled=true;
  try{
    const result=preview?{capacity:{limit:15,registered:previewFull?15:0,remaining:previewFull?0:15,full:previewFull}}:await call({action:'availability'});
    if(revision===capacityRevision&&!completed)capacity=normalizeCapacity(result.capacity);
  }catch{if(revision===capacityRevision&&!completed)capacity={status:'error'};}
  finally{checking=false;syncControls();}
}
controls.retry.addEventListener('click',refreshCapacity);
window.addEventListener('focus',refreshCapacity);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshCapacity();});
const poll=setInterval(()=>{if(!document.hidden)refreshCapacity();},15000);
syncControls();refreshCapacity();
form.addEventListener('submit',async event=>{
  event.preventDefault();if(busy||completed||!form.reportValidity())return;
  const data=pending?.data||{full_name:$('#full-name').value.trim(),username:$('#username').value.trim().toLowerCase(),attendance_mode:new FormData(form).get('attendance_mode')};
  if(!modes[data.attendance_mode]){error.textContent='نحوهٔ شرکت را انتخاب کنید.';error.hidden=false;return;}
  if(!pending&&data.attendance_mode==='in_person'&&capacity.status!=='available'){error.textContent=controls.message.textContent;error.hidden=false;return;}
  // Keep the exact ID and payload after an uncertain write until it is settled.
  pending??={request_id:crypto.randomUUID(),data};busy=true;error.hidden=true;syncControls();
  let focusOnline=false;
  try{
    const result=preview?{receipt:{stored:false,id:pending.request_id,attendance_mode:data.attendance_mode,created_at:new Date().toISOString()}}:await call({action:'submit',...pending});
    const receipt=result.receipt;
    if((!preview&&receipt?.stored!==true)||receipt?.id!==pending.request_id||receipt.attendance_mode!==data.attendance_mode||!Number.isFinite(Date.parse(receipt.created_at)))throw Error('ثبت این پاسخ تأیید نشد؛ دوباره تلاش کنید.');
    completed=true;clearInterval(poll);form.hidden=true;$('#receipt').hidden=false;
    $('#receipt-title').textContent=preview?'پیش‌نمایش رسید — ذخیره نشده':'پاسخ شما ثبت شد';
    $('#receipt-summary').textContent=`${data.full_name}، نحوهٔ شرکت شما در کلاس‌های ZERO REPEAT: ${modes[receipt.attendance_mode]}`;
    $('#receipt-time').textContent=new Intl.DateTimeFormat('fa-IR',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Tehran'}).format(new Date(receipt.created_at));
    $('#receipt-id').textContent=receipt.id;$('#receipt').focus();
  }catch(err){
    error.textContent=err.message;error.hidden=false;
    if(err.code==='IN_PERSON_FULL'){pending=null;capacityRevision++;capacity=fullCapacity();focusOnline=true;}
    else if(err.status===400||err.status===409)pending=null;
    else error.textContent+=' برای تأیید ثبت همین پاسخ، دکمهٔ تلاش دوباره را بزنید.';
  }finally{busy=false;syncControls();if(focusOnline)form.querySelector('input[value="online"]').focus();}
});
