import tempfile
import unittest
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from domain.exclusions import (
    load_exclusions, save_exclusions, exclude_preset, include_preset, is_preset_excluded,
)


class TestExclusions(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.file_path = Path(self.temp_dir.name) / 'excluded-presets.json'

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_load_nonexistent_returns_empty(self):
        self.assertEqual(load_exclusions(self.file_path), {})

    def test_exclude_and_is_excluded(self):
        self.assertFalse(is_preset_excluded('sol', path=self.file_path))
        exclude_preset('sol', 'hit rate limit', path=self.file_path)
        self.assertTrue(is_preset_excluded('sol', path=self.file_path))
        data = load_exclusions(self.file_path)
        self.assertIn('sol', data)
        self.assertEqual(data['sol']['reason'], 'hit rate limit')

    def test_include_preset(self):
        exclude_preset('luna', 'usage limit', path=self.file_path)
        self.assertTrue(is_preset_excluded('luna', path=self.file_path))
        removed = include_preset('luna', path=self.file_path)
        self.assertTrue(removed)
        self.assertFalse(is_preset_excluded('luna', path=self.file_path))
        self.assertFalse(include_preset('luna', path=self.file_path))


if __name__ == '__main__':
    unittest.main()
