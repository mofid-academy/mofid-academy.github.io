'use strict';
(() => {
  const $ = selector => document.querySelector(selector);
  const tools = window.ZERO_REPEAT_CHALLENGES_TOOLS;
  const api = window.ZERO_REPEAT_CHALLENGES_API;
  const call = body => api.call(window.ZERO_REPEAT_CHALLENGES_CONFIG?.apiUrl, body);
  const fa = value => Number(value).toLocaleString('fa-IR');
  const date = new Intl.DateTimeFormat('fa-IR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Tehran' });
  let token = '';
  let entries = [];
  let filtered = [];
  let complete = false;
  let generation = 0;
  let loading = false;
  let deleting = '';

  function showError(target, message) { $(target).textContent = message; $(target).hidden = !message; }
  function updateExportButtons() {
    $('#export-all').disabled = !complete || loading || Boolean(deleting) || entries.length === 0;
    $('#export-filtered').disabled = !complete || loading || Boolean(deleting) || filtered.length === 0;
  }
  function filters() { return { query: $('#search-filter').value, challenge: $('#challenge-filter').value, department: $('#department-filter').value, jobTitle: $('#job-filter').value }; }
  function buildOptions(id, values, defaultLabel, emptyOption = false) {
    const select = $(id), previous = select.value;
    select.replaceChildren(new Option(defaultLabel, ''));
    for (const value of [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, 'fa'))) select.add(new Option(value, value));
    if (emptyOption) select.add(new Option('سمت وارد نشده', '__empty__'));
    select.value = [...select.options].some(option => option.value === previous) ? previous : '';
  }
  function render() {
    filtered = tools.filterEntries(entries, filters());
    const body = $('#entry-rows');
    const fragment = document.createDocumentFragment();
    filtered.forEach((entry, i) => {
      const row = document.createElement('tr');
      const values = [fa(i + 1), entry.full_name, entry.username, entry.department, entry.job_title || '—', tools.challengeNames[entry.challenge_id] || '—', Number.isFinite(Date.parse(entry.created_at)) ? date.format(new Date(entry.created_at)) : '—'];
      values.forEach((value, j) => {
        const cell = document.createElement('td');
        if (j === 1) cell.className = 'person-name';
        if (j === 2) cell.dir = 'ltr';
        if (j === 5) { const pill = document.createElement('span'); pill.className = 'challenge-pill'; pill.textContent = value; cell.append(pill); }
        else cell.textContent = value;
        row.append(cell);
      });
      const actions = document.createElement('td');
      const remove = document.createElement('button');
      remove.type = 'button'; remove.className = 'button secondary delete-entry';
      remove.dataset.deleteEntry = entry.id;
      remove.textContent = deleting === entry.id ? 'در حال حذف…' : 'حذف';
      remove.setAttribute('aria-label', `حذف ثبت ${entry.full_name} (${entry.username}) برای چالش ${tools.challengeNames[entry.challenge_id] || ''}`);
      remove.disabled = !complete || loading || Boolean(deleting);
      actions.append(remove); row.append(actions);
      fragment.append(row);
    });
    body.replaceChildren(fragment);
    $('#empty-state').hidden = filtered.length > 0 || loading;
    $('#table-count').textContent = loading ? 'در حال دریافت همهٔ ثبت‌ها…' : `${fa(filtered.length)} ثبت در این نما از ${fa(entries.length)} ثبت‌نام`;
    updateExportButtons();
  }
  function updateStats() {
    $('#stat-total').textContent = fa(entries.length);
    $('#stat-one').textContent = fa(entries.filter(entry => entry.challenge_id === 1).length);
    $('#stat-two').textContent = fa(entries.filter(entry => entry.challenge_id === 2).length);
    $('#stat-departments').textContent = fa(new Set(entries.map(entry => tools.normalize(entry.department)).filter(Boolean)).size);
  }
  function logout(message = '') {
    generation++; token = ''; entries = []; filtered = []; complete = false; loading = false; deleting = '';
    $('#entry-rows').replaceChildren();
    $('#admin-panel').hidden = true; $('#login-panel').hidden = false; $('#logout-button').hidden = true;
    $('#login-form').reset(); $('#admin-secret').type = 'password';
    $('#toggle-password').textContent = 'نمایش'; $('#toggle-password').setAttribute('aria-pressed', 'false'); $('#toggle-password').setAttribute('aria-label', 'نمایش رمز مدیریت');
    showError('#login-error', message);
    $('#admin-username').focus();
  }
  async function loadEntries() {
    if (!token || loading || deleting) return;
    const current = ++generation;
    loading = true; complete = false;
    entries = []; filtered = []; $('#entry-rows').replaceChildren();
    $('#refresh-button').disabled = true;
    $('#admin-status').textContent = 'در حال دریافت همهٔ ثبت‌نام‌ها…'; $('#admin-status').hidden = false;
    showError('#admin-error', ''); render();
    try {
      const result = await api.loadAllEntries(body => {
        if (current !== generation) throw new Error('نشست مدیریت بسته شد.');
        return call(body);
      }, token);
      if (current !== generation) return;
      entries = result; complete = true;
      buildOptions('#department-filter', entries.map(entry => entry.department), 'همهٔ واحدها');
      buildOptions('#job-filter', entries.map(entry => entry.job_title), 'همهٔ سمت‌ها', entries.some(entry => !entry.job_title));
      updateStats();
    } catch (error) {
      if (current !== generation) return;
      if (error.status === 401) { logout('نشست مدیریت پایان یافته است؛ دوباره وارد شوید.'); return; }
      showError('#admin-error', error.message);
      ['#stat-total', '#stat-one', '#stat-two', '#stat-departments'].forEach(id => { $(id).textContent = '—'; });
    } finally {
      if (current === generation) {
        loading = false; $('#refresh-button').disabled = false; $('#admin-status').hidden = true; render();
      }
    }
  }
  async function deleteEntry(id) {
    if (!token || !complete || loading || deleting) return;
    const entry = entries.find(item => item.id === id);
    if (!entry) return;
    const challenge = tools.challengeNames[entry.challenge_id] || '';
    if (!window.confirm(`ثبت «${entry.full_name}» با نام سازمانی «${entry.username}» برای چالش «${challenge}» حذف شود؟\nاین ردیف از فهرست ثبت‌نام‌ها و خروجی‌های اکسل بعدی حذف می‌شود.`)) return;
    const current = generation;
    deleting = id; $('#refresh-button').disabled = true;
    showError('#admin-error', '');
    $('#admin-status').textContent = 'در حال حذف ثبت انتخاب‌شده…'; $('#admin-status').hidden = false;
    render();
    try {
      const result = await call({ action: 'admin_delete', token, id });
      if (current !== generation) return;
      if (result.deleted?.id !== id || !Number.isFinite(Date.parse(result.deleted?.deleted_at))) throw new Error('حذف تأیید نشد؛ فهرست را به‌روزرسانی و دوباره تلاش کنید.');
      entries = entries.filter(item => item.id !== id);
      buildOptions('#department-filter', entries.map(item => item.department), 'همهٔ واحدها');
      buildOptions('#job-filter', entries.map(item => item.job_title), 'همهٔ سمت‌ها', entries.some(item => !item.job_title));
      updateStats();
      $('#admin-status').textContent = `ثبت ${entry.full_name} حذف شد.`;
    } catch (error) {
      if (current !== generation) return;
      if (error.status === 401) { logout('نشست مدیریت پایان یافته است؛ دوباره وارد شوید.'); return; }
      $('#admin-status').hidden = true; showError('#admin-error', error.message);
    } finally {
      if (current === generation) { deleting = ''; $('#refresh-button').disabled = false; render(); }
    }
  }
  function exportRows(all) {
    if (!complete || loading || deleting) return;
    const rows = all ? entries : filtered;
    if (!rows.length) return;
    const currentFilters = filters();
    const scope = all ? 'همهٔ ثبت‌نام‌ها' : ['نمای فیلترشده', currentFilters.query && 'جست‌وجو: ' + currentFilters.query, currentFilters.challenge && tools.challengeNames[currentFilters.challenge], currentFilters.department, currentFilters.jobTitle === '__empty__' ? 'سمت وارد نشده' : currentFilters.jobTitle].filter(Boolean).join(' · ');
    try {
      const blob = new Blob([tools.buildXlsx(rows, { scope })], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob), link = document.createElement('a');
      const filenameDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tehran', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
      link.href = url; link.download = `Zero-Repeat-Challenges-${all ? 'All' : 'Filtered'}-${filenameDate}.xlsx`;
      document.body.append(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      showError('#admin-error', '');
    } catch { showError('#admin-error', 'فایل اکسل ساخته نشد؛ دوباره تلاش کنید.'); }
  }
  $('#login-form').addEventListener('submit', async event => {
    event.preventDefault();
    const button = $('#login-button');
    if (button.disabled || !$('#login-form').reportValidity()) return;
    button.disabled = true; button.textContent = 'در حال ورود…'; showError('#login-error', '');
    try {
      const result = await call({ action: 'admin_login', username: $('#admin-username').value.trim().toLowerCase(), secret: $('#admin-secret').value });
      if (typeof result.token !== 'string' || !result.token) throw new Error('ورود به مدیریت تأیید نشد.');
      token = result.token; $('#admin-secret').value = '';
      $('#login-panel').hidden = true; $('#admin-panel').hidden = false; $('#logout-button').hidden = false;
      $('#refresh-button').focus();
      await loadEntries();
    } catch (error) { showError('#login-error', error.message); }
    finally { button.disabled = false; button.textContent = 'ورود به مدیریت چالش‌ها ←'; }
  });
  $('#logout-button').addEventListener('click', () => logout());
  $('#refresh-button').addEventListener('click', loadEntries);
  $('#entry-rows').addEventListener('click', event => {
    const button = event.target.closest('button[data-delete-entry]');
    if (button && $('#entry-rows').contains(button)) deleteEntry(button.dataset.deleteEntry);
  });
  $('#export-all').addEventListener('click', () => exportRows(true));
  $('#export-filtered').addEventListener('click', () => exportRows(false));
  $('#search-filter').addEventListener('input', render);
  ['#challenge-filter', '#department-filter', '#job-filter'].forEach(id => $(id).addEventListener('change', render));
  $('#clear-filters').addEventListener('click', () => { ['#search-filter', '#challenge-filter', '#department-filter', '#job-filter'].forEach(id => { $(id).value = ''; }); render(); });
  $('#toggle-password').addEventListener('click', () => {
    const show = $('#admin-secret').type === 'password';
    $('#admin-secret').type = show ? 'text' : 'password';
    $('#toggle-password').textContent = show ? 'پنهان' : 'نمایش';
    $('#toggle-password').setAttribute('aria-pressed', String(show));
    $('#toggle-password').setAttribute('aria-label', show ? 'پنهان کردن رمز مدیریت' : 'نمایش رمز مدیریت');
  });
})();

