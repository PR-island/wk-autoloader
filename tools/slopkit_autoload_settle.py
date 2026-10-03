#!/usr/bin/env python3
"""Insert/refresh a short settle delay after elfldr accepts, before sending (150ms)."""
import re
import sys
from pathlib import Path

SETTLE_MS = 150
SETTLE = (
    "    // Let elfldr settle before sending payload.elf "
    "(avoids panic on Payload Manager).\n"
    f"    await new Promise(function (resolve) {{ setTimeout(resolve, {SETTLE_MS}); }});\n"
)


def patch_file(path: Path) -> bool:
    t = path.read_text(encoding="utf-8")
    # Refresh an existing settle timeout to SETTLE_MS.
    if "avoids panic on Payload Manager" in t:
        new, n = re.subn(
            r"(// Let elfldr settle before sending payload\.elf "
            r"\(avoids panic on Payload Manager\)\.\n"
            r"    await new Promise\(function \(resolve\) \{ setTimeout\(resolve, )\d+(\); \}\);)",
            rf"\g<1>{SETTLE_MS}\2",
            t,
            count=1,
        )
        if n == 1 and new != t:
            path.write_text(new, encoding="utf-8")
            print(f"settle refreshed to {SETTLE_MS}ms: {path}")
            return True
        print(f"already settled ({SETTLE_MS}ms): {path}")
        return False
    new, n = re.subn(
        r"(    if \(!ready\) \{[\s\S]*?return;\n    \}\n)"
        r"(    sendPayloadToElfldr\((?:AUTOLOAD|cfg\.autoload))",
        r"\1" + SETTLE + r"\2",
        t,
        count=1,
    )
    if n != 1:
        new, n = re.subn(
            r"(\n)(    sendPayloadToElfldr\((?:AUTOLOAD|cfg\.autoload))",
            r"\1" + SETTLE + r"\2",
            t,
            count=1,
        )
    if n != 1:
        print(f"WARN: could not settle {path}", file=sys.stderr)
        return False
    path.write_text(new, encoding="utf-8")
    print(f"settled ({SETTLE_MS}ms): {path}")
    return True


def main():
    root = Path(sys.argv[1] if len(sys.argv) > 1 else ".")
    for name in ("poops.html", "p2jb.html"):
        paths = [root / name] if (root / name).is_file() else list(root.rglob(name))
        for path in paths:
            patch_file(path)


if __name__ == "__main__":
    main()
