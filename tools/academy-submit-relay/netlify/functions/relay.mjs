/**
 * HTTPS answer transport. The existing n8n workflows own validation, storage,
 * grading and duplicate detection. Never acknowledge a save in this function.
 * No secrets, keys, cookies, or configurable remote destinations are required.
 */
import { Buffer } from 'node:buffer';

const SITE_ORIGIN = 'https://mofid-academy.github.io';
const MAX_BODY_BYTES = 5 * 1024 * 1024;
const TIMEOUT_MS = 25000;
const DESTINATIONS = new Map([
  ['/api/submit', 'https://azmoon.app.n8n.cloud/webhook/academy-submit-v5'],
  ['/api/legacy-submit', 'https://azmoon.app.n8n.cloud/webhook/youform-exam'],
]);

export const config = { path: ['/health', '/api/submit', '/api/legacy-submit'] };

function headers(contentType = 'application/json; charset=utf-8') {
  return new Headers({
    'Content-Type': contentType,
    'Access-Control-Allow-Origin': SITE_ORIGIN,
    'Vary': 'Origin',
    'Cache-Control': 'no-store, max-age=0',
    'X-Content-Type-Options': 'nosniff',
    'X-Academy-Relay': 'academy-submit-relay-v1',
  });
}

function json(status, value, extra = {}) {
  const h = headers();
  for (const [key, value] of Object.entries(extra)) h.set(key, value);
  return new Response(JSON.stringify(value), { status, headers: h });
}

function fail(status, code, message, extra) {
  return json(status, { ok: false, accepted: false, stored: false, code, message }, extra);
}

async function payloadBytes(request) {
  const declared = request.headers.get('Content-Length');
  if (declared !== null && Number(declared) > MAX_BODY_BYTES) throw new RangeError('PAYLOAD_LIMIT');
  if (!request.body) return Buffer.alloc(0);
  const reader = request.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) {
        await reader.cancel();
        throw new RangeError('PAYLOAD_LIMIT');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks, size);
}

export default async function relay(request) {
  const url = new URL(request.url);
  const origin = request.headers.get('Origin');
  if (origin !== null && origin !== SITE_ORIGIN) {
    return fail(403, 'ORIGIN_DENIED', 'مبدأ درخواست مجاز نیست.');
  }

  if (url.pathname === '/health') {
    if (!['GET', 'HEAD'].includes(request.method)) {
      return fail(405, 'METHOD_DENIED', 'روش درخواست مجاز نیست.', { Allow: 'GET, HEAD' });
    }
    const response = json(200, {
      ok: true,
      service: 'academy-submit-relay-v1',
      relay_reachable: true,
      n8n_checked: false,
      message: 'واسط در دسترس است؛ ثبت واقعی پاسخ در n8n هنوز آزمایش نشده است.',
    });
    return request.method === 'HEAD'
      ? new Response(null, { status: 200, headers: response.headers }) : response;
  }

  // Neither the URL query nor request data can choose the destination.
  const destination = DESTINATIONS.get(url.pathname);
  if (!destination) return fail(404, 'ROUTE_NOT_FOUND', 'مسیر درخواست مجاز نیست.');

  if (request.method === 'OPTIONS') {
    const requested = (request.headers.get('Access-Control-Request-Headers') || '')
      .split(',').map(value => value.trim().toLowerCase()).filter(Boolean);
    if (origin !== SITE_ORIGIN || request.headers.get('Access-Control-Request-Method') !== 'POST' ||
        requested.some(name => name !== 'content-type')) {
      return fail(403, 'PREFLIGHT_DENIED', 'درخواست بررسی اتصال مجاز نیست.');
    }
    const h = headers();
    h.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    h.set('Access-Control-Allow-Headers', 'Content-Type');
    return new Response(null, { status: 204, headers: h });
  }

  if (request.method !== 'POST') {
    return fail(405, 'METHOD_DENIED', 'روش درخواست مجاز نیست.', { Allow: 'POST, OPTIONS' });
  }

  let body;
  try { body = await payloadBytes(request); }
  catch (error) {
    return fail(error instanceof RangeError ? 413 : 400,
      error instanceof RangeError ? 'PAYLOAD_LIMIT' : 'BODY_UNREADABLE',
      'متن درخواست قابل ارسال نیست؛ ثبت نهایی تأیید نشده است.');
  }
  if (!body.length) return fail(400, 'EMPTY_BODY', 'پاسخ آزمون ارسال نشده است.');

  const outgoing = new Headers({ Accept: 'application/json' });
  const contentType = request.headers.get('Content-Type');
  if (contentType !== null) outgoing.set('Content-Type', contentType);
  if (origin !== null) outgoing.set('Origin', origin);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    // Forward bytes as a Buffer, rather than a Node.js Request body stream.
    // There is one upstream request per invocation and no automatic retry.
    const upstream = await fetch(destination, {
      method: 'POST', headers: outgoing, body,
      cache: 'no-store', redirect: 'manual', signal: controller.signal,
    });
    if (upstream.status >= 300 && upstream.status < 400) {
      return fail(502, 'UPSTREAM_REDIRECT', 'سرور مقصد تغییر مسیر داد؛ ثبت نهایی تأیید نشده است.');
    }
    // Preserve receipts, rejection responses, identity fields, and HTTP status.
    // The participant page still checks the actual storage receipt from n8n.
    return new Response(upstream.body, {
      status: upstream.status,
      headers: headers(upstream.headers.get('Content-Type') || 'application/octet-stream'),
    });
  } catch (error) {
    const timedOut = controller.signal.aborted || ['AbortError', 'TimeoutError'].includes(error?.name);
    return fail(timedOut ? 504 : 502, timedOut ? 'UPSTREAM_TIMEOUT' : 'UPSTREAM_UNREACHABLE',
      'تأیید ثبت از سرور دریافت نشد؛ پاسخ را با همان شناسهٔ ارسال بررسی و دوباره ارسال کنید.');
  } finally {
    clearTimeout(timer);
  }
}
