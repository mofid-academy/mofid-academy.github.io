// Decorative pointer tracking stays separate from registration and capacity.
const card=document.querySelector('[data-spotlight-card]');
if(card){
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  const fine=window.matchMedia('(hover: hover) and (pointer: fine)');
  let frame=0,point=null;
  function reset(){
    if(frame)cancelAnimationFrame(frame);
    frame=0;point=null;card.removeAttribute('data-spotlight-active');
  }
  function paint(){
    frame=0;
    if(!point||reduced.matches||!fine.matches){reset();return;}
    const rect=card.getBoundingClientRect();
    if(!rect.width||!rect.height){reset();return;}
    const x=Math.max(0,Math.min(rect.width,point.x-rect.left));
    const y=Math.max(0,Math.min(rect.height,point.y-rect.top));
    card.style.setProperty('--spotlight-x',x.toFixed(1)+'px');
    card.style.setProperty('--spotlight-y',y.toFixed(1)+'px');
    card.setAttribute('data-spotlight-active','');
  }
  function track(event){
    if(event.pointerType==='touch'||reduced.matches||!fine.matches){reset();return;}
    point={x:event.clientX,y:event.clientY};
    if(!frame)frame=requestAnimationFrame(paint);
  }
  card.addEventListener('pointerenter',track,{passive:true});
  card.addEventListener('pointermove',track,{passive:true});
  card.addEventListener('pointerleave',reset,{passive:true});
  card.addEventListener('pointercancel',reset,{passive:true});
  reduced.addEventListener('change',reset);
  fine.addEventListener('change',reset);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)reset();});
}
