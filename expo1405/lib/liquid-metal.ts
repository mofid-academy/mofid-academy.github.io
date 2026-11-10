// Liquid Metal Button: Joly UI / johuniq, adapted to native poll controls.
// Uses the same Paper Design liquid-metal shader, loaded only on interaction.
const selector='.option-button,.join-cta,.button.primary:not(.danger),.qr-download,.liquid-metal-button';
export function installLiquidMetal(){
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),pointer=matchMedia('(hover: hover) and (pointer: fine)');
 let active:HTMLButtonElement|null=null,layer:HTMLSpanElement|null=null,mount:import('@paper-design/shaders').ShaderMount|null=null,version=0,failed=false;
 let library:Promise<typeof import('@paper-design/shaders')>|null=null;
 const clear=()=>{version++;mount?.dispose();mount=null;layer?.remove();layer=null;active=null;};
 const buttonFor=(target:EventTarget|null)=>target instanceof Element?target.closest<HTMLButtonElement>(selector):null;
 const show=async(button:HTMLButtonElement|null)=>{
  if(!button||button.disabled||document.hidden||reduced.matches||!pointer.matches||failed||button===active)return;
  clear();active=button;const current=version;
  try{
   const {ShaderMount,liquidMetalFragmentShader}=await(library??=import('@paper-design/shaders'));
   if(current!==version||!button.isConnected||button.disabled||document.hidden)return;
   layer=document.createElement('span');layer.className='liquid-metal-effect';layer.setAttribute('aria-hidden','true');button.prepend(layer);
   mount=new ShaderMount(layer,liquidMetalFragmentShader,{
    u_colorBack:[0.03,0.12,0.09,1],u_colorTint:[0.18,0.67,0.51,1],
    u_repetition:4,u_softness:0.5,u_shiftRed:0.12,u_shiftBlue:0.12,u_distortion:0.08,u_contour:0.1,u_angle:45,u_scale:8,u_shape:0,u_isImage:false,
    u_fit:2,u_rotation:0,u_originX:0.5,u_originY:0.5,u_offsetX:0.1,u_offsetY:-0.1,u_worldWidth:0,u_worldHeight:0,
   },{alpha:false,antialias:false},0.6,0,1,180000);
  }catch{clear();failed=true;}
 };
 document.addEventListener('pointerover',e=>{if(e.pointerType==='mouse')void show(buttonFor(e.target));});
 document.addEventListener('pointerout',e=>{if(active&&buttonFor(e.target)===active&&!(e.relatedTarget instanceof Node&&active.contains(e.relatedTarget)))clear();});
 document.addEventListener('focusin',e=>{void show(buttonFor(e.target));});
 document.addEventListener('focusout',e=>{if(active&&!(e.relatedTarget instanceof Node&&active.contains(e.relatedTarget)))clear();});
 document.addEventListener('pointerdown',e=>{if(buttonFor(e.target)===active)mount?.setSpeed(1.4);});
 document.addEventListener('pointerup',()=>mount?.setSpeed(0.6));
 document.addEventListener('visibilitychange',()=>{if(document.hidden)clear();});
 window.addEventListener('pagehide',clear);
 reduced.addEventListener('change',clear);pointer.addEventListener('change',clear);
 const observer=new MutationObserver(()=>{if(active&&(!active.isConnected||active.disabled))clear();});
 observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['disabled']});
}
