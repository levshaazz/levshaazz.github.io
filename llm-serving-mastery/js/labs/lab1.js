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
  // Funnel (market backlog wave 5): onboarding events, local-only. Events are
  // recorded only when the funnel was already started on the welcome page —
  // a student who never opened it keeps no funnel state at all.
  function funnelEvent(ev) {
    var raw = null;
    try { raw = localStorage.getItem("lsm.funnel.v1"); } catch (e) { return; }
    if (!raw) return;
    var f;
    try { f = JSON.parse(raw); } catch (e) { return; }
    if (!Array.isArray(f) || f.some(function (x) { return x.ev === ev; })) return;
    f.push({ ev: ev, ts: new Date().toISOString() });
    try { localStorage.setItem("lsm.funnel.v1", JSON.stringify(f)); } catch (e) {}
  }
  funnelEvent("lab1_started");
  var IDS = ["q1", "q2", "q3", "ex1", "ex2", "ex3", "p1", "p2", "p3"];
  function loadProgress() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
  }
  function markDone(id) {
    var p = loadProgress(); p[id] = 1;
    try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) { /* private mode */ }
    renderProgress(true);
  }
  function renderProgress(live) {
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
    // L1a-2 + L1a-5: reward как в лабах 02–12; бейдж у прогресса, живой
    // скролл только при завершении в этой сессии (reload не дёргает страницу)
    var reward = document.querySelector("[data-lab-reward]");
    if (reward && n === IDS.length && reward.dataset.open !== "1") {
      reward.dataset.open = "1";
      funnelEvent("lab1_done");
      var badge = document.querySelector("[data-lab-reward-badge]");
      if (badge) badge.hidden = false;
      startRewardLab1(reward);
      if (live) reward.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    // ★-челлендж живёт вне счёта чекпойнтов: свой бейдж у полосы прогресса
    var chBadge = document.querySelector("[data-lab-challenge-badge]");
    if (chBadge) {
      var chSolved = Object.keys(p).some(function (k) {
        return k.indexOf("ch:") === 0 && k.indexOf(":att") === -1 && p[k] === 1;
      });
      chBadge.hidden = !chSolved;
    }
  }

  // L1a-2: компактная версия reward-анимации labs-render (lab1 рендерится сам)
  function startRewardLab1(reward) {
    var canvas = reward.querySelector("canvas");
    var caption = reward.querySelector(".lab-reward-caption");
    if (caption) caption.textContent = (document.documentElement.dataset.lang === "ru")
      ? "Лаба 01 пройдена полностью — все 9 чекпойнтов."
      : "Lab 01 completed — all 9 checkpoints.";
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext("2d");
    var ru = document.documentElement.dataset.lang === "ru";
    var labels = ru ? ["клиент", "edge", "движок", "токены"] : ["client", "edge", "engine", "tokens"];
    var seed = 7919;
    function rnd() { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; }
    var W = canvas.width = Math.max(320, canvas.clientWidth * (window.devicePixelRatio || 1));
    var H = canvas.height = Math.max(120, canvas.clientHeight * (window.devicePixelRatio || 1));
    var xs = [0.08, 0.36, 0.64, 0.92];
    var tokens = [];
    for (var i = 0; i < 14; i += 1) tokens.push({ x: rnd() * W, lane: 0.3 + rnd() * 0.4, v: 0.6 + rnd() * 1.2, r: 2 + rnd() * 2.5 });
    var accent = getComputedStyle(document.querySelector(".lab-shell")).getPropertyValue("--lab-accent").trim() || "#38e1ff";
    var ink = getComputedStyle(document.documentElement).getPropertyValue("--ink").trim() || "#e8eef7";
    var t0 = null;
    function draw(ts) {
      if (!t0) t0 = ts;
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = ink; ctx.globalAlpha = 0.35;
      ctx.beginPath(); ctx.moveTo(xs[0] * W, H / 2); ctx.lineTo(xs[3] * W, H / 2); ctx.stroke();
      ctx.globalAlpha = 1;
      xs.forEach(function (x, i2) {
        ctx.fillStyle = accent;
        ctx.beginPath(); ctx.arc(x * W, H / 2, 9, 0, 7); ctx.fill();
        ctx.fillStyle = ink;
        ctx.font = Math.round(H * 0.09) + "px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(labels[i2] || "", x * W, H / 2 + 26);
      });
      tokens.forEach(function (tk) {
        tk.x += tk.v * (H * 0.01);
        if (tk.x > W) tk.x = -10;
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = accent;
        ctx.beginPath(); ctx.arc(tk.x, H / 2 + Math.sin(tk.x / 60 + tk.lane * 9) * H * 0.08, tk.r, 0, 7); ctx.fill();
        ctx.globalAlpha = 1;
      });
      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
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
    var fuOpened = false;
    function check() {
      var v = parseFloat(String(input.value).replace(",", "."));
      if (!isFinite(v)) { verdict.dataset.state = "fail"; verdict.textContent = T.v_num; return; }
      if (Math.abs(v - answer) <= tol) {
        verdict.dataset.state = "pass"; verdict.textContent = T.v_pass + " (≈ " + answer + " " + unit + ")";
        if (window.LAB1_FU && window.LAB1_FU[id]) {
          // число верное, но чекпойнт закрывается только после верной причины
          if (!fuOpened) { fuOpened = true; renderFollowUpLab1(root, window.LAB1_FU[id], id, false); }
        } else {
          markDone(id);
        }
      } else {
        verdict.dataset.state = "fail";
        verdict.textContent = Math.abs(v - answer) <= tol * 3 ? T.v_close : T.v_fail;
      }
    }
    btn.addEventListener("click", check);
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") check(); });
    // L1a-6: решённый квиз после reload показывает решённый вид
    if (loadProgress()[id]) {
      input.value = String(answer);
      verdict.dataset.state = "pass";
      verdict.textContent = T.v_pass + " (≈ " + answer + " " + unit + ")";
      if (window.LAB1_FU && window.LAB1_FU[id]) {
        fuOpened = true; renderFollowUpLab1(root, window.LAB1_FU[id], id, true);
      }
    }
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

  // ------------------------------------------------ quiz follow-up (why?)
  // Second step of a numeric quiz: name the reason, close the checkpoint.
  // Mirrors labs-render.js renderFollowUp for the self-rendered lab 01.
  function renderFollowUpLab1(root, fu, quizId, solvedNow) {
    var LETTERS = ["A", "B", "C", "D", "E"];
    var ru = document.documentElement.dataset.lang === "ru";
    var trField = function (f) { return (typeof f === "string") ? f : (f[ru ? "ru" : "en"] || f.en || ""); };
    var wrap = document.createElement("div"); wrap.className = "lab-follow";
    var q = document.createElement("p"); q.className = "lab-follow-q"; q.textContent = trField(fu.q);
    wrap.appendChild(q);
    var list = document.createElement("div"); list.className = "lab-follow-options";
    var fuVerdict = document.createElement("p"); fuVerdict.className = "lab-verdict";
    fuVerdict.setAttribute("aria-live", "polite");
    var explain = document.createElement("p"); explain.className = "lab-follow-explain";
    var solved = !!solvedNow;
    var attempts = 0;
    var pairs;
    if (window.LSMPosttest && window.LSMPosttest.shuffleOptions) {
      pairs = window.LSMPosttest.shuffleOptions(
        { id: quizId + ":fu", options: fu.options, answer: fu.answer }, "lab1:fu", 0);
    } else {
      pairs = fu.options.map(function (o, i) { return { opt: o, ok: i === fu.answer }; });
    }
    function mark() {
      var p = loadProgress(); p[quizId] = 1;
      try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) { /* private mode */ }
      renderProgress(true);
    }
    pairs.forEach(function (pair, i) {
      var btn = document.createElement("button");
      btn.type = "button"; btn.className = "lab-mc-opt";
      var letter = document.createElement("span"); letter.className = "lab-mc-letter";
      letter.textContent = LETTERS[i];
      var text = document.createElement("span"); text.className = "lab-mc-text";
      text.textContent = trField(pair.opt);
      btn.appendChild(letter); btn.appendChild(text);
      btn.addEventListener("click", function () {
        if (solved) return;
        attempts += 1;
        if (pair.ok) {
          solved = true;
          btn.classList.add("right");
          list.querySelectorAll(".lab-mc-opt").forEach(function (b) { b.disabled = true; });
          fuVerdict.dataset.state = "pass";
          fuVerdict.textContent = T.fuCorrect || "OK";
          explain.style.display = "block";
          explain.textContent = trField(fu.explain);
          mark();
        } else {
          btn.classList.add("wrong"); btn.disabled = true;
          fuVerdict.dataset.state = "fail";
          fuVerdict.textContent = T.fuFail || "not the cause";
        }
      });
      list.appendChild(btn);
    });
    if (solvedNow) {
      var okIndex = -1;
      pairs.forEach(function (p2, i) { if (p2.ok) okIndex = i; });
      var btns = list.querySelectorAll(".lab-mc-opt");
      btns.forEach(function (b) { b.disabled = true; });
      if (btns[okIndex]) btns[okIndex].classList.add("right");
      fuVerdict.dataset.state = "pass";
      fuVerdict.textContent = T.fuCorrect || "OK";
      explain.style.display = "block";
      explain.textContent = trField(fu.explain);
    }
    wrap.appendChild(list); wrap.appendChild(fuVerdict); wrap.appendChild(explain);
    root.appendChild(wrap);
  }

  // ------------------------------------------------------------- challenge
  // ★ report-mode challenge on the lab's own declared model: the student
  // experiments with the sandbox and reports a configuration + measurement;
  // the page replays the arithmetic (jitter-tolerant) and checks the goal.
  var CHALLENGE = {
    title: { en: "★ Fit a warm answer in 3 s with ≥ 40 tokens", ru: "★ Уложи тёплый ответ в 3 с при ≥ 40 токенах" },
    brief: {
      en: "The declared model is yours to search: pick a prompt length and <code>max_tokens</code> so a WARM answer (Exercise 1's form, cold unchecked) finishes within <strong>3 s</strong> while producing <strong>≥ 40 tokens</strong>. No tests guide you: experiment, read your own metrics, report what you measured — the page replays the arithmetic with the declared jitter tolerance.",
      ru: "Заявленная модель — твоя для поиска: подбери длину промпта и <code>max_tokens</code> так, чтобы ТЁПЛЫЙ ответ (форма упражнения 1, без галочки cold) уложился в <strong>3 с</strong>, выдав <strong>≥ 40 токенов</strong>. Тестов-каркаса нет: экспериментируй, читай свои метрики, отчитывайся об измеренном — страница пересчитывает арифметику с заявленным допуском на джиттер.",
    },
    goal: {
      en: "Report one line of your experiment: prompt characters, max_tokens, and the «Last token» seconds of the warm run.",
      ru: "Отчитайся одной строкой своего эксперимента: символов в промпте, max_tokens и секунды метрики «Последний токен» тёплого прогона.",
    },
    fields: [
      { key: "chars", label: { en: "prompt characters", ru: "символов в промпте" } },
      { key: "n", label: { en: "max_tokens", ru: "max_tokens" } },
      { key: "total", label: { en: "last token, s (your metric)", ru: "последний токен, с (твоя метрика)" } },
    ],
    check: function (v) {
      var chars = parseInt(String(v.chars || ""), 10);
      var n = parseInt(String(v.n || ""), 10);
      var total = parseFloat(String(v.total || "").replace(",", "."));
      if (![chars, n].every(Number.isFinite) || !isFinite(total)) {
        return { ok: false, note: { en: "fill every field with numbers (the seconds accept a comma)", ru: "заполни все поля числами (секунды можно с запятой)" } };
      }
      var tokens = Math.max(1, Math.ceil(chars / 4));
      if (tokens > 512) {
        return { ok: false, note: { en: "the prompt exceeds the declared 512-token limit", ru: "промпт превышает заявленный лимит в 512 токенов" } };
      }
      if (!Number.isInteger(n) || n < 1 || n > 256) {
        return { ok: false, note: { en: "max_tokens must be an integer from 1 to 256 — the gateway would 400 this", ru: "max_tokens — целое от 1 до 256 — иначе шлюз ответил бы 400" } };
      }
      var base = (40 + 0.625 * tokens + 60 * (n - 1)) / 1000;
      if (n < 40) {
        return { ok: false, note: { en: "only " + n + " tokens - the goal asks for >= 40", ru: "всего " + n + " токенов — цель требует ≥ 40" } };
      }
      if (base > 3) {
        return { ok: false, note: { en: "the model gives " + base.toFixed(2) + " s for that shape - over the 3 s budget; shorten the prompt or the answer", ru: "модель даёт " + base.toFixed(2) + " с для такой формы — за бюджетом 3 с; укороти промпт или ответ" } };
      }
      if (Math.abs(total - base) > 0.12 * base) {
        return { ok: false, note: { en: "your reported " + total + " s is too far from the model's " + base.toFixed(2) + " s (±10 % jitter) - run the experiment and report ITS metric", ru: "твои " + total + " с слишком далеко от модельных " + base.toFixed(2) + " с (джиттер ±10 %) — прогони эксперимент и отчитайся ЕГО метрикой" } };
      }
      return { ok: true, note: { en: chars + " chars ≈ " + tokens + " tokens + " + n + " output: nominal " + base.toFixed(2) + " s ≤ 3 s — the goal is met with " + (3 - base).toFixed(2) + " s to spare", ru: chars + " символов ≈ " + tokens + " токенов + " + n + " на выходе: номинально " + base.toFixed(2) + " с ≤ 3 с — цель достигнута с запасом " + (3 - base).toFixed(2) + " с" } };
    },
    reference: `# The algebra: warm wall = (40 + 0.625 * prompt_tokens + 60 * (n - 1)) / 1000 s.
# A 400-character prompt is ~100 tokens; the answer needs >= 40 tokens.
n = 40
prompt_tokens = 100
wall_s = (40 + 0.625 * prompt_tokens + 60 * (n - 1)) / 1000
print(wall_s)   # 2.396 s - fits with 0.6 s to spare
# Longer answers cost 60 ms each - the step dominates, so the tightest
# legal shape is a short prompt and exactly 40 output tokens. Anything
# beyond n = 49 breaks the budget no matter how short the prompt is.`,
  };

  function initChallengeLab1() {
    var host = document.querySelector("[data-lab-challenge]");
    if (!host) return;
    var section = document.querySelector("[data-lab-challenge-section]");
    if (section) section.hidden = false;
    var ru = document.documentElement.dataset.lang === "ru";
    var trField = function (f) { return (typeof f === "string") ? f : (f[ru ? "ru" : "en"] || f.en || ""); };
    var card = document.createElement("div"); card.className = "lab-card lab-challenge";
    var head = document.createElement("div"); head.className = "lab-ch-head";
    var star = document.createElement("span"); star.className = "lab-ch-star"; star.textContent = "★";
    var word = document.createElement("span"); word.className = "lab-ch-word";
    word.textContent = ru ? "челлендж" : "challenge";
    var att = document.createElement("span"); att.className = "lab-ch-att";
    head.appendChild(star); head.appendChild(word); head.appendChild(att);
    card.appendChild(head);
    var h3 = document.createElement("h3"); h3.textContent = trField(CHALLENGE.title); card.appendChild(h3);
    var brief = document.createElement("p"); brief.innerHTML = trField(CHALLENGE.brief); card.appendChild(brief);
    var goal = document.createElement("p"); goal.className = "lab-ch-goal"; goal.innerHTML = trField(CHALLENGE.goal); card.appendChild(goal);

    var attempts = 0;
    var KEYCH = "ch:chal1";
    var ATT = "ch:chal1:att";
    function showAttempts() {
      att.textContent = attempts ? (ru ? "проверок: " + attempts : "checks: " + attempts) : "";
    }
    function bump() {
      attempts += 1;
      var p = loadProgress(); p[ATT] = attempts;
      try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) {}
      showAttempts();
    }
    attempts = Number(loadProgress()[ATT] || 0);
    showAttempts();

    var fieldsWrap = document.createElement("div"); fieldsWrap.className = "lab-ch-fields";
    CHALLENGE.fields.forEach(function (f) {
      var w = document.createElement("label"); w.className = "lab-ch-field";
      var lab = document.createElement("span"); lab.textContent = trField(f.label);
      var inp = document.createElement("input");
      inp.type = "text"; inp.setAttribute("aria-label", trField(f.label));
      inp.dataset.chField = f.key;
      w.appendChild(lab); w.appendChild(inp);
      fieldsWrap.appendChild(w);
    });
    card.appendChild(fieldsWrap);
    var controls = document.createElement("div"); controls.className = "lab-controls";
    var checkBtn = document.createElement("button"); checkBtn.type = "button"; checkBtn.className = "button";
    checkBtn.textContent = T.chCheck || "Check";
    controls.appendChild(checkBtn);
    var refBtn = document.createElement("button"); refBtn.type = "button";
    refBtn.className = "button secondary"; refBtn.hidden = true;
    refBtn.textContent = ru ? "Показать эталон" : "Show solution";
    controls.appendChild(refBtn);
    card.appendChild(controls);
    var verdict = document.createElement("p"); verdict.className = "lab-verdict";
    verdict.setAttribute("aria-live", "polite");
    card.appendChild(verdict);
    var note = document.createElement("p"); note.className = "lab-ch-note"; card.appendChild(note);
    var refBox = document.createElement("pre"); refBox.className = "lab-solution";
    refBox.style.display = "none";
    card.appendChild(refBox);
    refBtn.addEventListener("click", function () {
      if (refBox.style.display === "none") {
        refBox.textContent = CHALLENGE.reference;
        refBox.style.display = "block";
      } else {
        refBox.style.display = "none";
      }
    });
    checkBtn.addEventListener("click", function () {
      var values = {};
      card.querySelectorAll("[data-ch-field]").forEach(function (inp) {
        values[inp.dataset.chField] = inp.value.trim();
      });
      bump();
      var r = CHALLENGE.check(values) || { ok: false };
      note.textContent = r.note ? trField(r.note) : "";
      if (r.ok) {
        var p = loadProgress(); p[KEYCH] = 1;
        try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) {}
        verdict.dataset.state = "pass";
        verdict.textContent = T.chSolved || "challenge solved";
        refBtn.hidden = false;
        renderProgress(true);
      } else {
        verdict.dataset.state = "fail";
        verdict.textContent = T.chNotYet || "goal not met";
      }
    });
    if (loadProgress()[KEYCH]) {
      verdict.dataset.state = "pass";
      verdict.textContent = T.chSolved || "challenge solved";
      refBtn.hidden = false;
    }
    host.appendChild(card);
  }

  // ------------------------------------------------------------------ init
  document.addEventListener("DOMContentLoaded", function () {
    if (window.LSMPosttest && window.LAB1_POSTTEST) {
      var host = document.querySelector("[data-lab-posttest-host]");
      if (host) {
        window.LSMPosttest.render(host, window.LAB1_POSTTEST, {
          lang: (document.documentElement.dataset.lang === "ru") ? "ru" : "en",
          onCorrect: markDone,
        });
      }
    }
    // after the post-test render: its p1–p3 dots exist only once rendered,
    // painting them earlier left them grey after reload with progress at 9/9
    renderProgress();
    initLifecycle();
    initQuiz("q1", 16.16, 0.5, "s");
    initQuiz("q2", 160, 10, "ms");
    initQuiz("q3", 3.94, 0.12, "s");
    initEx1(); initEx2(); initEx3();
    initChallengeLab1();
  });
})();
