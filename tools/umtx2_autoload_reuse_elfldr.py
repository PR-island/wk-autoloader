#!/usr/bin/env python3
"""Force umtx2 to reuse an already-running elfldr (sender-only).

Previous WKAL patch always continued the full kernel chain even when :9021 was
owned, then called load_local_elf("elfldr-ps5.elf") again. A second elfldr
hangs wait_for_elf_to_exit / blocks the autoload send, so WKAL never leaves.
"""
import sys
from pathlib import Path

OLD_REUSE = """    if (!wkOnly && is_elfldr_running) {
        // WKAL: always run the full chain in the autoloader, never skip it.
        await log("elfldr is already running, continuing with the full chain", LogLevel.INFO);
    }"""

NEW_REUSE = """    if (!wkOnly && is_elfldr_running) {
        // WKAL: reuse existing elfldr — sender-only. Relaunching a second
        // elfldr while :9021 is owned hangs wait_for_elf_to_exit / send.
        wkOnly = true;
        await log("elfldr is already running, reusing it (sender-only)", LogLevel.INFO);
    }"""

# Idempotent form already applied
ALREADY_REUSE = "reusing it (sender-only)"

OLD_LOAD = """        if (await load_local_elf("elfldr-ps5.elf") == 0) {
            await log(`elfldr listening on ${ip.ip}:9021`, LogLevel.INFO);
            is_elfldr_running = true;
        } else {
            await log("elfldr exited with non-zero code, port 9021 will likely not work", LogLevel.ERROR);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }"""

NEW_LOAD = """        if (is_elfldr_running) {
            await log("elfldr already listening on 9021 - not relaunching", LogLevel.INFO);
        } else if (await load_local_elf("elfldr-ps5.elf") == 0) {
            await log(`elfldr listening on ${ip.ip}:9021`, LogLevel.INFO);
            is_elfldr_running = true;
        } else {
            await log("elfldr exited with non-zero code, port 9021 will likely not work", LogLevel.ERROR);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }"""

ALREADY_LOAD = "elfldr already listening on 9021 - not relaunching"


def patch(path: Path) -> bool:
    t = path.read_text(encoding="utf-8")
    changed = False
    if ALREADY_REUSE not in t:
        if OLD_REUSE not in t:
            print(f"WARN: reuse block not found in {path}", file=sys.stderr)
        else:
            t = t.replace(OLD_REUSE, NEW_REUSE, 1)
            changed = True
            print(f"reuse-elfldr: sender-only when :9021 owned ({path})")
    else:
        print(f"reuse-elfldr: already sender-only ({path})")

    if ALREADY_LOAD not in t:
        if OLD_LOAD not in t:
            print(f"WARN: load_local_elf block not found in {path}", file=sys.stderr)
        else:
            t = t.replace(OLD_LOAD, NEW_LOAD, 1)
            changed = True
            print(f"reuse-elfldr: skip relaunch if already up ({path})")
    else:
        print(f"reuse-elfldr: already guards load_local_elf ({path})")

    if changed:
        path.write_text(t, encoding="utf-8")
    return changed


def main() -> int:
    root = Path(sys.argv[1] if len(sys.argv) > 1 else ".")
    main_js = root / "main.js"
    if main_js.is_file():
        patch(main_js)
        return 0
    found = False
    for path in root.rglob("main.js"):
        if "umtx2" in str(path) or "ps5" in str(path):
            patch(path)
            found = True
            break
    if not found:
        print("WARN: umtx2 main.js not found", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
