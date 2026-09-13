/* Academy Studio model: parse HTML and JavaScript without executing them. */
(function(){
"use strict";
const AR=/[\u0600-\u06ff]/,COLORS=/#[a-fA-F0-9]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)/g;
const labels={intro:"شروع آزمون",go:"صفحه سؤال",review:"مرور نهایی",done:"پایان آزمون",boot:"بارگذاری و خطا",send:"ارسال و خطا",chrome:"مراحل و پیشرفت"};
const parse=s=>new DOMParser().parseFromString(s,"text/html");
function texts(root){const a=[],w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);while(w.nextNode()){const n=w.currentNode;if(!n.parentElement?.closest("script,style,noscript")&&n.textContent.trim())a.push(n);}return a;}
function attrs(root){return [...root.querySelectorAll("*")].flatMap(el=>["placeholder","title","alt","aria-label"].filter(a=>el.hasAttribute(a)).map(a=>({el,a})));}
function escT(s){return s.replace(/\\/g,"\\\\").replace(/`/g,"\\`").replace(/\$\{/g,"\\${").replace(/<\/script/gi,"<\\/script");}
function quote(s){return JSON.stringify(s).replace(/</g,"\\u003c").replace(/\u2028/g,"\\u2028").replace(/\u2029/g,"\\u2029");}
function walk(n,visit,c={fn:"",skip:false},p=null){
 if(!n||typeof n!=="object"||typeof n.type!=="string")return;
 c={...c};if(n.type==="FunctionDeclaration")c.fn=n.id?.name||"";
 if(n.type==="VariableDeclarator"&&n.id?.name==="payload")c.skip=true;
 visit(n,c,p);for(const [k,v]of Object.entries(n)){if(["start","end"].includes(k))continue;if(Array.isArray(v))v.forEach(x=>walk(x,visit,c,n));else if(v&&typeof v==="object")walk(v,visit,c,n);}
}
function slot(code){
 if(code.includes("esc(name)"))return "نام شرکت‌کننده";if(code.includes("examTitle"))return "عنوان آزمون";
 if(code.includes("blank"))return "سؤال‌های بی‌پاسخ";if(code.includes("questions.length"))return "تعداد سؤال";
 if(code.includes("message"))return "شرح خطا";if(code.includes("step")||code.includes("i+1"))return "شماره سؤال";
 return "مقدار خودکار";
}
class Model{
 constructor(source){
  this.source=source;this.doc=parse(source);this.questionBank=AcademyQuestions.read(this.doc);AcademyQuestions.remove(this.doc);if(!this.doc.getElementById("view"))throw Error("این فایل، فرم آزمون دارای شناسه view نیست.");
  if(!window.acorn)throw Error("کتابخانه تحلیل کد بارگذاری نشده است.");
  this.fields=[];this.values={};this.scripts=[];this.styles=[];this.overrides={};this.customCSS="";
  this.presentation={sideTitle:"",pillTxt:"",fM:""};
  this.watermark={enabled:false,size:280,opacity:.08,left:0,bottom:0,rotate:-8};
  const old=this.doc.getElementById("academy-studio-state");
  if(old){try{const s=JSON.parse(old.textContent);this.overrides=s.overrides||{};this.customCSS=s.customCSS||"";this.presentation={...this.presentation,...s.presentation};this.watermark={...this.watermark,...s.watermark};}catch{}}
  this.doc.querySelectorAll("#academy-studio-state,#academy-studio-overrides,#academy-studio-watermark,#academy-studio-display").forEach(n=>n.remove());
  [["sideTitle","عنوان نمایشی پنل کناری"],["pillTxt","برچسب بالای فرم"],["fM","زمان تقریبی نمایشی"]].forEach(([key,label])=>this.add({id:"display_"+key,kind:"display",key,group:"متن‌های خودکار",label,value:this.presentation[key],help:"خالی = مقدار خودکار فعلی. این عنوان فقط نمایشی است؛ نام آزمون ارسالی به n8n عوض نمی‌شود."}));
  texts(this.doc).forEach((n,i)=>this.add({id:"s"+i,kind:"static",index:i,group:"متن‌های ثابت",label:n.parentElement.tagName==="TITLE"?"عنوان زبانه مرورگر":n.parentElement.closest(".brand-txt")?"نام و هویت آکادمی":"متن فرم",value:n.textContent.trim()}));
  attrs(this.doc).forEach(({el,a},i)=>this.add({id:"a"+i,kind:"attr",index:i,group:"متن‌های ثابت",label:a,value:el.getAttribute(a)}));
  [...this.doc.querySelectorAll("img")].forEach((n,i)=>this.add({id:"i"+i,kind:"image",index:i,group:"تصاویر",label:i===0?"لوگوی بالای فرم":"تصویر "+(i+1),value:n.getAttribute("src")||""}));
  [...this.doc.querySelectorAll("style")].forEach(n=>this.styles.push(n.textContent));
  const seen=new Set();
  this.styles.forEach(css=>(css.match(COLORS)||[]).forEach(c=>{if(!seen.has(c)){seen.add(c);this.add({id:"c"+seen.size,kind:"color",group:"رنگ‌ها",label:c,value:c});}}));
  [...this.doc.scripts].forEach((tag,si)=>{
   if(tag.src||tag.type==="application/json"||!tag.textContent.trim())return;
   const code=tag.textContent;let ast;
   try{ast=acorn.parse(code,{ecmaVersion:"latest",sourceType:tag.type==="module"?"module":"script"});}catch(e){throw Error("کد فرم قابل تحلیل نیست: "+e.message);}
   const sm={si,code,nodes:[]};this.scripts.push(sm);
   walk(ast,(n,c,parent)=>{
    if(c.skip||["esc","toFa"].includes(c.fn))return;
    const group=labels[c.fn]||"متن‌های پویا";
    if(n.type==="TemplateLiteral"){
     const html=n.quasis.map((q,k)=>(q.value.cooked??q.value.raw)+(k<n.expressions.length?`__ACADEMY_SLOT_${k}__`:"")).join("");
     if(!AR.test(html)&&!/<[a-z][^>]*>/i.test(html))return;
     const p={start:n.start,end:n.end,type:"template",html,expressions:n.expressions,fields:[]};
     this.fragmentFields(p,"t"+si+"_"+n.start,group,code);if(p.fields.length)sm.nodes.push(p);
    }else if(n.type==="Literal"&&typeof n.value==="string"){
     const value=n.value,prop=parent?.type==="Property"?(parent.key?.name||parent.key?.value):"";
     if(["questionsUrl","submitUrl"].includes(prop)){const f=this.add({id:"u"+si+"_"+n.start,kind:"url",group:"اتصال n8n",label:prop==="questionsUrl"?"دریافت سؤال‌ها (GET)":"ارسال پاسخ‌ها (POST)",value});sm.nodes.push({start:n.start,end:n.end,type:"literal",field:f});return;}
     if(/^data:image\/(?:png|jpeg|webp|gif);base64,/.test(value)){const f=this.add({id:"j"+si+"_"+n.start,kind:"image",group:"تصاویر",label:"لوگوی پویا / صفحه پایان",value});sm.nodes.push({start:n.start,end:n.end,type:"literal",field:f});return;}
     if(!AR.test(value))return;
     if(/<[^>]+>/.test(value)){const p={start:n.start,end:n.end,type:"htmlLiteral",html:value,expressions:[],fields:[]};this.fragmentFields(p,"l"+si+"_"+n.start,group,code);if(p.fields.length)sm.nodes.push(p);}
     else {const f=this.add({id:"l"+si+"_"+n.start,kind:"text",group,label:"متن "+group,value});sm.nodes.push({start:n.start,end:n.end,type:"literal",field:f});}
    }
   });
  });
  this.initialControls=this.controlState();
 }
 controlState(){return JSON.stringify({overrides:this.overrides,customCSS:this.customCSS,watermark:this.watermark,questionBank:this.questionBank});}
 add(f){this.fields.push(f);this.values[f.id]=f.value;return f;}
 fragment(html){const t=document.createElement("template");t.innerHTML=html;return t;}
 fragmentFields(p,prefix,group,code){
  const t=this.fragment(p.html);
  texts(t.content).forEach((n,i)=>{
   const value=n.textContent.trim(),remaining=value.replace(/__ACADEMY_SLOT_\d+__/g,"").trim();
   if(!remaining||!/[A-Za-z\u0600-\u06ff]/.test(remaining))return;
   const f=this.add({id:prefix+"_"+i,kind:"text",group,label:n.parentElement?.tagName==="H1"?"عنوان صفحه":"متن "+group,value:value.replace(/__ACADEMY_SLOT_(\d+)__/g,(_,k)=>"{"+(+k+1)+"}"),help:p.expressions.map((e,k)=>"{"+(k+1)+"}: "+slot(code.slice(e.start,e.end))).join(" · ")});
   p.fields.push({field:f,type:"text",index:i,original:value});
  });
  attrs(t.content).forEach(({el,a},i)=>{const value=el.getAttribute(a);if(/__ACADEMY_SLOT_/.test(value)||!value&&a!=="placeholder")return;const f=this.add({id:prefix+"_a"+i,kind:"text",group,label:a==="placeholder"?"راهنمای داخل فیلد":a,value});p.fields.push({field:f,type:"attr",index:i,original:value});});
 }
 changed(f){return this.values[f.id]!==f.value;}
 compile(sm,annotate){
  const ops=sm.nodes.filter(p=>p.field?this.changed(p.field):p.fields.some(x=>this.changed(x.field))||annotate&&p.fields.length);
  const compileRange=(start,end)=>{
   const inside=ops.filter(p=>p.start>=start&&p.end<=end).sort((a,b)=>a.start-b.start||b.end-a.end);let out="",cursor=start;
   for(const p of inside){if(p.start<cursor)continue;out+=sm.code.slice(cursor,p.start)+render(p);cursor=p.end;}return out+sm.code.slice(cursor,end);
  };
  const render=p=>{
   if(p.type==="literal")return quote(this.values[p.field.id]);
   const t=this.fragment(p.html),nodes=texts(t.content),at=attrs(t.content);
   for(const x of p.fields){
    let v=this.values[x.field.id];
    if(x.type==="attr"){at[x.index].el.setAttribute(at[x.index].a,v);continue;}
    const old=x.original.match(/__ACADEMY_SLOT_\d+__/g)||[],included=[];
    v=v.replace(/\{(\d+)\}/g,(m,k)=>{const s=`__ACADEMY_SLOT_${+k-1}__`;if(!old.includes(s))return m;included.push(s);return s;});
    if([...new Set(old)].some(s=>!included.includes(s)))throw Error("متغیرهای {1} و {2} را در این متن نگه دار: "+x.field.label);
    const n=nodes[x.index];n.textContent=n.textContent.replace(n.textContent.trim(),()=>v);
    if(annotate&&n.parentElement)n.parentElement.setAttribute("data-studio-field",x.field.id);
   }
   if(p.type==="htmlLiteral")return quote(t.innerHTML);
   const html=escT(t.innerHTML).replace(/__ACADEMY_SLOT_(\d+)__/g,(_,k)=>"${"+compileRange(p.expressions[+k].start,p.expressions[+k].end)+"}");
   return "`"+html+"`";
  };
  return compileRange(0,sm.code.length).replace(/<\/script/gi,"<\\/script");
 }
 build(annotate=false){
  if(!annotate&&!this.fields.some(f=>this.changed(f))&&this.initialControls===this.controlState())return this.source;
  const doc=this.doc.cloneNode(true),nodes=texts(doc),at=attrs(doc),images=[...doc.querySelectorAll("img")];
  for(const f of this.fields){
   const v=this.values[f.id];
   if(f.kind==="static"){const n=nodes[f.index];n.textContent=n.textContent.replace(n.textContent.trim(),()=>v);if(annotate)n.parentElement.setAttribute("data-studio-field",f.id);}
   else if(f.kind==="attr")at[f.index].el.setAttribute(at[f.index].a,v);
   else if(f.kind==="image"&&f.index!==undefined)images[f.index].setAttribute("src",v);
   else if(f.kind==="url"&&this.changed(f)){let u;try{u=new URL(v);}catch{throw Error("آدرس وبهوک معتبر نیست.");}if(u.protocol!=="https:"||u.username||u.password)throw Error("وبهوک باید HTTPS و بدون رمز داخل آدرس باشد.");}
  }
  const colors=new Map(this.fields.filter(f=>f.kind==="color").map(f=>[f.value,this.values[f.id]]));
  [...doc.querySelectorAll("style")].forEach((n,i)=>{n.textContent=this.styles[i].replace(COLORS,c=>colors.get(c)||c);});
  const scripts=[...doc.scripts];this.scripts.forEach(sm=>scripts[sm.si].textContent=this.compile(sm,annotate));
  const css=[];
  for(const [scope,rules]of Object.entries(this.overrides)){
   const parts=[];
   for(const [selector,decls]of Object.entries(rules)){
    if(/[{}<>]/.test(selector))throw Error("انتخابگر CSS معتبر نیست.");
    const d=Object.entries(decls).filter(([,v])=>String(v).trim()).map(([k,v])=>{if(!/^[a-z-]+$/.test(k)||/[{}<>]/.test(v)||/url\s*\(|@import|expression\s*\(|javascript\s*:/i.test(v))throw Error("مقدار CSS مجاز نیست: "+k);return k+":"+v+" !important";}).join(";");
    if(d)parts.push(selector+"{"+d+"}");
   }
   if(parts.length)css.push(scope==="mobile"?"@media(max-width:880px){"+parts.join("\n")+"}":parts.join("\n"));
  }
  if(this.watermark.enabled){
   const w=this.watermark;if(![w.size,w.opacity,w.left,w.bottom,w.rotate].every(Number.isFinite))throw Error("تنظیمات واترمارک معتبر نیست.");
   const img=doc.createElement("img");img.id="academy-studio-watermark";img.alt="";img.setAttribute("aria-hidden","true");img.src=images[0]?.src||"";doc.querySelector(".side")?.prepend(img);
   css.push(`.side{isolation:isolate}.side>*:not(#academy-studio-watermark){position:relative;z-index:1}#academy-studio-watermark{display:block!important;position:absolute;pointer-events:none;user-select:none;z-index:0;object-fit:contain;width:${w.size}px;height:auto;max-width:none;opacity:${w.opacity};left:${w.left}px;bottom:${w.bottom}px;transform:rotate(${w.rotate}deg);mix-blend-mode:multiply}`);
  }
  if(/<\/style/i.test(this.customCSS))throw Error("داخل CSS تگ HTML وارد نکن.");
  css.push(this.customCSS);
  if(css.join("").trim()){const s=doc.createElement("style");s.id="academy-studio-overrides";s.textContent=css.join("\n");doc.head.append(s);}
  const presentation=Object.fromEntries(this.fields.filter(f=>f.kind==="display").map(f=>[f.key,this.values[f.id]]));
  if(Object.values(presentation).some(Boolean)){
   const hook=doc.createElement("script");hook.id="academy-studio-display";
   hook.textContent="(function(){const values="+JSON.stringify(presentation).replace(/</g,"\\u003c")+";function apply(){Object.entries(values).forEach(([id,v])=>{const e=document.getElementById(id);if(v&&e&&e.textContent!==v)e.textContent=v;});}const obs=new MutationObserver(apply);obs.observe(document.body,{childList:true,subtree:true,characterData:true});apply();})();";doc.body.append(hook);
  }
  const state=doc.createElement("script");state.id="academy-studio-state";state.type="application/json";state.textContent=JSON.stringify({version:1,presentation,overrides:this.overrides,customCSS:this.customCSS,watermark:this.watermark}).replace(/</g,"\\u003c");doc.body.append(state);
  AcademyQuestions.inject(doc,this.questionBank);
  return "<!DOCTYPE html>\n"+doc.documentElement.outerHTML+"\n";
 }
 validate(source){
  if(new TextEncoder().encode(source).length>5*1024*1024)throw Error("فایل بیشتر از ۵ مگابایت است. تصویر سبک‌تری انتخاب کن.");
  const d=parse(source);if(!d.getElementById("view"))throw Error("بخش اصلی فرم با شناسه view حذف شده است.");
  for(const s of d.scripts){if(s.src||s.type==="application/json")continue;acorn.parse(s.textContent,{ecmaVersion:"latest",sourceType:s.type==="module"?"module":"script"});}
  return true;
 }
}
window.AcademyModel=Model;
})();
