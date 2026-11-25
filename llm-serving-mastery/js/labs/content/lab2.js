/* Lab 02 — Bottlenecks: roofline and the KV cache.
   Content module for the generic lab page (window.LABS_CONTENT['02']).
   Deterministic declared model; real Python tests run in the browser sandbox.
   Reference implementation of the lab content schema. */
(function () {
  "use strict";
  window.LABS_CONTENT = window.LABS_CONTENT || {};

  LABS_CONTENT["2"] = {
    budget: 45,
    title: {
      en: "Bottlenecks: roofline and the KV cache",
      ru: "Узкие места: roofline и KV-кэш",
    },
    sub: {
      en: "Predict which roof bounds the step, size the KV payload per token, then defend it in real Python tests.",
      ru: "Предскажи, какая крыша ограничивает шаг, оцени KV-платёж за токен и защити это настоящими Python-тестами.",
    },
    intro: {
      en: `<p>Decode is a stream of steps; each step moves weights from memory and does a little math. Two ceilings bound the step: <strong>compute</strong> (TFLOP/s) and <strong>memory bandwidth</strong> (GB/s). The <em>roofline</em> model says attainable = min(compute, intensity × bandwidth), where arithmetic intensity = FLOP per byte moved. Left of the ridge you are bandwidth-bound; right of it, compute-bound — more reuse stops helping after the ridge.</p>
<p>The KV cache is the other budget: every live token pays <strong>2 × layers × kv_heads × head_dim × bytes</strong> (the 2 is K and V). This payload is not model-weight memory and it grows with every client and every context token. The lab habit: write the arithmetic down first, let the tests check it, only then argue about a real GPU.</p>`,
      ru: `<p>Decode — это поток шагов; каждый шаг перетаскивает веса из памяти и делает немного арифметики. Шаг ограничивают две крыши: <strong>вычисления</strong> (TFLOP/s) и <strong>пропускная способность памяти</strong> (GB/s). Модель <em>roofline</em>: attainable = min(compute, intensity × bandwidth), где арифметическая интенсивность = FLOP на байт перемещённых данных. Слева от хребта ты упираешься в память, справа — в вычисления; после хребта повторное использование данных перестаёт помогать.</p>
<p>Второй бюджет — KV-кэш: каждый живой токен платит <strong>2 × layers × kv_heads × head_dim × bytes</strong> (двойка — это K и V). Этот платёж — не память весов, и он растёт с каждым клиентом и каждым токеном контекста. Привычка лабы: сначала выписать арифметику, дать тестам её проверить, и только потом спорить про реальный GPU.</p>`,
    },
    heroTag: { en: "roofline, KV budget", ru: "крыши, KV-бюджет" },
    glossary: [
      [{ en: "bottleneck", ru: "узкое место" }, { en: "the single limit that decides the step time — every other part waits on it; the roofline picture names which one binds right now.", ru: "единственный предел, который определяет время шага, — всё остальное ждёт его; картинка roofline как раз называет, какая граница связывает прямо сейчас." }],
      [{ en: "roofline", ru: "roofline" }, { en: "a two-ceiling picture of a machine: attainable = min(compute, intensity × bandwidth) — like a speed limit that switches mid-road.", ru: "картина машины с двумя потолками: attainable = min(compute, intensity × bandwidth) — как ограничение скорости, которое меняется посреди дороги." }],
      [{ en: "compute roof", ru: "крыша вычислений" }, { en: "the processor's ceiling in operations per second (TFLOP/s): no schedule computes faster, however much reuse you add.", ru: "потолок процессора в операциях в секунду (TFLOP/s): быстрее считать нельзя, сколько бы повторного использования данных ни добавлять." }],
      [{ en: "bandwidth", ru: "пропускная способность памяти" }, { en: "how many bytes per second the memory can stream to the compute units (GB/s) — the other roof of a decode step.", ru: "сколько байтов в секунду память может подавать вычислительным блокам (GB/s) — вторая крыша decode-шага." }],
      [{ en: "arithmetic intensity", ru: "арифметическая интенсивность" }, { en: "FLOP per byte moved from memory; a school-ratio style number: work divided by hauling.", ru: "FLOP на байт перемещённых из памяти данных; по-школьному — отношение: работа, делённая на перевозку." }],
      [{ en: "ridge", ru: "хребет" }, { en: "the intensity where the two roofs meet: left of it you are bandwidth-bound, right of it compute-bound, and more reuse stops helping.", ru: "интенсивность, где крыши встречаются: левее ты упираешься в память, правее — в вычисления, и повторное использование перестаёт помогать." }],
      [{ en: "decode", ru: "decode" }, { en: "the generation phase that emits tokens step by step, one forward pass per token; the phase this lab's roofs bound.", ru: "фаза генерации, выдающая токены шаг за шагом, по одному forward-проходу на токен; именно её ограничивают крыши этой лабы." }],
      [{ en: "KV cache", ru: "KV-кэш" }, { en: "per-token state (tensors K and V) that must stay in memory while the sequence is alive; it grows with every client and every context token.", ru: "состояние на токен (тензоры K и V), которое обязано жить в памяти, пока жива последовательность; растёт с каждым клиентом и каждым токеном контекста." }],
      [{ en: "KV payload per token", ru: "KV-платёж за токен" }, { en: "the exact size of that state: 2 × layers × kv_heads × head_dim × bytes — the 2 is K and V.", ru: "точный размер этого состояния: 2 × layers × kv_heads × head_dim × bytes, где двойка — это K и V." }],
      [{ en: "pool", ru: "пул" }, { en: "a fixed memory reserve set aside for the KV cache; how many live tokens fit is the pool size divided by the per-token bill.", ru: "фиксированный запас памяти, выделенный под KV-кэш; сколько живых токенов помещается — размер пула, делённый на платёж за токен." }],
    ],
    figures: [
      {
        id: "lab2-roofline",
        title: { en: "Roofline: which roof bounds the decode step", ru: "Roofline: какая крыша ограничивает decode-шаг" },
        w: 760, h: 420,
        svg: `<svg viewBox="0 0 760 420" xmlns="http://www.w3.org/2000/svg">
  <g id="g-axes">
    <line x1="80" y1="340" x2="700" y2="340" stroke="var(--lab-muted)" stroke-width="1.5"/>
    <line x1="80" y1="340" x2="80" y2="60" stroke="var(--lab-muted)" stroke-width="1.5"/>
    <text x="700" y="366" text-anchor="end" font-size="14" fill="var(--lab-muted)" data-en="arithmetic intensity, FLOP/B" data-ru="арифметическая интенсивность, FLOP/Б">arithmetic intensity, FLOP/B</text>
    <text x="88" y="52" font-size="14" fill="var(--lab-muted)" data-en="attainable, TFLOP/s" data-ru="достижимо, TFLOP/s">attainable, TFLOP/s</text>
    <text x="200" y="360" text-anchor="middle" font-size="13" fill="var(--lab-muted)" class="mono">100</text>
  </g>
  <g id="g-bw">
    <line x1="80" y1="340" x2="200" y2="86" stroke="var(--lab-accent)" stroke-width="2.5" class="fig-flow"/>
    <text x="112" y="216" font-size="14" fill="var(--lab-accent)">600 GB/s</text>
    <text x="88" y="90" font-size="13" fill="var(--lab-accent)" class="mono">60</text>
  </g>
  <g id="g-comp">
    <line x1="200" y1="86" x2="680" y2="86" stroke="var(--lab-accent)" stroke-width="2.5"/>
    <line x1="200" y1="86" x2="200" y2="340" stroke="var(--fig-warm)" stroke-width="1.5" stroke-dasharray="4 4"/>
    <text x="676" y="76" text-anchor="end" font-size="14" fill="var(--lab-accent)" data-en="compute roof 60" data-ru="крыша вычислений 60">compute roof 60</text>
    <text x="208" y="332" font-size="13" fill="var(--fig-warm)" data-en="ridge 100" data-ru="хребет 100">ridge 100</text>
  </g>
  <g id="g-pt1">
    <circle cx="104" cy="289" r="7" fill="var(--lab-accent)"/>
    <text x="120" y="284" font-size="15" fill="var(--lab-ink)" class="mono">20 → 12</text>
    <text x="120" y="304" font-size="13" fill="var(--lab-muted)" data-en="decode step" data-ru="decode-шаг">decode step</text>
  </g>
  <g id="g-pt2">
    <circle cx="260" cy="86" r="7" fill="var(--fig-warm)"/>
    <text x="276" y="112" font-size="15" fill="var(--lab-ink)" class="mono">150 → 60</text>
  </g>
</svg>`,
        stages: [
          { cap: { en: "Axes: attainable TFLOP/s against arithmetic intensity — the roofline frame.", ru: "Оси: достижимые TFLOP/s против арифметической интенсивности — каркас roofline." }, show: ["g-axes"] },
          { cap: { en: "The roofline frame: attainable TFLOP/s versus arithmetic intensity.", ru: "Две крыши: память растёт до хребта, дальше вычисления запирают на 60." }, show: ["g-axes", "g-bw", "g-comp"] },
          { cap: { en: "Decode left of the ridge: 20 × 600 GB/s pins the step at 12 TFLOP/s.", ru: "Decode левее хребта: 20 × 600 GB/s запирает шаг на 12 TFLOP/s." }, show: ["g-axes", "g-bw", "g-comp", "g-pt1"] },
          { cap: { en: "Right of the ridge: intensity 150 pins at 60 — the compute roof.", ru: "Правее хребта: интенсивность 150 запирает шаг на 60 — крыша вычислений." }, show: ["g-axes", "g-bw", "g-comp", "g-pt2"] },
        ],
      },
      {
        id: "lab2-kv-budget",
        title: { en: "KV budget: the per-token bill against the pool", ru: "KV-бюджет: платёж за токен против пула" },
        w: 760, h: 420,
        svg: `<svg viewBox="0 0 760 420" xmlns="http://www.w3.org/2000/svg">
  <g id="g-token">
    <text x="60" y="70" font-size="16" fill="var(--lab-ink)" class="mono">2 × 36 × 2 × 128 × 2 B</text>
    <text x="60" y="94" font-size="14" fill="var(--lab-muted)" data-en="K + V per live token = 36 KiB" data-ru="K + V за живой токен = 36 КиБ">K + V per live token = 36 KiB</text>
    <rect x="60" y="110" width="60" height="26" rx="5" fill="var(--lab-accent)" opacity="0.85"/>
    <text x="128" y="128" font-size="14" fill="var(--lab-accent)" class="mono">36 KiB</text>
  </g>
  <g id="g-pool">
    <rect x="330" y="60" width="380" height="300" rx="12" fill="none" stroke="var(--lab-muted)" stroke-width="2" stroke-dasharray="7 5"/>
    <text x="520" y="88" text-anchor="middle" font-size="15" fill="var(--lab-muted)" data-en="KV pool: 6 GiB" data-ru="пул KV: 6 ГиБ">KV pool: 6 GiB</text>
    <text x="520" y="382" text-anchor="middle" font-size="13" fill="var(--lab-muted)" class="mono">6 × 1024³ B</text>
  </g>
  <g id="g-fit">
    <rect x="350" y="100" width="340" height="240" rx="8" fill="var(--lab-accent)" opacity="0.14"/>
    <text x="520" y="212" text-anchor="middle" font-size="21" fill="var(--lab-accent)" class="mono">174 762</text>
    <text x="520" y="240" text-anchor="middle" font-size="14" fill="var(--lab-ink)" data-en="whole tokens fit" data-ru="целых токенов помещается">whole tokens fit</text>
    <text x="520" y="262" text-anchor="middle" font-size="13" fill="var(--lab-muted)" class="mono">6 × 1024³ / 36 864</text>
  </g>
  <g id="g-double">
    <rect x="350" y="100" width="170" height="240" rx="8" fill="var(--lab-accent)" opacity="0.07"/>
    <rect x="350" y="220" width="170" height="120" rx="8" fill="var(--fig-warm)" opacity="0.14"/>
    <text x="435" y="170" text-anchor="middle" font-size="15" fill="var(--lab-muted)" class="mono">72 KiB</text>
    <text x="435" y="192" text-anchor="middle" font-size="13" fill="var(--lab-muted)" data-en="kv_heads 2 → 4" data-ru="kv_heads 2 → 4">kv_heads 2 → 4</text>
    <text x="435" y="290" text-anchor="middle" font-size="16" fill="var(--fig-warm)" class="mono">87 381</text>
    <text x="435" y="312" text-anchor="middle" font-size="13" fill="var(--fig-warm)" data-en="tokens — half" data-ru="токенов — вдвое меньше">tokens — half</text>
  </g>
</svg>`,
        stages: [
          { cap: { en: "Every live token pays 36 KiB of K and V state.", ru: "Каждый живой токен платит 36 КиБ за K и V." }, show: ["g-token"] },
          { cap: { en: "The pool is fixed: 6 GiB reserved for the KV cache.", ru: "Пул фиксирован: 6 ГиБ выделено под KV-кэш." }, show: ["g-token", "g-pool"] },
          { cap: { en: "Fits: 6 × 1024³ / 36 864 = 174 762 tokens.", ru: "Целых токенов помещается: 6 × 1024³ / 36 864 = 174 762." }, show: ["g-token", "g-pool", "g-fit"] },
          { cap: { en: "The lever: kv_heads 2 → 4 doubles the bill to 72 KiB.", ru: "Ручка: kv_heads 2 → 4 удваивает платёж — пул вмещает вдвое меньше." }, show: ["g-pool", "g-double"] },
        ],
      },
    ],
    outcomes: [
      { en: "Predict which roof (bandwidth or compute) bounds a decode step before measuring.", ru: "\u041f\u0440\u0435\u0434\u0441\u043a\u0430\u0437\u044b\u0432\u0430\u0442\u044c, \u043a\u0430\u043a\u0430\u044f \u043a\u0440\u044b\u0448\u0430 \u2014 \u043f\u0430\u043c\u044f\u0442\u044c \u0438\u043b\u0438 \u0432\u044b\u0447\u0438\u0441\u043b\u0435\u043d\u0438\u044f \u2014 \u043e\u0433\u0440\u0430\u043d\u0438\u0447\u0438\u0432\u0430\u0435\u0442 decode-\u0448\u0430\u0433, \u0434\u043e \u0438\u0437\u043c\u0435\u0440\u0435\u043d\u0438\u044f." },
      { en: "Compute the exact KV payload per token and the tokens that fit a fixed pool.", ru: "\u0421\u0447\u0438\u0442\u0430\u0442\u044c \u0442\u043e\u0447\u043d\u044b\u0439 KV-\u043f\u043b\u0430\u0442\u0451\u0436 \u0437\u0430 \u0442\u043e\u043a\u0435\u043d \u0438\u00a0\u0447\u0438\u0441\u043b\u043e \u0442\u043e\u043a\u0435\u043d\u043e\u0432, \u043f\u043e\u043c\u0435\u0449\u0430\u044e\u0449\u0438\u0445\u0441\u044f \u0432\u00a0\u0444\u0438\u043a\u0441\u0438\u0440\u043e\u0432\u0430\u043d\u043d\u044b\u0439 \u043f\u0443\u043b." },
    ],
    model: [
      [{ en: "compute ceiling", ru: "крыша вычислений" }, "60 TFLOP/s", { en: "bandwidth", ru: "пропускная способность" }, "600 GB/s"],
      [{ en: "ridge intensity", ru: "интенсивность хребта" }, { en: "compute / bandwidth = 100 FLOP/B", ru: "вычисления / память = 100 FLOP/Б" }, { en: "attainable", ru: "достижимо" }, "min(compute, intensity × bandwidth)"],
      [{ en: "kv per token", ru: "KV-платёж за токен" }, { en: "2 × layers × kv_heads × head_dim × bytes", ru: "2 × layers × kv_heads × head_dim × bytes" }, "1 GiB", { en: "1024³ bytes", ru: "1024³ байта" }],
    ],
    scenario: null,
    quizzes: [
      {
        id: "q1",
        q: {
          en: "What is the ridge arithmetic intensity for 60 TFLOP/s and 600 GB/s, in FLOP/byte?",
          ru: "Какова интенсивность хребта для 60 TFLOP/s и 600 GB/s, во FLOP/Б?",
        },
        answer: 100, tol: 0.5, unit: { en: "FLOP/B", ru: "FLOP/Б" },
        hint: {
          en: "ridge = compute ceiling / bandwidth. Keep the units: TFLOP/s divided by GB/s.",
          ru: "хребет = крыша вычислений / пропускная способность. Следи за единицами: дели TFLOP/s на GB/s.",
        },
        followUp: {
          q: { en: "Why exactly 100 FLOP/B? Pick the true cause.", ru: "Почему именно 100 FLOP/Б? Выбери верную причину." },
          options: [
            { en: "The units cancel: TFLOP/s ÷ GB/s leaves 10³ FLOP/B, and 60/600 = 0.1 × 10³ = 100", ru: "Единицы сокращаются: TFLOP/s ÷ GB/s оставляет 10³ FLOP/Б, а 60/600 = 0.1 × 10³ = 100" },
            { en: "The ridge is bandwidth ÷ compute = 600/60 = 10", ru: "Хребет — это bandwidth ÷ compute = 600/60 = 10" },
            { en: "The ridge is always 1000 for fp16 GPUs", ru: "Хребет всегда 1000 для fp16-GPU" },
          ],
          answer: 0,
          explain: { en: "At the ridge both roofs are equal: intensity × bandwidth = compute. Solve for intensity — the units do the work: (10¹² FLOP/s)/(10⁹ B/s) = 10³ FLOP/B.", ru: "На хребте обе крыши равны: intensity × bandwidth = compute. Вырази intensity — работу делают единицы: (10¹² FLOP/с)/(10⁹ Б/с) = 10³ FLOP/Б." },
        },
        // Вариативность №5 (contract: instructor/plans/quiz-variants-contract-20261125.ru.md).
        // variants[0] = base byte-equal; ответы пересчитаны по ridge = compute / bandwidth × 1000:
        //   90 / 450 × 1000 = 200;  75 / 250 × 1000 = 300.
        // База (100) напечатана в фигуре roofline, поэтому новые ответы уведены от всех
        // фигурных чисел (100 / 600 / 60 / 20 / 12 / 150); followUp переписан под входы.
        // Подсказка у вариантов наследуется: базовая формула без чисел.
        variants: [
          {
            q: {
              en: "What is the ridge arithmetic intensity for 60 TFLOP/s and 600 GB/s, in FLOP/byte?",
              ru: "Какова интенсивность хребта для 60 TFLOP/s и 600 GB/s, во FLOP/Б?",
            },
            answer: 100, tol: 0.5,
          },
          {
            q: {
              en: "What is the ridge arithmetic intensity for 90 TFLOP/s and 450 GB/s, in FLOP/byte?",
              ru: "Какова интенсивность хребта для 90 TFLOP/s и 450 GB/s, во FLOP/Б?",
            },
            answer: 200, tol: 0.5,
            followUp: {
              q: { en: "Why exactly 200 FLOP/B? Pick the true cause.", ru: "Почему именно 200 FLOP/Б? Выбери верную причину." },
              options: [
                { en: "The units cancel: TFLOP/s ÷ GB/s leaves 10³ FLOP/B, and 90/450 = 0.2 × 10³ = 200", ru: "Единицы сокращаются: TFLOP/s ÷ GB/s оставляет 10³ FLOP/Б, а 90/450 = 0.2 × 10³ = 200" },
                { en: "The ridge is bandwidth ÷ compute = 450/90 = 5", ru: "Хребет — это bandwidth ÷ compute = 450/90 = 5" },
                { en: "The ridge is always 1000 for fp16 GPUs", ru: "Хребет всегда 1000 для fp16-GPU" },
              ],
              answer: 0,
              explain: { en: "At the ridge both roofs are equal: intensity × bandwidth = compute. Solve for intensity — the units do the work: (9 × 10¹³ FLOP/s)/(4.5 × 10¹¹ B/s) = 2 × 10² FLOP/B.", ru: "На хребте обе крыши равны: intensity × bandwidth = compute. Вырази intensity — работу делают единицы: (9 × 10¹³ FLOP/с)/(4.5 × 10¹¹ Б/с) = 2 × 10² FLOP/Б." },
            },
          },
          {
            q: {
              en: "What is the ridge arithmetic intensity for 75 TFLOP/s and 250 GB/s, in FLOP/byte?",
              ru: "Какова интенсивность хребта для 75 TFLOP/s и 250 GB/s, во FLOP/Б?",
            },
            answer: 300, tol: 0.5,
            followUp: {
              q: { en: "Why exactly 300 FLOP/B? Pick the true cause.", ru: "Почему именно 300 FLOP/Б? Выбери верную причину." },
              options: [
                { en: "The units cancel: TFLOP/s ÷ GB/s leaves 10³ FLOP/B, and 75/250 = 0.3 × 10³ = 300", ru: "Единицы сокращаются: TFLOP/s ÷ GB/s оставляет 10³ FLOP/Б, а 75/250 = 0.3 × 10³ = 300" },
                { en: "The ridge is bandwidth ÷ compute = 250/75 ≈ 3.3", ru: "Хребет — это bandwidth ÷ compute = 250/75 ≈ 3.3" },
                { en: "The ridge is always 1000 for fp16 GPUs", ru: "Хребет всегда 1000 для fp16-GPU" },
              ],
              answer: 0,
              explain: { en: "At the ridge both roofs are equal: intensity × bandwidth = compute. Solve for intensity — the units do the work: (7.5 × 10¹³ FLOP/s)/(2.5 × 10¹¹ B/s) = 3 × 10² FLOP/B.", ru: "На хребте обе крыши равны: intensity × bandwidth = compute. Вырази intensity — работу делают единицы: (7.5 × 10¹³ FLOP/с)/(2.5 × 10¹¹ Б/с) = 3 × 10² FLOP/Б." },
            },
          },
        ],
      },
      {
        id: "q2",
        q: {
          en: "Attainable performance at intensity 20 FLOP/B on that machine, in TFLOP/s?",
          ru: "Достижимая производительность при интенсивности 20 FLOP/Б на этой машине, в TFLOP/s?",
        },
        answer: 12, tol: 0.5, unit: { en: "TFLOP/s", ru: "TFLOP/s" },
        hint: {
          en: "20 FLOP/B is left of the ridge: the bandwidth roof bounds you — intensity × bandwidth.",
          ru: "20 FLOP/Б левее хребта: ограничивает крыша памяти — интенсивность × пропускная способность.",
        },
        followUp: {
          q: { en: "Why 12 and not the compute roof 60?", ru: "Почему 12, а не крыша вычислений 60?" },
          options: [
            { en: "Left of the ridge the data movement is the bottleneck: 20 × 600 GB/s = 12 000 GFLOP/s = 12 TFLOP/s", ru: "Левее хребта узкое место — перемещение данных: 20 × 600 GB/s = 12 000 GFLOP/s = 12 TFLOP/s" },
            { en: "The min() always picks the smaller number, which is always the compute roof", ru: "min() всегда берёт меньшее число, а это всегда крыша вычислений" },
            { en: "Decode wastes 80 % of the compute on overhead", ru: "Decode тратит 80 % вычислений на накладные расходы" },
          ],
          answer: 0,
          explain: { en: "Left of the ridge, intensity × bandwidth < compute: the weights stream limits you. The compute roof only binds right of the ridge.", ru: "Левее хребта intensity × bandwidth < compute: ограничивает поток весов. Крыша вычислений связывает только правее хребта." },
        },
        // Вариативность №5: машина фиксирована (60 TFLOP/s, 600 GB/s — константы модели),
        // меняется интенсивность: attainable = min(60, I × 600 / 1000):  I = 45 → 27;  I = 65 → 39.
        // Оба левее хребта (100); ответы 27 и 39 прочь от фигурных «20 → 12»; followUp переписан.
        variants: [
          {
            q: {
              en: "Attainable performance at intensity 20 FLOP/B on that machine, in TFLOP/s?",
              ru: "Достижимая производительность при интенсивности 20 FLOP/Б на этой машине, в TFLOP/s?",
            },
            answer: 12, tol: 0.5,
          },
          {
            q: {
              en: "Attainable performance at intensity 45 FLOP/B on that machine, in TFLOP/s?",
              ru: "Достижимая производительность при интенсивности 45 FLOP/Б на этой машине, в TFLOP/s?",
            },
            answer: 27, tol: 0.5,
            hint: {
              en: "45 FLOP/B is left of the ridge: the bandwidth roof bounds you — intensity × bandwidth, converted from GFLOP/s to TFLOP/s.",
              ru: "45 FLOP/Б левее хребта: ограничивает крыша памяти — интенсивность × пропускная способность, с переводом GFLOP/s в TFLOP/s.",
            },
            followUp: {
              q: { en: "Why 27 and not the compute roof 60?", ru: "Почему 27, а не крыша вычислений 60?" },
              options: [
                { en: "Left of the ridge the data movement is the bottleneck: 45 × 600 GB/s = 27 000 GFLOP/s = 27 TFLOP/s", ru: "Левее хребта узкое место — перемещение данных: 45 × 600 GB/s = 27 000 GFLOP/s = 27 TFLOP/s" },
                { en: "The min() always picks the smaller number, which is always the compute roof", ru: "min() всегда берёт меньшее число, а это всегда крыша вычислений" },
                { en: "Decode wastes 80 % of the compute on overhead", ru: "Decode тратит 80 % вычислений на накладные расходы" },
              ],
              answer: 0,
              explain: { en: "Left of the ridge, intensity × bandwidth < compute: the weights stream limits you. The compute roof only binds right of the ridge.", ru: "Левее хребта intensity × bandwidth < compute: ограничивает поток весов. Крыша вычислений связывает только правее хребта." },
            },
          },
          {
            q: {
              en: "Attainable performance at intensity 65 FLOP/B on that machine, in TFLOP/s?",
              ru: "Достижимая производительность при интенсивности 65 FLOP/Б на этой машине, в TFLOP/s?",
            },
            answer: 39, tol: 0.5,
            hint: {
              en: "65 FLOP/B is left of the ridge: the bandwidth roof bounds you — intensity × bandwidth, converted from GFLOP/s to TFLOP/s.",
              ru: "65 FLOP/Б левее хребта: ограничивает крыша памяти — интенсивность × пропускная способность, с переводом GFLOP/s в TFLOP/s.",
            },
            followUp: {
              q: { en: "Why 39 and not the compute roof 60?", ru: "Почему 39, а не крыша вычислений 60?" },
              options: [
                { en: "Left of the ridge the data movement is the bottleneck: 65 × 600 GB/s = 39 000 GFLOP/s = 39 TFLOP/s", ru: "Левее хребта узкое место — перемещение данных: 65 × 600 GB/s = 39 000 GFLOP/s = 39 TFLOP/s" },
                { en: "The min() always picks the smaller number, which is always the compute roof", ru: "min() всегда берёт меньшее число, а это всегда крыша вычислений" },
                { en: "Decode wastes 80 % of the compute on overhead", ru: "Decode тратит 80 % вычислений на накладные расходы" },
              ],
              answer: 0,
              explain: { en: "Left of the ridge, intensity × bandwidth < compute: the weights stream limits you. The compute roof only binds right of the ridge.", ru: "Левее хребта intensity × bandwidth < compute: ограничивает поток весов. Крыша вычислений связывает только правее хребта." },
            },
          },
        ],
      },
      {
        id: "q3",
        q: {
          en: "KV payload per token for 36 layers, 2 KV heads, head_dim 128, fp16 (2 bytes), in KiB?",
          ru: "KV-платёж за токен при 36 слоях, 2 KV-головах, head_dim 128, fp16 (2 байта), в КиБ?",
        },
        answer: 36, tol: 0.2, unit: { en: "KiB", ru: "КиБ" },
        hint: {
          en: "2 × 36 × 2 × 128 × 2 bytes; convert to KiB by dividing by 1024.",
          ru: "2 × 36 × 2 × 128 × 2 байта; переведи в КиБ делением на 1024.",
        },
        followUp: {
          q: { en: "Why does the leading 2 matter so much here?", ru: "Почему ведущая двойка здесь так важна?" },
          options: [
            { en: "It is K and V: every token stores two state tensors, so forgetting it understates the bill exactly ×2", ru: "Это K и V: каждый токен хранит два тензора состояния, поэтому забыть её — занизить платёж ровно вдвое" },
            { en: "It is the fp16 two-byte size — counted twice for safety", ru: "Это двухбайтность fp16 — посчитанная дважды для надёжности" },
            { en: "It is the number of KV caches kept per GPU", ru: "Это число KV-кэшей, держащихся на GPU" },
          ],
          answer: 0,
          explain: { en: "2 × 36 × 2 × 128 × 2 B = 36 864 B. Drop the first 2 and every pool estimate halves: 87 381 tokens instead of 174 762 — the classic understatement.", ru: "2 × 36 × 2 × 128 × 2 Б = 36 864 Б. Убери первую двойку — и каждая оценка пула делится пополам: 87 381 токен вместо 174 762. Классическое занижение." },
        },
        // Вариативность №5: форма KV меняется целиком; ответ пересчитан по
        // 2 × layers × kv_heads × head_dim × bytes / 1024:
        //   32 / 8 / 64 / fp16 → 65 536 Б = 64 КиБ;  24 / 8 / 64 / fp8 → 24 576 Б = 24 КиБ.
        // База (36) живёт в фигуре, 64 и 24 там не встречаются; followUp-объяснение
        // переписано без чисел базы (36 864 / 87 381 — только у базы).
        variants: [
          {
            q: {
              en: "KV payload per token for 36 layers, 2 KV heads, head_dim 128, fp16 (2 bytes), in KiB?",
              ru: "KV-платёж за токен при 36 слоях, 2 KV-головах, head_dim 128, fp16 (2 байта), в КиБ?",
            },
            answer: 36, tol: 0.2,
          },
          {
            q: {
              en: "KV payload per token for 32 layers, 8 KV heads, head_dim 64, fp16 (2 bytes), in KiB?",
              ru: "KV-платёж за токен при 32 слоях, 8 KV-головах, head_dim 64, fp16 (2 байта), в КиБ?",
            },
            answer: 64, tol: 0.2,
            hint: {
              en: "Five factors: 2 × layers × kv_heads × head_dim × bytes — then convert bytes to KiB before you answer.",
              ru: "Пять множителей: 2 × layers × kv_heads × head_dim × bytes — и переведи байты в КиБ, прежде чем отвечать.",
            },
            followUp: {
              q: { en: "Why does the leading 2 matter so much here?", ru: "Почему ведущая двойка здесь так важна?" },
              options: [
                { en: "It is K and V: every token stores two state tensors, so forgetting it understates the bill exactly ×2", ru: "Это K и V: каждый токен хранит два тензора состояния, поэтому забыть её — занизить платёж ровно вдвое" },
                { en: "It is the fp16 two-byte size — counted twice for safety", ru: "Это двухбайтность fp16 — посчитанная дважды для надёжности" },
                { en: "It is the number of KV caches kept per GPU", ru: "Это число KV-кэшей, держащихся на GPU" },
              ],
              answer: 0,
              explain: { en: "2 × layers × kv_heads × head_dim × bytes is the whole bill: drop the first 2 and every pool estimate halves — the classic understatement.", ru: "2 × layers × kv_heads × head_dim × bytes — весь платёж: убери первую двойку, и каждая оценка пула делится пополам. Классическое занижение." },
            },
          },
          {
            q: {
              en: "KV payload per token for 24 layers, 8 KV heads, head_dim 64, fp8 (1 byte), in KiB?",
              ru: "KV-платёж за токен при 24 слоях, 8 KV-головах, head_dim 64, fp8 (1 байт), в КиБ?",
            },
            answer: 24, tol: 0.2,
            hint: {
              en: "Five factors: 2 × layers × kv_heads × head_dim × bytes — and with fp8 the last factor is 1. KiB is binary, not decimal.",
              ru: "Пять множителей: 2 × layers × kv_heads × head_dim × bytes — и с fp8 последний множитель равен 1. КиБ — двоичный, не десятичный.",
            },
            followUp: {
              q: { en: "Why does the leading 2 matter so much here?", ru: "Почему ведущая двойка здесь так важна?" },
              options: [
                { en: "It is K and V: every token stores two state tensors, so forgetting it understates the bill exactly ×2", ru: "Это K и V: каждый токен хранит два тензора состояния, поэтому забыть её — занизить платёж ровно вдвое" },
                { en: "It is the fp16 two-byte size — counted twice for safety", ru: "Это двухбайтность fp16 — посчитанная дважды для надёжности" },
                { en: "It is the number of KV caches kept per GPU", ru: "Это число KV-кэшей, держащихся на GPU" },
              ],
              answer: 0,
              explain: { en: "2 × layers × kv_heads × head_dim × bytes is the whole bill: drop the first 2 and every pool estimate halves — the classic understatement.", ru: "2 × layers × kv_heads × head_dim × bytes — весь платёж: убери первую двойку, и каждая оценка пула делится пополам. Классическое занижение." },
            },
          },
        ],
      },
    ],
    exercises: [
      {
        id: "ex1",
        title: { en: "Exercise 1 · Roofline ceiling", ru: "Упражнение 1 · Крыша roofline" },
        brief: {
          en: "Implement <code>roofline_ceiling(intensity, compute_tflops, bandwidth_gbps)</code> — attainable TFLOP/s as <code>min(compute, intensity × bandwidth)</code>. Watch the units: intensity is FLOP per <strong>byte</strong>, bandwidth is GB/s — the product is GFLOP/s, divide by 1000.",
          ru: "Реализуй <code>roofline_ceiling(intensity, compute_tflops, bandwidth_gbps)</code> — достижимые TFLOP/s как <code>min(compute, intensity × bandwidth)</code>. Следи за единицами: интенсивность — FLOP на <strong>байт</strong>, пропускная способность памяти — GB/s; их произведение — в GFLOP/s, дели на 1000.",
        },
        starter: `def roofline_ceiling(intensity, compute_tflops, bandwidth_gbps):
    """Attainable TFLOP/s: min(compute roof, intensity x bandwidth / 1000)."""
    # TODO: one line of arithmetic
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
          { en: "One min(): the compute roof and the product (intensity × bandwidth / 1000). No branches needed.", ru: "Один min(): крыша вычислений и произведение (интенсивность × bandwidth / 1000). Ветвления не нужны." },
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
    # TODO: formula from the "Declared model" block
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
          en: "This <code>kv_pool_tokens(pool_gib, per_token_bytes)</code> undercounts: it treats GiB as 10⁹ bytes and shrinks the pool by an unexplained 0.75 reserve. Fix it to return whole tokens that fit: <code>int(pool_gib × 1024³ / per_token_bytes)</code>.",
          ru: "Эта <code>kv_pool_tokens(pool_gib, per_token_bytes)</code> занижает: считает GiB как 10⁹ байт и сжимает пул необъяснённым множителем 0.75. Почини: целое число токенов, помещающихся в пул, — <code>int(pool_gib × 1024³ / per_token_bytes)</code>.",
        },
        starter: `def kv_pool_tokens(pool_gib, per_token_bytes):
    """How many whole live tokens fit in a pool of pool_gib GiB."""
    # BUG: 1e9 instead of GiB, and an unexplained 0.75 reserve
    k = per_token_bytes / 2
    return int(pool_gib * 1e9 / (k + k) * 0.75)
`,
        tests: [
          { name: "6 GiB pool, 36 KiB per token", hidden: false, code: "eq(kv_pool_tokens(6, 36864), 174762)" },
          { name: "1 GiB pool, 64 KiB per token", hidden: false, code: "eq(kv_pool_tokens(1, 65536), 16384)" },
          { name: "fractional GiB floor", hidden: true, code: "eq(kv_pool_tokens(0.5, 1024), 524288)" },
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
    challenge: {
      id: "chal1",
      word: { en: "challenge", ru: "челлендж" },
      title: {
        en: "★ Fit 20 sessions of 4096 tokens into the 6 GiB pool",
        ru: "★ Умести 20 сессий по 4096 токенов в пул 6 ГиБ",
      },
      brief: {
        en: "You design the engine's KV shape: choose <code>kv_heads ∈ {1, 2, 4, 8}</code> and the element width <code>bytes ∈ {1, 2}</code> (fp8/fp16) with the fixed <code>layers = 36</code>, <code>head_dim = 128</code>. Each session holds a 4096-token context. No tests guide you — the page reads only the numbers you print and accepts them only if they follow the declared KV formula.",
        ru: "Ты проектируешь KV-форму движка: выбери <code>kv_heads ∈ {1, 2, 4, 8}</code> и ширину элемента <code>bytes ∈ {1, 2}</code> (fp8/fp16) при фиксированных <code>layers = 36</code>, <code>head_dim = 128</code>. Каждая сессия держит контекст 4096 токенов. Тестов-каркаса нет — страница читает только напечатанные числа и принимает их, лишь если они следуют заявленной KV-формуле.",
      },
      goal: {
        en: "Print one line: <code>kv_heads=… bytes=… kib=… sessions=…</code> with sessions ≥ 20, where sessions = floor(6 GiB ÷ per-token bytes ÷ 4096).",
        ru: "Напечатай одну строку: <code>kv_heads=… bytes=… kib=… sessions=…</code> с sessions ≥ 20, где sessions = floor(6 ГиБ ÷ байты на токен ÷ 4096).",
      },
      mode: "run",
      numpy: false,
      timeoutMs: 30000,
      starter: `# Goal: pick kv_heads (1/2/4/8) and bytes (1 = fp8, 2 = fp16) so that a
# 6 GiB KV pool holds >= 20 sessions of 4096 tokens each.
# Declared per-token bill: 2 * 36 * kv_heads * 128 * bytes (bytes, K + V).
# The page reads ONE summary line in exactly this shape:
#   kv_heads=<1|2|4|8> bytes=<1|2> kib=<KiB per token> sessions=<floor>

# TODO: try the shapes, compute the bill and the sessions, print the line.
`,
      check: (res) => {
        const out = String(res.stdout || "");
        const mm = out.match(/kv_heads\s*=\s*([1248])\b[\s\S]*?bytes\s*=\s*([12])\b[\s\S]*?kib\s*=\s*([0-9]+(?:\.[0-9]+)?)[\s\S]*?sessions\s*=\s*([0-9]+)/i);
        if (!mm) {
          return { ok: false, note: { en: "no summary line found - print exactly: kv_heads=… bytes=… kib=… sessions=…", ru: "итоговой строки нет — напечатай ровно: kv_heads=… bytes=… kib=… sessions=…" } };
        }
        const kv = parseInt(mm[1], 10), bytesEl = parseInt(mm[2], 10);
        const kib = parseFloat(mm[3]), sessions = parseInt(mm[4], 10);
        const bytesTok = 2 * 36 * kv * 128 * bytesEl;
        const kibModel = bytesTok / 1024;
        if (Math.abs(kib - kibModel) > Math.max(0.1, kibModel * 0.01)) {
          return { ok: false, note: { en: "kib must follow the declared bill: 2 × 36 × kv_heads × 128 × bytes / 1024 = " + kibModel.toFixed(2), ru: "kib обязан следовать заявленному платежу: 2 × 36 × kv_heads × 128 × bytes / 1024 = " + kibModel.toFixed(2) } };
        }
        const sessModel = Math.floor(6 * 1024 * 1024 * 1024 / (bytesTok * 4096));
        if (sessions !== sessModel) {
          return { ok: false, note: { en: "sessions must be floor(6 GiB ÷ " + bytesTok + " B ÷ 4096) = " + sessModel, ru: "sessions — это floor(6 ГиБ ÷ " + bytesTok + " Б ÷ 4096) = " + sessModel } };
        }
        if (sessModel < 20) {
          return { ok: false, note: { en: sessModel + " sessions < 20 - the shape is too heavy, trade kv_heads or bytes down", ru: sessModel + " сессий < 20 — форма слишком тяжёлая, снижай kv_heads или bytes" } };
        }
        return { ok: true, note: { en: kv + " kv-heads × " + (bytesEl === 1 ? "fp8" : "fp16") + ": " + kibModel.toFixed(0) + " KiB/token → " + sessModel + " sessions ≥ 20", ru: kv + " kv-голов × " + (bytesEl === 1 ? "fp8" : "fp16") + ": " + kibModel.toFixed(0) + " КиБ/токен → " + sessModel + " сессий ≥ 20" } };
      },
      reference: `# The bill is 2 * 36 * kv * 128 * bytes; sessions = 6 GiB // (bill * 4096).
# Walk the shapes honestly and watch the lever work:
for kv in (1, 2, 4, 8):
    for b in (1, 2):
        bill = 2 * 36 * kv * 128 * b
        sessions = 6 * 1024**3 // (bill * 4096)
        print(f"kv_heads={kv} bytes={b} kib={bill / 1024:.1f} sessions={sessions}")
# kv_heads=8 with fp16 doubles the bill twice: 10 sessions - too heavy.
# Any of kv<=4 at fp16 (or kv=8 at fp8) clears the 20-session goal.`,
    },
    posttest: [
      {
        id: "p1",
        q: { en: "A decode step runs at arithmetic intensity 150 FLOP/B on the declared machine (ridge 100). What bounds it?", ru: "Decode-\u0448\u0430\u0433 \u0438\u0434\u0451\u0442 \u043f\u0440\u0438 \u0438\u043d\u0442\u0435\u043d\u0441\u0438\u0432\u043d\u043e\u0441\u0442\u0438 150 FLOP/\u0411 \u043d\u0430 \u0437\u0430\u044f\u0432\u043b\u0435\u043d\u043d\u043e\u0439 \u043c\u0430\u0448\u0438\u043d\u0435 (\u0445\u0440\u0435\u0431\u0435\u0442 100). \u0427\u0442\u043e \u0435\u0433\u043e \u043e\u0433\u0440\u0430\u043d\u0438\u0447\u0438\u0432\u0430\u0435\u0442?" },
        options: [{ en: "The bandwidth roof", ru: "\u041a\u0440\u044b\u0448\u0430 \u043f\u0430\u043c\u044f\u0442\u0438" }, { en: "The compute roof", ru: "\u041a\u0440\u044b\u0448\u0430 \u0432\u044b\u0447\u0438\u0441\u043b\u0435\u043d\u0438\u0439" }, { en: "Neither: it is latency-bound", ru: "\u041d\u0438\u0447\u0435\u0433\u043e \u0438\u0437 \u044d\u0442\u043e\u0433\u043e: \u043e\u043d \u043e\u0433\u0440\u0430\u043d\u0438\u0447\u0435\u043d \u043b\u0430\u0442\u0435\u043d\u0442\u043d\u043e\u0441\u0442\u044c\u044e" }],
        answer: 1,
        explain: { en: "150 is right of the ridge: attainable = min(compute, intensity \u00d7 bandwidth) pins at the compute roof.", ru: "150 \u043f\u0440\u0430\u0432\u0435\u0435 \u0445\u0440\u0435\u0431\u0442\u0430: attainable = min(compute, intensity \u00d7 bandwidth) \u0443\u043f\u0438\u0440\u0430\u0435\u0442\u0441\u044f \u0432\u00a0\u043a\u0440\u044b\u0448\u0443 \u0432\u044b\u0447\u0438\u0441\u043b\u0435\u043d\u0438\u0439." },
      },
      {
        id: "p2",
        q: { en: "Which one is NOT part of the per-token KV payload?", ru: "\u0427\u0442\u043e \u0438\u0437 \u044d\u0442\u043e\u0433\u043e \u041d\u0415 \u0432\u0445\u043e\u0434\u0438\u0442 \u0432 KV-\u043f\u043b\u0430\u0442\u0451\u0436 \u0437\u0430 \u0442\u043e\u043a\u0435\u043d?" },
        options: [{ en: "K and V tensors", ru: "\u0422\u0435\u043d\u0437\u043e\u0440\u044b K \u0438 V" }, { en: "Model weights", ru: "\u0412\u0435\u0441\u0430 \u043c\u043e\u0434\u0435\u043b\u0438" }, { en: "kv_heads \u00d7 head_dim", ru: "kv_heads \u00d7 head_dim" }],
        answer: 1,
        explain: { en: "KV payload = 2 \u00d7 layers \u00d7 kv_heads \u00d7 head_dim \u00d7 bytes \u2014 it is per-token state, not the frozen weights.", ru: "KV-\u043f\u043b\u0430\u0442\u0451\u0436 = 2 \u00d7 layers \u00d7 kv_heads \u00d7 head_dim \u00d7 bytes \u2014 \u044d\u0442\u043e \u043f\u043b\u0430\u0442\u0430 \u0437\u0430 \u0441\u043e\u0441\u0442\u043e\u044f\u043d\u0438\u0435 \u043d\u0430 \u0442\u043e\u043a\u0435\u043d, \u0430\u00a0\u043d\u0435 \u0437\u0430 \u0432\u0435\u0441\u0430 \u043c\u043e\u0434\u0435\u043b\u0438." },
      },
      {
        id: "p3",
        q: { en: "You double kv_heads from 2 to 4. The per-token payload\u2026", ru: "\u0422\u044b \u0443\u0434\u0432\u043e\u0438\u043b kv_heads \u0441 2 \u0434\u043e 4. \u041f\u043b\u0430\u0442\u0451\u0436 \u0437\u0430 \u0442\u043e\u043a\u0435\u043d\u2026" },
        options: [{ en: "stays the same", ru: "\u043d\u0435 \u043c\u0435\u043d\u044f\u0435\u0442\u0441\u044f" }, { en: "doubles", ru: "\u0443\u0434\u0432\u0430\u0438\u0432\u0430\u0435\u0442\u0441\u044f" }, { en: "halves", ru: "\u0434\u0435\u043b\u0438\u0442\u0441\u044f \u043f\u043e\u043f\u043e\u043b\u0430\u043c" }],
        answer: 1,
        explain: { en: "The formula is linear in kv_heads: 2 \u00d7 36 \u00d7 2 \u00d7 128 \u00d7 2 doubles from 36 to 72 KiB.", ru: "\u0424\u043e\u0440\u043c\u0443\u043b\u0430 \u043b\u0438\u043d\u0435\u0439\u043d\u0430 \u043f\u043e kv_heads: \u043f\u043b\u0430\u0442\u0451\u0436 \u0432\u044b\u0440\u0430\u0441\u0442\u0430\u0435\u0442 \u0441 36 \u0434\u043e 72\u00a0\u041a\u0438\u0411." },
      },
    ],
    reward: {
      caption: { en: "You can now predict which roof bounds a step \u2014 and prove it with tests.", ru: "\u0422\u0435\u043f\u0435\u0440\u044c \u0442\u044b \u0443\u043c\u0435\u0435\u0448\u044c \u043f\u0440\u0435\u0434\u0441\u043a\u0430\u0437\u044b\u0432\u0430\u0442\u044c, \u043a\u0430\u043a\u0430\u044f \u043a\u0440\u044b\u0448\u0430 \u043e\u0433\u0440\u0430\u043d\u0438\u0447\u0438\u0432\u0430\u0435\u0442 \u0448\u0430\u0433, \u2014 \u0438 \u0434\u043e\u043a\u0430\u0437\u044b\u0432\u0430\u0442\u044c \u044d\u0442\u043e \u0442\u0435\u0441\u0442\u0430\u043c\u0438." },
    },
    footer: {
      en: "Teaching arithmetic with a declared model — not a GPU measurement. The measured phase profile lives in the Topic 02 evidence run; this lab does not execute it.",
      ru: "Учебная арифметика с заявленной моделью — не измерение GPU. Измеренный профиль фаз живёт в evidence-прогоне Темы 02; эта лаба его не исполняет.",
    },
  };
})();
