import contextlib
import io
import unittest
from app.release import main
from urllib.error import HTTPError, URLError

ARGV = ['--health-url', 'https://yogurt.qus0in.dev/health']

class FakeOps:
    def __init__(self, tags=(), version='1.2.3', health=None):
        self.tags, self.version, self.health = tags, version, health
        self.created, self.pushed, self.slept, self.polled = [], [], [], []

    def read(self, _path): return self.version
    def list_tags(self): return (0, list(self.tags), '')
    def resolve(self): return (0, '0f3d39a', '')
    def create(self, tag, _sha): self.created.append(tag); return (0, '')
    def push(self, tag): self.pushed.append(tag); return (0, '')

    def fetch(self, _url):
        self.polled.append(1)
        if self.health is None: raise OSError('health unavailable')
        if isinstance(self.health, Exception): raise self.health
        return self.health

    def wake(self, seconds): self.slept.append(seconds)


class ReleaseCommandTest(unittest.TestCase):
    def run_main(self, ops, argv=ARGV, **overrides):
        deps = dict(read=ops.read, tags=ops.list_tags, resolve=ops.resolve, create=ops.create, push=ops.push, health=ops.fetch, wake=ops.wake)
        deps.update(overrides)
        return main(argv, **deps)

    def test_argument_error_returns_two(self):
        self.assertEqual(main(['--dry-run'], read=lambda path: '1.2.3'), 2)

    def test_existing_tag_fails_without_creating(self):
        ops, err = FakeOps(tags=['v1.2.3']), io.StringIO()
        with contextlib.redirect_stderr(err):
            self.assertEqual(self.run_main(ops), 1)
        self.assertEqual(ops.created, [])
        self.assertIn('tag v1.2.3 already exists', err.getvalue())

    def test_dry_run_prints_plan_without_effects(self):
        ops, out = FakeOps(), io.StringIO()
        with contextlib.redirect_stdout(out):
            self.assertEqual(self.run_main(ops, argv=ARGV + ['--dry-run']), 0)
        self.assertFalse(ops.created or ops.pushed or ops.polled or ops.slept)
        text = out.getvalue()
        self.assertIn('plan: version tag v1.2.3 on origin/main 0f3d39a', text)
        self.assertIn('git push origin v1.2.3', text)

    def test_creates_pushes_and_verifies_when_first_poll_matches(self):
        ops = FakeOps(health={'version': '1.2.3'})
        with contextlib.redirect_stdout(io.StringIO()):
            self.assertEqual(self.run_main(ops), 0)
        self.assertEqual((ops.created, ops.pushed), (['v1.2.3'], ['v1.2.3']))
        self.assertEqual(ops.slept, [])

    def test_polling_distinguishes_version_mismatch_from_last_fetch_error(self):
        cases = [({'version': '9.9.9'}, 'health version did not match 1.2.3'),
                 (None, 'health fetch failed: health unavailable'),
                 (HTTPError('https://x', 403, 'Forbidden', {}, None), 'HTTP 403'),
                 (URLError('offline'), 'offline')]
        for health, expected in cases:
            with self.subTest(expected=expected):
                ops, err = FakeOps(health=health), io.StringIO()
                with contextlib.redirect_stderr(err):
                    self.assertEqual(self.run_main(ops), 1)
                self.assertIn(expected, err.getvalue())
                if health is None or isinstance(health, Exception): self.assertNotIn('version did not match', err.getvalue())
                self.assertEqual((len(ops.polled), ops.slept), (30, [10] * 29))

    def test_resolve_or_tag_failure_stops_before_push(self):
        for overrides in ({'resolve': lambda: (1, '', 'fetch failed')}, {'create': lambda tag, sha: (1, 'cannot tag')}):
            ops = FakeOps(health={'version': '1.2.3'})
            with contextlib.redirect_stderr(io.StringIO()):
                self.assertEqual(self.run_main(ops, **overrides), 1)
            self.assertEqual((ops.created, ops.pushed), ([], []))
