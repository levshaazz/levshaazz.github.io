/* Lab 02 — Bottlenecks: roofline and the KV cache.
   Content module for the generic lab page (window.LABS_CONTENT['02']).
   Deterministic declared model; real Python tests run in the browser sandbox.
   Reference implementation of the lab content schema. */
(function () {
  "use strict";
  window.LABS_CONTENT = window.LABS_CONTENT || {};

  LABS_CONTENT["2"] = {
    title: {
      en: "Bottlenecks: roofline and the KV cache",
      ru: "Узкие места: roofline и KV-кэш",
    },
    sub: {
      en: "Predict which roof bounds the step, size the KV payload per token, then defend it in real Python tests.",
      ru: "Предскажи, какая крыша ограничивает шаг, оцени KV-платёж за токен и защити это настоящими Python-тестами.",
    },
    intro: {
      en: `<p>Decode is a stream of steps; each step moves weights from memory and does a little math. Two ceilings bound the step: <strong>compute</strong> (TFLOP/s) and <strong>memory bandwidth</strong> (GB/s). The <em>roofline</em> model says attainable = min(compute, intensity × bandwidth), where arithmetic intensity = FLOP per byte moved. Left of the ridge you are bandwidth-bound; right of it, compute-bound — more reuse stops helping after the ridge.</p>
<p>The KV cache is the other budget: every live token pays <strong>2 × layers × kv_heads × head_dim × bytes</strong> (the 2 is K and V). This payload is not model-weight memory and it grows with every client and every context token. The lab habit: write the arithmetic down first, let the tests check it, only then argue about a real GPU.</p>`,
      ru: `<p>Decode — это поток шагов; каждый шаг перетаскивает веса из памяти и делает немного арифметики. Шаг ограничивают две крыши: <strong>вычисления</strong> (TFLOP/s) и <strong>пропускная способность памяти</strong> (GB/s). Модель <em>roofline</em>: attainable = min(compute, intensity × bandwidth), где арифметическая интенсивность = FLOP на байт перемещённых данных. Слева от хребта ты упираешься в память, справа — в вычисления; после хребта повторное использование данных перестаёт помогать.</p>
<p>Vторой бюджет — KV-кэш: каждый живой токен платит <strong>2 × layers × kv_heads × head_dim × bytes</strong> (двойка — это K и V). Этот платёж — не память весов, и он растёт с каждым клиентом и каждым токеном контекста. Привычка лабы: сначала выписать арифметику, дать тестам её проверить, и только потом спорить про реальный GPU.</p>`,
    },
    model: [
      ["compute ceiling", "60 TFLOP/s", "bandwidth", "600 GB/s"],
      ["ridge intensity", "compute / bandwidth = 100 FLOP/B", "attainable", "min(compute, intensity × bandwidth)"],
      ["kv per token", "2 × layers × kv_heads × head_dim × bytes", "1 GiB", "1024³ bytes"],
    ],
    scenario: null,
    quizzes: [
      {
        id: "q1",
        q: {
          en: "What is the ridge arithmetic intensity for 60 TFLOP/s and 600 GB/s, in FLOP/byte?",
          ru: "Какова интенсивность хребта для 60 TFLOP/s и 600 GB/s, во FLOP/байт?",
        },
        answer: 100, tol: 0.5, unit: { en: "FLOP/B", ru: "FLOP/Б" },
        hint: {
          en: "ridge = compute ceiling / bandwidth. Keep the units: TFLOP/s divided by GB/s.",
          ru: "хребет = потолок вычислений / пропускная способность. Следи за единицами: TFLOP/s делить на GB/s.",
        },
      },
      {
        id: "q2",
        q: {
          en: "Attainable throughput at intensity 20 FLOP/B on that machine, in TFLOP/s?",
          ru: "Достижимая производительность при интенсивности 20 FLOP/Б на этой машине, в TFLOP/s?",
        },
        answer: 12, tol: 0.5, unit: { en: "TFLOP/s", ru: "TFLOP/s" },
        hint: {
          en: "20 FLOP/B is left of the ridge: the bandwidth roof bounds you — intensity × bandwidth.",
          ru: "20 FLOP/Б левее хребта: ограничивает крыша памяти — интенсивность × пропускная способность.",
        },
      },
      {
        id: "q3",
        q: {
          en: "KV payload per token for 36 layers, 2 KV heads, head_dim 128, fp16 (2 bytes), in KiB?",
          ru: "KV-платёж за токен при 36 слоях, 2 KV-головах, head_dim 128, fp16 (2 байта), в КиБ?",
        },
        answer: 36, tol: 0.2, unit: { en: "KiB", ru: "КиБ" },
        hint: {
          en: "2 × 36 × 2 × 128 × 2 bytes = 36 864 B; divide by 1024.",
          ru: "2 × 36 × 2 × 128 × 2 байта = 36 864 Б; раздели на 1024.",
        },
      },
    ],
    exercises: [
      {
        id: "ex1",
        title: { en: "Exercise 1 · Roofline ceiling", ru: "Упражнение 1 · Крыша roofline" },
        brief: {
          en: "Implement <code>roofline_ceiling(intensity, compute_tflops, bandwidth_gbps)</code> — attainable TFLOP/s as <code>min(compute, intensity × bandwidth)</code>. Watch the units: intensity is FLOP per <strong>byte</strong>, bandwidth is GB/s — the product is GFLOP/s, divide by 1000.",
          ru: "Реализуй <code>roofline_ceiling(intensity, compute_tflops, bandwidth_gbps)</code> — достижимые TFLOP/s как <code>min(compute, intensity × bandwidth)</code>. Следи за единицами: интенсивность — FLOP на <strong>байт</strong>, bandwidth — GB/s — произведение в GFLOP/s, дели на 1000.",
        },
        starter: `def roofline_ceiling(intensity, compute_tflops, bandwidth_gbps):
    """Attainable TFLOP/s: min(compute roof, intensity x bandwidth / 1000)."""
    # TODO: одна строка арифметики
`,
        tests: [
          { name: "bandwidth-bound left of ridge", hidden: false, code: "eq(roofline_ceiling(20, 60, 600), 12.0)" },
          { name: "exactly at the ridge", hidden: false, code: "eq(roofline_ceiling(100, 60, 600), 60)" },
          { name: "compute-bound right of ridge", hidden: false, code: "eq(roofline_ceiling(500, 60, 600), 60)" },
          { name: "different machine", hidden: true, code: "eq(roofline_ceiling(150, 90, 300), 45)" },
        ],
        solution: `def roofline_ceiling(intensity, compute_tflops, bandwidth_gbps):
    return min(compute_tflops, intensity * bandwidth_gbps / 1000)`,
        hints: [
          { en: "One min() of two products. No branches needed.", ru: "Один min() от двух произведений. Ветвления не нужны." },
        ],
        numpy: false,
        timeoutMs: 4000,
      },
      {
        id: "ex2",
        title: { en: "Exercise 2 · KV payload per token", ru: "Упражнение 2 · KV-платёж за токен" },
        brief: {
          en: "Implement <code>kv_bytes_per_token(layers, kv_heads, head_dim, bytes_per_elem)</code> — exact bytes per live token: <strong>2 × layers × kv_heads × head_dim × bytes</strong>. The 2 is K and V; forgetting it is the classic understatement.",
          ru: "Реализуй <code>kv_bytes_per_token(layers, kv_heads, head_dim, bytes_per_elem)</code> — точные байты на живой токен: <strong>2 × layers × kv_heads × head_dim × bytes</strong>. Двойка — это K и V; забыть её — классическое занижение.",
        },
        starter: `def kv_bytes_per_token(layers, kv_heads, head_dim, bytes_per_elem):
    """Exact bytes of KV payload per live token (K and V)."""
    # TODO: формула из блока «Заявленная модель»
`,
        tests: [
          { name: "Qwen2.5-3B teaching shape", hidden: false, code: "eq(kv_bytes_per_token(36, 2, 128, 2), 36864)" },
          { name: "more heads, fp8", hidden: false, code: "eq(kv_bytes_per_token(32, 8, 128, 1), 65536)" },
          { name: "GQA small model", hidden: true, code: "eq(kv_bytes_per_token(24, 4, 64, 2), 24576)" },
        ],
        solution: `def kv_bytes_per_token(layers, kv_heads, head_dim, bytes_per_elem):
    return 2 * layers * kv_heads * head_dim * bytes_per_elem`,
        hints: [
          { en: "Five factors: 2, layers, kv_heads, head_dim, bytes. Nothing else.", ru: "Пять множителей: 2, layers, kv_heads, head_dim, bytes. Больше ничего." },
        ],
        numpy: false,
        timeoutMs: 4000,
      },
      {
        id: "ex3",
        title: { en: "Exercise 3 · Fix the bug: pool capacity", ru: "Упражнение 3 · Почини баг: ёмкость пула" },
        brief: {
          en: "This <code>kv_pool_tokens(pool_gib, per_token_bytes)</code> undercounts: it treats GiB as 10⁹ bytes and forgets that <code>per_token_bytes</code> already includes K <em>and</em> V while the author divided K and V separately. Fix it to return whole tokens that fit: <code>int(pool_gib × 1024³ / per_token_bytes)</code>.",
          ru: "Эта <code>kv_pool_tokens(pool_gib, per_token_bytes)</code> занижает: считает GiB как 10⁹ байт и делит K и V по отдельности, хотя <code>per_token_bytes</code> уже включает оба. Почини: целое число токенов, помещающихся в пул, — <code>int(pool_gib × 1024³ / per_token_bytes)</code>.",
        },
        starter: `def kv_pool_tokens(pool_gib, per_token_bytes):
    """How many whole live tokens fit in a pool of pool_gib GiB."""
    # BUG: 1e9 instead of GiB, and the K+V split is applied twice
    k = per_token_bytes / 2
    return int(pool_gib * 1e9 / (k + k) * 0.75)
`,
        tests: [
          { name: "6 GiB pool, 36 KiB per token", hidden: false, code: "eq(kv_pool_tokens(6, 36864), 174762)" },
          { name: "1 GiB pool, 64 KiB per token", hidden: false, code: "eq(kv_pool_tokens(1, 65536), 16384)" },
          { name: "fractionalGiB floor", hidden: true, code: "eq(kv_pool_tokens(0.5, 1024), 524288)" },
        ],
        solution: `def kv_pool_tokens(pool_gib, per_token_bytes):
    return int(pool_gib * 1024**3 / per_token_bytes)`,
        hints: [
          { en: "GiB = 1024³ bytes; the whole per_token_bytes is already K+V — no further split.", ru: "GiB = 1024³ байт; per_token_bytes уже включает K и V — больше никакого деления." },
        ],
        numpy: false,
        timeoutMs: 4000,
      },
    ],
    reward: {
      caption: { en: "You can now predict which roof bounds a step \u2014 and prove it with tests.", ru: "\u0422\u0435\u043f\u0435\u0440\u044c \u0442\u044b \u0443\u043c\u0435\u0435\u0448\u044c \u043f\u0440\u0435\u0434\u0441\u043a\u0430\u0437\u044b\u0432\u0430\u0442\u044c, \u043a\u0430\u043a\u0430\u044f \u043a\u0440\u044b\u0448\u0430 \u043e\u0433\u0440\u0430\u043d\u0438\u0447\u0438\u0432\u0430\u0435\u0442 \u0448\u0430\u0433, \u2014 \u0438 \u0434\u043e\u043a\u0430\u0437\u044b\u0432\u0430\u0442\u044c \u044d\u0442\u043e \u0442\u0435\u0441\u0442\u0430\u043c\u0438." },
    },
    footer: {
      en: "Teaching arithmetic with a declared model — not a GPU measurement. The measured phase profile lives in the Topic 02 evidence run; this lab does not execute it.",
      ru: "Учебная арифметика с заявленной моделью — не измерение GPU. Измеренный профиль фаз живёт в evidence-прогоне Темы 02; эта лаба его не исполняет.",
    },
  };
})();
