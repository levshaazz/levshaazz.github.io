/* Lab 08 — Production API: the gateway in front of the frozen engine profile.
   Content module for the generic lab page (window.LABS_CONTENT['8']).
   Sources: seminars/08-production-api.ipynb (MockEngine handles, AdmissionQueue,
   map_engine_error, the burst drill envelope). Declared teaching model only. */
(function () {
  "use strict";
  window.LABS_CONTENT = window.LABS_CONTENT || {};

  LABS_CONTENT["8"] = {
    title: {
      en: "Production inference API: the gateway",
      ru: "Продакшен-API инференса: шлюз",
    },
    sub: {
      en: "Admission with a bounded queue, honest 429, the outcome-to-status map and cancellation — predicted before the code, checked by tests.",
      ru: "Admission с ограниченной очередью, честный 429, карта «исход → код → действие» и отмена — предсказано до кода, проверено тестами.",
    },
    intro: {
      en: `<p>A gateway is a thin HTTP layer between clients and the engine, and its job is to turn Topic 06 mechanisms into a contract: validation before the queue, a <strong>bounded queue</strong> that answers 429 with <code>Retry-After</code> instead of promising infinite waiting, an <strong>outcome → status</strong> map (invalid 400, overloaded 429, engine down 503, deadline 504, everything else 500 without internals), and cancellation that stops paying for abandoned tokens. HTTP 200 means "an answer was sent", not "the request succeeded" — a client timeout counted as success is a lie the metrics will repeat at 3 a.m.</p>
<p>The lab habit: freeze the contract table (situation → mechanism → expected code) BEFORE any gateway code, then let drills and the journal check it. All numbers here are a declared mock engine: ttft 0.15 s, 0.02 s per token, 4 service slots + 4 queue seats — arithmetic you can verify by hand, not a vLLM measurement.</p>`,
      ru: `<p>Шлюз — тонкий HTTP-слой между клиентами и движком, и его работа — превратить механизмы Темы 06 в контракт: валидация до очереди, <strong>ограниченная очередь</strong>, отвечающая 429 с <code>Retry-After</code> вместо обещания вечного ожидания, карта <strong>«исход → код»</strong> (invalid 400, overloaded 429, движок лежит 503, deadline 504, остальное 500 без внутренностей) и отмена, которая перестаёт платить за брошенные токены. HTTP 200 означает «ответ отправлен», а не «запрос успешен» — таймаут клиента, засчитанный как успех, — это ложь, которую метрики повторят в 3 часа ночи.</p>
<p>Привычка лабы: заморозить таблицу контракта (ситуация → механизм → ожидаемый код) ДО кода шлюза, потом дать drill'ам и журналу её проверить. Все числа здесь — объявленный мок движка: ttft 0.15 с, 0.02 с за токен, 4 слота обслуживания + 4 места очереди, — арифметика, которую можно проверить руками, а не измерение vLLM.</p>`,
    },
    figures: [
      { id: "t8-error-map", caption: { en: "Error map: outcome \u2192 status \u2192 client action.", ru: "\u041a\u0430\u0440\u0442\u0430 \u043e\u0448\u0438\u0431\u043e\u043a: \u0438\u0441\u0445\u043e\u0434 \u2192 \u0441\u0442\u0430\u0442\u0443\u0441 \u2192 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0435 \u043a\u043b\u0438\u0435\u043d\u0442\u0430." } },
      { id: "t8-queue-economy", caption: { en: "Queue economy: admitted, queued, rejected.", ru: "\u042d\u043a\u043e\u043d\u043e\u043c\u0438\u043a\u0430 \u043e\u0447\u0435\u0440\u0435\u0434\u0438: \u0434\u043e\u043f\u0443\u0449\u0435\u043d\u044b, \u0436\u0434\u0443\u0442, \u043e\u0442\u0431\u0438\u0442\u044b." } },
    ],
    outcomes: [
      { en: "Map every failure outcome to a status code and a client action.", ru: "\u041c\u0430\u043f\u043f\u0438\u0442\u044c \u043a\u0430\u0436\u0434\u044b\u0439 \u043e\u0442\u043a\u0430\u0437 \u043d\u0430 \u043a\u043e\u0434 \u0441\u043e\u0441\u0442\u043e\u044f\u043d\u0438\u044f \u0438 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0435 \u043a\u043b\u0438\u0435\u043d\u0442\u0430." },
      { en: "Keep rejection honest: a 429 is a decision, never a disguised success.", ru: "\u0414\u0435\u0440\u0436\u0430\u0442\u044c \u043e\u0442\u043a\u0430\u0437 \u0447\u0435\u0441\u0442\u043d\u044b\u043c: 429 \u2014 \u044d\u0442\u043e \u0440\u0435\u0448\u0435\u043d\u0438\u0435, \u0430 \u043d\u0435 \u0437\u0430\u043c\u0430\u0441\u043a\u0438\u0440\u043e\u0432\u0430\u043d\u043d\u044b\u0439 \u0443\u0441\u043f\u0435\u0445." },
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
          en: "A burst of 24 clients hits a gateway with 4 service slots and 4 queue seats. How many honest 429 answers does the envelope predict?",
          ru: "Бурст из 24 клиентов бьёт в шлюз с 4 слотами обслуживания и 4 местами очереди. Сколько честных 429 предсказывает конверт?",
        },
        answer: 16, tol: 0.5, unit: { en: "requests", ru: "запросов" },
        hint: {
          en: "Seats = capacity + queue = 8; everyone past them is refused: 24 − 8.",
          ru: "Места = capacity + queue = 8; все, кто сверх, получают отказ: 24 − 8.",
        },
      },
      {
        id: "q2",
        q: {
          en: "With the declared mock handles (ttft 0.15 s, 0.02 s per token), how long does one full 64-token request take, in seconds?",
          ru: "С объявленными ручками мока (ttft 0.15 с, 0.02 с за токен) — сколько длится полный запрос на 64 токена, в секундах?",
        },
        answer: 1.43, tol: 0.01, unit: { en: "s", ru: "с" },
        hint: {
          en: "W = 0.15 + 0.02 × 64 = 0.15 + 1.28.",
          ru: "W = 0.15 + 0.02 × 64 = 0.15 + 1.28.",
        },
      },
      {
        id: "q3",
        q: {
          en: "Queue knee λ* for 16-token requests (W = 0.47 s) with 8 in-system seats — in req/s?",
          ru: "Колено очереди λ* для запросов на 16 токенов (W = 0.47 с) при 8 местах в системе — в req/s?",
        },
        answer: 17, tol: 0.5, unit: { en: "req/s", ru: "req/s" },
        hint: {
          en: "λ* = seats / W = 8 / 0.47 ≈ 17.0.",
          ru: "λ* = места / W = 8 / 0.47 ≈ 17.0.",
        },
      },
    ],
    exercises: [
    {
      id: "ex0",
      title: { en: "Exercise 0 · Warm-up: what counts as success", ru: "Упражнение 0 · Разогрев: что считается успехом" },
      brief: {
        en: "One line to start: implement <code>status_is_success(status)</code> — exactly <code>true</code> for HTTP 200 and <code>false</code> for everything else. The whole gateway contract hangs on this single predicate; anything that is not 200 is a decision, not a success.",
        ru: "Одна строка для старта: реализуй <code>status_is_success(status)</code> — ровно <code>true</code> для HTTP 200 и <code>false</code> для всего остального. На этом одном предикате держится весь контракт шлюза; всё, что не 200, — это решение, а не успех.",
      },
      starter: `def status_is_success(status):
    """True only for HTTP 200."""
    # TODO: одна строка
`,
      tests: [
        { name: "200 is success", hidden: false, code: "eq(status_is_success(200), True)" },
        { name: "429 is not", hidden: false, code: "eq(status_is_success(429), False)" },
        { name: "504 is not", hidden: false, code: "eq(status_is_success(504), False)" },
        { name: "0 (cancelled) is not", hidden: true, code: "eq(status_is_success(0), False)" },
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
          ru: "Реализуй <code>map_engine_error(outcome, request_id)</code> — один терминальный исход в честный ответ: dict с <code>http_status</code>, <code>payload</code> (везёт <code>error</code> и <code>request_id</code>) и <code>headers</code>. Карта: <code>invalid</code> → 400, <code>overloaded</code> → 429 с заголовком <code>Retry-After: '1'</code>, <code>engine_down</code> → 503, <code>deadline</code> → 504, всё остальное → 500 без внутренностей. Никогда не 200-with-error-body: статус-код — первая правда, которую читает клиент.",
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
          ru: "Реализуй <code>admission_envelope(arrivals, capacity, queue_slots)</code> — замкнутую форму drill'а бурста: первые <code>min(arrivals, capacity)</code> запросов берут слоты обслуживания, следующие заполняют до <code>queue_slots</code> мест ожидания, все, кто сверх, получают честный 429. Верни <code>{'admitted': …, 'queued': …, 'rejected': …}</code>; три числа в сумме дают <code>arrivals</code>. При 4 + 4 местах бурст из 24 должен дать 8 обслуженных и 16 отказов.",
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
          { en: "Three clamps: min for the slots, min of the remainder for the queue, max(…, 0) for the refusals.", ru: "Три зажима: min для слотов, min остатка для очереди, max(…, 0) для отказов." },
        ],
        numpy: false,
        timeoutMs: 4000,
      },
      {
        id: "ex3",
        title: { en: "Exercise 3 · Fix the bug: success is not “not-429”", ru: "Упражнение 3 · Почини баг: успех — это не «не 429»" },
        brief: {
          en: "This <code>classify_outcome(status)</code> counts every non-429 as success: a client that timed out or dropped mid-generation ends up <code>'completed'</code>, and the metrics lie — the orphan generation keeps burning tokens that no dashboard explains. Fix it to the contract from the docstring: 200 → <code>'completed'</code>, 429 → <code>'rejected'</code>, 0 → <code>'cancelled'</code> (the socket died together with the leaving client), any other status → <code>'failed'</code>.",
          ru: "Эта <code>classify_outcome(status)</code> засчитывает любой не-429 как успех: клиент, у которого вышел таймаут или который ушёл посреди генерации, получает <code>'completed'</code>, и метрики лгут — orphan-генерация продолжает жечь токены, которые никто не объясняет. Почини по контракту из docstring: 200 → <code>'completed'</code>, 429 → <code>'rejected'</code>, 0 → <code>'cancelled'</code> (сокет умер вместе с уходящим клиентом), любой другой статус → <code>'failed'</code>.",
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
          { en: "Four branches, each with one named outcome; 0 is the disconnect probe from http_request, not a success.", ru: "Четыре ветки, у каждой — свой именованный исход; 0 — проба отключения из http_request, а не успех." },
        ],
        numpy: false,
        timeoutMs: 4000,
      },
    ],
    runtime: {
      title: {
        en: "Drill on your own gateway: the practice runtime",
        ru: "Дрилл на своём шлюзе: practice-рантайм",
      },
      brief: {
        en: "The Layer 2 runtime (ZIP below, <code>docker compose up -d</code>) carries a real admission drill: <code>POST /burst</code> fires concurrent requests at the engine through a bounded envelope — <code>slots</code> in flight, <code>queue_slots</code> waiting, everything beyond that rejected with an honest 429 + Retry-After. Nothing is simulated: queued requests really wait, timings are your machine's. Run a burst, then compare admitted/rejected with your own <code>admission_envelope</code> from Exercise 2 — the formula you tested is the formula the gateway enforces.",
        ru: "Рантайм слоя 2 (ZIP ниже, <code>docker compose up -d</code>) держит настоящий admission-дрилл: <code>POST /burst</code> бьёт по движку параллельными запросами через ограниченный конверт — <code>slots</code> в полёте, <code>queue_slots</code> ждут, всё сверх — честный 429 + Retry-After. Ничего не симулируется: очередь ждёт по-настоящему, тайминги — твоей машины. Сделай бурст и сравни admitted/rejected со своей <code>admission_envelope</code> из Упражнения 2 — формула, которую ты тестировал, — это формула, которую исполняет шлюз.",
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
      reward: {
      caption: { en: "Errors mapped, admission bounded, 429 honest \u2014 your gateway survives a burst.", ru: "\u041e\u0448\u0438\u0431\u043a\u0438 \u0440\u0430\u0437\u043c\u0435\u0447\u0435\u043d\u044b, \u0434\u043e\u043f\u0443\u0441\u043a \u043e\u0433\u0440\u0430\u043d\u0438\u0447\u0435\u043d, 429 \u0447\u0435\u0441\u0442\u043d\u044b\u0439 \u2014 \u0442\u0432\u043e\u0439 \u0448\u043b\u044e\u0437 \u043f\u0435\u0440\u0435\u0436\u0438\u0432\u0451\u0442 \u0431\u0443\u0440\u0441\u0442." },
    },
    footer: {
        en: "Bursts are machine-local and honest. The gateway's own verifier is GET /journal/verify; each burst lands in the hash chain (kind=burst).",
        ru: "Бурсты машинно-локальные и честные. Собственный верификатор шлюза — GET /journal/verify; каждый бурст попадает в хэш-цепочку (kind=burst).",
      },
    },
    footer: {
      en: "Teaching arithmetic on a declared mock engine (ttft 0.15 s, 0.02 s per token, seats 4+4) — not a vLLM measurement. The recorded gateway drills live in the Topic 08 evidence run (runs/2026-10-26-topic08-gateway-mock); this lab does not execute them.",
      ru: "Учебная арифметика на объявленном моке движка (ttft 0.15 с, 0.02 с за токен, места 4+4) — не измерение vLLM. Прогоны drill'ов шлюза записаны в evidence-прогоне Темы 08 (runs/2026-10-26-topic08-gateway-mock); эта лаба их не исполняет.",
    },
  };
})();
