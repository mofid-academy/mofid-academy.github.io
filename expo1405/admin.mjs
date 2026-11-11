const $=s=>document.querySelector(s),fa=n=>Number(n||0).toLocaleString('fa-IR');
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date=v=>new Intl.DateTimeFormat('fa-IR',{timeZone:'Asia/Tehran',dateStyle:'short',timeStyle:'medium'}).format(new Date(v));
export class AdminPanel {
 constructor({request,className,authenticate,isAuthenticated,onLock,notify}){
  Object.assign(this,{request,className,authenticate,isAuthenticated,onLock,notify});this.summary=null;this.page=1;this.total=0;this.busy=false;this.visible=false;this.loadedRound='';this.generation=0;
  $('#adminLoginForm').addEventListener('submit',async e=>{e.preventDefault();const b=$('#adminLoginButton');b.disabled=true;$('#adminLoginError').hidden=true;try{await this.authenticate($('#adminCode').value.trim());$('#adminCode').value='';await this.show();}catch(e){$('#adminLoginError').textContent=e.message;$('#adminLoginError').hidden=false;}finally{b.disabled=false;}});
  $('#adminRound').addEventListener('change',()=>{this.page=1;this.refresh().catch(e=>this.notify(e.message,true));});
  $('#adminQuestion').addEventListener('change',()=>{this.page=1;this.loadResponses().catch(e=>this.notify(e.message,true));});
  $('#refreshAdmin').addEventListener('click',()=>this.refresh().catch(e=>this.notify(e.message,true)));
  $('#adminPrevious').addEventListener('click',()=>{if(this.page>1){this.page--;this.loadResponses().catch(e=>this.notify(e.message,true));}});
  $('#adminNext').addEventListener('click',()=>{if(this.page*50<this.total){this.page++;this.loadResponses().catch(e=>this.notify(e.message,true));}});
  $('#adminExport').addEventListener('click',()=>this.download());$('#lockAdmin').addEventListener('click',()=>this.onLock());
  this.timer=setInterval(()=>{if(this.visible&&!document.hidden&&this.isAuthenticated())this.refresh().catch(()=>{});},15000);
 }
 async show(){this.visible=true;$('#adminLoginSection').hidden=this.isAuthenticated();$('#adminWorkspace').hidden=!this.isAuthenticated();if(this.isAuthenticated())await this.refresh();}
 hide(){this.visible=false;}
 clear(){this.generation++;this.busy=false;this.summary=null;this.page=1;this.total=0;this.loadedRound='';$('#adminCode').value='';$('#adminRows').replaceChildren();$('#adminScoreRows').replaceChildren();$('#adminQuizScores').hidden=true;$('#adminQuestionCards').replaceChildren();$('#adminQuestion').replaceChildren();$('#adminRound').replaceChildren();$('#adminWorkspace').hidden=true;$('#adminLoginSection').hidden=false;}
 async refresh(){
  if(this.busy||!this.isAuthenticated())return;this.busy=true;const generation=this.generation;$('#adminLoading').hidden=false;
  try{
   const selected=$('#adminRound').value||'',data=await this.request('/admin/summary'+(selected?'?round='+encodeURIComponent(selected):''));
   if(generation!==this.generation||!this.isAuthenticated())return;
   this.summary=data;const selectedRound=selected||String(data.currentRound),question=$('#adminQuestion').value;
   $('#adminRound').innerHTML='<option value="all">همهٔ اجراها</option>'+data.rounds.map(r=>'<option value="'+r+'">اجرای '+fa(r)+'</option>').join('');$('#adminRound').value=selectedRound;
   $('#adminQuestion').innerHTML='<option value="">همهٔ سؤال‌ها</option>'+data.questions.map((q,i)=>'<option value="'+q.id+'">سؤال '+fa(i+1)+(q.archived?' · بایگانی':'')+'</option>').join('');$('#adminQuestion').value=question;
   $('#adminTotal').textContent=fa(data.totalResponses);$('#adminPeople').textContent=fa(data.totalPeople);$('#adminQuestionsCount').textContent=fa(data.questions.length);
   $('#adminQuestionCards').innerHTML=data.questions.map((q,i)=>'<button class="admin-question-card" data-admin-question="'+q.id+'"><span>سؤال '+fa(i+1)+(q.archived?' · بایگانی':'')+'</span><strong>'+esc(q.text)+'</strong><small>'+fa(q.responseCount)+' پاسخ ثبت‌شده</small></button>').join('');
   document.querySelectorAll('[data-admin-question]').forEach(b=>b.addEventListener('click',()=>{$('#adminQuestion').value=b.dataset.adminQuestion;this.page=1;this.loadResponses().catch(e=>this.notify(e.message,true));}));
   this.loadedRound=selectedRound;const grades=await this.request('/admin/quiz-results?round='+encodeURIComponent(selectedRound));
   if(generation!==this.generation||!this.isAuthenticated())return;
   $('#adminQuizScores').hidden=!grades.quiz;
   $('#adminScoreRows').innerHTML=grades.results.length?grades.results.map(g=>'<tr><td><strong>'+esc(g.name||'شرکت‌کنندهٔ ناشناس')+'</strong><small class="private-id" dir="ltr">'+esc(g.participantId)+'</small></td><td>'+fa(g.round)+'</td><td>'+fa(g.score)+' از '+fa(g.maxScore)+'</td><td>'+fa(g.percentage)+'٪</td><td>'+fa(g.correctCount)+' / '+fa(g.wrongCount)+' / '+fa(g.unansweredCount)+'</td></tr>').join(''):'<tr><td colspan="5">هنوز شرکت‌کننده‌ای وارد نشده است.</td></tr>';
   await this.loadResponses();if(generation!==this.generation)return;$('#adminTimestamp').textContent='آخرین دریافت: '+date(new Date());
  }finally{if(generation===this.generation){this.busy=false;$('#adminLoading').hidden=true;}}
 }
 async loadResponses(){
  if(!this.isAuthenticated())return;
  const qs=new URLSearchParams({round:$('#adminRound').value||this.loadedRound,page:String(this.page)});if($('#adminQuestion').value)qs.set('question',$('#adminQuestion').value);
  const generation=this.generation,sequence=this.responseSequence=(this.responseSequence||0)+1,data=await this.request('/admin/responses?'+qs);if(generation!==this.generation||sequence!==this.responseSequence||!this.isAuthenticated())return;this.total=data.total;this.page=data.page;
  $('#adminRows').innerHTML=data.responses.length?data.responses.map(v=>'<tr><td><strong>'+esc(v.display_name||'شرکت‌کنندهٔ ناشناس')+'</strong><small class="private-id" dir="ltr">'+esc(v.participant_id)+'</small></td><td><strong>'+esc(v.option_text)+'</strong><small>'+esc(v.question_text)+'</small></td><td>'+fa(v.round)+'</td><td>'+esc(date(v.created_at))+'</td></tr>').join(''):'<tr><td colspan="4" class="admin-empty">برای این انتخاب، پاسخی ثبت نشده است.</td></tr>';
  $('#adminPage').textContent='صفحهٔ '+fa(this.page)+' از '+fa(Math.max(1,Math.ceil(this.total/50)))+' · '+fa(this.total)+' پاسخ';$('#adminPrevious').disabled=this.page<=1;$('#adminNext').disabled=this.page*50>=this.total;
 }
 async download(){
  if(!this.isAuthenticated())return;
  const button=$('#adminExport'),label=button.textContent;button.disabled=true;button.textContent='در حال ساخت اکسل…';
  try{const generation=this.generation,round=$('#adminRound').value||this.loadedRound,blob=await this.request('/admin/export?round='+encodeURIComponent(round),{exportFile:true});if(generation!==this.generation||!this.isAuthenticated())return;const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=(this.className()||'class').replace(/[\\/:*?"<>|]/g,'-')+'-اجرای-'+round+'.xlsx';a.click();setTimeout(()=>URL.revokeObjectURL(url),20000);this.notify('اکسل شامل خلاصه و شیت جداگانهٔ هر سؤال آماده شد.');}catch(e){this.notify(e.message,true);}finally{button.disabled=false;button.textContent=label;}
 }
}
