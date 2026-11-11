import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PanelContinuation} from '../continuation.mjs';
import {renderQuizScore} from '../quiz.mjs';
import {roomFromUrl,roomStorageKey,classUrl} from '../class-context.mjs';

const source=readFileSync(new URL('../app.mjs',import.meta.url),'utf8').replace(/^import .*;\s*$/gm,'');
const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
function storage(){const data=new Map();return{getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)}}
function element(){const events={};let html='';return{events,hidden:false,disabled:false,required:false,checked:false,value:'',textContent:'',htmlWrites:0,get innerHTML(){return html},set innerHTML(value){html=value;this.htmlWrites++},classList:{toggle(){}},addEventListener:(name,fn)=>events[name]=fn,setAttribute(){},replaceChildren(){}}}
async function participant(policy,{question=null,quiz=false,nextPanel=null}={}){
 const nodes=new Map(),get=id=>{if(!nodes.has(id))nodes.set(id,element());return nodes.get(id)},requests=[],intervals=[];
 const location=new URL('https://example.invalid/expo1405/?class=main'),navigations=[];location.assign=url=>navigations.push(url);
 const document={body:{dataset:{view:'participant'}},hidden:false,querySelector:s=>get(s.slice(1)),querySelectorAll:()=>[],addEventListener(){}};
 const window={addEventListener(){},supabase:null},history={replaceState(){}},sessionStorage=storage(),localStorage=storage();
 const snapshot={revision:1,payload:{room:'main',title:'پنل آزمایشی',round:1,phase:question?'open':'waiting',quiz,namePolicy:policy,questionCount:1,question}};
 let joinedName=null;
 const fetcher=async(url,options={})=>{const path=new URL(url).pathname;requests.push({path,body:options.body?JSON.parse(options.body):null});
  if(path.endsWith('/state'))return Response.json(snapshot);
  if(path.endsWith('/join')){joinedName=JSON.parse(options.body).name;return Response.json({id:'test',token:'synthetic-test-token',name:joinedName});}
  if(path.endsWith('/next-panel'))return Response.json(options.body?{room:nextPanel.id,id:'target-person',name:joinedName,token:'TARGET_TOKEN_WITH_MORE_THAN_32_CHARACTERS'}:{finished:true,nextPanel});
  if(path.endsWith('/score'))return Response.json({available:true,score:6,maxScore:6,percentage:100,correctCount:6,wrongCount:0,unansweredCount:0,questions:[]});
  if(path.endsWith('/me'))return Response.json({id:'test',name:joinedName,shareOnScreen:false,round:1,votes:[]});
  throw Error('Unexpected endpoint in participant test');
 };
 class CreditsRoll{sync(){}};
 const boot=new AsyncFunction('document','window','location','history','sessionStorage','localStorage','setInterval','setTimeout','clearTimeout','fetch','setQrCard','questionArtwork','questionArtMarkup','API_URL','PROJECT_URL','PUBLIC_KEY','CreditsRoll','AdminPanel','ClassesPanel','roomFromUrl','roomStorageKey','classUrl','renderQuizScore','PanelContinuation',source);
 await boot(document,window,location,history,sessionStorage,localStorage,fn=>intervals.push(fn),()=>0,()=>{},fetcher,()=>{},()=>({src:''}),()=>'', 'https://api.invalid', 'https://project.invalid','public',CreditsRoll,class{},class{},roomFromUrl,roomStorageKey,classUrl,renderQuizScore,PanelContinuation);
 return{get,requests,intervals,snapshot,navigations,localStorage,sessionStorage,submit:()=>get('joinForm').events.submit({preventDefault(){}})};
}

