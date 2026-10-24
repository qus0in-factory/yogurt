import argparse
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from domain.rules import violations
from infra.files import source_files


def main():
    parser = argparse.ArgumentParser(description='Check module size and layers')
    parser.add_argument('--root', type=Path, default=Path.cwd())
    args = parser.parse_args()
    root = args.root.resolve()
    try:
        files = list(source_files(root))
        errors = []
        for path in files:
            errors.extend(violations(path, (root / path).read_text('utf-8')))
    except (OSError, UnicodeError, subprocess.CalledProcessError) as error:
        print(f'Check failed: {error}', file=sys.stderr)
        return 2
    for error in errors:
        print(error)
    print(f'Checked {len(files)} modules; {len(errors)} violations')
    return 1 if errors else 0


if __name__ == '__main__':
    raise SystemExit(main())
