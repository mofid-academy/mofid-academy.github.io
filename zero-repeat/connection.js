'use strict';
(function (root, factory) {
  const connection = factory();
  if (typeof module === 'object' && module.exports) module.exports = connection;
  else root.ZERO_REPEAT_CONNECTION = connection;
})(typeof window === 'undefined' ? globalThis : window, function () {
  const preferences = new Map();
  const temporary = error => ['AbortError', 'TypeError'].includes(error.name) || [502, 503, 504].includes(error.status);

  function endpointsFor(address) {
    const url = new URL(address);
    if (url.protocol !== 'https:' || url.username || url.password) throw new Error('آدرس اتصال سامانه معتبر نیست');
    const endpoints = [url.href];
    const project = /^([a-z]{20})\.supabase\.co$/.exec(url.hostname);
    const route = /^\/functions\/v1\/([a-z0-9-]+)$/.exec(url.pathname);
    if (project && route && !url.port && !url.search && !url.hash) endpoints.push('https://' + project[1] + '.functions.supabase.co/' + route[1]);
    return endpoints;
  }

  function xhrResponse(endpoint, payload, binary, signal, timeout, Xhr) {
    return new Promise((resolve, reject) => {
      const xhr = new Xhr();
      let settled = false;
      const finish = (callback, value) => {
        if (settled) return;
        settled = true;
        signal.removeEventListener('abort', abort);
        callback(value);
      };
      const abortError = () => Object.assign(new Error('Request timed out'), { name: 'AbortError' });
      const abort = () => { xhr.abort(); finish(reject, abortError()); };
      xhr.open('POST', endpoint, true);
      xhr.withCredentials = false;
      xhr.timeout = timeout;
      xhr.responseType = binary ? 'blob' : 'text';
      xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded;charset=UTF-8');
      xhr.setRequestHeader('Accept', binary ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/json');
      xhr.onload = () => {
        if (!xhr.status || (xhr.responseURL && xhr.responseURL !== endpoint)) {
          finish(reject, new TypeError('Unexpected connection response'));
          return;
        }
        try {
          finish(resolve, new Response(xhr.response, { status: xhr.status, headers: { 'Content-Type': xhr.getResponseHeader('Content-Type') || '' } }));
        } catch (error) { finish(reject, error); }
      };
      xhr.onerror = () => finish(reject, new TypeError('Browser connection failed'));
      xhr.ontimeout = () => finish(reject, abortError());
      xhr.onabort = () => finish(reject, abortError());
      signal.addEventListener('abort', abort, { once: true });
      if (signal.aborted) { abort(); return; }
      // An ordinary form POST avoids relying on fetch or a custom request header.
      try { xhr.send(new URLSearchParams({ payload }).toString()); }
      catch (error) { finish(reject, error); }
    });
  }

  async function readResponse(response, binary) {
    const type = response.headers.get('Content-Type') || '';
    if (binary && response.ok && !type.includes('application/json')) {
      const blob = await response.blob();
      const signature = new Uint8Array(await blob.slice(0, 4).arrayBuffer());
      if (signature[0] !== 80 || signature[1] !== 75 || signature[2] !== 3 || signature[3] !== 4) throw new Error('فایل اکسل معتبر دریافت نشد');
      return blob;
    }
    let result;
    try { result = await response.json(); }
    catch { throw Object.assign(new Error('پاسخ معتبر از سامانه دریافت نشد؛ دوباره تلاش کنید'), { status: response.status }); }
    if (!response.ok || result?.ok !== true) throw Object.assign(new Error(result?.message || 'درخواست انجام نشد؛ دوباره تلاش کنید'), { status: response.status, code: result?.code });
    return result;
  }

  async function call(address, body, options = {}) {
    if (!address) throw new Error('اتصال سامانه هنوز فعال نشده است');
    const { binary = false, readActions = [], writeActions = [], fetchImpl = globalThis.fetch, xhrFactory = globalThis.XMLHttpRequest } = options;
    const endpoints = endpointsFor(address);
    const preferred = preferences.get(address);
    if (preferred && endpoints.includes(preferred.endpoint)) endpoints.sort((a, b) => Number(b === preferred.endpoint) - Number(a === preferred.endpoint));
    const modes = typeof xhrFactory === 'function' ? ['xhr', 'fetch'] : ['fetch'];
    if (preferred && modes.includes(preferred.mode)) modes.sort((a, b) => Number(b === preferred.mode) - Number(a === preferred.mode));
    const payload = JSON.stringify(body);
    const stableId = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.request_id || '');
    const canRetry = readActions.includes(body.action) || (stableId && writeActions.includes(body.action));
    const deadline = Date.now() + 60000;

    async function send(endpoint, mode, controller, timeout) {
      const timer = setTimeout(() => controller.abort(), timeout);
      try {
        const response = mode === 'xhr'
          ? await xhrResponse(endpoint, payload, binary, controller.signal, timeout, xhrFactory)
          : await fetchImpl(endpoint, {
            method: 'POST', mode: 'cors', credentials: 'omit', cache: 'no-store', redirect: 'error',
            referrerPolicy: 'no-referrer', signal: controller.signal,
            headers: { 'Content-Type': 'text/plain;charset=UTF-8', Accept: binary ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/json' },
            body: payload
          });
        const result = await readResponse(response, binary);
        preferences.set(address, { endpoint, mode });
        return result;
      } finally { clearTimeout(timer); }
    }

    try {
      if (body.action === 'health' && canRetry) {
        for (let i = 0; i < modes.length; i++) {
          const controllers = endpoints.map(() => new AbortController());
          try {
            return await Promise.any(endpoints.map((endpoint, index) => send(endpoint, modes[i], controllers[index], 20000)));
          } catch (error) {
            const reason = error.errors?.find(item => !temporary(item)) || error.errors?.[0] || error;
            if (i + 1 >= modes.length || !temporary(reason)) throw reason;
          } finally { controllers.forEach(controller => controller.abort()); }
        }
      }
      const attempts = modes.flatMap(mode => endpoints.map(endpoint => ({ endpoint, mode })));
      if (!canRetry) attempts.splice(1);
      for (let i = 0; i < attempts.length; i++) {
        const remaining = deadline - Date.now();
        if (remaining <= 0) throw Object.assign(new Error('Request timed out'), { name: 'AbortError' });
        const { endpoint, mode } = attempts[i];
        try { return await send(endpoint, mode, new AbortController(), Math.min(i === 0 ? 45000 : 15000, remaining)); }
        catch (error) { if (i + 1 >= attempts.length || !temporary(error)) throw error; }
      }
    } catch (error) {
      if (error.name === 'AbortError') throw Object.assign(new Error('پاسخ سرور دیر رسید. اطلاعات واردشده حفظ شده است؛ دوباره تلاش کنید'), { code: 'NETWORK_TIMEOUT' });
      if (error.name === 'TypeError') throw Object.assign(new Error('ارتباط با سرور برقرار نشد. اطلاعات واردشده حفظ شده است؛ اتصال اینترنت را بررسی و دوباره تلاش کنید'), { code: 'NETWORK_UNREACHABLE' });
      throw error;
    }
  }
  return { call };
});
