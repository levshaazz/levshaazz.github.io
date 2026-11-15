/* Lab 06 — Load: finding the saturation knee.
   Content module for the generic lab page (window.LABS_CONTENT['6']).
   Declared step model (same as the playground widget): step = W + b*batch ms,
   throughput = batch * 1000 / step; the knee follows the frozen gain rule,
   never an eye fit. Real Python tests run in the browser sandbox. */
(function () {
  "use strict";
  window.LABS_CONTENT = window.LABS_CONTENT || {};

  LABS_CONTENT["6"] = {
    title: {
      en: "Load: finding the saturation knee",
      ru: "Нагрузка: поиск колена насыщения",
    },
    sub: {
      en: "Predict throughput from the declared step model, locate the knee by the gain rule — not by eye — and see how a closed loop hides saturation.",
      ru: "Предскажи throughput по заявленной модели шага, найди колено по правилу прироста — не на глаз — и проверь, как замкнутый цикл прячет насыщение.",
    },
    intro: {
      en: `<p>One decode step serves the whole batch: <strong>step = W + b × batch</strong> milliseconds — W pays for reading the weights once per step, each live sequence adds b. Throughput is <strong>batch × 1000 / step</strong> tok/s: it rises, flattens, and tops out at the roof <strong>1000 / b</strong> as the batch grows. The scheduler caps the batch at <code>max_num_seqs</code>, so clients beyond the cap buy place in the queue, not tokens — that is the mechanism behind the knee.</p>
<p>The knee is located by a declared rule, not by eye: rule γ takes the <strong>last wave that gained at least 50% over its predecessor</strong> (teaching γ = 0.5). And load has two shapes. A <strong>closed loop</strong> of clients sends the next request only after the previous one returns, so offered req/s = clients / latency — slow the server down and demand shrinks by itself (Little's law). An <strong>open loop</strong> keeps the arrival rate fixed, so saturation shows up as a growing queue instead. Same overload, two different stories.</p>`,
      ru: `<p>Один decode-шаг обслуживает весь batch: <strong>step = W + b × batch</strong> миллисекунд — W платит за чтение весов один раз за шаг, каждая живая последовательность добавляет b. Throughput равен <strong>batch × 1000 / step</strong> ток/с: он растёт, выполаживается и упирается в крышу <strong>1000 / b</strong> при росте batch. Scheduler режет batch потолком <code>max_num_seqs</code>, поэтому клиенты сверх потолка покупают место в очереди, а не токены — в этом механизм колена.</p>
<p>Колено ищут по заявленному правилу, а не на глаз: правило γ берёт <strong>последнюю волну, прибавившую не меньше 50% к предыдущей</strong> (учебное γ = 0.5). И у нагрузки две формы. <strong>Замкнутый цикл</strong> шлёт следующий запрос только после ответа на предыдущий, поэтому предлагаемый req/s = clients / latency — замедли сервис, и спрос упадёт сам (закон Литтла). <strong>Открытый цикл</strong> держит фиксированный темп прихода, и насыщение проявляется растущей очередью. Та же перегрузка — два разных рассказа.</p>`,
    },
    model: [
      ["decode step", "step = W + b × batch, ms", "teaching constants", "W = 60 ms, b = 2 ms/seq"],
      ["throughput", "batch × 1000 / step, tok/s", "effective batch", "min(clients, max_num_seqs)"],
      ["knee rule (γ)", "last wave with gain ≥ 50% vs previous", "saturation roof", "1000 / b tok/s"],
      ["closed loop", "offered req/s = clients / latency", "open loop", "arrival rate fixed; queue absorbs overload"],
    ],
    scenario: null,
    quizzes: [
      {
        id: "q1",
        q: {
          en: "Decode step for a batch of 20 under the teaching constants (W = 60 ms, b = 2 ms/seq), in ms?",
          ru: "Decode-шаг для batch = 20 при учебных константах (W = 60 мс, b = 2 мс/seq), в мс?",
        },
        answer: 100, tol: 0.5, unit: { en: "ms", ru: "мс" },
        hint: {
          en: "step = W + b × batch = 60 + 2 × 20.",
          ru: "step = W + b × batch = 60 + 2 × 20.",
        },
      },
      {
        id: "q2",
        q: {
          en: "Throughput at batch 10 under the same constants, in tok/s?",
          ru: "Throughput при batch = 10 под теми же константами, в ток/с?",
        },
        answer: 125, tol: 0.5, unit: { en: "tok/s", ru: "ток/с" },
        hint: {
          en: "step = 60 + 2 × 10 = 80 ms; throughput = 10 × 1000 / 80.",
          ru: "step = 60 + 2 × 10 = 80 мс; throughput = 10 × 1000 / 80.",
        },
      },
      {
        id: "q3",
        q: {
          en: "128 clients arrive, max_num_seqs = 30, same constants. What throughput does the model predict, in tok/s?",
          ru: "Пришли 128 клиентов, max_num_seqs = 30, те же константы. Какой throughput предсказывает модель, в ток/с?",
        },
        answer: 250, tol: 0.5, unit: { en: "tok/s", ru: "ток/с" },
        hint: {
          en: "Effective batch = min(128, 30) = 30; step = 60 + 2 × 30 = 120 ms; 30 × 1000 / 120. The 98 extra clients only fill the queue.",
          ru: "Эффективный batch = min(128, 30) = 30; step = 60 + 2 × 30 = 120 мс; 30 × 1000 / 120. Лишние 98 клиентов лишь заполняют очередь.",
        },
      },
    ],
    exercises: [
      {
        id: "ex1",
        title: { en: "Exercise 1 · Throughput of one batch", ru: "Упражнение 1 · Throughput одного batch" },
        brief: {
          en: "Implement <code>throughput_of_batch(batch, w_ms, b_ms)</code> — the declared step model: one step costs <code>W + b × batch</code> milliseconds, throughput is <code>batch × 1000 / step</code> tok/s. Mind the units: the step comes out in ms, the 1000 converts ms → s.",
          ru: "Реализуй <code>throughput_of_batch(batch, w_ms, b_ms)</code> — заявленную модель шага: шаг стоит <code>W + b × batch</code> миллисекунд, throughput равен <code>batch × 1000 / step</code> ток/с. Следи за единицами: шаг выходит в мс, и 1000 переводит мс → с.",
        },
        starter: `def throughput_of_batch(batch, w_ms, b_ms):
    """Tokens per second under the declared step model (step in ms)."""
    # TODO: step in ms, then the ms -> s conversion
`,
        tests: [
          { name: "batch 20", hidden: false, code: "eq(throughput_of_batch(20, 60, 2), 200.0)" },
          { name: "batch 30", hidden: false, code: "eq(throughput_of_batch(30, 60, 2), 250.0)" },
          { name: "small batch, float result", hidden: true, code: "approx(throughput_of_batch(3, 60, 2), 45.45, 0.02)" },
          { name: "flattens toward the 1000/b roof", hidden: true, code: "approx(throughput_of_batch(10000, 60, 2), 498.5, 0.5)" },
        ],
        solution: `def throughput_of_batch(batch, w_ms, b_ms):
    step_ms = w_ms + b_ms * batch
    return batch * 1000.0 / step_ms`,
        hints: [
          { en: "Two lines: step_ms = w + b * batch, then batch * 1000 / step_ms. The curve saturates near 1000/b = 500 tok/s.", ru: "Две строки: step_ms = w + b * batch, затем batch * 1000 / step_ms. Кривая насыщается около 1000/b = 500 ток/с." },
        ],
        numpy: false,
        timeoutMs: 4000,
      },
      {
        id: "ex2",
        title: { en: "Exercise 2 · The knee by rule, not by eye", ru: "Упражнение 2 · Колено по правилу, не на глаз" },
        brief: {
          en: "Implement <code>find_knee(clients, max_num_seqs, w_ms, b_ms, min_gain=0.5)</code> — walk the client counts in increasing order, compute throughput at effective batch <code>min(c, max_num_seqs)</code>, and keep the <strong>last</strong> count whose throughput gained at least <code>min_gain</code> (a fraction: 0.5 = +50%) over the <strong>previous</strong> count. Return a tuple <code>(working_batch, tok_per_s)</code>; a single count is the knee by default (no predecessor to beat).",
          ru: "Реализуй <code>find_knee(clients, max_num_seqs, w_ms, b_ms, min_gain=0.5)</code> — иди по количествам клиентов в порядке возрастания, считай throughput на эффективном batch <code>min(c, max_num_seqs)</code> и сохраняй <strong>последнее</strong> значение, чей throughput вырос минимум на <code>min_gain</code> (доля: 0.5 = +50%) относительно <strong>предыдущего</strong>. Верни кортеж <code>(рабочий batch, ток/с)</code>; одиночное значение — колено по умолчанию (нет предыдущего, которого надо превзойти).",
        },
        starter: `def find_knee(clients, max_num_seqs, w_ms, b_ms, min_gain=0.5):
    """(working_batch, tok_per_s) of the last qualifying gain - by rule, not by eye."""
    # TODO: sort clients; tps at min(c, max_num_seqs); keep the last count
    # whose tps >= previous tps * (1 + min_gain)
`,
        tests: [
          { name: "cap at 30, knee on wave 20", hidden: false, code: "eq(find_knee([10, 20, 30, 60], 30, 60, 2)[0], 20)" },
          { name: "gamma 0.25 keeps climbing to 30", hidden: false, code: "eq(find_knee([10, 20, 30, 60], 30, 60, 2, min_gain=0.25)[0], 30)" },
          { name: "knee throughput 200 tok/s", hidden: true, code: "approx(find_knee([10, 20, 30, 60], 30, 60, 2)[1], 200.0, 0.1)" },
          { name: "single client is the knee", hidden: true, code: "eq(find_knee([16], 256, 60, 2)[0], 16)" },
        ],
        solution: `def find_knee(clients, max_num_seqs, w_ms, b_ms, min_gain=0.5):
    prev_tps = None
    knee = None
    for c in sorted(clients):
        eff = min(c, max_num_seqs)
        tps = eff * 1000.0 / (w_ms + b_ms * eff)
        if prev_tps is None or tps >= prev_tps * (1.0 + min_gain):
            knee = (eff, tps)
        prev_tps = tps
    return knee`,
        hints: [
          { en: "Trace [10, 20, 30, 60] with γ = 0.5: tps 125 → 200 (+60%, qualifies) → 250 (+25%, stops) → capped 250 (+0%). Knee: batch 20, 200 tok/s.", ru: "Трасса [10, 20, 30, 60] при γ = 0.5: tps 125 → 200 (+60%, засчитано) → 250 (+25%, стоп) → срезанные 250 (+0%). Колено: batch 20, 200 ток/с." },
        ],
        numpy: false,
        timeoutMs: 4000,
      },
      {
        id: "ex3",
        title: { en: "Exercise 3 · Fix the bug: off by 1000×", ru: "Упражнение 3 · Почини баг: ошибка в 1000 раз" },
        brief: {
          en: "This <code>step_seconds(batch, w_ms, b_ms)</code> must return the decode step duration in <strong>seconds</strong> — but it is off by exactly 1000×: the step is computed in milliseconds and returned without the ms → s conversion. Fix it so that <code>8 / step_seconds(8, 40, 10)</code> is ≈ 66.67 tok/s, not 0.067. A unit slip like this quietly inflates every latency budget built on top.",
          ru: "Эта <code>step_seconds(batch, w_ms, b_ms)</code> должна возвращать длительность decode-шага в <strong>секундах</strong> — но она ошибается ровно в 1000 раз: шаг считается в миллисекундах и возвращается без перевода мс → с. Почини так, чтобы <code>8 / step_seconds(8, 40, 10)</code> давало ≈ 66.67 ток/с, а не 0.067. Такая ошибка в единицах тихо завышает все бюджеты латентности, построенные поверх.",
        },
        starter: `def step_seconds(batch, w_ms, b_ms):
    """Decode step duration in SECONDS under the declared step model."""
    # BUG: returns milliseconds - the ms -> s conversion (/1000) is missing,
    # so every returned value is 1000x too large.
    return w_ms + b_ms * batch
`,
        tests: [
          { name: "batch 8, step in seconds", hidden: false, code: "approx(step_seconds(8, 40, 10), 0.12, 1e-6)" },
          { name: "batch 32", hidden: false, code: "approx(step_seconds(32, 40, 10), 0.36, 1e-6)" },
          { name: "zero batch: overhead only", hidden: true, code: "approx(step_seconds(0, 40, 10), 0.04, 1e-6)" },
          { name: "feeds a tok/s readout", hidden: true, code: "approx(8 / step_seconds(8, 40, 10), 66.67, 0.02)" },
        ],
        solution: `def step_seconds(batch, w_ms, b_ms):
    return (w_ms + b_ms * batch) / 1000.0`,
        hints: [
          { en: "The starter says step_seconds(8, 40, 10) is 120 'seconds' — expected 0.12: exactly 1000× too big. Divide the millisecond sum by 1000.", ru: "Стартер утверждает, что step_seconds(8, 40, 10) — это 120 «секунд», а ждём 0.12: ровно в 1000 раз больше. Подели сумму в миллисекундах на 1000." },
        ],
        numpy: false,
        timeoutMs: 4000,
      },
      {
        id: "ex4",
        title: { en: "Exercise 4 · Closed loop vs open loop", ru: "Упражнение 4 · Замкнутый и открытый цикл" },
        brief: {
          en: "Implement <code>closed_loop_rps(clients, latency_s)</code> — Little's law for a closed loop: offered req/s = <code>clients / latency_s</code>. Read the comparison it encodes: in a closed loop, slowing the server shrinks the offered demand by itself; in an open loop the arrival rate is fixed, so the same slowdown becomes a growing queue. That is why one chart falls while the other waits.",
          ru: "Реализуй <code>closed_loop_rps(clients, latency_s)</code> — закон Литтла для замкнутого цикла: предлагаемый req/s = <code>clients / latency_s</code>. Прочитай закодированное сравнение: в замкнутом цикле замедление сервиса само снижает спрос; в открытом темп прихода фиксирован, и то же замедление превращается в растущую очередь. Поэтому один график падает, а другой ждёт.",
        },
        starter: `def closed_loop_rps(clients, latency_s):
    """Offered requests per second of a closed loop (Little's law)."""
    # TODO: one line
`,
        tests: [
          { name: "8 clients at 0.25 s", hidden: false, code: "eq(closed_loop_rps(8, 0.25), 32.0)" },
          { name: "slower server halves the demand", hidden: false, code: "approx(closed_loop_rps(8, 0.5), 16.0, 1e-9)" },
          { name: "wave 128 at 2 s", hidden: true, code: "eq(closed_loop_rps(128, 2.0), 64.0)" },
          { name: "no clients, no demand", hidden: true, code: "eq(closed_loop_rps(0, 0.25), 0.0)" },
        ],
        solution: `def closed_loop_rps(clients, latency_s):
    return clients / latency_s`,
        hints: [
          { en: "One division. The point it proves: closed-loop req/s is a consequence of latency, not an input you control.", ru: "Одно деление. Что оно доказывает: req/s замкнутого цикла — следствие латентности, а не вход, которым ты управляешь." },
        ],
        numpy: false,
        timeoutMs: 4000,
      },
    ],
    reward: {
      caption: { en: "The knee is found by a rule, not by eye \u2014 you can defend a working point.", ru: "\u041a\u043e\u043b\u0435\u043d\u043e \u043d\u0430\u0445\u043e\u0434\u0438\u0442\u0441\u044f \u043f\u0440\u0430\u0432\u0438\u043b\u043e\u043c, \u0430 \u043d\u0435 \u043d\u0430 \u0433\u043b\u0430\u0437 \u2014 \u0442\u044b \u0443\u043c\u0435\u0435\u0448\u044c \u0437\u0430\u0449\u0438\u0449\u0430\u0442\u044c \u0440\u0430\u0431\u043e\u0447\u0443\u044e \u0442\u043e\u0447\u043a\u0443." },
    },
    footer: {
      en: "A declared synthetic step model, not a measurement: the constants W = 60 ms, b = 2 ms/seq are teaching values shared with the playground widget, and the knee follows the frozen gain rule, never an eye fit. The measured T4 saturation run of Topic 06 (waves 8/32/64/128 → 29.0/207.8/305.8/310.7 tok/s, knee 32 by γ = 0.5) lives in seminars/runs/2026-10-21-topic06-t4-saturation-v2; this lab does not execute it.",
      ru: "Заявленная синтетическая модель шага, не измерение: константы W = 60 мс, b = 2 мс/seq — учебные значения, общие с виджетом playground, а колено находится по замороженному правилу прироста, никогда не подгонкой на глаз. Измеренный прогон насыщения Темы 06 на T4 (волны 8/32/64/128 → 29.0/207.8/305.8/310.7 ток/с, колено 32 по γ = 0.5) живёт в seminars/runs/2026-10-21-topic06-t4-saturation-v2; эта лаба его не исполняет.",
    },
  };
})();
