#!/usr/bin/env python3
"""Safe, offline dictionary staging merger. Never edits the input ZIP."""
import argparse
import io
import json
import re
import zipfile
from collections import Counter
from pathlib import Path

def norm(value):
    return " ".join(value.casefold().split()) if isinstance(value, str) else ""

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", required=True, help="latest verified complete dictionary ZIP")
    ap.add_argument("--candidates", required=True, help="staged new-entries.json")
    ap.add_argument("--output", required=True, help="output full ZIP (never overwrites base)")
    args = ap.parse_args()
    source = Path(args.base).resolve()
    dest = Path(args.output).resolve()
    if source == dest:
        ap.error("output must differ from base")
    payload = json.loads(Path(args.candidates).read_text(encoding="utf-8"))
    additions = payload.get("entries", [])
    if not isinstance(additions, list) or not additions:
        ap.error("candidate entries missing")
    from validate_dictionary_candidates import validate
    issues = validate(payload)
    if issues:
        ap.error("candidate validation failed: " + "; ".join(issues[:10]))
    with zipfile.ZipFile(source) as zin:
        names = zin.namelist()
        dictionary_files = sorted(n for n in names if re.fullmatch(r"dictionary-[a-z]+\.json", n))
        if len(dictionary_files) != 27:
            ap.error(f"expected 27 dictionary files, got {len(dictionary_files)}")
        data = {n: zin.read(n) for n in names}
    existing_ids, existing_words = set(), set()
    max_number = 0
    for name in dictionary_files:
        entries = json.loads(data[name])
        if not isinstance(entries, list):
            ap.error(f"{name} is not a list")
        for e in entries:
            ident, word = norm(e.get("id")), norm(e.get("word"))
            if not ident or not word or ident in existing_ids or word in existing_words:
                ap.error(f"base dictionary invalid or duplicate in {name}: {ident}/{word}")
            existing_ids.add(ident)
            existing_words.add(word)
            match = re.fullmatch(r"sw-(\d+)", ident)
            if match:
                max_number = max(max_number, int(match.group(1)))
    for e in additions:
        if norm(e["word"]) in existing_words:
            ap.error(f"candidate already in base: {e['word']}")
    if max_number == 0:
        ap.error("cannot determine existing sw-NNN ID scheme")
    # Stable assignment by sorted headword; allocation only after all checks pass.
    new_ids = []
    buckets = {n: json.loads(data[n]) for n in dictionary_files}
    for offset, e in enumerate(sorted(additions, key=lambda x: norm(x["word"])), 1):
        row = json.loads(json.dumps(e))
        row["id"] = f"sw-{max_number + offset:05d}"
        row["status"] = "active"
        word = norm(row["word"])
        first = word[0].lower()
        target = f"dictionary-{first}.json" if first.isalpha() else "dictionary-other.json"
        if target not in buckets:
            ap.error(f"no bucket for {row['word']}: {target}")
        buckets[target].append(row)
        new_ids.append({"word": row["word"], "id": row["id"], "file": target})
    for name, rows in buckets.items():
        data[name] = (json.dumps(rows, ensure_ascii=False, indent=2) + "\n").encode("utf-8")
    data["dictionary-auto-merge-report.json"] = (json.dumps({
        "base_zip": source.name, "added": len(new_ids), "entries": new_ids,
        "note": "Staged offline build; requires full CI, semantic review and approval before production."
    }, ensure_ascii=False, indent=2) + "\n").encode("utf-8")
    excluded = ("html", "sitemap", "search-index")
    with zipfile.ZipFile(dest, "w", compression=zipfile.ZIP_DEFLATED) as zout:
        for name in sorted(data):
            if name.lower().endswith((".html", ".htm")) or "sitemap" in name.lower() or "search-index" in name.lower():
                continue
            zout.writestr(name, data[name])
    print(f"STAGED ONLY: {len(new_ids)} additions; {len(existing_words) + len(new_ids)} total; {dest}")
    print("Production remains unchanged. Review the merge report and full validation before deployment.")

if __name__ == "__main__":
    main()
