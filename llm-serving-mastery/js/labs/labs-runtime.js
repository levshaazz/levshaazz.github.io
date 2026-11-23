/* labs-runtime.js — layer-2 section for practice labs: the student's local
   Docker runtime (gateway + real llama.cpp) at 127.0.0.1:8760.
   The browser page probes it, runs measured experiments against it, and
   injects the hash-chained journal into a Python exercise so the student can
   re-verify the chain with their own code. Student code never runs on the
   host — only this page talks to the localhost gateway. */
(function () {
  "use strict";

  const RUNTIME_URL = "http://127.0.0.1:8760";
  // LAB_META and the content module are set by later script tags — read lazily.
  const meta = () => window.LAB_META || {};
  const lang = () => meta().lang || "en";
  const T = () => (meta().t && meta().t.runtime) || {};
  const content = () => (window.LABS_CONTENT || {})[meta().lab] || {};

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

  async function fetchJson(path, opts) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), (opts && opts.timeoutMs) || 2500);
    try {
      const r = await fetch(RUNTIME_URL + path, { signal: ctrl.signal, ...opts });
      clearTimeout(timer);
      if (!r.ok) throw new Error("HTTP " + r.status);
      return await r.json();
    } catch (e) {
      clearTimeout(timer);
      throw e;
    }
  }

  async function fetchJournalRaw() {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 2500);
    try {
      const r = await fetch(RUNTIME_URL + "/journal", { signal: ctrl.signal });
      clearTimeout(timer);
      if (!r.ok) throw new Error("HTTP " + r.status);
      return await r.text();
    } catch (e) {
      clearTimeout(timer);
      throw e;
    }
  }

  function renderChip(host, state, detail) {
    const cls = state === "on" ? "ok" : state === "wait" ? "wait" : "off";
    host.innerHTML = "";
    host.appendChild(el("span", "lab-runtime-chip lab-runtime-" + cls,
      (state === "on" ? "● " : state === "wait" ? "◐ " : "○ ") + detail));
  }

  function renderSection() {
    const spec = content().runtime;
    const host = document.querySelector("[data-lab-runtime]");
    if (!spec || !host) return;
    const card = el("div", "lab-card");
    card.appendChild(el("h3", "", tr(spec.title)));
    card.appendChild(el("p", "", tr(spec.brief)));

    const chipHost = el("div", "lab-runtime-status");
    renderChip(chipHost, "wait", tr(T().probing));
    card.appendChild(chipHost);

    const actions = el("div", "lab-controls");
    const zip = el("a", "button secondary", tr(T().download));
    zip.href = window.LAB_ZIP || "/downloads/lsm-runtime.zip";
    zip.download = "lsm-runtime.zip";
    actions.appendChild(zip);

    if (spec.experimentPrompt) {
      const pwrap = el("label", "lab-rt-num lab-rt-prompt");
      pwrap.appendChild(el("span", "", tr(T().promptLabel)));
      const pin = document.createElement("input");
      pin.type = "text"; pin.value = tr(spec.experimentPrompt);
      pin.dataset.rtPromptField = "";
      pwrap.appendChild(pin);
      actions.appendChild(pwrap);
    }

    // Lab 16: a draft toggle for the speculative A/B. The gateway routes
    // spec=true to engine-spec; readiness is probed with the rest of /health.
    let draftNote = null;
    let draftBox = null;
    if (spec.specToggle) {
      const dwrap = el("label", "lab-rt-num lab-rt-draft");
      draftBox = document.createElement("input");
      draftBox.type = "checkbox";
      draftBox.dataset.rtDraft = "";
      dwrap.appendChild(draftBox);
      dwrap.appendChild(el("span", "", tr(spec.specToggle)));
      actions.appendChild(dwrap);
      draftNote = el("div", "lab-runtime-status lab-runtime-draft-note");
      card.appendChild(draftNote);
    }

    const expBtn = el("button", "button", tr(T().experiment));

    // Lab 13: the eval gate — run the declared fixture set through the engine
    // (temperature 0) and store pass/fail flags for the eval exercise.
    let evalBtn = null;
    if (spec.evalSet) {
      evalBtn = el("button", "button secondary", tr(T().evalBtn));
      evalBtn.type = "button"; evalBtn.dataset.rtEval = "";
      actions.appendChild(evalBtn);
    }
    expBtn.type = "button"; expBtn.dataset.rtExp = "";
    actions.appendChild(expBtn);

    const journalBtn = el("button", "button secondary", tr(T().journal));
    journalBtn.type = "button"; journalBtn.dataset.rtJournal = "";
    actions.appendChild(journalBtn);

    const verifyBtn = el("button", "button secondary", tr(T().verify));
    verifyBtn.type = "button"; verifyBtn.dataset.rtVerify = "";
    actions.appendChild(verifyBtn);

    const hasRtEx = (content().exercises || []).some((e) => e.injectEntries);
    if (hasRtEx) {
      const vst = el("button", "button secondary", tr(T().verifyStudent));
      vst.type = "button"; vst.dataset.rtVerifyStudent = "";
      actions.appendChild(vst);
    }
    if (spec.burst) {
      const mkInput = (label, value, max) => {
        const wrap = el("label", "lab-rt-num");
        wrap.appendChild(el("span", "", label));
        const inp = document.createElement("input");
        inp.type = "number"; inp.min = "1"; inp.max = String(max); inp.value = String(value);
        inp.dataset.rtBurstField = label;
        wrap.appendChild(inp);
        return wrap;
      };
      actions.appendChild(mkInput(tr(T().burstArrivals), spec.burst.arrivals, 64));
      actions.appendChild(mkInput(tr(T().burstSlots), spec.burst.slots, 8));
      actions.appendChild(mkInput(tr(T().burstQueue), spec.burst.queueSlots, 16));
      const burstBtn = el("button", "button", tr(T().burstBtn));
      burstBtn.type = "button"; burstBtn.dataset.rtBurst = "";
      actions.appendChild(burstBtn);
    }
    card.appendChild(actions);

    const out = el("div", "lab-timeline");
    out.setAttribute("aria-live", "polite");
    card.appendChild(out);
    const metrics = el("div", "lab-metrics");
    // "done" exists only where the burst button does: the burst used to print
    // its completed-request count into the tok/s slot (audit L1b-3)
    const metricDefs = [["wall", tr(T().mWall)], ["tok", tr(T().mTok)]];
    if (spec.burst) metricDefs.push(["done", tr(T().mDone)]);
    metricDefs.push(["seq", tr(T().mSeq)]);
    metricDefs.forEach(([k, label]) => {
      const m = el("div", "lab-metric");
      m.appendChild(el("b", "", "—")); m.firstChild.dataset.rtMetric = k;
      m.appendChild(el("span", "", label));
      metrics.appendChild(m);
    });
    card.appendChild(metrics);
    // what "Эксперимент" actually does — it was never described in the section
    // text and silently falls back to a default prompt (audit L1b-4)
    card.appendChild(el("p", "lab-note", tr(T().experimentHint)));
    const note = el("p", "lab-note", tr(spec.footer));
    card.appendChild(note);
    host.appendChild(card);

    const log = (text, cls) => {
      const line = el("div", cls, "");
      line.textContent = text;
      out.appendChild(line);
      out.scrollTop = out.scrollHeight;
    };
    const setMetric = (k, v) => {
      const m = metrics.querySelector(`[data-rt-metric="${k}"]`);
      if (m) m.textContent = v;
    };

    async function probe() {
      renderChip(chipHost, "wait", tr(T().probing));
      try {
        const h = await fetchJson("/health", { timeoutMs: 2000 });
        if (draftNote) {
          const sp = h.spec_engine || {};
          const spOk = h.status === "ok" && sp.ok === true;
          draftNote.innerHTML = "";
          draftNote.appendChild(el("span", "lab-runtime-chip lab-runtime-" + (spOk ? "ok" : "off"),
            (spOk ? "● " : "○ ") + tr(spOk ? T().draftOk : T().draftNotReady)));
        }
        if (h.status === "ok") {
          renderChip(chipHost, "on", tr(T().connected) + " — " + (h.journal_entries || 0) + " " + tr(T().entriesWord));
          return true;
        }
        renderChip(chipHost, "wait", tr(T().warming));
        return false;
      } catch (e) {
        // from a public origin (github.io) the failure is usually the browser
        // blocking private-network access, not a missing runtime — say so
        // instead of sending the student to raise a container that won't help
        const localOrigin = location.protocol === "file:" ||
          /^(localhost|127\.0\.0\.1|\[::1\]|::1)$/.test(location.hostname);
        renderChip(chipHost, "off", localOrigin ? tr(T().offline) : tr(T().blocked));
        return false;
      }
    }

    expBtn.addEventListener("click", async () => {
      if (!(await probe())) { log(tr(T().needRuntime), "err"); return; }
      log("POST /experiment" + (draftBox && draftBox.checked ? " (spec)" : "") + " → " + tr(T().running));
      try {
        const pin = card.querySelector("[data-rt-prompt-field]");
        const prompt = (pin && pin.value.trim()) || tr(spec.experimentPrompt || (spec.burst && spec.burst.prompt));
        const r = await fetchJson("/experiment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: prompt, max_tokens: 32, spec: !!(draftBox && draftBox.checked) }),
          timeoutMs: 180000,
        });
        setMetric("wall", r.metrics.wall_s.toFixed(3) + " s");
        setMetric("tok", r.metrics.tok_per_s.toFixed(1));
        setMetric("seq", "#" + r.journal_seq);
        log(tr(T().measured) + " journal[" + r.journal_seq + "] = " + r.journal_hash.slice(0, 16) + "…", "ok");
        await probe();
      } catch (e) {
        log(tr(T().experimentFail) + " " + e.message, "err");
      }
    });

    const evalBtnEl = card.querySelector("[data-rt-eval]");
    if (evalBtnEl) {
      evalBtnEl.addEventListener("click", async () => {
        if (!(await probe())) { log(tr(T().needRuntime), "err"); return; }
        const fixtures = spec.evalSet.fixtures || [];
        const results = [];
        evalBtnEl.disabled = true;
        try {
          for (let i = 0; i < fixtures.length; i++) {
            const fx = fixtures[i];
            log(tr(T().evalRunning) + " " + (i + 1) + "/" + fixtures.length + " → " + tr(T().running));
            const r = await fetchJson("/v1/chat/completions", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ messages: [{ role: "user", content: fx.prompt }], max_tokens: 24, temperature: 0, stream: false }),
              timeoutMs: 120000,
            });
            const got = ((((r || {}).choices || [])[0] || {}).message || {}).content || "";
            const ok = String(got).toLowerCase().includes(String(fx.expect).toLowerCase());
            results.push(ok);
            log((ok ? "✓ " : "✗ ") + tr(T().evalFixture) + " " + (i + 1) + " (" + fx.expect + "): " + String(got).slice(0, 60).replace(/\s+/g, " "), ok ? "ok" : "err");
          }
          const passed = results.filter(Boolean).length;
          try { localStorage.setItem("lsm.eval." + meta().lab, JSON.stringify({ ts: Date.now(), results })); } catch (e) {}
          log(tr(T().evalDone).replace("{p}", String(passed)).replace("{n}", String(results.length)), passed === results.length ? "ok" : "chunk");
        } catch (e) {
          log(tr(T().experimentFail) + " " + e.message, "err");
        } finally {
          evalBtnEl.disabled = false;
        }
      });
    }

    journalBtn.addEventListener("click", async () => {
      try {
        const j = await fetchJson("/journal");
        log(tr(T().journalHead) + " " + j.entries.length + " · " + (j.head || "").slice(0, 16) + "…", "ok");
        j.entries.slice(-3).forEach((e) => log(`#${e.seq} ${e.kind} ${e.hash.slice(0, 12)}…`, "chunk"));
      } catch (e) {
        log(tr(T().needRuntime), "err");
      }
    });

    verifyBtn.addEventListener("click", async () => {
      try {
        const v = await fetchJson("/journal/verify");
        if (v.ok) log(tr(T().chainOk).replace("{n}", String(v.entries)), "ok");
        else log(tr(T().chainBroken).replace("{n}", String(v.broken_at)) + " (" + v.reason + ")", "err");
      } catch (e) {
        log(tr(T().needRuntime), "err");
      }
    });

    const vstBtn = card.querySelector("[data-rt-verify-student]");
    if (vstBtn) {
      vstBtn.addEventListener("click", async () => {
        const locked = [...document.querySelectorAll("[data-lab-run]")].some((b) => b.disabled);
        if (locked) { log(tr(T().gateBusy), "err"); return; }
        if (!(await probe())) { log(tr(T().needRuntime), "err"); return; }
        const cardEl = document.querySelector('[data-lab-checkpoint="rt1"]');
        const wrap = cardEl && cardEl.querySelector(".CodeMirror");
        let code = wrap && wrap.CodeMirror ? wrap.CodeMirror.getValue() : (cardEl && cardEl.querySelector("textarea") ? cardEl.querySelector("textarea").value : "");
        const MARK = "import json as _rtjson";
        if (code.startsWith(MARK)) {
          const sep = code.indexOf("\n\n");
          code = sep >= 0 ? code.slice(sep + 2) : "";
        }
        if (!code.includes("def verify_chain")) { log(tr(T().verifyStudentFirst), "err"); return; }
        try {
          const raw = await fetchJournalRaw();
          const gw = await fetchJson("/journal/verify");
          const runner = "import json as _rtjson\n_data = _rtjson.loads(" + JSON.stringify(raw) + ")\nentries = _data[\"entries\"] if isinstance(_data, dict) else _data\n\n" + code + "\n\nprint(\"STUDENT_VERDICT\", verify_chain(entries))";
          vstBtn.disabled = true;
          const res = await window.LSMPython.run(runner, [], { timeoutMs: 8000 });
          vstBtn.disabled = false;
          // stdout пайвorka приходит фрагментами: склеиваем, чтобы вердикт и кортеж были в одной строке
          const joined = (res.stdout || "").split("\n").map((s) => s.trim()).filter(Boolean).join(" ");
          const okStudent = /STUDENT_VERDICT\s*\(?\s*True/.test(joined);
          const verdictText = joined.slice(joined.indexOf("STUDENT_VERDICT")).replace("STUDENT_VERDICT", "").trim() || (okStudent ? "(True, …)" : "нет вывода");
          log(tr(T().studentVerdict) + " " + verdictText, okStudent ? "chunk" : "err");
          log(tr(T().gatewayVerdict) + " ok=" + gw.ok + ", " + gw.entries + " " + tr(T().entriesWord), gw.ok ? "ok" : "err");
          log(gw.ok === okStudent ? tr(T().matchOk) : tr(T().matchMismatch), gw.ok === okStudent ? "ok" : "err");
          await probe();
        } catch (e) {
          vstBtn.disabled = false;
          log(tr(T().experimentFail) + " " + e.message, "err");
        }
      });
    }

    const burstBtn = card.querySelector("[data-rt-burst]");
    if (burstBtn) {
      burstBtn.addEventListener("click", async () => {
        if (!(await probe())) { log(tr(T().needRuntime), "err"); return; }
        const field = (label) => Number(card.querySelector(`[data-rt-burst-field="${label}"]`).value) || 1;
        const payload = {
          arrivals: field(tr(T().burstArrivals)),
          slots: field(tr(T().burstSlots)),
          queue_slots: field(tr(T().burstQueue)),
          max_tokens: spec.burst.maxTokens || 12,
          prompt: tr(spec.burst.prompt),
        };
        log(`POST /burst ${payload.arrivals} arrivals · ${payload.slots}+${payload.queue_slots} → ` + tr(T().running));
        burstBtn.disabled = true;
        try {
          const r = await fetchJson("/burst", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            timeoutMs: 180000,
          });
          setMetric("wall", r.wall_s.toFixed(2) + " s");
          setMetric("done", String(r.completed));
          setMetric("seq", "#" + r.journal_seq);
          log(tr(T().burstDone)
            .replace("{a}", String(r.admitted))
            .replace("{r}", String(r.rejected_429))
            .replace("{c}", String(r.completed)), r.rejected_429 > 0 ? "chunk" : "ok");
          const queued = r.per_request.filter((q) => q.queued);
          if (queued.length) {
            const waits = queued.map((q) => q.queue_wait_s.toFixed(2)).join(", ");
            log(tr(T().queueWaits) + " " + waits + " s", "chunk");
          }
          await probe();
        } catch (e) {
          log(tr(T().experimentFail) + " " + e.message, "err");
        } finally {
          burstBtn.disabled = false;
        }
      });
    }

    probe();
    // reprobe with backoff: while the runtime is away every probe logs browser
    // console CORS/PNA errors that can't be silenced — probe at 15 s when up,
    // doubling up to 60 s when down
    let probeTimer = null;
    let probeDelay = 15000;
    const scheduleProbe = (okNow) => {
      probeDelay = okNow ? 15000 : Math.min(probeDelay * 2, 60000);
      clearTimeout(probeTimer);
      probeTimer = setTimeout(async () => scheduleProbe(await probe()), probeDelay);
    };
    scheduleProbe(true);
  }

  // Inject the student's actual journal into a Python exercise as `entries`.
  async function journalInjection(ex) {
    if (!ex.injectEntries) return null;
    try {
      // сырой текст журнала: python loads сохраняет float-ность (0.0 != 0),
      // JS-круг JSON.parse/stringify мутирует целочисленные float и ломает хэши
      const raw = await fetchJournalRaw();
      return "import json as _rtjson\n_data = _rtjson.loads(" +
        JSON.stringify(raw) + ")\nentries = _data[\"entries\"] if isinstance(_data, dict) else _data\n\n";
    } catch (e) {
      return null;
    }
  }

  // Stored eval results (Lab 13): the eval button writes flags here; the
  // eval exercise reads them as `results`. JSON booleans round-trip through
  // python json.loads the same way the journal does.
  function loadEvalResults() {
    try {
      const raw = localStorage.getItem("lsm.eval." + meta().lab);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed.results) ? parsed.results : null;
    } catch (e) {
      return null;
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    renderSection();
  });

  window.LSMRuntime = {
    probe: () => fetchJson("/health", { timeoutMs: 2000 }).catch(() => null),
    // Called by labs-render before running an exercise with injectEntries:
    // fetches the live journal and prepends it to the student code. Returns
    // false when the runtime is offline (the renderer reports that).
    async prepareExercise(ex, textarea) {
      if (ex.injectEval) {
        let results = loadEvalResults();
        let fixtureEval = false;
        if (!results && ex.fixtureEval) {
          results = ex.fixtureEval;
          fixtureEval = true;
        }
        if (!results) return { ok: false, fixture: false };
        const MARK = "import json as _rtjson";
        if (textarea.value.startsWith(MARK)) {
          const sep = textarea.value.indexOf("\n\n");
          textarea.value = sep >= 0 ? textarea.value.slice(sep + 2) : "";
        }
        const note = fixtureEval
          ? "# FIXTURE (runtime offline): declared synthetic eval results, not evidence\n"
          : "";
        textarea.value = note + "import json as _rtjson\nresults = _rtjson.loads(" +
          JSON.stringify(JSON.stringify(results)) + ")\n\n" + textarea.value;
        return { ok: true, fixture: fixtureEval };
      }
      if (!ex.injectEntries) return { ok: true, fixture: false };
      let inject = await journalInjection(ex);
      let fixture = false;
      if (!inject && ex.fixtureEntries) {
        // live journal unreachable — inject the declared synthetic fixture and
        // say so in the output; a fixture is practice material, never evidence
        fixture = true;
        inject = "import json as _rtjson\n# FIXTURE (runtime offline): synthetic journal, not evidence\nentries = _rtjson.loads(_rtjson.dumps(" +
          JSON.stringify(ex.fixtureEntries) + "))\n\n";
      }
      if (!inject) return { ok: false, fixture: false };
      // refresh, not skip: a second run after a new experiment must analyse the
      // CURRENT journal, and a fixture must never silently masquerade as live
      const MARK = "import json as _rtjson";
      if (textarea.value.startsWith(MARK)) {
        const sep = textarea.value.indexOf("\n\n");
        textarea.value = sep >= 0 ? textarea.value.slice(sep + 2) : "";
      }
      textarea.value = inject + textarea.value;
      return { ok: true, fixture: fixture };
    },
  };
})();
