#!/usr/bin/env python3
"""Full non-destructive quality audit over all 27 dictionary JSON files."""
import collections,json,pathlib,re,sys
R=pathlib.Path(__file__).resolve().parent
FILES=[f'dictionary-{c}.json' for c in 'abcdefghijklmnopqrstuvwxyz']+['dictionary-other.json']
PHEX=re.compile(r'\bThe word\b|\bIn advanced (?:academic )?(?:English|reading)\b|\bcan carry the meaning\b|\bappears in many kinds of English texts\b|\bis commonly used in this (?:kind of )?context\b|\bThe study discusses\b|\bThe report includes information about\b|\bThe discussion focused on\b|\bThey talked about\b|^This is a common example of\b|^This [A-Za-z][A-Za-z -]{1,55} is important\.$',re.I)
PHDEF=re.compile(r'^(?:a person, (?:thing|object)|a person, object|a concept, state|a word used before|to perform or cause the action expressed|having the quality (?:or characteristic )?expressed|in the manner or degree expressed|a person, thing, activity|to carry out or experience the action expressed|a person, thing, state, process|a person, thing, state, or idea|a person, thing, state, process, or idea|a person, object, place|a thing or idea|relating to the concept of|a term for)\b',re.I)
BLANK=re.compile(r'^\s*(?:[・:：\-–—]\s*)*$')
META_JA=re.compile(r'この例では|ここでは.*(?:意味|用い)|という意味で使われている')
GENERIC_EX=re.compile(r'^It was an? .{1,50} situation for everyone involved\.$|^The term [\"“].{1,50}[\"”] is used here in the sense',re.I)
GENERIC_DEF=re.compile(r'^having the quality or condition expressed by|^the action or process of something related to',re.I)
def audit(root):
    counts=collections.Counter();examples=collections.defaultdict(list);ids=set();words=set();formats=collections.Counter();n=0
    for fn in FILES:
        data=json.loads((root/fn).read_text(encoding='utf-8'))
        for e in data:
            n+=1;w=e.get('word','');eid=e.get('id','')
            def flag(code):
                counts[code]+=1
                if len(examples[code])<12:examples[code].append({'file':fn,'word':w,'id':eid})
            if not eid or eid in ids:flag('duplicate_or_missing_id')
            ids.add(eid)
            if not w or w.casefold() in words:flag('duplicate_or_missing_headword')
            words.add(w.casefold())
            if 'senses' in e:flag('mixed_senses_schema')
            col=e.get('collocations',[])
            if not isinstance(col,list):flag('invalid_collocation_schema');col=[]
            if not col:flag('empty_collocation_array')
            kinds=set()
            for c in col:
                if isinstance(c,str):t=c;kinds.add('string');formats['string']+=1
                elif isinstance(c,dict):
                    t=c.get('text') or c.get('en') or '';kinds.add('object');formats['object:'+','.join(sorted(c))]+=1
                    if not c.get('ja'):flag('collocation_missing_ja')
                    if not c.get('text') and not c.get('en'):flag('collocation_missing_en')
                else:t='';kinds.add('invalid');formats['other']+=1
                if not isinstance(t,str) or BLANK.fullmatch(t):flag('blank_collocation')
            if len(kinds)>1:flag('mixed_collocation_item_types')
            seen=set();seen_gloss=set()
            for p in e.get('parts_of_speech',[]):
                pos=p.get('pos','')
                for m in p.get('meanings',[]):
                    ja=m.get('ja','');de=m.get('definition') or m.get('definition_en') or ''
                    if not isinstance(de,str) or not de.strip():flag('empty_definition')
                    elif PHDEF.search(de.strip()) or GENERIC_DEF.search(de.strip()):flag('placeholder_definition')
                    ex=m.get('examples',[])
                    if not ex:flag('missing_example')
                    for x in ex:
                        en=x.get('en','');jp=x.get('ja','')
                        if not en or not jp:flag('missing_bilingual_example')
                        elif PHEX.search(en) or GENERIC_EX.search(en):flag('placeholder_example')
                        if isinstance(jp,str) and META_JA.search(jp):flag('metalinguistic_japanese_example')
                    key=(pos,re.sub(r'\s+','',str(ja)).casefold(),re.sub(r'\s+','',str(de)).casefold())
                    gloss=(pos,re.sub(r'\s+','',str(ja)).casefold())
                    if key in seen:flag('duplicate_same_pos_sense')
                    if gloss in seen_gloss:flag('possible_duplicate_same_pos_gloss')
                    seen.add(key);seen_gloss.add(gloss)
    return {'entry_count':n,'dictionary_files':len(FILES),'unique_ids':len(ids),'unique_headwords':len(words),'unresolved_issue_counts':dict(sorted(counts.items())),'unresolved_issue_total':sum(counts.values()),'unresolved_issue_examples':dict(examples),'collocation_schema_distribution':dict(sorted(formats.items())),'notes':['Legacy findings remain open; new curated entries must have no issues.','Empty collocation arrays are now counted (previous audits excluded them).','Potential same-POS same-gloss duplicates require editorial review; they are not necessarily errors.','Display-generation code has not been changed or verified.']}
if __name__=='__main__':
    root=pathlib.Path(sys.argv[1]) if len(sys.argv)>1 else R
    print(json.dumps(audit(root),ensure_ascii=False,indent=2))
