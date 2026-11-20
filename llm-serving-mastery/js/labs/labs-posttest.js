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

  // Deterministic per-item option shuffle: content authors should not have to
  // hand-place correct answers (all-A/all-B was a real audit finding), and the
  // same seed keeps RU/EN order identical. Seed = stable hash of the item id.
  function shuffleOptions(it, seedPrefix, itemIndex) {
    let h = 2166136261;
    // seed per lab+id+item: identical ids across labs must not share a
    // permutation, and a single lab must not land on all-same positions
    const key = String(seedPrefix || "") + ":" + String(it.id || "") + ":" + String(itemIndex);
    for (let i = 0; i < key.length; i += 1) {
      h ^= key.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    const rnd = () => {
      h = Math.imul(h ^ (h >>> 15), 2246822519);
      h = Math.imul(h ^ (h >>> 13), 3266489917);
      return ((h ^= h >>> 16) >>> 0) / 4294967296;
    };
    const pairs = it.options.map((opt, i) => ({ opt, ok: i === it.answer }));
    for (let i = pairs.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rnd() * (i + 1));
      [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
    }
    return pairs;
  }

  window.LSMPosttest = {
    /**
     * render(host, items, opts)
     *  items: [{id, q:{en,ru}, options:[{en,ru},...], answer: <index>, explain:{en,ru}}]
     *         optional per item: tag:{en,ru} (a head chip, e.g. a cross-topic
     *         bridge), context:{en,ru} (a lead-in paragraph), code:string
     *         (a read-only module shown above the question — code-reading).
     *  opts:  { lang, seedPrefix, onCorrect(id) }
     */
    shuffleOptions,
    render(host, items, opts) {
      const lang = (opts && opts.lang) || "en";
      const seedPrefix = (opts && opts.seedPrefix) || "";
      const onCorrect = (opts && opts.onCorrect) || (() => {});
      const solvedMap = (opts && opts.solved) || {};
      const trl = (f) => tr(f, lang);
      const allPairs = items.map((it, itemIndex) => shuffleOptions(it, seedPrefix, itemIndex));
      const okPos = allPairs.map((ps) => ps.findIndex((p) => p.ok));
      if (items.length > 1 && okPos.every((p) => p === okPos[0])) {
        // every correct answer on the same button is a pattern a student learns
        // after one lab; rotate item i by i (deterministic, RU/EN identical)
        allPairs.forEach((ps, i) => {
          const shift = i % ps.length;
          for (let r = 0; r < shift; r += 1) ps.push(ps.shift());
        });
      }
      items.forEach((it, itemIndex) => {
        const pairs = allPairs[itemIndex];
        const card = el("div", "lab-card lab-mc");
        card.dataset.labCheckpoint = it.id;
        const head = el("div", "lab-mc-head");
        if (it.tag) head.appendChild(el("span", "lab-mc-tag", trl(it.tag)));
        head.appendChild(el("span", "lab-ex-status", it.id.toUpperCase()));
        head.appendChild(el("span", "lab-dot", ""));
        card.appendChild(head);
        card.appendChild(el("h3", "", trl(it.q)));
        if (it.code) {
          // чужой код показывается как есть: textContent, не innerHTML;
          // прокручиваемый регион обязан быть клавиатурно-достижимым (axe)
          const codeBox = document.createElement("pre");
          codeBox.className = "lab-mc-code";
          codeBox.tabIndex = 0;
          codeBox.textContent = typeof it.code === "string" ? it.code : trl(it.code);
          card.appendChild(codeBox);
        }
        if (it.context) card.appendChild(el("p", "lab-mc-context", trl(it.context)));
        const list = el("div", "lab-mc-options");
        let attempts = 0;
        let solved = false;
        const verdict = el("p", "lab-verdict");
        verdict.setAttribute("aria-live", "polite");
        const explain = el("p", "lab-mc-explain");
        explain.style.display = "none";
        pairs.forEach((pair, i) => {
          const btn = el("button", "lab-mc-opt");
          btn.type = "button";
          btn.appendChild(el("span", "lab-mc-letter", LETTERS[i]));
          btn.appendChild(el("span", "lab-mc-text", trl(pair.opt)));
          btn.addEventListener("click", () => {
            if (solved) return;
            attempts += 1;
            if (pair.ok) {
              solved = true;
              btn.classList.add("right");
              list.querySelectorAll(".lab-mc-opt").forEach((b) => { b.disabled = true; });
              verdict.dataset.state = "pass";
              verdict.textContent = (lang === "ru" ? "верно" : "correct") +
                (attempts > 1 ? " · " + (lang === "ru" ? "с " + attempts + "-й попытки" : "on attempt " + attempts) : "");
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
        // L1a-6: уже решённый пост-тест после reload восстанавливает решённый вид
        if (solvedMap[it.id]) {
          const okIndex = pairs.findIndex((p2) => p2.ok);
          const btns = list.querySelectorAll(".lab-mc-opt");
          btns.forEach((b) => { b.disabled = true; });
          if (btns[okIndex]) btns[okIndex].classList.add("right");
          verdict.dataset.state = "pass";
          verdict.textContent = lang === "ru" ? "верно" : "correct";
          explain.style.display = "block";
          explain.textContent = trl(it.explain);
        }
        card.appendChild(list);
        card.appendChild(verdict);
        card.appendChild(explain);
        host.appendChild(card);
      });
    },
  };
})();
