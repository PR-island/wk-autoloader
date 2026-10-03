#!/usr/bin/env python3
"""Guard startAutoload so concurrent calls cannot double-send to elfldr :9021.

Busy clears in finally after the send settles. __wkalAutoloadSent blocks a
second automatic send (STAGE5-DONE then runLadder end). Parent resend after
:1000 miss clears Sent via the resend listener, then startAutoload runs again.
"""
import sys
from pathlib import Path

MARKER = "WKAL-AUTOLOAD-SINGLE-FLIGHT"
SETTLE_MS = 150

POOPS_OLD = f"""async function startAutoload() {{
    if (!cfg.autoload) return;
    preparePayloadSender();
    flushMark("AUTOLOAD-WAIT", "poll-connect=127.0.0.1:9021-tries=50-interval=200");
    stage("autoloading " + cfg.autoload + " -- waiting for the ELF loader on port 9021", "ok");
    let ready = false;
    for (let i = 0; i < 50 && !ready; ++i) {{
        ready = await elfldrAccepting();
        if (!ready) await new Promise(function (resolve) {{ setTimeout(resolve, 200); }});
    }}
    if (!ready) {{
        flushMark("AUTOLOAD-FAILED", "why=elfldr-not-accepting-on-9021");
        stage("autoload failed: the ELF loader never accepted on port 9021", "bad");
        try {{ window.parent.postMessage({{ type: "wkal", kind: "autoload", ok: false,
            why: "the ELF loader is not accepting connections on port 9021" }}, "*"); }} catch (e) {{ }}
        return;
    }}
    // Let elfldr settle before sending payload.elf (avoids panic on Payload Manager).
    await new Promise(function (resolve) {{ setTimeout(resolve, {SETTLE_MS}); }});
    sendPayloadToElfldr(cfg.autoload, "../../payloads/").then(function (r) {{
        flushMark("AUTOLOAD-OK", "name=" + cfg.autoload + "-bytes=" + r.bytes);
        stage("autoloaded " + cfg.autoload + " (" + r.bytes + " bytes)", "ok");
        try {{ window.parent.postMessage({{ type: "wkal", kind: "autoload", ok: true, bytes: r.bytes }}, "*"); }} catch (e) {{ }}
    }}).catch(function (err) {{
        flushMark("AUTOLOAD-FAILED", "why=" + clean(err && err.message ? err.message : err));
        stage("autoload failed: " + (err && err.message ? err.message : err), "bad");
        try {{ window.parent.postMessage({{ type: "wkal", kind: "autoload", ok: false, why: String(err && err.message || err) }}, "*"); }} catch (e) {{ }}
    }});
}}"""

POOPS_NEW = f"""async function startAutoload() {{
    if (!cfg.autoload) {{
        try {{ window.parent.postMessage({{ type: "wkal", kind: "autoload", ok: false,
            why: "no autoload= in URL" }}, "*"); }} catch (e) {{ }}
        return;
    }}
    if (cfg.autoload === "wkal-skip") {{
        stage("elf-launcher already on :1000 - not sending", "ok");
        try {{ window.parent.postMessage({{ type: "wkal", kind: "autoload", ok: true, bytes: 0, skipped: true }}, "*"); }} catch (e) {{ }}
        return;
    }}
    // WKAL-AUTOLOAD-SINGLE-FLIGHT: one in-flight / one successful send to elfldr :9021.
    if (window.__wkalAutoloadBusy) return;
    if (window.__wkalAutoloadSent) return;
    window.__wkalAutoloadBusy = true;
    try {{
    preparePayloadSender();
    flushMark("AUTOLOAD-WAIT", "poll-connect=127.0.0.1:9021-tries=50-interval=200");
    stage("autoloading " + cfg.autoload + " -- waiting for the ELF loader on port 9021", "ok");
    let ready = false;
    for (let i = 0; i < 50 && !ready; ++i) {{
        ready = await elfldrAccepting();
        if (!ready) await new Promise(function (resolve) {{ setTimeout(resolve, 200); }});
    }}
    if (!ready) {{
        flushMark("AUTOLOAD-FAILED", "why=elfldr-not-accepting-on-9021");
        stage("autoload failed: the ELF loader never accepted on port 9021", "bad");
        try {{ window.parent.postMessage({{ type: "wkal", kind: "autoload", ok: false,
            why: "the ELF loader is not accepting connections on port 9021" }}, "*"); }} catch (e) {{ }}
        return;
    }}
    // Let elfldr settle before sending payload.elf (avoids panic on Payload Manager).
    await new Promise(function (resolve) {{ setTimeout(resolve, {SETTLE_MS}); }});
    await sendPayloadToElfldr(cfg.autoload, "../../payloads/").then(function (r) {{
        window.__wkalAutoloadSent = true;
        flushMark("AUTOLOAD-OK", "name=" + cfg.autoload + "-bytes=" + r.bytes);
        stage("autoloaded " + cfg.autoload + " (" + r.bytes + " bytes)", "ok");
        try {{ window.parent.postMessage({{ type: "wkal", kind: "autoload", ok: true, bytes: r.bytes }}, "*"); }} catch (e) {{ }}
    }}).catch(function (err) {{
        flushMark("AUTOLOAD-FAILED", "why=" + clean(err && err.message ? err.message : err));
        stage("autoload failed: " + (err && err.message ? err.message : err), "bad");
        try {{ window.parent.postMessage({{ type: "wkal", kind: "autoload", ok: false, why: String(err && err.message || err) }}, "*"); }} catch (e) {{ }}
    }});
    }} finally {{
        window.__wkalAutoloadBusy = false;
    }}
}}"""

