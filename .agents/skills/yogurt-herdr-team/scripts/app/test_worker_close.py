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

    def test_close_success(self):
        state_file = self.state_dir / 'sol.json'
        state_file.write_text(json.dumps({'name': 'sol', 'tab_id': 't-123'}))
        called = []

        def runner(cmd, **kw):
            called.append(cmd)
            return DummyProc(0, out='{}')

        code, out = cmd_close('sol', state_dir=self.state_dir, runner=runner)
        self.assertEqual(code, 0)
        self.assertEqual(called[0], ['herdr', 'tab', 'close', 't-123'])
        self.assertFalse(state_file.exists())

    def test_close_already_closed(self):
        state_file = self.state_dir / 'sol.json'
        state_file.write_text(json.dumps({'name': 'sol', 'tab_id': 't-123'}))

        def runner(cmd, **kw):
            return DummyProc(1, err='{"error":{"code":"tab_not_found"}}')

        code, out = cmd_close('sol', state_dir=self.state_dir, runner=runner)
        self.assertEqual(code, 0)
        self.assertFalse(state_file.exists())


if __name__ == '__main__':
    unittest.main()
