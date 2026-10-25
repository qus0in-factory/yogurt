from domain.presets import DEFAULT_PRIORITY, NEED_TESTS_PRIORITY


def pick_preset(
    need_tests: bool = False,
    excluded: set[str] | None = None,
    active_presets: set[str] | None = None,
) -> str | None:
    priority = NEED_TESTS_PRIORITY if need_tests else DEFAULT_PRIORITY
    ex = excluded or set()
    active = active_presets or set()
    for preset in priority:
        if preset not in ex and preset not in active:
            return preset
    return None
