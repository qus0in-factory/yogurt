import json
import subprocess
import time
from datetime import datetime, timezone
from pathlib import Path
from domain.retry import backoff_seconds, should_retry

_DEFAULT_FALLBACK = Path('/tmp/herdr-callback')
_SEND_TIMEOUT = 10


def send_callback(target, source, message, runner=None, sleeper=None, max_attempts=4, fallback_root=_DEFAULT_FALLBACK, timestamp_fn=None):
    if max_attempts < 1:
        raise ValueError('max_attempts must be at least 1')
    runner = runner or subprocess.run
    sleeper = sleeper or time.sleep
    command = ['herdr', 'agent', 'prompt', target, message]
    for attempt in range(1, max_attempts + 1):
        result = _run(runner, command, _SEND_TIMEOUT)
        if result.returncode == 0:
            return True, f'callback sent to {target} (attempt {attempt})'
        if attempt < max_attempts and should_retry(result.returncode, result.stderr):
            sleeper(backoff_seconds(attempt))
            continue
        return False, _save_fallback(target, source, message, attempt, fallback_root, timestamp_fn)


def _run(runner, command, timeout):
    try:
        return runner(command, capture_output=True, text=True, check=False, timeout=timeout)
    except FileNotFoundError:
        return subprocess.CompletedProcess(command, 127, stderr='{"code":"herdr_not_found"}')
    except subprocess.TimeoutExpired as error:
        detail = json.dumps({'code': 'send_timeout', 'message': str(error)})
        return subprocess.CompletedProcess(command, 1, stderr=detail)
    except (OSError, TimeoutError) as error:
        return subprocess.CompletedProcess(command, 1, stderr=json.dumps({'code': 'connection_failed', 'message': str(error)}))


def _save_fallback(target, source, message, attempts, root, timestamp_fn):
    timestamp = timestamp_fn() if timestamp_fn else datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%fZ')
    path = Path(root) / target / f'{timestamp}-{source}.md'
    try:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(message + '\n', encoding='utf-8')
        return f'callback failed after {attempts} attempt(s); fallback saved: {path}'
    except OSError as error:
        return f'callback failed after {attempts} attempt(s); fallback write failed: {type(error).__name__}'
