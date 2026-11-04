/* Shared visual preference for the home and video pages only. */
(function () {
  'use strict';
  const root = document.documentElement;
  const key = 'mofid-academy-theme';
  const valid = value => value === 'light' || value === 'dark';
  let preference;
  try { const saved = localStorage.getItem(key); if (valid(saved)) preference = saved; } catch {}
  const system = typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)') : null;
  let button;
  const icons = {
    light: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M20.5 14A8.5 8.5 0 0 1 10 3.5 8.5 8.5 0 1 0 20.5 14Z"/></svg>',
    dark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></svg>'
  };
  function apply() {
    const theme = preference || (system?.matches ? 'dark' : 'light');
    root.dataset.academyTheme = theme;
    root.style.colorScheme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0d1916' : '#f2faf5');
    if (button) {
      const label = theme === 'dark' ? 'فعال کردن حالت روشن' : 'فعال کردن حالت تاریک';
      button.innerHTML = icons[theme];
      button.setAttribute('aria-label', label);
      button.setAttribute('title', label);
      button.setAttribute('aria-pressed', String(theme === 'dark'));
    }
  }
  apply();
  function mount() {
    if (document.getElementById('academyThemeToggle')) return;
    button = document.createElement('button');
    button.id = 'academyThemeToggle';
    button.className = 'academy-theme-toggle';
    button.type = 'button';
    button.addEventListener('click', () => {
      preference = root.dataset.academyTheme === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem(key, preference); } catch {}
      apply();
    });
    const nav = document.querySelector('#academyNavigation nav');
    if (nav) {
      const controls = document.createElement('div');
      controls.className = 'academy-navigation-controls';
      nav.replaceWith(controls);
      controls.append(nav, button);
    } else {
      button.classList.add('academy-theme-floating');
      document.body.append(button);
    }
    apply();
  }
  window.addEventListener('storage', event => {
    if (event.key !== key && event.key !== null) return;
    preference = valid(event.newValue) ? event.newValue : undefined;
    apply();
  });
  const systemChanged = () => { if (!preference) apply(); };
  if (system?.addEventListener) system.addEventListener('change', systemChanged);
  else system?.addListener?.(systemChanged);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
  else mount();
})();
