# Academy video library

Public entry: https://mofid-academy.github.io/videoo/

Owner preview: https://mofid-academy.github.io/videoo/admin.html

The public route always renders Coming Soon and contains no private catalogue or playback URL. The shared academy header and home card link to this route. Branding reuses Pinar VF, the academy logo, mint/green colours, and the existing entry effects.

## Current deployment status

`client.mjs` has `BACKEND_MODE='server'`. The `academy-video-api` Edge Function was deployed after the owner's explicit approval on 2026-11-03. Management uses the existing management username and password, with scoped signed sessions checked by the new handler. Catalogue edits and owner-preview watch progress are stored in the private Supabase tables. Public release remains disabled.

The Supabase schema in `backend/schema.sql` has been applied, with RLS and no anonymous/authenticated table or RPC access. No existing Edge Function was modified. The live API health check succeeds, while unauthenticated catalogue, storage, playback, progress and upload requests return 401.

The Arvan settings form is now available after management login. No real Arvan credentials have been supplied or saved yet, so Arvan playback and uploads still require the owner to complete this private form. The handler tests the connection before storing credentials. Do not describe the Arvan connection as complete until that test succeeds.

## Existing browser drafts

Encrypted drafts from the former browser preview remain intact. After successful management login, an existing draft can be decrypted with the owner's supplied password and its key retained only for that session. A notice offers an explicit transfer to the server; nothing is silently imported or deleted. Import preserves current server courses, remaps conflicting copies and their lesson progress together, and records completion only after all writes succeed. The encrypted browser backup is retained. A password mismatch does not block server login and does not overwrite the old backup.

## Server implementation

The backend source is in `backend/`: scoped management sessions, optimistic catalogue revisions, per-actor progress, encrypted Vault storage for Arvan credentials, S3 V4 signatures, private playback, object selection and multipart uploads. It reads the existing management configuration through the service-role-only `zr_runtime_config` RPC. Platform JWT validation is disabled because this application's signed management sessions are verified in the handler. The owner explicitly approved this authentication and privilege boundary before deployment.

The deployed bundle includes `index.ts`, `core.mjs`, `storage.mjs`, and `deno.json`. Configure Arvan using the owner's private settings form; never put actual credentials in GitHub, chat, screenshots, or browser-readable catalogue records. Authenticated behavior is covered by fixture-based tests; an actual owner login and real Arvan operations still need verification with the owner's credentials.

## Arvan setup

Bucket: `mofid-academy-videos`. Existing private test object: `J1.mp4`. Both bucket and object public access must remain disabled. Copy the actual endpoint and signing region from the Arvan account. The default UI endpoint reflects the region label seen in the current account and must be verified by the connection test.

The server tests the credentials before saving them in Vault. Optional CORS setup preserves other bucket rules and adds only the academy origin. Browser uploads use 10 MiB multipart chunks with progress, bounded retries, pause/resume within the current page, and cancellation. Uploads do not pass through GitHub or Supabase Storage. Existing files uploaded in Arvan can be selected separately and connected to lessons. Signed playback URLs are bearer capabilities and expire; they are not DRM or protection against screen recording.

## Course and progress model

Courses contain sections and lessons; standalone videos use the same model. Sections and lessons can be reordered, lessons moved between collections, and titles/descriptions edited. Deletes affect catalogue metadata, not original Arvan objects. Public release remains disabled even when a course is marked ready.

Progress retains the lesson identity across moves, remembers position, merges watched intervals, and marks completion at 90% of watched duration. Seeking to the end alone does not complete a lesson. Server progress uses the authenticated actor, not a client-supplied identity. This release is restricted to management preview; student accounts and public course access are not enabled.

## Verification

Run `node --test videoo/tests/*.test.mjs` from the repository root. Tests cover authentication/expiry/forgery, catalogue conflicts, private storage failure handling, credential redaction, endpoint restrictions, upload signing, CORS preservation, watch progress, course movement, encrypted draft migration and the public coming-soon boundary. The live API was checked separately for health and anonymous denials. Managed preview could not run because the `sites-previewd` daemon mailbox was unavailable; no alternate browser runtime or server was installed.
