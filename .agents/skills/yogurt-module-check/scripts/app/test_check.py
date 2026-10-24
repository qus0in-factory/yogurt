import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


class CheckCommandTest(unittest.TestCase):
    def test_success_and_failure_exit_codes(self):
        command = Path(__file__).with_name('check.py')
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            subprocess.run(['git', 'init', '-q', tmp], check=True)
            (root / 'domain').mkdir()
            module = root / 'domain/a.py'
            module.write_text('pass\n')
            run = lambda: subprocess.run(
                [sys.executable, str(command), '--root', tmp],
                capture_output=True, text=True)
            self.assertEqual(run().returncode, 0)
            module.write_text('pass\n' * 81)
            self.assertEqual(run().returncode, 1)
            self.assertIn('81', run().stdout)


if __name__ == '__main__':
    unittest.main()
