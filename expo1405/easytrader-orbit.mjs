// Isolated logo stage: no page scroll, theme or polling state is changed.
import * as THREE from './vendor/three-r160.module.js';
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let active=null;
function mount(host){
 let renderer;
 try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});}catch{return;}
 const canvas=renderer.domElement;canvas.setAttribute('aria-hidden','true');
 Object.assign(canvas.style,{position:'absolute',inset:'0',width:'100%',height:'100%',pointerEvents:'none'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
 renderer.setClearColor(0,0);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(38,1,.1,100);
 const shape=new THREE.Shape();
 // Outline follows the existing EasyTrader brand ribbon, with rounded volume.
 shape.moveTo(3.421,15.87);shape.bezierCurveTo(10.079,15.296,14.019,12.47,16.154,10.189);shape.bezierCurveTo(17.375,8.889,18.147,7.628,18.752,6.461);shape.lineTo(20.578,6.461);shape.bezierCurveTo(19.573,8.494,18.717,9.893,17.37,11.329);shape.bezierCurveTo(15.019,13.837,10.69,16.951,3.421,17.539);shape.closePath();
 const geo=new THREE.ExtrudeGeometry(shape,{depth:.65,bevelEnabled:true,bevelThickness:.20,bevelSize:.16,bevelSegments:4,steps:1,curveSegments:48});
 const positions=geo.attributes.position,colors=[];
 const stops=[[0,new THREE.Color('#f0414b')],[.323,new THREE.Color('#ffcd50')],[.656,new THREE.Color('#00afcd')],[1,new THREE.Color('#46b97d')]];
 for(let i=0;i<positions.count;i++){const t=THREE.MathUtils.clamp((positions.getX(i)-3.42)/17.16,0,1);let k=0;while(k<2&&t>stops[k+1][0])k++;const c=stops[k][1].clone().lerp(stops[k+1][1],(t-stops[k][0])/(stops[k+1][0]-stops[k][0]));colors.push(c.r,c.g,c.b);}
 geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.translate(-12,-12,-.325);geo.scale(.16,-.16,.16);geo.computeVertexNormals();
 const material=new THREE.MeshPhysicalMaterial({vertexColors:true,metalness:.3,roughness:.2,clearcoat:1,clearcoatRoughness:.12,side:THREE.DoubleSide});
 const mesh=new THREE.Mesh(geo,material);scene.add(mesh);
 scene.add(new THREE.HemisphereLight(0xffffff,0x226b59,2.2));
 for(const [color,intensity,x,y,z] of [[0xffffff,4,3,4,5],[0xc9ffff,3,-4,2,-4],[0xffedc4,2,1,-3,3]]){const light=new THREE.DirectionalLight(color,intensity);light.position.set(x,y,z);scene.add(light);}
 const img=host.querySelector('img');let raf=0,last=0,angle=0,visible=true,disposed=false;
 function draw(){camera.position.set(Math.sin(angle)*5.7,.35+Math.sin(angle)*.2,Math.cos(angle)*5.7);camera.lookAt(0,0,0);renderer.render(scene,camera);}
 function tick(t){raf=0;if(disposed||document.hidden||!visible||reduced.matches)return;if(last)angle+=Math.min((t-last)/1000,.05)*Math.PI*2/32;last=t;draw();raf=requestAnimationFrame(tick);}
 function resume(){cancelAnimationFrame(raf);raf=0;last=0;if(!disposed&&!document.hidden&&visible&&!reduced.matches)raf=requestAnimationFrame(tick);}
 function resize(){const w=host.clientWidth;if(w){renderer.setSize(w,w,false);draw();}}
 const ro=new ResizeObserver(resize),io=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;resume();});
 host.append(canvas);resize();if(img)img.style.visibility='hidden';ro.observe(host);io.observe(host);document.addEventListener('visibilitychange',resume);reduced.addEventListener('change',resume);resume();
 return {host,dispose(){disposed=true;cancelAnimationFrame(raf);ro.disconnect();io.disconnect();document.removeEventListener('visibilitychange',resume);reduced.removeEventListener('change',resume);geo.dispose();material.dispose();renderer.dispose();canvas.remove();if(img)img.style.visibility='';}};
}
function sync(){const host=document.querySelector('.screen-waiting-art.easytrader-art');if(active?.host===host)return;active?.dispose();active=null;if(host)active=mount(host);}
const container=document.getElementById('screenQuestion');if(container){new MutationObserver(sync).observe(container,{childList:true,subtree:true});sync();}
