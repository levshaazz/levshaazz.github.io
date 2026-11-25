/* Lab 08 — Production API: the gateway in front of the frozen engine profile.
   Content module for the generic lab page (window.LABS_CONTENT['8']).
   Sources: seminars/08-production-api.ipynb (MockEngine handles, AdmissionQueue,
   map_engine_error, the burst drill envelope). Declared teaching model only. */
(function () {
  "use strict";
  window.LABS_CONTENT = window.LABS_CONTENT || {};

  LABS_CONTENT["8"] = {
    budget: 60,
    title: {
      en: "Production inference API: the gateway",
      ru: "Продакшен-API инференса: шлюз",
    },
    sub: {
      en: "Admission with a bounded queue, honest 429, the outcome-to-status map and cancellation — predicted before the code, checked by tests.",
      ru: "Admission с ограниченной очередью, честный 429, карта «исход → код → действие» и отмена — предсказано до кода, проверено тестами.",
    },
    intro: {
      en: `<p>A gateway is a thin HTTP layer between clients and the engine, and its job is to turn Topic 06 mechanisms into a contract: validation before the queue, a <strong>bounded queue</strong> that answers 429 with <code>Retry-After</code> instead of promising infinite waiting, an <strong>outcome → status</strong> map (invalid 400, overloaded 429, engine down 503, deadline 504, everything else 500 without internals), and cancellation that stops paying for abandoned tokens. HTTP 200 means "an answer was sent", not "the request succeeded" — a client timeout counted as success is a lie the metrics will repeat at 3 a.m.</p>
<p>The lab habit: freeze the contract table (situation → mechanism → expected code) BEFORE any gateway code, then let drills and the journal check it. All numbers here are a declared mock engine: ttft 0.15 s, 0.02 s per token, 4 service slots + 4 queue seats — arithmetic you can verify by hand, not a vLLM measurement.</p>`,
      ru: `<p>Шлюз — тонкий HTTP-слой между клиентами и движком, и его работа — превратить механизмы Темы 06 в контракт: валидация до очереди, <strong>ограниченная очередь</strong>, отвечающая 429 с <code>Retry-After</code> вместо обещания вечного ожидания, карта <strong>«исход → код»</strong> (invalid 400, overloaded 429, движок лежит 503, deadline 504, остальное 500 без внутренностей) и отмена, которая перестаёт платить за брошенные токены. HTTP 200 означает «ответ отправлен», а не «запрос успешен» — таймаут клиента, засчитанный как успех, — это ложь, которую метрики повторят в 3 часа ночи.</p>
<p>Привычка лабы: заморозить таблицу контракта (ситуация → механизм → ожидаемый код) ДО кода шлюза, потом дать дриллам и журналу её проверить. Все числа здесь — заявленный мок движка: <code>ttft</code> 0.15 с, 0.02 с за токен, 4 слота обслуживания + 4 места очереди, — арифметика, которую можно проверить руками, а не измерение vLLM.</p>`,
    },
    heroTag: { en: "429, envelope, error map", ru: "429, конверт допуска, карта ошибок" },
    glossary: [
      [{ en: "gateway", ru: "шлюз" }, { en: "a thin HTTP layer between clients and the engine: Topic 06's mechanisms (validation, admission, cancellation) turned into one contract.", ru: "тонкий HTTP-слой между клиентами и движком: механизмы Темы 06 (валидация, допуск, отмена), собранные в один контракт." }],
      [{ en: "burst", ru: "бурст" }, { en: "many clients arriving at once; the burst drill measures how many the envelope admits before the honest refusals begin.", ru: "много клиентов, приходящих одновременно; дрилл бурста меряет, сколько конверт впускает до первых честных отказов." }],
      [{ en: "rate limit (429)", ru: "лимит запросов" }, { en: "the honest refusal: 429 — too many requests, a decision to come back later, never a disguised success; Retry-After says when.", ru: "честный отказ: 429 — слишком много запросов, решение вернуться позже, а не замаскированный успех; Retry-After говорит, когда." }],
      [{ en: "bounded queue", ru: "ограниченная очередь" }, { en: "a fixed number of waiting seats — honest waiting; an unbounded queue hides overload as latency, the anti-pattern T06 drilled.", ru: "фиксированное число мест ожидания — честное ожидание; безграничная очередь прячет перегрузку в латентности — тот антипаттерн, что гоняла T06." }],
      [{ en: "admission envelope", ru: "конверт допуска" }, { en: "the closed form of a burst: admitted = min(arrivals, capacity + queue_slots); everyone past both gets an immediate 429.", ru: "замкнутая форма бурста: admitted = min(заявки, capacity + queue_slots); все, кто сверх обоих, получают немедленный 429." }],
      [{ en: "service slot", ru: "слот обслуживания" }, { en: "one in-flight place that generates an answer; capacity is the number of slots — the same bounded concurrency you metered in T06.", ru: "одно место в полёте, где генерируется ответ; capacity — это число слотов, та же ограниченная конкурентность, которую мерили в T06." }],
      [{ en: "queue seat", ru: "место очереди" }, { en: "a waiting place inside the system: a queued request is already admitted and will be served, so the seats are slots + queue.", ru: "место ожидания внутри системы: запрос в очереди уже допущен и будет обслужен, поэтому места — это слоты + очередь." }],
      [{ en: "Little's law", ru: "закон Литтла" }, { en: "L = λ × W: the average number of requests in the system is the arrival rate times the time one request holds its seat.", ru: "L = λ × W: среднее число заявок в системе равно темпу прихода, умноженному на время, которое один запрос держит своё место." }],
      [{ en: "saturation knee", ru: "колено насыщения" }, { en: "the T06 load where demand hits the seats; here λ* = seats / W — past it, extra arrivals are refused, not delayed.", ru: "нагрузка из T06, при которой спрос упирается в места; здесь λ* = места / W — за ней лишние заявки отбиваются, а не откладываются." }],
      [{ en: "outcome → status map", ru: "карта «исход → статус»" }, { en: "the frozen contract: invalid 400, overloaded 429 + Retry-After, engine down 503, deadline 504, everything else 500 without internals.", ru: "замороженный контракт: невалидно 400, перегрузка 429 + Retry-After, движок лежит 503, дедлайн 504, остальное 500 без внутренностей." }],
    ],
    figures: [
      {
        id: "lab8-error-map",
        title: { en: "Outcome → status → client action", ru: "Исход → статус → действие клиента" },
        w: 760, h: 420,
        svg: `<svg viewBox="0 0 760 420" xmlns="http://www.w3.org/2000/svg">
  <g id="g-head">
    <text x="70" y="66" font-size="13" fill="var(--lab-muted)" class="mono" data-en="OUTCOME" data-ru="ИСХОД">OUTCOME</text>
    <text x="280" y="66" font-size="13" fill="var(--lab-muted)" class="mono" data-en="STATUS" data-ru="СТАТУС">STATUS</text>
    <text x="470" y="66" font-size="13" fill="var(--lab-muted)" class="mono" data-en="CLIENT ACTION" data-ru="ДЕЙСТВИЕ КЛИЕНТА">CLIENT ACTION</text>
    <line x1="55" y1="78" x2="705" y2="78" stroke="var(--lab-muted)" stroke-width="1"/>
  </g>
  <g id="g-r12">
    <text x="70" y="112" font-size="15" fill="var(--lab-ink)" data-en="invalid request" data-ru="невалидный запрос">invalid request</text>
    <text x="280" y="112" font-size="15" fill="var(--lab-accent)" class="mono">400</text>
    <text x="470" y="112" font-size="15" fill="var(--lab-muted)" data-en="fix the fields" data-ru="почини поля">fix the fields</text>
    <text x="70" y="162" font-size="15" fill="var(--lab-ink)" data-en="overloaded" data-ru="перегрузка">overloaded</text>
    <text x="280" y="162" font-size="15" fill="var(--fig-warm)" class="mono">429 + Retry-After</text>
    <text x="470" y="162" font-size="15" fill="var(--lab-muted)" data-en="retry later" data-ru="повтори позже">retry later</text>
    <line x1="55" y1="180" x2="705" y2="180" stroke="var(--lab-line)" stroke-width="1"/>
  </g>
  <g id="g-r34">
    <text x="70" y="212" font-size="15" fill="var(--lab-ink)" data-en="engine down" data-ru="движок лежит">engine down</text>
    <text x="280" y="212" font-size="15" fill="var(--lab-bad)" class="mono">503</text>
    <text x="470" y="212" font-size="15" fill="var(--lab-muted)" data-en="back off, then retry" data-ru="отступи, потом повтори">back off, then retry</text>
    <text x="70" y="262" font-size="15" fill="var(--lab-ink)" data-en="deadline passed" data-ru="дедлайн истёк">deadline passed</text>
    <text x="280" y="262" font-size="15" fill="var(--lab-bad)" class="mono">504</text>
    <text x="470" y="262" font-size="15" fill="var(--lab-muted)" data-en="cancel, do not retry blindly" data-ru="отмена, не повторяй вслепую">cancel, do not retry blindly</text>
    <line x1="55" y1="280" x2="705" y2="280" stroke="var(--lab-line)" stroke-width="1"/>
  </g>
  <g id="g-r5">
    <text x="70" y="312" font-size="15" fill="var(--lab-ink)" data-en="everything else" data-ru="всё остальное">everything else</text>
    <text x="280" y="312" font-size="15" fill="var(--lab-bad)" class="mono">500</text>
    <text x="470" y="312" font-size="15" fill="var(--lab-muted)" data-en="page the owner — no internals leaked" data-ru="буди владельца — без внутренностей">page the owner — no internals leaked</text>
  </g>
  <g id="g-ribbon">
    <rect x="55" y="344" width="650" height="44" rx="9" fill="var(--fig-warm)" opacity="0.14"/>
    <text x="380" y="371" text-anchor="middle" font-size="16" fill="var(--fig-warm)" data-en="never 200-with-error-body — a client timeout is not a success" data-ru="никогда 200-с-телом-ошибки — таймаут клиента не есть успех">never 200-with-error-body — a client timeout is not a success</text>
  </g>
</svg>`,
        stages: [
          { cap: { en: "The contract: outcome → status → client action.", ru: "Таблица контракта: исход → статус → действие, которое должен предпринять клиент." }, show: ["g-head"] },
          { cap: { en: "Validation before the queue: 400 for invalid, 429 + Retry-After for overload.", ru: "Валидация до очереди: 400 за невалидность, 429 + Retry-After за перегрузку." }, show: ["g-head", "g-r12"] },
          { cap: { en: "Engine down is 503 (retry later); a passed deadline is 504 (cancel).", ru: "Лежащий движок — 503 (повтори позже); истёкший дедлайн — 504 (отмена)." }, show: ["g-head", "g-r12", "g-r34"] },
          { cap: { en: "Everything else: 500 without internals — never 200 with an error body.", ru: "Всё остальное — 500 без внутренностей, никогда 200 с ошибкой." }, show: ["g-head", "g-r12", "g-r34", "g-r5", "g-ribbon"] },
        ],
      },
      {
        id: "lab8-queue-economy",
        title: { en: "Queue economy: Little's law meets bounded seats", ru: "Экономика очереди: закон Литтла против ограниченных мест" },
        w: 760, h: 420,
        svg: `<svg viewBox="0 0 760 420" xmlns="http://www.w3.org/2000/svg">
  <g id="g-little">
    <line x1="80" y1="340" x2="700" y2="340" stroke="var(--lab-muted)" stroke-width="1.5"/>
    <line x1="80" y1="340" x2="80" y2="70" stroke="var(--lab-muted)" stroke-width="1.5"/>
    <text x="700" y="364" text-anchor="end" font-size="14" fill="var(--lab-muted)" data-en="arrival rate λ, req/s" data-ru="темп прихода λ, req/s">arrival rate λ, req/s</text>
    <text x="88" y="62" font-size="14" fill="var(--lab-muted)" data-en="requests in system, L" data-ru="заявок в системе, L">requests in system, L</text>
    <path d="M 80 340 L 519 116" fill="none" stroke="var(--lab-accent)" stroke-width="2.5" class="fig-flow"/>
    <text x="150" y="240" font-size="14" fill="var(--lab-accent)" class="mono">L = λ × W, W = 0.47 s</text>
    <text x="300" y="362" text-anchor="middle" font-size="13" fill="var(--lab-muted)" class="mono" data-en="16-token requests" data-ru="запросы на 16 токенов">16-token requests</text>
  </g>
  <g id="g-seats">
    <line x1="80" y1="228" x2="519" y2="228" stroke="var(--lab-good)" stroke-width="2.5"/>
    <text x="90" y="220" font-size="13" fill="var(--lab-good)" data-en="4 in service" data-ru="4 в обслуживании">4 in service</text>
    <line x1="519" y1="228" x2="80" y2="228" stroke="var(--lab-muted)" stroke-width="0"/>
    <line x1="300" y1="228" x2="519" y2="116" stroke="var(--fig-warm)" stroke-width="0"/>
    <text x="330" y="160" font-size="13" fill="var(--fig-warm)" data-en="+ 4 queue seats" data-ru="+ 4 места очереди">+ 4 queue seats</text>
    <line x1="519" y1="116" x2="519" y2="228" stroke="var(--fig-warm)" stroke-width="1.5" stroke-dasharray="4 3"/>
  </g>
  <g id="g-knee">
    <line x1="519" y1="340" x2="519" y2="70" stroke="var(--fig-warm)" stroke-width="2" stroke-dasharray="5 4"/>
    <text x="528" y="88" font-size="15" fill="var(--fig-warm)" class="mono">λ* = 8 / 0.47 ≈ 17.0</text>
    <text x="528" y="108" font-size="13" fill="var(--lab-muted)" data-en="demand hits the seats" data-ru="спрос упирается в места">demand hits the seats</text>
  </g>
  <g id="g-reject">
    <rect x="519" y="70" width="181" height="270" fill="var(--lab-bad)" opacity="0.1"/>
    <text x="610" y="190" text-anchor="middle" font-size="15" fill="var(--lab-bad)" data-en="past the knee:" data-ru="за коленом:">past the knee:</text>
    <text x="610" y="214" text-anchor="middle" font-size="15" fill="var(--lab-bad)" class="mono">429 + Retry-After</text>
    <text x="380" y="392" text-anchor="middle" font-size="14" fill="var(--lab-muted)" data-en="burst of 24 → 8 in system, 16 honest refusals" data-ru="бурст из 24 → 8 в системе, 16 честных отказов">burst of 24 → 8 in system, 16 honest refusals</text>
  </g>
</svg>`,
        stages: [
          { cap: { en: "Little's law: L = λ × W, W = 0.47 s (mock).", ru: "Закон Литтла: L = λ × W, W = 0.47 с (мок)." }, show: ["g-little"] },
          { cap: { en: "Seats: 4 in service + 4 queue places = 8 in system.", ru: "Места: 4 в обслуживании + 4 в очереди = 8 в системе." }, show: ["g-little", "g-seats"] },
          { cap: { en: "Knee: λ* = 8 / 0.47 ≈ 17.0 req/s.", ru: "Колено: λ* = 8 / 0.47 ≈ 17.0 req/s." }, show: ["g-little", "g-seats", "g-knee"] },
          { cap: { en: "Past the knee: honest 429s — a burst of 24 loses 16.", ru: "За коленом: честный 429 + Retry-After — бурст из 24 теряет 16." }, show: ["g-little", "g-seats", "g-knee", "g-reject"] },
        ],
      },
    ],
    outcomes: [
      { en: "Map every failure outcome to a status code and a client action.", ru: "\u0421\u043e\u043f\u043e\u0441\u0442\u0430\u0432\u043b\u044f\u0442\u044c \u043a\u0430\u0436\u0434\u043e\u043c\u0443 \u043e\u0442\u043a\u0430\u0437\u0443 \u043a\u043e\u0434 \u0441\u043e\u0441\u0442\u043e\u044f\u043d\u0438\u044f \u0438\u00a0\u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0435 \u043a\u043b\u0438\u0435\u043d\u0442\u0430." },
      { en: "Keep rejection honest: a 429 is a decision, never a disguised success.", ru: "\u0414\u0435\u0440\u0436\u0430\u0442\u044c \u043e\u0442\u043a\u0430\u0437 \u0447\u0435\u0441\u0442\u043d\u044b\u043c: 429 \u2014 \u044d\u0442\u043e \u0440\u0435\u0448\u0435\u043d\u0438\u0435, \u0430\u00a0\u043d\u0435 \u0437\u0430\u043c\u0430\u0441\u043a\u0438\u0440\u043e\u0432\u0430\u043d\u043d\u044b\u0439 \u0443\u0441\u043f\u0435\u0445." },
    ],
    model: [
      ["service seats", "capacity 4 + queue 4 = 8", "burst 24 → honest 429s", "24 − 8 = 16"],
      ["mock request time W", "0.15 s + 0.02 s × tokens", "64-token request", "0.15 + 1.28 = 1.43 s"],
      ["queue knee λ*", "seats / W = 8 / W", "16-token requests (W = 0.47 s)", "≈ 17 req/s"],
      ["outcome map", "invalid 400 · overloaded 429 + Retry-After", "down 503 · deadline 504", "other 500, no internals"],
    ],
    scenario: null,
    quizzes: [
      {
        id: "q1",
        q: {
          en: "A burst of 30 clients hits a gateway with 4 service slots and 4 queue seats. How many honest 429 answers does the envelope predict?",
          ru: "Бурст из 30 клиентов бьёт в шлюз с 4 слотами обслуживания и 4 местами очереди. Сколько честных 429 предсказывает конверт?",
        },
        answer: 22, tol: 0.5, unit: { en: "requests", ru: "запросов" },
        hint: {
          en: "Seats = capacity + queue = 8; everyone past them is refused: 30 − 8.",
          ru: "Места = capacity + queue = 8; все, кто сверх, получают отказ: 30 − 8.",
        },
        followUp: {
          q: { en: "Why does the queue count toward the seats that answer honestly?", ru: "Почему очередь считается в места, которые отвечают честно?" },
          options: [
            { en: "Queued requests have been accepted: they wait inside the system, so the honest 429 starts only past slots + queue", ru: "Запросы в очереди уже приняты: они ждут внутри системы, поэтому честный 429 начинается только за слотами + очередью" },
            { en: "The queue is unlimited, so nothing is ever refused", ru: "Очередь безгранична, поэтому отказов не бывает вовсе" },
            { en: "Only service slots answer 429 — the queue answers 200", ru: "429 отвечают только слоты обслуживания — очередь отвечает 200" },
          ],
          answer: 0,
          explain: { en: "The envelope's point: a bounded queue is honest waiting; an unbounded queue hides overload as latency. That is why rejection starts exactly at capacity + queue_slots, not at capacity.", ru: "В этом смысл конверта: ограниченная очередь — честное ожидание; безграничная очередь прячет перегрузку в латентности. Поэтому отказ начинается ровно за capacity + queue_slots, а не за capacity." },
        },
        // Вариативность №5 (contract: instructor/plans/quiz-variants-contract-20261125.ru.md).
        // Меняется только вход «бурст»; места — константа заявленной модели (4 + 4 = 8).
        // Отказ = бурст − места: 30 → 22 (база), 40 → 32, 35 → 27. Ближайшие ловушки —
        // «только слоты» (бурст − 4) и «число допущенных» (8): расстояние ≥ 4 ≫ tol 0.5.
        // followUp без чисел входа — наследуется. Answers попарно различны; числа
        // фигур (24 / 16 / 8 / 17.0 / 0.47) не тронуты.
        variants: [
          {
            q: {
              en: "A burst of 30 clients hits a gateway with 4 service slots and 4 queue seats. How many honest 429 answers does the envelope predict?",
              ru: "Бурст из 30 клиентов бьёт в\u00a0шлюз с 4 слотами обслуживания и 4 местами очереди. Сколько честных 429 предсказывает конверт?",
            },
            answer: 22, tol: 0.5,
          },
          {
            q: {
              en: "A burst of 40 clients hits a gateway with 4 service slots and 4 queue seats. How many honest 429 answers does the envelope predict?",
              ru: "Бурст из 40 клиентов бьёт в\u00a0шлюз с 4 слотами обслуживания и 4 местами очереди. Сколько честных 429 предсказывает конверт?",
            },
            answer: 32, tol: 0.5,
            hint: {
              en: "Seats = capacity + queue = 8; everyone past them is refused: 40 − 8.",
              ru: "Места = capacity + queue = 8; все, кто сверх, получают отказ: 40 − 8.",
            },
          },
          {
            q: {
              en: "A burst of 35 clients hits a gateway with 4 service slots and 4 queue seats. How many honest 429 answers does the envelope predict?",
              ru: "Бурст из 35 клиентов бьёт в\u00a0шлюз с 4 слотами обслуживания и 4 местами очереди. Сколько честных 429 предсказывает конверт?",
            },
            answer: 27, tol: 0.5,
            hint: {
              en: "Seats = capacity + queue = 8; everyone past them is refused: 35 − 8.",
              ru: "Места = capacity + queue = 8; все, кто сверх, получают отказ: 35 − 8.",
            },
          },
        ],
      },
      {
        id: "q2",
        q: {
          en: "With the declared mock handles (ttft 0.15 s, 0.02 s per token), how long does one full 96-token request take, in seconds?",
          ru: "С заявленными ручками мока (<code>ttft</code> 0.15 с, 0.02 с за токен) — сколько длится полный запрос на 96 токенов, в секундах?",
        },
        answer: 2.07, tol: 0.01, unit: { en: "s", ru: "с" },
        hint: {
          en: "W = 0.15 + 0.02 × 96 = 0.15 + 1.92.",
          ru: "W = 0.15 + 0.02 × 96 = 0.15 + 1.92.",
        },
        followUp: {
          q: { en: "Why does the TTFT term stay constant while tokens multiply?", ru: "Почему член TTFT остаётся постоянным, а токены множатся?" },
          options: [
            { en: "TTFT pays for prefill (reading the prompt) once per request; each generated token adds its own decode step", ru: "TTFT платит за prefill (чтение промпта) один раз за запрос; каждый генерируемый токен добавляет свой decode-шаг" },
            { en: "TTFT is a per-token fee capped at the first 64 tokens", ru: "TTFT — это потокенная плата с потолком на первых 64 токенах" },
            { en: "The mock charges TTFT per client connection, not per request", ru: "Мок берёт TTFT за клиентское соединение, а не за запрос" },
          ],
          answer: 0,
          explain: { en: "W = ttft + per_token × n: one prefill, n decode steps. This is the same two-phase split as T04's wall model — the mock just names its constants.", ru: "W = ttft + per_token × n: один prefill, n шагов decode. То же двухфазное разложение, что в wall-модели T04 — мок лишь называет свои константы." },
        },
        // Вариативность №5: ручки мока — константы модели (ttft 0.15 с, 0.02 с за токен),
        // меняется длина запроса. W = 0.15 + 0.02 × n:
        //   96 → 2.07 (база), 120 → 0.15 + 2.40 = 2.55, 140 → 0.15 + 2.80 = 2.95.
        // Ловушка «забыт ttft» (= 0.02 × n) на расстоянии 0.15 ≫ tol 0.01 (запас 15×).
        // Числа модели/фигур (64 / 1.43 / 96 / 16) не тронуты. followUp без чисел
        // входа — наследуется. Answers попарно различны.
        variants: [
          {
            q: {
              en: "With the declared mock handles (ttft 0.15 s, 0.02 s per token), how long does one full 96-token request take, in seconds?",
              ru: "С заявленными ручками мока (<code>ttft</code> 0.15\u00a0с, 0.02\u00a0с за токен) — сколько длится полный запрос на 96 токенов, в\u00a0секундах?",
            },
            answer: 2.07, tol: 0.01,
          },
          {
            q: {
              en: "With the declared mock handles (ttft 0.15 s, 0.02 s per token), how long does one full 120-token request take, in seconds?",
              ru: "С заявленными ручками мока (<code>ttft</code> 0.15\u00a0с, 0.02\u00a0с за токен) — сколько длится полный запрос на 120 токенов, в\u00a0секундах?",
            },
            answer: 2.55, tol: 0.01,
            hint: {
              en: "W = 0.15 + 0.02 × 120 = 0.15 + 2.40.",
              ru: "W = 0.15 + 0.02 × 120 = 0.15 + 2.40.",
            },
          },
          {
            q: {
              en: "With the declared mock handles (ttft 0.15 s, 0.02 s per token), how long does one full 140-token request take, in seconds?",
              ru: "С заявленными ручками мока (<code>ttft</code> 0.15\u00a0с, 0.02\u00a0с за токен) — сколько длится полный запрос на 140 токенов, в\u00a0секундах?",
            },
            answer: 2.95, tol: 0.01,
            hint: {
              en: "W = 0.15 + 0.02 × 140 = 0.15 + 2.80.",
              ru: "W = 0.15 + 0.02 × 140 = 0.15 + 2.80.",
            },
          },
        ],
      },
      {
        id: "q3",
        q: {
          en: "Queue knee λ* for the same 96-token requests (W from q2) with 8 in-system seats — in req/s?",
          ru: "Колено очереди λ* для тех же запросов на 96 токенов (W из q2) при 8 местах в системе — в req/s?",
        },
        answer: 3.86, tol: 0.5, unit: { en: "req/s", ru: "req/s" },
        hint: {
          en: "λ* = seats / W — take the seats from the question and the W from q2.",
          ru: "λ* = места / W — места из условия, W — из q2.",
        },
        followUp: {
          q: { en: "Why do the queue seats appear in the knee λ* = seats / W?", ru: "Почему места очереди входят в колено λ* = seats / W?" },
          options: [
            { en: "Little's law counts everything IN the system: L = λ × W with L = 8 means queued requests hold their place too, so they extend the honest-admission range", ru: "Закон Литтла считает всё ВНУТРИ системы: L = λ × W при L = 8 означает, что очередь тоже держит свои места, расширяя диапазон честного допуска" },
            { en: "Queue seats serve requests in parallel with the slots", ru: "Места очереди обслуживают запросы параллельно со слотами" },
            { en: "They do not — the knee is always capacity / W", ru: "Не входят — колено всегда capacity / W" },
          ],
          answer: 0,
          explain: { en: "A queued request is in the system (it will be served), so Little's law with L = seats admits λ up to seats/W before the envelope overflows. Past that knee, extra demand is refused immediately — 429, not delay.", ru: "Запрос в очереди находится в системе (он будет обслужен), поэтому закон Литтла при L = seats допускает λ до seats/W, прежде чем конверт переполнится. За коленом лишний спрос отбивается сразу — 429, а не задержка." },
        },
        // Вариативность №5: места 8 — константа модели, меняется W; вариант объявляет
        // свой W в тексте вопроса (квизы независимы). λ* = 8 / W, W = 0.15 + 0.02 × n:
        //   96 → 8 / 2.07 = 3.865 ≈ 3.86 (база), 110 → 8 / 2.35 = 3.404 ≈ 3.40,
        //   90 → 8 / 1.95 = 4.103 ≈ 4.10.
        // Ловушки: ответ «самим W» (расстояние ≥ 1.05 ≈ 2.1× tol 0.5) и «capacity вместо
        // мест» 4 / W (≥ 1.70). Числа фигур (17.0 / 0.47) не тронуты. followUp без чисел
        // входа — наследуется. Answers попарно различны.
        variants: [
          {
            q: {
              en: "Queue knee λ* for the same 96-token requests (W from q2) with 8 in-system seats — in req/s?",
              ru: "Колено очереди λ* для тех же запросов на 96 токенов (W из q2) при 8 местах в\u00a0системе — в req/s?",
            },
            answer: 3.86, tol: 0.5,
          },
          {
            q: {
              en: "Queue knee λ* for 110-token requests (W = 0.15 + 0.02 × 110 = 2.35 s) with 8 in-system seats — in req/s?",
              ru: "Колено очереди λ* для запросов на 110 токенов (W = 0.15 + 0.02 × 110 = 2.35 с) при 8 местах в\u00a0системе — в req/s?",
            },
            answer: 3.4, tol: 0.5,
            hint: {
              en: "λ* = seats / W = 8 / 2.35.",
              ru: "λ* = места / W = 8 / 2.35.",
            },
          },
          {
            q: {
              en: "Queue knee λ* for 90-token requests (W = 0.15 + 0.02 × 90 = 1.95 s) with 8 in-system seats — in req/s?",
              ru: "Колено очереди λ* для запросов на 90 токенов (W = 0.15 + 0.02 × 90 = 1.95 с) при 8 местах в\u00a0системе — в req/s?",
            },
            answer: 4.1, tol: 0.5,
            hint: {
              en: "λ* = seats / W = 8 / 1.95.",
              ru: "λ* = места / W = 8 / 1.95.",
            },
          },
        ],
      },
      {
        id: "q4",
        q: {
          en: "The gateway runs a batch window of 3 ticks: 2 of its 4 slots go to the batch pool (offline inference), the rest serve interactive traffic. An interactive request must be served within 2 ticks (the SLA). How many interactive requests does the gateway serve during the first 2 ticks of the window?",
          ru: "Шлюз держит batch-окно в 3\u00a0тика: 2 из 4\u00a0слотов уходят batch-пулу (офлайн-инференс), остальные обслуживают интерактив. Интерактивный запрос должен быть обслужен за 2\u00a0тика (SLA). Сколько интерактивных запросов шлюз обслужит за первые 2\u00a0тика окна?",
        },
        answer: 4, tol: 0.5, unit: { en: "requests", ru: "запросов" },
        hint: {
          en: "Each tick the interactive side keeps 4 − 2 slots; multiply by the number of SLA ticks.",
          ru: "В каждый тик интерактиву остаются 4 − 2 слота; умножь на число тиков SLA.",
        },
        followUp: {
          q: { en: "Why not hand the batch pool all 4 slots for the whole window?", ru: "Почему не отдать batch-пулу все 4\u00a0слота на всё окно?" },
          options: [
            { en: "An interactive SLA timeout costs ×2 in the metric, while a served batch job earns only 0.5 — starving interactive slots for batch always loses", ru: "Таймаут интерактивного SLA стоит в метрике ×2, а обслуженная batch-работа приносит только 0.5 — голодание интерактива ради батча всегда проигрывает" },
            { en: "Batch jobs cannot be queued — each one permanently owns a dedicated slot", ru: "Batch-задания нельзя ставить в очередь — каждое навсегда занимает выделенный слот" },
            { en: "The engine cannot mix interactive and batch requests in one slot pool", ru: "Движок не умеет смешивать интерактивные и batch-заявки в одном пуле слотов" },
          ],
          answer: 0,
          explain: { en: "The two-queue economy (capstone contract v2): M2 = served_inter − 2 × timed_out_inter + 0.5 × served_batch. Offline traffic is patient and cheap per job, but a timed-out interactive request costs four batch credits. Handing slots to batch is the policy's right — bounded by B_MAX and priced by the metric, never the whole envelope.", ru: "Экономика двух очередей (контракт капстоуна v2): M2 = served_inter − 2 × timed_out_inter + 0.5 × served_batch. Офлайн-трафик терпелив и дёшев за работу, но таймаут интерактива стоит четырёх batch-кредитов. Отдать слоты батчу — право политики, ограниченное потолком B_MAX и оплачиваемое метрикой, но никогда весь конверт." },
        },
        // Вариативность №5: формула та же — интерактивные слоты × тики SLA
        // ((всего − batch) × SLA); окно задано больше SLA. Входы крупнее базовых,
        // чтобы ответ не совпал с малыми числами фигур (4 / 8):
        //   (4 − 2) × 2 = 4 (база), (6 − 2) × 3 = 12, (7 − 2) × 3 = 15.
        // Ловушка «всё окно вместо SLA» на расстоянии ≥ 8 ≫ tol 0.5; «batch × SLA»
        // и «один тик» — ещё дальше. followUp переписан без числа слотов (в базе
        // «all 4 slots» — это вход базы). Answers попарно различны.
        variants: [
          {
            q: {
              en: "The gateway runs a batch window of 3 ticks: 2 of its 4 slots go to the batch pool (offline inference), the rest serve interactive traffic. An interactive request must be served within 2 ticks (the SLA). How many interactive requests does the gateway serve during the first 2 ticks of the window?",
              ru: "Шлюз держит batch-окно в 3\u00a0тика: 2 из 4\u00a0слотов уходят batch-пулу (офлайн-инференс), остальные обслуживают интерактив. Интерактивный запрос должен быть обслужен за 2\u00a0тика (SLA). Сколько интерактивных запросов шлюз обслужит за первые 2\u00a0тика окна?",
            },
            answer: 4, tol: 0.5,
          },
          {
            q: {
              en: "The gateway runs a batch window of 5 ticks: 2 of its 6 slots go to the batch pool (offline inference), the rest serve interactive traffic. An interactive request must be served within 3 ticks (the SLA). How many interactive requests does the gateway serve during the first 3 ticks of the window?",
              ru: "Шлюз держит batch-окно в 5\u00a0тиков: 2 из 6\u00a0слотов уходят batch-пулу (офлайн-инференс), остальные обслуживают интерактив. Интерактивный запрос должен быть обслужен за 3\u00a0тика (SLA). Сколько интерактивных запросов шлюз обслужит за первые 3\u00a0тика окна?",
            },
            answer: 12, tol: 0.5,
            hint: {
              en: "Each tick the interactive side keeps 6 − 2 slots; within the 3-tick SLA that is (6 − 2) × 3.",
              ru: "В каждый тик интерактиву остаются 6 − 2 слота; за 3\u00a0тика SLA это (6 − 2) × 3.",
            },
            followUp: {
              q: { en: "Why not hand the batch pool every slot for the whole window?", ru: "Почему не отдать batch-пулу все слоты на всё окно?" },
              options: [
                { en: "An interactive SLA timeout costs ×2 in the metric, while a served batch job earns only 0.5 — starving interactive slots for batch always loses", ru: "Таймаут интерактивного SLA стоит в метрике ×2, а обслуженная batch-работа приносит только 0.5 — голодание интерактива ради батча всегда проигрывает" },
                { en: "Batch jobs cannot be queued — each one permanently owns a dedicated slot", ru: "Batch-задания нельзя ставить в очередь — каждое навсегда занимает выделенный слот" },
                { en: "The engine cannot mix interactive and batch requests in one slot pool", ru: "Движок не умеет смешивать интерактивные и batch-заявки в одном пуле слотов" },
              ],
              answer: 0,
              explain: { en: "The two-queue economy (capstone contract v2): M2 = served_inter − 2 × timed_out_inter + 0.5 × served_batch. Offline traffic is patient and cheap per job, but a timed-out interactive request costs four batch credits. Handing slots to batch is the policy's right — bounded by B_MAX and priced by the metric, never the whole envelope.", ru: "Экономика двух очередей (контракт капстоуна v2): M2 = served_inter − 2 × timed_out_inter + 0.5 × served_batch. Офлайн-трафик терпелив и дёшев за работу, но таймаут интерактива стоит четырёх batch-кредитов. Отдать слоты батчу — право политики, ограниченное потолком B_MAX и оплачиваемое метрикой, но никогда весь конверт." },
            },
          },
          {
            q: {
              en: "The gateway runs a batch window of 6 ticks: 2 of its 7 slots go to the batch pool (offline inference), the rest serve interactive traffic. An interactive request must be served within 3 ticks (the SLA). How many interactive requests does the gateway serve during the first 3 ticks of the window?",
              ru: "Шлюз держит batch-окно в 6\u00a0тиков: 2 из 7\u00a0слотов уходят batch-пулу (офлайн-инференс), остальные обслуживают интерактив. Интерактивный запрос должен быть обслужен за 3\u00a0тика (SLA). Сколько интерактивных запросов шлюз обслужит за первые 3\u00a0тика окна?",
            },
            answer: 15, tol: 0.5,
            hint: {
              en: "Each tick the interactive side keeps 7 − 2 slots; within the 3-tick SLA that is (7 − 2) × 3.",
              ru: "В каждый тик интерактиву остаются 7 − 2 слота; за 3\u00a0тика SLA это (7 − 2) × 3.",
            },
            followUp: {
              q: { en: "Why not hand the batch pool every slot for the whole window?", ru: "Почему не отдать batch-пулу все слоты на всё окно?" },
              options: [
                { en: "An interactive SLA timeout costs ×2 in the metric, while a served batch job earns only 0.5 — starving interactive slots for batch always loses", ru: "Таймаут интерактивного SLA стоит в метрике ×2, а обслуженная batch-работа приносит только 0.5 — голодание интерактива ради батча всегда проигрывает" },
                { en: "Batch jobs cannot be queued — each one permanently owns a dedicated slot", ru: "Batch-задания нельзя ставить в очередь — каждое навсегда занимает выделенный слот" },
                { en: "The engine cannot mix interactive and batch requests in one slot pool", ru: "Движок не умеет смешивать интерактивные и batch-заявки в одном пуле слотов" },
              ],
              answer: 0,
              explain: { en: "The two-queue economy (capstone contract v2): M2 = served_inter − 2 × timed_out_inter + 0.5 × served_batch. Offline traffic is patient and cheap per job, but a timed-out interactive request costs four batch credits. Handing slots to batch is the policy's right — bounded by B_MAX and priced by the metric, never the whole envelope.", ru: "Экономика двух очередей (контракт капстоуна v2): M2 = served_inter − 2 × timed_out_inter + 0.5 × served_batch. Офлайн-трафик терпелив и дёшев за работу, но таймаут интерактива стоит четырёх batch-кредитов. Отдать слоты батчу — право политики, ограниченное потолком B_MAX и оплачиваемое метрикой, но никогда весь конверт." },
            },
          },
        ],
      },
    ],
    exercises: [
    {
      id: "ex0",
      title: { en: "Exercise 0 · Warm-up: what counts as success", ru: "Упражнение 0 · Разогрев: что считается успехом" },
      brief: {
        en: "One line to start: implement <code>status_is_success(status)</code> — exactly <code>true</code> for HTTP 200 and <code>false</code> for everything else. The whole gateway contract hangs on this single predicate; anything that is not 200 is a decision, not a success.",
        ru: "Одна строка для старта: реализуй <code>status_is_success(status)</code> — ровно <code>true</code> для HTTP 200 и <code>false</code> для всего остального. На этом одном предикате держится весь контракт шлюза; всё, что не 200, — это решение, а не успех.",
      },
      starter: `def status_is_success(status):
    """True only for HTTP 200."""
    # TODO: one comparison
`,
      tests: [
        { name: "200 is success", hidden: false, code: "eq(status_is_success(200), True)" },
        { name: "429 is not", hidden: false, code: "eq(status_is_success(429), False)" },
        { name: "504 is not", hidden: false, code: "eq(status_is_success(504), False)" },
        { name: "0 (cancelled) is not", hidden: true, code: "eq(status_is_success(0), False)" },
        { name: "201 is also not 200", hidden: true, code: "eq(status_is_success(201), False)" },
      ],
      solution: `def status_is_success(status):
    return status == 200`,
      hints: [
        { en: "One comparison. 200, and nothing else.", ru: "Одно сравнение. 200 — и ничего больше." },
      ],
      numpy: false,
      timeoutMs: 4000,
    },
      {
        id: "ex1",
        title: { en: "Exercise 1 · Outcome → status map", ru: "Упражнение 1 · Карта «исход → код»" },
        brief: {
          en: "Implement <code>map_engine_error(outcome, request_id)</code> — one terminal outcome to an honest answer: a dict with <code>http_status</code>, <code>payload</code> (carries <code>error</code> and <code>request_id</code>) and <code>headers</code>. Map: <code>invalid</code> → 400, <code>overloaded</code> → 429 with header <code>Retry-After: '1'</code>, <code>engine_down</code> → 503, <code>deadline</code> → 504, everything else → 500 without internals. Never 200-with-error-body: the status code is the first truth the client reads.",
          ru: "Реализуй <code>map_engine_error(outcome, request_id)</code> — один терминальный исход в честный ответ: dict с <code>http_status</code>, <code>payload</code> (везёт <code>error</code> и <code>request_id</code>) и <code>headers</code>. Карта: <code>invalid</code> → 400, <code>overloaded</code> → 429 с заголовком <code>Retry-After: '1'</code>, <code>engine_down</code> → 503, <code>deadline</code> → 504, всё остальное → 500 без внутренностей. Никогда не 200-with-error-body: статус-код — первая правда, которую читает клиент.",
        },
        starter: `def map_engine_error(outcome, request_id):
    """Map one terminal outcome to an honest HTTP answer for the client.

    Returns {'http_status': int, 'payload': dict, 'headers': dict};
    the payload carries 'error' and 'request_id'.
    """
    # TODO: invalid -> 400, overloaded -> 429 (+ Retry-After), engine_down -> 503,
    # deadline -> 504, everything else -> 500 without internals.
    # v0 below answers 200 to everything: a status is not decoration.
    return {'http_status': 200,
            'payload': {'error': outcome, 'request_id': request_id},
            'headers': {}}
`,
        tests: [
          { name: "invalid maps to 400", hidden: false, code: `eq(map_engine_error('invalid', 'r-1')['http_status'], 400)` },
          { name: "overloaded is 429 with Retry-After", hidden: false, code: `m = map_engine_error('overloaded', 'r-2')
eq(m['http_status'], 429)
eq(m['headers'].get('Retry-After'), '1')
eq(m['payload'].get('request_id'), 'r-2')` },
          { name: "deadline carries request id", hidden: false, code: `m = map_engine_error('deadline', 'r-9')
eq(m['http_status'], 504)
eq(m['payload'].get('request_id'), 'r-9')` },
          { name: "down 503, bug 500", hidden: true, code: `eq(map_engine_error('engine_down', 'r-3')['http_status'], 503)
eq(map_engine_error('engine_bug', 'r-4')['http_status'], 500)` },
        ],
        solution: `def map_engine_error(outcome, request_id):
    statuses = {'invalid': 400, 'overloaded': 429,
                'engine_down': 503, 'deadline': 504}
    status = statuses.get(outcome, 500)
    payload = {'error': outcome, 'request_id': request_id}
    headers = {'Retry-After': '1'} if outcome == 'overloaded' else {}
    return {'http_status': status, 'payload': payload, 'headers': headers}`,
        hints: [
          { en: "Four named codes in a dict, .get(outcome, 500) for the rest; Retry-After only on the 429 branch.", ru: "Четыре именованных кода в dict, .get(outcome, 500) для остальных; Retry-After только на ветке 429." },
        ],
        numpy: false,
        timeoutMs: 4000,
      },
      {
        id: "ex2",
        title: { en: "Exercise 2 · Bounded queue envelope", ru: "Упражнение 2 · Конверт ограниченной очереди" },
        brief: {
          en: "Implement <code>admission_envelope(arrivals, capacity, queue_slots)</code> — the closed form of the burst drill: first <code>min(arrivals, capacity)</code> requests take service slots, the next ones fill up to <code>queue_slots</code> waiting seats, everyone past both gets an honest 429. Return <code>{'admitted': …, 'queued': …, 'rejected': …}</code>; the three counts add up to <code>arrivals</code>. With 4 + 4 seats the burst of 24 must give 8 served and 16 rejections.",
          ru: "Реализуй <code>admission_envelope(arrivals, capacity, queue_slots)</code> — замкнутую форму дрилла бурста: первые <code>min(arrivals, capacity)</code> запросов берут слоты обслуживания, следующие заполняют до <code>queue_slots</code> мест ожидания, все, кто сверх, получают честный 429. Верни <code>{'admitted': …, 'queued': …, 'rejected': …}</code>; три числа в сумме дают <code>arrivals</code>. При 4 + 4 местах бурст из 24 должен дать 8 обслуженных и 16 отказов.",
        },
        starter: `def admission_envelope(arrivals, capacity, queue_slots):
    """Closed form of one synchronous burst against a bounded queue.

    Returns {'admitted': int, 'queued': int, 'rejected': int};
    the three counts must add up to arrivals.
    """
    # TODO: service slots first (capacity), then bounded waiting seats
    # (queue_slots); everyone past both gets an honest 429.
    # v0 below admits everything: an unbounded queue is delay, not capacity.
    return {'admitted': arrivals, 'queued': 0, 'rejected': 0}
`,
        tests: [
          { name: "burst 24 against 4+4", hidden: false, code: `eq(admission_envelope(24, 4, 4), {'admitted': 4, 'queued': 4, 'rejected': 16})` },
          { name: "exactly the seats", hidden: false, code: `eq(admission_envelope(8, 4, 4), {'admitted': 4, 'queued': 4, 'rejected': 0})` },
          { name: "half-full pool", hidden: true, code: `eq(admission_envelope(3, 4, 4), {'admitted': 3, 'queued': 0, 'rejected': 0})` },
          { name: "empty wave", hidden: true, code: `eq(admission_envelope(0, 4, 4), {'admitted': 0, 'queued': 0, 'rejected': 0})` },
        ],
        solution: `def admission_envelope(arrivals, capacity, queue_slots):
    admitted = min(arrivals, capacity)
    queued = min(max(arrivals - capacity, 0), queue_slots)
    rejected = max(arrivals - capacity - queue_slots, 0)
    return {'admitted': admitted, 'queued': queued, 'rejected': rejected}`,
        hints: [
          { en: "Three clamps: min for the slots, min of the remainder for the queue, max(…, 0) for the refusals.", ru: "Три ограничения (clamp): min для слотов, min остатка для очереди, max(…, 0) для отказов." },
        ],
        numpy: false,
        timeoutMs: 4000,
      },
      {
        id: "ex3",
        title: { en: "Exercise 3 · Fix the bug: success is not “not-429”", ru: "Упражнение 3 · Почини баг: успех — это не «не 429»" },
        brief: {
          en: "This <code>classify_outcome(status)</code> counts every non-429 as success: a client that timed out or dropped mid-generation ends up <code>'completed'</code>, and the metrics lie — the orphan generation keeps burning tokens that no dashboard explains. Fix it to the contract from the docstring: 200 → <code>'completed'</code>, 429 → <code>'rejected'</code>, 0 → <code>'cancelled'</code> (the socket died together with the leaving client), any other status → <code>'failed'</code>.",
          ru: "Эта <code>classify_outcome(status)</code> засчитывает любой не-429 как успех: клиент, у которого вышел таймаут или который ушёл посреди генерации, получает <code>'completed'</code>, и метрики лгут — orphan-генерация продолжает жечь токены, которые никто не объясняет. Почини по контракту из docstring: 200 → <code>'completed'</code>, 429 → <code>'rejected'</code>, 0 → <code>'cancelled'</code> (сокет умер вместе с уходящим клиентом), любой другой статус → <code>'failed'</code>.",
        },
        starter: `def classify_outcome(status):
    """Classify one terminal HTTP status for the metrics journal.

    Contract: 200 -> 'completed', 429 -> 'rejected', 0 -> 'cancelled'
    (the socket died together with the leaving client), any other
    status (400/500/503/504) -> 'failed'.
    """
    # BUG: everything that is not 429 is counted as success. A client
    # that timed out or dropped mid-generation did NOT get a completed
    # answer - success is not separated from rejection, the metrics lie.
    return 'rejected' if status == 429 else 'completed'
`,
        tests: [
          { name: "200 is completed", hidden: false, code: `eq(classify_outcome(200), 'completed')` },
          { name: "429 is rejected", hidden: false, code: `eq(classify_outcome(429), 'rejected')` },
          { name: "dropped client is not success", hidden: false, code: `eq(classify_outcome(0), 'cancelled')` },
          { name: "gateway timeout is failed", hidden: true, code: `eq(classify_outcome(504), 'failed')
eq(classify_outcome(400), 'failed')` },
        ],
        solution: `def classify_outcome(status):
    if status == 200:
        return 'completed'
    if status == 429:
        return 'rejected'
    if status == 0:
        return 'cancelled'
    return 'failed'`,
        hints: [
          { en: "Four branches, each with one named outcome; 0 is the disconnect probe from http_request, not a success.", ru: "Четыре ветки, у каждой — свой именованный исход; 0 — сигнал обрыва соединения из http_request, а не успех." },
        ],
        numpy: false,
        timeoutMs: 4000,
      },
    ],
    challenge: {
      id: "chal1",
      word: { en: "challenge", ru: "челлендж" },
      title: {
        en: "★ Tune the live burst: many served, few excuses",
        ru: "★ Оттюни живой бурст: много обслуженных, мало отговорок",
      },
      brief: {
        en: "Needs the Layer 2 runtime (docker compose up — the section below). Run real bursts with the burst button and choose <code>slots</code> and <code>queue_slots</code> yourself (arrivals fixed at 24) so that <strong>completed ≥ 8</strong> while <strong>rejected ≤ 10</strong> — better than the default 4+4 that drops 16. No tests guide you; the page checks your report against the admission envelope the gateway actually enforces.",
        ru: "Нужен рантайм слоя 2 (docker compose up — секция ниже). Гоняй настоящие бурсты кнопкой «Бурст» и подбери собственные <code>slots</code> и <code>queue_slots</code> (заявки фиксированы — 24) так, чтобы <strong>completed ≥ 8</strong> при <strong>rejected ≤ 10</strong> — лучше дефолтных 4+4, теряющих 16. Тестов-каркаса нет; страница сверяет твой отчёт с конвертом допуска, который реально исполняет шлюз.",
      },
      goal: {
        en: "Report one burst from YOUR gateway: slots + queue_slots so that 24 arrivals give completed ≥ 8 and rejected ≤ 10.",
        ru: "Отчитайся одним бурстом СВОЕГО шлюза: slots + queue_slots так, чтобы 24 заявки дали completed ≥ 8 и rejected ≤ 10.",
      },
      mode: "report",
      fields: [
        { key: "slots", label: { en: "slots (in flight)", ru: "slots (в полёте)" }, type: "number" },
        { key: "queue", label: { en: "queue_slots (waiting)", ru: "queue_slots (ждут)" }, type: "number" },
        { key: "admitted", label: { en: "admitted (from the burst line)", ru: "admitted (из строки бурста)" }, type: "number" },
        { key: "rejected", label: { en: "rejected (429 ×)", ru: "rejected (429 ×)" }, type: "number" },
        { key: "seq", label: { en: "journal entry #", ru: "запись журнала #" }, type: "number" },
      ],
      check: (v) => {
        const num = (k) => parseInt(String(v[k] || ""), 10);
        const slots = num("slots"), queue = num("queue"), admitted = num("admitted"), rejected = num("rejected"), seq = num("seq");
        if (![slots, queue, admitted, rejected, seq].every((x) => Number.isFinite(x) && x >= 0)) {
          return { ok: false, note: { en: "fill every field with a whole non-negative number", ru: "заполни каждое поле целым неотрицательным числом" } };
        }
        if (slots < 1) {
          return { ok: false, note: { en: "at least one service slot, otherwise nothing completes", ru: "нужен хотя бы один слот обслуживания, иначе не завершится ничего" } };
        }
        if (slots > 8 || queue > 16) {
          return { ok: false, note: { en: "the burst form caps slots at 8 and queue_slots at 16 - report a burst you could actually run", ru: "форма бурста ограничивает slots до 8 и queue_slots до 16 — отчитайся бурстом, который реально можно запустить" } };
        }
        if (admitted !== slots + queue) {
          return { ok: false, note: { en: "the envelope admits exactly slots + queue_slots = " + (slots + queue) + " (arrivals 24 cover them)", ru: "конверт допускает ровно slots + queue_slots = " + (slots + queue) + " (24 заявки их покрывают)" } };
        }
        if (admitted + rejected !== 24) {
          return { ok: false, note: { en: "admitted + rejected must equal the 24 arrivals, got " + (admitted + rejected), ru: "admitted + rejected должны давать 24 заявки, а дают " + (admitted + rejected) } };
        }
        if (rejected > 10) {
          return { ok: false, note: { en: "rejected " + rejected + " > 10 - keep trading queue seats against refusals", ru: "rejected " + rejected + " > 10 — продолжай менять места очереди на отказы" } };
        }
        if (admitted < 8) {
          return { ok: false, note: { en: "completed ceiling is admitted = " + admitted + " < 8 - widen the envelope", ru: "потолок completed равен admitted = " + admitted + " < 8 — расширяй конверт" } };
        }
        return { ok: true, note: { en: "slots " + slots + " + queue " + queue + ": " + admitted + " admitted, " + rejected + " rejected (journal #" + seq + ") - the envelope beat the default", ru: "slots " + slots + " + queue " + queue + ": допущено " + admitted + ", отбито " + rejected + " (журнал #" + seq + ") — конверт обыграл дефолт" } };
      },
      reference: `# The envelope's closed form (your Exercise 2) is what the gateway runs.
# arrivals = 24, so admitted = slots + queue_slots (when seats <= 24) and
# rejected = 24 - admitted. The burst form caps slots at 8, queue at 16,
# so the best honest admission is 8 + 16 = 24 seats -> rejected 0.
# A comfortable point inside the caps: slots=8, queue_slots=8 -> admitted
# 16, rejected 8. The lesson: queue seats convert instant 429s into honest
# waiting; they cost nothing but time. Report YOUR real burst + journal #.`,
    },
    runtime: {
      title: {
        en: "Drill on your own gateway: the practice runtime",
        ru: "Дрилл на своём шлюзе: practice-рантайм",
      },
      brief: {
        en: "The Layer 2 runtime (ZIP below, <code>docker compose up -d</code>) carries a real admission drill: <code>POST /burst</code> fires concurrent requests at the engine through a bounded envelope — <code>slots</code> in flight, <code>queue_slots</code> waiting, everything beyond that rejected with an honest 429 + Retry-After. Nothing is simulated: queued requests really wait, timings are your machine's. Run a burst, then compare admitted/rejected with your own <code>admission_envelope</code> from Exercise 2 — the formula you tested is the formula the gateway enforces.",
        ru: "Рантайм слоя 2 (ZIP ниже, <code>docker compose up -d</code>) держит настоящий admission-дрилл: <code>POST /burst</code> бьёт по движку параллельными запросами через ограниченный конверт — <code>slots</code> в полёте, <code>queue_slots</code> ждут, всё сверх — честный 429 + Retry-After. Ничего не симулируется: очередь ждёт по-настоящему, тайминги — твоей машины. Сделай бурст и сравни admitted/rejected со своей <code>admission_envelope</code> из Упражнения 2 — формула, которую ты тестировал, — это формула, которую исполняет шлюз.",
      },
      burst: {
        arrivals: 24,
        slots: 4,
        queueSlots: 4,
        maxTokens: 12,
        prompt: {
          en: "Reply with a single short sentence.",
          ru: "Ответь одним коротким предложением.",
        },
      },
      footer: {
        en: "Bursts are machine-local and honest. The gateway's own verifier is GET /journal/verify; each burst lands in the hash chain (kind=burst).",
        ru: "Бурсты честны и зависят только от твоей машины. Собственный верификатор шлюза — GET /journal/verify; каждый бурст попадает в хэш-цепочку (kind=burst).",
      },
    },
    posttest: [
      {
        id: "p1",
        q: { en: "HTTP 429 with Retry-After is\u2026", ru: "HTTP 429\u00a0\u0441 Retry-After \u2014 \u044d\u0442\u043e\u2026" },
        options: [{ en: "an honest admission decision: try again later", ru: "\u0447\u0435\u0441\u0442\u043d\u043e\u0435 \u0440\u0435\u0448\u0435\u043d\u0438\u0435 \u0434\u043e\u043f\u0443\u0441\u043a\u0430: \u043f\u043e\u0432\u0442\u043e\u0440\u0438 \u043f\u043e\u0437\u0436\u0435" }, { en: "an engine bug", ru: "\u0431\u0430\u0433 \u0434\u0432\u0438\u0436\u043a\u0430" }, { en: "a successful answer", ru: "\u0443\u0441\u043f\u0435\u0448\u043d\u044b\u0439 \u043e\u0442\u0432\u0435\u0442" }],
        answer: 0,
        explain: { en: "429 separates rejection from success. Hiding overload in timeouts is the failure mode the lab drills.", ru: "429 \u043e\u0442\u0434\u0435\u043b\u044f\u0435\u0442 \u043e\u0442\u043a\u0430\u0437 \u043e\u0442 \u0443\u0441\u043f\u0435\u0445\u0430. \u041f\u0440\u044f\u0442\u0430\u0442\u044c \u043f\u0435\u0440\u0435\u0433\u0440\u0443\u0437\u043a\u0443 \u0432\u00a0\u0442\u0430\u0439\u043c\u0430\u0443\u0442\u0430\u0445 \u2014 \u0442\u043e\u0442 \u0430\u043d\u0442\u0438\u043f\u0430\u0442\u0442\u0435\u0440\u043d, \u043a\u043e\u0442\u043e\u0440\u044b\u0439 \u0433\u043e\u043d\u044f\u0435\u0442 \u043b\u0430\u0431\u0430." },
      },
      {
        id: "p2",
        q: { en: "Which outcome counts as success for the client ledger?", ru: "\u041a\u0430\u043a\u043e\u0439 \u0438\u0441\u0445\u043e\u0434 \u0441\u0447\u0438\u0442\u0430\u0435\u0442\u0441\u044f \u0443\u0441\u043f\u0435\u0445\u043e\u043c \u0432\u00a0\u043a\u043b\u0438\u0435\u043d\u0442\u0441\u043a\u043e\u0439 \u0432\u0435\u0434\u043e\u043c\u043e\u0441\u0442\u0438?" },
        options: [{ en: "only HTTP 200 with a full response", ru: "\u0442\u043e\u043b\u044c\u043a\u043e HTTP 200\u00a0\u0441 \u043f\u043e\u043b\u043d\u044b\u043c \u043e\u0442\u0432\u0435\u0442\u043e\u043c" }, { en: "200 and 429", ru: "200 \u0438 429" }, { en: "anything but 500", ru: "\u0432\u0441\u0451, \u043a\u0440\u043e\u043c\u0435 500" }],
        answer: 0,
        explain: { en: "Cancellation (0) and timeouts are not successes either \u2014 the map is outcome \u2192 status \u2192 client action.", ru: "\u041e\u0442\u043c\u0435\u043d\u0430 (0) \u0438\u00a0\u0442\u0430\u0439\u043c\u0430\u0443\u0442\u044b \u2014 \u0442\u043e\u0436\u0435 \u043d\u0435 \u0443\u0441\u043f\u0435\u0445\u0438: \u043a\u0430\u0440\u0442\u0430 \u00ab\u0438\u0441\u0445\u043e\u0434 \u2192 \u0441\u0442\u0430\u0442\u0443\u0441 \u2192 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0435 \u043a\u043b\u0438\u0435\u043d\u0442\u0430\u00bb." },
      },
      {
        id: "p3",
        q: { en: "Bounded queue with 4 slots + 4 queue places gets 24 arrivals. The gateway\u2026", ru: "\u041a\u043e\u043d\u0432\u0435\u0440\u0442: 4 \u0441\u043b\u043e\u0442\u0430 \u043e\u0431\u0441\u043b\u0443\u0436\u0438\u0432\u0430\u043d\u0438\u044f + 4 \u043c\u0435\u0441\u0442\u0430 \u043e\u0447\u0435\u0440\u0435\u0434\u0438 \u2014 \u043f\u043e\u0441\u0442\u0443\u043f\u0430\u0435\u0442 24 \u0437\u0430\u044f\u0432\u043a\u0438. \u0428\u043b\u044e\u0437\u2026" },
        options: [{ en: "admits 4 and queues 4 (8 in system), rejects 16 with 429", ru: "допускает 4 и ставит в очередь 4 (8 в системе), отбивает 16 с 429" }, { en: "admits all 24", ru: "\u0434\u043e\u043f\u0443\u0441\u043a\u0430\u0435\u0442 \u0432\u0441\u0435 24" }, { en: "rejects all 24", ru: "\u043e\u0442\u0431\u0438\u0432\u0430\u0435\u0442 \u0432\u0441\u0435 24" }],
        answer: 0,
        explain: { en: "admitted = min(arrivals, slots + queue) = 8; the rest get immediate 429 instead of hidden waiting.", ru: "admitted = min(\u0437\u0430\u044f\u0432\u043a\u0438, \u0441\u043b\u043e\u0442\u044b + \u043e\u0447\u0435\u0440\u0435\u0434\u044c) = 8; \u043e\u0441\u0442\u0430\u043b\u044c\u043d\u044b\u0435 \u043f\u043e\u043b\u0443\u0447\u0430\u044e\u0442 \u043d\u0435\u043c\u0435\u0434\u043b\u0435\u043d\u043d\u044b\u0439 429 \u0432\u043c\u0435\u0441\u0442\u043e \u0441\u043a\u0440\u044b\u0442\u043e\u0433\u043e \u043e\u0436\u0438\u0434\u0430\u043d\u0438\u044f." },
      },
      {
        id: "b1",
        tag: { en: "bridge · T06", ru: "мост · T06" },
        context: { en: "T06 taught the saturation knee: the load where demand hits the seats. Here the seats are the gateway's slots + queue, and each request holds its seat for W seconds.", ru: "T06 учила колену насыщения: нагрузке, при которой спрос упирается в места. Здесь места — это slots + queue шлюза, и каждый запрос держит своё место W секунд." },
        q: { en: "Clients switch to 32-token requests (W = 0.15 + 0.02 × 32 = 0.79 s). What happens to the gateway's knee λ* = seats / W?", ru: "Клиенты переходят на запросы по 32 токена (W = 0.15 + 0.02 × 32 = 0.79 с). Что происходит с коленом шлюза λ* = места / W?" },
        options: [
          { en: "It drops to ≈ 10 req/s: the seats are the same, but each request holds its seat almost twice as long", ru: "Падает до ≈ 10 req/s: места те же, но каждый запрос держит своё место почти вдвое дольше" },
          { en: "It rises to ≈ 34 req/s: longer requests are more efficient per seat", ru: "Растёт до ≈ 34 req/s: длинные запросы эффективнее на место" },
          { en: "It does not move: the knee depends only on the number of seats", ru: "Не двигается: колено зависит только от числа мест" },
        ],
        answer: 0,
        explain: { en: "λ* = 8 / 0.79 ≈ 10.1 req/s (was ≈ 17). The T06 mechanism transfers unchanged: the knee is seats divided by hold time. Note what does NOT change: the synchronous burst of 24 still admits 8 and rejects 16 — the envelope counts arrivals against seats, not seconds. What shrinks is the sustained load the gateway can absorb before honest 429s begin.", ru: "λ* = 8 / 0.79 ≈ 10.1 req/s (было ≈ 17). Механизм T06 переносится без изменений: колено — это места, делённые на время удержания. А вот что НЕ меняется: синхронный бурст из 24 по-прежнему допускает 8 и отбивает 16 — конверт считает заявки против мест, а не секунды. Сжимается тот постоянный темп, который шлюз вмещает до первых честных 429." },
      },
    ],
    reward: {
      caption: { en: "Errors mapped, admission bounded, 429 honest \u2014 your gateway survives a burst.", ru: "\u041e\u0448\u0438\u0431\u043a\u0438 \u0440\u0430\u0437\u043c\u0435\u0447\u0435\u043d\u044b, \u0434\u043e\u043f\u0443\u0441\u043a \u043e\u0433\u0440\u0430\u043d\u0438\u0447\u0435\u043d, 429 \u0447\u0435\u0441\u0442\u043d\u044b\u0439 \u2014 \u0442\u0432\u043e\u0439 \u0448\u043b\u044e\u0437 \u043f\u0435\u0440\u0435\u0436\u0438\u0432\u0451\u0442 \u0431\u0443\u0440\u0441\u0442." },
    },
    footer: {
      en: "Teaching arithmetic on a declared mock engine (ttft 0.15 s, 0.02 s per token, seats 4+4) — not a vLLM measurement. The recorded gateway drills live in the Topic 08 evidence run (runs/2026-10-26-topic08-gateway-mock); this lab does not execute them.",
      ru: "Учебная арифметика на заявленном моке движка (<code>ttft</code> 0.15 с, 0.02 с за токен, места 4+4) — не измерение vLLM. Прогоны дриллов шлюза записаны в evidence-прогоне Темы 08 (runs/2026-10-26-topic08-gateway-mock); эта лаба их не исполняет.",
    },
  };
})();
