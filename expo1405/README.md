# هم‌صدا | نمایشگاه بورس، بانک و بیمه ۱۴۰۵

A Persian, RTL live poll with separate participant, moderator, display, and private owner capabilities.

| Entry | Access and behavior |
| --- | --- |
| `index.html` | Current question and the participant's own vote. No aggregate counts, charts, other responses, or results link. |
| `host.html` | Moderator control and a separate owner/admin tab. Moderator credentials cannot read the archive or download Excel. |
| `host.html?tab=admin` | Owner login selected. Private per-question archive, round filters, pagination, and `.xlsx` download. |
| `screen.html` | Requires a display capability issued from the moderator panel. Live movie credits and chart modes are both available. |
| `screen.html?demo=credits` | Clearly labeled fictional preview; never calls the real results API. |

## Data boundaries

- Participant requests and the public Supabase table expose only the active question and voting phase. Option counts, totals, participant counts, and credits are absent.
- Joins and votes do not update the public row's revision, so the public Realtime channel does not disclose a vote-by-vote activity feed.
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

Initial schema: `backend/schema.sql`. Append-only upgrades, in order: `credits.sql`, `admin.sql`, `display-private.sql`. Do not replay applied upgrades. Runtime code is deployed as `expo1405-api`; it uses Supabase's runtime-owned server key.

## Verification

`tests/private-live-check.py` performs read-only checks against the deployed API and validates the exported workbook. It prompts for moderator and owner credentials without echoing them. `tests/private-results.sql` checks visibility and grants with rollback-only fixtures. Unit tests exercise role boundaries, display capabilities, consent, Excel structure, and formula-injection prevention.

`tests/integration.mjs` is a historical, mutating capacity-test harness. Do not run it against an active event; the current operational check is the read-only private-live-check script.
