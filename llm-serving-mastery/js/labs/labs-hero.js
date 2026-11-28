/* labs-hero.js — seeded "requests → edge → engine → tokens" flow animator.
   window.LSMHero.mount(canvas, accent, labels, seed) — deterministic per seed. */
(function () {
  "use strict";
  function mount(canvas, accent, labels, seed) {
    if (!canvas || !canvas.getContext) return () => {};
    const ctx = canvas.getContext("2d");
    labels = labels || ["client", "edge", "engine", "tokens"];
    seed = seed == null ? 13 : seed;
    // accent === null → читаем живой --lab-accent (colorblind-режим перекрашивает на ходу)
    const liveAccent = () => accent || getComputedStyle(canvas.closest(".lab-shell") || document.documentElement).getPropertyValue("--lab-accent").trim() || "#38e1ff";
    const liveAccent2 = () => getComputedStyle(canvas.closest(".lab-shell") || document.documentElement).getPropertyValue("--lab-accent-2").trim() || "#a78bfa";
    let s = seed;
    const rnd = () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; };
    const cleanups = [];
    function size() {
      const r = window.devicePixelRatio || 1;
      const w = Math.max(600, Math.floor(canvas.clientWidth * r));
      const h = Math.max(240, Math.floor(canvas.clientHeight * r));
      // assigning canvas.width/height clears the bitmap — only when it really changes
      if (canvas.width !== w) canvas.width = w;
      if (canvas.height !== h) canvas.height = h;
    }
    size();
    const xs = [0.09, 0.37, 0.63, 0.91];
    const particles = Array.from({ length: 26 }, () => ({
      x: rnd(), lane: 0.5 + (rnd() - 0.5) * 0.16, v: 0.0016 + rnd() * 0.0022,
      r: 1.6 + rnd() * 2.6, alt: rnd() > 0.75,
    }));
    let t0 = null;
    // prefers-reduced-motion (audit F-P2-16 / L4-2 / L5-2): under reduce the
    // hero renders one static frame and never loops; flipping the OS setting
    // live starts/stops the flow (same contract as labs-figures.js REDUCED)
    const motion = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
    const reduced = () => !!(motion && motion.matches);
    // Q5 / audit F-P2-4 (L6-1/L6-2): below 640px the decorative pipeline
    // (rail, node dots, labels, particles) lands on top of the lead text, so
    // it is not rendered at all — the hero keeps its heading, caption and CTA
    // on the stage gradient. Same live-gate contract as reduce: crossing the
    // boundary starts/stops the flow.
    const narrow = window.matchMedia ? window.matchMedia("(max-width: 639px)") : null;
    const hiddenNarrow = () => !!(narrow && narrow.matches);
    let raf = 0;
    // T12 / AG-7 (P3): text and pipeline never share pixels at >= 640px. The title
    // and lead (.lab-hero-head) are DOM text on top of this canvas; the rail, nodes,
    // labels and particles live in ONE band placed strictly between the text block
    // and the caption chip. Both are measured — title length, wrapping, platform
    // fonts and the caption height all vary per lab/language/width — and the band
    // rests at the classic 72 % of the height when there is room. When the text
    // leaves no room above the caption, the canvas grows by --lab-hero-grow
    // (labs.css: height calc(300px + var(--lab-hero-grow, 0px))) instead of letting
    // the rail run through the lead. Re-measured on resize, when the text or caption
    // box changes (ResizeObserver), when fonts finish loading, and twice a second
    // while the loop runs. labs.css top-aligns the text block on lab pages (the text
    // must not move when the canvas grows); data-lab-hero-flow is the explicit opt-in.
    const stage = canvas.closest(".lab-hero-stage");
    const head = stage ? stage.querySelector(".lab-hero-head") : null;
    const caption = stage ? stage.querySelector(".lab-hero-caption") : null;
    const GROW = "--lab-hero-grow";
    const TEXT_GAP = 14; // css px: text block -> top of the band (particles, node glow)
    const CAP_GAP = 8;   // css px: label descenders -> caption chip
    const LABEL_PAD = 6; // css px: labels never come closer to the canvas edge
    let grow = 0;        // css px added to the canvas height
    let dirty = true;
    let G = null;        // last layout, device px (the drawing is in device px)
    // Reads only — no layout writes: where the text block ends, where the caption starts,
    // and the band between them. Safe to run inside a ResizeObserver callback.
    function compute() {
      const box = canvas.getBoundingClientRect();
      const base = Math.max(1, box.height - grow); // css px height without the grow
      let textBottom = 0;
      if (head) {
        for (const el of head.children) {
          const b = el.getBoundingClientRect().bottom - box.top;
          if (b > textBottom) textBottom = b;
        }
      }
      let capTop = null;
      if (caption) {
        const cb = caption.getBoundingClientRect();
        if (cb.height > 0) capTop = cb.top - box.top;
      }
      const kx = canvas.width / Math.max(1, canvas.clientWidth);   // device px per css px
      const ky = canvas.height / Math.max(1, canvas.clientHeight);
      const W = canvas.width;
      const H0 = base * ky; // ungrown height, device px
      const nodeR = 10;
      const font = Math.round(H0 * 0.055);
      ctx.font = "600 " + font + "px ui-monospace, monospace";
      const metrics = labels.map((t) => ctx.measureText(t || ""));
      const descent = Math.ceil(metrics.reduce((m, x) => Math.max(m, x.actualBoundingBoxDescent || 0), font * 0.25));
      // band extents: particles sweep ±0.10 H around the rail (r <= 4.2), the node glow is r + 18,
      // labels sit 34 below the rail + descenders. All in device px, so at dpr 2 the 34 px label
      // offset is shorter than the particle sweep — both sides take the larger of the two.
      const sweep = H0 * 0.10 + 5;
      const above = Math.max(sweep, nodeR + 18);
      const below = Math.max(34 + descent + 1, sweep);
      const railMin = textBottom * ky + TEXT_GAP * ky + above;
      const cap0 = capTop == null ? null : (capTop - grow) * ky; // caption top in the ungrown canvas
      const railMax = (cap0 == null ? H0 : cap0) - CAP_GAP * ky - below;
      let rail, next = 0;
      if (railMin <= railMax) rail = Math.min(railMax, Math.max(railMin, H0 * 0.72));
      else { rail = railMin; next = Math.ceil((rail + below + CAP_GAP * ky - (cap0 == null ? 0 : cap0)) / ky); } // whole css px
      const pad = LABEL_PAD * kx;
      const labelX = xs.map((x, i) => {
        const half = metrics[i].width / 2;
        return Math.max(half + pad, Math.min(W - half - pad, x * W));
      });
      // css px from the canvas top — geometry for gates/e2e (harmless data hook)
      const c = (v) => Math.round(v / ky * 100) / 100;
      const cx = (v) => Math.round(v / kx * 100) / 100;
      return {
        rail, above, below, nodeR, font, amp: H0 * 0.10, labelX, next,
        css: {
          rail: c(rail), bandTop: c(rail - above), bandBottom: c(rail + below),
          textBottom: c(textBottom * ky), captionTop: cap0 == null ? null : Math.round((cap0 / ky + grow) * 100) / 100, grow,
          nodes: xs.map((x) => [cx(x * W), c(rail), nodeR]),
          labels: xs.map((x, i) => {
            const m = metrics[i];
            return { t: labels[i] || "", x: cx(labelX[i]), y: c(rail + 34), w: cx(m.width),
              asc: c(m.actualBoundingBoxAscent || font * 0.8), desc: c(m.actualBoundingBoxDescent || font * 0.25) };
          }),
        },
      };
    }
    function publish(g) { G = g; canvas.dataset.heroGeom = JSON.stringify(g.css); }
    // full pass: backing store, the one layout write (growth), publish
    function layout() {
      dirty = false;
      size();
      const g = compute();
      if (g.next !== grow) {
        grow = g.next;
        if (grow > 0) canvas.style.setProperty(GROW, grow.toFixed(2) + "px");
        else canvas.style.removeProperty(GROW);
        size();
      }
      publish(g);
    }
    function step() {
      particles.forEach((pt) => {
        pt.x += pt.v;
        if (pt.x > 1.02) { pt.x = -0.02; pt.lane = 0.5 + (rnd() - 0.5) * 0.16; }
      });
    }
    function paint() {
      const W = canvas.width, g = G;
      ctx.clearRect(0, 0, W, canvas.height);
      ctx.strokeStyle = "rgba(148, 163, 184, 0.35)";
      ctx.setLineDash([6, 8]);
      ctx.beginPath();
      ctx.moveTo(xs[0] * W, g.rail); ctx.lineTo(xs[xs.length - 1] * W, g.rail);
      ctx.stroke();
      ctx.setLineDash([]);
      const acc = liveAccent();
      xs.forEach((x, i) => {
        ctx.fillStyle = acc;
        ctx.shadowColor = acc; ctx.shadowBlur = 18;
        ctx.beginPath(); ctx.arc(x * W, g.rail, g.nodeR, 0, 7); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "rgba(232, 238, 247, 0.85)";
        ctx.font = "600 " + g.font + "px ui-monospace, monospace";
        ctx.textAlign = "center";
        ctx.fillText(labels[i] || "", g.labelX[i], g.rail + 34);
      });
      particles.forEach((pt) => {
        const y = g.rail + Math.sin(pt.x * 14 + pt.lane * 20) * g.amp;
        ctx.globalAlpha = 0.55 + 0.45 * Math.sin(pt.x * 30);
        ctx.fillStyle = pt.alt ? liveAccent2() : acc;
        ctx.beginPath(); ctx.arc(pt.x * W, y, pt.r, 0, 7); ctx.fill();
        ctx.globalAlpha = 1;
      });
    }
    let frames = 0;
    let disposed = false; // document.fonts.ready cannot be cancelled: nothing runs after unmount
    function draw(ts) {
      if (hiddenNarrow()) return;
      if (!t0) t0 = ts;
      if (dirty) layout();
      step(); paint();
      if (++frames % 30 === 0) dirty = true; // cheap safety re-measure, ~2×/s
      if (!reduced()) raf = requestAnimationFrame(draw);
      else raf = 0;
    }
    // One gate for both media queries: stop any loop, and on a narrow
    // viewport also wipe the last painted frame so nothing decorative stays.
    const sync = () => {
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      if (hiddenNarrow()) {
        if (grow) { grow = 0; canvas.style.removeProperty(GROW); size(); }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        canvas.dataset.heroGeom = '{"hidden":1,"grow":0}';
        return;
      }
      draw(performance.now()); // layout() inside when dirty; schedules the loop itself
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; sync(); }); };
    // resize, text / caption / canvas box change, fonts loaded. A ResizeObserver delivers
    // AFTER layout and BEFORE the paint of the same frame, while the loop's rAF ran earlier:
    // so the band is re-placed and repainted right here (reads + canvas only), and no painted
    // frame shows the old band under changed text. The one layout write — the height growth —
    // is never done inside an observer callback (that loops the observer): it is flagged
    // for the next animation frame.
    const relayout = () => {
      if (disposed) return;
      if (hiddenNarrow()) { dirty = true; return; }
      size();
      publish(compute());
      paint();
      dirty = true;
      kick();
    };
    if (window.ResizeObserver) {
      const ro = new ResizeObserver(relayout);
      ro.observe(canvas);
      if (head) for (const el of head.children) ro.observe(el);
      if (caption) ro.observe(caption);
      cleanups.push(() => ro.disconnect());
    }
    if (document.fonts) {
      const onFonts = () => relayout();
      document.fonts.addEventListener("loadingdone", onFonts);
      document.fonts.ready.then(onFonts);
      cleanups.push(() => document.fonts.removeEventListener("loadingdone", onFonts));
    }
    window.addEventListener("resize", relayout);
    const onMotion = sync;
    if (motion) {
      if (motion.addEventListener) motion.addEventListener("change", onMotion);
      else if (motion.addListener) motion.addListener(onMotion);
    }
    if (narrow) {
      if (narrow.addEventListener) narrow.addEventListener("change", sync);
      else if (narrow.addListener) narrow.addListener(sync);
    }
    if (stage) stage.dataset.labHeroFlow = "1";
    sync();
    return () => {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("resize", relayout);
      for (const fn of cleanups) fn();
      if (stage) delete stage.dataset.labHeroFlow;
      if (grow) canvas.style.removeProperty(GROW);
      delete canvas.dataset.heroGeom;
      if (motion) {
        if (motion.removeEventListener) motion.removeEventListener("change", onMotion);
        else if (motion.removeListener) motion.removeListener(onMotion);
      }
      if (narrow) {
        if (narrow.removeEventListener) narrow.removeEventListener("change", sync);
        else if (narrow.removeListener) narrow.removeListener(sync);
      }
    };
  }
  window.LSMHero = { mount };
})();

  function injectSwitcher() {
    if (!document.querySelector(".lab-shell")) return;
    if (document.querySelector(".cb-switch")) return;
    const ru = (document.documentElement.lang || "en") === "ru";
    const cbLabel = ru ? "Режимы цветовосприятия" : "Colorblind mode";
    const bar = document.createElement("div");
    bar.className = "cb-switch";
    bar.setAttribute("role", "region");
    bar.setAttribute("aria-label", cbLabel);
    const panel = document.createElement("div");
    panel.className = "cb-panel";
    panel.hidden = true;
    const modes = [["normal", "Normal"], ["deut", "Deut"], ["prot", "Prot"], ["trit", "Trit"], ["mono", "Mono"]];
    const saved = localStorage.getItem("lsm.cb") || "normal";
    const apply = (mode) => {
      document.documentElement.dataset.cb = mode === "normal" ? "" : mode;
      panel.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.mode === mode)));
    };
    modes.forEach(([mode, label]) => {
      const b = document.createElement("button");
      b.type = "button"; b.dataset.mode = mode; b.textContent = label;
      b.addEventListener("click", () => {
        try { localStorage.setItem("lsm.cb", mode); } catch (e) { /* private mode */ }
        apply(mode);
      });
      panel.appendChild(b);
    });
    // Collapsed palette button by default: the always-on bar overlapped figure
    // captions and progress dots at viewport bottom-left on viewports ≤800px
    // tall (audit P1) and page content on narrow screens. Expanded panel opens
    // above the button, so captions stay readable even while it is open.
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "cb-toggle";
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", cbLabel);
    toggle.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><circle cx="5" cy="8" r="3.4" fill="#56b4e9"/><circle cx="11" cy="8" r="3.4" fill="#e69f00" fill-opacity="0.85"/></svg>';
    toggle.addEventListener("click", () => {
      const open = panel.hidden;
      panel.hidden = !open;
      toggle.setAttribute("aria-expanded", String(open));
    });
    bar.appendChild(toggle);
    bar.appendChild(panel);
    document.body.appendChild(bar);
    apply(saved === "" ? "normal" : saved);
    window.addEventListener("storage", (e) => { if (e.key === "lsm.cb" && e.newValue != null) apply(e.newValue); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", injectSwitcher);
  else injectSwitcher();
