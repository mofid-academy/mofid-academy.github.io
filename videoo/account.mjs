export function passwordPanel(required=false){
  return `<section class="panel account-password-panel" aria-labelledby="videoPasswordTitle"><h1 id="videoPasswordTitle">${required?'رمز شخصی خودت را انتخاب کن':'تغییر رمز عبور'}</h1><p class="intro">${required?'برای ادامهٔ ورود، رمز اولیه را به رمزی که فقط خودت می‌دانی تغییر بده.':'رمز فعلی و سپس رمز جدیدت را وارد کن.'}</p><form id="videoPasswordForm"><label class="field"><span>رمز فعلی</span><input name="currentPassword" type="password" autocomplete="current-password" dir="ltr" required maxlength="256"></label><label class="field"><span>رمز جدید</span><input name="newPassword" type="password" autocomplete="new-password" dir="ltr" required minlength="8" maxlength="256"><small class="hint">حداقل ۸ نویسه و متفاوت از رمز فعلی</small></label><label class="field"><span>تکرار رمز جدید</span><input name="confirmation" type="password" autocomplete="new-password" dir="ltr" required minlength="8" maxlength="256"></label><p class="form-error" role="alert"></p><div class="button-group"><button type="submit" class="btn primary">ذخیرهٔ رمز جدید</button>${required?'':'<button type="button" class="btn quiet" data-action="library">انصراف</button>'}</div></form></section>`;
}

export function bindPasswordForm(form,{api,onSaved}){
  let busy=false;
  const submit=async event=>{
    event.preventDefault();if(busy)return;
    const currentPassword=form.elements.currentPassword.value,newPassword=form.elements.newPassword.value,confirmation=form.elements.confirmation.value;
    const error=form.querySelector('.form-error'),button=form.querySelector('[type="submit"]');
    error.textContent='';
    if(!currentPassword){error.textContent='رمز فعلی را وارد کنید.';return;}
    if(newPassword.length<8||newPassword.length>256){error.textContent='رمز جدید باید بین ۸ تا ۲۵۶ نویسه باشد.';return;}
    if(newPassword!==confirmation){error.textContent='تکرار رمز جدید یکسان نیست.';return;}
    if(newPassword===currentPassword){error.textContent='رمز جدید باید با رمز فعلی متفاوت باشد.';return;}
    busy=true;button.disabled=true;
    try{
      const result=await api('student_password_change',{currentPassword,newPassword});
      if(!form.isConnected)return;
      form.reset();await onSaved(result);
    }catch(e){if(form.isConnected)error.textContent=e.message;}
    finally{busy=false;if(form.isConnected)button.disabled=false;}
  };
  form.addEventListener('submit',submit);
  return ()=>form.removeEventListener('submit',submit);
}
