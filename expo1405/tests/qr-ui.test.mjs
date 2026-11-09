import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {stripTypeScriptTypes} from 'node:module';
import jsQR from 'jsqr';
import {setQrCard,clearQrCard} from '../qr-card.mjs';
import {ClassesPanel} from '../classes.mjs';

const qrScope=vm.createContext({});
vm.runInContext(fs.readFileSync(new URL('../vendor/qrcode.js',import.meta.url),'utf8'),qrScope);
const source=fs.readFileSync(new URL('../lib/qr-code.ts',import.meta.url),'utf8');
const compiled=stripTypeScriptTypes(source).replace(/^export /m,'');
const roomA='cls-11111111-1111-4111-8111-111111111111',roomB='cls-22222222-2222-4222-8222-222222222222';
const link=id=>'https://mofid-academy.github.io/expo1405/?class='+id;

function render(url){
 let pixels,canvas;
 const context={fillStyle:'#fff',fillRect(x,y,width,height){
  if(!pixels)pixels=new Uint8ClampedArray(canvas.width*canvas.height*4);
  const rgb=this.fillStyle==='#fff'?[255,255,255]:[5,44,37];
  for(let row=y;row<y+height;row++)for(let column=x;column<x+width;column++){const i=(row*canvas.width+column)*4;pixels.set([...rgb,255],i);}
 }};
 canvas={width:0,height:0,getContext:()=>context,toDataURL:type=>{assert.equal(type,'image/png');return 'data:image/png;base64,TEST';}};
 const scope=vm.createContext({window:{qrcode:qrScope.qrcode},document:{createElement:name=>{assert.equal(name,'canvas');return canvas;}}});
 vm.runInContext(compiled,scope);const result=scope.createQRCodeResult(url);
 const decoded=jsQR(pixels,canvas.width,canvas.height,{inversionAttempts:'dontInvert'});
 return{result,decoded,pixels,canvas};
}
const element=()=>({dataset:{},innerHTML:'',events:[],dispatchEvent(event){this.events.push(event.type);}});

test('the actual QR rasterizer produces a decodable current-panel link with a white quiet zone',()=>{
 const {result,decoded,pixels,canvas}=render(link(roomA));
 assert(decoded);assert.equal(decoded.data,link(roomA));assert.equal(result.data,decoded.data);assert.equal(result.size,canvas.width);
 assert.equal(canvas.width,canvas.height);assert(result.output.startsWith('data:image/png;base64,'));
 for(let x=0;x<canvas.width;x++){assert.equal(pixels[x*4],255);assert.equal(pixels[((canvas.height-1)*canvas.width+x)*4],255);}
});
test('switching panels produces a different QR that decodes to the new panel only',()=>{
 const a=render(link(roomA)),b=render(link(roomB));
 assert.equal(a.decoded.data,link(roomA));assert.equal(b.decoded.data,link(roomB));assert.notDeepEqual(a.pixels,b.pixels);
});
test('QR updates preserve the React-owned card and clear its previous public URL',()=>{
 const node=element();setQrCard(node,{url:link(roomA),title:'پنل اول',svg:'<svg>first</svg>'});assert.equal(node.innerHTML,'<svg>first</svg>');
 const events=node.events.length;setQrCard(node,{url:link(roomA),title:'پنل اول',svg:'<svg>first</svg>'});assert.equal(node.events.length,events);
 node.dataset.qrEnhanced='true';node.innerHTML='REACT_CARD';setQrCard(node,{url:link(roomB),title:'پنل دوم',svg:'<svg>second</svg>'});
 assert.equal(node.innerHTML,'REACT_CARD');assert.equal(node.dataset.qrUrl,link(roomB));
 clearQrCard(node);assert.equal(node.dataset.qrUrl,'');assert.equal(node.innerHTML,'REACT_CARD');assert.equal(node.events.at(-1),'mofid:qr-update');
});
test('the panel QR is cached across refreshes and changes when the selected panel changes',()=>{
 const nodes=new Map(),get=selector=>{if(!nodes.has(selector))nodes.set(selector,element());return nodes.get(selector);};
 let id=roomA,count=0;
 const previous={document:globalThis.document,window:globalThis.window};
 globalThis.document={querySelector:get};globalThis.window={qrcode:(...args)=>{count++;return qrScope.qrcode(...args);}};
 try{
  const panel=Object.create(ClassesPanel.prototype);panel.current=()=>id;panel.link=()=>link(id);panel.items=[{id:roomA,title:'پنل اول'},{id:roomB,title:'پنل دوم'}];
  panel.renderQr();panel.renderQr();assert.equal(count,1);assert.equal(get('#classQr').dataset.qrUrl,link(roomA));
  id=roomB;panel.renderQr();assert.equal(count,2);assert.equal(get('#classQr').dataset.qrUrl,link(roomB));assert.equal(get('#classJoinUrl').href,link(roomB));
 }finally{globalThis.document=previous.document;globalThis.window=previous.window;}
});
