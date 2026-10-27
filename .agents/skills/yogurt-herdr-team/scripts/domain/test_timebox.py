import unittest
from domain.timebox import decide_timebox


class TestTimeboxDecision(unittest.TestCase):
    def test_working_before_deadline_continues(self):
        self.assertEqual(decide_timebox('working', 299, 300), 'continue')

    def test_working_at_deadline_interrupts(self):
        self.assertEqual(decide_timebox('working', 300, 300), 'interrupt')

    def test_done_or_idle_stops(self):
        self.assertEqual(decide_timebox('done', 100, 300), 'stop')
        self.assertEqual(decide_timebox('idle', 100, 300), 'stop')
        self.assertEqual(decide_timebox(None, 100, 300), 'stop')


if __name__ == '__main__':
    unittest.main()
