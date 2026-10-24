import unittest
from domain.message import MAX_SUMMARY_LENGTH, build_message, truncate_summary, validate_agent_name


class CallbackMessageTest(unittest.TestCase):
    def test_builds_one_line_message_with_optional_report(self):
        message = build_message('ds', 'done', 'finished\nwith tests', '/tmp/result.md')
        self.assertEqual(message, '[callback] ds status:done finished with tests /tmp/result.md')

    def test_accepts_all_statuses_and_rejects_unknown(self):
        for status in ('done', 'failed', 'blocked'):
            self.assertIn(f'status:{status}', build_message('codex', status, 'summary'))
        with self.assertRaises(ValueError):
            build_message('codex', 'working', 'summary')

    def test_rejects_invalid_agent_and_empty_summary(self):
        with self.assertRaises(ValueError):
            validate_agent_name('Bad Name')
        with self.assertRaises(ValueError):
            build_message('ds', 'failed', '  \n ')

    def test_truncates_long_summary_to_limit_with_ellipsis(self):
        summary = truncate_summary('x' * 600)
        self.assertEqual(len(summary), MAX_SUMMARY_LENGTH)
        self.assertTrue(summary.endswith('…'))
        self.assertEqual(truncate_summary('x' * MAX_SUMMARY_LENGTH), 'x' * MAX_SUMMARY_LENGTH)

    def test_long_summary_is_truncated_in_message_instead_of_rejected(self):
        message = build_message('ds', 'done', 'y' * 600)
        self.assertEqual(message, f'[callback] ds status:done {truncate_summary("y" * 600)}')
        self.assertTrue(message.endswith('…'))


if __name__ == '__main__':
    unittest.main()
