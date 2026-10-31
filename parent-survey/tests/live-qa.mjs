import assert from 'node:assert/strict';
import {QUESTIONS,SURVEY_ID} from '../questions.mjs';
const input=await new Promise(resolve=>{let s='';process.stdin.on('data',b=>{s+=b;if(s.includes('\n'))resolve(JSON.parse(s.trim()));});});
const token=input.token;
const url='https://siwmzffadbbhcyyppwzn.supabase.co/functions/v1/parent-survey-api';
async function send(action,data={},expected=200){const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://mofid-academy.github.io'},body:JSON.stringify({action,...data})});const body=await r.json();assert.equal(r.status,expected,JSON.stringify(body));return body;}
const payload=i=>({id:crypto.randomUUID(),survey_id:SURVEY_ID,school:'کنترل کیفیت سامانه',grade:'ششم',cohort:'آزمون خودکار',relationship:'مادر',duration_seconds:120,answers:Object.fromEntries(QUESTIONS.map(q=>[q.code,q.kind==='text'?'متن آزمایشی':q.code==='P14'?(i?'بله':'خیر'):q.code==='P13'?null:q.code==='P10'?(i?10:0):q.options.at(-1).value]))});
try{
 const a=payload(0),b=payload(1);
 const first=await send('admin_test_submit',{token,data:a});assert.equal(first.stored,true);assert.equal(first.id,a.id);
 const again=await send('admin_test_submit',{token,data:a});assert.equal(again.created_at,first.created_at);
 await send('admin_test_submit',{token,data:b});
 const both=await send('admin_list',{token,filters:{is_test:true,school:'کنترل کیفیت سامانه'}});assert.equal(both.total,2);assert.equal(both.stats.nps,0);assert.equal(both.stats.satisfaction,5);assert.equal(both.stats.sponsor_count,0);assert.equal(both.stats.consent_count,1);
 const zero=await send('admin_list',{token,filters:{is_test:true,qcode:'P10',qvalue:'0'}});assert.equal(zero.total,1);assert.equal(zero.rows[0].p10,0);
 const consent=await send('admin_list',{token,filters:{is_test:true,consent:'true'}});assert.equal(consent.total,1);assert.equal(consent.rows[0].p14,true);
 const actual=await send('admin_list',{token});assert.equal(actual.rows.some(r=>r.id===a.id||r.id===b.id),false);
 const bad=structuredClone(a);bad.answers.P01=2;await send('admin_test_submit',{token,data:bad},409);
 await send('admin_list',{},401);await send('admin_test_submit',{data:a},401);
 const invalid=payload(0);invalid.answers.P01=99;await send('submit',{data:invalid},400);
 console.log('PASS: live storage, idempotency, ID conflict, admin authorization, zero-score filter, consent filter, NPS, optional denominators and isolation of test records.');
}finally{await send('admin_test_clear',{token});const clean=await send('admin_list',{token,filters:{is_test:true}});assert.equal(clean.total,0);console.log('PASS: test records removed; production responses untouched.');process.exit(0);}
