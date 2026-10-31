export const API='https://siwmzffadbbhcyyppwzn.supabase.co/functions/v1/instructor-survey-api';
export const fa=(v,dec=0)=>v===null||v===undefined?'—':new Intl.NumberFormat('fa-IR',{maximumFractionDigits:dec}).format(v);
export const dateFa=v=>new Intl.DateTimeFormat('fa-IR',{timeZone:'Asia/Tehran',dateStyle:'medium',timeStyle:'short'}).format(new Date(v));
export const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export async function api(action,data={},token){
  let r;try{r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,...data,...(token?{token}:{})}),signal:AbortSignal.timeout(30000)});}catch(e){throw new Error(navigator.onLine?'ارتباط با سامانه برقرار نشد. دوباره تلاش کنید.':'اینترنت قطع است. پاسخ‌ها محفوظ‌اند؛ پس از اتصال دوباره تلاش کنید.');}
  let result;try{result=await r.json();}catch{throw new Error('پاسخ سامانه خوانده نشد. دوباره تلاش کنید.');}
  if(!r.ok||!result.ok){const error=new Error(result.message||'عملیات انجام نشد. دوباره تلاش کنید.');error.status=r.status;throw error;}
  return result;
}
export const icons={
 arrow:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M19 12H5m6-6-6 6 6 6"/></svg>',
 check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m5 12 4 4L19 6"/></svg>',
 clock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
 shield:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z"/><path d="m8 12 3 3 5-6"/></svg>',
 sun:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></svg>',
 download:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 3v12m-5-5 5 5 5-5M4 16v4h16v-4"/></svg>',
 filter:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 5h18l-7 8v6l-4 2v-8L3 5Z"/></svg>',
 chart:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 3v17h17M8 15v-4m5 4V6m5 9V9"/></svg>',
 grid:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
 copy:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V3H3v13h5"/></svg>'
};
export function initTheme(){
  document.documentElement.dataset.theme='dark';
  try{const saved=localStorage.getItem('mofid-instructor-theme');if(saved==='light'||saved==='dark')document.documentElement.dataset.theme=saved;}catch{}
  document.querySelectorAll('[data-theme-toggle]').forEach(b=>{b.innerHTML=icons.sun;b.onclick=()=>{const t=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=t;try{localStorage.setItem('mofid-instructor-theme',t);}catch{}};});
}
