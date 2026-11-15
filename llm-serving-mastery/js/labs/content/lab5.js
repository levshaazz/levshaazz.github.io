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
    model: [
      ["blocks per request", "ceil(L / B)", "tail waste", "blocks × B − L positions"],
      ["total allocation", "Σᵢ ceil(Lᵢ / B) × B", "one shared pool (wrong)", "ceil(Σᵢ Lᵢ / B) × B"],
      ["KV bytes per position", "2 × layers × kv_heads × head_width × bytes", "Qwen toy (24 / 2 / 64 / fp16)", "12288 B = 12 KiB"],
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
