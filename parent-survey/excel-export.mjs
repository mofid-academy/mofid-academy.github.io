import {QUESTIONS} from './questions.mjs';
import {unzipStored,zipStored,utf8,decode} from './zip.mjs';
export const HEADERS=['شناسه پاسخ','زمان ثبت (تهران)','تاریخ شمسی','مدرسه','پایه','نوبت دوره','نسبت',...QUESTIONS.map(q=>q.code+' — '+q.axis),'گروه توصیه','زمان پاسخ‌گویی (ثانیه)','نام پاسخ‌دهنده','نام خانوادگی پاسخ‌دهنده','نمایش ردیف'];
const xml=v=>String(v??'').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g,'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
export const col=n=>{let s='';for(n++;n;n=Math.floor((n-1)/26))s=String.fromCharCode(65+(n-1)%26)+s;return s;};
const cell=(r,c,value,style,formula)=>'<c r="'+col(c)+r+'"'+(style?' s="'+style+'"':'')+(typeof value==='number'?'':' t="inlineStr"')+'>'+(formula?'<f>'+xml(formula)+'</f>':'')+(typeof value==='number'?'<v>'+value+'</v>':'<is><t xml:space="preserve">'+xml(value)+'</t></is>')+'</c>';
function fillSheet(source,rows,start,styleRow,defaultHeight=34){
  const styles=[];const old=source.match(new RegExp('<row\\b[^>]*\\br="'+styleRow+'"[^>]*>[\\s\\S]*?<\\/row>'))?.[0]||'';
  for(const match of old.matchAll(/<c\b[^>]*\br="([A-Z]+)\d+"[^>]*>/g)){const a=match[0].match(/\bs="(\d+)"/);styles.push([match[1],a?.[1]||'0']);}
  const byCol=Object.fromEntries(styles);
  const contents=rows.map((values,i)=>{const r=start+i;return '<row r="'+r+'" ht="'+defaultHeight+'" customHeight="1">'+values.map((v,j)=>{const formula=typeof v==='object'&&v!==null?v.formula:null;return cell(r,j,formula?v.value:v,byCol[col(j)]||'0',formula);}).join('')+'</row>';}).join('');
  source=source.replace(/<sheetData>([\s\S]*?)<\/sheetData>/,(_,data)=>'<sheetData>'+data.replace(/<row\b[^>]*\br="(\d+)"[^>]*>[\s\S]*?<\/row>/g,(row,n)=>+n>=start?'':row)+contents+'</sheetData>');
  const end=Math.max(start,start+rows.length-1),last=col(rows[0]?.length-1||HEADERS.length-1);
  source=source.replace(/<dimension\b[^>]*\/>/,'<dimension ref="A1:'+last+end+'"/>');
  return source;
}
function filterDescription(f){
  const labels={school:'مدرسه',grade:'پایه',cohort:'نوبت دوره',relationship:'نسبت',from:'از تاریخ میلادی',to:'تا تاریخ میلادی',search:'جست‌وجو',consent:'اجازه انتشار',nps:'گروه توصیه',comment:'پاسخ متنی',qcode:'سؤال',qvalue:'پاسخ'};
  const values={true:'بله',false:'خیر',promoter:'مروج',passive:'منفعل',detractor:'منتقد',yes:'دارد'};
  return Object.entries(f).filter(([k,v])=>v!==''&&labels[k]).map(([k,v])=>labels[k]+': '+(values[v]||v)).join('؛ ')||'همه پاسخ‌ها';
}
export async function buildWorkbook(rows,{filters={},exportedAt=new Date().toISOString(),demo=false,templateBytes}={}){
  if(!templateBytes)throw Error('قالب اکسل دریافت نشد. دوباره از پنل خروجی بگیرید.');
  const files=unzipStored(templateBytes),read=n=>decode(files[n]);
  const n=rows.length,last=Math.max(6,5+n),end=col(HEADERS.length-1),data=rows.map((r,i)=>[
    r.id,(Date.parse(r.created_at)+210*60000)/86400000+25569,
    new Intl.DateTimeFormat('fa-IR',{timeZone:'Asia/Tehran',dateStyle:'short',timeStyle:'short'}).format(new Date(r.created_at)),
    r.school,r.grade,r.cohort,r.relationship,...QUESTIONS.map(q=>q.code==='P14'?(r.p14?'بله':'خیر'):r[q.code.toLowerCase()]??''),
    r.p10>=9?'مروج':r.p10>=7?'منفعل':'منتقد',r.duration_seconds,r.first_name||'',r.last_name||'',{formula:'SUBTOTAL(103,A'+(i+6)+')',value:1}
  ]);
  files['xl/worksheets/sheet2.xml']=utf8(fillSheet(read('xl/worksheets/sheet2.xml'),data.length?data:[Array(HEADERS.length).fill('')],6,6));
  const quotes=rows.filter(r=>r.p14&&(r.p11||r.p12||r.p15)).map(r=>[r.id,r.p11||'',r.p12||'',r.p15||'','بله']);
  files['xl/worksheets/sheet4.xml']=utf8(fillSheet(read('xl/worksheets/sheet4.xml'),quotes.length?quotes:[['','','','','']],6,6,75));
  const avg=k=>{const a=rows.filter(r=>typeof r[k]==='number');return a.length?a.reduce((s,r)=>s+r[k],0)/a.length:'';};
  const percent=fn=>n?rows.filter(fn).length/n:'';
  const values={B10:n,B11:avg('p01'),B12:percent(r=>r.p01>=4),B13:n?100*(rows.filter(r=>r.p10>=9).length-rows.filter(r=>r.p10<=6).length)/n:'',
    B14:percent(r=>r.p05>=2),B15:percent(r=>r.p04>=3),B16:avg('p09'),B17:percent(r=>r.p09>=9),B18:avg('p13'),B19:rows.filter(r=>r.p13!==null&&r.p13!==undefined).length,B20:rows.filter(r=>r.p14).length};
  let summary=read('xl/worksheets/sheet1.xml').replace(/([A-Z]+6:[A-Z]+)6\b/g,(_,prefix)=>prefix+last);
  summary=summary.replace(/<c\b([^>]*\br="(B\d+)"[^>]*)>([\s\S]*?)<\/c>/g,(whole,attrs,ref,inner)=>{
    if(!Object.hasOwn(values,ref))return whole;const f=inner.match(/<f[^>]*>[\s\S]*?<\/f>/)?.[0]||'';const v=values[ref];
    return '<c '+attrs.replace(/\s+t="[^"]*"/g,'')+(v===''?' t="str"':'')+'>'+f+'<v>'+v+'</v></c>';
  });
  files['xl/worksheets/sheet1.xml']=utf8(summary);
  // Table filters are native Excel filters; the summary uses SUBTOTAL and the visible-row flag.
  for(const [name,bytes] of Object.entries(files)){
    if(!name.endsWith('.xml'))continue;let s=decode(bytes);
    s=s.replaceAll('__FILTERS__',xml(filterDescription(filters))).replaceAll('__EXPORTED__',xml(new Intl.DateTimeFormat('fa-IR',{timeZone:'Asia/Tehran',dateStyle:'medium',timeStyle:'short'}).format(new Date(exportedAt)))).replaceAll('__MODE__',demo?'داده نمونه — گزارش آزمایشی':'گزارش داخلی برگزارکنندگان');
    if(name.startsWith('xl/tables/')){const lastCol=s.includes('ParentResponses')?end:'E';const count=s.includes('ParentResponses')?last:Math.max(6,5+quotes.length);s=s.replace(/ref="A5:[A-Z]+\d+"/g,'ref="A5:'+lastCol+count+'"');}
    if(name==='xl/workbook.xml'){s=s.replace(/<calcPr\b[^>]*\/>/,'<calcPr calcId="191029" fullCalcOnLoad="1" forceFullCalc="1" calcMode="auto"/>');if(!s.includes('<calcPr'))s=s.replace('</workbook>','<calcPr fullCalcOnLoad="1" calcMode="auto"/></workbook>');}
    files[name]=utf8(s);
  }
  return zipStored(files);
}
