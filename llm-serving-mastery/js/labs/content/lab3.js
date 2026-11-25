/* Lab 03 — Quantization: range-derived scales and reconstruction error.
   Content module for the generic lab page (window.LABS_CONTENT['3']).
   Declared teaching grid (signed INT4, absmax/7); real Python tests run in the
   browser sandbox. Practice arithmetic only — no GPU, no NF4 kernel. */
(function () {
  "use strict";
  window.LABS_CONTENT = window.LABS_CONTENT || {};

  LABS_CONTENT["3"] = {
    budget: 45,
    title: {
      en: "Quantization: scales and reconstruction error",
      ru: "Квантование: scale и ошибки",
    },
    sub: {
      en: "Derive the scale from a declared INT4 grid, clip the codes, then defend the reconstruction error in real Python tests.",
      ru: "Выведи scale из заявленной сетки INT4, с клипом преврати веса в коды и защити меру ошибки реконструкции настоящими Python-тестами.",
    },
    intro: {
      en: `<p>Symmetric INT4 keeps one <strong>scale</strong> per row of weights and stores each weight as a small integer code from <strong>−8 to 7</strong>. The declared policy of this topic is <em>absmax/7</em>: divide the row's largest magnitude by the largest positive code, so the biggest weight lands exactly on 7 and the code −8 stays unused. The round trip is <code>code = clip(round(v / scale))</code> — rounding to nearest with ties to even (Python's <code>round</code>), then clipping to the grid — and the reconstruction is <code>scale × code</code>. Error appears in two places: weights that fall between grid points, and outliers whose scaled value exceeds ±7 — those codes hit the clip, and a round trip without clipping would silently report them as error-free.</p>
<p>The lab habit: declare the scale policy first, run the round trip on a tiny row, measure the signed error (reconstructed − original) and the mean squared error, and only then argue about NF4 or a real GPU. Errors are not equal: which codes actually move the output is decided by the input, not by the weight alone (the second figure follows this thought). Every number here is deterministic toy arithmetic — the same one the notebook traces weight by weight — not a kernel measurement.</p>`,
      ru: `<p>Симметричное INT4 хранит один <strong>scale</strong> на строку весов и записывает каждый вес маленьким целым кодом от <strong>−8 до 7</strong>. Заявленная политика темы — <em>absmax/7</em>: делим максимальный по модулю вес строки на наибольший положительный код, так что крайний по модулю вес попадает ровно на край сетки, а код −8 остаётся неиспользованным. Полный цикл: <code>code = clip(round(v / scale))</code> — округление к ближайшему, связи к чётному (Python-овский <code>round</code>), затем клип в сетку — а реконструкция — это <code>scale × code</code>. Ошибка живёт в двух местах: веса между узлами сетки и выбросы, чьё значение после деления на scale выходит за ±7 — такие коды упираются в клип, а цикл без клипа молча отчитался бы о них как о безошибочных.</p>
<p>Привычка лабы: сначала объяви политику scale, прогони цикл квантования на крошечной строке, измерь знаковую ошибку (реконструкция − оригинал) и MSE, и только потом спорь про NF4 и реальный GPU. Ошибки неравноценны: какие коды реально сдвинут выход — решает вход, а не вес сам по себе (вторая фигура продолжает эту мысль). Каждое число здесь — детерминированная игрушечная арифметика, та же, что тетрадь трассирует вес за весом, а не измерение ядра.</p>`,
    },
    heroTag: { en: "scales, codes, error", ru: "scale, коды, ошибка" },
    glossary: [
      [{ en: "quantization", ru: "квантование" }, { en: "storing numbers (here: weights) as small integer codes instead of full floats — a declared round trip, not magic compression.", ru: "хранение чисел (здесь — весов) маленькими целыми кодами вместо полных float — заявленный цикл туда-обратно, а не волшебное сжатие." }],
      [{ en: "scale", ru: "scale" }, { en: "one per row: the step of the code grid; reconstruction = scale × code, so the scale decides how big the error is.", ru: "один на строку: шаг сетки кодов; реконструкция = scale × code, поэтому именно scale решает, насколько велика ошибка." }],
      [{ en: "absmax", ru: "absmax" }, { en: "the largest magnitude in the row (sign ignored); the declared policy divides it by 7 to place the scale.", ru: "самый большой модуль в строке (знак не важен); заявленная политика делит его на 7 и получает scale." }],
      [{ en: "code", ru: "код" }, { en: "the small integer a weight becomes: code = clip(round(v / scale)) into [−8, 7].", ru: "маленькое целое, во которое превращается вес: code = clip(round(v / scale)) в сетке [−8, 7]." }],
      [{ en: "rounding", ru: "округление" }, { en: "to the nearest grid point, ties to even (Python's round) — truncation would bias codes toward zero.", ru: "к ближайшей точке сетки, связи — к чётной (Python-овский round); усечение смещало бы коды к нулю." }],
      [{ en: "clip", ru: "клип" }, { en: "cutting codes back into the grid before reconstructing; without it outliers «reconstruct» exactly and their error silently vanishes.", ru: "возвращение кодов в сетку перед реконструкцией; без него выбросы «реконструируются» точно, и их ошибка молча исчезает." }],
      [{ en: "outlier", ru: "выброс" }, { en: "a weight far larger than the rest: it sets the scale and lands on the clip — the −0.50 error of the TOY row is its bill.", ru: "вес, намного крупнее остальных: он задаёт scale и упирается в клип — ошибка −0.50 у TOY-строки и есть его платёж." }],
      [{ en: "reconstruction", ru: "реконструкция" }, { en: "the round trip's way back: scale × code; what the model actually multiplies with after quantization.", ru: "обратная дорога цикла: scale × code; то, с чем модель реально умножает после квантования." }],
      [{ en: "signed error", ru: "знаковая ошибка" }, { en: "reconstruction − original; the course contract keeps this order so the sign says which way the weight moved.", ru: "реконструкция − оригинал; курс закрепляет именно такой порядок, чтобы знак говорил, куда сдвинулся вес." }],
      [{ en: "MSE", ru: "MSE" }, { en: "mean of squared errors over the row; squaring makes every error positive, so clips and outliers cannot hide.", ru: "среднее квадратов ошибок по строке; квадрат делает каждую ошибку положительной, поэтому клипы и выбросы не спрятать." }],
    ],
    figures: [
      {
        id: "lab3-round-trip",
        title: { en: "The quantization round trip, step by step", ru: "Цикл квантования шаг за шагом" },
        w: 760, h: 420,
        svg: `<svg viewBox="0 0 760 420" xmlns="http://www.w3.org/2000/svg">
  <g id="g-scale">
    <text x="60" y="66" font-size="14" fill="var(--lab-muted)" data-en="TOY row" data-ru="TOY-строка">TOY row</text>
    <rect x="60" y="80" width="150" height="40" rx="7" fill="none" stroke="var(--lab-accent)" stroke-width="1.5"/>
    <text x="135" y="105" text-anchor="middle" font-size="15" fill="var(--lab-ink)" class="mono">2.25</text>
    <rect x="218" y="80" width="150" height="40" rx="7" fill="none" stroke="var(--lab-muted)" stroke-width="1.5"/>
    <text x="293" y="105" text-anchor="middle" font-size="15" fill="var(--lab-muted)" class="mono">−1.83</text>
    <rect x="376" y="80" width="150" height="40" rx="7" fill="none" stroke="var(--lab-muted)" stroke-width="1.5"/>
    <text x="451" y="105" text-anchor="middle" font-size="15" fill="var(--lab-muted)" class="mono">−0.52</text>
    <rect x="534" y="80" width="150" height="40" rx="7" fill="none" stroke="var(--lab-muted)" stroke-width="1.5"/>
    <text x="609" y="105" text-anchor="middle" font-size="15" fill="var(--lab-muted)" class="mono">0.24</text>
    <text x="60" y="158" font-size="16" fill="var(--lab-accent)" class="mono">scale = absmax / 7 = 2.25 / 7</text>
    <text x="60" y="182" font-size="14" fill="var(--lab-muted)" data-en="the biggest weight lands exactly on code 7" data-ru="крупнейший вес попадает ровно в код 7">the biggest weight lands exactly on code 7</text>
    <text x="60" y="220" font-size="16" fill="var(--lab-ink)" class="mono">scale = 0.25</text>
  </g>
  <g id="g-div">
    <line x1="60" y1="300" x2="700" y2="300" stroke="var(--lab-muted)" stroke-width="1.5"/>
    <text x="240" y="326" text-anchor="middle" font-size="13" fill="var(--lab-muted)" class="mono">7</text>
    <line x1="240" y1="294" x2="240" y2="306" stroke="var(--lab-muted)" stroke-width="1.5"/>
    <text x="380" y="326" text-anchor="middle" font-size="13" fill="var(--lab-muted)" class="mono">8</text>
    <line x1="380" y1="294" x2="380" y2="306" stroke="var(--lab-muted)" stroke-width="1.5"/>
    <circle cx="520" cy="300" r="8" fill="var(--lab-accent)"/>
    <text x="520" y="326" text-anchor="middle" font-size="13" fill="var(--lab-accent)" class="mono">9</text>
    <text x="60" y="266" font-size="16" fill="var(--lab-ink)" class="mono">2.25 / 0.25 = 9 → round → 9</text>
  </g>
  <g id="g-clip">
    <path d="M 520 292 L 520 232 L 250 232" fill="none" stroke="var(--fig-warm)" stroke-width="2.5" class="fig-flow"/>
    <circle cx="240" cy="232" r="8" fill="var(--fig-warm)"/>
    <text x="240" y="212" text-anchor="middle" font-size="14" fill="var(--fig-warm)" class="mono">clip → 7</text>
    <text x="420" y="220" font-size="14" fill="var(--fig-warm)" data-en="INT4 cannot store 9" data-ru="INT4 не может хранить 9">INT4 cannot store 9</text>
  </g>
  <g id="g-recon">
    <circle cx="240" cy="300" r="8" fill="var(--lab-good)"/>
    <path d="M 240 292 L 240 252" fill="none" stroke="var(--lab-good)" stroke-width="2"/>
    <text x="240" y="346" text-anchor="middle" font-size="13" fill="var(--lab-good)" class="mono">1.75</text>
    <text x="60" y="366" font-size="16" fill="var(--lab-ink)" class="mono">7 × 0.25 = 1.75</text>
    <text x="300" y="366" font-size="16" fill="var(--fig-warm)" class="mono">error = 1.75 − 2.25 = −0.50</text>
    <text x="60" y="392" font-size="13" fill="var(--lab-muted)" data-en="the clip keeps the error in the MSE: 0.064225, not ≈ 0.0017" data-ru="клип сохраняет ошибку в MSE: 0.064225, а не ≈ 0.0017">the clip keeps the error in the MSE: 0.064225, not ≈ 0.0017</text>
  </g>
</svg>`,
        stages: [
          { cap: { en: "The outlier 2.25 sets the scale: absmax / 7 = 0.25.", ru: "Выброс 2.25 задаёт scale: absmax / 7 = 0.25." }, show: ["g-scale"] },
          { cap: { en: "Divide and round: 2.25 / 0.25 = 9 — off-grid.", ru: "Делим и округляем: 2.25 / 0.25 = 9 — вне сетки." }, show: ["g-scale", "g-div"] },
          { cap: { en: "Clip to [−8, 7]: the illegal 9 is stored as 7.", ru: "Клип в [−8, 7]: девятка вне сетки сохраняется как 7." }, show: ["g-scale", "g-div", "g-clip"] },
          { cap: { en: "Reconstruct 7 × 0.25 = 1.75; error −0.50 stays in the MSE.", ru: "Реконструкция 7 × 0.25 = 1.75; знаковая ошибка −0.50 остаётся в MSE." }, show: ["g-scale", "g-div", "g-clip", "g-recon"] },
        ],
      },
      {
        id: "lab3-active-error",
        title: { en: "Active error: the input decides which codes matter", ru: "Активная ошибка: вход решает, какие коды важны" },
        w: 760, h: 420,
        svg: `<svg viewBox="0 0 760 420" xmlns="http://www.w3.org/2000/svg">
  <g id="g-bars">
    <text x="60" y="52" font-size="14" fill="var(--lab-muted)" data-en="reconstruction error per weight (TOY row, scale 0.25)" data-ru="ошибка реконструкции по весам (TOY-строка, scale 0.25)">reconstruction error per weight (TOY row, scale 0.25)</text>
    <line x1="380" y1="150" x2="380" y2="330" stroke="var(--lab-muted)" stroke-width="1.5"/>
    <rect x="288" y="178" width="92" height="10" rx="3" fill="var(--lab-accent)"/>
    <text x="392" y="188" font-size="14" fill="var(--lab-ink)" class="mono">+0.08</text>
    <text x="278" y="188" text-anchor="end" font-size="13" fill="var(--lab-muted)" class="mono">w0</text>
    <rect x="357" y="216" width="23" height="10" rx="3" fill="var(--lab-accent)"/>
    <text x="392" y="226" font-size="14" fill="var(--lab-ink)" class="mono">+0.02</text>
    <text x="278" y="226" text-anchor="end" font-size="13" fill="var(--lab-muted)" class="mono">w1</text>
    <rect x="368" y="254" width="12" height="10" rx="3" fill="var(--lab-accent)"/>
    <text x="392" y="264" font-size="14" fill="var(--lab-ink)" class="mono">+0.01</text>
    <text x="278" y="264" text-anchor="end" font-size="13" fill="var(--lab-muted)" class="mono">w2</text>
    <rect x="180" y="296" width="200" height="10" rx="3" fill="var(--fig-warm)"/>
    <path d="M 341 293 l 12 12 M 353 293 l 12 12" fill="none" stroke="var(--lab-bg)" stroke-width="2.5"/>
    <text x="392" y="306" font-size="14" fill="var(--fig-warm)" class="mono">−0.50</text>
    <text x="278" y="306" text-anchor="end" font-size="13" fill="var(--fig-warm)" class="mono">w3</text>
    <text x="470" y="306" font-size="13" fill="var(--fig-warm)" data-en="the outlier — bar clipped, scale broken" data-ru="выброс — бар подрезан, шкала разорвана">the outlier — bar clipped, scale broken</text>
    <text x="60" y="382" font-size="13" fill="var(--lab-muted)" class="mono">MSE = (0.08² + 0.02² + 0.01² + 0.50²) / 4 = 0.064225</text>
  </g>
  <g id="g-inA">
    <text x="60" y="72" font-size="15" fill="var(--lab-ink)" data-en="Input A reads w0 × 1" data-ru="Вход A читает w0 × 1">Input A reads w0 × 1</text>
    <circle cx="84" cy="183" r="9" fill="none" stroke="var(--lab-accent)" stroke-width="2.5" class="fig-pulse"/>
    <text x="520" y="120" font-size="21" fill="var(--lab-accent)" class="mono">out: +0.08</text>
    <path d="M 96 183 C 260 183 400 150 508 122" fill="none" stroke="var(--lab-accent)" stroke-width="2" class="fig-flow"/>
  </g>
  <g id="g-inB">
    <text x="240" y="72" font-size="15" fill="var(--lab-ink)" data-en="Input B reads w3 × 10" data-ru="Вход B читает w3 × 10">Input B reads w3 × 10</text>
    <circle cx="84" cy="301" r="9" fill="none" stroke="var(--fig-warm)" stroke-width="2.5" class="fig-pulse"/>
    <text x="520" y="352" font-size="21" fill="var(--fig-warm)" class="mono">out: −5.00</text>
    <path d="M 96 301 C 300 345 420 360 508 350" fill="none" stroke="var(--fig-warm)" stroke-width="2" class="fig-flow"/>
  </g>
  <g id="g-verdict">
    <text x="380" y="404" text-anchor="middle" font-size="15" fill="var(--lab-ink)" data-en="same weights, different error — the input decides" data-ru="те же веса, разная ошибка — решает вход">same weights, different error — the input decides</text>
  </g>
</svg>`,
        stages: [
          { cap: { en: "Per-weight reconstruction error: three small values and one outlier at −0.50.", ru: "Ошибка по каждому весу: три маленьких значения и один выброс на −0.50." }, show: ["g-bars"] },
          { cap: { en: "Input A reads w0 × 1: the output moves by just +0.08.", ru: "Вход A читает w0 × 1: выход сдвигается всего на +0.08." }, show: ["g-bars", "g-inA"] },
          { cap: { en: "Input B reads the outlier ×10: the output moves by −5.00.", ru: "Вход B читает выброс ×10: выход сдвигается на −5.00." }, show: ["g-bars", "g-inA", "g-inB"] },
          { cap: { en: "Same weights, different error: the input decides which codes matter.", ru: "Те же веса, разная ошибка: какие коды важны — решает вход." }, show: ["g-bars", "g-inA", "g-inB", "g-verdict"] },
        ],
      },
    ],
    outcomes: [
      { en: "Derive a quantization scale from a value range and quantize with rounding and clipping.", ru: "\u0412\u044b\u0432\u043e\u0434\u0438\u0442\u044c scale \u0438\u0437 \u0434\u0438\u0430\u043f\u0430\u0437\u043e\u043d\u0430 \u0438\u00a0\u043a\u0432\u0430\u043d\u0442\u043e\u0432\u0430\u0442\u044c \u0441\u00a0\u043e\u043a\u0440\u0443\u0433\u043b\u0435\u043d\u0438\u0435\u043c \u0438\u00a0\u043a\u043b\u0438\u043f\u043e\u043c." },
      { en: "Explain reconstruction error as a named mechanism, not a vague quality loss.", ru: "\u041e\u0431\u044a\u044f\u0441\u043d\u044f\u0442\u044c \u043e\u0448\u0438\u0431\u043a\u0443 \u0440\u0435\u043a\u043e\u043d\u0441\u0442\u0440\u0443\u043a\u0446\u0438\u0438 \u043a\u0430\u043a \u043a\u043e\u043d\u043a\u0440\u0435\u0442\u043d\u044b\u0439 \u043c\u0435\u0445\u0430\u043d\u0438\u0437\u043c, \u0430\u00a0\u043d\u0435 \u00ab\u043a\u0430\u043a\u0443\u044e-\u0442\u043e \u043f\u043e\u0442\u0435\u0440\u044e \u043a\u0430\u0447\u0435\u0441\u0442\u0432\u0430\u00bb." },
    ],
    model: [
      [{ en: "signed INT4 grid", ru: "знаковая сетка INT4" }, { en: "codes [−8, 7]", ru: "коды [−8, 7]" }, { en: "rounding", ru: "округление" }, { en: "nearest, ties to even", ru: "к ближайшему, связи к чётному" }],
      [{ en: "symmetric scale", ru: "симметричный scale" }, { en: "scale = absmax / 7", ru: "scale = absmax / 7" }, { en: "all-zero group", ru: "нулевая группа" }, { en: "scale = 1.0", ru: "scale = 1.0" }],
      [{ en: "code", ru: "код" }, { en: "clip(round(v / scale))", ru: "clip(round(v / scale))" }, { en: "reconstruction", ru: "реконструкция" }, { en: "scale × code", ru: "scale × код" }],
      [{ en: "signed error", ru: "знаковая ошибка" }, { en: "reconstructed − original", ru: "реконструкция − оригинал" }, { en: "row MSE", ru: "MSE строки" }, { en: "mean of (v − recon)²", ru: "среднее (v − recon)²" }],
    ],
    scenario: null,
    quizzes: [
      {
        id: "q1",
        q: {
          en: "A weight row spans [−1.4, 0.9]. Under the absmax/7 policy, what is its scale?",
          ru: "Строка весов лежит в диапазоне [−1.4, 0.9]. По политике absmax/7 каков её scale?",
        },
        answer: 0.2, tol: 0.005, unit: { en: "scale", ru: "scale" },
        hint: {
          en: "absmax = 1.4 (magnitude, not the signed max). scale = 1.4 / 7.",
          ru: "absmax = 1.4 (по модулю, а не максимум со знаком). scale = 1.4 / 7.",
        },
        followUp: {
          q: { en: "Why divide by 7 and not by 8 or 15?", ru: "Почему делить на 7, а не на 8 или 15?" },
          options: [
            { en: "The largest POSITIVE code is 7: absmax must land exactly on it, so scale = absmax / 7 (−8 stays spare)", ru: "Наибольший ПОЛОЖИТЕЛЬНЫЙ код — 7: absmax обязан попасть ровно в него, поэтому scale = absmax / 7 (код −8 остаётся запасным)" },
            { en: "The signed grid is symmetric, so the divisor is half of 16", ru: "Знаковая сетка симметрична, поэтому делитель — половина от 16" },
            { en: "There are 16 codes in total, so the divisor is 16 − 1 = 15", ru: "Кодов всего 16, поэтому делитель равен 16 − 1 = 15" },
          ],
          answer: 0,
          explain: { en: "The absmax policy maps the row's largest magnitude to the TOP POSITIVE code 7. Dividing by 8 is the signed-range trap; by 15 — the unsigned one. Either leaves the outlier clipped.", ru: "Политика absmax отображает максимальный модуль строки в СТАРШИЙ ПОЛОЖИТЕЛЬНЫЙ код 7. Деление на 8 — ловушка знакового диапазона, на 15 — беззнакового. В обоих случаях выброс уходит в клип." },
        },
        // Вариативность №5: диапазон строки — вход варианта; scale = absmax / 7:
        //   [−2.1, 0.8] → 2.1 / 7 = 0.3;  [−2.8, 0.6] → 2.8 / 7 = 0.4.
        // Базовые входы (−1.4, 0.9) разведены с фигурных; ответы 0.3 и 0.4 в фигурах
        // не встречаются; followUp (почему /7) общий с базой — он без чисел входа.
        variants: [
          {
            q: {
              en: "A weight row spans [−1.4, 0.9]. Under the absmax/7 policy, what is its scale?",
              ru: "Строка весов лежит в диапазоне [−1.4, 0.9]. По политике absmax/7 каков её scale?",
            },
            answer: 0.2, tol: 0.005,
          },
          {
            q: {
              en: "A weight row spans [−2.1, 0.8]. Under the absmax/7 policy, what is its scale?",
              ru: "Строка весов лежит в диапазоне [−2.1, 0.8]. По политике absmax/7 каков её scale?",
            },
            answer: 0.3, tol: 0.01,
            hint: {
              en: "absmax = 2.1 (magnitude, not the signed max). scale = 2.1 / 7.",
              ru: "absmax = 2.1 (по модулю, а не максимум со знаком). scale = 2.1 / 7.",
            },
          },
          {
            q: {
              en: "A weight row spans [−2.8, 0.6]. Under the absmax/7 policy, what is its scale?",
              ru: "Строка весов лежит в диапазоне [−2.8, 0.6]. По политике absmax/7 каков её scale?",
            },
            answer: 0.4, tol: 0.01,
            hint: {
              en: "absmax = 2.8 (magnitude, not the signed max). scale = 2.8 / 7.",
              ru: "absmax = 2.8 (по модулю, а не максимум со знаком). scale = 2.8 / 7.",
            },
          },
        ],
      },
      {
        id: "q2",
        q: {
          en: "With scale 0.2, what integer code does the weight 0.37 get?",
          ru: "При scale 0.2 какой целый код получит вес 0.37?",
        },
        answer: 2, tol: 0.01, unit: { en: "code", ru: "код" },
        hint: {
          en: "0.37 / 0.2 = 1.85 → round to the nearest whole code. No clipping needed here.",
          ru: "0.37 / 0.2 = 1.85 → округление к ближайшему целому коду. Клип тут не нужен.",
        },
        followUp: {
          q: { en: "Why 2 — and not 1 (truncation)?", ru: "Почему 2, а не 1 (усечение)?" },
          options: [
            { en: "Rounding goes to the NEAREST grid point: 1.85 sits 0.15 from 2 and 0.85 from 1", ru: "Округление идёт к БЛИЖАЙШЕЙ точке сетки: 1.85 стоит в 0.15 от 2 и в 0.85 от 1" },
            { en: "Ties-to-even rounds 1.85 down because 1 is odd", ru: "Связи-к-чётному округляют 1.85 вниз, потому что 1 нечётная" },
            { en: "The clip pulls every code below 2 up to 2", ru: "Клип подтягивает все коды ниже 2 вверх к двойке" },
          ],
          answer: 0,
          explain: { en: "Truncation biases codes toward zero and roughly doubles the error of the small weights. Ties-to-even matters only at exact .5 — 1.85 is not a tie.", ru: "Усечение смещает коды к нулю и примерно удваивает ошибку малых весов. Связи-к-чётному работают только ровно на 0.5 — 1.85 не связь." },
        },
        // Вариативность №5: вес и scale — входы; код = clip(round(v / scale)); ответы — не малые
        // целые (ловушка «совпасть с числом фигуры»): 1.68 / 0.3 = 5.6 → 6;  −1.68 / 0.3 = −5.6 → −6.
        // Числа 0.3 / 1.68 / 6 / −6 в фигурах не живут (там 0.25 и TOY-строка); followUp переписан.
        variants: [
          {
            q: {
              en: "With scale 0.2, what integer code does the weight 0.37 get?",
              ru: "При scale 0.2 какой целый код получит вес 0.37?",
            },
            answer: 2, tol: 0.01,
          },
          {
            q: {
              en: "With scale 0.3, what integer code does the weight 1.68 get?",
              ru: "При scale 0.3 какой целый код получит вес 1.68?",
            },
            answer: 6, tol: 0.2,
            hint: {
              en: "Divide the weight by the scale and round to the NEAREST grid point — no clipping needed here.",
              ru: "Раздели вес на scale и округли к БЛИЖАЙШЕЙ точке сетки — клип тут не нужен.",
            },
            followUp: {
              q: { en: "Why 6 — and not 5 (truncation)?", ru: "Почему 6, а не 5 (усечение)?" },
              options: [
                { en: "Rounding goes to the NEAREST grid point: 5.6 sits 0.4 from 6 and 0.6 from 5", ru: "Округление идёт к БЛИЖАЙШЕЙ точке сетки: 5.6 стоит в 0.4 от 6 и в 0.6 от 5" },
                { en: "Ties-to-even rounds 5.6 down because 5 is odd", ru: "Связи-к-чётному округляют 5.6 вниз, потому что 5 нечётная" },
                { en: "The clip pulls every code below 6 up to 6", ru: "Клип подтягивает все коды ниже 6 вверх к шестёрке" },
              ],
              answer: 0,
              explain: { en: "Truncation biases codes toward zero and roughly doubles the error of the small weights. Ties-to-even matters only at exact .5 — 5.6 is not a tie.", ru: "Усечение смещает коды к нулю и примерно удваивает ошибку малых весов. Связи-к-чётному работают только ровно на 0.5 — 5.6 не связь." },
            },
          },
          {
            q: {
              en: "With scale 0.3, what integer code does the weight −1.68 get?",
              ru: "При scale 0.3 какой целый код получит вес −1.68?",
            },
            answer: -6, tol: 0.2,
            hint: {
              en: "Divide the weight by the scale: the ratio is negative, so round to the nearest grid point on the negative side — no clipping needed here.",
              ru: "Раздели вес на scale: отношение отрицательное, поэтому округляй к ближайшей точке сетки на отрицательной стороне — клип тут не нужен.",
            },
            followUp: {
              q: { en: "Why −6 — and not −5 (truncation)?", ru: "Почему −6, а не −5 (усечение)?" },
              options: [
                { en: "Rounding goes to the NEAREST grid point: −5.6 sits 0.4 from −6 and 0.6 from −5", ru: "Округление идёт к БЛИЖАЙШЕЙ точке сетки: −5.6 стоит в 0.4 от −6 и в 0.6 от −5" },
                { en: "Ties-to-even rounds −5.6 up because −5 is odd", ru: "Связи-к-чётному округляют −5.6 вверх, потому что −5 нечётная" },
                { en: "The clip pulls every code above −6 down to −6", ru: "Клип сжимает все коды выше −6 вниз к −6" },
              ],
              answer: 0,
              explain: { en: "Truncation toward zero biases negative codes upward and hides half of the reconstruction error. Ties-to-even matters only at exact .5 — −5.6 is not a tie.", ru: "Усечение к нулю смещает отрицательные коды вверх и прячет половину ошибки реконструкции. Связи-к-чётному работают только ровно на 0.5 — −5.6 не связь." },
            },
          },
        ],
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
        followUp: {
          q: { en: "Why is the sign +0.03 and not −0.03?", ru: "Почему знак +0.03, а не −0.03?" },
          options: [
            { en: "The course convention is error = reconstruction − original: 0.4 − 0.37 = +0.03", ru: "Соглашение курса: ошибка = реконструкция − оригинал: 0.4 − 0.37 = +0.03" },
            { en: "Quantization always inflates weights, so the error must be positive", ru: "Квантование всегда раздувает веса, поэтому ошибка обязана быть положительной" },
            { en: "The sign follows the code: code 2 is positive, so the error is positive", ru: "Знак наследуется от кода: код 2 положительный, значит и ошибка положительная" },
          ],
          answer: 0,
          explain: { en: "A sign convention is a contract, not a truth: this course (and the notebook trace) defines error = reconstructed − original. Some texts flip it — always check which one you are reading.", ru: "Знаковое соглашение — это контракт, а не истина: этот курс (и трассировка тетради) определяет ошибку = реконструкция − оригинал. В некоторых текстах знак перевёрнут — всегда проверяй, какой перед тобой." },
        },
        // Вариативность №5: входы те же, что у q2 того же индекса; ошибка = scale × код − вес:
        //   0.3 × 6 − 1.68 = 0.12;  0.3 × (−6) − (−1.68) = −0.12.
        // Ответы 0.12 / −0.12 в фигурах не живут (там +0.08 / +0.02 / +0.01 / −0.50);
        // followUp переписан под знак варианта.
        variants: [
          {
            q: {
              en: "For that same weight (0.37, scale 0.2): what is the signed reconstruction error, reconstructed − original?",
              ru: "Для того же веса (0.37, scale 0.2): какова знаковая ошибка реконструкции, реконструкция − оригинал?",
            },
            answer: 0.03, tol: 0.005,
          },
          {
            q: {
              en: "For that same weight (1.68, scale 0.3): what is the signed reconstruction error, reconstructed − original?",
              ru: "Для того же веса (1.68, scale 0.3): какова знаковая ошибка реконструкции, реконструкция − оригинал?",
            },
            answer: 0.12, tol: 0.01,
            hint: {
              en: "Code 6 reconstructs to 6 × 0.3 = 1.8; the signed error is 1.8 − 1.68.",
              ru: "Код 6 реконструируется в 6 × 0.3 = 1.8; знаковая ошибка равна 1.8 − 1.68.",
            },
            followUp: {
              q: { en: "Why is the sign +0.12 and not −0.12?", ru: "Почему знак +0.12, а не −0.12?" },
              options: [
                { en: "The course convention is error = reconstruction − original: 1.8 − 1.68 = +0.12", ru: "Соглашение курса: ошибка = реконструкция − оригинал: 1.8 − 1.68 = +0.12" },
                { en: "Quantization always inflates weights, so the error must be positive", ru: "Квантование всегда раздувает веса, поэтому ошибка обязана быть положительной" },
                { en: "The sign follows the code: code 6 is positive, so the error is positive", ru: "Знак наследуется от кода: код 6 положительный, значит и ошибка положительная" },
              ],
              answer: 0,
              explain: { en: "A sign convention is a contract, not a truth: this course (and the notebook trace) defines error = reconstructed − original. Some texts flip it — always check which one you are reading.", ru: "Знаковое соглашение — это контракт, а не истина: этот курс (и трассировка тетради) определяет ошибку = реконструкция − оригинал. В некоторых текстах знак перевёрнут — всегда проверяй, какой перед тобой." },
            },
          },
          {
            q: {
              en: "For that same weight (−1.68, scale 0.3): what is the signed reconstruction error, reconstructed − original?",
              ru: "Для того же веса (−1.68, scale 0.3): какова знаковая ошибка реконструкции, реконструкция − оригинал?",
            },
            answer: -0.12, tol: 0.01,
            hint: {
              en: "Code −6 reconstructs to −6 × 0.3 = −1.8; the signed error is −1.8 − (−1.68).",
              ru: "Код −6 реконструируется в −6 × 0.3 = −1.8; знаковая ошибка равна −1.8 − (−1.68).",
            },
            followUp: {
              q: { en: "Why is the sign −0.12 and not +0.12?", ru: "Почему знак −0.12, а не +0.12?" },
              options: [
                { en: "The course convention is error = reconstruction − original: −1.8 − (−1.68) = −0.12", ru: "Соглашение курса: ошибка = реконструкция − оригинал: −1.8 − (−1.68) = −0.12" },
                { en: "Quantization always inflates weights, so the error must be positive", ru: "Квантование всегда раздувает веса, поэтому ошибка обязана быть положительной" },
                { en: "The sign follows the code: code −6 is negative, so the error is negative", ru: "Знак наследуется от кода: код −6 отрицательный, значит и ошибка отрицательная" },
              ],
              answer: 0,
              explain: { en: "A sign convention is a contract, not a truth: this course (and the notebook trace) defines error = reconstructed − original. Some texts flip it — always check which one you are reading.", ru: "Знаковое соглашение — это контракт, а не истина: этот курс (и трассировка тетради) определяет ошибку = реконструкция − оригинал. В некоторых текстах знак перевёрнут — всегда проверяй, какой перед тобой." },
            },
          },
        ],
      },
    ],
    exercises: [
      {
        id: "ex1",
        title: { en: "Exercise 1 · Range-derived scale", ru: "Упражнение 1 · Scale из диапазона" },
        brief: {
          en: "Implement <code>absmax_scale(values, levels=7)</code> — the symmetric scale of a row: <code>absmax / levels</code>, where absmax is the largest magnitude. Declared edge convention: an all-zero row has no range, return <code>1.0</code> (same as the notebook's zero-group rule).",
          ru: "Реализуй <code>absmax_scale(values, levels=7)</code> — симметричный scale строки: <code>absmax / levels</code>, где absmax — максимальный модуль. Соглашение для краевого случая: у нулевой строки диапазона нет, возвращай <code>1.0</code> (как в правиле нулевой группы из тетради).",
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
        title: { en: "Exercise 2 · Symmetric row codes with clip", ru: "Упражнение 2 · Симметричные коды строки с клипом" },
        brief: {
          en: "Implement <code>quantize_row(values, scale)</code> — trace each weight like the notebook's <code>scalar()</code>: <code>round(v / scale)</code> (nearest, ties to even), then clip the code to <strong>[-8, 7]</strong>, and return the list of codes. On the TOY row with scale 0.25 the weight 2.25 maps to 9 — and must come back clipped to 7.",
          ru: "Реализуй <code>quantize_row(values, scale)</code> — трассируй каждый вес как <code>scalar()</code> из тетради: <code>round(v / scale)</code> (к ближайшему, связи к чётному), затем клипуй каждый код в <strong>[−8, 7]</strong> и верни список кодов. В TOY-строке при scale 0.25 вес 2.25 отображается в 9 — и клип обязан вернуть его в 7.",
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
          ru: "Эта <code>reconstruction_mse(values, scale)</code> прогоняет цикл квантования, но нигде не клипует коды, поэтому ошибка выброса молча исчезает: 2.25 даёт код 9 и реконструируется ровно в 2.25, хотя INT4 не может хранить 9. Почини: клипуй каждый код в [−8, 7] перед реконструкцией, затем усредняй <code>(v − recon)²</code> по строке. На TOY-строке честный MSE равен <strong>0.064225</strong>, а не ≈0.0017.",
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
          { en: "With scale 0.25, code 9 is illegal: clip to 7, restore 1.75, keep the 0.25 error.", ru: "При scale 0.25 код 9 вне сетки: клип в 7, реконструкция 1.75, знаковая ошибка −0.50 и её квадрат 0.25 — в MSE." },
        ],
        numpy: false,
        timeoutMs: 4000,
      },
    ],
    challenge: {
      id: "chal1",
      word: { en: "challenge", ru: "челлендж" },
      title: {
        en: "★ Beat the absmax/7 policy: find a better scale",
        ru: "★ Побей политику absmax/7: найди scale лучше",
      },
      brief: {
        en: "The row is fixed: <code>[0.13, −0.88, 1.12, −2.40]</code> on the signed INT4 grid [−8, 7]. The absmax/7 policy picks scale = 2.40/7 ≈ 0.343 and lands at MSE ≈ 0.0118 — but absmax is a <em>range</em> policy, not an MSE-optimal one. No tests guide you: search any way you like (grid, bisection, reasoning) and print what you found. The page recomputes the MSE from your scale itself — with ties-to-even rounding and clipping, exactly like the lab — so printed numbers must agree with the round trip.",
        ru: "Строка фиксирована: <code>[0.13, −0.88, 1.12, −2.40]</code> на знаковой сетке INT4 [−8, 7]. Политика absmax/7 берёт scale = 2.40/7 ≈ 0.343 и даёт MSE ≈ 0.0118 — но absmax — политика <em>диапазона</em>, а не оптимума по MSE. Тестов-каркаса нет: ищи как угодно (сетка, бисекция, рассуждение) и печатай найденное. Страница сама пересчитывает MSE от твоего scale — со связями-к-чётному и клипом, ровно как в лабе, — поэтому числа обязаны сходиться с циклом квантования.",
      },
      goal: {
        en: "Print one line: <code>scale=… mse=…</code> where the recomputed MSE ≤ 0.008 — meaningfully better than the absmax/7 policy (0.0118).",
        ru: "Напечатай одну строку: <code>scale=… mse=…</code>, где пересчитанный MSE ≤ 0.008 — заметно лучше политики absmax/7 (0.0118).",
      },
      mode: "run",
      numpy: false,
      timeoutMs: 30000,
      starter: `# The row (fixed):  values = [0.13, -0.88, 1.12, -2.40]
# Declared round trip: code = clip(round(v / scale)) into [-8, 7],
# reconstruction = scale * code, MSE = mean((v - recon)**2).
# The page reads ONE summary line in exactly this shape:
#   scale=<your scale> mse=<your claimed MSE>
# Search any way you like. The page recomputes the MSE itself.

# TODO: search for a scale with MSE <= 0.008, then print the line.
`,
      check: (res) => {
        const out = String(res.stdout || "");
        const mm = out.match(/scale\s*=\s*([0-9]+(?:\.[0-9]+)?)[\s\S]*?mse\s*=\s*([0-9]+(?:\.[0-9]+)?)/i);
        if (!mm) {
          return { ok: false, note: { en: "no summary line found - print exactly: scale=… mse=…", ru: "итоговой строки нет — напечатай ровно: scale=… mse=…" } };
        }
        const scale = parseFloat(mm[1]), mseClaimed = parseFloat(mm[2]);
        if (!(scale > 0)) {
          return { ok: false, note: { en: "scale must be positive", ru: "scale обязан быть положительным" } };
        }
        // same round trip as the lab: Python round (ties to even) + clip
        const pyRound = (x) => {
          const f = Math.floor(x), d = x - f;
          if (d > 0.5) return f + 1;
          if (d < 0.5) return f;
          return (f % 2 === 0) ? f : f + 1;
        };
        const row = [0.13, -0.88, 1.12, -2.40];
        let acc = 0;
        for (const v of row) {
          const code = Math.max(-8, Math.min(7, pyRound(v / scale)));
          const recon = scale * code;
          acc += (v - recon) * (v - recon);
        }
        const mse = acc / row.length;
        if (Math.abs(mse - mseClaimed) > 1e-6 + mse * 0.02) {
          return { ok: false, note: { en: "your printed mse does not match the recomputed round trip: scale " + scale + " gives MSE " + mse.toFixed(6), ru: "напечатанный mse не сходится с пересчитанным циклом: scale " + scale + " даёт MSE " + mse.toFixed(6) } };
        }
        if (mse > 0.008) {
          return { ok: false, note: { en: "MSE " + mse.toFixed(6) + " > 0.008 - not better enough than the absmax/7 policy (0.0118); search on", ru: "MSE " + mse.toFixed(6) + " > 0.008 — недостаточно лучше политики absmax/7 (0.0118); ищи дальше" } };
        }
        return { ok: true, note: { en: "scale " + scale + " → MSE " + mse.toFixed(6) + " — the absmax policy lost to your search", ru: "scale " + scale + " → MSE " + mse.toFixed(6) + " — политика absmax проиграла твоему поиску" } };
      },
      reference: `# absmax/7 picks scale = 2.40/7 = 0.3429 -> MSE 0.011833, dominated by the
# small weights sitting far from grid points. A slightly smaller scale
# spends grid steps where the mass of the row is and pays a little more
# clip error on the outlier - total MSE drops about 2x.
values = [0.13, -0.88, 1.12, -2.40]

def mse_at(scale):
    tot = 0.0
    for v in values:
        q = max(-8, min(7, round(v / scale)))
        tot += (v - scale * q) ** 2
    return tot / len(values)

best = None
s = 0.01
while s <= 1.0:
    m = mse_at(s)
    if best is None or m < best[1]:
        best = (s, m)
    s += 0.001
print(f"scale={best[0]:.3f} mse={best[1]:.6f}")
# grid search finds scale ~0.296 with MSE ~0.0055 - about 2x better than
# the absmax policy's 0.0118. Lesson: range-derived scales are robust,
# not optimal; real kernels special-case outliers (per-group scales,
# AWQ/GPTQ-style calibration search).`,
    },
    posttest: [
      {
        id: "p1",
        q: { en: "Row absmax is 1.4, 4-bit symmetric grid [\u22128, 7]. What scale does the absmax policy pick?", ru: "absmax \u0441\u0442\u0440\u043e\u043a\u0438 1.4, 4-\u0431\u0438\u0442\u043d\u0430\u044f \u0441\u0438\u043c\u043c\u0435\u0442\u0440\u0438\u0447\u043d\u0430\u044f \u0441\u0435\u0442\u043a\u0430 [\u22128, 7]. \u041a\u0430\u043a\u043e\u0439 scale \u0432\u044b\u0431\u0435\u0440\u0435\u0442 absmax-\u043f\u043e\u043b\u0438\u0442\u0438\u043a\u0430?" },
        options: [{ en: "1.4 / 7", ru: "1.4 / 7" }, { en: "1.4 / 8", ru: "1.4 / 8" }, { en: "1.4 / 15", ru: "1.4 / 15" }],
        answer: 0,
        explain: { en: "absmax maps to the top positive code 7: scale = absmax / 7. Dividing by 8 is the signed-range trap.", ru: "absmax \u043e\u0442\u043e\u0431\u0440\u0430\u0436\u0430\u0435\u0442\u0441\u044f \u0432\u00a0\u0441\u0442\u0430\u0440\u0448\u0438\u0439 \u043f\u043e\u043b\u043e\u0436\u0438\u0442\u0435\u043b\u044c\u043d\u044b\u0439 \u043a\u043e\u0434 7: scale = absmax / 7. \u0414\u0435\u043b\u0435\u043d\u0438\u0435 \u043d\u0430 8 \u2014 \u043b\u043e\u0432\u0443\u0448\u043a\u0430 \u0437\u043d\u0430\u043a\u043e\u0432\u043e\u0433\u043e \u0434\u0438\u0430\u043f\u0430\u0437\u043e\u043d\u0430." },
      },
      {
        id: "p2",
        q: { en: "Why clip the integer codes to [\u22128, 7] before reconstructing?", ru: "\u0417\u0430\u0447\u0435\u043c \u043a\u043b\u0438\u043f\u043e\u0432\u0430\u0442\u044c \u0446\u0435\u043b\u044b\u0435 \u043a\u043e\u0434\u044b \u0432 [\u22128, 7] \u043f\u0435\u0440\u0435\u0434 \u0440\u0435\u043a\u043e\u043d\u0441\u0442\u0440\u0443\u043a\u0446\u0438\u0435\u0439?" },
        options: [{ en: "Out-of-range codes silently erase the error", ru: "\u041a\u043e\u0434\u044b \u0432\u043d\u0435 \u0434\u0438\u0430\u043f\u0430\u0437\u043e\u043d\u0430 \u043c\u043e\u043b\u0447\u0430 \u0441\u0442\u0438\u0440\u0430\u044e\u0442 \u043e\u0448\u0438\u0431\u043a\u0443" }, { en: "To speed up the multiplication", ru: "\u0427\u0442\u043e\u0431\u044b \u0443\u0441\u043a\u043e\u0440\u0438\u0442\u044c \u0443\u043c\u043d\u043e\u0436\u0435\u043d\u0438\u0435" }, { en: "Because negative codes are invalid", ru: "\u041f\u043e\u0442\u043e\u043c\u0443 \u0447\u0442\u043e \u043e\u0442\u0440\u0438\u0446\u0430\u0442\u0435\u043b\u044c\u043d\u044b\u0435 \u043a\u043e\u0434\u044b \u043d\u0435\u0432\u0430\u043b\u0438\u0434\u043d\u044b" }],
        answer: 0,
        explain: { en: "An unclipped code 9 \u00abreconstructs\u00bb an impossible value and the error looks like zero \u2014 clipping makes outliers honestly expensive.", ru: "\u041d\u0435\u043a\u043b\u0438\u043f\u043e\u0432\u0430\u043d\u043d\u044b\u0439 \u043a\u043e\u0434 9 \u00ab\u0440\u0435\u043a\u043e\u043d\u0441\u0442\u0440\u0443\u0438\u0440\u0443\u0435\u0442\u00bb \u043d\u0435\u0432\u043e\u0437\u043c\u043e\u0436\u043d\u043e\u0435 \u0437\u043d\u0430\u0447\u0435\u043d\u0438\u0435 \u0438\u00a0\u043e\u0448\u0438\u0431\u043a\u0430 \u0432\u044b\u0433\u043b\u044f\u0434\u0438\u0442 \u043d\u0443\u043b\u0451\u043c \u2014 \u043a\u043b\u0438\u043f \u0434\u0435\u043b\u0430\u0435\u0442 \u0432\u044b\u0431\u0440\u043e\u0441\u044b \u0447\u0435\u0441\u0442\u043d\u043e \u0434\u043e\u0440\u043e\u0433\u0438\u043c\u0438." },
      },
      {
        id: "p3",
        q: { en: "Reconstruction is scale \u00d7 code. The signed reconstruction error of weight 0.37 with scale 0.2 (code 2) is\u2026", ru: "\u0420\u0435\u043a\u043e\u043d\u0441\u0442\u0440\u0443\u043a\u0446\u0438\u044f = scale \u00d7 code. \u0417\u043d\u0430\u043a\u043e\u0432\u0430\u044f \u043e\u0448\u0438\u0431\u043a\u0430 \u0440\u0435\u043a\u043e\u043d\u0441\u0442\u0440\u0443\u043a\u0446\u0438\u0438 \u0432\u0435\u0441\u0430 0.37 \u043f\u0440\u0438 scale 0.2 (\u043a\u043e\u0434 2) \u2014 \u044d\u0442\u043e\u2026" },
        options: [{ en: "+0.03 (recon \u2212 original)", ru: "+0.03 (\u0440\u0435\u043a\u043e\u043d \u2212 \u043e\u0440\u0438\u0433\u0438\u043d\u0430\u043b)" }, { en: "\u22120.03 (original \u2212 recon)", ru: "\u22120.03 (\u043e\u0440\u0438\u0433\u0438\u043d\u0430\u043b \u2212 \u0440\u0435\u043a\u043e\u043d)" }, { en: "0.03 / 0.37", ru: "0.03 / 0.37" }],
        answer: 0,
        explain: { en: "Course convention: error = reconstruction \u2212 original = 0.4 \u2212 0.37 = +0.03. Sign conventions must match the notebook.", ru: "\u0421\u043e\u0433\u043b\u0430\u0448\u0435\u043d\u0438\u0435 \u043a\u0443\u0440\u0441\u0430: \u043e\u0448\u0438\u0431\u043a\u0430 = \u0440\u0435\u043a\u043e\u043d\u0441\u0442\u0440\u0443\u043a\u0446\u0438\u044f \u2212 \u043e\u0440\u0438\u0433\u0438\u043d\u0430\u043b = 0.4 \u2212 0.37 = +0.03. \u0417\u043d\u0430\u043a \u0434\u043e\u043b\u0436\u0435\u043d \u0441\u043e\u0432\u043f\u0430\u0434\u0430\u0442\u044c \u0441\u00a0\u0442\u0440\u0430\u0441\u0441\u0438\u0440\u043e\u0432\u043a\u043e\u0439 \u0442\u0435\u0442\u0440\u0430\u0434\u0438." },
      },
      {
        id: "r1",
        tag: { en: "code reading", ru: "код-чтение" },
        q: { en: "This «vendor» module reports MSE 0.0786 on the TOY row (scale 0.25); the lab's honest round trip gives 0.0642. Which line is the degradation?", ru: "Этот «вендорский» модуль выдаёт MSE 0.0786 на TOY-строке (scale 0.25), а честный цикл лабы — 0.0642. Какая строка — деградация?" },
        code: `# quant_lib.py - row-wise symmetric INT4 helper (vendor module, v1.3)
GRID_LO, GRID_HI = -8, 7

def row_scale(row):
    absmax = max(abs(v) for v in row)
    return absmax / 7 if absmax else 1.0

def quantize(row, scale):
    codes = []
    for v in row:
        codes.append(int(v / scale))          # <- A
    return [max(GRID_LO, min(GRID_HI, c)) for c in codes]

def dequantize(codes, scale):
    return [scale * c for c in codes]

def mse(row, scale):
    rec = dequantize(quantize(row, scale), scale)
    return sum((v - r) ** 2 for v, r in zip(row, rec)) / len(row)
`,
        context: { en: "Reproduce it in any exercise editor or the ★ editor: mse([-1.83, -0.52, 0.24, 2.25], 0.25) prints 0.0786 — the degradation is real and stable, not a typo.", ru: "Воспроизведи в любом редакторе упражнений или в ★-редакторе: mse([−1.83, −0.52, 0.24, 2.25], 0.25) печатает 0.0786 — деградация реальная и стабильная, не опечатка." },
        options: [
          { en: "Line A: int() truncates toward zero instead of rounding to nearest — codes drift toward zero and the small weights' errors grow", ru: "Строка A: int() усекает к нулю вместо округления к ближайшему — коды смещаются к нулю, и ошибки малых весов растут" },
          { en: "row_scale: absmax/7 is the wrong policy — it should divide by 8", ru: "row_scale: absmax/7 — неверная политика, надо делить на 8" },
          { en: "mse: the denominator must be len(row) − 1, not len(row)", ru: "mse: в знаменателе должно быть len(row) − 1, а не len(row)" },
        ],
        answer: 0,
        explain: { en: "int(-2.08) = -2 and int(0.96) = 0: truncation biases every code toward zero (Python's int() truncates, it does not round). On the TOY row 0.24 loses its grid point (code 0 instead of 1) and the MSE grows 0.0642 → 0.0786. The scale policy and the denominator are correct.", ru: "int(−2.08) = −2, int(0.96) = 0: усечение смещает каждый код к нулю (Python-овский int() усекает, а не округляет). На TOY-строке 0.24 теряет свою точку сетки (код 0 вместо 1), и MSE растёт с 0.0642 до 0.0786. Политика scale и знаменатель здесь корректны." },
      },
    ],
    reward: {
      caption: { en: "Scales derived, codes clipped, errors accounted \u2014 quantization holds no secrets.", ru: "scale \u0432\u044b\u0432\u0435\u0434\u0435\u043d, \u043a\u043e\u0434\u044b \u043e\u0431\u0440\u0435\u0437\u0430\u043d\u044b, \u043e\u0448\u0438\u0431\u043a\u0438 \u043f\u043e\u0441\u0447\u0438\u0442\u0430\u043d\u044b \u2014 \u0432 \u043a\u0432\u0430\u043d\u0442\u043e\u0432\u0430\u043d\u0438\u0438 \u0434\u043b\u044f \u0442\u0435\u0431\u044f \u043d\u0435\u0442 \u0441\u0435\u043a\u0440\u0435\u0442\u043e\u0432." },
    },
    footer: {
      en: "Teaching arithmetic on a declared INT4 grid and invented rows — not a measurement of any kernel or model. The recorded FP16 vs NF4 paired run lives in the Topic 03 evidence run (seminars/runs/2026-10-02-topic03-quantization); this lab does not execute it.",
      ru: "Учебная арифметика на заявленной сетке INT4 и выдуманных строках — не измерение какого-либо ядра или модели. Записанный парный прогон FP16 против NF4 живёт в evidence-прогоне Темы 03 (seminars/runs/2026-10-02-topic03-quantization); эта лаба его не исполняет.",
    },
  };
})();
