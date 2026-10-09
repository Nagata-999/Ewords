"""Offline unit tests for staged dictionary candidate validation."""
import sys
import unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from validate_dictionary_candidates import validate

def candidate(word="abate", ident="candidate-1"):
    return {"word": word, "id": ident, "parts_of_speech": [
        {"pos": "verb", "meanings": [{"ja": "弱まる", "definition": "to become less strong",
        "examples": [{"en": "The storm abated.", "ja": "嵐は弱まった。"}]}]}],
        "collocations": [{"text": "abate gradually"}]}

class ValidationTests(unittest.TestCase):
    def test_valid(self):
        self.assertEqual(validate({"count": 1, "entries": [candidate()]}), [])
    def test_duplicate_headword(self):
        rows = [candidate(), candidate("ABATE", "candidate-2")]
        self.assertTrue(any("duplicate candidate headword" in x for x in validate({"count": 2, "entries": rows})))
    def test_collision_with_production(self):
        self.assertTrue(any("already exists" in x for x in validate(
            {"count": 1, "entries": [candidate()]}, [candidate("abate", "sw-00001")])))
    def test_blank_collocation(self):
        row = candidate()
        row["collocations"] = [{"text": ""}]
        self.assertTrue(any("blank collocation" in x for x in validate({"count": 1, "entries": [row]})))
    def test_missing_example(self):
        row = candidate()
        row["parts_of_speech"][0]["meanings"][0]["examples"] = []
        self.assertTrue(any("missing bilingual example" in x for x in validate({"count": 1, "entries": [row]})))

if __name__ == "__main__":
    unittest.main()
