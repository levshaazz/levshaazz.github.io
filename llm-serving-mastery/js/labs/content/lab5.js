/* Lab 05 — PagedAttention and batching.
   Content module for the generic lab page (window.LABS_CONTENT['5']).
   Deterministic declared model from the Topic 05 notebook's decode-only CPU toy;
   real Python tests run in the browser sandbox. Practice, not evidence. */
(function () {
  "use strict";
  window.LABS_CONTENT = window.LABS_CONTENT || {};

  LABS_CONTENT["5"] = {
    title: {
      en: "PagedAttention and batching",
      ru: "PagedAttention и батчинг",
    },
    sub: {
      en: "Round every request up to whole blocks, account the tail waste, then read a decode-only trace to see who finishes first.",
      ru: "Округли каждый запрос до целых блоков, посчитай пустые хвосты и прочитай decode-only трассу: кто завершится первым.",
    },
    intro: {
      en: `<p>PagedAttention splits each request's KV cache into physical blocks of <strong>B</strong> positions. A request retaining <strong>L</strong> positions occupies <strong>ceil(L / B)</strong> blocks, and the last block is usually half empty: the tail is allocated but never used. Requests do not share blocks, so the total reserved capacity is <strong>Σ ceil(Lᵢ / B) × B</strong> — not <code>ceil(ΣLᵢ / B) × B</code>: one shared pool undercounts by the extra tails. In the notebook fixture [17, 31, 33] on block 16 that is 2 + 2 + 3 = 7 blocks, not ceil(81 / 16) = 6.</p>
<p>Iteration-level (continuous) batching refills a freed slot at the next tick: a short request that finishes before its cohort immediately opens a slot for the next queued one. In the notebook toy (2 slots; A needs 5 ticks, B and C need 1; all arrive at tick 0) B completes at boundary tick 1, C is admitted at tick 1 and completes at tick 2 — while static mode would hold the whole cohort until it empties. The lab habit: read the trace by hand first, then let the tests check it; ticks are invented units, never GPU seconds.</p>`,
      ru: `<p>PagedAttention режет KV-кэш каждого запроса на физические блоки по <strong>B</strong> позиций. Запрос с <strong>L</strong> удержанными позициями занимает <strong>ceil(L / B)</strong> блоков, и последний блок обычно пуст наполовину: хвост выделен, но не используется. Запросы не делят блоки между собой, поэтому полная выделенная ёмкость — <strong>Σ ceil(Lᵢ / B) × B</strong>, а не <code>ceil(ΣLᵢ / B) × B</code>: один общий пул занижает счёт на лишние хвосты. В фикстуре тетради [17, 31, 33] при блоке 16 это 2 + 2 + 3 = 7 блоков, а не ceil(81 / 16) = 6.</p>
<p>Итерационный (continuous) батчинг подсаживает новый запрос в освободившийся слот на следующем тике: короткий запрос, завершившись раньше когорты, сразу открывает место следующему. В игрушке тетради (2 слота; A нужно 5 тиков, B и C — по 1; все пришли в тик 0) B завершается на границе тика 1, C стартует в тик 1 и завершается в тик 2, тогда как static-режим держал бы всю когорту до опустошения. Привычка лабы: сначала прочитай трассу руками, потом дай тестам проверить; тики — придуманные единицы, а не секунды GPU.</p>`,
    },
    heroTag: { en: "paging, batching, the knee", ru: "пейджинг, батчинг, колено" },
    figures: [
      {
        id: "lab5-pages",
        title: { en: "Pages of 16: the tails you pay for", ru: "Страницы по 16: хвосты, за которые платишь" },
        w: 760, h: 420,
        svg: `<svg viewBox="0 0 760 420" xmlns="http://www.w3.org/2000/svg">
  <g id="g-reqs">
    <text x="60" y="80" font-size="14" fill="var(--lab-muted)" data-en="3 requests: 17, 31, 33 positions; block = 16" data-ru="3 запроса: 17, 31 и 33 позиции; блок = 16">3 requests: 17, 31, 33 positions; block = 16</text>
    <rect x="60" y="96" width="102" height="26" rx="6" fill="var(--lab-accent)" opacity="0.85"/>
    <text x="180" y="115" font-size="14" fill="var(--lab-ink)" class="mono">17</text>
    <rect x="60" y="146" width="186" height="26" rx="6" fill="var(--lab-accent)" opacity="0.6"/>
    <text x="258" y="165" font-size="14" fill="var(--lab-ink)" class="mono">31</text>
    <rect x="60" y="196" width="198" height="26" rx="6" fill="var(--lab-accent)" opacity="0.4"/>
    <text x="270" y="215" font-size="14" fill="var(--lab-ink)" class="mono">33</text>
    <text x="60" y="252" font-size="13" fill="var(--lab-muted)" data-en="1 position = 1 slot; blocks hold 16" data-ru="1 позиция = 1 слот; блок вмещает 16">1 position = 1 slot; blocks hold 16</text>
  </g>
  <g id="g-blocks">
    <text x="60" y="292" font-size="14" fill="var(--lab-ink)" data-en="ceil to whole blocks: 2 + 2 + 3 = 7 blocks (112 slots)" data-ru="округление до целых блоков: 2 + 2 + 3 = 7 блоков (112 слотов)">ceil to whole blocks: 2 + 2 + 3 = 7 blocks (112 slots)</text>
    <rect x="60" y="304" width="32" height="24" rx="4" fill="var(--lab-accent)" opacity="0.85"/>
    <rect x="94" y="304" width="32" height="24" rx="4" fill="var(--fig-warm)" opacity="0.55"/>
    <text x="140" y="321" font-size="13" fill="var(--fig-warm)" class="mono">+15</text>
    <rect x="60" y="336" width="32" height="24" rx="4" fill="var(--lab-accent)" opacity="0.6"/>
    <rect x="94" y="336" width="32" height="24" rx="4" fill="var(--fig-warm)" opacity="0.55"/>
    <text x="140" y="353" font-size="13" fill="var(--fig-warm)" class="mono">+1</text>
    <rect x="60" y="368" width="32" height="24" rx="4" fill="var(--lab-accent)" opacity="0.4"/>
    <rect x="94" y="368" width="32" height="24" rx="4" fill="var(--lab-accent)" opacity="0.4"/>
    <rect x="128" y="368" width="32" height="24" rx="4" fill="var(--fig-warm)" opacity="0.55"/>
    <text x="174" y="385" font-size="13" fill="var(--fig-warm)" class="mono">+15</text>
    <text x="330" y="345" font-size="16" fill="var(--fig-warm)" data-en="tails: 15 + 1 + 15 = 31 unused" data-ru="хвосты: 15 + 1 + 15 = 31 пустая">tails: 15 + 1 + 15 = 31 unused</text>
  </g>
  <g id="g-pool">
    <rect x="380" y="80" width="330" height="150" rx="12" fill="none" stroke="var(--lab-muted)" stroke-width="1.5" stroke-dasharray="7 5" class="fig-ghost"/>
    <text x="545" y="120" text-anchor="middle" font-size="15" fill="var(--lab-muted)" class="fig-ghost" data-en="one shared pool promises:" data-ru="один общий пул обещает:">one shared pool promises:</text>
    <text x="545" y="156" text-anchor="middle" font-size="21" fill="var(--lab-muted)" class="mono fig-ghost">ceil(81 / 16) = 6</text>
    <text x="545" y="188" text-anchor="middle" font-size="14" fill="var(--fig-warm)" class="fig-ghost" data-en="it hides the 31-slot tails" data-ru="он прячет хвосты в 31 слот">it hides the 31-slot tails</text>
    <text x="380" y="262" font-size="15" fill="var(--lab-good)" data-en="real block tables: 7 blocks" data-ru="реальные block tables: 7 блоков">real block tables: 7 blocks</text>
    <text x="380" y="288" font-size="13" fill="var(--lab-muted)" data-en="requests never share blocks" data-ru="запросы никогда не делят блоки">requests never share blocks</text>
  </g>
</svg>`,
        stages: [
          { cap: { en: "Three requests retain 17, 31 and 33 positions on blocks of 16.", ru: "Три запроса удерживают 17, 31 и 33 позиции при блоках по 16." }, show: ["g-reqs"] },
          { cap: { en: "Round up: 2 + 2 + 3 = 7 blocks, 112 slots.", ru: "Округление вверх: 2 + 2 + 3 = 7 блоков, 112 слотов." }, show: ["g-reqs", "g-blocks"] },
          { cap: { en: "Tails 15 + 1 + 15 = 31 positions: allocated, never used.", ru: "Хвосты 15 + 1 + 15 = 31 позиция: выделены, не используются." }, show: ["g-reqs", "g-blocks"] },
          { cap: { en: "A shared pool claims ceil(81/16) = 6 blocks — hiding the tails.", ru: "Общий пул обещает ceil(81/16) = 6 блоков — хвосты спрятаны." }, show: ["g-blocks", "g-pool"] },
        ],
      },
      {
        id: "lab5-batching",
        title: { en: "Continuous batching: the freed slot fills at the boundary", ru: "Непрерывный батчинг: освободившийся слот заполняется на границе" },
        w: 760, h: 420,
        svg: `<svg viewBox="0 0 760 420" xmlns="http://www.w3.org/2000/svg">
  <g id="g-queue">
    <text x="60" y="80" font-size="14" fill="var(--lab-muted)" data-en="2 slots; A needs 5 ticks, B and C need 1; all arrive at tick 0" data-ru="2 слота; A нужно 5 тиков, B и C — по 1; все пришли в тик 0">2 slots; A needs 5 ticks, B and C need 1; all arrive at tick 0</text>
    <rect x="60" y="96" width="46" height="30" rx="6" fill="none" stroke="var(--lab-accent)" stroke-width="1.5"/>
    <text x="83" y="116" text-anchor="middle" font-size="14" fill="var(--lab-accent)" class="mono">A·5</text>
    <rect x="114" y="96" width="46" height="30" rx="6" fill="none" stroke="var(--lab-accent)" stroke-width="1.5"/>
    <text x="137" y="116" text-anchor="middle" font-size="14" fill="var(--lab-accent)" class="mono">B·1</text>
    <rect x="168" y="96" width="46" height="30" rx="6" fill="none" stroke="var(--lab-accent)" stroke-width="1.5"/>
    <text x="191" y="116" text-anchor="middle" font-size="14" fill="var(--lab-accent)" class="mono">C·1</text>
  </g>
  <g id="g-t0">
    <text x="60" y="170" font-size="15" fill="var(--lab-ink)" class="mono" data-en="tick 0" data-ru="тик 0">tick 0</text>
    <rect x="150" y="150" width="450" height="26" rx="6" fill="var(--lab-accent)" opacity="0.85"/>
    <text x="160" y="168" font-size="13" fill="var(--lab-bg)" class="mono">A</text>
    <rect x="150" y="186" width="90" height="26" rx="6" fill="var(--lab-accent)" opacity="0.55"/>
    <text x="160" y="204" font-size="13" fill="var(--lab-bg)" class="mono">B</text>
  </g>
  <g id="g-t1">
    <text x="60" y="250" font-size="15" fill="var(--lab-ink)" class="mono" data-en="tick 1" data-ru="тик 1">tick 1</text>
    <rect x="240" y="150" width="360" height="26" rx="6" fill="var(--lab-accent)" opacity="0.85"/>
    <rect x="240" y="186" width="90" height="26" rx="6" fill="var(--fig-warm)" opacity="0.7"/>
    <text x="246" y="204" font-size="13" fill="var(--lab-bg)" class="mono">B✓</text>
    <path d="M 330 199 L 372 199" fill="none" stroke="var(--lab-good)" stroke-width="2.5" class="fig-flow"/>
    <rect x="374" y="186" width="90" height="26" rx="6" fill="var(--lab-good)" opacity="0.7"/>
    <text x="384" y="204" font-size="13" fill="var(--lab-bg)" class="mono">C</text>
    <text x="480" y="204" font-size="13" fill="var(--lab-good)" data-en="C takes the freed slot at the boundary" data-ru="C занимает освободившийся слот на границе">C takes the freed slot at the boundary</text>
  </g>
  <g id="g-marks">
    <text x="60" y="300" font-size="15" fill="var(--lab-ink)" data-en="finish marks:" data-ru="отметки завершения:">finish marks:</text>
    <text x="190" y="300" font-size="15" fill="var(--lab-ink)" class="mono">B → 1</text>
    <text x="270" y="300" font-size="15" fill="var(--lab-ink)" class="mono">C → 2</text>
    <text x="350" y="300" font-size="15" fill="var(--lab-ink)" class="mono">A → 5</text>
    <line x1="150" y1="316" x2="600" y2="316" stroke="var(--lab-muted)" stroke-width="1"/>
    <circle cx="240" cy="316" r="5" fill="var(--fig-warm)"/>
    <circle cx="330" cy="316" r="5" fill="var(--lab-good)"/>
    <circle cx="600" cy="316" r="5" fill="var(--lab-accent)"/>
    <text x="640" y="321" font-size="13" fill="var(--lab-muted)" class="mono">tick</text>
  </g>
  <g id="g-static">
    <text x="380" y="362" text-anchor="middle" font-size="16" fill="var(--fig-warm)" data-en="static batching: C would start only at tick 5 → finish at 6" data-ru="static-батчинг: C стартовал бы только в тик 5 → финал на 6">static batching: C would start only at tick 5 → finish at 6</text>
    <text x="380" y="388" text-anchor="middle" font-size="14" fill="var(--lab-good)" data-en="continuous: C finished at 2" data-ru="continuous: C завершился на 2">continuous: C finished at 2</text>
  </g>
</svg>`,
        stages: [
          { cap: { en: "Two slots; A needs 5 ticks, B and C need 1 each.", ru: "Два слота; A нужно 5 тиков, B и C — по одному." }, show: ["g-queue"] },
          { cap: { en: "Tick 0: A and B take the slots.", ru: "Тик 0: A и B занимают слоты." }, show: ["g-queue", "g-t0"] },
          { cap: { en: "Tick 1: B finishes — C takes the freed slot.", ru: "Тик 1: B завершается — C встаёт в освободившийся слот на границе." }, show: ["g-queue", "g-t0", "g-t1"] },
          { cap: { en: "Finish marks: B at 1, C at 2, A at 5.", ru: "Отметки: B на 1, C на 2, A на 5." }, show: ["g-queue", "g-t0", "g-t1", "g-marks"] },
          { cap: { en: "Static idles the slot: C would finish at 6, not 2.", ru: "Static простаивает слот: C завершился бы на 6, не на 2." }, show: ["g-queue", "g-t0", "g-t1", "g-marks", "g-static"] },
        ],
      },
    ],
    outcomes: [
      { en: "Compute blocks, tails and waste for paged KV allocation.", ru: "\u0421\u0447\u0438\u0442\u0430\u0442\u044c \u0431\u043b\u043e\u043a\u0438, \u0445\u0432\u043e\u0441\u0442\u044b \u0438 \u043e\u0442\u0445\u043e\u0434\u044b \u043f\u0440\u0438 paged-\u0430\u043b\u043b\u043e\u043a\u0430\u0446\u0438\u0438 KV." },
      { en: "Read a continuous-batching trace: who finishes, who waits, who gets the next token.", ru: "\u0427\u0438\u0442\u0430\u0442\u044c \u0442\u0440\u0430\u0441\u0441\u0443 \u043d\u0435\u043f\u0440\u0435\u0440\u044b\u0432\u043d\u043e\u0433\u043e \u0431\u0430\u0442\u0447\u0438\u043d\u0433\u0430: \u043a\u0442\u043e \u0437\u0430\u0432\u0435\u0440\u0448\u0430\u0435\u0442\u0441\u044f, \u043a\u0442\u043e \u0436\u0434\u0451\u0442, \u043a\u0442\u043e \u043f\u043e\u043b\u0443\u0447\u0430\u0435\u0442 \u0441\u043b\u0435\u0434\u0443\u044e\u0449\u0438\u0439 \u0442\u043e\u043a\u0435\u043d." },
    ],
    model: [
      ["blocks per request", "ceil(L / B)", "tail waste", "blocks × B − L positions"],
      ["total allocation", "Σᵢ ceil(Lᵢ / B) × B", "one shared pool (wrong)", "ceil(Σᵢ Lᵢ / B) × B"],
      ["decode-only toy", "one decode step per tick, prefill = 0", "release", "finishing in [t, t+1) frees the slot at t+1"],
    ],
    scenario: null,
    quizzes: [
      {
        id: "q1",
        q: {
          en: "One request retains 17 positions, block size 16. How many physical blocks does it occupy?",
          ru: "Один запрос удерживает 17 позиций, размер блока 16. Сколько физических блоков он занимает?",
        },
        answer: 2, tol: 0.2, unit: { en: "blocks", ru: "блока" },
        hint: {
          en: "Round up: ceil(17 / 16) = 2 — the second block is only half used.",
          ru: "Округляй вверх: ceil(17 / 16) = 2 — второй блок занят лишь наполовину.",
        },
      },
      {
        id: "q2",
        q: {
          en: "Three independent requests retain 17, 31 and 33 positions; block size 16. How many tail positions are allocated but never used, in total?",
          ru: "Три независимых запроса удерживают 17, 31 и 33 позиции; размер блока 16. Сколько всего хвостовых позиций выделено, но не используется?",
        },
        answer: 31, tol: 0.2, unit: { en: "positions", ru: "позиции" },
        hint: {
          en: "Blocks: 2 + 2 + 3 = 7, capacity 7 × 16 = 112; live 17 + 31 + 33 = 81; waste = 112 − 81 = 31. One ceil over the sum would give 6 blocks and hide the tails.",
          ru: "Блоки: 2 + 2 + 3 = 7, ёмкость 7 × 16 = 112; живых 17 + 31 + 33 = 81; waste = 112 − 81 = 31. Один ceil по сумме дал бы 6 блоков и спрятал хвосты.",
        },
      },
      {
        id: "q3",
        q: {
          en: "Decode-only toy, 2 slots, continuous batching: A needs 5 ticks, B and C need 1 each; A, B, C arrive at tick 0 in FIFO order. B works during [0, 1) and C takes its freed slot. At which tick boundary is C complete?",
          ru: "Decode-only игрушка, 2 слота, continuous-батчинг: A нужно 5 тиков, B и C — по 1; A, B, C пришли в тик 0 в порядке FIFO. B работает в [0, 1), C занимает её освободившийся слот. На какой границе тиков C завершается?",
        },
        answer: 2, tol: 0.2, unit: { en: "tick", ru: "тик" },
        hint: {
          en: "C is admitted at tick 1, works during [1, 2); completion is recorded at the next boundary: tick 2. Static mode would keep C waiting until the whole cohort empties.",
          ru: "C подсаживается в тик 1, работает в [1, 2); завершение фиксируется на следующей границе: тик 2. Static-режим держал бы C до опустошения всей когорты.",
        },
      },
    ],
    exercises: [
      {
        id: "ex1",
        title: { en: "Exercise 1 · Blocks per request", ru: "Упражнение 1 · Блоки на запрос" },
        brief: {
          en: "Implement <code>blocks_needed(length, block_size)</code> — physical blocks for one request: <code>ceil(L / B)</code>. Always round <strong>up</strong>: an exact multiple still needs one block per B positions, and a length of 0 needs none. Use integer ceiling division so the result stays exact.",
          ru: "Реализуй <code>blocks_needed(length, block_size)</code> — физические блоки для одного запроса: <code>ceil(L / B)</code>. Округляй всегда <strong>вверх</strong>: точное кратное всё равно занимает один блок на каждые B позиций, а нулевая длина не занимает ни одного. Используй целочисленное деление с округлением вверх, чтобы результат был точным.",
        },
        starter: `def blocks_needed(length, block_size):
    """Physical blocks for one request retaining 'length' positions."""
    # TODO: one line of integer ceiling division
`,
        tests: [
          { name: "17 tokens on block 16", hidden: false, code: "eq(blocks_needed(17, 16), 2)" },
          { name: "exact multiple", hidden: false, code: "eq(blocks_needed(16, 16), 1)" },
          { name: "zero length uses no blocks", hidden: true, code: "eq(blocks_needed(0, 16), 0)" },
          { name: "33 on block 32", hidden: true, code: "eq(blocks_needed(33, 32), 2)" },
        ],
        solution: `def blocks_needed(length, block_size):
    return (length + block_size - 1) // block_size`,
        hints: [
          { en: "The integer ceiling trick: (L + B − 1) // B. No floats needed.", ru: "Целочисленный трюк: (L + B − 1) // B. Дроби не нужны." },
        ],
        numpy: false,
        timeoutMs: 4000,
      },
      {
        id: "ex2",
        title: { en: "Exercise 2 · Block tail waste", ru: "Упражнение 2 · Пустые хвосты блоков" },
        brief: {
          en: "Implement <code>block_waste(lengths, block_size)</code> — total tail positions allocated but never used when every request gets its own blocks: round <strong>each</strong> length up independently, capacity = <code>blocks × B</code>, waste = capacity − live positions. Notebook fixture: [17, 31, 33] on block 16 occupies 7 blocks = 112 slots, 81 are live — waste is exactly 31 positions.",
          ru: "Реализуй <code>block_waste(lengths, block_size)</code> — сколько хвостовых позиций выделено, но не используется, когда каждый запрос получает свои блоки: округляй <strong>каждую</strong> длину вверх независимо, ёмкость = <code>blocks × B</code>, waste = ёмкость − живые позиции. Фикстура тетради: [17, 31, 33] при блоке 16 занимает 7 блоков = 112 слотов, живых 81 — waste ровно 31 позиция.",
        },
        starter: `def block_waste(lengths, block_size):
    """Total unused tail positions; requests do not share blocks."""
    # TODO: round every length up independently, then capacity - live
`,
        tests: [
          { name: "notebook fixture 17/31/33", hidden: false, code: "eq(block_waste([17, 31, 33], 16), 31)" },
          { name: "block 8, 15/16/17", hidden: false, code: "eq(block_waste([15, 16, 17], 8), 8)" },
          { name: "empty request list", hidden: true, code: "eq(block_waste([], 16), 0)" },
          { name: "single request", hidden: true, code: "eq(block_waste([17], 16), 15)" },
        ],
        solution: `def block_waste(lengths, block_size):
    blocks = sum((L + block_size - 1) // block_size for L in lengths)
    return blocks * block_size - sum(lengths)`,
        hints: [
          { en: "7 blocks of 16 hold 112 positions but only 81 are live: waste = 112 − 81 = 31 (tails 15 + 1 + 15). Rounding the sum once would give 6 blocks — the wrong tails.", ru: "7 блоков по 16 вмещают 112 позиций, но живых только 81: waste = 112 − 81 = 31 (хвосты 15 + 1 + 15). Одно округление по сумме дало бы 6 блоков — не те хвосты." },
        ],
        numpy: false,
        timeoutMs: 4000,
      },
      {
        id: "ex3",
        title: { en: "Exercise 3 · Fix the bug: one pool is not a block table", ru: "Упражнение 3 · Почини баг: общий пул — не block table" },
        brief: {
          en: "This <code>allocated_positions(lengths, block_size)</code> undercounts: it rounds the <strong>summed</strong> length once — one shared pool — but requests do not share blocks, so each request's tail is reserved separately (notebook A2: why can <code>ceil(sum / 16)</code> not represent separate block tables?). Fix it to return <code>Σᵢ ceil(Lᵢ / B) × B</code>. On the fixture [17, 31, 33] it must give 112, not 96 — and every downstream waste figure inherits the error.",
          ru: "Эта <code>allocated_positions(lengths, block_size)</code> занижает: она округляет <strong>сумму</strong> длин один раз — как один общий пул, — но запросы не делят блоки, и хвост каждого запроса резервируется отдельно (вопрос тетради A2: почему <code>ceil(sum / 16)</code> не может изображать отдельные block tables?). Почини до <code>Σᵢ ceil(Lᵢ / B) × B</code>. На фикстуре [17, 31, 33] должно быть 112, а не 96 — и вся дальнейшая арифметика waste наследует эту ошибку.",
        },
        starter: `def allocated_positions(lengths, block_size):
    """Total block-slot capacity reserved for independently allocated requests."""
    # BUG: one global ceil over the summed length - a shared pool.
    # Real block tables round EACH request up; requests do not share blocks.
    total = sum(lengths)
    return -(-total // block_size) * block_size
`,
        tests: [
          { name: "fixture 17/31/33 on block 16", hidden: false, code: "eq(allocated_positions([17, 31, 33], 16), 112)" },
          { name: "block 8, 15/16/17", hidden: false, code: "eq(allocated_positions([15, 16, 17], 8), 56)" },
          { name: "two short requests cannot merge", hidden: true, code: "eq(allocated_positions([15, 1], 16), 32)" },
          { name: "empty plan", hidden: true, code: "eq(allocated_positions([], 16), 0)" },
        ],
        solution: `def allocated_positions(lengths, block_size):
    return sum((L + block_size - 1) // block_size for L in lengths) * block_size`,
        hints: [
          { en: "The bug's 96 hides 16 wasted slots: the shared pool merges three tails into one. Round per request, then multiply by the block size.", ru: "В ошибочных 96 спрятаны 16 потерянных слотов: общий пул склеил три хвоста в один. Округляй по каждому запросу, затем умножай на размер блока." },
        ],
        numpy: false,
        timeoutMs: 4000,
      },
    {
        id: "ex4",
        title: { en: "Exercise 4 · Finish the trace", ru: "Упражнение 4 · Дочитай трассу" },
        brief: {
          en: "Implement <code>finish_ticks(work, slots)</code> — the finish boundary tick of each request (FIFO, all arrive at tick 0, unit ticks, continuous batching): each request starts as soon as a slot is free and finishes at <code>start + work</code>. Notebook toy: [5, 1, 1] on 2 slots → [5, 1, 2] — B frees the slot at 1, C takes it immediately.",
          ru: "Реализуй <code>finish_ticks(work, slots)</code> — границу завершения каждого запроса (FIFO, все пришли в тик 0, единичные тики, continuous-батчинг): запрос стартует, как только освободился слот, и завершается в <code>start + work</code>. Игрушка тетради: [5, 1, 1] на 2 слотах → [5, 1, 2] — B освобождает слот в тик 1, C занимает его сразу.",
        },
        starter: `def finish_ticks(work, slots):
    """Finish boundary tick per request; FIFO, continuous batching, unit ticks."""
    # TODO: slot_free per slot; take the earliest free, finish at start + work
`,
        tests: [
          { name: "notebook toy", hidden: false, code: "eq(finish_ticks([5, 1, 1], 2), [5, 1, 2])" },
          { name: "no contention", hidden: false, code: "eq(finish_ticks([5, 1, 1], 3), [5, 1, 1])" },
          { name: "equal work, round-robin slots", hidden: true, code: "eq(finish_ticks([2, 2, 2], 2), [2, 2, 4])" },
          { name: "single slot serialises", hidden: true, code: "eq(finish_ticks([1, 3], 1), [1, 4])" },
        ],
        solution: `def finish_ticks(work, slots):
    slot_free = [0] * slots
    finishes = []
    for w in work:
        t = min(slot_free)
        i = slot_free.index(t)
        finishes.append(t + w)
        slot_free[i] = t + w
    return finishes`,
        hints: [
          { en: "Keep slot_free[slots]; each request takes the earliest-free slot, not slot 0.", ru: "Держи slot_free[slots]; каждый запрос берёт самый ранний свободный слот, а не слот 0." },
        ],
        numpy: false,
        timeoutMs: 4000,
      },
    ],
    posttest: [
      {
        id: "p1",
        q: { en: "A request holds 17 positions, block size 16. How many physical blocks does it occupy?", ru: "\u0417\u0430\u043f\u0440\u043e\u0441 \u0434\u0435\u0440\u0436\u0438\u0442 17 \u043f\u043e\u0437\u0438\u0446\u0438\u0439, \u0440\u0430\u0437\u043c\u0435\u0440 \u0431\u043b\u043e\u043a\u0430 16. \u0421\u043a\u043e\u043b\u044c\u043a\u043e \u0444\u0438\u0437\u0438\u0447\u0435\u0441\u043a\u0438\u0445 \u0431\u043b\u043e\u043a\u043e\u0432 \u043e\u043d \u0437\u0430\u043d\u0438\u043c\u0430\u0435\u0442?" },
        options: [{ en: "1", ru: "1" }, { en: "2", ru: "2" }, { en: "17", ru: "17" }],
        answer: 1,
        explain: { en: "blocks = ceil(17 / 16) = 2: the second block is a tail that is paid in full.", ru: "blocks = ceil(17 / 16) = 2: \u0432\u0442\u043e\u0440\u043e\u0439 \u0431\u043b\u043e\u043a \u2014 \u0445\u0432\u043e\u0441\u0442, \u043e\u043f\u043b\u0430\u0447\u0438\u0432\u0430\u0435\u043c\u044b\u0439 \u0446\u0435\u043b\u0438\u043a\u043e\u043c." },
      },
      {
        id: "p2",
        q: { en: "Block tail waste for lengths [17, 31, 33] with block 16 is\u2026", ru: "\u0425\u0432\u043e\u0441\u0442\u043e\u0432\u044b\u0435 \u043e\u0442\u0445\u043e\u0434\u044b \u0434\u043b\u044f \u0434\u043b\u0438\u043d [17, 31, 33] \u043f\u0440\u0438 \u0431\u043b\u043e\u043a\u0435 16 \u2014 \u044d\u0442\u043e\u2026" },
        options: [{ en: "allocated 112 \u2212 used 81 = 31", ru: "\u0432\u044b\u0434\u0435\u043b\u0435\u043d\u043e 112 \u2212 \u0436\u0438\u0432\u044b\u0445 81 = 31" }, { en: "0 \u2014 tails are shared", ru: "0 \u2014 \u0445\u0432\u043e\u0441\u0442\u044b \u0448\u0430\u0440\u044f\u0442\u0441\u044f" }, { en: "112", ru: "112" }],
        answer: 0,
        explain: { en: "\u03a3 ceil(L/16)\u00d716 = 112 slots for 81 live tokens: 31 slots are paid tails, never used.", ru: "\u03a3 ceil(L/16)\u00d716 = 112 \u0441\u043b\u043e\u0442\u043e\u0432 \u043d\u0430 81 \u0436\u0438\u0432\u043e\u0439 \u0442\u043e\u043a\u0435\u043d: 31 \u0441\u043b\u043e\u0442 \u2014 \u043f\u043b\u0430\u0442\u043d\u044b\u0435 \u0445\u0432\u043e\u0441\u0442\u044b \u0431\u0435\u0437 \u0438\u0441\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u043d\u0438\u044f." },
      },
      {
        id: "p3",
        q: { en: "In continuous batching, a slot frees the moment a request finishes. The next token goes to\u2026", ru: "\u0412 \u043d\u0435\u043f\u0440\u0435\u0440\u044b\u0432\u043d\u043e\u043c \u0431\u0430\u0442\u0447\u0438\u043d\u0433\u0435 \u0441\u043b\u043e\u0442 \u043e\u0441\u0432\u043e\u0431\u043e\u0436\u0434\u0430\u0435\u0442\u0441\u044f \u0432 \u043c\u043e\u043c\u0435\u043d\u0442 \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043d\u0438\u044f \u0437\u0430\u043f\u0440\u043e\u0441\u0430. \u0421\u043b\u0435\u0434\u0443\u044e\u0449\u0438\u0439 \u0442\u043e\u043a\u0435\u043d \u0434\u043e\u0441\u0442\u0430\u0451\u0442\u0441\u044f\u2026" },
        options: [{ en: "the waiting request, from the next step", ru: "\u0436\u0434\u0443\u0449\u0435\u043c\u0443 \u0437\u0430\u043f\u0440\u043e\u0441\u0443, \u043d\u0430\u0447\u0438\u043d\u0430\u044f \u0441\u043e \u0441\u043b\u0435\u0434\u0443\u044e\u0449\u0435\u0433\u043e \u0448\u0430\u0433\u0430" }, { en: "nobody until the whole batch finishes", ru: "\u043d\u0438\u043a\u043e\u043c\u0443, \u043f\u043e\u043a\u0430 \u043d\u0435 \u0437\u0430\u0432\u0435\u0440\u0448\u0438\u0442\u0441\u044f \u0432\u0435\u0441\u044c \u0431\u0430\u0442\u0447" }, { en: "the longest request", ru: "\u0441\u0430\u043c\u043e\u043c\u0443 \u0434\u043b\u0438\u043d\u043d\u043e\u043c\u0443 \u0437\u0430\u043f\u0440\u043e\u0441\u0443" }],
        answer: 0,
        explain: { en: "That is the whole point of continuous batching: the finished request's slot is reused on the next step \u2014 no batch-boundary waiting.", ru: "\u0412 \u044d\u0442\u043e\u043c \u0441\u043c\u044b\u0441\u043b \u043d\u0435\u043f\u0440\u0435\u0440\u044b\u0432\u043d\u043e\u0433\u043e \u0431\u0430\u0442\u0447\u0438\u043d\u0433\u0430: \u0441\u043b\u043e\u0442 \u0437\u0430\u0432\u0435\u0440\u0448\u0438\u0432\u0448\u0435\u0433\u043e\u0441\u044f \u0437\u0430\u043f\u0440\u043e\u0441\u0430 \u043f\u0435\u0440\u0435\u0438\u0441\u043f\u043e\u043b\u044c\u0437\u0443\u0435\u0442\u0441\u044f \u043d\u0430 \u0441\u043b\u0435\u0434\u0443\u044e\u0449\u0435\u043c \u0448\u0430\u0433\u0435 \u2014 \u0431\u0435\u0437 \u043e\u0436\u0438\u0434\u0430\u043d\u0438\u044f \u0433\u0440\u0430\u043d\u0438\u0446 \u0431\u0430\u0442\u0447\u0430." },
      },
    ],
    reward: {
      caption: { en: "Block tails, admissions and the short-request race \u2014 you run the allocator now.", ru: "\u0411\u043b\u043e\u0447\u043d\u044b\u0435 \u0445\u0432\u043e\u0441\u0442\u044b, \u0434\u043e\u043f\u0443\u0441\u043a\u0438 \u0438 \u0433\u043e\u043d\u043a\u0430 \u043a\u043e\u0440\u043e\u0442\u043a\u043e\u0433\u043e \u0437\u0430\u043f\u0440\u043e\u0441\u0430 \u2014 \u0430\u043b\u043b\u043e\u043a\u0430\u0442\u043e\u0440 \u0442\u0435\u043f\u0435\u0440\u044c \u043f\u043e\u0434 \u0442\u0432\u043e\u0438\u043c \u0443\u043f\u0440\u0430\u0432\u043b\u0435\u043d\u0438\u0435\u043c." },
    },
    footer: {
      en: "Teaching arithmetic on a declared model — not a GPU measurement. The completion traces come from the decode-only CPU toy in the Topic 05 notebook (equal-cost ticks, prefill = 0), the same play the notebook rehearses before any real run; the notebook's pipeline-vs-vLLM burst comparison is a separate owner-run evidence step and is not executed by this lab.",
      ru: "Учебная арифметика по заявленной модели — не измерение GPU. Трассировки завершения взяты из decode-only CPU-игрушки тетради Темы 05 (равноценные тики, prefill = 0) — тот же play, который тетрадь репетирует до любого реального прогона; сравнение pipeline-vs-vLLM из тетради — отдельный evidence-шаг и этой лабой не исполняется.",
    },
  };
})();
