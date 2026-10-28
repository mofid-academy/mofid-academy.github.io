/* Mofid Academy entry surfaces. Visual effects never read form values or account storage. */
(function () {
  'use strict';
  if(window.MofidEntryUI)return;
  const script=document.currentScript;
  const assetBase=new URL('.',script?.src||new URL('/academy-assets/',location.href));
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),fine=matchMedia('(pointer: fine)');
  const mounted=new WeakMap();
  let paper;
  const loadMetal=()=>paper??=Promise.all([
    import(new URL('vendor/paper-shaders-0.0.82/shader-mount.js',assetBase).href),
    import(new URL('vendor/paper-shaders-0.0.82/shaders/liquid-metal.js',assetBase).href)
  ]);
  function mountMetal(surface,trigger=surface) {
    if(!surface)return ()=>{};
    const host=surface.querySelector('.mofid-metal-shader');
    if(!host)return ()=>{};
    let mount,closed=false,boostTimer;
    const speed=value=>mount?.setSpeed(reduced.matches?0:value);
    const enter=()=>{surface.classList.add('metal-hover');speed(1);};
    const leave=()=>{surface.classList.remove('metal-hover');surface.classList.remove('metal-pressed');speed(.6);};
    const down=event=>{
      if(trigger.disabled)return;
      surface.classList.add('metal-pressed');speed(2.4);clearTimeout(boostTimer);boostTimer=setTimeout(()=>speed(surface.matches(':hover')?1:.6),300);
      const rect=surface.getBoundingClientRect(),ripple=document.createElement('span');ripple.className='mofid-metal-ripple';
      const inside=event.clientX>=rect.left&&event.clientX<=rect.right&&event.clientY>=rect.top&&event.clientY<=rect.bottom;
      ripple.style.left=(inside?event.clientX-rect.left:rect.width/2)+'px';ripple.style.top=(inside?event.clientY-rect.top:rect.height/2)+'px';
      surface.append(ripple);ripple.addEventListener('animationend',()=>ripple.remove(),{once:true});
    };
    const up=()=>surface.classList.remove('metal-pressed');
    const preference=()=>speed(surface.matches(':hover')?1:.6);
    trigger.addEventListener('pointerenter',enter);trigger.addEventListener('pointerleave',leave);trigger.addEventListener('pointerdown',down);trigger.addEventListener('pointerup',up);trigger.addEventListener('pointercancel',leave);reduced.addEventListener('change',preference);
    loadMetal().then(([{ShaderMount},{liquidMetalFragmentShader}])=>{
      if(closed||!host.isConnected)return;
      try{
        mount=new ShaderMount(host,liquidMetalFragmentShader,{
          u_repetition:4,u_softness:.5,u_shiftRed:.08,u_shiftBlue:.08,u_distortion:0,u_contour:0,u_angle:45,u_scale:8,u_shape:1,u_offsetX:.1,u_offsetY:-.1,
          u_fit:0,u_rotation:0,u_originX:.5,u_originY:.5,u_worldWidth:0,u_worldHeight:0,u_isImage:false,u_colorBack:[0,0,0,0],u_colorTint:[.7,.94,.79,.6]
        },{alpha:true,antialias:false,powerPreference:'low-power'},reduced.matches?0:.6,0,1.5,250000);
        surface.dataset.metalRenderer='webgl';
      }catch{surface.dataset.metalRenderer='css';}
    }).catch(()=>{surface.dataset.metalRenderer='css';});
    return ()=>{closed=true;clearTimeout(boostTimer);mount?.dispose();trigger.removeEventListener('pointerenter',enter);trigger.removeEventListener('pointerleave',leave);trigger.removeEventListener('pointerdown',down);trigger.removeEventListener('pointerup',up);trigger.removeEventListener('pointercancel',leave);reduced.removeEventListener('change',preference);};
  }
  function mountBackground(kind) {
    const root=document.documentElement,previous=root.getAttribute('data-mofid-entry');
    root.dataset.mofidEntry=kind;
    const background=document.createElement('div');background.className='mofid-entry-background';background.setAttribute('aria-hidden','true');background.inert=true;
    const blobs=document.createElement('div');blobs.className='mofid-gradient-blobs';
    for(let i=0;i<5;i++){const blob=document.createElement('i');blob.className='mofid-gradient-blob gradient-'+(i+1);blobs.append(blob);}
    const pointer=document.createElement('i');pointer.className='mofid-gradient-pointer';blobs.append(pointer);background.append(blobs);document.body.prepend(background);
    let frame=0,currentX=innerWidth*.5,currentY=innerHeight*.45,targetX=currentX,targetY=currentY;
    const draw=()=>{frame=0;currentX+=(targetX-currentX)*.065;currentY+=(targetY-currentY)*.065;pointer.style.transform='translate3d('+currentX.toFixed(2)+'px,'+currentY.toFixed(2)+'px,0)';if(Math.abs(targetX-currentX)+Math.abs(targetY-currentY)>.2&&!document.hidden)frame=requestAnimationFrame(draw);};
    const move=event=>{if(!fine.matches||reduced.matches||event.pointerType==='touch')return;targetX=event.clientX;targetY=event.clientY;pointer.classList.add('pointer-visible');if(!frame)frame=requestAnimationFrame(draw);};
    const resize=()=>{targetX=Math.max(0,Math.min(innerWidth,targetX));targetY=Math.max(0,Math.min(innerHeight,targetY));if(!frame)frame=requestAnimationFrame(draw);};
    const visibility=()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else if(!frame)frame=requestAnimationFrame(draw);};
    const preference=()=>{if(reduced.matches){cancelAnimationFrame(frame);frame=0;pointer.classList.remove('pointer-visible');}};
    document.addEventListener('pointermove',move,{passive:true});window.addEventListener('resize',resize,{passive:true});document.addEventListener('visibilitychange',visibility);reduced.addEventListener('change',preference);draw();
    return ()=>{cancelAnimationFrame(frame);document.removeEventListener('pointermove',move);window.removeEventListener('resize',resize);document.removeEventListener('visibilitychange',visibility);reduced.removeEventListener('change',preference);background.remove();if(previous===null)root.removeAttribute('data-mofid-entry');else root.setAttribute('data-mofid-entry',previous);};
  }
  function mountLogin(card) {
    if(!card)return ()=>{};
    if(mounted.has(card))return mounted.get(card);
    const cleanupBackground=mountBackground('login'),cleanupMetal=mountMetal(card.querySelector('.mofid-entry-submit'));
    const reset=()=>{card.style.setProperty('--card-rx','0deg');card.style.setProperty('--card-ry','0deg');};
    const tilt=event=>{
      if(reduced.matches||!fine.matches||card.matches(':focus-within')){reset();return;}
      const rect=card.getBoundingClientRect(),x=(event.clientX-rect.left)/rect.width-.5,y=(event.clientY-rect.top)/rect.height-.5;
      card.style.setProperty('--card-rx',(-y*7).toFixed(2)+'deg');card.style.setProperty('--card-ry',(x*7).toFixed(2)+'deg');
    };
    card.addEventListener('pointermove',tilt,{passive:true});card.addEventListener('pointerleave',reset);card.addEventListener('focusin',reset);
    const cleanup=()=>{cleanupBackground();cleanupMetal();card.removeEventListener('pointermove',tilt);card.removeEventListener('pointerleave',reset);card.removeEventListener('focusin',reset);mounted.delete(card);};
    mounted.set(card,cleanup);return cleanup;
  }
  function initHome() {
    const main=document.getElementById('academyHome');if(!main||mounted.has(main))return;
    const cleanups=[mountBackground('home')];
    main.querySelectorAll('.mofid-metal').forEach(surface=>cleanups.push(mountMetal(surface,surface.closest('a')||surface)));
    mounted.set(main,()=>cleanups.forEach(cleanup=>cleanup()));
  }
  window.MofidEntryUI=Object.freeze({mountLogin,initHome,version:'20261028-1'});
  if(script?.dataset.entrySurface==='home'){
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initHome,{once:true});else initHome();
  }
})();
