/* labs-render.js — generic renderer for data-driven practice labs (labs 02–10).
   The page provides window.LAB_META = {lab, lang, t}; a content module provides
   window.LABS_CONTENT[lab]. Renders intro, model table, predict quizzes and
   Python exercises with LeetCode-style tests. Practice only: progress in
   localStorage, never course evidence. */
(function () {
  "use strict";

  const META = window.LAB_META || {};
  const lang = META.lang || "en";
  const T = META.t || {};
  const labId = META.lab;
  const content = (window.LABS_CONTENT || {})[labId];

  const KEY = "lsm.lab" + labId;
  const IDS = [];

  function tr(field) {
    if (field == null) return "";
    return typeof field === "string" ? field : (field[lang] || field.en || "");
  }

  function loadProgress() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
  }
  function markDone(id) {
    const p = loadProgress(); p[id] = 1;
    try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) { /* private mode */ }
    renderProgress();
  }
  function renderProgress() {
    const p = loadProgress();
    const n = IDS.filter((id) => p[id]).length;
    const fill = document.querySelector("[data-lab-progress-fill]");
    const count = document.querySelector("[data-lab-progress-count]");
    if (fill) fill.style.width = (100 * n / Math.max(1, IDS.length)) + "%";
    if (count) count.textContent = n + " / " + IDS.length;
    IDS.forEach((id) => {
      const el = document.querySelector('[data-lab-checkpoint="' + id + '"]');
      if (el) {
        el.dataset.state = p[id] ? "pass" : "";
        const dot = el.querySelector(".lab-dot");
        if (dot) dot.classList.toggle("done", !!p[id]);
      }
    });
    // reward unlocks at 100 % (labs declare content.reward with a caption)
    const reward = document.querySelector("[data-lab-reward]");
    if (reward && IDS.length && n === IDS.length && reward.dataset.open !== "1") {
      reward.dataset.open = "1";
      startReward(reward);
    }
  }

  // Seeded "tokens through the serving path" animation — the lab completion
  // reward. Deterministic, lightweight, honest: it decorates, it measures nothing.
  function startReward(host) {
    const canvas = host.querySelector("canvas");
    const caption = host.querySelector(".lab-reward-caption");
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext("2d");
    const spec = (window.LABS_CONTENT || {})[labId] || {};
    const captionText = tr((spec.reward || {}).caption) || (lang === "ru" ? "Лаба пройдена полностью." : "Lab completed.");
    if (caption) caption.textContent = captionText;
    let seed = (parseInt(labId, 10) || 1) * 7919;
    const rnd = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
    const W = canvas.width = Math.max(320, canvas.clientWidth * (window.devicePixelRatio || 1));
    const H = canvas.height = Math.max(120, canvas.clientHeight * (window.devicePixelRatio || 1));
    const xs = [0.08, 0.36, 0.64, 0.92];
    const labels = lang === "ru" ? ["клиент", "edge", "движок", "токены"] : ["client", "edge", "engine", "tokens"];
    const tokens = Array.from({ length: 14 }, () => ({
      x: rnd() * W, lane: 0.3 + rnd() * 0.4, v: 0.6 + rnd() * 1.2, r: 2 + rnd() * 2.5,
    }));
    let t0 = null;
    function draw(ts) {
      if (!t0) t0 = ts;
      ctx.clearRect(0, 0, W, H);
      const accent = (getComputedStyle(document.documentElement).getPropertyValue("--accent") || "#2A6FDB").trim();
      const ink = (getComputedStyle(document.documentElement).getPropertyValue("--ink") || "#14181F").trim();
      ctx.strokeStyle = ink; ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.moveTo(xs[0] * W, H / 2); ctx.lineTo(xs[xs.length - 1] * W, H / 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
      xs.forEach((x, i) => {
        ctx.fillStyle = accent;
        ctx.beginPath(); ctx.arc(x * W, H / 2, 9, 0, 7); ctx.fill();
        ctx.fillStyle = ink;
        ctx.font = Math.round(H * 0.09) + "px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(labels[i] || "", x * W, H / 2 + 26);
      });
      tokens.forEach((tk) => {
        tk.x += tk.v * (H * 0.01);
        if (tk.x > W) tk.x = -10;
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = accent;
        ctx.beginPath();
        ctx.arc(tk.x, H / 2 + Math.sin(tk.x / 60 + tk.lane * 9) * H * 0.08, tk.r, 0, 7);
        ctx.fill();
        ctx.globalAlpha = 1;
      });
      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  }

  function el(tag, cls, html) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (html != null) node.innerHTML = html;
    return node;
  }

  // ---------------------------------------------------------------- quizzes
  function renderQuiz(root, q) {
    IDS.push(q.id);
    const card = el("div", "lab-card lab-quiz lab-exercise");
    card.dataset.labQuiz = q.id;
    card.dataset.labCheckpoint = q.id;
    const unit = tr(q.unit) || "";
    card.appendChild(el("span", "lab-ex-status", q.id.toUpperCase()));
    card.appendChild(el("h3", "", tr(q.q)));
    const row = el("div", "lab-answer-row");
    const input = document.createElement("input");
    input.type = "text"; input.inputMode = "decimal"; input.setAttribute("aria-label", tr(q.answer) || T.answer);
    row.appendChild(input);
    if (unit) row.appendChild(el("span", "lab-unit", unit));
    const check = el("button", "button", tr(q.check) || T.check);
    check.type = "button";
    row.appendChild(check);
    if (q.hint) {
      const hb = el("button", "button secondary", tr(q.hintBtn) || T.hint);
      hb.type = "button"; hb.dataset.labHintBtn = "";
      row.appendChild(hb);
    }
    card.appendChild(row);
    const verdict = el("p", "lab-verdict"); verdict.setAttribute("aria-live", "polite");
    card.appendChild(verdict);
    if (q.hint) {
      const hint = el("p", "lab-hint"); hint.dataset.open = "0";
      hint.textContent = tr(q.hint);
      card.appendChild(hint);
    }
    function doCheck() {
      const v = parseFloat(String(input.value).replace(",", "."));
      if (!isFinite(v)) { verdict.dataset.state = "fail"; verdict.textContent = T.vNum; return; }
      if (Math.abs(v - q.answer) <= q.tol) {
        verdict.dataset.state = "pass";
        verdict.textContent = T.vPass + " (≈ " + q.answer + " " + unit + ")";
        markDone(q.id);
      } else {
        verdict.dataset.state = "fail";
        verdict.textContent = Math.abs(v - q.answer) <= q.tol * 3 ? T.vClose : T.vFail;
      }
    }
    check.addEventListener("click", doCheck);
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") doCheck(); });
    if (q.hint) card.querySelector("[data-lab-hint-btn]").addEventListener("click", () => {
      hint.dataset.open = hint.dataset.open === "1" ? "0" : "1";
    });
    root.appendChild(card);
  }

  // ------------------------------------------------------------- exercises
  function renderExercise(root, ex) {
    IDS.push(ex.id);
    const card = el("div", "lab-card lab-exercise lab-code");
    card.dataset.labCheckpoint = ex.id;
    card.appendChild(el("span", "lab-dot", ""));
    card.appendChild(el("span", "lab-ex-status", ex.id.toUpperCase()));
    card.appendChild(el("h3", "", tr(ex.title)));
    card.appendChild(el("p", "", tr(ex.brief)));

    const grid = el("div", "lab-editor");
    const mkPanel = (titleText) => {
      const panel = el("div", "lab-panel");
      const bar = el("div", "lab-panel-bar");
      bar.appendChild(el("i", "")); bar.appendChild(el("i", "")); bar.appendChild(el("i", ""));
      bar.appendChild(el("span", "lab-panel-title", titleText));
      panel.appendChild(bar);
      return panel;
    };
    const leftPanel = mkPanel(T.editor);
    const ta = document.createElement("textarea");
    ta.spellcheck = false;
    ta.value = tr(ex.starter);
    ta.setAttribute("aria-label", T.editor);
    let editor = null; // CodeMirror instance when the vendor is available
    const getCode = () => (editor ? editor.getValue() : ta.value);
    const setCode = (v) => { if (editor) editor.setValue(v); else ta.value = v; };
    ta.addEventListener("keydown", (e) => {
      if (e.key === "Tab" && !editor) {
        e.preventDefault();
        const s = ta.selectionStart, epos = ta.selectionEnd;
        ta.value = ta.value.slice(0, s) + "  " + ta.value.slice(epos);
        ta.selectionStart = ta.selectionEnd = s + 2;
      }
    });
    leftPanel.appendChild(ta);
    // Upgrade to CodeMirror when the vendored editor is on the page.
    if (window.CodeMirror) {
      editor = window.CodeMirror.fromTextArea(ta, {
        mode: "python", lineNumbers: true, indentUnit: 4, viewportMargin: 12, theme: "dracula",
      });
      editor.setSize("100%", "296px");
    }
    grid.appendChild(leftPanel);

    const rightPanel = mkPanel(T.tests);
    const results = el("div", "lab-tests");
    results.style.padding = "0.6rem 0.8rem 0";
    rightPanel.appendChild(results);
    const stdoutBox = el("div", "lab-timeline");
    stdoutBox.setAttribute("aria-live", "polite");
    rightPanel.appendChild(stdoutBox);
    grid.appendChild(rightPanel);
    card.appendChild(grid);

    const controls = el("div", "lab-controls");
    const runBtn = el("button", "button", T.run);
    runBtn.type = "button"; runBtn.dataset.labRun = "";
    controls.appendChild(runBtn);
    const resetBtn = el("button", "button secondary", T.reset);
    resetBtn.type = "button";
    resetBtn.addEventListener("click", () => { setCode(tr(ex.starter)); results.innerHTML = ""; stdoutBox.textContent = ""; });
    controls.appendChild(resetBtn);
    (ex.hints || []).forEach((h) => {
      const hb = el("button", "button secondary", T.hint || "Hint");
      hb.type = "button";
      const shown = el("p", "lab-hint"); shown.dataset.open = "0"; shown.textContent = tr(h);
      hb.addEventListener("click", () => { shown.dataset.open = shown.dataset.open === "1" ? "0" : "1"; });
      controls.appendChild(hb);
      card.appendChild(shown);
    });
    const solBtn = el("button", "button secondary", T.solution);
    solBtn.type = "button"; solBtn.style.display = "none"; solBtn.dataset.labSolutionBtn = "";
    controls.appendChild(solBtn);
    card.appendChild(controls);
    const solution = el("pre", "lab-solution"); solution.style.display = "none"; solution.dataset.labSolution = "";
    card.appendChild(solution);

    function appendOut(text, cls) {
      const line = el("div", cls, "");
      line.textContent = text;
      stdoutBox.appendChild(line);
      stdoutBox.scrollTop = stdoutBox.scrollHeight;
    }

    // one Pyodide worker serves all exercises: while a run is in flight every
    // Run button is locked, otherwise a parallel run kills the first one's timer
    const lockRuns = (on) => document.querySelectorAll("[data-lab-run]").forEach((b) => { b.disabled = !on; });

    runBtn.addEventListener("click", async () => {
      // lock BEFORE any await: two clicks inside the prepareExercise window
      // would both reach the single Pyodide worker and corrupt each other's run
      lockRuns(false);
      // layer-2 exercises need the live journal injected from the local runtime;
      // offline, fall back to the declared synthetic fixture when the content
      // ships one (marked in the output — a fixture is never evidence)
      if (ex.injectEntries && window.LSMRuntime) {
        const ready = await window.LSMRuntime.prepareExercise(ex, { get value() { return getCode(); }, set value(v) { setCode(v); } });
        if (!ready || !ready.ok) {
          results.innerHTML = "";
          appendOut(T.runtimeOffline, "err");
          lockRuns(true);
          return;
        }
        if (ready.fixture) appendOut(T.fixtureNote, "err");
      }
      results.innerHTML = "";
      stdoutBox.textContent = "";
      appendOut(T.loading);
      const started = Date.now();
      const res = await window.LSMPython.run(getCode(), ex.tests || [], {
        numpy: !!ex.numpy, timeoutMs: ex.timeoutMs || 4000,
      });
      const wall = ((Date.now() - started) / 1000).toFixed(1);

      if (res.status === "timeout") {
        appendOut(T.timeout.replace("{s}", wall), "err");
        results.appendChild(el("p", "lab-verdict", "")).dataset.state = "fail";
        results.querySelector(".lab-verdict").textContent = T.timeoutShort;
        lockRuns(true);
        return;
      }
      if (res.status === "runner-error") {
        appendOut(T.runnerError + " " + (res.error || ""), "err");
        lockRuns(true);
        return;
      }
      appendOut(T.done.replace("{s}", wall), "ok");

      if (res.status === "syntax" || res.status === "error") {
        appendOut((res.error || "error"), "err");
        results.appendChild(el("p", "lab-note", res.status === "syntax" ? T.syntax : T.exception));
        lockRuns(true);
        return;
      }

      let allPass = true;
      let hiddenFail = 0;
      let visibleFail = 0;
      (res.results || []).forEach((r, i) => {
        const row = el("div", "lab-test " + (r.passed ? "pass" : "fail"));
        const label = r.hidden ? T.hiddenTest + " " + (i + 1) : r.name;
        row.appendChild(el("span", "lab-test-mark", r.passed ? "✓" : "✗"));
        row.appendChild(el("span", "lab-test-name", label));
        if (!r.passed) {
          allPass = false;
          if (r.hidden) { hiddenFail += 1; }
          else { visibleFail += 1; row.appendChild(el("span", "lab-test-msg", r.message || "")); }
        }
        results.appendChild(row);
      });
      if (res.stdout) {
        appendOut("─── " + T.stdout + " ───", "");
        res.stdout.split("\n").forEach((ln) => appendOut(ln, ""));
        if (res.stdout.split("\n").length >= 200) appendOut(T.stdoutTrunc, "err");
      }

      const verdict = el("p", "lab-verdict");
      if (allPass) {
        verdict.dataset.state = "pass";
        verdict.textContent = T.allPass;
        markDone(ex.id);
        solBtn.style.display = "";
      } else {
        verdict.dataset.state = "fail";
        verdict.textContent = visibleFail > 0
          ? T.someFail
          : T.hiddenFail.replace("{n}", String(hiddenFail));
      }
      results.appendChild(verdict);
      lockRuns(true);
    });

    solBtn.addEventListener("click", () => {
      const box = card.querySelector("[data-lab-solution]");
      if (box.style.display === "none") {
        box.textContent = ex.solution || "";
        box.style.display = "block";
        solBtn.textContent = T.hideSolution;
      } else {
        box.style.display = "none";
        solBtn.textContent = T.solution;
      }
    });

    root.appendChild(card);
  }


  // ------------------------------------------------------------------- hero
  // Seeded "requests → edge → engine → tokens" flow, one accent color per lab.
  function renderHero(host, accent, captionText) {
    const canvas = host.querySelector("canvas");
    if (!canvas) return;
    const caption = host.querySelector("[data-lab-hero-caption]");
    if (caption && captionText) caption.textContent = captionText;
    if (window.LSMHero) {
      const labels = lang === "ru"
        ? ["клиент", "edge", "движок", "токены"]
        : ["client", "edge", "engine", "tokens"];
      window.LSMHero.mount(canvas, accent, labels, (parseInt(labId, 10) || 1) * 9176 + 13);
    }
  }

  // ------------------------------------------------------------------ init
  document.addEventListener("DOMContentLoaded", () => {
    if (!content) {
      const root = document.querySelector("[data-lab-root]");
      if (root) root.appendChild(el("p", "lab-note", T.noContent || "content module missing"));
      return;
    }
    window.LSMPython && window.LSMPython.setLang(lang);
    const intro = document.querySelector("[data-lab-intro]");
    if (intro) intro.innerHTML = tr(content.intro);
    const glHost = document.querySelector("[data-lab-glossary-host]");
    if (glHost && (content.glossary || []).length) {
      const table = el("table", "lab-model-table lab-glossary-table");
      content.glossary.forEach((row) => {
        const tr_ = document.createElement("tr");
        for (let i = 0; i < row.length; i += 2) {
          const th = document.createElement("th"); th.textContent = tr(row[i]);
          const td = document.createElement("td"); td.textContent = tr(row[i + 1]);
          tr_.appendChild(th); tr_.appendChild(td);
        }
        table.appendChild(tr_);
      });
      glHost.appendChild(table);
    }
    const modelHost = document.querySelector("[data-lab-model]");
    if (modelHost && content.model) {
      const table = el("table", "lab-model-table");
      content.model.forEach((row) => {
        const tr_ = document.createElement("tr");
        for (let i = 0; i < row.length; i += 2) {
          const th = document.createElement("th"); th.textContent = tr(row[i]);
          const td = document.createElement("td"); td.textContent = tr(row[i + 1]);
          tr_.appendChild(th); tr_.appendChild(td);
        }
        table.appendChild(tr_);
      });
      modelHost.appendChild(table);
    }
    const figHost = document.querySelector("[data-lab-figures]");
    if (figHost && (content.figures || []).length) {
      figHost.hidden = false;
      content.figures.forEach((f) => {
        if (window.LSMFigures && f.stages && f.svg) {
          window.LSMFigures.mount(figHost, f, lang);
          return;
        }
        // legacy static fallback (lecture assets) — kept for safety
        const fig = el("figure", "lab-figure");
        const img = document.createElement("img");
        img.loading = "lazy";
        img.src = "/llm-serving-mastery/Lectures/assets/figures/" + f.id + "-dark.svg";
        img.alt = tr(f.caption);
        fig.appendChild(img);
        fig.appendChild(el("figcaption", "", tr(f.caption)));
        figHost.appendChild(fig);
      });
    }
    const outcomesHost = document.querySelector("[data-lab-outcomes]");
    if (outcomesHost && (content.outcomes || []).length) {
      outcomesHost.hidden = false;
      outcomesHost.appendChild(el("h2", "", T.outcomesH || "Learning outcomes"));
      const list = el("ul", "reading");
      content.outcomes.forEach((o) => list.appendChild(el("li", "", tr(o))));
      outcomesHost.appendChild(list);
    }
    const postHost = document.querySelector("[data-lab-posttest-host]");
    if (postHost && (content.posttest || []).length) {
      const ptSection = document.querySelector("[data-lab-posttest]");
      if (ptSection) ptSection.hidden = false;
      (content.posttest || []).forEach((it) => IDS.push(it.id));
      window.LSMPosttest.render(postHost, content.posttest, {
        lang,
        seedPrefix: labId,
        onCorrect: (id) => {
          const p = loadProgress(); p[id] = 1;
          try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) {}
          renderProgress();
        },
      });
      // IDS уже содержит posttest-ids: перерисовать прогресс после регистрации
      renderProgress();
    }
    const quizRoot = document.querySelector("[data-lab-quizzes]");
    (content.quizzes || []).forEach((q) => renderQuiz(quizRoot, q));
    const exRoot = document.querySelector("[data-lab-exercises]");
    (content.exercises || []).forEach((ex) => renderExercise(exRoot, ex));
    const heroHost = document.querySelector("[data-lab-hero]");
    if (heroHost) renderHero(heroHost, null, tr(content.heroCaption) || "");
    const footer = document.querySelector("[data-lab-footer]");
    if (footer) footer.textContent = tr(content.footer) || "";
    renderProgress();
    // preload the runner after first paint so the first Run is fast
    if (window.LSMPython) setTimeout(() => window.LSMPython.preload(), 1500);
  });
})();
