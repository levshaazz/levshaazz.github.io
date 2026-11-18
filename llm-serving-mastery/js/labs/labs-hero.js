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
    function size() {
      canvas.width = Math.max(600, canvas.clientWidth * (window.devicePixelRatio || 1));
      canvas.height = Math.max(240, canvas.clientHeight * (window.devicePixelRatio || 1));
    }
    size();
    const onResize = () => size();
    window.addEventListener("resize", onResize);
    const xs = [0.09, 0.37, 0.63, 0.91];
    const particles = Array.from({ length: 26 }, () => ({
      x: rnd(), lane: 0.5 + (rnd() - 0.5) * 0.16, v: 0.0016 + rnd() * 0.0022,
      r: 1.6 + rnd() * 2.6, alt: rnd() > 0.75,
    }));
    let t0 = null;
    function draw(ts) {
      if (!t0) t0 = ts;
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = "rgba(148, 163, 184, 0.35)";
      ctx.setLineDash([6, 8]);
      ctx.beginPath();
      ctx.moveTo(xs[0] * W, H * 0.72); ctx.lineTo(xs[xs.length - 1] * W, H * 0.72);
      ctx.stroke();
      ctx.setLineDash([]);
      const acc = liveAccent();
      xs.forEach((x, i) => {
        ctx.fillStyle = acc;
        ctx.shadowColor = acc; ctx.shadowBlur = 18;
        ctx.beginPath(); ctx.arc(x * W, H * 0.72, 10, 0, 7); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "rgba(232, 238, 247, 0.85)";
        ctx.font = "600 " + Math.round(H * 0.055) + "px ui-monospace, monospace";
        ctx.textAlign = "center";
        ctx.fillText(labels[i] || "", x * W, H * 0.72 + 34);
      });
      particles.forEach((pt) => {
        pt.x += pt.v;
        if (pt.x > 1.02) { pt.x = -0.02; pt.lane = 0.5 + (rnd() - 0.5) * 0.16; }
        const y = H * 0.72 + Math.sin(pt.x * 14 + pt.lane * 20) * H * 0.10;
        ctx.globalAlpha = 0.55 + 0.45 * Math.sin(pt.x * 30);
        ctx.fillStyle = pt.alt ? liveAccent2() : acc;
        ctx.beginPath(); ctx.arc(pt.x * W, y, pt.r, 0, 7); ctx.fill();
        ctx.globalAlpha = 1;
      });
      raf = requestAnimationFrame(draw);
    }
    let raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); };
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
