/* labs-index.js — progress rings for the labs index grid.
   Reads localStorage progress written by the lab pages (lsm.labN + lsm.labN.total). */
(function () {
  "use strict";
  function ring(tile) {
    const n = tile.dataset.lab;
    let done = 0, total = 0;
    try {
      const p = JSON.parse(localStorage.getItem("lsm.lab" + n) || "{}");
      total = Number(tile.dataset.labTotal || p.total || 0);
      done = Object.keys(p).filter(k => p[k] && k !== "total" && k.indexOf(":") === -1).length;
    } catch (e) { return; }
    const svg = tile.querySelector(".lab-ring");
    if (!svg || !total) return;
    const R = 18, C = 2 * Math.PI * R;
    const fg = svg.querySelector(".fg");
    const txt = svg.querySelector("text");
    fg.style.strokeDasharray = C.toFixed(1);
    fg.style.strokeDashoffset = (C * (1 - done / total)).toFixed(1);
    txt.textContent = done + "/" + total;
  }
  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".lab-tile[data-lab]").forEach(ring);
  });
})();
