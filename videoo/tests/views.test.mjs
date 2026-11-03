import test from 'node:test';
import assert from 'node:assert/strict';
import {VideoApp} from '../app.mjs';
import {seedCatalog} from '../draft-store.mjs';

function view(){return Object.assign(Object.create(VideoApp.prototype),{catalog:seedCatalog(),progress:{},storage:{connected:false,endpoint:'https://s3.ir-central1.arvanstorage.ir',region:'ir-central1',bucket:'mofid-academy-videos'},view:'library',query:'',category:'همه',preview:false,previewOnly:true,dirty:false});}
test('all management and learning views render complete markup with empty draft sections',()=>{
  const app=view();for(const mode of ['library','manage','settings','player']){app.courseId=app.courses[0].id;const html=app[mode]();assert.ok(html.length>200,mode);assert.ok(!html.includes('undefined'),mode);assert.ok(!html.includes('NaN'),mode);}
});
test('course titles, object names, descriptions and categories are escaped in the real views',()=>{
  const app=view(),payload='<img src=x onerror=alert(1)>';Object.assign(app.courses[0],{title:payload,description:payload,category:payload});
  for(const mode of ['library','manage','player']){app.courseId=app.courses[0].id;const html=app[mode]();assert.ok(!html.includes(payload),mode);assert.ok(html.includes('&lt;img'),mode);}
});
test('blocked preview never renders an Arvan credential form',()=>{
  const app=view();assert.ok(!app.settings().includes('name="secretKey"'));app.previewOnly=false;assert.ok(app.settings().includes('type="password"'));assert.ok(app.settings().includes('name="secretKey"'));
});
test('student preview hides editing controls while retaining lesson navigation and progress',()=>{
  const app=view();app.preview=true;const html=app.library();assert.ok(!html.includes('data-action="edit-course"'));app.courseId=app.courses[2].id;const player=app.player();assert.match(player,/syllabus-lesson/);assert.match(player,/data-course-progress/);assert.match(player,/data-action="play"/);
});
test('browser draft transfer is explicit and hidden from the learning preview',()=>{
  const app=view();app.previewOnly=false;app.localDraftCount=3;
  assert.match(app.draftNotice(),/data-action="import-draft"/);app.preview=true;assert.equal(app.draftNotice(),'');
  app.preview=false;app.localDraftMessage='<script>bad</script>';assert.ok(!app.draftNotice().includes('<script>'));
});
