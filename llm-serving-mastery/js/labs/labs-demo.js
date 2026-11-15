/* labs-demo.js — four live canvas scenes for the labs demo page.
   Decorative seeded simulations (like the donor's /demo): they illustrate the
   mechanisms the labs teach; they measure nothing. */
(function () {
  "use strict";
  const lang = document.documentElement.dataset.lang === "ru" ? "ru" : "en";
  const R = Math.round;
  const sceneTexts = {
    ru: {
      ttft: "TTFT", tok: "токены", full: "пул заполнен", evict: "эвикция",
      allreduce: "all-reduce", step: "шаг", ok: "200", rejected: "429",
    },
    en: {
      ttft: "TTFT", tok: "tokens", full: "pool full", evict: "evict",
      allreduce: "all-reduce", step: "step", ok: "200", rejected: "429",
    },
  }[lang];

  function setup(canvas) {
    function size() {
      canvas.width = Math.max(600, canvas.clientWidth * (window.devicePixelRatio || 1));
      canvas.height = Math.max(220, canvas.clientHeight * (window.devicePixelRatio || 1));
    }
    size();
    window.addEventListener("resize", size);
    return canvas.getContext("2d");
  }

  function seedOf(n) { let s = n * 48271 + 11; return () => { s = (s * 48271) % 2147483647; return s / 2147483647; }; }

  // 01 · streaming: tokens stream in after a TTFT gap, then reset
  function stream(canvas, accent) {
    const ctx = setup(canvas);
    const rnd = seedOf(101);
    const words = Array.from({ length: 40 }, () => (rnd() > 0.5 ? "▁tok" : "▁the"));
    let t = 0;
    function draw() {
      const W = canvas.width, H = canvas.height;
      t += 1;
      ctx.clearRect(0, 0, W, H);
      const ttftMs = 160, stepMs = 18, cycle = ttftMs + 40 * stepMs + 600;
      const now = t % cycle;
      ctx.font = "600 " + R(H * 0.05) + "px ui-monospace, monospace";
      let x = W * 0.06, y = H * 0.4;
      for (let i = 0; i < 40; i++) {
        const arrival = ttftMs + i * stepMs;
        if (now < arrival) break;
        ctx.fillStyle = i === 0 ? accent : "rgba(125, 211, 252, 0.9)";
        ctx.fillText(words[i], x, y);
        x += ctx.measureText(words[i]).width + 8;
        if (x > W * 0.92) { x = W * 0.06; y += H * 0.14; }
      }
      const marker = now < ttftMs ? "…" : (now < ttftMs + 40 * stepMs ? sceneTexts.tok : "…");
      ctx.fillStyle = accent;
      ctx.fillText("t=" + now + "ms  " + marker, W * 0.06, H * 0.86);
      if (now >= ttftMs && now < ttftMs + stepMs) {
        ctx.fillStyle = accent; ctx.fillText("◆ " + sceneTexts.ttft, W * 0.72, H * 0.3);
      }
      requestAnimationFrame(() => draw());
    }
    draw();
  }

  // 02 · KV blocks: 16-token blocks fill, tails waste, pool evicts
  function kv(canvas, accent) {
    const ctx = setup(canvas);
    const rnd = seedOf(202);
    const blocks = Array.from({ length: 24 }, () => ({ fill: 0 }));
    let tick = 0;
    function draw() {
      tick += 1;
      if (tick % 6 === 0) {
        const free = blocks.filter((b) => b.fill < 16);
        if (free.length) {
          const b = free[Math.floor(rnd() * free.length)];
          b.fill = Math.min(16, b.fill + 4);
        } else {
          blocks.forEach((b) => (b.fill = 0)); // pool reset = eviction wave
        }
      }
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      const cols = 12, cell = Math.min((W - 40) / cols, (H - 80) / 2);
      blocks.forEach((b, i) => {
        const x = 20 + (i % cols) * cell, y = 30 + Math.floor(i / cols) * (cell + 14);
        ctx.strokeStyle = "rgba(148, 163, 184, 0.4)";
        ctx.strokeRect(x, y, cell - 6, cell - 6);
        ctx.fillStyle = accent;
        ctx.fillRect(x + 2, y + 2, ((cell - 10) * b.fill) / 16, cell - 10);
        ctx.fillStyle = "rgba(232, 238, 247, 0.75)";
        ctx.font = "600 " + R(H * 0.045) + "px ui-monospace, monospace";
        ctx.fillText(String(b.fill) + "/16", x, y + cell + 10);
      });
      requestAnimationFrame(() => draw());
    }
    draw();
  }

  // 03 · TP split: shards pulse, meet in an all-reduce bar every cycle
  function tp(canvas, accent) {
    const ctx = setup(canvas);
    let t = 0;
    function draw() {
      t += 1;
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      const cycle = 240, phase = t % cycle;
      const gpus = [0, 1, 2, 3];
      gpus.forEach((g) => {
        const x = W * (0.12 + g * 0.2);
        ctx.fillStyle = accent; ctx.shadowColor = accent; ctx.shadowBlur = 14;
        ctx.fillRect(x, H * 0.3, W * 0.1, H * 0.28);
        ctx.shadowBlur = 0;
        ctx.fillStyle = "rgba(232, 238, 247, 0.85)";
        ctx.font = "600 " + R(H * 0.05) + "px ui-monospace, monospace";
        ctx.fillText("GPU" + g, x, H * 0.27);
        // shards working: progress bars
        const prog = Math.min(1, phase / (cycle * 0.55));
        ctx.fillStyle = "rgba(148, 163, 184, 0.25)";
        ctx.fillRect(x, H * 0.62, W * 0.1, 8);
        ctx.fillStyle = accent;
        ctx.fillRect(x, H * 0.62, W * 0.1 * prog, 8);
      });
      // all-reduce flash at 55%..75% of the cycle
      if (phase > cycle * 0.55 && phase < cycle * 0.75) {
        ctx.strokeStyle = accent; ctx.lineWidth = 2;
        ctx.setLineDash([4, 6]);
        ctx.beginPath();
        gpus.forEach((g) => {
          const x = W * (0.17 + g * 0.2);
          ctx.moveTo(x, H * 0.44); ctx.lineTo(W * 0.5, H * 0.52);
        });
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "#a78bfa";
        ctx.fillText(sceneTexts.allreduce, W * 0.5, H * 0.58);
      } else {
        ctx.fillStyle = "rgba(232, 238, 247, 0.7)";
        ctx.fillText(sceneTexts.step + " " + (Math.floor(t / cycle) + 1), W * 0.5, H * 0.14);
      }
      requestAnimationFrame(() => draw());
    }
    draw();
  }

  // 04 · burst: 24 requests hit 4+4 slots; latecomers bounce with 429
  function burst(canvas, accent) {
    const ctx = setup(canvas);
    const rnd = seedOf(404);
    const reqs = Array.from({ length: 24 }, (_, i) => ({
      i, x: (0.03 + rnd() * 0.94), yf: 0.12 + rnd() * 0.12,
      admitted: i < 8, wait: i >= 4 && i < 8, phase: rnd() * Math.PI,
    }));
    let t = 0;
    function draw() {
      t += 1;
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      const slots = [0.2, 0.35, 0.5, 0.65].map((f) => f * W);
      const cycle = 200, ph = t % cycle;
      slots.forEach((x, i) => {
        ctx.strokeStyle = "rgba(148, 163, 184, 0.4)";
        ctx.strokeRect(x, H * 0.45, 46, 46);
        ctx.fillStyle = accent;
        const busy = reqs.slice(0, 4)[i] && (ph + i * 17) % cycle < cycle * 0.6;
        if (busy) ctx.fillRect(x + 4, H * 0.45 + 4, 38, 38);
        ctx.fillStyle = "rgba(232, 238, 247, 0.8)";
        ctx.font = "600 " + R(H * 0.04) + "px ui-monospace, monospace";
        ctx.fillText(sceneTexts.ok, x + 6, H * 0.45 + 62);
      });
      reqs.forEach((r) => {
        if (!r.admitted) {
          const y = H * r.yf + Math.sin(t / 20 + r.phase) * 8;
          ctx.fillStyle = "#f87171";
          ctx.font = "700 " + R(H * 0.05) + "px ui-monospace, monospace";
          ctx.fillText("429", r.x * W, y);
        }
      });
      requestAnimationFrame(() => draw());
    }
    draw();
  }

  const SCENES = { stream, kv, tp, burst };
  const ACCENTS = { stream: "#38e1ff", kv: "#4ade80", tp: "#a78bfa", burst: "#fb923c" };

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".lab-demo[data-demo]").forEach((host) => {
      const kind = host.dataset.demo;
      const canvas = host.querySelector("canvas");
      if (canvas && SCENES[kind]) SCENES[kind](canvas, ACCENTS[kind] || "#38e1ff");
    });
  });
})();
