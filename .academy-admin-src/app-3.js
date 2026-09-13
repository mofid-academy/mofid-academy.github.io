}
function styles(root){
 const choose=el("select"),scope=el("select");choose.setAttribute("aria-label","بخش فرم");scope.setAttribute("aria-label","محدوده نمایش");
 for(const [v,n]of targets){const o=el("option",n);o.value=v;choose.append(o);}
 for(const [v,n]of [["all","همه اندازه‌ها"],["mobile","فقط موبایل / تبلت تا 880px"]]){const o=el("option",n);o.value=v;scope.append(o);}
 const row=el("div",undefined,"stack");row.append(choose,scope);root.append(row);const grid=el("div");root.append(grid);
 const dl=el("datalist");dl.id="fonts";['"Noto Sans Arabic",Vazirmatn,Tahoma,sans-serif','Vazirmatn,Tahoma,sans-serif','Tahoma,sans-serif','"Segoe UI",Tahoma,sans-serif','Arial,sans-serif'].forEach(v=>{const o=el("option");o.value=v;dl.append(o);});root.append(dl);
 function draw(){
  grid.replaceChildren();const values=model.overrides[scope.value]?.[choose.value]||{},def=defaults(choose.value,scope.value);
  for(const [prop,label]of props){
   const b=box(label,def[prop]?"اصلی: "+def[prop]:"خالی = حفظ تنظیم فعلی"),input=el("input");input.type="text";input.dir="ltr";input.value=values[prop]||"";input.placeholder=prop==="font-size"?"18px":prop==="border-radius"?"20px":def[prop]||"";
   if(prop==="font-family")input.setAttribute("list","fonts");
   input.onfocus=snapshot;input.oninput=()=>{model.overrides[scope.value]??={};model.overrides[scope.value][choose.value]??={};model.overrides[scope.value][choose.value][prop]=input.value.trim();changed();};b.insertBefore(input,b.querySelector("small"));grid.append(b);
  }
 }choose.onchange=scope.onchange=draw;draw();
}
function images(root){
 for(const f of model.fields.filter(f=>f.kind==="image")){
  const b=box(f.label,"PNG / JPG / WebP / GIF؛ حداکثر ۱ مگابایت. متن داخل خود تصویر با جایگزینی تصویر تغییر می‌کند.",f.id);
  const img=el("img");img.className="image-preview";img.src=model.values[f.id];img.alt=f.label;
  const input=el("input");input.type="file";input.accept="image/png,image/jpeg,image/webp,image/gif";
  input.onchange=()=>{const file=input.files[0];if(!file)return;if(!/^image\/(png|jpeg|webp|gif)$/.test(file.type)||file.size>1024*1024){status("تصویر مجاز و کوچک‌تر از ۱ مگابایت انتخاب کن.","error");return;}
   const reader=new FileReader();reader.onload=()=>{snapshot();model.values[f.id]=reader.result;img.src=reader.result;changed();};reader.onerror=()=>status("خواندن تصویر ممکن نشد.","error");reader.readAsDataURL(file);
  };b.append(img,input);root.append(b);
 }
 root.append(el("h2","لوگوی کم‌رنگ پنل کناری","group-title"));
 const b=box("نمایش واترمارک","خاموش = حفظ ظاهر فعلی؛ روشن = استفاده از لوگوی کامل بالای فرم.");
 const check=el("input");check.type="checkbox";check.checked=model.watermark.enabled;check.onchange=()=>{snapshot();model.watermark.enabled=check.checked;changed();};b.append(check);root.append(b);
 for(const [key,label,min,max,step]of [["size","اندازه (پیکسل)",80,650,1],["opacity","شفافیت",0,.35,.01],["left","فاصله از چپ (پیکسل)",-180,350,1],["bottom","فاصله از پایین (پیکسل)",-150,350,1],["rotate","زاویه (درجه)",-45,45,1]]){
  const b=box(label),r=el("input"),out=el("small",String(model.watermark[key]));r.type="range";r.min=min;r.max=max;r.step=step;r.value=model.watermark[key];r.setAttribute("aria-label",label);r.onpointerdown=snapshot;r.oninput=()=>{model.watermark[key]=+r.value;out.textContent=r.value;changed();};b.append(r,out);root.append(b);
 }
}
function advanced(root){
 const b=box("CSS تکمیلی","برای ویژگی‌های دلخواه؛ فونت تازه به منبع فونت در HTML نیاز دارد."),css=el("textarea");css.className="code";css.style.minHeight="160px";css.value=model.customCSS;css.onfocus=snapshot;css.oninput=()=>{model.customCSS=css.value;changed();};b.append(css);root.append(b);
 const det=el("details");det.append(el("summary","ویرایش تمام HTML"),el("p","تغییر شناسه‌ها و منطق اسکریپت ممکن است آزمون را مختل کند. رمز، توکن یا داده محرمانه را داخل فایل فرم قرار نده.","tip"));
 const raw=el("textarea");raw.className="code";raw.spellcheck=false;raw.value=current();
 const apply=el("button","اعمال کد در پیش‌نمایش");apply.onclick=()=>{try{setSource(raw.value);changed();status("کد فقط در پیش‌نمایش اعمال شد.");}catch(e){fail(e);}};det.append(raw,apply);root.append(det);
}
function history(root){
 const stack=el("div",undefined,"stack");
 const exp=el("button","دانلود HTML در حال ویرایش");exp.onclick=()=>{try{AcademyQuestions.checkPublication(model.questionBank);download(current(),"index.html");}catch(e){fail(e);}};
 const backup=el("button","دانلود پشتیبان نسخه سایت");backup.onclick=()=>download(publishedSource,"academy-exam-backup.html");
 const restore=el("button","بازیابی پیش‌نویس مرورگر");restore.onclick=()=>{try{
  const d=JSON.parse(localStorage.getItem(DRAFT)||"null");if(!d)throw Error("پیش‌نویسی در این مرورگر نیست.");
  if(d.baseSHA!==loadedSHA&&!confirm("پیش‌نویس بر اساس نسخه قدیمی‌تر است. فقط برای بررسی باز شود؟"))return;
  setSource(d.source);status("پیش‌نویس بازیابی شد؛ قبل از انتشار با نسخه سایت مقایسه کن.");
 }catch(e){fail(e);}};
 const imp=box("باز کردن HTML خودت","ابتدا فقط در پیش‌نمایش باز می‌شود."),file=el("input");file.type="file";file.accept=".html,.htm,text/html";
 file.onchange=async()=>{try{const f=file.files[0];if(!f)return;if(f.size>5*1024*1024)throw Error("فایل باید کوچک‌تر از ۵ مگابایت باشد.");setSource(await f.text());changed();}catch(e){fail(e);}};imp.append(file);stack.append(exp,backup,restore,imp);root.append(stack);
 const hist=el("button","نمایش ۱۰ نسخه اخیر GitHub"),list=el("div");root.append(hist,list);
 hist.onclick=async()=>{
  hist.disabled=true;list.replaceChildren();try{
   const data=await(await api("/repos/"+REPO+"/commits?path="+encodeURIComponent(PATH)+"&sha=main&per_page=10")).json();
   for(const c of data){
    const n=el("div",undefined,"history-item");n.append(el("time",new Date(c.commit.author.date).toLocaleString("fa-IR")),el("p",c.commit.message));
    const b=el("button","باز کردن در ویرایشگر");b.onclick=async()=>{if(!confirm("این نسخه در ویرایشگر باز شود؟"))return;try{const d=await readFile(c.sha);setSource(d.source);changed();status("نسخه انتخابی آماده بررسی است. بازگردانی سایت به انتشار نیاز دارد.");}catch(e){fail(e);}};n.append(b);list.append(n);
   }
  }catch(e){fail(e);}finally{hist.disabled=false;}
 };
}
function preview(){
 try{const source=model.build(true);model.validate(source);const managed=model.questionBank.mode==="managed";
  $("preview").srcdoc=AcademyPreview(source,$("scene").value,{exam:managed?AcademyQuestions.exam(model.questionBank):null,selectedIndex:selectedIndex()});
  $("previewMode").textContent=managed?"سؤال‌های شما · بدون ارسال واقعی":"داده آزمایشی";
$("fileSize").textContent=(new TextEncoder().encode(current()).length/1024).toFixed(1)+" KB";resize();}
 catch(e){fail(e);}
}
function resize(){
 const wrap=$("frameWrap"),d=$("device").value,w=d==="mobile"?390:d==="tablet"?820:1100,available=$("preview").closest(".preview-canvas").clientWidth-16;
 wrap.style.width=w+"px";wrap.style.height=(d==="mobile"?830:840)+"px";wrap.style.zoom=Math.min(1,Math.max(.25,available/w));
}
window.addEventListener("message",e=>{
 if(e.source!==$("preview").contentWindow||e.data?.kind!=="academy-pick"||typeof e.data.id!=="string"||!model?.fields.some(f=>f.id===e.data.id))return;
 tab("text");const n=[...$("fields").querySelectorAll("[data-field]")].find(n=>n.dataset.field===e.data.id);
 if(n){n.scrollIntoView({block:"center",behavior:"smooth"});n.classList.add("flash");n.querySelector("textarea")?.focus();setTimeout(()=>n.classList.remove("flash"),1300);}
});
$("scene").onchange=preview;$("device").onchange=resize;window.addEventListener("resize",resize);
document.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>tab(b.dataset.tab));$("search").oninput=render;
$("reload").onclick=()=>loadLatest(false);$("undo").onclick=()=>{const s=undoStack.pop();if(s){try{setSource(s,false);changed();}catch(e){fail(e);}}};
$("loginBtn").onclick=()=>$("auth").showModal();$("authClose").onclick=()=>$("auth").close();$("auth").addEventListener("close",()=>{$("token").value="";});
$("tokenLink").href="https://github.com/settings/personal-access-tokens/new?name=Academy-Exam-Admin&target_name=mofid-academy&expires_in=30&contents=write";
$("logout").onclick=()=>{token="";login="";$("token").value="";$("authMessage").textContent="کلید از حافظه پاک شد.";state();};
$("connect").onclick=async()=>{
 const t=$("token").value.trim();if(!t.startsWith("github_pat_")){$("authMessage").textContent="یک Fine-grained token با پیشوند github_pat_ وارد کن.";return;}
 $("connect").disabled=true;$("authMessage").textContent="در حال بررسی هویت و مخزن…";token=t;$("token").value="";
 try{
  const user=await(await api("/user")).json(),repo=await(await api("/repos/"+REPO)).json();
  if(repo.full_name?.toLowerCase()!==REPO.toLowerCase()||repo.permissions?.push===false)throw Error("این حساب مجوز نوشتن در مخزن آزمون را ندارد.");
  login=user.login;$("auth").close();status("هویت "+login+" تأیید شد. مجوز نوشتن کلید هنگام انتشار توسط GitHub بررسی می‌شود.");state();
 }catch(e){token="";login="";$("authMessage").textContent=e.message;state();}
 finally{$("connect").disabled=false;}
};
$("publish").onclick=()=>{try{model.validate(current());AcademyQuestions.checkPublication(model.questionBank);$("confirmPublish").showModal();}catch(e){fail(e);}};$("confirmNo").onclick=()=>$("confirmPublish").close();
$("confirmYes").onclick=async()=>{
 if(publishing||!token||!model||!loadedSHA)return;
 let source;try{source=current();model.validate(source);AcademyQuestions.checkPublication(model.questionBank);}catch(e){fail(e);return;}
 const oldSHA=loadedSHA;$("confirmPublish").close();publishing=true;state();status("در حال بررسی تعارض و ارسال نسخه جدید…");
 try{
  const latest=await readFile();if(latest.sha!==oldSHA)throw Error("نسخه سایت در حین ویرایش تغییر کرده است. هیچ فایلی جایگزین نشد. پیش‌نویس را دانلود و نسخه سایت را دریافت کن.");
  const result=await(await api(ENDPOINT,{method:"PUT",body:JSON.stringify({message:"Academy Studio: "+($("commitNote").value.trim().slice(0,160)||"update form design, copy and question bank"),content:encode64(source),sha:oldSHA,branch:BRANCH})})).json();
  loadedSHA=result.content.sha;publishedSource=source;undoStack=[];setSource(source,false);try{localStorage.removeItem(DRAFT);}catch{}
  status("فایل در GitHub ذخیره شد؛ انتشار Pages هنوز تأیید نشده است. در حال بررسی…","success");checkLive(source);
 }catch(e){fail(e);}finally{publishing=false;state();}
};
async function checkLive(expected){
 const thisCheck=++checking;
 for(let i=0;i<20;i++){
  await new Promise(r=>setTimeout(r,6000));if(thisCheck!==checking)return;
  try{const r=await fetch(LIVE+"?studio_check="+Date.now(),{cache:"no-store",credentials:"omit",referrerPolicy:"no-referrer",signal:AbortSignal.timeout(10000)});
   if(r.ok&&await r.text()===expected){status("نسخه جدید روی لینک اصلی منتشر شد؛ تطبیق محتوای فایل تأیید شد.","success");return;}
  }catch{}
 }
 status("ذخیره در GitHub انجام شد، اما انتشار Pages تأیید نشد. وضعیت Actions مخزن را بررسی کن.");
}
window.addEventListener("beforeunload",e=>{if(dirty()||publishing){e.preventDefault();e.returnValue="";}});
window.addEventListener("pagehide",()=>{token="";login="";});window.addEventListener("pageshow",e=>{if(e.persisted){state();status("برای انتشار دوباره به ادمین متصل شو.");}});
loadLatest(true);
})();
