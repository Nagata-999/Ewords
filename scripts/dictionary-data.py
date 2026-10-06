"""Validate dictionary sources and deterministically refresh repository metadata.
No source headwords or etymology indexes are rewritten.
"""
import argparse, collections, hashlib, json, pathlib, runpy, re, unicodedata
ROOT=pathlib.Path(__file__).resolve().parents[1]
QUALITY=runpy.run_path(str(ROOT/'scripts/dictionary-quality.py'))
def read(p): return json.loads(p.read_text(encoding='utf-8'))
def encoded(v): return (json.dumps(v,ensure_ascii=False,indent=2)+'\n').encode('utf-8')
def validate(source):
    entries=[e for p in sorted(source.glob('dictionary-*.json')) for e in read(p)]
    meta=read(source/'meta.json'); ledger=read(source/'id-ledger.json'); removed=read(source/'removed_entries.json')
    ids={e['id'] for e in entries}; words={e['word'] for e in entries}
    assert len(entries)==len(ids)==len(words)==meta['entry_count'], 'Duplicate/missing entries'
    assert len({unicodedata.normalize('NFKC',w).strip().lower() for w in words})==len(words), 'Normalized collision'
    retired=set(ledger['historical_gaps_reserved'])|{e['id'] for e in removed}
    assert not ids & retired, 'Retired ID reused'
    assert {e['id']:e['word'] for e in entries}==ledger['assigned'], 'ID assignment changed: explicitly extend ledger for new words'
    assert max(int(e['id'][3:]) for e in entries)==ledger['current_max_id']==int(meta['max_id'][3:]), 'ID maximum'
    index=[];queue=[];count=collections.Counter();unknown_related=set()
    for e in entries:
        word=e['word']; assert re.fullmatch(r'sw-\d{5,}',e['id']) and word.strip(),word
        assert e['status'] in {'basic','needs_enrichment'},word
        assert isinstance(e['search_terms'],list) and all(isinstance(x,str) for x in e['search_terms']),word
        assert e['parts_of_speech'],word
        reasons=[]
        if e['status']=='needs_enrichment':reasons.append('needs_enrichment')
        for part in e['parts_of_speech']:
            assert isinstance(part['pos'],str) and part['meanings'],word
            for m in part['meanings']:
                assert isinstance(m['ja'],str) and m['ja'].strip(),word
                assert isinstance(m.get('definition',''),str),word
                count['senses']+=1
                if m.get('definition'):
                    count['definitions']+=1
                    if QUALITY['template_definition'](m['definition']):count['excluded_definitions']+=1;reasons.append('template_definition')
                for x in m.get('examples',[]):
                    assert isinstance(x['en'],str) and x['en'].strip() and isinstance(x['ja'],str) and x['ja'].strip(),word
                    count['examples']+=1
                    if QUALITY['template_example'](word,x['en']):count['excluded_examples']+=1;reasons.append('template_example')
        for key in ['phrases','collocations']:
            assert isinstance(e.get(key,[]),list),word
            for x in e.get(key,[]):assert isinstance(x,str) or (isinstance(x,dict) and isinstance(x.get('phrase',x.get('en')),str) and isinstance(x.get('ja',''),str)),word
            count[key]+=len(e.get(key,[]))
        et=e.get('etymology')
        if et:
            assert set(et)<= {'origin','history','roots','related'}, 'Unsupported etymology fields: '+word
            assert all(isinstance(et.get(k,''),str) for k in ['origin','history']),word
            assert isinstance(et.get('roots',[]),list) and isinstance(et.get('related',[]),list),word
            for x in et.get('roots',[]):assert isinstance(x,dict) and set(x)<={'form','meaning'} and all(isinstance(x.get(k),str) for k in ['form','meaning']),word
            for w in et.get('related',[]):
                assert isinstance(w,str),word
                if w not in words:unknown_related.add(w)
            count['etymology_entries']+=1
        count[e['status']]+=1
        if reasons:queue.append({'id':e['id'],'word':word,'reasons':sorted(set(reasons))})
        index.append({'w':word,'id':e['id'],'c':e['level']['cefr'],'e':e['level']['eiken'],'s':e['status']})
    for filename,key in [('etymology-roots.json','roots'),('etymology-prefixes.json','prefixes')]:
        data=read(source/filename); assert isinstance(data[key],dict)
        assert data[{'roots':'root_count','prefixes':'prefix_count'}[key]]==len(data[key])
        for form,row in data[key].items():
            assert isinstance(form,str) and isinstance(row['meaning'],str) and isinstance(row['words'],list)
            assert all(w in words for w in row['words']), 'Unknown word in '+filename
        count['etymology_'+key+'_count']=len(data[key])
    return {'version':meta['version'],'entry_count':len(entries),'passed':True,'scope':'Structural checks, ID ledger, retired IDs, reference validity and deterministic derivatives; not an editorial accuracy certification.','counts':dict(sorted(count.items())),'uncollected_etymology_related_words':sorted(unknown_related)},sorted(index,key=lambda x:x['w']),sorted(queue,key=lambda x:x['word'])
def refresh(source,check=False):
    report,index,queue=validate(source)
    artifacts={'validation.json':encoded(report),'index.json':encoded(index),'qa_queue.json':encoded(queue)}
    hashes={p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(source.glob('*.json')) if p.name not in {*artifacts,'checksums.json'}}
    hashes.update({k:hashlib.sha256(v).hexdigest() for k,v in artifacts.items()})
    artifacts['checksums.json']=encoded(dict(sorted(hashes.items())))
    for name,data in artifacts.items():
        p=source/name
        if check: assert p.exists() and p.read_bytes()==data,'Stale derivative: '+name
        else:p.write_bytes(data)
    print(json.dumps(report,ensure_ascii=False))
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--check',action='store_true');parser.add_argument('--source',type=pathlib.Path,default=ROOT/'data/dictionary');args=parser.parse_args();refresh(args.source,args.check)
