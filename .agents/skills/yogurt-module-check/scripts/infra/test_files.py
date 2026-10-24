import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch
from infra.files import source_files


class SourceFilesTest(unittest.TestCase):
    def test_collects_untracked_unicode_and_filters_non_source(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / '한 글.py').write_text('')
            (root / 'notes.md').write_text('')
            output = SimpleNamespace(stdout='한 글.py\0notes.md\0'.encode())
            with patch('infra.files.subprocess.run', return_value=output) as run:
                self.assertEqual(list(source_files(root)), [Path('한 글.py')])
            args = run.call_args.args[0]
            self.assertIn('--others', args)
            self.assertIn('--exclude-standard', args)
            self.assertTrue(run.call_args.kwargs['check'])

    def test_tests_tree_is_included_alongside_source(self):
        names = ['src/app/value.ts', 'tests/ui/card.test.tsx',
                 'tests/infra/value.test.ts']
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            for name in names:
                path = root / name
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text('')
            output = SimpleNamespace(stdout=('\0'.join(names) + '\0').encode())
            with patch('infra.files.subprocess.run', return_value=output):
                self.assertEqual(list(source_files(root)), [Path(name) for name in sorted(names)])


if __name__ == '__main__':
    unittest.main()
