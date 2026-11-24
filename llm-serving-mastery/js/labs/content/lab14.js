/* Lab 14 — Adapters and multi-tenancy: LoRA economics on a declared surface.
   Content module for the generic lab page (window.LABS_CONTENT['14']).
   Sources: LoRA rank arithmetic (arXiv 2106.09685), the declared 2 ms swap
   cost, the T13 journal slice (tenant p95) and the T08 admission lens.
   The stream, the swap cost and the adapter quality deltas are a DECLARED
   teaching model; the live layer-2 journal stays the student's own ground
   truth for anything measured. */
(function () {
  "use strict";
  window.LABS_CONTENT = window.LABS_CONTENT || {};

  LABS_CONTENT["14"] = {
    budget: 60,
    title: {
      en: "Adapters and multi-tenancy: the routing ledger",
      ru: "Адаптеры и мультитенантность: ведомость маршрутизации",
    },
    sub: {
      en: "One frozen base, a 0.22 MB adapter per tenant — price the sliver, count the swaps, measure per tenant, and let the window dial trade waits against switches.",
      ru: "Одна замороженная база, адаптер 0.22 MB на арендатора — оцени срез, сосчитай переключения, измеряй по арендаторам, и пусть окно торгует ожидания против переключений.",
    },
    intro: {
      en: `<p>Topic 13 taught you to measure promises per window; this topic splits the same journal by <strong>tenant</strong>. One frozen base serves many tenants through small LoRA adapters, and every number here is a declared teaching model: the rank arithmetic is exact, the 2 ms swap cost is a declared knob, the tenant stream is the deck's six requests plus the star challenge's window dial.</p>
<p>The two-sided bill is the spine: <strong>switching</strong> (2 ms per tenant change, order-dependent) against <strong>waiting</strong> (requests held for their affinity group). FIFO pays all switching; tenant-pinned queues pay all waiting; the affinity window W trades between them. The per-tenant p95 — nearest-rank over the tenant's own journal slice — is what the T13 discipline looks like one grain finer, and it is the promise the window must protect.</p>`,
      ru: `<p>Тема 13 учила измерять обещания по окнам; эта тема делит тот же журнал по <strong>арендаторам</strong>. Одна замороженная база обслуживает многих через маленькие LoRA-адаптеры, и каждое число здесь — декларированная учебная модель: арифметика ранга точна, цена переключения 2 ms — декларированная ручка, поток арендаторов — шесть запросов слайдов плюс диск окна звёздного челленджа.</p>
<p>Двусторонний счёт — хребет: <strong>переключения</strong> (2 ms за смену арендатора, зависят от порядка) против <strong>ожиданий</strong> (запросы, удержанные для своей affinity-группы). FIFO платит всем переключениями; очереди с привязкой — всем ожиданием; affinity-окно W торгует между ними. p95 арендатора — nearest-rank по его собственному срезу журнала — это дисциплина T13 зерном тоньше, и именно это обещание окно обязано защищать.</p>`,
    },
    heroTag: { en: "LoRA ledger, swaps, tenant p95", ru: "ведомость LoRA, переключения, p95 арендатора" },
    glossary: [
      [{ en: "LoRA adapter", ru: "LoRA-адаптер" }, { en: "a small per-tenant weight update (two low-rank matrices per target projection); the frozen base never changes.", ru: "маленькое пер-арендаторское обновление весов (две low-rank матрицы на проекцию); замороженная база никогда не меняется." }],
      [{ en: "rank r", ru: "ранг r" }, { en: "the quality/size dial: r = 16 halves to 8 with most of the delta — measured, not assumed.", ru: "ручка качества/размера: r = 16 уменьшается до 8 с большей частью дельты — измеряется, а не предполагается." }],
      [{ en: "adapter size", ru: "размер адаптера" }, { en: "params = 2 · r · (din + dout) · targets; fp16 doubles the bytes.", ru: "params = 2 · r · (din + dout) · targets; fp16 удваивает байты." }],
      [{ en: "swap", ru: "переключение" }, { en: "loading a different tenant's adapter onto the slot; declared cost 2 ms in this model.", ru: "загрузка чужого адаптера на слот; декларированная цена в этой модели 2 ms." }],
      [{ en: "affinity window", ru: "affinity-окно" }, { en: "a window of W arrivals, grouped by tenant inside; W trades waits against swaps.", ru: "окно из W входящих запросов, сгруппированных внутри; W торгует ожидания против переключений." }],
      [{ en: "tenant slice", ru: "срез арендатора" }, { en: "the journal entries whose tenant field matches — the only source for the tenant's promise.", ru: "записи журнала с совпавшим полем tenant — единственный источник обещания арендатора." }],
      [{ en: "tenant p95", ru: "p95 арендатора" }, { en: "nearest-rank p95 over the tenant slice, window named — the T13 discipline one grain finer.", ru: "nearest-rank p95 по срезу арендатора, окно названо — дисциплина T13 зерном тоньше." }],
      [{ en: "FIFO", ru: "FIFO" }, { en: "serve in arrival order: honest to arrivals, brutal to switches.", ru: "сервис в порядке прихода: честно к приходам, жестоко к переключениям." }],
      [{ en: "tenant-pinned queues", ru: "очереди с привязкой" }, { en: "one queue per tenant: minimal swaps, real head-of-line waiting for small tenants.", ru: "очередь на арендатора: минимум переключений, реальное ожидание в очереди для малых арендаторов." }],
      [{ en: "waited", ru: "ожидавшие" }, { en: "requests served behind the first of their affinity group — the second side of the two-sided bill.", ru: "запросы, обслуженные позади первого в своей affinity-группе — вторая сторона двустороннего счёта." }],
    ],
    figures: [
      {
        id: "lab14-swapcount",
        title: { en: "Count the swaps: order changes the bill", ru: "Сосчитай переключения: порядок меняет счёт" },
        w: 760, h: 420,
        svg: `<svg viewBox="0 0 760 420" xmlns="http://www.w3.org/2000/svg">
  <g id="g-stream">
    <text x="70" y="70" font-size="14" fill="var(--lab-muted)" class="mono" data-en="arrival order" data-ru="порядок прихода">arrival order</text>
    <rect x="70" y="86" width="86" height="52" rx="9" fill="var(--lab-accent)" opacity="0.9"/>
    <text x="113" y="122" font-size="18" fill="var(--lab-ink)" class="mono" text-anchor="middle">A</text>
    <rect x="180" y="86" width="86" height="52" rx="9" fill="var(--fig-warm)" opacity="0.9"/>
    <text x="223" y="122" font-size="18" fill="var(--lab-ink)" class="mono" text-anchor="middle">B</text>
    <rect x="290" y="86" width="86" height="52" rx="9" fill="var(--lab-accent)" opacity="0.9"/>
    <text x="333" y="122" font-size="18" fill="var(--lab-ink)" class="mono" text-anchor="middle">A</text>
    <rect x="400" y="86" width="86" height="52" rx="9" fill="var(--fig-warm)" opacity="0.9"/>
    <text x="443" y="122" font-size="18" fill="var(--lab-ink)" class="mono" text-anchor="middle">B</text>
    <rect x="510" y="86" width="86" height="52" rx="9" fill="var(--lab-accent)" opacity="0.9"/>
    <text x="553" y="122" font-size="18" fill="var(--lab-ink)" class="mono" text-anchor="middle">A</text>
    <rect x="620" y="86" width="86" height="52" rx="9" fill="var(--fig-warm)" opacity="0.9"/>
    <text x="663" y="122" font-size="18" fill="var(--lab-ink)" class="mono" text-anchor="middle">B</text>
  </g>
  <g id="g-count">
    <text x="70" y="190" font-size="15" fill="var(--lab-ink)" data-en="every tenant change = 1 swap (declared 2 ms)" data-ru="каждая смена арендатора = 1 переключение (декларированные 2 ms)">every tenant change = 1 swap (declared 2 ms)</text>
    <text x="70" y="232" font-size="30" fill="var(--fig-warm)" class="mono">FIFO: A→B→A→B→A→B = 5 swaps</text>
    <text x="70" y="280" font-size="30" fill="var(--lab-good)" class="mono">grouped: AAA|BBB = 1 swap</text>
  </g>
  <g id="g-ledger">
    <rect x="70" y="316" width="636" height="66" rx="9" fill="var(--lab-good)" opacity="0.14"/>
    <text x="90" y="348" font-size="14" fill="var(--lab-ink)" data-en="same load, same order inside each tenant — the bill differs fivefold" data-ru="та же нагрузка, тот же порядок внутри арендатора — счёт разнится впятеро">same load, same order inside each tenant — the bill differs fivefold</text>
    <text x="90" y="372" font-size="14" fill="var(--lab-muted)" data-en="the missing 4 swaps did not vanish: they became waiting — the capstone prices both" data-ru="недостающие 4 переключения не исчезли: они стали ожиданием — капстоун оценивает оба бока">the missing 4 swaps did not vanish: they became waiting — the capstone prices both</text>
  </g>
</svg>`,
        stages: [
          { cap: { en: "The deck's six requests: A and B alternate — the worst case for switches.", ru: "Шесть запросов слайдов: A и B чередуются — худший случай для переключений." }, show: ["g-stream", "g-count"] },
          { cap: { en: "Grouping collapses 5 swaps to 1 — and the ribbon names where the other four went.", ru: "Группировка сжимает 5 переключений до 1 — и лента называет, куда ушли другие четыре." }, show: ["g-stream", "g-count", "g-ledger"] },
        ],
      },
      {
        id: "lab14-window",
        title: { en: "The window dial: W trades waits against swaps", ru: "Диск окна: W торгует ожидания против переключений" },
        w: 760, h: 420,
        svg: `<svg viewBox="0 0 760 420" xmlns="http://www.w3.org/2000/svg">
  <g id="g-dial">
    <text x="70" y="76" font-size="15" fill="var(--lab-ink)" data-en="window W = 1 → FIFO: all switching" data-ru="окно W = 1 → FIFO: всё переключениями">window W = 1 → FIFO: all switching</text>
    <text x="70" y="118" font-size="15" fill="var(--lab-ink)" data-en="window W = 6 → one tenant batch: all waiting" data-ru="окно W = 6 → одна партия: всё ожиданием">window W = 6 → one tenant batch: all waiting</text>
    <text x="70" y="160" font-size="15" fill="var(--lab-ink)" data-en="between them: the wait has a ceiling (W − 1) and the swaps have a budget" data-ru="между ними: у ожидания потолок (W − 1), у переключений бюджет">between them: the wait has a ceiling (W − 1) and the swaps have a budget</text>
  </g>
  <g id="g-table">
    <text x="70" y="216" font-size="14" fill="var(--lab-muted)" class="mono" data-en="W    swaps   waited" data-ru="W    переключ.   ожидавших">W    swaps   waited</text>
    <text x="70" y="254" font-size="15" fill="var(--lab-ink)" class="mono">1      5        0</text>
    <text x="70" y="290" font-size="15" fill="var(--lab-good)" class="mono">3      2        2</text>
    <text x="70" y="326" font-size="15" fill="var(--lab-ink)" class="mono">4      3        2</text>
    <text x="70" y="362" font-size="15" fill="var(--lab-ink)" class="mono">6      1        4</text>
    <text x="260" y="290" font-size="14" fill="var(--lab-good)" data-en="W = 3 passes both declared lines" data-ru="W = 3 проходит обе декларированные линии">W = 3 passes both declared lines</text>
  </g>
  <g id="g-lines">
    <rect x="70" y="384" width="636" height="30" rx="8" fill="var(--lab-accent)" opacity="0.14"/>
    <text x="86" y="405" font-size="14" fill="var(--lab-ink)" data-en="declared lines: swaps ≤ 2, waited ≤ 4, W ≤ 4 — the star challenge walks this dial" data-ru="декларированные линии: переключения ≤ 2, ожидавшие ≤ 4, W ≤ 4 — их проходит звёздный челлендж">declared lines: swaps ≤ 2, waited ≤ 4, W ≤ 4 — the star challenge walks this dial</text>
  </g>
</svg>`,
        stages: [
          { cap: { en: "The two degenerate policies: W = 1 is FIFO, W = 6 is one big tenant batch.", ru: "Две вырожденные политики: W = 1 — FIFO, W = 6 — одна большая партия." }, show: ["g-dial"] },
          { cap: { en: "The dial table on the declared six-request stream: every W prices both sides.", ru: "Таблица диска на декларированном потоке из шести запросов: каждое W оценивает обе стороны." }, show: ["g-dial", "g-table"] },
          { cap: { en: "The declared lines make the star challenge unique: only W = 3 passes both.", ru: "Декларированные линии делают звёздный челлендж единственным: только W = 3 проходит обе." }, show: ["g-dial", "g-table", "g-lines"] },
        ],
      },
    ],

    scenario: null,
    quizzes: [
      {
        id: "q1",
        q: {
          en: "Rank r = 16, hidden size d = 896, four target matrices, fp16. How many trainable parameters does one LoRA adapter carry?",
          ru: "Ранг r = 16, скрытый размер d = 896, четыре целевые матрицы, fp16. Сколько обучаемых параметров в одном LoRA-адаптере?",
        },
        answer: 114688, tol: 0.5, unit: { en: "params", ru: "параметров" },
        hint: {
          en: "Per matrix: r × (din + dout) = 16 × 1792; four matrices; the factor 2 (A and B) is already inside r × (din + dout) — do not double it again.",
          ru: "На матрицу: r × (din + dout) = 16 × 1792; четыре матрицы; множитель 2 (A и B) уже внутри r × (din + dout) — не удваивай его снова.",
        },
        followUp: {
          q: { en: "In fp16 this is 229 376 B ≈ 0.22 MB. What does that size buy the fleet?", ru: "В fp16 это 229 376 B ≈ 0.22 MB. Что такой размер даёт флоту?" },
          options: [
            { en: "Every tenant adds 0.05 % of the base instead of a full 491 MB copy — the multiplication collapses", ru: "Каждый арендатор добавляет 0.05 % базы вместо полной копии на 491 MB — умножение схлопывается" },
            { en: "The base gets smaller too", ru: "База тоже уменьшается" },
            { en: "Nothing — adapters are only for training", ru: "Ничего — адаптеры только для обучения" },
          ],
          answer: 0,
          explain: { en: "The sliver is the whole point: tenants share the frozen 491 MB base and differ by 0.22 MB each. Ten tenants cost one base plus ten slivers — version drift collapses with the multiplication.", ru: "Срез — весь смысл: арендаторы делят замороженную базу 491 MB и различаются на 0.22 MB каждый. Десять арендаторов = одна база + десять срезов — дрейф версий схлопывается вместе с умножением." },
        },
      },
      {
        id: "q2",
        q: {
          en: "The deck's six requests arrive A, B, A, B, A, B and the slot starts on A. How many swaps does FIFO pay?",
          ru: "Шесть запросов слайдов приходят A, B, A, B, A, B, слот стоит на A. Сколько переключений платит FIFO?",
        },
        answer: 5, tol: 0.5, unit: { en: "swaps", ru: "переключений" },
        hint: {
          en: "Count tenant CHANGES: A→B, B→A, A→B, B→A, A→B — every change is one declared 2 ms swap.",
          ru: "Считай СМЕНЫ арендатора: A→B, B→A, A→B, B→A, A→B — каждая смена — одни декларированные 2 ms.",
        },
        followUp: {
          q: { en: "Grouped (A, A, A, B, B, B) the same six requests pay one swap. Where did the other four swaps go?", ru: "Сгруппированные (A, A, A, B, B, B) те же шесть запросов платят одно переключение. Куда ушли другие четыре?" },
          options: [
            { en: "They became waiting: the second and third A waited for the first — the capstone prices that wait", ru: "Они стали ожиданием: второй и третий A ждали первого — капстоун оценивает и это ожидание" },
            { en: "Nowhere — grouped serving is free", ru: "Никуда — группированный сервис бесплатен" },
            { en: "They moved into the base weights", ru: "Они переехали в веса базы" },
          ],
          answer: 0,
          explain: { en: "The two-sided bill: grouping trades switches for waits. The swap count fell fivefold because requests paid with their waiting time instead — the capstone's ledger prices both sides so neither hides.", ru: "Двусторонний счёт: группировка торгует переключениями за ожидания. Счёт переключений упал впятеро, потому что запросы заплатили своим временем ожидания — ведомость капстоуна оценивает обе стороны, чтобы никакая не пряталась." },
        },
      },
      {
        id: "q3",
        q: {
          en: "Tenant B's journal slice holds wall times 1.6, 1.5 and 1.7 s. Nearest-rank p95 for tenant B — in seconds?",
          ru: "Срез журнала арендатора B держит времена 1.6, 1.5 и 1.7 s. Nearest-rank p95 арендатора B — в секундах?",
        },
        answer: 1.7, tol: 0.01, unit: { en: "s", ru: "с" },
        hint: {
          en: "Sort, then take element ceil(0.95 × 3) = 3rd — a measured request, never an interpolation.",
          ru: "Отсортируй, возьми элемент ceil(0.95 × 3) = 3-й — измеренный запрос, никогда интерполяция.",
        },
        followUp: {
          q: { en: "Why is tenant B's slice the source — not the journal as a whole?", ru: "Почему источник — срез арендатора B, а не журнал целиком?" },
          options: [
            { en: "A global p95 reports the fast tenant's health and hides B behind it — the mean-vs-tail mistake at tenant grain", ru: "Глобальный p95 покажет здоровье быстрого арендатора и спрячет B за ним — ошибка «средняя против хвоста» на зерне арендатора" },
            { en: "The whole journal is too large to sort", ru: "Журнал целиком слишком большой для сортировки" },
            { en: "Tenant slices are forbidden by the T13 protocol", ru: "Срезы арендаторов запрещены протоколом T13" },
          ],
          answer: 0,
          explain: { en: "The T13 discipline one grain finer: slice by tenant, then nearest-rank, then name the window. The promise the client experiences is per tenant — a global number averages B's pain into A's success.", ru: "Дисциплина T13 зерном тоньше: срежь по арендатору, затем nearest-rank, затем назови окно. Обещание, которое переживает клиент, — по арендаторам — глобальное число усредняет боль B в успех A." },
        },
      },
    ],
    exercises: [
      {
        id: "ex1",
        title: { en: "Exercise 1 · adapter_params: the ledger row", ru: "Упражнение 1 · adapter_params: строка ведомости" },
        brief: {
          en: "Implement <code>adapter_params(r, d, targets=4)</code> → trainable parameter count: per target matrix a LoRA update stores <code>r × (d_in + d_out)</code> numbers (the product of the two small matrices A and B), and there are <code>targets</code> matrices. The classic mistakes: doubling the factor 2 twice, or forgetting A/B entirely. Quiz q1's numbers must fall out of your one-liner.",
          ru: "Реализуй <code>adapter_params(r, d, targets=4)</code> → число обучаемых параметров: на каждую целевую матрицу LoRA-обновление хранит <code>r × (d_in + d_out)</code> чисел (произведение двух малых матриц A и B), и таких матриц <code>targets</code>. Классические ошибки: учесть множитель 2 дважды или потерять A/B совсем. Числа квиза q1 должны выпадать из твоей однострочки.",
        },
        starter: `def adapter_params(r, d, targets=4):
    """Trainable parameters of a LoRA adapter over the given projections.
    d is the hidden size (d_in == d_out == d)."""
    # TODO: per matrix r * (d_in + d_out); then multiply by targets.
`,
        tests: [
          { name: "ledger numbers and variants", hidden: true, code: `assert adapter_params(16, 896, 4) == 114688, "quiz q1's ledger row"
assert adapter_params(16, 896, 2) == 57344, "two targets halve the adapter"
assert adapter_params(8, 896, 4) == 57344, "rank 8 halves the adapter — the quality/size dial"
assert adapter_params(32, 896, 4) == 229376, "rank 32 doubles it"
assert adapter_params(4, 1024, 7) == 57344, "a different shape, same one-liner"
` },
        ],
        solution: `def adapter_params(r, d, targets=4):
    return r * (2 * d) * targets
`,
        hints: [
          { en: "d_in + d_out = 2 × d here. One multiplication line, no factor-of-2 gymnastics — the A·B product shape already put r in there.", ru: "d_in + d_out = 2 × d здесь. Одна строка умножения, без факторных танцев — форма произведения A·B уже посадила туда r." },
        ],
        numpy: false, timeoutMs: 3000,
      },
      {
        id: "ex2",
        title: { en: "Exercise 2 · count_swaps: the switch tax", ru: "Упражнение 2 · count_swaps: налог переключений" },
        brief: {
          en: "Implement <code>count_swaps(stream, start='A')</code>: walk the tenant stream, count every element that differs from the currently loaded tenant, and update the loaded tenant. The slot starts with <code>start</code> loaded — the first request is free if it matches. This is quiz q2 generalized to any stream.",
          ru: "Реализуй <code>count_swaps(stream, start='A')</code>: иди по потоку арендаторов, считай каждый элемент, отличающийся от загруженного, и обновляй загруженного. Слот стартует с <code>start</code> — первый запрос бесплатен, если совпал. Это квиз q2, обобщённый на любой поток.",
        },
        starter: `def count_swaps(stream, start='A'):
    """Count tenant changes while serving the stream from the slot state."""
    # TODO: one loop, one comparison, one update.
`,
        tests: [
          { name: "deck stream, single tenant, three tenants", hidden: true, code: `assert count_swaps(['A','B','A','B','A','B']) == 5, "the deck's worst case"
assert count_swaps(['A','A','B','A','B','B']) == 3, "quiz q2's cousin stream"
assert count_swaps(['A','A','A'], start='A') == 0, "a calm tenant never swaps"
assert count_swaps(['B','B','A'], start='A') == 2, "the free first request only if it matches start"
assert count_swaps(['C','A','B','C'], start='A') == 4, "three tenants rotate: every change pays"
` },
        ],
        solution: `def count_swaps(stream, start='A'):
    swaps, loaded = 0, start
    for t in stream:
        if t != loaded:
            swaps += 1
            loaded = t
    return swaps
`,
        hints: [
          { en: "The comparison is against the CURRENTLY loaded tenant — which changes as you serve. That is why order matters.", ru: "Сравнение с ТЕКУЩИМ загруженным — он меняется по мере сервиса. Поэтому порядок и важен." },
        ],
        numpy: false, timeoutMs: 3000,
      },
      {
        id: "ex3",
        title: { en: "Exercise 3 · affinity_batches: the window groups", ru: "Упражнение 3 · affinity_batches: группы окна" },
        brief: {
          en: "Implement <code>affinity_batches(stream, w)</code>: cut the stream into windows of <code>w</code> arrivals; inside each window, group requests by tenant in order of the tenant's FIRST appearance. Return a list of batches, each a list of tenant groups. Example: <code>['A','B','A']</code> at w = 3 → <code>[['A','A'],['B']]</code>. This is the lab's routing policy in one pure function.",
          ru: "Реализуй <code>affinity_batches(stream, w)</code>: режь поток на окна по <code>w</code> входящих запросов; внутри окна группируй запросы по арендаторам в порядке ПЕРВОГО появления. Верни список партий, каждая — список групп. Пример: <code>['A','B','A']</code> при w = 3 → <code>[['A','A'],['B']]</code>. Это политика маршрутизации лабы в одной чистой функции.",
        },
        starter: `def affinity_batches(stream, w):
    """Cut the stream into windows of w; group each window by tenant in
    first-appearance order. Returns a list of batches of tenant groups."""
    # TODO: slice windows; inside each, collect tenants in first-appearance
    # order, then emit one group per tenant.
`,
        tests: [
          { name: "windows, first-appearance order, short tail", hidden: true, code: `assert affinity_batches(['A','B','A'], 3) == [[['A','A'],['B']]], "first appearance orders the groups"
assert affinity_batches(['A','B','A'], 2) == [[['A'],['B']],[['A']]], "w = 2 slices mid-pair"
assert affinity_batches(['A','B','B','A','C','A','B','C'], 4) == [
  [['A','A'],['B','B']],
  [['C','C'],['A'],['B']],
], "the ex5 stream: two windows, groups in first-appearance order"
assert affinity_batches([], 3) == [], "an empty stream routes nothing"
` },
        ],
        solution: `def affinity_batches(stream, w):
    out = []
    for i in range(0, len(stream), w):
        window = stream[i:i + w]
        order = []
        for t in window:
            if t not in order:
                order.append(t)
        out.append([[x for x in window if x == t] for t in order])
    return out
`,
        hints: [
          { en: "Two loops: collect first-appearance order, then one list comprehension per tenant.", ru: "Два цикла: собери порядок первого появления, затем по одному list comprehension на арендатора." },
        ],
        numpy: false, timeoutMs: 3000,
      },
      {
        id: "ex4",
        title: { en: "Exercise 4 · tenant_p95: the promise per tenant", ru: "Упражнение 4 · tenant_p95: обещание по арендаторам" },
        brief: {
          en: "Implement <code>tenant_p95(entries, tenant)</code>: slice the journal to entries whose <code>tenant</code> field matches, take their <code>wall_s</code> values, and return the nearest-rank p95 — sorted, element <code>ceil(0.95 × n) − 1</code>, a measured request. The fixture is the T13 journal shape with a <code>tenant</code> field added; quiz q3's numbers fall out of it.",
          ru: "Реализуй <code>tenant_p95(entries, tenant)</code>: срежь журнал до записей с совпавшим полем <code>tenant</code>, возьми их <code>wall_s</code> и верни nearest-rank p95 — отсортировано, элемент <code>ceil(0.95 × n) − 1</code>, измеренный запрос. Фикстура — форма журнала T13 с добавленным полем tenant; числа квиза q3 из неё выпадают.",
        },
        starter: `import math

# Declared teaching journal: the T13 entry shape with a tenant field.
JOURNAL = [
    {"seq": 0, "tenant": "A", "wall_s": 0.8},
    {"seq": 1, "tenant": "B", "wall_s": 1.6},
    {"seq": 2, "tenant": "A", "wall_s": 0.8},
    {"seq": 3, "tenant": "B", "wall_s": 1.5},
    {"seq": 4, "tenant": "A", "wall_s": 0.9},
    {"seq": 5, "tenant": "B", "wall_s": 1.7},
]

def tenant_p95(entries, tenant):
    """Nearest-rank p95 of wall_s over the entries of ONE tenant."""
    # TODO: slice by tenant, sort, take element ceil(0.95 * n) - 1.
`,
        tests: [
          { name: "tenant slices, nearest-rank, empty slice", hidden: true, code: `import math
JOURNAL = [
    {"seq": 0, "tenant": "A", "wall_s": 0.8},
    {"seq": 1, "tenant": "B", "wall_s": 1.6},
    {"seq": 2, "tenant": "A", "wall_s": 0.8},
    {"seq": 3, "tenant": "B", "wall_s": 1.5},
    {"seq": 4, "tenant": "A", "wall_s": 0.9},
    {"seq": 5, "tenant": "B", "wall_s": 1.7},
]
assert abs(tenant_p95(JOURNAL, 'B') - 1.7) < 1e-9, "B's slice [1.6, 1.5, 1.7] -> rank 3 -> 1.7"
assert abs(tenant_p95(JOURNAL, 'A') - 0.9) < 1e-9, "A's slice [0.8, 0.8, 0.9] -> rank 3 -> 0.9"
big = JOURNAL + [{"seq": i, "tenant": "A", "wall_s": 0.7 + i * 0.01} for i in range(6, 26)]
v = tenant_p95(big, 'A')
assert abs(v - sorted([0.8, 0.8, 0.9] + [0.7 + i * 0.01 for i in range(6, 26)])[math.ceil(0.95 * 23) - 1]) < 1e-9, "nearest-rank scales with the slice"
try:
    tenant_p95(JOURNAL, 'C')
    assert False, "an unknown tenant must raise, not hide"
except Exception:
    pass
` },
        ],
        solution: `import math

def tenant_p95(entries, tenant):
    slice_ = sorted(e["wall_s"] for e in entries if e.get("tenant") == tenant)
    if not slice_:
        raise ValueError("no entries for tenant " + str(tenant))
    return slice_[math.ceil(0.95 * len(slice_)) - 1]
`,
        hints: [
          { en: "Slice FIRST, then sort — mixing tenants is the mean-vs-tail mistake again.", ru: "Сначала срез, потом сортировка — смешать арендаторов — снова ошибка «средняя против хвоста»." },
          { en: "ceil(0.95 × 3) = 3: the 3rd sorted value. The measured request, not an interpolation.", ru: "ceil(0.95 × 3) = 3: 3-е отсортированное значение. Измеренный запрос, а не интерполяция." },
        ],
        numpy: false, timeoutMs: 3000,
      },
      {
        id: "ex5",
        title: { en: "Capstone · AdapterSim: the two-sided ledger", ru: "Капстоун · AdapterSim: двусторонняя ведомость" },
        brief: {
          en: "Implement <code>adaptersim(stream, w, start='A')</code>: route the stream in affinity windows of <code>w</code> (reuse your ex3 grouping), count swaps exactly like ex2 (the loaded tenant carries ACROSS windows), and count <code>waited</code> — every request behind the first in its group. Return <code>{\"swaps\": …, \"waited\": …}</code>. The declared stream is the deck's six requests; the declared dial table on slide 12 is your answer key — your function must reproduce every row.",
          ru: "Реализуй <code>adaptersim(stream, w, start='A')</code>: маршрутизируй поток affinity-окнами по <code>w</code> (переиспользуй группировку ex3), считай переключения ровно как ex2 (загруженный арендатор несётся ЧЕРЕЗ окна), и считай <code>waited</code> — каждый запрос позади первого в своей группе. Верни <code>{&quot;swaps&quot;: …, &quot;waited&quot;: …}</code>. Декларированный поток — шесть запросов слайдов; таблица диска на слайде 12 — твой ключ ответов — твоя функция обязана воспроизвести каждую строку.",
        },
        starter: `# The deck's declared stream: six requests, two tenants.
STREAM = ['A', 'B', 'A', 'B', 'A', 'B']

def adaptersim(stream, w, start='A'):
    """Route the stream in affinity windows of w.
    Returns {"swaps": int, "waited": int}; the loaded tenant carries across windows."""
    # TODO: windows -> groups (ex3); swaps (ex2 logic across the whole stream);
    # waited = every request behind the first of its group.
`,
        tests: [
          { name: "every dial row of slide 12, plus the degenerate ends", hidden: true, code: `STREAM = ['A', 'B', 'A', 'B', 'A', 'B']
r1 = adaptersim(STREAM, 1)
assert r1 == {"swaps": 5, "waited": 0}, "W = 1 is FIFO: all switching, no waiting"
r3 = adaptersim(STREAM, 3)
assert r3 == {"swaps": 2, "waited": 2}, "W = 3 trades: 2 swaps, 2 waited — the dial's green row"
r6 = adaptersim(STREAM, 6)
assert r6 == {"swaps": 1, "waited": 4}, "W = 6 is one tenant batch: 1 swap, 4 waited"
r4 = adaptersim(STREAM, 4)
assert r4 == {"swaps": 3, "waited": 2}, "the mixed middle row"
assert adaptersim([], 3) == {"swaps": 0, "waited": 0}, "an empty stream pays nothing"
` },
        ],
        solution: `def adaptersim(stream, w, start='A'):
    swaps, waited, loaded = 0, 0, start
    for i in range(0, len(stream), w):
        window = stream[i:i + w]
        order = []
        for t in window:
            if t not in order:
                order.append(t)
        for t in order:
            group = [x for x in window if x == t]
            if t != loaded:
                swaps += 1
                loaded = t
            waited += len(group) - 1
    return {"swaps": swaps, "waited": waited}
`,
        hints: [
          { en: "The loaded tenant carries ACROSS windows — a batch whose first tenant differs from the previous window's last pays a swap.", ru: "Загруженный арендатор несётся ЧЕРЕЗ окна — партия, чей первый арендатор отличается от последнего в прошлом окне, платит переключение." },
          { en: "Reuse ex3's grouping and ex2's swap logic; the ledger adds only the waited column.", ru: "Переиспользуй группировку ex3 и логику переключений ex2; ведомость добавляет только колонку ожидавших." },
        ],
        numpy: false, timeoutMs: 5000,
      },
    ],
    challenge: {
      id: "challenge",
      word: { en: "challenge", ru: "челлендж" },
      title: { en: "★ Tune the window: both lines hold, one dial", ru: "★ Настрой окно: обе линии держатся, один диск" },
      brief: {
        en: "The declared six-request stream, one decision open: the window W. Choose W from {1, 2, 3, 4, 5, 6} so that on STREAM the run <strong>holds both declared lines</strong>: swaps ≤ 2 AND waited ≤ 4, with W ≤ 4 (a request may wait at most W − 1 for its group). Print one line: <code>W=&lt;value&gt;</code>. The page replays the declared router arithmetic and rejects invented numbers; the table on slide 12 is your answer key, and only one W passes both lines at this bound.",
        ru: "Декларированный поток из шести запросов, одно решение открыто: окно W. Выбери W из {1, 2, 3, 4, 5, 6} так, чтобы на STREAM прогон <strong>держал обе декларированные линии</strong>: переключения ≤ 2 И ожидавшие ≤ 4, при W ≤ 4 (запрос может ждать не более W − 1 до своей группы). Напечатай одну строку: <code>W=&lt;значение&gt;</code>. Страница переигрывает декларированную арифметику роутера и отвергает выдуманные числа; таблица на слайде 12 — твой ключ ответов, и только одно W проходит обе линии при этой границе.",
      },
      goal: { en: "Print one line: W=<from 1..6> — on STREAM: swaps ≤ 2, waited ≤ 4, W ≤ 4.", ru: "Напечатай одну строку: W=<из 1..6> — на STREAM: переключения ≤ 2, ожидавшие ≤ 4, W ≤ 4." },
      mode: "run", numpy: false, timeoutMs: 5000,
      starter: `# STREAM: the declared six-request stream (two tenants), exactly the
# sequence the page-side replay uses.
STREAM = ['A', 'B', 'A', 'B', 'A', 'B']
# Declared model (page-side recompute uses exactly this):
#   windows of W arrivals, grouped by tenant in first-appearance order;
#   a swap = serving a tenant that differs from the loaded one (costs 2 ms);
#   the loaded tenant carries across windows;
#   waited = every request behind the first of its group.
# Grid: W in {1, 2, 3, 4, 5, 6}; declared lines: swaps <= 2, waited <= 4, W <= 4.
# Print exactly one line, e.g.: W=2

# TODO: reason about which W collapses the A/B alternation into tenant
# batches without paying waiting beyond the declared line.
`,
      check: (res) => {
        const out = String(res.stdout || "");
        const m = out.match(/W\s*=\s*([0-9]+)/);
        if (!m) return { ok: false, note: { en: "Print one line: W=<value>.", ru: "Напечатай одну строку: W=<значение>." } };
        const w = Number(m[1]);
        if (![1,2,3,4,5,6].includes(w)) return { ok: false, note: { en: "W must come from the declared grid {1, 2, 3, 4, 5, 6}.", ru: "W должно прийти из декларированной сетки {1, 2, 3, 4, 5, 6}." } };
        const stream = ['A', 'B', 'A', 'B', 'A', 'B'];
        let swaps = 0, waited = 0, loaded = 'A';
        for (let i = 0; i < stream.length; i += w) {
          const window = stream.slice(i, i + w);
          const order = [];
          for (const t of window) if (!order.includes(t)) order.push(t);
          for (const t of order) {
            const group = window.filter(x => x === t);
            if (t !== loaded) { swaps += 1; loaded = t; }
            waited += group.length - 1;
          }
        }
        const verdict = "swaps " + swaps + ", waited " + waited;
        if (swaps > 2 || waited > 4) return { ok: false, note: { en: "W = " + w + " gives " + verdict + " — the declared lines are swaps ≤ 2 AND waited ≤ 4.", ru: "W = " + w + " даёт " + verdict + " — декларированные линии: переключения ≤ 2 И ожидавшие ≤ 4." } };
        if (w > 4) return { ok: false, note: { en: "W = " + w + " holds the counts but breaks the bound W ≤ 4 — a request may wait at most W − 1.", ru: "W = " + w + " держит счётчики, но ломает границу W ≤ 4 — запрос может ждать не более W − 1." } };
        return { ok: true, note: { en: "W = " + w + " gives swaps " + swaps + ", waited " + waited + " — both declared lines hold and the window stays bounded. This is routing design: one dial, two named lines, nothing invented.", ru: "W = " + w + " даёт переключений " + swaps + ", ожидавших " + waited + " — обе декларированные линии держатся, окно ограничено. Это дизайн маршрутизации: один диск, две поименованные линии, ничего выдуманного." } };
      },
      reference: `# The unique grid answer, and why:
#   W = 1, 2 -> the A/B alternation survives: 5 swaps
#   W = 3    -> [A,B,A] groups [A,A],[B]; [B,A,B] groups [B,B],[A] -> 2 swaps, 2 waited
#   W = 4    -> 3 swaps (the middle window breaks the collapse)
#   W = 5, 6 -> counts hold but break the declared bound W <= 4
# So the only W passing swaps <= 2, waited <= 4 AND W <= 4 is 3.
print("W=3")
`,
    },
    runtime: {
      title: {
        en: "Route the live journal: your own layer-2 gateway",
        ru: "Маршрутизируй живой журнал: свой шлюз слой-2",
      },
      brief: {
        en: "Everything above ran on a <strong>declared teaching model</strong>. Connect the practice runtime (<code>docker compose up -d</code>, gateway at <code>127.0.0.1:8760</code>), make measurements tagged with your tenant names — and the routing ledger goes live: your journal carries the tenant field, the slice-and-p95 arithmetic runs on real entries, and the swap count is your own machine's. Machine-local and honest; offline, this section says so and the declared fixture stays the grading surface.",
        ru: "Всё выше работало на <strong>декларированной учебной модели</strong>. Подключи practice-рантайм (<code>docker compose up -d</code>, шлюз на <code>127.0.0.1:8760</code>), сделай измерения с именами своих арендаторов — и ведомость маршрутизации оживёт: в твоём журнале есть поле арендатора, арифметика срезов и p95 идёт по реальным записям, а счёт переключений — твоей машины. Машинно-локально и честно; офлайн секция говорит об этом прямо, и декларированная фикстура остаётся оцениваемой поверхностью.",
      },
      experimentPrompt: {
        en: "Run two measurements per tenant, then check the per-tenant p95 table against your own journal — slices, not averages.",
        ru: "Сделай по два измерения на арендатора, затем сверь таблицу p95 арендаторов с собственным журналом — срезы, а не средние.",
      },
      footer: {
        en: "The live journal is yours and machine-local; the declared fixture stays the grading surface. If the runtime is offline, this section says so honestly — nothing here pretends.",
        ru: "Живой журнал — твой и машинно-локальный; декларированная фикстура остаётся оцениваемой поверхностью. Если рантайм офлайн, этот раздел говорит об этом честно — ничего здесь не притворяется.",
      },
    },
    posttest: [
      {
        id: "p1",
        q: { en: "A tenant asks the adapter for a longer context window. The honest answer…", ru: "Арендатор просит адаптер дать длиннее контекстное окно. Честный ответ…" },
        options: [
          { en: "the adapter changes the tenant delta, not the base contract — context width is shared by every tenant and an adapter cannot widen it", ru: "адаптер меняет дельту арендатора, а не контракт базы — ширина контекста общая для всех, и адаптер не может её расширить" },
          { en: "sure — a bigger rank widens the context", ru: "конечно — больший ранг расширяет контекст" },
          { en: "each tenant already ships its own tokenizer", ru: "каждый арендатор уже возит свой токенизатор" },
        ],
        answer: 0,
        explain: { en: "The frozen base is the shared contract: tokenizer, context width, cutoff knowledge. The adapter is the tenant DELTA — measured, small, and powerless beyond the base's physics.", ru: "Замороженная база — общий контракт: токенизатор, ширина контекста, знания cutoff. Адаптер — ДЕЛЬТА арендатора — измеренная, маленькая и беспомощная за пределами физики базы." },
      },
      {
        id: "p2",
        q: { en: "Two tenants share a journal. Why is ONE global p95 wrong for their promises?", ru: "Два арендатора делят журнал. Почему ОДИН глобальный p95 неверен для их обещаний?" },
        options: [
          { en: "it reports the fast tenant's health and hides the slow tenant — the T13 mean-vs-tail mistake at tenant grain; the promise is per tenant, nearest-rank per slice", ru: "он показывает здоровье быстрого и прячет медленного — ошибка T13 «средняя против хвоста» на зерне арендатора; обещание по арендаторам, nearest-rank по срезам" },
          { en: "a global p95 is fine — the tenants share the base anyway", ru: "глобальный p95 нормален — арендаторы и так делят базу" },
          { en: "global percentiles are forbidden by the invariant protocol", ru: "глобальные перцентили запрещены инвариантным протоколом" },
        ],
        answer: 0,
        explain: { en: "Slice by tenant, then nearest-rank, then name the window: the client's experience is per tenant, and a global number averages B's pain into A's success.", ru: "Срежь по арендатору, затем nearest-rank, затем назови окно: опыт клиента — по арендаторам, а глобальное число усредняет боль B в успех A." },
      },
      {
        id: "p3",
        q: { en: "Grouping the six-request stream cut swaps from 5 to 1. What paid for it?", ru: "Группировка потока из шести запросов срезала переключения с 5 до 1. Что за это заплатило?" },
        options: [
          { en: "waiting: the second and third request of each tenant group waited behind the first — the two-sided ledger prices both sides", ru: "ожидание: второй и третий запросы каждой группы ждали позади первого — двусторонняя ведомость оценивает обе стороны" },
          { en: "nothing — the base absorbed it", ru: "ничего — база поглотила" },
          { en: "the adapters shrank", ru: "адаптеры уменьшились" },
        ],
        answer: 0,
        explain: { en: "No policy is free: FIFO pays the switch tax, tenant batches pay waits. The window W is the dial between the two — and the declared lines make the choice checkable.", ru: "Никакая политика не бесплатна: FIFO платит налогом переключений, партии арендаторов — ожиданиями. Окно W — диск между ними — и декларированные линии делают выбор проверяемым." },
      },
      {
        id: "b1",
        tag: { en: "bridge · T13", ru: "мост · T13" },
        q: { en: "The tenant p95 you computed here is trustworthy because…", ru: "p95 арендатора, который ты считал здесь, заслуживает доверия, потому что…" },
        options: [
          { en: "it slices the same hash-chained journal T13 verified — an edited entry would fail the chain before it poisoned the percentile", ru: "он режет тот же хэш-цепочечный журнал, что верифицировала T13 — правленая запись упадёт на цепочке раньше, чем отравит перцентиль" },
          { en: "it uses the mean instead of the p95", ru: "он использует среднюю вместо p95" },
          { en: "it came from the judge's spreadsheet", ru: "он пришёл из таблицы джаджа" },
        ],
        answer: 0,
        explain: { en: "The journal is the instrument: append-only, hash-sealed, verified before aggregation. The tenant slice inherits that proof — fairness claims stay auditable because the chain keeps the history honest.", ru: "Журнал — инструмент: append-only, запечатан хэшами, верифицирован до агрегации. Срез арендатора наследует это доказательство — заявления о справедливости остаются аудируемыми, потому что цепочка держит историю честной." },
      },
    ],
    footer: {
      en: "Declared teaching model of a multi-tenant serving layer: the tenant stream, the 2 ms swap cost and the adapter quality deltas are declared arithmetic over the LoRA rank formula (arXiv 2106.09685) and the deck's six-request stream; the journal canonical form is the real layer-2 gateway's (runtime/gateway/app.py). S-LoRA and Punica are cited as the real-systems line our flat swap cost omits. The live journal you can connect in the Layer-2 section is your own and machine-local.",
      ru: "Декларированная учебная модель мультитенантного слоя сервинга: поток арендаторов, цена переключения 2 ms и дельты качества адаптеров — декларированная арифметика над формулой ранга LoRA (arXiv 2106.09685) и потоком из шести запросов слайдов; каноническая форма журнала — настоящая, от шлюза слой-2 (runtime/gateway/app.py). S-LoRA и Punica цитируются как линия реальных систем, которую наша плоская цена переключения опускает. Живой журнал, который можно подключить в секции Layer-2, — твой собственный и машинно-локальный.",
    },
  };
  window.LABS_CONTENT = LABS_CONTENT;
})();
