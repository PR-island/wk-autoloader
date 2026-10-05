(function () {
  'use strict';

  /* Release tree marker: v1.0.2. */

  /* i18n: prefer WKAL_I18N.t from i18n.js; fall back to English key text. */
  function t(key, vars) {
    if (typeof window !== 'undefined' && window.WKAL_I18N && typeof window.WKAL_I18N.t === 'function') {
      return window.WKAL_I18N.t(key, vars);
    }
    return key;
  }
  function elapsedLabel(ms) {
    return t('elapsed', { t: formatElapsed(ms) });
  }

  var splashEl = document.getElementById('splash');
  var loaderEl = document.getElementById('loader');
  var logContainer = document.getElementById('logContainer');
  var progressBar = document.getElementById('progressBar');
  var progressLabel = document.getElementById('progressLabel');
  var progressPctEl = document.getElementById('progressPct');
  var statusMsgEl = document.getElementById('statusMsg');
  var metaMsgEl = document.getElementById('metaMsg');
  var elapsedMsgEl = document.getElementById('elapsedMsg');
  var failMsgEl = document.getElementById('failMsg');
  var successMsgEl = document.getElementById('successMsg');
  var elapsedTimer = 0;
  var elapsedStart = 0;
  var exploitEl = document.getElementById('exploit');

  /* After a WebProcess crash the PS5 browser restores this page together with
     the iframe at its last URL - the armed exploit URL, which would auto-run
     the chain again. Blank it as early as possible (the iframe element is
     already in the DOM at script parse) so the chain only runs after the
     splash screen. */
  try {
    exploitEl.src = 'about:blank';
  } catch (e) { }

  var MAX_LOG_LINES = 80;
  var finished = false;
  /* True from Start Jailbreak until wkal autoload postMessage.
     Stage text with FAIL must not lock finished while this is set,
     or a later ok:true never opens :1000/:8084. */
  var autoloadPending = false;
  var chainStarted = false;
  var mirroredLines = 0;
  var lastStageText = '';
  var lastStageCls = '';
  var lastSummaryText = '';
  var earlyLinesLogged = 0;
  var lastFrameUrl = '';
  var repairCount = 0;
  var mirrorTimer = 0;

  /* The slopkit chains (poops 7.00-12.00, p2jb 12.02-12.70) keep a one-shot
     latch and their "stopped at …" marker in sessionStorage under shared
     "slopkit-poops:*" keys. On the PS5 browser the shortcut session can
     outlive a console reboot, so a previous interrupted run would otherwise
     block every retry with "the last run stopped at X but the latch is clear".
     Clear them right before arming so the full chain always restarts from
     the top (never a mid-chain resume). The iframe is same-origin, so this
     is exactly the storage both exploit pages read. */
  function clearSlopkitState() {
    try {
      sessionStorage.removeItem('slopkit-poops:next');
      sessionStorage.removeItem('slopkit-poops:latch');
    } catch (e) { }
  }

  /* Build-time exploit override: "auto" (firmware table), "umtx2",
     "relapse", or legacy "p2jb" (force-only; not used by the default
     picker). Replaced by tools/gen_file_registry.py / build_host.py /
     dev_server.py from the FORCE_EXPLOIT env (default "auto"); left as the
     raw placeholder when served straight from source -> auto. A ?force=
     query on this page overrides it at runtime (handy for make dev). */
  var EXPLOIT_MODE = '[[EXPLOIT_MODE]]';
  if (EXPLOIT_MODE.indexOf('[[') === 0) EXPLOIT_MODE = 'auto';

  /* Firmwares supported by each exploit, keyed on the exact UA firmware
     string (/PlayStation 5/x.xx/). Default auto path: umtx2 = 1.xx-5.xx,
     relapse = 7.00-13.60 (and other Relapse-supported 7-13.xx). p2jb
     remains only for ?force= / FORCE_EXPLOIT overrides. */
  var UMTX2_FIRMWARES = ["1.00", "1.01", "1.02", "1.05", "1.10", "1.11", "1.12", "1.13", "1.14", "2.00", "2.20", "2.25", "2.26", "2.30", "2.50", "2.70", "3.00", "3.10", "3.20", "3.21", "4.00", "4.02", "4.03", "4.50", "4.51", "5.00", "5.02", "5.10", "5.50"];
  /* Legacy slopkit chain - kept for force=p2jb only. */
  var P2JB_FIRMWARES = ["12.02", "12.20", "12.40", "12.60", "12.70"];
  /* Relapse kernel chain (vendored under frontend/autoloader/relapse/).
     Keep in sync with relapse/src/firmware.js. Default picker also routes
     any other 7.00-13.60 UA here; Relapse's own firmware guard rejects
     unknowns. research_ul / "not supported" is not used for this range. */
  var RELAPSE_FIRMWARES = ["7.00", "7.01", "7.20", "7.40", "7.60", "7.61", "8.00", "8.20", "8.40", "8.60", "9.00", "9.20", "9.40", "9.60", "10.00", "10.01", "10.20", "10.40", "10.60", "11.00", "11.20", "11.60", "12.00", "12.02", "12.20", "12.40", "12.60", "12.70", "13.00", "13.20", "13.40", "13.42", "13.60"];

  /* Post-JB launcher preference (localStorage). Explicit values only:
       payload-manager -> frontend/autoloader/payloads/pldmgr.elf
       elf-launcher    -> Hybrid: probe :1000; if up open only; if down send
                          on-disk elf-launcher.elf (tip), wait, then open.
     Missing, default, or any other value emits wkal-skip so elfldr is
     sent nothing. pldmgr.elf is the standalone itsPLK Payload Manager.
     payload.elf is the unified autoloader and must not be sent for this
     choice. elfldr accepts one ELF; do not pre-send a second one when
     the installer loads. WK never pins/downgrades Elf Launcher via an
     old bundled SHA — payloads come from the current on-disk tip. */
  var LS_LAUNCHER_KEY = 'wkal_postjb_launcher';
  var LS_ELFLAUNCHER_SHA = 'wkal_elflauncher_sha';
  var LS_ELFLAUNCHER_VER = 'wkal_elflauncher_ver';
  var CHOICE_PAYLOAD_MANAGER = 'payload-manager';
  var CHOICE_ELF_LAUNCHER = 'elf-launcher';
  /* Generated from payloads/elf-launcher.elf.sha256 by payload-deps.
     Diagnostics only after a successful hybrid-down send. */
  var BUNDLED_ELFLAUNCHER_SHA = 'dbb2ce95083e0c6f0387d5391df3103f6970a8613839de8f71a7a5a005856bdd';
  var BUNDLED_ELFLAUNCHER_VER = 'tip';
  var launcherChoice = null;
  var elfHttpAlreadyUp = false;

  function isExplicitLauncherChoice(choice) {
    return choice === CHOICE_PAYLOAD_MANAGER || choice === CHOICE_ELF_LAUNCHER;
  }

  /* Legacy skip keys must not be deleted and then replaced with a real ELF.
     Nothing reads them into a send; autoload name is wkal-skip unless the
     splash choice is explicit. */
  function clearLegacyElfLauncherSkipFlags() { }

  function loadLauncherChoice() {
    try {
      var saved = localStorage.getItem(LS_LAUNCHER_KEY);
      if (isExplicitLauncherChoice(saved)) return saved;
    } catch (e) { }
    return null;
  }

  function saveLauncherChoice(choice) {
    if (!isExplicitLauncherChoice(choice)) return;
    launcherChoice = choice;
    try { localStorage.setItem(LS_LAUNCHER_KEY, choice); } catch (e) { }
  }

  function autoloadElfName() {
    /* Hybrid Elf Launcher: open-only when :1000 already up; else send tip ELF. */
    if (launcherChoice === CHOICE_ELF_LAUNCHER) {
      return elfHttpAlreadyUp ? 'wkal-skip' : 'elf-launcher.elf';
    }
    if (launcherChoice === CHOICE_PAYLOAD_MANAGER) return 'pldmgr.elf';
    return 'wkal-skip';
  }

  /* Keep in sync with EXPLOIT_IFRAME_URL in tools/gen_file_registry.py - the
     AppCache manifest lists these exact URLs (both autoload= variants) so the
     console can serve them offline (AppCache matches URLs including the query). */
  function buildExploitUrls(autoloadName) {
    return {
      umtx2: 'umtx2/index.html?autoload=' + autoloadName + '&v=1',
      p2jb: 'slopkit/slopkit/p2jb.html?go=1&auto=1&production=1&log=debug&payload=1&autoload=' + autoloadName + '&v=final',
      relapse: 'relapse/index.html?autoload=' + autoloadName + '&v=1'
    };
  }

  var UMTX2_URL = '';
  var P2JB_URL = '';
  var RELAPSE_URL = '';
  var EXPLOIT_URL = '';
  var exploitMode = null;

  function uiLog(message, type) {
    type = type || 'info';
    if (!logContainer) return;
    /* #logWrapper stays hidden during the run. Skip the nodes and the
       scroll, which would force layout on the exploit thread. */
    var wrap = logContainer.parentNode;
    if (!wrap || wrap.hidden) return;
    var entry = document.createElement('div');
    entry.className = 'line ' + type;
    entry.textContent = message;
    logContainer.appendChild(entry);
    while (logContainer.childElementCount > MAX_LOG_LINES) {
      logContainer.removeChild(logContainer.firstChild);
    }
    wrap.scrollTop = wrap.scrollHeight;
    return entry;
  }

  var progressPct = 0;
  var progressDone = false;
  var progressTimer = 0;

  function updateProgress(percent, message) {
    percent = Math.max(0, Math.min(100, percent | 0));
    if (!progressDone && percent < progressPct && percent !== 0) {
      /* never go backwards while running */
    } else {
      progressPct = percent;
    }
    if (progressBar) {
      var scale = 'scaleX(' + (progressPct / 100) + ')';
      if (progressBar.__scale !== scale) {
        progressBar.__scale = scale;
        progressBar.style.webkitTransform = scale;
        progressBar.style.transform = scale;
      }
    }
    if (progressPctEl) {
      var pctText = progressPct + '%';
      if (progressPctEl.textContent !== pctText) progressPctEl.textContent = pctText;
    }
    if (message) {
      if (progressLabel) progressLabel.textContent = message;
      uiLog(message, 'info');
    }
    if (progressPct >= 100) {
      progressDone = true;
      try { document.body.className = 'done'; } catch (e) {}
      if (statusMsgEl) statusMsgEl.style.display = 'none';
    }
  }

  function bumpProgressFloor(floor) {
    if (progressDone) return;
    if (floor > progressPct) updateProgress(floor);
  }

  /* Soft fill while the exploit runs so the bar never looks stuck. */
  function startProgressDriver() {
    if (progressTimer) return;
    progressTimer = setInterval(function () {
      if (progressDone) {
        clearInterval(progressTimer);
        progressTimer = 0;
        return;
      }
      if (progressPct >= 94) return;
      /* ~10s soft fill while jailbreak stabilizes */
      var next = progressPct + Math.max(0.55, (94 - progressPct) * 0.055);
      if (next > 94) next = 94;
      var floored = Math.floor(next * 10) / 10;
      if (floored !== progressPct) updateProgress(Math.floor(floored));
    }, 250);
  }

  function stopElapsed() {
    if (elapsedTimer) {
      clearInterval(elapsedTimer);
      elapsedTimer = 0;
    }
  }

  function formatElapsed(ms) {
    var s = Math.floor(ms / 1000);
    var m = Math.floor(s / 60);
    s = s % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function startElapsed() {
    if (elapsedTimer) return;
    elapsedStart = Date.now();
    if (elapsedMsgEl) elapsedMsgEl.textContent = t('elapsed', { t: '0:00' });
    elapsedTimer = setInterval(function () {
      if (!elapsedMsgEl) return;
      var elapsedText = t('elapsed', { t: formatElapsed(Date.now() - elapsedStart) });
      if (elapsedMsgEl.textContent !== elapsedText) elapsedMsgEl.textContent = elapsedText;
    }, 1000);
  }

  /* User-facing chain labels. Default path is relapse (7.00-13.60);
     p2jb remains an internal force-only id and is not advertised. */
  function formatChainLabel(chain) {
    if (chain === 'relapse') return 'relapse';
    if (chain === 'umtx2') return 'umtx2';
    if (chain === 'p2jb') return chain; /* force= only */
    return chain || '-';
  }

  function setMeta(fwStr, chain) {
    if (!metaMsgEl) return;
    if (chain === 'research_ul' || chain === 'userland only') {
      metaMsgEl.textContent = t('metaFwUnsupported', { fw: fwStr || '-' });
      return;
    }
    metaMsgEl.textContent = t('metaFwChain', { fw: fwStr || '-', chain: formatChainLabel(chain) });
  }

  function finishProgressSuccess(message) {
    progressDone = true;
    stopElapsed();
    if (progressTimer) {
      clearInterval(progressTimer);
      progressTimer = 0;
    }
    var from = progressPct;
    var start = Date.now();
    if (message && progressLabel) progressLabel.textContent = message;
    var anim = setInterval(function () {
      var p = Math.min(1, (Date.now() - start) / 900);
      updateProgress(Math.floor(from + (100 - from) * p));
      if (p >= 1) {
        try { clearInterval(anim); } catch (eA) {}
        updateProgress(100, message || t('jailbreakSuccess'));
      }
    }, 30);
    try { document.body.className = 'done'; } catch (e) {}
    if (successMsgEl) {
      successMsgEl.innerHTML = '<span class="check" aria-hidden="true"></span>' + t('jailbreakSuccess');
    }
  }

  function finishProgressFail(message) {
    progressDone = true;
    stopElapsed();
    if (progressTimer) {
      clearInterval(progressTimer);
      progressTimer = 0;
    }
    try { document.body.className = 'fail'; } catch (e) {}
    if (failMsgEl) {
      failMsgEl.textContent = message || t('jailbreakFail');
    }
    if (statusMsgEl) statusMsgEl.style.display = 'none';
    uiLog(message || t('jailbreakFail'), 'error');
  }

  window.uiLog = uiLog;
  window.updateProgress = updateProgress;

  function detectFirmware() {
    var m = /PlayStation 5\/(\d+\.\d+)/.exec(navigator.userAgent);
    if (!m) return null;
    return { str: m[1], num: parseFloat(m[1]) };
  }

  /* Choose which exploit to arm. Forced modes (build-time EXPLOIT_MODE or a
     ?force= query on this page) bypass the firmware table so a specific chain
     can be exercised on any firmware - the exploit page's own firmware guard
     still applies. Default auto: umtx2 (1-5.xx) | relapse (7.00-13.60).
     p2jb is force-only. Returns 'umtx2' | 'p2jb' | 'relapse' | null. */
  function pickExploit() {
    var fw = detectFirmware();
    var forced = null;
    try {
      var q = new URLSearchParams(window.location.search).get('force');
      if (q === 'umtx2' || q === 'p2jb' || q === 'relapse') forced = q;
    } catch (e) { }
    if (forced) {
      uiLog('[force] using ' + forced + ' on firmware ' + (fw ? fw.str : 'unknown'), 'warning');
      return forced;
    }
    if (EXPLOIT_MODE === 'umtx2' || EXPLOIT_MODE === 'p2jb'
      || EXPLOIT_MODE === 'relapse') {
      uiLog('[force] using ' + EXPLOIT_MODE + ' on firmware ' + (fw ? fw.str : 'unknown'), 'warning');
      return EXPLOIT_MODE;
    }
    if (!fw) {
      uiLog('[ERROR] Not a PlayStation 5 browser.', 'error');
      return null;
    }
    if (UMTX2_FIRMWARES.indexOf(fw.str) !== -1
      || (fw.num >= 1.0 && fw.num < 6.0)) return 'umtx2';
    /* Default path: Relapse for ALL 7.00-13.60. */
    if (RELAPSE_FIRMWARES.indexOf(fw.str) !== -1
      || (fw.num >= 7.0 && fw.num <= 13.60)) return 'relapse';
    uiLog('Unsupported firmware ' + fw.str, 'error');
    return null;
  }

  function revealExploit() {
    splashEl.classList.add('hide');
    setTimeout(function () {
      splashEl.hidden = true;
      loaderEl.hidden = false;
    }, 480);
  }

  /* Post-JB launchers (elf-launcher :1000, Payload Manager :8084) listen on
     the console. Always open 127.0.0.1 — a LAN host from a PC-host session
     would probe the wrong machine and WKAL would never navigate away. */
  function consoleHttpBase(port) {
    return 'http://127.0.0.1:' + port + '/';
  }

  function withCacheBust(url) {
    var sep = url.indexOf('?') >= 0 ? '&' : '?';
    return url + sep + '_wkal=' + Date.now();
  }

  /* True when the probe got HTTP 200 with a real launcher document - not an
     empty/partial early answer that would paint a garbled page on PS5 WebKit.
     elf-launcher full index is ~63KB; require solid title/banner markers and
     body length >= 2KB before navigating away from WKAL. */
  function httpResponseReady(xhr, label) {
    if (!xhr || xhr.status !== 200) return false;
    var body = xhr.responseText || '';
    if (label === 'elf-launcher') {
      /* Full index ~63KB; opening before bind finishes paints broken assets. */
      if (body.length < 8000) return false;
      return /<title>\s*ELF Launcher\s*<\/title>/i.test(body)
        && (/id=["']banner["']|id=["']ftitle["']/i.test(body) || body.length > 20000);
    }
    if (body.length < 256) return false;
    /* Payload Manager / PLDMGR */
    return /<html|Payload|PLDMGR|payload/i.test(body);
  }

  function navigateLocalHttp(url, label, portHint) {
    /* Leave WKAL via top.location.replace. For elf-launcher use the SAME
       clean URL as the home icon (http://127.0.0.1:1000/) — cache-bust
       query strings made the page open "broken" (assets/files fail) while
       home-icon open worked. PM can still cache-bust. */
    var navUrl = (label === 'elf-launcher') ? url : withCacheBust(url);
    uiLog('Opening ' + label + ' at ' + navUrl + ' ...', 'info');
    var target = window;
    try { if (window.top && window.top !== window) target = window.top; } catch (eTop) { target = window; }
    try {
      target.location.replace(navUrl);
      return;
    } catch (e1) { }
    try {
      target.location.href = navUrl;
      return;
    } catch (e2) { }
    try {
      window.open(navUrl, '_top');
    } catch (e3) {
      uiLog('Could not open browser to :' + portHint
        + ' - open ' + label + ' manually at :' + portHint + '.', 'warning');
    }
  }

  /* Poll until the launcher HTTP returns 200 + ready document, then settle
     and navigate. Hybrid elf-launcher:
       - :1000 was up (probe): on give-up lastChanceNavigate (CORS may hide
         the ready doc while the server is live).
       - :1000 was down (we sent tip ELF): never navigate to a dead :1000 —
         one auto-resend, then Retry UI. JB success is marked first. */
  function revealLogPanel() {
    try {
      var wrap = document.getElementById('logWrapper');
      if (wrap) wrap.hidden = false;
    } catch (eR) { }
  }

  function requestResendAutoload() {
    var name = autoloadElfName();
    uiLog('Re-send requested: ' + name + ' -> elfldr :9021', 'info');
    try {
      var w = exploitEl && exploitEl.contentWindow;
      if (w) {
        w.postMessage({ type: 'wkal', kind: 'resend-autoload', name: name }, '*');
        return true;
      }
    } catch (e) { }
    uiLog('Could not reach exploit iframe for re-send', 'warning');
    return false;
  }

  function openWhenHttpReady(url, label, portHint, maxWaitMs, firstDelayMs, settleMs, allowAutoResend) {
    var started = Date.now();
    var minWait = typeof firstDelayMs === 'number' ? firstDelayMs : 2000;
    var settle = typeof settleMs === 'number' ? settleMs : 0;
    var opened = false;
    var done = false;
    var autoResendUsed = allowAutoResend === false;
    var waitSec = Math.max(1, Math.round(maxWaitMs / 1000));
    uiLog('Waiting for ' + label + ' HTTP :' + portHint
      + ' (max ' + waitSec + 's) ...', 'info');

    function offerRetry(reason) {
      if (done && opened) return;
      done = true;
      revealLogPanel();
      uiLog(label + ' HTTP :' + portHint + ' not ready after ' + waitSec
        + 's (' + reason + '). Jailbreak still succeeded - Retry re-sends'
        + ' the ELF then reopens :' + portHint + '.', 'warning');
      if (statusMsgEl) {
        try {
          statusMsgEl.textContent = t('pageNotOpen', { label: label });
        } catch (eS) { }
      }
      if (successMsgEl) {
        try {
          successMsgEl.hidden = false;
          successMsgEl.textContent = t('jbOkNoAnswer', { label: label, port: portHint });
        } catch (eOk) { }
      }
      try {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = t('retrySendOpen', { label: label, port: portHint });
        btn.style.cssText = 'display:block;margin:8px 0;padding:8px 12px;'
          + 'font-size:14px;cursor:pointer;';
        btn.onclick = function () {
          try { btn.disabled = true; btn.textContent = t('resending'); } catch (eB) { }
          requestResendAutoload();
          setTimeout(function () {
            openWhenHttpReady(url, label, portHint, maxWaitMs, 3000, settle, false);
          }, 6000);
        };
        if (logContainer) logContainer.appendChild(btn);
      } catch (eBtn) { }
    }

    function lastChanceNavigate(reason) {
      if (opened) return;
      /* Only when :1000 was already up at probe (CORS/mixed can hide ready). */
      uiLog(label + ' opening :' + portHint + ' (' + reason + ') ...', 'warning');
      opened = true;
      done = true;
      navigateLocalHttp(url, label, portHint);
    }

    function onGiveUp(reason) {
      if (opened || done) return;
      if (label === 'elf-launcher') {
        if (elfHttpAlreadyUp) {
          lastChanceNavigate(reason);
          return;
        }
        /* Hybrid-down: server was off; we sent tip ELF. Do not open a dead page. */
        if (!autoResendUsed) {
          autoResendUsed = true;
          uiLog('Auto-retry: re-sending elf-launcher.elf to :9021 ...', 'warning');
          requestResendAutoload();
          started = Date.now();
          setTimeout(attempt, 4000);
          return;
        }
        offerRetry(reason);
        return;
      }
      offerRetry(reason);
    }

    function doNavigate() {
      if (opened || done) return;
      opened = true;
      done = true;
      /* Navigate only after HTTP ready marker. Do not blank the exploit
         iframe first — top.location.replace tears the page down safely. */
      navigateLocalHttp(url, label, portHint);
    }

    function scheduleNavigate() {
      if (opened || done) return;
      if (settle > 0) {
        uiLog(label + ' HTTP ready - settling ' + settle + 'ms before open ...', 'info');
        setTimeout(function () { doNavigate(); }, settle);
      } else {
        doNavigate();
      }
    }

    function attempt() {
      if (opened || done) return;
      var elapsed = Date.now() - started;
      var giveUp = elapsed >= maxWaitMs;
      try {
        var xhr = new XMLHttpRequest();
        xhr.timeout = label === 'elf-launcher' ? 1000 : 5000;
        xhr.open('GET', withCacheBust(url), true);
        try { xhr.setRequestHeader('Cache-Control', 'no-cache'); } catch (eHdr) { }
        xhr.onload = function () {
          if (opened || done) return;
          if (httpResponseReady(xhr, label)) {
            scheduleNavigate();
          } else if (giveUp) {
            onGiveUp('no ready document');
          } else {
            setTimeout(attempt, label === 'elf-launcher' ? 125 : 600);
          }
        };
        xhr.onerror = function () {
          if (opened || done) return;
          if (giveUp) {
            onGiveUp('connection failed');
          } else {
            setTimeout(attempt, label === 'elf-launcher' ? 125 : 600);
          }
        };
        xhr.ontimeout = xhr.onerror;
        xhr.send();
      } catch (e) {
        if (opened || done) return;
        if (giveUp) {
          onGiveUp('probe error');
        } else setTimeout(attempt, label === 'elf-launcher' ? 125 : 600);
      }
    }
    setTimeout(attempt, minWait);
  }

  /* One HTTP-open attempt per JB run (avoid stacking probes / resends). */
  var launcherHttpOpenStarted = false;


  function elfBrowserWantsOpen() {
    var v = '';
    var parts, i, c;
    try {
      parts = String(document.cookie || '').split(';');
      for (i = 0; i < parts.length; i++) {
        c = parts[i].replace(/^\s+/, '');
        if (c.indexOf('ps5elfs-browser=') === 0) v = decodeURIComponent(c.substring(17));
      }
    } catch (e) { }
    return v === 'open';
  }

  /* no-cors fetch resolves only when :1000 accepts. Missing cookie means closed. */
  function probeElfLauncherHttp(cb) {
    var done = false;
    function fin(up) {
      if (done) return;
      done = true;
      try { cb(!!up); } catch (e) { }
    }
    try {
      fetch('http://127.0.0.1:1000/?t=' + Date.now(), { method: 'GET', mode: 'no-cors', cache: 'no-store' }).then(function () {
        fin(true);
      }).catch(function () { fin(false); });
    } catch (e) {
      fin(false);
      return;
    }
    setTimeout(function () { fin(false); }, 1200);
  }

  function openElfLauncherPage() {
    if (launcherHttpOpenStarted) return;
    launcherHttpOpenStarted = true;
    /* Home-icon URL (no cache-bust) — query strings break Elf Launcher assets. */
    if (elfHttpAlreadyUp) {
      uiLog('Elf Launcher :1000 already up - opening (no ELF send) ...', 'success');
      openWhenHttpReady(consoleHttpBase(1000), 'elf-launcher', '1000',
        12000, 400, 400, false);
    } else {
      uiLog('elf-launcher.elf sent - opening :1000 when ready ...', 'success');
      openWhenHttpReady(consoleHttpBase(1000), 'elf-launcher', '1000',
        25000, 2500, 800, true);
    }
  }

  function openPayloadManagerPage() {
    if (launcherHttpOpenStarted) return;
    launcherHttpOpenStarted = true;
    openWhenHttpReady(consoleHttpBase(8084), 'Payload Manager', '8084',
      15000, 2000, 500, false);
  }

  function onAutoloadResult(data) {
    autoloadPending = false;
    /* ok:true must win over an earlier stage false-fail that set finished. */
    if (finished && !(data && data.ok)) return;
    finished = true;
    /* Success is terminal - stop mirroring so the page stays idle while the
       payload runs alongside it. On failure keep streaming the iframe's
       output into the log for diagnostics. */
    if (data.ok && mirrorTimer) {
      clearInterval(mirrorTimer);
      mirrorTimer = 0;
    }
    /* p2jb only: retire the stats panel (green 100% since the win) and
       restore the classic full-height log; no-op for the other chains. */
    collapseP2jbStats();
    if (data.ok) {
      if (failMsgEl) {
        try { failMsgEl.hidden = true; failMsgEl.textContent = ''; } catch (e0) { }
      }
      if (data.skipped || autoloadElfName() === 'wkal-skip') {
        uiLog('No post-JB ELF sent (wkal-skip).', 'info');
      } else if (!(Number(data.bytes) > 0)) {
        uiLog('Autoload ok but send missing/skipped (bytes='
          + String(data.bytes) + ') - will wait on HTTP and may re-send.', 'warning');
      } else {
        uiLog('Sent ' + autoloadElfName() + ' to elfldr :9021 ('
          + data.bytes + ' bytes).', 'success');
      }
      /* Mark JB done BEFORE waiting on HTTP open - open timeout must not
         look like a stuck jailbreak. */
      finishProgressSuccess(t('jailbreakSuccess'));

      /* Keep exploit iframe alive until HTTP open / resend finishes.
         Never blank it before top.location.replace — clearing mid-payload
         crashes WebKit. Navigation tears the page down after :1000/:8084 ready. */
    } else {
      uiLog('[ERROR] Autoload failed: ' + (data.why || 'unknown error'), 'error');
      finishProgressFail(t('jailbreakFail'));
    }
    setTimeout(function () {
      if (!data.ok) return;
      var sent = !data.skipped && Number(data.bytes) > 0;
      if (launcherChoice === CHOICE_ELF_LAUNCHER) {
        if (elfHttpAlreadyUp) {
          openElfLauncherPage();
          return;
        }
        if (!sent) {
          uiLog('elf-launcher send missing - not opening :1000 yet.', 'warning');
          revealLogPanel();
          return;
        }
        try {
          if (BUNDLED_ELFLAUNCHER_SHA && BUNDLED_ELFLAUNCHER_SHA.indexOf('0000') !== 0) {
            localStorage.setItem(LS_ELFLAUNCHER_SHA, BUNDLED_ELFLAUNCHER_SHA);
          }
          if (BUNDLED_ELFLAUNCHER_VER) {
            localStorage.setItem(LS_ELFLAUNCHER_VER, BUNDLED_ELFLAUNCHER_VER);
          }
        } catch (eSha) { }
        openElfLauncherPage();
      } else if (launcherChoice === CHOICE_PAYLOAD_MANAGER) {
        if (!sent) {
          uiLog('Payload Manager send missing - not opening :8084 yet.', 'warning');
          return;
        }
        uiLog('Payload Manager sent - waiting for HTTP :8084 ...', 'success');
        openPayloadManagerPage();
      }
    }, 0);
  }

  /* Mirror slopkit's live screen log (#scr) and stage text (#stage) from the
     same-origin exploit iframe into our own log view, so the UI shows what
     the chain is doing (and errors) instead of a generic progress message. */
  function mirrorSlopkit() {
    var doc;
    try {
      doc = exploitEl.contentDocument;
    } catch (e) {
      return;
    }
    if (!doc) return;

    /* Detect iframe navigation/reload: reset the mirror so a fresh document
       (or a crash restore) streams its log from the top. */
    var frameUrl = '';
    try {
      frameUrl = exploitEl.contentWindow.location.href;
    } catch (e) { }
    if (frameUrl !== lastFrameUrl) {
      lastFrameUrl = frameUrl;
      mirroredLines = 0;
      lastStageText = '';
      lastStageCls = '';
      lastSummaryText = '';
      earlyLinesLogged = 0;
    }
    /* The iframe is intentionally empty until the chain is armed - nothing
       to mirror yet. */
    if (!chainStarted) return;

    var scr = doc.getElementById('scr');
    if (!scr) {
      /* #scr is static HTML in poops.html - while it parses, #cat (earlier in
         the DOM) and <title> are already present, so a poll can briefly see
         "slopkit page without its screen". Same for the blank pre-navigation
         document. Never warn or re-arm during these windows: re-arming
         reloads the exploit a second time (and the log doubles). */
      var isArmedUrl = frameUrl.length > EXPLOIT_URL.length &&
        frameUrl.slice(-EXPLOIT_URL.length) === EXPLOIT_URL;
      if (frameUrl === 'about:blank' || doc.readyState !== 'complete'
        || isArmedUrl) {
        return;
      }
      /* Only reached when the iframe settled on a *different* page: slopkit's
         landing page (RUN button), a not-armed poops.html, or a 404. */
      var arm = doc.getElementById('arm');
      var cat = doc.getElementById('cat');
      var start = doc.getElementById('start');
      var title = doc.title || '';
      if (mirrorSlopkit.warned !== frameUrl) {
        mirrorSlopkit.warned = frameUrl;
        if (start) {
          uiLog('[iframe] slopkit landing page loaded (RUN button) - chain not started.', 'warning');
        } else if (arm && !arm.hidden) {
          uiLog('[iframe] slopkit page is NOT armed (?go=1 missing) - nothing will run.', 'warning');
        } else if (cat && title.indexOf('slopkit') !== -1) {
          uiLog('[iframe] slopkit page loaded without its screen (title="' + title + '").', 'warning');
        } else {
          uiLog('[iframe] page has no slopkit screen: title="' + title + '"', 'warning');
        }
      }
      /* Re-arm only for a wrong *slopkit* page (landing page or not-armed
         poops.html) - never for the armed URL itself. */
      var isSlopkitPage = !!start || (arm && !arm.hidden);
      if (chainStarted && isSlopkitPage && repairCount < 5) {
        repairCount++;
        uiLog('[iframe] re-arming (attempt ' + repairCount + '): ' + EXPLOIT_URL, 'info');
        try {
          exploitEl.src = EXPLOIT_URL;
        } catch (e) {
          uiLog('[iframe] re-arm failed: ' + (e && e.message ? e.message : e), 'error');
        }
      } else if (chainStarted && isSlopkitPage) {
        uiLog('[iframe] giving up after ' + repairCount + ' re-arm attempts.', 'error');
      }
      return;
    }

    var lines = scr.textContent.split('\n');
    /* If the screen shrank (slopkit caps its log at SCREEN_LINES and drops
       the oldest lines, or a fresh document replaced it), re-anchor the
       counter WITHOUT re-logging - the remaining lines were already streamed,
       and re-streaming them would double the log. A fresh document starts
       empty, so its new lines stream normally from here on. */
    if (lines.length < mirroredLines) {
      mirroredLines = lines.length;
    }
    for (; mirroredLines < lines.length; mirroredLines++) {
      var line = lines[mirroredLines].trim();
      if (!line) continue;
      /* Curated release log: surface the per-row progress ("> "), the
         milestone marks (STAGE / POOPS / LATCH / OFFSETS / ...), and
         anything that looks like a failure - never the full raw stream
         (that floods the UI and hides the actual result). */
      if (/^>/.test(line) || /^\[\+\]/.test(line)
        || /^(STAGE[0-5]|ALLPROC-CHECK|ALIASES-REPAIRED|POOPS-COMPLETE|POOPS-VERDICT|LATCH-HELD|LATCH-READ|OFFSETS-READY|WEBKIT-BASE|MODULE-BASES|SOCKETS|SPAWN|WAKEGATE)/.test(line)) {
        uiLog('[log] ' + line, 'info');
        startProgressDriver();
        if (/^STAGE0|^POOPS-COMPLETE/.test(line)) bumpProgressFloor(18);
        else if (/^STAGE1/.test(line)) bumpProgressFloor(32);
        else if (/^STAGE2/.test(line)) bumpProgressFloor(46);
        else if (/^STAGE3/.test(line)) bumpProgressFloor(60);
        else if (/^STAGE4/.test(line)) bumpProgressFloor(74);
        else if (/^STAGE5|^SPAWN|^POOPS-VERDICT/.test(line)) bumpProgressFloor(88);
      } else if (/FAIL|ERROR|REFUSED|REBOOT|failed|panic|exception/i.test(line)
        || /^\[-\]/.test(line)) {
        uiLog('[log] ' + line, 'error');
      }
    }

    var stage = doc.getElementById('stage');
    if (stage && stage.textContent !== lastStageText) {
      lastStageText = stage.textContent;
      lastStageCls = stage.className || '';
      if (progressLabel) progressLabel.textContent = lastStageText;
      startProgressDriver();
      var st = lastStageText || '';
      /* "SUCCESS -- N PASS / 0 FAIL" contains the word FAIL. That is a pass
         summary, not a terminal failure - do not set finished on it.
         A real fail line that also says "0 FAIL" (reboot required, FAILED)
         still counts. */
      var passSummary = /SUCCESS\s*--/i.test(st)
        || (/PASS\s*\/\s*0\s*FAIL/i.test(st)
            && !/reboot|FAILED\b|boot failed|autoload failed|refused|error|unlucky/i.test(st));
      if (!passSummary && (/fail|reboot|error|refus|unlucky/i.test(st) || lastStageCls.indexOf('bad') !== -1)) {
        uiLog('[stage] ' + lastStageText, 'error');
        /* While waiting for wkal autoload postMessage, do not lock finished -
           transient FAIL in stage text would block opening :1000/:8084. */
        if (!finished && !autoloadPending) {
          finished = true;
          finishProgressFail(t('jailbreakFail'));
        }
      } else if (/jailbreak completed|completed successfully|elf loader ready/i.test(st)) {
        uiLog('[stage] ' + lastStageText, 'success');
        bumpProgressFloor(94);
      } else if (/stage\s*5|ps10|payload|autoload|elfldr/i.test(st)) {
        bumpProgressFloor(82);
        uiLog('[stage] ' + lastStageText, 'info');
      } else if (/stage\s*4|ps9/i.test(st)) {
        bumpProgressFloor(70);
        uiLog('[stage] ' + lastStageText, 'info');
      } else if (/stage\s*3|ps8/i.test(st)) {
        bumpProgressFloor(58);
        uiLog('[stage] ' + lastStageText, 'info');
      } else if (/stage\s*[12]|ps[56]/i.test(st)) {
        bumpProgressFloor(40);
        uiLog('[stage] ' + lastStageText, 'info');
      } else if (/stage\s*0|prepare|preflight|validate|Jailbreak in progress/i.test(st)) {
        bumpProgressFloor(18);
        uiLog('[stage] ' + lastStageText, 'info');
      } else {
        uiLog('[stage] ' + lastStageText, 'info');
      }
    }

    /* Mirror the summary block (verdict/reboot details) when it changes. */
    var summary = doc.getElementById('summary');
    if (summary && summary.textContent && summary.textContent !== lastSummaryText) {
      var summaryLines = summary.textContent.split('\n');
      for (var i = 0; i < summaryLines.length; i++) {
        var sline = summaryLines[i].trim();
        if (sline && /FAIL|ERROR|REFUSED|REBOOT|failed|panic/i.test(sline)) {
          uiLog('[summary] ' + sline, 'error');
        }
      }
      lastSummaryText = summary.textContent;
    }

    /* Mirror the #early log (errors/notices written before the module chain
       runs - the earliest thing slopkit produces). slopkit only ever appends
       to #early, so log just the new tail - re-logging the whole buffer on
       every change doubled every early line. */
    var early = doc.getElementById('early');
    if (early && early.textContent) {
      var earlyLines = early.textContent.split('\n');
      if (earlyLines.length < earlyLinesLogged) {
        earlyLinesLogged = 0;
      }
      for (; earlyLinesLogged < earlyLines.length; earlyLinesLogged++) {
        var eline = earlyLines[earlyLinesLogged].trim();
        if (eline) {
          uiLog('[early] ' + eline, /ERROR|FAIL/i.test(eline) ? 'error' : 'info');
        }
      }
    }
  }

  /* Mirror umtx2's live #console log (#console > div, classed LOG-*) from the
     same-origin exploit iframe into our own log view, mapping its severity
     classes onto ours. umtx2 updates its last console line in place for
     progress logs (FLAG_TEMP, e.g. "Race attempt N-M"), so we update our
     matching last line in place too. */
  var umtx2MirroredLines = 0;
  var umtx2LastEntry = null;
  var umtx2LastText = '';
  function mirrorUmtx2() {
    var doc;
    try {
      doc = exploitEl.contentDocument;
    } catch (e) {
      return;
    }
    if (!doc || !chainStarted) return;
    var lines = doc.querySelectorAll('#console > div');
    if (lines.length < umtx2MirroredLines) {
      /* Iframe reloaded (#console recreated) - restart from a fresh document. */
      umtx2MirroredLines = lines.length;
      umtx2LastEntry = null;
      umtx2LastText = '';
    }
    for (; umtx2MirroredLines < lines.length; umtx2MirroredLines++) {
      var el = lines[umtx2MirroredLines];
      var text = (el.textContent || '').trim();
      if (!text) continue;
      var cls = el.className || '';
      var entry;
      if (/LOG-ERROR/.test(cls)) {
        entry = uiLog('[umtx2] ' + text, 'error');
      } else if (/LOG-WARN/.test(cls)) {
        entry = uiLog('[umtx2] ' + text, 'warning');
      } else if (/LOG-SUCCESS/.test(cls)) {
        entry = uiLog('[umtx2] ' + text, 'success');
      } else {
        entry = uiLog('[umtx2] ' + text, 'info');
      }
      umtx2LastEntry = entry;
      umtx2LastText = text;
    }
    /* Live-update the last mirrored line when umtx2 rewrites it in place. */
    if (lines.length > 0 && umtx2LastEntry
      && umtx2LastEntry === logContainer.lastChild) {
      var last = lines[lines.length - 1];
      var lastText = (last.textContent || '').trim();
      if (lastText && lastText !== umtx2LastText) {
        umtx2LastEntry.textContent = '[umtx2] ' + lastText;
        umtx2LastText = lastText;
      }
    }
  }

  /* Native rendering of p2jb's pinned #livestat readout. Upstream paints an
     ASCII status block once per second:
       "P2JB   total 00:12:03   leak 00:09:41\n<status text>\n"
       "[####....] 43.10%   0.31%/min   ETA 00:38:12 ...\n"
       "OVERALL [####....] 37.4%   step 3/7 (leak)   ~00:41:12 left ..."
     We parse it into the #p2jbStats panel (styled in style.css): phase +
     OVERALL bars, clocks, rate/ETA, worker bars, and detail counters. Every
     write is guarded - no-op DOM writes would only cost shared thread time. */
  var p2jbStats = null;

  function p2jbStatsDom() {
    if (!p2jbStats) {
      var root = document.getElementById('p2jbStats');
      if (!root) return null;
      p2jbStats = {
        root: root,
        stepChip: document.getElementById('p2jbStepChip'),
        clocks: document.getElementById('p2jbClocks'),
        status: document.getElementById('p2jbStatus'),
        detail: document.getElementById('p2jbDetail'),
        groupsBox: document.getElementById('p2jbGroups'),
        cells: null,
        phaseName: document.getElementById('p2jbPhaseName'),
        phasePct: document.getElementById('p2jbPhasePct'),
        phaseFill: document.getElementById('p2jbPhaseFill'),
        phaseMeta: document.getElementById('p2jbPhaseMeta'),
        overallPct: document.getElementById('p2jbOverallPct'),
        overallFill: document.getElementById('p2jbOverallFill'),
        overallMeta: document.getElementById('p2jbOverallMeta')
      };
    }
    return p2jbStats.root ? p2jbStats : null;
  }

  function statText(el, v) {
    if (el && el.textContent !== v) el.textContent = v;
  }

  function statFill(el, frac) {
    /* Quantize to 0.1% (upstream's reporting granularity): stable strings
       for the change-guard, no float noise like scaleX(0.4379999...). */
    var t = 'scaleX(' + Math.round(Math.max(0, Math.min(1, frac)) * 1000) / 1000 + ')';
    if (el.__transform !== t) {
      el.__transform = t;
      el.style.transform = t;
    }
  }

  /* Parse the #livestat text block. Layout (upstream render()):
     line 0        "P2JB   total HH:MM:SS   <phase> HH:MM:SS"
     lines 1..n    status text (multi-line; the leak feed adds byte counters
                   and a "per-core: 12.3% 45.6% ..." worker line)
     next          "[####....] 43.10% ..."   <- CURRENT phase progress
     last          "OVERALL [####....] 37.4% step i/N (phase) ~left"  */
  function parseLivestat(text) {
    var out = {};
    var lines = text.split('\n');
    var head = /^P2JB\s+total\s+(\d{2}:\d{2}:\d{2})\s+(\S+)\s+(\d{2}:\d{2}:\d{2})/
      .exec(lines[0] || '');
    if (head) {
      out.total = head[1];
      out.phaseKey = head[2];
      out.phaseTime = head[3];
    }
    for (var i = 1; i < lines.length; i++) {
      var line = lines[i].trim();
      if (!line) continue;
      if (/^OVERALL\s+\[[#.]*\]/.test(line)) {
        var mo = /OVERALL\s+\[[#.]*\]\s+(\d+(?:\.\d+)?)%\s+step\s+(\d+)\/(\d+)\s+\((\w+)\)\s+~(\d{2}:\d{2}:\d{2})\s+left(?:\s+done\s+~(\d{2}:\d{2}))?/.exec(line);
        if (mo) {
          out.overallPct = parseFloat(mo[1]);
          out.stepNum = parseInt(mo[2], 10);
          out.stepDen = parseInt(mo[3], 10);
          out.stepKey = mo[4];
          out.left = mo[5];
          out.doneClockOverall = mo[6] || '';
        }
      } else if (/^\[[#.]*\]\s+\d/.test(line)) {
        var mp = /\[[#.]*\]\s+(\d+(?:\.\d+)?)%(?:\s+(\d+(?:\.\d+)?)%\/min)?(?:\s+ETA\s+(\S+))?(?:\s+done\s+~(\S+))?(?:\s+\(no progress for (\d+)s\))?/.exec(line);
        if (mp) {
          out.phasePct = mp[1];
          out.ratePerMin = mp[2];
          out.eta = mp[3];
          out.doneClockPhase = mp[4];
          out.stallSecs = mp[5];
        }
      } else if (out.status === undefined) {
        out.status = line;
      } else {
        /* A "label: v v v ..." line of >= 2 percentages is a per-worker
           track (upstream's leak-feed "per-core:" line); anything else is
           detail text. */
        var mg = /^([A-Za-z][\w-]*)\s*:\s*(.+)$/.exec(line);
        if (mg) {
          var pcts = [];
          var gre = /(\d{1,3}(?:\.\d+)?)%/g;
          var gm = gre.exec(mg[2]);
          while (gm !== null) {
            pcts.push(parseFloat(gm[1]));
            gm = gre.exec(mg[2]);
          }
          if (pcts.length >= 2) {
            out.groups = pcts.slice(0, 24);
            continue;
          }
        }
        (out.details = out.details || []).push(line);
      }
    }
    return out;
  }

  function renderP2jbStats(text) {
    var d = p2jbStatsDom();
    if (!d) return;
    var s = parseLivestat(text);

    /* First real data: reveal the panel and shrink the log to the top half
       (body.p2jb-stats in style.css). */
    if (d.root.hidden) {
      d.root.hidden = false;
      document.body.classList.add('p2jb-stats');
    }

    statText(d.clocks, 'total ' + (s.total || '--:--:--')
      + (s.phaseKey ? ' · ' + s.phaseKey + ' ' + s.phaseTime : ''));
    statText(d.stepChip, 'STEP ' + (s.stepNum || '-') + '/' + (s.stepDen || 7));
    statText(d.status, s.status || '…');
    statText(d.phaseName, (s.phaseKey || 'phase').toUpperCase());
    statText(d.phasePct, s.phasePct !== undefined ? s.phasePct + '%' : '-');

    var meta = [];
    if (s.ratePerMin) meta.push(s.ratePerMin + '%/min');
    if (s.eta) meta.push('ETA ' + s.eta);
    if (s.doneClockPhase) meta.push('done ~' + s.doneClockPhase);
    if (s.stallSecs) meta.push('no progress for ' + s.stallSecs + 's');
    var metaCls = 'stats-meta' + (s.stallSecs ? ' stalled' : '');
    statText(d.phaseMeta, meta.join(' · ') || 'ETA --:--:--');
    if (d.phaseMeta.className !== metaCls) d.phaseMeta.className = metaCls;

    statText(d.overallPct, s.overallPct !== undefined
      ? s.overallPct.toFixed(1) + '%' : '-');
    var ometa = [];
    if (s.left) ometa.push('~' + s.left + ' left');
    if (s.doneClockOverall) ometa.push('done ~' + s.doneClockOverall);
    statText(d.overallMeta, ometa.join(' · ') || '- left');

    if (s.phasePct !== undefined) statFill(d.phaseFill, parseFloat(s.phasePct) / 100);
    if (s.overallPct !== undefined) statFill(d.overallFill, s.overallPct / 100);

    renderP2jbDetail(d, s.details);
    renderP2jbGroups(d, s.groups);

    if (s.stepKey && s.stepNum !== undefined) {
      var phaseStep = s.stepNum + '/' + (s.stepDen || 7) + ' ' + s.stepKey;
      if (phaseStep !== p2jbLastPhaseStep) {
        p2jbLastPhaseStep = phaseStep;
        uiLog('[p2jb] phase ' + s.stepKey + ' (step ' + s.stepNum
          + '/' + (s.stepDen || 7) + ') - overall ' + (s.overallPct !== undefined
            ? s.overallPct.toFixed(1) + '%' : '-')
          + (s.left ? ', ~' + s.left + ' left' : ''), 'info');
      }
    }
  }

  function renderP2jbDetail(d, details) {
    var text = details && details.length ? details.join('\n') : '';
    if (!text) {
      if (!d.detail.hidden) d.detail.hidden = true;
      return;
    }
    if (d.detail.hidden) d.detail.hidden = false;
    statText(d.detail, text);
  }

  /* Per-worker strip from upstream's leak-feed "per-core:" line: one bar
     per worker with its live percentage inside. Cells are rebuilt only when
     the worker count changes; every write is change-guarded. */
  function renderP2jbGroups(d, groups) {
    if (!groups || !groups.length) {
      d.cells = null;
      if (!d.groupsBox.hidden) d.groupsBox.hidden = true;
      return;
    }
    if (d.groupsBox.hidden) d.groupsBox.hidden = false;
    if (!d.cells || d.cells.length !== groups.length) {
      d.groupsBox.textContent = '';
      d.cells = [];
      for (var i = 0; i < groups.length; i++) {
        var cell = document.createElement('span');
        cell.className = 'group';
        var track = document.createElement('span');
        track.className = 'gtrack';
        var fill = document.createElement('span');
        fill.className = 'stats-fill';
        var pct = document.createElement('span');
        pct.className = 'gpct';
        track.appendChild(fill);
        track.appendChild(pct);
        cell.appendChild(track);
        d.groupsBox.appendChild(cell);
        d.cells.push({ fill: fill, pct: pct });
      }
    }
    for (var j = 0; j < d.cells.length; j++) {
      statFill(d.cells[j].fill, (groups[j] || 0) / 100);
      statText(d.cells[j].pct, (groups[j] || 0).toFixed(1) + '%');
    }
  }

  /* Win: pin the panel green at 100% until the autoload result lands
     (~4 s later), then collapseP2jbStats() restores the classic layout. */
  function completeP2jbStats() {
    var d = p2jbStatsDom();
    if (!d) return;
    document.body.classList.add('p2jb-done');
    d.status.className = 'stats-status';
    statText(d.status, 'ELF LOADER READY');
    statText(d.phaseName, 'COMPLETE');
    statText(d.phasePct, '100%');
    statText(d.overallPct, '100%');
    statText(d.phaseMeta, '');
    statText(d.overallMeta, 'elfldr ready - sending payload…');
    statFill(d.phaseFill, 1);
    statFill(d.overallFill, 1);
  }

  function collapseP2jbStats() {
    document.body.classList.remove('p2jb-stats');
    document.body.classList.remove('p2jb-done');
    if (p2jbStats && p2jbStats.root && !p2jbStats.root.hidden) {
      p2jbStats.root.hidden = true;
    }
  }

  /* Mirror p2jb's ~1 h run from the same-origin exploit iframe into our UI.
     p2jb renders a pinned progress readout (#livestat, repainted by
     upstream's 1 Hz ticker) with a per-phase bar and an OVERALL line:
       "P2JB   total 00:12:03   leak 00:09:41\n<phase text>\n"
       "[####....] 43.10%   0.31%/min   ETA 00:38:12 ...\n"
       "OVERALL [####....] 37.4%   step 3/7 (leak)   ~00:41:12 left ..."
     renderP2jbStats() mirrors it into #p2jbStats; screen/stage/summary/early
     mirroring works like the poops one, with a p2jb-specific curated mark
     filter (upstream's log=debug screen would otherwise flood us). */
  var p2jbMirroredLines = 0;
  var p2jbLastStageText = '';
  var p2jbLastStageCls = '';
  var p2jbLastSummaryText = '';
  var p2jbEarlyLinesLogged = 0;
  var p2jbLastPhaseStep = '';
  var p2jbComplete = false;
  function mirrorP2jb() {
    var doc;
    try {
      doc = exploitEl.contentDocument;
    } catch (e) {
      return;
    }
    if (!doc) return;

    /* Detect iframe navigation/reload: reset the mirrors so a fresh document
       (or a crash restore) streams its log from the top. */
    var frameUrl = '';
    try {
      frameUrl = exploitEl.contentWindow.location.href;
    } catch (e) { }
    if (frameUrl !== lastFrameUrl) {
      lastFrameUrl = frameUrl;
      p2jbMirroredLines = 0;
      p2jbLastStageText = '';
      p2jbLastStageCls = '';
      p2jbLastSummaryText = '';
      p2jbEarlyLinesLogged = 0;
      p2jbLastPhaseStep = '';
      p2jbComplete = false;
    }
    /* The iframe is intentionally empty until the chain is armed - nothing
       to mirror yet. */
    if (!chainStarted) return;

    var scr = doc.getElementById('scr');
    if (!scr) {
      /* #scr is static HTML in p2jb.html - while it parses, earlier elements
         and <title> are already present, so a poll can briefly see "p2jb
         page without its screen". Same for the blank pre-navigation
         document. Never warn or re-arm during these windows: re-arming
         reloads the exploit a second time (and the log doubles). */
      var isArmedUrl = frameUrl.length > EXPLOIT_URL.length &&
        frameUrl.slice(-EXPLOIT_URL.length) === EXPLOIT_URL;
      if (frameUrl === 'about:blank' || doc.readyState !== 'complete'
        || isArmedUrl) {
        return;
      }
      /* Only reached when the iframe settled on a *different* page: slopkit's
         landing page, a not-armed p2jb.html, or a 404. */
      var arm = doc.getElementById('arm');
      var runP2jb = doc.getElementById('run-p2jb');
      var title = doc.title || '';
      if (mirrorP2jb.warned !== frameUrl) {
        mirrorP2jb.warned = frameUrl;
        if (runP2jb) {
          uiLog('[iframe] slopkit landing page loaded - chain not started.', 'warning');
        } else if (arm && !arm.hidden) {
          uiLog('[iframe] p2jb page is NOT armed (?go=1 missing) - nothing will run.', 'warning');
        } else if (title.indexOf('slopkit') !== -1) {
          uiLog('[iframe] p2jb page loaded without its screen (title="' + title + '").', 'warning');
        } else {
          uiLog('[iframe] page has no p2jb screen: title="' + title + '"', 'warning');
        }
      }
      /* Re-arm only for a wrong *slopkit* page (landing page or not-armed
         p2jb.html) - never for the armed URL itself. */
      var isSlopkitPage = !!runP2jb || (arm && !arm.hidden);
      if (chainStarted && isSlopkitPage && repairCount < 5) {
        repairCount++;
        uiLog('[iframe] re-arming (attempt ' + repairCount + '): ' + EXPLOIT_URL, 'info');
        try {
          exploitEl.src = EXPLOIT_URL;
        } catch (e) {
          uiLog('[iframe] re-arm failed: ' + (e && e.message ? e.message : e), 'error');
        }
      } else if (chainStarted && isSlopkitPage) {
        uiLog('[iframe] giving up after ' + repairCount + ' re-arm attempts.', 'error');
      }
      return;
    }

    /* Live progress: mirror #livestat into our native stats panel. The
       element only exists once the first real phase starts; before that the
       stage text carries the status. Upstream's 1 Hz ticker keeps repainting
       #livestat even after the win, so stop once the chain is complete and
       let the stage/autoload messages own the UI again. */
    var live = doc.getElementById('livestat');
    if (live && live.textContent && !p2jbComplete) {
      var statsRoot = document.getElementById('p2jbStats');
      /* Quiet UI keeps #p2jbStats hidden. Un-hiding and repainting it every
         tick only thrashes the thread the exploit is running on. */
      if (statsRoot && !statsRoot.hidden) renderP2jbStats(live.textContent);
    }

    var lines = scr.textContent.split('\n');
    /* If the screen shrank (p2jb caps its log at 12 lines and drops the
       oldest ones, or a fresh document replaced it), re-anchor the counter
       WITHOUT re-logging - the remaining lines were already streamed. */
    if (lines.length < p2jbMirroredLines) {
      p2jbMirroredLines = lines.length;
    }
    for (; p2jbMirroredLines < lines.length; p2jbMirroredLines++) {
      var line = lines[p2jbMirroredLines].trim();
      if (!line) continue;
      /* Curated release log: milestone marks and failures only. The verbose
         debug stream (LEAK-/SPRAY-/TRIPLET/PROGRESS every 15 s, ...) stays
         off our log - the livestat bar above carries the live progress. */
      if (/^(POOPS-BOOT|OFFSETS-READY|TRIGGER-ARMED|TRIGGER-FIRED|LATCH-SET|LATCH-ESCALATE|LATCH-CLEAR|LATCH-HELD|LATCH-RELEASED|POOPS-LATCHED|POOPS-STALLED|BOOT-STALLED|CHAIN-DEAD|STAGE5-DONE|POOPS-COMPLETE|POOPS-FAILED|ELFLDR-MENU-VISIBLE|ELFLDR-UP|ELF-SENT|ELF-SEND-FAILED|ELF-SENDER-BLOCKED|KEXP-JOIN|KEXP-JOIN-PRE|KEXP-SPAWN|KEXP-ELF|AUTOLOAD-OK|AUTOLOAD-FAILED)/.test(line)) {
        uiLog('[log] ' + line, 'info');
      } else if (/FAIL|ERROR|REFUSED|REBOOT|failed|panic|exception/i.test(line)
        || /^\[-\]/.test(line)) {
        uiLog('[log] ' + line, 'error');
      }
    }

    var stage = doc.getElementById('stage');
    if (stage && stage.textContent !== p2jbLastStageText) {
      p2jbLastStageText = stage.textContent;
      p2jbLastStageCls = stage.className || '';
      /* The panel owns progress while it is up (the slim bar is hidden via
         body.p2jb-stats); before livestat exists (early boot) and after the
         collapse, mirror the stage text into our label instead. */
      if (!live || p2jbComplete) {
        progressLabel.textContent = p2jbLastStageText;
      }
      /* showWin() fires on every win path (KEXP-JOIN detection and the
         already-jailbroken shortcut) - latch completion here so the
         autoload flow owns the UI from this point on. */
      if (!p2jbComplete && p2jbLastStageText.indexOf('ELF LOADER READY') !== -1) {
        p2jbComplete = true;
        bumpProgressFloor(95);
        uiLog('[p2jb] exploit complete - elfldr ready.', 'success');
        /* Pin the panel green at 100% until the autoload result lands, then
           onAutoloadResult collapses back to the classic full-height log.
           The iframe stays loaded - it holds the ROP workers/threads. */
        completeP2jbStats();
      }
      if (p2jbLastStageCls.indexOf('bad') !== -1) {
        uiLog('[stage] ' + p2jbLastStageText, 'error');
        /* Tint the panel status red so a mid-run failure is visible there
           too (the panel stays up for diagnostics on failures). */
        if (p2jbStats && p2jbStats.status) {
          p2jbStats.status.className = 'stats-status bad';
        }
      } else if (p2jbLastStageCls.indexOf('ok') !== -1) {
        uiLog('[stage] ' + p2jbLastStageText, 'success');
      } else {
        uiLog('[stage] ' + p2jbLastStageText, 'info');
      }
    }

    /* Mirror the summary block (verdict details) when it changes. */
    var summary = doc.getElementById('summary');
    if (summary && summary.textContent && summary.textContent !== p2jbLastSummaryText) {
      var summaryLines = summary.textContent.split('\n');
      for (var i = 0; i < summaryLines.length; i++) {
        var sline = summaryLines[i].trim();
        if (sline && /FAIL|ERROR|REFUSED|REBOOT|failed|panic/i.test(sline)) {
          uiLog('[summary] ' + sline, 'error');
        }
      }
      p2jbLastSummaryText = summary.textContent;
    }

    /* Mirror the #early log (errors/notices written before the module chain
       runs). p2jb only ever appends to #early, so log just the new tail. */
    var early = doc.getElementById('early');
    if (early && early.textContent) {
      var earlyLines = early.textContent.split('\n');
      if (earlyLines.length < p2jbEarlyLinesLogged) {
        p2jbEarlyLinesLogged = 0;
      }
      for (; p2jbEarlyLinesLogged < earlyLines.length; p2jbEarlyLinesLogged++) {
        var eline = earlyLines[p2jbEarlyLinesLogged].trim();
        if (eline) {
          uiLog('[early] ' + eline, /ERROR|FAIL/i.test(eline) ? 'error' : 'info');
        }
      }
    }
  }

  /* Mirror Relapse's #console log (div lines with [+]/[-] markers).
     #logWrapper stays hidden during the run, so also copy the last line
     into #statusMsg - otherwise a hang looks like a silent 76% soft-fill. */
  var relapseMirroredLines = 0;
  var relapseSawConsole = false;
  function setRelapseStatus(text) {
    if (!statusMsgEl || !text) return;
    var shown = text.replace(/^\[[+*-]\]\s*/, '');
    if (statusMsgEl.textContent !== shown) statusMsgEl.textContent = shown;
  }
  function mirrorRelapse() {
    var doc;
    try {
      doc = exploitEl.contentDocument;
    } catch (e) {
      return;
    }
    if (!doc || !chainStarted) return;
    var frameUrl = '';
    try { frameUrl = exploitEl.contentWindow.location.href; } catch (eU) { }
    if (frameUrl && frameUrl !== 'about:blank' && doc.readyState === 'complete'
      && frameUrl.indexOf('relapse/') === -1 && !mirrorRelapse.badUrl) {
      mirrorRelapse.badUrl = frameUrl;
      setRelapseStatus('Kernel iframe did not load');
      uiLog('[iframe] expected relapse/index.html, got ' + frameUrl, 'error');
    }
    var lines = doc.querySelectorAll('#console > div');
    if (lines.length < relapseMirroredLines) {
      relapseMirroredLines = 0;
    }
    for (; relapseMirroredLines < lines.length; relapseMirroredLines++) {
      var el = lines[relapseMirroredLines];
      var textLine = (el.textContent || '').trim();
      if (!textLine) continue;
      relapseSawConsole = true;
      var kind = 'info';
      if (/^\[-\]/.test(textLine) || /error|fail/i.test(textLine)) kind = 'error';
      else if (/^\[\+\]/.test(textLine) || /success|complete|listening/i.test(textLine)) kind = 'success';
      else if (/warning|warn/i.test(textLine)) kind = 'warning';
      setRelapseStatus(textLine);
      if (/Offsets ready|Firmware:/.test(textLine)) bumpProgressFloor(10);
      else if (/Starting WebKit/.test(textLine)) bumpProgressFloor(18);
      else if (/ARW ready|WebKit base/.test(textLine)) bumpProgressFloor(32);
      else if (/Worker/.test(textLine)) bumpProgressFloor(48);
      else if (/kernel/.test(textLine)) bumpProgressFloor(70);
      else if (/elfldr|listening on port 9021/.test(textLine)) bumpProgressFloor(88);
      uiLog('[relapse] ' + textLine, kind);
    }
  }

  function mirrorExploit() {
    if (exploitMode === 'umtx2') {
      mirrorUmtx2();
      return;
    }
    if (exploitMode === 'relapse') {
      mirrorRelapse();
      return;
    }
    if (exploitMode === 'p2jb') {
      mirrorP2jb();
      return;
    }
  }

  function start() {
    /* Explicit splash choice only. Anything else is wkal-skip.
       Elf Launcher Hybrid: probe :1000 first — up => open-only; down => send tip. */
    launcherHttpOpenStarted = false;
    elfHttpAlreadyUp = false;
    if (launcherChoice === CHOICE_ELF_LAUNCHER) {
      uiLog('Probing Elf Launcher HTTP :1000 ...', 'info');
      probeElfLauncherHttp(function (up) {
        elfHttpAlreadyUp = !!up;
        if (elfHttpAlreadyUp) {
          uiLog(':1000 is up — Hybrid open-only (no ELF send).', 'success');
          startChain(true);
        } else {
          uiLog(':1000 down — Hybrid will send on-disk elf-launcher.elf after JB.', 'info');
          startChain(false);
        }
      });
      return;
    }
    startChain(!isExplicitLauncherChoice(launcherChoice));
  }

  function startChain(skipElfSend) {
    uiLog('WK Autoloader by X-F1REBALL-X', 'success');
    if (statusMsgEl) statusMsgEl.textContent = t('jailbreakStarted');
    updateProgress(0, t('jailbreakStarted'));
    startProgressDriver();
    startElapsed();

    autoloadPending = true;
    window.addEventListener('message', function (event) {
      var data = event.data;
      if (!data || data.type !== 'wkal') return;
      if (data.kind === 'autoload') {
        onAutoloadResult(data);
      }
    });

    /* No iframe 'load' listener: its mirroredLines reset re-streamed the
       whole screen mid-run (doubling the log), and the other state resets
       are already handled by the URL-diff branch in mirrorSlopkit() plus
       the shrink re-anchor (fresh documents start with an empty screen,
       so their lines stream normally). */

    var fw = detectFirmware();
    var picked = pickExploit();
    if (!picked) {
      setMeta(fw ? fw.str : '-', 'unsupported');
      finishProgressFail(t('jailbreakFail'));
      return;
    }
    exploitMode = picked;
    setMeta(fw ? fw.str : '-', picked);

    var autoloadName = skipElfSend ? 'wkal-skip' : autoloadElfName();
    var urls = buildExploitUrls(autoloadName);
    UMTX2_URL = urls.umtx2;
    P2JB_URL = urls.p2jb;
    RELAPSE_URL = urls.relapse;
    EXPLOIT_URL = picked === 'umtx2' ? UMTX2_URL
      : picked === 'p2jb' ? P2JB_URL
        : RELAPSE_URL;
    uiLog('Post-JB launcher: ' + (launcherChoice === CHOICE_ELF_LAUNCHER
      ? (elfHttpAlreadyUp
        ? 'Elf Launcher Hybrid (open :1000 only)'
        : 'Elf Launcher Hybrid (send ' + autoloadName + ' then open :1000)')
      : autoloadName === 'pldmgr.elf'
        ? 'Payload Manager (' + autoloadName + ')'
        : 'none (' + autoloadName + ')'), 'info');

    /* p2jb's own ticker repaints at exactly 1 Hz - polling any faster only
       burns shared-thread time; the fast chains keep 500 ms for snappier
       logs. */
    mirrorTimer = setInterval(mirrorExploit, picked === 'p2jb' ? 1000 : 500);

    /* umtx2 auto-runs its chain on load when sessionStorage 'on_load_autorun'
       is set (it clears it itself once main() starts); clear it on the
       p2jb path so a stale key never re-triggers it.
       wkal_autoload mirrors the chosen ELF name for umtx2's sessionStorage
       fallback (patches/umtx2-autoload.patch). */
    try {
      if (picked === 'umtx2') {
        sessionStorage.setItem('on_load_autorun', 'kernel');
        sessionStorage.setItem('wkal_autoload', autoloadName);
      } else if (picked === 'relapse') {
        sessionStorage.removeItem('on_load_autorun');
        sessionStorage.setItem('wkal_autoload', autoloadName);
      } else {
        sessionStorage.removeItem('on_load_autorun');
        sessionStorage.removeItem('wkal_autoload');
      }
    } catch (e) { }

    chainStarted = true;
    if (picked === 'p2jb') {
      clearSlopkitState();
    }
    try {
      exploitEl.src = EXPLOIT_URL;
    } catch (e) { }

    if (picked === 'relapse') {
      setTimeout(function () {
        if (progressDone || relapseSawConsole) return;
        setRelapseStatus('Kernel chain produced no log - iframe or module may have failed to load');
      }, 12000);
    }

    setTimeout(revealExploit, 500);
  }


  function updateDetectUi() {
    var el = document.getElementById('detectMsg');
    if (!el) return;
    var fw = detectFirmware();
    if (!fw) {
      el.textContent = t('consoleNotDetected');
      el.className = 'detect-title unsupported';
      return;
    }
    var chain = null;
    if (UMTX2_FIRMWARES.indexOf(fw.str) !== -1
      || (fw.num >= 1.0 && fw.num < 6.0)) chain = 'umtx2';
    else if (RELAPSE_FIRMWARES.indexOf(fw.str) !== -1
      || (fw.num >= 7.0 && fw.num <= 13.60)) chain = 'relapse';
    if (chain) {
      el.textContent = t('fwChain', { fw: fw.str, chain: formatChainLabel(chain) });
      el.className = 'detect-title';
    } else {
      el.textContent = t('fwUnsupported', { fw: fw.str });
      el.className = 'detect-title unsupported';
    }
  }

  function syncChoiceUi() {
    var pm = document.getElementById('choicePayloadManager');
    var el = document.getElementById('choiceElfLauncher');
    if (pm) {
      if (launcherChoice === CHOICE_PAYLOAD_MANAGER) pm.classList.add('selected');
      else pm.classList.remove('selected');
    }
    if (el) {
      if (launcherChoice === CHOICE_ELF_LAUNCHER) el.classList.add('selected');
      else el.classList.remove('selected');
    }
  }


  function bindLauncherChoiceUi() {
    launcherChoice = loadLauncherChoice();
    updateDetectUi();
    syncChoiceUi();
    var pm = document.getElementById('choicePayloadManager');
    var el = document.getElementById('choiceElfLauncher');
    var go = document.getElementById('startJailbreak');
    var auto = document.getElementById('autoJailbreak');
    var cancel = document.getElementById('cancelAutoStart');
    var autoTimer = 0;
    var autoRemaining = 3;

    function setAutoPreference(checked) {
      try { localStorage.setItem('wkal_auto_jb', checked ? '1' : '0'); } catch (e) { }
    }

    function cancelAutoCountdown() {
      if (autoTimer) {
        clearInterval(autoTimer);
        autoTimer = 0;
      }
      if (go && !chainStarted) {
        go.disabled = false;
        go.textContent = t('startJailbreak');
      }
      if (cancel) cancel.hidden = true;
    }

    function startAutoCountdown() {
      if (chainStarted || autoTimer || !go) return;
      autoRemaining = 3;
      go.disabled = true;
      go.textContent = t('startingIn', { n: autoRemaining });
      if (cancel) cancel.hidden = false;
      autoTimer = setInterval(function () {
        autoRemaining -= 1;
        if (autoRemaining <= 0) {
          clearInterval(autoTimer);
          autoTimer = 0;
          if (cancel) cancel.hidden = true;
          go.textContent = t('starting');
          saveLauncherChoice(launcherChoice);
          start();
          return;
        }
        go.textContent = t('startingIn', { n: autoRemaining });
      }, 1000);
    }

    if (pm) {
      pm.addEventListener('click', function () {
        saveLauncherChoice(CHOICE_PAYLOAD_MANAGER);
        syncChoiceUi();
      });
    }
    if (el) {
      el.addEventListener('click', function () {
        saveLauncherChoice(CHOICE_ELF_LAUNCHER);
        syncChoiceUi();
      });
    }
    if (auto) {
      var savedAuto = '';
      try { savedAuto = localStorage.getItem('wkal_auto_jb') || ''; } catch (e) { }
      auto.checked = savedAuto === '1';
      auto.addEventListener('change', function () {
        setAutoPreference(auto.checked);
        if (auto.checked) startAutoCountdown();
        else cancelAutoCountdown();
      });
    }
    if (cancel) {
      cancel.addEventListener('click', function () {
        cancelAutoCountdown();
      });
    }
    if (go) {
      go.addEventListener('click', function () {
        if (chainStarted) return;
        cancelAutoCountdown();
        go.disabled = true;
        saveLauncherChoice(launcherChoice);
        start();
      });
    }

    /* Auto-start is intentionally armed only after the splash has loaded and
       the saved preference has been read. The separate Cancel button leaves
       the preference enabled for the next load. */
    if (auto && auto.checked) startAutoCountdown();
  }

  /* Wait for the user to pick Payload Manager vs elf-launcher on the splash
     before arming the exploit. A saved Auto-start preference arms a short
     cancellable countdown instead. */
  window.wkalAfterLangChange = function () {
    updateDetectUi();
    /* Refresh Start / Cancel labels if countdown is idle. */
    var go = document.getElementById('startJailbreak');
    var cancel = document.getElementById('cancelAutoStart');
    if (go && !chainStarted && !go.disabled) {
      go.textContent = t('startJailbreak');
    }
    if (cancel) cancel.textContent = t('cancel');
    if (elapsedMsgEl && !elapsedTimer) {
      elapsedMsgEl.textContent = t('elapsed', { t: '0:00' });
    }
  };

  window.addEventListener('load', function () {
    if (window.WKAL_I18N && typeof window.WKAL_I18N.bindLangUi === 'function') {
      window.WKAL_I18N.bindLangUi();
    }
    bindLauncherChoiceUi();
  });
})();
