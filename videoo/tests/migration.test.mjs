import test from 'node:test';
import assert from 'node:assert/strict';
import {planDraftImport} from '../migration.mjs';
import {seedCatalog,openDraft,hasDraft} from '../draft-store.mjs';
import {normalizeCourses} from '../backend/core.mjs';

const snapshot=()=>({catalog:seedCatalog(),progress:[]});
const stored=new Map();globalThis.localStorage={getItem:k=>stored.get(k)||null,setItem:(k,v)=>stored.set(k,v)};

test('import preserves server courses and transfers the local lesson identities and progress',()=>{
  const local=snapshot(),server=seedCatalog().courses[0],lesson=local.catalog.courses[2].sections[0].lessons[0];
  local.progress=[{lesson_id:lesson.id,position:32,duration:120,ranges:[[0,32]]}];
  const before=JSON.stringify(local),plan=planDraftImport([server],local);
  assert.equal(plan.added,3);assert.deepEqual(plan.courses[0],server);assert.equal(plan.progress[0].lessonId,lesson.id);assert.deepEqual(plan.progress[0].ranges,[[0,32]]);assert.equal(JSON.stringify(local),before);
});
test('retrying an identical normalized import does not duplicate courses',()=>{
  const local=snapshot(),server=normalizeCourses(local.catalog.courses),plan=planDraftImport(server,local);
  assert.equal(plan.added,0);assert.equal(plan.courses.length,server.length);
});
test('conflicting server edits remain intact and the imported copy keeps its own watch progress',()=>{
  const local=snapshot(),remote=structuredClone(local.catalog.courses[2]);remote.title='Server edit';
  const lesson=local.catalog.courses[2].sections[0].lessons[0];local.progress=[{lesson_id:lesson.id,position:20,duration:80,ranges:[[0,20]]}];
  const plan=planDraftImport([remote],local),copy=plan.courses.at(-1);
  assert.equal(plan.courses[0].title,'Server edit');assert.notEqual(copy.id,remote.id);assert.notEqual(copy.sections[0].lessons[0].id,lesson.id);assert.equal(plan.progress[0].lessonId,copy.sections[0].lessons[0].id);assert.equal(plan.courses.at(-1).title,local.catalog.courses[2].title);
  assert.doesNotThrow(()=>normalizeCourses(plan.courses));
});
test('successful migration is acknowledged without deleting the encrypted browser backup',async()=>{
  stored.clear();assert.equal(hasDraft('migration-owner'),false);
  const store=await openDraft('migration-owner','test-only-pass'),data=await store.request('bootstrap');
  await store.request('catalog_save',{revision:0,courses:data.catalog.courses});assert.equal(hasDraft('migration-owner'),true);
  const pending=await store.request('migration_snapshot');assert.equal(pending.catalog.courses.length,3);
  await store.request('migration_complete',{revision:pending.catalog.revision});
  const restored=await openDraft('migration-owner','test-only-pass');assert.equal(await restored.request('migration_snapshot'),null);assert.equal((await restored.request('bootstrap')).catalog.courses.length,3);assert.equal(hasDraft('migration-owner'),true);
});
