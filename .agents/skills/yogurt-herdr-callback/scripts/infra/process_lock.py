import os
from contextlib import contextmanager
from pathlib import Path


def _alive(pid):
    try:
        os.kill(pid, 0)
        return True
    except ProcessLookupError:
        return False
    except PermissionError:
        return True

def acquire_lock(path, pid=None, alive=None):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    owner = pid or os.getpid()
    try:
        fd = os.open(path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    except FileExistsError:
        try:
            old = int(path.read_text().strip())
        except (OSError, ValueError):
            old = 0
        if old and (alive or _alive)(old):
            return False
        try:
            path.unlink(missing_ok=True)
        except OSError:
            return False
        return acquire_lock(path, owner, alive)
    with os.fdopen(fd, 'w') as lock:
        lock.write(str(owner))
    return True

def release_lock(path, pid=None):
    path = Path(path)
    try:
        if int(path.read_text().strip()) != (pid or os.getpid()):
            return False
        path.unlink()
        return True
    except (OSError, ValueError):
        return False

@contextmanager
def watcher_lock(root, target):
    path = Path(root) / f'.watch-{target}.pid'
    if not acquire_lock(path):
        raise RuntimeError(f'watch already running for {target}')
    try:
        yield
    finally:
        release_lock(path)
