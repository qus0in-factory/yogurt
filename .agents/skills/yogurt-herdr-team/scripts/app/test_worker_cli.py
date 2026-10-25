import os
import tempfile
import unittest
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.worker import main


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
        code = main(['exclude', '--preset', 'sol', '--reason', 'quota exceeded'])
        self.assertEqual(code, 0)
        code = main(['pick'])
        self.assertEqual(code, 0)
        code = main(['include', '--preset', 'sol'])
        self.assertEqual(code, 0)
        code = main(['status'])
        self.assertEqual(code, 0)


if __name__ == '__main__':
    unittest.main()
