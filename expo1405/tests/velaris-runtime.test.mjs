import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {stripTypeScriptTypes} from 'node:module';

const source=fs.readFileSync(new URL('../lib/velaris-runtime.ts',import.meta.url),'utf8');
const compiled=stripTypeScriptTypes(source).replace(/^export /m,'');
const settings={bg:'#04140f',colors:['#70d8ad','#129b75','#075b48','#071d17'],speed:.45,grain:.12};

function fixture({webgl=true,reduced=false,width=390,height=844}={}){
 const events=new Map(),windowEvents=new Map(),canvasEvents=new Map(),mediaEvents=new Map(),frames=new Map(),deleted=[];
 let next=1,draws=0;
 const gl={VERTEX_SHADER:1,FRAGMENT_SHADER:2,COMPILE_STATUS:3,LINK_STATUS:4,ARRAY_BUFFER:5,STATIC_DRAW:6,FLOAT:7,TRIANGLE_STRIP:8,
  createShader:type=>({type}),shaderSource(){},compileShader(){},getShaderParameter:()=>true,createProgram:()=>({}),createBuffer:()=>({}),
  attachShader(){},linkProgram(){},getProgramParameter:()=>true,useProgram(){},bindBuffer(){},bufferData(){},getAttribLocation:()=>0,enableVertexAttribArray(){},vertexAttribPointer(){},
  getUniformLocation:(_,name)=>name,uniform1f(){},uniform2f(){},uniform3f(){},uniform3fv(){},viewport(){},drawArrays(){draws++;},
  deleteBuffer(){deleted.push('buffer');},deleteProgram(){deleted.push('program');},deleteShader(){deleted.push('shader');}
 };
 const canvas={dataset:{},width:0,height:0,getContext:()=>webgl?gl:null,addEventListener:(n,f)=>canvasEvents.set(n,f),removeEventListener:n=>canvasEvents.delete(n)};
 const container={getBoundingClientRect:()=>({width,height})};
 const media={matches:reduced,addEventListener:(n,f)=>mediaEvents.set(n,f),removeEventListener:n=>mediaEvents.delete(n)};
 const win={innerWidth:width,devicePixelRatio:3,matchMedia:()=>media,requestAnimationFrame:fn=>{const id=next++;frames.set(id,fn);return id;},cancelAnimationFrame:id=>frames.delete(id),addEventListener:(n,f)=>windowEvents.set(n,f),removeEventListener:n=>windowEvents.delete(n)};
 const doc={hidden:false,addEventListener:(n,f)=>events.set(n,f),removeEventListener:n=>events.delete(n)};
 const scope=vm.createContext({window:win,document:doc,Float32Array});vm.runInContext(compiled,scope);
 const step=now=>{const [id,fn]=frames.entries().next().value||[];assert(fn,'Expected an animation frame');frames.delete(id);fn(now);};
 return{canvas,container,media,win,doc,events,canvasEvents,mediaEvents,frames,deleted,step,start:()=>scope.startVelaris(canvas,container,settings),drawCount:()=>draws};
}

test('without WebGL the CSS fallback stays available without a render loop',()=>{
 const f=fixture({webgl:false});const dispose=f.start();assert.equal(f.canvas.dataset.renderer,'fallback');assert.equal(f.frames.size,0);dispose();
});
test('mobile rendering is pixel-capped, throttled, paused while hidden and cleaned up',()=>{
 const f=fixture({width:390,height:3000});const dispose=f.start();
 assert(f.canvas.width*f.canvas.height<=550000);assert.equal(f.frames.size,1);f.step(100);
 assert.equal(f.canvas.dataset.renderer,'webgl');assert.equal(f.drawCount(),1);
 f.step(120);assert.equal(f.drawCount(),1);f.step(180);assert.equal(f.drawCount(),2);
 f.doc.hidden=true;f.events.get('visibilitychange')();assert.equal(f.frames.size,0);
 f.doc.hidden=false;f.events.get('visibilitychange')();assert.equal(f.frames.size,1);
 dispose();assert.equal(f.frames.size,0);assert.deepEqual(f.deleted.sort(),['buffer','program','shader','shader']);assert.equal(f.events.size,0);
});
test('reduced motion renders one still frame and stays idle',()=>{
 const f=fixture({reduced:true});const dispose=f.start();f.step(100);assert.equal(f.drawCount(),1);assert.equal(f.frames.size,0);dispose();
});
test('a lost graphics context returns to the fallback and stops the loop',()=>{
 const f=fixture();const dispose=f.start();f.step(100);let prevented=false;f.canvasEvents.get('webglcontextlost')({preventDefault(){prevented=true;}});
 assert(prevented);assert.equal(f.canvas.dataset.renderer,'fallback');assert.equal(f.frames.size,0);dispose();
});
