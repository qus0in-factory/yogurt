import argparse
from domain.presets import PRESETS

CHOICES = list(PRESETS.keys())


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(description='Herdr worker tab manager')
    sub = p.add_subparsers(dest='command', required=True)

    o = sub.add_parser('open')
    o.add_argument('--preset', choices=CHOICES, required=True)
    o.add_argument('--name', default=None)
    o.add_argument('--cwd', default=None)

    pr = sub.add_parser('prompt')
    pr.add_argument('--name', required=True)
    pr.add_argument('--file', required=True)

    aw = sub.add_parser('await')
    aw.add_argument('--name', required=True)
    aw.add_argument('--timeout', type=float, default=60.0)
    aw.add_argument('--to', default=None)

    cl = sub.add_parser('close')
    cl.add_argument('--name', required=True)

    r = sub.add_parser('run')
    r.add_argument('--preset', choices=CHOICES, required=True)
    r.add_argument('--file', required=True)
    r.add_argument('--name', default=None)
    r.add_argument('--timeout', type=float, default=60.0)
    r.add_argument('--cwd', default=None)

    pk = sub.add_parser('pick')
    pk.add_argument('--need-tests', action='store_true', default=False)

    ex = sub.add_parser('exclude')
    ex.add_argument('--preset', choices=CHOICES, required=True)
    ex.add_argument('--reason', required=True)

    inc = sub.add_parser('include')
    inc.add_argument('--preset', choices=CHOICES, required=True)

    sub.add_parser('status')
    return p
