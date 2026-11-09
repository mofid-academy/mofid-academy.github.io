# هم‌صدا | نمایشگاه بورس، بانک و بیمه ۱۴۰۵

A Persian, RTL live poll with separate participant, moderator, display, and private owner capabilities.

| Entry | Access and behavior |
| --- | --- |
| `index.html` | Current question and the participant's own vote. No aggregate counts, charts, other responses, or results link. |
| `host.html` | Moderator control and a separate owner/admin tab. Moderator credentials cannot read the archive or download Excel. |
| `host.html?tab=admin` | Owner login selected. Private per-question archive, round filters, pagination, and `.xlsx` download. |
| `screen.html` | Requires a display capability issued from the moderator panel. Live movie credits and chart modes are both available. |
| `screen.html?demo=credits` | Clearly labeled fictional preview; never calls the real results API. |

## پنل‌ها و فاصلهٔ کوتاه بین اجراها

۱. در پنل، «پنل بعد با همین سؤال‌ها» را بزنید. پنل قبلی پایان می‌یابد و سؤال‌ها در یک پنل مستقل کپی می‌شوند؛ پاسخ‌ها و افراد کپی نمی‌شوند.
۲. از زبانهٔ «پنل‌ها · لینک و QR»، لینک همین پنل را کپی کنید یا تصویر PNG کد QR را بگیرید. هیچ انتشار دوباره‌ای لازم نیست.
۳. برای سؤال‌های متفاوت، «پنل خالی» بسازید یا سؤال‌های کپی‌شده را ویرایش کنید. می‌توانید پنل‌ها را از قبل بسازید و گزینهٔ پایان پنل فعلی را بردارید.
۴. نمایشگر را برای پنل انتخاب‌شده باز کنید. پنجرهٔ نمایشگری که از همین پنل باز شده، هنگام تغییر پنل با لینک پنل تازه باز می‌شود؛ در دستگاه دیگر، لینک خصوصی همان پنل را باز کنید.
۵. در ادمین، ابتدا پنل را از بالای پنل انتخاب کنید، سپس گزارش و اکسل همان پنل را بگیرید. نام پنل در فایل و هر شیت ثبت می‌شود. پنل قبلی و پاسخ‌هایش باقی می‌مانند.

برای بازگرداندن پنل پایان‌یافته، در زبانهٔ «پنل‌ها · لینک و QR» دکمهٔ «بازگرداندن پنل» را بزنید و تأیید کنید. همان پنل با همان لینک، سؤال‌ها، پاسخ‌ها و شمارهٔ اجرا به صفحهٔ انتظار برمی‌گردد؛ سپس از زبانهٔ «اجرای مجری» سؤال را باز کنید.

برای حذف، «حذف پنل» را بزنید، نام دقیق همان پنل را در پنجرهٔ تأیید وارد کنید و دکمهٔ حذف را بزنید. پنل به «حذف‌شده‌ها» منتقل می‌شود. برای برگرداندن، آن بخش را باز کنید و «بازیابی پنل» را بزنید. حذف دائمی وجود ندارد و پاسخ‌ها پاک نمی‌شوند. حتی اگر همهٔ پنل‌ها حذف شوند، ورود و بازیابی یا ساخت پنل خالی همچنان ممکن است.

Class URLs use `?class=cls-<uuid>`. The original `main` class and old URLs keep working. Host/admin codes remain the same across managed classes; display tokens, participant storage, questions, round counts, reports and Realtime topics are class-specific. Class creation is transactional and uses an idempotency UUID to avoid duplicates on a network retry. The protected class directory excludes isolated QA rooms. Finished, deleted or invalid class links never redirect to another class. Deleted class links return HTTP 410 and clear question/results views. Reopening and restoring preserve prior votes and question identities; use a new class for a new group. Deletion requires server-validated class-name confirmation and is a soft deletion, including for the original root class.

The participant introduction slogans have been removed. Each page identifies the selected class. All QR rendering and PNG generation run locally. Polls skip hidden tabs; finished participant pages disconnect from Realtime and check less frequently. The vote path authenticates inside the vote RPC, eliminating a redundant database round trip. Concurrent public reads are coalesced per class inside each Edge isolate, without a stale TTL cache.

