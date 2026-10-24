'use strict';
(() => {
  const $ = selector => document.querySelector(selector);
  const form = $('#registration-form');
  const submitButton = $('#submit-button');
  const apiUrl = window.ZERO_REPEAT_CHALLENGES_CONFIG?.apiUrl;
  const call = body => window.ZERO_REPEAT_CHALLENGES_API.call(apiUrl, body);
  const pendingKey = 'zero-repeat:challenges:pending:v1';
  const names = { 1: 'دیگه کپی‌پیست نکن!', 2: 'هیچ کاری رو فراموش نکن!' };
  let pending = null;
  let busy = false;

  function clearError() { $('#form-error').hidden = true; $('#form-error').textContent = ''; }
  function showError(message) { $('#form-error').textContent = message; $('#form-error').hidden = false; }
  function selectCards() {
    document.querySelectorAll('.challenge-card').forEach(card => {
      const selected = card.querySelector('input').checked;
      card.classList.toggle('selected', selected);
      card.querySelector('.select-label').textContent = selected ? 'چالش انتخاب‌شده ✓' : 'انتخاب این چالش ←';
    });
  }
  function readData() {
    const fields = new FormData(form);
    return {
      username: String(fields.get('username') || '').normalize('NFC').trim().toLowerCase(),
      full_name: String(fields.get('full_name') || '').normalize('NFC').trim(),
      department: String(fields.get('department') || '').normalize('NFC').trim(),
      job_title: String(fields.get('job_title') || '').normalize('NFC').trim(),
      challenge_id: Number(fields.get('challenge_id')),
      accepted: fields.get('accepted') === 'on'
    };
  }
  function persistPending() { try { sessionStorage.setItem(pendingKey, JSON.stringify(pending)); } catch { /* Retry identity remains in memory. */ } }
  function clearPending() { pending = null; try { sessionStorage.removeItem(pendingKey); } catch { /* Storage may be unavailable. */ } }
  function setBusy(value) {
    busy = value;
    for (const field of form.elements) field.disabled = value;
    submitButton.textContent = value ? 'در حال ثبت…' : 'ثبت اعلام آمادگی ←';
    form.setAttribute('aria-busy', String(value));
  }

  try {
    const saved = JSON.parse(sessionStorage.getItem(pendingKey));
    if (saved && /^[0-9a-f-]{36}$/i.test(saved.id) && saved.data && [1, 2].includes(saved.data.challenge_id)) {
      pending = saved;
      for (const [key, value] of Object.entries(saved.data)) {
        if (key === 'challenge_id') form.querySelector(`input[name="challenge_id"][value="${value}"]`).checked = true;
        else if (key === 'accepted') $('#accepted').checked = value === true;
        else if (['username', 'full_name', 'department', 'job_title'].includes(key) && typeof value === 'string') form.elements.namedItem(key).value = value;
      }
    }
  } catch { clearPending(); }
  selectCards();
  form.addEventListener('change', selectCards);
  form.addEventListener('input', clearError);
  $('#username').addEventListener('input', () => $('#username').setCustomValidity(''));
  $('#username').addEventListener('invalid', () => {
    if ($('#username').validity.patternMismatch) $('#username').setCustomValidity('نام سازمانی را مانند M.mirsheri و بدون ایمیل وارد کنید.');
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy || !form.reportValidity()) return;
    clearError();
    const data = readData();
    if (!data.full_name || !data.department || !data.username) { showError('نام، نام سازمانی و واحد سازمانی را تکمیل کنید.'); return; }
    if (!pending || JSON.stringify(pending.data) !== JSON.stringify(data)) {
      if (!globalThis.crypto?.randomUUID) { showError('برای ثبت‌نام، این صفحه را با یک مرورگر به‌روز و اتصال امن باز کنید.'); return; }
      pending = { id: crypto.randomUUID(), data };
      persistPending();
    }
    setBusy(true);
    try {
      const result = await call({ action: 'submit', request_id: pending.id, data: pending.data });
      if (result.receipt?.id !== pending.id || result.receipt.challenge_id !== data.challenge_id || !Number.isFinite(Date.parse(result.receipt.created_at))) {
        throw new Error('تأیید ثبت به‌درستی دریافت نشد؛ دوباره تلاش کنید.');
      }
      $('#success-message').textContent = `${data.full_name}، اعلام آمادگی شما برای چالش «${names[data.challenge_id]}» ثبت شد.`;
      $('#receipt-id').textContent = result.receipt.id;
      $('#receipt-time').textContent = new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Tehran' }).format(new Date(result.receipt.created_at));
      clearPending();
      form.hidden = true;
      $('#registration-success').hidden = false;
      $('#registration-success').focus();
      $('#registration-success').scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (error) {
      if (error.code === 'REQUEST_CONFLICT') clearPending();
      showError(error.message);
    } finally { setBusy(false); }
  });
  $('#new-registration').addEventListener('click', () => {
    clearPending(); form.reset(); clearError(); selectCards();
    $('#registration-success').hidden = true; form.hidden = false;
    form.querySelector('input[name="challenge_id"]').focus();
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  call({ action: 'health' }).then(result => {
    $('#connection-status').textContent = result.ready ? 'سامانه آمادهٔ ثبت است' : 'ثبت‌نام را می‌توانید دوباره امتحان کنید.';
    $('#connection-status').classList.toggle('ready', Boolean(result.ready));
  }).catch(() => { $('#connection-status').textContent = 'ارتباط موقتاً برقرار نیست؛ هنگام ثبت دوباره بررسی می‌شود.'; });
})();
