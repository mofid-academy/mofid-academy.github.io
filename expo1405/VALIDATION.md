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

## Class reopening and reversible deletion — 2026-11-09

- 34 API/unit checks passed, including typed confirmation, cancellation without a request, wrong-name rejection, trash separation, deleted-link HTTP 410, root authentication when every class is deleted, and recovery navigation.
- Rollback-only lifecycle assertions passed using service_role: reopening preserves the round and responses; deletion requires the matching name; deleted classes reject joins, duplicate votes and host actions; repeated deletion/restoration is safe; restoration clears public/display tombstones and preserves question IDs and complete response reports. Root class recovery also preserves authentication hashes and reports.
- No real class was deleted, reopened or reset during testing. Existing classes and responses remain in their original states.
- HTML structure, IDs and UI bindings passed. Database advisory output contains informational RLS-without-policy findings for intentionally service-only tables. No public grants were added.

## Panel terminology — 2026-11-09

All Persian interface labels, dialogs, notifications, QR labels, server error messages and workbook headings now use «پنل». Newly generated titles use the same term. Existing automatically numbered class titles are renamed; custom names, IDs, URLs, credentials, questions and responses are preserved.

## Mofid artwork and Pinar VF entries — 2026-11-09

- Existing 34 role, privacy, consent, lifecycle and Excel checks passed.
- Participant, moderator, admin and display forms retain their original element IDs and handlers. HTML structure and unique-ID checks passed.
- Pinar-VF font family and its DSTY, wght and KSHD axes were inspected. Supplied artwork retains its alpha channel and is served locally as WebP.
- Scene switching changes presentation text/artwork only. No backend, database schema, answers or panel identifiers were changed.

## Uploaded Pinar VF font — 2026-11-09

The provided TTF is copied byte for byte and referenced directly as `Pinar VF` in shared and entry CSS. Font metadata reports Pinar-VF Version 3.0, variable weight 300–900, DSTY and KSHD axes. All three documents preload the same content-hashed font URL and use v11 stylesheets. Font integrity, CSS references, unique IDs and deployment are checked; application behavior is unchanged.

## Compact question cards — 2026-11-09

- The five introductory tabs, scene controls and full-size entry artwork are removed from participant, host, admin and display HTML. Original form markup and IDs remain.
- All 34 existing role, privacy, consent, class lifecycle and Excel checks pass.
- The actual participant, host and display render functions were exercised for 12 question positions: exactly one current-question image, escaped question titles, consistent local asset paths, and preserved open, voted and closed option states. Waiting states do not add a question illustration.
- Images use fixed contained boxes of 144 px on desktop, 104 px on mobile and 88 px on the narrowest screens. No question API, Supabase data, identifiers or authentication changes were made. The uploaded Pinar VF font remains byte-identical.
- Optional read-only mobile/web preview markup is generated from the participant render function using a synthetic question; preview pages cannot connect to the API.

## QR display and shiny options — 2026-11-09

- TypeScript checking and the Vite production build passed. Shared local assets are copied into the published assets directory.
- All 38 tests pass, including independent decoding of rasterized QR links for two different panels, a white quiet zone, cache reuse across refreshes, replacement when switching panels, and clearing the previous URL without destroying the React-owned card.
- The 34 existing privacy, owner-only export, participant consent and panel lifecycle checks remain green. No backend or database changes were made.
- HTML structure and unique IDs passed. New QR UI is included only in host, hall and preview documents. The Pinar VF source file remains byte-identical, and the native PNG fallback now uses the same CSS family name.
- The actual participant renderer still preserves one contained illustration, escaped question text and open/voted/closed option states. Shiny styles respect reduced motion and native focus.

## Mobile gradient options and day/night backgrounds — 2026-11-09

- TypeScript checking and the Vite production build passed. All 42 automated checks passed, including QR decoding, authentication boundaries, participant consent and panel lifecycle checks.
- Four graphics-lifecycle checks cover a no-WebGL CSS fallback, bounded phone pixel count, 18 fps throttling, pausing while hidden, reduced motion, context loss and cleanup. These are simulated WebGL checks, not a benchmark of physical devices.
- Original form identifiers and the supplied Pinar VF font remain in place. The real participant renderer retains one current-question image and preserves question and option escaping, open/voted/closed states and private result boundaries.
- Previous v13 asset filenames are retained for clients that still have cached documents. The v14 participant entry has no QR bundle.
