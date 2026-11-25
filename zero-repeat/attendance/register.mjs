import {call} from './api.mjs?v=20261125.1';

const $ = selector => document.querySelector(selector);
const preview = new URLSearchParams(location.search).get('preview') === '1';
const form = $('#mentor-form');
const button = $('#submit-button');
const error = $('#form-error');
let pending = null;
let submitting = false;
let completed = false;

$('#preview-note').hidden = !preview;

function updateControls() {
  for (const input of form.querySelectorAll('input')) input.disabled = !!pending;
  button.disabled = submitting || completed;
  button.firstElementChild.textContent = submitting ? 'در حال ثبت…' : pending ? 'تلاش دوباره برای ثبت' : 'ثبت پاسخ';
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  if (submitting || completed || (!pending && !form.reportValidity())) return;

  if (!pending) {
    const fields = new FormData(form);
    const choice = fields.get('mentor_choice');
    if (choice !== 'yes' && choice !== 'no') return;
    pending = {
      request_id: crypto.randomUUID(),
      data: {
        full_name: String(fields.get('full_name')).trim(),
        username: String(fields.get('username')).trim().toLowerCase(),
        wants_mentor: choice === 'yes'
      }
    };
  }

  const {data, request_id} = pending;
  submitting = true;
  error.hidden = true;
  updateControls();
  try {
    const {receipt} = preview
      ? {receipt: {id: request_id, wants_mentor: data.wants_mentor, created_at: new Date().toISOString()}}
      : await call({action: 'mentor_submit', ...pending});
    if ((!preview && receipt?.stored !== true) || receipt?.id !== request_id ||
      receipt.wants_mentor !== data.wants_mentor || !Number.isFinite(Date.parse(receipt.created_at))) {
      throw Error('ثبت پاسخ تأیید نشد. دوباره تلاش کنید.');
    }

    completed = true;
    form.hidden = true;
    $('#receipt-title').textContent = preview ? 'پیش‌نمایش رسید، بدون ذخیره' : 'پاسخ شما ثبت شد';
    $('#receipt-summary').textContent = data.full_name + '، انتخاب شما «' +
      (receipt.wants_mentor ? 'منتور می‌خواهم' : 'منتور نمی‌خواهم') + '» است.';
    $('#receipt-time').textContent = new Intl.DateTimeFormat('fa-IR', {
      dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Tehran'
    }).format(new Date(receipt.created_at));
    $('#receipt-id').textContent = receipt.id;
    const receiptElement = $('#receipt');
    receiptElement.hidden = false;
    receiptElement.focus();
  } catch (err) {
    error.hidden = false;
    error.textContent = err.message;
    if (err.status === 400 || err.status === 409) {
      pending = null;
    } else {
      // Keep the request ID and answer if the write may have succeeded.
      error.textContent += ' برای دریافت تأیید همین ثبت، دوباره تلاش کنید.';
    }
  } finally {
    submitting = false;
    updateControls();
  }
});
