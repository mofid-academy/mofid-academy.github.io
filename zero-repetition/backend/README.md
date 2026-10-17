# Private database API

The static UI stays on GitHub Pages. A dedicated Supabase project in Frankfurt hosts PostgreSQL and the zero-repetition-api Edge Function. Questionnaire entry, saving, administration and Excel export operate independently of n8n and Google Sheets.

## Deployed configuration

The database migration is applied and the Edge Function is active. The public function URL is in ../site-config.js. Health reports API version zero-repetition/3 and a ready database.

Server configuration is stored as one encrypted Supabase Vault secret named zero_repetition_runtime. Its JSON fields are siteOrigin, siteUrl, adminUsername, adminKeyHash, signingKey, sheetsWebhook and sheetsSyncKey. The service-role-only zr_runtime_config RPC reads it; the Edge Function caches configuration for up to 60 seconds. Browser roles cannot execute this RPC or read Vault.

The automatic platform service-role credential stays inside the Edge Function. As an alternative to Vault, setting both ZR_SIGNING_KEY and ZR_ADMIN_KEY_HASH activates the environment-based settings in .env.example. Never mix partial environment overrides with Vault configuration.

The administrator's existing password hash is retained. The new invitation/session signing key is independent of the old n8n signing key. Both legacy Sheets were checked before activation and contained no participant accounts or responses to migrate. Existing legacy invitation signatures are not accepted by the new backend.

## Recreate in another dedicated project

1. Apply supabase/migrations/202610170001_independent_storage.sql once through migrations. It creates only zr_ tables, enables RLS and revokes browser roles. Keep applied migrations immutable.
2. Create the private Vault configuration above, or configure all server-only environment settings. Use fresh independent signing and optional-transfer keys. Never publish actual values or database credentials.
3. Deploy index.ts and core.mjs as zero-repetition-api. Keep verify_jwt=false: the handler authenticates application invitations and administrator sessions itself.
4. Verify health, administrator login, participant isolation, draft/final writes and direct anonymous access denials. Migrate any existing private accounts and responses before changing the frontend.
5. Set only the verified public function URL in ../site-config.js, refresh its hash in ../index.html and publish.

## Optional Sheets transfer

Import the separately delivered Zero-Repetition-Sheets-Optional.json into n8n. Choose Google Sheets OAuth2 on its one HTTP node using an account with edit access to the existing private report Sheet. Publish the zero-repetition-sheets-sync webhook.

In the private Vault JSON, set sheetsWebhook to that Production URL and preserve sheetsSyncKey from the private setup bundle. With the environment alternative, use ZR_SHEETS_WEBHOOK and ZR_SHEETS_SYNC_KEY. An empty webhook disables integration. Never place either setting in the browser.

Only the administrator's explicit button invokes n8n. Transfers use fixed participant rows and RAW values. The API requires the same batch ID and every response ID in the acknowledgement before marking synchronization complete. Failure leaves primary answers intact. A newer database revision remains pending if an older revision was transferred.

## Access and storage

- zr_accounts: up to 300 unique usernames and invitation identifiers.
- zr_responses: canonical answers, status, revision and optional synchronization status.
- zr_requests: scoped transaction receipts prevent duplicate writes.
- zr_sync_jobs: manual-transfer snapshots and leases.
- zr_rate_limits: hashed administrator login buckets; no raw IP values.

All five tables have RLS with no browser policies and no grants to anon or authenticated. The three application RPCs are executable only by service_role. The function authenticates every participant or administrator before privileged queries. Submitted answers are locked until the administrator reopens them. Transaction locks and revision checks cover simultaneous first saves.

The security advisor reports only the expected informational [RLS enabled with no policy](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy) notices for these server-only tables. Do not add public policies to silence them. Direct requests with a valid public API key were verified to fail with permission denied.

Full email addresses are rejected. Knowing a username alone does not grant access: a participant needs their active signed link. Links are bearer credentials and should be sent privately to the intended colleague. Public repository code contains no responses or real private keys.

## Verification

Run npm ci then npm test in this directory. There are 41 behavior checks for the actual PostgreSQL schema via PGlite, API authorization and revisions, frontend behavior, real XLSX parsing through ExcelJS, and the Edge runtime configuration loader. Test keys and records are synthetic.

The hosted API also passed real draft/final writes, fresh reads, participant isolation, administrator access and anonymous access rejection. Synthetic hosted test accounts and responses were removed. After signing-key separation, health and the existing administrator login were rechecked and a token signed with the legacy n8n key was rejected.

The browser creates OOXML directly, needs no CDN or Google call, and writes user input as inline strings so leading equals signs are not formulas. Both generated worksheet layouts were rendered and inspected. Interactive browser visual QA was unavailable in the managed environment; do not claim it was performed.
