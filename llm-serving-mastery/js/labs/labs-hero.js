/* labs-hero.js — seeded "requests → edge → engine → tokens" flow animator.
   window.LSMHero.mount(canvas, accent, labels, seed) — deterministic per seed. */
(function () {
  "use strict";
  function mount(canvas, accent, labels, seed) {
    if (!canvas || !canvas.getContext) return () => {};
    const ctx = canvas.getContext("2d");
    labels = labels || ["client", "edge", "engine", "tokens"];
    seed = seed == null ? 13 : seed;
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
      xs.forEach((x, i) => {
        ctx.fillStyle = accent;
        ctx.shadowColor = accent; ctx.shadowBlur = 18;
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
        ctx.fillStyle = pt.alt ? "#a78bfa" : accent;
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
