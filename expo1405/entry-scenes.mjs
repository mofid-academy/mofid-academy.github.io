// Presentation only: forms, voting, credentials and public state remain in app.mjs.
export const ENTRY_SCENES=[
 {id:'mofid',label:'ورود',product:'مفیدکارت · ورود به پنل',title:'ورود به پنل گفت‌وگو',description:'ناشناس شرکت کنید یا نام نمایشی خودتان را انتخاب کنید.'},
 {id:'vault',label:'انتخاب نام',product:'عیار · انتخاب نمایش نام',title:'نام شما، با انتخاب شما',description:'نمایش نام در سالن اختیاری است و فقط با اجازهٔ شما انجام می‌شود.'},
 {id:'bv',label:'پرسش‌ها',product:'BV · پرسش جاری',title:'هر پرسش، در لحظهٔ خودش',description:'پرسش جاری با فرمان مجری باز می‌شود؛ پرسش‌های بعدی نزد مجری می‌مانند.'},
 {id:'jet',label:'اجرای زنده',product:'جت · اجرای زنده',title:'هماهنگ با اجرای برنامه',description:'پاسخ شما برای همان پنل ثبت می‌شود؛ نتایج جمعی در نمایشگر سالن دیده می‌شوند.'},
 {id:'ribbon',label:'مشارکت',product:'ایزی‌تریدر · شروع مشارکت',title:'آمادهٔ همراهی هستید؟',description:'وارد نظرسنجی شوید و به پرسشی که مجری باز می‌کند پاسخ بدهید.'}
];

export function initEntryScenes(documentRoot=document){
 documentRoot.querySelectorAll('[data-entry-root]').forEach(root=>{
  if(root.dataset.entryReady)return;root.dataset.entryReady='true';
  const activate=id=>{
   const scene=ENTRY_SCENES.find(scene=>scene.id===id);if(!scene)return;
   root.dataset.entryScene=scene.id;
   root.querySelectorAll('[data-entry-select]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.entrySelect===scene.id)));
   if(root.dataset.entryKind==='participant'){
    const set=(selector,text)=>{const node=root.querySelector(selector);if(node)node.textContent=text;};
    set('[data-entry-title]',scene.title);set('[data-entry-description]',scene.description);set('[data-entry-product]',scene.product);
   }
  };
  root.querySelectorAll('[data-entry-select]').forEach(button=>button.addEventListener('click',()=>activate(button.dataset.entrySelect)));
  root.querySelector('[data-entry-next]')?.addEventListener('click',()=>{const i=ENTRY_SCENES.findIndex(scene=>scene.id===root.dataset.entryScene);activate(ENTRY_SCENES[(i+1)%ENTRY_SCENES.length].id);});
  root.querySelector('#anonymous')?.addEventListener('change',event=>activate(event.target.checked?'mofid':'vault'));
  root.querySelector('#loginRole')?.addEventListener('change',event=>{
   const admin=event.target.value==='admin';activate(admin?'vault':'jet');
   const title=root.querySelector('[data-entry-title]');if(title)title.textContent=admin?'ورود ادمین':'ورود برگزارکننده';
  });
  activate(root.dataset.entryScene||'mofid');
 });
}
