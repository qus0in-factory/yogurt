import sys
from pathlib import Path
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.worker_await import cmd_await
from app.worker_manage import cmd_exclude, cmd_include, cmd_pick, cmd_status
from app.worker_ops import cmd_close, cmd_open, cmd_prompt, cmd_run
from app.worker_parser import build_parser
from app.timebox import launch_timebox
from domain.state import DEFAULT_WORKER_DIR, load_state


def start_timebox(name: str, seconds: float, launcher=None, state_dir: Path = DEFAULT_WORKER_DIR) -> None:
    if seconds <= 0:
        return
    state = load_state(state_dir, name) or {}
    pane = state.get('pane_id') or name
    try:
        (launcher or launch_timebox)(pane, seconds)
    except Exception:
        pass


def dispatch(args, runner=None) -> tuple[int, str]:
    cmd = args.command
    if cmd == 'open':
        return cmd_open(args.preset, name=args.name, cwd=args.cwd, runner=runner)
    if cmd == 'prompt':
        code, out = cmd_prompt(args.name, args.file, runner=runner)
        if code == 0:
            start_timebox(args.name, args.timebox)
        return code, out
    if cmd == 'await':
        return cmd_await(args.name, timeout=args.timeout, to=args.to, runner=runner)
    if cmd == 'close':
        return cmd_close(args.name, runner=runner)
    if cmd == 'run':
        return cmd_run(args.preset, args.file, name=args.name,
                       timeout=args.timeout, cwd=args.cwd, runner=runner)
    if cmd == 'pick':
        return cmd_pick(need_tests=args.need_tests, runner=runner)
    if cmd == 'exclude':
        return cmd_exclude(args.preset, args.reason)
    if cmd == 'include':
        return cmd_include(args.preset)
    if cmd == 'status':
        return cmd_status(runner=runner)
    return 1, f'unknown command {cmd}'


def main(argv=None, runner=None) -> int:
    args = build_parser().parse_args(argv)
    code, out = dispatch(args, runner=runner)
    if out:
        target = sys.stderr if code not in (0, 3) and args.command != 'await' else sys.stdout
        print(out, file=target)
    return code


if __name__ == '__main__':
    sys.exit(main())
