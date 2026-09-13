(function(){
"use strict";
const sample={examId:"preview-only",examTitle:"آزمون آکادمی مفید",formId:"preview-only",questions:[
{type:"mcq",question:"این یک سؤال آزمایشی برای بررسی ظاهر گزینه‌هاست. گزینه موردنظر را انتخاب کنید.",options:["گزینه اول","گزینه دوم","گزینه سوم","گزینه چهارم"],max_score:1},
{type:"desc",question:"این یک سؤال تشریحی آزمایشی است. پاسخ این پیش‌نمایش ذخیره یا ارسال نمی‌شود.",max_score:5}]};
function escape(s){return s.replace(/<\/script/gi,"<\\/script");}
window.AcademyPreview=function(source,scene,settings={}){
 const chosen=settings.exam||sample;
 const d=new DOMParser().parseFromString(source,"text/html");
 d.querySelectorAll("base,meta[http-equiv='refresh' i],meta[http-equiv='content-security-policy' i]").forEach(n=>n.remove());
 const policy=d.createElement("meta");policy.httpEquiv="Content-Security-Policy";policy.content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src data: blob:; connect-src 'none'; base-uri 'none'; form-action 'none'; frame-src 'none'; object-src 'none'";
 const boot=d.createElement("script");boot.textContent=escape("window.__ACADEMY_PREVIEW__=true;window.EXAM_DATA="+JSON.stringify(scene==="error"?null:chosen)+";window.fetch=()=>Promise.reject(new Error('preview-only'));");
 d.head.prepend(policy,boot);
 const script=d.createElement("script");
 script.textContent=escape(`
 (function(){
  const scene=${JSON.stringify(scene)};let tries=0;
  function ready(){
   if(scene==="error")return;
   if(typeof exam==="undefined"||!exam){if(tries++<100)setTimeout(ready,40);return;}
   if(typeof send==="function")send=async function(){if(typeof done==="function")done();};
   if(typeof name!=="undefined")name="شرکت‌کننده نمونه";
   if(scene==="selected")go(Math.max(0,Math.min(${Number(settings.selectedIndex)||0},exam.questions.length-1)));
   if(scene==="mcq")go(Math.max(0,exam.questions.findIndex(q=>q.type==="mcq")));
   if(scene==="desc")go(Math.max(0,exam.questions.findIndex(q=>q.type==="desc")));
   if(scene==="review"){answers=Object.fromEntries(exam.questions.map((q,i)=>[i+1,q.type==="mcq"?(q.options[0]||"گزینه نمونه"):"یک پاسخ نمونه برای پیش‌نمایش."]));review();}
   if(scene==="done")done();
  }setTimeout(ready,0);
  document.addEventListener("click",function(e){const t=e.target.closest("[data-studio-field]");if(t){e.preventDefault();e.stopPropagation();parent.postMessage({kind:"academy-pick",id:t.dataset.studioField},"*");}},true);
 })();`);
 d.body.append(script);const style=d.createElement("style");style.textContent="[data-studio-field]:hover{outline:2px dashed #29a68d;outline-offset:3px;cursor:text}";d.head.append(style);
 return "<!doctype html>\n"+d.documentElement.outerHTML;
};
})();
