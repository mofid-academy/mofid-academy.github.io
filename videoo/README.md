# Academy video library

Public / learner entry: https://mofid-academy.github.io/videoo/

Management: https://mofid-academy.github.io/videoo/admin.html

## Owner workflow

1. Open **مدیریت مجموعه‌ها → مجموعهٔ جدید**. A collection is the teaching folder; for example, **آموزش تحلیل صنایع**.
2. Add a section with **فصل جدید**, then use **افزودن قسمت** for each episode, such as **قسمت اول** and **قسمت دوم**.
3. For each episode, use **انتخاب از آروان** for an existing private object, or **آپلود فیلم** to upload directly. Save the collection.
4. Use **افزودن عکس جلد** for a JPG, PNG or WebP image up to 5 MiB. It is uploaded privately to Arvan and saved with the collection.
5. Press **انتشار مجموعه**. Publishing requires a saved playable video and checks the first object's availability.
6. In **کاربران و انتشار**, create the learner accounts and press **فعال‌کردن نمایش برای کاربران** when ready.
7. Give each person their video-library username and password and the public entry URL. After login they select a collection and an episode. Their playback position and watched episodes are saved separately.

The global switch remains **off by default**. The public page displays Coming Soon until the owner explicitly enables it. Publishing a collection alone does not turn on the learner portal. An active learner account can see all published collections, while drafts remain management-only. The accounts created here belong to the video library and do not change survey, exam or learning-studio accounts.

## Deployed architecture

`academy-video-api` runs in the existing Supabase project. Existing management credentials authenticate the owner with purpose-scoped signed sessions. Learner accounts are created only by the owner, with unique salted PBKDF2-HMAC-SHA256 hashes at 600,000 iterations. Passwords and hashes are never returned by the API. Password changes and activation changes rotate a server-checked session version, invalidating existing learner sessions. No registration endpoint is public.

`backend/schema.sql` defines the private catalogue, progress and rate limits. `backend/publishing.sql` adds private learner accounts and the global publication switch. All tables have RLS and no anonymous/authenticated table or RPC grants; only the backend service role accesses them. This deployment does not modify existing survey APIs or accounts. The backend verifies custom signed sessions, so the platform JWT check remains disabled as explicitly approved by the owner.

The anonymous health endpoint returns only the portal state. Learner bootstrap filters published courses and playable lessons, removes object keys, signs private covers only for authorized learners, and returns only the caller's progress. Playback checks publication and account status again. Management operations, storage configuration, file listing and uploads reject learner sessions. Turning off the portal blocks subsequent API access; an already-issued S3 bearer URL can remain usable until its one-hour expiry.

## Arvan storage

The owner configured the connection through the private settings form. Real credentials remain encrypted in Supabase Vault and never enter GitHub or browser-readable catalogue records. Both bucket and object public access must stay disabled. The settings form tests credentials before saving. Existing CORS rules are preserved; the academy origin is added for GET, HEAD and PUT with ETag exposure.

Video uploads use direct 10 MiB multipart parts, progress, bounded retries, pause/resume within the page and cancellation. The in-site video size limit is 500 MiB. Cover images use short-lived, content-type-bound signed PUT URLs, with size/type verified before attachment. Signed media URLs are temporary bearer capabilities, not DRM. Catalogue deletion/unpublishing does not delete original objects in Arvan.

Collections and sections organize catalogue metadata; creating a collection does not require moving the video into a physical Arvan folder. The original private objects can be reused or moved between collections through metadata.

## Progress and existing drafts

Progress is keyed by the authenticated learner ID (or the owner for management preview), unions watched intervals, remembers position and completes at 90% of watched duration. Seeking to the end alone does not complete an episode. Moving an episode between collections retains its identity and progress.

Encrypted drafts from the former browser preview remain intact. Successful management login can decrypt an existing draft and offer an explicit server transfer. Import preserves server courses, remaps conflicting copies with their progress, and records completion only after all writes succeed. The encrypted backup is retained; password mismatches do not overwrite it. Learner sessions never read management browser drafts.

## Verification

Run `node --test videoo/tests/*.test.mjs` from the repository root. Tests cover authentication and purpose checks, management/learner boundaries, publication gates, session revocation, per-user progress, private storage failures, cover upload restrictions, upload signing, CORS integrity, XSS escaping, existing draft migration and the public Coming Soon boundary.

Managed browser preview is unavailable because the `sites-previewd` mailbox is missing. No alternate browser server or runtime was installed. The published public route is checked separately; full owner/learner browser interaction and a real media upload require actual account credentials and files.

## Learner password self-service

New learner accounts and administrator password resets require a personal password at next sign-in. Existing accounts keep their current state. The initial bootstrap contains no courses or watch history until that step is complete; media and progress operations are also blocked on the server. A signed-in learner can use `student_password_change` with their current password and a new password of 8–256 characters. The update checks the stored hash and session version atomically, rotates all old sessions, clears the initial-password flag and returns a new scoped session to the same browser. User identity and watch progress remain unchanged. Password inputs are cleared on success, and a response arriving after logout cannot restore the session.

The corporate account roster and initial password are provisioning data only; they must never be committed to the public repository. Apply the additional `must_change_password` column and the learner RPC definitions from `backend/publishing.sql` when upgrading an existing deployment. The schema continues to deny direct table/RPC access to anonymous and authenticated browser roles.

## Public entry state

The home card links to the active video portal. The static portal starts with a neutral loading indicator and a hidden paused-state panel. Only a confirmed non-live health response shows that panel; a failed health request offers an explicit retry. Live sessions restore the library, while signed-out visitors see sign-in. These entry states do not change the backend publication or authentication gates.
