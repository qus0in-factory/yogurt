import unittest
from domain.message import build_message, validate_agent_name


class CallbackMessageTest(unittest.TestCase):
    def test_builds_one_line_message_with_optional_report(self):
        message = build_message('ds', 'done', 'finished\nwith tests', '/tmp/result.md')
        self.assertEqual(message, '[callback] ds status:done finished with tests /tmp/result.md')

    def test_accepts_all_statuses_and_rejects_unknown(self):
        for status in ('done', 'failed', 'blocked'):
            self.assertIn(f'status:{status}', build_message('codex', status, 'summary'))
        with self.assertRaises(ValueError):
            build_message('codex', 'working', 'summary')

    def test_rejects_invalid_agent_empty_and_long_summary(self):
        with self.assertRaises(ValueError):
            validate_agent_name('Bad Name')
        for summary in ('  \n ', 'x' * 501):
            with self.assertRaises(ValueError):
                build_message('ds', 'failed', summary)


if __name__ == '__main__':
    unittest.main()
