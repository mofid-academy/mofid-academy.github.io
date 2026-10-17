'use strict';
const fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const tools=require('../../response-tools.js');
const nodes=new Map();
const element=key=>{if(!nodes.has(key))nodes.set(key,{value:'',hidden:false,disabled:false,innerHTML:'',textContent:'',dataset:{},querySelector:s=>element(s),querySelectorAll:()=>[],classList:{add(){},remove(){},toggle(){}},focus(){},scrollIntoView(){},addEventListener(){},setAttribute(){}});return nodes.get(key);};
const document={body:{dataset:{},classList:{add(){},remove(){},toggle(){}}},querySelector:s=>element(s),querySelectorAll:()=>[],getElementById:id=>element('#'+id)};
const requests=[];
const sandbox={document,window:{ZERO_REPETITION_CONFIG:{apiUrl:'https://database.invalid/functions/v1/zero-repetition-api'},ZERO_REPETITION_TOOLS:tools,addEventListener(){}},location:{hash:'#invite=synthetic-private-token',pathname:'/zero-repetition/',search:''},history:{replaceState(){}},URL,URLSearchParams,AbortController,Blob,Uint8Array,crypto:crypto.webcrypto,setTimeout,clearTimeout,FormData:class{},confirm:()=>true,
 fetch:async(url,options)=>{requests.push(JSON.parse(options.body));return new Response(JSON.stringify({ok:false,code:'DATABASE_UNAVAILABLE',message:'offline'}),{status:503,headers:{'Content-Type':'application/json'}});}};
let source=fs.readFileSync('../app-live.js','utf8');
source=source.replace('  initialize();','  globalThis.app={initialize,state,renderForm,renderAdmin,renderRows,getMatches:()=>currentMatches};');
vm.createContext(sandbox);vm.runInContext(source,sandbox);
(async()=>{
 const app=sandbox.app;await app.initialize();
 assert.equal(element('#login-submit').disabled,false);console.log('PASS health failure does not disable the sign-in button');
 app.state.user={username:'qa.user',full_name:'آزمایش',department:'آکادمی',is_admin:false};app.renderForm();
 const before=requests.length;await element('#survey-form').onsubmit({preventDefault(){}});
 assert.equal(app.state.step,1);assert.equal(requests.length,before);console.log('PASS moving between questionnaire pages makes no network request');
 app.state.responses=[{id:'one',full_name:'علی كريمي',username:'ali',department:'پشتیبانی',job_title:'کارشناس',status:'submitted',tasks:[],sync_state:'pending'},{id:'two',full_name:'همکار دیگر',username:'other',department:'آکادمی',job_title:'مدیر',status:'draft',tasks:[]}];
 app.renderAdmin({registered_users:2});element('#position-filter').value='کارشناس';element('#response-search').value='کریمی';app.renderRows();
 assert.equal(app.getMatches().length,1);assert.equal(app.getMatches()[0].id,'one');console.log('PASS admin position filter and Persian name search combine correctly');
 assert.equal(element('#sync-sheets-button').disabled,true);assert.equal(element('#export-button').disabled,false);console.log('PASS unconfigured Sheets leaves admin data and Excel available');
 const html=fs.readFileSync('../index.html','utf8');assert(html.includes('response-tools.js'));assert(!/localStorage|sessionStorage/.test(source));assert(!source.includes('window.ExcelJS'));console.log('PASS no browser response database or remote Excel dependency');
 console.log('PASS 5 frontend behavior checks; browser visual QA unavailable in this environment');
})().catch(e=>{console.error(e);process.exitCode=1;});
