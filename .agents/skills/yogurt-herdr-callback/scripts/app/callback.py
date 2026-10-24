import argparse
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from domain.message import STATUSES, build_message, validate_agent_name
from infra.sender import send_callback


class CallbackParser(argparse.ArgumentParser):
    def error(self, message):
        raise ValueError(message)


def main(argv=None, sender=send_callback):
    parser = CallbackParser(description='Send a completion callback to a Herdr agent')
    parser.add_argument('--to', required=True)
    parser.add_argument('--from', dest='source', required=True)
    parser.add_argument('--status', choices=STATUSES, required=True)
    parser.add_argument('--summary', required=True)
    parser.add_argument('--report')
    parser.add_argument('--max-attempts', type=int, default=4)
    try:
        args = parser.parse_args(argv)
        validate_agent_name(args.to)
        if args.max_attempts < 1:
            raise ValueError('--max-attempts must be at least 1')
        message = build_message(args.source, args.status, args.summary, args.report)
    except ValueError as error:
        print(f'callback argument error: {error}', file=sys.stderr)
        return 2
    success, note = sender(args.to, args.source, message, max_attempts=args.max_attempts)
    print(' '.join(note.split()), file=sys.stderr)
    return 0 if success else 1


if __name__ == '__main__':
    raise SystemExit(main())
