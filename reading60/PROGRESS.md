# Reading60 progress and QA — 2026-11-12

- Active PR: #112 (feature/reading60-batch-006-015), not merged.
- Total questions: 26/100; this run added 4 (r60-023 through r60-026).
- Question IDs: 26 unique; no duplicate IDs in the source.
- Types: TRUE / FALSE / NOT GIVEN 7; Summary Completion 5; Multiple Choice 5; Sentence Completion 5; Matching Information 4.
- New passages: Seed Banks (two distinct questions), Museum Collections (two distinct questions).
- New questions have explicit highlighted evidence, Japanese explanation, evidence translation and paraphrase, and four answer options where applicable.
- Correct option indices for new questions: 0,1,1,1. Balance needs review across the full bank.
- Guest progress remains sessionStorage only; PIN sync and DB untouched.
- Pending: manual semantic review, review-after-next-day policy vs session-only storage, answer position/length audits, and 74 questions to initial target.

## 2026-11-12, run 6
- Added four original questions r60-027–030; total 30/100 (remaining 70).
- Two new passage themes, each with two distinct questions: Community Repair Cafés (TFNG, Multiple Choice) and Coastal Dune Restoration (Summary Completion, Matching Information).
- Current type totals: TFNG 8; Summary 6; Multiple Choice 6; Sentence Completion 5; Matching Information 5.
- New correct indices: 1, 2, 0, 0. All 30 question IDs unique and answer indices within the option lists (source-level check).
- Refined question 028 to explicitly ask for the information stated as unrecorded, avoiding confusion with merely unmentioned records.
- Added inline vocabulary glosses for the new topics. No API calls, database schema changes, or PIN changes.
- Pending: manual IELTS editorial review, option-length audit, long-term next-day review vs sessionStorage limitation, and 70 more questions.

## 2026-11-13, run 7
- Added four original questions r60-031–034, reaching **34/100** (66 remaining).
- Two new original passages, each reused for two different questions: Urban Heat Mapping (TFNG, Sentence Completion) and Library of Things (Summary Completion, Multiple Choice).
- Updated format totals: TFNG 9; Summary 7; Multiple Choice 7; Sentence Completion 6; Matching Information 5.
- New answer indices: 0, 0, 0, 1. Options are short and distinct; review full-bank position balance in subsequent batches.
- Added ten context vocabulary glosses. No DB/PIN changes; sessionStorage remains in use.
- Source-level ID audit: new IDs 031–034 are distinct from 001–030; four new answers within valid option bounds; all four have evidence focus, explanation, translation and paraphrase.
- Pending: human editorial verification of semantic ambiguity; test execution in browser; next-day review requires persistence beyond sessionStorage, deferred under current guest-only policy.

## 2026-11-13 — batch 035–038
- Added 4 original questions, total 38/100 (remaining 62): Wetland Boardwalks (TFNG, Matching Information) and Community Seed Exchange (Summary Completion, Sentence Completion).
- Reused each original passage for two distinct questions. All four include a focused evidence passage, Japanese explanation, evidence translation, paraphrase, and distractor-specific explanation; added 10 vocabulary glosses.
- QA (source-level): IDs 035–038 unique relative to existing 001–034; answers 1,1,0,0 within option bounds; correct option counts in this batch 0:2 / 1:2. Semantic review: wetland total visitors rose although direct trampling fell; seed labels are separate from storage conditions. No changes to sessionStorage, DB or PIN sync.
- Remaining: browser execution, full-bank duplicate/option-length audit, human editorial review of ambiguity. Next-day review cannot persist after tab closure with current session-only policy.
