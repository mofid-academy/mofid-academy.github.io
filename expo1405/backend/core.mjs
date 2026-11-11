import {buildWorkbook} from './excel.mjs';
export const ROOM = 'main';
export const ALLOWED_ORIGINS = ['https://mofid-academy.github.io'];
const messages = {
  quiz_answer_required:'پاسخ صحیح سؤال یا «بدون نمره» را مشخص کنید.',
  invalid_quiz_answer:'پاسخ صحیح باید یکی از گزینه‌های همین سؤال باشد.',
  voting_closed:'رأی‌گیری این سؤال بسته شده یا سؤال تغییر کرده است.',
  invalid_participant:'دوباره وارد نظرسنجی شوید.',
  invalid_choice:'یکی از گزینه‌های همین سؤال را انتخاب کنید.',
  name_required:'برای این اجرا، واردکردن نام لازم است. دوباره وارد شوید.',
  close_first:'ابتدا رأی‌گیری را ببندید.',
  question_has_votes:'این سؤال در اجرای فعلی پاسخ دارد. برای ویرایش، اجرای تازه بسازید.',
  active_question:'ابتدا به صفحهٔ انتظار بروید؛ سپس سؤال را حذف کنید.',
  invalid_question:'متن سؤال و بین ۲ تا ۸ گزینهٔ معتبر وارد کنید.',
  invalid_settings:'تنظیمات معتبر نیست.',
  invalid_name:'نام نمایشی باید حداکثر ۸۰ نویسه باشد.',
  question_not_found:'سؤال پیدا نشد.',
  invalid_class_title:'نام پنل باید بین ۲ تا ۱۰۰ نویسه باشد.',
  class_not_found:'پنل پیدا نشد؛ لینک این پنل را بررسی کنید.',
  invalid_class:'شناسهٔ پنل معتبر نیست.',
  class_deleted:'این پنل حذف شده است؛ از بخش حذف‌شده‌ها آن را بازیابی کنید.',
  class_confirmation_required:'برای حذف، نام دقیق همین پنل را وارد کنید.',
  invalid_class_action:'عملیات پنل معتبر نیست.',
};
export async function digest(s) {
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))].map(b=>b.toString(16).padStart(2,'0')).join('');
}
export function constantEqual(a,b) {
  if(typeof a!=='string'||typeof b!=='string')return false;
  let diff=a.length^b.length;
  for(let i=0;i<Math.max(a.length,b.length);i++)diff|=(a.charCodeAt(i)||0)^(b.charCodeAt(i)||0);
  return diff===0;
}
export function withoutResults(row){
  if(!row?.payload)return row;
  const {credits,total,participants,...payload}=row.payload;
  if(payload.question)payload.question={...payload.question,options:(payload.question.options||[]).map(({count,...option})=>option)};
  return {...row,payload};
}
export function csvCell(value) {
  let s=String(value??'');
  if(/^[\s]*[=+@-]/.test(s))s="'"+s;
  return '"'+s.replaceAll('"','""')+'"';
}
export function csvExport(rows) {
  return '\uFEFF'+[['اجرا','شناسهٔ مخاطب','نام اختیاری','سؤال','پاسخ','زمان تهران'],...rows.map(v=>[v.round,v.participant_id,v.display_name??'ناشناس',v.question_text,v.option_text,new Date(v.created_at).toLocaleString('sv-SE',{timeZone:'Asia/Tehran'})])].map(r=>r.map(csvCell).join(',')).join('\r\n');
}
export function makeHandler({url,key,fetcher=fetch}) {
  const displayToken=async room=>{const k=await crypto.subtle.importKey('raw',new TextEncoder().encode(key),{name:'HMAC',hash:'SHA-256'},false,['sign']);return [...new Uint8Array(await crypto.subtle.sign('HMAC',k,new TextEncoder().encode('expo1405-display:'+room)))].map(b=>b.toString(16).padStart(2,'0')).join('');};
  const dbHeaders={apikey:key,'Content-Type':'application/json'};
  if(key.startsWith('eyJ'))dbHeaders.Authorization='Bearer '+key;
  async function db(path,{method='GET',body}={}) {
    const response=await fetcher(url+'/rest/v1/'+path,{method,headers:dbHeaders,body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(18000)});
    const raw=await response.text(); let data; try{data=JSON.parse(raw)}catch{data=null;}
    if(!response.ok){const e=new Error(data?.message||'database_error');e.status=400;throw e;}
    return data;
  }
  const rpc=(name,body)=>db('rpc/expo1405_'+name,{method:'POST',body});
  // Share concurrent public reads within an Edge isolate, without a stale TTL cache.
  const stateReads=new Map();
  async function publicState(room){
    let pending=stateReads.get(room);
    if(!pending){pending=db('expo1405_public?id=eq.'+room+'&select=payload,revision');stateReads.set(room,pending);}
    try{return await pending;}finally{if(stateReads.get(room)===pending)stateReads.delete(room);}
  }
  return async function handler(req) {
    const origin=req.headers.get('origin');
    const cors={'Access-Control-Allow-Origin':ALLOWED_ORIGINS.includes(origin)?origin:ALLOWED_ORIGINS[0],
      'Access-Control-Allow-Headers':'content-type,x-host-key,x-admin-key,x-display-key,x-participant-token',
      'Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Max-Age':'86400','Vary':'Origin','Cache-Control':'no-store',
      'X-Content-Type-Options':'nosniff'};
    const json=(data,status=200)=>Response.json(data,{status,headers:cors});
    if(origin&&!ALLOWED_ORIGINS.includes(origin))return json({error:'این نشانی مجاز نیست.'},403);
    if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
    try {
      const requestUrl=new URL(req.url);
      const path=requestUrl.pathname.split('/expo1405-api')[1]||'/';
      const room=requestUrl.searchParams.get('class')||ROOM;
      if(!/^(main|cls-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/.test(room))return json({error:messages.class_not_found},404);
      if(req.method==='GET'&&path==='/state') {
        const rows=await publicState(room);
        if(rows[0]?.payload?.deleted)return json({error:'این پنل حذف شده است. لینک پنل را از برگزارکننده بگیرید.'},410);
        return rows[0]?json(withoutResults(rows[0])):json({error:messages.class_not_found},404);
      }
      if(req.method==='GET'&&path==='/display/state'){
        const token=req.headers.get('x-display-key')||'';
        if(!token||!constantEqual(token,await displayToken(room)))return json({error:'نمایشگر را از بخش مدیریت همین پنل باز کنید یا کد نمایشگر آن را وارد کنید.'},401);
        const rows=await db('expo1405_display?id=eq.'+room+'&select=payload,revision');
        if(rows[0]?.payload?.deleted)return json({error:messages.class_deleted},410);
        return rows[0]?json(rows[0]):json({error:messages.class_not_found},404);
      }
      if(path.startsWith('/host')||path.startsWith('/admin')) {
        const adminSupplied=req.headers.get('x-admin-key')||'';
        const ownerOnly=path.startsWith('/admin')||path==='/host/export';
        if(ownerOnly&&!adminSupplied)return json({error:'آرشیو پاسخ‌ها و اکسل فقط با ورود ادمین در دسترس است.'},403);
        const supplied=adminSupplied||req.headers.get('x-host-key')||'';
        if(supplied.length<16||supplied.length>160)return json({error:'کد ورود معتبر نیست.'},401);
        const ip=req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown';
        const ipHash=await digest((adminSupplied?'admin:':'host:')+key+':'+ip);
        const roots=await db('expo1405_rooms?id=eq.'+ROOM+'&select=host_key_hash,admin_key_hash,round,title,deleted_at,is_quiz');
        const expected=adminSupplied?roots[0]?.admin_key_hash:roots[0]?.host_key_hash;
        if(!roots.length||!constantEqual(await digest(supplied),expected)) {
          const allowed=await rpc('rate_limit',{p_key:ipHash,p_limit:15,p_seconds:900});
          return json({error:allowed?'کد ورود مجری معتبر نیست.':'تلاش‌های ورود زیاد است؛ کمی بعد دوباره تلاش کنید.'},allowed?401:429);
        }
        // Failed-attempt lockout applies even when the next submitted key is valid.
        const limits=await db('expo1405_limits?key=eq.'+ipHash+'&select=bucket,hits');
        if(limits[0]&&limits[0].bucket===Math.floor(Date.now()/900000)&&limits[0].hits>15)return json({error:'تلاش‌های ورود زیاد است؛ کمی بعد دوباره تلاش کنید.'},429);
        const role=adminSupplied?'admin':'host';
        if(req.method==='GET'&&path==='/host/classes'){
          const list=await rpc('classes',{});return json({role,classes:list.filter(c=>!c.deletedAt),trash:list.filter(c=>c.deletedAt)});
        }
        if(req.method==='POST'&&path==='/host/class-lifecycle'){
          const raw=await req.text();if(raw.length>2000)return json({error:'درخواست بزرگ است.'},413);
          const body=JSON.parse(raw);
          if(!/^(main|cls-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/.test(body.classId||'')||!['reopen','delete','restore'].includes(body.action))return json({error:messages.invalid_class_action},400);
          if(body.action==='delete'&&(typeof body.confirmTitle!=='string'||!body.confirmTitle.trim()))return json({error:messages.class_confirmation_required},409);
          return json(await rpc('class_lifecycle',{p_room:body.classId,p_action:body.action,p_confirm_title:body.confirmTitle||null}));
        }
        const rooms=room===ROOM?roots:await db('expo1405_rooms?id=eq.'+room+'&parent_id=eq.main&select=round,title,deleted_at,is_quiz');
        if(!rooms.length)return json({error:messages.class_not_found},404);
        if(req.method==='GET'&&path==='/admin/session')return json({role,currentRound:rooms[0].round,title:rooms[0].title,directoryOnly:!!rooms[0].deleted_at});
        if(req.method==='POST'&&(path==='/host/classes'||path==='/host/class-title')){
          const raw=await req.text();if(raw.length>2000)return json({error:'درخواست بزرگ است.'},413);
          const body=JSON.parse(raw);
          if(path==='/host/class-title'){
            if(rooms[0].deleted_at)return json({error:messages.class_deleted},410);
            return json(await rpc('rename_class',{p_room:room,p_title:body.title}));
          }
          if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.requestId||''))return json({error:'شناسهٔ درخواست معتبر نیست.'},400);
          return json(await rpc('create_class',{p_source:room,p_title:body.title||null,p_copy:body.copyQuestions!==false,p_close_previous:body.closePrevious===true,p_request:body.requestId}));
        }
        if(rooms[0].deleted_at){
          if(req.method==='GET'&&path==='/host')return json({role,directoryOnly:true,questions:[]});
          return json({error:messages.class_deleted},410);
        }
        if(req.method==='POST'&&path==='/host/display-token')return json({token:await displayToken(room)});
        const selected=requestUrl.searchParams.get('round');
        const selectedRound=selected==='all'?null:Number(selected||rooms[0].round);
        if((path.startsWith('/admin')||path==='/host/export')&&selectedRound!==null&&(!Number.isInteger(selectedRound)||selectedRound<1||selectedRound>rooms[0].round))return json({error:'شمارهٔ اجرا معتبر نیست.'},400);
        if(req.method==='GET'&&path==='/admin/quiz-results')return json(await rpc('quiz_results',{p_room:room,p_round:selectedRound}));
        if(req.method==='GET'&&path==='/admin/summary')return json(await rpc('admin_summary',{p_room:room,p_round:selectedRound}));
        if(req.method==='GET'&&path==='/admin/responses'){
          const question=requestUrl.searchParams.get('question')||null,page=Number(requestUrl.searchParams.get('page')||1);
          if((question&&!/^[0-9a-f-]{36}$/i.test(question))||!Number.isInteger(page)||page<1||page>100000)return json({error:'فیلتر گزارش معتبر نیست.'},400);
          return json(await rpc('admin_responses',{p_room:room,p_round:selectedRound,p_question:question,p_page:page}));
        }
        if(req.method==='GET'&&(path==='/admin/export'||path==='/host/export')){
          const report=await rpc('admin_report',{p_room:room,p_round:selectedRound});
          if(!report||report.responses.length>50000)return json({error:'تعداد پاسخ‌ها برای یک فایل زیاد است؛ یک اجرای مشخص را انتخاب کنید.'},413);
          if(rooms[0].is_quiz)report.quizResults=(await rpc('quiz_results',{p_room:room,p_round:selectedRound})).results;
          const bytes=buildWorkbook(report);
          return new Response(bytes,{headers:{...cors,'Cache-Control':'no-store, private','Content-Type':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','Content-Disposition':'attachment; filename="expo1405-'+room+'-'+(selectedRound??'all')+'.xlsx"'}});
        }
        if(req.method==='GET'&&path==='/host') {
          const [questions,states,votes]=await Promise.all([
            db('expo1405_questions?room_id=eq.'+room+'&archived=eq.false&order=position.asc,created_at.asc&select=id,position,text,options'),
            db((role==='admin'?'expo1405_display':'expo1405_public')+'?id=eq.'+room+'&select=payload,revision'),
            db('expo1405_votes?room_id=eq.'+room+'&round=eq.'+rooms[0].round+'&select=question_id&limit=10000')]);
          const keys=rooms[0].is_quiz?await db('expo1405_quiz_keys?room_id=eq.'+room+'&round=eq.'+rooms[0].round+'&select=question_id,correct_choice'):[];
          const counts={};for(const v of votes)counts[v.question_id]=(counts[v.question_id]||0)+1;
          return json({role,questions:questions.map(q=>({...q,...(rooms[0].is_quiz?{correctChoice:keys.find(k=>k.question_id===q.id)?.correct_choice??null}:{}),hasVotes:!!counts[q.id],...(role==='admin'?{votes:counts[q.id]||0}:{})})),...(role==='admin'?states[0]:withoutResults(states[0]))});
        }
        if(req.method==='POST'&&path==='/host/action') {
          if(Number(req.headers.get('content-length')||0)>16000)return json({error:'درخواست بزرگ است.'},413);
          const raw=await req.text();if(raw.length>16000)return json({error:'درخواست بزرگ است.'},413);
          const action=JSON.parse(raw);
          const payload=await rpc('host_action',{p_room:room,p_action:action});
          return json({ok:true,payload:role==='admin'?payload:withoutResults({payload}).payload});
        }
      }
      if(req.method==='POST'&&path==='/join') {
        const raw=await req.text();if(raw.length>2000)return json({error:'درخواست بزرگ است.'},413);
        const body=JSON.parse(raw),name=typeof body.name==='string'?body.name.trim().slice(0,80):null;
        const ip=req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown';
        const allowed=await rpc('rate_limit',{p_key:await digest('join:'+room+':'+key+':'+ip),p_limit:500,p_seconds:900});
        if(!allowed)return json({error:'تعداد درخواست‌ها زیاد است؛ کمی بعد تلاش کنید.'},429);
        const token=crypto.randomUUID()+crypto.randomUUID();
        const id=await rpc('join_with_credits',{p_room:room,p_hash:await digest(token),p_name:name,p_shared:body.shareOnScreen===true});
        return json({token,id,name});
      }
      if(path==='/me'||path==='/vote'||path==='/profile'||path==='/score') {
        const token=req.headers.get('x-participant-token')||'';
        if(token.length<32||token.length>160)return json({error:messages.invalid_participant},401);
        const hash=await digest(token);
        if(req.method==='GET'&&path==='/score')return json(await rpc('quiz_score',{p_room:room,p_hash:hash}));
        if(req.method==='GET'&&path==='/me') {
          const [people,rooms]=await Promise.all([
            db('expo1405_participants?room_id=eq.'+room+'&token_hash=eq.'+hash+'&select=id,display_name,share_on_screen'),
            db('expo1405_rooms?id=eq.'+room+'&select=round,deleted_at')]);
          if(!people.length||!rooms.length)return json({error:messages.invalid_participant},401);
          if(rooms[0].deleted_at)return json({error:messages.class_deleted},410);
          const votes=await db('expo1405_votes?room_id=eq.'+room+'&round=eq.'+rooms[0].round+'&participant_id=eq.'+people[0].id+'&select=question_id,choice');
          return json({id:people[0].id,name:people[0].display_name,shareOnScreen:people[0].share_on_screen,round:rooms[0].round,votes});
        }
        if(req.method==='POST'&&path==='/profile') {
          const raw=await req.text();if(raw.length>2000)return json({error:'درخواست بزرگ است.'},413);
          const body=JSON.parse(raw),name=typeof body.name==='string'?body.name.trim():null;
          const result=await rpc('profile',{p_room:room,p_hash:hash,p_name:name,p_shared:body.shareOnScreen===true});
          return json({ok:true,...result});
        }
        if(req.method==='POST'&&path==='/vote') {
          const raw=await req.text();if(raw.length>2000)return json({error:'درخواست بزرگ است.'},413);
          const b=JSON.parse(raw);
          if(!Number.isInteger(b.choice)||!Number.isInteger(b.round)||!/^[0-9a-f-]{36}$/i.test(b.questionId||''))return json({error:messages.invalid_choice},400);
          const result=await rpc('vote',{p_room:room,p_hash:hash,p_question:b.questionId,p_round:b.round,p_choice:b.choice});
          return json({ok:true,...result});
        }
      }
      return json({error:'مسیر پیدا نشد.'},404);
    } catch(e) {
      if(e instanceof SyntaxError)return json({error:'درخواست معتبر نیست.'},400);
      const known=Object.entries(messages).find(([code])=>String(e?.message).includes(code));
      return json({error:known?known[1]:'ارتباط با سامانه برقرار نشد؛ دوباره تلاش کنید.'},known?(known[0]==='invalid_participant'?401:known[0]==='class_deleted'?410:409):503);
    }
  };
}
