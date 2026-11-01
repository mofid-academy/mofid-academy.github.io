# Academy n8n account

Current origin: `https://azmonmofid.app.n8n.cloud`.

| Webhook | Purpose |
|---|---|
| `/webhook/academy-archive-v5` | Authenticated private archive and results |
| `/webhook/academy-admin-api` | Authenticated administration bridge |
| `/webhook/exam-import-file` | Server PDF import |
| `/webhook/youform-exam` | Legacy answer submission |
| `/webhook/exam-questions` | Public question retrieval |
| `/webhook/exam-save` | Existing question synchronization |
| `/webhook/academy-submit-v5` | Stored-receipt submission for archived exam runs |

The public form, archive runtime, admin bridge, import/save controls and private test route use the current origin. Public and admin Content Security Policies and question-fetch origin checks allow the current account. No wildcard host, authentication bypass, new key or token is added.

Legacy URL overrides and config.json values are normalized when the public form loads. The admin normalizes incoming source before model parsing, so old archived snapshots and decoded offline templates use the current account. The secure wrapper also applies normalization to a regenerated approved admin bundle. Historical approved build inputs and the embedded offline snapshot stay byte-identical; production routing is applied by the current wrappers.

Migration checks on 2026-11-01:

- Public question GET returned valid JSON containing 35 questions from the new account.
- Non-mutating GET probes for all six POST endpoints, including `academy-submit-v5`, returned n8n's registered-POST method response. These probes do not establish successful authentication or durable storage.
- Fourteen existing transport, schedule and Word-import tests passed. Sixteen JavaScript scripts passed syntax checks; three published JSON state blocks and the historical offline snapshot were preserved.
- No real response, upload, archive write or publication run was submitted during migration checks. Schedule, access lock and exam/run identifiers are preserved.

Regression commands from the repository root:

```sh
node --test .academy-admin-src/tests/academy-public-network.test.mjs maintenance/exam-word-import/word-import.test.cjs
```
