export const API_URL = 'https://siwmzffadbbhcyyppwzn.supabase.co/functions/v1/zero-repeat-attendance-api';

export const requestLabels = Object.freeze({yes: 'منتور می‌خواهد', no: 'منتور نمی‌خواهد'});
export const assignmentLabels = Object.freeze({pending: 'در انتظار تخصیص', assigned: 'تخصیص‌یافته'});
export const requestLabel = entry => requestLabels[entry.wants_mentor ? 'yes' : 'no'];

export async function call(body, fetchImpl = fetch) {
  let response, result;
  try {
    response = await fetchImpl(API_URL, {
      method: 'POST',
      headers: {'Content-Type': 'application/json', Accept: 'application/json'},
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
      credentials: 'omit',
      cache: 'no-store'
    });
    result = await response.json();
  } catch {
    throw Error('ارتباط با سامانه برقرار نشد. اینترنت را بررسی کنید و دوباره تلاش کنید.');
  }
  if (!response.ok || result?.ok !== true) {
    const error = Error(result?.message || 'عملیات تأیید نشد. دوباره تلاش کنید.');
    error.status = response.status;
    error.code = result?.code;
    throw error;
  }
  return result;
}

export async function loadEntries(callApi, token) {
  const rows = new Map();
  let offset = 0, snapshot, total;
  while (true) {
    const page = await callApi({action: 'admin_mentor_entries', token, offset, ...(snapshot ? {snapshot} : {})});
    if (!Array.isArray(page.entries) || !Number.isSafeInteger(page.total) || page.total < 0 ||
      typeof page.has_more !== 'boolean' || !Number.isFinite(Date.parse(page.snapshot))) {
      throw Error('گزارش کامل دریافت نشد. دوباره تلاش کنید.');
    }
    if (total === undefined) {
      total = page.total;
      snapshot = page.snapshot;
    }
    if (total !== page.total || page.snapshot !== snapshot) {
      throw Error('فهرست هنگام دریافت تغییر کرد. دوباره آن را به‌روزرسانی کنید.');
    }
    for (const row of page.entries) {
      if (typeof row.id !== 'string' || typeof row.full_name !== 'string' || typeof row.username !== 'string' ||
        typeof row.wants_mentor !== 'boolean' || typeof row.mentor_name !== 'string' ||
        !Number.isSafeInteger(row.assignment_revision) || row.assignment_revision < 0 ||
        !Number.isFinite(Date.parse(row.created_at))) {
        throw Error('یکی از پاسخ‌ها معتبر نیست.');
      }
      rows.set(row.id, row);
    }
    offset += page.entries.length;
    if (!page.has_more) {
      if (rows.size !== total) throw Error('تمام پاسخ‌ها دریافت نشد. فهرست را به‌روزرسانی کنید.');
      return [...rows.values()];
    }
    if (!page.entries.length || offset > 100000) throw Error('گزارش کامل دریافت نشد. دوباره تلاش کنید.');
  }
}
