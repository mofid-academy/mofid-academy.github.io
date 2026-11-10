// Joly UI / johuniq liquid-metal shader, with bounded visible idle rendering.
const selector='.option-button,.join-cta,.button.primary:not(.danger),.qr-download,.liquid-metal-button';
type Effect={layer:HTMLSpanElement;mount:import('@paper-design/shaders').ShaderMount|null;cancelled:boolean};
export function installLiquidMetal(){
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),pointer=matchMedia('(hover: hover) and (pointer: fine)');
 const effects=new Map<HTMLButtonElement,Effect>(),motionOrigin=performance.now();
 let library:Promise<typeof import('@paper-design/shaders')>|null=null,failed=false,queued=false;
 const remove=(button:HTMLButtonElement)=>{const effect=effects.get(button);if(!effect)return;effect.cancelled=true;effect.mount?.dispose();effect.layer.remove();effects.delete(button);};
 const clear=()=>{for(const button of effects.keys())remove(button);};
 const show=async(button:HTMLButtonElement)=>{
  if(effects.has(button)||failed)return;
  const layer=document.createElement('span');layer.className='liquid-metal-effect';layer.setAttribute('aria-hidden','true');button.prepend(layer);
  const effect:Effect={layer,mount:null,cancelled:false};effects.set(button,effect);
  try{
   const {ShaderMount,liquidMetalFragmentShader}=await(library??=import('@paper-design/shaders'));
   if(effect.cancelled||!button.isConnected||button.disabled||document.hidden)return;
   effect.mount=new ShaderMount(layer,liquidMetalFragmentShader,{
    u_colorBack:[0.03,0.12,0.09,1],u_colorTint:[0.18,0.67,0.51,1],
    u_repetition:4,u_softness:0.5,u_shiftRed:0.12,u_shiftBlue:0.12,u_distortion:0.08,u_contour:0.1,u_angle:45,u_scale:8,u_shape:0,u_isImage:false,
    u_fit:2,u_rotation:0,u_originX:0.5,u_originY:0.5,u_offsetX:0.1,u_offsetY:-0.1,u_worldWidth:0,u_worldHeight:0,
   },{alpha:false,antialias:false},0.45,(performance.now()-motionOrigin)*0.45,1,100000);
  }catch{failed=true;clear();}
 };
 const sync=()=>{
  queued=false;
  const visible:HTMLButtonElement[]=[];
  for(const button of document.querySelectorAll<HTMLButtonElement>(selector)){
   const rect=button.getBoundingClientRect();
   const shown=rect.width>0&&rect.height>0&&rect.bottom>0&&rect.top<innerHeight&&rect.right>0&&rect.left<innerWidth;
   const paused=!shown||document.hidden||reduced.matches||button.disabled;
   button.classList.toggle('metal-paused',paused);
   if(!paused)visible.push(button);
  }
  const wanted=new Set(visible.slice(0,pointer.matches?4:2));
  for(const [button,effect] of effects)if(!wanted.has(button)||!effect.layer.isConnected)remove(button);
  if(!failed)for(const button of wanted)void show(button);
 };
 const schedule=()=>{if(!queued){queued=true;requestAnimationFrame(sync);}};
 const buttonFor=(target:EventTarget|null)=>target instanceof Element?target.closest<HTMLButtonElement>(selector):null;
 document.addEventListener('pointerdown',e=>{const b=buttonFor(e.target);if(b)effects.get(b)?.mount?.setSpeed(1.4);});
 document.addEventListener('pointerup',()=>{for(const effect of effects.values())effect.mount?.setSpeed(0.45);});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){clear();sync();}else schedule();});
 window.addEventListener('pagehide',clear);window.addEventListener('pageshow',schedule);
 window.addEventListener('resize',schedule);document.addEventListener('scroll',schedule,{capture:true,passive:true});
 reduced.addEventListener('change',schedule);pointer.addEventListener('change',schedule);
 const observer=new MutationObserver(schedule);
 observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['disabled','hidden']});
 schedule();
}
