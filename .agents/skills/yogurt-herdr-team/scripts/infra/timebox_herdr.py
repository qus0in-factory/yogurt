from infra.herdr_cli import run_herdr


def interrupt_agent(pane: str, message: str, runner=None) -> bool:
    run_herdr(['herdr', 'agent', 'send-keys', pane, 'Escape'], runner)
    res = run_herdr(['herdr', 'agent', 'prompt', pane, message], runner)
    return res.returncode == 0
