"""Regression coverage for ID protection, malformed etymology and stale derivatives."""
import json,pathlib,runpy,shutil,tempfile
root=pathlib.Path(__file__).resolve().parents[1]
data=runpy.run_path(str(root/'scripts/dictionary-data.py'));builder=runpy.run_path(str(root/'scripts/build-dictionary.py'))
with tempfile.TemporaryDirectory() as temporary:
    source=pathlib.Path(temporary)/'dictionary';shutil.copytree(root/'data/dictionary',source)
    data['refresh'](source,True)
    def reject(name,edit):
        p=source/name;original=p.read_bytes();obj=json.loads(original);edit(obj);p.write_text(json.dumps(obj),encoding='utf-8')
        try:
            try:data['refresh'](source,True)
            except (AssertionError,KeyError,TypeError):pass
            else:raise RuntimeError('Invalid data accepted: '+name)
        finally:p.write_bytes(original)
    reject('dictionary-a.json',lambda rows: rows[0].update(id='sw-01325'))
    reject('dictionary-a.json',lambda rows: rows[0].update(word='renamed-aardvark'))
    reject('dictionary-a.json',lambda rows: rows[0].update(etymology={'origin':7}))
    reject('etymology-roots.json',lambda obj: next(iter(obj['roots'].values()))['words'].append('not-a-collected-word'))
    reject('index.json',lambda rows: rows.pop())
    reject('checksums.json',lambda obj: obj.update({'meta.json':'wrong'}))
et={'origin':'<script>alert(1)</script>','history':'a & b','roots':[{'form':'<root>','meaning':'<meaning>'}],'related':['<related>']}
html=builder['render_etymology'](et,builder['esc'])
assert '<script>' not in html and '&lt;script&gt;' in html and 'a &amp; b' in html and '&lt;related&gt;' in html
print('PASS dictionary data: retired IDs, ID identity, malformed etymology, index references, stale metadata/checksums, escaped rendering')
