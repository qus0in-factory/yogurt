import re

STATUSES = ('done', 'failed', 'blocked')
MAX_SUMMARY_LENGTH = 500
MAX_REPORT_LENGTH = 1024
_AGENT = re.compile(r'[a-z][a-z0-9_-]{0,31}')


def validate_agent_name(value):
    if not _AGENT.fullmatch(value):
        raise ValueError('agent name must match [a-z][a-z0-9_-]{0,31}')


def build_message(agent, status, summary, report=None):
    validate_agent_name(agent)
    if status not in STATUSES:
        raise ValueError('status must be done, failed, or blocked')
    summary = ' '.join(summary.split())
    if not summary or len(summary) > MAX_SUMMARY_LENGTH:
        raise ValueError(f'summary must be 1 to {MAX_SUMMARY_LENGTH} characters')
    parts = ['[callback]', agent, f'status:{status}', summary]
    if report is not None:
        report = ' '.join(report.split())
        if not report or len(report) > MAX_REPORT_LENGTH:
            raise ValueError(f'report path must be 1 to {MAX_REPORT_LENGTH} characters')
        parts.append(report)
    return ' '.join(parts)
