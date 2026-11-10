import {esc,fa} from './model.mjs';
import {icon} from './icons.mjs';

export const eventLabels={login:'ورود موفق',login_failed:'ورود ناموفق',logout:'خروج از حساب',portal_open:'ورود به بخش ویدیوها',lesson_opened:'باز کردن قسمت',watch_started:'شروع تماشا',watch_progress:'پیشرفت تماشا',lesson_completed:'تکمیل قسمت',password_changed:'تغییر رمز'};
const date=value=>{try{return new Intl.DateTimeFormat('fa-IR',{dateStyle:'short',timeStyle:'short',timeZone:'Asia/Tehran'}).format(new Date(value));}catch{return '—';}};
const role=value=>value==='admin'?'مدیریت':'کاربر';
const btn=(action,label,ico,disabled=false)=>`<button type="button" class="btn small-btn" data-action="${action}" ${disabled?'disabled':''}>${icon(ico)}${label}</button>`;

export function activityBody(report){
  const stats=report.summary||{},events=report.events||[],users=report.users||[];
  return `<div class="activity-stats">${[['events','رویداد ثبت‌شده'],['logins','ورود موفق'],['failedLogins','ورود ناموفق'],['activeUsers','کاربر فعال در ۵ دقیقهٔ اخیر']].map(([key,label])=>`<div class="activity-stat"><strong>${fa(stats[key]||0)}</strong><span>${label}</span></div>`).join('')}</div>
    <section class="panel activity-presence"><h2>آخرین حضور کاربران</h2><p class="activity-note">وضعیت حضور بر اساس فعالیت در ۵ دقیقهٔ اخیر است. خروج با دکمهٔ «خروج» ثبت می‌شود؛ بستن مرورگر پس از چند دقیقه غیرفعال دیده می‌شود.</p><div class="activity-people">${users.map(user=>`<article class="activity-person"><div><bdi>${esc(user.username)}</bdi><span class="activity-presence-tag ${user.is_online?'is-online':''}"><i></i>${user.is_online?'فعال در دقایق اخیر':'غیرفعال'}</span></div><small>${role(user.role)} · ${date(user.last_seen_at)}</small>${user.lesson_title?`<p>${esc(user.course_title)}<br>${esc(user.lesson_title)}</p>`:''}</article>`).join('')||'<p class="muted small">در این بازه فعالیتی ثبت نشده است.</p>'}</div></section>
    <section class="panel activity-timeline"><div class="panel-heading"><h2>تاریخچهٔ فعالیت</h2><small>به‌روزرسانی: ${date(report.generatedAt)}</small></div><div class="activity-table-wrap"><table class="activity-table"><caption class="sr-only">تاریخچهٔ ورود، خروج و فعالیت کاربران ویدیوها</caption><thead><tr><th scope="col">زمان تهران</th><th scope="col">نام سازمانی</th><th scope="col">رویداد</th><th scope="col">مجموعه و قسمت</th><th scope="col">تماشا</th></tr></thead><tbody>${events.map(event=>`<tr><td><time datetime="${esc(event.occurred_at)}">${date(event.occurred_at)}</time></td><td><bdi>${esc(event.username)}</bdi><small>${role(event.role)}</small></td><td><span class="chip ${event.event==='login_failed'?'activity-failed':''}">${esc(eventLabels[event.event]||'فعالیت')}</span></td><td>${event.course_title?`<strong>${esc(event.course_title)}</strong>`:''}${event.lesson_title?`<small>${esc(event.lesson_title)}</small>`:''}${!event.course_title&&!event.lesson_title?'—':''}</td><td>${event.percent===null||event.percent===undefined?'—':`${fa(event.percent)}٪<small>${fa(Math.round((event.watched_seconds||0)/60))} دقیقهٔ دیده‌شده</small>`}</td></tr>`).join('')||'<tr><td colspan="5" class="activity-empty">رویدادی با این فیلترها پیدا نشد.</td></tr>'}</tbody></table></div>${report.nextCursor?`<div class="activity-more">${btn('activity-more','نمایش رویدادهای بیشتر','down')}</div>`:''}</section>`;
}

export function startActivityPresence(api,environment=globalThis){
  const doc=environment.document;if(!doc?.addEventListener)return ()=>{};
  let stopped=false,pending=false;
  const ping=async()=>{if(stopped||pending||doc.visibilityState==='hidden')return;pending=true;try{await api('activity_ping');}catch{}finally{pending=false;}};
  const timer=environment.setInterval(()=>void ping(),60000);timer?.unref?.();
  const visible=()=>void ping();doc.addEventListener('visibilitychange',visible);
  return ()=>{stopped=true;environment.clearInterval(timer);doc.removeEventListener('visibilitychange',visible);};
}

