import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInThisContext} from 'node:vm';
import {API_URL,PROJECT_URL,PUBLIC_KEY} from '../config.mjs';
import {csvCell,constantEqual} from '../backend/core.mjs';
const {createClient}=runInThisContext(readFileSync(new URL('../vendor/supabase.js',import.meta.url),'utf8')+'\nsupabase;');
let input='';for await(const c of process.stdin)input+=c;
const {hostKey}=JSON.parse(input);
const summary={checks:[],participants:[],round:null,realtimeSnapshots:0};
async function request(path,{method='GET',body,token,host=false,status=200}={}){
  const headers={Origin:'https://mofid-academy.github.io'};
  if(body)headers['Content-Type']='application/json';
  if(token)headers['X-Participant-Token']=token;
  if(host)headers['X-Host-Key']=hostKey;
  const r=await fetch(API_URL+path,{method,headers,body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(30000)});
  const text=await r.text();let data;try{data=JSON.parse(text)}catch{data=text;}
  assert.equal(r.status,status,'Unexpected HTTP status for '+path+': '+text.slice(0,160));
  return data;
}
async function concurrent(items,fn,n=20){const result=[];let next=0;await Promise.all(Array.from({length:n},async()=>{while(next<items.length){const i=next++;result[i]=await fn(items[i],i)}}));return result}
const clients=[];
try{
  assert(constantEqual('a','a'));assert(!constantEqual('a','aa'));assert.equal(csvCell('=1+1'),'"\'=1+1"');
  await request('/host',{status:401});
  const initial=await request('/state');assert.equal(initial.payload.phase,'waiting');assert.equal(initial.payload.question,null);
  summary.checks.push('Unauthenticated moderator access rejected; waiting state reveals no question text.');
  const host=await request('/host',{host:true});summary.round=host.payload.round;assert(host.questions.length>=6);const [q1,q2]=host.questions;
  for(const table of ['expo1405_questions','expo1405_rooms','expo1405_participants','expo1405_votes']){
    const r=await fetch(PROJECT_URL+'/rest/v1/'+table+'?select=*',{headers:{apikey:PUBLIC_KEY}});
    const b=await r.json();assert(!r.ok||(Array.isArray(b)&&b.length===0),'Private data exposed: '+table);
  }
  const forbiddenRpc=await fetch(PROJECT_URL+'/rest/v1/rpc/expo1405_host_action',{method:'POST',headers:{apikey:PUBLIC_KEY,'Content-Type':'application/json'},body:JSON.stringify({p_room:'main',p_action:{action:'activate',questionId:q2.id}})});
  assert(!forbiddenRpc.ok);summary.checks.push('Public key cannot read private tables or execute moderator RPCs.');
  const realtimeStates=[];
  for(let i=0;i<3;i++){
    const db=createClient(PROJECT_URL,PUBLIC_KEY,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});clients.push(db);
    await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Realtime subscription timeout')),20000);db.channel('expo1405-integration-'+i).on('postgres_changes',{event:'UPDATE',schema:'public',table:'expo1405_public',filter:'id=eq.main'},e=>{summary.realtimeSnapshots++;realtimeStates.push(e.new.payload)}).subscribe(status=>{if(status==='SUBSCRIBED'){clearTimeout(timer);resolve()}})});
  }
  await request('/host/action',{host:true,method:'POST',body:{action:'activate',questionId:q1.id,seconds:0}});
  const visible=await request('/state');assert.equal(visible.payload.question.id,q1.id);assert(!JSON.stringify(visible).includes(q2.text));
  summary.checks.push('Only the moderator-selected question is exposed.');
  const started=Date.now();
  const people=await concurrent(Array.from({length:100},(_,i)=>i),async i=>request('/join',{method:'POST',body:{name:i===0?'QA='+String(Date.now()):null}}));
  summary.participants=people.map(p=>p.id);
  const voteStart=Date.now();
  await concurrent(people,(p,i)=>request('/vote',{method:'POST',token:p.token,body:{questionId:q1.id,round:host.payload.round,choice:i%q1.options.length}}),100);
  const voted=await request('/state');assert.equal(voted.payload.total,100);assert.equal(voted.payload.question.options.reduce((n,o)=>n+o.count,0),100);assert(!JSON.stringify(voted).includes('QA='));
  summary.joinAndVoteMs=Date.now()-started;summary.concurrent100VotesMs=Date.now()-voteStart;
  summary.checks.push('100 concurrent vote submissions counted exactly; participant names absent from public results.');
  await request('/vote',{method:'POST',token:people[0].token,body:{questionId:q1.id,round:host.payload.round,choice:3}});assert.equal((await request('/state')).payload.total,100);
  summary.checks.push('Repeated vote is idempotent and cannot change or inflate the result.');
  await request('/host/action',{host:true,method:'POST',body:{action:'close'}});
  await request('/vote',{method:'POST',token:people[0].token,body:{questionId:q2.id,round:host.payload.round,choice:0},status:409});
  await request('/host/action',{host:true,method:'POST',body:{action:'save',questionId:q1.id,text:q1.text,options:q1.options},status:409});
  summary.checks.push('Closed/future-question votes rejected; answered question cannot be edited in the same round.');
  const report=await request('/host/export',{host:true});assert.equal(report.trim().split('\r\n').length,101);
  await request('/host/action',{host:true,method:'POST',body:{action:'activate',questionId:q2.id,seconds:1}});
  await new Promise(r=>setTimeout(r,1400));
  await request('/vote',{method:'POST',token:people[0].token,body:{questionId:q2.id,round:host.payload.round,choice:0},status:409});
  assert(realtimeStates.some(s=>s.total===100&&s.question?.id===q1.id),'Realtime did not deliver 100-vote snapshot');
  assert(realtimeStates.every(s=>!('host_key_hash'in s)&&!('votes'in s)&&!JSON.stringify(s).includes('QA=')));
  summary.checks.push('Server deadline enforced; three separate Realtime subscribers received live aggregate snapshots.');
  await request('/host/action',{host:true,method:'POST',body:{action:'waiting'}});
  console.log(JSON.stringify({...summary,ok:true},null,2));
}catch(e){console.log(JSON.stringify({...summary,ok:false,error:e.message},null,2));process.exitCode=1;}
finally{
  await Promise.race([Promise.all(clients.map(db=>db.removeAllChannels())),new Promise(r=>setTimeout(r,3000))]);
  for(const db of clients)db.realtime.disconnect();
  process.exit(process.exitCode||0);
}
