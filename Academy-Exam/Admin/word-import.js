/* Read explicit Word questions locally. Never infers answers or sends file contents. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.AcademyWordImport=api;
})(globalThis,function(){
'use strict';
const VERSION=1,MAX_FILE=10*1024*1024,MAX_XML=8*1024*1024,MAX_QUESTIONS=200;
const W='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const digits=s=>String(s).replace(/[۰-۹٠-٩]/g,c=>String('۰۱۲۳۴۵۶۷۸۹'.includes(c)?'۰۱۲۳۴۵۶۷۸۹'.indexOf(c):'٠١٢٣٤٥٦٧٨٩'.indexOf(c)));
const norm=s=>digits(String(s).normalize('NFKC')).replace(/\s+/g,' ').trim();
const uid=()=>('docx_'+(globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+'_'+Math.random().toString(36).slice(2))).replace(/-/g,'');
const crcTable=Uint32Array.from({length:256},(_,i)=>{let n=i;for(let j=0;j<8;j++)n=(n&1)?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
function crc32(bytes){let n=0xffffffff;for(const b of bytes)n=crcTable[(n^b)&255]^(n>>>8);return (n^0xffffffff)>>>0;}
async function documentXML(buffer){
  const bytes=buffer instanceof Uint8Array?buffer:new Uint8Array(buffer);
  if(bytes.length>MAX_FILE)throw Error('حجم فایل Word بیشتر از ۱۰ مگابایت است.');
  if(bytes.length<22)throw Error('فایل Word کامل یا معتبر نیست.');
  const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
  let end=-1;
  for(let p=bytes.length-22;p>=Math.max(0,bytes.length-65557);p--){
    if(view.getUint32(p,true)===0x06054b50&&p+22+view.getUint16(p+20,true)===bytes.length){end=p;break;}
  }
  if(end<0)throw Error('این فایل DOCX معتبر نیست؛ فایل را با قالب Word Document ذخیره کنید.');
  const count=view.getUint16(end+10,true),size=view.getUint32(end+12,true),offset=view.getUint32(end+16,true);
  if(view.getUint16(end+4,true)||view.getUint16(end+6,true)||view.getUint16(end+8,true)!==count||count>4096||offset+size>end)throw Error('ساختار فایل Word پشتیبانی نمی‌شود.');
  let found=null,p=offset;
  for(let i=0;i<count;i++){
    if(p+46>offset+size||view.getUint32(p,true)!==0x02014b50)throw Error('فهرست داخلی فایل Word آسیب دیده است.');
    const nameLength=view.getUint16(p+28,true),extraLength=view.getUint16(p+30,true),commentLength=view.getUint16(p+32,true),next=p+46+nameLength+extraLength+commentLength;
    if(next>offset+size)throw Error('فهرست داخلی فایل Word کامل نیست.');
    const name=new TextDecoder().decode(bytes.subarray(p+46,p+46+nameLength));
    if(name==='word/document.xml'){
      if(found)throw Error('متن اصلی فایل Word تکراری است.');
      found={flags:view.getUint16(p+8,true),method:view.getUint16(p+10,true),crc:view.getUint32(p+16,true),compressed:view.getUint32(p+20,true),plain:view.getUint32(p+24,true),local:view.getUint32(p+42,true)};
    }
    p=next;
  }
  if(!found)throw Error('متن اصلی در فایل Word پیدا نشد.');
  const f=found;
  if(f.flags&1)throw Error('فایل Word رمزگذاری شده است؛ نسخهٔ بدون رمز را انتخاب کنید.');
  if(!f.plain||f.plain>MAX_XML||f.compressed>MAX_FILE||f.local+30>offset||view.getUint32(f.local,true)!==0x04034b50)throw Error('متن اصلی Word بیش از حد بزرگ یا آسیب‌دیده است.');
  const start=f.local+30+view.getUint16(f.local+26,true)+view.getUint16(f.local+28,true);
  if(start+f.compressed>offset)throw Error('دادهٔ فایل Word کامل نیست.');
  const compressed=bytes.subarray(start,start+f.compressed);
  let plain;
  if(f.method===0)plain=compressed;
  else if(f.method===8){
    let ds;try{ds=new DecompressionStream('deflate-raw');}catch{throw Error('مرورگر از خواندن مستقیم Word پشتیبانی نمی‌کند؛ مرورگر را به‌روز کنید.');}
    const reader=new Blob([compressed]).stream().pipeThrough(ds).getReader(),chunks=[];let length=0;
    try{
      for(;;){const chunk=await reader.read();if(chunk.done)break;length+=chunk.value.length;if(length>MAX_XML||length>f.plain){await reader.cancel();throw Error('حجم متن Word با اطلاعات فایل همخوان نیست.');}chunks.push(chunk.value);}
    }catch(e){throw Error('بازکردن متن Word انجام نشد: '+String(e.message||e).slice(0,160));}
    plain=new Uint8Array(length);let at=0;for(const chunk of chunks){plain.set(chunk,at);at+=chunk.length;}
  }else throw Error('روش فشرده‌سازی این Word پشتیبانی نمی‌شود.');
  if(plain.length!==f.plain||crc32(plain)!==f.crc)throw Error('صحت متن Word تأیید نشد؛ فایل را دوباره از Word ذخیره کنید.');
  let xml;try{xml=new TextDecoder('utf-8',{fatal:true}).decode(plain);}catch{throw Error('رمزگذاری متن Word قابل خواندن نیست.');}
  if(/<!DOCTYPE|<!ENTITY/i.test(xml))throw Error('ساختار XML این فایل Word پشتیبانی نمی‌شود.');
  return xml;
}
function paragraphs(xml){
  const doc=new DOMParser().parseFromString(xml,'application/xml');
  if(doc.getElementsByTagName('parsererror').length)throw Error('متن داخلی Word کامل نیست.');
  return [...doc.getElementsByTagNameNS(W,'p')].map(p=>[...p.getElementsByTagNameNS(W,'*')].map(n=>n.localName==='t'?n.textContent:['tab','br','cr'].includes(n.localName)?'\n':'').join(''));
}
function parseParagraphs(input,{title='',filename='',formId='mofid-exam'}={}){
  if(!Array.isArray(input))throw Error('متن سؤال‌ها دریافت نشد.');
  const blocks=[],numbers=new Set();let current=null;
  for(const paragraph of input){
    for(const raw of String(paragraph).split(/[\r\n]+/)){
      const line=raw.trim();if(!line)continue;
      const q=line.match(/^(?:(?:سؤال|سوال)\s*)?([0-9۰-۹٠-٩]{1,3})\s*[.．]\s*(.+)$/);
      if(q){
        const number=Number(digits(q[1]));if(numbers.has(number))throw Error('شمارهٔ سؤال '+number+' در فایل تکرار شده است.');numbers.add(number);
        current={number,question:q[2],options:[],answer:null};blocks.push(current);
        if(blocks.length>MAX_QUESTIONS)throw Error('حداکثر ۲۰۰ سؤال در هر آزمون پشتیبانی می‌شود.');continue;
      }
      if(!current)continue;
      const answer=line.match(/^پاسخ\s*(?:صحیح|درست|نمونه)\s*[:：]\s*(.*)$/);
      if(answer){if(current.answer!==null)throw Error('برای سؤال '+current.number+' بیش از یک پاسخ ثبت شده است.');current.answer=answer[1].trim();continue;}
      const option=line.match(/^([0-9۰-۹٠-٩])\s*[)）]\s*(.+)$/);
      if(option){
        if(current.answer!==null)throw Error('ترتیب گزینه‌ها و پاسخ سؤال '+current.number+' را بررسی کنید.');
        if(Number(digits(option[1]))!==current.options.length+1||current.options.length>=8)throw Error('شماره‌گذاری گزینه‌های سؤال '+current.number+' پیوسته نیست.');
        current.options.push(option[2]);continue;
      }
      if(current.answer!==null)current.answer+='\n'+line;
      else if(current.options.length)current.options[current.options.length-1]+='\n'+line;
      else current.question+='\n'+line;
    }
  }
  if(!blocks.length)throw Error('سؤال شماره‌دار پیدا نشد. قالب نمونه: «1. متن سؤال»، «1) گزینه» و «پاسخ صحیح: 2) گزینه».');
  const examId=uid();let missing=0;
  const questions=blocks.map((b,i)=>{
    if(b.question.length>8000||b.options.some(o=>o.length>2000))throw Error('متن سؤال یا گزینهٔ '+b.number+' بیش از حد مجاز است.');
    if(b.options.length===1)throw Error('سؤال '+b.number+' فقط یک گزینه دارد؛ فایل را بررسی کنید.');
    if(new Set(b.options.map(norm)).size!==b.options.length)throw Error('گزینه‌های سؤال '+b.number+' تکراری هستند.');
    let index=-1;
    if(b.options.length&&b.answer){
      const marked=b.answer.match(/^([0-9۰-۹٠-٩])\s*(?:[)）.．]\s*(.*))?$/s);
      if(marked){index=Number(digits(marked[1]))-1;if(index<0||index>=b.options.length||marked[2]&&norm(marked[2])!==norm(b.options[index]))throw Error('پاسخ صریح سؤال '+b.number+' با گزینه‌ها همخوان نیست.');}
      else{index=b.options.findIndex(o=>norm(o)===norm(b.answer));if(index<0)throw Error('پاسخ سؤال '+b.number+' با هیچ گزینه‌ای مطابقت ندارد.');}
    }
    if(!b.answer)missing++;
    return {id:examId+'-Q'+(i+1),question_id:examId+'-Q'+(i+1),order:i+1,question:b.question,type:b.options.length?'mcq':'desc',options:b.options,max_score:b.options.length?1:5,required:false,correct_option_index:index,correct_answer:index>=0?b.options[index]:'',sample_answer:b.options.length?'':b.answer||''};
  });
  const examTitle=String(title||filename.replace(/\.docx$/i,'')||'آزمون جدید').trim().slice(0,240);
  return {bank:{examId,examTitle,formId:String(formId||'mofid-exam'),questions},imported_count:questions.length,missing_answer_count:missing};
}
async function read(file,options={}){
  if(!file||file.size>MAX_FILE)throw Error('فایل Word بیشتر از حد مجاز یا نامعتبر است.');
  const xml=await documentXML(await file.arrayBuffer());
  return parseParagraphs(paragraphs(xml),{...options,filename:file.name||options.filename||''});
}
return Object.freeze({VERSION,read,documentXML,parseParagraphs});
});
