# هم‌صدا | نظرسنجی زنده نمایشگاه ۱۴۰۵

Three public entry points under `/expo1405/`:

- `index.html`: participant entry; names are optional.
- `host.html`: moderator panel. Requires the independently delivered moderator key.
- `screen.html`: live hall display and participant QR code.

## Architecture

The frontend is static GitHub Pages. Supabase Edge Function `expo1405-api` authenticates moderator and participant requests. Database transactions serialize votes and moderator actions on the room row. Future questions, moderator key hashes, participant names, tokens, and individual votes are inaccessible to public API roles. Only `expo1405_public` permits public reads and Realtime subscriptions; it contains the current question and aggregate counts.

The client subscribes to Postgres Changes and also refreshes the current snapshot every eight seconds for recovery. No sample question text or moderator secret is included in the frontend or repository. Sample questions are seeded directly into the private database.

`backend/schema.sql` documents the initial schema. It was applied with the `expo1405_live_poll_initial` migration; do not replay it against an initialized database. The Edge Function uses the runtime-owned Supabase secret key; never copy a service key into `config.mjs`. The browser key is a publishable key.

## Operation

1. Open the moderator link privately. Open `screen.html` on the hall display.
2. Share only the participant URL or the QR code.
3. Open a question from the moderator queue. Participants receive it immediately.
4. Close voting, discuss the results, and open the next question.
5. Download the CSV report. Start a new round to archive results and edit previously answered questions.

One browser session can submit one answer per question per round. This is not a verified one-person-one-vote identity system. A new browser profile can obtain another session. Participant names are recorded only for moderator reports; names are not shown on the public chart. No phone number or email is collected.

Editing an answered question requires a new round. Each recorded vote stores its question and answer text so later edits cannot rewrite old reports. Round reset retains historical records and reporting.

Design target: approximately 100 simultaneous participants. Actual capacity depends on the hosting plan and the event network; validation records describe the checks performed, not a guaranteed venue load.

## Dependencies

- Supabase JS: pinned browser bundle, version recorded in `vendor/README.md`.
- QR Code Generator: pinned local bundle, version recorded in `vendor/README.md`.
- Existing Academy Pinar font and logo are copied by their existing repository blob SHAs.

All runtime frontend assets are served from the same site.
