import json
import tempfile
import unittest
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.worker import main
from app.worker_ops import cmd_run


class DummyProc:
    def __init__(self, code, out='', err=''):
        self.returncode = code
        self.stdout = out
        self.stderr = err


class TestWorkerRun(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.temp_path = Path(self.temp_dir.name)
        self.state_dir = self.temp_path / 'workers'
        self.fallback_root = self.temp_path / 'callbacks'

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_run_full_flow(self):
        file_path = self.temp_path / 'task.md'
        file_path.write_text('Execute task', encoding='utf-8')

        def runner(cmd, **kw):
            if cmd[:3] == ['herdr', 'agent', 'list']:
                return DummyProc(0, out='{"result":{"agents":[]}}')
            if cmd[:3] == ['herdr', 'pane', 'current']:
                return DummyProc(0, out='{"result":{"pane":{"workspace_id":"ws-1"}}}')
            if cmd[:3] == ['herdr', 'tab', 'create']:
                return DummyProc(0, out='{"result":{"tab":{"tab_id":"t-1"},"root_pane":{"pane_id":"p-1"}}}')
            if cmd[:3] == ['herdr', 'agent', 'start']:
                return DummyProc(0, out='{"result":{"agent":{"interactive_ready":true}}}')
            if cmd[:3] == ['herdr', 'agent', 'prompt']:
                return DummyProc(0, out='{}')
            if cmd[:3] == ['herdr', 'agent', 'get']:
                return DummyProc(0, out='{"result":{"agent":{"agent_status":"idle"}}}')
            if cmd[:3] == ['herdr', 'agent', 'read']:
                return DummyProc(0, out='Run success result')
            return DummyProc(0, out='{}')

        code, out = cmd_run(
            'sol', str(file_path), name='sol-w',
            state_dir=self.state_dir, fallback_root=self.fallback_root,
            runner=runner,
        )
        self.assertEqual(code, 0)
        self.assertEqual(out, 'Run success result')
        self.assertTrue((self.state_dir / 'sol-w.json').exists())

    def test_cli_main_open(self):
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

        code = main(['open', '--preset', 'luna', '--name', 'test-luna'], runner=runner)
        self.assertEqual(code, 0)


if __name__ == '__main__':
    unittest.main()
