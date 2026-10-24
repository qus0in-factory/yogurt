import subprocess
import unittest
from infra import ops


def fake_run(stdout=''):
    def run(argv, **kwargs):
        run.argv, run.kwargs = argv, kwargs
        return subprocess.CompletedProcess(argv, 0, stdout=stdout, stderr='')
    return run


class GitCommandTest(unittest.TestCase):
    def test_list_tags_uses_tag_dash_l_and_splits_stdout(self):
        run = fake_run('v1.0.0\nv1.1.0\n')
        self.assertEqual(ops.list_tags(run), (0, ['v1.0.0', 'v1.1.0'], ''))
        self.assertEqual(run.argv, ['git', 'tag', '-l'])
        self.assertEqual(run.kwargs, {'capture_output': True, 'text': True, 'check': False})

    def test_resolve_main_rev_parses_origin_main(self):
        run = fake_run('0f3d39a\n')
        self.assertEqual(ops.resolve_main(run), (0, '0f3d39a', ''))
        self.assertEqual(run.argv, ['git', 'rev-parse', 'origin/main'])

    def test_resolve_main_fetches_origin_main_before_rev_parse(self):
        calls = []
        def run(argv, **_kwargs):
            calls.append(argv)
            stdout = '0f3d39a\n' if argv[1] == 'rev-parse' else ''
            return subprocess.CompletedProcess(argv, 0, stdout=stdout, stderr='')
        self.assertEqual(ops.resolve_main(run), (0, '0f3d39a', ''))
        self.assertEqual(calls, [['git', 'fetch', 'origin', 'main', '--tags'], ['git', 'rev-parse', 'origin/main']])

    def test_resolve_main_returns_fetch_failure_and_skips_rev_parse(self):
        calls = []
        def run(argv, **_kwargs):
            calls.append(argv)
            return subprocess.CompletedProcess(argv, 3, stdout='', stderr='fetch failed')
        self.assertEqual(ops.resolve_main(run), (3, '', 'fetch failed'))
        self.assertEqual(calls, [['git', 'fetch', 'origin', 'main', '--tags']])

    def test_create_tag_makes_annotated_tag_on_sha(self):
        run = fake_run()
        self.assertEqual(ops.create_tag('v1.2.3', '0f3d39a', run), (0, ''))
        self.assertEqual(run.argv, ['git', 'tag', '-a', 'v1.2.3', '-m', 'Release v1.2.3', '0f3d39a'])

    def test_push_tag_targets_origin(self):
        run = fake_run()
        self.assertEqual(ops.push_tag('v1.2.3', run), (0, ''))
        self.assertEqual(run.argv, ['git', 'push', 'origin', 'v1.2.3'])


class HealthIoTest(unittest.TestCase):
    def test_read_version_uses_injected_reader(self):
        reader = lambda path: {'version': '1.2.3'}
        self.assertEqual(ops.read_version('package.json', reader), '1.2.3')

    def test_fetch_health_opens_url_with_timeout_and_parses(self):
        class Response:
            def __enter__(self):
                return self

            def __exit__(self, *_):
                return False

            def read(self):
                return b'{"version":"1.2.3"}'

        opened = []
        opener = lambda url, timeout=None: opened.append((url, timeout)) or Response()
        self.assertEqual(ops.fetch_health('https://x/health', opener), {'version': '1.2.3'})
        self.assertEqual(opened, [('https://x/health', 10)])


if __name__ == '__main__':
    unittest.main()
