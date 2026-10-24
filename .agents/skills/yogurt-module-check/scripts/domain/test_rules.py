import unittest
from pathlib import Path
from domain.rules import violations


class ModuleRulesTest(unittest.TestCase):
    def test_eighty_lines_allowed_eighty_one_rejected(self):
        path = Path('src/domain/value.ts')
        self.assertEqual(violations(path, 'x\n' * 80), [])
        self.assertTrue(any('81' in v for v in violations(path, 'x\n' * 81)))

    def test_requires_directory_layer_not_filename(self):
        self.assertTrue(violations(Path('src/domain.ts'), 'x'))
        self.assertEqual(violations(Path('src/ui/card.tsx'), 'x'), [])

    def test_empty_file_still_requires_layer(self):
        self.assertTrue(violations(Path('tools/run.py'), ''))


if __name__ == '__main__':
    unittest.main()
