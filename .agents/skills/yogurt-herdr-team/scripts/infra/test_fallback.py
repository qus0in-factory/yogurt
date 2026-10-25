import tempfile
import unittest
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from infra.fallback import find_and_consume_fallback


class TestFallback(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.root = Path(self.temp_dir.name)

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_find_report_in_target_dir(self):
        target_dir = self.root / 'claude'
        target_dir.mkdir(parents=True)
        report_file = target_dir / '20261025T000000Z-sol.md'
        report_file.write_text('Report content from sol', encoding='utf-8')

        result = find_and_consume_fallback(self.root, 'sol', target='claude')
        self.assertEqual(result, 'Report content from sol')
        self.assertFalse(report_file.exists())
        self.assertTrue((target_dir / 'processed' / report_file.name).exists())

    def test_find_report_without_target(self):
        target_dir = self.root / 'claude'
        target_dir.mkdir(parents=True)
        report_file = target_dir / '20261025T000000Z-luna.md'
        report_file.write_text('Report content from luna', encoding='utf-8')

        result = find_and_consume_fallback(self.root, 'luna')
        self.assertEqual(result, 'Report content from luna')

    def test_no_report(self):
        self.assertIsNone(find_and_consume_fallback(self.root, 'sol'))


if __name__ == '__main__':
    unittest.main()
