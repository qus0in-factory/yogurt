import json
from pathlib import Path
from domain.exclusions import exclude_preset, include_preset, load_exclusions
from domain.picker import pick_preset
from domain.state import DEFAULT_WORKER_DIR
from infra.herdr_cli import list_live_agents


def get_active_presets(state_dir: Path, runner=None) -> set[str]:
    if not state_dir.exists():
        return set()
    live = list_live_agents(runner)
    active = set()
    for f in state_dir.glob('*.json'):
        try:
            d = json.loads(f.read_text('utf-8'))
            name = d.get('name', f.stem)
            preset = d.get('preset')
            if preset and (not live or name in live):
                active.add(preset)
        except (json.JSONDecodeError, OSError):
            continue
    return active


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
    ex = load_exclusions(exclusions_path)
    active = get_active_presets(state_dir, runner)
    lines = ['=== Presets Status ===', 'Excluded presets:']
    if ex:
        for p, info in sorted(ex.items()):
            lines.append(f"  - {p}: {info.get('reason')} ({info.get('excluded_at')})")
    else:
        lines.append('  (none)')
    lines.append('Active worker presets:')
    if active:
        for p in sorted(active):
            lines.append(f'  - {p}')
    else:
        lines.append('  (none)')
    return 0, '\n'.join(lines)