P2JB_OLD = f"""async function startAutoload() {{
    if (!AUTOLOAD) return;
    preparePayloadSender();
    flushMark("AUTOLOAD-WAIT", "poll-connect=127.0.0.1:9021-tries=50-interval=200");
    stage("autoloading " + AUTOLOAD + " -- waiting for the ELF loader on port 9021", "ok");
    let ready = false;
    for (let i = 0; i < 50 && !ready; ++i) {{
        ready = await elfldrAccepting();
        if (!ready) await new Promise(function (resolve) {{ setTimeout(resolve, 200); }});
    }}
    if (!ready) {{
        flushMark("AUTOLOAD-FAILED", "why=elfldr-not-accepting-on-9021");
        stage("autoload failed: the ELF loader never accepted on port 9021", "bad");
        try {{ window.parent.postMessage({{ type: "wkal", kind: "autoload", ok: false,
            why: "the ELF loader is not accepting connections on port 9021" }}, "*"); }} catch (e) {{ }}
        return;
    }}
    // Let elfldr settle before sending payload.elf (avoids panic on Payload Manager).
    await new Promise(function (resolve) {{ setTimeout(resolve, {SETTLE_MS}); }});
    sendPayloadToElfldr(AUTOLOAD, "../../payloads/")
        .then(function (r) {{
            flushMark("AUTOLOAD-OK",
                "name=" + clean(AUTOLOAD) + "-bytes=" + r.bytes);
            stage("autoloaded " + AUTOLOAD + " (" + r.bytes + " bytes)", "ok");
            try {{
                window.parent.postMessage({{ type: "wkal",
                    kind: "autoload", ok: true, bytes: r.bytes }}, "*");
            }} catch (e) {{ }}
        }})
        .catch(function (err) {{
            flushMark("AUTOLOAD-FAILED", "why="
                + clean(err && err.message ? err.message : err));
            stage("autoload failed: "
                + (err && err.message ? err.message : err), "bad");
            try {{
                window.parent.postMessage({{ type: "wkal",
                    kind: "autoload", ok: false,
                    why: String(err && err.message || err) }}, "*");
            }} catch (e) {{ }}
        }});
}}"""

