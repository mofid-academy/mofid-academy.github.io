import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {roomFromUrl,roomStorageKey,classUrl} from '../class-context.mjs';

const room='cls-11111111-1111-4111-8111-111111111111';
const source=readFileSync(new URL('../app.mjs',import.meta.url),'utf8').replace(/^import .*;\s*$/gm,'');
const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;

function storage(){const values=new Map();return{getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)}}
function element(){const events={};let html='';const node={events,hidden:false,disabled:false,value:'',textContent:'',htmlWrites:0,classList:{toggle(){}},addEventListener:(name,fn)=>events[name]=fn,setAttribute(){},replaceChildren(){html=''}};Object.defineProperty(node,'innerHTML',{get:()=>html,set:value=>{html=value;node.htmlWrites++}});return node}
async function screen(fetcher,{fragment='',demo=''}={}){
 const nodes=new Map(),intervals=[];const get=id=>{if(!nodes.has(id))nodes.set(id,element());return nodes.get(id)};
 get('displayError').hidden=true;get('screenContainer').hidden=true;get('unavailableNotice').hidden=true;
 const connection=element(),sessionStorage=storage(),localStorage=storage();
 const location=new URL('https://example.invalid/expo1405/screen.html?class='+room+(demo?'&demo='+demo:'')+fragment);
 const document={body:{dataset:{view:'screen'},classList:{toggle(){}}},hidden:false,querySelector:s=>get(s.slice(1)),querySelectorAll:s=>s==='[data-connection]'?[connection]:[],addEventListener(){}};
 const window={addEventListener(){},qrcode:null},cleanUrls=[];const history={replaceState:(_state,_title,url)=>cleanUrls.push(url)};
 class CreditsRoll{sync(){}setSpeed(){}setPaused(){}}
 const boot=new AsyncFunction('document','window','location','history','sessionStorage','localStorage','setInterval','setTimeout','clearTimeout','fetch','setQrCard','questionArtwork','questionArtMarkup','API_URL','PROJECT_URL','PUBLIC_KEY','CreditsRoll','AdminPanel','ClassesPanel','roomFromUrl','roomStorageKey','classUrl',source);
 await boot(document,window,location,history,sessionStorage,localStorage,fn=>intervals.push(fn),()=>0,()=>{},fetcher,()=>{},()=>({src:''}),()=>'', 'https://api.invalid', 'https://project.invalid','public',CreditsRoll,class{},class{},roomFromUrl,roomStorageKey,classUrl);
 return{get,connection,sessionStorage,intervals,cleanUrls,submit:()=>get('displayLoginForm').events.submit({preventDefault(){}})};
}
const state=()=>Response.json({revision:1,payload:{room,round:1,phase:'waiting',question:null,title:'پنل آزمایشی',total:0,credits:[]}});

test('screen starts waiting for login and keeps the selected panel in the host link',async()=>{
 let calls=0;const ui=await screen(async()=>{calls++;return state()});
 assert.equal(calls,0);assert.equal(ui.connection.textContent,'در انتظار ورود');
 assert.equal(new URL(ui.get('openHostFromScreen').href).searchParams.get('class'),room);
});
test('a rejected code shows panel-specific guidance instead of endless connecting',async()=>{
 const ui=await screen(async()=>Response.json({error:'unauthorized'},{status:401}));ui.get('displayCode').value='wrong-code';await ui.submit();
 assert.equal(ui.connection.textContent,'در انتظار ورود');assert.equal(ui.get('displayError').hidden,false);
 assert.match(ui.get('displayError').textContent,/برای این پنل معتبر نیست/);assert.equal(ui.get('screenContainer').hidden,true);
 assert.equal(ui.get('displayLoginButton').disabled,false);assert.equal(ui.sessionStorage.getItem('expo1405-display:'+room),null);
});
test('a network failure is distinct from an invalid display code',async()=>{
 const ui=await screen(async()=>{throw new TypeError('Failed to fetch')});ui.get('displayCode').value='some-code';await ui.submit();
 assert.equal(ui.connection.textContent,'ارتباط با سرور برقرار نشد');assert.match(ui.get('displayError').textContent,/اینترنت را بررسی کنید/);
 assert.equal(ui.get('displayLoginButton').disabled,false);
});
test('a valid code opens the correct screen without a duplicate polling request',async()=>{
 let resolve,calls=0;const ui=await screen(()=>{calls++;return new Promise(r=>resolve=r)});ui.get('displayCode').value='valid-code';
 const pending=ui.submit();assert.equal(ui.connection.textContent,'در حال بررسی ورود…');assert.equal(ui.get('displayLoginButton').disabled,true);
 ui.intervals[0]();assert.equal(calls,1);resolve(state());await pending;
 assert.equal(ui.get('displayLogin').hidden,true);assert.equal(ui.get('screenContainer').hidden,false);
 assert.match(ui.connection.textContent,/متصل/);assert.equal(ui.sessionStorage.getItem('expo1405-display:'+room),'valid-code');
});
test('an invalid token in a private link returns to login with an explanation',async()=>{
 const ui=await screen(async()=>Response.json({error:'unauthorized'},{status:401}),{fragment:'#display=wrong-code'});
 assert.equal(ui.connection.textContent,'در انتظار ورود');assert.match(ui.get('displayError').textContent,/برای این پنل معتبر نیست/);
 assert.equal(ui.sessionStorage.getItem('expo1405-display:'+room),null);
});
test('a valid private link opens its panel and removes the token from the address',async()=>{
 const ui=await screen(async(url,options)=>{assert.equal(new URL(url).searchParams.get('class'),room);assert.equal(options.headers['X-Display-Key'],'valid-code');return state()},{fragment:'#display=valid-code'});
 assert.equal(ui.get('displayLogin').hidden,true);assert.equal(ui.get('screenContainer').hidden,false);assert.match(ui.connection.textContent,/متصل/);
 assert.equal(ui.cleanUrls[0],'/expo1405/screen.html?class='+room);assert.equal(ui.sessionStorage.getItem('expo1405-display:'+room),'valid-code');
});
const fixtureQuestion=(id='q1',text='سؤال آزمایشی')=>({id,position:1,text,options:[{index:0,label:'گزینهٔ اول',count:3},{index:1,label:'گزینهٔ دوم',count:1}]});
const flush=()=>new Promise(resolve=>setImmediate(resolve));

