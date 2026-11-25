import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createApi, createHandler, createStore, normalizeEntry} from '../backend/core.mjs';
import {loadEntries} from '../api.mjs';
import {filterEntries, summarizeEntries, buildXlsx} from '../report.mjs';
import {unzipStored, decode} from '../../../Instructor-Survey/zip.mjs';

const id = '3c8db20b-99af-4ea7-a111-cd610479f8cb';
const entry = {full_name: 'کاربر آزمایشی', username: 'Example.Test', wants_mentor: true};
const time = '2026-11-25T06:00:00.123456+00:00';
const secret = 'synthetic-admin-password';
const config = {
  adminUsername: 'test.admin',
  adminKeyHash: createHash('sha256').update(secret).digest('hex'),
  signingKey: 'synthetic-signing-key-for-test-only'
};

function fixture() {
  const calls = [];
  const db = async (action, args) => {
    calls.push({action, args});
    if (action === 'rate') return {allowed: true};
    if (action === 'mentor_submit') {
      return {stored: true, id: args.id, wants_mentor: args.wants_mentor, created_at: time};
    }
    if (action === 'mentor_list' || action === 'list') return {entries: [], total: 0};
    if (action === 'mentor_assign') {
      return {id: args.id, mentor_name: args.mentor_name, assignment_revision: args.assignment_revision + 1, assigned_at: time};
    }
    if (action === 'mentor_delete') return {id: args.id, deleted_at: time};
    throw Error(action);
  };
  let now = Date.parse(time);
  return {api: createApi({db, config, now: () => now}), calls, expire: () => {now += 7200001;}};
}

test('the form accepts an explicit yes or no, and requires the name and organizational username', () => {
  for (const wants_mentor of [true, false]) {
    assert.deepEqual(normalizeEntry({...entry, wants_mentor}), {...entry, username: 'example.test', wants_mentor});
  }
  for (const wants_mentor of [undefined, null, 'no', 'false', 0]) {
    assert.throws(() => normalizeEntry({...entry, wants_mentor}), /منتور/);
  }
  for (const username of [undefined, ' ', 'user@example.test']) {
    assert.throws(() => normalizeEntry({...entry, username}), /نام سازمانی/);
  }
  assert.throws(() => normalizeEntry({...entry, full_name: '  '}));
});

test('both choices receive receipts and the same request retains the same fingerprint on retry', async () => {
  const {api, calls} = fixture();
  const request = {action: 'mentor_submit', request_id: id, data: {...entry, wants_mentor: false, mentor_name: 'Ignore'}};
  const first = await api.handle(request);
  assert.deepEqual(first, await api.handle(request));
  assert.equal(first.receipt.wants_mentor, false);
  const submissions = calls.filter(call => call.action === 'mentor_submit').map(call => call.args);
  assert.equal(submissions[0].fingerprint, submissions[1].fingerprint);
  const positive = await api.handle({...request, request_id: 'ef8ab55d-6448-42c0-94a2-6cd597c4ec47', data: entry});
  assert.equal(positive.receipt.wants_mentor, true);
  assert.notEqual(submissions[0].fingerprint, calls.at(-1).args.fingerprint);
  assert.equal('mentor_name' in submissions[0], false);
});

test('legacy attendance writes are retired and administrator operations require a signed session', async () => {
  const {api, calls, expire} = fixture();
  await assert.rejects(api.handle({action: 'submit', request_id: id, data: entry}), {status: 409, code: 'FORM_REPLACED'});
  for (const action of ['admin_entries', 'admin_mentor_entries', 'admin_mentor_assign', 'admin_mentor_delete']) {
    await assert.rejects(api.handle({action, id, confirm: true}), {status: 401});
  }
  assert.equal(calls.length, 0);
  await assert.rejects(api.handle({action: 'admin_login', username: 'test.admin', secret: 'incorrect'}), {status: 401});
  const {token} = await api.handle({action: 'admin_login', username: 'TEST.ADMIN', secret});
  await assert.rejects(api.handle({action: 'admin_mentor_entries', token: token + 'x'}), {status: 401});
  await api.handle({action: 'admin_mentor_entries', token, offset: 250, snapshot: time});
  assert.deepEqual(calls.at(-1), {action: 'mentor_list', args: {offset: 250, snapshot: time}});
  await assert.rejects(api.handle({action: 'admin_mentor_delete', token, id}), {status: 400});
  assert.equal((await api.handle({action: 'admin_mentor_delete', token, id, confirm: true})).deleted.id, id);
  expire();
  await assert.rejects(api.handle({action: 'admin_mentor_entries', token}), {status: 401});
});

