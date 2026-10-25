import subprocess
import tempfile
import unittest
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.worker_ops import cmd_open


class DummyProc:
    def __init__(self, code, out='', err=''):
        self.returncode, self.stdout, self.stderr = code, out, err


class OpenCleanupTest(unittest.TestCase):
    def test_post_start_failure_closes_tab_and_marks_delegated(self):
        with tempfile.TemporaryDirectory() as tmp:
            calls = []
            def runner(cmd, **kw):
                calls.append(cmd)
                if cmd[:3] == ['herdr', 'agent', 'list']:
                    return DummyProc(0, out='{"result":{"agents":[]}}')
                if cmd[:3] == ['herdr', 'pane', 'current']:
                    return DummyProc(0, out='{"result":{"pane":{"workspace_id":"ws"}}}')
                if cmd[:3] == ['herdr', 'tab', 'create']:
                    return DummyProc(0, out='{"result":{"tab":{"tab_id":"t1"},"root_pane":{"pane_id":"p1"}}}')
                if cmd[:3] == ['herdr', 'pane', 'wait-output']:
                    raise subprocess.TimeoutExpired(cmd, 10)
                return DummyProc(0, out='{}')
            code, out = cmd_open('ds', state_dir=Path(tmp), runner=runner)
            self.assertNotEqual(code, 0)
            self.assertIn('delegated failure', out)
            self.assertIn(['herdr', 'tab', 'close', 't1'], calls)
            self.assertFalse((Path(tmp) / 'ds.json').exists())


if __name__ == '__main__':
    unittest.main()
