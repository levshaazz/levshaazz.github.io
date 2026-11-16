/* labs-figures.js — staged inline-SVG figures for practice labs.
   Content schema (lab content modules):
     figures: [{
       id, title: {en, ru}, w, h,
       svg: `<svg viewBox="0 0 760 420" ...><g id="...">...</g>...</svg>`,
       stages: [{ cap: {en, ru}, show: ["groupId", ...] }, ...]
     }]
   Stage k shows exactly `show` groups: groups first revealed earlier are
   dimmed (.fig-past-g), groups first revealed at k are full (.fig-new-g),
   the rest hidden. Authoring rules:
   instructor/plans/labs-figure-rules-20261114.ru.md — one idea per stage,
   motion only where data really moves, colors via shell vars, numbers must
   match the lab content. No autoplay by default; prefers-reduced-motion
   disables it; animations pause when the figure is offscreen. */
(function () {
  "use strict";
  var REDUCED = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var DWELL_MS = 4800; // autoplay dwell per stage, generous under RU captions

  function tr(f, lang) {
    if (f == null) return "";
    return typeof f === "string" ? f : f[lang] || f.en || "";
  }
  function el(tag, cls, html) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (html != null) node.innerHTML = html;
    return node;
  }

  function mount(host, fig, lang) {
    if (!host || !fig || !fig.svg) return;
    var stages = fig.stages || [];
    var ru = lang === "ru";
    var L = {
      restart: ru ? "Заново" : "Restart",
      prev: ru ? "Предыдущий стейдж" : "Previous stage",
      next: ru ? "Следующий стейдж" : "Next stage",
      play: ru ? "Автопрокрутка стейджей" : "Autoplay stages",
      pause: ru ? "Пауза" : "Pause",
      stage: ru ? "Стейдж" : "Stage",
    };

    var figure = el("figure", "lab-figure lab-fig");
    figure.dataset.fig = fig.id || "";
    figure.setAttribute("tabindex", "0");

    var head = el("div", "lab-fig-head");
    head.appendChild(el("span", "lab-fig-title", tr(fig.title, lang)));
    var count = el("span", "lab-fig-count", "");
    head.appendChild(count);
    var controls = el("div", "lab-fig-controls");
    function mkBtn(label, glyph) {
      var b = el("button", "lab-fig-btn", glyph);
      b.type = "button";
      b.setAttribute("aria-label", label);
      b.title = label;
      return b;
    }
    var bRestart = mkBtn(L.restart, "↺");
    var bPrev = mkBtn(L.prev, "◀");
    var bNext = mkBtn(L.next, "▶");
    var bPlay = mkBtn(L.play, "⏵");
    controls.appendChild(bRestart); controls.appendChild(bPrev);
    controls.appendChild(bNext); controls.appendChild(bPlay);
    head.appendChild(controls);
    figure.appendChild(head);

    var canvas = el("div", "lab-fig-canvas");
    canvas.innerHTML = fig.svg;
    var svgEl = canvas.querySelector("svg");
    if (svgEl) {
      svgEl.setAttribute("role", "img");
      svgEl.setAttribute("aria-label", tr(fig.title, lang));
    }
    // word labels inside the SVG carry data-en/data-ru; the page language wins
    canvas.querySelectorAll("text[data-en], tspan[data-en]").forEach(function (t) {
      var localized = ru ? (t.getAttribute("data-ru") || t.getAttribute("data-en"))
        : t.getAttribute("data-en");
      if (localized) t.textContent = localized;
    });
    figure.appendChild(canvas);

    var cap = el("figcaption", "lab-fig-cap");
    figure.appendChild(cap);

    var dots = el("div", "lab-fig-dots");
    var dotBtns = stages.map(function (st, i) {
      var d = el("button", "");
      d.type = "button";
      d.setAttribute("aria-label", L.stage + " " + (i + 1));
      d.addEventListener("click", function () { stopPlay(); go(i); });
      dots.appendChild(d);
      return d;
    });
    figure.appendChild(dots);

    // group registry: first stage each group appears in
    var groups = new Map();
    stages.forEach(function (st, i) {
      (st.show || []).forEach(function (id) {
        if (!groups.has(id)) {
          groups.set(id, { el: canvas.querySelector('g[id="' + id + '"]'), first: i });
        }
      });
    });

    var state = 0;
    var settleTimer = null;
    function go(k) {
      state = Math.max(0, Math.min(stages.length - 1, k));
      // transitions animate the change for foreground viewers; after 650 ms
      // transitions are switched off so the stage state is final even when
      // the renderer throttles the tab (background panes, screenshots)
      canvas.classList.remove("fig-settle");
      if (settleTimer) clearTimeout(settleTimer);
      settleTimer = setTimeout(function () { canvas.classList.add("fig-settle"); }, 650);
      var cur = stages[state] || { show: [] };
      var show = new Set(cur.show || []);
      groups.forEach(function (g, id) {
        if (!g.el) return;
        g.el.classList.remove("fig-new-g", "fig-past-g", "fig-hidden-g");
        g.el.classList.add(!show.has(id) ? "fig-hidden-g"
          : (g.first === state ? "fig-new-g" : "fig-past-g"));
      });
      count.textContent = (state + 1) + " / " + stages.length;
      cap.textContent = tr(cur.cap, lang);
      dotBtns.forEach(function (d, i) {
        d.setAttribute("aria-current", i === state ? "true" : "false");
      });
      bPrev.disabled = state === 0;
      bNext.disabled = state === stages.length - 1;
    }

    var timer = null;
    function stopPlay() {
      if (timer) { clearInterval(timer); timer = null; }
      bPlay.textContent = "⏵";
      bPlay.setAttribute("aria-label", L.play);
    }
    function startPlay() {
      if (REDUCED || timer || stages.length < 2) return;
      bPlay.textContent = "⏸";
      bPlay.setAttribute("aria-label", L.pause);
      timer = setInterval(function () {
        if (state >= stages.length - 1) stopPlay();
        else go(state + 1);
      }, DWELL_MS);
    }

    bRestart.addEventListener("click", function () { stopPlay(); go(0); });
    bPrev.addEventListener("click", function () { stopPlay(); go(state - 1); });
    bNext.addEventListener("click", function () { stopPlay(); go(state + 1); });
    bPlay.addEventListener("click", function () {
      if (timer) stopPlay();
      else { if (state >= stages.length - 1) go(0); startPlay(); }
    });
    figure.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { stopPlay(); go(state + 1); e.preventDefault(); }
      else if (e.key === "ArrowLeft") { stopPlay(); go(state - 1); e.preventDefault(); }
    });

    if (REDUCED) bPlay.style.display = "none";
    if (window.IntersectionObserver) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          canvas.classList.toggle("fig-offscreen", !entry.isIntersecting);
          if (!entry.isIntersecting) stopPlay();
        });
      }, { threshold: 0.2 });
      io.observe(canvas);
    }

    host.appendChild(figure);
    go(0);
  }

  window.LSMFigures = { mount: mount };
})();
