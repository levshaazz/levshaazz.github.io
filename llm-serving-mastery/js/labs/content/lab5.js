/* Lab 05 — PagedAttention and batching.
   Content module for the generic lab page (window.LABS_CONTENT['5']).
   Deterministic declared model from the Topic 05 notebook's decode-only CPU toy;
   real Python tests run in the browser sandbox. Practice, not evidence. */
(function () {
  "use strict";
  window.LABS_CONTENT = window.LABS_CONTENT || {};

  LABS_CONTENT["5"] = {
    budget: 45,
    title: {
      en: "PagedAttention and batching",
      ru: "PagedAttention и батчинг",
    },
    sub: {
      en: "Round every request up to whole blocks, account the tail waste, then read a decode-only trace to see who finishes first.",
      ru: "Округли длину каждого запроса до целых блоков, посчитай пустые хвосты и прочитай decode-only трассу: кто завершится первым.",
    },
    intro: {
      en: `<p>PagedAttention splits each request's KV cache into physical blocks of <strong>B</strong> positions. A request retaining <strong>L</strong> positions occupies <strong>ceil(L / B)</strong> blocks, and the last block is usually half empty: the tail is allocated but never used. Requests do not share blocks, so the total reserved capacity is <strong>Σ ceil(Lᵢ / B) × B</strong> — not <code>ceil(ΣLᵢ / B) × B</code>: one shared pool undercounts by the extra tails. In the notebook fixture [17, 31, 33] on block 16 that is 2 + 2 + 3 = 7 blocks, not ceil(81 / 16) = 6.</p>
<p>Iteration-level (continuous) batching refills a freed slot at the next tick: a short request that finishes before its cohort immediately opens a slot for the next queued one. In the notebook toy (2 slots; A needs 5 ticks, B and C need 1; all arrive at tick 0) B completes at boundary tick 1, C is admitted at tick 1 and completes at tick 2 — while static mode would hold the whole cohort until it empties. The lab habit: read the trace by hand first, then let the tests check it; ticks are invented units, never GPU seconds.</p>`,
      ru: `<p>PagedAttention режет KV-кэш каждого запроса на физические блоки по <strong>B</strong> позиций. Запрос с <strong>L</strong> удержанными позициями занимает <strong>ceil(L / B)</strong> блоков, и последний блок обычно пуст наполовину: хвост выделен, но не используется. Запросы не делят блоки между собой, поэтому полная выделенная ёмкость — <strong>Σ ceil(Lᵢ / B) × B</strong>, а не <code>ceil(ΣLᵢ / B) × B</code>: один общий пул занижает счёт на лишние хвосты. В фикстуре тетради [17, 31, 33] при блоке 16 это 2 + 2 + 3 = 7 блоков, а не ceil(81 / 16) = 6.</p>
<p>Непрерывный (continuous) батчинг подсаживает новый запрос в освободившийся слот на следующем тике: короткий запрос, завершившись раньше когорты, сразу открывает место следующему. В игрушке тетради (2 слота; A нужно 5 тиков, B и C — по 1; все пришли в тик 0) B завершается на границе тика 1, C стартует в тик 1 и завершается в тик 2, тогда как static-режим держал бы всю когорту до опустошения. Привычка лабы: сначала прочитай трассу руками, потом дай тестам проверить; тики — придуманные единицы, а не секунды GPU.</p>`,
    },
    heroTag: { en: "paging, batching, the knee", ru: "пейджинг, батчинг, колено" },
    glossary: [
      [{ en: "PagedAttention", ru: "PagedAttention" }, { en: "splitting each request's KV cache into physical blocks of B positions, so memory is reserved per block, not per request promise.", ru: "нарезка KV-кэша каждого запроса на физические блоки по B позиций: память резервируется по блокам, а не по обещаниям запроса." }],
      [{ en: "block", ru: "блок" }, { en: "the physical unit of KV memory: a request retaining L positions occupies ceil(L / B) whole blocks.", ru: "физическая единица KV-памяти: запрос с L удержанными позициями занимает ceil(L / B) целых блоков." }],
      [{ en: "block table", ru: "block table" }, { en: "the per-request list of its blocks; it is why requests never share blocks and tails never merge.", ru: "список блоков у каждого запроса свой; именно поэтому запросы не делят блоки, а хвосты не сливаются." }],
      [{ en: "tail waste", ru: "хвостовые отходы" }, { en: "positions of the last block that are allocated but never used: blocks × B − L per request.", ru: "позиции последнего блока, которые выделены, но не используются: blocks × B − L на запрос." }],
      [{ en: "slot", ru: "слот" }, { en: "one place in the running batch; in the toy a slot is busy exactly while its request still owes ticks.", ru: "одно место в работающем батче; в игрушке слот занят ровно пока его запрос должен тики." }],
      [{ en: "tick", ru: "тик" }, { en: "the invented unit of decode work: one decode step per tick, prefill = 0; ticks are never GPU seconds.", ru: "придуманная единица decode-работы: один decode-шаг за тик, prefill = 0; тики — никогда секунды GPU." }],
      [{ en: "continuous batching", ru: "непрерывный батчинг" }, { en: "refilling a freed slot at the next tick boundary, so a short request immediately opens a place for the next queued one.", ru: "подсадка нового запроса в освободившийся слот на следующей границе тиков: короткий запрос сразу открывает место следующему из очереди." }],
      [{ en: "static batching", ru: "static-батчинг" }, { en: "holding the whole cohort until it empties; the freed slot idles instead of taking the next request — the lab's contrast case.", ru: "удержание всей когорты до её опустошения; освободившийся слот простаивает вместо того, чтобы взять следующий запрос, — контрастный случай лабы." }],
      [{ en: "queue", ru: "очередь" }, { en: "requests waiting for a slot; in the base toy (2 slots, three unit requests) C waits exactly one boundary.", ru: "запросы, ждущие слот; в базовой игрушке (2 слота, три единичных запроса) C ждёт ровно одну границу." }],
      [{ en: "FIFO", ru: "FIFO" }, { en: "first in, first out: the admission order the toy uses; disputes over a freed slot go to the earlier request.", ru: "первым пришёл — первым ушёл: порядок допуска в игрушке; спор за освободившийся слот выигрывает более ранний запрос." }],
    ],
    figures: [
      {
        id: "lab5-pages",
        title: { en: "Pages of 16: the tails you pay for", ru: "Блоки по 16: хвосты, за которые платишь" },
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
    <text x="460" y="288" font-size="13" fill="var(--lab-muted)" data-en="requests never share blocks" data-ru="запросы никогда не делят блоки">requests never share blocks</text>
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
    <text x="60" y="80" font-size="14" fill="var(--lab-muted)" data-en="2 slots; A needs 5 ticks, B and C need 1; all arrive at tick 0" data-ru="2 слота; A нужно 5 тиков, B и C — по 1; все пришли в тик 0">2 slots; A needs 5 ticks, B and C need 1; all arrive at tick 0</text>
    <rect x="60" y="96" width="46" height="30" rx="6" fill="none" stroke="var(--lab-accent)" stroke-width="1.5"/>
    <text x="83" y="116" text-anchor="middle" font-size="14" fill="var(--lab-accent)" class="mono">A·5</text>
    <rect x="114" y="96" width="46" height="30" rx="6" fill="none" stroke="var(--lab-accent)" stroke-width="1.5"/>
    <text x="137" y="116" text-anchor="middle" font-size="14" fill="var(--lab-accent)" class="mono">B·1</text>
    <rect x="168" y="96" width="46" height="30" rx="6" fill="none" stroke="var(--lab-accent)" stroke-width="1.5"/>
    <text x="191" y="116" text-anchor="middle" font-size="14" fill="var(--lab-accent)" class="mono">C·1</text>
  </g>
  <g id="g-t0">
    <text x="60" y="168" font-size="15" fill="var(--lab-ink)" class="mono" data-en="slot 1" data-ru="слот 1">slot 1</text>
    <rect x="150" y="150" width="450" height="26" rx="6" fill="var(--lab-accent)" opacity="0.85"/>
    <text x="160" y="168" font-size="13" fill="var(--lab-bg)" class="mono">A</text>
    <text x="60" y="204" font-size="15" fill="var(--lab-ink)" class="mono" data-en="slot 2" data-ru="слот 2">slot 2</text>
    <rect x="150" y="186" width="90" height="26" rx="6" fill="var(--lab-accent)" opacity="0.55"/>
    <text x="160" y="204" font-size="13" fill="var(--lab-bg)" class="mono">B</text>
  </g>
  <g id="g-t1">
    <line x1="240" y1="146" x2="240" y2="216" stroke="var(--lab-muted)" stroke-width="1.5" stroke-dasharray="5 4"/>
    <text x="246" y="142" font-size="12" fill="var(--lab-muted)" class="mono" data-en="boundary of tick 1: B done" data-ru="граница тика 1: B завершён">boundary of tick 1: B done</text>
    <rect x="240" y="186" width="90" height="26" rx="6" fill="var(--lab-good)" opacity="0.7"/>
    <text x="246" y="204" font-size="13" fill="var(--lab-bg)" class="mono">C</text>
    <text x="480" y="204" font-size="13" fill="var(--lab-good)" data-en="C takes the freed slot" data-ru="C занимает свободный слот">C takes the freed slot</text>
  </g>
  <g id="g-marks">
    <text x="60" y="300" font-size="15" fill="var(--lab-ink)" data-en="finish marks:" data-ru="отметки завершения:">finish marks:</text>
    <text x="230" y="300" font-size="15" fill="var(--lab-ink)" class="mono">B → 1</text>
    <text x="310" y="300" font-size="15" fill="var(--lab-ink)" class="mono">C → 2</text>
    <text x="390" y="300" font-size="15" fill="var(--lab-ink)" class="mono">A → 5</text>
    <line x1="150" y1="316" x2="600" y2="316" stroke="var(--lab-muted)" stroke-width="1"/>
    <circle cx="240" cy="316" r="5" fill="var(--fig-warm)"/>
    <circle cx="330" cy="316" r="5" fill="var(--lab-good)"/>
    <circle cx="600" cy="316" r="5" fill="var(--lab-accent)"/>
    <text x="640" y="321" font-size="13" fill="var(--lab-muted)" class="mono" data-en="tick" data-ru="тик">tick</text>
  </g>
  <g id="g-static">
    <text x="380" y="362" text-anchor="middle" font-size="16" fill="var(--fig-warm)" data-en="static batching: C would start only at tick 5 → finish at 6" data-ru="static-батчинг: C стартовал бы только в тик 5 → финал на 6">static batching: C would start only at tick 5 → finish at 6</text>
    <text x="380" y="388" text-anchor="middle" font-size="14" fill="var(--lab-good)" data-en="continuous: C finished at 2" data-ru="continuous: C завершился на 2">continuous: C finished at 2</text>
  </g>
</svg>`,
        stages: [
          { cap: { en: "Two slots; A needs 5 ticks, B and C need 1 each.", ru: "Два слота; A нужно 5 тиков, B и C — по одному." }, show: ["g-queue"] },
          { cap: { en: "Tick 0: A and B take the slots.", ru: "Тик 0: A и B занимают слоты." }, show: ["g-queue", "g-t0"] },
          { cap: { en: "Tick 1: B finishes — C takes the freed slot.", ru: "Тик 1: B завершается — C встаёт в освободившийся слот на границе." }, show: ["g-queue", "g-t0", "g-t1"] },
          { cap: { en: "Finish marks: B at 1, C at 2, A at 5.", ru: "Отметки: B на 1, C на 2, A на 5." }, show: ["g-queue", "g-t0", "g-t1", "g-marks"] },
          { cap: { en: "Static idles the slot: C would finish at 6, not 2.", ru: "Static-режим простаивает слот: C завершился бы на 6, не на 2." }, show: ["g-queue", "g-t0", "g-t1", "g-marks", "g-static"] },
        ],
      },
    ],
    outcomes: [
      { en: "Compute blocks, tails and waste for paged KV allocation.", ru: "\u0421\u0447\u0438\u0442\u0430\u0442\u044c \u0431\u043b\u043e\u043a\u0438, \u0445\u0432\u043e\u0441\u0442\u044b \u0438\u00a0\u043e\u0442\u0445\u043e\u0434\u044b \u043f\u0440\u0438 paged-\u0430\u043b\u043b\u043e\u043a\u0430\u0446\u0438\u0438 KV." },
      { en: "Read a continuous-batching trace: who finishes, who waits, who gets the next token.", ru: "\u0427\u0438\u0442\u0430\u0442\u044c \u0442\u0440\u0430\u0441\u0441\u0443 \u043d\u0435\u043f\u0440\u0435\u0440\u044b\u0432\u043d\u043e\u0433\u043e \u0431\u0430\u0442\u0447\u0438\u043d\u0433\u0430: \u043a\u0442\u043e \u0437\u0430\u0432\u0435\u0440\u0448\u0430\u0435\u0442\u0441\u044f, \u043a\u0442\u043e \u0436\u0434\u0451\u0442, \u043a\u0442\u043e \u043f\u043e\u043b\u0443\u0447\u0430\u0435\u0442 \u0441\u043b\u0435\u0434\u0443\u044e\u0449\u0438\u0439 \u0442\u043e\u043a\u0435\u043d." },
    ],
    model: [
      ["blocks per request", "ceil(L / B)", "tail waste", "blocks × B − L positions"],
      ["total allocation", "Σᵢ ceil(Lᵢ / B) × B", "one shared pool (wrong)", "ceil(Σᵢ Lᵢ / B) × B"],
      ["decode-only toy", "one decode step per tick, prefill = 0", "release", "finishing in [t, t+1) frees the slot at t+1"],
    ],
    scenario: null,
    parsons: [
      {
        id: "ps1",
        title: { en: "Exercise · Assemble the continuous batching cycle", ru: "Упражнение · Собери цикл continuous batching" },
        brief: { en: "The mechanic of this lab in five steps — order them; two steps are decoys that break the mechanism.", ru: "Механика этой лабы в пяти шагах — расставь по порядку; два шага — ловушки, ломающие механизм." },
        pool: [
          { en: "The engine restarts to admit each new request", ru: "Движок перезапускается, чтобы впустить каждый новый запрос" },
          { en: "Finished sequences free their KV blocks", ru: "Завершившиеся последовательности освобождают KV-блоки" },
          { en: "A new request enters the waiting queue", ru: "Новый запрос попадает в очередь ожидания" },
          { en: "One forward pass moves every batched sequence one token forward", ru: "Один forward-проход двигает каждую последовательность батча на один токен" },
          { en: "The scheduler packs the active sequences into a step batch", ru: "Планировщик собирает активные последовательности в батч шага" },
          { en: "Freed seats take the next waiting requests — no engine restart", ru: "Освободившиеся места занимает следующая очередь — без рестарта движка" },
          { en: "The KV cache is wiped between batch steps", ru: "KV-кэш сбрасывается между шагами батча" },
        ],
        solution: [2, 4, 3, 1, 5],
      },
    ],
    quizzes: [
      {
        id: "q1",
        q: {
          en: "One request retains 17 positions, block size 16. How many physical blocks does it occupy?",
          ru: "Один запрос удерживает 17 позиций, размер блока 16. Сколько физических блоков он занимает?",
        },
        answer: 2, tol: 0.2, unit: { en: "blocks", ru: "блока" },
        hint: {
          en: "Round up: ceil(17 / 16) — only one of the second block's 16 positions is used.",
          ru: "Округляй вверх: ceil(17 / 16) — второй блок занят лишь одной позицией из 16.",
        },
        followUp: {
          q: { en: "Why must the allocation round UP instead of just 17 / 16 ≈ 1.06?", ru: "Почему аллокация округляет ВВЕРХ, а не берёт 17 / 16 ≈ 1.06?" },
          options: [
            { en: "A block is a physical unit: the leftover position still needs a whole second block, so the 15 empty slots are paid in full", ru: "Блок — физическая единица: оставшаяся позиция всё равно требует целый второй блок, поэтому 15 пустых слотов оплачиваются целиком" },
            { en: "Fractions of blocks are stored in the metadata, so 1.06 is exact", ru: "Доли блоков хранятся в метаданных, поэтому 1.06 — точное значение" },
            { en: "Rounding up compensates for fragmentation elsewhere in the pool", ru: "Округление вверх компенсирует фрагментацию в других местах пула" },
          ],
          answer: 0,
          explain: { en: "Blocks are allocated whole — that is what «paged» means. The 15 unused positions of the second block are the tail waste the whole lab accounts for.", ru: "Блоки выделяются целиком — именно это значит «paged». 15 неиспользуемых позиций второго блока — тот хвостовой waste, который считает вся лаба." },
        },
        // Вариативность №5: длина запроса и блок разведены с фигурных (17 и 16 — база);
        // blocks = ceil(L / B):  85/24 → ceil(3.54) = 4;  185/24 → ceil(7.71) = 8.
        // tol 0.1: ловушка «ввести дробь» (3.54 / 7.71) на расстоянии 0.46 / 0.29 — больше 2×tol.
        variants: [
          {
            q: {
              en: "One request retains 17 positions, block size 16. How many physical blocks does it occupy?",
              ru: "Один запрос удерживает 17 позиций, размер блока 16. Сколько физических блоков он занимает?",
            },
            answer: 2, tol: 0.2,
          },
          {
            q: {
              en: "One request retains 85 positions, block size 24. How many physical blocks does it occupy?",
              ru: "Один запрос удерживает 85 позиций, размер блока 24. Сколько физических блоков он занимает?",
            },
            answer: 4, tol: 0.1,
            hint: {
              en: "Round UP with the ceiling: ceil(L / B) — the leftover positions still pay for one whole extra block.",
              ru: "Округляй ВВЕРХ с потолком: ceil(L / B) — оставшиеся позиции всё равно оплачивают целый лишний блок.",
            },
            followUp: {
              q: { en: "Why must the allocation round UP instead of just 85 / 24 ≈ 3.54?", ru: "Почему аллокация округляет ВВЕРХ, а не берёт 85 / 24 ≈ 3.54?" },
              options: [
                { en: "A block is a physical unit: the 13 leftover positions still need a whole fourth block, so the empty slots are paid in full", ru: "Блок — физическая единица: 13 оставшихся позиций всё равно требуют целый четвёртый блок, поэтому пустые слоты оплачиваются целиком" },
                { en: "Fractions of blocks are stored in the metadata, so 3.54 is exact", ru: "Доли блоков хранятся в метаданных, поэтому 3.54 — точное значение" },
                { en: "Rounding up compensates for fragmentation elsewhere in the pool", ru: "Округление вверх компенсирует фрагментацию в других местах пула" },
              ],
              answer: 0,
              explain: { en: "Blocks are allocated whole — that is what «paged» means. The unused positions of the last block are the tail waste the whole lab accounts for.", ru: "Блоки выделяются целиком — именно это значит «paged». Неиспользуемые позиции последнего блока — тот хвостовой waste, который считает вся лаба." },
            },
          },
          {
            q: {
              en: "One request retains 185 positions, block size 24. How many physical blocks does it occupy?",
              ru: "Один запрос удерживает 185 позиций, размер блока 24. Сколько физических блоков он занимает?",
            },
            answer: 8, tol: 0.1,
            hint: {
              en: "Round UP with the ceiling: ceil(L / B) — never to the nearest.",
              ru: "Округляй ВВЕРХ с потолком: ceil(L / B) — никогда не к ближайшему.",
            },
            followUp: {
              q: { en: "Why must the allocation round UP instead of just 185 / 24 ≈ 7.71?", ru: "Почему аллокация округляет ВВЕРХ, а не берёт 185 / 24 ≈ 7.71?" },
              options: [
                { en: "A block is a physical unit: the 17 leftover positions still need a whole eighth block, so the empty slots are paid in full", ru: "Блок — физическая единица: 17 оставшихся позиций всё равно требуют целый восьмой блок, поэтому пустые слоты оплачиваются целиком" },
                { en: "Fractions of blocks are stored in the metadata, so 7.71 is exact", ru: "Доли блоков хранятся в метаданных, поэтому 7.71 — точное значение" },
                { en: "Rounding up compensates for fragmentation elsewhere in the pool", ru: "Округление вверх компенсирует фрагментацию в других местах пула" },
              ],
              answer: 0,
              explain: { en: "Blocks are allocated whole — that is what «paged» means. The unused positions of the last block are the tail waste the whole lab accounts for.", ru: "Блоки выделяются целиком — именно это значит «paged». Неиспользуемые позиции последнего блока — тот хвостовой waste, который считает вся лаба." },
            },
          },
        ],
      },
      {
        id: "q2",
        q: {
          en: "Three independent requests retain 17, 31 and 33 positions; block size 16. How many tail positions are allocated but never used, in total?",
          ru: "Три независимых запроса удерживают 17, 31 и 33 позиции; размер блока 16. Сколько всего хвостовых позиций выделено, но не используется?",
        },
        answer: 31, tol: 0.2, unit: { en: "positions", ru: "позиция" },
        hint: {
          en: "Blocks: 2 + 2 + 3 = 7, capacity 7 × 16 = 112; live 17 + 31 + 33 = 81; waste = 112 − 81. One ceil over the sum would give 6 blocks and hide the tails.",
          ru: "Блоки: 2 + 2 + 3 = 7, ёмкость 7 × 16 = 112; живых 17 + 31 + 33 = 81; waste = 112 − 81. Один ceil по сумме дал бы 6 блоков и спрятал хвосты.",
        },
        followUp: {
          q: { en: "Why can't the three tails merge into one shared tail?", ru: "Почему три хвоста не могут слиться в один общий?" },
          options: [
            { en: "Requests never share blocks: each block table is per-request, so every tail is reserved for its own request alone", ru: "Запросы никогда не делят блоки: block table у каждого свой, поэтому каждый хвост резервируется под свой запрос" },
            { en: "The scheduler merges tails at the next tick boundary", ru: "Scheduler сливает хвосты на следующей границе тиков" },
            { en: "Tails merge when the block size divides the total length", ru: "Хвосты сливаются, когда размер блока делит суммарную длину" },
          ],
          answer: 0,
          explain: { en: "The one-pool figure promises ceil(81/16) = 6 blocks precisely by merging tails that cannot merge: 7 real block tables hold 112 slots. The 16-slot gap is the undercount every downstream waste figure inherits.", ru: "Фигура «один пул» обещает ceil(81/16) = 6 блоков ровно тем, что склеивает несклеиваемые хвосты: 7 реальных block tables держат 112 слотов. Разница в 16 слотов — то занижение, которое наследует вся дальнейшая арифметика waste." },
        },
        // Вариативность №5: длины и блок — входы (31 базы живёт в фигуре хвостов);
        // waste = Σ ceil(Lᵢ/B) × B − Σ Lᵢ:
        //   [26, 26, 26] / 24 → 6 блоков, 144 − 78 = 66 (общий пул соврал бы 96 − 78 = 18);
        //   [49, 51] / 24 → 6 блоков, 144 − 100 = 44 (общий пул соврал бы 120 − 100 = 20).
        variants: [
          {
            q: {
              en: "Three independent requests retain 17, 31 and 33 positions; block size 16. How many tail positions are allocated but never used, in total?",
              ru: "Три независимых запроса удерживают 17, 31 и 33 позиции; размер блока 16. Сколько всего хвостовых позиций выделено, но не используется?",
            },
            answer: 31, tol: 0.2,
          },
          {
            q: {
              en: "Three independent requests retain 26, 26 and 26 positions; block size 24. How many tail positions are allocated but never used, in total?",
              ru: "Три независимых запроса удерживают 26, 26 и 26 позиций; размер блока 24. Сколько всего хвостовых позиций выделено, но не используется?",
            },
            answer: 66, tol: 0.2,
            hint: {
              en: "Blocks: ceil each length: 2 + 2 + 2 = 6, capacity 6 × 24 = 144; live 78; waste = capacity − live. One ceil over the sum would merge tails that cannot merge.",
              ru: "Блоки: ceil по каждой длине: 2 + 2 + 2 = 6, ёмкость 6 × 24 = 144; живых 78; waste = ёмкость − живые. Один ceil по сумме склеил бы несклеиваемые хвосты.",
            },
            followUp: {
              q: { en: "Why can't the three tails merge into one shared tail?", ru: "Почему три хвоста не могут слиться в один общий?" },
              options: [
                { en: "Requests never share blocks: each block table is per-request, so every tail is reserved for its own request alone", ru: "Запросы никогда не делят блоки: block table у каждого свой, поэтому каждый хвост резервируется под свой запрос" },
                { en: "The scheduler merges tails at the next tick boundary", ru: "Scheduler сливает хвосты на следующей границе тиков" },
                { en: "Tails merge when the block size divides the total length", ru: "Хвосты сливаются, когда размер блока делит суммарную длину" },
              ],
              answer: 0,
              explain: { en: "The one-pool shortcut promises ceil(78/24) = 4 blocks by merging tails that cannot merge: 6 real block tables hold 144 slots. The 48-slot gap is the undercount every downstream waste figure inherits.", ru: "Короткий путь «один пул» обещает ceil(78/24) = 4 блока ровно тем, что склеивает несклеиваемые хвосты: 6 реальных block tables держат 144 слота. Разница в 48 слотов — то занижение, которое наследует вся дальнейшая арифметика waste." },
            },
          },
          {
            q: {
              en: "Two independent requests retain 49 and 51 positions; block size 24. How many tail positions are allocated but never used, in total?",
              ru: "Два независимых запроса удерживают 49 и 51 позицию; размер блока 24. Сколько всего хвостовых позиций выделено, но не используется?",
            },
            answer: 44, tol: 0.2,
            hint: {
              en: "Blocks: 3 + 3 = 6, each block holds 24 slots; live 100; waste = capacity − live. One ceil over the sum would give 5 blocks and hide the tails.",
              ru: "Блоки: 3 + 3 = 6, каждый блок держит 24 слота; живых 100; waste = ёмкость − живые. Один ceil по сумме дал бы 5 блоков и спрятал хвосты.",
            },
            followUp: {
              q: { en: "Why can't the two tails merge into one shared tail?", ru: "Почему два хвоста не могут слиться в один общий?" },
              options: [
                { en: "Requests never share blocks: each block table is per-request, so every tail is reserved for its own request alone", ru: "Запросы никогда не делят блоки: block table у каждого свой, поэтому каждый хвост резервируется под свой запрос" },
                { en: "The scheduler merges tails at the next tick boundary", ru: "Scheduler сливает хвосты на следующей границе тиков" },
                { en: "Tails merge when the block size divides the total length", ru: "Хвосты сливаются, когда размер блока делит суммарную длину" },
              ],
              answer: 0,
              explain: { en: "The one-pool shortcut promises ceil(100/24) = 5 blocks by merging tails that cannot merge: 6 real block tables hold 144 slots. The 24-slot gap is the undercount every downstream waste figure inherits.", ru: "Короткий путь «один пул» обещает ceil(100/24) = 5 блоков ровно тем, что склеивает несклеиваемые хвосты: 6 реальных block tables держат 144 слота. Разница в 24 слота — то занижение, которое наследует вся дальнейшая арифметика waste." },
            },
          },
        ],
      },
      {
        id: "q3",
        q: {
          en: "Decode-only toy, 2 slots, continuous batching: A needs 5 ticks, B and C need 1 each; A, B, C arrive at tick 0 in FIFO order. B works during [0, 1) and C takes its freed slot. At which tick boundary is C complete?",
          ru: "Decode-only игрушка, 2 слота, continuous-батчинг: A нужно 5 тиков, B и C — по 1; A, B, C пришли в тик 0 в порядке FIFO. B работает в [0, 1), C занимает его освободившийся слот. На какой границе тиков C завершается?",
        },
        answer: 2, tol: 0.2, unit: { en: "tick", ru: "тика" },
        hint: {
          en: "C is admitted at tick 1, works during [1, 2); completion is recorded at the next boundary. Static mode would keep C waiting until the whole cohort empties.",
          ru: "C подсаживается в тик 1, работает в [1, 2); завершение фиксируется на следующей границе. Static-режим держал бы C до опустошения всей когорты.",
        },
        followUp: {
          q: { en: "Why does C finish at tick 2 and not at tick 1, right when it is admitted?", ru: "Почему C завершается на тике 2, а не на тике 1 — сразу при подсадке?" },
          options: [
            { en: "Admission and one decode step are different events: C is admitted at the boundary 1, works during [1, 2), and its completion is recorded at the next boundary", ru: "Подсадка и один decode-шаг — разные события: C подсаживается на границе 1, работает в [1, 2), и завершение фиксируется на следующей границе" },
            { en: "C's request is queued twice before it starts", ru: "Запрос C дважды попадает в очередь до старта" },
            { en: "Tick 1 is reserved for B's output tokens", ru: "Тик 1 зарезервирован под выходные токены B" },
          ],
          answer: 0,
          explain: { en: "A unit tick of work occupies exactly one interval: start at the boundary, finish at the next one. B's own work was [0, 1) — that is why B's slot freed only at boundary 1.", ru: "Единичный тик работы занимает ровно один интервал: старт на границе, финиш на следующей. Работа B была [0, 1) — поэтому его слот освободился только на границе 1." },
        },
        // Вариативность №5: когорта и слоты разведены с фигурных (A·5, B·1, C·1, 2 слота);
        // трасса по модели упражнения 4 (FIFO, старт на свободном слоте, финиш = старт + работа):
        //   [9, 8, 4, 4, 4] на 4 слотах → C, D финишируют на 4, E: старт 4 → финиш 8;
        //   [20, 12, 12, 12, 8] на 4 слотах → B, C, D на 12, E: старт 12 → финиш 20.
        variants: [
          {
            q: {
              en: "Decode-only toy, 2 slots, continuous batching: A needs 5 ticks, B and C need 1 each; A, B, C arrive at tick 0 in FIFO order. B works during [0, 1) and C takes its freed slot. At which tick boundary is C complete?",
              ru: "Decode-only игрушка, 2 слота, continuous-батчинг: A нужно 5 тиков, B и C — по 1; A, B, C пришли в тик 0 в порядке FIFO. B работает в [0, 1), C занимает его освободившийся слот. На какой границе тиков C завершается?",
            },
            answer: 2, tol: 0.2,
          },
          {
            q: {
              en: "Decode-only toy, 4 slots, continuous batching: A needs 9 ticks, B needs 8, C, D and E need 4 each; all arrive at tick 0 in FIFO order. C and D finish at boundary 4 and E takes a freed slot. At which tick boundary is E complete?",
              ru: "Decode-only игрушка, 4 слота, continuous-батчинг: A нужно 9 тиков, B — 8, C, D и E — по 4; все пришли в тик 0 в порядке FIFO. C и D завершаются на границе 4, и E занимает освободившийся слот. На какой границе тиков E завершается?",
            },
            answer: 8, tol: 0.2,
            hint: {
              en: "E is admitted at the boundary where C and D free their slots, then owes its own 4 ticks; completion is recorded at the NEXT boundary after start + work.",
              ru: "E подсаживается на границе, где C и D освободили слоты, и должен свои 4 тика; завершение фиксируется на СЛЕДУЮЩЕЙ границе после старт + работа.",
            },
            followUp: {
              q: { en: "Why does E finish at tick 8 and not at tick 4, right when it is admitted?", ru: "Почему E завершается на тике 8, а не на тике 4 — сразу при подсадке?" },
              options: [
                { en: "Admission and one decode step are different events: E is admitted at the boundary 4, works during [4, 8), and its completion is recorded at the next boundary", ru: "Подсадка и один decode-шаг — разные события: E подсаживается на границе 4, работает в [4, 8), и завершение фиксируется на следующей границе" },
                { en: "E's request is queued twice before it starts", ru: "Запрос E дважды попадает в очередь до старта" },
                { en: "Tick 4 is reserved for C's and D's output tokens", ru: "Тик 4 зарезервирован под выходные токены C и D" },
              ],
              answer: 0,
              explain: { en: "A unit tick of work occupies exactly one interval: start at the boundary, finish at the next one. C and D freed their slots only at boundary 4 — that is when E could start.", ru: "Единичный тик работы занимает ровно один интервал: старт на границе, финиш на следующей. C и D освободили слоты только на границе 4 — тогда E и мог стартовать." },
            },
          },
          {
            q: {
              en: "Decode-only toy, 4 slots, continuous batching: A needs 20 ticks, B, C and D need 12 each, E needs 8; all arrive at tick 0 in FIFO order. B, C and D finish at boundary 12 and E takes a freed slot. At which tick boundary is E complete?",
              ru: "Decode-only игрушка, 4 слота, continuous-батчинг: A нужно 20 тиков, B, C и D — по 12, E — 8; все пришли в тик 0 в порядке FIFO. B, C и D завершаются на границе 12, и E занимает освободившийся слот. На какой границе тиков E завершается?",
            },
            answer: 20, tol: 0.2,
            hint: {
              en: "The first slot frees at boundary 12, E owes its own 8 ticks, and completion is recorded at the NEXT boundary after start + work.",
              ru: "Первый слот освобождается на границе 12, E должен свои 8 тиков, а завершение фиксируется на СЛЕДУЮЩЕЙ границе после старт + работа.",
            },
            followUp: {
              q: { en: "Why does E finish at tick 20 and not at tick 12, right when it is admitted?", ru: "Почему E завершается на тике 20, а не на тике 12 — сразу при подсадке?" },
              options: [
                { en: "Admission and one decode step are different events: E is admitted at the boundary 12, works during [12, 20), and its completion is recorded at the next boundary", ru: "Подсадка и один decode-шаг — разные события: E подсаживается на границе 12, работает в [12, 20), и завершение фиксируется на следующей границе" },
                { en: "E's request is queued twice before it starts", ru: "Запрос E дважды попадает в очередь до старта" },
                { en: "Tick 12 is reserved for B's and C's output tokens", ru: "Тик 12 зарезервирован под выходные токены B и C" },
              ],
              answer: 0,
              explain: { en: "A unit tick of work occupies exactly one interval: start at the boundary, finish at the next one. B, C and D freed their slots only at boundary 12 — that is when E could start.", ru: "Единичный тик работы занимает ровно один интервал: старт на границе, финиш на следующей. B, C и D освободили слоты только на границе 12 — тогда E и мог стартовать." },
            },
          },
        ],
      },
    ],
    exercises: [
      {
        id: "ex1",
        title: { en: "Exercise 1 · Blocks per request", ru: "Упражнение 1 · Блоки на запрос" },
        brief: {
          en: "Implement <code>blocks_needed(length, block_size)</code> — physical blocks for one request: <code>ceil(L / B)</code>. Always round <strong>up</strong>: an exact multiple still needs one block per B positions, and a length of 0 needs none. Use integer ceiling division so the result stays exact.",
          ru: "Реализуй <code>blocks_needed(length, block_size)</code> — физические блоки для одного запроса: <code>ceil(L / B)</code>. Округляй всегда <strong>вверх</strong>: точное кратное всё равно занимает один блок на каждые B позиций, а нулевая длина не занимает ни одного. Используй целочисленное деление с округлением вверх, чтобы результат был точным.",
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
          ru: "Эта <code>allocated_positions(lengths, block_size)</code> занижает: она округляет <strong>сумму</strong> длин один раз — как один общий пул, — но запросы не делят блоки, и хвост каждого запроса резервируется отдельно (вопрос тетради A2: почему <code>ceil(sum / 16)</code> не может изображать отдельные block tables?). Почини до <code>Σᵢ ceil(Lᵢ / B) × B</code>. На фикстуре [17, 31, 33] должно быть 112, а не 96 — и вся дальнейшая арифметика waste наследует эту ошибку.",
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
          { en: "The bug's 96 hides 16 wasted slots: the shared pool merges three tails into one. Round per request, then multiply by the block size.", ru: "В ошибочных 96 спрятаны 16 потерянных слотов: общий пул склеил три хвоста в один. Округляй по каждому запросу, затем умножай на размер блока." },
        ],
        numpy: false,
        timeoutMs: 4000,
      },
    {
        id: "ex4",
        title: { en: "Exercise 4 · Finish the trace", ru: "Упражнение 4 · Дочитай трассу" },
        brief: {
          en: "Implement <code>finish_ticks(work, slots)</code> — the finish boundary tick of each request (FIFO, all arrive at tick 0, unit ticks, continuous batching): each request starts as soon as a slot is free and finishes at <code>start + work</code>. Notebook toy: [5, 1, 1] on 2 slots → [5, 1, 2] — B frees the slot at 1, C takes it immediately.",
          ru: "Реализуй <code>finish_ticks(work, slots)</code> — границу завершения каждого запроса (FIFO, все пришли в тик 0, единичные тики, continuous-батчинг): запрос стартует, как только слот освободится, и завершается в <code>start + work</code>. Игрушка тетради: [5, 1, 1] на 2 слотах → [5, 1, 2] — B освобождает слот в тик 1, C занимает его сразу.",
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
          { en: "Keep slot_free[slots]; each request takes the earliest-free slot, not slot 0.", ru: "Держи slot_free[slots]; каждый запрос берёт самый ранний свободный слот, а не слот 0." },
        ],
        numpy: false,
        timeoutMs: 4000,
      },
    ],
    challenge: {
      id: "chal1",
      word: { en: "challenge", ru: "челлендж" },
      title: {
        en: "★ Plan two requests against a 16-block pool",
        ru: "★ Спланируй два запроса под пул из 16 блоков",
      },
      brief: {
        en: "The pool holds <code>16 blocks × 16 = 256 slots</code>; two requests will be paged independently. You choose their retained lengths <code>L1</code> and <code>L2</code> (whole positions, ≥ 1). Three constraints at once: <strong>live ≥ 180</strong>, <strong>waste ≤ 50</strong> (tails never merge), <strong>allocated ≤ 256</strong>. No tests guide you — the page recomputes every number from the declared ceil-per-request model.",
        ru: "Пул держит <code>16 блоков × 16 = 256 слотов</code>; два запроса будут пейджиться независимо. Ты выбираешь их длины <code>L1</code> и <code>L2</code> (целые позиции, ≥ 1). Три ограничения сразу: <strong>live ≥ 180</strong>, <strong>waste ≤ 50</strong> (хвосты не сливаются), <strong>allocated ≤ 256</strong>. Тестов-каркаса нет — страница пересчитывает все числа по заявленной модели ceil-на-запрос.",
      },
      goal: {
        en: "Print one line: <code>l1=… l2=… waste=… allocated=…</code> satisfying all three constraints.",
        ru: "Напечатай одну строку: <code>l1=… l2=… waste=… allocated=…</code>, удовлетворяющую всем трём ограничениям.",
      },
      mode: "run",
      numpy: false,
      timeoutMs: 30000,
      starter: `# Pool: 16 blocks of 16 = 256 slots. Two requests, paged independently:
# blocks = ceil(L1/16) + ceil(L2/16); allocated = blocks * 16;
# waste = allocated - (L1 + L2).
# Constraints: live = L1 + L2 >= 180, waste <= 50, allocated <= 256.
# The page reads ONE summary line in exactly this shape:
#   l1=<len> l2=<len> waste=<tail slots> allocated=<slots>

# TODO: search for lengths satisfying all three constraints, print the line.
`,
      check: (res) => {
        const out = String(res.stdout || "");
        const mm = out.match(/l1\s*=\s*([0-9]+)[\s\S]*?l2\s*=\s*([0-9]+)[\s\S]*?waste\s*=\s*([0-9]+)[\s\S]*?allocated\s*=\s*([0-9]+)/i);
        if (!mm) {
          return { ok: false, note: { en: "no summary line found - print exactly: l1=… l2=… waste=… allocated=…", ru: "итоговой строки нет — напечатай ровно: l1=… l2=… waste=… allocated=…" } };
        }
        const l1 = parseInt(mm[1], 10), l2 = parseInt(mm[2], 10);
        const wasteClaimed = parseInt(mm[3], 10), allocClaimed = parseInt(mm[4], 10);
        if (!(l1 >= 1 && l2 >= 1)) {
          return { ok: false, note: { en: "lengths must be whole positions >= 1", ru: "длины — целые позиции ≥ 1" } };
        }
        const blocks = Math.ceil(l1 / 16) + Math.ceil(l2 / 16);
        const allocated = blocks * 16;
        const waste = allocated - (l1 + l2);
        if (allocClaimed !== allocated || wasteClaimed !== waste) {
          return { ok: false, note: { en: "the numbers must follow the declared model: lengths " + l1 + "/" + l2 + " give blocks " + blocks + ", allocated " + allocated + ", waste " + waste, ru: "числа обязаны следовать заявленной модели: длины " + l1 + "/" + l2 + " дают блоков " + blocks + ", allocated " + allocated + ", waste " + waste } };
        }
        if (l1 + l2 < 180) {
          return { ok: false, note: { en: "live " + (l1 + l2) + " < 180 - the requests are too short", ru: "live " + (l1 + l2) + " < 180 — запросы слишком короткие" } };
        }
        if (waste > 50) {
          return { ok: false, note: { en: "waste " + waste + " > 50 - too many unused tail slots", ru: "waste " + waste + " > 50 — слишком много пустых хвостов" } };
        }
        if (allocated > 256) {
          return { ok: false, note: { en: "allocated " + allocated + " > 256 - over the pool", ru: "allocated " + allocated + " > 256 — сверх пула" } };
        }
        return { ok: true, note: { en: l1 + "/" + l2 + ": " + blocks + " blocks, allocated " + allocated + " ≤ 256, waste " + waste + " ≤ 50, live " + (l1 + l2) + " ≥ 180", ru: l1 + "/" + l2 + ": блоков " + blocks + ", allocated " + allocated + " ≤ 256, waste " + waste + " ≤ 50, live " + (l1 + l2) + " ≥ 180" } };
      },
      reference: `# All three constraints in one loop over candidate lengths:
def blocks(L):
    return (L + 15) // 16

for l1 in range(1, 260):
    for l2 in range(1, 260):
        blocks_total = blocks(l1) + blocks(l2)
        allocated = blocks_total * 16
        live = l1 + l2
        waste = allocated - live
        if live >= 180 and waste <= 50 and allocated <= 256:
            print(f"l1={l1} l2={l2} waste={waste} allocated={allocated}")
            raise SystemExit
# The scan stops at 1/179: blocks 1 + 12 = 13, allocated 208, live 180,
# waste 28 - one tiny request and one huge one. 97/87 works too
# (blocks 13, allocated 208, waste 24). Notice the tension: longer
# requests raise live but also the tails.`,
    },
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
        options: [{ en: "allocated 112 \u2212 used 81 = 31", ru: "\u0432\u044b\u0434\u0435\u043b\u0435\u043d\u043e 112 \u2212 \u0436\u0438\u0432\u044b\u0445 81 = 31" }, { en: "0 \u2014 tails are shared", ru: "0 \u2014 \u0445\u0432\u043e\u0441\u0442\u044b \u0434\u0435\u043b\u044f\u0442\u0441\u044f \u043c\u0435\u0436\u0434\u0443 \u0437\u0430\u043f\u0440\u043e\u0441\u0430\u043c\u0438" }, { en: "112", ru: "112" }],
        answer: 0,
        explain: { en: "\u03a3 ceil(L/16)\u00d716 = 112 slots for 81 live tokens: 31 slots are paid tails, never used.", ru: "\u03a3 ceil(L/16)\u00d716 = 112 \u0441\u043b\u043e\u0442\u043e\u0432 \u043d\u0430 81 \u0436\u0438\u0432\u043e\u0439 \u0442\u043e\u043a\u0435\u043d: 31 \u0441\u043b\u043e\u0442 \u2014 \u043f\u043b\u0430\u0442\u043d\u044b\u0435 \u0445\u0432\u043e\u0441\u0442\u044b \u0431\u0435\u0437 \u0438\u0441\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u043d\u0438\u044f." },
      },
      {
        id: "p3",
        q: { en: "In continuous batching, a slot frees the moment a request finishes. The next token goes to\u2026", ru: "\u0412 \u043d\u0435\u043f\u0440\u0435\u0440\u044b\u0432\u043d\u043e\u043c \u0431\u0430\u0442\u0447\u0438\u043d\u0433\u0435 \u0441\u043b\u043e\u0442 \u043e\u0441\u0432\u043e\u0431\u043e\u0436\u0434\u0430\u0435\u0442\u0441\u044f \u0432\u00a0\u043c\u043e\u043c\u0435\u043d\u0442 \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043d\u0438\u044f \u0437\u0430\u043f\u0440\u043e\u0441\u0430. \u0421\u043b\u0435\u0434\u0443\u044e\u0449\u0438\u0439 \u0442\u043e\u043a\u0435\u043d \u0434\u043e\u0441\u0442\u0430\u0451\u0442\u0441\u044f\u2026" },
        options: [{ en: "the waiting request, from the next step", ru: "\u0436\u0434\u0443\u0449\u0435\u043c\u0443 \u0437\u0430\u043f\u0440\u043e\u0441\u0443, \u043d\u0430\u0447\u0438\u043d\u0430\u044f \u0441\u043e \u0441\u043b\u0435\u0434\u0443\u044e\u0449\u0435\u0433\u043e \u0448\u0430\u0433\u0430" }, { en: "nobody until the whole batch finishes", ru: "\u043d\u0438\u043a\u043e\u043c\u0443, \u043f\u043e\u043a\u0430 \u043d\u0435 \u0437\u0430\u0432\u0435\u0440\u0448\u0438\u0442\u0441\u044f \u0432\u0435\u0441\u044c \u0431\u0430\u0442\u0447" }, { en: "the longest request", ru: "\u0441\u0430\u043c\u043e\u043c\u0443 \u0434\u043b\u0438\u043d\u043d\u043e\u043c\u0443 \u0437\u0430\u043f\u0440\u043e\u0441\u0443" }],
        answer: 0,
        explain: { en: "That is the whole point of continuous batching: the finished request's slot is reused on the next step \u2014 no batch-boundary waiting.", ru: "\u0412 \u044d\u0442\u043e\u043c \u0441\u043c\u044b\u0441\u043b \u043d\u0435\u043f\u0440\u0435\u0440\u044b\u0432\u043d\u043e\u0433\u043e \u0431\u0430\u0442\u0447\u0438\u043d\u0433\u0430: \u0441\u043b\u043e\u0442 \u0437\u0430\u0432\u0435\u0440\u0448\u0438\u0432\u0448\u0435\u0433\u043e\u0441\u044f \u0437\u0430\u043f\u0440\u043e\u0441\u0430 \u043f\u0435\u0440\u0435\u0438\u0441\u043f\u043e\u043b\u044c\u0437\u0443\u0435\u0442\u0441\u044f \u043d\u0430 \u0441\u043b\u0435\u0434\u0443\u044e\u0449\u0435\u043c \u0448\u0430\u0433\u0435 \u2014 \u0431\u0435\u0437 \u043e\u0436\u0438\u0434\u0430\u043d\u0438\u044f \u0433\u0440\u0430\u043d\u0438\u0446 \u0431\u0430\u0442\u0447\u0430." },
      },
      {
        id: "r1",
        tag: { en: "code reading", ru: "код-чтение" },
        q: { en: "This «server» module handles the toy cohort [5, 1, 1] on 2 slots with makespan 6; continuous batching finishes at 2. Which mechanism is the degradation?", ru: "Этот «серверный» модуль обслуживает игрушечную когорту [5, 1, 1] на 2 слотах с makespan 6; continuous batching завершает на 2. Какой механизм — деградация?" },
        code: `# toy_server.py - cohort runner (vendor module, v0.9)
def run_cohort(work, slots):
    """Finish tick of the LAST request; unit ticks, FIFO arrivals."""
    running = []           # (finish_tick, slot_id)
    clock = 0
    for i, w in enumerate(work):
        if len(running) >= slots:
            clock = max(r[0] for r in running)   # <- A
            running = []                          # <- B
        running.append((clock + w, i))            # <- C
    return max(r[0] for r in running)

# run_cohort([5, 1, 1], 2) -> 6, continuous batching gives 2
`,
        context: { en: "Reproduce it in any exercise editor or the ★ editor: run_cohort([5, 1, 1], 2) prints 6 — three times worse than the trace from Exercise 4's finish_ticks([5, 1, 1], 2) = [5, 1, 2].", ru: "Воспроизведи в любом редакторе упражнений или в ★-редакторе: run_cohort([5, 1, 1], 2) печатает 6 — втрое хуже трассы из упражнения 4: finish_ticks([5, 1, 1], 2) = [5, 1, 2]." },
        options: [
          { en: "Lines A–B: the slot is cleared only when the WHOLE batch empties — B's freed slot idles instead of taking C at boundary 1 (static, not continuous batching)", ru: "Строки A–B: слот очищается, только когда опустеет ВЕСЬ батч — освободившийся слот B простаивает вместо того, чтобы взять C на границе 1 (static вместо continuous-батчинга)" },
          { en: "Line C: requests should be appended in reverse order (SJF, not FIFO)", ru: "Строка C: запросы надо добавлять в обратном порядке (SJF, а не FIFO)" },
          { en: "The max() over running is wrong — it should be min()", ru: "max() по running неверен — должен быть min()" },
        ],
        answer: 0,
        explain: { en: "The module runs static batches: C waits for the entire cohort to drain (clock jumps to 5) and only then starts, finishing at 6. Continuous batching admits C the moment B frees a slot — finish 2, as Exercise 4's slot_free walk shows. FIFO vs SJF is a policy choice; empty slots are the degradation.", ru: "Модуль гоняет static-батчи: C ждёт, пока опустеет вся когорта (clock прыгает на 5), и только тогда стартует — финиш на 6. Continuous batching подсаживает C в момент, когда B освободил слот, — финиш 2, как показывает обход slot_free из упражнения 4. FIFO против SJF — вопрос политики; простаивающие слоты — вот деградация." },
      },
    ],
    reward: {
      caption: { en: "Block tails, admissions and the short-request race \u2014 you run the allocator now.", ru: "\u0411\u043b\u043e\u0447\u043d\u044b\u0435 \u0445\u0432\u043e\u0441\u0442\u044b, \u0434\u043e\u043f\u0443\u0441\u043a\u0438 \u0438\u00a0\u0433\u043e\u043d\u043a\u0430 \u043a\u043e\u0440\u043e\u0442\u043a\u043e\u0433\u043e \u0437\u0430\u043f\u0440\u043e\u0441\u0430 \u2014 \u0430\u043b\u043b\u043e\u043a\u0430\u0442\u043e\u0440 \u0442\u0435\u043f\u0435\u0440\u044c \u043f\u043e\u0434 \u0442\u0432\u043e\u0438\u043c \u0443\u043f\u0440\u0430\u0432\u043b\u0435\u043d\u0438\u0435\u043c." },
    },
    footer: {
      en: "Teaching arithmetic on a declared model — not a GPU measurement. The completion traces come from the decode-only CPU toy in the Topic 05 notebook (equal-cost ticks, prefill = 0), the same play the notebook rehearses before any real run; the notebook's pipeline-vs-vLLM burst comparison is a separate owner-run evidence step and is not executed by this lab.",
      ru: "Учебная арифметика по заявленной модели — не измерение GPU. Трассировки завершения взяты из decode-only CPU-игрушки тетради Темы 05 (равноценные тики, prefill = 0) — та же репетиция, которую тетрадь выполняет до любого реального прогона; сравнение pipeline-vs-vLLM из тетради — отдельный evidence-шаг и этой лабой не исполняется.",
    },
  };
})();
