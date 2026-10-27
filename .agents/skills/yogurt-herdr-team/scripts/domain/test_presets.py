import unittest
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import domain.presets as presets_mod
from domain.presets import PRESETS, get_preset


class TestPresets(unittest.TestCase):
    def test_final_presets_list(self):
        self.assertEqual(set(PRESETS.keys()), {'sol', 'luna', 'gf', 'ga', 'ds', 'grok', 'mimo', 'muse'})
        self.assertNotIn('agy', PRESETS)
        self.assertEqual(presets_mod.DEFAULT_PRIORITY, ('sol', 'luna', 'gf', 'ga', 'ds', 'grok', 'mimo', 'muse'))
        self.assertEqual(presets_mod.NEED_TESTS_PRIORITY, ('gf', 'ga', 'ds', 'grok', 'sol', 'luna', 'mimo', 'muse'))

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
        self.assertEqual(p.args, ['--effort', 'medium', '--model', 'gemini-3.8-flash-medium'])

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
        self.assertEqual(len(p.post_start), 7)

    def test_opencode_presets(self):
        cases = (
            ('grok', 'Grok 4.6 xAI', (('send_keys', 'ctrl+t'), ('wait_output', 'Grok 4.6 xAI · high'))),
            ('mimo', 'MiMo-V2.6-Flash OpenCode Go', (('wait_output', 'MiMo-V2.6-Flash OpenCode Go'),)),
            ('muse', 'Muse Spark 1.3 Contributor OpenCode Go', (('wait_output', 'Muse Spark 1.3 Contributor OpenCode Go · xhigh'),)),
        )
        for name, search, tail in cases:
            with self.subTest(preset=name):
                p = get_preset(name)
                self.assertEqual(p.name, name)
                self.assertEqual(p.kind, 'opencode')
                self.assertEqual(p.args, [])
                self.assertFalse(p.sandboxed)
                self.assertEqual(p.post_start, (
                    ('send_text', '/models'), ('send_keys', 'enter'),
                    ('wait_output', 'Select model'), ('send_text', search),
                    ('wait_output', search), ('send_keys', 'enter'),
                ) + tail)


if __name__ == '__main__':
    unittest.main()
