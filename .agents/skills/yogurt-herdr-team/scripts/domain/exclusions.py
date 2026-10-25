import json
import os
from datetime import datetime, timezone
from pathlib import Path

DEFAULT_EXCLUSIONS_PATH = Path.home() / '.yogurt-herdr' / 'excluded-presets.json'


def get_exclusions_file() -> Path:
    override = os.environ.get('HERDR_EXCLUDED_PRESETS_FILE')
    return Path(override) if override else DEFAULT_EXCLUSIONS_PATH


def load_exclusions(path: Path | None = None) -> dict[str, dict]:
    target = path or get_exclusions_file()
    if not target.exists():
        return {}
    try:
        return json.loads(target.read_text(encoding='utf-8'))
    except (json.JSONDecodeError, OSError):
        return {}


def save_exclusions(data: dict[str, dict], path: Path | None = None) -> None:
    target = path or get_exclusions_file()
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(data, indent=2), encoding='utf-8')


def exclude_preset(preset: str, reason: str, path: Path | None = None) -> None:
    target = path or get_exclusions_file()
    data = load_exclusions(target)
    data[preset] = {
        'reason': reason,
        'excluded_at': datetime.now(timezone.utc).isoformat(),
    }
    save_exclusions(data, target)


def include_preset(preset: str, path: Path | None = None) -> bool:
    target = path or get_exclusions_file()
    data = load_exclusions(target)
    if preset in data:
        del data[preset]
        save_exclusions(data, target)
        return True
    return False


def is_preset_excluded(preset: str, path: Path | None = None) -> bool:
    target = path or get_exclusions_file()
    return preset in load_exclusions(target)
