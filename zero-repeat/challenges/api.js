'use strict';
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ZERO_REPEAT_CHALLENGES_API = api;
})(typeof window === 'undefined' ? globalThis : window, function () {
  let preferredApiUrl = '';
  async function call(apiUrl, body, fetchImpl = fetch) {
    const address = apiUrl;
    if (!address) throw new Error('اتصال سامانه هنوز فعال نشده است');
    const url = new URL(address);
    if (url.protocol !== 'https:') throw new Error('آدرس اتصال سامانه معتبر نیست');
    const binary = false;
    const endpoints = [url.href];
    // Supabase serves both hostnames from the same project and database.
    const project = /^([a-z]{20})\.supabase\.co$/.exec(url.hostname);
    const route = /^\/functions\/v1\/([a-z0-9-]+)$/.exec(url.pathname);
    if (project && route && !url.port && !url.username && !url.password && !url.search && !url.hash) {
      endpoints.push('https://' + project[1] + '.functions.supabase.co/' + route[1]);
    }
    if (endpoints.includes(preferredApiUrl)) {
      endpoints.splice(endpoints.indexOf(preferredApiUrl), 1);
      endpoints.unshift(preferredApiUrl);
    }
    const payload = JSON.stringify(body);
    const readActions = ['health', 'admin_login', 'admin_entries'];
    const canReadAgain = readActions.includes(body.action);
    const hasRequestId = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.request_id || '');
    // A second write uses the exact same ID and payload. The server deduplicates it.
    const canFailOver = canReadAgain || (hasRequestId && ['submit'].includes(body.action));
    const temporary = error => error.name === 'AbortError' || error.name === 'TypeError' || [502, 503, 504].includes(error.status);
    async function send(endpoint, controller) {
      const timer = setTimeout(() => controller.abort(), 45000);
      try {
        const response = await fetchImpl(endpoint, {
          method: 'POST', mode: 'cors', credentials: 'omit', cache: 'no-store',
          redirect: 'error', referrerPolicy: 'no-referrer', signal: controller.signal,
          headers: { 'Content-Type': 'text/plain;charset=UTF-8', Accept: binary ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/json' },
          body: payload
        });
        const type = response.headers.get('Content-Type') || '';
        if (binary && response.ok && !type.includes('application/json')) {
          const blob = await response.blob();
          const signature = new Uint8Array(await blob.slice(0, 4).arrayBuffer());
          if (signature[0] !== 80 || signature[1] !== 75 || signature[2] !== 3 || signature[3] !== 4) throw new Error('فایل اکسل معتبر دریافت نشد');
          return blob;
        }
        let result;
        try { result = await response.json(); }
        catch { const error = new Error('پاسخ معتبر از سامانه دریافت نشد؛ دوباره تلاش کنید'); error.status = response.status; throw error; }
        if (!response.ok || result?.ok !== true) {
          const error = new Error(result?.message || 'درخواست انجام نشد؛ دوباره تلاش کنید');
          error.status = response.status; error.code = result?.code; throw error;
        }
        return result;
      } finally { clearTimeout(timer); }
    }
    try {
      if (body.action === 'health' && endpoints.length > 1) {
        // Probe both routes without participant data; use the first healthy route.
        const controllers = endpoints.map(() => new AbortController());
        try {
          const winner = await Promise.any(endpoints.map(async (endpoint, i) => ({ endpoint, result: await send(endpoint, controllers[i]) })));
          preferredApiUrl = winner.endpoint;
          return winner.result;
        } catch (error) {
          throw error.errors.find(item => !temporary(item)) || error.errors[0];
        } finally { controllers.forEach(controller => controller.abort()); }
      }
      const attempts = endpoints.length > 1 ? (canFailOver ? endpoints : [endpoints[0]]) : (canReadAgain ? [endpoints[0], endpoints[0]] : endpoints);
      for (let i = 0; i < attempts.length; i++) {
        try {
          const result = await send(attempts[i], new AbortController());
          preferredApiUrl = attempts[i];
          return result;
        } catch (error) {
          if (i + 1 < attempts.length && temporary(error)) continue;
          throw error;
        }
      }
    } catch (error) {
      if (error.name === 'AbortError') throw new Error('پاسخ سرور دیر رسید. اطلاعات واردشده حفظ شده است؛ دوباره تلاش کنید');
      if (error.name === 'TypeError') throw new Error('ارتباط با سرور برقرار نشد. اطلاعات واردشده حفظ شده است؛ اتصال اینترنت را بررسی و دوباره تلاش کنید');
      throw error;
    }
  }

  // Keep every page and every registration, including repeated organization names.
  async function loadAllEntries(callApi, token) {
    const rows = new Map();
    let offset = 0;
    let initialTotal;
    while (true) {
      const page = await callApi({ action: 'admin_entries', token, offset });
      if (!Array.isArray(page.entries) || !Number.isSafeInteger(page.total) || page.total < 0 || typeof page.has_more !== 'boolean') {
        throw new Error('فهرست کامل ثبت‌ها دریافت نشد؛ دوباره تلاش کنید.');
      }
      if (initialTotal === undefined) initialTotal = page.total;
      if (page.total !== initialTotal) throw new Error('هنگام دریافت فهرست، ثبت جدیدی اضافه شد. دوباره به‌روزرسانی کنید.');
      for (const entry of page.entries) {
        if (typeof entry.id !== 'string') throw new Error('یکی از ثبت‌های دریافتی معتبر نیست.');
        rows.set(entry.id, entry);
      }
      offset += page.entries.length;
      if (!page.has_more) {
        if (rows.size !== page.total) throw new Error('فهرست کامل دریافت نشد. دوباره به‌روزرسانی کنید.');
        return [...rows.values()];
      }
      if (!page.entries.length || offset > 100000) throw new Error('فهرست کامل دریافت نشد؛ خروجی اکسل فعال نشده است.');
    }
  }
  return { call, loadAllEntries };
});
