/* labs-posttest.js — end-of-lab self-check (multiple choice).
   Friendly self-check: a wrong first attempt shows the correct answer with an
   explanation and lets you retry; the checkpoint completes when you answer
   correctly. Attempts are counted and reported honestly. */
(function () {
  "use strict";

  function el(tag, cls, html) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (html != null) node.innerHTML = html;
    return node;
  }
  function tr(f, lang) {
    if (f == null) return "";
    return typeof f === "string" ? f : f[lang] || f.en || "";
  }

  const LETTERS = ["A", "B", "C", "D", "E"];

  window.LSMPosttest = {
    /**
     * render(host, items, opts)
     *  items: [{id, q:{en,ru}, options:[{en,ru},...], answer: <index>, explain:{en,ru}}]
     *  opts:  { lang, onCorrect(id) }
     */
    render(host, items, opts) {
      const lang = (opts && opts.lang) || "en";
      const onCorrect = (opts && opts.onCorrect) || (() => {});
      const trl = (f) => tr(f, lang);
      items.forEach((it) => {
        const card = el("div", "lab-card lab-mc");
        card.dataset.labCheckpoint = it.id;
        const head = el("div", "lab-mc-head");
        head.appendChild(el("span", "lab-ex-status", it.id.toUpperCase()));
        head.appendChild(el("span", "lab-dot", ""));
        card.appendChild(head);
        card.appendChild(el("h3", "", trl(it.q)));
        const list = el("div", "lab-mc-options");
        let attempts = 0;
        let solved = false;
        const verdict = el("p", "lab-verdict");
        verdict.setAttribute("aria-live", "polite");
        const explain = el("p", "lab-mc-explain");
        explain.style.display = "none";
        it.options.forEach((opt, i) => {
          const btn = el("button", "lab-mc-opt");
          btn.type = "button";
          btn.appendChild(el("span", "lab-mc-letter", LETTERS[i]));
          btn.appendChild(el("span", "lab-mc-text", trl(opt)));
          btn.addEventListener("click", () => {
            if (solved) return;
            attempts += 1;
            if (i === it.answer) {
              solved = true;
              btn.classList.add("right");
              list.querySelectorAll(".lab-mc-opt").forEach((b) => { b.disabled = true; });
              verdict.dataset.state = "pass";
              verdict.textContent = (lang === "ru" ? "верно" : "correct") +
                (attempts > 1 ? " · " + (lang === "ru" ? "со второй попытки" : "on attempt " + attempts) : "");
              explain.style.display = "block";
              explain.textContent = trl(it.explain);
              onCorrect(it.id);
            } else {
              btn.classList.add("wrong");
              btn.disabled = true;
              verdict.dataset.state = "fail";
              verdict.textContent = lang === "ru"
                ? "не то — подумай ещё, варианты с ошибкой отключены"
                : "not it — keep thinking, wrong options are disabled";
            }
          });
          list.appendChild(btn);
        });
        card.appendChild(list);
        card.appendChild(verdict);
        card.appendChild(explain);
        host.appendChild(card);
      });
    },
  };
})();
