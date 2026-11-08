export const ANONYMOUS_LABEL='شرکت‌کنندهٔ ناشناس';

// New arrivals join the moving roll without rewinding the rows already on screen.
export class CreditsRoll {
  constructor(stage,{speed=65,reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches}={}) {
    this.stage=stage;this.layer=stage.querySelector('[data-credit-layer]');this.empty=stage.querySelector('[data-credit-empty]');
    this.history=new Map();this.pending=[];this.active=[];this.key='';this.speed=speed;this.paused=false;this.lastTime=0;this.idleSince=0;this.reducedMotion=reducedMotion;
    this.frame=requestAnimationFrame(t=>this.tick(t));
  }
  makeRow(entry,index) {
    const row=document.createElement('article');row.className='credit-row';
    const number=document.createElement('span');number.className='credit-number';number.textContent='با همراهی شما · '+Number(index+1).toLocaleString('fa-IR');
    const name=document.createElement('strong');name.className='credit-name';name.textContent=entry.name||ANONYMOUS_LABEL;
    const answer=document.createElement('span');answer.className='credit-answer';answer.textContent=entry.answer||'';
    row.append(number,name,answer);return row;
  }
  sync(entries,key) {
    if(key!==this.key){this.key=key;this.history.clear();this.pending=[];this.active=[];this.layer.replaceChildren();this.lastTime=0;this.idleSince=0;}
    const clean=Array.isArray(entries)?entries.filter(e=>e&&typeof e.id==='string'&&typeof e.answer==='string'):[];
    const valid=new Set(clean.map(e=>e.id));
    for(const id of this.history.keys())if(!valid.has(id)){this.history.delete(id);this.pending=this.pending.filter(p=>p.id!==id);this.active=this.active.filter(a=>{if(a.id!==id)return true;a.node.remove();return false;});}
    const arrivals=[];
    for(const entry of clean){
      if(!this.history.has(entry.id))arrivals.push(entry.id);
      this.history.set(entry.id,{id:entry.id,name:entry.name||ANONYMOUS_LABEL,answer:entry.answer});
      const row=this.active.find(a=>a.id===entry.id);if(row){row.node.querySelector('.credit-name').textContent=entry.name||ANONYMOUS_LABEL;row.node.querySelector('.credit-answer').textContent=entry.answer;row.height=row.node.offsetHeight;}
    }
    if(arrivals.length){this.pending=this.pending.filter(p=>p.fresh);for(const id of arrivals)this.pending.push({id,fresh:true});this.idleSince=0;}
    this.empty.hidden=this.history.size>0;
    this.stage.classList.toggle('credits-static',this.reducedMotion);
    if(this.reducedMotion){this.layer.replaceChildren(...[...this.history.values()].map((e,i)=>this.makeRow(e,i)));this.pending=[];}
  }
  setPaused(value){this.paused=!!value;}
  setSpeed(value){this.speed=Math.max(25,Math.min(150,Number(value)||65));}
  tick(time){
    const dt=this.lastTime?Math.min((time-this.lastTime)/1000,.08):0;this.lastTime=time;
    if(!this.reducedMotion&&!this.paused&&this.stage.offsetParent&&this.history.size){
      const factor=1+Math.min(1.4,this.pending.filter(p=>p.fresh).length/35),speed=this.speed*factor;
      for(const row of this.active){row.y-=speed*dt;row.node.style.transform='translate3d(0,'+row.y+'px,0)';}
      this.active=this.active.filter(row=>{if(row.y+row.height>=-10)return true;row.node.remove();return false;});
      const last=this.active.at(-1),height=this.stage.clientHeight;
      if(this.pending.length&&(!last||last.y+last.height+28<=height)){
        const item=this.pending.shift(),entry=this.history.get(item.id);
        if(entry){const index=[...this.history.keys()].indexOf(item.id),node=this.makeRow(entry,index);node.style.transform='translate3d(0,'+height+'px,0)';this.layer.append(node);this.active.push({id:item.id,node,y:height,height:node.offsetHeight});}
      }
      if(!this.pending.length&&!this.active.length){if(!this.idleSince)this.idleSince=time;if(time-this.idleSince>1800){this.pending=[...this.history.keys()].map(id=>({id,fresh:false}));this.idleSince=0;}}
    }
    this.frame=requestAnimationFrame(t=>this.tick(t));
  }
  destroy(){cancelAnimationFrame(this.frame);this.layer.replaceChildren();this.history.clear();this.pending=[];this.active=[];}
}
