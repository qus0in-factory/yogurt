import json
import subprocess
import unittest
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from infra.herdr_cli import (
    get_current_workspace, list_live_agents, get_agent_status,
    read_agent_output, close_tab,
)


class DummyProc:
    def __init__(self, code, out='', err=''):
        self.returncode = code
        self.stdout = out
        self.stderr = err


class TestHerdrCli(unittest.TestCase):
    def test_get_current_workspace(self):
        payload = json.dumps({'result': {'pane': {'workspace_id': 'ws-123'}}})
        runner = lambda cmd, **kw: DummyProc(0, out=payload)
        self.assertEqual(get_current_workspace(runner), 'ws-123')

    def test_list_live_agents(self):
        payload = json.dumps({'result': {'agents': [{'name': 'sol'}, {'name': 'luna'}]}})
        runner = lambda cmd, **kw: DummyProc(0, out=payload)
        self.assertEqual(list_live_agents(runner), {'sol', 'luna'})

    def test_get_agent_status(self):
        payload = json.dumps({'result': {'agent': {'agent_status': 'idle'}}})
        runner = lambda cmd, **kw: DummyProc(0, out=payload)
        self.assertEqual(get_agent_status('sol', runner), 'idle')

    def test_read_agent_output(self):
        runner = lambda cmd, **kw: DummyProc(0, out='Task completed successfully\n')
        self.assertEqual(read_agent_output('sol', runner), 'Task completed successfully')

    def test_close_tab_success(self):
        runner = lambda cmd, **kw: DummyProc(0, out='{}')
        self.assertTrue(close_tab('tab-1', runner))

    def test_close_tab_already_closed(self):
        err = json.dumps({'error': {'code': 'tab_not_found'}})
        runner = lambda cmd, **kw: DummyProc(1, err=err)
        self.assertTrue(close_tab('tab-1', runner))


if __name__ == '__main__':
    unittest.main()
