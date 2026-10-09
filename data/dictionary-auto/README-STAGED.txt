Staged dictionary candidates

Canonical source: candidate-manifest.json and its listed source shards.

The legacy new-entries.json contains 134 entries; the manifest loads only the first 118, then 42 new entries from separate batch-04 shards. Do not count all 134 plus the shards or append to the legacy file.

Run: python scripts/validate_staged_candidate_shards.py [path-to-complete-dictionary-ZIP]

Candidates have temporary IDs. The 13,660 total is projected, not published. Do not modify main or production dictionary JSON from this branch.
