"""Add the explicitly reviewed pilot; never update an existing entry."""
import copy, hashlib, json, pathlib, re
ROOT=pathlib.Path(__file__).resolve().parents[1]
D=ROOT/'data/dictionary'; C=ROOT/'data/dictionary-candidates/20261013'
WORDS='misallocation counterargument counteract foreseeable outweigh adversarial counterproductive debrief deliberative deplete overgeneralize inadvertent inherently disincentive unprecedented unwarranted abstruse adversity caveat coercive entrenched hinder impair impartial innate insightful misconception overarching proactive tenacity'.split()
def read(p):return json.loads(p.read_text(encoding='utf-8'))
def digest(e):return hashlib.sha256(json.dumps(e,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def save(p,v):p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def build_pilot():
    source={e['word']:e for e in read(C/'sushitan_new_candidates_library_cumulative_20261013_09.json')['entries']}
    audit={r['word']:r for r in read(C/'phase1-audit.json')['rows']}
    entries=[]; mapping=[]
    for number,word in enumerate(WORDS,13528):
        assert audit[word]['decision']=='pending_editorial_review',word
        original=source[word]; e=copy.deepcopy(original)
        e['id']=f'sw-{number:05d}'; e['status']='enriched'; e['tags'].append('new-entry-pilot-20261013')
        changes=[]
        if word=='inadvertent':
            example=e['parts_of_speech'][0]['meanings'][0]['examples'][0]
            changes.append({'field':'parts_of_speech[0].meanings[0].examples[0].ja','before':example['ja'],'after':'報告書に意図せず生じた誤りが混乱を招いた。','reason':'Natural Japanese: avoid attributing carelessness to the error itself.'})
            example['ja']=changes[-1]['after']
        entries.append(e)
        mapping.append({'word':word,'candidate_id':original['id'],'id':e['id'],'candidate_sha256':digest(original),'entry_sha256':digest(e),'editorial_review':'approved_for_pilot','reviewed_fields':['headword','pos','Japanese gloss','English definition','English example','Japanese translation','usage','collocations','major senses'],'editorial_changes':changes})
    return entries,mapping
def main():
    baseline=read(C/'baseline.json'); files={p:read(p) for p in D.glob('dictionary-*.json')}
    all_entries=[e for es in files.values() for e in es]; byid={e['id']:e for e in all_entries}
    assert len(byid)==len(all_entries),'Duplicate ID'
    for wid,sha in baseline['entry_sha256'].items():assert wid in byid and digest(byid[wid])==sha, wid
    entries,mapping=build_pilot(); pending={}
    normalize=lambda w:re.sub(r'\s+',' ',w.strip().casefold())
    for e in entries:
        if e['id'] in byid:
            assert byid[e['id']]==e,'ID already in use: '+e['id']
            continue
        assert not any(normalize(x['word'])==normalize(e['word']) for x in all_entries),'Headword exists: '+e['word']
        path=D/f"dictionary-{e['word'][0]}.json"
        pending.setdefault(path,[]).append(e)
    # Validate the complete plan before writing any file. Preserve original bytes up to closing array.
    for path,es in pending.items():
        raw=path.read_text(encoding='utf-8'); end=raw.rfind(']'); assert end>=0
        text=raw[:end].rstrip()+',\n'+',\n'.join('  '+json.dumps(e,ensure_ascii=False,indent=2).replace('\n','\n  ') for e in es)+'\n'+raw[end:]
        assert json.loads(text)==files[path]+es
        path.write_text(text,encoding='utf-8',newline='')
    manifest={'batch_id':'new-entry-pilot-20261013','base_commit':baseline['commit'],'base_version':'v3.186','base_entry_count':13500,'added_entry_count':30,'total_entry_count':13530,'entries':mapping,'review_scope':'30 entries individually reviewed by Codex; not independent expert review. CEFR/Eiken/frequency remain provisional. Remaining candidates are not approved.'}
    save(D/'new-entry-manifest.json',manifest)
    meta=read(D/'meta.json'); meta.update(entry_count=13530,max_id='sw-13557',new_entry_batch='new-entry-pilot-20261013',new_entry_count=30)
    save(D/'meta.json',meta)
    print('Pilot: 30 reviewed entries; existing 13,500 entries unchanged')
if __name__=='__main__':main()
