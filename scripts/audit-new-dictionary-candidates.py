import pathlib,json,hashlib,collections,unicodedata,re,runpy
ROOT=pathlib.Path(__file__).resolve().parents[1]; B=ROOT
D=ROOT/'data/dictionary-candidates/20261013'
def read(p):return json.loads(p.read_text(encoding='utf-8'))
def save(p,v):p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def norm(s):return re.sub(r'\s+',' ',unicodedata.normalize('NFKC',s).strip().lower())
def loose(s):return re.sub(r'[\s\-‐‑–—’\x27]','',norm(s))
baseline=read(D/'baseline.json')
old=[e for p in (ROOT/'data/dictionary').glob('dictionary-*.json') for e in read(p) if e['id'] in baseline['entry_sha256']]
c=read(D/'sushitan_new_candidates_library_cumulative_20261013_09.json')['entries']
other=read(D/'github-160-reference.json')['entries']
oi={e['id'] for e in old}; gi={e['id'] for e in other}
def groups(es,key):
 d=collections.defaultdict(list)
 for e in es:d[key(e)].append(e)
 return d
names=groups(old,lambda e:norm(e['word'])); raw=groups(old,lambda e:e['word']); lnames=groups(old,lambda e:loose(e['word'])); gn=groups(other,lambda e:norm(e['word'])); gl=groups(other,lambda e:loose(e['word'])); cn=groups(c,lambda e:norm(e['word'])); cl=groups(c,lambda e:loose(e['word'])); ci=groups(c,lambda e:e['id'])
aliases=collections.defaultdict(list); phrases=collections.defaultdict(list)
for e in old:
 for s in e.get('search_terms',[]):aliases[norm(s)].append(e['id'])
 for p in e.get('phrases',[]):
  s=p if isinstance(p,str) else next((p[k] for k in ['phrase','en','text'] if p.get(k)), '')
  if s:phrases[norm(s)].append(e['id'])
quality=runpy.run_path(str(B/'scripts/dictionary-quality.py')); rows=[]
allowed={'noun','verb','adjective','adverb','preposition','conjunction','pronoun','interjection','determiner','phrase','auxiliary'}
for e in c:
 errors=[];risks=[];w=e.get('word','');wid=e.get('id','');n=norm(w);l=loose(w)
 if not w.strip() or not wid:errors.append('missing_headword_or_id')
 if wid in oi or wid in gi or len(ci[wid])>1:errors.append('id_collision')
 if w in raw:errors.append('existing_exact_headword')
 if n in names:errors.append('existing_normalized_headword')
 if len(cn[n])>1:errors.append('candidate_normalized_duplicate')
 for key,hit in [('existing_loose_variant',l in lnames),('candidate_loose_variant',len(cl[l])>1),('github160_headword',n in gn),('github160_loose_variant',l in gl),('existing_search_alias',n in aliases),('existing_phrase',n in phrases)]:
  if hit:risks.append(key)
 seen=set()
 if not e.get('parts_of_speech'):errors.append('missing_parts_of_speech')
 for p in e.get('parts_of_speech',[]):
  if p.get('pos') not in allowed:errors.append('unsupported_pos')
  if not p.get('meanings'):errors.append('missing_meanings')
  for m in p.get('meanings',[]):
   k=(p.get('pos'),norm(m.get('ja','')))
   if k in seen:errors.append('duplicate_sense')
   seen.add(k)
   if not m.get('ja') or not re.search('[ぁ-んァ-ヶ一-龯]',m['ja']):errors.append('missing_japanese_gloss')
   if not m.get('definition','').strip():errors.append('missing_definition')
   if quality['template_definition'](m.get('definition','')):risks.append('definition_template_heuristic')
   if not m.get('examples'):errors.append('missing_examples')
   for x in m.get('examples',[]):
    if not x.get('en','').strip() or not x.get('ja','').strip():errors.append('incomplete_bilingual_example')
    if not re.search('[ぁ-んァ-ヶ一-龯]',x.get('ja','')):errors.append('missing_japanese_example')
    if quality['template_example'](w,x.get('en','')):risks.append('example_template_heuristic')
 if not e.get('usage_note','').strip():risks.append('missing_usage_note')
 if not e.get('collocations'):risks.append('missing_collocations')
 for p in e.get('collocations',[]):
  if not (p.strip() if isinstance(p,str) else any(isinstance(p.get(k),str) and p[k].strip() for k in ['phrase','en','text'])):errors.append('blank_collocation')
 text=json.dumps(e,ensure_ascii=False)
 if '\ufffd' in text or re.search(r'\b(?:TODO|TBD|FIXME|lorem ipsum)\b|仮置き|要記入',text,re.I):errors.append('placeholder_or_replacement_character')
 if w in {'broaden','streamline','anachronistic'}:risks.append('editorial_sense_coverage_review')
 if w=='interdependent':risks.append('editorial_usage_preposition_review')
 rows.append({'id':wid,'word':w,'errors':sorted(set(errors)),'review_flags':sorted(set(risks)),'decision':'quarantine' if errors or risks else 'pending_editorial_review'})
validation=read(D/'sushitan_new_candidates_20261013_09_validation.json')
hashes={fn:hashlib.sha256((D/fn).read_bytes()).hexdigest()==sha for fn,sha in validation['file_sha256'].items()}
batch=read(D/'sushitan_new_candidates_20261013_09.json')['entries']; byid={e['id']:e for e in c}
report={'source_count':len(c),'latest_batch_count':len(batch),'latest_batch_is_subset':all(byid.get(e['id'])==e for e in batch),'source_hash_checks':hashes,'production_count':len(old),'github160_count':len(other),'github160_unique_ids':len(gi),'github160_unique_headwords':len(gn),'error_counts':dict(collections.Counter(k for r in rows for k in r['errors'])),'review_flag_counts':dict(collections.Counter(k for r in rows for k in r['review_flags'])),'quarantined_count':sum(r['decision']=='quarantine' for r in rows),'pending_editorial_count':sum(r['decision']=='pending_editorial_review' for r in rows),'candidate_schema_key_sets':dict(collections.Counter(','.join(sorted(e)) for e in c)),'rows':rows,'limits':'Automated structural checks and risk screening cover all candidates. Semantic accuracy, naturalness and polysemy require editorial review before promotion; no blanket quality approval.'}
report['collision_checks']={k:sum(k in r['errors'] or k in r['review_flags'] for r in rows) for k in ['id_collision','existing_exact_headword','existing_normalized_headword','candidate_normalized_duplicate','duplicate_sense','existing_loose_variant','candidate_loose_variant','existing_search_alias','existing_phrase','github160_headword','github160_loose_variant']}
save(D/'phase1-audit.json',report)
save(D/'quarantine.json',[r for r in rows if r['decision']=='quarantine'])
print(json.dumps({k:v for k,v in report.items() if k!='rows'},ensure_ascii=False,indent=2))
