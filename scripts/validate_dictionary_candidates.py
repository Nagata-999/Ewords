#!/usr/bin/env python3
"""Read-only validation of staged dictionary candidates against optional production JSON."""
import argparse
import json
from collections import Counter
from pathlib import Path

def norm(s):
    return " ".join(s.casefold().split()) if isinstance(s, str) else ""

def load_entries(path):
    data = json.loads(Path(path).read_text(encoding="utf-8"))
    return data["entries"] if isinstance(data, dict) and "entries" in data else data

def validate(payload, existing=()):
    entries = payload.get("entries")
    errors = []
    if not isinstance(entries, list):
        return ["entries must be a list"]
    if payload.get("count") != len(entries):
        errors.append("candidate count mismatch")
    old_ids = {norm(e.get("id")) for e in existing if isinstance(e, dict)}
    old_words = {norm(e.get("word")) for e in existing if isinstance(e, dict)}
    ids, words = [], []
    for i, e in enumerate(entries):
        where = f"entry[{i}]"
        if not isinstance(e, dict):
            errors.append(f"{where}: not an object")
            continue
        ident, word = norm(e.get("id")), norm(e.get("word"))
        if not ident or not word:
            errors.append(f"{where}: missing id/word")
        if ident in old_ids:
            errors.append(f"{where}: ID collides with production: {ident}")
        if word in old_words:
            errors.append(f"{where}: headword already exists: {word}")
        ids.append(ident)
        words.append(word)
        poses = e.get("parts_of_speech")
        if not isinstance(poses, list) or not poses:
            errors.append(f"{where}: missing parts_of_speech")
            continue
        senses = set()
        for p in poses:
            pos = norm(p.get("pos")) if isinstance(p, dict) else ""
            meanings = p.get("meanings") if isinstance(p, dict) else None
            if not pos or not isinstance(meanings, list) or not meanings:
                errors.append(f"{where}: invalid pos/meanings")
                continue
            for m in meanings:
                if not isinstance(m, dict):
                    errors.append(f"{where}: invalid meaning")
                    continue
                ja = norm(m.get("ja"))
                definition = norm(m.get("definition") or m.get("definition_en"))
                if not ja or not definition:
                    errors.append(f"{where}: empty Japanese meaning or English definition")
                key = (pos, ja)
                if key in senses:
                    errors.append(f"{where}: duplicate same-POS meaning: {pos} / {ja}")
                senses.add(key)
                examples = m.get("examples")
                if not isinstance(examples, list) or not examples or any(
                    not isinstance(x, dict) or not norm(x.get("en")) or not norm(x.get("ja"))
                    for x in examples
                ):
                    errors.append(f"{where}: missing bilingual example")
        colls = e.get("collocations", [])
        if not isinstance(colls, list):
            errors.append(f"{where}: invalid collocations")
        else:
            for c in colls:
                value = c if isinstance(c, str) else c.get("text") if isinstance(c, dict) else ""
                if not norm(value):
                    errors.append(f"{where}: blank collocation (would render ':')")
    for label, values in (("ID", ids), ("headword", words)):
        for value, count in Counter(values).items():
            if value and count > 1:
                errors.append(f"duplicate candidate {label}: {value}")
    return errors

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("candidates", nargs="?", default="data/dictionary-auto/new-entries.json")
    parser.add_argument("--production-dir", help="directory of dictionary-*.json files; enables production overlap checks")
    args = parser.parse_args()
    payload = json.loads(Path(args.candidates).read_text(encoding="utf-8"))
    production = []
    if args.production_dir:
        paths = sorted(Path(args.production_dir).rglob("dictionary-*.json"))
        if not paths:
            parser.error("no production dictionary JSON found")
        for path in paths:
            rows = load_entries(path)
            if not isinstance(rows, list):
                parser.error(f"{path}: expected list")
            production.extend(rows)
    errors = validate(payload, production)
    print(f"Candidates: {len(payload.get('entries', []))}; production checked: {len(production)}; errors: {len(errors)}")
    for err in errors:
        print("ERROR:", err)
    if not args.production_dir:
        print("WARNING: production overlap NOT checked; do not auto-merge")
    if errors:
        raise SystemExit(1)

if __name__ == "__main__":
    main()
