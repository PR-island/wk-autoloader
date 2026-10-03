#!/usr/bin/env python3
"""Keep the frontend's elf-launcher constants in sync with its sha sidecar."""
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
SHA_FILE = ROOT / "frontend/autoloader/payloads/elf-launcher.elf.sha256"
APP = ROOT / "frontend/autoloader/app.js"


def read_metadata():
    fields = SHA_FILE.read_text(encoding="utf-8").split()
    if not fields:
        raise ValueError(f"empty launcher metadata: {SHA_FILE}")
    if re.fullmatch(r"[0-9a-fA-F]{64}", fields[0]):
        version, digest = "", fields[0].lower()
    elif len(fields) >= 2 and re.fullmatch(r"[0-9a-fA-F]{64}", fields[1]):
        version, digest = fields[0], fields[1].lower()
    else:
        raise ValueError(f"expected '<version> <sha256>' or '<sha256>' in {SHA_FILE}")
    if version.startswith("v"):
        version = version[1:]
    return version, digest


def main():
    version, digest = read_metadata()
    text = APP.read_text(encoding="utf-8")
    text, sha_count = re.subn(
        r"(var BUNDLED_ELFLAUNCHER_SHA\s*=\s*)['\"][0-9a-fA-F]{64}(['\"]\s*;)",
        rf"\g<1>'{digest}\g<2>", text, count=1,
    )
    text, ver_count = re.subn(
        r"(var BUNDLED_ELFLAUNCHER_VER\s*=\s*)['\"][^'\"]*(['\"]\s*;)",
        rf"\g<1>'{version}\g<2>", text, count=1,
    )
    if sha_count != 1 or ver_count != 1:
        raise RuntimeError("app.js launcher constants not found")
    APP.write_text(text, encoding="utf-8")
    print(f"elf-launcher metadata: {version or '(unversioned)'} {digest}")


if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError, RuntimeError) as exc:
        print(f"Error: {exc}", file=sys.stderr)
        raise SystemExit(1)
