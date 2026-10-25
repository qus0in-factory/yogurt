import contextlib
import io
import tempfile
import unittest
from pathlib import Path
from app.watch import main
from infra.process_lock import acquire_lock, release_lock


class FakeClock:
    def __init__(self):
        self.now = 0

    def __call__(self):
        return self.now

    def sleep(self, seconds):
        self.now += seconds


class WatchCommandTest(unittest.TestCase):
    def test_filename_cursor_waits_then_prints_and_moves_callback(self):
        with tempfile.TemporaryDirectory() as tmp:
            folder = Path(tmp) / 'claude'
            folder.mkdir()
            clock = FakeClock()
            def sleep(seconds):
                clock.sleep(seconds)
                (folder / 'z-new.md').write_text('callback arrived')
            out = io.StringIO()
            args = ['--to', 'claude', '--since', 'a-old.md', '--timeout', '10']
            with contextlib.redirect_stdout(out):
                code = main(args, root=tmp, sleep_fn=sleep, clock_fn=clock)
            self.assertEqual(code, 0)
            self.assertEqual(out.getvalue(), 'callback arrived\n')
            self.assertTrue((folder / 'processed' / 'z-new.md').exists())
            self.assertFalse((folder / 'z-new.md').exists())

    def test_timestamp_cursor_accepts_new_file(self):
        with tempfile.TemporaryDirectory() as tmp:
            folder = Path(tmp) / 'claude'
            folder.mkdir()
            (folder / 'callback.md').write_text('ready')
            out = io.StringIO()
            args = ['--to', 'claude', '--since', '2000-01-01T00:00:00Z']
            with contextlib.redirect_stdout(out):
                code = main(args, root=tmp, sleep_fn=lambda _seconds: None)
            self.assertEqual(code, 0)
            self.assertEqual(out.getvalue(), 'ready\n')

    def test_timeout_returns_two_without_output(self):
        with tempfile.TemporaryDirectory() as tmp:
            clock = FakeClock()
            out = io.StringIO()
            args = ['--to', 'claude', '--since', 'old.md', '--timeout', '1']
            with contextlib.redirect_stdout(out):
                code = main(args, root=tmp, sleep_fn=clock.sleep, clock_fn=clock)
            self.assertEqual(code, 2)
            self.assertEqual(out.getvalue(), '')


    def test_active_lock_rejects_second_watcher_and_releases_owner(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / 'watch.pid'
            self.assertTrue(acquire_lock(path, pid=123))
            self.assertFalse(acquire_lock(path, pid=456, alive=lambda _pid: True))
            self.assertFalse(release_lock(path, pid=456))
            self.assertTrue(release_lock(path, pid=123))

    def test_stale_pid_lock_is_recovered(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / 'watch.pid'
            path.write_text('123')
            self.assertTrue(acquire_lock(path, pid=456, alive=lambda _pid: False))
            self.assertEqual(path.read_text(), '456')
            self.assertTrue(release_lock(path, pid=456))


if __name__ == '__main__':
    unittest.main()
