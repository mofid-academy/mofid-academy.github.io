// Animate the exact supplied glass PNG; do not reconstruct the brand artwork.
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let active=null;
function mount(host){
 const img=host.querySelector('img');if(!img)return null;
 const animation=img.animate([
  {transform:'perspective(1000px) rotateX(0deg) rotateY(0deg) rotateZ(0deg) translateY(0px)'},
  {transform:'perspective(1000px) rotateX(5deg) rotateY(22deg) rotateZ(4deg) translateY(-6px)'},
  {transform:'perspective(1000px) rotateX(0deg) rotateY(0deg) rotateZ(0deg) translateY(0px)'},
  {transform:'perspective(1000px) rotateX(-5deg) rotateY(-22deg) rotateZ(-4deg) translateY(6px)'},
  {transform:'perspective(1000px) rotateX(0deg) rotateY(0deg) rotateZ(0deg) translateY(0px)'}
 ],{duration:14000,iterations:Infinity,easing:'ease-in-out'});
 let visible=true;
 function syncMotion(){if(reduced.matches){animation.pause();animation.currentTime=0;}else if(document.hidden||!visible)animation.pause();else animation.play();}
 const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;syncMotion();});observer.observe(host);
 document.addEventListener('visibilitychange',syncMotion);reduced.addEventListener('change',syncMotion);syncMotion();
 return {host,dispose(){animation.cancel();observer.disconnect();document.removeEventListener('visibilitychange',syncMotion);reduced.removeEventListener('change',syncMotion);}};
}
function sync(){const host=document.querySelector('.screen-waiting-art.easytrader-art');if(active?.host===host)return;active?.dispose();active=null;if(host)active=mount(host);}
const container=document.getElementById('screenQuestion');if(container){new MutationObserver(sync).observe(container,{childList:true,subtree:true});sync();}
