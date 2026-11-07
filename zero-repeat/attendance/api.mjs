export const API_URL='https://siwmzffadbbhcyyppwzn.supabase.co/functions/v1/zero-repeat-attendance-api';
export const modes=Object.freeze({in_person:'حضوری',online:'آنلاین'});
export async function call(body,fetchImpl=fetch){
  let response,result;
  try{response=await fetchImpl(API_URL,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(30000),credentials:'omit',cache:'no-store'});result=await response.json();}
  catch{throw Error('ارتباط با سامانه برقرار نشد. اینترنت را بررسی و دوباره تلاش کنید.');}
  if(!response.ok||result?.ok!==true){const error=Error(result?.message||'عملیات تأیید نشد؛ دوباره تلاش کنید.');error.status=response.status;throw error;}
  return result;
}
export async function loadEntries(callApi,token){
  const rows=new Map();let offset=0,snapshot,total;
  while(true){
    const page=await callApi({action:'admin_entries',token,offset,...(snapshot?{snapshot}:{})});
    if(!Array.isArray(page.entries)||!Number.isSafeInteger(page.total)||page.total<0||typeof page.has_more!=='boolean'||!Number.isFinite(Date.parse(page.snapshot)))throw Error('گزارش کامل دریافت نشد؛ دوباره تلاش کنید.');
    if(total===undefined){total=page.total;snapshot=page.snapshot;}
    if(total!==page.total||page.snapshot!==snapshot)throw Error('فهرست هنگام دریافت تغییر کرد؛ دوباره به‌روزرسانی کنید.');
    for(const row of page.entries){if(typeof row.id!=='string'||!modes[row.attendance_mode])throw Error('یکی از پاسخ‌ها معتبر نیست.');rows.set(row.id,row);}
    offset+=page.entries.length;
    if(!page.has_more){if(rows.size!==total)throw Error('تمام پاسخ‌ها دریافت نشد؛ دوباره به‌روزرسانی کنید.');return [...rows.values()];}
    if(!page.entries.length||offset>100000)throw Error('گزارش کامل دریافت نشد؛ دوباره تلاش کنید.');
  }
}
