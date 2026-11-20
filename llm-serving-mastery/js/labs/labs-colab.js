/* labs-colab.js — optional remote runtime for practice labs: the student's
   own Google Colab runtime raised from the companion notebook and exposed
   through an HTTPS tunnel (cloudflared quick tunnel / ngrok). The page stays
   the editor and the validator; only execution moves to the runtime.
   Contract (same exercise semantics as the browser sandbox):
     GET  /health → {status:"ok", runtime:"lsm-colab-companion", version, caps}
     POST /run    → {code, tests:[[name,hidden,expr]...], msgs, timeout_s}
                  → {ok:true, result:"<harness JSON>"}  (same harness as
                    py-worker.js, so validation is byte-identical)
   Auth: X-Lab-Token header (printed next to the tunnel URL in the notebook).
   When connected, this module wraps window.LSMPython.run: exercises and the
   ★ challenge transparently execute remotely; offline everything stays in
   the browser. Practice only — never course evidence. */
(function () {
  "use strict";

  const LS_KEY = "lsm.colab.v1";
  const state = { url: null, token: null, ok: false };

  // lab 01 renders itself: no LAB_META — fall back to its window.LAB1 + lang
  const meta = () => window.LAB_META || {
    lang: document.documentElement.dataset.lang || "en",
    t: window.LAB1 || {},
  };
  const lang = () => meta().lang || "en";
  // the colab strings live flat on LAB_META.t (like fuCorrect/chSolved)
  const T = () => meta().t || {};

  function tr(f) {
    if (f == null) return "";
    return typeof f === "string" ? f : f[lang()] || f.en || "";
  }
  function el(tag, cls, html) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (html != null) node.innerHTML = html;
    return node;
  }

  // The same expected/got messages the Pyodide runner injects into the
  // harness — assertion texts must read identically either way.
  const MSGS = {
    en: { expected: "expected", got: "got" },
    ru: { expected: "ожидал", got: "получил" },
  };

  function normalizeUrl(raw) {
    let u = String(raw || "").trim().replace(/\/+$/, "");
    if (!/^https?:\/\//i.test(u)) return null;
    return u;
  }

  function loadSaved() {
    try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; } catch (e) { return {}; }
  }
  function save(endpoint) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(endpoint)); } catch (e) { /* private mode */ }
  }

  async function probe(url, token) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
    try {
      const r = await fetch(url + "/health", {
        signal: ctrl.signal,
        headers: token ? { "X-Lab-Token": token } : {},
      });
      clearTimeout(timer);
      if (!r.ok) return { ok: false, why: "HTTP " + r.status };
      const h = await r.json();
      if (h.status !== "ok" || h.runtime !== "lsm-colab-companion") {
        return { ok: false, why: "not an LSM companion" };
      }
      return { ok: true, info: h };
    } catch (e) {
      clearTimeout(timer);
      return { ok: false, why: String((e && e.message) || e) };
    }
  }

  // Same result shape as LSMPython.run: {status, error, results, stdout}.
  async function runRemote(code, tests, opts) {
    opts = opts || {};
    const payload = {
      kind: "exercise",
      code: code,
      tests: (tests || []).map((t) => [t.name, !!t.hidden, t.code]),
      msgs: MSGS[lang()] || MSGS.en,
      // remote adds network round-trip: floor 20 s, generous with heavy goals
      timeout_s: Math.max(20, Math.ceil((opts.timeoutMs || 4000) / 1000)) + 15,
    };
    const started = Date.now();
    const ctrl = new AbortController();
    // client-side cap: the exercise's own budget × 5 for transport, ≥ 45 s
    const capMs = Math.max(45000, (opts.timeoutMs || 4000) * 5 + 20000);
    const timer = setTimeout(() => ctrl.abort(), capMs);
    try {
      const r = await fetch(state.url + "/run", {
        method: "POST",
        signal: ctrl.signal,
        headers: { "Content-Type": "application/json", "X-Lab-Token": state.token || "" },
        body: JSON.stringify(payload),
      });
      clearTimeout(timer);
      if (!r.ok) {
        return { status: "runner-error", error: "HTTP " + r.status, results: [], stdout: "" };
      }
      const data = await r.json();
      if (!data || data.ok !== true || typeof data.result !== "string") {
        return { status: "runner-error", error: (data && data.error) || "bad companion response", results: [], stdout: "" };
      }
      const wall = ((Date.now() - started) / 1000).toFixed(1);
      const parsed = JSON.parse(data.result);
      // surface the remote wall time honestly: stdout tail carries it
      parsed.stdout = (parsed.stdout || "") + "\n[remote runtime · " + wall + " s]";
      return parsed;
    } catch (e) {
      clearTimeout(timer);
      const msg = String((e && e.message) || e);
      if (ctrl.signal.aborted) {
        return { status: "timeout", error: "remote timeout", results: [], stdout: "" };
      }
      return { status: "runner-error", error: msg, results: [], stdout: "" };
    }
  }

  // ------------------------------------------------------------------ panel
  function renderPanel() {
    const host = document.querySelector("[data-lab-colab]");
    if (!host) return;
    const chip = el("span", "lab-runtime-chip lab-runtime-off", "○ " + tr(T().colabProbing));
    const urlIn = document.createElement("input");
    urlIn.type = "url";
    urlIn.className = "lab-colab-url";
    urlIn.placeholder = "https://…trycloudflare.com";
    urlIn.setAttribute("aria-label", tr(T().colabUrlLabel));
    const tokIn = document.createElement("input");
    tokIn.type = "password";
    tokIn.className = "lab-colab-token";
    tokIn.placeholder = tr(T().colabTokenLabel);
    tokIn.setAttribute("aria-label", tr(T().colabTokenLabel));
    const connectBtn = el("button", "button", tr(T().colabConnect));
    connectBtn.type = "button";
    const disconnectBtn = el("button", "button secondary", tr(T().colabDisconnect));
    disconnectBtn.type = "button";
    const log = el("p", "lab-ch-note");
    log.setAttribute("aria-live", "polite");

    const zip = el("a", "button secondary", tr(T().colabDownload));
    zip.href = String(window.LAB_BASE || "").replace(/\/$/, "") + "/downloads/lsm-colab-companion.ipynb";
    zip.download = "lsm-colab-companion.ipynb";

    const actions = el("div", "lab-controls");
    actions.appendChild(zip);
    const urlWrap = el("label", "lab-ch-field");
    urlWrap.appendChild(el("span", "", tr(T().colabUrlLabel)));
    urlWrap.appendChild(urlIn);
    const tokWrap = el("label", "lab-ch-field");
    tokWrap.appendChild(el("span", "", tr(T().colabTokenLabel)));
    tokWrap.appendChild(tokIn);
    actions.appendChild(urlWrap);
    actions.appendChild(tokWrap);
    actions.appendChild(connectBtn);
    actions.appendChild(disconnectBtn);

    const setChip = (cls, text) => {
      chip.className = "lab-runtime-chip lab-runtime-" + cls;
      chip.textContent = (cls === "ok" ? "● " : cls === "wait" ? "◐ " : "○ ") + text;
    };

    async function connect(url, token, quiet) {
      setChip("wait", tr(T().colabProbing));
      const r = await probe(url, token);
      if (r.ok) {
        state.url = url;
        state.token = token;
        state.ok = true;
        save({ url, token });
        setChip("ok", tr(T().colabConnected));
        log.textContent = "";
        return true;
      }
      state.ok = false;
      setChip("off", tr(T().colabOffline) + " · " + r.why);
      if (!quiet) log.textContent = "";
      return false;
    }

    connectBtn.addEventListener("click", async () => {
      const url = normalizeUrl(urlIn.value);
      if (!url) { setChip("off", tr(T().colabOffline)); return; }
      connectBtn.disabled = true;
      await connect(url, tokIn.value.trim(), false);
      connectBtn.disabled = false;
    });
    disconnectBtn.addEventListener("click", () => {
      state.ok = false;
      state.url = null;
      state.token = null;
      try { localStorage.removeItem(LS_KEY); } catch (e) { /* private mode */ }
      urlIn.value = "";
      tokIn.value = "";
      setChip("off", tr(T().colabOffline));
    });

    host.appendChild(chip);
    host.appendChild(actions);
    host.appendChild(log);

    // restore a saved endpoint: fill the fields and probe quietly
    const saved = loadSaved();
    if (saved && saved.url) {
      urlIn.value = saved.url;
      tokIn.value = saved.token || "";
      connect(normalizeUrl(saved.url), saved.token || "", true);
    } else {
      setChip("off", tr(T().colabOffline));
    }
  }

  document.addEventListener("DOMContentLoaded", renderPanel);

  // Wrap the runner once, when this file loads after runtime.js. Every
  // existing caller (exercises, ★ challenge, layer-2 student verify) keeps
  // its code path; only the execution destination changes.
  if (window.LSMPython && !window.LSMPython.__lsmRemote) {
    const original = window.LSMPython.run.bind(window.LSMPython);
    window.LSMPython.run = function (code, tests, opts) {
      if (state.ok && state.url) return runRemote(code, tests, opts);
      return original(code, tests, opts);
    };
    window.LSMPython.__lsmRemote = true;
  }

  window.LSMColab = {
    active: () => state.ok,
    label: () => "colab",
  };
})();
