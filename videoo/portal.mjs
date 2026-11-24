import {request} from './client.mjs?v=20261124-entry-1';

const storageKey = 'mofid-video-student-v1';
const root = document.getElementById('videoApp');
const coming = document.getElementById('academyHome');
const loginMarkup = root.innerHTML;
let app;
let loginCleanup;
let submitting = false;

function stored() {
  try { return JSON.parse(sessionStorage.getItem(storageKey) || 'null'); }
  catch { return null; }
}

function remember(value) {
  try {
    if (value) sessionStorage.setItem(storageKey, JSON.stringify(value));
    else sessionStorage.removeItem(storageKey);
  } catch {}
}

function leaveView() {
  app?.destroy();
  app = undefined;
  loginCleanup?.();
  loginCleanup = undefined;
}

function closed() {
  leaveView();
  root.setAttribute('aria-busy', 'false');
  root.hidden = true;
  coming.hidden = false;
}

function login(message = '') {
  const current = root.querySelector('#studentLogin');
  if (!current) {
    leaveView();
    root.innerHTML = loginMarkup;
  }
  root.hidden = false;
  coming.hidden = true;
  root.setAttribute('aria-busy', 'false');

  const form = root.querySelector('#studentLogin');
  form.querySelector('.form-error').textContent = message;
  if (form.dataset.ready) return;

  form.dataset.ready = 'true';
  form.addEventListener('submit', submitLogin);
  form.querySelector('button[type="submit"]').disabled = false;
  loginCleanup = window.MofidEntryUI?.mountLogin(root.querySelector('.login-card'));
}

async function submitLogin(event) {
  event.preventDefault();
  if (submitting) return;
  const form = event.currentTarget;
  const button = form.querySelector('button[type="submit"]');
  const error = form.querySelector('.form-error');
  const label = button.textContent;
  submitting = true;
  button.disabled = true;
  button.textContent = 'در حال ورود…';
  error.textContent = '';

  try {
    const result = await request('student_login', Object.fromEntries(new FormData(form)), undefined, {timeout: 15000});
    form.elements.password.value = '';
    const session = {token: result.token, username: result.username};
    remember(session);
    await openLibrary(session);
  } catch (e) {
    if (e.code === 'NOT_RELEASED') closed();
    else error.textContent = e.message;
  } finally {
    submitting = false;
    button.disabled = false;
    button.textContent = label;
  }
}

async function openLibrary(initialSession) {
  leaveView();
  root.hidden = false;
  coming.hidden = true;
  root.setAttribute('aria-busy', 'true');
  root.innerHTML = '<div class="initial-loader" role="status"><span class="spinner" aria-hidden="true"></span><p>در حال آماده‌سازی ویدیوها…</p></div>';

  let session = initialSession;
  const api = async (action, data, options) => {
    try {
      return await request(action, data, session.token, options);
    } catch (e) {
      if (e.status === 401) {
        remember(null);
        login('اعتبار ورودت پایان یافته؛ دوباره وارد شو.');
      } else if (e.code === 'NOT_RELEASED') {
        remember(null);
        closed();
      }
      throw e;
    }
  };

  try {
    const [{VideoApp}, catalogue] = await Promise.all([
      import('./app.mjs?v=20261124-entry-1'),
      api('bootstrap', {}, {timeout: 15000}),
    ]);
    app = new VideoApp({
      root, api, username: session.username, studentMode: true,
      onSessionChange(next) {
        session = {...session, ...next};
        remember(session);
      },
      onLogout() {
        remember(null);
        login();
      },
    });
    await app.load(catalogue);
  } catch (e) {
    if (e.status !== 401 && e.code !== 'NOT_RELEASED') {
      login(e.message || 'ویدیوها بارگیری نشدند. دوباره تلاش کنید.');
    }
  } finally {
    root.setAttribute('aria-busy', 'false');
  }
}

async function initPortal() {
  const session = stored();
  if (session?.token) return openLibrary(session);
  login();
  // This check updates the paused view without delaying the sign-in form.
  try {
    const status = await request('health', {}, undefined, {timeout: 6000});
    if (status.publicState === 'coming-soon' && !submitting && !stored()?.token) closed();
  } catch {}
}

void initPortal();
