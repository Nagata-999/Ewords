# v3.331 integration

Source: supplied `sushitan_dictionary_v3.331_full.zip`, verified by progress.current_version, meta, release manifest, and execution of its validator. ZIP SHA256 and integration decisions are in integration.json. The supplied README still describes v3.320; it is archived as source-README.md, not used as version authority.

Baseline main: `064175c45907f077599ea27a616010f0dcc72e1d`. All 27 dictionary JSON files were compared. Source includes 13,500 entries; production retains 30 independently added entries, for 13,530 total. No IDs, headwords, etymology data, URL slugs or addition provenance are changed. Existing data backup remains in the baseline commit and the local work/v3.331/baseline directory. No source curation scripts are run. Only selected source provenance/audit documents are archived here; historical data-directory artifacts are retained rather than deleted.

293 existing bilingual examples and one missing class/group sense are preserved alongside the source update. Empty-gloss/boilerplate examples are not reintroduced. The detailed restoration log identifies target senses; 50 additional reviewed exclusions include empty-gloss templates and three inadequate examples/translations. This is not a claim that every source entry passed editorial review.

Source audit: 11,983 findings in 13,500 entries. The same counting method after integration reports 12,043, with the additional 60 missing Japanese collocation translations belonging to the unchanged pilot entries. Japanese translations are optional for display. The extended repository audit reports 12,327 findings (different rules: extra template detection and structural checks; do not subtract across methods). No duplicate IDs/headwords, deleted entries, changed etymologies or structural errors were found. Full results are in quality-audit.json. Counts represent findings, not unique words. Issues remain primarily empty collocations/definitions/examples and placeholder examples.

The previous generator already accepted string and phrase/en/text objects, fixing the historic `・ :` mismatch. The shared normalizer now rejects malformed containers and item/translation types and reports them in both build and quality audits. Valid English displays without a colon when no translation exists. Etymology was stored but absent from generated pages; origin, history, roots and related links now display for 505 entries.

## Reproduce

Run from repository root:

```sh
python data/dictionary/validate_dictionary.py
python scripts/audit-dictionary.py --output docs/dictionary-v3.331/quality-audit.json
python scripts/build-dictionary.py
python scripts/check-dictionary.py
python tests/dictionary-rendering.py
python tests/dictionary-quality-audit.py
node tests/dictionary.cjs
node tests/shared-learning.cjs
node tests/dictionary-browser.cjs
```

Browser tests require a local Playwright installation and Chromium (`CHROME_PATH` can select an installed browser). No paid service or network API is used by build, audit or tests.

## Future 30–60 word batches

1. Fetch current main, create a dedicated branch and copy current data/dictionary to a separate baseline directory before editing. Check ongoing vocabulary-addition branches; never reuse an older full ZIP as a baseline.
2. Record baseline commit, source version, selected IDs, correction rationale, before/after hashes and review results in a dated document under docs. Keep the historical new-entry-manifest unchanged.
3. Improve selected existing entries only; preserve IDs, words, etymology and good examples. Review English/Japanese meaning, polysemy, usage, collocations and target exam/academic register manually. Automated checks cannot prove linguistic correctness.
4. Run `python scripts/check-dictionary-update.py --baseline /path/to/saved/dictionary --expected-version v3.331`. This requires 30–60 changed entries, no additions/deletions, intact identity/etymology, retained non-template examples and zero audit findings in edited entries. An intentional correction/removal rejected by the gate needs a separately reviewed correction; do not silently weaken the guard.
5. Run the full checks above and inspect desktop/mobile pages before committing a PR. Recheck main before merge to prevent collisions. Updating the release version requires a corresponding manifest/progress history update. Audit JSON in this directory is the v3.331 snapshot, not a live mutable report for later releases.

This PR does not merge or deploy automatically and does not add the remaining 3,570 candidates or the separate 160 words.
