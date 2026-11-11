import test from 'node:test';
import assert from 'node:assert/strict';
import {makeHandler,digest} from '../backend/core.mjs';
import {buildWorkbook} from '../backend/excel.mjs';
import {renderQuizScore} from '../quiz.mjs';
const base='https://example.invalid/functions/v1/expo1405-api';
test('score route requires a token and binds scoring to its hash',async()=>{
 let received;
 const handler=makeHandler({url:'https://db.invalid',key:'TEST_SERVER_KEY',fetcher:async(url,opts)=>{assert(url.endsWith('/rpc/expo1405_quiz_score'));received=JSON.parse(opts.body);return Response.json({available:false});}});
 assert.equal((await handler(new Request(base+'/score'))).status,401);
 const token='TEST_TOKEN_AT_LEAST_32_CHARACTERS_LONG';
 const response=await handler(new Request(base+'/score?participantId=someone-else',{headers:{'X-Participant-Token':token}}));
 assert.equal(response.status,200);assert.deepEqual(received,{p_room:'main',p_hash:await digest(token)});assert.deepEqual(await response.json(),{available:false});
});
test('host and unauthenticated visitor cannot list private scores',async()=>{
 const handler=makeHandler({url:'https://db.invalid',key:'TEST_SERVER_KEY',fetcher:()=>{throw Error('Database should not be called');}});
 for(const headers of [{},{'X-Host-Key':'TEST_HOST_KEY_LONG_ENOUGH'}])assert.equal((await handler(new Request(base+'/admin/quiz-results',{headers}))).status,403);
});
test('personal report escapes content and distinguishes poll from graded answers',()=>{
 const text=renderQuizScore({available:true,score:1,maxScore:1,percentage:100,correctCount:1,wrongCount:0,unansweredCount:0,questions:[{text:'<script>bad</script>',options:['A','B'],choice:1,correctChoice:1,earned:1},{text:'Poll',options:['A','B'],choice:null,correctChoice:null,earned:0}]});
 assert(!text.includes('<script>'));assert(text.includes('&lt;script&gt;'));assert(text.includes('نظرسنجی · بدون نمره'));assert(text.includes('صحیح · ۱ امتیاز'));
});
test('Excel includes private scores in addition to each question sheet',()=>{
 const text=new TextDecoder().decode(buildWorkbook({questions:[],responses:[],quizResults:[{name:'=FORMULA',participantId:'test',round:1,score:6,maxScore:6,percentage:100,correctCount:6,wrongCount:0,unansweredCount:0}]}));
 assert(text.includes('نمره‌ها'));assert(text.includes('xl/worksheets/sheet2.xml'));assert(text.includes('=FORMULA'));assert(!text.includes('<f>'));
});
