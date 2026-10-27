import argparse
import subprocess
import sys
import time
from pathlib import Path

if __package__ in (None, ''):
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from domain.timebox import decide_timebox
from infra.herdr_cli import get_agent_status
from infra.timebox_herdr import interrupt_agent

TIMEOUT_MESSAGE = '5분 시간 제한을 넘었다. 새 작업을 하지 말고, 지금까지 한 것과 남은 것을 계약의 보고 파일에 쓰고 --status blocked로 콜백하라.'


def run_timebox(pane: str, seconds: float = 300, interval: float = 10,
                status_fn=get_agent_status, send_fn=interrupt_agent,
                sleep_fn=time.sleep, clock=time.monotonic, startup_grace: float = 0) -> str:
    start = clock()
    if startup_grace > 0:
        sleep_fn(startup_grace)
    while True:
        status = status_fn(pane)
        action = decide_timebox(status, clock() - start, seconds)
        if action == 'stop':
            return f'{pane} ended ({status})'
        if action == 'interrupt':
            send_fn(pane, TIMEOUT_MESSAGE)
            return f'{pane} timed out'
        sleep_fn(interval)


def launch_timebox(pane: str, seconds: float) -> None:
    subprocess.Popen(
        [sys.executable, str(Path(__file__).resolve()), '--pane', pane, '--seconds', str(seconds)],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, start_new_session=True,
    )


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description='Interrupt a working Herdr agent after a deadline')
    parser.add_argument('--pane', required=True)
    parser.add_argument('--seconds', type=float, default=300)
    parser.add_argument('--interval', type=float, default=10)
    args = parser.parse_args(argv)
    if args.seconds <= 0:
        return 0
    print(run_timebox(args.pane, args.seconds, args.interval, startup_grace=15))
    return 0


if __name__ == '__main__':
    sys.exit(main())
