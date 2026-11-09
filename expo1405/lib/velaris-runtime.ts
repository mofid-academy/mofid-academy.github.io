// Adapted from Forge UI Velaris: https://forgeui.in/components/velaris
// The pixel and frame caps, visibility lifecycle and static fallback are for the event's mobile devices.
const vertexSource=`
attribute vec2 position;
varying vec2 vUv;
void main(){vUv=position*.5+.5;gl_Position=vec4(position,0.,1.);}
`;
const fragmentSource=`
precision highp float;
varying vec2 vUv;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_grain;
uniform vec3 u_colors[4];
uniform vec3 u_bg;
vec3 permute(vec3 x){return mod(((x*34.)+1.)*x,289.);}
float snoise(vec2 v){
 const vec4 C=vec4(.211324865405187,.366025403784439,-.577350269189626,.024390243902439);
 vec2 i=floor(v+dot(v,C.yy));vec2 x0=v-i+dot(i,C.xx);
 vec2 i1=(x0.x>x0.y)?vec2(1.,0.):vec2(0.,1.);
 vec4 x12=x0.xyxy+C.xxzz;x12.xy-=i1;i=mod(i,289.);
 vec3 p=permute(permute(i.y+vec3(0.,i1.y,1.))+i.x+vec3(0.,i1.x,1.));
 vec3 m=max(.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.);
 m=m*m;m=m*m;vec3 x=2.*fract(p*C.www)-1.;vec3 h=abs(x)-.5;vec3 ox=floor(x+.5);vec3 a0=x-ox;
 m*=1.79284291400159-.85373472095314*(a0*a0+h*h);vec3 g;
 g.x=a0.x*x0.x+h.x*x0.y;g.yz=a0.yz*x12.xz+h.yz*x12.yw;
 return 130.*dot(m,g);
}
void main(){
 vec2 uv=vUv;float ratio=u_resolution.x/max(u_resolution.y,1.);vec2 p=uv-.5;p.x*=ratio;float t=u_time*.1;
 float n1=snoise(p*.4+vec2(t*.2,-t*.3));
 float n2=snoise(p*.55+vec2(-t*.15,t*.25)+n1*.25);
 float n3=snoise(p*.75+vec2(t*.1,-t*.2)+n2*.2);
 vec3 col=u_bg;float dist=length(p)*1.5;float vignette=1.-smoothstep(.3,1.2,dist);
 col=mix(col,u_colors[0],smoothstep(-.2,.5,n1)*.85);
 col=mix(col,u_colors[1],smoothstep(-.1,.6,n2)*.7);
 col=mix(col,u_colors[2],smoothstep(-.3,.4,n3)*.6);
 col=mix(col,u_colors[3],smoothstep(0.,.7,n1*n2)*.5);
 col+=u_colors[1]*(1.-smoothstep(0.,.8,dist))*.3;col=mix(col*.2,col,vignette);
 float noise=fract(sin(dot(uv,vec2(12.9898,78.233)))*43758.5453+u_time);
 col+=(noise-.5)*u_grain*.1;gl_FragColor=vec4(col,1.);
}
`;
type VelarisSettings={bg:string;colors:readonly string[];speed:number;grain:number};
const rgb=(hex:string):[number,number,number]=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255) as [number,number,number];

