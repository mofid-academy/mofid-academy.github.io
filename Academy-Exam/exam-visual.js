/* Read-only visual indicators. Never writes exam state, answers or storage. */
(function(){
 'use strict';
 const view=document.getElementById('view'),side=document.querySelector('.side');
 if(!view||!side||document.getElementById('academyQuestionMap'))return;
 document.documentElement.dataset.academyVisual='20261020';
 const art=document.createElement('div');art.className='academy-intro-art';art.setAttribute('aria-hidden','true');
 const paper=document.createElement('div');paper.className='academy-intro-paper';
 for(let i=0;i<2;i++){const line=document.createElement('i');line.className='academy-intro-line';paper.append(line);}
 for(let i=0;i<4;i++){const line=document.createElement('span');line.className='academy-intro-choice';paper.append(line);}
 art.append(paper);document.querySelector('.card')?.append(art);
 const panel=document.createElement('section');panel.id='academyQuestionMap';panel.className='academy-question-map';panel.hidden=true;
 const title=document.createElement('p');title.className='academy-question-map-title';title.textContent='مسیر پاسخ‌دادن شما';
 const grid=document.createElement('div');grid.className='academy-question-map-grid';grid.setAttribute('role','list');grid.setAttribute('aria-label','وضعیت پاسخ به سؤال‌ها');
 const legend=document.createElement('p');legend.className='academy-question-map-legend';
 for(const text of ['پاسخ دارد','بی‌پاسخ','سؤال فعلی']){const item=document.createElement('span'),dot=document.createElement('i');item.append(dot,document.createTextNode(text));legend.append(item);}
 panel.append(title,grid,legend);side.querySelector('.facts')?.insertAdjacentElement('afterend',panel);
 let count=0,scheduled=false;
 const fa=n=>String(n).replace(/[0-9]/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d]);
 function draw(){
  scheduled=false;
  const screen=view.querySelector('#nm')?'intro':view.querySelector('.qtext')?'question':view.querySelector('.rev')?'review':view.querySelector('.spin')?'loading':view.querySelector('.big')?'done':'message';
  document.body.dataset.academyScreen=screen;panel.hidden=!['question','review'].includes(screen);
  let questions=[],responses={},current=-1;
  try{if(typeof exam!=='undefined'&&exam)questions=exam.questions||[];if(typeof answers!=='undefined')responses=answers||{};if(typeof step!=='undefined')current=step;}catch{}
  if(count!==questions.length){
   count=questions.length;grid.replaceChildren();
   for(let i=0;i<count;i++){const item=document.createElement('span');item.className='academy-question-map-item';item.setAttribute('role','listitem');item.textContent=fa(i+1);grid.append(item);}
  }
  [...grid.children].forEach((item,i)=>{
   const filled=!!String(responses[questions[i]?.qid??i+1]??'').trim(),isCurrent=screen==='question'&&current===i;
   item.dataset.state=filled?'answered':'empty';item.dataset.current=String(isCurrent);
   item.setAttribute('aria-label','سؤال '+fa(i+1)+(isCurrent?'، سؤال فعلی':filled?'، پاسخ دارد':'، بی‌پاسخ'));
  });
 }
 const schedule=()=>{if(!scheduled){scheduled=true;requestAnimationFrame(draw);}};
 new MutationObserver(schedule).observe(view,{childList:true,subtree:true,attributes:true,attributeFilter:['aria-pressed']});
 draw();
})();
