import subprocess
import tempfile
import unittest
from pathlib import Path
from infra.files import source_files


class SourceFilesTest(unittest.TestCase):
    def test_git_ignore_untracked_unicode_and_non_source(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            subprocess.run(['git', 'init', '-q', tmp], check=True)
            (root / '.gitignore').write_text('vendor/\n')
            (root / 'vendor').mkdir()
            (root / 'vendor/skip.py').write_text('')
            (root / '한 글.py').write_text('')
            (root / 'notes.md').write_text('')
            self.assertEqual(list(source_files(root)), [Path('한 글.py')])


if __name__ == '__main__':
    unittest.main()
