# هم‌صدا | نظرسنجی زنده نمایشگاه ۱۴۰۵

Three public entry points under `/expo1405/`:

- `index.html`: participant entry; names are optional.
- `host.html`: moderator panel. Requires the independently delivered moderator key.
- `screen.html`: movie-style live name/answer credits, optional chart view, pause and speed controls, and participant QR code.
- `screen.html?demo=credits`: clearly labeled fictional preview; it does not call the live voting backend.

## Architecture

The frontend is static GitHub Pages. Supabase Edge Function `expo1405-api` authenticates moderator and participant requests. Database transactions serialize votes and moderator actions on the room row. Future questions, moderator key hashes, participant records, tokens, and raw votes are inaccessible to public API roles. Only `expo1405_public` permits public reads and Realtime subscriptions; it contains the current question, aggregate counts, and a sanitized name/answer feed for that question.

The client subscribes to Postgres Changes and also refreshes the current snapshot every eight seconds for recovery. Actual question text and moderator secrets are never embedded in the frontend or repository. Initial questions were seeded directly into the private database. The separately labeled demo contains fictional names and a fictional illustrative question.

`backend/schema.sql` documents the initial schema; `backend/credits.sql` is the append-only credits upgrade. The deployed initial schema was applied with `expo1405_live_poll_initial`; the credits upgrade is `expo1405_live_movie_credits`. Do not replay applied upgrades. The Edge Function uses the runtime-owned Supabase secret key; never copy a service key into `config.mjs`. The browser key is a publishable key.

## Operation

1. Open the moderator link privately. Open `screen.html` on the hall display.
2. Share only the participant URL or the QR code.
3. Open a question from the moderator queue. Participants receive it immediately.
4. Close voting, discuss the results, and open the next question.
5. Download the CSV report. Start a new round to archive results and edit previously answered questions.

One browser session can submit one answer per question per round. This is not a verified one-person-one-vote identity system. A new browser profile can obtain another session. Public name display requires the participant's explicit `share_on_screen` preference; its default is false, including for all previously stored participants. Without opt-in, the feed uses “شرکت‌کنندهٔ ناشناس”. Participants can change this preference for their current-round answers without obtaining a new voting session. Changing to anonymous immediately updates the feed. No phone number or email is collected.

The credits feed contains only the active question's latest 300 responses, ordered by recording time. It contains a vote-specific opaque ID, public display label, and answer text; it never includes participant IDs, tokens, or unreleased questions. Credits are appended without restarting the moving rows, reset when the question changes, and repeat after the queue drains. Fresh responses take priority over replayed rows. Reduced-motion users receive a static scrollable list.

Editing an answered question requires a new round. Each recorded vote stores its question and answer text so later edits cannot rewrite old reports. Round reset retains historical records and reporting.

Design target: approximately 100 simultaneous participants. Actual capacity depends on the hosting plan and the event network; validation records describe the checks performed, not a guaranteed venue load.

## Dependencies

- Supabase JS: pinned browser bundle, version recorded in `vendor/README.md`.
- QR Code Generator: pinned local bundle, version recorded in `vendor/README.md`.
- Existing Academy Pinar font and logo are copied by their existing repository blob SHAs.

All runtime frontend assets are served from the same site.
