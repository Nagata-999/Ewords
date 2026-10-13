"""Validate the immutable production baseline and exact reviewed addition set."""
import json,pathlib,runpy,unicodedata,re
ROOT=pathlib.Path(__file__).resolve().parents[1]
P=runpy.run_path(str(ROOT/'scripts/add-dictionary-pilot.py'))
def check(entries, baseline, expected):
    byid={e['id']:e for e in entries}
    assert len(byid)==len(entries),'Duplicate IDs'
    normalized=[re.sub(r'\s+',' ',unicodedata.normalize('NFKC',e['word']).strip().casefold()) for e in entries]
    assert all(normalized) and len(set(normalized))==len(entries),'Duplicate/empty headwords'
    for wid,sha in baseline.items():assert wid in byid and P['digest'](byid[wid])==sha,'Existing entry changed/deleted: '+wid
    added={wid:e for wid,e in byid.items() if wid not in baseline}
    assert added=={e['id']:e for e in expected},'Unreviewed or modified addition'
    assert len(entries)==len(baseline)+len(expected)
def main():
    read=P['read']; entries=[e for p in (ROOT/'data/dictionary').glob('dictionary-*.json') for e in read(p)]
    baseline=read(P['C']/'baseline.json')['entry_sha256']; expected,mapping=P['build_pilot']()
    check(entries,baseline,expected)
    manifest=read(P['D']/'new-entry-manifest.json')
    assert manifest['entries']==mapping and manifest['total_entry_count']==len(entries)
    assert manifest['base_entry_count']==len(baseline) and manifest['added_entry_count']==len(expected)
    assert read(P['D']/'meta.json')['entry_count']==len(entries)
    print(f'PASS additions: {len(expected)} reviewed; {len(baseline)} existing entries byte-equivalent as canonical JSON (IDs, senses, examples, etymology, all fields)')
if __name__=='__main__':main()
