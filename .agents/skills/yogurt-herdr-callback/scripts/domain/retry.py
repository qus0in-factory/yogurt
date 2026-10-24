import json

_RETRYABLE = {'agent_blocked', 'timeout', 'agent_prompt_stalled', 'connection_failed', 'server_unavailable'}


def _error_code(stderr):
    try:
        data = json.loads(stderr)
    except (TypeError, ValueError):
        return ''
    if not isinstance(data, dict):
        return ''
    error = data.get('error')
    if isinstance(error, dict):
        return error.get('code', data.get('code', ''))
    return data.get('code', '')


def should_retry(returncode, stderr):
    if returncode in (None, 0, 2):
        return False
    code = _error_code(stderr)
    if code in _RETRYABLE or code.startswith(('connection_', 'socket_')):
        return True
    detail = (stderr or '').lower()
    return any(text in detail for text in (
        'connection refused', 'connection reset', 'connection failed',
        'failed to connect', 'socket unavailable', 'econnrefused', 'econnreset',
    ))


def backoff_seconds(retry_number, base=2):
    if retry_number < 1 or base < 0:
        raise ValueError('retry number must be positive and base non-negative')
    return base * 2 ** (retry_number - 1)
