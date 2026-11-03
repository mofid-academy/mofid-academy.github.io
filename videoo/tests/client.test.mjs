import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createApi,createHandler} from '../backend/core.mjs';
import {openDraft} from '../draft-store.mjs';
import {request,remember,API,BACKEND_MODE} from '../client.mjs';

test('active server client authenticates through the new API and only imports browser drafts on request',async()=>{
  const local=new Map(),sessions=new Map();
  globalThis.localStorage={getItem:k=>local.get(k)||null,setItem:(k,v)=>local.set(k,v)};
  globalThis.sessionStorage={getItem:k=>sessions.get(k)||null,setItem:(k,v)=>sessions.set(k,v),removeItem:k=>sessions.delete(k)};
  const password='test-only-management-password',username='client-test-owner';
  const draft=await openDraft(username,password),initial=await draft.request('bootstrap');
  await draft.request('catalog_save',{revision:0,courses:initial.catalog.courses});
  const lesson=initial.catalog.courses[2].sections[0].lessons[0];
  await draft.request('progress_save',{lessonId:lesson.id,position:10,duration:100,ranges:[[0,10]]});
  let catalog={revision:0,courses:[]};const progress=new Map();
  const api=createApi({config:{adminUsername:username,adminKeyHash:createHash('sha256').update(password).digest('hex'),signingKey:'test-only-signing-key-at-least-32-characters',siteOrigin:'https://mofid-academy.github.io'},db:async(action,d={})=>{
    if(action==='rate_limit')return true;
    if(action==='settings_read')return {release_enabled:false};
    if(action==='catalog')return structuredClone(catalog);
    if(action==='catalog_save'){assert.equal(d.revision,catalog.revision);catalog={revision:catalog.revision+1,courses:structuredClone(d.courses)};return structuredClone(catalog);}
    if(action==='storage_read')return null;
    if(action==='progress_list')return [...progress.values()];
    if(action==='progress_get')return progress.get(d.lessonId)||null;
    if(action==='progress_save'){const row={lesson_id:d.lessonId,position:d.position,duration:d.duration,ranges:d.ranges,revision:1};progress.set(d.lessonId,row);return row;}
    throw Error('Unexpected DB action '+action);
  }}),handler=createHandler(api),previousFetch=globalThis.fetch;
  globalThis.fetch=async(url,options)=>{assert.equal(url,API);return handler(new Request(url,options));};
  try{
    assert.equal(BACKEND_MODE,'server');
    await assert.rejects(request('bootstrap',{},'old-preview-session'),e=>e.status===401);
    const signed=await request('admin_login',{username,password});remember(signed);
    const before=await request('bootstrap',{},signed.token);assert.equal(before.localDraftCount,3);assert.equal(before.catalog.courses.length,0);assert.equal(catalog.revision,0);assert.equal(before.storage.connected,false);assert.equal(before.previewOnly,undefined);
    const imported=await request('draft_import',{},signed.token);assert.equal(imported.catalog.courses.length,3);assert.equal(imported.localDraftCount,0);assert.equal(imported.progress[0].lesson_id,lesson.id);assert.deepEqual(imported.progress[0].ranges,[[0,10]]);
    assert.ok(![...local.values()].join('').includes(password));
    await assert.rejects(request('draft_import',{},signed.token),/پیش‌نویس قابل انتقالی/);
  }finally{globalThis.fetch=previousFetch;remember(null);}
});
