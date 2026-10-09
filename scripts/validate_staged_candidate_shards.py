#!/usr/bin/env python3
"""Build cumulative staged candidates from the manifest; never modify production."""
import json
import sys
import zipfile
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
m = json.loads((ROOT / "data/dictionary-auto/candidate-manifest.json").read_text())
rows = []
for src in m["sources"]:
    path = (ROOT / src["path"]).resolve()
    if not path.is_relative_to(ROOT):
        sys.exit("Unsafe source path")
    chunk = json.loads(path.read_text())["entries"]
    if "take_first" in src:
        chunk = chunk[:src["take_first"]]
    if len(chunk) != src["count"]:
        sys.exit("Count mismatch: " + src["path"])
    rows += chunk
if len(rows) != m["total_candidates"]:
    sys.exit("Total mismatch")
words, ids = set(), set()
for e in rows:
    w, ident = e["word"].strip().casefold(), e["id"]
    if not w or w in words or ident in ids or not ident.startswith("candidate-"):
        sys.exit("Duplicate word or ID: " + w)
    words.add(w)
    ids.add(ident)
    for pos in e["parts_of_speech"]:
        seen = set()
        for meaning in pos["meanings"]:
            definition = meaning.get("definition", "").strip().casefold()
            if not definition or not meaning.get("ja", "").strip() or definition in seen:
                sys.exit("Invalid sense: " + w)
            seen.add(definition)
            if not meaning.get("examples") or any(not x.get("en") or not x.get("ja") for x in meaning["examples"]):
                sys.exit("Missing example: " + w)
    if not e.get("collocations") or any(not c.get("text", "").strip() for c in e["collocations"]):
        sys.exit("Missing collocation: " + w)
if len(sys.argv) > 1:
    with zipfile.ZipFile(sys.argv[1]) as z:
        production = {e["word"].strip().casefold() for n in z.namelist()
                      if Path(n).name.startswith("dictionary-") and n.endswith(".json")
                      for e in json.loads(z.read(n))}
    overlap = words & production
    if overlap:
        sys.exit("Production collisions: " + ", ".join(sorted(overlap)))
print(f"OK: {len(rows)} independent staged candidates; production untouched")
