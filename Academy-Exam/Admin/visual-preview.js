/* Keep the sandbox preview visually consistent without changing published data. */
(function(){
 'use strict';
 const assets=window.__ACADEMY_VISUAL_ASSETS__;
 if(!assets||typeof window.AcademyPreview!=='function')return;
 const previous=window.AcademyPreview;
 const closing='</scr'+'ipt>';
 window.AcademyPreview=function(...args){
  // Preview navigation follows the public form; this does not modify authored source.
  args[0]=args[0].replace(' go=function(i){\n  if(i>step',' go=function(i,options){\n  if(options?.navigation!=="question-map"&&i>step').replace('  oldGo(i);decorate();','  return Promise.resolve(oldGo(i,options)).then(decorate);').replace('setTimeout(()=> last?review():go(i+1), 170);','setTimeout(()=>{if(b.isConnected&&step===i)(last?review():go(i+1));},170);');
  let html=previous(...args);
  const theme=document.documentElement.dataset.academyTheme==='dark'?'dark':'light';
  html=html.replace('<html ','<html data-academy-theme="'+theme+'" ');
  html=html.replace(/font-src[^;]+;/,'font-src '+location.origin+' data:;');
  const css=assets.css.replace(/<\/style/gi,'<\\/style');
  const script=assets.script.replace(/<\/script/gi,'<\\/script');
  const custom=html.match(/<style\b[^>]*\bid=["']academy-studio-overrides["'][^>]*>[\s\S]*?<\/style>/i)?.[0]||'';
  if(custom)html=html.replace(custom,'');
  html=html.replace('</head>','<style id="academy-exam-skin">'+css+'</style>'+custom+'</head>');
  html=html.replace('</body>','<scr'+'ipt>window.__ACADEMY_THEME_PARENT_ORIGIN__='+JSON.stringify(location.origin)+';'+script+closing+'</body>');
  return html;
 };
 document.getElementById('scene')?.dispatchEvent(new Event('change',{bubbles:true}));
 window.addEventListener('academy-theme-change',event=>{
  document.getElementById('preview')?.contentWindow?.postMessage({kind:'academy-preview-theme',mode:event.detail.mode},'*');
 });
 const canvas=document.querySelector('.preview-canvas'),wrap=document.getElementById('frameWrap');
 if(canvas&&wrap&&typeof ResizeObserver==='function'){
  new ResizeObserver(()=>{
   const width=parseFloat(wrap.style.width)||1100;
   const available=canvas.clientWidth-16;
   wrap.style.zoom=String(Math.min(1,Math.max(.25,available/width)));
  }).observe(canvas);
 }
})();
