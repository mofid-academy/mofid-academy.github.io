import {openDraft} from './draft-store.mjs';
export const API='https://siwmzffadbbhcyyppwzn.supabase.co/functions/v1/academy-video-api';
// Public release remains disabled. Switch only after the private API deployment is approved.
export const BACKEND_MODE='private-preview';
const EXISTING_MANAGEMENT_API='https://siwmzffadbbhcyyppwzn.supabase.co/functions/v1/parent-survey-api';
let draft;
export function session(){try{return JSON.parse(sessionStorage.getItem('mofid-video-admin')||'null');}catch{return null;}}
export function remember(value){if(!value)draft=null;try{if(value)sessionStorage.setItem('mofid-video-admin',JSON.stringify(value));else sessionStorage.removeItem('mofid-video-admin');}catch{}}
export async function request(action,data={},token){
  if(BACKEND_MODE==='private-preview'){
    if(action==='admin_login'){
      const r=await fetch(EXISTING_MANAGEMENT_API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'admin_login',username:data.username,secret:data.password}),signal:AbortSignal.timeout(30000)});
      const result=await r.json();if(!r.ok||!result.ok){const e=Error(result.message||'نام کاربری یا رمز معتبر نیست.');e.status=r.status;throw e;}
      draft=await openDraft(result.username,data.password);
      return {...result,draftKey:draft.exportedKey};
    }
    if(action==='bootstrap'){
      const r=await fetch(EXISTING_MANAGEMENT_API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'admin_settings',token}),signal:AbortSignal.timeout(30000)});
      const verified=await r.json();if(!r.ok||verified.ok!==true){const e=Error('نشست مدیریت معتبر نیست؛ دوباره وارد شوید.');e.status=r.status;throw e;}
      const stored=session();if(!draft&&stored?.draftKey)draft=await openDraft(stored.username,undefined,stored.draftKey);
    }
    if(!draft){const e=Error('دوباره وارد مدیریت شوید.');e.status=401;throw e;}
    return draft.request(action,data);
  }
  let response;try{response=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,data,token}),signal:AbortSignal.timeout(45000),keepalive:action==='progress_save'});}catch{throw Error('ارتباط با سامانه برقرار نشد؛ اتصال اینترنت را بررسی و دوباره تلاش کنید.');}
  let result;try{result=await response.json();}catch{throw Error('پاسخ سامانه خوانده نشد؛ دوباره تلاش کنید.');}
  if(!response.ok||!result.ok){const e=new Error(result.message||'عملیات انجام نشد.');e.code=result.code;e.status=response.status;throw e;}
  return result;
}

export class VideoUpload {
  constructor({api,file,onProgress=()=>{},onState=()=>{}}){Object.assign(this,{api,file,onProgress,onState,paused:false,cancelled:false,parts:[]});}
  pause(){this.paused=true;this.onState('paused');}
  resume(){this.paused=false;this.resumeWaiting?.();this.onState('uploading');}
  async cancel(){this.cancelled=true;this.xhr?.abort();this.resumeWaiting?.();if(this.ticket)await this.api('upload_abort',{ticket:this.ticket}).catch(()=>{});this.onState('cancelled');}
  chunk(blob,url,done){
    return new Promise((resolve,reject)=>{
      const xhr=this.xhr=new XMLHttpRequest();xhr.open('PUT',url);xhr.timeout=180000;
      xhr.upload.onprogress=e=>{if(e.lengthComputable)this.onProgress(done+e.loaded,this.file.size);};
      xhr.onerror=()=>reject(Error('بارگذاری به آروان قطع شد.'));xhr.ontimeout=()=>reject(Error('زمان بارگذاری این بخش تمام شد.'));xhr.onabort=()=>reject(Error('بارگذاری لغو شد.'));
      xhr.onload=()=>{const etag=xhr.getResponseHeader('ETag');if(xhr.status>=200&&xhr.status<300&&etag)resolve(etag);else reject(Error(etag?'ذخیرهٔ این بخش تأیید نشد.':'مجوز آپلود داخل سایت تأیید نشد؛ اتصال آروان را دوباره ذخیره کنید.'));};xhr.send(blob);
    });
  }
  async start(){
    this.onState('starting');const init=await this.api('upload_begin',{name:this.file.name,size:this.file.size,type:this.file.type});this.ticket=init.ticket;
    for(let offset=0,part=1;offset<this.file.size;offset+=init.partSize,part++){
      if(this.cancelled)throw Error('بارگذاری لغو شد.');
      if(this.paused)await new Promise(resolve=>this.resumeWaiting=resolve);
      if(this.cancelled)throw Error('بارگذاری لغو شد.');
      this.onState('uploading');let etag;
      for(let attempt=0;attempt<3;attempt++){
        try{const {url}=await this.api('upload_part',{ticket:this.ticket,number:part});etag=await this.chunk(this.file.slice(offset,offset+init.partSize),url,offset);break;}
        catch(e){if(this.cancelled||attempt===2)throw e;await new Promise(resolve=>setTimeout(resolve,500*(attempt+1)));}
      }
      this.parts.push({number:part,etag});this.onProgress(Math.min(offset+init.partSize,this.file.size),this.file.size);
    }
    this.onState('finalizing');const result=await this.api('upload_complete',{ticket:this.ticket,parts:this.parts});this.onState('done');return result;
  }
}
