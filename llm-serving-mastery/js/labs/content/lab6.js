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
      ru: `<p>Один decode-шаг обслуживает весь батч: шаг (в мс) — <strong>step = W + b × batch</strong>, где W платит за чтение весов один раз за шаг, каждая живая последовательность добавляет b. Throughput равен <strong>batch × 1000 / step</strong> ток/с: он растёт, выполаживается и упирается в крышу <strong>1000 / b</strong> при росте batch. Scheduler режет batch потолком <code>max_num_seqs</code>, поэтому клиенты сверх потолка покупают место в очереди, а не токены — в этом механизм колена.</p>
<p>Колено ищут по заявленному правилу, а не на глаз: правило γ берёт <strong>последнюю волну, прибавившую не меньше 50% к предыдущей</strong> (учебное γ = 0.5). И у нагрузки две формы. <strong>Замкнутый цикл</strong> шлёт следующий запрос только после ответа на предыдущий, поэтому предлагаемый req/s = clients / latency — замедли сервис, и спрос упадёт сам (закон Литтла). <strong>Открытый цикл</strong> держит фиксированный темп прихода, и насыщение проявляется растущей очередью. Та же перегрузка — два разных рассказа.</p>`,
    },
    heroTag: { en: "step model, knee, loop shapes", ru: "модель шага, колено, формы нагрузки" },
    figures: [
      {
        id: "lab6-knee-rule",
        title: { en: "The knee by rule γ, not by eye", ru: "Колено по правилу γ, а не на глаз" },
        w: 760, h: 420,
        svg: `<svg viewBox="0 0 760 420" xmlns="http://www.w3.org/2000/svg">
  <g id="g-axes">
    <line x1="80" y1="340" x2="700" y2="340" stroke="var(--lab-muted)" stroke-width="1.5"/>
    <line x1="80" y1="340" x2="80" y2="70" stroke="var(--lab-muted)" stroke-width="1.5"/>
    <text x="700" y="366" text-anchor="end" font-size="14" fill="var(--lab-muted)" data-en="clients" data-ru="клиенты">clients</text>
    <text x="88" y="62" font-size="14" fill="var(--lab-muted)" data-en="throughput, tok/s" data-ru="throughput, ток/с">throughput, tok/s</text>
  </g>
  <g id="g-pts">
    <circle cx="180" cy="215" r="7" fill="var(--lab-accent)"/>
    <text x="180" y="198" text-anchor="middle" font-size="14" fill="var(--lab-ink)" class="mono">125</text>
    <text x="180" y="360" text-anchor="middle" font-size="13" fill="var(--lab-muted)" class="mono">10</text>
    <circle cx="280" cy="140" r="7" fill="var(--lab-accent)"/>
    <text x="280" y="123" text-anchor="middle" font-size="14" fill="var(--lab-ink)" class="mono">200</text>
    <text x="280" y="360" text-anchor="middle" font-size="13" fill="var(--lab-muted)" class="mono">20</text>
    <circle cx="380" cy="90" r="7" fill="var(--lab-accent)"/>
    <text x="380" y="73" text-anchor="middle" font-size="14" fill="var(--lab-ink)" class="mono">250</text>
    <text x="380" y="360" text-anchor="middle" font-size="13" fill="var(--lab-muted)" class="mono">30</text>
    <circle cx="680" cy="90" r="7" fill="var(--lab-muted)"/>
    <text x="660" y="73" text-anchor="middle" font-size="14" fill="var(--lab-muted)" class="mono">250</text>
    <text x="680" y="360" text-anchor="middle" font-size="13" fill="var(--lab-muted)" class="mono">60</text>
  </g>
  <g id="g-gains">
    <text x="230" y="160" text-anchor="middle" font-size="15" fill="var(--lab-good)" class="mono">+60%</text>
    <text x="330" y="108" text-anchor="middle" font-size="15" fill="var(--lab-bad)" class="mono">+25%</text>
    <text x="530" y="108" text-anchor="middle" font-size="15" fill="var(--lab-bad)" class="mono">+0%</text>
    <text x="530" y="130" text-anchor="middle" font-size="13" fill="var(--lab-muted)" data-en="capped: 60 clients still serve 30" data-ru="потолок: 60 клиентов обслуживают 30">capped: 60 clients still serve 30</text>
  </g>
  <g id="g-knee">
    <line x1="280" y1="140" x2="280" y2="340" stroke="var(--fig-warm)" stroke-width="2" stroke-dasharray="5 4"/>
    <circle cx="280" cy="140" r="11" fill="none" stroke="var(--fig-warm)" stroke-width="2.5" class="fig-pulse"/>
    <text x="296" y="170" font-size="15" fill="var(--fig-warm)" data-en="knee: batch 20 · 200 tok/s" data-ru="колено: batch 20 · 200 ток/с">knee: batch 20 · 200 tok/s</text>
    <text x="296" y="190" font-size="13" fill="var(--lab-muted)" data-en="last wave with gain ≥ 50%" data-ru="последняя волна с приростом ≥ 50%">last wave with gain ≥ 50%</text>
  </g>
</svg>`,
        stages: [
          { cap: { en: "Cap 30: waves 10 / 20 / 30 / 60 clients.", ru: "Потолок 30: волны 10 / 20 / 30 / 60 клиентов." }, show: ["g-axes", "g-pts"] },
          { cap: { en: "Gains wave over wave: +60%, then +25%, then +0%.", ru: "Приросты волна за волной: +60%, затем +25%, затем +0%." }, show: ["g-axes", "g-pts", "g-gains"] },
          { cap: { en: "Rule γ = 0.5: knee at the last qualifying wave, batch 20.", ru: "Правило γ = 0.5: колено — последняя волна с приростом ≥ 50%, batch 20." }, show: ["g-axes", "g-pts", "g-gains", "g-knee"] },
        ],
      },
      {
        id: "lab6-loop-shapes",
        title: { en: "Closed loop vs open loop: same overload, two stories", ru: "Замкнутый и открытый цикл: та же перегрузка — два рассказа" },
        w: 760, h: 420,
        svg: `<svg viewBox="0 0 760 420" xmlns="http://www.w3.org/2000/svg">
  <g id="g-closed">
    <text x="60" y="70" font-size="15" fill="var(--lab-accent)" data-en="closed loop" data-ru="замкнутый цикл">closed loop</text>
    <text x="60" y="92" font-size="13" fill="var(--lab-muted)" class="mono">8 × (1 / 0.25) = 32 req/s</text>
    <line x1="80" y1="340" x2="700" y2="340" stroke="var(--lab-muted)" stroke-width="1.5"/>
    <path d="M 80 340 C 200 240 300 170 380 150 C 470 130 600 130 700 130" fill="none" stroke="var(--lab-accent)" stroke-width="2.5"/>
    <circle cx="380" cy="150" r="6" fill="var(--lab-accent)"/>
    <text x="380" y="128" text-anchor="middle" font-size="13" fill="var(--lab-muted)" class="mono" data-en="cap 30" data-ru="потолок 30">cap 30</text>
    <text x="620" y="115" text-anchor="middle" font-size="14" fill="var(--lab-accent)" data-en="pins at the roof" data-ru="упирается в крышу">pins at the roof</text>
  </g>
  <g id="g-open">
    <text x="60" y="160" font-size="15" fill="var(--fig-warm)" data-en="open loop" data-ru="открытый цикл">open loop</text>
    <text x="60" y="182" font-size="13" fill="var(--lab-muted)" data-en="arrival rate fixed" data-ru="темп прихода фиксирован">arrival rate fixed</text>
    <path d="M 380 340 C 440 336 500 310 560 260 C 610 218 660 180 700 150" fill="none" stroke="var(--fig-warm)" stroke-width="2.5" class="fig-flow"/>
    <text x="640" y="230" font-size="14" fill="var(--fig-warm)" data-en="queue grows" data-ru="очередь растёт">queue grows</text>
  </g>
  <g id="g-verdict">
    <text x="380" y="380" text-anchor="middle" font-size="15" fill="var(--lab-ink)" data-en="same overload — demand shrinks vs queue explodes" data-ru="та же перегрузка — спрос падает сам vs очередь взрывается">same overload — demand shrinks vs queue explodes</text>
    <text x="380" y="404" text-anchor="middle" font-size="13" fill="var(--lab-muted)" data-en="quote throughput together with the loop shape" data-ru="называй throughput вместе с формой цикла">quote throughput together with the loop shape</text>
  </g>
</svg>`,
        stages: [
          { cap: { en: "Closed loop: slowing the server shrinks demand by itself.", ru: "Замкнутый цикл: клиенты ждут ответов — замедление сервиса само снижает спрос." }, show: ["g-closed"] },
          { cap: { en: "Open loop: fixed arrival rate — past the cap, the queue grows.", ru: "Открытый цикл держит темп прихода: за потолком растёт только очередь." }, show: ["g-closed", "g-open"] },
          { cap: { en: "Same overload, two stories: quote throughput together with the loop shape.", ru: "Та же перегрузка — два рассказа: называй throughput вместе с формой цикла." }, show: ["g-closed", "g-open", "g-verdict"] },
        ],
      },
    ],
    outcomes: [
      { en: "Model step time from two constants and locate the saturation knee by a declared rule.", ru: "\u0421\u0442\u0440\u043e\u0438\u0442\u044c \u043c\u043e\u0434\u0435\u043b\u044c \u0448\u0430\u0433\u0430 \u0438\u0437 \u0434\u0432\u0443\u0445 \u043a\u043e\u043d\u0441\u0442\u0430\u043d\u0442 \u0438\u00a0\u043d\u0430\u0445\u043e\u0434\u0438\u0442\u044c \u043a\u043e\u043b\u0435\u043d\u043e \u043d\u0430\u0441\u044b\u0449\u0435\u043d\u0438\u044f \u043f\u043e \u0437\u0430\u044f\u0432\u043b\u0435\u043d\u043d\u043e\u043c\u0443 \u043f\u0440\u0430\u0432\u0438\u043b\u0443." },
      { en: "Distinguish closed-loop clients from open-loop arrivals when quoting throughput.", ru: "\u0420\u0430\u0437\u043b\u0438\u0447\u0430\u0442\u044c \u043a\u043b\u0438\u0435\u043d\u0442\u043e\u0432 \u0437\u0430\u043c\u043a\u043d\u0443\u0442\u043e\u0433\u043e \u0446\u0438\u043a\u043b\u0430 (closed-loop) \u0438\u00a0\u0437\u0430\u044f\u0432\u043a\u0438 \u043e\u0442\u043a\u0440\u044b\u0442\u043e\u0433\u043e (open-loop) \u043f\u0440\u0438 \u0440\u0430\u0437\u0433\u043e\u0432\u043e\u0440\u0435 \u043e\u00a0\u043f\u0440\u043e\u043f\u0443\u0441\u043a\u043d\u043e\u0439 \u0441\u043f\u043e\u0441\u043e\u0431\u043d\u043e\u0441\u0442\u0438." },
    ],
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
          ru: "Decode-шаг для batch = 20 при учебных константах (W = 60 мс, b = 2 мс/seq), в мс?",
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
          ru: "Throughput при batch = 10 при тех же константах, в ток/с?",
        },
        answer: 125, tol: 0.5, unit: { en: "tok/s", ru: "ток/с" },
        hint: {
          en: "step = 60 + 2 × 10 = 80 ms; throughput = 10 × 1000 / 80.",
          ru: "step = 60 + 2 × 10 = 80 мс; throughput = 10 × 1000 / 80.",
        },
      },
      {
        id: "q3",
        q: {
          en: "128 clients arrive, max_num_seqs = 30, same constants. What throughput does the model predict, in tok/s?",
          ru: "Пришли 128 клиентов, max_num_seqs = 30, те же константы. Какой throughput предсказывает модель, в ток/с?",
        },
        answer: 250, tol: 0.5, unit: { en: "tok/s", ru: "ток/с" },
        hint: {
          en: "Effective batch = min(128, 30) = 30; step = 60 + 2 × 30 = 120 ms; 30 × 1000 / 120. The 98 extra clients only fill the queue.",
          ru: "Эффективный batch = min(128, 30) = 30; step = 60 + 2 × 30 = 120 мс; 30 × 1000 / 120. Лишние 98 клиентов лишь заполняют очередь.",
        },
      },
    ],
    exercises: [
      {
        id: "ex1",
        title: { en: "Exercise 1 · Throughput of one batch", ru: "Упражнение 1 · Throughput одного батча" },
        brief: {
          en: "Implement <code>throughput_of_batch(batch, w_ms, b_ms)</code> — the declared step model: one step costs <code>W + b × batch</code> milliseconds, throughput is <code>batch × 1000 / step</code> tok/s. Mind the units: the step comes out in ms, the 1000 converts ms → s.",
          ru: "Реализуй <code>throughput_of_batch(batch, w_ms, b_ms)</code> — заявленную модель шага: шаг стоит <code>W + b × batch</code> миллисекунд, throughput равен <code>batch × 1000 / step</code> ток/с. Следи за единицами: шаг выходит в мс, и 1000 переводит мс → с.",
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
          { en: "Two lines: step_ms = w + b * batch, then batch * 1000 / step_ms. The curve saturates near 1000/b = 500 tok/s.", ru: "Две строки: step_ms = w + b * batch, затем batch * 1000 / step_ms. Кривая насыщается около 1000/b = 500 ток/с." },
        ],
        numpy: false,
        timeoutMs: 4000,
      },
      {
        id: "ex2",
        title: { en: "Exercise 2 · Fix the bug: off by 1000×", ru: "Упражнение 2 · Почини баг: ошибка в 1000 раз" },
        brief: {
          en: "This <code>step_seconds(batch, w_ms, b_ms)</code> must return the decode step duration in <strong>seconds</strong> — but it is off by exactly 1000×: the step is computed in milliseconds and returned without the ms → s conversion. Fix it so that <code>8 / step_seconds(8, 40, 10)</code> is ≈ 66.67 tok/s, not 0.067. A unit slip like this quietly inflates every latency budget built on top.",
          ru: "Эта <code>step_seconds(batch, w_ms, b_ms)</code> должна возвращать длительность decode-шага в <strong>секундах</strong> — но она ошибается ровно в 1000 раз: шаг считается в миллисекундах и возвращается без перевода мс → с. Почини так, чтобы <code>8 / step_seconds(8, 40, 10)</code> давало ≈ 66.67 ток/с, а не 0.067. Такая ошибка в единицах тихо завышает все бюджеты латентности, построенные поверх.",
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
          { en: "The starter says step_seconds(8, 40, 10) is 120 'seconds' — expected 0.12: exactly 1000× too big. Divide the millisecond sum by 1000.", ru: "Стартер утверждает, что step_seconds(8, 40, 10) — это 120 «секунд», а ждём 0.12: ровно в 1000 раз больше. Подели сумму в миллисекундах на 1000." },
        ],
        numpy: false,
        timeoutMs: 4000,
      },
      {
        id: "ex3",
        title: { en: "Exercise 3 · Closed loop vs open loop", ru: "Упражнение 3 · Замкнутый и открытый цикл" },
        brief: {
          en: "Implement <code>closed_loop_rps(clients, latency_s)</code> — Little's law for a closed loop: offered req/s = <code>clients / latency_s</code>. Read the comparison it encodes: in a closed loop, slowing the server shrinks the offered demand by itself; in an open loop the arrival rate is fixed, so the same slowdown becomes a growing queue. That is why one chart falls while the other waits.",
          ru: "Реализуй <code>closed_loop_rps(clients, latency_s)</code> — закон Литтла для замкнутого цикла: предлагаемый req/s = <code>clients / latency_s</code>. Прочитай сравнение, зашитое в формулу: в замкнутом цикле замедление сервиса само снижает спрос; в открытом темп прихода фиксирован, и то же замедление превращается в растущую очередь. Поэтому один график падает, а другой ждёт.",
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
          { en: "One division. The point it proves: closed-loop req/s is a consequence of latency, not an input you control.", ru: "Одно деление. Что оно доказывает: req/s замкнутого цикла — следствие латентности, а не вход, которым ты управляешь." },
        ],
        numpy: false,
        timeoutMs: 4000,
      },      {
        id: "ex4",
        title: { en: "Exercise 4 · The knee by rule, not by eye", ru: "Упражнение 4 · Колено по правилу, не на глаз" },
        brief: {
          en: "Implement <code>find_knee(clients, max_num_seqs, w_ms, b_ms, min_gain=0.5)</code> — walk the client counts in increasing order, compute throughput at effective batch <code>min(c, max_num_seqs)</code>, and keep the <strong>last</strong> count whose throughput gained at least <code>min_gain</code> (a fraction: 0.5 = +50%) over the <strong>previous</strong> count. Return a tuple <code>(working_batch, tok_per_s)</code>; a single count is the knee by default (no predecessor to beat).",
          ru: "Реализуй <code>find_knee(clients, max_num_seqs, w_ms, b_ms, min_gain=0.5)</code> — иди по списку количеств клиентов по возрастанию, считай throughput на эффективном батче <code>min(c, max_num_seqs)</code> и сохраняй <strong>последнее</strong> значение, у которого throughput вырос минимум на <code>min_gain</code> (доля: 0.5 = +50%) относительно <strong>предыдущего</strong>. Верни кортеж <code>(рабочий batch, ток/с)</code>; одиночное значение — колено по умолчанию (нет предыдущего, которого надо превзойти).",
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
          { name: "gain measured against the previous count, not the last qualifying wave", hidden: true, code: "eq(find_knee([10, 20, 30, 48], 48, 60, 2)[0], 20)" },
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
          { en: "Trace [10, 20, 30, 60] with γ = 0.5: ток/с: 125 → 200 (+60%, qualifies) → 250 (+25%, stops) → capped 250 (+0%). Knee: batch 20, 200 tok/s.", ru: "Трасса [10, 20, 30, 60] при γ = 0.5: ток/с: 125 → 200 (+60%, засчитано) → 250 (+25%, стоп) → 250, срезанные потолком (+0%). Колено: batch 20, 200 ток/с." },
        ],
        numpy: false,
        timeoutMs: 4000,
      },

    ],
    posttest: [
      {
        id: "p1",
        q: { en: "Step time = W + b \u00d7 batch (W = 60, b = 2). Throughput at batch 20 is\u2026", ru: "\u0412\u0440\u0435\u043c\u044f \u0448\u0430\u0433\u0430 = W + b \u00d7 batch (W = 60, b = 2). Throughput \u043f\u0440\u0438 \u0431\u0430\u0442\u0447\u0435 20 \u2014 \u044d\u0442\u043e\u2026" },
        options: [{ en: "20 \u00d7 1000 / 100 = 200 tok/s", ru: "20 \u00d7 1000 / 100 = 200\u00a0\u0442\u043e\u043a/\u0441" }, { en: "100 / 20", ru: "100 / 20" }, { en: "20 \u00d7 60", ru: "20 \u00d7 60" }],
        answer: 0,
        explain: { en: "Step = 60 + 2\u00d720 = 100 ms; throughput = batch \u00d7 1000 / step = 200 tok/s.", ru: "\u0428\u0430\u0433 = 60 + 2\u00d720 = 100\u00a0\u043c\u0441; throughput = \u0431\u0430\u0442\u0447 \u00d7 1000 / \u0448\u0430\u0433 = 200\u00a0\u0442\u043e\u043a/\u0441." },
      },
      {
        id: "p2",
        q: { en: "Past max_num_seqs, more clients mainly increase\u2026", ru: "\u041f\u043e\u0441\u043b\u0435 max_num_seqs \u043d\u043e\u0432\u044b\u0435 \u043a\u043b\u0438\u0435\u043d\u0442\u044b \u0432\u00a0\u043e\u0441\u043d\u043e\u0432\u043d\u043e\u043c \u0443\u0432\u0435\u043b\u0438\u0447\u0438\u0432\u0430\u044e\u0442\u2026" },
        options: [{ en: "throughput", ru: "throughput" }, { en: "queueing (latency), not throughput", ru: "\u043e\u0436\u0438\u0434\u0430\u043d\u0438\u0435 (\u043b\u0430\u0442\u0435\u043d\u0442\u043d\u043e\u0441\u0442\u044c), \u0430\u00a0\u043d\u0435 throughput" }, { en: "step time", ru: "\u0432\u0440\u0435\u043c\u044f \u0448\u0430\u0433\u0430" }],
        answer: 1,
        explain: { en: "The working batch is capped: extra clients wait in line. Throughput stays at the roof; latency grows.", ru: "\u0420\u0430\u0431\u043e\u0447\u0438\u0439 \u0431\u0430\u0442\u0447 \u043e\u0433\u0440\u0430\u043d\u0438\u0447\u0435\u043d: \u043b\u0438\u0448\u043d\u0438\u0435 \u043a\u043b\u0438\u0435\u043d\u0442\u044b \u0436\u0434\u0443\u0442 \u0432\u00a0\u043e\u0447\u0435\u0440\u0435\u0434\u0438. Throughput \u0441\u0442\u043e\u0438\u0442 \u043d\u0430 \u043a\u0440\u044b\u0448\u0435; \u0440\u0430\u0441\u0442\u0451\u0442 \u043b\u0430\u0442\u0435\u043d\u0442\u043d\u043e\u0441\u0442\u044c." },
      },
      {
        id: "p3",
        q: { en: "The knee is located\u2026", ru: "\u041a\u043e\u043b\u0435\u043d\u043e \u043d\u0430\u0445\u043e\u0434\u0438\u0442\u0441\u044f\u2026" },
        options: [{ en: "by a declared gain rule, not by eye", ru: "\u043f\u043e \u0437\u0430\u044f\u0432\u043b\u0435\u043d\u043d\u043e\u043c\u0443 \u043f\u0440\u0430\u0432\u0438\u043b\u0443 \u043f\u0440\u0438\u0440\u043e\u0441\u0442\u0430, \u0430\u00a0\u043d\u0435 \u043d\u0430 \u0433\u043b\u0430\u0437" }, { en: "where the curve looks flat", ru: "\u0442\u0430\u043c, \u0433\u0434\u0435 \u043a\u0440\u0438\u0432\u0430\u044f \u0432\u044b\u0433\u043b\u044f\u0434\u0438\u0442 \u043f\u043b\u043e\u0441\u043a\u043e\u0439" }, { en: "at max_num_seqs always", ru: "\u0432\u0441\u0435\u0433\u0434\u0430 \u043d\u0430 max_num_seqs" }],
        answer: 0,
        explain: { en: "A declared rule (e.g. last gain \u2265 50 %) makes the knee reproducible and defensible.", ru: "\u0417\u0430\u044f\u0432\u043b\u0435\u043d\u043d\u043e\u0435 \u043f\u0440\u0430\u0432\u0438\u043b\u043e (\u043d\u0430\u043f\u0440\u0438\u043c\u0435\u0440, \u043f\u043e\u0441\u043b\u0435\u0434\u043d\u0438\u0439 \u043f\u0440\u0438\u0440\u043e\u0441\u0442 \u2265 50%) \u0434\u0435\u043b\u0430\u0435\u0442 \u043a\u043e\u043b\u0435\u043d\u043e \u0432\u043e\u0441\u043f\u0440\u043e\u0438\u0437\u0432\u043e\u0434\u0438\u043c\u044b\u043c \u0438\u00a0\u0437\u0430\u0449\u0438\u0449\u0430\u0435\u043c\u044b\u043c." },
      },
    ],
    reward: {
      caption: { en: "The knee is found by a rule, not by eye \u2014 you can defend a working point.", ru: "\u041a\u043e\u043b\u0435\u043d\u043e \u043d\u0430\u0445\u043e\u0434\u0438\u0442\u0441\u044f \u043f\u0440\u0430\u0432\u0438\u043b\u043e\u043c, \u0430\u00a0\u043d\u0435 \u043d\u0430 \u0433\u043b\u0430\u0437 \u2014 \u0442\u044b \u0443\u043c\u0435\u0435\u0448\u044c \u0437\u0430\u0449\u0438\u0449\u0430\u0442\u044c \u0440\u0430\u0431\u043e\u0447\u0443\u044e \u0442\u043e\u0447\u043a\u0443." },
    },
    footer: {
      en: "A declared synthetic step model, not a measurement: the constants W = 60 ms, b = 2 ms/seq are teaching values shared with the playground widget, and the knee follows the frozen gain rule, never an eye fit. The measured T4 saturation run of Topic 06 (waves 8/32/64/128 → 29.0/207.8/305.8/310.7 tok/s, knee 32 by γ = 0.5) lives in seminars/runs/2026-10-21-topic06-t4-saturation-v2; this lab does not execute it.",
      ru: "Заявленная синтетическая модель шага, не измерение: константы W = 60 мс, b = 2 мс/seq — учебные значения, совпадающие с виджетом playground, а колено находится по замороженному правилу прироста, никогда не подгонкой на глаз. Измеренный прогон насыщения Темы 06 на T4 (волны 8/32/64/128 → 29.0/207.8/305.8/310.7 ток/с, колено 32 по γ = 0.5) живёт в seminars/runs/2026-10-21-topic06-t4-saturation-v2; эта лаба его не исполняет.",
    },
  };
})();
