import json
import tempfile
import unittest
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.worker_manage import cmd_pick, cmd_exclude, cmd_include, cmd_status


class DummyProc:
    def __init__(self, code, out='', err=''):
        self.returncode, self.stdout, self.stderr = code, out, err


class TestWorkerManage(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.temp_path = Path(self.temp_dir.name)
        self.state_dir = self.temp_path / 'workers'
        self.state_dir.mkdir(parents=True)
        self.ex_file = self.temp_path / 'ex.json'

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_cmd_pick_default(self):
        code, out = cmd_pick(state_dir=self.state_dir, exclusions_path=self.ex_file)
        self.assertEqual(code, 0)
        self.assertEqual(out, 'sol')

    def test_cmd_pick_with_active_worker(self):
        (self.state_dir / 'sol.json').write_text(json.dumps({'name': 'sol', 'preset': 'sol'}))
        runner = lambda cmd, **kw: DummyProc(0, out='{"result":{"agents":[{"name":"sol"}]}}')
        code, out = cmd_pick(state_dir=self.state_dir, exclusions_path=self.ex_file, runner=runner)
        self.assertEqual(code, 0)
        self.assertEqual(out, 'luna')

    def test_cmd_pick_need_tests(self):
        code, out = cmd_pick(need_tests=True, state_dir=self.state_dir, exclusions_path=self.ex_file)
        self.assertEqual(code, 0)
        self.assertEqual(out, 'gf')

    def test_cmd_exclude_and_include(self):
        code, out = cmd_exclude('sol', 'rate limit reached', exclusions_path=self.ex_file)
        self.assertEqual(code, 0)
        code, out = cmd_pick(state_dir=self.state_dir, exclusions_path=self.ex_file)
        self.assertEqual(out, 'luna')

        code, out = cmd_include('sol', exclusions_path=self.ex_file)
        self.assertEqual(code, 0)
        code, out = cmd_pick(state_dir=self.state_dir, exclusions_path=self.ex_file)
        self.assertEqual(out, 'sol')

    def test_cmd_status(self):
        cmd_exclude('luna', 'usage limit', exclusions_path=self.ex_file)
        code, out = cmd_status(state_dir=self.state_dir, exclusions_path=self.ex_file)
        self.assertEqual(code, 0)
        self.assertIn('Excluded presets', out)
        self.assertIn('luna', out)


if __name__ == '__main__':
    unittest.main()
