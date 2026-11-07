export function normalizeCapacity(value){
  if(!value||value.limit!==15||!Number.isSafeInteger(value.registered)||value.registered<0||value.remaining!==Math.max(0,15-value.registered)||value.full!==(value.registered>=15))throw Error('ظرفیت حضوری قابل‌بررسی نیست؛ دوباره تلاش کنید.');
  return {status:value.full?'full':'available',registered:value.registered,remaining:value.remaining};
}
export const fullCapacity=()=>({status:'full',registered:15,remaining:0});
export function capacityView(state){
  if(state.status==='full')return {disabled:true,badge:'ظرفیت تکمیل شده',message:'ظرفیت حضوری تکمیل شده است؛ شما می‌توانید به‌صورت آنلاین شرکت کنید.'};
  if(state.status==='available')return {disabled:false,badge:Number(state.remaining).toLocaleString('fa-IR')+' جای خالی از ۱۵ نفر',message:''};
  if(state.status==='error')return {disabled:true,badge:'ظرفیت نامشخص',message:'ظرفیت حضوری فعلاً قابل‌بررسی نیست. می‌توانید آنلاین شرکت کنید یا ظرفیت را دوباره بررسی کنید.'};
  return {disabled:true,badge:'در حال بررسی ظرفیت…',message:'در حال بررسی ظرفیت حضوری…'};
}
export function renderCapacity({radio,option,badge,message,retry},state,{locked=false,hasPending=false}={}){
  const view=capacityView(state);
  radio.disabled=locked||view.disabled;
  if(view.disabled&&!hasPending)radio.checked=false;
  option.classList.toggle('capacity-full',state.status==='full');
  badge.textContent=view.badge;message.textContent=view.message;message.hidden=!view.message;
  message.classList.toggle('is-full',state.status==='full');
  retry.hidden=state.status!=='error';retry.disabled=locked;
}
