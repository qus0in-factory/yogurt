PICKER_READY = 'Select model'

DS_POST_START = (
    ('send_text', '/models'),
    ('send_keys', 'enter'),
    ('wait_output', PICKER_READY),
    ('send_text', 'DeepSeek V4.1 Flash OpenCode Go'),
    ('wait_output', 'DeepSeek V4.1 Flash OpenCode Go'),
    ('send_keys', 'enter'),
    ('wait_output', 'DeepSeek V4.1 Flash OpenCode Go · max'),
)
GROK_POST_START = (
    ('send_text', '/models'),
    ('send_keys', 'enter'),
    ('wait_output', PICKER_READY),
    ('send_text', 'Grok 4.6 xAI'),
    ('wait_output', 'Grok 4.6 xAI'),
    ('send_keys', 'enter'),
    ('send_keys', 'ctrl+t'),
    ('wait_output', 'Grok 4.6 xAI · high'),
)
MIMO_POST_START = (
    ('send_text', '/models'),
    ('send_keys', 'enter'),
    ('wait_output', PICKER_READY),
    ('send_text', 'MiMo-V2.6-Flash OpenCode Go'),
    ('wait_output', 'MiMo-V2.6-Flash OpenCode Go'),
    ('send_keys', 'enter'),
    ('wait_output', 'MiMo-V2.6-Flash OpenCode Go'),
)
MUSE_POST_START = (
    ('send_text', '/models'),
    ('send_keys', 'enter'),
    ('wait_output', PICKER_READY),
    ('send_text', 'Muse Spark 1.3 Contributor OpenCode Go'),
    ('wait_output', 'Muse Spark 1.3 Contributor OpenCode Go'),
    ('send_keys', 'enter'),
    ('wait_output', 'Muse Spark 1.3 Contributor OpenCode Go · xhigh'),
)
