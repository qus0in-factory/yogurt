import argparse
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from domain.version import health_matches, tag_name, validate_version
from infra.ops import create_tag, fetch_health, list_tags, push_tag, read_version, resolve_main

POLL_ATTEMPTS = 30
POLL_INTERVAL = 10

class ReleaseParser(argparse.ArgumentParser):
    def error(self, message): raise ValueError(message)


def main(argv=None, read=read_version, tags=list_tags, resolve=resolve_main, create=create_tag, push=push_tag, health=fetch_health, wake=time.sleep):
    try:
        args = _parse(argv)
    except ValueError as error:
        print(f'release argument error: {error}', file=sys.stderr); return 2
    try:
        version = read('package.json')
        validate_version(version)
    except (OSError, ValueError) as error:
        print(f'cannot release from package.json: {error}', file=sys.stderr); return 1
    tag = tag_name(version)
    code, names, detail = tags()
    if code != 0:
        return _fail(f'git tag -l failed: {detail}')
    if tag in names:
        return _fail(f'tag {tag} already exists')
    code, sha, detail = resolve()
    if code != 0:
        return _fail(f'git rev-parse origin/main failed: {detail}')
    if args.dry_run:
        _print_plan(tag, sha); return 0
    code, detail = create(tag, sha)
    if code != 0:
        return _fail(f'git tag -a {tag} failed: {detail}')
    code, detail = push(tag)
    if code != 0:
        return _fail(f'git push origin {tag} failed: {detail}')
    return _verify_deployment(args.health_url, version, health, wake)


def _parse(argv):
    parser = ReleaseParser(description='Tag the release and verify the deployed health version')
    parser.add_argument('--health-url', required=True)
    parser.add_argument('--dry-run', action='store_true')
    return parser.parse_args(argv)


def _verify_deployment(url, version, health, wake):
    reason = f'health version did not match {version}'
    for attempt in range(1, POLL_ATTEMPTS + 1):
        try: payload = health(url)
        except Exception as error:
            payload = None
            detail = f'HTTP {error.code}' if hasattr(error, 'code') else str(error)
            reason = f'health fetch failed: {detail}'
        if health_matches(payload, version):
            print(f'deployed health version {version} verified'); return 0
        if attempt < POLL_ATTEMPTS:
            wake(POLL_INTERVAL)
    return _fail(f'{reason} after {POLL_ATTEMPTS} attempts')


def _print_plan(tag, sha):
    plan = [f'plan: version tag {tag} on origin/main {sha}', f'plan: git tag -a {tag} -m "Release {tag}" {sha}', f'plan: git push origin {tag}', 'plan: health check skipped in dry-run']
    print('\n'.join(plan))


def _fail(message):
    print(message, file=sys.stderr)
    return 1


if __name__ == '__main__':
    raise SystemExit(main())
