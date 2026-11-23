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
      ru: `<p>Тема 13 учила измерять обещания по{NB}окнам; эта{NB}тема делит тот{NB}же журнал по{NB}<strong>арендаторам</strong>. Одна{NB}замороженная база обслуживает многих через{NB}маленькие LoRA-адаптеры, и{NB}каждое{NB}число здесь — декларированная учебная модель: арифметика ранга точна, цена переключения 2{NB}ms — декларированная ручка, поток арендаторов — шесть запросов деки плюс диск окна звёздного челленджа.</p>
<p>Двусторонний счёт — хребет: <strong>переключения</strong> (2{NB}ms{NB}за{NB}смену арендатора, зависят от{NB}порядка) против <strong>ожиданий</strong> (запросы, удержанные для{NB}своей{NB}affinity-группы). FIFO платит всем{NB}переключениями; очереди с{NB}привязкой — всем{NB}ожиданием; affinity-окно W торгует между{NB}ними. p95 арендатора — nearest-rank по{NB}его{NB}собственному срезу журнала — это{NB}дисциплина T13 зерном тоньше, и{NB}именно это{NB}обещание окно обязано защищать.</p>`,
    },
    heroTag: { en: "LoRA ledger, swaps, tenant p95", ru: "ведомость LoRA, переключения, p95 арендатора" },
    glossary: [
      [{ en: "LoRA adapter", ru: "LoRA-адаптер" }, { en: "a small per-tenant weight update (two low-rank matrices per target projection); the frozen base never changes.", ru: "маленькое пер-арендаторское обновление весов (две low-rank матрицы на{NB}проекцию); замороженная база никогда не{NB}меняется." }],
      [{ en: "rank r", ru: "ранг r" }, { en: "the quality/size dial: r = 16 halves to 8 with most of the delta — measured, not assumed.", ru: "ручка качества/размера: r{NB}= 16 уменьшается до{NB}8 с{NB}большей частью дельты — измеряется, а{NB}не{NB}предполагается." }],
      [{ en: "adapter size", ru: "размер адаптера" }, { en: "params = 2 · r · (din + dout) · targets; fp16 doubles the bytes.", ru: "params = 2 · r · (din + dout) · targets; fp16 удваивает байты." }],
      [{ en: "swap", ru: "переключение" }, { en: "loading a different tenant's adapter onto the slot; declared cost 2 ms in this model.", ru: "загрузка чужого адаптера на{NB}слот; декларированная цена в{NB}этой{NB}модели 2{NB}ms." }],
      [{ en: "affinity window", ru: "affinity-окно" }, { en: "a window of W arrivals, grouped by tenant inside; W trades waits against swaps.", ru: "окно из{NB}W{NB}пришельцев, сгруппированных внутри; W торгует ожидания против переключений." }],
      [{ en: "tenant slice", ru: "срез арендатора" }, { en: "the journal entries whose tenant field matches — the only source for the tenant's promise.", ru: "записи журнала с{NB}совпавшим полем{NB}tenant — единственный источник обещания арендатора." }],
      [{ en: "tenant p95", ru: "p95 арендатора" }, { en: "nearest-rank p95 over the tenant slice, window named — the T13 discipline one grain finer.", ru: "nearest-rank p95 по{NB}срезу арендатора, окно названо — дисциплина T13 зерном тоньше." }],
      [{ en: "FIFO", ru: "FIFO" }, { en: "serve in arrival order: honest to arrivals, brutal to switches.", ru: "сервис в{NB}порядке прихода: честно к{NB}приходам, жестоко к{NB}переключениям." }],
      [{ en: "tenant-pinned queues", ru: "очереди с{NB}привязкой" }, { en: "one queue per tenant: minimal swaps, real head-of-line waiting for small tenants.", ru: "очередь на{NB}арендатора: минимум переключений, реальное ожидание в{NB}очереди для{NB}малых арендаторов." }],
      [{ en: "waited", ru: "ожидавшие" }, { en: "requests served behind the first of their affinity group — the second side of the two-sided bill.", ru: "запросы, обслуженные позади первого в{NB}своей{NB}affinity-группе — вторая сторона двустороннего счёта." }],
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
    <text x="70" y="190" font-size="15" fill="var(--lab-ink)" data-en="every tenant change = 1 swap (declared 2 ms)" data-ru="каждая{NB}смена{NB}арендатора{NB}={NB}1{NB}переключение{NB}(декларированные{NB}2{NB}ms)">every tenant change = 1 swap (declared 2 ms)</text>
    <text x="70" y="232" font-size="30" fill="var(--fig-warm)" class="mono">FIFO: A→B→A→B→A→B = 5 swaps</text>
    <text x="70" y="280" font-size="30" fill="var(--lab-good)" class="mono">grouped: AAA|BBB = 1 swap</text>
  </g>
  <g id="g-ledger">
    <rect x="70" y="316" width="636" height="66" rx="9" fill="var(--lab-good)" opacity="0.14"/>
    <text x="90" y="348" font-size="14" fill="var(--lab-ink)" data-en="same load, same order inside each tenant — the bill differs fivefold" data-ru="та{NB}же{NB}нагрузка, тот{NB}же{NB}порядок{NB}внутри{NB}арендатора — счёт{NB}разнится{NB}впятеро">same load, same order inside each tenant — the bill differs fivefold</text>
    <text x="90" y="372" font-size="14" fill="var(--lab-muted)" data-en="the missing 4 swaps did not vanish: they became waiting — the capstone prices both" data-ru="недостающие{NB}4{NB}переключения{NB}не{NB}исчезли:{NB}они{NB}стали{NB}ожиданием —{NB}капстоун{NB}оценивает{NB}оба{NB}бока">the missing 4 swaps did not vanish: they became waiting — the capstone prices both</text>
  </g>
</svg>`,
        stages: [
          { cap: { en: "The deck's six requests: A and B alternate — the worst case for switches.", ru: "Шесть запросов деки: A и{NB}B{NB}чередуются — худший{NB}случай для{NB}переключений." }, show: ["g-stream", "g-count"] },
          { cap: { en: "Grouping collapses 5 swaps to 1 — and the ribbon names where the other four went.", ru: "Группировка сжимает 5{NB}переключений до{NB}1 — и{NB}лента{NB}называет, куда{NB}ушли{NB}другие{NB}четыре." }, show: ["g-stream", "g-count", "g-ledger"] },
        ],
      },
      {
        id: "lab14-window",
        title: { en: "The window dial: W trades waits against swaps", ru: "Диск окна: W торгует ожидания против переключений" },
        w: 760, h: 420,
        svg: `<svg viewBox="0 0 760 420" xmlns="http://www.w3.org/2000/svg">
  <g id="g-dial">
    <text x="70" y="76" font-size="15" fill="var(--lab-ink)" data-en="window W = 1 → FIFO: all switching" data-ru="окно{NB}W{NB}={NB}1{NB}→{NB}FIFO:{NB}всё{NB}переключениями">window W = 1 → FIFO: all switching</text>
    <text x="70" y="118" font-size="15" fill="var(--lab-ink)" data-en="window W = 6 → one tenant batch: all waiting" data-ru="окно{NB}W{NB}={NB}6{NB}→{NB}одна{NB}партия:{NB}всё{NB}ожиданием">window W = 6 → one tenant batch: all waiting</text>
    <text x="70" y="160" font-size="15" fill="var(--lab-ink)" data-en="between them: the wait has a ceiling (W − 1) and the swaps have a budget" data-ru="между{NB}ними:{NB}у{NB}ожидания{NB}потолок{NB}(W{NB}−{NB}1),{NB}у{NB}переключений{NB}бюджет">between them: the wait has a ceiling (W − 1) and the swaps have a budget</text>
  </g>
  <g id="g-table">
    <text x="70" y="216" font-size="14" fill="var(--lab-muted)" class="mono" data-en="W    swaps   waited" data-ru="W    переключ.   ожидавших">W    swaps   waited</text>
    <text x="70" y="254" font-size="15" fill="var(--lab-ink)" class="mono">1      5        0</text>
    <text x="70" y="290" font-size="15" fill="var(--lab-good)" class="mono">3      2        2</text>
    <text x="70" y="326" font-size="15" fill="var(--lab-ink)" class="mono">4      3        2</text>
    <text x="70" y="362" font-size="15" fill="var(--lab-ink)" class="mono">6      1        4</text>
    <text x="260" y="290" font-size="14" fill="var(--lab-good)" data-en="W = 3 passes both declared lines" data-ru="W{NB}={NB}3{NB}проходит{NB}обе{NB}декларированные{NB}линии">W = 3 passes both declared lines</text>
  </g>
  <g id="g-lines">
    <rect x="70" y="384" width="636" height="30" rx="8" fill="var(--lab-accent)" opacity="0.14"/>
    <text x="86" y="405" font-size="14" fill="var(--lab-ink)" data-en="declared lines: swaps ≤ 2, waited ≤ 4, W ≤ 4 — the star challenge walks this dial" data-ru="декларированные{NB}линии:{NB}переключения{NB}≤{NB}2,{NB}ожидавшие{NB}≤{NB}4,{NB}W{NB}≤{NB}4{NB}—{NB}их{NB}проходит{NB}звёздный{NB}челлендж">declared lines: swaps ≤ 2, waited ≤ 4, W ≤ 4 — the star challenge walks this dial</text>
  </g>
</svg>`,
        stages: [
          { cap: { en: "The two degenerate policies: W = 1 is FIFO, W = 6 is one big tenant batch.", ru: "Две{NB}вырожденные{NB}политики:{NB}W{NB}={NB}1{NB}—{NB}FIFO,{NB}W{NB}={NB}6{NB}—{NB}одна{NB}большая{NB}партия." }, show: ["g-dial"] },
          { cap: { en: "The dial table on the declared six-request stream: every W prices both sides.", ru: "Таблица{NB}диска{NB}на{NB}декларированном{NB}потоке{NB}из{NB}шести{NB}запросов:{NB}каждое{NB}W{NB}оценивает{NB}обе{NB}стороны." }, show: ["g-dial", "g-table"] },
          { cap: { en: "The declared lines make the star challenge unique: only W = 3 passes both.", ru: "Декларированные{NB}линии{NB}делают{NB}звёздный{NB}челлендж{NB}единственным:{NB}только{NB}W{NB}={NB}3{NB}проходит{NB}обе." }, show: ["g-dial", "g-table", "g-lines"] },
        ],
      },
    ],

    scenario: null,
    quizzes: [
      {
        id: "q1",
        q: {
          en: "Rank r = 16, hidden size d = 896, four target matrices, fp16. How many trainable parameters does one LoRA adapter carry?",
          ru: "Ранг r{NB}= 16, скрытый размер d{NB}= 896, четыре целевые матрицы, fp16. Сколько обучаемых параметров в{NB}одном{NB}LoRA-адаптере?",
        },
        answer: 114688, tol: 0.5, unit: { en: "params", ru: "параметров" },
        hint: {
          en: "Per matrix: r × (din + dout) = 16 × 1792; four matrices; the factor 2 (A and B) is already inside r × (din + dout) — do not double it again.",
          ru: "На{NB}матрицу:{NB}r{NB}×{NB}(din{NB}+{NB}dout){NB}={NB}16{NB}×{NB}1792;{NB}четыре{NB}матрицы;{NB}множитель{NB}2{NB}(A{NB}и{NB}B){NB}уже{NB}внутри{NB}r{NB}×{NB}(din{NB}+{NB}dout){NB}—{NB}не{NB}удваивай{NB}его{NB}снова.",
        },
        followUp: {
          q: { en: "In fp16 this is 229 376 B ≈ 0.22 MB. What does that size buy the fleet?", ru: "В{NB}fp16 это{NB}229{NB}376{NB}B ≈ 0.22{NB}MB. Что{NB}такой{NB}размер{NB}даёт{NB}флоту?" },
          options: [
            { en: "Every tenant adds 0.05 % of the base instead of a full 491 MB copy — the multiplication collapses", ru: "Каждый{NB}арендатор{NB}добавляет{NB}0.05 %{NB}базы{NB}вместо{NB}полной{NB}копии{NB}на{NB}491{NB}MB{NB}—{NB}умножение{NB}схлопывается" },
            { en: "The base gets smaller too", ru: "База тоже уменьшается" },
            { en: "Nothing — adapters are only for training", ru: "Ничего — адаптеры только для{NB}обучения" },
          ],
          answer: 0,
          explain: { en: "The sliver is the whole point: tenants share the frozen 491 MB base and differ by 0.22 MB each. Ten tenants cost one base plus ten slivers — version drift collapses with the multiplication.", ru: "Срез — весь{NB}смысл:{NB}арендаторы{NB}делят{NB}замороженную{NB}базу{NB}491{NB}MB{NB}и{NB}различаются{NB}на{NB}0.22{NB}MB{NB}каждый.{NB}Десять{NB}арендаторов{NB}= одна{NB}база{NB}+ десять{NB}срезов{NB}—{NB}дрейф{NB}версий{NB}схлопывается{NB}вместе{NB}с{NB}умножением." },
        },
      },
      {
        id: "q2",
        q: {
          en: "The deck's six requests arrive A, B, A, B, A, B and the slot starts on A. How many swaps does FIFO pay?",
          ru: "Шесть{NB}запросов{NB}деки{NB}приходят{NB}A,{NB}B,{NB}A,{NB}B,{NB}A,{NB}B,{NB}слот{NB}стоит{NB}на{NB}A.{NB}Сколько{NB}переключений{NB}платит{NB}FIFO?",
        },
        answer: 5, tol: 0.5, unit: { en: "swaps", ru: "переключений" },
        hint: {
          en: "Count tenant CHANGES: A→B, B→A, A→B, B→A, A→B — every change is one declared 2 ms swap.",
          ru: "Считай{NB}СМЕНЫ{NB}арендатора:{NB}A→B,{NB}B→A,{NB}A→B,{NB}B→A,{NB}A→B{NB}—{NB}каждая{NB}смена{NB}—{NB}одни{NB}декларированные{NB}2{NB}ms.",
        },
        followUp: {
          q: { en: "Grouped (A, A, A, B, B, B) the same six requests pay one swap. Where did the other four swaps go?", ru: "Сгруппированные{NB}(A,{NB}A,{NB}A,{NB}B,{NB}B,{NB}B){NB}те{NB}же{NB}шесть{NB}запросов{NB}платят{NB}одно{NB}переключение.{NB}Куда{NB}ушли{NB}другие{NB}четыре?" },
          options: [
            { en: "They became waiting: the second and third A waited for the first — the capstone prices that wait", ru: "Они{NB}стали{NB}ожиданием:{NB}второй{NB}и{NB}третий{NB}A{NB}ждали{NB}первого{NB}—{NB}капстоун{NB}оценивает{NB}и{NB}это{NB}ожидание" },
            { en: "Nowhere — grouped serving is free", ru: "Никуда — группированный{NB}сервис{NB}бесплатен" },
            { en: "They moved into the base weights", ru: "Они{NB}переехали{NB}в{NB}веса{NB}базы" },
          ],
          answer: 0,
          explain: { en: "The two-sided bill: grouping trades switches for waits. The swap count fell fivefold because requests paid with their waiting time instead — the capstone's ledger prices both sides so neither hides.", ru: "Двусторонний{NB}счёт:{NB}группировка{NB}торгует{NB}переключениями{NB}за{NB}ожидания.{NB}Счёт{NB}переключений{NB}упал{NB}впятеро,{NB}потому{NB}что{NB}запросы{NB}заплатили{NB}своим{NB}временем{NB}ожидания{NB}—{NB}ведомость{NB}капстоуна{NB}оценивает{NB}обе{NB}стороны,{NB}чтобы{NB}никакая{NB}не{NB}пряталась." },
        },
      },
      {
        id: "q3",
        q: {
          en: "Tenant B's journal slice holds wall times 1.6, 1.5 and 1.7 s. Nearest-rank p95 for tenant B — in seconds?",
          ru: "Срез{NB}журнала{NB}арендатора{NB}B{NB}держит{NB}времена{NB}1.6,{NB}1.5{NB}и{NB}1.7{NB}s.{NB}Nearest-rank{NB}p95{NB}арендатора{NB}B{NB}—{NB}в{NB}секундах?",
        },
        answer: 1.7, tol: 0.01, unit: { en: "s", ru: "с" },
        hint: {
          en: "Sort, then take element ceil(0.95 × 3) = 3rd — a measured request, never an interpolation.",
          ru: "Отсортируй,{NB}возьми{NB}элемент{NB}ceil(0.95{NB}×{NB}3){NB}={NB}3-й{NB}—{NB}измеренный{NB}запрос,{NB}никогда{NB}интерполяция.",
        },
        followUp: {
          q: { en: "Why is tenant B's slice the source — not the journal as a whole?", ru: "Почему{NB}источник{NB}—{NB}срез{NB}арендатора{NB}B,{NB}а{NB}не{NB}журнал{NB}целиком?" },
          options: [
            { en: "A global p95 reports the fast tenant's health and hides B behind it — the mean-vs-tail mistake at tenant grain", ru: "Глобальный{NB}p95{NB}покажет{NB}здоровье{NB}быстрого{NB}арендатора{NB}и{NB}спрячет{NB}B{NB}за{NB}ним{NB}—{NB}ошибка{NB}«средняя{NB}против{NB}хвоста»{NB}на{NB}зерне{NB}арендатора" },
            { en: "The whole journal is too large to sort", ru: "Журнал{NB}целиком{NB}слишком{NB}большой{NB}для{NB}сортировки" },
            { en: "Tenant slices are forbidden by the T13 protocol", ru: "Срезы{NB}арендаторов{NB}запрещены{NB}протоколом{NB}T13" },
          ],
          answer: 0,
          explain: { en: "The T13 discipline one grain finer: slice by tenant, then nearest-rank, then name the window. The promise the client experiences is per tenant — a global number averages B's pain into A's success.", ru: "Дисциплина{NB}T13{NB}зерном{NB}тоньше:{NB}срежь{NB}по{NB}арендатору,{NB}затем{NB}nearest-rank,{NB}затем{NB}назови{NB}окно.{NB}Обещание,{NB}которое{NB}переживает{NB}клиент,{NB}—{NB}по{NB}арендаторам{NB}—{NB}глобальное{NB}число{NB}усредняет{NB}боль{NB}B{NB}в{NB}успех{NB}A." },
        },
      },
    ],
    exercises: [
      {
        id: "ex1",
        title: { en: "Exercise 1 · adapter_params: the ledger row", ru: "Упражнение 1 · adapter_params: строка ведомости" },
        brief: {
          en: "Implement <code>adapter_params(r, d, targets=4)</code> → trainable parameter count: per target matrix a LoRA update stores <code>r × (d_in + d_out)</code> numbers (the product of the two small matrices A and B), and there are <code>targets</code> matrices. The classic mistakes: doubling the factor 2 twice, or forgetting A/B entirely. Quiz q1's numbers must fall out of your one-liner.",
          ru: "Реализуй <code>adapter_params(r, d, targets=4)</code> → число обучаемых параметров: на{NB}каждую{NB}целевую{NB}матрицу{NB}LoRA-обновление{NB}хранит{NB}<code>r{NB}×{NB}(d_in{NB}+{NB}d_out)</code>{NB}чисел{NB}(произведение{NB}двух{NB}малых{NB}матриц{NB}A{NB}и{NB}B),{NB}и{NB}таких{NB}матриц{NB}<code>targets</code>.{NB}Классические{NB}ошибки:{NB}учесть{NB}множитель{NB}2{NB}дважды{NB}или{NB}потерять{NB}A/B{NB}совсем.{NB}Числа{NB}квиза{NB}q1{NB}должны{NB}выпадать{NB}из{NB}твоей{NB}однострочки.",
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
          { en: "d_in + d_out = 2 × d here. One multiplication line, no factor-of-2 gymnastics — the A·B product shape already put r in there.", ru: "d_in + d_out = 2 × d{NB}здесь.{NB}Одна{NB}строка{NB}умножения,{NB}без{NB}факторных{NB}танцев{NB}—{NB}форма{NB}произведения{NB}A·B{NB}уже{NB}посадила{NB}туда{NB}r." },
        ],
        numpy: false, timeoutMs: 3000,
      },
      {
        id: "ex2",
        title: { en: "Exercise 2 · count_swaps: the switch tax", ru: "Упражнение 2 · count_swaps: налог переключений" },
        brief: {
          en: "Implement <code>count_swaps(stream, start='A')</code>: walk the tenant stream, count every element that differs from the currently loaded tenant, and update the loaded tenant. The slot starts with <code>start</code> loaded — the first request is free if it matches. This is quiz q2 generalized to any stream.",
          ru: "Реализуй <code>count_swaps(stream, start='A')</code>: иди по{NB}потоку{NB}арендаторов, считай{NB}каждый{NB}элемент, отличающийся{NB}от{NB}загруженного,{NB}и{NB}обновляй{NB}загруженного.{NB}Слот{NB}стартует{NB}с{NB}<code>start</code>{NB}—{NB}первый{NB}запрос{NB}бесплатен,{NB}если{NB}совпал.{NB}Это{NB}квиз{NB}q2,{NB}обобщённый{NB}на{NB}любой{NB}поток.",
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
          { en: "The comparison is against the CURRENTLY loaded tenant — which changes as you serve. That is why order matters.", ru: "Сравнение{NB}с{NB}ТЕКУЩИМ{NB}загруженным{NB}—{NB}он{NB}меняется{NB}по{NB}мере{NB}сервиса.{NB}Поэтому{NB}порядок{NB}и{NB}важен." },
        ],
        numpy: false, timeoutMs: 3000,
      },
      {
        id: "ex3",
        title: { en: "Exercise 3 · affinity_batches: the window groups", ru: "Упражнение 3 · affinity_batches: группы окна" },
        brief: {
          en: "Implement <code>affinity_batches(stream, w)</code>: cut the stream into windows of <code>w</code> arrivals; inside each window, group requests by tenant in order of the tenant's FIRST appearance. Return a list of batches, each a list of tenant groups. Example: <code>['A','B','A']</code> at w = 3 → <code>[['A','A'],['B']]</code>. This is the lab's routing policy in one pure function.",
          ru: "Реализуй <code>affinity_batches(stream, w)</code>: режь{NB}поток{NB}на{NB}окна{NB}по{NB}<code>w</code>{NB}пришельцев;{NB}внутри{NB}окна{NB}группируй{NB}запросы{NB}по{NB}арендаторам{NB}в{NB}порядке{NB}ПЕРВОГО{NB}появления.{NB}Верни{NB}список{NB}партий,{NB}каждая{NB}—{NB}список{NB}групп.{NB}Пример:{NB}<code>['A','B','A']</code>{NB}при{NB}w{NB}={NB}3{NB}→{NB}<code>[['A','A'],['B']]</code>.{NB}Это{NB}политика{NB}маршрутизации{NB}лабы{NB}в{NB}одной{NB}чистой{NB}функции.",
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
          { en: "Two loops: collect first-appearance order, then one list comprehension per tenant.", ru: "Два{NB}цикла:{NB}собери{NB}порядок{NB}первого{NB}появления,{NB}затем{NB}по{NB}одному{NB}list{NB}comprehension{NB}на{NB}арендатора." },
        ],
        numpy: false, timeoutMs: 3000,
      },
      {
        id: "ex4",
        title: { en: "Exercise 4 · tenant_p95: the promise per tenant", ru: "Упражнение 4 · tenant_p95: обещание по{NB}арендаторам" },
        brief: {
          en: "Implement <code>tenant_p95(entries, tenant)</code>: slice the journal to entries whose <code>tenant</code> field matches, take their <code>wall_s</code> values, and return the nearest-rank p95 — sorted, element <code>ceil(0.95 × n) − 1</code>, a measured request. The fixture is the T13 journal shape with a <code>tenant</code> field added; quiz q3's numbers fall out of it.",
          ru: "Реализуй <code>tenant_p95(entries, tenant)</code>: срежь{NB}журнал{NB}до{NB}записей{NB}с{NB}совпавшим{NB}полем{NB}<code>tenant</code>, возьми{NB}их{NB}<code>wall_s</code>{NB}и{NB}верни{NB}nearest-rank{NB}p95{NB}—{NB}отсортировано,{NB}элемент{NB}<code>ceil(0.95{NB}×{NB}n){NB}−{NB}1</code>,{NB}измеренный{NB}запрос.{NB}Фикстура{NB}—{NB}форма{NB}журнала{NB}T13{NB}с{NB}добавленным{NB}полем{NB}tenant;{NB}числа{NB}квиза{NB}q3{NB}из{NB}неё{NB}выпадают.",
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
          { en: "Slice FIRST, then sort — mixing tenants is the mean-vs-tail mistake again.", ru: "Сначала{NB}срез,{NB}потом{NB}сортировка{NB}—{NB}смешать{NB}арендаторов{NB}—{NB}снова{NB}ошибка{NB}«средняя{NB}против{NB}хвоста»." },
          { en: "ceil(0.95 × 3) = 3: the 3rd sorted value. The measured request, not an interpolation.", ru: "ceil(0.95{NB}×{NB}3){NB}={NB}3:{NB}3-е{NB}отсортированное{NB}значение.{NB}Измеренный{NB}запрос,{NB}а{NB}не{NB}интерполяция." },
        ],
        numpy: false, timeoutMs: 3000,
      },
      {
        id: "ex5",
        title: { en: "Capstone · AdapterSim: the two-sided ledger", ru: "Капстоун · AdapterSim: двусторонняя ведомость" },
        brief: {
          en: "Implement <code>adaptersim(stream, w, start='A')</code>: route the stream in affinity windows of <code>w</code> (reuse your ex3 grouping), count swaps exactly like ex2 (the loaded tenant carries ACROSS windows), and count <code>waited</code> — every request behind the first in its group. Return <code>{\"swaps\": …, \"waited\": …}</code>. The declared stream is the deck's six requests; the declared dial table on slide 12 is your answer key — your function must reproduce every row.",
          ru: "Реализуй <code>adaptersim(stream, w, start='A')</code>: маршрутизируй{NB}поток{NB}affinity-окнами{NB}по{NB}<code>w</code>{NB}(переиспользуй{NB}группировку{NB}ex3),{NB}считай{NB}переключения{NB}ровно{NB}как{NB}ex2{NB}(загруженный{NB}арендатор{NB}несётся{NB}ЧЕРЕЗ{NB}окна),{NB}и{NB}считай{NB}<code>waited</code>{NB}—{NB}каждый{NB}запрос{NB}позади{NB}первого{NB}в{NB}своей{NB}группе.{NB}Верни{NB}<code>{&quot;swaps&quot;:{NB}…,{NB}&quot;waited&quot;:{NB}…}</code>.{NB}Декларированный{NB}поток{NB}—{NB}шесть{NB}запросов{NB}деки;{NB}таблица{NB}диска{NB}на{NB}слайде{NB}12{NB}—{NB}твой{NB}ключ{NB}ответов{NB}—{NB}твоя{NB}функция{NB}обязана{NB}воспроизвести{NB}каждую{NB}строку.",
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
          { en: "The loaded tenant carries ACROSS windows — a batch whose first tenant differs from the previous window's last pays a swap.", ru: "Загруженный{NB}арендатор{NB}несётся{NB}ЧЕРЕЗ{NB}окна{NB}—{NB}партия,{NB}чей{NB}первый{NB}арендатор{NB}отличается{NB}от{NB}последнего{NB}в{NB}прошлом{NB}окне,{NB}платит{NB}переключение." },
          { en: "Reuse ex3's grouping and ex2's swap logic; the ledger adds only the waited column.", ru: "Переиспользуй{NB}группировку{NB}ex3{NB}и{NB}логику{NB}переключений{NB}ex2;{NB}ведомость{NB}добавляет{NB}только{NB}колонку{NB}ожидавших." },
        ],
        numpy: false, timeoutMs: 5000,
      },
    ],
    challenge: {
      id: "challenge",
      word: { en: "challenge", ru: "челлендж" },
      title: { en: "★ Tune the window: both lines hold, one dial", ru: "★ Настрой окно: обе{NB}линии{NB}держатся,{NB}один{NB}диск" },
      brief: {
        en: "The declared six-request stream, one decision open: the window W. Choose W from {1, 2, 3, 4, 5, 6} so that on STREAM the run <strong>holds both declared lines</strong>: swaps ≤ 2 AND waited ≤ 4, with W ≤ 4 (a request may wait at most W − 1 for its group). Print one line: <code>W=&lt;value&gt;</code>. The page replays the declared router arithmetic and rejects invented numbers; the table on slide 12 is your answer key, and only one W passes both lines at this bound.",
        ru: "Декларированный{NB}поток{NB}из{NB}шести{NB}запросов,{NB}одно{NB}решение{NB}открыто:{NB}окно{NB}W.{NB}Выбери{NB}W{NB}из{NB}{1,{NB}2,{NB}3,{NB}4,{NB}5,{NB}6}{NB}так,{NB}чтобы{NB}на{NB}STREAM{NB}прогон{NB}<strong>держал{NB}обе{NB}декларированные{NB}линии</strong>:{NB}переключения{NB}≤{NB}2{NB}И{NB}ожидавшие{NB}≤{NB}4,{NB}при{NB}W{NB}≤{NB}4{NB}(запрос{NB}может{NB}ждать{NB}не{NB}более{NB}W{NB}−{NB}1{NB}до{NB}своей{NB}группы).{NB}Напечатай{NB}одну{NB}строку:{NB}<code>W=&lt;значение&gt;</code>.{NB}Страница{NB}переигрывает{NB}декларированную{NB}арифметику{NB}роутера{NB}и{NB}отвергает{NB}выдуманные{NB}числа;{NB}таблица{NB}на{NB}слайде{NB}12{NB}—{NB}твой{NB}ключ{NB}ответов,{NB}и{NB}только{NB}одно{NB}W{NB}проходит{NB}обе{NB}линии{NB}при{NB}этой{NB}границе.",
      },
      goal: { en: "Print one line: W=<from 1..6> — on STREAM: swaps ≤ 2, waited ≤ 4, W ≤ 4.", ru: "Напечатай одну строку: W=<из{NB}1..6>{NB}—{NB}на{NB}STREAM:{NB}переключения{NB}≤{NB}2,{NB}ожидавшие{NB}≤{NB}4,{NB}W{NB}≤{NB}4." },
      mode: "run", numpy: false, timeoutMs: 5000,
      starter: `# STREAM from the capstone is already defined (six requests, two tenants).
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
        if (![1,2,3,4,5,6].includes(w)) return { ok: false, note: { en: "W must come from the declared grid {1, 2, 3, 4, 5, 6}.", ru: "W{NB}должно{NB}прийти{NB}из{NB}декларированной{NB}сетки{NB}{1,{NB}2,{NB}3,{NB}4,{NB}5,{NB}6}." } };
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
        if (swaps > 2 || waited > 4) return { ok: false, note: { en: "W = " + w + " gives " + verdict + " — the declared lines are swaps ≤ 2 AND waited ≤ 4.", ru: "W{NB}={NB}" + w + "{NB}даёт{NB}" + verdict + "{NB}—{NB}декларированные{NB}линии:{NB}переключения{NB}≤{NB}2{NB}И{NB}ожидавшие{NB}≤{NB}4." } };
        if (w > 4) return { ok: false, note: { en: "W = " + w + " holds the counts but breaks the bound W ≤ 4 — a request may wait at most W − 1.", ru: "W{NB}={NB}" + w + "{NB}держит{NB}счётчики,{NB}но{NB}ломает{NB}границу{NB}W{NB}≤{NB}4{NB}—{NB}запрос{NB}может{NB}ждать{NB}не{NB}более{NB}W{NB}−{NB}1." } };
        return { ok: true, note: { en: "W = " + w + " gives swaps " + swaps + ", waited " + waited + " — both declared lines hold and the window stays bounded. This is routing design: one dial, two named lines, nothing invented.", ru: "W{NB}={NB}" + w + "{NB}даёт{NB}переключений{NB}" + swaps + ",{NB}ожидавших{NB}" + waited + "{NB}—{NB}обе{NB}декларированные{NB}линии{NB}держатся,{NB}окно{NB}ограничено.{NB}Это{NB}дизайн{NB}маршрутизации:{NB}один{NB}диск,{NB}две{NB}поименованные{NB}линии,{NB}ничего{NB}выдуманного." } };
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
        ru: "Маршрутизируй живой журнал: свой{NB}шлюз{NB}слой-2",
      },
      brief: {
        en: "Everything above ran on a <strong>declared teaching model</strong>. Connect the practice runtime (<code>docker compose up -d</code>, gateway at <code>127.0.0.1:8760</code>), make measurements tagged with your tenant names — and the routing ledger goes live: your journal carries the tenant field, the slice-and-p95 arithmetic runs on real entries, and the swap count is your own machine's. Machine-local and honest; offline, this section says so and the declared fixture stays the grading surface.",
        ru: "Всё{NB}выше работало на{NB}<strong>декларированной{NB}учебной{NB}модели</strong>.{NB}Подключи{NB}practice-рантайм{NB}(<code>docker{NB}compose{NB}up{NB}-d</code>,{NB}шлюз{NB}на{NB}<code>127.0.0.1:8760</code>),{NB}сделай{NB}измерения{NB}с{NB}именами{NB}своих{NB}арендаторов{NB}—{NB}и{NB}ведомость{NB}маршрутизации{NB}оживёт:{NB}в{NB}твоём{NB}журнале{NB}есть{NB}поле{NB}арендатора,{NB}арифметика{NB}срезов{NB}и{NB}p95{NB}идёт{NB}по{NB}реальным{NB}записям,{NB}а{NB}счёт{NB}переключений{NB}—{NB}твоей{NB}машины.{NB}Машинно-локально{NB}и{NB}честно;{NB}офлайн{NB}секция{NB}говорит{NB}об{NB}этом{NB}прямо,{NB}и{NB}декларированная{NB}фикстура{NB}остаётся{NB}оцениваемой{NB}поверхностью.",
      },
      experimentPrompt: {
        en: "Run two measurements per tenant, then check the per-tenant p95 table against your own journal — slices, not averages.",
        ru: "Сделай по{NB}два{NB}измерения{NB}на{NB}арендатора,{NB}затем{NB}сверь{NB}таблицу{NB}p95{NB}арендаторов{NB}с{NB}собственным{NB}журналом{NB}—{NB}срезы,{NB}а{NB}не{NB}средние.",
      },
      footer: {
        en: "The live journal is yours and machine-local; the declared fixture stays the grading surface. If the runtime is offline, this section says so honestly — nothing here pretends.",
        ru: "Живой{NB}журнал{NB}—{NB}твой{NB}и{NB}машинно-локальный;{NB}декларированная{NB}фикстура{NB}остаётся{NB}оцениваемой{NB}поверхностью.{NB}Если{NB}рантайм{NB}офлайн,{NB}этот{NB}раздел{NB}говорит{NB}об{NB}этом{NB}честно{NB}—{NB}ничего{NB}здесь{NB}не{NB}притворяется.",
      },
    },
    posttest: [
      {
        id: "p1",
        q: { en: "A tenant asks the adapter for a longer context window. The honest answer…", ru: "Арендатор просит адаптер дать{NB}длиннее{NB}контекстное{NB}окно.{NB}Честный{NB}ответ…" },
        options: [
          { en: "the adapter changes the tenant delta, not the base contract — context width is shared by every tenant and an adapter cannot widen it", ru: "адаптер меняет дельту арендатора, а{NB}не{NB}контракт базы — ширина контекста общая для{NB}всех, и{NB}адаптер не{NB}может её{NB}расширить" },
          { en: "sure — a bigger rank widens the context", ru: "конечно — больший ранг расширяет контекст" },
          { en: "each tenant already ships its own tokenizer", ru: "каждый{NB}арендатор{NB}уже{NB}возит{NB}свой{NB}токенизатор" },
        ],
        answer: 0,
        explain: { en: "The frozen base is the shared contract: tokenizer, context width, cutoff knowledge. The adapter is the tenant DELTA — measured, small, and powerless beyond the base's physics.", ru: "Замороженная{NB}база{NB}—{NB}общий{NB}контракт:{NB}токенизатор,{NB}ширина{NB}контекста,{NB}знания{NB}cutoff.{NB}Адаптер{NB}—{NB}ДЕЛЬТА{NB}арендатора{NB}—{NB}измеренная,{NB}маленькая{NB}и{NB}беспомощная{NB}за{NB}пределами{NB}физики{NB}базы." },
      },
      {
        id: "p2",
        q: { en: "Two tenants share a journal. Why is ONE global p95 wrong for their promises?", ru: "Два{NB}арендатора{NB}делят{NB}журнал.{NB}Почему{NB}ОДИН{NB}глобальный{NB}p95{NB}неверен{NB}для{NB}их{NB}обещаний?" },
        options: [
          { en: "it reports the fast tenant's health and hides the slow tenant — the T13 mean-vs-tail mistake at tenant grain; the promise is per tenant, nearest-rank per slice", ru: "он{NB}показывает{NB}здоровье{NB}быстрого{NB}и{NB}прячет{NB}медленного{NB}—{NB}ошибка{NB}T13{NB}«средняя{NB}против{NB}хвоста»{NB}на{NB}зерне{NB}арендатора;{NB}обещание{NB}по{NB}арендаторам,{NB}nearest-rank{NB}по{NB}срезам" },
          { en: "a global p95 is fine — the tenants share the base anyway", ru: "глобальный{NB}p95{NB}нормален{NB}—{NB}арендаторы{NB}и{NB}так{NB}делят{NB}базу" },
          { en: "global percentiles are forbidden by the invariant protocol", ru: "глобальные{NB}перцентили{NB}запрещены{NB}инвариантным{NB}протоколом" },
        ],
        answer: 0,
        explain: { en: "Slice by tenant, then nearest-rank, then name the window: the client's experience is per tenant, and a global number averages B's pain into A's success.", ru: "Срежь{NB}по{NB}арендатору,{NB}затем{NB}nearest-rank,{NB}затем{NB}назови{NB}окно:{NB}опыт{NB}клиента{NB}—{NB}по{NB}арендаторам,{NB}а{NB}глобальное{NB}число{NB}усредняет{NB}боль{NB}B{NB}в{NB}успех{NB}A." },
      },
      {
        id: "p3",
        q: { en: "Grouping the six-request stream cut swaps from 5 to 1. What paid for it?", ru: "Группировка{NB}потока{NB}из{NB}шести{NB}запросов{NB}срезала{NB}переключения{NB}с{NB}5{NB}до{NB}1.{NB}Что{NB}за{NB}это{NB}заплатило?" },
        options: [
          { en: "waiting: the second and third request of each tenant group waited behind the first — the two-sided ledger prices both sides", ru: "ожидание:{NB}второй{NB}и{NB}третий{NB}запросы{NB}каждой{NB}группы{NB}ждали{NB}позади{NB}первого{NB}—{NB}двусторонняя{NB}ведомость{NB}оценивает{NB}обе{NB}стороны" },
          { en: "nothing — the base absorbed it", ru: "ничего{NB}—{NB}база{NB}поглотила" },
          { en: "the adapters shrank", ru: "адаптеры{NB}уменьшились" },
        ],
        answer: 0,
        explain: { en: "No policy is free: FIFO pays the switch tax, tenant batches pay waits. The window W is the dial between the two — and the declared lines make the choice checkable.", ru: "Никакая{NB}политика{NB}не{NB}бесплатна:{NB}FIFO{NB}платит{NB}налогом{NB}переключений,{NB}партии{NB}арендаторов{NB}—{NB}ожиданиями.{NB}Окно{NB}W{NB}—{NB}диск{NB}между{NB}ними{NB}—{NB}и{NB}декларированные{NB}линии{NB}делают{NB}выбор{NB}проверяемым." },
      },
      {
        id: "b1",
        bridge: { en: "bridge · T13", ru: "мост · T13" },
        q: { en: "The tenant p95 you computed here is trustworthy because…", ru: "p95 арендатора, который ты{NB}считал{NB}здесь,{NB}заслуживает{NB}доверия,{NB}потому{NB}что…" },
        options: [
          { en: "it slices the same hash-chained journal T13 verified — an edited entry would fail the chain before it poisoned the percentile", ru: "он{NB}режет{NB}тот{NB}же{NB}хэш-цепочечный{NB}журнал,{NB}что{NB}верифицировала{NB}T13{NB}—{NB}правленая{NB}запись{NB}упадёт{NB}на{NB}цепочке{NB}раньше,{NB}чем{NB}отравит{NB}перцентиль" },
          { en: "it uses the mean instead of the p95", ru: "он{NB}использует{NB}среднюю{NB}вместо{NB}p95" },
          { en: "it came from the judge's spreadsheet", ru: "он{NB}пришёл{NB}из{NB}таблицы{NB}джаджа" },
        ],
        answer: 0,
        explain: { en: "The journal is the instrument: append-only, hash-sealed, verified before aggregation. The tenant slice inherits that proof — fairness claims stay auditable because the chain keeps the history honest.", ru: "Журнал{NB}—{NB}инструмент:{NB}append-only,{NB}запечатан{NB}хэшами,{NB}верифицирован{NB}до{NB}агрегации.{NB}Срез{NB}арендатора{NB}наследует{NB}это{NB}доказательство{NB}—{NB}заявления{NB}о{NB}справедливости{NB}остаются{NB}аудируемыми,{NB}потому{NB}что{NB}цепочка{NB}держит{NB}историю{NB}честной." },
      },
    ],
    footer: {
      en: "Declared teaching model of a multi-tenant serving layer: the tenant stream, the 2 ms swap cost and the adapter quality deltas are declared arithmetic over the LoRA rank formula (arXiv 2106.09685) and the deck's six-request stream; the journal canonical form is the real layer-2 gateway's (runtime/gateway/app.py). S-LoRA and Punica are cited as the real-systems line our flat swap cost omits. The live journal you can connect in the Layer-2 section is your own and machine-local.",
      ru: "Декларированная учебная модель мультитенантного{NB}слоя{NB}сервинга:{NB}поток{NB}арендаторов,{NB}цена{NB}переключения{NB}2{NB}ms{NB}и{NB}дельты{NB}качества{NB}адаптеров{NB}—{NB}декларированная{NB}арифметика{NB}над{NB}формулой{NB}ранга{NB}LoRA{NB}(arXiv{NB}2106.09685){NB}и{NB}потоком{NB}из{NB}шести{NB}запросов{NB}деки;{NB}каноническая{NB}форма{NB}журнала{NB}—{NB}настоящая,{NB}от{NB}шлюза{NB}слой-2{NB}(runtime/gateway/app.py).{NB}S-LoRA{NB}и{NB}Punica{NB}цитируются{NB}как{NB}линия{NB}реальных{NB}систем,{NB}которую{NB}наша{NB}плоская{NB}цена{NB}переключения{NB}опускает.{NB}Живой{NB}журнал,{NB}который{NB}можно{NB}подключить{NB}в{NB}секции{NB}Layer-2,{NB}—{NB}твой{NB}собственный{NB}и{NB}машинно-локальный.",
    },
  };
  window.LABS_CONTENT = LABS_CONTENT;
})();
