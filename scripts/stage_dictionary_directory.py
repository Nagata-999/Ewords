#!/usr/bin/env python3
"""Merge staged candidates into a COPY of a dictionary directory. No production writes."""
import argparse
import copy
import json
import re
from pathlib import Path
from validate_dictionary_candidates import validate, norm

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--base-dir", required=True)
    p.add_argument("--candidates", required=True)
    p.add_argument("--output-dir", required=True)
    a = p.parse_args()
    base, output = Path(a.base_dir).resolve(), Path(a.output_dir).resolve()
    if output == base or base in output.parents or output in base.parents:
        p.error("output must be independent of base")
    files = sorted(base.glob("dictionary-*.json"))
    if len(files) != 27:
        p.error(f"expected 27 dictionary JSON files, got {len(files)}")
    tables, old = {}, []
    for f in files:
        obj = json.loads(f.read_text(encoding="utf-8"))
        if not isinstance(obj, list):
            p.error(f"{f}: expected array")
        tables[f.name] = obj
        old.extend(obj)
    payload = json.loads(Path(a.candidates).read_text(encoding="utf-8"))
    errors = validate(payload, old)
    if errors:
        p.error("validation failed: " + "; ".join(errors[:12]))
    ids = [norm(e.get("id")) for e in old]
    words = [norm(e.get("word")) for e in old]
    if len(set(ids)) != len(ids) or len(set(words)) != len(words):
        p.error("production has duplicate IDs or headwords")
    matches = [re.fullmatch(r"sw-(\d+)", x) for x in ids]
    if not all(matches):
        p.error("unexpected production ID scheme")
    next_id = max(int(x.group(1)) for x in matches)
    for row in sorted(payload["entries"], key=lambda x: norm(x["word"])):
        next_id += 1
        entry = copy.deepcopy(row)
        entry["id"] = f"sw-{next_id:05d}"
        entry["status"] = "active"
        first = norm(entry["word"])[0]
        name = f"dictionary-{first}.json" if first.isalpha() else "dictionary-other.json"
        if name not in tables:
            p.error(f"missing dictionary bucket {name}")
        tables[name].append(entry)
    output.mkdir(parents=True, exist_ok=False)
    for name, rows in tables.items():
        (output / name).write_text(json.dumps(rows, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (output / "merge-report.json").write_text(json.dumps({
        "base_count": len(old), "added": len(payload["entries"]),
        "total": len(old) + len(payload["entries"]),
        "status": "staged_not_deployed"
    }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"STAGED: {len(old)} + {len(payload['entries'])} = {len(old) + len(payload['entries'])} entries")

if __name__ == "__main__":
    main()