## Data boundaries

- Participant requests expose only the active question and voting phase for the URL’s class. The backing state table has no browser-role grants. Option counts, totals, participant counts, and credits are absent.
- Joins and votes do not update the public row's revision, so the class-scoped Realtime channel does not disclose a vote-by-vote activity feed. Broadcasts contain only an empty question-state invalidation; clients fetch authoritative state instead of trusting broadcast payloads.
- `expo1405_display` stores the full current results; it has RLS and no `anon` or `authenticated` grants. The screen reads it through an authenticated endpoint once per second.
- Raw questions, participants, votes, room credentials, and report RPCs are service-only. The service key never reaches browser code.
- A moderator can issue a dedicated display capability. This does not grant archive access. Links carry this capability in a URL fragment, which is removed after activation; it is sent to the API only in a header.
- Owner/admin authentication uses an independent, high-entropy credential. Only its hash is stored in the database. The browser keeps the owner credential in page memory, clears private views on logout, and does not persist it in localStorage, sessionStorage, or a URL.
- Export responses use `Cache-Control: no-store, private`. Workbooks are generated in the protected API response, not stored as public files.
- Public display of a name remains an explicit participant choice; otherwise the display label is “شرکت‌کنندهٔ ناشناس”.

These application and API restrictions do not revoke Supabase organization membership, project administrator access, database passwords, or service keys. Those privileged account-level permissions must be reviewed separately in Supabase. The connected management tools used here do not expose organization member management.

## Excel reports

One summary worksheet and one worksheet per question, including questions with no responses. Reports can cover one round or all rounds. Each response includes its recorded name, answer, round, Tehran timestamp, participant identifier, and original question text. All user text is written as OOXML text cells, never formulas. Sheets are RTL with filters, frozen headers, readable widths, and Pinar-VF styling.

The export extends the existing Academy OOXML/ZIP implementation. Historical question/answer snapshots remain intact when questions are subsequently edited. The protected export has a 50,000-response per-file limit and returns an explicit error rather than silently truncating.

## React, TypeScript, Tailwind and shadcn structure

The existing voting application remains a static web application; the supplied React Aurora component provides its animated background and theme controls.

- Reusable components: `components/ui/` (the standard shadcn path, allowing generated component imports to remain consistent).
- Aurora component: `components/ui/aurora-background.tsx`.
- Motion demo: `components/demo.tsx`.
- `cn` utility: `lib/utils.ts`.
- React mount and theme state: `src/aurora-entry.tsx`.
- Tailwind stylesheet: `src/aurora.css`.
- Application styles: `style.css`.
- `@/` aliases: `tsconfig.json` and `vite.config.mjs`.
- shadcn settings: `components.json`.

The requested dependencies are pinned in `package.json` and `package-lock.json`. Tailwind 3 is used to support the provided configuration and color-variable plugin. Framer Motion and lucide-react are bundled locally; no runtime CDN is required.

```sh
npm ci
npm run build
npm test
```

`npm run build` type-checks TypeScript, builds the React/Tailwind layer, and copies deployable assets into `assets/aurora.js` and `assets/aurora.css`. Commit these outputs with source changes because GitHub Pages serves the prepared static files.

The palette follows the existing Academy hub: Mofid teal and green, light mint surfaces, and dark forest surfaces. Pinar-VF is locally hosted, with its actual 300–900 variable weight range. Day/night preferences use the same `mofid-academy-theme` key as the main Academy website. Reduced-motion preferences disable the Aurora motion and use a static credits list.

## Database upgrades

Initial schema: `backend/schema.sql`. Append-only upgrades, in order: `credits.sql`, `admin.sql`, `display-private.sql`, `classes.sql`, `class-lifecycle.sql`, `panel-terminology.sql`. Do not replay applied upgrades. Runtime code is deployed as `expo1405-api`; it uses Supabase's runtime-owned server key.

## Verification

`tests/private-live-check.py` performs read-only checks against the deployed API and validates the exported workbook. It prompts for moderator and owner credentials without echoing them. `tests/private-results.sql` checks visibility and grants with rollback-only fixtures. Unit tests exercise role boundaries, display capabilities, consent, Excel structure, and formula-injection prevention.

