from pathlib import Path

LAYERS = {'ui', 'app', 'domain', 'infra'}
MAX_LINES = 80


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
