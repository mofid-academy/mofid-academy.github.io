import {fa,esc} from './model.mjs';
import {icon} from './icons.mjs';
const btn=(action,label,ico,extra='')=>`<button type="button" class="btn small-btn" data-action="${action}" ${extra}>${icon(ico)}${label}</button>`;

export function installPublishing(VideoApp,{toast}){
  Object.assign(VideoApp.prototype,{
    coverEditor(c){return `<div class="cover-editor"><div>${this.cover(c)}</div><div><h3>عکس جلد مجموعه</h3><p>عکس دلخواهت را برای پوشهٔ این آموزش بگذار؛ JPG، PNG یا WebP تا ۵ مگابایت.</p><div class="button-group">${btn('upload-cover',c.coverObjectKey?'تغییر عکس جلد':'افزودن عکس جلد','upload',`data-id="${c.id}"`)}${c.coverObjectKey?btn('remove-cover','حذف عکس جلد','trash',`data-id="${c.id}"`):''}</div></div></div>`;},
    publishingPanel(c){return `<section class="panel publishing-panel"><div><h2>انتشار مجموعه</h2><p>${c.status==='published'?'این مجموعه برای حساب‌های فعال قابل نمایش است.':'پیش‌نویس فقط در پنل مدیریت دیده می‌شود. بعد از افزودن فیلم، مجموعه را منتشر کن.'}</p>${!this.releaseEnabled?'<p class="publish-hint">نمایش کاربران هنوز خاموش است. پس از آماده‌سازی، آن را از «کاربران و انتشار» فعال کن.</p>':''}</div>${btn('publish-course',c.status==='published'?'توقف انتشار مجموعه':'انتشار مجموعه',c.status==='published'?'pause':'check',`data-id="${c.id}"`)}</section>`;},
    access(){return `<div class="page-heading"><div><h1>کاربران و انتشار</h1><p>فقط افرادی که اینجا حساب فعال دارند، مجموعه‌های منتشرشده را می‌بینند.</p></div></div><section class="panel publishing-panel"><div><h2>${this.releaseEnabled?'نمایش برای کاربران فعال است':'صفحهٔ کاربران: Coming Soon'}</h2><p>ابتدا مجموعه و قسمت‌ها را آماده و منتشر کن، سپس نمایش کاربران را فعال کن.</p><a href="/videoo/" target="_blank" rel="noopener">باز کردن صفحهٔ کاربران ←</a></div><button type="button" class="btn ${this.releaseEnabled?'':'primary'}" data-action="release-toggle" aria-pressed="${!!this.releaseEnabled}">${icon(this.releaseEnabled?'pause':'play')}${this.releaseEnabled?'بازگشت به Coming Soon':'فعال‌کردن نمایش برای کاربران'}</button></section><div class="access-layout"><section class="panel"><h2>ساخت حساب کاربر</h2><p class="muted small">این حساب برای کتابخانهٔ ویدیوهاست. نام کاربری و رمز را به فرد موردنظر بده.</p><form id="studentForm"><label class="field"><span>نام و نام خانوادگی</span><input name="fullName" maxlength="120" required autocomplete="off"></label><label class="field"><span>نام کاربری انگلیسی</span><input name="username" dir="ltr" minlength="3" maxlength="64" pattern="[a-zA-Z0-9][a-zA-Z0-9._-]{2,63}" required autocomplete="off" autocapitalize="none" spellcheck="false"></label><label class="field"><span>رمز اولیه، حداقل ۸ نویسه</span><input name="password" type="password" dir="ltr" minlength="8" maxlength="256" required autocomplete="new-password"></label><p class="form-error" role="alert"></p><button class="btn primary" type="submit">${icon('plus')}ساخت حساب</button></form></section><section class="panel"><div class="panel-heading"><h2>حساب‌های کتابخانه</h2>${icon('user')}</div><div data-students-host><span class="spinner"></span></div></section></div>`;},
    bindAccess(){
      const form=this.root.querySelector('#studentForm');
      form.addEventListener('submit',async event=>{event.preventDefault();const button=form.querySelector('[type="submit"]'),error=form.querySelector('.form-error');button.disabled=true;error.textContent='';try{await this.api('student_create',Object.fromEntries(new FormData(form)));form.reset();await this.loadStudents();toast('حساب کاربر ساخته شد.');}catch(e){error.textContent=e.message;}finally{button.disabled=false;}});
      void this.loadStudents();
    },
    async loadStudents(append=false){
      const host=this.root.querySelector('[data-students-host]');if(!host)return;
      try{const result=await this.api('student_list',{offset:append?this.studentOffset:0});this.students=append?[...this.students,...result.students]:result.students;this.studentOffset=result.nextOffset;
        host.innerHTML=this.students.map(s=>`<div class="student-row"><div><strong>${esc(s.full_name)}</strong><small dir="ltr">${esc(s.username)}</small><span class="chip ${s.is_active?'':'draft'}">${s.is_active?'فعال':'غیرفعال'}</span></div><div class="button-group">${btn('student-toggle',s.is_active?'غیرفعال‌کردن':'فعال‌کردن',s.is_active?'pause':'check',`data-id="${s.id}"`)}${btn('student-reset','تغییر رمز','lock',`data-id="${s.id}"`)}</div></div>`).join('')||'<p class="muted small">هنوز حسابی نساخته‌ای.</p>';
        if(result.nextOffset!==null)host.insertAdjacentHTML('beforeend',btn('more-students','نمایش بیشتر','down'));
      }catch(e){host.innerHTML=`<p class="form-error">${esc(e.message)}</p>${btn('reload-students','تلاش دوباره','cloud')}`;}
    },
    async uploadCover(courseId){
      if(!this.storage.connected){this.view='settings';this.render();toast('ابتدا اتصال آروان را کامل کن.');return;}
      if(this.coverBusy){toast('بارگذاری عکس قبلی در حال انجام است.');return;}
      const input=document.createElement('input');input.type='file';input.accept='image/jpeg,image/png,image/webp';
      input.onchange=async()=>{const file=input.files?.[0];if(!file)return;const type=file.type||(/\.png$/i.test(file.name)?'image/png':/\.webp$/i.test(file.name)?'image/webp':/\.jpe?g$/i.test(file.name)?'image/jpeg':'');if(!['image/jpeg','image/png','image/webp'].includes(type)||file.size>5*1024*1024){toast('عکس JPG، PNG یا WebP تا ۵ مگابایت انتخاب کن.',true);return;}
        this.coverBusy=true;toast('در حال بارگذاری عکس جلد…');
        try{const init=await this.api('cover_upload_begin',{size:file.size,type});const response=await fetch(init.url,{method:'PUT',headers:{'Content-Type':type},body:file,signal:AbortSignal.timeout(120000)});if(!response.ok)throw Error('بارگذاری عکس انجام نشد؛ اتصال آروان را بررسی کن.');const saved=await this.api('cover_upload_complete',{ticket:init.ticket}),course=this.courses.find(c=>c.id===courseId);if(!course)return;course.coverObjectKey=saved.objectKey;course.coverUrl=saved.url;this.markDirty();await this.save();toast('عکس جلد ذخیره شد.');}catch(e){toast(e.message,true);}finally{this.coverBusy=false;}
      };input.click();
    },
    async publishingClick(action,el){
      if(action==='upload-cover'){await this.uploadCover(el.dataset.id);return true;}
      if(action==='remove-cover'){const c=this.courses.find(c=>c.id===el.dataset.id);if(c){c.coverObjectKey='';c.coverUrl='';this.markDirty();this.render();}return true;}
      if(action==='publish-course'){
        el.disabled=true;try{if(this.dirty)await this.save();const course=this.courses.find(c=>c.id===el.dataset.id),publish=course.status!=='published',result=await this.api('course_publish',{courseId:course.id,revision:this.catalog.revision,publish});this.catalog=result.catalog;this.render();toast(publish?(this.releaseEnabled?'مجموعه برای کاربران منتشر شد.':'مجموعه آمادهٔ نمایش شد؛ نمایش کاربران را از «کاربران و انتشار» فعال کن.'):'انتشار این مجموعه متوقف شد.');}finally{el.disabled=false;}return true;
      }
      if(action==='release-toggle'){el.disabled=true;try{const result=await this.api('release_set',{enabled:!this.releaseEnabled});this.releaseEnabled=result.releaseEnabled;this.render();toast(result.releaseEnabled?'ورود کاربران و نمایش مجموعه‌های منتشرشده فعال شد.':'صفحهٔ عمومی به Coming Soon برگشت.');}finally{el.disabled=false;}return true;}
      if(action==='student-toggle'){const student=this.students.find(s=>s.id===el.dataset.id);if(!student)return true;el.disabled=true;try{await this.api('student_update',{studentId:student.id,isActive:!student.is_active});await this.loadStudents();toast('وضعیت حساب به‌روز شد.');}finally{el.disabled=false;}return true;}
      if(action==='student-reset'){
        const student=this.students.find(s=>s.id===el.dataset.id);if(!student)return true;
        this.dialog.innerHTML=`<div class="dialog-head"><h2>تغییر رمز ${esc(student.full_name)}</h2>${btn('close-dialog','بستن','close')}</div><form id="resetStudent"><label class="field"><span>رمز جدید، حداقل ۸ نویسه</span><input name="password" type="password" minlength="8" maxlength="256" required autocomplete="new-password" dir="ltr"></label><p class="form-error" role="alert"></p><button class="btn primary" type="submit">ذخیرهٔ رمز</button></form>`;
        this.dialog.querySelector('form').addEventListener('submit',async event=>{event.preventDefault();const form=event.target,button=form.querySelector('[type="submit"]');button.disabled=true;try{await this.api('student_update',{studentId:student.id,password:form.elements.password.value});form.reset();this.dialog.close();toast('رمز تغییر کرد؛ کاربر باید دوباره وارد شود.');}catch(e){form.querySelector('.form-error').textContent=e.message;}finally{button.disabled=false;}});this.dialog.showModal();return true;
      }
      if(action==='more-students'){await this.loadStudents(true);return true;}
      if(action==='reload-students'){await this.loadStudents();return true;}
      return false;
    }
  });
}
