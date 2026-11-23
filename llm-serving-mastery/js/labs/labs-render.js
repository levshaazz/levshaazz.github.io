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
    renderProgress(true);
  }
  function renderProgress(live) {
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
      // бейдж у полосы прогресса (L1a-5): reward живёт внизу страницы —
      // на reload без скролла, при живом завершении — плавный скролл к нему
      const badge = document.querySelector("[data-lab-reward-badge]");
      if (badge) badge.hidden = false;
      if (live) reward.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    // ★-челлендж живёт ВНЕ счёта чекпойнтов: свой бейдж у полосы прогресса
    const chBadge = document.querySelector("[data-lab-challenge-badge]");
    if (chBadge) {
      const chSolved = Object.keys(p).some((k) => k.indexOf("ch:") === 0 && p[k] === 1);
      chBadge.hidden = !chSolved;
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

  // ------------------------------------------------- quiz follow-up (why?)
  // Second step of a numeric quiz: after the correct number the student names
  // WHY it is correct — picks the true cause out of SOLO distractors. The
  // checkpoint closes only after the reason is right (POE: the number alone
  // can come from plugging into a formula without understanding).
  function renderFollowUp(card, q, quizIndex, solvedNow) {
    const fu = q.followUp;
    const LETTERS = ["A", "B", "C", "D", "E"];
    const wrap = el("div", "lab-follow");
    wrap.appendChild(el("p", "lab-follow-q", tr(fu.q)));
    const pairs = (window.LSMPosttest && window.LSMPosttest.shuffleOptions)
      ? window.LSMPosttest.shuffleOptions(fu, labId + ":fu", quizIndex)
      : fu.options.map((opt, i) => ({ opt, ok: i === fu.answer }));
    const list = el("div", "lab-follow-options");
    const fuVerdict = el("p", "lab-verdict");
    fuVerdict.setAttribute("aria-live", "polite");
    const explain = el("p", "lab-follow-explain");
    let solved = !!solvedNow;
    let attempts = 0;
    pairs.forEach((pair, i) => {
      const btn = el("button", "lab-mc-opt");
      btn.type = "button";
      btn.appendChild(el("span", "lab-mc-letter", LETTERS[i]));
      btn.appendChild(el("span", "lab-mc-text", tr(pair.opt)));
      btn.addEventListener("click", () => {
        if (solved) return;
        attempts += 1;
        if (pair.ok) {
          solved = true;
          btn.classList.add("right");
          list.querySelectorAll(".lab-mc-opt").forEach((b) => { b.disabled = true; });
          fuVerdict.dataset.state = "pass";
          fuVerdict.textContent = T.fuCorrect + (attempts > 1 ? " · " + (lang === "ru" ? "с " + attempts + "-й попытки" : "on attempt " + attempts) : "");
          explain.style.display = "block";
          explain.textContent = tr(fu.explain);
          markDone(q.id);
        } else {
          btn.classList.add("wrong");
          btn.disabled = true;
          fuVerdict.dataset.state = "fail";
          fuVerdict.textContent = T.fuFail;
        }
      });
      list.appendChild(btn);
    });
    if (solvedNow) {
      const okIndex = pairs.findIndex((p2) => p2.ok);
      const btns = list.querySelectorAll(".lab-mc-opt");
      btns.forEach((b) => { b.disabled = true; });
      if (btns[okIndex]) btns[okIndex].classList.add("right");
      fuVerdict.dataset.state = "pass";
      fuVerdict.textContent = T.fuCorrect;
      explain.style.display = "block";
      explain.textContent = tr(fu.explain);
    }
    wrap.appendChild(list);
    wrap.appendChild(fuVerdict);
    wrap.appendChild(explain);
    card.appendChild(wrap);
  }

  // ------------------------------------------------------ Parsons problems
  // Assemble-the-solution step between quizzes and exercises (market backlog
  // wave 3): click a bank step to place it, click a placed step to return it,
  // arrows to reorder — no drag-and-drop, fully keyboard operable. Distractors
  // are pool entries absent from `solution`.
  function renderParsons(root, p) {
    IDS.push(p.id);
    const card = el("div", "lab-card lab-exercise lab-parsons");
    card.dataset.labCheckpoint = p.id;
    card.appendChild(el("span", "lab-ex-status", p.id.toUpperCase()));
    card.appendChild(el("h3", "", tr(p.title)));
    card.appendChild(el("p", "", tr(p.brief)));
    const bank = el("div", "lab-parsons-bank");
    const seq = el("div", "lab-parsons-seq");
    card.appendChild(el("p", "lab-parsons-head", T.parsonsBank));
    card.appendChild(bank);
    card.appendChild(el("p", "lab-parsons-head", T.parsonsSeq));
    card.appendChild(seq);
    const row = el("div", "lab-answer-row");
    const check = el("button", "button", T.check);
    check.type = "button";
    row.appendChild(check);
    card.appendChild(row);
    const verdict = el("p", "lab-verdict");
    verdict.setAttribute("aria-live", "polite");
    card.appendChild(verdict);

    const stepLabel = (i) => tr(p.pool[i]);
    let placed = [];
    function renderBank() {
      bank.innerHTML = "";
      p.pool.forEach((_, i) => {
        if (placed.includes(i)) return;
        const b = document.createElement("button");
        b.type = "button"; b.className = "lab-parsons-step";
        b.textContent = stepLabel(i);
        b.setAttribute("aria-label", T.parsonsAdd + ": " + stepLabel(i));
        b.addEventListener("click", () => { placed.push(i); renderAll(); });
        bank.appendChild(b);
      });
      if (!bank.children.length) bank.appendChild(el("span", "lab-parsons-empty", T.parsonsBankEmpty));
    }
    function renderSeq() {
      seq.innerHTML = "";
      placed.forEach((idx, pos) => {
        const line = el("div", "lab-parsons-line");
        line.appendChild(el("span", "lab-parsons-num", (pos + 1) + "."));
        const b = document.createElement("button");
        b.type = "button"; b.className = "lab-parsons-step placed";
        b.textContent = stepLabel(idx);
        b.setAttribute("aria-label", T.parsonsRemove + ": " + stepLabel(idx));
        b.addEventListener("click", () => { placed.splice(pos, 1); renderAll(); });
        const up = el("button", "button secondary lab-parsons-move", "↑");
        up.type = "button";
        up.disabled = pos === 0;
        up.setAttribute("aria-label", T.parsonsUp + " " + (pos + 1));
        up.addEventListener("click", () => {
          const tmp = placed[pos - 1]; placed[pos - 1] = placed[pos]; placed[pos] = tmp;
          renderAll();
        });
        const down = el("button", "button secondary lab-parsons-move", "↓");
        down.type = "button";
        down.disabled = pos === placed.length - 1;
        down.setAttribute("aria-label", T.parsonsDown + " " + (pos + 1));
        down.addEventListener("click", () => {
          const tmp = placed[pos + 1]; placed[pos + 1] = placed[pos]; placed[pos] = tmp;
          renderAll();
        });
        line.appendChild(b);
        line.appendChild(up);
        line.appendChild(down);
        seq.appendChild(line);
      });
      if (!placed.length) seq.appendChild(el("span", "lab-parsons-empty", T.parsonsSeqEmpty));
    }
    function renderAll() {
      renderBank();
      renderSeq();
      verdict.dataset.state = "";
      verdict.textContent = "";
    }
    function doCheck() {
      const ok = placed.length === p.solution.length && placed.every((v, i) => v === p.solution[i]);
      if (ok) {
        placed = p.solution.slice();
        renderSeq();
        bank.innerHTML = "";
        bank.appendChild(el("span", "lab-parsons-empty", T.parsonsBankEmpty));
        check.disabled = true;
        verdict.dataset.state = "pass";
        verdict.textContent = T.parsonsPass;
        markDone(p.id);
      } else {
        verdict.dataset.state = "fail";
        verdict.textContent = T.parsonsFail;
      }
    }
    check.addEventListener("click", doCheck);
    root.appendChild(card);
    // solved view restores after reload, same contract as the quizzes (L1a-6)
    if (loadProgress()[p.id]) {
      placed = p.solution.slice();
      renderSeq();
      bank.innerHTML = "";
      bank.appendChild(el("span", "lab-parsons-empty", T.parsonsBankEmpty));
      check.disabled = true;
      verdict.dataset.state = "pass";
      verdict.textContent = T.parsonsPass;
    } else {
      renderAll();
    }
  }

  // ---------------------------------------------------------------- quizzes
  function renderQuiz(root, q, quizIndex) {
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
    let hint = null;
    if (q.hint) {
      hint = el("p", "lab-hint"); hint.dataset.open = "0";
      hint.textContent = tr(q.hint);
      card.appendChild(hint);
    }
    let fuOpened = false;
    function doCheck() {
      const v = parseFloat(String(input.value).replace(",", "."));
      if (!isFinite(v)) { verdict.dataset.state = "fail"; verdict.textContent = T.vNum; return; }
      if (Math.abs(v - q.answer) <= q.tol) {
        verdict.dataset.state = "pass";
        verdict.textContent = T.vPass + " (≈ " + q.answer + " " + unit + ")";
        if (q.followUp) {
          // число верное, но чекпойнт закрывается только после верной причины
          if (!fuOpened) { fuOpened = true; renderFollowUp(card, q, quizIndex, false); }
        } else {
          markDone(q.id);
        }
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
    // L1a-6: уже решённый квиз после reload восстанавливает вид решённого,
    // а не пустого (точки зелёные, а поле и вердикт — нет)
    if (loadProgress()[q.id]) {
      input.value = String(q.answer);
      verdict.dataset.state = "pass";
      verdict.textContent = T.vPass + " (≈ " + q.answer + " " + unit + ")";
      if (q.followUp) { fuOpened = true; renderFollowUp(card, q, quizIndex, true); }
    }
  }

  // CM5 editor with the a11y wrapper pattern; textarea fallback when the
  // vendor bundle is absent. Shared by exercises and the ★ challenge.
  function buildEditor(panel, labelText, initial) {
    const ta = document.createElement("textarea");
    ta.spellcheck = false;
    ta.value = initial;
    ta.setAttribute("aria-label", labelText);
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
    panel.appendChild(ta);
    // Upgrade to CodeMirror when the vendored editor is on the page.
    if (window.CodeMirror) {
      editor = window.CodeMirror.fromTextArea(ta, {
        mode: "python", lineNumbers: true, indentUnit: 4, viewportMargin: 12, theme: "dracula",
      });
      editor.setSize("100%", "296px");
      // CM5's contenteditable wrapper has no accessible name (axe rule "label").
      const cmWrap = editor.getWrapperElement();
      cmWrap.setAttribute("role", "textbox");
      cmWrap.setAttribute("aria-multiline", "true");
      cmWrap.setAttribute("aria-label", ta.getAttribute("aria-label") || labelText);
      // Keyboard-only students enter through the wrapper — without tabindex the
      // editors were unreachable by Tab. CM5 binds key handling to its hidden
      // textarea, so the wrapper forwards focus into it; the textarea itself
      // stays non-tabbable (it keeps its label so SR announces it on entry).
      cmWrap.setAttribute("tabindex", "0");
      let cmReenter = false;
      cmWrap.addEventListener("focus", () => {
        if (cmReenter) { cmReenter = false; return; }
        editor.focus();
      });
      // Tab is indentation inside CM — Esc hands focus back to the wrapper so
      // keyboard users can Tab on; without it the editor is a keyboard trap.
      editor.setOption("extraKeys", { Esc: () => { cmReenter = true; cmWrap.focus(); } });
      // CM5's offscreen measuring textarea must not join the Tab order.
      cmWrap.querySelectorAll("textarea").forEach(mt => {
        mt.setAttribute("tabindex", "-1");
        mt.setAttribute("aria-label", cmWrap.getAttribute("aria-label"));
      });
    }
    return { getCode, setCode };
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
    const { getCode, setCode } = buildEditor(leftPanel, T.editor, tr(ex.starter));
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
      // удалённый рантайм подключён? — скажи это честно в выводе, а не тихо
      const remote = window.LSMColab && window.LSMColab.active();
      appendOut(remote ? T.remoteLoading : T.loading);
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
      appendOut((remote ? T.remoteDone : T.done).replace("{s}", wall), "ok");

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


  // ------------------------------------------------------------- challenge
  // ★ Челлендж после капстоуна лабы: открытая цель без тестов-каркаса.
  // Проверка по результату (stdout / поля отчёта / честная само-декларация),
  // эталонное решение открывается только после решения. В счёт чекпойнтов
  // и reward не входит — у него свой бейдж у полосы прогресса.
  function renderChallenge(root, ch) {
    const card = el("div", "lab-card lab-challenge");
    const head = el("div", "lab-ch-head");
    head.appendChild(el("span", "lab-ch-star", "★"));
    head.appendChild(el("span", "lab-ch-word", tr(ch.word) || (lang === "ru" ? "челлендж" : "challenge")));
    head.appendChild(el("span", "lab-ch-att", ""));
    card.appendChild(head);
    card.appendChild(el("h3", "", tr(ch.title)));
    card.appendChild(el("p", "", tr(ch.brief)));
    card.appendChild(el("p", "lab-ch-goal", tr(ch.goal)));

    const solvedKey = "ch:" + ch.id;
    const attKey = "ch:" + ch.id + ":att";
    let attempts = Number(loadProgress()[attKey] || 0);
    const attEl = head.querySelector(".lab-ch-att");
    const showAttempts = () => {
      attEl.textContent = attempts
        ? (lang === "ru" ? "проверок: " + attempts : "checks: " + attempts)
        : "";
    };
    showAttempts();

    const controls = el("div", "lab-controls");
    const verdict = el("p", "lab-verdict");
    verdict.setAttribute("aria-live", "polite");
    const note = el("p", "lab-ch-note");
    const setNote = (r) => { note.textContent = r && r.note != null ? tr(r.note) : ""; };

    function bumpAttempts() {
      attempts += 1;
      const p = loadProgress(); p[attKey] = attempts;
      try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) { /* private mode */ }
      showAttempts();
    }
    function solve() {
      const p = loadProgress(); p[solvedKey] = 1;
      try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) { /* private mode */ }
      verdict.dataset.state = "pass";
      verdict.textContent = T.chSolved;
      const refBtn = card.querySelector("[data-lab-ch-ref-btn]");
      if (refBtn) refBtn.hidden = false;
      renderProgress(true);
    }

    if (ch.mode === "run") {
      // редактор без тест-панели: студент пишет код, печатающий метрики цели;
      // проверяет не каркас тестов, а сами напечатанные числа (ch.check(res))
      const grid = el("div", "lab-editor");
      const panel = el("div", "lab-panel");
      const bar = el("div", "lab-panel-bar");
      bar.appendChild(el("i", "")); bar.appendChild(el("i", "")); bar.appendChild(el("i", ""));
      bar.appendChild(el("span", "lab-panel-title", T.editor));
      panel.appendChild(bar);
      const ed = buildEditor(panel, T.editor, tr(ch.starter));
      grid.appendChild(panel);
      card.appendChild(grid);
      const out = el("div", "lab-timeline");
      out.setAttribute("aria-live", "polite");
      card.appendChild(out);
      const runBtn = el("button", "button", T.chRun || T.run);
      runBtn.type = "button";
      runBtn.addEventListener("click", async () => {
        runBtn.disabled = true;
        const remote = window.LSMColab && window.LSMColab.active();
        out.textContent = "";
        const line = (text, cls) => {
          const l = el("div", cls, ""); l.textContent = text;
          out.appendChild(l); out.scrollTop = out.scrollHeight;
        };
        line(remote ? T.remoteLoading : T.loading, "");
        bumpAttempts();
        let res;
        try {
          res = await window.LSMPython.run(ed.getCode(), [], {
            numpy: !!ch.numpy, timeoutMs: ch.timeoutMs || 60000,
          });
        } catch (e) {
          res = { status: "runner-error", error: String(e), results: [], stdout: "" };
        }
        out.textContent = "";
        (res.stdout || "").split("\n").forEach((ln) => line(ln, ""));
        if (res.status === "timeout") line(T.timeoutShort, "err");
        else if (res.status === "runner-error") line(T.runnerError + " " + (res.error || ""), "err");
        else if (res.status === "syntax" || res.status === "error") line(res.error || "error", "err");
        let r;
        try { r = ch.check(res) || { ok: false }; } catch (e) { r = { ok: false, note: String(e.message || e) }; }
        setNote(r);
        if (r.ok && res.status !== "timeout") solve();
        else { verdict.dataset.state = "fail"; verdict.textContent = T.chNotYet; }
        runBtn.disabled = false;
      });
      controls.appendChild(runBtn);
    } else if (ch.mode === "report") {
      // свои числа из живого слоя-2 или внешнего прогона: поля отчёта +
      // правдоподобие (диапазоны, связь величин) проверяет ch.check(values)
      const fieldsWrap = el("div", "lab-ch-fields");
      (ch.fields || []).forEach((f) => {
        const w = el("label", "lab-ch-field");
        w.appendChild(el("span", "", tr(f.label)));
        const inp = document.createElement("input");
        inp.type = f.type === "text" ? "text" : "number";
        if (f.placeholder) inp.placeholder = tr(f.placeholder);
        inp.setAttribute("aria-label", tr(f.label));
        inp.dataset.chField = f.key;
        w.appendChild(inp);
        fieldsWrap.appendChild(w);
      });
      card.appendChild(fieldsWrap);
      const checkBtn = el("button", "button", T.chCheck || T.check);
      checkBtn.type = "button";
      checkBtn.addEventListener("click", () => {
        const values = {};
        card.querySelectorAll("[data-ch-field]").forEach((inp) => {
          values[inp.dataset.chField] = inp.value.trim();
        });
        bumpAttempts();
        let r;
        try { r = ch.check(values) || { ok: false }; } catch (e) { r = { ok: false, note: String(e.message || e) }; }
        setNote(r);
        if (r.ok) solve();
        else { verdict.dataset.state = "fail"; verdict.textContent = T.chNotYet; }
      });
      controls.appendChild(checkBtn);
    } else {
      // selfcheck: анализ без автопроверки — рассуждение + честная декларация
      const ta = document.createElement("textarea");
      ta.className = "lab-ch-reasoning";
      ta.rows = 4;
      ta.spellcheck = false;
      ta.setAttribute("aria-label", T.chReasoning);
      ta.placeholder = tr(ch.reasoningHint) || "";
      card.appendChild(ta);
      const decl = el("label", "lab-ch-declare");
      const cb = document.createElement("input");
      cb.type = "checkbox";
      decl.appendChild(cb);
      decl.appendChild(el("span", "", tr(ch.declare) || (lang === "ru" ? "Я проверил это сам" : "I verified this myself")));
      card.appendChild(decl);
      const doneBtn = el("button", "button", T.chDone || T.check);
      doneBtn.type = "button";
      doneBtn.addEventListener("click", () => {
        if (!cb.checked) {
          verdict.dataset.state = "fail";
          verdict.textContent = T.chDeclareFirst;
          return;
        }
        bumpAttempts();
        solve();
      });
      controls.appendChild(doneBtn);
    }

    card.appendChild(controls);
    card.appendChild(verdict);
    card.appendChild(note);

    // эталон скрыт до решения — кнопка появляется только после достижения цели
    const refBtn = el("button", "button secondary", T.solution);
    refBtn.type = "button";
    refBtn.hidden = true;
    refBtn.dataset.labChRefBtn = "";
    const refBox = el("pre", "lab-solution");
    refBox.style.display = "none";
    refBtn.addEventListener("click", () => {
      if (refBox.style.display === "none") {
        refBox.textContent = ch.reference || "";
        refBox.style.display = "block";
        refBtn.textContent = T.hideSolution;
      } else {
        refBox.style.display = "none";
        refBtn.textContent = T.solution;
      }
    });
    controls.appendChild(refBtn);
    card.appendChild(refBox);
    if (loadProgress()[solvedKey]) {
      // restore: решённый челлендж после reload показывает вердикт и эталон
      verdict.dataset.state = "pass";
      verdict.textContent = T.chSolved;
      refBtn.hidden = false;
    }
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
      const prog0 = loadProgress();
      const solvedPost = {};
      (content.posttest || []).forEach((it) => { if (prog0[it.id]) solvedPost[it.id] = 1; });
      window.LSMPosttest.render(postHost, content.posttest, {
        lang,
        seedPrefix: labId,
        solved: solvedPost,
        onCorrect: (id) => {
          const p = loadProgress(); p[id] = 1;
          try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) {}
          renderProgress(true);
        },
      });
      // IDS уже содержит posttest-ids: перерисовать прогресс после регистрации
      renderProgress();
    }
    const quizRoot = document.querySelector("[data-lab-quizzes]");
    (content.quizzes || []).forEach((q, qi) => renderQuiz(quizRoot, q, qi));
    const exRoot = document.querySelector("[data-lab-exercises]");
    (content.parsons || []).forEach((p) => renderParsons(exRoot, p));
    (content.exercises || []).forEach((ex) => renderExercise(exRoot, ex));
    const chHost = document.querySelector("[data-lab-challenge]");
    if (chHost && content.challenge) {
      const chSection = document.querySelector("[data-lab-challenge-section]");
      if (chSection) chSection.hidden = false;
      renderChallenge(chHost, content.challenge);
    }
    const heroHost = document.querySelector("[data-lab-hero]");
    if (heroHost) renderHero(heroHost, null, tr(content.heroCaption) || "");
    const footer = document.querySelector("[data-lab-footer]");
    if (footer) footer.textContent = tr(content.footer) || "";
    renderProgress();
    // preload the runner after first paint so the first Run is fast
    if (window.LSMPython) setTimeout(() => window.LSMPython.preload(), 1500);
  });
})();
