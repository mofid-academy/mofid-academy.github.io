import test from 'node:test';
import assert from 'node:assert/strict';
import {ClassesPanel} from '../classes.mjs';
function client(request){
 const panel=Object.create(ClassesPanel.prototype),calls=[],notes=[];
 Object.assign(panel,{items:[{id:'a'},{id:'b'},{id:'c'}],busy:false,generation:0,current:()=> 'b',setBusy(value){this.busy=value},request:async(path,options)=>{calls.push({path,...options});return request?.(options.body)},load:async()=>{},notify:(...n)=>notes.push(n)});
 globalThis.document={querySelectorAll:()=>[]};return{panel,calls,notes};
}
test('mobile or keyboard move sends one adjacent reorder and ignores a double tap',async()=>{
 let resolve;const {panel,calls}=client(()=>new Promise(r=>resolve=r));
 const pending=panel.move('b','up');await panel.move('b','up');assert.equal(calls.length,1);
 assert.deepEqual(calls[0],{path:'/host/classes/order',method:'POST',body:{order:['b','a','c'],expectedOrder:['a','b','c']}});
 assert.equal(panel.current(),'b');assert.equal(panel.busy,true);resolve({ok:true});await pending;assert.equal(panel.busy,false);
});
test('move boundaries and invalid directions do not send requests',async()=>{
 const {panel,calls}=client();await panel.move('a','up');await panel.move('c','down');await panel.move('b','left');assert.equal(calls.length,0);
});
test('a stale order reloads the directory instead of overwriting it',async()=>{
 const {panel,notes}=client(()=>{throw Error('Order changed')});let reloads=0;panel.load=async()=>reloads++;
 await panel.move('b','down');assert.equal(reloads,1);assert.deepEqual(notes,[['Order changed',true]]);assert.equal(panel.busy,false);
});
