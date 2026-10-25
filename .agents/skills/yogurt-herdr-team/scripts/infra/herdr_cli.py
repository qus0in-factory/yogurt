import json
import subprocess


def run_herdr(cmd: list[str], runner=None):
    fn = runner or subprocess.run
    return fn(cmd, capture_output=True, text=True, check=False)


def get_current_workspace(runner=None) -> str:
    res = run_herdr(['herdr', 'pane', 'current'], runner)
    if res.returncode != 0:
        raise RuntimeError(f'Failed to get current pane: {res.stderr}')
    return json.loads(res.stdout)['result']['pane']['workspace_id']


def list_live_agents(runner=None) -> set[str]:
    res = run_herdr(['herdr', 'agent', 'list'], runner)
    if res.returncode != 0:
        return set()
    try:
        data = json.loads(res.stdout)
        return {a['name'] for a in data.get('result', {}).get('agents', [])}
    except (json.JSONDecodeError, KeyError):
        return set()


def get_agent_status(name: str, runner=None) -> str | None:
    res = run_herdr(['herdr', 'agent', 'get', name], runner)
    if res.returncode != 0:
        return None
    try:
        data = json.loads(res.stdout)
        return data.get('result', {}).get('agent', {}).get('agent_status')
    except (json.JSONDecodeError, KeyError):
        return None


def read_agent_output(name: str, runner=None) -> str:
    cmd = ['herdr', 'agent', 'read', name, '--source', 'recent-unwrapped', '--lines', '50']
    res = run_herdr(cmd, runner)
    return res.stdout.strip() if res.returncode == 0 else ''


def close_tab(tab_id: str, runner=None) -> bool:
    res = run_herdr(['herdr', 'tab', 'close', tab_id], runner)
    if res.returncode == 0:
        return True
    combined = (res.stdout + ' ' + res.stderr).lower()
    return 'tab_not_found' in combined or 'not found' in combined
