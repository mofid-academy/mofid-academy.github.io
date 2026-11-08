import {classUrl} from './class-context.mjs?v=7';
const $=s=>document.querySelector(s),fa=n=>Number(n||0).toLocaleString('fa-IR');
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const phases={waiting:'آمادهٔ شروع',open:'در حال اجرا',closed:'رأی‌گیری بسته',finished:'پایان‌یافته'};
export class ClassesPanel{
 constructor({request,current,switchClass,notify}){
  Object.assign(this,{request,current,switchClass,notify});this.items=[];this.busy=false;this.pending=null;this.generation=0;
  $('#classSelect').addEventListener('change',()=>this.select($('#classSelect').value));
  $('#quickNextClass').addEventListener('click',()=>this.create({title:'',copyQuestions:true,closePrevious:true}));
  $('#createClassForm').addEventListener('input',()=>this.pending=null);
  $('#createClassForm').addEventListener('submit',e=>{e.preventDefault();this.create({title:$('#newClassTitle').value.trim(),copyQuestions:$('#classQuestionMode').value==='copy',closePrevious:$('#closePreviousClass').checked});});
  $('#refreshClasses').addEventListener('click',()=>this.load().catch(e=>notify(e.message,true)));
  $('#renameClassForm').addEventListener('submit',async e=>{e.preventDefault();if(this.busy)return;this.setBusy(true);try{await this.request('/host/class-title',{method:'POST',body:{title:$('#renameClassTitle').value.trim()}});await this.load();await this.switchClass(this.current(),true);this.notify('نام کلاس ذخیره شد.');}catch(e){this.notify(e.message,true)}finally{this.setBusy(false)}});
  $('#copyClassJoin').addEventListener('click',()=>this.copy());$('#downloadClassQr').addEventListener('click',()=>this.downloadQr());
 }
 setBusy(value){this.busy=value;document.querySelectorAll('[data-class-control],#classSelect,#quickNextClass').forEach(e=>e.disabled=value);}
 clear(){this.generation++;this.items=[];this.pending=null;$('#classList').replaceChildren();$('#classSelect').replaceChildren();$('#classQr').replaceChildren();$('#classJoinUrl').textContent='';}
 async load(){const generation=this.generation,{classes}=await this.request('/host/classes');if(generation!==this.generation)return;this.items=classes;this.render();}
 render(){
  const current=this.items.find(c=>c.id===this.current());
  $('#classSelect').innerHTML=this.items.map(c=>'<option value="'+esc(c.id)+'">'+esc(c.title)+' · '+esc(phases[c.phase])+'</option>').join('');$('#classSelect').value=this.current();
  document.querySelectorAll('[data-class-title]').forEach(e=>e.textContent=current?.title||'کلاس');
  $('#classList').innerHTML=this.items.map(c=>'<article class="class-item '+(c.id===this.current()?'selected':'')+'"><div><strong>'+esc(c.title)+'</strong><span>'+esc(phases[c.phase])+' · '+fa(c.questionCount)+' سؤال</span></div><button class="button '+(c.id===this.current()?'ghost':'secondary')+' small" data-select-class="'+esc(c.id)+'" '+(c.id===this.current()?'disabled':'')+'>'+(c.id===this.current()?'انتخاب‌شده':'انتخاب کلاس')+'</button></article>').join('');
  document.querySelectorAll('[data-select-class]').forEach(b=>b.addEventListener('click',()=>this.select(b.dataset.selectClass)));
  if(document.activeElement!==$('#renameClassTitle'))$('#renameClassTitle').value=current?.title||'';
  this.renderQr();
 }
 async select(id){if(this.busy||id===this.current())return;this.setBusy(true);try{await this.switchClass(id);this.render();this.notify('کلاس انتخاب شد؛ لینک و QR مربوط به همین کلاس است.');}catch(e){this.notify(e.message,true);this.render()}finally{this.setBusy(false)}}
 async create(values){
  if(this.busy)return;this.setBusy(true);
  const signature=JSON.stringify([this.current(),values]);
  if(this.pending?.signature!==signature)this.pending={signature,requestId:crypto.randomUUID()};
  try{const created=await this.request('/host/classes',{method:'POST',body:{...values,requestId:this.pending.requestId}});this.pending=null;await this.switchClass(created.id);await this.load();$('#newClassTitle').value='';this.notify('کلاس تازه آماده است؛ لینک و QR را منتشر کنید.');}
  catch(e){this.notify(this.pending?e.message+' برای تلاش دوباره، همان دکمه را بزنید.':'کلاس ساخته شد؛ برای دریافت اطلاعات آن، صفحه را تازه‌سازی کنید.',true)}finally{this.setBusy(false)}
 }
 link(){return classUrl('./',this.current(),location.href).href;}
 renderQr(){
  const link=this.link();$('#classJoinUrl').textContent=link;$('#classJoinUrl').href=link;
  $('#participantPreview').href=link;
  if(!window.qrcode)return;const qr=window.qrcode(0,'M');qr.addData(link);qr.make();this.qr=qr;
  $('#classQr').innerHTML=qr.createSvgTag({cellSize:5,margin:20,scalable:true,alt:'ورود به '+(this.items.find(c=>c.id===this.current())?.title||'کلاس')});
 }
 async copy(){try{await navigator.clipboard.writeText(this.link());this.notify('لینک ورود همین کلاس کپی شد.')}catch{this.notify('لینک کلاس: '+this.link())}}
 async downloadQr(){
  try{
   await document.fonts.ready;
   const cells=this.qr.getModuleCount(),quiet=4,scale=Math.max(5,Math.floor(900/(cells+quiet*2))),size=(cells+quiet*2)*scale;
   const canvas=document.createElement('canvas');canvas.width=size;canvas.height=size+150;const ctx=canvas.getContext('2d');ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#052c25';
   for(let r=0;r<cells;r++)for(let c=0;c<cells;c++)if(this.qr.isDark(r,c))ctx.fillRect((c+quiet)*scale,(r+quiet)*scale,scale,scale);
   ctx.direction='rtl';ctx.textAlign='center';ctx.font='600 30px "Pinar-VF", Tahoma';
   ctx.fillText(this.items.find(c=>c.id===this.current())?.title||'کلاس',size/2,size+45,size-60);ctx.font='23px "Pinar-VF", Tahoma';ctx.fillText('اسکن برای ورود به نظرسنجی',size/2,size+100,size-60);
   const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error();const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='class-qr-'+this.current()+'.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),15000);this.notify('تصویر QR همین کلاس آماده شد.');
  }catch{this.notify('دریافت تصویر انجام نشد؛ دوباره تلاش کنید.',true)}
 }
}
