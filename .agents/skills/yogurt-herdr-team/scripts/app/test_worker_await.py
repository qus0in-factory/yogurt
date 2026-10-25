import tempfile
import unittest
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.worker_await import cmd_await
from domain.exclusions import is_preset_excluded


class DummyProc:
    def __init__(self, code, out='', err=''):
        self.returncode, self.stdout, self.stderr = code, out, err


class TestWorkerAwait(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.root = Path(self.temp_dir.name)
        self.ex_file = self.root / 'ex.json'

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_await_fallback_detected(self):
        to_dir = self.root / 'claude'
        to_dir.mkdir(parents=True)
        (to_dir / '20261025T000000Z-sol.md').write_text('Finished report', encoding='utf-8')
        code, out = cmd_await('sol', timeout=5.0, to='claude', fallback_root=self.root)
        self.assertEqual(code, 0)
        self.assertEqual(out, 'Finished report')

    def test_await_agent_idle_detected(self):
        def runner(cmd, **kw):
            if cmd[:3] == ['herdr', 'agent', 'read']:
                return DummyProc(0, out='Output text from agent')
            return DummyProc(0, out='{"result":{"agent":{"agent_status":"idle"}}}')
        code, out = cmd_await('sol', timeout=5.0, fallback_root=self.root, runner=runner)
        self.assertEqual(code, 0)
        self.assertEqual(out, 'Output text from agent')

    def test_await_usage_limit_detected(self):
        def runner(cmd, **kw):
            if cmd[:3] == ['herdr', 'agent', 'read']:
                return DummyProc(0, out='Rate limit exceeded. Try again later.')
            return DummyProc(0, out='{"result":{"agent":{"agent_status":"working"}}}')
        code, out = cmd_await('sol', timeout=5.0, fallback_root=self.root,
                              exclusions_path=self.ex_file, runner=runner)
        self.assertEqual(code, 3)
        self.assertIn('Usage limit reached', out)
        self.assertTrue(is_preset_excluded('sol', path=self.ex_file))

    def test_await_timeout(self):
        runner = lambda cmd, **kw: DummyProc(0, out='{"result":{"agent":{"agent_status":"working"}}}')
        clock = [0.0]
        fake_clock = lambda: clock.__setitem__(0, clock[0] + 2.0) or clock[0]
        code, out = cmd_await('sol', timeout=3.0, fallback_root=self.root,
                              runner=runner, clock_fn=fake_clock, sleep_fn=lambda _: None)
        self.assertEqual(code, 2)
        self.assertIn('Timeout', out)


if __name__ == '__main__':
    unittest.main()
