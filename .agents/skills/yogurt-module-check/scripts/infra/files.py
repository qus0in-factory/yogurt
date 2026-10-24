import subprocess
from pathlib import Path

EXTENSIONS = {
    '.py', '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.mts', '.cts',
    '.go', '.rs', '.sh', '.bash', '.zsh', '.sql', '.css', '.scss', '.html',
    '.vue', '.svelte', '.java', '.kt', '.rb', '.php', '.c', '.h', '.cpp',
    '.hpp', '.swift', '.dart', '.cs', '.ex', '.exs', '.lua', '.r',
}


def source_files(root: Path):
    result = subprocess.run(
        ['git', '-C', str(root), 'ls-files', '--cached', '--others',
         '--exclude-standard', '-z'],
        capture_output=True, check=True,
    )
    names = sorted(set(result.stdout.decode('utf-8').split('\0')) - {''})
    for name in names:
        relative = Path(name)
        path = root / relative
        if (relative.suffix.lower() in EXTENSIONS
                and not path.is_symlink() and path.is_file()):
            yield relative
