import tempfile
import subprocess
import unittest
from pathlib import Path
from types import SimpleNamespace
from infra.sender import send_callback


def result(code, error=''):
    return SimpleNamespace(returncode=code, stderr=error)


class CallbackSenderTest(unittest.TestCase):
    def test_submits_without_shell_or_wait_and_succeeds(self):
        calls = []
        def runner(args, **options):
            calls.append((args, options))
            return result(0)
        ok, note = send_callback('claude', 'codex', '[callback] codex status:done finished', runner=runner)
        self.assertTrue(ok)
        self.assertIn('attempt 1', note)
        self.assertEqual(calls[0][0], ['herdr', 'agent', 'prompt', 'claude', '[callback] codex status:done finished'])
        self.assertTrue(calls[0][1]['capture_output'])

    def test_retries_then_succeeds_with_injected_sleep(self):
        responses = iter([result(1, '{"code":"agent_blocked"}'), result(1, '{"code":"timeout"}'), result(0)])
        sleeps = []
        ok, _ = send_callback('claude', 'codex', 'message', runner=lambda *_a, **_k: next(responses), sleeper=sleeps.append)
        self.assertTrue(ok)
        self.assertEqual(sleeps, [2, 4])

    def test_exhaustion_saves_fallback_file(self):
        with tempfile.TemporaryDirectory() as tmp:
            sleeps = []
            ok, note = send_callback('claude', 'ds', 'final message', runner=lambda *_a, **_k: result(1, '{"code":"agent_prompt_stalled"}'), sleeper=sleeps.append, max_attempts=2, fallback_root=Path(tmp), timestamp_fn=lambda: '20261024T120000Z')
            path = Path(note.rsplit(' ', 1)[-1])
            self.assertFalse(ok)
            self.assertEqual(sleeps, [2])
            self.assertEqual(path.read_text(), 'final message\n')
            self.assertEqual(path, Path(tmp) / 'claude' / '20261024T120000Z-ds.md')

    def test_default_attempt_limit_uses_three_exponential_delays(self):
        with tempfile.TemporaryDirectory() as tmp:
            calls, sleeps = [], []
            runner = lambda *_a, **_k: (calls.append(1) or result(1, '{"code":"timeout"}'))
            send_callback('claude', 'codex', 'message', runner=runner, sleeper=sleeps.append, fallback_root=Path(tmp))
            self.assertEqual((len(calls), sleeps), (4, [2, 4, 8]))

    def test_missing_target_and_exit_two_fail_without_retry(self):
        for code, error in ((1, '{"code":"agent_not_found"}'), (2, 'usage error')):
            with self.subTest(code=code), tempfile.TemporaryDirectory() as tmp:
                calls, sleeps = [], []
                ok, _ = send_callback('claude', 'codex', 'message', runner=lambda *_a, **_k: (calls.append(1) or result(code, error)), sleeper=sleeps.append, fallback_root=Path(tmp))
                self.assertFalse(ok)
                self.assertEqual((len(calls), sleeps), (1, []))


    def test_hung_direct_send_times_out_and_writes_fallback(self):
        with tempfile.TemporaryDirectory() as tmp:
            calls = []
            def hung(command, **options):
                calls.append(command)
                self.assertEqual(options['timeout'], 10)
                raise subprocess.TimeoutExpired(command, options['timeout'])
            ok, note = send_callback('claude', 'luna', 'done', runner=hung,
                                     sleeper=lambda _seconds: None, fallback_root=Path(tmp))
            self.assertFalse(ok)
            self.assertIn('fallback saved', note)
            self.assertEqual(len(calls), 1)
            self.assertEqual(len(list((Path(tmp) / 'claude').glob('*.md'))), 1)


if __name__ == '__main__':
    unittest.main()