P2JB_NEW = f"""async function startAutoload() {{
    if (!AUTOLOAD) {{
        try {{ window.parent.postMessage({{ type: "wkal", kind: "autoload", ok: false,
            why: "no autoload= in URL" }}, "*"); }} catch (e) {{ }}
        return;
    }}
    if (AUTOLOAD === "wkal-skip") {{
        stage("elf-launcher already on :1000 - not sending", "ok");
        try {{ window.parent.postMessage({{ type: "wkal", kind: "autoload", ok: true, bytes: 0, skipped: true }}, "*"); }} catch (e) {{ }}
        return;
    }}
    // WKAL-AUTOLOAD-SINGLE-FLIGHT: one in-flight / one successful send to elfldr :9021.
    if (window.__wkalAutoloadBusy) return;
    if (window.__wkalAutoloadSent) return;
    window.__wkalAutoloadBusy = true;
    try {{
    preparePayloadSender();
    flushMark("AUTOLOAD-WAIT", "poll-connect=127.0.0.1:9021-tries=50-interval=200");
    stage("autoloading " + AUTOLOAD + " -- waiting for the ELF loader on port 9021", "ok");
    let ready = false;
    for (let i = 0; i < 50 && !ready; ++i) {{
        ready = await elfldrAccepting();
        if (!ready) await new Promise(function (resolve) {{ setTimeout(resolve, 200); }});
    }}
    if (!ready) {{
        flushMark("AUTOLOAD-FAILED", "why=elfldr-not-accepting-on-9021");
        stage("autoload failed: the ELF loader never accepted on port 9021", "bad");
        try {{ window.parent.postMessage({{ type: "wkal", kind: "autoload", ok: false,
            why: "the ELF loader is not accepting connections on port 9021" }}, "*"); }} catch (e) {{ }}
        return;
    }}
    // Let elfldr settle before sending payload.elf (avoids panic on Payload Manager).
    await new Promise(function (resolve) {{ setTimeout(resolve, {SETTLE_MS}); }});
    await sendPayloadToElfldr(AUTOLOAD, "../../payloads/")
        .then(function (r) {{
            window.__wkalAutoloadSent = true;
            flushMark("AUTOLOAD-OK",
                "name=" + clean(AUTOLOAD) + "-bytes=" + r.bytes);
            stage("autoloaded " + AUTOLOAD + " (" + r.bytes + " bytes)", "ok");
            try {{
                window.parent.postMessage({{ type: "wkal",
                    kind: "autoload", ok: true, bytes: r.bytes }}, "*");
            }} catch (e) {{ }}
        }})
        .catch(function (err) {{
            flushMark("AUTOLOAD-FAILED", "why="
                + clean(err && err.message ? err.message : err));
            stage("autoload failed: "
                + (err && err.message ? err.message : err), "bad");
            try {{
                window.parent.postMessage({{ type: "wkal",
                    kind: "autoload", ok: false,
                    why: String(err && err.message || err) }}, "*");
            }} catch (e) {{ }}
        }});
    }} finally {{
        window.__wkalAutoloadBusy = false;
    }}
}}"""


def patch_file(path: Path, old: str, new: str) -> bool:
    t = path.read_text(encoding="utf-8")
    if MARKER in t:
        # Refresh settle ms / Sent guard if an older single-flight block is present.
        if f"setTimeout(resolve, {SETTLE_MS})" in t and "__wkalAutoloadSent" in t:
            print(f"already single-flight: {path}")
            return False
        # Replace the whole startAutoload by matching from async function through
        # the closing brace before the next top-level function — fall through to
        # exact old/new when possible; else rewrite from MARKER-bearing body.
        if old in t:
            path.write_text(t.replace(old, new, 1), encoding="utf-8")
            print(f"refreshed single-flight: {path}")
            return True
        # Drop old single-flight body: find async function startAutoload and
        # replace with NEW by locating the function start.
        start = t.find("async function startAutoload()")
        if start < 0:
            print(f"WARN: startAutoload missing in {path}", file=sys.stderr)
            return False
        # Find matching end: next "\nfunction " or "\nasync function " after body
        # Use NEW as full replacement from start of function — scan braces.
        i = t.find("{", start)
        depth = 0
        end = -1
        for j in range(i, len(t)):
            c = t[j]
            if c == "{":
                depth += 1
            elif c == "}":
                depth -= 1
                if depth == 0:
                    end = j + 1
                    break
        if end < 0:
            print(f"WARN: could not find startAutoload end in {path}", file=sys.stderr)
            return False
        path.write_text(t[:start] + new + t[end:], encoding="utf-8")
        print(f"replaced single-flight: {path}")
        return True
    if old not in t:
        print(f"WARN: startAutoload block mismatch in {path}", file=sys.stderr)
        return False
    path.write_text(t.replace(old, new, 1), encoding="utf-8")
    print(f"added single-flight: {path}")
    return True


def main() -> int:
    root = Path(sys.argv[1] if len(sys.argv) > 1 else ".")
    for path in ([root / "poops.html"] if (root / "poops.html").is_file() else list(root.rglob("poops.html"))):
        if "slopkit" in str(path):
            patch_file(path, POOPS_OLD, POOPS_NEW)
    for path in ([root / "p2jb.html"] if (root / "p2jb.html").is_file() else list(root.rglob("p2jb.html"))):
        if "slopkit" in str(path):
            patch_file(path, P2JB_OLD, P2JB_NEW)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
