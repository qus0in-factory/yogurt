import json
import subprocess
from infra.herdr_cli import run_herdr


def create_tab(workspace_id: str, cwd: str, label: str, runner=None) -> tuple[str, str]:
    cmd = [
        'herdr', 'tab', 'create',
        '--workspace', workspace_id,
        '--cwd', cwd,
        '--label', label,
        '--no-focus',
    ]
    res = run_herdr(cmd, runner)
    if res.returncode != 0:
        raise RuntimeError(f'Failed to create tab: {res.stderr}')
    data = json.loads(res.stdout)['result']
    return data['tab']['tab_id'], data['root_pane']['pane_id']


def start_agent(
    name: str,
    kind: str,
    pane_id: str,
    args: list[str],
    timeout: int = 60000,
    runner=None,
) -> bool:
    cmd = [
        'herdr', 'agent', 'start', name,
        '--kind', kind,
        '--pane', pane_id,
        '--timeout', str(timeout),
    ]
    if args:
        cmd.extend(['--'] + args)
    res = run_herdr(cmd, runner, timeout=timeout / 1000 + 5)
    return res.returncode == 0


def run_post_start(
    pane_id: str,
    steps: tuple[tuple[str, str], ...],
    runner=None,
) -> None:
    for action, value in steps:
        if action == 'send_text':
            cmd = ['herdr', 'pane', 'send-text', pane_id, value]
        elif action == 'send_keys':
            cmd = ['herdr', 'pane', 'send-keys', pane_id, value]
        elif action == 'wait_output':
            cmd = ['herdr', 'pane', 'wait-output', '--timeout', '10000',
                   '--match', value, pane_id]
        else:
            raise RuntimeError(f'delegated failure: unknown post-start action {action}')
        try:
            res = run_herdr(cmd, runner, timeout=12)
        except subprocess.TimeoutExpired as error:
            raise RuntimeError(f'delegated failure: post-start timed out: {error}') from error
        if res.returncode != 0:
            raise RuntimeError(f'delegated failure: post-start step failed ({action}): {res.stderr}')


def prompt_agent(name: str, text: str, runner=None, timeout: float = 65) -> bool:
    cmd = ['herdr', 'agent', 'prompt', name, text]
    try:
        res = run_herdr(cmd, runner, timeout=timeout)
    except subprocess.TimeoutExpired:
        return False
    return res.returncode == 0
