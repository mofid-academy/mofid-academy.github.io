import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import relay, { config } from '../netlify/functions/relay.mjs';

const site = 'https://mofid-academy.github.io';
const gateway = 'https://fixture.netlify.app';
const input = {
  submission_id: 'sub_https_relay_fixture_123', run_id: 'run_fixture_1234567890123456',
  exam_id: 'EX-FILE-FIXTURE', bank_version: 'v_fixture_1234567890',
  answers: [{ question_id: 'q1', answer: 'پاسخ آزمایشی' }],
};
const bytes = Buffer.from(JSON.stringify(input) + '\n', 'utf8');
const receipt = JSON.stringify({
  accepted: true, stored: true, submission_id: input.submission_id,
  run_id: input.run_id, exam_id: input.exam_id, bank_version: input.bank_version,
});

function request(path, method = 'POST', body = bytes, extra = {}) {
  return new Request(gateway + path, {
    method, headers: { Origin: site, 'Content-Type': 'text/plain;charset=UTF-8', ...extra },
    ...(['GET', 'HEAD', 'OPTIONS'].includes(method) || body === undefined ? {} : { body }),
  });
}

async function mocked(upstream, action) {
  const original = globalThis.fetch;
  let count = 0;
  globalThis.fetch = async (...args) => { count++; return upstream(...args); };
  try { await action(() => count); } finally { globalThis.fetch = original; }
}
const forbidden = () => { throw Error('Unexpected outbound request'); };

