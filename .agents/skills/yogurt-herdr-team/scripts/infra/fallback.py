from pathlib import Path

DEFAULT_FALLBACK_ROOT = Path('/tmp/herdr-callback')


def _is_match(path: Path, worker_name: str) -> bool:
    if not path.is_file() or path.suffix != '.md':
        return False
    return path.stem.endswith(f'-{worker_name}') or path.name == f'{worker_name}.md'


def _archive_file(path: Path) -> str:
    content = path.read_text(encoding='utf-8')
    processed = path.parent / 'processed'
    processed.mkdir(exist_ok=True)
    target = processed / path.name
    index = 1
    while target.exists():
        target = processed / f'{path.stem}-{index}{path.suffix}'
        index += 1
    path.rename(target)
    return content


def find_and_consume_fallback(
    root: Path = DEFAULT_FALLBACK_ROOT,
    worker_name: str = '',
    target: str | None = None,
) -> str | None:
    if not root.exists():
        return None
    folders = [root / target] if target else [d for d in root.iterdir() if d.is_dir()]
    for folder in folders:
        if not folder.exists():
            continue
        for path in sorted(folder.glob('*.md')):
            if _is_match(path, worker_name):
                return _archive_file(path)
    return None
