import json
import tempfile
import unittest
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.worker_ops import cmd_open


class DummyProc:
    def __init__(self, code, out='', err=''):
        self.returncode, self.stdout, self.stderr = code, out, err


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
            return DummyProc(0, out='{}')

        code, out = cmd_open('gf', name='w-gf', state_dir=self.state_dir, runner=runner)
        self.assertEqual(code, 0)
        self.assertTrue((self.state_dir / 'w-gf.json').exists())

    def test_gf_and_ga_independent_tab_rule(self):
        def runner(cmd, **kw):
            if cmd[:3] == ['herdr', 'agent', 'list']:
                return DummyProc(0, out='{"result":{"agents":[{"name":"w-gf"}]}}')
            if cmd[:3] == ['herdr', 'pane', 'current']:
                return DummyProc(0, out='{"result":{"pane":{"workspace_id":"ws-1"}}}')
            if cmd[:3] == ['herdr', 'tab', 'create']:
                return DummyProc(0, out='{"result":{"tab":{"tab_id":"t-ga"},"root_pane":{"pane_id":"p-ga"}}}')
            return DummyProc(0, out='{}')

        (self.state_dir / 'w-gf.json').write_text('{"name":"w-gf","preset":"gf"}')
        # Opening another gf is blocked
        code_gf, out_gf = cmd_open('gf', name='w-gf2', state_dir=self.state_dir, runner=runner)
        self.assertEqual(code_gf, 1)
        self.assertIn('already running: w-gf', out_gf)
        # Opening ga while gf is open succeeds
        code_ga, out_ga = cmd_open('ga', name='w-ga', state_dir=self.state_dir, runner=runner)
        self.assertEqual(code_ga, 0)
        self.assertTrue((self.state_dir / 'w-ga.json').exists())


    def test_start_failure_closes_created_tab_and_saves_no_state(self):
        calls = []
        def runner(cmd, **kw):
            calls.append(cmd)
            if cmd[:3] == ['herdr', 'agent', 'list']:
                return DummyProc(0, out='{"result":{"agents":[]}}')
            if cmd[:3] == ['herdr', 'pane', 'current']:
                return DummyProc(0, out='{"result":{"pane":{"workspace_id":"ws"}}}')
            if cmd[:3] == ['herdr', 'tab', 'create']:
                return DummyProc(0, out='{"result":{"tab":{"tab_id":"t-new"},"root_pane":{"pane_id":"p-new"}}}')
            if cmd[:3] == ['herdr', 'agent', 'start']:
                return DummyProc(1, err='provider unavailable')
            return DummyProc(0, out='{}')
        code, out = cmd_open('gf', name='w-fail', state_dir=self.state_dir, runner=runner)
        self.assertNotEqual(code, 0)
        self.assertIn('external failure', out)
        self.assertIn(['herdr', 'tab', 'close', 't-new'], calls)
        self.assertFalse((self.state_dir / 'w-fail.json').exists())


if __name__ == '__main__':
    unittest.main()
