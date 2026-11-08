/* Shared footer. This presentation component never reads forms or account data. */
(function () {
  'use strict';
  const assets = new URL('.', document.currentScript?.src || new URL('/academy-assets/', location.href));
  function mount() {
    if (document.getElementById('academySupportFooter')) return;
    if (!document.getElementById('academySupportStyles')) {
      const sheet = document.createElement('link');
      sheet.id = 'academySupportStyles';
      sheet.rel = 'stylesheet';
      sheet.href = new URL('support.css?v=20261108-support-1', assets).href;
      document.head.append(sheet);
    }
    const footer = document.createElement('footer');
    footer.id = 'academySupportFooter';
    footer.className = 'academy-support-footer';
    footer.setAttribute('aria-label', 'پشتیبانی آکادمی مفید');
    const label = document.createElement('span');
    label.textContent = 'پشتیبانی داخلی:';
    const extension = document.createElement('bdi');
    extension.dir = 'ltr';
    extension.textContent = '2257';
    footer.append(label, extension);
    document.body.append(footer);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, {once:true});
  else mount();
})();
