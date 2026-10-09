#!/usr/bin/env python3
"""Validate staged dictionary additions; never modify production files."""
import json
import pathlib
import sys
from collections import Counter

def main():
    path = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "data/dictionary-auto/new-entries.json")
    payload = json.loads(path.read_text(encoding="utf-8"))
    entries = payload.get("entries")
    if not isinstance(entries, list):
        raise ValueError("entries must be an array")
    problems = []
    ids = []
    words = []
    for i, entry in enumerate(entries):
        if not isinstance(entry, dict):
            problems.append(f"entry {i}: not an object")
            continue
        word = entry.get("word", "")
        ident = entry.get("id", "")
        if not isinstance(word, str) or not word.strip():
            problems.append(f"entry {i}: missing headword")
        if not isinstance(ident, str) or not ident.strip():
            problems.append(f"entry {i}: missing ID")
        if isinstance(word, str):
            words.append(word.strip().casefold())
        if isinstance(ident, str):
            ids.append(ident)
    for field, values in (("headword", words), ("ID", ids)):
        for value, n in Counter(values).items():
            if value and n > 1:
                problems.append(f"duplicate {field}: {value} ({n})")
    if payload.get("count") != len(entries):
        problems.append(f"declared count {payload.get('count')} != {len(entries)}")
    print(f"Validated {len(entries)} staged candidates; {len(problems)} issue(s).")
    for issue in problems:
        print("ERROR:", issue)
    if problems:
        raise SystemExit(1)
    print("NOTE: Candidate-only checks; production overlap, semantics and UI not yet verified.")

if __name__ == "__main__":
    main()
