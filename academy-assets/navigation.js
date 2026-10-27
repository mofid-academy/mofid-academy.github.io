/* Shared presentation only: never reads answers, sessions, credentials or storage. */
(function () {
  'use strict';
  if (window.__ACADEMY_PREVIEW__ || document.getElementById('academyNavigation')) return;
  const root = document.documentElement;
  const section = document.currentScript?.dataset.academySection ||
    (location.pathname.startsWith('/Academy-Exam/') ? 'exam' :
      location.pathname.startsWith('/learning-studio/') ? 'studio' : 'home');
  root.dataset.academyApp = section;
  const header = document.createElement('header');
  header.id = 'academyNavigation';
  header.className = 'academy-navigation';
  const inner = document.createElement('div');
  inner.className = 'academy-navigation-inner';
  const brand = document.createElement('a');
  brand.className = 'academy-navigation-brand';
  brand.href = '/';
  const logo = document.createElement('img');
  logo.src = '/Academy-Exam/assets/mofid-academy-logo.webp';
  logo.alt = '';
  logo.width = 46;
  logo.height = 46;
  const label = document.createElement('span');
  const name = document.createElement('strong');
  name.textContent = 'آکادمی مفید';
  const caption = document.createElement('small');
  caption.textContent = 'MOFID ACADEMY';
  caption.lang = 'en';
  caption.dir = 'ltr';
  label.append(name, caption);
  brand.append(logo, label);
  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'بخش‌های آکادمی مفید');
  const modules = [
    ['home', '/', 'خانه'],
    ['studio', '/learning-studio/?portal=participant', 'مفید استودیو'],
    ['exam', '/Academy-Exam/', 'آزمون‌ها']
  ];
  const protectCurrentPage = section === 'exam' || section === 'studio';
  function protect(link) {
    if (!protectCurrentPage) return;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.title = 'باز شدن در تب جدید؛ صفحهٔ فعلی باز می‌ماند';
    const note = document.createElement('span');
    note.className = 'academy-visually-hidden';
    note.textContent = ' (در تب جدید)';
    link.append(note);
  }
  protect(brand);
  for (const [id, href, text] of modules) {
    const item = document.createElement(id === section ? 'span' : 'a');
    item.className = 'academy-navigation-item';
    item.textContent = text;
    if (id === section) item.setAttribute('aria-current', 'page');
    else { item.href = href; protect(item); }
    nav.append(item);
  }
  inner.append(brand, nav);
  header.append(inner);
  document.body.prepend(header);
  const measure = () => root.style.setProperty('--academy-navigation-height', Math.ceil(header.getBoundingClientRect().height) + 'px');
  measure();
  if (typeof ResizeObserver === 'function') new ResizeObserver(measure).observe(header);
})();
