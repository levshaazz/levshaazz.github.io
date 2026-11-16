/* Lab 03 — Quantization: range-derived scales and reconstruction error.
   Content module for the generic lab page (window.LABS_CONTENT['3']).
   Declared teaching grid (signed INT4, absmax/7); real Python tests run in the
   browser sandbox. Practice arithmetic only — no GPU, no NF4 kernel. */
(function () {
  "use strict";
  window.LABS_CONTENT = window.LABS_CONTENT || {};

  LABS_CONTENT["3"] = {
    title: {
      en: "Quantization: scales and reconstruction error",
      ru: "Квантование: масштабы и ошибки",
    },
    sub: {
      en: "Derive the scale from a declared INT4 grid, clip the codes, then defend the reconstruction error in real Python tests.",
      ru: "Выведи scale из заявленной сетки INT4, с клипом преврати веса в коды и защити ошибку реконструкции настоящими Python-тестами.",
    },
    intro: {
      en: `<p>Symmetric INT4 keeps one <strong>scale</strong> per row of weights and stores each weight as a small integer code from <strong>−8 to 7</strong>. The declared policy of this topic is <em>absmax/7</em>: divide the row's largest magnitude by the largest positive code, so the biggest weight lands exactly on 7 and the code −8 stays unused. The round trip is <code>code = clip(round(v / scale))</code> — rounding to nearest with ties to even (Python's <code>round</code>), then clipping to the grid — and the reconstruction is <code>scale × code</code>. Error appears in two places: weights that fall between grid points, and outliers whose scaled value exceeds ±7 — those codes hit the clip, and a round trip without clipping would silently report them as error-free.</p>
<p>The lab habit: declare the scale policy first, run the round trip on a tiny row, measure the signed error (reconstructed − original) and the mean squared error, and only then argue about NF4 or a real GPU. Every number here is deterministic toy arithmetic — the same one the notebook traces weight by weight — not a kernel measurement.</p>`,
      ru: `<p>Симметричное INT4 хранит один <strong>scale</strong> на строку весов и записывает каждый вес маленьким целым кодом от <strong>−8 до 7</strong>. Заявленная политика темы — <em>absmax/7</em>: делим максимальный по модулю вес строки на наибольший положительный код, так что самый крупный вес попадает ровно в 7, а код −8 остаётся неиспользованным. Полный цикл: <code>code = clip(round(v / scale))</code> — округление к ближайшему, связи к чётному (Python-овский <code>round</code>), затем клип в сетку, — а реконструкция это <code>scale × code</code>. Ошибка живёт в двух местах: веса между узлами сетки и выбросы, чьё значение после деления на scale выходит за ±7 — такие коды упираются в клип, а цикл без клипа молча отчитался бы о них как о безошибочных.</p>
<p>Привычка лабы: сначала объяви политику scale, прогони цикл квантования на крошечной строке, измерь знаковую ошибку (реконструкция − оригинал) и MSE, и только потом спорь про NF4 и реальный GPU. Каждое число здесь — детерминированная игрушечная арифметика, та же, что тетрадь трассирует вес за весом, а не измерение ядра.</p>`,
    },
    figures: [
      { id: "t3-groups", caption: { en: "Grouped quantization: scales per group, error per group.", ru: "\u0413\u0440\u0443\u043f\u043f\u043e\u0432\u043e\u0435 \u043a\u0432\u0430\u043d\u0442\u043e\u0432\u0430\u043d\u0438\u0435: \u043c\u0430\u0441\u0448\u0442\u0430\u0431\u044b \u0438 \u043e\u0448\u0438\u0431\u043a\u0438 \u043f\u043e \u0433\u0440\u0443\u043f\u043f\u0430\u043c." } },
      { id: "t3-active-error", caption: { en: "Active error: the codes that actually moved the output.", ru: "\u0410\u043a\u0442\u0438\u0432\u043d\u0430\u044f \u043e\u0448\u0438\u0431\u043a\u0430: \u043a\u043e\u0434\u044b, \u0440\u0435\u0430\u043b\u044c\u043d\u043e \u0441\u0434\u0432\u0438\u043d\u0443\u0432\u0448\u0438\u0435 \u0432\u044b\u0445\u043e\u0434." } },
    ],
    outcomes: [
      { en: "Derive a quantization scale from a value range and quantize with rounding and clipping.", ru: "\u0412\u044b\u0432\u043e\u0434\u0438\u0442\u044c \u043c\u0430\u0441\u0448\u0442\u0430\u0431 \u043a\u0432\u0430\u043d\u0442\u043e\u0432\u0430\u043d\u0438\u044f \u0438\u0437 \u0434\u0438\u0430\u043f\u0430\u0437\u043e\u043d\u0430 \u0438 \u043a\u0432\u0430\u043d\u0442\u043e\u0432\u0430\u0442\u044c \u0441 \u043e\u043a\u0440\u0443\u0433\u043b\u0435\u043d\u0438\u0435\u043c \u0438 \u043a\u043b\u0438\u043f\u043e\u043c." },
      { en: "Explain reconstruction error as a named mechanism, not a vague quality loss.", ru: "\u041e\u0431\u044a\u044f\u0441\u043d\u044f\u0442\u044c \u043e\u0448\u0438\u0431\u043a\u0443 \u0440\u0435\u043a\u043e\u043d\u0441\u0442\u0440\u0443\u043a\u0446\u0438\u0438 \u043a\u0430\u043a \u043d\u0430\u0437\u0432\u0430\u043d\u043d\u044b\u0439 \u043c\u0435\u0445\u0430\u043d\u0438\u0437\u043c, \u0430 \u043d\u0435 \u00ab\u043a\u0430\u043a\u0443\u044e-\u0442\u043e \u043f\u043e\u0442\u0435\u0440\u044e \u043a\u0430\u0447\u0435\u0441\u0442\u0432\u0430\u00bb." },
    ],
    model: [
      ["signed INT4 grid", "codes [-8, 7]", "rounding", "nearest, ties to even"],
      ["symmetric scale", "scale = absmax / 7", "all-zero group", "scale = 1.0"],
      ["code", "clip(round(v / scale))", "reconstruction", "scale × code"],
      ["signed error", "reconstructed − original", "row MSE", "mean of (v − recon)²"],
    ],
    scenario: null,
    quizzes: [
      {
        id: "q1",
        q: {
          en: "A weight row spans [-1.4, 0.9]. Under the absmax/7 policy, what is its scale?",
          ru: "Строка весов лежит в диапазоне [-1.4, 0.9]. По политике absmax/7 каков её scale?",
        },
        answer: 0.2, tol: 0.005, unit: { en: "per code step", ru: "на шаг кода" },
        hint: {
          en: "absmax = 1.4 (magnitude, not the signed max). scale = 1.4 / 7.",
          ru: "absmax = 1.4 (по модулю, а не максимум со знаком). scale = 1.4 / 7.",
        },
      },
      {
        id: "q2",
        q: {
          en: "With scale 0.2, what integer code does the weight 0.37 get?",
          ru: "При scale 0.2 какой целый код получит вес 0.37?",
        },
        answer: 2, tol: 0.01, unit: { en: "code", ru: "код" },
        hint: {
          en: "0.37 / 0.2 = 1.85 → round to nearest → 2. No clipping needed here.",
          ru: "0.37 / 0.2 = 1.85 → округление к ближайшему → 2. Клип тут не нужен.",
        },
      },
      {
        id: "q3",
        q: {
          en: "For that same weight (0.37, scale 0.2): what is the signed reconstruction error, reconstructed − original?",
          ru: "Для того же веса (0.37, scale 0.2): какова знаковая ошибка реконструкции, реконструкция − оригинал?",
        },
        answer: 0.03, tol: 0.005, unit: { en: "recon − orig", ru: "рекон − ориг" },
        hint: {
          en: "Code 2 reconstructs to 2 × 0.2 = 0.4; the signed error is 0.4 − 0.37.",
          ru: "Код 2 реконструируется в 2 × 0.2 = 0.4; знаковая ошибка равна 0.4 − 0.37.",
        },
      },
    ],
    exercises: [
      {
        id: "ex1",
        title: { en: "Exercise 1 · Range-derived scale", ru: "Упражнение 1 · Scale из диапазона" },
        brief: {
          en: "Implement <code>absmax_scale(values, levels=7)</code> — the symmetric scale of a row: <code>absmax / levels</code>, where absmax is the largest magnitude. Declared edge convention: an all-zero row has no range, return <code>1.0</code> (same as the notebook's zero-group rule).",
          ru: "Реализуй <code>absmax_scale(values, levels=7)</code> — симметричный scale строки: <code>absmax / levels</code>, где absmax — максимальный модуль. Заявленное краевое соглашение: у нулевой строки диапазона нет, возвращай <code>1.0</code> (как правило нулевой группы в тетради).",
        },
        starter: `def absmax_scale(values, levels=7):
    """Symmetric range-derived scale: absmax / levels; zero row -> 1.0."""
    # TODO: one formula plus the declared zero-row convention
`,
        tests: [
          { name: "row with negative outlier", hidden: false, code: "approx(absmax_scale([0.13, -0.88, 1.12, -2.40]), 2.40 / 7, 1e-12)" },
          { name: "row with clipped top", hidden: false, code: "approx(absmax_scale([-1.83, -0.52, 0.24, 2.25]), 2.25 / 7, 1e-12)" },
          { name: "all-zero row convention", hidden: true, code: "eq(absmax_scale([0.0, 0.0, 0.0]), 1.0)" },
          { name: "single weight", hidden: true, code: "approx(absmax_scale([5.0]), 5.0 / 7, 1e-12)" },
        ],
        solution: `def absmax_scale(values, levels=7):
    absmax = max(abs(v) for v in values)
    return absmax / levels if absmax else 1.0`,
        hints: [
          { en: "abs() first, max() second: a negative outlier must set the scale.", ru: "Сначала abs(), потом max(): отрицательный выброс обязан задавать scale." },
          { en: "The zero row: 0 / 7 gives 0 — the declared convention replaces it with 1.0.", ru: "Нулевая строка: 0 / 7 даёт 0 — заявленное соглашение заменяет его на 1.0." },
        ],
        numpy: false,
        timeoutMs: 4000,
      },
      {
        id: "ex2",
        title: { en: "Exercise 2 · Symmetric row codes with clip", ru: "Упражнение 2 · Симметричные коды строки с клипом" },
        brief: {
          en: "Implement <code>quantize_row(values, scale)</code> — trace each weight like the notebook's <code>scalar()</code>: <code>round(v / scale)</code> (nearest, ties to even), then clip the code to <strong>[-8, 7]</strong>, and return the list of codes. On the TOY row with scale 0.25 the weight 2.25 maps to 9 — and must come back clipped to 7.",
          ru: "Реализуй <code>quantize_row(values, scale)</code> — трассируй каждый вес как <code>scalar()</code> из тетради: <code>round(v / scale)</code> (к ближайшему, связи к чётному), затем клип кода в <strong>[-8, 7]</strong>, и верни список кодов. В TOY-строке при scale 0.25 вес 2.25 отображается в 9 — и обязан вернуться клипом в 7.",
        },
        starter: `def quantize_row(values, scale):
    """Signed INT4 codes: round to nearest (ties to even), clip to [-8, 7]."""
    # TODO: round every weight, then clip each code into the grid
`,
        tests: [
          { name: "TOY row one clips the outlier", hidden: false, code: "eq(quantize_row([-1.83, -0.52, 0.24, 2.25], 0.25), [-7, -2, 1, 7])" },
          { name: "TOY row two clips at -8", hidden: false, code: "eq(quantize_row([0.13, -0.88, 1.12, -2.40], 0.25), [1, -4, 4, -8])" },
          { name: "tie rounds to even", hidden: true, code: "eq(quantize_row([0.625, -0.625], 0.25), [2, -2])" },
          { name: "flat zero row", hidden: true, code: "eq(quantize_row([0.0, 0.0], 0.25), [0, 0])" },
        ],
        solution: `def quantize_row(values, scale):
    return [max(-8, min(7, round(v / scale))) for v in values]`,
        hints: [
          { en: "Python's round() already does ties-to-even — do not write your own rounding.", ru: "Python-овский round() уже делает ties-to-even — не пиши своё округление." },
          { en: "Clip is max(-8, min(7, code)) — applied after rounding, per weight.", ru: "Клип — это max(-8, min(7, code)) — после округления, для каждого веса." },
        ],
        numpy: false,
        timeoutMs: 4000,
      },
      {
        id: "ex3",
        title: { en: "Exercise 3 · Fix the bug: unclipped MSE", ru: "Упражнение 3 · Почини баг: MSE без клипа" },
        brief: {
          en: "This <code>reconstruction_mse(values, scale)</code> runs the round trip but never clips the codes, so the outlier's error silently disappears: 2.25 quantizes to code 9 and reconstructs to exactly 2.25 — a lie, since INT4 cannot store 9. Fix it: clip each code to [-8, 7] before reconstructing, then average <code>(v − recon)²</code> over the row. On the TOY row the honest MSE is <strong>0.064225</strong>, not ≈0.0017.",
          ru: "Эта <code>reconstruction_mse(values, scale)</code> прогоняет цикл квантования, но нигде не клипует коды, поэтому ошибка выброса молча исчезает: 2.25 даёт код 9 и реконструируется ровно в 2.25 — ложь, ведь INT4 не может хранить 9. Почини: клипуй каждый код в [-8, 7] перед реконструкцией, затем усредняй <code>(v − recon)²</code> по строке. На TOY-строке честный MSE равен <strong>0.064225</strong>, а не ≈0.0017.",
        },
        starter: `def reconstruction_mse(values, scale):
    """Mean squared reconstruction error of the symmetric INT4 round trip."""
    # BUG: codes are never clipped to [-8, 7], so outliers reconstruct
    # exactly and their error silently vanishes from the average
    codes = [round(v / scale) for v in values]
    restored = [scale * q for q in codes]
    return sum((v - r) ** 2 for v, r in zip(values, restored)) / len(values)
`,
        tests: [
          { name: "outlier error is kept", hidden: false, code: "approx(reconstruction_mse([-1.83, -0.52, 0.24, 2.25], 0.25), 0.064225, 1e-9)" },
          { name: "negative clip at -8", hidden: false, code: "approx(reconstruction_mse([0.13, -0.88, 1.12, -2.40], 0.25), 0.0508, 1e-9)" },
          { name: "exact fit stays free", hidden: true, code: "eq(reconstruction_mse([0.5, -0.25], 0.25), 0.0)" },
          { name: "boundary value clips", hidden: true, code: "approx(reconstruction_mse([8.0], 1.0), 1.0, 1e-12)" },
        ],
        solution: `def reconstruction_mse(values, scale):
    codes = [max(-8, min(7, round(v / scale))) for v in values]
    restored = [scale * q for q in codes]
    return sum((v - r) ** 2 for v, r in zip(values, restored)) / len(values)`,
        hints: [
          { en: "One line changes: wrap round(v / scale) in max(-8, min(7, ...)).", ru: "Меняется одна строка: оберни round(v / scale) в max(-8, min(7, ...))." },
          { en: "With scale 0.25, code 9 is illegal: clip to 7, restore 1.75, keep the 0.25 error.", ru: "При scale 0.25 код 9 нелегален: клип в 7, реконструкция 1.75, ошибка 0.25 остаётся." },
        ],
        numpy: false,
        timeoutMs: 4000,
      },
    ],
    posttest: [
      {
        id: "p1",
        q: { en: "Row absmax is 1.4, 4-bit symmetric grid [\u22128, 7]. What scale does the absmax policy pick?", ru: "absmax \u0441\u0442\u0440\u043e\u043a\u0438 1.4, 4-\u0431\u0438\u0442\u043d\u0430\u044f \u0441\u0438\u043c\u043c\u0435\u0442\u0440\u0438\u0447\u043d\u0430\u044f \u0441\u0435\u0442\u043a\u0430 [\u22128, 7]. \u041a\u0430\u043a\u043e\u0439 scale \u0432\u044b\u0431\u0435\u0440\u0435\u0442 absmax-\u043f\u043e\u043b\u0438\u0442\u0438\u043a\u0430?" },
        options: [{ en: "1.4 / 7", ru: "1.4 / 7" }, { en: "1.4 / 8", ru: "1.4 / 8" }, { en: "1.4 / 15", ru: "1.4 / 15" }],
        answer: 0,
        explain: { en: "absmax maps to the top positive code 7: scale = absmax / 7. Dividing by 8 is the signed-range trap.", ru: "absmax \u043e\u0442\u043e\u0431\u0440\u0430\u0436\u0430\u0435\u0442\u0441\u044f \u0432 \u0441\u0442\u0430\u0440\u0448\u0438\u0439 \u043f\u043e\u043b\u043e\u0436\u0438\u0442\u0435\u043b\u044c\u043d\u044b\u0439 \u043a\u043e\u0434 7: scale = absmax / 7. \u0414\u0435\u043b\u0435\u043d\u0438\u0435 \u043d\u0430 8 \u2014 \u043b\u043e\u0432\u0443\u0448\u043a\u0430 \u0437\u043d\u0430\u043a\u043e\u0432\u043e\u0433\u043e \u0434\u0438\u0430\u043f\u0430\u0437\u043e\u043d\u0430." },
      },
      {
        id: "p2",
        q: { en: "Why clip the integer codes to [\u22128, 7] before reconstructing?", ru: "\u0417\u0430\u0447\u0435\u043c \u043a\u043b\u0438\u043f\u043e\u0432\u0430\u0442\u044c \u0446\u0435\u043b\u044b\u0435 \u043a\u043e\u0434\u044b \u0432 [\u22128, 7] \u043f\u0435\u0440\u0435\u0434 \u0440\u0435\u043a\u043e\u043d\u0441\u0442\u0440\u0443\u043a\u0446\u0438\u0435\u0439?" },
        options: [{ en: "Out-of-range codes silently erase the error", ru: "\u041a\u043e\u0434\u044b \u0432\u043d\u0435 \u0434\u0438\u0430\u043f\u0430\u0437\u043e\u043d\u0430 \u043c\u043e\u043b\u0447\u0430 \u0441\u0442\u0438\u0440\u0430\u044e\u0442 \u043e\u0448\u0438\u0431\u043a\u0443" }, { en: "To speed up the multiplication", ru: "\u0427\u0442\u043e\u0431\u044b \u0443\u0441\u043a\u043e\u0440\u0438\u0442\u044c \u0443\u043c\u043d\u043e\u0436\u0435\u043d\u0438\u0435" }, { en: "Because negative codes are invalid", ru: "\u041f\u043e\u0442\u043e\u043c\u0443 \u0447\u0442\u043e \u043e\u0442\u0440\u0438\u0446\u0430\u0442\u0435\u043b\u044c\u043d\u044b\u0435 \u043a\u043e\u0434\u044b \u043d\u0435\u0432\u0430\u043b\u0438\u0434\u043d\u044b" }],
        answer: 0,
        explain: { en: "An unclipped code 9 \u00abreconstructs\u00bb an impossible value and the error looks like zero \u2014 clipping makes outliers honestly expensive.", ru: "\u041d\u0435\u043a\u043b\u0438\u043f\u043e\u0432\u0430\u043d\u043d\u044b\u0439 \u043a\u043e\u0434 9 \u00ab\u0440\u0435\u043a\u043e\u043d\u0441\u0442\u0440\u0443\u0438\u0440\u0443\u0435\u0442\u00bb \u043d\u0435\u0432\u043e\u0437\u043c\u043e\u0436\u043d\u043e\u0435 \u0437\u043d\u0430\u0447\u0435\u043d\u0438\u0435 \u0438 \u043e\u0448\u0438\u0431\u043a\u0430 \u0432\u044b\u0433\u043b\u044f\u0434\u0438\u0442 \u043d\u0443\u043b\u0451\u043c \u2014 \u043a\u043b\u0438\u043f \u0434\u0435\u043b\u0430\u0435\u0442 \u0432\u044b\u0431\u0440\u043e\u0441\u044b \u0447\u0435\u0441\u0442\u043d\u043e \u0434\u043e\u0440\u043e\u0433\u0438\u043c\u0438." },
      },
      {
        id: "p3",
        q: { en: "Reconstruction is scale \u00d7 code. The signed reconstruction error of weight 0.37 with scale 0.25 (code 2) is\u2026", ru: "\u0420\u0435\u043a\u043e\u043d\u0441\u0442\u0440\u0443\u043a\u0446\u0438\u044f = scale \u00d7 code. \u0417\u043d\u0430\u043a\u043e\u0432\u0430\u044f \u043e\u0448\u0438\u0431\u043a\u0430 \u0440\u0435\u043a\u043e\u043d\u0441\u0442\u0440\u0443\u043a\u0446\u0438\u0438 \u0432\u0435\u0441\u0430 0.37 \u043f\u0440\u0438 scale 0.25 (\u043a\u043e\u0434 2) \u2014 \u044d\u0442\u043e\u2026" },
        options: [{ en: "+0.03 (recon \u2212 original)", ru: "+0.03 (\u0440\u0435\u043a\u043e\u043d \u2212 \u043e\u0440\u0438\u0433\u0438\u043d\u0430\u043b)" }, { en: "\u22120.03 (original \u2212 recon)", ru: "\u22120.03 (\u043e\u0440\u0438\u0433\u0438\u043d\u0430\u043b \u2212 \u0440\u0435\u043a\u043e\u043d)" }, { en: "0.03 / 0.37", ru: "0.03 / 0.37" }],
        answer: 0,
        explain: { en: "Course convention: error = reconstruction \u2212 original = 0.50 \u2212 0.37 = +0.03. Sign conventions must match the journal.", ru: "\u041a\u043e\u043d\u0432\u0435\u043d\u0446\u0438\u044f \u043a\u0443\u0440\u0441\u0430: \u043e\u0448\u0438\u0431\u043a\u0430 = \u0440\u0435\u043a\u043e\u043d\u0441\u0442\u0440\u0443\u043a\u0446\u0438\u044f \u2212 \u043e\u0440\u0438\u0433\u0438\u043d\u0430\u043b = 0.50 \u2212 0.37 = +0.03. \u041a\u043e\u043d\u0432\u0435\u043d\u0446\u0438\u044f \u0437\u043d\u0430\u043a\u0430 \u0434\u043e\u043b\u0436\u043d\u0430 \u0441\u043e\u0432\u043f\u0430\u0434\u0430\u0442\u044c \u0441 \u0436\u0443\u0440\u043d\u0430\u043b\u043e\u043c." },
      },
    ],
    reward: {
      caption: { en: "Scales derived, codes clipped, errors accounted \u2014 quantization holds no secrets.", ru: "\u041c\u0430\u0441\u0448\u0442\u0430\u0431\u044b \u0432\u044b\u0432\u0435\u0434\u0435\u043d\u044b, \u043a\u043e\u0434\u044b \u043e\u0431\u0440\u0435\u0437\u0430\u043d\u044b, \u043e\u0448\u0438\u0431\u043a\u0438 \u043f\u043e\u0441\u0447\u0438\u0442\u0430\u043d\u044b \u2014 \u0432 \u043a\u0432\u0430\u043d\u0442\u043e\u0432\u0430\u043d\u0438\u0438 \u0434\u043b\u044f \u0442\u0435\u0431\u044f \u043d\u0435\u0442 \u0441\u0435\u043a\u0440\u0435\u0442\u043e\u0432." },
    },
    footer: {
      en: "Teaching arithmetic on a declared INT4 grid and invented rows — not a measurement of any kernel or model. The recorded FP16 vs NF4 paired run lives in the Topic 03 evidence run (seminars/runs/2026-10-02-topic03-quantization); this lab does not execute it.",
      ru: "Учебная арифметика на заявленной сетке INT4 и выдуманных строках — не измерение какого-либо ядра или модели. Записанный парный прогон FP16 против NF4 живёт в evidence-прогоне Темы 03 (seminars/runs/2026-10-02-topic03-quantization); эта лаба его не исполняет.",
    },
  };
})();
