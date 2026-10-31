export async function collectExportRows(fetchPage,filters={},onProgress=()=>{}){
  const snapshot=new Date().toISOString(),f={...filters,snapshot},rows=[],ids=new Set();let total=null;
  for(let page=0;;page++){
    const r=await fetchPage(f,page,1000);
    if(!Number.isSafeInteger(r.total)||r.total<0||!Array.isArray(r.rows))throw Error('گزارش دریافتی معتبر نیست.');
    if(total===null){total=r.total;if(total>1048575)throw Error('تعداد پاسخ‌ها بیش از ظرفیت یک برگهٔ اکسل است؛ دوره یا تاریخ را محدود کنید.');}
    if(r.total!==total)throw Error('پاسخ‌ها هنگام خروجی تغییر کردند؛ دوباره خروجی بگیرید.');
    for(const row of r.rows){if(ids.has(row.id))throw Error('صفحه‌بندی گزارش تغییر کرد؛ دوباره خروجی بگیرید.');ids.add(row.id);rows.push(row);}
    onProgress(rows.length,total);
    if(rows.length===total)break;if(rows.length>total||r.rows.length===0)throw Error('همهٔ ردیف‌ها دریافت نشدند؛ دوباره تلاش کنید.');
  }
  return {rows,snapshot};
}