test('the admin assigns only the selected request and submits its revision to avoid overwriting another edit', async () => {
  const {api, calls} = fixture();
  const {token} = await api.handle({action: 'admin_login', username: 'test.admin', secret});
  const request = {action: 'admin_mentor_assign', token, id, mentor_name: '   منتور آزمایشی   ', assignment_revision: 2};
  const {assignment} = await api.handle(request);
  assert.deepEqual(calls.at(-1), {
    action: 'mentor_assign', args: {id, mentor_name: 'منتور آزمایشی', assignment_revision: 2}
  });
  assert.equal(assignment.assignment_revision, 3);
  await assert.rejects(api.handle({...request, assignment_revision: undefined}), {status: 400});
});

test('HTTP rejects invalid origins, missing choices and malformed requests before storage', async () => {
  const {api, calls} = fixture();
  const handler = createHandler(api);
  const req = (body, origin = 'https://mofid-academy.github.io') => new Request('https://example.test', {
    method: 'POST', headers: {Origin: origin, 'Content-Type': 'application/json'}, body
  });
  assert.equal((await handler(req('{}', 'https://other.example'))).status, 403);
  assert.equal((await handler(req('x'.repeat(13000)))).status, 413);
  assert.equal((await handler(req('{'))).status, 400);
  assert.equal((await handler(req(JSON.stringify({
    action: 'mentor_submit', request_id: id, data: {...entry, wants_mentor: undefined}
  })))).status, 400);
  assert.equal(calls.length, 0);
});

test('database errors are returned as errors instead of successful receipts or assignments', async () => {
  const db = createStore({
    url: 'https://example.test', key: 'sb_secret_synthetic', fetchImpl: async (url, options) => {
      assert.match(url, /zr_mentor_store$/);
      assert.equal(options.headers.Authorization, undefined);
      const {p_action} = JSON.parse(options.body);
      const message = p_action === 'assign' ? 'ASSIGNMENT_CHANGED' : 'temporary database failure';
      return Response.json({message}, {status: 400});
    }
  });
  await assert.rejects(db('mentor_assign'), {status: 409, code: 'ASSIGNMENT_CHANGED'});
  await assert.rejects(db('mentor_submit'), {status: 503});
});

const row = {
  id, full_name: 'علي كریمی', username: 'test.yes', wants_mentor: true,
  mentor_name: '', assignment_revision: 0, assigned_at: null, created_at: time
};
test('the report fetches every page and does not allow an incomplete export', async () => {
  const all = Array.from({length: 501}, (_, i) => ({...row, id: String(i)}));
  const actual = await loadEntries(async request => {
    if (request.offset > 0) assert.equal(request.snapshot, time);
    const entries = all.slice(request.offset, request.offset + 250);
    return {entries, total: all.length, snapshot: time, has_more: request.offset + 250 < all.length};
  }, 'test-token');
  assert.equal(actual.length, 501);
  await assert.rejects(loadEntries(async () => ({entries: [row], total: 2, snapshot: time, has_more: false}), 'test-token'));
});

test('filters distinguish no requests from unassigned requests, and Excel includes mentor text safely', () => {
  const assigned = {...row, id: 'assigned', mentor_name: '=HYPERLINK("https://example.test")', assigned_at: time};
  const no = {...row, id: 'no', wants_mentor: false};
  const entries = [row, assigned, no];
  assert.deepEqual(summarizeEntries(entries), {total: 3, yes: 2, no: 1, pending: 1, assigned: 1});
  assert.deepEqual(filterEntries(entries, {query: 'علی کریمی', assignment: 'pending'}), [row]);
  assert.deepEqual(filterEntries(entries, {request: 'no'}), [no]);
  assert.deepEqual(filterEntries(entries, {assignment: 'assigned'}), [assigned]);
  const files = unzipStored(buildXlsx(entries));
  const sheet = decode(files['xl/worksheets/sheet1.xml']);
  assert.match(sheet, /rightToLeft="1"/);
  assert.match(sheet, /منتور نمی‌خواهد/);
  assert.match(sheet, /نام منتور/);
  assert.match(sheet, /t="inlineStr"><is><t xml:space="preserve">=HYPERLINK/);
  assert.ok(!sheet.includes('<f>'));
});
