import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {esc} from '../model.mjs';

const source=(await readFile(new URL('../portal.mjs',import.meta.url),'utf8')).replace(/^import[^\n]*\n/gm,'').replace('void initPortal();','globalThis.portalBoot=initPortal();');
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function portal(request,{session=null}={}){
  const attributes={},listeners={},stored=new Map(session?[['mofid-video-student-v1',JSON.stringify(session)]]:[]);
  const form={addEventListener(){},elements:{password:{value:''}}},retry={addEventListener:(name,fn)=>listeners[name]=fn};
  const root={hidden:false,innerHTML:'',setAttribute:(name,value)=>attributes[name]=value,querySelector:selector=>selector==='#retryVideoPortal'?retry:selector==='form'?form:{}};
  const coming={hidden:true};let constructed=0;
  class App {
    constructor(options){Object.assign(this,options);constructed++;}
    async load(){await this.api('bootstrap');this.root.innerHTML='private library fixture';}
    destroy(){}
  }
  const context={request,VideoApp:App,esc,window:{},document:{getElementById:id=>id==='videoApp'?root:coming},sessionStorage:{getItem:key=>stored.get(key)||null,setItem:(key,value)=>stored.set(key,value),removeItem:key=>stored.delete(key)}};
  vm.createContext(context);vm.runInContext(source,context);
  return {root,coming,attributes,listeners,stored,boot:context.portalBoot,get constructed(){return constructed;}};
}

test('an unresolved health request keeps the paused panel hidden and shows a neutral loader',async()=>{
  const health=deferred(),p=portal(()=>health.promise);
  assert.equal(p.coming.hidden,true);assert.equal(p.root.hidden,false);assert.equal(p.attributes['aria-busy'],'true');assert.match(p.root.innerHTML,/role="status"/);assert.ok(!p.root.innerHTML.includes('Coming Soon'));assert.equal(p.constructed,0);
  health.resolve({publicState:'live'});await p.boot;
  assert.equal(p.coming.hidden,true);assert.match(p.root.innerHTML,/studentLogin/);assert.equal(p.attributes['aria-busy'],'false');
});
test('the paused view only appears after a confirmed non-live server response',async()=>{
  const health=deferred(),p=portal(()=>health.promise);assert.equal(p.coming.hidden,true);
  health.resolve({publicState:'coming-soon'});await p.boot;
  assert.equal(p.root.hidden,true);assert.equal(p.coming.hidden,false);assert.equal(p.constructed,0);
});
test('network failures offer retry without displaying an incorrect paused state',async()=>{
  let calls=0;const p=portal(async()=>{if(++calls===1)throw Error('network fixture');return {publicState:'live'};});
  await p.boot;assert.equal(p.coming.hidden,true);assert.match(p.root.innerHTML,/retryVideoPortal/);assert.equal(p.attributes['aria-busy'],'false');
  p.listeners.click();await tick();assert.equal(calls,2);assert.match(p.root.innerHTML,/studentLogin/);assert.equal(p.coming.hidden,true);
});
test('restoring a signed-in session keeps loading until the authenticated catalogue is ready',async()=>{
  const health=deferred(),bootstrap=deferred(),calls=[];
  const p=portal((action,data,token)=>{calls.push({action,token});return action==='health'?health.promise:bootstrap.promise;},{session:{token:'fixture-student-session',username:'learner.fixture'}});
  health.resolve({publicState:'live'});await tick();
  assert.equal(p.coming.hidden,true);assert.equal(p.attributes['aria-busy'],'true');assert.equal(p.constructed,1);assert.equal(calls[1].token,'fixture-student-session');
  bootstrap.resolve({});await p.boot;
  assert.equal(p.root.innerHTML,'private library fixture');assert.equal(p.attributes['aria-busy'],'false');assert.equal(p.coming.hidden,true);
});
test('expired stored sessions return to sign-in without flashing the paused panel',async()=>{
  const p=portal(async action=>{if(action==='health')return {publicState:'live'};const e=Error('expired fixture');e.status=401;throw e;},{session:{token:'expired-fixture-session',username:'learner.fixture'}});
  await p.boot;assert.equal(p.coming.hidden,true);assert.match(p.root.innerHTML,/studentLogin/);assert.equal(p.stored.size,0);assert.equal(p.attributes['aria-busy'],'false');
});
