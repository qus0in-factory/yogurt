import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


SCRIPT = Path(__file__).with_name('check_contract.py')
FIELDS = ('허용 파일', '금지 파일', '완료 조건', '검증 명령',
          '완료 보고', 'commit 금지', '5분', '30초')


class CheckContractTests(unittest.TestCase):
    def run_contract(self, fields):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'contract.md'
            path.write_text('\n'.join(fields), encoding='utf-8')
            return self.run_path(path)

    def run_path(self, path):
        return subprocess.run([sys.executable, str(SCRIPT), str(path)],
                              capture_output=True, text=True, check=False)

    def test_complete_contract_passes(self):
        result = self.run_contract(FIELDS)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(result.stdout, '')

    def test_each_missing_field_fails_and_is_listed(self):
        for field in FIELDS:
            with self.subTest(field=field):
                result = self.run_contract([x for x in FIELDS if x != field])
                self.assertEqual(result.returncode, 1, result.stderr)
                self.assertEqual(result.stdout.strip(), field)

    def test_all_missing_fields_are_listed(self):
        result = self.run_contract([])
        self.assertEqual(result.returncode, 1, result.stderr)
        self.assertEqual(result.stdout.splitlines(), list(FIELDS))

    def test_commit_prohibition_variants_pass(self):
        for phrase in ('커밋 금지', 'commit하지 않는다', 'do not commit'):
            with self.subTest(phrase=phrase):
                fields = [phrase if x == 'commit 금지' else x for x in FIELDS]
                result = self.run_contract(fields)
                self.assertEqual(result.returncode, 0, result.stderr)

    def test_harness_procedure_docs_capture_new_rules(self):
        team = SCRIPT.parents[2]
        checklist = (team / 'references/coordinator-checklist.md').read_text()
        roles = (team / 'references/roles.md').read_text()
        retro = (team.parent / 'yogurt-failure-retro/references/categories.md').read_text()
        for text in ('워커 pane은 이름으로만 조회', '탭 정리 뒤 herdr 목록 확인'):
            self.assertIn(text, checklist)
        for text in ('Grok 4.6 xAI · high', 'DeepSeek V4.1 Flash OpenCode Go · max', '10초 → 20초 → 40초'):
            self.assertIn(text, roles)
        self.assertIn('용량 초과 = 외부 실패', retro)
        self.assertIn('잘못된 자동화 시퀀스 = 위임 실패', retro)

    def test_missing_file_returns_two(self):
        with tempfile.TemporaryDirectory() as directory:
            result = self.run_path(Path(directory) / 'missing.md')
        self.assertEqual(result.returncode, 2, result.stderr)


if __name__ == '__main__':
    unittest.main()
