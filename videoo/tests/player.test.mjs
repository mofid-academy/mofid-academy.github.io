import test from 'node:test';
import assert from 'node:assert/strict';
import {VideoApp} from '../app.mjs';
import {seedCatalog} from '../draft-store.mjs';
import {readPlaybackRate,savePlaybackRate} from '../playback.mjs';

test('speed preferences survive reload and tolerate blocked or invalid storage',()=>{
  const data=new Map(),storage={getItem:key=>data.get(key),setItem:(key,value)=>data.set(key,value)};
  assert.equal(readPlaybackRate(storage),1);
  savePlaybackRate(2,storage);
  assert.equal(readPlaybackRate(storage),2);
  savePlaybackRate(99,storage);
  assert.equal(readPlaybackRate(storage),1);
  const blocked={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}};
  assert.equal(readPlaybackRate(blocked),1);
  assert.doesNotThrow(()=>savePlaybackRate(1.5,blocked));
});

test('manual speed changes update the playing video without changing position or watched progress',()=>{
  const select={value:'1'},record={position:28,duration:120,ranges:[[0,28]]};
  const app=Object.assign(Object.create(VideoApp.prototype),{
    root:{querySelector:()=>select},playbackRate:1,lastTime:28,
    progress:{lesson:record},video:{playbackRate:1,defaultPlaybackRate:1,currentTime:28,preservesPitch:false}
  });
  app.change({target:{dataset:{playbackRate:''},value:'2'}});
  assert.equal(app.video.playbackRate,2);
  assert.equal(app.video.defaultPlaybackRate,2);
  assert.equal(app.video.currentTime,28);
  assert.equal(app.video.preservesPitch,true);
  assert.equal(select.value,'2');
  assert.equal(app.lastTime,null);
  assert.deepEqual(record,{position:28,duration:120,ranges:[[0,28]]});
});

test('selected speed is applied to new episodes, native rate changes and refreshed video metadata',async()=>{
  const previousDocument=globalThis.document,created=[],select={value:'2'};
  const stage={replaceChildren(video){this.video=video;}};
  globalThis.document={createElement(tag){
    assert.equal(tag,'video');
    const handlers={};
    const video={playbackRate:1,defaultPlaybackRate:1,duration:100,currentTime:0,
      setAttribute(){},addEventListener(name,handler){handlers[name]=handler;},
      play(){return Promise.resolve();},handlers};
    created.push(video);return video;
  }};
  const app=Object.assign(Object.create(VideoApp.prototype),{
    catalog:seedCatalog(),progress:{},playbackRate:2,
    root:{querySelector:selector=>selector==='[data-stage]'?stage:select},
    api:async()=>({url:'https://media.invalid/lesson.mp4'})
  });
  app.courseId=app.courses[2].id;app.lessonId=app.course.sections[0].lessons[0].id;
  try{
    await app.startVideo();clearInterval(app.heartbeat);
    const first=created[0];assert.equal(first.playbackRate,2);
    first.playbackRate=1.5;first.handlers.ratechange();
    assert.equal(app.playbackRate,1.5);assert.equal(select.value,'1.5');
    const secondLesson={...app.course.sections[0].lessons[0],id:crypto.randomUUID(),title:'قسمت دوم'};
    app.course.sections[0].lessons.push(secondLesson);app.lessonId=secondLesson.id;
    await app.startVideo();clearInterval(app.heartbeat);
    const next=created[1];assert.equal(next.playbackRate,1.5);
    assert.equal(app.playingId,secondLesson.id);
    next.playbackRate=1;next.handlers.loadedmetadata();
    assert.equal(next.playbackRate,1.5);
    first.playbackRate=3;first.handlers.ratechange();
    assert.equal(app.playbackRate,1.5);
  }finally{clearInterval(app.heartbeat);if(previousDocument===undefined)delete globalThis.document;else globalThis.document=previousDocument;}
});
