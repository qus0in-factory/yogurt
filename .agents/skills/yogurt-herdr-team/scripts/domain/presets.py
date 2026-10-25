from dataclasses import dataclass
from domain.post_start import DS_POST_START, GROK_POST_START, MIMO_POST_START, MUSE_POST_START

GA_MODEL_ID = 'gemini-4-argon-medium'

@dataclass(frozen=True)
class Preset:
    name: str
    kind: str
    args: list[str]
    sandboxed: bool
    post_start: tuple[tuple[str, str], ...] | None = None


def make_ga_preset(model_id: str | None = None) -> Preset:
    target_id = model_id if model_id is not None else GA_MODEL_ID
    args = ['--effort', 'medium']
    if target_id:
        args.extend(['--model', target_id])
    return Preset(name='ga', kind='agy', args=args, sandboxed=False)


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
        name='gf', kind='agy', args=['--effort', 'medium'], sandboxed=False,
    ),
    'ga': make_ga_preset(),
    'ds': Preset(
        name='ds', kind='opencode', args=[], sandboxed=False,
        post_start=DS_POST_START,
    ),
    'grok': Preset(
        name='grok', kind='opencode', args=[], sandboxed=False,
        post_start=GROK_POST_START,
    ),
    'mimo': Preset(
        name='mimo', kind='opencode', args=[], sandboxed=False,
        post_start=MIMO_POST_START,
    ),
    'muse': Preset(
        name='muse', kind='opencode', args=[], sandboxed=False,
        post_start=MUSE_POST_START,
    ),
}

DEFAULT_PRIORITY = ('sol', 'luna', 'gf', 'ga', 'ds', 'grok', 'mimo', 'muse')
NEED_TESTS_PRIORITY = ('gf', 'ga', 'ds', 'grok', 'sol', 'luna', 'mimo', 'muse')


def get_preset(name: str) -> Preset:
    if name not in PRESETS:
        raise ValueError(f"Unknown preset: '{name}'. Choose from: {list(PRESETS.keys())}")
    if name == 'ga' and not GA_MODEL_ID:
        raise ValueError('모델 id 미확정: Gemini 4 Argon 모델 식별자가 설정되지 않았습니다')
    return PRESETS[name]
