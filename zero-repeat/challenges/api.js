'use strict';
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ZERO_REPEAT_CHALLENGES_API = api;
})(typeof window === 'undefined' ? globalThis : window, function () {
  async function call(apiUrl, body, fetchImpl = fetch) {
    const connection = typeof module === 'object' && module.exports ? require('../connection.js') : window.ZERO_REPEAT_CONNECTION;
    return connection.call(apiUrl, body, {
      fetchImpl,
      readActions: ['health', 'admin_login', 'admin_entries'],
      writeActions: ['submit']
    });
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
