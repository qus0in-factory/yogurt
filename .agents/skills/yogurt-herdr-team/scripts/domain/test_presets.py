import unittest
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import domain.presets as presets_mod
from domain.presets import PRESETS, get_preset


class TestPresets(unittest.TestCase):
    def test_final_presets_list(self):
        self.assertEqual(set(PRESETS.keys()), {'sol', 'luna', 'gf', 'ga', 'ds'})
        self.assertNotIn('agy', PRESETS)

    def test_sol_preset(self):
        p = get_preset('sol')
        self.assertEqual(p.kind, 'codex')
        self.assertTrue(p.sandboxed)

    def test_luna_preset(self):
        p = get_preset('luna')
        self.assertEqual(p.kind, 'codex')
        self.assertTrue(p.sandboxed)

    def test_gf_preset(self):
        p = get_preset('gf')
        self.assertEqual(p.kind, 'agy')
        self.assertFalse(p.sandboxed)
        self.assertEqual(p.args, ['--effort', 'high'])

    def test_ga_preset(self):
        p = get_preset('ga')
        self.assertEqual(p.kind, 'agy')
        self.assertFalse(p.sandboxed)
        self.assertIn('--effort', p.args)
        self.assertIn('--model', p.args)
        self.assertIn('gemini-4-argon-medium', p.args)

    def test_ga_unconfirmed_model_id_raises_error(self):
        orig = presets_mod.GA_MODEL_ID
        try:
            presets_mod.GA_MODEL_ID = None
            with self.assertRaises(ValueError) as ctx:
                get_preset('ga')
            self.assertIn('모델 id 미확정', str(ctx.exception))
        finally:
            presets_mod.GA_MODEL_ID = orig

    def test_ds_preset(self):
        p = get_preset('ds')
        self.assertEqual(p.kind, 'opencode')
        self.assertEqual(len(p.post_start), 6)


if __name__ == '__main__':
    unittest.main()
