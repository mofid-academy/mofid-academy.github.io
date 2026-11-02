import test from 'node:test';
import assert from 'node:assert/strict';
import {openDraft,seedCatalog} from '../draft-store.mjs';

const values=new Map();
globalThis.localStorage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};

test('owner draft survives reload encrypted, with no plaintext titles or object names on disk',async()=>{
  values.clear();const store=await openDraft('owner.test','test-only-password'),initial=await store.request('bootstrap');
  initial.catalog.courses[0].title='Private course title';
  await store.request('catalog_save',{revision:0,courses:initial.catalog.courses});
  const stored=[...values.values()].join('');assert.ok(!stored.includes('Private course title'));assert.ok(!stored.includes('J1.mp4'));assert.ok(!stored.includes('test-only-password'));
  const reopened=await openDraft('owner.test','test-only-password'),result=await reopened.request('bootstrap');assert.equal(result.catalog.courses[0].title,'Private course title');assert.equal(result.previewOnly,true);
});
test('another password cannot decrypt the owner draft',async()=>{await assert.rejects(openDraft('owner.test','wrong-password'));});
test('preview session restores its encrypted draft without retaining the management password',async()=>{
  const first=await openDraft('owner.test','test-only-password'),restored=await openDraft('owner.test',undefined,first.exportedKey);assert.equal((await restored.request('bootstrap')).catalog.revision,1);
});
test('preview cannot save storage credentials or generate a private playback capability',async()=>{
  const store=await openDraft('preview-other','test-only-password');for(const action of ['storage_connect','storage_files','video_play','upload_begin'])await assert.rejects(store.request(action,{secretKey:'sensitive-placeholder'}),e=>e.code==='BACKEND_PENDING');assert.ok(![...values.values()].join('').includes('sensitive-placeholder'));
});
test('only illustrative draft courses and the actual test object are seeded, with no fake progress',()=>{
  const c=seedCatalog();assert.equal(c.courses.length,3);assert.ok(c.courses.every(x=>x.status==='draft'));assert.equal(c.courses[0].sections.flatMap(s=>s.lessons).length,0);assert.equal(c.courses[2].sections[0].lessons[0].objectKey,'J1.mp4');
});
