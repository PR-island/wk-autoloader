#!/usr/bin/env python3
"""Register hidden WKAL PAYLOADS entries for autoload ELFs.

Without these, sendPayloadToElfldr throws 'payload is not listed in this menu'.
Covers: wkal-mark.elf, wkal-companions.elf, pldmgr.elf.
Elf Launcher is open-only (:1000) — never list/send elf-launcher.elf.
"""
import sys
from pathlib import Path

OLD = (
    '    { title: "WKAL autoload", description: "", name: "payload.elf",\n'
    '        info: "payload.elf", hidden: true }'
)
NEW = (
    '    { title: "WKAL autoload", description: "", name: "payload.elf",\n'
    '        info: "payload.elf", hidden: true },\n'
    '    { title: "WKAL mark", description: "", name: "wkal-mark.elf",\n'
    '        info: "wkal-mark.elf", hidden: true },\n'
    '    { title: "WKAL companions", description: "", name: "wkal-companions.elf",\n'
    '        info: "wkal-companions.elf", hidden: true },\n'
    '    { title: "WKAL autoload pldmgr", description: "", name: "pldmgr.elf",\n'
    '        info: "pldmgr.elf", hidden: true }'
)
PLDMGR_TILE = (
    '    { title: "WKAL autoload pldmgr", description: "", name: "pldmgr.elf",\n'
    '        info: "pldmgr.elf", hidden: true }'
)
COMPANIONS_ONLY = (
    '    { title: "WKAL companions", description: "", name: "wkal-companions.elf",\n'
    '        info: "wkal-companions.elf", hidden: true }'
)
COMPANIONS_WITH_PLDMGR = (
    '    { title: "WKAL companions", description: "", name: "wkal-companions.elf",\n'
    '        info: "wkal-companions.elf", hidden: true },\n'
    '    { title: "WKAL autoload pldmgr", description: "", name: "pldmgr.elf",\n'
    '        info: "pldmgr.elf", hidden: true }'
)
# Legacy tile left from older WK builds — strip it so the menu never sends it.
EL_TILE_LINE = 'name: "elf-launcher.elf"'


def strip_elf_launcher_tile(t: str) -> str:
    """Remove any hidden elf-launcher.elf PAYLOADS entry (object with trailing comma)."""
    import re
    return re.sub(
        r'\s*\{ title: "WKAL autoload elf-launcher", description: "", name: "elf-launcher\.elf",\n'
        r'\s*info: "elf-launcher\.elf", hidden: true \},?\n?',
        '\n',
        t,
    )


def ensure_pldmgr(path: Path, t: str) -> bool:
    """Append pldmgr tile when companions (or mark) already present."""
    if 'name: "pldmgr.elf"' in t:
        print(f"already listed pldmgr: {path}")
        return False
    if COMPANIONS_ONLY in t:
        path.write_text(t.replace(COMPANIONS_ONLY, COMPANIONS_WITH_PLDMGR, 1))
        print(f"listed pldmgr after companions: {path}")
        return True
    needle = (
        '    { title: "WKAL mark", description: "", name: "wkal-mark.elf",\n'
        '        info: "wkal-mark.elf", hidden: true }'
    )
    if needle in t and 'name: "wkal-companions.elf"' not in t:
        add = needle + ',\n' + PLDMGR_TILE
        path.write_text(t.replace(needle, add, 1))
        print(f"listed pldmgr after mark: {path}")
        return True
    print(f"WARN: could not place pldmgr tile in {path}", file=sys.stderr)
    return False


def patch_file(path: Path) -> bool:
    t = path.read_text()
    stripped = strip_elf_launcher_tile(t)
    changed = stripped != t
    t = stripped
    if 'name: "pldmgr.elf"' in t and 'name: "wkal-companions.elf"' in t:
        if changed:
            path.write_text(t)
            print(f"stripped elf-launcher tile: {path}")
        else:
            print(f"already listed: {path}")
        return changed
    if 'name: "wkal-companions.elf"' in t:
        if changed:
            path.write_text(t)
        return ensure_pldmgr(path, path.read_text() if changed else t) or changed
    if 'name: "wkal-mark.elf"' in t:
        needle = (
            '    { title: "WKAL mark", description: "", name: "wkal-mark.elf",\n'
            '        info: "wkal-mark.elf", hidden: true }'
        )
        add = (
            '    { title: "WKAL mark", description: "", name: "wkal-mark.elf",\n'
            '        info: "wkal-mark.elf", hidden: true },\n'
            '    { title: "WKAL companions", description: "", name: "wkal-companions.elf",\n'
            '        info: "wkal-companions.elf", hidden: true },\n'
            '    { title: "WKAL autoload pldmgr", description: "", name: "pldmgr.elf",\n'
            '        info: "pldmgr.elf", hidden: true }'
        )
        if needle in t:
            path.write_text(t.replace(needle, add, 1))
            print(f"listed companions+pldmgr after mark: {path}")
            return True
    if OLD not in t:
        if changed:
            path.write_text(t)
            print(f"stripped elf-launcher tile: {path}")
            return True
        print(f"WARN: WKAL payload.elf tile not found in {path}", file=sys.stderr)
        return False
    path.write_text(t.replace(OLD, NEW, 1))
    print(f"listed mark+companions+pldmgr: {path}")
    return True


def main():
    root = Path(sys.argv[1] if len(sys.argv) > 1 else ".")
    for name in ("poops.html", "p2jb.html"):
        paths = [root / name] if (root / name).is_file() else list(root.rglob(name))
        for path in paths:
            if "slopkit" in str(path):
                patch_file(path)


if __name__ == "__main__":
    main()
