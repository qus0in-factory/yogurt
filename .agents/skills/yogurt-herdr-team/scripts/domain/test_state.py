import tempfile
import unittest
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from domain.state import (
    save_state, load_state, remove_state, find_active_worker,
)


class TestState(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.state_dir = Path(self.temp_dir.name)

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_save_and_load_state(self):
        data = {'name': 'w1', 'preset': 'sol', 'tab_id': 't1', 'pane_id': 'p1'}
        saved_path = save_state(self.state_dir, 'w1', data)
        self.assertTrue(saved_path.exists())
        loaded = load_state(self.state_dir, 'w1')
        self.assertEqual(loaded, data)

    def test_load_nonexistent_state(self):
        self.assertIsNone(load_state(self.state_dir, 'w_none'))

    def test_remove_state(self):
        data = {'name': 'w1', 'preset': 'sol'}
        save_state(self.state_dir, 'w1', data)
        self.assertTrue(remove_state(self.state_dir, 'w1'))
        self.assertFalse(remove_state(self.state_dir, 'w1'))
        self.assertIsNone(load_state(self.state_dir, 'w1'))

    def test_find_active_worker_by_preset(self):
        save_state(self.state_dir, 'sol-worker', {'name': 'sol-worker', 'preset': 'sol'})
        found = find_active_worker(self.state_dir, preset='sol', live_agents={'sol-worker'})
        self.assertIsNotNone(found)
        self.assertEqual(found['name'], 'sol-worker')

    def test_find_active_worker_stale_skipped(self):
        save_state(self.state_dir, 'sol-worker', {'name': 'sol-worker', 'preset': 'sol'})
        found = find_active_worker(self.state_dir, preset='sol', live_agents={'other-agent'})
        self.assertIsNone(found)

    def test_find_active_worker_by_name(self):
        found = find_active_worker(self.state_dir, name='sol-worker', live_agents={'sol-worker'})
        self.assertIsNotNone(found)


if __name__ == '__main__':
    unittest.main()
