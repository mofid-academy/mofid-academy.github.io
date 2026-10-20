/* Appearance for the current visit and question navigation; no requests or grading. */
(function(){
 'use strict';
 const root=document.documentElement;
 const valid=value=>value==='light'||value==='dark';
 // Each page opens in light mode. Only a sandbox preview inherits its editor's mode.
 let mode=window.__ACADEMY_PREVIEW__&&valid(root.dataset.academyTheme)?root.dataset.academyTheme:'light',toggle;
 const sun='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></svg>';
 const moon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M20.5 14.3A8.5 8.5 0 0 1 9.7 3.5a8.5 8.5 0 1 0 10.8 10.8Z"/></svg>';
 function apply(value){
  if(!valid(value))return;
  mode=value;root.dataset.academyTheme=value;
  if(toggle){
   toggle.innerHTML=(value==='dark'?moon:sun)+'<span class="academy-theme-label">'+(value==='dark'?'تاریک':'روشن')+'</span>';
   const label='فعال‌کردن حالت '+(value==='dark'?'روشن':'تاریک');
   toggle.setAttribute('aria-label',label);toggle.title=label;toggle.setAttribute('aria-pressed',String(value==='dark'));
  }
  let color=document.querySelector('meta[name="theme-color"]');
  if(!color){color=document.createElement('meta');color.name='theme-color';document.head.append(color);}
  color.content=value==='dark'?'#2b3430':'#f2faf5';
  window.dispatchEvent(new CustomEvent('academy-theme-change',{detail:{mode:value}}));
 }
 window.__ACADEMY_THEME__={get:()=>mode,set:apply};
 if(!window.__ACADEMY_PREVIEW__){
  const host=document.querySelector('.topbar .actions')||document.querySelector('.top');
  if(host&&!document.getElementById('academyThemeToggle')){
   toggle=document.createElement('button');toggle.id='academyThemeToggle';toggle.className='academy-theme-toggle';toggle.type='button';
   toggle.onclick=()=>apply(mode==='dark'?'light':'dark');host.append(toggle);
  }
 }else{
  window.addEventListener('message',event=>{
   if(event.source===parent&&event.origin===window.__ACADEMY_THEME_PARENT_ORIGIN__&&event.data?.kind==='academy-preview-theme'&&valid(event.data.mode))apply(event.data.mode);
  });
 }
 apply(mode);

 const view=document.getElementById('view'),side=document.querySelector('.side');
 if(!view||!side||document.getElementById('academyQuestionMap'))return;
 root.dataset.academyVisual='20261020';
 const art=document.createElement('div');art.className='academy-intro-art';art.setAttribute('aria-hidden','true');
 const paper=document.createElement('div');paper.className='academy-intro-paper';
 for(let i=0;i<2;i++){const line=document.createElement('i');line.className='academy-intro-line';paper.append(line);}
 for(let i=0;i<4;i++){const line=document.createElement('span');line.className='academy-intro-choice';paper.append(line);}
 art.append(paper);document.querySelector('.card')?.append(art);
 const panel=document.createElement('section');panel.id='academyQuestionMap';panel.className='academy-question-map';panel.hidden=true;panel.dataset.expanded='false';
 const title=document.createElement('p');title.className='academy-question-map-title';title.textContent='مسیر پاسخ‌دادن شما';
 const disclosure=document.createElement('button');disclosure.type='button';disclosure.className='academy-question-map-toggle';disclosure.setAttribute('aria-expanded','false');disclosure.setAttribute('aria-controls','academyQuestionGrid');
 disclosure.onclick=()=>{const open=panel.dataset.expanded!=='true';panel.dataset.expanded=String(open);disclosure.setAttribute('aria-expanded',String(open));};
 const grid=document.createElement('div');grid.id='academyQuestionGrid';grid.className='academy-question-map-grid';grid.setAttribute('role','group');grid.setAttribute('aria-label','رفتن به سؤال');
 const legend=document.createElement('p');legend.className='academy-question-map-legend';
 for(const text of ['پاسخ دارد','بی‌پاسخ','سؤال فعلی']){const item=document.createElement('span'),dot=document.createElement('i');item.append(dot,document.createTextNode(text));legend.append(item);}
 const help=document.createElement('p');help.className='academy-question-map-help';help.textContent='برای رفتن به هر سؤال، شمارهٔ آن را انتخاب کنید.';
 panel.append(title,disclosure,grid,legend,help);side.querySelector('.facts')?.insertAdjacentElement('afterend',panel);
 let count=0,scheduled=false,navigationId=0;
 const fa=n=>String(n).replace(/[0-9]/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d]);
 async function navigate(index){
  const request=++navigationId;
  try{
   let moved=false;
   if(typeof window.__ACADEMY_NAVIGATE_QUESTION__==='function')moved=await window.__ACADEMY_NAVIGATE_QUESTION__(index);
   else if(window.__ACADEMY_PREVIEW__&&typeof go==='function'&&!sending){await go(index,{navigation:'question-map'});moved=step===index;}
   if(!moved||request!==navigationId)return;
   if(window.matchMedia('(max-width:880px)').matches){panel.dataset.expanded='false';disclosure.setAttribute('aria-expanded','false');}
   const question=view.querySelector('.qtext');if(question){question.tabIndex=-1;question.focus({preventScroll:true});}
  }catch{ /* Existing timer/session gates retain control if a move is rejected. */ }
 }
 grid.addEventListener('click',event=>{const button=event.target.closest('button[data-question-index]');if(button&&!button.disabled)navigate(Number(button.dataset.questionIndex));});
 grid.addEventListener('keydown',event=>{
  event.stopPropagation();
  const button=event.target.closest('button[data-question-index]');if(!button)return;
  const index=Number(button.dataset.questionIndex),columns=getComputedStyle(grid).gridTemplateColumns.split(' ').length;
  const delta={ArrowLeft:1,ArrowRight:-1,ArrowDown:columns,ArrowUp:-columns}[event.key];
  let target=event.key==='Home'?0:event.key==='End'?count-1:delta===undefined?null:index+delta;
  if(target===null)return;event.preventDefault();target=Math.max(0,Math.min(count-1,target));grid.children[target]?.focus();
 });
 function draw(){
  scheduled=false;
  const screen=view.querySelector('#nm')?'intro':view.querySelector('.qtext')?'question':view.querySelector('.rev')?'review':view.querySelector('.spin')?'loading':view.querySelector('.big')?'done':'message';
  document.body.dataset.academyScreen=screen;panel.hidden=!['question','review'].includes(screen);
  let questions=[],responses={},current=-1,blocked=true;
  try{if(typeof exam!=='undefined'&&exam)questions=exam.questions||[];if(typeof answers!=='undefined')responses=answers||{};if(typeof step!=='undefined')current=step;blocked=!!sending||window.__ACADEMY_EXPIRED__===true||!['question','review'].includes(screen);}catch{}
  if(count!==questions.length){
   count=questions.length;grid.replaceChildren();
   for(let i=0;i<count;i++){const item=document.createElement('button');item.type='button';item.className='academy-question-map-item';item.dataset.questionIndex=String(i);item.textContent=fa(i+1);grid.append(item);}
  }
  disclosure.textContent=(screen==='question'?'سؤال '+fa(current+1)+' از '+fa(count):'مرور '+fa(count)+' سؤال')+' · فهرست سؤال‌ها';
  [...grid.children].forEach((item,i)=>{
   const filled=!!String(responses[questions[i]?.qid??i+1]??'').trim(),isCurrent=screen==='question'&&current===i;
   item.dataset.state=filled?'answered':'empty';item.dataset.current=String(isCurrent);item.disabled=blocked;
   item.tabIndex=isCurrent||(screen==='review'&&i===0)?0:-1;
   if(isCurrent)item.setAttribute('aria-current','step');else item.removeAttribute('aria-current');
   item.setAttribute('aria-label','رفتن به سؤال '+fa(i+1)+(isCurrent?'، سؤال فعلی':filled?'، پاسخ دارد':'، بی‌پاسخ'));
  });
 }
 const schedule=()=>{if(!scheduled){scheduled=true;requestAnimationFrame(draw);}};
 new MutationObserver(schedule).observe(view,{childList:true,subtree:true,attributes:true,attributeFilter:['aria-pressed']});
 draw();
})();
