/* labs-variants.js — per-student parameterization of numeric quizzes (№5).
   A content quiz may declare variants:[{q, answer, tol, hint?, followUp?}, ...]
   (variants[0] is the shipped base, answers pairwise distinct — the contract
   lives in instructor/plans/quiz-variants-contract-20261125.ru.md and is
   enforced by scripts/check-content.mjs). Each student draws ONE variant
   deterministically from a persistent per-browser seed, so a returning student
   always sees the same numbers while different students see different ones.

   Practice only: the seed lives in localStorage, never leaves the browser and
   is never course evidence. Same FNV-1a + murmur arithmetic as the option
   shuffle in labs-posttest.js. */
(function () {
  "use strict";

  var SEED_KEY = "lsm.seed.v1";
  var HEX = "0123456789abcdef";

  function randomHex8() {
    var s = "";
    for (var i = 0; i < 8; i += 1) s += HEX[Math.floor(Math.random() * 16)];
    return s;
  }

  // 8 hex chars, generated on first use and persisted; a private-mode browser
  // falls back to a fresh random seed per session (still deterministic within
  // the session, so restore keeps the same variant).
  function seed() {
    try {
      var s = localStorage.getItem(SEED_KEY);
      if (s && /^[0-9a-f]{8}$/.test(s)) return s;
      var fresh = randomHex8();
      try { localStorage.setItem(SEED_KEY, fresh); } catch (e) { /* private mode */ }
      return fresh;
    } catch (e) {
      return randomHex8(); // localStorage unavailable entirely
    }
  }

  // FNV-1a over the key + murmur-style finalizer: the same arithmetic the
  // post-test option shuffle uses (labs-posttest.js), minus the /2^32 step —
  // we need a uniform u32, not a float in [0, 1).
  function hashU32(key) {
    var h = 2166136261;
    for (var i = 0; i < key.length; i += 1) {
      h ^= key.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    h = Math.imul(h ^ (h >>> 15), 2246822519);
    h = Math.imul(h ^ (h >>> 13), 3266489917);
    return ((h ^= h >>> 16) >>> 0);
  }

  // Deterministic variant index in [0, count): stable per (lab, quiz, browser).
  function pick(labId, quizId, count) {
    if (!(count >= 1)) return 0;
    return hashU32(String(labId) + ":" + String(quizId) + ":" + seed()) % count;
  }

  // Effective quiz view for this browser: variant overrides win, everything the
  // variant does not declare (unit, id, followUp, ...) is inherited from the
  // base quiz object. With no variants declared (or the engine absent) the base
  // quiz object itself is returned — zero behavioural drift for quizzes that
  // do not opt in.
  function variantOf(labId, quiz) {
    if (!quiz || !Array.isArray(quiz.variants) || quiz.variants.length < 2) return quiz;
    var idx = pick(labId, quiz.id, quiz.variants.length);
    var v = quiz.variants[idx] || {};
    return {
      id: quiz.id,
      unit: quiz.unit,
      q: v.q !== undefined ? v.q : quiz.q,
      answer: v.answer !== undefined ? v.answer : quiz.answer,
      tol: v.tol !== undefined ? v.tol : quiz.tol,
      hint: v.hint !== undefined ? v.hint : quiz.hint,
      followUp: v.followUp !== undefined ? v.followUp : quiz.followUp,
      variant: idx,
    };
  }

  window.LSMVariants = { seed: seed, pick: pick, variantOf: variantOf };
})();
