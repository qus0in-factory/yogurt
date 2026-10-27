import unittest
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.worker import start_timebox


class TestWorkerTimebox(unittest.TestCase):
    def test_starts_only_for_positive_seconds(self):
        calls = []
        start_timebox('worker-1', 300, launcher=lambda pane, secs: calls.append((pane, secs)))
        start_timebox('worker-2', 0, launcher=lambda pane, secs: calls.append((pane, secs)))
        self.assertEqual(calls, [('worker-1', 300)])


if __name__ == '__main__':
    unittest.main()
