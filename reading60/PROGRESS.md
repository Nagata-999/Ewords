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

## 2026-11-13 — batch 039–042
- Added 4 original questions, total 42/100 (remaining 58): Community Air Sensors (TFNG and Summary Completion), Museum Object Labels (Matching Information and Multiple Choice).
- Each original passage supports two different questions. All four include highlighted evidence, Japanese explanation, translation and paraphrase; added 8 vocabulary glosses.
- Source QA: unique IDs 039–042, four valid answer indexes (0,0,1,2), each question has 4 options except TFNG with 3; answer position batch 0:2, 1:1, 2:1. Museum question distinguishes text changes from object placement; air-monitoring question distinguishes particle readings from residents' health data.
- Pending: browser test, complete bank option-length bias check and editorial ambiguity review. Next-day persistence is deferred while guest progress uses sessionStorage only. No PIN sync or DB changes. PR #112 remains unmerged.

## 2026-11-13 — batch 047–050
- Added 4 original questions, reaching **50/100** (50 remaining). Two passages reused for distinct questions: Urban Rainwater Harvesting (TFNG and Summary Completion) and Community Sound Archives (Multiple Choice and Sentence Completion).
- Each question includes highlighted evidence, Japanese explanation, evidence translation, paraphrase and distractor discussion. New answer indices: 1,0,1,0.
- Source inspection: 50 question IDs, 50 unique. No DB or PIN-sync edits. Existing session-only persistence unchanged.
- Pending: browser runtime testing, full-bank semantic and option-length audits, next-day review persistence, and remaining 50 questions.

## 2026-11-13 — queue safety fix
- No new questions; total remains 50/100. Fixed normal-deck selection to exclude IDs pending in the delayed review queue, including after the normal deck is exhausted and reshuffled. This prevents early repetition before the five intervening questions.
- Source-level review only; browser execution not yet verified. If every item is pending and no eligible item exists, fallback selects the earliest pending item; this edge case still needs an explicit policy/test.
- No database, PIN sync, or main changes. Existing PR #112 remains open.

## 2026-11-13 — reconciliation and batch 069–070
- Verified open PR #113 and its existing bank through r60-068 before editing; PR #112 was previously merged. Current bank: **70/100**, 30 remaining. This run: **2 added, 0 modified**.
- Added an original seafood-market reusable-container passage with two distinct items: TFNG (r60-069; answer index 1) and Sentence Completion (r60-070; answer index 0). Each includes evidence in `focus`, Japanese explanation, evidence translation, paraphrase and distractor rationale.
- Source checks: new IDs 069 and 070 absent before insertion; 70 question IDs now expected, no duplicated new IDs; answers are within option bounds. No PIN sync, DB or application runtime code changed.
- QA limitations: full-bank editorial review, option-length distribution and live browser checks remain outstanding. The review queue still has a fallback when all items are pending, and sessionStorage cannot provide next-day persistence. Do not merge without user approval.

## 2026-11-13 — batch 071–072
- Reconciled open PR #113 and existing questions through r60-070 before writing. Added 2 original questions (r60-071 and r60-072), reaching **72/100** (28 remaining).
- New original passage: Public Water Refill Stations; TFNG asks about explicitly unrecorded avoided purchases, while Sentence Completion asks about the planned summer/winter comparison. Each has its own evidence focus, Japanese explanation, evidence translation, paraphrase and distractor rationale.
- Source-level audit: 72 IDs, 72 unique (including five initial JS object literals using unquoted id keys); new answer indices 1 and 0. Existing PIN/DB code untouched. Corrected the second item's evidence highlight during this run.
- Pending: browser testing, full-bank option-length and editorial review, delayed-queue all-pending edge case, and next-day persistence beyond sessionStorage. Main remains unchanged pending approval.

## 2026-11-13 — batch 075–076
- Confirmed open PR #113 (head `feature/reading60-51-54`) and checked the existing bank through r60-074 before adding questions.
- Added 2 original questions from one passage, Museum Photograph Identification: TFNG (answer 2) and Sentence Completion (answer 0). Total **76/100** (24 remaining).
- Both items include explicit evidence focus, Japanese evidence translation, paraphrase, explanation and distractor rationale. Source-level check found 76 unique IDs after insertion.
- Only `reading60/index.html` and this progress file changed; PIN/DB and main untouched. Browser runtime, full-bank semantic audit and option-length distribution remain pending. Session-only storage cannot provide next-day persistence.

## 2026-11-13 — batch 077–078
- Confirmed PR #113 remains open and checked the branch's existing 76 questions before editing.
- Added two original items on borrowed air-quality monitors: TFNG (r60-077, answer index 1) and Multiple Choice (r60-078, answer index 2), reaching **78/100** (22 remaining).
- Each question highlights its own direct evidence and includes Japanese explanation, evidence translation, paraphrase, and distractor rationale. 78 IDs unique in source-level audit; both answers within bounds.
- Source file and progress log only; no changes to PIN sync, DB, or main. Browser execution, whole-bank answer-length and semantic audits, and next-day persistence beyond sessionStorage remain outstanding.
