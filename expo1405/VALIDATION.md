# Validation — 2026-11-08

Passed checks against the deployed Supabase API:

- Anonymous moderator access rejected.
- Publishable key denied access to questions, room credentials, participant records, individual votes, and moderator RPCs.
- Waiting page contained no question text; opening a question exposed only that question.
- 100 participant sessions submitted 100 votes concurrently; counts and per-option totals matched exactly. This burst completed in 13.39 seconds over the test network.
- Duplicate submission did not change the count or replace the original vote.
- Votes for closed or future questions were rejected.
- Editing an answered question in the same round was rejected.
- Server-enforced deadline rejected an expired vote.
- Three independent Realtime subscribers received aggregate snapshots; no participant name or credential was included.
- CSV export contained the header and all 100 recorded votes.
- Frontend JS parsed successfully; HTML had unique IDs and all referenced local assets were present.

Synthetic participant records and votes were archived in a private, isolated QA room and excluded from the delivered live room. Initial state: six sample questions, optional names, round 1, waiting, zero participants, zero votes.

The test exercised 100 concurrent vote submissions and three live subscribers, not 100 physical devices on the venue Wi-Fi. Identity is browser-session based; it does not establish one verified human per vote.

