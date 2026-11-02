# Academy video library

Public entry: https://mofid-academy.github.io/videoo/

Owner preview: https://mofid-academy.github.io/videoo/admin.html

The public route always renders Coming Soon and contains no private catalogue or playback URL. The shared academy header and home card link to this route. Branding reuses Pinar VF, the academy logo, mint/green colours, and the existing entry effects.

## Current deployment status

`client.mjs` has `BACKEND_MODE='private-preview'`. The owner signs in through the already-deployed management authentication service using the existing management username and password. This mode adds no new privileged server endpoint. Course drafts and preview progress are encrypted with AES-GCM in the owner's browser; the key is derived with PBKDF2 from the supplied management password after successful server authentication. The session key is removed at logout. Changes are local to that browser, not shared between devices. The preview does not accept or store Arvan credentials.

The Supabase schema in `backend/schema.sql` has been applied, with RLS and no anonymous/authenticated table or RPC access. Deployment of the new `academy-video-api` Edge Function was blocked by automatic approval review. **Do not activate the server mode or route around that block without the requested approval.** No new Edge Function was deployed and no existing function was modified.

## Server implementation ready for activation

The backend source is complete in `backend/`: scoped management sessions, optimistic catalogue revisions, per-actor progress, encrypted Vault storage for Arvan credentials, S3 V4 signatures, private playback, object selection and multipart uploads. It reads the existing management configuration through the service-role-only `zr_runtime_config` RPC. Platform JWT validation is disabled because this application's signed management sessions are verified in the handler. This privilege/authentication boundary is the exact deployment awaiting approval.

After approval, deploy `index.ts`, `core.mjs`, `storage.mjs`, and `deno.json` as `academy-video-api` in the existing project. Verify unauthenticated denials and authenticated operations before changing `BACKEND_MODE` to `server`. Migrate locally drafted courses through an explicit authenticated import rather than silently replacing them. Configure Arvan using the owner's private settings form; never put actual credentials in GitHub, chat, screenshots, or browser-readable catalogue records.

## Arvan setup

Bucket: `mofid-academy-videos`. Existing private test object: `J1.mp4`. Both bucket and object public access must remain disabled. Copy the actual endpoint and signing region from the Arvan account. The default UI endpoint reflects the region label seen in the current account and must be verified by the connection test.

The server tests the credentials before saving them in Vault. Optional CORS setup preserves other bucket rules and adds only the academy origin. Browser uploads use 10 MiB multipart chunks with progress, bounded retries, pause/resume within the current page, and cancellation. Uploads do not pass through GitHub or Supabase Storage. Existing files uploaded in Arvan can be selected separately and connected to lessons. Signed playback URLs are bearer capabilities and expire; they are not DRM or protection against screen recording.

## Course and progress model

Courses contain sections and lessons; standalone videos use the same model. Sections and lessons can be reordered, lessons moved between collections, and titles/descriptions edited. Deletes affect catalogue metadata, not original Arvan objects. Public release remains disabled even when a course is marked ready.

Progress retains the lesson identity across moves, remembers position, merges watched intervals, and marks completion at 90% of watched duration. Seeking to the end alone does not complete a lesson. Server progress uses the authenticated actor, not a client-supplied identity. The current preview illustrates the same UX with encrypted local persistence.

## Verification

Run `node --test videoo/tests/*.test.mjs` from the repository root. Tests cover authentication/expiry/forgery, catalogue conflicts, private storage failure handling, credential redaction, endpoint restrictions, upload signing, CORS preservation, watch progress, course movement and the public coming-soon boundary. Managed preview could not run because the `sites-previewd` daemon mailbox was unavailable; no alternate browser runtime or server was installed.
