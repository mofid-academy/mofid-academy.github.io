import {uid,lessons} from './model.mjs';

// Import a browser draft without replacing any server course. Remap a colliding
// course as a separate copy, preserving the lesson-to-progress relationship.
export function planDraftImport(serverCourses,snapshot){
  const canonical=v=>Array.isArray(v)?'['+v.map(canonical).join(',')+']':v&&typeof v==='object'?'{'+Object.keys(v).filter(k=>k!=='coverUrl'&&!(k==='coverObjectKey'&&!v[k])).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}':JSON.stringify(v);
  const courses=structuredClone(serverCourses),lessonIds=new Map();let added=0;
  const ids=c=>[c.id,...c.sections.flatMap(s=>[s.id,...s.lessons.map(l=>l.id)])];
  const used=new Set(courses.flatMap(ids));
  for(const original of snapshot.catalog.courses){
    const same=courses.find(c=>c.id===original.id);
    if(same&&canonical(same)===canonical(original)){
      for(const lesson of lessons(original))lessonIds.set(lesson.id,lesson.id);
      continue;
    }
    const copy=structuredClone(original),remap=ids(copy).some(id=>used.has(id));
    if(remap){copy.id=uid();for(const section of copy.sections){section.id=uid();for(const lesson of section.lessons){const previous=lesson.id;lesson.id=uid();lessonIds.set(previous,lesson.id);}}}
    else for(const lesson of lessons(copy))lessonIds.set(lesson.id,lesson.id);
    courses.push(copy);for(const id of ids(copy))used.add(id);added++;
  }
  const progress=snapshot.progress.filter(p=>lessonIds.has(p.lesson_id)&&p.duration>0).map(p=>({lessonId:lessonIds.get(p.lesson_id),position:p.position,duration:p.duration,ranges:p.ranges}));
  return {courses,progress,added};
}
