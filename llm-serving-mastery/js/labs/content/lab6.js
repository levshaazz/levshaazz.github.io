/* Lab 06 — Load: finding the saturation knee.
   Content module for the generic lab page (window.LABS_CONTENT['6']).
   Declared step model (same as the playground widget): step = W + b*batch ms,
   throughput = batch * 1000 / step; the knee follows the frozen gain rule,
   never an eye fit. Real Python tests run in the browser sandbox. */
(function () {
  "use strict";
  window.LABS_CONTENT = window.LABS_CONTENT || {};

  LABS_CONTENT["6"] = {
    budget: 50,
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
    glossary: [
      [{ en: "throughput", ru: "throughput" }, { en: "tokens per second the service emits; this lab predicts it from a declared step model instead of an eye-fit curve.", ru: "токены в секунду, которые выдаёт сервис; лаба предсказывает их по заявленной модели шага, а не подгонкой кривой на глаз." }],
      [{ en: "decode step", ru: "decode-шаг" }, { en: "one decode pass for the whole batch: step = W + b × batch milliseconds — W re-reads the weights once, each sequence adds b.", ru: "один decode-проход для всего батча: step = W + b × batch миллисекунд — W один раз перечитывает веса, каждая последовательность добавляет b." }],
      [{ en: "batch", ru: "батч" }, { en: "the live sequences one step serves together; batching pays because the weight read is shared.", ru: "живые последовательности, которые один шаг обслуживает вместе; батчинг выгоден, потому что чтение весов общее." }],
      [{ en: "max_num_seqs", ru: "max_num_seqs" }, { en: "the scheduler's cap on the working batch; clients beyond it buy a place in the queue, not tokens.", ru: "потолок scheduler на рабочий батч; клиенты сверх него покупают место в очереди, а не токены." }],
      [{ en: "saturation knee", ru: "колено насыщения" }, { en: "the last wave that still gained at least 50 % over its predecessor (rule γ = 0.5) — found by rule, not by eye.", ru: "последняя волна, прибавившая не меньше 50 % к предыдущей (правило γ = 0.5), — ищется правилом, а не на глаз." }],
      [{ en: "gain rule", ru: "правило прироста" }, { en: "the declared γ-rule that freezes which wave counts as the knee, so two engineers get the same number.", ru: "заявленное правило γ, замораживающее, какая волна считается коленом, — два инженера получают одно число." }],
      [{ en: "roof", ru: "крыша" }, { en: "the throughput ceiling 1000 / b: as the batch grows, tokens per step rise but steps slow by the same factor.", ru: "потолок throughput 1000 / b: с ростом батча токенов за шаг становится больше, но шаги замедляются во столько же." }],
      [{ en: "closed loop", ru: "замкнутый цикл" }, { en: "clients send the next request only after the previous one returns: offered req/s = clients / latency — slowing the server shrinks demand by itself (Little's law).", ru: "клиенты шлют следующий запрос только после ответа на предыдущий: предлагаемый req/s = clients / latency — замедли сервис, и спрос упадёт сам (закон Литтла)." }],
      [{ en: "open loop", ru: "открытый цикл" }, { en: "a fixed arrival rate regardless of latency; past the cap the queue absorbs the overload and grows.", ru: "фиксированный темп прихода независимо от латентности; за потолком очередь принимает перегрузку на себя и растёт." }],
      [{ en: "Little's law", ru: "закон Литтла" }, { en: "the closed-loop identity behind the lab's comparison: demand is clients divided by latency, so latency feeds back into load.", ru: "тождество замкнутого цикла за сравнением из лабы: спрос — это клиенты, делённые на латентность, поэтому латентность возвращается в нагрузку." }],
    ],
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
        followUp: {
          q: { en: "Why exactly 100 ms? Pick the true cause.", ru: "Почему именно 100\u00a0мс? Выбери верную причину." },
          options: [
            { en: "W is paid once per step; each of the 20 sequences adds its own b = 2 ms: 60 + 2 × 20", ru: "W платится один раз за шаг; каждая из 20 последовательностей добавляет свои b = 2\u00a0мс: 60 + 2 × 20" },
            { en: "The step grows quadratically: every sequence multiplies by every other one", ru: "Шаг растёт квадратично: каждая последовательность умножается на каждую" },
            { en: "W scales with the batch: weights are re-read for every client, 60 × 20", ru: "W масштабируется с батчем: веса перечитываются для каждого клиента, 60 × 20" },
          ],
          answer: 0,
          explain: { en: "One weight read serves the whole batch; the per-sequence cost is only b. That is why batching pays at all.", ru: "Одно чтение весов обслуживает весь батч; на\u00a0каждую последовательность приходится только b. Именно поэтому батчинг вообще выгоден." },
        },
        // Вариативность №5: константы модели (W = 60 мс, b = 2 мс/seq) фиксированы,
        // меняется batch: step = 60 + 2 × 24 = 108;  step = 60 + 2 × 15 = 90.
        // Числа 24 / 108 / 15 / 90 в фигурах не встречаются; followUp переписан под входы.
        variants: [
          {
            q: {
              en: "Decode step for a batch of 20 under the teaching constants (W = 60 ms, b = 2 ms/seq), in ms?",
              ru: "Decode-шаг для batch = 20 при учебных константах (W = 60 мс, b = 2 мс/seq), в мс?",
            },
            answer: 100, tol: 0.5,
          },
          {
            q: {
              en: "Decode step for a batch of 24 under the teaching constants (W = 60 ms, b = 2 ms/seq), in ms?",
              ru: "Decode-шаг для batch = 24 при учебных константах (W = 60 мс, b = 2 мс/seq), в мс?",
            },
            answer: 108, tol: 0.5,
            hint: {
              en: "step = W + b × batch = 60 + 2 × 24.",
              ru: "step = W + b × batch = 60 + 2 × 24.",
            },
            followUp: {
              q: { en: "Why exactly 108 ms? Pick the true cause.", ru: "Почему именно 108 мс? Выбери верную причину." },
              options: [
                { en: "W is paid once per step; each of the 24 sequences adds its own b = 2 ms: 60 + 2 × 24", ru: "W платится один раз за шаг; каждая из 24 последовательностей добавляет свои b = 2 мс: 60 + 2 × 24" },
                { en: "The step grows quadratically: every sequence multiplies by every other one", ru: "Шаг растёт квадратично: каждая последовательность умножается на каждую" },
                { en: "W scales with the batch: weights are re-read for every client, 60 × 24", ru: "W масштабируется с батчем: веса перечитываются для каждого клиента, 60 × 24" },
              ],
              answer: 0,
              explain: { en: "One weight read serves the whole batch; the per-sequence cost is only b. That is why batching pays at all.", ru: "Одно чтение весов обслуживает весь батч; на каждую последовательность приходится только b. Именно поэтому батчинг вообще выгоден." },
            },
          },
          {
            q: {
              en: "Decode step for a batch of 15 under the teaching constants (W = 60 ms, b = 2 ms/seq), in ms?",
              ru: "Decode-шаг для batch = 15 при учебных константах (W = 60 мс, b = 2 мс/seq), в мс?",
            },
            answer: 90, tol: 0.5,
            hint: {
              en: "step = W + b × batch = 60 + 2 × 15.",
              ru: "step = W + b × batch = 60 + 2 × 15.",
            },
            followUp: {
              q: { en: "Why exactly 90 ms? Pick the true cause.", ru: "Почему именно 90 мс? Выбери верную причину." },
              options: [
                { en: "W is paid once per step; each of the 15 sequences adds its own b = 2 ms: 60 + 2 × 15", ru: "W платится один раз за шаг; каждая из 15 последовательностей добавляет свои b = 2 мс: 60 + 2 × 15" },
                { en: "The step grows quadratically: every sequence multiplies by every other one", ru: "Шаг растёт квадратично: каждая последовательность умножается на каждую" },
                { en: "W scales with the batch: weights are re-read for every client, 60 × 15", ru: "W масштабируется с батчем: веса перечитываются для каждого клиента, 60 × 15" },
              ],
              answer: 0,
              explain: { en: "One weight read serves the whole batch; the per-sequence cost is only b. That is why batching pays at all.", ru: "Одно чтение весов обслуживает весь батч; на каждую последовательность приходится только b. Именно поэтому батчинг вообще выгоден." },
            },
          },
        ],
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
          ru: "step = 60 + 2 × 10 = 80 мс; throughput = 10 × 1000 / 80.",
        },
        followUp: {
          q: { en: "Why 125 tok/s and not 167 (10 × 1000 / 60)?", ru: "Почему 125 ток/с, а\u00a0не 167 (10 × 1000 / 60)?" },
          options: [
            { en: "The step is 60 + 2 × 10 = 80 ms: 12.5 steps per second × 10 tokens = 125", ru: "Шаг равен 60 + 2 × 10 = 80\u00a0мс: 12.5 шага в\u00a0секунду × 10 токенов = 125" },
            { en: "b does not matter at small batches, so the step stays 60 ms", ru: "b не влияет при малых батчах, поэтому шаг остаётся 60\u00a0мс" },
            { en: "The roof 1000 / b = 500 tok/s is already reached at batch 10", ru: "Крыша 1000 / b = 500 ток/с достигается уже при batch = 10" },
          ],
          answer: 0,
          explain: { en: "Every live sequence adds b to every step — that is the whole cost of batching. Ignoring b over-quotes throughput by ×1.33.", ru: "Каждая живая последовательность добавляет b к\u00a0каждому шагу — в\u00a0этом вся цена батчинга. Игнорирование b завышает throughput в\u00a01.33 раза." },
        },
        // Вариативность №5: константы фиксированы, меняется batch; throughput = batch × 1000 / step:
        //   batch 45: step 150 → 300;  batch 70: step 200 → 350.
        // Ответы 300 / 350 прочь от фигурных 125 / 200 / 250; followUp переписан под входы.
        variants: [
          {
            q: {
              en: "Throughput at batch 10 under the same constants, in tok/s?",
              ru: "Throughput при batch = 10 при тех же константах, в ток/с?",
            },
            answer: 125, tol: 0.5,
          },
          {
            q: {
              en: "Throughput at batch 45 under the same constants, in tok/s?",
              ru: "Throughput при batch = 45 при тех же константах, в ток/с?",
            },
            answer: 300, tol: 0.5,
            hint: {
              en: "step = 60 + 2 × 45 = 150 ms; throughput = 45 × 1000 / 150.",
              ru: "step = 60 + 2 × 45 = 150 мс; throughput = 45 × 1000 / 150.",
            },
            followUp: {
              q: { en: "Why 300 tok/s and not 750 (45 × 1000 / 60)?", ru: "Почему 300 ток/с, а не 750 (45 × 1000 / 60)?" },
              options: [
                { en: "The step is 60 + 2 × 45 = 150 ms: 6.67 steps per second × 45 tokens = 300", ru: "Шаг равен 60 + 2 × 45 = 150 мс: 6.67 шага в секунду × 45 токенов = 300" },
                { en: "b does not matter at large batches, so the step stays 60 ms", ru: "b не влияет при больших батчах, поэтому шаг остаётся 60 мс" },
                { en: "The roof 1000 / b = 500 tok/s is already reached at batch 45", ru: "Крыша 1000 / b = 500 ток/с достигается уже при batch = 45" },
              ],
              answer: 0,
              explain: { en: "Every live sequence adds b to every step — that is the whole cost of batching. Ignoring b over-quotes throughput by ×2.5 here.", ru: "Каждая живая последовательность добавляет b к каждому шагу — в этом вся цена батчинга. Игнорирование b завышает throughput здесь в 2.5 раза." },
            },
          },
          {
            q: {
              en: "Throughput at batch 70 under the same constants, in tok/s?",
              ru: "Throughput при batch = 70 при тех же константах, в ток/с?",
            },
            answer: 350, tol: 0.5,
            hint: {
              en: "step = 60 + 2 × 70 = 200 ms; throughput = 70 × 1000 / 200.",
              ru: "step = 60 + 2 × 70 = 200 мс; throughput = 70 × 1000 / 200.",
            },
            followUp: {
              q: { en: "Why 350 tok/s and not ≈ 1167 (70 × 1000 / 60)?", ru: "Почему 350 ток/с, а не ≈ 1167 (70 × 1000 / 60)?" },
              options: [
                { en: "The step is 60 + 2 × 70 = 200 ms: 5 steps per second × 70 tokens = 350", ru: "Шаг равен 60 + 2 × 70 = 200 мс: 5 шагов в секунду × 70 токенов = 350" },
                { en: "b does not matter at large batches, so the step stays 60 ms", ru: "b не влияет при больших батчах, поэтому шаг остаётся 60 мс" },
                { en: "The roof 1000 / b = 500 tok/s is already reached at batch 70", ru: "Крыша 1000 / b = 500 ток/с достигается уже при batch = 70" },
              ],
              answer: 0,
              explain: { en: "Every live sequence adds b to every step — that is the whole cost of batching. Ignoring b over-quotes throughput by ×3.33 here.", ru: "Каждая живая последовательность добавляет b к каждому шагу — в этом вся цена батчинга. Игнорирование b завышает throughput здесь в 3.33 раза." },
            },
          },
        ],
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
          ru: "Эффективный batch = min(128, 30) = 30; step = 60 + 2 × 30 = 120 мс; 30 × 1000 / 120. Лишние 98 клиентов лишь заполняют очередь.",
        },
        followUp: {
          q: { en: "Why does the model still say 250 tok/s with 128 clients?", ru: "Почему модель всё ещё говорит 250 ток/с при 128 клиентах?" },
          options: [
            { en: "The working batch is pinned at the cap 30; the extra 98 clients only fill the queue", ru: "Рабочий батч зажат потолком 30; лишние 98 клиентов лишь заполняют очередь" },
            { en: "The model averages over all arrivals: batch 128 gives ≈ 405 tok/s, quoted down", ru: "Модель усредняет по всем пришедшим: batch = 128 даёт ≈ 405 ток/с, называется с округлением вниз" },
            { en: "Clients beyond the cap are dropped, so the batch collapses to 10", ru: "Клиенты сверх потолка отбрасываются, и батч падает до 10" },
          ],
          answer: 0,
          explain: { en: "max_num_seqs caps the working set; beyond it, demand turns into queueing, not tokens — that is the knee mechanism.", ru: "max_num_seqs ограничивает рабочий набор; за\u00a0ним спрос превращается в\u00a0ожидание в\u00a0очереди, а\u00a0не в\u00a0токены — в\u00a0этом механизм колена." },
        },
        // Вариативность №5: клиенты и потолок — входы (потолок 30 и ответ 250 живут в фигуре);
        // eff = min(clients, cap):  min(90, 45) → 300;  min(140, 70) → 350.
        variants: [
          {
            q: {
              en: "128 clients arrive, max_num_seqs = 30, same constants. What throughput does the model predict, in tok/s?",
              ru: "Пришли 128 клиентов, max_num_seqs = 30, те же константы. Какой throughput предсказывает модель, в ток/с?",
            },
            answer: 250, tol: 0.5,
          },
          {
            q: {
              en: "90 clients arrive, max_num_seqs = 45, same constants. What throughput does the model predict, in tok/s?",
              ru: "Пришли 90 клиентов, max_num_seqs = 45, те же константы. Какой throughput предсказывает модель, в ток/с?",
            },
            answer: 300, tol: 0.5,
            hint: {
              en: "Effective batch = min(90, 45) = 45; step = 60 + 2 × 45 = 150 ms; 45 × 1000 / 150. The extra 45 clients only fill the queue.",
              ru: "Эффективный batch = min(90, 45) = 45; step = 60 + 2 × 45 = 150 мс; 45 × 1000 / 150. Лишние 45 клиентов лишь заполняют очередь.",
            },
            followUp: {
              q: { en: "Why does the model still say 300 tok/s with 90 clients?", ru: "Почему модель всё ещё говорит 300 ток/с при 90 клиентах?" },
              options: [
                { en: "The working batch is pinned at the cap 45; the extra 45 clients only fill the queue", ru: "Рабочий батч зажат потолком 45; лишние 45 клиентов лишь заполняют очередь" },
                { en: "The model averages over all arrivals: batch 90 gives ≈ 375 tok/s, quoted down", ru: "Модель усредняет по всем пришедшим: batch = 90 даёт ≈ 375 ток/с, называется с округлением вниз" },
                { en: "Clients beyond the cap are dropped, so the batch collapses to 10", ru: "Клиенты сверх потолка отбрасываются, и батч падает до 10" },
              ],
              answer: 0,
              explain: { en: "max_num_seqs caps the working set; beyond it, demand turns into queueing, not tokens — that is the knee mechanism.", ru: "max_num_seqs ограничивает рабочий набор; за ним спрос превращается в ожидание в очереди, а не в токены — в этом механизм колена." },
            },
          },
          {
            q: {
              en: "140 clients arrive, max_num_seqs = 70, same constants. What throughput does the model predict, in tok/s?",
              ru: "Пришли 140 клиентов, max_num_seqs = 70, те же константы. Какой throughput предсказывает модель, в ток/с?",
            },
            answer: 350, tol: 0.5,
            hint: {
              en: "Effective batch = min(140, 70) = 70; step = 60 + 2 × 70 = 200 ms; 70 × 1000 / 200. The extra 70 clients only fill the queue.",
              ru: "Эффективный batch = min(140, 70) = 70; step = 60 + 2 × 70 = 200 мс; 70 × 1000 / 200. Лишние 70 клиентов лишь заполняют очередь.",
            },
            followUp: {
              q: { en: "Why does the model still say 350 tok/s with 140 clients?", ru: "Почему модель всё ещё говорит 350 ток/с при 140 клиентах?" },
              options: [
                { en: "The working batch is pinned at the cap 70; the extra 70 clients only fill the queue", ru: "Рабочий батч зажат потолком 70; лишние 70 клиентов лишь заполняют очередь" },
                { en: "The model averages over all arrivals: batch 140 gives ≈ 412 tok/s, quoted down", ru: "Модель усредняет по всем пришедшим: batch = 140 даёт ≈ 412 ток/с, называется с округлением вниз" },
                { en: "Clients beyond the cap are dropped, so the batch collapses to 10", ru: "Клиенты сверх потолка отбрасываются, и батч падает до 10" },
              ],
              answer: 0,
              explain: { en: "max_num_seqs caps the working set; beyond it, demand turns into queueing, not tokens — that is the knee mechanism.", ru: "max_num_seqs ограничивает рабочий набор; за ним спрос превращается в ожидание в очереди, а не в токены — в этом механизм колена." },
            },
          },
        ],
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
          { en: "Trace [10, 20, 30, 60] with γ = 0.5: tok/s: 125 → 200 (+60%, qualifies) → 250 (+25%, stops) → capped 250 (+0%). Knee: batch 20, 200 tok/s.", ru: "Трасса [10, 20, 30, 60] при γ = 0.5: ток/с: 125 → 200 (+60%, засчитано) → 250 (+25%, стоп) → 250, срезанные потолком (+0%). Колено: batch 20, 200 ток/с." },
        ],
        numpy: false,
        timeoutMs: 4000,
      },

    ],
    challenge: {
      id: "chal1",
      word: { en: "challenge", ru: "челлендж" },
      title: {
        en: "★ Pick the cap: ≥ 300 tok/s inside a 160 ms step budget",
        ru: "★ Подбери потолок: ≥ 300 ток/с в бюджете шага 160 мс",
      },
      brief: {
        en: "The teaching model is yours to search. Find <code>max_num_seqs</code> (the working batch) so the model holds <strong>≥ 300 tok/s</strong> while the decode step stays <strong>≤ 160 ms</strong> (W = 60, b = 2). There is no test scaffold here: the page only reads the numbers you print — and accepts them only if they follow the declared model.",
        ru: "Учебная модель — твоя для поиска. Найди <code>max_num_seqs</code> (рабочий батч) так, чтобы модель держала <strong>≥ 300 ток/с</strong>, а decode-шаг не выходил за <strong>160\u00a0мс</strong> (W = 60, b = 2). Тестов-каркаса нет: страница читает только числа, которые ты напечатаешь, — и принимает их, лишь если они следуют заявленной модели.",
      },
      goal: {
        en: "Print one summary line: <code>cap=… step_ms=… tok_s=…</code> with step ≤ 160 ms and tok/s ≥ 300.",
        ru: "Напечатай одну итоговую строку: <code>cap=… step_ms=… tok_s=…</code> с шагом ≤ 160\u00a0мс и throughput ≥ 300 ток/с.",
      },
      mode: "run",
      numpy: false,
      timeoutMs: 30000,
      starter: `# Goal: BOTH constraints at once - throughput >= 300 tok/s while the decode
# step stays <= 160 ms (W = 60, b = 2). Search any way you like: a loop, a
# formula, a grid. The page reads ONE summary line in exactly this shape:
#   cap=<max_num_seqs> step_ms=<step in ms> tok_s=<throughput>

# TODO: find a cap satisfying both constraints and print the summary line.
`,
      check: (res) => {
        const out = String(res.stdout || "");
        const mm = out.match(/cap\s*=\s*([0-9]+(?:\.[0-9]+)?)[\s\S]*?step_ms\s*=\s*(-?[0-9]+(?:\.[0-9]+)?)[\s\S]*?tok_s\s*=\s*(-?[0-9]+(?:\.[0-9]+)?)/i);
        if (!mm) {
          return { ok: false, note: { en: "no summary line found - print exactly: cap=… step_ms=… tok_s=…", ru: "итоговой строки нет — напечатай ровно: cap=… step_ms=… tok_s=…" } };
        }
        const cap = parseFloat(mm[1]), step = parseFloat(mm[2]), tok = parseFloat(mm[3]);
        const stepModel = 60 + 2 * cap;
        const tokModel = (cap * 1000.0) / stepModel;
        const consistent = Math.abs(step - stepModel) <= Math.max(0.5, stepModel * 0.01) &&
          Math.abs(tok - tokModel) <= tokModel * 0.01;
        if (!consistent) {
          return { ok: false, note: { en: "the numbers must follow the declared model: step = 60 + 2 × cap, tok/s = cap × 1000 / step", ru: "числа должны следовать заявленной модели: шаг = 60 + 2 × cap, ток/с = cap × 1000 / шаг" } };
        }
        if (step > 160) {
          return { ok: false, note: { en: "step " + step + " ms exceeds the 160 ms budget - the cap is too high", ru: "шаг " + step + " мс превышает бюджет 160\u00a0мс — потолок слишком высок" } };
        }
        if (tok < 300) {
          return { ok: false, note: { en: "throughput " + tok + " tok/s is below the 300 tok/s goal - the cap is too low", ru: "throughput " + tok + " ток/с ниже цели 300 ток/с — потолок слишком низок" } };
        }
        return { ok: true, note: { en: "cap " + cap + ": step " + step + " ms ≤ 160, " + tok + " tok/s ≥ 300 - inside the feasible band", ru: "cap " + cap + ": шаг " + step + " мс ≤ 160, " + tok + " ток/с ≥ 300 — внутри допустимой полосы" } };
      },
      reference: `# Closed form: both constraints are monotone in cap.
#   step <= 160  ->  60 + 2*cap <= 160          ->  cap <= 50
#   tok  >= 300  ->  cap*1000/(60+2*cap) >= 300 ->  cap >= 45
# Any cap in the band 45..50 satisfies both; the smallest is 45.

for cap in range(1, 200):
    step = 60 + 2 * cap
    tok = cap * 1000.0 / step
    if step <= 160 and tok >= 300:
        print(f"cap={cap} step_ms={step:.1f} tok_s={tok:.1f}")
        break

# The grid finds 45; the algebra proves the whole band 45..50 works - and
# that both borders are active: below 45 the throughput goal fails, above
# 50 the step budget fails.`,
    },
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
