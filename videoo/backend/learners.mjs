import {randomBytes,timingSafeEqual} from 'node:crypto';
import {Buffer} from 'node:buffer';

const iterations=600000,encoder=new TextEncoder();
export const studentUsername=value=>typeof value==='string'?value.trim().toLowerCase():'';
export const validStudentUsername=value=>/^[a-z0-9][a-z0-9._-]{2,63}$/.test(value);
async function derive(password,salt){
  const key=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveBits']);
  return Buffer.from(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:Buffer.from(salt,'hex'),iterations},key,256)).toString('hex');
}
export async function passwordHash(password){const salt=randomBytes(16).toString('hex');return `pbkdf2-sha256$${iterations}$${salt}$${await derive(password,salt)}`;}
export async function passwordMatches(password,encoded){
  const match=typeof encoded==='string'&&encoded.match(/^pbkdf2-sha256\$600000\$([a-f0-9]{32})\$([a-f0-9]{64})$/);
  const actual=await derive(password,match?match[1]:'00000000000000000000000000000000');
  return !!match&&timingSafeEqual(Buffer.from(actual,'hex'),Buffer.from(match[2],'hex'));
}
export const publicStudent=account=>({id:account.id,username:account.username,full_name:account.full_name,is_active:account.is_active,created_at:account.created_at});
export function learnerCourses(courses){
  return courses.filter(c=>c.status==='published').map(c=>({id:c.id,title:c.title,description:c.description,category:c.category,instructor:c.instructor,level:c.level,kind:c.kind,status:c.status,art:c.art,coverUrl:c.coverUrl||'',sections:c.sections.map(s=>({id:s.id,title:s.title,lessons:s.lessons.filter(l=>l.objectKey).map(l=>({id:l.id,title:l.title,description:l.description,duration:l.duration,available:true}))})).filter(s=>s.lessons.length)}));
}
