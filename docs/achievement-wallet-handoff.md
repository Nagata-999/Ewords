# Achievement wallet follow-up (2026-10-09)

## Confirmed client defects

- A profile request started before an achievement claim could apply its old wallet after the claim wallet had been stored. Profile sync, account connection, and achievement claims now share a promise queue covering the network operation and local application. A rejected operation does not block later operations.
- Outcome sync used a regular expression matching a literal backslash rather than four decimal digits. Valid PINs therefore skipped outcome uploads. The PIN check is corrected.
- The existing branch already contained authoritative claim-wallet reconciliation. No server reward rules or production database were changed in this follow-up.

## Validation

Run `node --test tests/achievement-wallet-order.test.cjs` for delayed profile replies, 150-gem avatar reward, repeated claim, queue recovery, and PIN outcome upload/import. GitHub's achievement workflow runs this suite.

## Remaining verification and recovery

The reported account's missing reward has not been conclusively attributed to the client race. The repository does not contain the deployed `sushi-id-sync` function or milestone RPC. Inspect their source and read-only account histories before proposing production changes.

For avatar threshold 30, reconcile the milestone receipt, its stable claim ID, the server wallet credit, and subsequent spending. Do not infer a missing credit from absence in the bounded 1,000-event history; an older credited event may have been pruned. A receipt without a proven missing credit must not be paid again. Any compensating database write requires user approval and a durable idempotency key.

The existing claim-wallet merge treats local IDs absent from the bounded server event window as pending. This needs a server acknowledgement/revision contract before it can safely handle all pruned-history cases. The new queue prevents same-page stale profile responses, but does not by itself guarantee cross-device atomicity or preserve unrelated local earns/spends made during every profile request.

Next priorities: inspect deployed server merge/claim logic; test two-device claims and event pruning; audit all game outcome producers and counter convergence; verify rank selection persistence and synchronization; exercise reward UI on desktop/mobile. Catalog avatar stage three is 30 items / 150 gems. Rank thresholds match 0, 500, 2,000, 5,000, 15,000, 50,000, 150,000.

The pre-existing `tests/sushicross.test.cjs` currently fails because its canvas mock lacks `getBoundingClientRect`; this is outside the wallet change.
