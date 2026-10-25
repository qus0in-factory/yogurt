import time
from pathlib import Path
from domain.exclusions import exclude_preset
from domain.state import DEFAULT_WORKER_DIR, load_state
from domain.usage_detector import detect_usage_issue
from infra.fallback import DEFAULT_FALLBACK_ROOT, find_and_consume_fallback
from infra.herdr_cli import get_agent_status, read_agent_output


def cmd_await(
    name: str,
    timeout: float = 60.0,
    to: str | None = None,
    state_dir: Path = DEFAULT_WORKER_DIR,
    fallback_root: Path = DEFAULT_FALLBACK_ROOT,
    exclusions_path: Path | None = None,
    interval: float = 0.1,
    sleep_fn=time.sleep,
    clock_fn=time.monotonic,
    runner=None,
) -> tuple[int, str]:
    deadline = clock_fn() + timeout
    while True:
        rep = find_and_consume_fallback(fallback_root, name, target=to)
        if rep:
            return 0, rep
        output = read_agent_output(name, runner=runner)
        matched = detect_usage_issue(output)
        if matched:
            st = load_state(state_dir, name)
            preset = st.get('preset') if st else name
            exclude_preset(preset, f'Usage limit pattern: {matched}', path=exclusions_path)
            return 3, f"Usage limit reached ({preset}): {matched}"
        status = get_agent_status(name, runner=runner)
        if status in ('idle', 'done'):
            rep = find_and_consume_fallback(fallback_root, name, target=to)
            return 0, (rep if rep else output)
        if clock_fn() >= deadline:
            return 2, f"Timeout waiting for worker '{name}'"
        sleep_fn(interval)
