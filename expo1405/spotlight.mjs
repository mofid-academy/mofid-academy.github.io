// Pointer-following radial spotlight, adapted to the site's static card markup.
const fine=matchMedia('(hover: hover) and (pointer: fine)');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let active=null,layer=null,frame=0,x=0,y=0;
function clear(){if(layer)layer.style.opacity='0';active=null;layer=null;cancelAnimationFrame(frame);frame=0;}
document.addEventListener('pointermove',event=>{
 if(!fine.matches||reduced.matches||event.pointerType==='touch')return clear();
 const card=event.target.closest?.('.card');
 if(!card)return clear();
 if(card!==active){clear();active=card;layer=card.querySelector(':scope > .pointer-spotlight');if(!layer){layer=document.createElement('div');layer.className='pointer-spotlight';layer.setAttribute('aria-hidden','true');card.append(layer);}}
 x=event.clientX;y=event.clientY;
 if(!frame)frame=requestAnimationFrame(()=>{frame=0;if(!active||!layer)return;const r=active.getBoundingClientRect();layer.style.background=`radial-gradient(280px circle at ${x-r.left}px ${y-r.top}px, rgba(0,80,113,.10), transparent 75%)`;layer.style.opacity='1';});
},{passive:true});
document.documentElement.addEventListener('pointerleave',clear);window.addEventListener('blur',clear);document.addEventListener('visibilitychange',()=>{if(document.hidden)clear();});
