import json
import time
from pathlib import Path
from domain.presets import get_preset
from domain.state import DEFAULT_WORKER_DIR, find_active_worker, remove_state, save_state
from infra.fallback import DEFAULT_FALLBACK_ROOT
from infra.herdr_cli import close_tab, get_current_workspace, list_live_agents, get_agent_tab_id, list_agent_records
from infra.herdr_ops import create_tab, prompt_agent, run_post_start, start_agent

from app.worker_await import cmd_await


def _open_failure(tab_id: str, reason: str, runner=None) -> tuple[int, str]:
    cleanup = '' if close_tab(tab_id, runner=runner) else '; tab cleanup failed'
    return 1, f'{reason}{cleanup}'


def cmd_open(preset: str, name: str | None = None, cwd: str | None = None,
             state_dir: Path = DEFAULT_WORKER_DIR, runner=None) -> tuple[int, str]:
    worker_name = name or preset
    work_dir = cwd or str(Path.cwd().resolve())
    preset_obj = get_preset(preset)
    active = find_active_worker(state_dir, preset=preset, name=worker_name, live_agents=list_live_agents(runner))
    if active:
        return 1, f"error: worker for preset '{preset}' already running: {active['name']}"
    ws_id = get_current_workspace(runner)
    tab_id, pane_id = create_tab(ws_id, work_dir, worker_name, runner=runner)
    try:
        if not start_agent(worker_name, preset_obj.kind, pane_id, preset_obj.args, runner=runner):
            raise RuntimeError('external failure: agent start failed')
        if preset_obj.post_start:
            run_post_start(pane_id, preset_obj.post_start, runner=runner)
    except Exception as error:
        reason = str(error)
        if not reason.startswith(('external failure:', 'delegated failure:')):
            reason = f'external failure: {reason}'
        return _open_failure(tab_id, reason, runner)
    state = {'name': worker_name, 'preset': preset, 'tab_id': tab_id, 'pane_id': pane_id}
    try:
        save_state(state_dir, worker_name, state)
    except OSError as error:
        return _open_failure(tab_id, f'external failure: registry save failed: {error}', runner)
    return 0, json.dumps({'name': worker_name, 'pane_id': pane_id, 'tab_id': tab_id})


def cmd_prompt(name: str, file_path: str, runner=None) -> tuple[int, str]:
    content = Path(file_path).read_text(encoding='utf-8')
    ok = prompt_agent(name, content, runner=runner)
    return (0, '') if ok else (1, f"error: failed to prompt agent '{name}'")


def cmd_close(name: str, state_dir: Path = DEFAULT_WORKER_DIR, runner=None) -> tuple[int, str]:
    try:
        tab_id = get_agent_tab_id(name, runner)
    except RuntimeError as error:
        return 1, f'external failure: {error}'
    if not close_tab(tab_id, runner=runner):
        return 1, f"external failure: failed to close tab '{tab_id}'"
    remove_state(state_dir, name)
    return 0, ''


def cmd_run(preset: str, file_path: str, name: str | None = None,
            timeout: float = 60.0, cwd: str | None = None,
            state_dir: Path = DEFAULT_WORKER_DIR,
            fallback_root: Path = DEFAULT_FALLBACK_ROOT,
            sleep_fn=time.sleep, clock_fn=time.monotonic, runner=None) -> tuple[int, str]:
    code, out = cmd_open(preset, name=name, cwd=cwd, state_dir=state_dir, runner=runner)
    if code != 0:
        return code, out
    worker_name = name or preset
    code, out = cmd_prompt(worker_name, file_path, runner=runner)
    if code != 0:
        return code, out
    return cmd_await(worker_name, timeout=timeout, state_dir=state_dir,
                     fallback_root=fallback_root, sleep_fn=sleep_fn, clock_fn=clock_fn, runner=runner)
