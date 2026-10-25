import re
from pathlib import Path

LAYERS = {'ui', 'app', 'domain', 'infra'}
MAX_LINES = 80
TYPOGRAPHY_PATTERN = re.compile(r'\btext-(?:xs|sm|base|lg|xl|2xl|3xl)\b')


def violations(path: Path, text: str) -> list[str]:
    errors = []
    count = len(text.splitlines())
    if count > MAX_LINES:
        errors.append(f'{path}: {count} lines exceeds {MAX_LINES}')
    if not LAYERS.intersection(path.parts[:-1]):
        errors.append(f'{path}: missing ui/app/domain/infra directory')
    if path.parts[:1] == ('src',) and path.name.endswith(('.test.ts', '.test.tsx')):
        errors.append(f'{path}: tests belong under tests/')
    return errors


def typography_violations(path: Path, text: str) -> list[str]:
    if not (path.parts[:2] == ('src', 'ui') and path.suffix == '.tsx'):
        return []
    if len(path.parts) > 2 and path.parts[2] in {'styles', 'components'}:
        return []
    matches = sorted(set(TYPOGRAPHY_PATTERN.findall(text)))
    if matches:
        return [f'{path}: hardcoded typography {", ".join(matches)} (use typeScale)']
    return []
