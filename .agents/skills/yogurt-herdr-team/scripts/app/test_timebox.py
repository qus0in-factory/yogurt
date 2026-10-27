import unittest
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.timebox import TIMEOUT_MESSAGE, run_timebox


class Clock:
    def __init__(self):
        self.value = 0.0

    def __call__(self):
        return self.value

    def sleep(self, seconds):
        self.value += seconds


class TestRunTimebox(unittest.TestCase):
    def test_interrupts_working_agent_at_deadline(self):
        clock, sent = Clock(), []
        result = run_timebox(
            'pane-1', seconds=300, interval=10,
            status_fn=lambda _pane: 'working',
            send_fn=lambda pane, message: sent.append((pane, message)),
            sleep_fn=clock.sleep, clock=clock,
        )
        self.assertEqual(result, 'pane-1 timed out')
        self.assertEqual(sent, [('pane-1', TIMEOUT_MESSAGE)])
        self.assertEqual(TIMEOUT_MESSAGE, '5분 시간 제한을 넘었다. 새 작업을 하지 말고, 지금까지 한 것과 남은 것을 계약의 보고 파일에 쓰고 --status blocked로 콜백하라.')

    def test_done_agent_stops_without_send(self):
        sent = []
        result = run_timebox('pane-1', status_fn=lambda _pane: 'done', send_fn=lambda *_: sent.append(1))
        self.assertIn('ended (done)', result)
        self.assertEqual(sent, [])


if __name__ == '__main__':
    unittest.main()