test('waiting hall shows its private first-question preview and keeps it stable during polling',async()=>{
 let requests=0;
 const payload={room,round:1,phase:'waiting',question:null,previewQuestion:fixtureQuestion(),questionCount:1,title:'پنل آزمایشی',resultsRevealed:false,total:0};
 const ui=await screen(async()=>{requests++;return Response.json({revision:1,payload})},{fragment:'#display=valid-code'});
 const heading=ui.get('screenQuestion'),options=ui.get('resultsBody');
 assert.match(heading.innerHTML,/سؤال آزمایشی/);assert.doesNotMatch(heading.innerHTML,/منتظر شروع|glass-jet|easytrader-glass/);
 assert.match(options.innerHTML,/گزینهٔ اول/);assert.match(options.innerHTML,/گزینهٔ دوم/);
 assert.match(options.innerHTML,/data-results-revealed="false"/);assert.doesNotMatch(options.innerHTML,/role="meter"/);
 assert.equal(options.hidden,false);assert.equal(ui.get('modeCredits').disabled,true);
 ui.intervals[0]();await flush();assert.equal(requests,2);assert.equal(heading.htmlWrites,1);assert.equal(options.htmlWrites,1);
});
test('votes stay concealed until explicit reveal, then a new question conceals results again',async()=>{
 let payload={room,round:1,phase:'open',question:fixtureQuestion(),questionCount:2,title:'پنل آزمایشی',resultsRevealed:false,total:4};
 const ui=await screen(async()=>Response.json({revision:1,payload}),{fragment:'#display=valid-code'});
 const options=ui.get('resultsBody'),initialWrites=options.htmlWrites;
 assert.match(options.innerHTML,/data-results-revealed="false"/);assert.doesNotMatch(options.innerHTML,/aria-valuenow|<strong>۷۵/);
 payload={...payload,total:8,question:{...payload.question,options:payload.question.options.map((o,i)=>({...o,count:i?1:7}))}};
 ui.intervals[0]();await flush();assert.equal(options.htmlWrites,initialWrites,'hidden live votes should not replace the cards');
 payload={...payload,resultsRevealed:true};ui.intervals[0]();await flush();
 assert.match(options.innerHTML,/data-results-revealed="true"/);assert.match(options.innerHTML,/aria-valuenow="88"/);assert.equal(ui.get('modeCredits').disabled,false);
 assert.equal(ui.get('resultsBody').hidden,false);assert.equal(ui.get('creditsStage').hidden,true);
 payload={...payload,question:fixtureQuestion('q2','پرسش بعدی'),resultsRevealed:false};ui.intervals[0]();await flush();
 assert.match(ui.get('screenQuestion').innerHTML,/پرسش بعدی/);assert.match(options.innerHTML,/data-results-revealed="false"/);assert.doesNotMatch(options.innerHTML,/role="meter"/);
});
test('finished and empty panels do not restore the removed waiting artwork',async()=>{
 let payload={room,round:1,phase:'waiting',question:null,title:'پنل آزمایشی',total:0};
 const ui=await screen(async()=>Response.json({revision:1,payload}),{fragment:'#display=valid-code'});
 assert.match(ui.get('screenQuestion').innerHTML,/هنوز سؤالی ثبت نشده/);assert.doesNotMatch(ui.get('screenQuestion').innerHTML,/منتظر شروع|glass-jet/);
 payload={...payload,phase:'finished'};ui.intervals[0]();await flush();
 assert.match(ui.get('screenQuestion').innerHTML,/این پنل پایان یافت/);
});
test('the first-question demo is fictional and never requests live state',async()=>{
 let requests=0;const ui=await screen(async()=>{requests++;return state()},{demo:'waiting'});
 assert.equal(requests,0);assert.match(ui.get('demoBanner').textContent,/نمونه/);assert.match(ui.get('screenQuestion').innerHTML,/چه تجربه‌ای/);
 assert.match(ui.get('resultsBody').innerHTML,/data-results-revealed="false"/);
 assert.equal(ui.get('joinLink').href,'#');assert.equal(ui.get('joinLink').textContent,'کد QR نمونه');
});
test('the reveal demo toggles fictional results without sending votes or organizer actions',async()=>{
 let requests=0;const ui=await screen(async()=>{requests++;return state()},{demo:'reveal'});
 assert.equal(ui.get('demoRevealResults').hidden,false);assert.match(ui.get('resultsBody').innerHTML,/data-results-revealed="false"/);
 ui.get('demoRevealResults').events.click();assert.match(ui.get('resultsBody').innerHTML,/data-results-revealed="true"/);
 ui.get('demoRevealResults').events.click();assert.match(ui.get('resultsBody').innerHTML,/data-results-revealed="false"/);assert.equal(requests,0);
});
