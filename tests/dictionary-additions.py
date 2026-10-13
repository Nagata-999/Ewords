import copy,pathlib,runpy,unittest
ROOT=pathlib.Path(__file__).resolve().parents[1]
C=runpy.run_path(str(ROOT/'scripts/check-dictionary-additions.py'))
class Protection(unittest.TestCase):
    def setUp(self):
        self.old={'id':'sw-00001','word':'old','etymology':{'root':'preserve'},'parts_of_speech':[{'pos':'noun','meanings':[{'ja':'既存','examples':[{'en':'Old example.','ja':'既存例文。'}]}]}]}
        self.new={'id':'sw-00002','word':'new'}
        self.hashes={self.old['id']:C['P']['digest'](self.old)}
    def test_append_only(self):C['check']([self.old,self.new],self.hashes,[self.new])
    def test_reject_existing_mutations(self):
        for key,value in [('id','renamed'),('word','changed'),('etymology',{}),('parts_of_speech',[])]:
            with self.subTest(key=key):
                old=copy.deepcopy(self.old);old[key]=value
                with self.assertRaises(AssertionError):C['check']([old,self.new],self.hashes,[self.new])
    def test_reject_deletion_and_duplicates(self):
        for values in [[self.new],[self.old,self.new,self.new],[self.old,{**self.new,'word':' OLD '}],[self.old,self.new,{'id':'x','word':'unreviewed'}]]:
            with self.assertRaises(AssertionError):C['check'](values,self.hashes,[self.new])
    def test_full_corpus(self):C['main']()
if __name__=='__main__':unittest.main()
