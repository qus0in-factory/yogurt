import re

_SEMVER = re.compile(r'\d+\.\d+\.\d+')


def validate_version(value):
    if not isinstance(value, str) or not _SEMVER.fullmatch(value):
        raise ValueError('version must be semver X.Y.Z')


def tag_name(version):
    validate_version(version)
    return f'v{version}'


def health_matches(payload, expected):
    if not isinstance(payload, dict):
        return False
    return payload.get('version') == expected
