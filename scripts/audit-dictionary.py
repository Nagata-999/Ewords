"""Read-only corpus audit and identity guard. No network or paid dependencies."""
import argparse, collections, hashlib, json, pathlib, re, runpy, sys, unicodedata
ROOT = pathlib.Path(__file__).resolve().parents[1]
QUALITY = runpy.run_path(str(ROOT/'scripts/dictionary-quality.py'))
SOURCE = runpy.run_path(str(ROOT/'docs/dictionary-v3.331/source-audit_dictionary_full.py'))
FILES = [f'dictionary-{c}.json' for c in 'abcdefghijklmnopqrstuvwxyz'] + ['dictionary-other.json']
def digest(value):
    return hashlib.sha256(json.dumps(value, ensure_ascii=False, sort_keys=True).encode()).hexdigest()
def normalize(value):
    return ' '.join(unicodedata.normalize('NFKC', value).casefold().split())

def audit(directory, baseline=None):
    issues=[]; entries={}; words=set(); formats=collections.Counter(); total=0
    def flag(code, file='', entry=None, path=''):
        issues.append({'code':code,'file':file,'id':entry.get('id') if isinstance(entry,dict) else None,'word':entry.get('word') if isinstance(entry,dict) else None,'path':path})
    for fn in FILES:
        try: data=json.loads((directory/fn).read_text(encoding='utf-8'))
        except (OSError, ValueError): flag('json_read_error',fn);continue
        if not isinstance(data,list):flag('invalid_entry_array',fn);continue
        for e in data:
            total+=1
            if not isinstance(e,dict):flag('invalid_entry_type',fn);continue
            eid=e.get('id');word=e.get('word')
            if not isinstance(eid,str) or not eid.strip():flag('invalid_id',fn,e)
            elif eid in entries:flag('duplicate_id',fn,e)
            else:entries[eid]=e
            if not isinstance(word,str) or not word.strip():flag('empty_headword',fn,e);word=''
            elif normalize(word) in words:flag('duplicate_headword',fn,e)
            words.add(normalize(word))
            if 'senses' in e:flag('mixed_senses_schema',fn,e,'senses')
            for field in ('collocations','phrases'):
                values=e.get(field,[]);rows,errors=QUALITY['expression_data'](values)
                for err in errors:flag(err['code'],fn,e,f'{field}[{err["index"]}]')
                if field=='collocations' and not rows:flag('empty_collocations',fn,e,field)
                if isinstance(values,list):
                    types=set()
                    for c in values:
                        kind='string' if isinstance(c,str) else 'object:'+','.join(sorted(c)) if isinstance(c,dict) else type(c).__name__
                        formats[kind]+=1;types.add(type(c).__name__)
                    if len(types)>1:flag('mixed_expression_item_types',fn,e,field)
            parts=e.get('parts_of_speech')
            if not isinstance(parts,list) or not parts:flag('invalid_parts_of_speech',fn,e);continue
            seen=set()
            for pi,p in enumerate(parts):
                if not isinstance(p,dict) or not isinstance(p.get('pos'),str) or not isinstance(p.get('meanings'),list):flag('invalid_part_type',fn,e,str(pi));continue
                if p['pos'] not in ('noun','verb','adjective','adverb','pronoun','preposition','conjunction','interjection','determiner','auxiliary','phrase'):flag('invalid_part_of_speech',fn,e,str(pi))
                if not p['meanings']:flag('invalid_empty_meanings',fn,e,str(pi))
                for mi,m in enumerate(p['meanings']):
                    path=f'parts_of_speech[{pi}].meanings[{mi}]'
                    if not isinstance(m,dict):flag('invalid_meaning_type',fn,e,path);continue
                    ja=m.get('ja');de=m.get('definition') or m.get('definition_en') or ''
                    if not isinstance(ja,str) or not ja.strip():flag('empty_japanese_meaning',fn,e,path)
                    else:
                        key=(p['pos'],re.sub(r'\s+','',ja).casefold())
                        if key in seen:flag('duplicate_same_pos_gloss',fn,e,path)
                        seen.add(key)
                    if not isinstance(de,str):flag('invalid_definition_type',fn,e,path)
                    elif not de.strip():flag('empty_definition',fn,e,path)
                    elif SOURCE['PHDEF'].search(de) or SOURCE['GENERIC_DEF'].search(de) or QUALITY['template_definition'](de):flag('placeholder_definition',fn,e,path)
                    ex=m.get('examples',[])
                    if not isinstance(ex,list):flag('invalid_examples_type',fn,e,path);continue
                    if not ex:flag('missing_example',fn,e,path)
                    for xi,x in enumerate(ex):
                        xp=path+f'.examples[{xi}]'
                        if not isinstance(x,dict) or any(not isinstance(x.get(k),str) or not x[k].strip() for k in ('en','ja')):flag('missing_bilingual_example',fn,e,xp);continue
                        if SOURCE['PHEX'].search(x['en']) or SOURCE['GENERIC_EX'].search(x['en']) or QUALITY['template_example'](word,x['en']):flag('placeholder_example',fn,e,xp)
                        if SOURCE['META_JA'].search(x['ja']):flag('metalinguistic_japanese_example',fn,e,xp)
    if baseline:
        for old in baseline:
            e=entries.get(old['id'])
            if not e:flag('deleted_existing_entry',entry=old);continue
            if e['word']!=old['word']:flag('changed_existing_headword',entry=e)
            if digest(e.get('etymology'))!=old['etymology_sha256']:flag('changed_existing_etymology',entry=e)
            if old.get('full_sha256') and digest(e)!=old['full_sha256']:flag('changed_independent_addition',entry=e)
    counts=dict(sorted(collections.Counter(x['code'] for x in issues).items()))
    fatal_prefixes=('invalid_','duplicate_id','duplicate_headword','empty_headword','empty_japanese_meaning','json_read_error','deleted_existing','changed_existing','changed_independent')
    fatal=[x for x in issues if x['code'].startswith(fatal_prefixes)]
    return {'entry_count':total,'unique_ids':len(entries),'issue_total':len(issues),'issue_counts':counts,'fatal_count':len(fatal),'expression_formats':dict(formats),'issues':issues}

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--source',type=pathlib.Path,default=ROOT/'data/dictionary');parser.add_argument('--output',type=pathlib.Path);parser.add_argument('--baseline',type=pathlib.Path,default=ROOT/'docs/dictionary-v3.331/identity-baseline.json');args=parser.parse_args()
    result=audit(args.source,json.loads(args.baseline.read_text(encoding='utf-8')) if args.baseline.exists() else None)
    # Preserve the supplier's counting method as a separate, comparable measurement.
    if not result['fatal_count']:result['supplier_method']=SOURCE['audit'](args.source)
    if args.output:args.output.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({k:v for k,v in result.items() if k not in ('issues','supplier_method')},ensure_ascii=False,indent=2))
    sys.exit(1 if result['fatal_count'] else 0)
