import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {randomUUID,createHash} from 'node:crypto';
import {createApi,normalizeSurvey,databaseError} from '../supabase/functions/zero-repetition-api/core.mjs';
const require=createRequire(import.meta.url),{PGlite}=require('@electric-sql/pglite'),ExcelJS=require('exceljs'),tools=require('../../response-tools.js');
const pg=new PGlite();await pg.exec('create role anon;create role authenticated;create role service_role bypassrls;create schema vault;create table vault.decrypted_secrets(name text,decrypted_secret text);');
await pg.exec(await readFile(new URL('../supabase/migrations/202610170001_independent_storage.sql',import.meta.url),'utf8'));
const db=async(a,d)=>{try{return (await pg.query('select zr_store($1,$2::jsonb) v',[a,JSON.stringify(d)])).rows[0].v;}catch(e){throw databaseError(e.message);}};
const api=createApi({db,config:{siteOrigin:'https://mofid-academy.github.io',siteUrl:'https://mofid-academy.github.io/zero-repetition/',adminUsername:'admin',signingKey:'synthetic-signing-key-12345678901234567890',adminKeyHash:createHash('sha256').update('synthetic').digest('hex')}});
const blank={title:'',steps:'',count:'',minutes:'',frequency:'daily',tools:'',human_decision:''};
const task={...blank,title:'گزارش',steps:'گردآوری اطلاعات',count:2,minutes:10,tools:'Excel'};
const base={full_name:'آزمایش',department:'آکادمی',job_title:'کارشناس',revision:0,action:'submit'};
let checks=0;const run=async(n,f)=>{await f();checks++;console.log('PASS '+n);};
try{
 const records=[];
 for(const count of [0,1,2,3])await run('persist and retrieve '+count+' activities',async()=>{
  const entry=await api.handle({action:'participant_start',request_id:randomUUID(),data:{username:'optional.'+count,access_key:randomUUID().replaceAll('-','')+randomUUID().replaceAll('-','')}});
  const input={...base,no_repetitive_tasks:count===0,tasks:Array.from({length:count},()=>({...task}))};
  const r=await api.handle({action:'survey_save',token:entry.token,request_id:randomUUID(),data:input});
  assert.equal(r.survey.status,'submitted');assert.equal(r.survey.tasks.filter(t=>t.title).length,count);assert.equal(r.survey.tasks.length,3);assert.equal(r.survey.no_repetitive_tasks,count===0);
  const got=await api.handle({action:'survey_get',token:entry.token});assert.deepEqual(got.survey,r.survey);records.push(r.survey);
 });
 await run('empty final answer requires explicit no-task choice',()=>assert.throws(()=>normalizeSurvey({...base,tasks:[]},{username:'test'},true),e=>e.code==='TASK_REQUIRED'));
 await run('partial optional task must be completed',()=>assert.throws(()=>normalizeSurvey({...base,tasks:[task,{...blank,steps:'ناقص'}]},{username:'test'},true),e=>e.code==='REQUIRED_FIELD'));
 await run('contradictory no-task choice rejected',()=>assert.throws(()=>normalizeSurvey({...base,no_repetitive_tasks:true,tasks:[task]},{username:'test'},true),e=>e.code==='TASK_CONFLICT'));
 await run('empty optional slots are accepted',()=>assert.equal(normalizeSurvey({...base,tasks:[task,blank,blank]},{username:'test'},true).tasks.filter(t=>t.title).length,1));
 await run('Excel has six real activities and no padded activity rows',async()=>{const wb=new ExcelJS.Workbook();await wb.xlsx.load(tools.buildXlsx(records));assert.equal(wb.getWorksheet('فعالیت‌ها').rowCount,11);assert.match(wb.getWorksheet('پاسخ‌ها').getCell('F6').value,/کار تکراری ندارد/);});
 console.log(JSON.stringify({passed:checks}));
}finally{await pg.close();}
