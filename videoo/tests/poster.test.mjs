import test from 'node:test';
import assert from 'node:assert/strict';
import {VideoApp} from '../app.mjs';
import {seedCatalog} from '../draft-store.mjs';

function fixture(t,api){
  const original=globalThis.document,created=[],classes=new Set();
  const stage={isConnected:true,classList:{add:name=>classes.add(name),remove:name=>classes.delete(name)},prepend(video){this.preview=video;},replaceChildren(video){this.player=video;}};
  globalThis.document={createElement(tag){
    assert.equal(tag,'video');
    const handlers={},attrs={};
    const video={handlers,attrs,duration:120,readyState:2,currentTime:0,playbackRate:1,defaultPlaybackRate:1,playCalls:0,
      setAttribute(name,value){attrs[name]=value;},removeAttribute(name){delete attrs[name];if(name==='src')this.src='';},
      addEventListener(name,handler){handlers[name]=handler;},pause(){this.paused=true;},load(){},
      remove(){this.removed=true;},play(){this.playCalls++;return Promise.resolve();}};
    created.push(video);return video;
  }};
  const app=Object.assign(Object.create(VideoApp.prototype),{catalog:seedCatalog(),progress:{},playbackRate:1,api,
    root:{querySelector:selector=>selector==='[data-stage]'?stage:null}});
  app.courseId=app.courses[2].id;app.lessonId=app.course.sections[0].lessons[0].id;
  t.after(()=>{app.stopPlayer();if(original===undefined)delete globalThis.document;else globalThis.document=original;});
  return {app,stage,classes,created};
}

test('the first-frame preview stays silent and records no progress, then reuses its authorized URL for play',async t=>{
  const calls=[];
  const {app,stage,classes,created}=fixture(t,async(action,data)=>{calls.push({action,data});return {url:'https://media.invalid/first.mp4'};});
  app.preparePoster();await app.posterRequest.promise;
  const preview=created[0];assert.equal(preview.muted,true);assert.equal(preview.playCalls,0);assert.equal(preview.attrs['aria-hidden'],'true');
  preview.handlers.loadedmetadata();preview.handlers.loadeddata();
  assert.equal(preview.currentTime,.1);assert.equal(classes.has('has-video-preview'),true);assert.deepEqual(app.progress,{});
  await app.startVideo();
  assert.equal(calls.length,1);assert.equal(calls[0].action,'video_play');
  assert.equal(preview.removed,true);assert.equal(preview.src,'');assert.equal(classes.has('has-video-preview'),false);
  assert.equal(stage.player,created[1]);assert.equal(stage.player.playCalls,1);
});

test('a late response from a previous lesson cannot replace the current first frame',async t=>{
  const pending=new Map();
  const {app,stage,classes,created}=fixture(t,(_action,{lessonId})=>new Promise(resolve=>pending.set(lessonId,resolve)));
  const first=app.lessonId;
  app.preparePoster();const oldRequest=app.posterRequest.promise;await Promise.resolve();
  const next={...app.course.sections[0].lessons[0],id:crypto.randomUUID(),title:'قسمت دوم'};
  app.course.sections[0].lessons.push(next);app.lessonId=next.id;
  app.preparePoster();const newRequest=app.posterRequest.promise;await Promise.resolve();
  pending.get(first)({url:'https://media.invalid/old.mp4'});await oldRequest;
  assert.equal(created.length,0);
  pending.get(next.id)({url:'https://media.invalid/current.mp4'});await newRequest;
  assert.equal(stage.preview.src,'https://media.invalid/current.mp4');
  stage.preview.handlers.loadeddata();assert.equal(classes.has('has-video-preview'),true);
  app.stopPoster();assert.equal(stage.preview.src,'');assert.equal(classes.has('has-video-preview'),false);assert.deepEqual(app.progress,{});
});

test('a failed decorative preview leaves normal playback available for retry',async t=>{
  let attempts=0;
  const {app,created,classes}=fixture(t,async()=>{if(++attempts===1)throw Error('preview unavailable');return {url:'https://media.invalid/retry.mp4'};});
  app.preparePoster();await assert.rejects(app.posterRequest.promise);await new Promise(resolve=>setImmediate(resolve));
  assert.equal(app.posterRequest,null);assert.equal(created.length,0);assert.equal(classes.has('has-video-preview'),false);
  await app.startVideo();assert.equal(attempts,2);assert.equal(created[0].playCalls,1);
});

test('leaving the player while a preview URL loads never starts hidden playback',async t=>{
  let resolve;
  const {app,stage,created}=fixture(t,()=>new Promise(done=>{resolve=done;}));
  app.preparePoster();await Promise.resolve();
  const playing=app.startVideo();stage.isConnected=false;
  resolve({url:'https://media.invalid/late.mp4'});await playing;
  assert.equal(created.length,0);assert.deepEqual(app.progress,{});
});
