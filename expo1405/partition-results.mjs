// Proportional filled/remainder partitions, inspired by 8starlabs Partition Bar.
// Animate only when displayed values change, using the server's exact target.
const root = document.getElementById('resultsBody');
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
const format = value => Math.round(value).toLocaleString('fa-IR');
let stateKey = '', displayed = [], jobs = [], frame = 0, finishCurrent = null;

function shareHue(value) {
  const percent = Math.max(0, Math.min(100, Number(value) || 0));
  return percent <= 50 ? 4 + percent / 50 * 43 : 47 + (percent - 50) / 50 * 102;
}

function colorShare(track, value) {
  track.closest('.hall-result-card')?.style.setProperty('--share-hue', shareHue(value).toFixed(2));
}

function settle() {
  cancelAnimationFrame(frame);
  frame = 0;
  if (finishCurrent) finishCurrent();
  finishCurrent = null;
  jobs.forEach(job => job.cancel());
  jobs = [];
}

function sync() {
  // Preserve the last actually painted values before replacing the old animation.
  const previous = displayed.slice();
  settle();
  const cards = root.querySelector('.hall-result-cards');
  if (!cards) { stateKey = ''; displayed = []; return; }
  const tracks = Array.from(cards.querySelectorAll('.hall-result-track'));
  // Keep the seven-second outward/return sweep continuous across live DOM updates.
  const sheenDelay = -(performance.now() % 14000) / 1000;
  tracks.forEach((track, i) => track.querySelector('.hall-result-fill').style.setProperty('--sheen-delay', (sheenDelay - i * .65) + 's'));
  const numbers = Array.from(cards.querySelectorAll('.hall-result-percent strong'));
  const labels = Array.from(cards.querySelectorAll('.hall-result-label'), node => node.textContent);
  const key = JSON.stringify([cards.dataset.resultKey, labels]);
  const sameQuestion = key === stateKey;
  stateKey = key;
  const targets = tracks.map(track => Math.max(0, Math.min(100, Number(track.dataset.partitionValue) || 0)));
  const starts = targets.map((target, i) => sameQuestion ? (previous[i] ?? target) : 0);
  displayed = targets.slice();
  const finish = () => { targets.forEach((value, i) => { if (numbers[i]) numbers[i].textContent = format(value); colorShare(tracks[i], value); }); displayed = targets.slice(); };
  if (reduced.matches || document.hidden || !tracks.every(track => typeof track.animate === 'function')) { finish(); return; }

  const changed = targets.map((value, i) => value !== starts[i]);
  if (!changed.some(Boolean)) { finish(); return; }
  const timing = { duration: 700, easing: 'cubic-bezier(.22,.7,.2,1)', fill: 'none' };
  targets.forEach((value, i) => {
    if (!changed[i]) return;
    const track = tracks[i], fill = track.querySelector('.hall-result-fill'), rest = track.querySelector('.hall-result-rest');
    const start = starts[i];
    jobs.push(fill.animate([{ flexGrow: String(start), opacity: start === 0 ? 0 : 1 }, { flexGrow: String(value), opacity: value === 0 ? 0 : 1 }], timing));
    jobs.push(rest.animate([{ flexGrow: String(100 - start) }, { flexGrow: String(100 - value) }], timing));
    jobs.push(track.animate([{ columnGap: start > 0 && start < 100 ? '4px' : '0px' }, { columnGap: value > 0 && value < 100 ? '4px' : '0px' }], timing));
  });
  displayed = starts.slice();
  starts.forEach((value, i) => colorShare(tracks[i], value));
  finishCurrent = finish;
  let began = null;
  function tick(now) {
    if (began === null) began = now;
    const progress = Math.min((now - began) / timing.duration, 1), eased = 1 - Math.pow(1 - progress, 3);
    displayed = targets.map((value, i) => starts[i] + (value - starts[i]) * eased);
    displayed.forEach((value, i) => { if (numbers[i]) numbers[i].textContent = format(value); colorShare(tracks[i], value); });
    if (progress < 1 && !document.hidden) frame = requestAnimationFrame(tick);
    else { finish(); frame = 0; finishCurrent = null; }
  }
  frame = requestAnimationFrame(tick);
}

if (root) {
  // Observe only direct card replacement; number animation must not retrigger sync.
  new MutationObserver(sync).observe(root, { childList: true });
  document.addEventListener('visibilitychange', () => { if (document.hidden) settle(); });
  reduced.addEventListener('change', () => { if (reduced.matches) settle(); });
  window.addEventListener('pagehide', settle);
  sync();
}
