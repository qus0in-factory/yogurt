import tempfile
import unittest
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.worker_ops import cmd_prompt


class DummyProc:
    def __init__(self, code, out='', err=''):
        self.returncode = code
        self.stdout = out
        self.stderr = err


class TestWorkerPrompt(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.temp_path = Path(self.temp_dir.name)

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_prompt_success(self):
        file_path = self.temp_path / 'contract.md'
        file_path.write_text('Do work please', encoding='utf-8')
        called = []

        def runner(cmd, **kw):
            called.append(cmd)
            return DummyProc(0, out='{}')

        code, out = cmd_prompt('worker-1', str(file_path), runner=runner)
        self.assertEqual(code, 0)
        self.assertEqual(called[0], ['herdr', 'agent', 'prompt', 'worker-1', 'Do work please'])

    def test_prompt_failure(self):
        file_path = self.temp_path / 'contract.md'
        file_path.write_text('Do work please', encoding='utf-8')

        def runner(cmd, **kw):
            return DummyProc(1, err='agent_not_found')

        code, out = cmd_prompt('worker-1', str(file_path), runner=runner)
        self.assertEqual(code, 1)
        self.assertIn('failed to prompt', out)


if __name__ == '__main__':
    unittest.main()
