"""Regression checks for corrupt input and future batch safety."""
import copy,json,pathlib,runpy,tempfile,unittest
ROOT=pathlib.Path(__file__).resolve().parents[1]
A=runpy.run_path(str(ROOT/'scripts/audit-dictionary.py'))
G=runpy.run_path(str(ROOT/'scripts/check-dictionary-update.py'))
class QualityAudit(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.root=pathlib.Path(self.tmp.name)
        self.entry={'id':'test-1','word':'sample','parts_of_speech':[{'pos':'noun','meanings':[{'ja':'見本','definition':'an example used to show what something is like','examples':[{'en':'The shop sent us a sample.','ja':'店が見本を送ってくれた。'}]}]}],'collocations':[{'text':'a sample','ja':'見本'}]}
    def tearDown(self): self.tmp.cleanup()
    def corpus(self,path,entries):
        path.mkdir(exist_ok=True)
        for fn in A['FILES']:(path/fn).write_text(json.dumps(entries if fn=='dictionary-s.json' else []),encoding='utf-8')
        (path/'meta.json').write_text('{"version":"v3.331"}')
    def test_corrupt_json_and_types_are_reported(self):
        self.corpus(self.root,[self.entry,{'id':'broken','word':'broken','collocations':{'text':'bad'},'parts_of_speech':42},42])
        (self.root/'dictionary-a.json').write_text('{')
        report=A['audit'](self.root)
        for code in ('json_read_error','invalid_expression_container','invalid_parts_of_speech','invalid_entry_type'):self.assertIn(code,report['issue_counts'])
        self.assertGreater(report['fatal_count'],0)
    def test_normalized_duplicates_and_identity_guard(self):
        other=copy.deepcopy(self.entry);other['id']='test-2';other['word']=' SAMPLE '
        self.corpus(self.root,[self.entry,other])
        baseline=[{'id':'test-1','word':'sample','etymology_sha256':A['digest']({'origin':'old'})}]
        report=A['audit'](self.root,baseline)
        self.assertIn('duplicate_headword',report['issue_counts']);self.assertIn('changed_existing_etymology',report['issue_counts'])
    def test_batch_checks_count_version_and_examples(self):
        before=self.root/'before';after=self.root/'after'
        entries=[]
        for n in range(30):
            e=copy.deepcopy(self.entry);e['id']=str(n);e['word']='sample'+str(n);entries.append(e)
        self.corpus(before,entries)
        updated=copy.deepcopy(entries)
        for e in updated:e['usage_note']='Used as a noun.'
        self.corpus(after,updated)
        self.assertTrue(G['check'](before,after,'v3.331')['passed'])
        self.assertFalse(G['check'](before,after,'v3.186')['passed'])
        updated[0]['parts_of_speech'][0]['meanings'][0]['examples']=[];self.corpus(after,updated)
        self.assertFalse(G['check'](before,after,'v3.331')['passed'])
if __name__=='__main__':unittest.main()
