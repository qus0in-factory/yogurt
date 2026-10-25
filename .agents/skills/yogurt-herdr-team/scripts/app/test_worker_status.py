import json
import tempfile
import unittest
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.worker_manage import cmd_status


class DummyProc:
    def __init__(self, code, out='', err=''):
        self.returncode, self.stdout, self.stderr = code, out, err


class WorkerStatusTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.registry = self.root / 'workers'
        self.registry.mkdir()

    def tearDown(self):
        self.temp.cleanup()

    def test_status_merges_registry_and_herdr_sources(self):
        for name, preset in (('sol', 'sol'), ('luna', 'luna')):
            (self.registry / f'{name}.json').write_text(json.dumps({'name': name, 'preset': preset, 'tab_id': f'reg-{name}'}))
        agents = [{'name': 'sol', 'tab_id': 'live-sol'}, {'name': 'ds', 'tab_id': 'live-ds'}]
        runner = lambda _cmd, **_kw: DummyProc(0, out=json.dumps({'result': {'agents': agents}}))
        code, out = cmd_status(state_dir=self.registry, runner=runner)
        self.assertEqual(code, 0)
        self.assertIn('sol [both]', out)
        self.assertIn('ds [herdr only]', out)
        self.assertIn('luna [stale registry]', out)
        self.assertIn('live-ds', out)

    def test_status_reports_herdr_list_failure(self):
        runner = lambda _cmd, **_kw: DummyProc(1, err='socket unavailable')
        code, out = cmd_status(state_dir=self.registry, runner=runner)
        self.assertNotEqual(code, 0)
        self.assertIn('external failure', out)


if __name__ == '__main__':
    unittest.main()
