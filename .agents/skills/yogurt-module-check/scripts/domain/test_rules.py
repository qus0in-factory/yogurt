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

    def test_typescript_tests_under_src_are_rejected(self):
        for name in ('src/infra/value.test.ts', 'src/ui/card.test.tsx'):
            with self.subTest(path=name):
                errors = violations(Path(name), '')
                self.assertTrue(any('tests belong under tests/' in error for error in errors))

    def test_root_tests_require_a_layer_directory(self):
        for name in ('tests/ui/card.test.tsx', 'tests/infra/value.test.ts'):
            self.assertEqual(violations(Path(name), ''), [])
        self.assertTrue(any('missing ui/app/domain/infra' in error
                            for error in violations(Path('tests/value.test.ts'), '')))

    def test_ordinary_source_and_other_roots_are_not_test_location_errors(self):
        for name in ('src/app/test-helper.ts', 'tools/infra/value.test.ts'):
            self.assertEqual(violations(Path(name), ''), [])


if __name__ == '__main__':
    unittest.main()
