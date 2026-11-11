import {setQrCard,clearQrCard} from './qr-card.mjs?v=13';
import {classUrl} from './class-context.mjs?v=7';
const $=s=>document.querySelector(s),fa=n=>Number(n||0).toLocaleString('fa-IR');
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const phases={waiting:'آمادهٔ شروع',open:'در حال اجرا',closed:'رأی‌گیری بسته',finished:'پایان‌یافته'};
export class ClassesPanel{
 constructor({request,current,switchClass,confirm,notify}){
  Object.assign(this,{request,current,switchClass,confirm,notify});this.items=[];this.trash=[];this.busy=false;this.pending=null;this.generation=0;this.loadSequence=0;
  $('#nextPanelSelect').addEventListener('change',()=>this.saveNextPanel());
  $('#classSelect').addEventListener('change',()=>this.select($('#classSelect').value));
  $('#quickNextClass').addEventListener('click',()=>this.create({title:'',copyQuestions:true,closePrevious:true}));
  $('#createClassForm').addEventListener('input',()=>this.pending=null);
  $('#createClassForm').addEventListener('submit',e=>{e.preventDefault();this.create({title:$('#newClassTitle').value.trim(),copyQuestions:$('#classQuestionMode').value==='copy',closePrevious:$('#closePreviousClass').checked});});
  $('#refreshClasses').addEventListener('click',()=>this.load().catch(e=>notify(e.message,true)));
  $('#renameClassForm').addEventListener('submit',async e=>{e.preventDefault();if(this.busy)return;this.setBusy(true);try{await this.request('/host/class-title',{method:'POST',body:{title:$('#renameClassTitle').value.trim()}});await this.load();await this.switchClass(this.current(),true);this.notify('نام پنل ذخیره شد.');}catch(e){this.notify(e.message,true)}finally{this.setBusy(false)}});
  $('#copyClassJoin').addEventListener('click',()=>this.copy());$('#downloadClassQr').addEventListener('click',()=>this.downloadQr());
 }
 setBusy(value){this.busy=value;document.querySelectorAll('[data-class-control],#classSelect,#quickNextClass,[data-class-action],[data-select-class]').forEach(e=>e.disabled=value||(e.dataset.selectClass===this.current()));this.updateAvailability();}
 clear(){this.generation++;this.loadSequence++;this.items=[];this.trash=[];this.pending=null;$('#classList').replaceChildren();$('#classTrashList').replaceChildren();$('#classSelect').replaceChildren();clearQrCard($('#classQr'));this.qr=null;this.qrLink='';$('#classJoinUrl').textContent='';document.body.classList.remove('class-directory-only');}
 async saveNextPanel(){
  if(this.busy)return;this.setBusy(true);
  try{await this.request('/host/next-panel',{method:'POST',body:{nextPanelId:$('#nextPanelSelect').value||null}});await this.load();this.notify('پنل بعدی ذخیره شد.');}
  catch(e){this.notify(e.message,true);this.render();}finally{this.setBusy(false);}
 }
 async load(){const generation=this.generation,sequence=++this.loadSequence,{classes,trash=[]}=await this.request('/host/classes');if(generation!==this.generation||sequence!==this.loadSequence)return;this.items=classes;this.trash=trash;this.render();}
 updateAvailability(){
  const current=this.items.find(c=>c.id===this.current());document.body.classList.toggle('class-directory-only',!current);
  $('#nextPanelSelect').disabled=this.busy||!current;
  $('#quickNextClass').disabled=this.busy||!current;$('#tabExecution').disabled=!current;$('#tabAdmin').disabled=!current;
  $('#classQuestionMode').querySelector('[value="copy"]').disabled=!current;
  if(!current){$('#classQuestionMode').value='blank';$('#closePreviousClass').checked=false;}
  $('#closePreviousClass').disabled=this.busy||!current;$('#classSelect').disabled=this.busy||!this.items.length;
 }
 render(){
  const current=this.items.find(c=>c.id===this.current());
  $('#classSelect').innerHTML=(!current?'<option value="">'+(this.items.length?'یک پنل انتخاب کنید':'پنل فعالی ندارید')+'</option>':'')+this.items.map(c=>'<option value="'+esc(c.id)+'">'+esc(c.title)+' · '+esc(phases[c.phase])+'</option>').join('');$('#classSelect').value=current?this.current():'';
  $('#nextPanelSelect').innerHTML='<option value="">خودکار · ترتیب ساخت</option>'+this.items.filter(c=>c.id!==this.current()).map(c=>'<option value="'+esc(c.id)+'" '+(c.phase==='finished'?'disabled':'')+'>'+esc(c.title)+(c.phase==='finished'?' · پایان‌یافته':'')+'</option>').join('');$('#nextPanelSelect').value=current?.nextPanelId||'';
  document.querySelectorAll('[data-class-title]').forEach(e=>e.textContent=current?.title||'مدیریت پنل‌ها');
  const button=(c,action,label,danger=false)=>'<button class="button '+(danger?'danger':'secondary')+' small" data-class-action="'+action+'" data-class-id="'+esc(c.id)+'">'+label+'</button>';
  $('#classList').innerHTML=this.items.length?this.items.map(c=>'<article class="class-item '+(c.id===this.current()?'selected':'')+'"><div><strong>'+esc(c.title)+'</strong><span>'+esc(phases[c.phase])+' · '+fa(c.questionCount)+' سؤال</span></div><div class="class-item-actions"><button class="button '+(c.id===this.current()?'ghost':'secondary')+' small" data-select-class="'+esc(c.id)+'" '+(c.id===this.current()?'disabled':'')+'>'+(c.id===this.current()?'انتخاب‌شده':'انتخاب پنل')+'</button>'+(c.phase==='finished'?button(c,'reopen','بازگرداندن پنل'):'')+button(c,'delete','حذف پنل',true)+'</div></article>').join(''):'<p class="muted class-empty">پنل فعالی ندارید؛ پنل تازه بسازید یا از بخش حذف‌شده‌ها بازیابی کنید.</p>';
  $('#classTrashCount').textContent=fa(this.trash.length);
  $('#classTrashList').innerHTML=this.trash.length?this.trash.map(c=>'<article class="class-item"><div><strong>'+esc(c.title)+'</strong><span>'+fa(c.questionCount)+' سؤال · قابل بازیابی</span></div>'+button(c,'restore','بازیابی پنل')+'</article>').join(''):'<p class="muted class-empty">پنلی در حذف‌شده‌ها نیست.</p>';
  document.querySelectorAll('[data-select-class]').forEach(b=>b.addEventListener('click',()=>this.select(b.dataset.selectClass)));
  document.querySelectorAll('[data-class-action]').forEach(b=>b.addEventListener('click',()=>{const c=[...this.items,...this.trash].find(c=>c.id===b.dataset.classId);if(c)this.lifecycle(c,b.dataset.classAction);}));
  if(document.activeElement!==$('#renameClassTitle'))$('#renameClassTitle').value=current?.title||'';
  this.updateAvailability();if(current)this.renderQr();else{clearQrCard($('#classQr'));this.qr=null;this.qrLink='';$('#classJoinUrl').textContent='';}
 }
 async lifecycle(c,action){
  if(this.busy)return;
  if(action==='delete'&&!await this.confirm('حذف «'+c.title+'»؟','این پنل از فهرست پنل‌ها کنار می‌رود و لینک مخاطبان و نمایشگر آن غیرفعال می‌شود. سؤال‌ها و پاسخ‌ها حفظ می‌شوند و از بخش حذف‌شده‌ها قابل بازیابی‌اند.',{name:c.title,label:'حذف پنل',danger:true}))return;
  if(action==='reopen'&&!await this.confirm('بازگرداندن «'+c.title+'»؟','پنل به صفحهٔ انتظار برمی‌گردد. لینک، سؤال‌ها، پاسخ‌ها و شمارهٔ اجرای قبلی حفظ می‌شوند.',{label:'بازگرداندن پنل'}))return;
  this.setBusy(true);
  try{await this.request('/host/class-lifecycle',{method:'POST',body:{classId:c.id,action,...(action==='delete'?{confirmTitle:c.title}:{})}});await this.load();
   if(action==='delete'&&c.id===this.current())await this.switchClass(this.items[0]?.id||c.id,true);
   else if(action!=='delete')await this.switchClass(c.id,true);
   this.render();this.notify(action==='delete'?'پنل به حذف‌شده‌ها منتقل شد؛ هر زمان خواستید بازیابی کنید.':'پنل بازگردانده شد؛ از بخش اجرای مجری سؤال را باز کنید.');
  }catch(e){this.notify(e.message,true)}finally{this.setBusy(false)}
 }
 async select(id){if(!id||this.busy||id===this.current())return;this.setBusy(true);try{await this.switchClass(id);this.render();this.notify('پنل انتخاب شد؛ لینک و QR مربوط به همین پنل است.');}catch(e){this.notify(e.message,true);this.render()}finally{this.setBusy(false)}}
 async create(values){
  if(this.busy)return;this.setBusy(true);
  const signature=JSON.stringify([this.current(),values]);
  if(this.pending?.signature!==signature)this.pending={signature,requestId:crypto.randomUUID()};
  try{const created=await this.request('/host/classes',{method:'POST',body:{...values,requestId:this.pending.requestId}});this.pending=null;await this.switchClass(created.id);await this.load();$('#newClassTitle').value='';this.notify('پنل تازه آماده است؛ لینک و QR را منتشر کنید.');}
  catch(e){this.notify(this.pending?e.message+' برای تلاش دوباره، همان دکمه را بزنید.':'پنل ساخته شد؛ برای دریافت اطلاعات آن، صفحه را تازه‌سازی کنید.',true)}finally{this.setBusy(false)}
 }
 link(){return classUrl('./',this.current(),location.href).href;}
 renderQr(){
  const link=this.link();$('#classJoinUrl').textContent=link;$('#classJoinUrl').href=link;
  $('#participantPreview').href=link;
  const title='ورود به '+(this.items.find(c=>c.id===this.current())?.title||'پنل');
  if(!window.qrcode)return;if(this.qrLink!==link||!this.qr){const qr=window.qrcode(0,'M');qr.addData(link);qr.make();this.qr=qr;this.qrLink=link;}
  const svg=this.qr.createSvgTag({cellSize:5,margin:20,scalable:true,alt:'ورود به نظرسنجی همین پنل'});
  setQrCard($('#classQr'),{url:link,title,svg});
 }
 async copy(){try{await navigator.clipboard.writeText(this.link());this.notify('لینک ورود همین پنل کپی شد.')}catch{this.notify('لینک پنل: '+this.link())}}
 async downloadQr(){
  try{
   await document.fonts.ready;
   const cells=this.qr.getModuleCount(),quiet=4,scale=Math.max(5,Math.floor(900/(cells+quiet*2))),size=(cells+quiet*2)*scale;
   const canvas=document.createElement('canvas');canvas.width=size;canvas.height=size+150;const ctx=canvas.getContext('2d');ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#052c25';
   for(let r=0;r<cells;r++)for(let c=0;c<cells;c++)if(this.qr.isDark(r,c))ctx.fillRect((c+quiet)*scale,(r+quiet)*scale,scale,scale);
   ctx.direction='rtl';ctx.textAlign='center';ctx.font='600 30px "Pinar VF", Tahoma';
   ctx.fillText(this.items.find(c=>c.id===this.current())?.title||'پنل',size/2,size+45,size-60);ctx.font='23px "Pinar VF", Tahoma';ctx.fillText('اسکن برای ورود به نظرسنجی',size/2,size+100,size-60);
   const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error();const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='panel-qr-'+this.current()+'.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),15000);this.notify('تصویر QR همین پنل آماده شد.');
  }catch{this.notify('دریافت تصویر انجام نشد؛ دوباره تلاش کنید.',true)}
 }
}
