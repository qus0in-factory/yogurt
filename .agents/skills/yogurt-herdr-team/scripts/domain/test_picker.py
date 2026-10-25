import unittest
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from domain.picker import pick_preset
from domain.presets import DEFAULT_PRIORITY


class TestPicker(unittest.TestCase):
    def test_default_pick_prefers_sol(self):
        self.assertEqual(pick_preset(), 'sol')

    def test_pick_sol_excluded_picks_luna(self):
        self.assertEqual(pick_preset(excluded={'sol'}), 'luna')

    def test_pick_sol_luna_excluded_picks_gf(self):
        self.assertEqual(pick_preset(excluded={'sol', 'luna'}), 'gf')

    def test_pick_active_preset_skipped(self):
        self.assertEqual(pick_preset(active_presets={'sol'}), 'luna')

    def test_pick_need_tests_prefers_non_sandboxed(self):
        self.assertEqual(pick_preset(need_tests=True), 'gf')

    def test_pick_need_tests_gf_active_picks_ga(self):
        self.assertEqual(pick_preset(need_tests=True, active_presets={'gf'}), 'ga')

    def test_pick_all_excluded_returns_none(self):
        all_presets = set(DEFAULT_PRIORITY)
        self.assertIsNone(pick_preset(excluded=all_presets))


if __name__ == '__main__':
    unittest.main()
