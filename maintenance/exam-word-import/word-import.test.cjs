const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {deflateRawSync}=require('node:zlib');
const root=path.resolve(__dirname,'../..');
const reader=require(path.join(root,'Academy-Exam/Admin/word-import.js'));
const lines=['1. نمونهٔ سؤال','1) گزینهٔ اول','2) گزینهٔ دوم','پاسخ صحیح: 2) گزینهٔ دوم'];
function crc32(bytes){let crc=0xffffffff;for(const byte of bytes){crc^=byte;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return (crc^0xffffffff)>>>0;}
function zip(xml,{method=8,flags=0,crc,plainSize,name='word/document.xml'}={}){
 const plain=Buffer.from(xml),data=method===8?deflateRawSync(plain):plain,filename=Buffer.from(name),sum=crc??crc32(plain),size=plainSize??plain.length;
 const local=Buffer.alloc(30);local.writeUInt32LE(0x04034b50,0);local.writeUInt16LE(flags,6);local.writeUInt16LE(method,8);local.writeUInt32LE(sum,14);local.writeUInt32LE(data.length,18);local.writeUInt32LE(size,22);local.writeUInt16LE(filename.length,26);
 const central=Buffer.alloc(46);central.writeUInt32LE(0x02014b50,0);central.writeUInt16LE(flags,8);central.writeUInt16LE(method,10);central.writeUInt32LE(sum,16);central.writeUInt32LE(data.length,20);central.writeUInt32LE(size,24);central.writeUInt16LE(filename.length,28);
 const offset=local.length+filename.length+data.length,end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50,0);end.writeUInt16LE(1,8);end.writeUInt16LE(1,10);end.writeUInt32LE(central.length+filename.length,12);end.writeUInt32LE(offset,16);
 return Buffer.concat([local,filename,data,central,filename,end]);
}
test('DOCX stored and deflated XML is decoded with a valid checksum',async()=>{for(const method of [0,8])assert.equal(await reader.documentXML(zip('<document>متن</document>',{method})),'<document>متن</document>');});
test('Invalid ZIP, missing XML, encrypted files and checksum failures are rejected',async()=>{
 await assert.rejects(reader.documentXML(Buffer.from('invalid')));
 await assert.rejects(reader.documentXML(zip('text',{name:'other.xml'})),/پیدا نشد/);
 await assert.rejects(reader.documentXML(zip('text',{flags:1})),/رمزگذاری/);
 await assert.rejects(reader.documentXML(zip('text',{crc:123})),/صحت متن/);
 await assert.rejects(reader.documentXML(zip('text',{plainSize:9*1024*1024})),/بزرگ/);
});
test('Persian and Arabic labels preserve the exact explicit answer',()=>{
 const out=reader.parseParagraphs(['سؤال ۱. متن سؤال','١) اول','٢) دوم','پاسخ صحیح: ۲) دوم'],{filename:'نمونه.docx'});
 assert.equal(out.bank.examTitle,'نمونه');assert.equal(out.bank.questions[0].correct_option_index,1);assert.equal(out.bank.questions[0].correct_answer,'دوم');assert.equal(out.missing_answer_count,0);
});
test('Every read creates an independent exam and stable question identifiers',()=>{
 const a=reader.parseParagraphs(lines),b=reader.parseParagraphs(lines);assert.notEqual(a.bank.examId,b.bank.examId);assert.match(a.bank.questions[0].id,new RegExp('^'+a.bank.examId+'-Q1$'));assert.equal(a.bank.questions.length,1);
});
test('Missing answers remain unset and contradictory answer keys are rejected',()=>{
 const missing=reader.parseParagraphs(lines.slice(0,-1));assert.equal(missing.missing_answer_count,1);assert.equal(missing.bank.questions[0].correct_option_index,-1);assert.equal(missing.bank.questions[0].correct_answer,'');
 assert.throws(()=>reader.parseParagraphs([...lines.slice(0,-1),'پاسخ صحیح: 1) گزینهٔ دوم']),/همخوان/);
 assert.throws(()=>reader.parseParagraphs([...lines,'پاسخ صحیح: 2) گزینهٔ دوم']),/بیش از یک پاسخ/);
});
test('Duplicate numbering, incomplete options and question limits fail before adoption',()=>{
 assert.throws(()=>reader.parseParagraphs([...lines,...lines]),/تکرار/);
 assert.throws(()=>reader.parseParagraphs(['1. سؤال','1) یک']),/فقط یک گزینه/);
 assert.throws(()=>reader.parseParagraphs(['1. سؤال','2) دو']),/پیوسته/);
 assert.throws(()=>reader.parseParagraphs(Array.from({length:201},(_,i)=>`${i+1}. سؤال`)),/۲۰۰/);
});
test('Admin normalization keeps explicit keys while public form serialization drops keys',()=>{
 const listeners={},ctx={crypto,document:{getElementById(){return null},addEventListener(type,fn){listeners[type]=fn}},setTimeout(){},window:null};ctx.window=ctx;vm.createContext(ctx);
 vm.runInContext(fs.readFileSync(path.join(root,'.academy-admin-src/questions.js'),'utf8'),ctx);
 vm.runInContext(fs.readFileSync(path.join(root,'Academy-Exam/Admin/exam-save-sync.js'),'utf8'),ctx);
 const bank=ctx.AcademyQuestions.fromInput(reader.parseParagraphs(lines).bank);
 assert.equal(bank.questions[0].correct_answer,'گزینهٔ دوم');assert.equal(bank.questions[0].correct_option_index,1);
 const publicBank=ctx.AcademyQuestions.exam(bank);assert.equal('correct_answer' in publicBank.questions[0],false);assert.equal('correct_option_index' in publicBank.questions[0],false);
 listeners['academy-local-questions-loaded']();assert.equal(ctx.__ACADEMY_QUESTIONS_DIRTY__,true);listeners['academy-remote-questions-loaded']();assert.equal(ctx.__ACADEMY_QUESTIONS_DIRTY__,false);
});
function importUI(read){
 const fields=new Map(),events=[],requests=[],adoptions=[];let install;
 const node=()=>({value:'',disabled:false,isConnected:true,classList:{add(){},remove(){}},click(){},querySelector(selector){return fields.get(selector.slice(1))},insertAdjacentElement(){},closest(){return tools}});
 const tools=node(),load=node();fields.set('qb-load-remote',load);
 for(const id of ['academyImportTitle','academyImportBtn','academyImportFile','academyImportResult','status'])fields.set(id,node());
 fields.get('academyImportFile').files=[new File(['sample'],'new-exam.docx')];
 const doc={head:{appendChild(n){if(n.id)fields.set(n.id,n)}},documentElement:{},getElementById(id){return fields.get(id)||null},querySelector(){return null},createElement:node,addEventListener(){},dispatchEvent(e){events.push(e.type)}};
 const ctx={document:doc,FormData,AbortController,AbortSignal,URL,CustomEvent,MutationObserver:class{observe(){}},confirm:()=>true,fetch(){requests.push(1);throw Error('DOCX must not call the server importer')},setTimeout(fn,ms){if(ms===300)install=fn},clearTimeout(){},sessionStorage:{getItem(){return null}},window:null};
 ctx.window=ctx;ctx.addEventListener=()=>{};ctx.AcademyWordImport={read};ctx.__ACADEMY_GET_QUESTION_BANK__=()=>({formId:'mofid-exam'});ctx.__ACADEMY_ADMIN__={adopt(bank){adoptions.push(bank);return bank}};vm.createContext(ctx);
 vm.runInContext(fs.readFileSync(path.join(root,'Academy-Exam/Admin/file-import-ui.js'),'utf8'),ctx);install();return {ctx,fields,requests,adoptions,events};
}
test('Selecting Word adopts a local draft, marks it dirty and never posts a file',async()=>{
 const ui=importUI(async()=>reader.parseParagraphs(lines));await ui.fields.get('academyImportFile').onchange();assert.equal(ui.requests.length,0);assert.equal(ui.adoptions.length,1,ui.fields.get('status').textContent);assert.ok(ui.events.includes('academy-local-questions-loaded'));assert.match(ui.fields.get('status').textContent,/پیش‌نویس مستقل/);assert.equal(ui.fields.get('academyImportBtn').disabled,false);
});
test('Unreadable Word does not replace the current question bank or retry on the server',async()=>{
 const ui=importUI(async()=>{throw Error('invalid document')});await ui.fields.get('academyImportFile').onchange();assert.equal(ui.requests.length,0);assert.equal(ui.adoptions.length,0);assert.match(ui.fields.get('status').textContent,/خواندن فایل Word انجام نشد/);assert.equal(ui.fields.get('academyImportBtn').disabled,false);
});
