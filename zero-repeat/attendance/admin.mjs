import {call, loadEntries, requestLabel, requestLabels, assignmentLabels} from './api.mjs?v=20261125.1';
import {filterEntries, summarizeEntries, buildXlsx, formatDate} from './report.mjs?v=20261125.1';

const $ = selector => document.querySelector(selector);
const fa = value => Number(value).toLocaleString('fa-IR');
const assignmentDialog = $('#assignment-dialog');
const mentorNameField = $('#mentor-name');

let token = '';
let entries = [];
let filtered = [];
let loaded = false;
let loading = false;
let mutating = false;
let generation = 0;
let assignmentTarget = null;

function notice(id, message) {
  const element = $(id);
  element.textContent = message;
  element.hidden = !message;
}

function filters() {
  return {
    query: $('#search-filter').value.trim(),
    request: $('#request-filter').value,
    assignment: $('#assignment-filter').value
  };
}

function actionable() {
  return loaded && !loading && !mutating;
}

function actionButton(label, style, person, action, id) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'button ' + style;
  button.textContent = label;
  button.dataset.action = action;
  button.dataset.entryId = id;
  button.setAttribute('aria-label', label + ' برای ' + person);
  button.disabled = !actionable();
  return button;
}

function render() {
  filtered = filterEntries(entries, filters());
  const fragment = document.createDocumentFragment();
  for (const [i, entry] of filtered.entries()) {
    const row = document.createElement('tr');
    const mentor = entry.mentor_name || (entry.wants_mentor ? assignmentLabels.pending : '—');
    [fa(i + 1), entry.full_name, entry.username, requestLabel(entry), mentor, formatDate(entry.created_at)]
      .forEach((value, column) => {
        const cell = document.createElement('td');
        cell.textContent = value;
        if (column === 1) cell.className = 'person-name';
        if (column === 2) cell.dir = 'ltr';
        if (column === 4 && entry.wants_mentor && !entry.mentor_name) cell.className = 'mentor-pending';
        row.append(cell);
      });
    const actions = document.createElement('td');
    const buttons = document.createElement('div');
    buttons.className = 'response-actions';
    if (entry.wants_mentor) {
      const label = entry.mentor_name ? 'ویرایش منتور' : 'تخصیص منتور';
      buttons.append(actionButton(label, 'secondary', entry.full_name, 'assign', entry.id));
    }
    buttons.append(actionButton('حذف پاسخ', 'danger', entry.full_name, 'delete', entry.id));
    actions.append(buttons);
    row.append(actions);
    fragment.append(row);
  }
  $('#entry-rows').replaceChildren(fragment);

  const counts = summarizeEntries(entries);
  for (const [id, value] of Object.entries(counts)) {
    const stat = $('#stat-' + id);
    if (stat) stat.textContent = loaded ? fa(value) : '—';
  }

  const empty = $('#empty-state');
  empty.textContent = entries.length ? 'پاسخی مطابق فیلترها پیدا نشد.' : 'هنوز پاسخی ثبت نشده است.';
  empty.hidden = !loaded || !!filtered.length;
  $('#table-count').textContent = loaded
    ? fa(filtered.length) + ' پاسخ در این نما از ' + fa(entries.length) + ' پاسخ'
    : '';
  $('#refresh-button').disabled = loading || mutating;
  $('#export-button').disabled = !actionable() || !filtered.length;
}

function clearFilters() {
  for (const id of ['#search-filter', '#request-filter', '#assignment-filter']) $(id).value = '';
}

function logout(message = '') {
  generation++;
  token = '';
  entries = [];
  loaded = false;
  loading = false;
  mutating = false;
  assignmentTarget = null;
  if (assignmentDialog.open) assignmentDialog.close();
  $('#admin-panel').hidden = true;
  $('#login-panel').hidden = false;
  $('#login-form').reset();
  clearFilters();
  render();
  notice('#login-error', message);
  $('#admin-username').focus();
}

async function refresh() {
  if (!token || loading || mutating) return;
  const current = generation;
  const sessionToken = token;
  loading = true;
  loaded = false;
  entries = [];
  notice('#admin-error', '');
  notice('#admin-status', 'در حال دریافت پاسخ‌ها…');
  render();
  try {
    const rows = await loadEntries(body => {
      if (current !== generation) throw Error('نشست پایان یافته است.');
      return call(body);
    }, sessionToken);
    if (current !== generation) return;
    entries = rows;
    loaded = true;
  } catch (error) {
    if (current !== generation) return;
    if (error.status === 401) {
      logout('نشست مدیریت پایان یافته است. دوباره وارد شوید.');
      return;
    }
    notice('#admin-error', error.message);
  } finally {
    if (current === generation) {
      loading = false;
      notice('#admin-status', '');
      render();
    }
  }
}

$('#login-form').addEventListener('submit', async event => {
  event.preventDefault();
  const button = $('#login-button');
  if (button.disabled || !event.currentTarget.reportValidity()) return;
  button.disabled = true;
  button.textContent = 'در حال ورود…';
  notice('#login-error', '');
  try {
    const result = await call({
      action: 'admin_login', username: $('#admin-username').value.trim(), secret: $('#admin-secret').value
    });
    if (typeof result.token !== 'string' || !result.token) throw Error('ورود تأیید نشد.');
    token = result.token;
    $('#admin-secret').value = '';
    $('#login-panel').hidden = true;
    $('#admin-panel').hidden = false;
    $('#search-filter').focus();
    await refresh();
  } catch (error) {
    notice('#login-error', error.message);
  } finally {
    button.disabled = false;
    button.textContent = 'ورود به مدیریت';
  }
});

