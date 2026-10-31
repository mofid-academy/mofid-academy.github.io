// Spotlight framing inspired by Hossain Jahed's 21st.dev Spotlight Card.
// Liquid-metal controls adapt the supplied prompt without replacing native radios.
let paperLibrary;
const loadPaper=()=>paperLibrary??=(import('./assets/liquid-metal.mjs?v=20261031.6').catch(()=>null));
export function mountQuestionEffects(card,view){
  const events=new AbortController(),{signal}=events;
  const reduced=matchMedia('(prefers-reduced-motion:reduce)');
  let disposed=false,frame=0,active=null,shader=null,shaderHost=null,shaderFailed=false;
  const labels=[...view.querySelectorAll('.choice,.number-option')];
  const canAnimate=()=>!reduced.matches&&!navigator.connection?.saveData&&!shaderFailed;
  card.classList.add('spotlight-card');
  labels.forEach(label=>label.classList.add('metal-option'));
  // Download once; create at most one WebGL canvas for the active option.
  if(labels.length&&canAnimate())loadPaper();
  function spot(x,y){
    card.style.setProperty('--spotlight-x',x+'px');
    card.style.setProperty('--spotlight-y',y+'px');
    card.style.setProperty('--spotlight-opacity','.85');
  }
  function pointerSpot(e){
    if(reduced.matches||frame)return;
    const {clientX,clientY}=e;
    frame=requestAnimationFrame(()=>{frame=0;const rect=card.getBoundingClientRect();spot(clientX-rect.left,clientY-rect.top);});
  }
  const getLabel=target=>target instanceof Element?target.closest('.metal-option'):null;
  async function activate(label,speed=1){
    active=label;
    if(!canAnimate())return;
    const paper=await loadPaper();
    if(disposed||active!==label||!label.isConnected||!paper||!canAnimate())return;
    try{
      if(!shaderHost){shaderHost=document.createElement('span');shaderHost.className='metal-shader';shaderHost.setAttribute('aria-hidden','true');}
      label.prepend(shaderHost);
      if(!shader){
        shader=new paper.ShaderMount(shaderHost,paper.liquidMetalFragmentShader,{
          u_repetition:4,u_softness:.5,u_shiftRed:.3,u_shiftBlue:.3,
          u_distortion:0,u_contour:0,u_angle:45,u_scale:8,u_shape:1,
          u_offsetX:.1,u_offsetY:-.1,u_colorBack:[.06,.23,.21,1],
          u_colorTint:[.55,.94,.84,.18],u_isImage:false,u_fit:2,
          u_rotation:0,u_originX:.5,u_originY:.5,u_worldWidth:0,u_worldHeight:0
        },{alpha:true,powerPreference:'low-power'},speed,0,1,120000);
        shader.canvasElement.setAttribute('aria-hidden','true');
      }else shader.setSpeed(speed);
    }catch{
      shaderFailed=true;shader?.dispose();shader=null;shaderHost?.remove();
    }
  }
  function rest(){active=null;shader?.setSpeed(0);}
  function release(){labels.forEach(label=>label.classList.remove('is-pressed'));}
  function ripple(label,e){
    if(reduced.matches)return;
    const rect=label.getBoundingClientRect(),r=document.createElement('span');
    r.className='metal-ripple';r.setAttribute('aria-hidden','true');
    r.style.setProperty('--ripple-x',(e.clientX-rect.left)+'px');
    r.style.setProperty('--ripple-y',(e.clientY-rect.top)+'px');
    r.style.setProperty('--ripple-size',Math.max(rect.width,rect.height)*2+'px');
    label.append(r);r.addEventListener('animationend',()=>r.remove(),{once:true});
  }
  card.addEventListener('pointermove',pointerSpot,{signal,passive:true});
  card.addEventListener('pointerleave',()=>{card.style.removeProperty('--spotlight-opacity');release();rest();},{signal});
  view.addEventListener('pointerover',e=>{
    const label=getLabel(e.target);if(label&&!label.contains(e.relatedTarget)){label.classList.add('is-hovered');activate(label);}
  },{signal,passive:true});
  view.addEventListener('pointerout',e=>{
    const label=getLabel(e.target);if(label&&!label.contains(e.relatedTarget)){label.classList.remove('is-hovered','is-pressed');if(active===label)rest();}
  },{signal,passive:true});
  view.addEventListener('pointerdown',e=>{
    const label=getLabel(e.target);if(!label)return;
    label.classList.add('is-pressed');ripple(label,e);pointerSpot(e);activate(label,2.4);
  },{signal,passive:true});
  window.addEventListener('pointerup',release,{signal,passive:true});
  window.addEventListener('pointercancel',release,{signal,passive:true});
  view.addEventListener('focusin',e=>{
    const label=getLabel(e.target);if(!label)return;
    const rect=label.getBoundingClientRect(),outer=card.getBoundingClientRect();
    spot(rect.left-outer.left+rect.width/2,rect.top-outer.top+rect.height/2);activate(label,.6);
  },{signal});
  view.addEventListener('focusout',e=>{if(!view.contains(e.relatedTarget))rest();},{signal});
  view.addEventListener('change',e=>{const label=getLabel(e.target);if(label)activate(label,2.4);},{signal});
  reduced.addEventListener('change',()=>{if(reduced.matches){rest();shader?.dispose();shader=null;shaderHost?.remove();}},{signal});
  return ()=>{
    disposed=true;events.abort();cancelAnimationFrame(frame);shader?.dispose();shaderHost?.remove();
    card.classList.remove('spotlight-card');
    for(const property of ['--spotlight-x','--spotlight-y','--spotlight-opacity'])card.style.removeProperty(property);
  };
}
