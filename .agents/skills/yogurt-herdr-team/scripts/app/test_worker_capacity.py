import tempfile
import unittest
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.worker_await import cmd_await


class DummyProc:
    def __init__(self, code, out='', err=''):
        self.returncode, self.stdout, self.stderr = code, out, err


class CapacityRetryTest(unittest.TestCase):
    def test_capacity_retry_uses_10_20_40_without_exclusion(self):
        with tempfile.TemporaryDirectory() as tmp:
            outputs = iter(['at capacity', 'TTFT_ADMISSION_REFUSED', 'at capacity', 'Task done'])
            calls, sleeps, clock = [], [], [0.0]
            def runner(cmd, **kw):
                calls.append(cmd)
                if cmd[:3] == ['herdr', 'agent', 'read']:
                    return DummyProc(0, out=next(outputs))
                return DummyProc(0, out='{"result":{"agent":{"agent_status":"idle"}}}')
            def sleep(seconds):
                sleeps.append(seconds)
                clock[0] += seconds
            code, _ = cmd_await('sol', timeout=100, fallback_root=Path(tmp),
                                exclusions_path=Path(tmp) / 'exclude.json', runner=runner,
                                clock_fn=lambda: clock[0], sleep_fn=sleep)
            self.assertEqual(code, 0)
            self.assertEqual(sleeps, [10, 20, 40])
            self.assertFalse((Path(tmp) / 'exclude.json').exists())
            prompts = [c for c in calls if c[:3] == ['herdr', 'agent', 'prompt']]
            self.assertEqual(len(prompts), 3)


    def test_fourth_refusal_is_external_failure_without_exclusion(self):
        with tempfile.TemporaryDirectory() as tmp:
            calls, clock = [], [0.0]
            def runner(cmd, **kw):
                calls.append(cmd)
                if cmd[:3] == ['herdr', 'agent', 'read']:
                    return DummyProc(0, out='at capacity')
                return DummyProc(0, out='{"result":{"agent":{"agent_status":"working"}}}')
            code, out = cmd_await('sol', timeout=100, fallback_root=Path(tmp),
                                  exclusions_path=Path(tmp) / 'exclude.json', runner=runner,
                                  clock_fn=lambda: clock[0],
                                  sleep_fn=lambda seconds: clock.__setitem__(0, clock[0] + seconds))
            self.assertEqual(code, 3)
            self.assertIn('external failure', out)
            self.assertEqual(sum(c[:3] == ['herdr', 'agent', 'prompt'] for c in calls), 3)
            self.assertFalse((Path(tmp) / 'exclude.json').exists())


if __name__ == '__main__':
    unittest.main()