function openAssignment(entry) {
  assignmentTarget = entry;
  $('#assignment-title').textContent = entry.mentor_name ? 'ویرایش منتور' : 'تخصیص منتور';
  $('#assignment-participant').textContent = entry.full_name + ' (' + entry.username + ')';
  mentorNameField.value = entry.mentor_name;
  $('#clear-assignment').hidden = !entry.mentor_name;
  notice('#assignment-error', '');
  assignmentDialog.showModal();
}

async function saveAssignment(mentorName) {
  if (!actionable() || !assignmentTarget?.wants_mentor) return;
  const entry = assignmentTarget;
  const current = generation;
  mutating = true;
  for (const id of ['#mentor-name', '#save-assignment', '#clear-assignment', '#close-assignment']) $(id).disabled = true;
  notice('#assignment-error', '');
  notice('#admin-status', '');
  notice('#admin-error', '');
  render();
  try {
    const {assignment} = await call({
      action: 'admin_mentor_assign', token, id: entry.id,
      mentor_name: mentorName, assignment_revision: entry.assignment_revision
    });
    if (current !== generation) return;
    if (assignment?.id !== entry.id || assignment.mentor_name !== mentorName ||
      !Number.isSafeInteger(assignment.assignment_revision)) {
      throw Error('تخصیص منتور تأیید نشد. دوباره تلاش کنید.');
    }
    entries = entries.map(row => row.id === entry.id ? {...row, ...assignment} : row);
    assignmentDialog.close();
    notice('#admin-status', mentorName ? 'منتور ذخیره شد.' : 'تخصیص منتور برداشته شد.');
  } catch (error) {
    if (current !== generation) return;
    if (error.status === 401) {
      logout('نشست مدیریت پایان یافته است. دوباره وارد شوید.');
    } else if (error.code === 'ASSIGNMENT_CHANGED' || error.status === 404) {
      assignmentDialog.close();
      loaded = false;
      entries = [];
      notice('#admin-error', error.message);
    } else {
      notice('#assignment-error', error.message);
    }
  } finally {
    for (const id of ['#mentor-name', '#save-assignment', '#clear-assignment', '#close-assignment']) $(id).disabled = false;
    if (current === generation) {
      mutating = false;
      render();
      if (!assignmentDialog.open) $('#search-filter').focus();
    }
  }
}

async function removeEntry(entry) {
  if (!window.confirm('پاسخ «' + entry.full_name + '» (' + entry.username + ') از فهرست و خروجی اکسل حذف شود؟')) return;
  const current = generation;
  mutating = true;
  notice('#admin-error', '');
  notice('#admin-status', 'در حال حذف پاسخ…');
  render();
  try {
    const {deleted} = await call({action: 'admin_mentor_delete', token, id: entry.id, confirm: true});
    if (current !== generation) return;
    if (deleted?.id !== entry.id) throw Error('حذف تأیید نشد. فهرست را به‌روزرسانی کنید.');
    entries = entries.filter(row => row.id !== entry.id);
    notice('#admin-status', 'پاسخ حذف شد.');
  } catch (error) {
    if (current !== generation) return;
    if (error.status === 401) {
      logout('نشست مدیریت پایان یافته است. دوباره وارد شوید.');
      return;
    }
    notice('#admin-status', '');
    notice('#admin-error', error.message);
  } finally {
    if (current === generation) {
      mutating = false;
      render();
      $('#search-filter').focus();
    }
  }
}

$('#entry-rows').addEventListener('click', event => {
  const button = event.target.closest('button[data-action]');
  if (!button || !actionable()) return;
  const entry = entries.find(row => row.id === button.dataset.entryId);
  if (!entry) return;
  if (button.dataset.action === 'assign' && entry.wants_mentor) openAssignment(entry);
  if (button.dataset.action === 'delete') removeEntry(entry);
});
$('#assignment-form').addEventListener('submit', event => {
  event.preventDefault();
  const mentorName = mentorNameField.value.normalize('NFC').trim();
  if (!mentorName) {
    notice('#assignment-error', 'نام منتور را وارد کنید.');
    mentorNameField.focus();
    return;
  }
  saveAssignment(mentorName);
});
$('#clear-assignment').addEventListener('click', () => saveAssignment(''));
$('#close-assignment').addEventListener('click', () => assignmentDialog.close());
assignmentDialog.addEventListener('cancel', event => {
  if (mutating) event.preventDefault();
});
assignmentDialog.addEventListener('close', () => {assignmentTarget = null;});

$('#refresh-button').addEventListener('click', refresh);
$('#logout-button').addEventListener('click', () => logout());
$('#search-filter').addEventListener('input', render);
$('#request-filter').addEventListener('change', render);
$('#assignment-filter').addEventListener('change', render);
$('#clear-filters').addEventListener('click', () => {clearFilters(); render();});

$('#export-button').addEventListener('click', () => {
  if (!actionable() || !filtered.length) return;
  const {query, request, assignment} = filters();
  const scope = [requestLabels[request], assignmentLabels[assignment], query && 'جست‌وجو: ' + query].filter(Boolean).join(' · ');
  try {
    const bytes = buildXlsx(filtered, {scope: scope || 'همهٔ پاسخ‌ها'});
    const url = URL.createObjectURL(new Blob([bytes], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Zero-Repeat-Mentor-Requests.xlsx';
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  } catch {
    notice('#admin-error', 'ساخت فایل اکسل انجام نشد. دوباره تلاش کنید.');
  }
});
