import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

const source = await readFile(process.env.ACADEMY_NETWORK_SOURCE || new URL('../../Academy-Exam/public-network.js', import.meta.url), 'utf8');
const origin = 'https://mofid-academy.github.io';
const local = { enabled: true, durationMinutes: 50, openAt: '', lastStartAt: '', accessLock: { version: 1, locked: true } };
const dateHeaders = { Date: 'Sun, 25 Oct 2026 14:00:00 GMT' };

function fixture(nativeFetch) {
  const window = { fetch: nativeFetch };
  const context = {
    window, document: { currentScript: { src: origin + '/Academy-Exam/public-network.js?test=1' } },
    location: { href: origin + '/Academy-Exam/', origin },
    URL, Request, Response, AbortSignal, performance,
  };
  vm.runInNewContext(source, context);
  return { window, api: window.__ACADEMY_PUBLIC_NETWORK__ };
}

test('loading timing support preserves the existing browser fetch/security wrapper', () => {
  const guarded = () => { throw Error('Unexpected request'); };
  const { window } = fixture(guarded);
  assert.equal(window.fetch, guarded);
});

test('a proxied submission keeps its original body, signal, ID and real storage receipt', async () => {
  const payload = JSON.stringify({ submission_id: 'sub_fixture_12345678', run_id: 'run_fixture_1234567890123456', fields: [{ id: 'name', answer: 'synthetic' }] });
  const options = { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=UTF-8' }, body: payload, credentials: 'omit', signal: AbortSignal.timeout(1000) };
  let calls = 0;
  const { window } = fixture(async (url, init) => {
    calls++;
    // A valid public HTTPS request may traverse a proxy with another address space.
    // Forcing a target space rejects it before the storage server is contacted.
    if (init.targetAddressSpace === 'public') throw new TypeError('Failed to fetch');
    assert.equal(url, 'https://azmoon.app.n8n.cloud/webhook/academy-submit-v5');
    assert.equal(init, options);
    assert.equal(init.body, payload);
    return Response.json({ accepted: true, stored: true, submission_id: JSON.parse(init.body).submission_id });
  });
  const receipt = await (await window.fetch('https://azmoon.app.n8n.cloud/webhook/academy-submit-v5', options)).json();
  assert.equal(receipt.accepted, true); assert.equal(receipt.stored, true);
  assert.equal(receipt.submission_id, 'sub_fixture_12345678'); assert.equal(calls, 1);
});

test('fresh remote timing is usable through the normal proxy path', async () => {
  const calls = [];
  const { api } = fixture(async (url, init) => {
    calls.push({ url, init });
    if (init.targetAddressSpace === 'public') throw new TypeError('Failed to fetch');
    return Response.json({ ...local, durationMinutes: url.startsWith('https://raw.githubusercontent.com/') ? 37 : 50 }, { headers: dateHeaders });
  });
  const result = await api.readTiming();
  assert.equal(result.durationMinutes, 37);
  assert.equal(result.accessLock.locked, true);
  assert.equal(calls.length, 2);
  assert(calls.every(c => c.init.cache === 'no-store' && c.init.credentials === 'omit'));
  assert(Number.isFinite(result.serverEpoch));
});

test('blocked remote timing still falls back to the same-origin schedule', async () => {
  const { api } = fixture(async (url) => {
    if (url.startsWith('https://raw.githubusercontent.com/')) throw new TypeError('Remote host unreachable');
    return Response.json(local, { headers: dateHeaders });
  });
  const result = await api.readTiming();
  assert.equal(result.durationMinutes, 50); assert.equal(result.enabled, true);
  assert.equal(result.accessLock.locked, true);
});

test('local-only timing makes one same-origin request and retains schedule validation', async () => {
  const calls = [];
  const { api } = fixture(async (url, init) => {
    calls.push({ url, init }); return Response.json(local);
  });
  assert.equal((await api.readTiming({ localOnly: true })).durationMinutes, 50);
  assert.equal(calls.length, 1);
  assert(calls[0].url.startsWith(origin + '/Academy-Exam/timing.json?'));
  const invalid = fixture(async () => Response.json({ ...local, durationMinutes: 0 }));
  await assert.rejects(invalid.api.readTiming({ localOnly: true }), /زمان‌بندی/);
});