export function startVelaris(canvas:HTMLCanvasElement,container:HTMLElement,settings:VelarisSettings):()=>void{
 canvas.dataset.renderer='fallback';
 let gl:WebGLRenderingContext|null=null;
 try{gl=canvas.getContext('webgl',{alpha:false,antialias:false,powerPreference:'low-power'});}catch{return()=>{};}
 if(!gl)return()=>{};
 const context=gl;
 const compile=(type:number,source:string)=>{
  const shader=context.createShader(type);if(!shader)return null;
  context.shaderSource(shader,source);context.compileShader(shader);
  if(!context.getShaderParameter(shader,context.COMPILE_STATUS)){context.deleteShader(shader);return null;}
  return shader;
 };
 const vertex=compile(context.VERTEX_SHADER,vertexSource),fragment=compile(context.FRAGMENT_SHADER,fragmentSource);
 if(!vertex||!fragment){if(vertex)context.deleteShader(vertex);if(fragment)context.deleteShader(fragment);return()=>{};}
 const program=context.createProgram(),buffer=context.createBuffer();
 if(!program||!buffer){if(program)context.deleteProgram(program);if(buffer)context.deleteBuffer(buffer);context.deleteShader(vertex);context.deleteShader(fragment);return()=>{};}
 context.attachShader(program,vertex);context.attachShader(program,fragment);context.linkProgram(program);
 if(!context.getProgramParameter(program,context.LINK_STATUS)){context.deleteProgram(program);context.deleteBuffer(buffer);context.deleteShader(vertex);context.deleteShader(fragment);return()=>{};}
 context.useProgram(program);context.bindBuffer(context.ARRAY_BUFFER,buffer);
 context.bufferData(context.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),context.STATIC_DRAW);
 const position=context.getAttribLocation(program,'position');context.enableVertexAttribArray(position);context.vertexAttribPointer(position,2,context.FLOAT,false,0,0);
 const resolution=context.getUniformLocation(program,'u_resolution'),time=context.getUniformLocation(program,'u_time');
 context.uniform1f(context.getUniformLocation(program,'u_grain'),settings.grain);
 context.uniform3f(context.getUniformLocation(program,'u_bg'),...rgb(settings.bg));
 context.uniform3fv(context.getUniformLocation(program,'u_colors[0]'),new Float32Array(settings.colors.slice(0,4).flatMap(rgb)));
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
 let frame=0,lastDraw=-Infinity,visible=true,lost=false,disposed=false,interval=1000/24;
 const stop=()=>{if(frame){window.cancelAnimationFrame(frame);frame=0;}};
 const permitted=()=>!disposed&&!lost&&!document.hidden&&visible;
 const draw=(now:number)=>{
  frame=0;if(!permitted())return;
  if(now-lastDraw>=interval){context.uniform2f(resolution,canvas.width,canvas.height);context.uniform1f(time,now*.001*settings.speed);context.drawArrays(context.TRIANGLE_STRIP,0,4);canvas.dataset.renderer='webgl';lastDraw=now;}
  if(!reduced.matches)frame=window.requestAnimationFrame(draw);
 };
 const sync=()=>{stop();if(permitted())frame=window.requestAnimationFrame(draw);};
 const resize=()=>{
  const box=container.getBoundingClientRect();const width=Math.max(1,box.width),height=Math.max(1,box.height);
  const mobile=window.innerWidth<=650,maxPixels=mobile?550000:1200000,maxDpr=mobile?1:1.25;
  const scale=Math.min(window.devicePixelRatio||1,maxDpr,Math.sqrt(maxPixels/(width*height)));
  canvas.width=Math.max(1,Math.floor(width*scale));canvas.height=Math.max(1,Math.floor(height*scale));
  context.viewport(0,0,canvas.width,canvas.height);interval=1000/(mobile?18:24);lastDraw=-Infinity;sync();
 };
 const onLost=(event:Event)=>{event.preventDefault();lost=true;stop();canvas.dataset.renderer='fallback';};
 canvas.addEventListener('webglcontextlost',onLost);document.addEventListener('visibilitychange',sync);reduced.addEventListener?.('change',sync);
 const observer=typeof ResizeObserver==='function'?new ResizeObserver(resize):null;observer?.observe(container);
 const intersection=typeof IntersectionObserver==='function'?new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting!==false;sync();}):null;intersection?.observe(container);
 window.addEventListener('resize',resize);resize();
 return()=>{disposed=true;stop();observer?.disconnect();intersection?.disconnect();window.removeEventListener('resize',resize);document.removeEventListener('visibilitychange',sync);reduced.removeEventListener?.('change',sync);canvas.removeEventListener('webglcontextlost',onLost);context.deleteBuffer(buffer);context.deleteProgram(program);context.deleteShader(vertex);context.deleteShader(fragment);};
}
