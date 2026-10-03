#!/usr/bin/env python3
"""Call startAutoload() as soon as elfldr is ready in poops (STAGE5-DONE).

p2jb already does this from showWin(). Without this, poops only sends at
runLadder end (payloadSuccess) — JB can look done while send never starts
if the ladder stalls after STAGE5.
"""
import sys
from pathlib import Path

MARKER = "WKAL-AUTOLOAD-ON-READY"

OLD = (
    '        showVerdict(false, "ELF LOADER READY");\n'
    '        stage("ELF LOADER READY", "ok");\n'
    '        showPayloadMenu();\n'
    '    }'
)

NEW = (
    '        showVerdict(false, "ELF LOADER READY");\n'
    '        stage("ELF LOADER READY", "ok");\n'
    '        showPayloadMenu();\n'
    '        // WKAL-AUTOLOAD-ON-READY: inject immediately (same as p2jb showWin).\n'
    '        if (typeof startAutoload === "function") startAutoload();\n'
    '    }'
)


def patch_file(path: Path) -> bool:
    t = path.read_text(encoding="utf-8")
    if MARKER in t:
        print(f"already on-ready: {path}")
        return False
    if OLD not in t:
        print(f"WARN: STAGE5-DONE ready block not found in {path}", file=sys.stderr)
        return False
    path.write_text(t.replace(OLD, NEW, 1), encoding="utf-8")
    print(f"on-ready autoload: {path}")
    return True


def main() -> int:
    root = Path(sys.argv[1] if len(sys.argv) > 1 else ".")
    for path in ([root / "poops.html"] if (root / "poops.html").is_file()
                 else list(root.rglob("poops.html"))):
        if "slopkit" in str(path):
            patch_file(path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
