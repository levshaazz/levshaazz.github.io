/* exam-quiz.js — progressive enhancement for an exam post-test (src/components/ExamQuiz.astro).
   Without JavaScript the tasks stay readable and printable. With it, "Check"
   grades the answers once by key — 5 points for a correct task, 0 otherwise —
   marks every task, opens its explanation and reports the score; "Start over"
   clears the marks. Nothing is sent anywhere.
   Task types (data-type on each [data-exam-q]):
     single  radios;        data-correct = index of the right option
     multi   checkboxes;    data-correct = comma-separated indices, order ignored
     text    text input;    data-answers = JSON list of accepted spellings (normalized)
     number  text input;    data-answer = number, data-tol = absolute tolerance */
(function () {
  "use strict";

  var LETTERS = "ABCDEF";

  function normalize(value) {
    return String(value == null ? "" : value).toLowerCase().replace(/ё/g, "е")
      .replace(/[.,;:!?"'«»()[\]]/g, " ").replace(/\s+/g, " ").trim();
  }
  function parseNumber(value) {
    return Number(String(value == null ? "" : value).replace(/[\s\u00a0\u202f]/g, "").replace(",", "."));
  }
  function formatNumber(n) {
    return Number.isInteger(n) ? String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0") : String(Math.round(n * 100) / 100);
  }

  // → { right: boolean|null, answer: string } — null means "no answer given".
  function judge(q) {
    var type = q.dataset.type;
    if (type === "single" || type === "multi") {
      var picked = [].slice.call(q.querySelectorAll("input:checked")).map(function (i) { return Number(i.value); });
      var correct = q.dataset.correct.split(",").map(Number);
      var same = picked.length === correct.length && picked.every(function (v) { return correct.indexOf(v) !== -1; });
      var letters = correct.map(function (i) { return LETTERS.charAt(i); }).join(", ");
      return { right: picked.length ? same : null, answer: letters };
    }
    var input = q.querySelector("input");
    var raw = input ? input.value : "";
    if (type === "text") {
      var wanted = JSON.parse(q.dataset.answers);
      var hit = wanted.indexOf(normalize(raw));
      var shown = q.dataset.shown ? JSON.parse(q.dataset.shown) : null;
      return { right: raw.trim() ? hit !== -1 : null, answer: shown ? (shown[document.documentElement.lang === "ru" ? "ru" : "en"] || shown.en) : wanted[0] };
    }
    if (type === "number") {
      var expected = Number(q.dataset.answer), tol = Number(q.dataset.tol || 0), value = parseNumber(raw);
      var ok = raw.trim() !== "" && Number.isFinite(value) && Math.abs(value - expected) <= tol;
      return { right: raw.trim() ? ok : null, answer: formatNumber(expected) + (q.dataset.unit || "") };
    }
    return { right: null, answer: "" };
  }

  function grade(quiz, questions, points) {
    var total = 0, okCount = 0;
    questions.forEach(function (q) {
      var verdict = judge(q);
      if (verdict.right === true) { total += points; okCount += 1; }
      q.dataset.state = verdict.right === null ? "empty" : verdict.right ? "right" : "wrong";
      var template = verdict.right === true ? quiz.dataset.msgRight : verdict.right === null ? quiz.dataset.msgEmpty : quiz.dataset.msgWrong;
      q.querySelector("[data-verdict]").textContent = template.replace("{answer}", verdict.answer);
      q.querySelector("[data-explain]").hidden = false;
    });
    var result = quiz.querySelector("[data-result]");
    result.textContent = quiz.dataset.msgResult
      .replace("{points}", String(total)).replace("{max}", String(points * questions.length))
      .replace("{ok}", String(okCount)).replace("{n}", String(questions.length));
    result.hidden = false;
    quiz.querySelector("[data-quiz-reset]").hidden = false;
    quiz.querySelector("[data-quiz-check]").disabled = true;
    // The score is the answer to the click: move focus to it so keyboard and
    // screen-reader users land on the outcome, not on a disabled button.
    result.focus();
  }

  function reset(quiz, questions) {
    questions.forEach(function (q) {
      // Only the typed fields lose their value: the `value` of a radio or a
      // checkbox is the option's number, and wiping it would break the next grading.
      q.querySelectorAll("input[type=radio], input[type=checkbox]").forEach(function (input) { input.checked = false; });
      var typed = q.querySelector(".exam-input");
      if (typed) typed.value = "";
      delete q.dataset.state;
      q.querySelector("[data-verdict]").textContent = "";
      q.querySelector("[data-explain]").hidden = true;
    });
    var result = quiz.querySelector("[data-result]");
    result.textContent = "";
    result.hidden = true;
    quiz.querySelector("[data-quiz-reset]").hidden = true;
    var check = quiz.querySelector("[data-quiz-check]");
    check.disabled = false;
    check.focus();
  }

  document.querySelectorAll("[data-exam-quiz]").forEach(function (quiz) {
    var check = quiz.querySelector("[data-quiz-check]");
    if (!check) return;
    var questions = Array.prototype.slice.call(quiz.querySelectorAll("[data-exam-q]"));
    var points = Number(quiz.dataset.points) || 5;
    // The button appears only where it works; without JS the form stays a form.
    check.hidden = false;
    check.addEventListener("click", function () { grade(quiz, questions, points); });
    quiz.querySelector("[data-quiz-reset]").addEventListener("click", function () { reset(quiz, questions); });
  });
})();
