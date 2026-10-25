import json
import tempfile
import unittest
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.worker_ops import cmd_close


class DummyProc:
    def __init__(self, code, out='', err=''):
        self.returncode = code
        self.stdout = out
        self.stderr = err


class TestWorkerClose(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.state_dir = Path(self.temp_dir.name)

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_close_uses_live_name_tab_and_removes_state(self):
        state = self.state_dir / 'sol.json'
        state.write_text(json.dumps({'name': 'sol', 'tab_id': 'stale'}))
        calls = []
        listings = iter(['{"result":{"agents":[{"name":"sol","tab_id":"live"}]}}'])
        def runner(cmd, **kw):
            calls.append(cmd)
            if cmd[:3] == ['herdr', 'agent', 'list']:
                return DummyProc(0, out=next(listings))
            return DummyProc(0, out='{}')
        code, _ = cmd_close('sol', state_dir=self.state_dir, runner=runner)
        self.assertEqual(code, 0)
        self.assertIn(['herdr', 'tab', 'close', 'live'], calls)
        self.assertEqual(calls.count(['herdr', 'agent', 'list']), 1)
        self.assertFalse(state.exists())

    def test_missing_live_name_is_error_and_preserves_state(self):
        state = self.state_dir / 'sol.json'
        state.write_text(json.dumps({'name': 'sol', 'tab_id': 'stale'}))
        runner = lambda *_a, **_k: DummyProc(0, out='{"result":{"agents":[]}}')
        code, out = cmd_close('sol', state_dir=self.state_dir, runner=runner)
        self.assertNotEqual(code, 0)
        self.assertIn('not found', out)
        self.assertTrue(state.exists())


    def test_missing_tab_id_is_explicit_error(self):
        runner = lambda *_a, **_k: DummyProc(0, out='{"result":{"agents":[{"name":"sol"}]}}')
        code, out = cmd_close('sol', state_dir=self.state_dir, runner=runner)
        self.assertNotEqual(code, 0)
        self.assertIn('no tab_id', out)


    def test_close_error_preserves_registry(self):
        state = self.state_dir / 'sol.json'
        state.write_text(json.dumps({'name': 'sol'}))
        def runner(cmd, **_kw):
            if cmd[:3] == ['herdr', 'agent', 'list']:
                return DummyProc(0, out='{"result":{"agents":[{"name":"sol","tab_id":"live"}]}}')
            return DummyProc(1, err='close failed')
        code, out = cmd_close('sol', state_dir=self.state_dir, runner=runner)
        self.assertNotEqual(code, 0)
        self.assertIn('failed to close', out)
        self.assertTrue(state.exists())


if __name__ == '__main__':
    unittest.main()
