// Local sample interactions only. This preview has no API or participant identity.
const choices=[...document.querySelectorAll('[data-choice]')];
for(const button of choices)button.addEventListener('click',()=>{
 for(const choice of choices){choice.disabled=true;choice.classList.toggle('selected',choice===button);choice.setAttribute('aria-pressed',String(choice===button));}
 button.querySelector('.option-letter').textContent='✓';
 const note=document.querySelector('#previewNote');if(note)note.textContent='این فقط پیش‌نمایش است؛ انتخابی در پنل واقعی ذخیره نشده است.';
});
for(const frame of document.querySelectorAll('iframe')){
 const fit=()=>{const body=frame.contentDocument?.body;if(!body)return;frame.style.height=Math.ceil(body.getBoundingClientRect().height)+2+'px';};
 frame.addEventListener('load',()=>{fit();if(frame.contentDocument?.body)new ResizeObserver(fit).observe(frame.contentDocument.body);});
 if(frame.contentDocument?.readyState==='complete')fit();
}
const mobileWidth=document.querySelector('#previewMobileWidth');
if(mobileWidth)mobileWidth.addEventListener('change',()=>{
 const frame=document.querySelector('.preview-mobile iframe');
 if(frame)frame.style.width=`min(100%, ${mobileWidth.value==='320'?320:390}px)`;
});
