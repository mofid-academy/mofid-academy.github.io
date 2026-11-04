import {VideoApp} from './app.mjs?v=20261104-theme-1';
import {request} from './client.mjs?v=20261103-publish-1';
import {esc} from './model.mjs';

const key='mofid-video-student-v1',root=document.getElementById('videoApp'),coming=document.getElementById('academyHome');
let app,loginCleanup;
const stored=()=>{try{return JSON.parse(sessionStorage.getItem(key)||'null');}catch{return null;}};
const remember=value=>{try{if(value)sessionStorage.setItem(key,JSON.stringify(value));else sessionStorage.removeItem(key);}catch{}};
function closed(){app?.destroy();app=null;loginCleanup?.();loginCleanup=null;root.hidden=true;coming.hidden=false;}
function login(message=''){
  app?.destroy();app=null;root.hidden=false;coming.hidden=true;
  root.innerHTML=`<div class="login-layout"><section class="login-card"><div class="login-top"><img class="login-logo" src="/Academy-Exam/assets/mofid-academy-logo.webp" alt="آکادمی مفید"><span class="chip">ویدیوهای خصوصی</span></div><h1>یادگیری از اینجا شروع می‌شود.</h1><p class="intro">با نام کاربری و رمزی که آکادمی در اختیارت گذاشته وارد شو؛ مجموعه‌ها، قسمت‌ها و ادامهٔ تماشایت اینجا منتظرند.</p><form id="studentLogin"><label class="field"><span>نام کاربری</span><input name="username" type="text" autocomplete="username" autocapitalize="none" spellcheck="false" dir="ltr" required maxlength="64"></label><label class="field"><span>رمز عبور</span><input name="password" type="password" autocomplete="current-password" dir="ltr" required maxlength="256"></label><p class="form-error" role="alert">${esc(message)}</p><button class="btn primary" type="submit">ورود به ویدیوها ←</button></form><a class="login-bottom" href="/videoo/admin.html">ورود مدیریت</a></section></div>`;
  loginCleanup?.();loginCleanup=window.MofidEntryUI?.mountLogin(root.querySelector('.login-card'));
  root.querySelector('form').addEventListener('submit',async event=>{event.preventDefault();const form=event.target,button=form.querySelector('button'),error=form.querySelector('.form-error');button.disabled=true;error.textContent='';try{const result=await request('student_login',Object.fromEntries(new FormData(form)));form.elements.password.value='';remember({token:result.token,username:result.username});await openLibrary();}catch(e){if(e.code==='NOT_RELEASED'){closed();return;}error.textContent=e.message;}finally{button.disabled=false;}});
}
async function openLibrary(){
  const session=stored();if(!session?.token){login();return;}
  loginCleanup?.();loginCleanup=null;root.hidden=false;coming.hidden=true;
  const api=async(action,data)=>{try{return await request(action,data,session.token);}catch(e){if(e.status===401){remember(null);login('اعتبار ورودت پایان یافته؛ دوباره وارد شو.');}else if(e.code==='NOT_RELEASED'){remember(null);closed();}throw e;}};
  app=new VideoApp({root,api,username:session.username,studentMode:true,onLogout:()=>{remember(null);login();}});
  try{await app.load();}catch(e){if(e.status===401||e.code==='NOT_RELEASED')return;login(e.message);}
}
async function initPortal(){
  try{
    const status=await request('health');if(status.publicState==='live')await openLibrary();
  }catch{const note=document.createElement('p');note.className='helper-box portal-status';note.textContent='وضعیت ویدیوها دریافت نشد؛ کمی بعد صفحه را تازه کن.';coming.append(note);}
}
void initPortal();
