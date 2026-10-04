"""Build crawlable dictionary pages. Python 3, no third-party dependencies."""
import argparse, html, json, pathlib, re, runpy
from urllib.parse import quote

ROOT = pathlib.Path(__file__).resolve().parents[1]
BASE = 'https://sushitan.net'
QUALITY = runpy.run_path(str(pathlib.Path(__file__).with_name('dictionary-quality.py')))
def esc(v): return html.escape(str(v), quote=True)
def slug(w): return ''.join(c if c in 'abcdefghijklmnopqrstuvwxyz0123456789-' else '~%x~' % ord(c) for c in w.lower())
def url(w): return '/dictionary/' + slug(w) + '/'
def dump(v): return json.dumps(v, ensure_ascii=False, separators=(',', ':')).replace('<', '\\u003c')
def write(p, s):
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_bytes(s.encode('utf-8'))
SEARCH = '<form action="/dictionary/" role="search"><label for="dictionary-query">英単語を検索</label><div class="search-row"><input id="dictionary-query" name="q" type="search" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="例：abandon" maxlength="100"><button>検索</button></div><p id="search-status" role="status"></p><ul id="search-results"></ul></form>'
def page(title, desc, body, canonical=None, card=None, schema=None, noindex=False):
    return '<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' + f'<title>{esc(title)}</title><meta name="description" content="{esc(desc)}">' + (f'<link rel="canonical" href="{BASE}{canonical}"><meta property="og:url" content="{BASE}{canonical}">' if canonical else '') + f'<meta property="og:title" content="{esc(title)}"><meta property="og:description" content="{esc(desc)}"><meta property="og:type" content="website"><meta property="og:site_name" content="すし単"><meta property="og:image" content="{BASE}/icon-512.png">' + ('<meta name="robots" content="noindex,follow">' if noindex else '') + '<link rel="stylesheet" href="/shared/dictionary.css"><script defer src="/shared/dictionary.js"></script>' + (f'<script type="application/ld+json">{dump(schema)}</script>' if schema else '') + '</head><body><header><a href="/">🍣 すし単</a><a href="/dictionary/">すし辞書 <small>β</small></a><a href="/sushian.html">すし暗</a></header><main>' + body + '<footer><p>すし辞書 β — 収録内容は順次充実させています。</p><a href="/">すし単で英単語をゲーム感覚で覚える</a><p><a href="/contact.html">誤りを知らせる</a> · <a href="/privacy.html">プライバシーポリシー</a></p></footer></main>' + (f'<script id="dictionary-card" type="application/json">{dump(card)}</script>' if card else '') + '</body></html>\n'

