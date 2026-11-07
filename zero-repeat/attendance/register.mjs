import {call,modes} from './api.mjs?v=20261107.1';
const $=selector=>document.querySelector(selector);
const preview=new URLSearchParams(location.search).get('preview')==='1';
const form=$('#attendance-form'),button=$('#submit-button'),error=$('#form-error');
let pending=null,busy=false,completed=false;
$('#preview-note').hidden=!preview;
for(const input of form.querySelectorAll('[name="attendance_mode"]'))input.addEventListener('change',()=>{
  $('#selection-status').textContent='انتخاب شما: '+modes[input.value];
});
form.addEventListener('submit',async event=>{
  event.preventDefault();if(busy||completed||!form.reportValidity())return;
  const data=pending?.data||{full_name:$('#full-name').value.trim(),username:$('#username').value.trim().toLowerCase(),attendance_mode:new FormData(form).get('attendance_mode')};
  if(!modes[data.attendance_mode]){error.textContent='نحوهٔ شرکت را انتخاب کنید.';error.hidden=false;return;}
  // Keep the exact ID and payload after an uncertain write until it is settled.
  pending??={request_id:crypto.randomUUID(),data};busy=true;error.hidden=true;button.disabled=true;button.firstElementChild.textContent=preview?'در حال نمایش پیش‌نمایش…':'در حال ثبت…';
  for(const input of form.querySelectorAll('input'))input.disabled=true;
  try{
    const result=preview?{receipt:{stored:false,id:pending.request_id,attendance_mode:data.attendance_mode,created_at:new Date().toISOString()}}:await call({action:'submit',...pending});
    const receipt=result.receipt;
    if((!preview&&receipt?.stored!==true)||receipt?.id!==pending.request_id||receipt.attendance_mode!==data.attendance_mode||!Number.isFinite(Date.parse(receipt.created_at)))throw Error('ثبت این پاسخ تأیید نشد؛ دوباره تلاش کنید.');
    completed=true;form.hidden=true;$('#receipt').hidden=false;
    $('#receipt-title').textContent=preview?'پیش‌نمایش رسید — ذخیره نشده':'پاسخ شما ثبت شد';
    $('#receipt-summary').textContent=`${data.full_name}، نحوهٔ شرکت شما در کلاس‌های ZERO REPEAT: ${modes[receipt.attendance_mode]}`;
    $('#receipt-time').textContent=new Intl.DateTimeFormat('fa-IR',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Tehran'}).format(new Date(receipt.created_at));
    $('#receipt-id').textContent=receipt.id;$('#receipt').focus();
  }catch(err){error.textContent=err.message;error.hidden=false;if(err.status===400||err.status===409)pending=null;else error.textContent+=' برای تأیید ثبت همین پاسخ، دکمهٔ تلاش دوباره را بزنید.';}
  finally{busy=false;button.disabled=false;button.firstElementChild.textContent=pending&&!completed?'تلاش دوباره برای ثبت':'ثبت نحوهٔ شرکت';for(const input of form.querySelectorAll('input'))input.disabled=!!pending&&!completed;}
});
