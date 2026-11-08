# Validation — 2026-11-08

Passed checks against the deployed Supabase API:

- Anonymous moderator access rejected.
- Publishable key denied access to questions, room credentials, participant records, individual votes, and moderator RPCs.
- Waiting page contained no question text; opening a question exposed only that question.
- 100 participant sessions submitted 100 votes concurrently; counts and per-option totals matched exactly. This burst completed in 13.39 seconds over the test network.
- Duplicate submission did not change the count or replace the original vote.
- Votes for closed or future questions were rejected.
- Editing an answered question in the same round was rejected.
- Server-enforced deadline rejected an expired vote.
- Three independent Realtime subscribers received aggregate snapshots; no participant name or credential was included.
- CSV export contained the header and all 100 recorded votes.
- Frontend JS parsed successfully; HTML had unique IDs and all referenced local assets were present.

Synthetic participant records and votes were archived in a private, isolated QA room and excluded from the delivered live room. Initial state: six sample questions, optional names, round 1, waiting, zero participants, zero votes.

The test exercised 100 concurrent vote submissions and three live subscribers, not 100 physical devices on the venue Wi-Fi. Identity is browser-session based; it does not establish one verified human per vote.


## Live credits upgrade — 2026-11-08

- Five API regression tests passed: legacy-client consent defaults, strict boolean opt-in, and authenticated profile changes.
- Transactional database assertions passed for private names, opted-in name/answer pairs, anonymous policy, withdrawal, future-question isolation, and clearing the feed on a question change. Test fixtures were rolled back.
- The existing isolated 100-vote QA fixture produced 100 sanitized credits within a 128 KB payload budget; the live room was unchanged.
- Frontend syntax and local-asset/HTML checks passed.
- No new security warnings were reported; service-only tables intentionally have no public policies.

## Private admin, display-only results, Aurora and themes — 2026-11-08

- Sixteen current API/unit checks passed, including denial of archives and exports to moderators, protected display activation, and removal of results from participant and moderator state.
- Rollback-only database assertions passed: votes do not change public-state revisions, raw tables and report RPCs deny public roles, and private display/report data remain available to their authorized endpoints.
- Read-only checks against the deployed API passed. The owner export contained six question worksheets plus summary and all eight responses present at verification time. The workbook loaded successfully in openpyxl.
- A synthetic export preserved an unanswered question worksheet, RTL views, filters, and names beginning with `=` as plain text.
- The React/TypeScript/Tailwind build passed. Production assets contain no Node environment references and need no external runtime assets.
- RLS advisories for service-only tables are informational; no public policies were added to private response tables.
- Supabase organization membership could not be audited through the available management tool; account-level administrator access was not changed.

## Independent classes — 2026-11-08

- Twenty-four API/unit checks passed, including class-scoped URLs/storage, root-code authentication, class-only reports and display-token rejection across classes.
- `tests/classes.sql` passed with service_role and rollback-only fixtures: same-question and blank classes, safe creation retries, zero copied activity, independent question IDs, cross-class identity/question rejection, class-only display/export, protected directory, and unchanged original votes/questions/phase.
- React/TypeScript build and HTML/binding checks passed. The introductory slogans are absent from participant and display pages.
- One actual next class was prepared with six copied questions, no responses and phase waiting. The original class remained open. No test votes were added to either delivered class.
