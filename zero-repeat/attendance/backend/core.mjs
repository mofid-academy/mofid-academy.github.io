import {createHash, createHmac, timingSafeEqual} from 'node:crypto';
import {Buffer} from 'node:buffer';

const origin = 'https://mofid-academy.github.io';
const replaced = 'این فرم به درخواست منتور تغییر کرده است. صفحه را تازه کنید.';

class FormError extends Error {
  constructor(message, status, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function fail(message, status = 400, code) {
  throw new FormError(message, status, code);
}

const hash = value => createHash('sha256').update(value).digest('hex');

function equal(a, b) {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

function uuid(value) {
  if (typeof value !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    fail('شناسهٔ درخواست معتبر نیست.');
  }
  return value.toLowerCase();
}

function cleanText(value, max) {
  if (typeof value !== 'string' || value.length > max || /[\u0000-\u001f\u007f]/.test(value)) {
    fail('اطلاعات واردشده معتبر نیست.');
  }
  const clean = value.normalize('NFC').trim();
  if (clean.length > max) fail('اطلاعات واردشده معتبر نیست.');
  return clean;
}

export function normalizeEntry(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) fail('اطلاعات درخواست معتبر نیست.');
  const full_name = cleanText(input.full_name ?? '', 120);
  const username = cleanText(input.username ?? '', 64).toLowerCase();
  if ([...full_name].length < 2) fail('نام و نام خانوادگی را وارد کنید.');
  if (!username) fail('نام سازمانی الزامی است.');
  if (!/^[a-z][a-z0-9._-]{0,63}$/.test(username)) fail('نام سازمانی را با حروف انگلیسی و بدون نشانی ایمیل وارد کنید.');
  if (typeof input.wants_mentor !== 'boolean') fail('مشخص کنید که منتور می‌خواهید یا نه.');
  return {full_name, username, wants_mentor: input.wants_mentor};
}

export function createApi({db, config, now = Date.now}) {
  const username = String(config.adminUsername || '').toLowerCase();
  const key = config.signingKey;
  if (!username || typeof key !== 'string' || key.length < 32 || !/^[a-f0-9]{64}$/.test(config.adminKeyHash || '')) {
    throw Error('Private configuration unavailable');
  }

  const signature = value => createHmac('sha256', key).update(value).digest('base64url');
  function sign() {
    const claims = {kind: 'zero-repeat-attendance-admin', username, exp: Math.floor(now() / 1000) + 7200};
    const prefix = 'zra1.' + Buffer.from(JSON.stringify(claims)).toString('base64url');
    return prefix + '.' + signature(prefix);
  }

  function verify(token) {
    if (typeof token !== 'string' || token.length > 4096) fail('برای ادامه وارد پنل مدیریت شوید.', 401);
    const parts = token.split('.');
    if (parts.length !== 3 || parts[0] !== 'zra1' || !equal(signature(parts[0] + '.' + parts[1]), parts[2])) {
      fail('نشست مدیریت معتبر نیست.', 401);
    }
    let claims;
    try {
      claims = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    } catch {
      fail('نشست مدیریت معتبر نیست.', 401);
    }
    if (claims?.kind !== 'zero-repeat-attendance-admin' || claims.username !== username ||
      !Number.isSafeInteger(claims.exp) || claims.exp <= Math.floor(now() / 1000)) {
      fail('نشست مدیریت پایان یافته است. دوباره وارد شوید.', 401);
    }
  }

  async function rate(kind, ip, limit) {
    const rateKey = createHmac('sha256', key).update('attendance:mentor:' + kind + ':' + ip).digest('hex');
    const result = await db('rate', {key: rateKey, limit});
    if (result?.allowed !== true) fail('تعداد تلاش‌ها زیاد است. چند دقیقه بعد دوباره تلاش کنید.', 429);
  }

  async function readPage(body, action) {
    const offset = body.offset ?? 0;
    if (!Number.isSafeInteger(offset) || offset < 0 || offset > 100000) fail('صفحهٔ گزارش معتبر نیست.');
    const args = {offset};
    if (body.snapshot !== undefined) {
      if (typeof body.snapshot !== 'string' || body.snapshot.length > 40 || !Number.isFinite(Date.parse(body.snapshot))) {
        fail('زمان گزارش معتبر نیست.');
      }
      // Keep the database timestamp, including fractional seconds, across pages.
      args.snapshot = body.snapshot;
    }
    return {ok: true, ...await db(action, args)};
  }

  return {
    async handle(body, {ip = 'unknown'} = {}) {
      if (!body || typeof body !== 'object' || Array.isArray(body)) fail('درخواست معتبر نیست.');
      const {action} = body;
      if (action === 'health') {
        const result = await db('mentor_health');
        return {ok: true, ready: result?.ready === true, version: 'zero-repeat-mentor/1'};
      }
      if (action === 'submit' || action === 'availability') fail(replaced, 409, 'FORM_REPLACED');

      if (action === 'mentor_submit') {
        const id = uuid(body.request_id);
        const entry = normalizeEntry(body.data);
        await rate('submit', ip, 600);
        const receipt = await db('mentor_submit', {id, ...entry, fingerprint: hash(JSON.stringify(entry))});
        if (receipt?.stored !== true || receipt.id !== id || receipt.wants_mentor !== entry.wants_mentor ||
          !Number.isFinite(Date.parse(receipt.created_at))) {
          fail('ثبت درخواست تأیید نشد. دوباره تلاش کنید.', 503);
        }
        return {ok: true, receipt};
      }

      if (action === 'admin_login') {
        await rate('login', ip, 12);
        if (typeof body.secret !== 'string' || body.secret.length > 256 ||
          cleanText(body.username ?? '', 64).toLowerCase() !== username || !equal(hash(body.secret), config.adminKeyHash)) {
          fail('نام کاربری یا رمز مدیریت معتبر نیست.', 401);
        }
        return {ok: true, token: sign()};
      }

      verify(body.token);
      if (action === 'admin_mentor_entries') return readPage(body, 'mentor_list');
      // Existing authorized report reads can still retrieve the archived attendance responses.
      if (action === 'admin_entries') return readPage(body, 'list');

      if (action === 'admin_mentor_assign') {
        const id = uuid(body.id);
        const mentor_name = cleanText(body.mentor_name, 120);
        const assignment_revision = body.assignment_revision;
        if (!Number.isInteger(assignment_revision) || assignment_revision < 0 || assignment_revision > 2147483647) {
          fail('فهرست را به‌روزرسانی کنید و دوباره تلاش کنید.');
        }
        const assignment = await db('mentor_assign', {id, mentor_name, assignment_revision});
        if (assignment?.id !== id || assignment.mentor_name !== mentor_name ||
          !Number.isSafeInteger(assignment.assignment_revision) || assignment.assignment_revision < assignment_revision ||
          (mentor_name ? !Number.isFinite(Date.parse(assignment.assigned_at)) : assignment.assigned_at !== null)) {
          fail('تخصیص منتور تأیید نشد. فهرست را به‌روزرسانی کنید.', 503);
        }
        return {ok: true, assignment};
      }

      if (action === 'admin_mentor_delete') {
        const id = uuid(body.id);
        if (body.confirm !== true) fail('حذف پاسخ را تأیید کنید.');
        const deleted = await db('mentor_delete', {id});
        if (deleted?.id !== id || !Number.isFinite(Date.parse(deleted.deleted_at))) {
          fail('حذف تأیید نشد. فهرست را به‌روزرسانی کنید.', 503);
        }
        return {ok: true, deleted};
      }
      fail('این عملیات شناخته نشد.', 404);
    }
  };
}

export function createStore({url, key, fetchImpl = fetch}) {
  const headers = {apikey: key, 'Content-Type': 'application/json'};
  if (key.startsWith('eyJ')) headers.Authorization = 'Bearer ' + key;
  return async (action, args = {}) => {
    const mentor = action.startsWith('mentor_');
    const rpc = mentor ? 'zr_mentor_store' : 'zr_attendance_store';
    let response, result;
    try {
      response = await fetchImpl(url + '/rest/v1/rpc/' + rpc, {
        method: 'POST',
        headers,
        body: JSON.stringify({p_action: mentor ? action.slice(7) : action, p_args: args}),
        signal: AbortSignal.timeout(20000)
      });
      result = await response.json();
    } catch {
      fail('ارتباط با سامانه برقرار نشد. دوباره تلاش کنید.', 503);
    }
    if (response.ok) return result;
    switch (result?.message) {
      case 'ID_CONFLICT': fail('این شناسه قبلاً برای پاسخ دیگری ثبت شده است.', 409, 'ID_CONFLICT');
      case 'ASSIGNMENT_CHANGED': fail('این تخصیص تغییر کرده است. فهرست را تازه کنید و دوباره بررسی کنید.', 409, 'ASSIGNMENT_CHANGED');
      case 'MENTOR_NOT_REQUESTED': fail('برای این پاسخ درخواست منتور ثبت نشده است.', 409, 'MENTOR_NOT_REQUESTED');
      case 'NOT_FOUND': fail('درخواست پیدا نشد یا حذف شده است.', 404);
      default: fail('دریافت یا ذخیرهٔ اطلاعات تأیید نشد. دوباره تلاش کنید.', 503);
    }
  };
}

export function createHandler(api, {origin: allowedOrigin = origin} = {}) {
  return async request => {
    const from = request.headers.get('origin');
    const headers = {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept',
      'Vary': 'Origin',
      'Cache-Control': 'no-store, private',
      'X-Content-Type-Options': 'nosniff'
    };
    try {
      if (from && from !== allowedOrigin) fail('مبدأ درخواست مجاز نیست.', 403);
      if (request.method === 'OPTIONS') return new Response(null, {status: 204, headers});
      if (request.method !== 'POST') fail('از فرم سایت استفاده کنید.', 405);
      const reader = request.body?.getReader();
      if (!reader) fail('درخواست خالی است.');
      let size = 0;
      const chunks = [];
      try {
        while (true) {
          const chunk = await reader.read();
          if (chunk.done) break;
          size += chunk.value.length;
          if (size > 12288) {
            await reader.cancel();
            fail('حجم درخواست بیش از حد مجاز است.', 413);
          }
          chunks.push(chunk.value);
        }
      } finally {
        reader.releaseLock();
      }

      let body;
      try {
        body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      } catch {
        fail('درخواست معتبر نیست.');
      }
      const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
      return Response.json(await api.handle(body, {ip}), {headers});
    } catch (error) {
      if (error instanceof FormError) {
        return Response.json({ok: false, message: error.message, code: error.code}, {status: error.status, headers});
      }
      return Response.json({ok: false, message: 'سامانه موقتاً در دسترس نیست. دوباره تلاش کنید.'}, {status: 503, headers});
    }
  };
}
