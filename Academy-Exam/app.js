const CONFIG = window.EXAM_CONFIG || {questionsUrl:"", submitUrl:""};
function loadConfig(){
  const p = new URLSearchParams(location.search);
  if (p.get("q")) CONFIG.questionsUrl = p.get("q");
  if (p.get("s")) CONFIG.submitUrl = p.get("s");
  return Promise.resolve();
}
const MARK_SRC = "academy-mark.png";
const $ = s => document.querySelector(s);
const view = $("#view"), bar = $("#bar"), leaf = $("#leaf"), meta = $("#meta");
let exam = null, answers = {}, name = "", step = -1, sending = false;
async function boot(){
  paint(`<div class="center"><div class="spin"></div><p class="lead">در حال آماده‌سازی آزمون…</p></div>`, "");
  try{
    await loadConfig();
    if (window.EXAM_DATA) exam = window.EXAM_DATA;
    else if (CONFIG.questionsUrl){
      const r = await fetch(CONFIG.questionsUrl, {headers:{"Accept":"application/json"}});
      if(!r.ok) throw new Error("HTTP " + r.status);
      exam = await r.json();
    } else throw new Error("no-source");
    if (Array.isArray(exam)) exam = exam[0];
    exam.questions = (exam.questions||[]).map((q,i)=>({
      qid: i+1,
      type: (q.type==="mcq"||q.options&&q.options.length) ? "mcq" : "desc",
      question: q.question || "",
      options: q.options || [],
      max_score: q.max_score || ((q.type==="mcq")?1:5)
    }));
    if(!exam.questions.length) throw new Error("empty");
    meta.innerHTML = `<b>${esc(exam.examTitle||"آزمون")}</b>${exam.questions.length} سؤال`;
    drawLeaf(); intro();
  }catch(e){
    paint(`<div class="center"><div class="err">سؤالات آزمون بارگذاری نشد. لطفاً چند لحظه بعد دوباره امتحان کنید یا به برگزارکننده اطلاع دهید.</div><p class="lead">کد خطا: ${esc(e.message)}</p></div>`,`<div class="bar"><span class="hint"></span><div class="btns"><button class="nav primary" onclick="location.reload()">تلاش دوباره</button></div></div>`);
  }
}
function intro(){
  step = -1; drawLeaf();
  const mcq = exam.questions.filter(q=>q.type==="mcq").length;
  const desc = exam.questions.length - mcq;
  paint(`<div class="center fade"><img class="big-mark" src="${MARK_SRC}" alt=""><p class="kicker">MOFID Academy</p><h1>${esc(exam.examTitle||"آزمون")}</h1><div class="chips">${mcq?`<span class="chip t">${mcq} سؤال چهارگزینه‌ای</span>`:""}${desc?`<span class="chip v">${desc} سؤال تشریحی</span>`:""}<span class="chip">هر سؤال در یک صفحه</span></div><p class="lead">نام خود را وارد کنید و آزمون را شروع کنید. می‌توانید بین سؤال‌ها جلو و عقب بروید و پیش از ارسال، پاسخ‌ها را یک‌بار مرور کنید.</p><label for="nm" class="kicker">نام و نام خانوادگی</label><input type="text" id="nm" value="${esc(name)}" placeholder="مثلاً زهرا محمدی" autocomplete="name"></div>`,`<div class="bar"><span class="hint">برای ادامه <kbd>Enter</kbd> بزنید</span><div class="btns"><button class="nav primary" id="go">شروع آزمون</button></div></div>`);
  const nm = $("#nm"); nm.focus();
  const start = ()=>{ name = nm.value.trim(); if(!name){ nm.focus(); nm.style.borderColor = "var(--coral)"; return; } go(0); };
  $("#go").onclick = start; nm.onkeydown = e => { if(e.key==="Enter") start(); };
}
function go(i){
  step = i; drawLeaf();
  const q = exam.questions[i], last = i === exam.questions.length-1;
  const body = q.type==="mcq" ? `<div class="opts" role="group">${q.options.map((o,k)=>`<button class="opt" data-v="${esc(o)}" aria-pressed="${answers[q.qid]===o}"><span class="key">${k+1}</span><span>${esc(o)}</span></button>`).join("")}</div>` : `<textarea id="ta" placeholder="پاسخ خود را اینجا بنویسید…">${esc(answers[q.qid]||"")}</textarea><div class="count" id="cnt"></div>`;
  paint(`<div class="fade"><p class="kicker">سؤال ${i+1} از ${exam.questions.length} · ${q.type==="mcq"?"چهارگزینه‌ای":"تشریحی"} · ${q.max_score} نمره</p><p class="qtext">${esc(q.question)}</p>${body}</div>`,`<div class="bar"><span class="hint">${q.type==="mcq"?"با کلیدهای <kbd>1</kbd> تا <kbd>4</kbd> هم می‌توانید انتخاب کنید":"برای رفتن به سؤال بعد <kbd>Ctrl</kbd>+<kbd>Enter</kbd>"}</span><div class="btns"><button class="nav" id="prev">${i===0?"بازگشت":"سؤال قبل"}</button><button class="nav ${last?"finish":"primary"}" id="next">${last?"مرور پاسخ‌ها":"سؤال بعد"}</button></div></div>`);
  if(q.type==="mcq"){
    view.querySelectorAll(".opt").forEach(b=>b.onclick = ()=>{ answers[q.qid] = b.dataset.v; view.querySelectorAll(".opt").forEach(x=>x.setAttribute("aria-pressed", x===b)); setTimeout(()=> last ? review() : go(i+1), 180); });
  } else {
    const ta = $("#ta"), cnt = $("#cnt");
    const upd = ()=>{ answers[q.qid] = ta.value; cnt.textContent = ta.value.trim() ? ta.value.trim().split(/\s+/).length + " کلمه" : ""; };
    ta.oninput = upd; upd(); ta.focus();
    ta.onkeydown = e => { if(e.key==="Enter" && (e.ctrlKey||e.metaKey)) last ? review() : go(i+1); };
  }
  $("#prev").onclick = ()=> i===0 ? intro() : go(i-1); $("#next").onclick = ()=> last ? review() : go(i+1);
}
function review(){
  step = exam.questions.length; drawLeaf();
  const blank = exam.questions.filter(q=>!String(answers[q.qid]||"").trim());
  paint(`<div class="fade"><p class="kicker">مرور نهایی</p><h1>${esc(name)}، پاسخ‌ها آمادهٔ ارسال است</h1>${blank.length ? `<div class="err">${blank.length} سؤال بی‌پاسخ مانده: ${blank.map(q=>"سؤال "+q.qid).join("، ")}. می‌توانید برگردید و کامل کنید یا همین‌طور ارسال کنید.</div>` : ""}<div class="opts">${exam.questions.map(q=>`<button class="opt" data-i="${q.qid-1}"><span class="key" style="${String(answers[q.qid]||"").trim()?"background:var(--teal-300);border-color:var(--teal-300);color:#04302f":"background:rgba(224,86,76,.25);border-color:rgba(224,86,76,.6)"}">${q.qid}</span><span>${esc(trim(String(answers[q.qid]||"بی‌پاسخ"),70))}</span></button>`).join("")}</div></div>`,`<div class="bar"><span class="hint">برای ویرایش، روی هر سؤال بزنید</span><div class="btns"><button class="nav" id="back">سؤال آخر</button><button class="nav finish" id="send">ارسال و پایان آزمون</button></div></div>`);
  view.querySelectorAll(".opt").forEach(b=> b.onclick = ()=> go(+b.dataset.i)); $("#back").onclick = ()=> go(exam.questions.length-1); $("#send").onclick = send;
}
async function send(){
  if(sending) return; sending = true;
  paint(`<div class="center"><div class="spin"></div><p class="lead">در حال ارسال پاسخ‌ها…</p></div>`, "");
  const payload = { event_type:"submission", form_id: exam.formId || "mofid-exam", form_name: exam.examTitle || "آزمون", submission_id: "sub_" + Date.now().toString(36) + Math.random().toString(36).slice(2,7), completed_at: new Date().toISOString(), fields: [ {id:"exam_id", question:"exam_id", type:"hidden", answer: exam.examId || "", position:0}, {id:"name", question:"نام و نام خانوادگی", type:"input", answer:name, position:1}, ...exam.questions.map((q,i)=>({ id:"q"+q.qid, question:`Q${q.qid}) ${q.question}`, type: q.type==="mcq" ? "radio" : "textarea", answer: answers[q.qid] || "", position:i+2 })) ] };
  try{
    const r = await fetch(CONFIG.submitUrl, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(payload) });
    if(!r.ok) throw new Error("HTTP " + r.status); done();
  }catch(e){
    sending = false;
    paint(`<div class="center fade"><div class="err">پاسخ‌ها ارسال نشد. اتصال اینترنت را بررسی کنید و دوباره بزنید؛ پاسخ‌های شما در همین صفحه محفوظ است.</div><p class="lead">کد خطا: ${esc(e.message)}</p></div>`,`<div class="bar"><span class="hint"></span><div class="btns"><button class="nav" id="b2">بازگشت به مرور</button><button class="nav finish" id="r2">ارسال دوباره</button></div></div>`);
    $("#r2").onclick = send; $("#b2").onclick = review;
  }
}
function done(){
  leaf.querySelectorAll(".chev").forEach(c=>c.classList.add("done"));
  paint(`<div class="center fade"><img class="big-mark" src="${MARK_SRC}" alt=""><h1>پاسخ‌های شما ثبت شد</h1><p class="lead">${esc(name)} عزیز، آزمون شما با موفقیت ارسال شد. تصحیح به‌صورت خودکار انجام می‌شود و نتیجه از طریق برگزارکننده به شما اعلام می‌گردد.</p><div class="chips"><span class="chip t">${exam.questions.length} پاسخ ارسال شد</span><span class="chip">${esc(exam.examTitle||"آزمون")}</span></div><p class="lead">حالا می‌توانید این صفحه را ببندید.</p></div>`, "");
}
function paint(main, footer){ view.innerHTML = main; bar.innerHTML = footer; window.scrollTo(0,0); }
function esc(s){ return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
function trim(s,n){ s = s.replace(/\s+/g," ").trim(); return s.length>n ? s.slice(0,n)+"…" : s; }
function drawLeaf(){
  if(!exam) return; const n = exam.questions.length;
  const chev = i => `<svg class="chev ${i===n-1?"tip":""} ${step>i?"done":""} ${step===i?"now":""}" viewBox="0 0 26 13" aria-hidden="true"><path d="M13 0 26 9.5v3.5L13 3.5 0 13V9.5z"/></svg>`;
  leaf.innerHTML = `<div class="stem"></div>` + Array.from({length:n}, (_,i)=>chev(i)).join("") + `<div class="pct">${step<0?0:Math.round(Math.min(step,n)/n*100)}٪</div>`;
}
document.addEventListener("keydown", e=>{ if(step<0 || !exam || step>=exam.questions.length) return; const q = exam.questions[step]; if(q.type==="mcq" && /^[1-9]$/.test(e.key)){ const b = view.querySelectorAll(".opt")[+e.key-1]; if(b) b.click(); } if(e.key==="Enter" && q.type==="mcq"){ const nx = document.getElementById("next"); if(nx) nx.click(); } });
boot();
