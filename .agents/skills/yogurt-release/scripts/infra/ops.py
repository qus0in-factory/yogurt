import json
import subprocess
import urllib.request


def read_version(path, reader=None):
    reader = reader or _json_reader
    return reader(path).get('version', '')


def _json_reader(path):
    with open(path, encoding='utf-8') as handle:
        return json.load(handle)


def list_tags(runner=None):
    code, out, err = _git(['tag', '-l'], runner)
    return code, out.split(), err


def resolve_main(runner=None):
    code, _out, err = _git(['fetch', 'origin', 'main', '--tags'], runner)
    if code != 0:
        return code, '', err
    code, out, err = _git(['rev-parse', 'origin/main'], runner)
    return code, out.strip(), err


def create_tag(tag, sha, runner=None):
    code, _out, err = _git(['tag', '-a', tag, '-m', f'Release {tag}', sha], runner)
    return code, err


def push_tag(tag, runner=None):
    code, _out, err = _git(['push', 'origin', tag], runner)
    return code, err


def fetch_health(url, opener=None):
    opener = opener or urllib.request.urlopen
    request = urllib.request.Request(url, headers={
        'User-Agent': 'yogurt-release/1 (+https://github.com/qus0in-factory/yogurt)',
        'Cache-Control': 'no-cache',
    })
    with opener(request, timeout=10) as response:
        return json.loads(response.read().decode('utf-8'))


def _git(args, runner=None):
    runner = runner or subprocess.run
    result = runner(['git', *args], capture_output=True, text=True, check=False)
    return result.returncode, result.stdout, result.stderr
