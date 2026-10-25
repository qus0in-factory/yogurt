import unittest
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from domain.presets import PRESETS, get_preset


class TestPresets(unittest.TestCase):
    def test_presets_exist(self):
        self.assertIn('sol', PRESETS)
        self.assertIn('luna', PRESETS)
        self.assertIn('gf', PRESETS)
        self.assertIn('ga', PRESETS)
        self.assertIn('ds', PRESETS)

    def test_sol_preset(self):
        preset = get_preset('sol')
        self.assertEqual(preset.kind, 'codex')
        self.assertTrue(preset.sandboxed)
        self.assertIn('-m', preset.args)
        self.assertIn('gpt-6.1-sol', preset.args)

    def test_luna_preset(self):
        preset = get_preset('luna')
        self.assertEqual(preset.kind, 'codex')
        self.assertTrue(preset.sandboxed)
        self.assertIn('-m', preset.args)
        self.assertIn('gpt-6-luna', preset.args)

    def test_gf_preset(self):
        preset = get_preset('gf')
        self.assertEqual(preset.kind, 'agy')
        self.assertFalse(preset.sandboxed)
        self.assertEqual(preset.args, ['--effort', 'high'])

    def test_ga_preset(self):
        preset = get_preset('ga')
        self.assertEqual(preset.kind, 'agy')
        self.assertFalse(preset.sandboxed)
        self.assertEqual(preset.args, ['--model', 'gemini-4-argon-medium', '--effort', 'medium'])

    def test_ds_preset(self):
        preset = get_preset('ds')
        self.assertEqual(preset.kind, 'opencode')
        self.assertFalse(preset.sandboxed)
        self.assertEqual(len(preset.post_start), 6)

    def test_unknown_preset(self):
        with self.assertRaises(ValueError):
            get_preset('unknown')


if __name__ == '__main__':
    unittest.main()
