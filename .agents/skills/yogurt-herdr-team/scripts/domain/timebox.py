def decide_timebox(status: str | None, elapsed: float, seconds: float) -> str:
    if status != 'working':
        return 'stop'
    return 'interrupt' if elapsed >= seconds else 'continue'
