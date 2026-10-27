import argparse
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from domain.rules import typography_violations, violations, width_violations
from infra.files import source_files


def main():
    parser = argparse.ArgumentParser(description='Check module size and layers')
    parser.add_argument('--root', type=Path, default=Path.cwd())
    parser.add_argument('--typography', action='store_true', default=False)
    parser.add_argument('--max-width', type=int, default=0, help='flag lines longer than N chars (0=off)')
    args = parser.parse_args()
    root = args.root.resolve()
    try:
        files = list(source_files(root))
        errors = []
        for path in files:
            content = (root / path).read_text('utf-8')
            errors.extend(violations(path, content))
            if args.typography:
                errors.extend(typography_violations(path, content))
            if args.max_width:
                errors.extend(width_violations(path, content, args.max_width))
    except (OSError, UnicodeError, subprocess.CalledProcessError) as error:
        print(f'Check failed: {error}', file=sys.stderr)
        return 2
    for error in errors:
        print(error)
    print(f'Checked {len(files)} modules; {len(errors)} violations')
    return 1 if errors else 0


if __name__ == '__main__':
    raise SystemExit(main())
