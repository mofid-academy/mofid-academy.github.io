/* Keep the sandbox preview visually consistent without changing published data. */
(function(){
 'use strict';
 const assets=window.__ACADEMY_VISUAL_ASSETS__;
 if(!assets||typeof window.AcademyPreview!=='function')return;
 const previous=window.AcademyPreview;
 const closing='</scr'+'ipt>';
 window.AcademyPreview=function(...args){
  let html=previous(...args);
  html=html.replace(/font-src[^;]+;/,'font-src '+location.origin+' data:;');
  const css=assets.css.replace(/<\/style/gi,'<\\/style');
  const script=assets.script.replace(/<\/script/gi,'<\\/script');
  const custom=html.match(/<style\b[^>]*\bid=["']academy-studio-overrides["'][^>]*>[\s\S]*?<\/style>/i)?.[0]||'';
  if(custom)html=html.replace(custom,'');
  html=html.replace('</head>','<style id="academy-exam-skin">'+css+'</style>'+custom+'</head>');
  html=html.replace('</body>','<scr'+'ipt>'+script+closing+'</body>');
  return html;
 };
 document.getElementById('scene')?.dispatchEvent(new Event('change',{bubbles:true}));
 const canvas=document.querySelector('.preview-canvas'),wrap=document.getElementById('frameWrap');
 if(canvas&&wrap&&typeof ResizeObserver==='function'){
  new ResizeObserver(()=>{
   const width=parseFloat(wrap.style.width)||1100;
   const available=canvas.clientWidth-16;
   wrap.style.zoom=String(Math.min(1,Math.max(.25,available/width)));
  }).observe(canvas);
 }
})();
