"""Check required contract text without calling Herdr."""

import argparse
from pathlib import Path
import re
import sys


REQUIRED = ('허용 파일', '금지 파일', '완료 조건', '검증 명령',
            '완료 보고', 'commit 금지', '5분', '30초')
COMMIT_BAN = re.compile(
    r'(?:commit|커밋)\s*(?:금지|불가|하지\s*(?:않는다|마세요|말 것))'
    r'|\bdo\s+not\s+commit\b|\bno\s+commits?\b', re.IGNORECASE)


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('contract', type=Path)
    args = parser.parse_args(argv)
    try:
        content = args.contract.read_text(encoding='utf-8')
    except (OSError, UnicodeError) as error:
        print(f'계약 파일 읽기 실패: {error}', file=sys.stderr)
        return 2
    missing = [field for field in REQUIRED
               if not (COMMIT_BAN.search(content) if field == 'commit 금지'
                       else field in content)]
    for field in missing:
        print(field)
    return 1 if missing else 0


if __name__ == '__main__':
    raise SystemExit(main())
