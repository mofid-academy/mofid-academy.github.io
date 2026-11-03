export const fa=(n,d=0)=>new Intl.NumberFormat('fa-IR',{maximumFractionDigits:d}).format(n);
export const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const uid=()=>crypto.randomUUID();
export const lessons=c=>c.sections.flatMap(s=>s.lessons.map(l=>({...l,sectionId:s.id,sectionTitle:s.title})));
export const watched=r=>(r?.ranges||[]).reduce((n,x)=>n+Math.max(0,x[1]-x[0]),0);
export const completed=r=>!!r?.duration&&watched(r)>=r.duration*.9;
export function courseProgress(c,progress){const list=lessons(c),done=list.filter(l=>completed(progress[l.id])).length;return {total:list.length,done,percent:list.length?Math.round(done/list.length*100):0};}
export function mergeWatch(ranges,start,end){
  if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start)return ranges;
  const sorted=[...ranges,[start,end]].sort((a,b)=>a[0]-b[0]),result=[];
  for(const r of sorted){const last=result.at(-1);if(last&&r[0]<=last[1]+.5)last[1]=Math.max(last[1],r[1]);else result.push([...r]);}return result;
}
export function durationLabel(seconds){if(!seconds)return 'مدت ثبت نشده';const n=Math.round(seconds/60);return n>=60?fa(Math.floor(n/60))+' ساعت'+(n%60?' و '+fa(n%60)+' دقیقه':''):fa(Math.max(1,n))+' دقیقه';}
export function positionLabel(seconds){return fa(Math.floor(seconds/60))+':'+String(Math.floor(seconds%60)).padStart(2,'0').replace(/\d/g,c=>'۰۱۲۳۴۵۶۷۸۹'[+c]);}
export const sizeLabel=bytes=>bytes>=1e9?fa(bytes/1e9,2)+' گیگابایت':fa(bytes/1e6,1)+' مگابایت';
export function moveLesson(courses,lessonId,courseId,sectionId){
  let item;
  for(const c of courses)for(const s of c.sections){const i=s.lessons.findIndex(l=>l.id===lessonId);if(i>=0)item=s.lessons.splice(i,1)[0];}
  const c=courses.find(x=>x.id===courseId);if(!c)throw Error('مجموعه پیدا نشد.');
  const s=c.sections.find(x=>x.id===sectionId)||c.sections[0];if(!s)throw Error('ابتدا یک فصل بسازید.');
  if(!item)throw Error('قسمت پیدا نشد.');s.lessons.push(item);return item;
}
export function nextToWatch(c,progress){const list=lessons(c),started=list.filter(l=>progress[l.id]?.position&&!completed(progress[l.id])).sort((a,b)=>String(progress[b.id].updated_at||'').localeCompare(String(progress[a.id].updated_at||'')));return started[0]||list.find(l=>!completed(progress[l.id])&&(l.objectKey||l.available))||list.find(l=>l.objectKey||l.available)||list[0];}
export function newCourse(kind='course'){
  return {id:uid(),title:kind==='single'?'ویدیوی مستقل جدید':'مجموعهٔ جدید',description:'',category:'عمومی',instructor:'',level:'همهٔ سطوح',kind,status:'draft',art:kind==='single'?'video':'data',sections:[{id:uid(),title:kind==='single'?'ویدیو':'فصل اول',lessons:kind==='single'?[newLesson()]:[]}]};
}
export const newLesson=()=>({id:uid(),title:'قسمت جدید',description:'',objectKey:'',duration:0,size:0});
