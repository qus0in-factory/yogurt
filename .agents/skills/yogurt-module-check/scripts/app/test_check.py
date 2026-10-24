import contextlib
import io
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.check import main


class CheckCommandTest(unittest.TestCase):
    def test_success_and_failure_exit_codes(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            relative = Path('tests/domain/value.test.ts')
            module = root / relative
            module.parent.mkdir(parents=True)
            module.write_text('pass\n')
            def run():
                output = io.StringIO()
                with patch('sys.argv', ['check', '--root', tmp]), \
                        patch('app.check.source_files', return_value=[relative]), \
                        contextlib.redirect_stdout(output):
                    return main(), output
            self.assertEqual(run()[0], 0)
            module.write_text('pass\n' * 81)
            code, output = run()
            self.assertEqual(code, 1)
            self.assertIn('81', output.getvalue())

    def test_input_error_returns_two(self):
        with patch('sys.argv', ['check']), \
                patch('app.check.source_files', side_effect=OSError('unavailable')), \
                contextlib.redirect_stderr(io.StringIO()):
            self.assertEqual(main(), 2)


if __name__ == '__main__':
    unittest.main()
