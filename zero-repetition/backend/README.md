# Private database API

The static UI stays on GitHub Pages. Supabase hosts PostgreSQL and the zero-repetition-api Edge Function. n8n is absent from the login, questionnaire, database, administration, and Excel path.

## Deploy

1. Select a dedicated Supabase project in the owner's account.
2. Apply supabase/migrations/202610170001_independent_storage.sql once using migrations. It creates only zr_ tables, enables RLS and revokes browser roles. Do not add anonymous policies.
3. Configure the server-only values from .env.example. The private setup bundle preserves the existing signing key and administrator hash. Platform database keys must never enter the frontend.
4. Deploy supabase/functions/zero-repetition-api/index.ts together with core.mjs. Keep verify_jwt=false for this function: the handler authenticates application invitations and administrator sessions itself.
5. POST health with the GitHub Pages Origin. Require apiVersion zero-repetition/3 and ready true. Verify unsigned response requests and direct anonymous database access fail.
6. Inspect the old private Sheets before switching. If accounts or answers exist, import their original IDs, slots, usernames, JTIs, expiry dates, revisions and canonical answer JSON first. The empty schema does not import them automatically.
7. Set only the public Edge Function URL in ../site-config.js, refresh its hash in ../index.html and publish. The browser CSP permits Supabase API hosts.

## Optional Sheets transfer

Import the separately delivered Zero-Repetition-Sheets-Optional.json into n8n. Choose Google Sheets OAuth2 for its one HTTP node using an account with edit access to the existing private report Sheet. Publish the zero-repetition-sheets-sync webhook.

Set ZR_SHEETS_WEBHOOK to that Production URL and ZR_SHEETS_SYNC_KEY to the private key from the setup bundle. An empty webhook disables integration. No client receives the key.

Only the administrator's explicit button invokes n8n. Transfers use fixed participant rows and RAW values. The API requires the same batch ID and every response ID in the acknowledgement before marking sync complete. Failure leaves primary answers intact. A newer database revision remains pending if an older revision was transferred.

## Access and storage

- zr_accounts: 300 unique usernames and invitation identifiers.
- zr_responses: canonical answers, status, revision, optional synchronization status.
- zr_requests: scoped transaction receipts prevent duplicate writes.
- zr_sync_jobs: manual-transfer snapshots and leases.
- zr_rate_limits: hashed administrator login buckets; no raw IP values.

Tables have RLS with no browser policies. The two RPCs are executable only by service_role. The function checks every participant or administrator before privileged queries. Submitted answers are locked until the administrator reopens them. Transaction locks and revision checks include simultaneous first saves.

The existing administrator key and invitation signatures are retained. Full email addresses are rejected. Knowing a username does not grant another person's answers.

## Verification

Run npm ci then npm test in this directory. Tests execute the actual schema in PostgreSQL through PGlite and read actual XLSX output using ExcelJS. Keys and records are synthetic and never uploaded to a live project.

The browser export creates OOXML directly, needs no CDN or Google call, and writes user input as inline strings so leading equals signs are not formulas.

Browser visual QA is unavailable in the current managed environment. Verify the hosted API and database before changing the live site's configuration. Google is optional and may be connected later.
