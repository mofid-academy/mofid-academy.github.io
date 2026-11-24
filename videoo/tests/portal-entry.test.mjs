import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const source = (await readFile(new URL('../portal.mjs', import.meta.url), 'utf8'))
  .replace(/^import[^\n]*\n/gm, '')
  .replace(/import\('\.\/app\.mjs\?[^']+'\)/, 'loadVideoApp()')
  .replace('void initPortal();', 'globalThis.portalBoot=initPortal();');
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((a, b) => { resolve = a; reject = b; });
  return {promise, resolve, reject};
};

function portal(request, {session = null} = {}) {
  const attributes = {}, listeners = {};
  const stored = new Map(session ? [['mofid-video-student-v1', JSON.stringify(session)]] : []);
  const button = {disabled: true, textContent: 'ورود به ویدیوها'};
  const notice = {textContent: ''};
  const form = {
    dataset: {},
    querySelector(selector) { return selector === '.form-error' ? notice : button; },
    addEventListener(name, listener) { listeners[name] = listener; },
    elements: {password: {value: 'fixture-password'}},
  };
  const root = {
    hidden: false,
    innerHTML: '<form id="studentLogin"></form>',
    setAttribute(name, value) { attributes[name] = value; },
    querySelector(selector) { return selector === '#studentLogin' && this.innerHTML.includes('studentLogin') ? form : null; },
  };
  const coming = {hidden: true};
  let imports = 0;
  class App {
    constructor(options) { Object.assign(this, options); }
    load(initial) {
      assert.ok(initial);
      this.root.innerHTML = 'private library fixture';
    }
    destroy() {}
  }
  const context = {
    request,
    async loadVideoApp() { imports++; return {VideoApp: App}; },
    window: {},
    document: {getElementById: id => id === 'videoApp' ? root : coming},
    sessionStorage: {
      getItem: key => stored.get(key) || null,
      setItem: (key, value) => stored.set(key, value),
      removeItem: key => stored.delete(key),
    },
    FormData: class {
      *[Symbol.iterator]() { yield ['username', 'learner.fixture']; yield ['password', 'fixture-password']; }
    },
  };
  vm.createContext(context);
  vm.runInContext(source, context);
  return {
    root, coming, attributes, stored, button, form, notice,
    boot: context.portalBoot, get imports() { return imports; },
    submit: () => listeners.submit({preventDefault() {}, currentTarget: form}),
  };
}

test('the sign-in form is usable while the public status request is pending', async () => {
  const health = deferred(), p = portal(() => health.promise);
  assert.equal(p.coming.hidden, true);
  assert.equal(p.root.hidden, false);
  assert.equal(p.button.disabled, false);
  assert.match(p.root.innerHTML, /studentLogin/);
  assert.equal(p.imports, 0);
  health.resolve({publicState: 'live'});
  await p.boot;
  assert.equal(p.coming.hidden, true);
});

test('a confirmed paused status selects the paused view without loading the library', async () => {
  const p = portal(async () => ({publicState: 'coming-soon'}));
  await p.boot;
  assert.equal(p.root.hidden, true);
  assert.equal(p.coming.hidden, false);
  assert.equal(p.imports, 0);
});

test('a failed public status check leaves the login available', async () => {
  const p = portal(async () => { throw Error('network fixture'); });
  await p.boot;
  assert.equal(p.coming.hidden, true);
  assert.match(p.root.innerHTML, /studentLogin/);
  assert.equal(p.button.disabled, false);
  assert.equal(p.attributes['aria-busy'], 'false');
});

test('restoring a session asks for the authenticated catalogue directly', async () => {
  const bootstrap = deferred(), calls = [];
  const p = portal((action, data, token) => { calls.push({action, token}); return bootstrap.promise; },
    {session: {token: 'fixture-student-session', username: 'learner.fixture'}});
  assert.equal(p.attributes['aria-busy'], 'true');
  assert.equal(p.imports, 1);
  assert.deepEqual(calls, [{action: 'bootstrap', token: 'fixture-student-session'}]);
  bootstrap.resolve({});
  await p.boot;
  assert.equal(p.root.innerHTML, 'private library fixture');
  assert.equal(p.attributes['aria-busy'], 'false');
});

test('expired stored sessions return to sign-in without flashing the paused panel', async () => {
  const p = portal(async () => { const error = Error('expired fixture'); error.status = 401; throw error; },
    {session: {token: 'expired-fixture-session', username: 'learner.fixture'}});
  await p.boot;
  assert.equal(p.coming.hidden, true);
  assert.match(p.root.innerHTML, /studentLogin/);
  assert.equal(p.stored.size, 0);
  assert.equal(p.attributes['aria-busy'], 'false');
});

test('sign-in uses server authentication while public status remains pending', async () => {
  const health = deferred(), calls = [];
  const p = portal((action, data, token) => {
    calls.push({action, token});
    if (action === 'health') return health.promise;
    if (action === 'student_login') return {token: 'login-fixture-token', username: data.username};
    return {};
  });
  await p.submit();
  assert.equal(p.form.elements.password.value, '');
  assert.equal(p.root.innerHTML, 'private library fixture');
  assert.deepEqual(calls.map(call => call.action), ['health', 'student_login', 'bootstrap']);
  assert.equal(calls.at(-1).token, 'login-fixture-token');
  health.resolve({publicState: 'coming-soon'});
  await p.boot;
  assert.equal(p.coming.hidden, true);
});
