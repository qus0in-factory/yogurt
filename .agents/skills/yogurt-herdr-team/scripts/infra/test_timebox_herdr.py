import unittest
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from infra.timebox_herdr import interrupt_agent


class DummyProc:
    def __init__(self, code=0, out='', err=''):
        self.returncode, self.stdout, self.stderr = code, out, err


class TestTimeboxHerdr(unittest.TestCase):
    def test_interrupt_sends_escape_then_prompt(self):
        calls = []

        def runner(cmd, **_kw):
            calls.append(cmd)
            return DummyProc(0)

        self.assertTrue(interrupt_agent('pane-1', 'stop now', runner=runner))
        self.assertEqual(calls[0], ['herdr', 'agent', 'send-keys', 'pane-1', 'Escape'])
        self.assertEqual(calls[1][:4], ['herdr', 'agent', 'prompt', 'pane-1'])
        self.assertEqual(calls[1][4], 'stop now')


if __name__ == '__main__':
    unittest.main()
