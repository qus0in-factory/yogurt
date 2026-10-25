import json
import unittest
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from infra.herdr_ops import create_tab, prompt_agent, run_post_start, start_agent


class DummyProc:
    def __init__(self, code, out='', err=''):
        self.returncode, self.stdout, self.stderr = code, out, err


class TestHerdrOps(unittest.TestCase):
    def test_create_tab(self):
        payload = json.dumps({'result': {'tab': {'tab_id': 't-1'}, 'root_pane': {'pane_id': 'p-1'}}})
        called = []
        runner = lambda cmd, **kw: called.append(cmd) or DummyProc(0, out=payload)
        tab_id, pane_id = create_tab('w-1', '/tmp', 'worker-1', runner=runner)
        self.assertEqual((tab_id, pane_id), ('t-1', 'p-1'))
        self.assertEqual(called[0], [
            'herdr', 'tab', 'create', '--workspace', 'w-1',
            '--cwd', '/tmp', '--label', 'worker-1', '--no-focus',
        ])

    def test_start_agent_with_args(self):
        called = []
        runner = lambda cmd, **kw: called.append(cmd) or DummyProc(0, out='{}')
        success = start_agent('sol', 'codex', 'p-1', ['-m', 'sol-m'], 60000, runner=runner)
        self.assertTrue(success)
        self.assertEqual(called[0], [
            'herdr', 'agent', 'start', 'sol', '--kind', 'codex',
            '--pane', 'p-1', '--timeout', '60000', '--', '-m', 'sol-m',
        ])

    def test_run_post_start(self):
        called = []
        runner = lambda cmd, **kw: called.append(cmd) or DummyProc(0, out='{}')
        steps = (('send_text', '/models'), ('send_keys', 'enter'), ('wait_output', 'ready'))
        run_post_start('p-1', steps, runner=runner)
        self.assertEqual(len(called), 3)
        self.assertEqual(called[0], ['herdr', 'pane', 'send-text', 'p-1', '/models'])
        self.assertEqual(called[1], ['herdr', 'pane', 'send-keys', 'p-1', 'enter'])
        self.assertEqual(called[2], ['herdr', 'pane', 'wait-output', '--match', 'ready', 'p-1'])

    def test_prompt_agent(self):
        called = []
        runner = lambda cmd, **kw: called.append(cmd) or DummyProc(0, out='{}')
        self.assertTrue(prompt_agent('sol', 'do task', runner=runner))
        self.assertEqual(called[0], ['herdr', 'agent', 'prompt', 'sol', 'do task'])


if __name__ == '__main__':
    unittest.main()