def build(source):
    entries = [e for p in sorted(source.glob('dictionary-*.json')) for e in json.loads(p.read_text(encoding='utf-8'))]
    assert entries, 'No dictionary entries'
    lookup = {e['word'].lower(): e for e in entries}
    assert len({slug(e['word']) for e in entries}) == len(entries), 'Duplicate URL'
    out = ROOT / 'dictionary'
    # Remove only paths recorded by our previous build, never unrelated site pages.
    manifest = ROOT / 'data/dictionary-generated.json'
    previous = json.loads(manifest.read_text()) if manifest.exists() else []
    generated = []
    excluded = {'definitions':0,'examples':0}
    def emit(rel, text):
        write(ROOT / rel, text); generated.append(rel)
    pos_names = {'noun':'名詞','verb':'動詞','adjective':'形容詞','adverb':'副詞','preposition':'前置詞','conjunction':'接続詞','pronoun':'代名詞','interjection':'間投詞','determiner':'限定詞','phrase':'句','auxiliary':'助動詞'}
    def link(word): return f'<a href="{url(word)}">{esc(word)}</a>' if word.lower() in lookup else esc(word)
    for e in entries:
        word=e['word']; meanings=[m['ja'] for p in e['parts_of_speech'] for m in p['meanings']]
        body='<nav aria-label="パンくず"><a href="/dictionary/">すし辞書</a> / '+esc(word)+'</nav><article><h1 lang="en">'+esc(word)+'</h1>'
        ipa=e.get('pronunciation') or {}
        body+=''.join(f'<p class="ipa">{label} <span lang="en">{esc(ipa[key])}</span></p>' for key,label in [('ipa_us','米'),('ipa_uk','英')] if ipa.get(key))
        body+='<button type="button" id="speak-word">▶ 音声を聞く</button><span id="speech-status" role="status"></span><p class="muted">音声は端末の読み上げ機能を使用します。</p>'
        for part in e['parts_of_speech']:
            body+='<section><h2>'+esc(pos_names.get(part['pos'],part['pos']))+'</h2><ol class="meanings">'
            for m in part['meanings']:
                body+='<li><p class="meaning">'+esc(m['ja'])+'</p>'
                definition=m.get('definition','')
                if definition:
                    if QUALITY['template_definition'](definition): excluded['definitions']+=1
                    else: body+='<p lang="en">'+esc(definition)+'</p>'
                for x in m.get('examples',[]):
                    if QUALITY['template_example'](word,x['en']): excluded['examples']+=1
                    else: body+='<blockquote><p lang="en">'+esc(x['en'])+'</p><p>'+esc(x['ja'])+'</p></blockquote>'
                body+='</li>'
            body+='</ol></section>'
        for key,label in [('forms','語形変化'),('related','関連する単語')]:
            rows=[]
            labels={'past':'過去形','past_participle':'過去分詞','third_person':'三人称単数','ing':'現在分詞','plural':'複数形','comparative':'比較級','superlative':'最上級','synonyms':'類義語','antonyms':'反意語','derivatives':'派生語'}
            for k,v in (e.get(key) or {}).items():
                values=v if isinstance(v,list) else [s.strip() for s in str(v).split('/')]
                if values: rows.append('<dt>'+esc(labels.get(k,k))+'</dt><dd>'+' · '.join(link(w) for w in values if isinstance(w,str))+'</dd>')
            if rows: body+='<section><h2>'+label+'</h2><dl>'+''.join(rows)+'</dl></section>'
        for key,label in [('phrases','熟語・表現'),('collocations','よく使う組み合わせ')]:
            vals=e.get(key,[])
            if vals: body+='<section><h2>'+label+'</h2><ul>'+''.join('<li>'+ (link(v) if isinstance(v,str) else link(v.get('phrase',v.get('en',''))) + '：'+esc(v.get('ja','')))+'</li>' for v in vals)+'</ul></section>'
        if e.get('usage_note'): body+='<p>'+esc(e['usage_note'])+'</p>'
        body+=f'<a class="learn" href="/sushian.html?dictionary={quote(slug(word))}">この単語を覚える</a><p class="muted">すし暗で意味を選んで練習。間違えた語は、このブラウザの苦手復習に残ります。</p></article>'+SEARCH
        card={'word_id':'dictionary:'+e['id'],'en':word,'jp':'；'.join(meanings),'source_number':None}
        schema={'@context':'https://schema.org','@type':'DefinedTerm','name':word,'description':'；'.join(meanings),'url':BASE+url(word),'inDefinedTermSet':{'@type':'DefinedTermSet','name':'すし辞書','url':BASE+'/dictionary/'}}
        emit('dictionary/'+slug(word)+'/index.html',page(word+'の意味・発音・例文 | すし辞書',f'英単語{word}の意味：'+ '；'.join(meanings)[:110]+'。すし単でそのまま英単語学習もできます。',body,url(word),card,schema))
    emit('dictionary/index.html',page('すし辞書 | 英和辞書 β','英単語の意味・発音・例文を調べて、すし単で覚えよう。',f'<section class="hero"><small>調べて、そのまま覚えよう</small><h1>すし辞書 <small>β</small></h1><p>{len(entries):,}語の英和辞書</p>{SEARCH}</section><h2>アルファベットから探す</h2><nav class="letters">'+''.join(f'<a href="/dictionary/browse-{c}/">{c.upper()}</a>' for c in 'abcdefghijklmnopqrstuvwxyz')+'</nav>','/dictionary/'))
    for c in 'abcdefghijklmnopqrstuvwxyz':
        rows=[e for e in entries if e['word'].lower().startswith(c)]
        emit(f'dictionary/browse-{c}/index.html',page(c.upper()+'から始まる英単語 | すし辞書','収録単語の一覧',f'<h1>{c.upper()}から始まる英単語</h1><ul class="word-list">'+''.join('<li>'+link(e['word'])+'</li>' for e in rows)+'</ul>',f'/dictionary/browse-{c}/'))
    emit('dictionary/search-index.json',dump([[e['word'],e.get('search_terms',[])] for e in entries]))
    missing=page('単語が見つかりません | すし辞書','すし辞書で英単語を検索', '<h1>この単語はまだすし辞書に収録されていません。</h1><p>スペルを確認して、もう一度検索してください。</p>'+SEARCH+'<p><a href="/dictionary/">すし辞書トップへ戻る</a></p>',noindex=True)
    emit('dictionary/404.html',missing)
    # A root 404 disables SPA fallbacks on static hosts. Preserve any existing custom 404.
    if not (ROOT/'404.html').exists() or 'すし辞書で英単語を検索' in (ROOT/'404.html').read_text(encoding='utf-8'):
        emit('404.html',missing)
    locations=['/dictionary/']+[url(e['word']) for e in entries]+[f'/dictionary/browse-{c}/' for c in 'abcdefghijklmnopqrstuvwxyz']
    maps=[]
    for i in range(0,len(locations),10000):
        name=f'dictionary/sitemap-{i//10000+1}.xml'; maps.append(name)
        emit(name,'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+''.join('<url><loc>'+esc(BASE+u)+'</loc></url>' for u in locations[i:i+10000])+'</urlset>')
    emit('dictionary/sitemap.xml','<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+''.join('<sitemap><loc>'+BASE+'/'+m+'</loc></sitemap>' for m in maps)+'</sitemapindex>')
    for rel in set(previous)-set(generated):
        p=(ROOT/rel).resolve()
        if p.is_relative_to(out.resolve()) and p.is_file(): p.unlink()
    write(manifest,dump(generated))
    write(ROOT/'data/dictionary-build-report.json',dump({'entries':len(entries),'excluded_unfinished_templates':excluded,'sitemaps':len(maps)}))
    print(f'Built {len(entries)} dictionary entries, {len(maps)} sitemaps')
if __name__=='__main__':
    parser=argparse.ArgumentParser(); parser.add_argument('--source',type=pathlib.Path,default=ROOT/'data/dictionary'); args=parser.parse_args(); build(args.source)
