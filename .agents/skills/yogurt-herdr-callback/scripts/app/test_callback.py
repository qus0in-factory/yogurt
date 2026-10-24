import contextlib
import io
import unittest
from app.callback import main


class CallbackCommandTest(unittest.TestCase):
    def test_success_builds_message_and_reports_one_line_to_stderr(self):
        calls = []
        err = io.StringIO()
        sender = lambda *args, **kwargs: (calls.append((args, kwargs)) or (True, 'callback sent'))
        with contextlib.redirect_stderr(err):
            code = main(['--to', 'claude', '--from', 'ds', '--status', 'done', '--summary', 'all green'], sender=sender)
        self.assertEqual(code, 0)
        self.assertEqual(calls[0][0][:3], ('claude', 'ds', '[callback] ds status:done all green'))
        self.assertEqual(err.getvalue(), 'callback sent\n')

    def test_runtime_failure_returns_one_and_argument_error_returns_two(self):
        err = io.StringIO()
        with contextlib.redirect_stderr(err):
            self.assertEqual(main(['--to', 'claude', '--from', 'codex', '--status', 'blocked', '--summary', 'waiting'], sender=lambda *_a, **_k: (False, 'fallback saved')), 1)
        self.assertEqual(err.getvalue(), 'fallback saved\n')
        with contextlib.redirect_stderr(io.StringIO()):
            self.assertEqual(main(['--to', 'claude', '--from', 'codex', '--status', 'working', '--summary', 'bad'], sender=lambda *_a, **_k: self.fail('must not send')), 2)


    def test_long_summary_is_sent_truncated_and_empty_summary_fails(self):
        calls = []
        sender = lambda *args, **kwargs: (calls.append(args) or (True, 'callback sent'))
        with contextlib.redirect_stderr(io.StringIO()):
            code = main(['--to', 'claude', '--from', 'ds', '--status', 'done', '--summary', 'z' * 600], sender=sender)
        self.assertEqual(code, 0)
        self.assertTrue(calls[0][2].endswith('…'))
        self.assertEqual(len(calls[0][2]), len('[callback] ds status:done ') + 500)
        with contextlib.redirect_stderr(io.StringIO()):
            self.assertEqual(main(['--to', 'claude', '--from', 'ds', '--status', 'done', '--summary', ' '], sender=lambda *_a, **_k: self.fail('must not send')), 2)


if __name__ == '__main__':
    unittest.main()
