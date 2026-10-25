import argparse
import sys
import time
from datetime import datetime
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from domain.message import validate_agent_name
from infra.process_lock import watcher_lock

DEFAULT_ROOT = Path('/tmp/herdr-callback')


def _cursor(value):
    if Path(value).name == value and value.endswith('.md'):
        return 'name', value
    try:
        return 'time', datetime.fromisoformat(value.replace('Z', '+00:00')).timestamp()
    except ValueError as error:
        raise ValueError('--since must be a filename or ISO timestamp') from error


def watch(agent, since, root=DEFAULT_ROOT, timeout=300, interval=5,
          sleep_fn=time.sleep, clock_fn=time.monotonic):
    validate_agent_name(agent)
    kind, cursor = _cursor(since)
    folder = Path(root) / agent
    deadline = clock_fn() + timeout
    with watcher_lock(root, agent):
        while True:
            for path in sorted(folder.glob('*.md')):
                newer = path.name > cursor if kind == 'name' else path.stat().st_mtime > cursor
                if newer:
                    content = path.read_text()
                    processed = folder / 'processed'
                    processed.mkdir(exist_ok=True)
                    target = processed / path.name
                    index = 1
                    while target.exists():
                        target = processed / f'{path.stem}-{index}{path.suffix}'
                        index += 1
                    path.rename(target)
                    return content
            if clock_fn() >= deadline:
                return None
            sleep_fn(interval)


def main(argv=None, root=DEFAULT_ROOT, sleep_fn=time.sleep, clock_fn=time.monotonic):
    parser = argparse.ArgumentParser(description='Watch callback fallback files')
    parser.add_argument('--to', required=True)
    parser.add_argument('--since', required=True)
    parser.add_argument('--timeout', type=float, default=300)
    args = parser.parse_args(argv)
    try:
        content = watch(args.to, args.since, root, args.timeout, 5, sleep_fn, clock_fn)
    except (ValueError, RuntimeError) as error:
        print(f'watch error: {error}', file=sys.stderr)
        return 2
    if content is None:
        return 2
    print(content)
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