await test('HTTPS answer relay (all n8n requests mocked)', async t => {
  await t.test('only explicit health and answer routes are configured', () => {
    assert.deepEqual(config.path, ['/health', '/api/submit', '/api/legacy-submit']);
  });
  await t.test('health confirms runtime reachability without claiming storage', async () => {
    await mocked(forbidden, async count => {
      const r = await relay(new Request(gateway + '/health'));
      assert.equal(r.status, 200);
      const data = await r.json();
      assert.equal(data.relay_reachable, true); assert.equal(data.n8n_checked, false);
      assert.equal(data.stored, undefined); assert.equal(count(), 0);
    });
  });
  await t.test('a submission retains exact bytes, id and receipt identity', async () => {
    await mocked(async (url, init) => {
      assert.equal(url, 'https://azmoon.app.n8n.cloud/webhook/academy-submit-v5');
      assert.ok(Buffer.isBuffer(init.body)); assert.deepEqual(init.body, bytes);
      assert.equal(JSON.parse(init.body).submission_id, input.submission_id);
      assert.equal(init.method, 'POST'); assert.equal(init.cache, 'no-store');
      return new Response(receipt, { headers: { 'Content-Type': 'application/json' } });
    }, async count => {
      const r = await relay(request('/api/submit'));
      assert.equal(await r.text(), receipt); assert.equal(r.status, 200); assert.equal(count(), 1);
      assert.equal(r.headers.get('Access-Control-Allow-Origin'), site);
      assert.match(r.headers.get('Cache-Control'), /no-store/);
    });
  });
  await t.test('legacy submissions reach only the existing legacy service', async () => {
    await mocked(async (url, init) => {
      assert.equal(url, 'https://azmoon.app.n8n.cloud/webhook/youform-exam');
      assert.deepEqual(init.body, bytes); return new Response(receipt);
    }, async () => { assert.equal((await relay(request('/api/legacy-submit'))).status, 200); });
  });
  await t.test('lost receipt retries retain the original id and can be deduplicated by n8n', async () => {
    const stored = new Map();
    await mocked(async (url, init) => {
      const body = JSON.parse(init.body);
      const previous = stored.get(body.submission_id);
      if (previous) assert.deepEqual(init.body, previous);
      else { stored.set(body.submission_id, Buffer.from(init.body)); throw new TypeError('Receipt lost after storage'); }
      return new Response(receipt);
    }, async count => {
      const first = await relay(request('/api/submit'));
      assert.equal(first.status, 502); assert.equal((await first.json()).stored, false);
      const second = await relay(request('/api/submit'));
      assert.equal(await second.text(), receipt); assert.equal(stored.size, 1); assert.equal(count(), 2);
    });
  });
  await t.test('n8n rejection status and body remain rejected without an extra attempt', async () => {
    const rejected = '{"accepted":false,"stored":false,"message":"fixture rejection"}';
    await mocked(async () => new Response(rejected, { status: 500 }), async count => {
      const r = await relay(request('/api/submit'));
      assert.equal(r.status, 500); assert.equal(await r.text(), rejected); assert.equal(count(), 1);
    });
  });
  await t.test('HTTP 200 without a storage receipt is never embellished into success', async () => {
    await mocked(async () => new Response('{"message":"Workflow got started"}'), async () => {
      const r = await relay(request('/api/submit'));
      const data = await r.json(); assert.equal(data.stored, undefined); assert.equal(data.accepted, undefined);
    });
  });
  await t.test('timeouts yield an unconfirmed response rather than accepted true', async () => {
    await mocked(async () => { throw new DOMException('fixture timeout', 'AbortError'); }, async count => {
      const r = await relay(request('/api/submit')); assert.equal(r.status, 504);
      const data = await r.json(); assert.equal(data.accepted, false); assert.equal(data.stored, false);
      assert.equal(count(), 1);
    });
  });
  await t.test('n8n redirects are not followed and cannot expose another destination', async () => {
    await mocked(async (url, init) => {
      assert.equal(init.redirect, 'manual');
      return new Response(null, { status: 302, headers: { Location: 'https://untrusted.example' } });
    }, async count => {
      const r = await relay(request('/api/submit'));
      assert.equal(r.status, 502); assert.equal(r.headers.get('Location'), null); assert.equal(count(), 1);
    });
  });
  await t.test('preflight stays local and permits the existing site and content type', async () => {
    await mocked(forbidden, async count => {
      const r = await relay(request('/api/submit', 'OPTIONS', undefined, {
        'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type',
      }));
      assert.equal(r.status, 204); assert.equal(r.headers.get('Access-Control-Allow-Origin'), site);
      assert.equal(count(), 0);
    });
  });
  await t.test('foreign origins and arbitrary request headers are rejected', async () => {
    await mocked(forbidden, async count => {
      for (const origin of ['null', 'https://untrusted.example', site + '.untrusted.example']) {
        assert.equal((await relay(request('/api/submit', 'POST', bytes, { Origin: origin }))).status, 403);
      }
      assert.equal((await relay(request('/api/submit', 'OPTIONS', undefined, {
        'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'authorization',
      }))).status, 403);
      assert.equal(count(), 0);
    });
  });
  await t.test('GET, empty bodies and unknown paths cannot write to n8n', async () => {
    await mocked(forbidden, async count => {
      assert.equal((await relay(request('/api/submit', 'GET'))).status, 405);
      assert.equal((await relay(request('/api/submit', 'POST', ''))).status, 400);
      assert.equal((await relay(request('/api/admin'))).status, 404);
      assert.equal(count(), 0);
    });
  });
  await t.test('client URLs, cookies, credentials and query strings cannot redirect or authenticate upstream', async () => {
    await mocked(async (url, init) => {
      assert.equal(url, 'https://azmoon.app.n8n.cloud/webhook/academy-submit-v5');
      for (const name of ['Cookie', 'Authorization', 'X-Academy-Admin-Key', 'X-Forwarded-Host']) {
        assert.equal(init.headers.get(name), null);
      }
      assert.equal(init.headers.get('Origin'), site); return new Response(receipt);
    }, async () => {
      const r = await relay(request('/api/submit?url=https://untrusted.example', 'POST', bytes, {
        Cookie: 'fixture=1', Authorization: 'fixture', 'X-Academy-Admin-Key': 'fixture',
        'X-Forwarded-Host': 'untrusted.example',
      }));
      assert.equal(r.status, 200);
    });
  });
  await t.test('oversized bodies are rejected before calling n8n', async () => {
    await mocked(forbidden, async count => {
      const r = await relay(request('/api/submit', 'POST', new Uint8Array(5 * 1024 * 1024 + 1)));
      assert.equal(r.status, 413); assert.equal((await r.json()).stored, false); assert.equal(count(), 0);
    });
  });
  await t.test('upstream credentials and cookies are not passed back to participants', async () => {
    await mocked(async () => new Response(receipt, {
      headers: { 'Content-Type': 'application/json', 'Set-Cookie': 'fixture=1', 'Access-Control-Allow-Origin': '*' },
    }), async () => {
      const r = await relay(request('/api/submit'));
      assert.equal(r.headers.get('Set-Cookie'), null);
      assert.equal(r.headers.get('Access-Control-Allow-Origin'), site);
    });
  });
});
