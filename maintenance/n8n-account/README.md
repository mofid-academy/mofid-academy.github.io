# Academy n8n account

Current origin: `https://azmoon21.app.n8n.cloud` (updated 2026-11-16).

| Webhook | Purpose |
|---|---|
| `/webhook/academy-archive-v5` | Authenticated private archive and results |
| `/webhook/academy-admin-api` | Authenticated administration bridge |
| `/webhook/exam-import-file` | Server PDF import |
| `/webhook/youform-exam` | Legacy answer submission |
| `/webhook/exam-questions` | Public question retrieval |
| `/webhook/exam-save` | Existing question synchronization |
| `/webhook/academy-submit-v5` | Stored-receipt submission for archived exam runs |

The public form, archive runtime, admin bridge, import/save controls and private test route use the current origin. Public and admin Content Security Policies and question-fetch origin checks allow this account. The update does not add wildcard hosts, new credentials or authentication bypasses.

Public query overrides and config.json URLs are normalized on load. The admin also normalizes incoming archived sources and decoded offline templates. The secure wrapper applies the same normalization when loading a regenerated approved bundle. Recognized previous accounts include azmonmofid, azmoon, miladmirsheriseyed, miladmirsheriii, miladmmirsheri and miladmirsheriam. Historical approved build inputs and the embedded offline snapshot retain their original bytes.

Account credentials, private Data Tables, archived runs and results are separate n8n data. Changing website URLs does not copy those records. The published run_id, bank ID and revision are preserved, so the corresponding private run must exist in the target account before its responses can be accepted.

Regression commands from the repository root:

```sh
node --test .academy-admin-src/tests/academy-public-network.test.mjs maintenance/exam-word-import/word-import.test.cjs
```

These tests use local fixtures. They do not send a real response, upload, archive write or publication request to n8n.
