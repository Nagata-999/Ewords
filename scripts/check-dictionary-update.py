"""Gate a future 30–60 word quality batch against a saved current dictionary.

Run before building/committing. This intentionally does not apply to full releases.
"""
import argparse, json, pathlib, runpy, sys
ROOT=pathlib.Path(__file__).resolve().parents[1]
AUDIT=runpy.run_path(str(ROOT/'scripts/audit-dictionary.py'))

def check(before, after, expected_version):
    def load(directory):
        return {e['id']:e for fn in AUDIT['FILES'] for e in json.loads((directory/fn).read_text(encoding='utf-8'))}
    old,new=load(before),load(after);errors=[]
    version=json.loads((before/'meta.json').read_text(encoding='utf-8'))['version']
    if version!=expected_version:errors.append('baseline version mismatch')
    if old.keys()!=new.keys():errors.append('IDs added/deleted; use independent vocabulary-addition process')
    changed=[i for i in old.keys() & new.keys() if old[i]!=new[i]]
    if not 30<=len(changed)<=60:errors.append('batch must edit 30–60 existing entries')
    for i in changed:
        a,b=old[i],new[i]
        if a['word']!=b['word'] or a.get('etymology')!=b.get('etymology'):errors.append('identity/etymology changed: '+i)
        if 'new-entry-pilot-20261013' in a.get('tags',[]):errors.append('independent addition requires separate review: '+i)
        retained=[x for p in b.get('parts_of_speech',[]) for m in p.get('meanings',[]) for x in m.get('examples',[])]
        for p in a.get('parts_of_speech',[]):
            for m in p.get('meanings',[]):
                for x in m.get('examples',[]):
                    if not AUDIT['QUALITY']['template_example'](a['word'],x.get('en','')) and x not in retained:
                        errors.append('existing example removed; retain it or submit a separately reviewed correction: '+i)
    report=AUDIT['audit'](after)
    if report['fatal_count']:errors.append('corpus structural errors')
    findings=[x for x in report['issues'] if x['id'] in changed]
    if findings:errors.append('edited entries still have quality findings')
    return {'passed':not errors,'base_version':version,'changed_ids':changed,'errors':errors,'edited_entry_findings':findings}

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--baseline',type=pathlib.Path,required=True);p.add_argument('--source',type=pathlib.Path,default=ROOT/'data/dictionary');p.add_argument('--expected-version',required=True);a=p.parse_args()
    report=check(a.baseline,a.source,a.expected_version);print(json.dumps(report,ensure_ascii=False,indent=2));sys.exit(0 if report['passed'] else 1)
