/* Academy pages use public HTTPS services and never require access to a LAN. */
(function () {
  "use strict";
  if (window.__ACADEMY_PUBLIC_NETWORK__?.version === 3) return;
  const nativeFetch = window.fetch.bind(window);
  const assetBase = new URL(".", document.currentScript.src);
  const localTimingURL = new URL("timing.json", assetBase);
  const rawTimingURL = "https://raw.githubusercontent.com/mofid-academy/mofid-academy.github.io/main/Academy-Exam/timing.json";
  let clockAnchor = null;

  // Preserve the browser's normal fetch and proxy handling. An explicit
  // targetAddressSpace can reject valid HTTPS requests routed through a proxy.

  function validateTiming(config) {
    if (!config || typeof config !== "object" || Array.isArray(config) ||
        typeof config.enabled !== "boolean" || !Number.isFinite(Number(config.durationMinutes)) ||
        Number(config.durationMinutes) < 1 || Number(config.durationMinutes) > 480) {
      throw Error("تنظیمات زمان‌بندی معتبر نیست.");
    }
    for (const key of ["openAt", "lastStartAt"]) {
      if (config[key] && (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(config[key]) ||
          !Number.isFinite(Date.parse(config[key] + ":00+03:30")))) {
        throw Error("تاریخ زمان‌بندی معتبر نیست.");
      }
    }
    if (Object.prototype.hasOwnProperty.call(config, "accessLock") &&
        (!config.accessLock || typeof config.accessLock !== "object" || Array.isArray(config.accessLock) ||
         config.accessLock.version !== 1 || typeof config.accessLock.locked !== "boolean")) {
      throw Error("وضعیت قفل آزمون معتبر نیست؛ دوباره تلاش کنید.");
    }
    return { ...config, durationMinutes: Number(config.durationMinutes) };
  }

  async function readConfig(url, timeout) {
    const requestURL = new URL(url);
    requestURL.searchParams.set("live", Date.now() + "-" + Math.random().toString(36).slice(2));
    const response = await nativeFetch(requestURL.href, {
      cache: "no-store", credentials: "omit", referrerPolicy: "no-referrer",
      signal: AbortSignal.timeout(timeout)
    });
    if (!response.ok) throw Error("خواندن زمان‌بندی تازه ناموفق بود؛ دوباره تلاش کنید.");
    const config = validateTiming(await response.json());
    const date = Date.parse(response.headers.get("Date") || "");
    const age = Number(response.headers.get("Age") || 0);
    const epoch = Number.isFinite(date) ? date + (Number.isFinite(age) && age >= 0 ? age * 1000 : 0) : null;
    return { config, epoch };
  }

  function timedConfig(source, clock) {
    if (clock?.epoch !== null && Number.isFinite(clock?.epoch)) {
      clockAnchor = { epoch: clock.epoch, at: performance.now() };
    }
    const serverEpoch = clockAnchor
      ? clockAnchor.epoch + Math.max(0, performance.now() - clockAnchor.at)
      : Date.now();
    return { ...source.config, serverEpoch };
  }

  async function readTiming({ localOnly = false } = {}) {
    const localRequest = readConfig(localTimingURL.href, 8000);
    if (localOnly) {
      const local = await localRequest;
      return timedConfig(local, local);
    }
    // Fresh raw data keeps schedule edits responsive; the same-origin copy is
    // available when that host is filtered or resolves into a private network.
    const [local, raw] = await Promise.allSettled([
      localRequest, readConfig(rawTimingURL, 5000)
    ]);
    const source = raw.status === "fulfilled" ? raw.value
      : local.status === "fulfilled" ? local.value : null;
    if (!source) throw Error("زمان‌بندی آزمون دریافت نشد؛ دوباره تلاش کنید.");
    return timedConfig(source, local.status === "fulfilled" ? local.value : source);
  }

  window.__ACADEMY_PUBLIC_NETWORK__ = Object.freeze({ version: 3, readTiming });
})();


