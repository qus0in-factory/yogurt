import json
import tempfile
import unittest
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.worker_ops import cmd_open


class DummyProc:
    def __init__(self, code, out='', err=''):
        self.returncode = code
        self.stdout = out
        self.stderr = err


class TestWorkerOpen(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.state_dir = Path(self.temp_dir.name)

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_open_success(self):
        def runner(cmd, **kw):
            if cmd[:3] == ['herdr', 'agent', 'list']:
                return DummyProc(0, out='{"result":{"agents":[]}}')
            if cmd[:3] == ['herdr', 'pane', 'current']:
                return DummyProc(0, out='{"result":{"pane":{"workspace_id":"ws-1"}}}')
            if cmd[:3] == ['herdr', 'tab', 'create']:
                return DummyProc(0, out='{"result":{"tab":{"tab_id":"t-1"},"root_pane":{"pane_id":"p-1"}}}')
            if cmd[:3] == ['herdr', 'agent', 'start']:
                return DummyProc(0, out='{"result":{"agent":{"interactive_ready":true}}}')
            return DummyProc(0, out='{}')

        code, out = cmd_open('sol', name='w-sol', state_dir=self.state_dir, runner=runner)
        self.assertEqual(code, 0)
        data = json.loads(out)
        self.assertEqual(data['name'], 'w-sol')
        self.assertEqual(data['tab_id'], 't-1')
        self.assertTrue((self.state_dir / 'w-sol.json').exists())

    def test_open_duplicate_preset_blocked(self):
        def runner(cmd, **kw):
            if cmd[:3] == ['herdr', 'agent', 'list']:
                return DummyProc(0, out='{"result":{"agents":[{"name":"w-sol"}]}}')
            return DummyProc(0, out='{}')

        (self.state_dir / 'w-sol.json').write_text('{"name":"w-sol","preset":"sol"}')
        code, out = cmd_open('sol', name='w2', state_dir=self.state_dir, runner=runner)
        self.assertEqual(code, 1)
        self.assertIn("already running: w-sol", out)


if __name__ == '__main__':
    unittest.main()