export function installActivity(VideoApp){
  Object.assign(VideoApp.prototype,{
    activity(){
      if(this.readOnly)return '';
      const filter=this.activityFilters||{username:'',event:'',days:7};
      return `<div class="page-heading"><div><h1>گزارش فعالیت کاربران</h1><p>ورود، خروج و مسیر تماشای افراد با نام سازمانی.</p></div>${btn('activity-refresh','به‌روزرسانی','refresh')}</div><section class="panel activity-filters"><form id="activityFilters"><label class="field"><span>نام سازمانی</span><input name="username" dir="ltr" value="${esc(filter.username)}" maxlength="64" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="همهٔ کاربران"></label><label class="field"><span>نوع رویداد</span><select name="event"><option value="">همهٔ رویدادها</option>${Object.entries(eventLabels).map(([value,label])=>`<option value="${value}" ${value===filter.event?'selected':''}>${label}</option>`).join('')}</select></label><label class="field"><span>بازهٔ زمانی</span><select name="days">${[[1,'۲۴ ساعت اخیر'],[7,'۷ روز اخیر'],[30,'۳۰ روز اخیر'],[90,'۹۰ روز اخیر']].map(([value,label])=>`<option value="${value}" ${value===filter.days?'selected':''}>${label}</option>`).join('')}</select></label><button type="submit" class="btn primary">${icon('search')}نمایش گزارش</button></form><p class="activity-note">رویدادهای جدید از زمان فعال‌شدن این بخش ثبت می‌شوند. تکمیل قسمت با تماشای ۹۰٪ آن ثبت می‌شود. این گزارش فقط در مدیریت در دسترس است و رمزها را ذخیره نمی‌کند.</p></section><div data-activity-host aria-live="polite"><div class="initial-loader" role="status"><span class="spinner"></span><p>در حال دریافت گزارش…</p></div></div>`;
    },
    bindActivity(){
      if(this.readOnly)return;
      this.root.querySelector('#activityFilters').addEventListener('submit',event=>{event.preventDefault();const data=new FormData(event.target);this.activityFilters={username:String(data.get('username')||'').trim(),event:String(data.get('event')||''),days:Number(data.get('days'))};void this.loadActivity();});
      void this.loadActivity();
    },
    async loadActivity(more=false){
      if(this.readOnly||this.view!=='activity'||(more&&this.activityLoading))return;
      const host=this.root.querySelector('[data-activity-host]');if(!host)return;
      if(this.previewOnly){host.innerHTML='<p class="helper-box">گزارش فعالیت در اتصال سروری مدیریت در دسترس است.</p>';return;}
      const sequence=this.activitySequence=(this.activitySequence||0)+1;this.activityLoading=true;
      const filter={...(this.activityFilters||{username:'',event:'',days:7})},previous=more?this.activityReport:null;
      if(!more)host.innerHTML='<div class="initial-loader" role="status"><span class="spinner"></span><p>در حال دریافت گزارش…</p></div>';
      host.setAttribute('aria-busy','true');const moreButton=host.querySelector('[data-action="activity-more"]');if(moreButton)moreButton.disabled=true;
      try{const result=await this.api('activity_report',{...filter,cursor:previous?.nextCursor||null});if(sequence!==this.activitySequence||this.readOnly||this.view!=='activity'||host.isConnected===false)return;this.activityReport={...result,events:previous?[...previous.events,...result.events]:result.events};host.innerHTML=activityBody(this.activityReport);}
      catch(error){if(sequence===this.activitySequence&&host.isConnected!==false){host.innerHTML=previous?activityBody(previous):'';host.insertAdjacentHTML('beforeend',`<p class="form-error" role="alert">${esc(error.message)}</p>${previous?.nextCursor?'':btn(more?'activity-more':'activity-refresh','تلاش دوباره','refresh')}`);}}
      finally{if(sequence===this.activitySequence){this.activityLoading=false;host.setAttribute('aria-busy','false');}}
    },
    async activityClick(action){
      if(this.readOnly)return false;
      if(action==='activity'){this.view='activity';this.render();return true;}
      if(action==='activity-refresh'){await this.loadActivity();return true;}
      if(action==='activity-more'){await this.loadActivity(true);return true;}
      return false;
    }
  });
}
