// Animate the exact supplied glass PNG; do not reconstruct the brand artwork.
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let active=null,burst=null;
function pixels(img){
 if(!img.complete||!img.naturalWidth)return [];
 const c=document.createElement('canvas');c.width=c.height=180;const ctx=c.getContext('2d',{willReadFrequently:true});if(!ctx)return [];
 try{ctx.drawImage(img,0,0,180,180);const d=ctx.getImageData(0,0,180,180).data,out=[];
 for(let y=0;y<180;y+=3)for(let x=0;x<180;x+=3){const i=(y*180+x)*4;if(d[i+3]>=100)out.push({x:x/180,y:y/180,c:`rgb(${d[i]},${d[i+1]},${d[i+2]})`,a:d[i+3]/255});}return out;}catch{return [];}
}
function explode(points,rect){
 burst?.();burst=null;if(reduced.matches||document.hidden||!points.length||!rect.width)return;
 const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');if(!ctx)return;
 const w=innerWidth,h=innerHeight,dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=w*dpr;canvas.height=h*dpr;canvas.setAttribute('aria-hidden','true');
 Object.assign(canvas.style,{position:'fixed',inset:'0',width:'100%',height:'100%',pointerEvents:'none',zIndex:'60'});document.body.append(canvas);ctx.scale(dpr,dpr);
 const pieces=points.map((p,i)=>{const angle=i*2.399963+Math.atan2(p.y-.5,p.x-.5),speed=90+(i*73%250);return {...p,px:rect.left+p.x*rect.width,py:rect.top+p.y*rect.height,dx:Math.cos(angle)*speed,dy:Math.sin(angle)*speed-35,size:Math.max(1.3,rect.width/100)};});
 let raf=0,start=null,timer=0;const finish=()=>{cancelAnimationFrame(raf);clearTimeout(timer);canvas.remove();if(burst===finish)burst=null;};burst=finish;timer=setTimeout(finish,1200);
 function frame(now){if(start===null)start=now;const t=Math.min((now-start)/850,1),ease=1-Math.pow(1-t,3);ctx.clearRect(0,0,w,h);
 for(const p of pieces){ctx.globalAlpha=p.a*Math.pow(1-t,1.3);ctx.fillStyle=p.c;ctx.beginPath();ctx.arc(p.px+p.dx*ease,p.py+p.dy*ease+70*t*t,p.size*(1-.75*t),0,Math.PI*2);ctx.fill();}
 if(t<1&&!document.hidden)raf=requestAnimationFrame(frame);else finish();}raf=requestAnimationFrame(frame);
 for(const el of document.querySelectorAll('#screenQuestion > .question-heading,#resultsBody,#creditsStage'))if(!el.hidden)el.animate([{opacity:0,transform:'translateY(12px)'},{opacity:1,transform:'translateY(0)'}],{delay:370,duration:420,easing:'cubic-bezier(.2,.7,.2,1)',fill:'backwards'});
}
function mount(host){
 const img=host.querySelector('img');if(!img)return null;
 let points=pixels(img),rect=host.getBoundingClientRect();
 const sample=()=>{points=pixels(img);};img.addEventListener('load',sample);
 const resize=new ResizeObserver(()=>{rect=host.getBoundingClientRect();});resize.observe(host);
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
 return {host,explode(){explode(points,rect);},dispose(){img.removeEventListener('load',sample);resize.disconnect();animation.cancel();observer.disconnect();document.removeEventListener('visibilitychange',syncMotion);reduced.removeEventListener('change',syncMotion);}};
}
function sync(){const host=document.querySelector('.screen-waiting-art.easytrader-art');if(active?.host===host)return;if(active&&!host&&document.querySelector('#screenQuestion > .question-heading'))active.explode();else if(host){burst?.();burst=null;}active?.dispose();active=null;if(host)active=mount(host);}
const container=document.getElementById('screenQuestion');if(container){new MutationObserver(sync).observe(container,{childList:true,subtree:true});sync();}
