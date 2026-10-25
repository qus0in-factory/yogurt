import json
import subprocess


def run_herdr(cmd: list[str], runner=None, timeout: float = 65.0):
    fn = runner or subprocess.run
    return fn(cmd, capture_output=True, text=True, check=False, timeout=timeout)


def get_current_workspace(runner=None) -> str:
    res = run_herdr(['herdr', 'pane', 'current'], runner)
    if res.returncode != 0:
        raise RuntimeError(f'Failed to get current pane: {res.stderr}')
    return json.loads(res.stdout)['result']['pane']['workspace_id']


def list_agent_records(runner=None) -> list[dict]:
    try:
        res = run_herdr(['herdr', 'agent', 'list'], runner)
    except subprocess.TimeoutExpired as error:
        raise RuntimeError(f'agent list timed out: {error}') from error
    if res.returncode != 0:
        raise RuntimeError(f'agent list failed: {res.stderr}')
    try:
        agents = json.loads(res.stdout).get('result', {}).get('agents')
    except (json.JSONDecodeError, AttributeError):
        agents = None
    if not isinstance(agents, list) or any(
            not isinstance(item, dict) or not isinstance(item.get('name'), str)
            for item in agents
    ):
        raise RuntimeError('agent list returned invalid records')
    return agents


def get_agent_tab_id(name: str, runner=None) -> str:
    agent = next((item for item in list_agent_records(runner) if item.get('name') == name), None)
    if agent is None:
        raise RuntimeError(f"worker '{name}' not found in herdr agent list")
    tab_id = agent.get('tab_id')
    if not tab_id:
        raise RuntimeError(f"worker '{name}' has no tab_id in herdr agent list")
    return tab_id


def list_live_agents(runner=None) -> set[str]:
    try:
        return {a['name'] for a in list_agent_records(runner)}
    except (RuntimeError, KeyError, TypeError):
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
