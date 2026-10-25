import json
from pathlib import Path

DEFAULT_WORKER_DIR = Path('/tmp/herdr-workers')


def save_state(state_dir: Path, name: str, data: dict) -> Path:
    state_dir.mkdir(parents=True, exist_ok=True)
    target = state_dir / f'{name}.json'
    target.write_text(json.dumps(data, indent=2), encoding='utf-8')
    return target


def load_state(state_dir: Path, name: str) -> dict | None:
    target = state_dir / f'{name}.json'
    if not target.exists():
        return None
    try:
        return json.loads(target.read_text(encoding='utf-8'))
    except (json.JSONDecodeError, OSError):
        return None


def remove_state(state_dir: Path, name: str) -> bool:
    target = state_dir / f'{name}.json'
    if not target.exists():
        return False
    try:
        target.unlink()
        return True
    except OSError:
        return False


def find_active_worker(
    state_dir: Path,
    preset: str | None = None,
    name: str | None = None,
    live_agents: set[str] | None = None,
) -> dict | None:
    if name and live_agents and name in live_agents:
        return {'name': name, 'preset': preset}
    if not state_dir.exists():
        return None
    for file_path in sorted(state_dir.glob('*.json')):
        try:
            data = json.loads(file_path.read_text(encoding='utf-8'))
        except (json.JSONDecodeError, OSError):
            continue
        worker_name = data.get('name', file_path.stem)
        worker_preset = data.get('preset')
        is_live = live_agents is None or worker_name in live_agents
        if not is_live:
            continue
        if preset and worker_preset == preset:
            return data
        if name and worker_name == name:
            return data
    return None
