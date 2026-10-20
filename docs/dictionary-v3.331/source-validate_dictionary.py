#!/usr/bin/env python3
"""Validate the complete Sushi Dictionary release in this directory."""
import json, pathlib, re, sys
root=pathlib.Path(__file__).resolve().parent
errors=[];entries=[];ids=set();words=set()
files=[root/f'dictionary-{c}.json' for c in 'abcdefghijklmnopqrstuvwxyz']+[root/'dictionary-other.json']
for file in files:
    if not file.is_file():errors.append('missing dictionary '+file.name);continue
    try:arr=json.loads(file.read_text(encoding='utf-8'))
    except Exception as ex:errors.append('invalid JSON '+file.name+': '+str(ex));continue
    if not isinstance(arr,list):errors.append('not an array '+file.name);continue
    for e in arr:
        w=e.get('word');wid=e.get('id');entries.append(e)
        if not w or not wid:errors.append('missing ID/headword '+file.name)
        if wid in ids:errors.append('duplicate ID '+str(wid))
        if w in words:errors.append('duplicate headword '+str(w))
        ids.add(wid);words.add(w)
try:
    progress=json.loads((root/'progress.json').read_text(encoding='utf-8'))
    manifest=json.loads((root/'release-manifest.json').read_text(encoding='utf-8'))
    meta=json.loads((root/'meta.json').read_text(encoding='utf-8'))
    version=manifest.get('target_version')
    count=manifest.get('changed_word_count')
    if len(entries)!=meta.get('entry_count'):errors.append('entry count mismatch')
    if len(entries)!=manifest.get('dictionary_entry_count'):errors.append('manifest entry count mismatch')
    if progress.get('current_version')!=version or meta.get('version')!=version:errors.append('version mismatch')
    if manifest.get('package_type')!='full':errors.append('not full release')
    if progress.get('enriched_this_run')!=count or progress.get('words_enhanced_this_run')!=count:errors.append('per-run count mismatch')
    if progress.get('cumulative_enriched_words')!=manifest.get('cumulative_enriched_words'):errors.append('cumulative count mismatch')
    if progress.get('full_zip')!=manifest.get('full_zip'):errors.append('ZIP name mismatch')
    changed={x['word']:x for x in manifest.get('changed_words',[])}
    tagged={e['word']:e for e in entries if 'curated-'+str(version) in e.get('tags',[])}
    if len(changed)!=count or set(changed)!=set(tagged):errors.append('manifest/tagged entry mismatch')
    for w,e in tagged.items():
        if e.get('status')!='enriched':errors.append('status mismatch '+w)
        if changed[w]['id']!=e['id']:errors.append('ID mismatch '+w)
        if not e.get('collocations') or not e.get('usage_note'):errors.append('missing collocations/note '+w)
        for p in e.get('parts_of_speech',[]):
            if p.get('pos') not in ('noun','verb','adjective','adverb','pronoun','preposition','conjunction','interjection','determiner','auxiliary','phrase'):
                errors.append('bad POS '+w)
            for m in p.get('meanings',[]):
                if not m.get('ja') or not m.get('definition') or not m.get('examples'):errors.append('incomplete sense '+w)
                for ex in m.get('examples',[]):
                    if not ex.get('en') or not ex.get('ja'):errors.append('incomplete bilingual example '+w)
                    if re.search(r'The word [\"\']|The study discusses|The report discusses|The discussion focused on|In academic contexts',ex.get('en',''),re.I):
                        errors.append('placeholder example '+w)
    for fn in ('etymology-roots.json','etymology-prefixes.json'):
        json.loads((root/fn).read_text(encoding='utf-8'))
    if manifest.get('deleted_files') or manifest.get('deleted_word_ids'):errors.append('unexpected deletions')
except Exception as ex:errors.append('metadata error: '+str(ex))
for p in root.iterdir():
    n=p.name.lower()
    if p.suffix.lower()=='.html' or n.startswith('sitemap') or 'search-index' in n or 'search_index' in n:
        errors.append('public artifact present '+p.name)
# Strict checks for every edited entry, plus consistency with the full-corpus audit.
try:
    from audit_dictionary_full import audit, PHEX, PHDEF, GENERIC_DEF, GENERIC_EX, BLANK
    checked=audit(root)
    stored=json.loads((root/('quality-audit-'+str(version)+'.json')).read_text(encoding='utf-8'))
    if checked['unresolved_issue_counts']!=stored['unresolved_issue_counts']:
        errors.append('quality audit report differs from current dictionary')
    if checked['unresolved_issue_total']!=progress.get('unresolved_quality_audit_issues'):
        errors.append('progress quality audit count mismatch')
    for w,e in tagged.items():
        if 'senses' in e:errors.append('legacy senses schema in changed entry '+w)
        seen=set()
        for p in e.get('parts_of_speech',[]):
            for m in p.get('meanings',[]):
                gloss=(p.get('pos'),str(m.get('ja','')).strip().casefold())
                if gloss in seen:errors.append('duplicate POS and gloss in changed entry '+w)
                seen.add(gloss)
                de=str(m.get('definition') or '')
                if not de.strip() or PHDEF.search(de) or GENERIC_DEF.search(de):
                    errors.append('missing or placeholder definition '+w)
                if not m.get('examples'):errors.append('missing examples '+w)
                for ex in m.get('examples',[]):
                    en=ex.get('en') or '';ja=ex.get('ja') or ''
                    if not en.strip() or not ja.strip() or PHEX.search(en) or GENERIC_EX.search(en):
                        errors.append('placeholder or incomplete bilingual example '+w)
        for c in e.get('collocations',[]):
            if not isinstance(c,dict) or not c.get('text') or not c.get('en') or not c.get('ja'):
                errors.append('incomplete collocation '+w)
            elif BLANK.fullmatch(c['text']):errors.append('blank collocation '+w)
except Exception as ex:errors.append('strict edited-entry audit failed: '+str(ex))
result={'passed':not errors,'version':manifest.get('target_version'),'entry_count':len(entries),'unique_ids':len(ids),'edited_word_count':count,'errors':errors}
print(json.dumps(result,ensure_ascii=False,indent=2))
sys.exit(1 if errors else 0)
