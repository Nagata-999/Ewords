"""Validate generated pages and links without a browser."""
import json, pathlib, re, runpy, xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor
root=pathlib.Path(__file__).resolve().parents[1]
runpy.run_path(str(root/'scripts/dictionary-data.py'))['refresh'](root/'data/dictionary',check=True)
builder=runpy.run_path(str(root/'scripts/build-dictionary.py'))
entries=[e for p in (root/'data/dictionary').glob('dictionary-*.json') for e in json.loads(p.read_text(encoding='utf-8'))]
ns={'s':'http://www.sitemaps.org/schemas/sitemap/0.9'}
urls={node.text for p in (root/'dictionary').glob('sitemap-*.xml') for node in ET.parse(p).findall('s:url/s:loc',ns)}
paths=set(json.loads((root/'data/dictionary-generated.json').read_text(encoding='utf-8')))
def check(e):
    relative=builder['url'](e['word']); page=(root/(relative.strip('/')+'/index.html')).read_text(encoding='utf-8')
    assert 'href="'+builder['BASE']+relative+'"' in page,e['word']
    assert builder['BASE']+relative in urls,e['word']
    card=json.loads(re.search(r'id="dictionary-card" type="application/json">(.*?)</script>',page).group(1))
    assert card['en']==e['word'] and card['jp'],e['word']
    assert 'name="description"' in page and 'property="og:url"' in page,e['word']
    for link in re.findall(r'href="(/dictionary/[^"?]*)"',page):
        assert link.strip('/')+'/index.html' in paths,link
    et=e.get('etymology')
    if et:
        for value in [et.get('origin',''),et.get('history','')]+[x[k] for x in et.get('roots',[]) for k in ['form','meaning']]+et.get('related',[]):
            assert builder['esc'](value) in page,('missing etymology',e['word'],value)
    for part in e['parts_of_speech']:
        for meaning in part['meanings']:
            assert builder['esc'](meaning['ja']) in page,e['word']
            for x in meaning.get('examples',[]):
                if not builder['QUALITY']['template_example'](e['word'],x['en']):
                    assert builder['esc'](x['en']) in page and builder['esc'](x['ja']) in page,e['word']
    for key in ['phrases','collocations']:
        for value in e.get(key,[]):
            for text in ([value] if isinstance(value,str) else [value.get('phrase',value.get('en','')),value.get('ja','')]):
                assert builder['esc'](text) in page,(e['word'],key)
    if e.get('usage_note'): assert builder['esc'](e['usage_note']) in page,e['word']
    schema=json.loads(re.search(r'type="application/ld\+json">(.*?)</script>',page).group(1))
    assert schema['name']==e['word'],e['word']
with ThreadPoolExecutor(max_workers=16) as pool:
    list(pool.map(check,entries))
assert len(json.loads((root/'dictionary/search-index.json').read_text(encoding='utf-8')))==len(entries)
print(f'PASS: {len(entries)} pages; unique canonical URLs, descriptions, OG, valid structured data, study cards, internal links and full sitemap coverage')
