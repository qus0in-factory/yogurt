import unittest
from domain.retry import backoff_seconds, should_retry


class CallbackRetryTest(unittest.TestCase):
    def test_retries_transient_herdr_error_codes(self):
        for code in ('agent_blocked', 'timeout', 'agent_prompt_stalled', 'connection_failed'):
            with self.subTest(code=code):
                self.assertTrue(should_retry(1, f'{{"code":"{code}"}}'))

    def test_target_missing_and_syntax_errors_are_not_retried(self):
        self.assertFalse(should_retry(1, '{"code":"agent_not_found"}'))
        self.assertFalse(should_retry(2, '{"code":"timeout"}'))

    def test_backoff_doubles_for_each_retry(self):
        self.assertEqual([backoff_seconds(n) for n in (1, 2, 3)], [2, 4, 8])
        with self.assertRaises(ValueError):
            backoff_seconds(0)


if __name__ == '__main__':
    unittest.main()
