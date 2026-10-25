USAGE_PATTERNS = (
    'usage limit',
    'rate limit',
    'quota',
    '한도',
    "you've hit",
    'you have hit',
)


def detect_usage_issue(text: str) -> str | None:
    if not text:
        return None
    lower = text.lower()
    for pattern in USAGE_PATTERNS:
        if pattern in lower:
            return pattern
    return None


def detect_capacity_error(text: str) -> str | None:
    lower = text.lower()
    for marker in ('ttft_admission_refused', 'at capacity'):
        if marker in lower:
            return marker
    return None
