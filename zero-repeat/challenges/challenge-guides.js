'use strict';
(() => {
  const ids = [1, 2];
  const get = id => document.getElementById(id);
  const form = get('registration-form');
  const button = get('continue-registration');
  const tabs = ids.map(id => get(`guide-tab-${id}`));
  const panels = ids.map(id => get(`guide-${id}`));
  const confirmed = id => reached.has(id) && get(`read-guide-${id}`).checked;
  const complete = () => ids.every(confirmed);
  const reached = new Set();
  let active = 1;
  let opened = false;
  const motion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';

  function refresh() {
    const count = ids.filter(confirmed).length;
    get('reading-count').textContent = `${['۰', '۱', '۲'][count]} از ۲ راهنما`;
    get('reading-instruction').textContent = count === 2
      ? 'اکنون می‌توانید چالش خود را انتخاب کنید.'
      : 'مطالعهٔ هر دو راهنما را تأیید کنید.';
    const progress = document.querySelector('.reading-progress');
    progress.setAttribute('aria-valuenow', String(count));
    ids.forEach((id, index) => {
      const read = confirmed(id);
      const label = get(`guide-state-${id}`);
      label.textContent = read ? 'مطالعه شد ✓' : 'برای مطالعه';
      label.classList.toggle('is-read', read);
      progress.children[index].classList.toggle('complete', read);
    });
    button.disabled = count !== 2;
    if (count !== 2 && opened) {
      form.hidden = true;
      form.setAttribute('inert', '');
      opened = false;
    }
  }

  function markReached(id) {
    if (get(`guide-${id}`).hidden || reached.has(id)) return;
    reached.add(id);
    get(`read-guide-${id}`).disabled = false;
    get(`read-hint-${id}`).textContent = 'به پایان راهنما رسیدید؛ اکنون می‌توانید مطالعهٔ آن را تأیید کنید.';
  }

  function checkVisibleEnds() {
    ids.forEach(id => {
      if (get(`guide-${id}`).hidden) return;
      const rect = get(`guide-end-${id}`).getBoundingClientRect();
      const panel = get(`guide-${id}`).getBoundingClientRect();
      if (rect.height > 0 && rect.top >= Math.max(0, panel.top) && rect.bottom <= Math.min(window.innerHeight, panel.bottom)) markReached(id);
    });
  }

  function activate(id, shouldScroll = false) {
    active = id;
    ids.forEach((value, index) => {
      const selected = value === id;
      panels[index].hidden = !selected;
      tabs[index].setAttribute('aria-selected', String(selected));
      tabs[index].tabIndex = selected ? 0 : -1;
    });
    if (shouldScroll) {
      get(`guide-tab-${id}`).focus({ preventScroll: true });
      // Jump to the new guide's start before the next paint. A smooth transition
      // could briefly expose its end at the old scroll position and unlock it.
      get('challenge-guides').scrollIntoView({ behavior: 'auto', block: 'start' });
    }
    requestAnimationFrame(checkVisibleEnds);
  }

  // Nothing is restored from storage: each visitor explicitly confirms both guides.
  ids.forEach(id => {
    get(`read-guide-${id}`).checked = false;
    get(`read-guide-${id}`).disabled = true;
    get(`read-guide-${id}`).addEventListener('change', refresh);
    get(`guide-tab-${id}`).addEventListener('click', () => activate(id));
    get(`guide-${id}`).setAttribute('role', 'tabpanel');
    get(`guide-${id}`).setAttribute('aria-labelledby', `guide-tab-${id}`);
  });
  get('guide-tabs').hidden = false;
  get('guide-tabs').addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const target = event.key === 'Home' ? 1 : event.key === 'End' ? 2 : active === 1 ? 2 : 1;
    activate(target);
    get(`guide-tab-${target}`).focus();
  });
  document.querySelectorAll('[data-open-guide]').forEach(control => {
    control.addEventListener('click', () => activate(Number(control.dataset.openGuide), true));
  });
  activate(1);
  refresh();

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.8) {
          markReached(Number(entry.target.id.slice(-1)));
        }
      });
    }, { threshold: [0, 0.8, 1] });
    ids.forEach(id => observer.observe(get(`guide-end-${id}`)));
  } else {
    window.addEventListener('scroll', checkVisibleEnds, { passive: true });
    window.addEventListener('resize', checkVisibleEnds);
    panels.forEach(panel => panel.addEventListener('scroll', checkVisibleEnds, { passive: true }));
    checkVisibleEnds();
  }

  button.addEventListener('click', () => {
    if (!complete()) return;
    opened = true;
    form.hidden = false;
    form.removeAttribute('inert');
    form.querySelector('input[name="challenge_id"]').focus({ preventScroll: true });
    form.scrollIntoView({ behavior: motion(), block: 'start' });
  });

  // Capture runs before the existing registration submit handler, preserving its API contract.
  form.addEventListener('submit', event => {
    if (complete() && opened) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    get('reading-instruction').textContent = 'ابتدا مطالعهٔ هر دو راهنما را تأیید کنید.';
    get('challenge-guides').scrollIntoView({ behavior: motion(), block: 'start' });
  }, true);

  // Loaded after register.js, so this runs after its existing new-registration reset.
  get('new-registration').addEventListener('click', () => {
    reached.clear();
    panels.forEach(panel => { panel.scrollTop = 0; });
    ids.forEach(id => {
      get(`read-guide-${id}`).checked = false;
      get(`read-guide-${id}`).disabled = true;
      get(`read-hint-${id}`).textContent = 'برای فعال شدن تأیید مطالعه، راهنما را تا انتها مرور کنید.';
    });
    opened = false;
    form.hidden = true;
    form.setAttribute('inert', '');
    activate(1, true);
    refresh();
  });
})();
