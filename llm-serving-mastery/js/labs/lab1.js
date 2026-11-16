/* lab1.js — Lab 01: baseline request → streaming timeline.
   Deterministic teaching simulation: same seed, same numbers, every run.
   Practice only — progress lives in localStorage and is not course evidence. */
(function () {
  "use strict";

  var T = window.LAB1 || {}; // bilingual strings injected by the page

  // ---------------------------------------------------------------- engine
  // Declared timing model (mirrors the table rendered on the page).
  var MODEL = {
    name: "demo-mini-1b",
    download_s: 12.0,   // weights fetch, cold only
    init_s: 3.0,        // engine init, cold only
    warmup_s: 1.0,      // one warm-up forward, cold only
    prefill_base_ms: 40,
    prefill_per_tok_ms: 0.625,
    step_ms: 60,        // one decode step = one token (teaching simplification)
    jitter: 0.10,       // ±10 % deterministic jitter
    seed: 20261114,
  };

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function estimateTokens(text) {
    // Declared estimate: ~4 characters per token.
    return Math.max(1, Math.ceil((text || "").length / 4));
  }

  function prefillMs(promptTokens) {
    return MODEL.prefill_base_ms + MODEL.prefill_per_tok_ms * promptTokens;
  }

  // Simulate one streaming request. Deterministic: identical inputs → identical run.
  function simulate(req, cold) {
    var rng = mulberry32(MODEL.seed + estimateTokens(promptOf(req)) * 7 + (req.max_tokens || 0));
    function jit(ms) { return ms * (1 - MODEL.jitter + 2 * MODEL.jitter * rng()); }
    var promptTokens = estimateTokens(promptOf(req));
    var tokens = req.max_tokens;
    var overhead_s = cold ? MODEL.download_s + MODEL.init_s + MODEL.warmup_s : 0;
    var ttft_s = overhead_s + jit(prefillMs(promptTokens) + MODEL.step_ms) / 1000;
    var chunks = [];
    var answer = cannedAnswer(tokens);
    for (var i = 0; i < tokens; i++) {
      var t = ttft_s + i * jit(MODEL.step_ms) / 1000;
      chunks.push({ t_s: t, text: answer[i] });
    }
    var total_s = chunks[chunks.length - 1].t_s;
    var tokPerS = tokens > 1 ? (tokens - 1) / (total_s - ttft_s) : null;
    return { promptTokens: promptTokens, tokens: tokens, cold: cold, chunks: chunks, ttft_s: ttft_s, total_s: total_s, tokPerS: tokPerS };
  }

  function promptOf(req) {
    try { return (req.messages && req.messages[0] && req.messages[0].content) || ""; }
    catch (e) { return ""; }
  }

  // Canned deterministic "generation" — chunk words, no model behind it.
  function cannedAnswer(n) {
    var words = ("The client sends one explicit request to the HTTP edge; the engine resolves "
      + "weights, fills the prompt through prefill, then decodes tokens step by step; "
      + "each step streams one chunk back, so the first token arrives after prefill "
      + "plus a single step while the rest follow at the step cadence.").split(" ");
    var out = [];
    for (var i = 0; i < n; i++) out.push(words[i % words.length]);
    return out;
  }

  // ------------------------------------------------------------- validation
  function validateRequest(req) {
    var errs = [];
    if (typeof req !== "object" || req === null || Array.isArray(req)) {
      errs.push(T.err_not_object); return errs;
    }
    if (req.model !== MODEL.name) errs.push(T.err_model);
    if (!Array.isArray(req.messages) || req.messages.length === 0) { errs.push(T.err_messages); }
    else {
      var first = req.messages[0];
      if (!first || typeof first !== "object" || first.role !== "user" || typeof first.content !== "string" || !first.content.trim()) {
        errs.push(T.err_messages);
      }
    }
    if (!Number.isInteger(req.max_tokens) || req.max_tokens < 1 || req.max_tokens > 256) errs.push(T.err_max_tokens);
    if (req.stream !== true) errs.push(T.err_stream);
    if (errs.length) return errs;

    var tokens = estimateTokens(req.messages[0].content);
    if (tokens > 512) errs.push(T.err_prompt_len);
    return errs;
  }

  // --------------------------------------------------------------- progress
  var KEY = "lsm.lab1";
  var IDS = ["q1", "q2", "q3", "ex1", "ex2", "ex3", "p1", "p2", "p3"];
  function loadProgress() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
  }
  function markDone(id) {
    var p = loadProgress(); p[id] = 1; localStorage.setItem(KEY, JSON.stringify(p)); renderProgress();
  }
  function renderProgress() {
    var p = loadProgress();
    var n = IDS.filter(function (id) { return p[id]; }).length;
    var fill = document.querySelector("[data-lab-progress-fill]");
    var count = document.querySelector("[data-lab-progress-count]");
    if (fill) fill.style.width = (100 * n / IDS.length) + "%";
    if (count) count.textContent = n + " / " + IDS.length;
    IDS.forEach(function (id) {
      var ex = document.querySelector('[data-lab-checkpoint="' + id + '"]');
      if (ex) ex.dataset.state = p[id] ? "pass" : "";
    });
  }

  // -------------------------------------------------------------- lifecycle
  function initLifecycle() {
    var root = document.querySelector("[data-lab-lifecycle]");
    if (!root) return;
    var rows = [
      { key: "download", ms: MODEL.download_s * 1000, coldOnly: true },
      { key: "init", ms: MODEL.init_s * 1000, coldOnly: true },
      { key: "warmup", ms: MODEL.warmup_s * 1000, coldOnly: true },
      { key: "prefill", ms: prefillMs(96), coldOnly: false },
      { key: "step", ms: MODEL.step_ms, coldOnly: false },
    ];
    var timers = [];
    function render(mode) {
      timers.forEach(clearTimeout); timers = [];
      var visible = rows.filter(function (r) { return mode === "cold" || !r.coldOnly; });
      var total = visible.reduce(function (s, r) { return s + r.ms; }, 0);
      var html = "";
      visible.forEach(function (r) {
        html += '<div class="lab-lc-row" data-phase="' + (r.coldOnly ? "cold-only" : "serve") + '">'
          + '<span>' + (T["lc_" + r.key] || r.key) + '</span>'
          + '<span class="lab-lc-bar"><i data-bar style="width:0%"></i></span>'
          + '<span class="lab-lc-ms" data-ms>' + fmtMs(r.ms) + '</span></div>';
      });
      root.innerHTML = html;
      var bars = root.querySelectorAll("[data-bar]");
      var acc = 0;
      visible.forEach(function (r, idx) {
        acc += r.ms;
        timers.push(setTimeout(function () {
          bars[idx].style.width = "100%";
          bars[idx].classList.add("done");
        }, 1400 * r.ms / total));
      });
      var ttft = visible[visible.length - 1];
      var out = root.parentElement.querySelector("[data-lab-lifecycle-total]");
      if (out) {
        var t = mode === "cold"
          ? (MODEL.download_s + MODEL.init_s + MODEL.warmup_s + (prefillMs(96) + MODEL.step_ms) / 1000)
          : (prefillMs(96) + MODEL.step_ms) / 1000;
        out.textContent = (T.lc_ttft || "first token after") + " ≈ " + t.toFixed(2) + " s";
      }
    }
    var coldBtn = root.parentElement.querySelector("[data-lab-lc-cold]");
    var warmBtn = root.parentElement.querySelector("[data-lab-lc-warm]");
    if (coldBtn) coldBtn.addEventListener("click", function () { render("cold"); });
    if (warmBtn) warmBtn.addEventListener("click", function () { render("warm"); });
    render("cold");
  }

  function fmtMs(ms) {
    return ms >= 1000 ? (ms / 1000).toFixed(1) + " s" : Math.round(ms) + " ms";
  }

  // ---------------------------------------------------------------- quizzes
  function initQuiz(id, answer, tol, unit) {
    var root = document.querySelector('[data-lab-quiz="' + id + '"]');
    if (!root) return;
    var input = root.querySelector("input");
    var btn = root.querySelector("button");
    var verdict = root.querySelector(".lab-verdict");
    var hintBtn = root.querySelector("[data-lab-hint-btn]");
    var hint = root.querySelector(".lab-hint");
    if (hintBtn) hintBtn.addEventListener("click", function () {
      hint.dataset.open = hint.dataset.open === "1" ? "0" : "1";
    });
    function check() {
      var v = parseFloat(String(input.value).replace(",", "."));
      if (!isFinite(v)) { verdict.dataset.state = "fail"; verdict.textContent = T.v_num; return; }
      if (Math.abs(v - answer) <= tol) {
        verdict.dataset.state = "pass"; verdict.textContent = T.v_pass + " (≈ " + answer + " " + unit + ")";
        markDone(id);
      } else {
        verdict.dataset.state = "fail";
        verdict.textContent = Math.abs(v - answer) <= tol * 3 ? T.v_close : T.v_fail;
      }
    }
    btn.addEventListener("click", check);
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") check(); });
  }

  // --------------------------------------------------------------- sandbox
  var lastRun = null;

  function logLine(box, text, cls) {
    var div = document.createElement("div");
    if (cls) div.className = cls;
    div.textContent = text;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
  }

  function sendToMock(raw, box, cold, done) {
    var req;
    try { req = JSON.parse(raw); }
    catch (e) {
      logLine(box, "HTTP/1.1 400 Bad Request — " + (T.err_json || "invalid JSON"), "err");
      if (done) done(null);
      return;
    }
    var errs = validateRequest(req);
    if (errs.length) {
      logLine(box, "HTTP/1.1 400 Bad Request", "err");
      errs.forEach(function (m) { logLine(box, "  • " + m, "err"); });
      if (done) done(null);
      return;
    }
    var run = simulate(req, cold);
    logLine(box, "POST /v1/chat/completions  stream=" + req.stream, "ok");
    var maxShow = 6;
    var head = Math.min(maxShow, run.chunks.length);
    for (var i = 0; i < head; i++) {
      logLine(box, "data: t=" + run.chunks[i].t_s.toFixed(3) + "s  chunk[" + (i + 1) + "]  «" + run.chunks[i].text + "»", "chunk");
    }
    if (run.chunks.length > head) {
      logLine(box, "data: … " + (run.chunks.length - head) + " " + (T.more_chunks || "more chunks") + " …", "chunk");
      var last = run.chunks[run.chunks.length - 1];
      logLine(box, "data: t=" + last.t_s.toFixed(3) + "s  chunk[" + run.chunks.length + "]  «" + last.text + "»", "chunk");
    }
    logLine(box, "data: [DONE]", "chunk");
    setMetrics(run);
    if (done) done(run);
  }

  function setMetrics(run) {
    var map = { ttft: run.ttft_s, total: run.total_s, tok: run.tokPerS, prompt: run.promptTokens };
    Object.keys(map).forEach(function (k) {
      var el = document.querySelector("[data-lab-metric='" + k + "']");
      if (!el) return;
      if (map[k] == null) { el.textContent = "—"; return; }
      el.textContent = k === "prompt" ? String(map[k]) : map[k].toFixed(k === "tok" ? 1 : 3);
    });
  }

  function initEx1() {
    var ex = document.querySelector('[data-lab-checkpoint="ex1"]');
    if (!ex) return;
    var ta = ex.querySelector("textarea");
    var send = ex.querySelector("[data-lab-send]");
    var cold = ex.querySelector("[data-lab-cold]");
    var box = ex.querySelector(".lab-timeline");
    send.addEventListener("click", function () {
      sendToMock(ta.value, box, cold && cold.checked, function (run) {
        if (run) { markDone("ex1"); lastRun = run; }
      });
    });
  }

  function initEx2() {
    var ex = document.querySelector('[data-lab-checkpoint="ex2"]');
    if (!ex) return;
    var input = ex.querySelector("input");
    var btn = ex.querySelector("button");
    var verdict = ex.querySelector(".lab-verdict");
    btn.addEventListener("click", function () {
      if (!lastRun) { verdict.dataset.state = "fail"; verdict.textContent = T.v_no_run; return; }
      var v = parseFloat(String(input.value).replace(",", "."));
      if (!isFinite(v)) { verdict.dataset.state = "fail"; verdict.textContent = T.v_num; return; }
      if (Math.abs(v - lastRun.ttft_s) <= 0.012) {
        verdict.dataset.state = "pass";
        verdict.textContent = T.v_pass + " (" + lastRun.ttft_s.toFixed(3) + " s)";
        markDone("ex2");
      } else {
        verdict.dataset.state = "fail"; verdict.textContent = T.v_fail;
      }
    });
  }

  function initEx3() {
    var ex = document.querySelector('[data-lab-checkpoint="ex3"]');
    if (!ex) return;
    var ta = ex.querySelector("textarea");
    var btn = ex.querySelector("[data-lab-send]");
    var box = ex.querySelector(".lab-timeline");
    btn.addEventListener("click", function () {
      sendToMock(ta.value, box, false, function (run) {
        if (run) markDone("ex3");
      });
    });
  }

  // ------------------------------------------------------------------ init
  document.addEventListener("DOMContentLoaded", function () {
    renderProgress();
    if (window.LSMPosttest && window.LAB1_POSTTEST) {
      var host = document.querySelector("[data-lab-posttest-host]");
      if (host) {
        window.LSMPosttest.render(host, window.LAB1_POSTTEST, {
          lang: (document.documentElement.dataset.lang === "ru") ? "ru" : "en",
          onCorrect: markDone,
        });
      }
    }
    initLifecycle();
    initQuiz("q1", 16.16, 0.5, "s");
    initQuiz("q2", 160, 10, "ms");
    initQuiz("q3", 3.94, 0.12, "s");
    initEx1(); initEx2(); initEx3();
  });
})();
