#!/usr/bin/env python3
"""Inject parent->child wkal resend-autoload listener into patched exploit pages."""
import sys
from pathlib import Path

SLOPKIT_MARKER = "WKAL-RESEND-AUTOLOAD"
SLOPKIT_SNIPPET = '''
// WKAL-RESEND-AUTOLOAD: parent can ask us to re-send ?autoload= after :1000 miss.
window.addEventListener("message", function (ev) {
    try {
        var d = ev && ev.data;
        if (!d || d.type !== "wkal" || d.kind !== "resend-autoload") return;
        window.__wkalAutoloadSent = false;
        if (typeof startAutoload === "function") startAutoload();
    } catch (e) { }
});
'''

UMTX_MARKER = "WKAL-RESEND-AUTOLOAD"
UMTX_SNIPPET = '''
    // WKAL-RESEND-AUTOLOAD: parent can ask us to re-send autoload ELF after :1000 miss.
    window.addEventListener("message", function (ev) {
        try {
            var d = ev && ev.data;
            if (!d || d.type !== "wkal" || d.kind !== "resend-autoload") return;
            var name = d.name || wkalAutoloadName;
            if (!name) return;
            window.dispatchEvent(new CustomEvent(MAINLOOP_EXECUTE_PAYLOAD_REQUEST, {
                detail: {
                    fileName: name,
                    wkalBase: "../payloads/",
                    toPort: 9021,
                    wkalAutoload: true
                }
            }));
        } catch (e) { }
    });
'''


def patch_slopkit(path: Path) -> bool:
    t = path.read_text(encoding="utf-8")
    if SLOPKIT_MARKER in t:
        print(f"already has resend listener: {path}")
        return False
    needle = "async function startAutoload()"
    if needle not in t:
        print(f"WARN: startAutoload missing in {path}", file=sys.stderr)
        return False
    path.write_text(t.replace(needle, SLOPKIT_SNIPPET + "\n" + needle, 1), encoding="utf-8")
    print(f"added resend listener: {path}")
    return True


def patch_umtx2(path: Path) -> bool:
    t = path.read_text(encoding="utf-8")
    if UMTX_MARKER in t:
        print(f"already has resend listener: {path}")
        return False
    needle = "    // WKAL autoload: if the page was opened with ?autoload=<name>"
    if needle not in t:
        # fallback: after wkalAutoloadName declaration block ends
        alt = "    var wkalAutoloadName = new URLSearchParams(location.search).get(\"autoload\")"
        if alt not in t:
            print(f"WARN: umtx2 autoload block missing in {path}", file=sys.stderr)
            return False
        # insert after the whole if/else autoload block is harder; use MAINLOOP listener area
        marker2 = "    if (wkalAutoloadName && is_elfldr_running) {"
        if marker2 not in t:
            print(f"WARN: umtx2 insert point missing in {path}", file=sys.stderr)
            return False
        t = t.replace(marker2, UMTX_SNIPPET + "\n" + marker2, 1)
    else:
        t = t.replace(needle, UMTX_SNIPPET + "\n" + needle, 1)
    path.write_text(t, encoding="utf-8")
    print(f"added resend listener: {path}")
    return True


def main() -> int:
    root = Path(sys.argv[1] if len(sys.argv) > 1 else ".")
    for name in ("poops.html", "p2jb.html"):
        for path in ([root / name] if (root / name).is_file() else list(root.rglob(name))):
            if "slopkit" in str(path):
                patch_slopkit(path)
    main_js = root / "main.js"
    if main_js.is_file():
        patch_umtx2(main_js)
    else:
        for path in root.rglob("main.js"):
            if "umtx2" in str(path) or "ps5" in str(path):
                patch_umtx2(path)
                break
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
