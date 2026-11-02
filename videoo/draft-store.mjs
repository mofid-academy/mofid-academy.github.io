// Temporary owner-only preview: existing management authentication, encrypted browser drafts.
// No Arvan credentials are accepted or stored by this mode.
import {newCourse,newLesson,uid,mergeWatch} from './model.mjs';
const bytesTo64=bytes=>btoa(String.fromCharCode(...new Uint8Array(bytes)));
const from64=value=>Uint8Array.from(atob(value),c=>c.charCodeAt(0));
const encoder=new TextEncoder(),decoder=new TextDecoder();
const storageName=name=>'mofid-video-private-draft:'+name.toLowerCase();
export function seedCatalog(){
  const excel=newCourse();Object.assign(excel,{title:'آموزش اکسل پیشرفته',description:'از مرتب‌سازی داده تا گزارش‌های حرفه‌ای؛ یک مسیر مرحله‌به‌مرحله برای کار دقیق‌تر با اکسل.',category:'مهارت‌های کاربردی',art:'excel'});excel.sections=[{id:uid(),title:'کار با داده‌ها',lessons:[]},{id:uid(),title:'تحلیل و گزارش‌سازی',lessons:[]},{id:uid(),title:'تمرین‌های کاربردی',lessons:[]}];
  const industry=newCourse();Object.assign(industry,{title:'آموزش تحلیل صنایع',description:'شناخت ساختار صنعت، بررسی متغیرهای اثرگذار و ساختن یک چارچوب تحلیلی منسجم.',category:'بازار سرمایه',art:'industry'});industry.sections=[{id:uid(),title:'چارچوب تحلیل صنعت',lessons:[]},{id:uid(),title:'بررسی و تحلیل صنایع',lessons:[]}];
  const single=newCourse('single');Object.assign(single,{title:'فیلم آزمایشی',description:'اولین ویدیوی خصوصی کتابخانه؛ برای بررسی تجربهٔ تماشا و دنبال‌کردن پیشرفت.',category:'عمومی',art:'video'});Object.assign(single.sections[0].lessons[0],{title:'قسمت اول',objectKey:'J1.mp4',size:195550000});
  return {revision:0,courses:[excel,industry,single]};
}
export async function openDraft(username,password,exportedKey){
  const name=storageName(username);let saved;
  try{saved=JSON.parse(localStorage.getItem(name)||'null');}catch{}
  const salt=saved?.salt?from64(saved.salt):crypto.getRandomValues(new Uint8Array(16));
  let key;
  if(exportedKey)key=await crypto.subtle.importKey('raw',from64(exportedKey),'AES-GCM',true,['encrypt','decrypt']);
  else{const material=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveKey']);key=await crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:150000,hash:'SHA-256'},material,{name:'AES-GCM',length:256},true,['encrypt','decrypt']);}
  let data={catalog:seedCatalog(),progress:{}};
  if(saved?.data){try{data=JSON.parse(decoder.decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:from64(saved.iv)},key,from64(saved.data))));}catch{throw Error('پیش‌نویس این مرورگر با رمز فعلی باز نشد؛ برای بازیابی از رمز قبلی یا مرورگر دیگری استفاده کنید.');}}
  async function save(){const iv=crypto.getRandomValues(new Uint8Array(12)),encrypted=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,encoder.encode(JSON.stringify(data)));localStorage.setItem(name,JSON.stringify({salt:bytesTo64(salt),iv:bytesTo64(iv),data:bytesTo64(encrypted)}));}
  return {exportedKey:bytesTo64(await crypto.subtle.exportKey('raw',key)),
    async request(action,payload={}){
      if(action==='bootstrap')return {ok:true,catalog:structuredClone(data.catalog),progress:Object.values(data.progress),username,previewOnly:true,storage:{connected:false,endpoint:'https://s3.ir-central1.arvanstorage.ir',region:'ir-central1',bucket:'mofid-academy-videos'}};
      if(action==='catalog_save'){if(payload.revision!==data.catalog.revision){const e=Error('نسخهٔ جدیدتری ذخیره شده است؛ صفحه را تازه کنید.');e.code='REVISION_CONFLICT';throw e;}data.catalog={courses:structuredClone(payload.courses),revision:data.catalog.revision+1};await save();return {ok:true,catalog:structuredClone(data.catalog)};}
      if(action==='progress_save'){const old=data.progress[payload.lessonId]||{ranges:[],revision:0};let ranges=old.ranges;for(const r of payload.ranges||[])ranges=mergeWatch(ranges,r[0],r[1]);const row={lesson_id:payload.lessonId,position:payload.position,duration:payload.duration,ranges,revision:old.revision+1,updated_at:new Date().toISOString()};data.progress[payload.lessonId]=row;await save();return {ok:true,progress:row};}
      const e=Error('اتصال خصوصی آروان پس از فعال‌سازی سرویس مدیریت در دسترس خواهد بود.');e.code='BACKEND_PENDING';e.status=409;throw e;
    }
  };
}
