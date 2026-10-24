'use strict';
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ZERO_REPEAT_CHALLENGES_API = api;
})(typeof window === 'undefined' ? globalThis : window, function () {
  async function call(apiUrl, body, fetchImpl = fetch) {
    const url = new URL(apiUrl);
    if (url.protocol !== 'https:') throw new Error('آدرس اتصال سامانه معتبر نیست.');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetchImpl(url.href, {
        method: 'POST', credentials: 'omit', cache: 'no-store',
        referrerPolicy: 'no-referrer', signal: controller.signal,
        headers: { 'Content-Type': 'text/plain;charset=UTF-8', Accept: 'application/json' },
        body: JSON.stringify(body)
      });
      let result;
      try { result = await response.json(); }
      catch { throw new Error('پاسخ معتبر دریافت نشد؛ دوباره تلاش کنید.'); }
      if (!response.ok || result?.ok !== true) {
        const error = new Error(result?.message || 'درخواست انجام نشد؛ دوباره تلاش کنید.');
        error.code = result?.code;
        error.status = response.status;
        throw error;
      }
      return result;
    } catch (error) {
      if (error.name === 'AbortError') throw new Error('پاسخ سرور دیر رسید. اطلاعات شما حفظ شده است؛ دوباره تلاش کنید.');
      if (error instanceof TypeError) throw new Error('ارتباط برقرار نشد. اتصال اینترنت را بررسی و دوباره تلاش کنید.');
      throw error;
    } finally { clearTimeout(timer); }
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
