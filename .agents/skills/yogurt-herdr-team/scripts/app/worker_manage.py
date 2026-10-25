from pathlib import Path
from domain.exclusions import exclude_preset, include_preset, load_exclusions
from domain.picker import pick_preset
from domain.state import DEFAULT_WORKER_DIR, load_all_states
from infra.herdr_cli import list_live_agents, list_agent_records


def get_active_presets(state_dir: Path, runner=None,
                      live_agents: set[str] | None = None) -> set[str]:
    states = load_all_states(state_dir)
    if not states:
        return set()
    if live_agents is not None:
        return {state['preset'] for name, state in states.items()
                if state.get('preset') and name in live_agents}
    live = list_live_agents(runner)
    return {state['preset'] for name, state in states.items()
            if state.get('preset') and (not live or name in live)}


def _worker_lines(registry: dict, agents: list[dict]) -> list[str]:
    live = {agent['name']: agent for agent in agents}
    lines = ['Workers (registry / Herdr):']
    for name in sorted(registry.keys() | live.keys()):
        state, agent = registry.get(name, {}), live.get(name, {})
        source = 'both' if state and agent else 'herdr only' if agent else 'stale registry'
        details = [f"preset={state['preset']}"] if state.get('preset') else []
        details.extend(f'{label}={item["tab_id"]}' for label, item in (
            ('registry_tab', state), ('herdr_tab', agent)) if item.get('tab_id'))
        lines.append(f"  - {name} [{source}]" + (f": {', '.join(details)}" if details else ''))
    if not registry and not live:
        lines.append('  (none)')
    return lines


def cmd_pick(need_tests: bool = False, state_dir: Path = DEFAULT_WORKER_DIR,
             exclusions_path: Path | None = None, runner=None) -> tuple[int, str]:
    active = get_active_presets(state_dir, runner)
    ex = load_exclusions(exclusions_path)
    chosen = pick_preset(need_tests=need_tests, excluded=set(ex.keys()), active_presets=active)
    if chosen:
        return 0, chosen
    return 1, 'error: no available preset (all are excluded or active)'


def cmd_exclude(preset: str, reason: str, exclusions_path: Path | None = None) -> tuple[int, str]:
    exclude_preset(preset, reason, path=exclusions_path)
    return 0, f"Excluded preset '{preset}': {reason}"


def cmd_include(preset: str, exclusions_path: Path | None = None) -> tuple[int, str]:
    ok = include_preset(preset, path=exclusions_path)
    return 0, f"Included preset '{preset}'" if ok else f"Preset '{preset}' was not excluded"


def cmd_status(state_dir: Path = DEFAULT_WORKER_DIR,
               exclusions_path: Path | None = None, runner=None) -> tuple[int, str]:
    try:
        agents = list_agent_records(runner)
    except RuntimeError as error:
        return 1, f'external failure: herdr agent list failed: {error}'
    registry = load_all_states(state_dir)
    live = {agent['name'] for agent in agents}
    ex = load_exclusions(exclusions_path)
    active = get_active_presets(state_dir, runner, live_agents=live)
    lines = ['=== Presets Status ===', 'Excluded presets:']
    lines.extend(f"  - {p}: {info.get('reason')} ({info.get('excluded_at')})"
                 for p, info in sorted(ex.items()))
    if not ex:
        lines.append('  (none)')
    lines.append('Active worker presets:')
    lines.extend(f'  - {preset}' for preset in sorted(active))
    if not active:
        lines.append('  (none)')
    lines.extend(_worker_lines(registry, agents))
    return 0, '\n'.join(lines)
