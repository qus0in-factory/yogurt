from dataclasses import dataclass

GA_MODEL_ID = 'gemini-4-argon-medium'

DS_POST_START = (
    ('send_text', '/models'),
    ('send_keys', 'enter'),
    ('send_text', 'DeepSeek V4.1 Flash OpenCode'),
    ('send_keys', 'down'),
    ('send_keys', 'enter'),
    ('wait_output', 'DeepSeek V4.1 Flash OpenCode Go · max'),
)


@dataclass(frozen=True)
class Preset:
    name: str
    kind: str
    args: list[str]
    sandboxed: bool
    post_start: tuple[tuple[str, str], ...] | None = None


PRESETS: dict[str, Preset] = {
    'sol': Preset(
        name='sol', kind='codex',
        args=['-m', 'gpt-6.1-sol', '-c', 'model_reasoning_effort=medium'],
        sandboxed=True,
    ),
    'luna': Preset(
        name='luna', kind='codex',
        args=['-m', 'gpt-6-luna', '-c', 'model_reasoning_effort=max'],
        sandboxed=True,
    ),
    'gf': Preset(
        name='gf', kind='agy', args=['--effort', 'high'], sandboxed=False,
    ),
    'ga': Preset(
        name='ga', kind='agy',
        args=['--model', GA_MODEL_ID, '--effort', 'medium'],
        sandboxed=False,
    ),
    'ds': Preset(
        name='ds', kind='opencode', args=[], sandboxed=False,
        post_start=DS_POST_START,
    ),
}

DEFAULT_PRIORITY = ('sol', 'luna', 'gf', 'ga', 'ds')
NEED_TESTS_PRIORITY = ('gf', 'ga', 'ds', 'sol', 'luna')


def get_preset(name: str) -> Preset:
    if name not in PRESETS:
        raise ValueError(f"Unknown preset: '{name}'. Choose from: {list(PRESETS.keys())}")
    return PRESETS[name]