test('entry form removes both checkboxes and gives the join button the gradient styling',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 assert.doesNotMatch(html,/id="(?:anonymous|joinShare)"/);assert.match(html,/class="[^"]*shiny-cta gradient-button join-cta[^"]*" id="joinButton"/);
});
test('legacy optional policy still allows an empty name',async()=>{
 const ui=await participant('optional');assert.equal(ui.get('nameWrap').hidden,false);assert.equal(ui.get('displayName').required,false);
 await ui.submit();assert.deepEqual(ui.requests.find(r=>r.path.endsWith('/join')).body,{name:null,shareOnScreen:true});
 assert.doesNotMatch(readFileSync(new URL('../index.html',import.meta.url),'utf8'),/id="screenIdentity"/);
});
test('the registered name is trimmed for the organizer-enabled hall credits',async()=>{
 const ui=await participant('optional');ui.get('displayName').value='  نام آزمایشی  ';await ui.submit();
 assert.deepEqual(ui.requests.find(r=>r.path.endsWith('/join')).body,{name:'نام آزمایشی',shareOnScreen:true});
 assert.doesNotMatch(readFileSync(new URL('../index.html',import.meta.url),'utf8'),/id="identityShare"/);
});
test('named and anonymous panel policies keep their existing requirements',async()=>{
 const named=await participant('named');assert.equal(named.get('displayName').required,true);assert.equal(named.get('nameWrap').hidden,false);
 named.get('displayName').value='نام آزمایشی';await named.submit();assert.deepEqual(named.requests.find(r=>r.path.endsWith('/join')).body,{name:'نام آزمایشی',shareOnScreen:true});
 const anon=await participant('anonymous');anon.get('displayName').value='ignored';assert.equal(anon.get('nameWrap').hidden,true);assert.equal(anon.get('displayName').required,false);
 await anon.submit();assert.deepEqual(anon.requests.find(r=>r.path.endsWith('/join')).body,{name:null,shareOnScreen:true});
});
test('all answer options retain the gradient button classes',async()=>{
 const ui=await participant('optional',{question:{id:'q1',position:1,text:'سؤال نمونه',options:[{label:'اول'},{label:'دوم'}]}});await ui.submit();
 assert.equal((ui.get('questionBody').innerHTML.match(/class="option-button shiny-cta gradient-button /g)||[]).length,2);
});

test('unchanged polling preserves option elements and their animation; a new question updates them',async()=>{
 const question={id:'q1',position:1,text:'سؤال نمونه',options:[{label:'اول'},{label:'دوم'}]};
 const ui=await participant('optional',{question});await ui.submit();await new Promise(r=>setImmediate(r));
 const body=ui.get('questionBody'),writes=body.htmlWrites;
 for(let i=0;i<3;i++){ui.intervals[0]();await new Promise(r=>setImmediate(r));}
 assert.equal(body.htmlWrites,writes,'polling must not recreate the option nodes');
 ui.snapshot.payload.question={...question,text:'سؤال بعدی'};ui.intervals[0]();await new Promise(r=>setImmediate(r));
 assert.equal(body.htmlWrites,writes+1);assert.match(body.innerHTML,/سؤال بعدی/);
});

test('a joined competitor gets their private report only when the host finishes',async()=>{
 const ui=await participant('optional',{quiz:true});await ui.submit();await new Promise(r=>setImmediate(r));
 assert.equal(ui.requests.filter(r=>r.path.endsWith('/score')).length,0);
 ui.snapshot.payload.phase='finished';ui.snapshot.revision++;ui.intervals[0]();await new Promise(r=>setImmediate(r));await new Promise(r=>setImmediate(r));
 assert.equal(ui.requests.filter(r=>r.path.endsWith('/score')).length,1);
 assert.match(ui.get('questionBody').innerHTML,/نمرهٔ شما/);assert.match(ui.get('questionBody').innerHTML,/۶/);
 for(let i=0;i<6;i++){ui.intervals[0]();await new Promise(r=>setImmediate(r));}
 assert.equal(ui.requests.filter(r=>r.path.endsWith('/score')).length,1);
});

test('the real participant flow preserves the source login and saves a separate target login before navigation',async()=>{
 const target='cls-22222222-2222-4222-8222-222222222222';
 const ui=await participant('named',{nextPanel:{id:target,title:'پنل بعد'}});ui.get('displayName').value='نام آزمایشی';await ui.submit();
 const sourceToken=ui.localStorage.getItem('expo1405-participant');
 assert.equal(ui.get('nextPanelCard').hidden,true);
 ui.snapshot.payload.phase='finished';ui.snapshot.revision++;ui.intervals[0]();await new Promise(r=>setImmediate(r));
 assert.equal(ui.get('nextPanelCard').hidden,false);assert.equal(ui.get('continuePanel').disabled,false);
 await ui.get('continuePanel').events.click();
 assert.equal(ui.navigations.length,1);assert.equal(new URL(ui.navigations[0]).searchParams.get('class'),target);assert.equal(new URL(ui.navigations[0]).hash,'');
 assert(!ui.navigations[0].includes('TOKEN'));assert.equal(ui.localStorage.getItem('expo1405-participant'),sourceToken);
 assert.equal(ui.localStorage.getItem('expo1405-participant:'+target),'TARGET_TOKEN_WITH_MORE_THAN_32_CHARACTERS');
 assert.equal(ui.sessionStorage.getItem('expo1405-participant:'+target),'TARGET_TOKEN_WITH_MORE_THAN_32_CHARACTERS');
});
