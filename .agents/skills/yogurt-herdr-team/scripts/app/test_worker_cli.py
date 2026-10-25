import os
import tempfile
import unittest
from unittest.mock import patch
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.worker import main


class DummyProc:
    returncode = 0
    stdout = '{"result":{"agents":[]}}'
    stderr = ''


class TestWorkerCli(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.temp_path = Path(self.temp_dir.name)
        self.ex_file = self.temp_path / 'ex.json'
        os.environ['HERDR_EXCLUDED_PRESETS_FILE'] = str(self.ex_file)

    def tearDown(self):
        os.environ.pop('HERDR_EXCLUDED_PRESETS_FILE', None)
        self.temp_dir.cleanup()

    def test_main_pick_and_exclude(self):
        runner = lambda _cmd, **_kw: DummyProc()
        with patch('app.worker_manage.get_active_presets', return_value=set()), \
                patch('app.worker_manage.load_all_states', return_value={}):
            code = main(['exclude', '--preset', 'sol', '--reason', 'quota exceeded'], runner=runner)
            self.assertEqual(code, 0)
            code = main(['pick'], runner=runner)
            self.assertEqual(code, 0)
            code = main(['include', '--preset', 'sol'], runner=runner)
            self.assertEqual(code, 0)
            code = main(['status'], runner=runner)
            self.assertEqual(code, 0)


if __name__ == '__main__':
    unittest.main()
