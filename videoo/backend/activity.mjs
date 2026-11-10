import {createHash} from 'node:crypto';

export const ACTIVITY_EVENTS=['login','login_failed','logout','portal_open','lesson_opened','watch_started','watch_progress','lesson_completed','password_changed'];
const sum=ranges=>(ranges||[]).reduce((sum,range)=>sum+range[1]-range[0],0);

export function activityIdentity(claims,token){
  return {actor:claims.kind==='student'?'student:'+claims.sub:'admin:'+claims.username,username:claims.username,role:claims.kind,sessionHash:createHash('sha256').update(token).digest('hex'),sessionVersion:claims.kind==='student'?claims.jti:null,expiresAt:new Date(claims.exp*1000).toISOString()};
}

// Deliberately select individual fields: never persist request bodies, passwords,
// JWTs, signed media URLs, storage credentials, IP addresses or browser headers.
export function createActivityLogger(db){
  return async(event,who,detail={})=>{
    if(!ACTIVITY_EVENTS.includes(event))return;
    const entry={event,actor:who.actor||null,username:who.username,role:who.role,sessionHash:who.sessionHash||null,sessionVersion:who.sessionVersion||null,expiresAt:who.expiresAt||null,courseId:detail.courseId||null,courseTitle:detail.courseTitle||'',lessonId:detail.lessonId||null,lessonTitle:detail.lessonTitle||'',percent:detail.percent??null,watchedSeconds:detail.watchedSeconds??null};
    try{await db('activity_write',entry);}catch{console.warn('ACADEMY_ACTIVITY_WRITE_UNAVAILABLE');}
  };
}

export function progressActivity(previous,current){
  const duration=current.duration||0;if(!duration)return null;
  const before=sum(previous?.ranges),after=sum(current.ranges),ratio=after/duration;
  if(before/duration>=.9)return null;
  let event=null;
  if(ratio>=.9&&before/duration<.9)event='lesson_completed';
  else if(before<1&&after>=1)event='watch_started';
  else if(Math.floor(ratio*4)>Math.floor(before/duration*4))event='watch_progress';
  return event?{event,percent:Math.min(100,Math.round(ratio*100)),watchedSeconds:Math.round(after)}:null;
}

export function activityQuery(data={}){
  const username=typeof data.username==='string'?data.username.trim().toLowerCase():'';
  const event=data.event||'',days=data.days??7,cursor=data.cursor;
  if(username&&!/^[a-z0-9][a-z0-9._-]{2,63}$/.test(username))throw Error('نام سازمانی را کامل وارد کنید.');
  if(event&&!ACTIVITY_EVENTS.includes(event))throw Error('نوع رویداد معتبر نیست.');
  if(![1,7,30,90].includes(days))throw Error('بازهٔ زمانی معتبر نیست.');
  if(cursor&&(!/^\d{1,18}$/.test(String(cursor.id))||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,6})?(Z|\+00:00)$/.test(cursor.at)||!Number.isFinite(Date.parse(cursor.at))))throw Error('صفحهٔ گزارش معتبر نیست.');
  return {username,event,days,beforeAt:cursor?.at||null,beforeId:cursor?String(cursor.id):null};
}
