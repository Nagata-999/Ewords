"""Regression checks for mixed release schemas and duplicate display senses."""
import copy
import pathlib
import runpy
import tempfile
import unittest

BUILD = runpy.run_path(str(pathlib.Path(__file__).resolve().parents[1] / 'scripts/build-dictionary.py'))


class DictionaryRendering(unittest.TestCase):
    def test_expression_schemas(self):
        values = [' plain ', {'phrase': 'old', 'ja': '旧'}, {'en': 'new', 'ja': '新'},
                  {'text': 'text only'}, {'text': 'translated', 'ja': '訳'},
                  {'en': '', 'text': 'fallback'}, {'text': ''}, {'ja': '孤立'},
                  None, ':', '・ :', {'en': 'new', 'ja': '新'}]
        self.assertEqual(BUILD['expression_rows'](values),
                         [('plain', ''), ('old', '旧'), ('new', '新'), ('text only', ''),
                          ('translated', '訳'), ('fallback', '')])

    def test_same_gloss_merges_without_losing_content(self):
        example = {'en': 'They abandoned the plan.', 'ja': '彼らは計画を断念した。'}
        entry = {'word': 'abandon', 'parts_of_speech': [
            {'pos': 'verb', 'meanings': [{'ja': '捨てる', 'examples': []}]},
            {'pos': 'verb', 'meanings': [{'ja': '捨てる', 'definition': 'to leave behind', 'examples': [example, example]},
                                        {'ja': '捨てる', 'definition': 'to give up', 'examples': []},
                                        {'ja': '断念する', 'examples': []}]},
            {'pos': 'noun', 'meanings': [{'ja': '捨てる', 'examples': []}]}]}
        original = copy.deepcopy(entry)
        parts = BUILD['display_parts'](entry, {'definitions': 0, 'examples': 0})
        self.assertEqual(len(parts), 2)
        self.assertEqual(len(parts[0]['meanings']), 2)
        self.assertEqual(parts[0]['meanings'][0]['definitions'], ['to leave behind', 'to give up'])
        self.assertEqual(parts[0]['meanings'][0]['examples'], [example])
        self.assertEqual(entry, original)

    def test_empty_gloss_template_is_hidden(self):
        classifier = BUILD['QUALITY']['template_example']
        self.assertTrue(classifier('abandon', 'The term abandon is used in the sense of "".'))
        self.assertFalse(classifier('abandon', 'They abandoned the plan after costs rose.'))

    def test_translation_variants_share_one_english_example(self):
        entry = {'word': 'abandon', 'parts_of_speech': [{'pos': 'verb', 'meanings': [
            {'ja': '断念する', 'examples': [{'en': 'They abandoned it.', 'ja': 'それを断念した。'},
                                        {'en': 'They abandoned it.', 'ja': '彼らはそれを諦めた。'}]}]}]}
        original = copy.deepcopy(entry)
        example = BUILD['display_parts'](entry, {'definitions': 0, 'examples': 0})[0]['meanings'][0]['examples']
        self.assertEqual(len(example), 1)
        self.assertEqual(example[0]['additional_translations'], ['彼らはそれを諦めた。'])
        self.assertEqual(entry, original)

    def test_identical_output_not_rewritten(self):
        with tempfile.TemporaryDirectory() as tmp:
            target = pathlib.Path(tmp) / 'page.html'
            BUILD['write'](target, '同じ')
            before = target.stat().st_mtime_ns
            BUILD['write'](target, '同じ')
            self.assertEqual(target.stat().st_mtime_ns, before)

    def test_generated_expressions_are_safe_and_not_blank(self):
        import json
        root = pathlib.Path(__file__).resolve().parents[1]
        for source in (root / 'data/dictionary').glob('dictionary-*.json'):
            for entry in json.loads(source.read_text(encoding='utf-8')):
                page = (root / 'dictionary' / BUILD['slug'](entry['word']) / 'index.html').read_text(encoding='utf-8')
                for key in ('collocations', 'phrases'):
                    for en, ja in BUILD['expression_rows'](entry.get(key, [])):
                        self.assertIn(BUILD['esc'](en), page, entry['word'])
                        if ja:
                            self.assertIn('：' + BUILD['esc'](ja), page, entry['word'])
                self.assertNotIn('<li>：</li>', page, entry['word'])


if __name__ == '__main__':
    unittest.main()