`tests/integration.mjs` is a historical, mutating capacity-test harness. Do not run it against an active event; the current operational check is the read-only private-live-check script.

## Compact question artwork

The five introduction scenes and their navigation are removed from all entry documents. `question-art.mjs` selects one local WebP from the current question position. Participants receive no additional questions or API requests. The participant, host current question, hall display and private host queue use the same mapping. `question-layout.css` contains the image with `object-fit: contain`: 144 px on desktop, 104 px on mobile and 88 px at 320–360 px widths. Forms, consent, owner reports and panel separation keep their existing handlers.

`question-preview.html` compares the actual question markup at mobile and desktop widths using a synthetic question generated from `renderParticipant`. Preview documents omit the polling app and have `connect-src 'none'`; clicks stay local and cannot join or vote in a real panel. They are optional review pages and do not appear in participant navigation.

The background uses soft Mofid lighting and glass surfaces. No third-party WebGL runtime or paid-template source is included. Earlier `entry-scenes` files remain unused for compatibility with cached older app versions.

## Supplied Pinar VF source

The three public entry documents preload `assets/Pinar-VF-97e7c962.ttf`, the exact user-supplied `Pinar-VF(5).ttf` (SHA-256 `97e7c962e88a3e808bd48312a207bdee0ae46507ef967b929643839aa58b1a99`). The shared CSS family is `Pinar VF`, including native controls and question cards. The content-hashed filename and versioned stylesheet URLs avoid reuse of the previous font response. No app logic or response data changes.

## QR cards and shiny controls

The supplied `QRCodeDisplay` is integrated at `components/ui/qr-code-generator.tsx` with shadcn `card.tsx`, `button.tsx` and `shiny-button.tsx` in the existing `/components/ui` alias. Shared styles live in `ui-components.css`; Tailwind continues to compile from `src/aurora.css`. `@radix-ui/react-slot` and `class-variance-authority` are installed alongside the existing React, TypeScript and Lucide dependencies.

The QR card is mounted only on host, hall and design preview pages. `qr-card.mjs` forwards the current public join URL through DOM attributes/events. Native SVG remains available while React loads, and repeated directory refreshes reuse the existing QR. Clearing or switching panels updates the same React root. The PNG is encoded locally from the real URL, with integer-sized modules and four white quiet-zone modules. No placeholder matrix or external QR service is used. Native fallback image export retains the uploaded Pinar VF family.

`ShinyButton` and native answer/host controls share the Mofid conic border, dot pattern and shimmer. Focus, wrapping labels, selected/disabled answer states and reduced motion are preserved. React's shared bundle is reused by the background and QR entry points; the QR-specific bundle is not loaded by participants.

References: QR component supplied by the user, from https://21st.dev/@user_xn1cklas/components/qr-code-generator ; shiny control styling adapted from the public preview at https://21st.dev/@designali-in/components/shiny-button . Tests use Node 24 and an independent jsQR decoder; jsQR is a development dependency only.

## Day/night backgrounds and mobile option buttons

The option buttons combine the conic border and rounded silhouette of `GradientButton` with the existing `ShinyButton` sheen. Native poll buttons share the same classes and retain their existing vote handlers. `components/ui/button-1.tsx` exposes the same composition for React screens. Text wraps for long Persian choices, with at least 58 px touch targets on mobile.

Light mode uses a CSS Jade Sky palette based on the public 21st.dev reference (https://21st.dev/@serafimcloud/components/jade-sky). Dark mode uses the WebGL Velaris shader adapted from the author's public source (https://forgeui.in/components/velaris) with Mofid green. `lib/velaris-runtime.ts` caps the canvas at 550,000 pixels and 18 fps on phone-sized viewports, pauses when hidden, observes reduced-motion settings and releases graphics resources. The background falls back to a matching CSS gradient when WebGL is unavailable. The participant and QR React entries share the same local build chunks; versioned asset filenames preserve older caches.

The design preview includes a theme switch and a 320/390 px mobile viewport selector. Its question and answer choices remain synthetic and cannot submit data.
