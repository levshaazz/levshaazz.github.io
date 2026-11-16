/* Lab 12 — Advanced Kubernetes: one pod, many clients, and the HPA.
   Content module for the generic lab page (window.LABS_CONTENT['12']).
   The HPA controller taught as declared arithmetic (ceil formula, tolerance
   band, stabilization windows) over the T6 step model; LLM scaling signals
   per the llm-d/KubeCon lesson: queue depth and KV pressure, not GPU util. */
(function () {
  "use strict";
  window.LABS_CONTENT = window.LABS_CONTENT || {};

  LABS_CONTENT["12"] = {
    title: {
      en: "Advanced Kubernetes: one pod, many clients — and the HPA",
      ru: "Продвинутый Kubernetes: толпа на одном поде — и HPA",
    },
    sub: {
      en: "Explain why a busy GPU is not a scaling signal, compute the HPA decision to the integer, and tame the flapping fleet with a stabilization window.",
      ru: "Объясни, почему занятый GPU — не сигнал к масштабированию, посчитай решение HPA до целого и усмири флаттерующий флот окном стабилизации.",
    },
    intro: {
      en: `<p>One vLLM pod already serves a crowd: continuous batching (T05) collects requests into batches at every step boundary, and the roof <code>1000 / b</code> from T06 still holds. That is why <strong>«GPU busy at 90 %» is not an overload signal</strong> — batching is supposed to keep the GPU busy even when the queue is empty. The signals that actually mean «scale» are the <strong>queue depth</strong>, the KV-cache pressure and the TTFT — the lesson the llm-d team brought home from KubeCon NA 2026.</p>
<p>The <strong>Horizontal Pod Autoscaler (HPA)</strong> is the controller that turns such a signal into replicas. Every tick (15 s) it computes one number: <code>desired = ceil(replicas × metric / target)</code>, clamped into <code>[min, max]</code>. If the metric-to-target ratio sits inside the <strong>tolerance band</strong> ±10 %, it does nothing. And the windows are asymmetric on purpose: scaling up is immediate (window 0 s), scaling down waits in a <strong>300 s stabilization window</strong> and applies the <em>maximum</em> recommendation seen there — without it, a saw-shaped metric makes the fleet flap 1↔2↔1 and burns money on churn.</p>
<p>Scaling LLM pods is expensive in time even when it is free in paperwork: a fresh pod pays the weight load again (T09's members, ~165 s on the course fleet), which is exactly why scale-down is the cautious direction. Everything here runs on declared numbers and a deterministic simulator in the sandbox — this is controller arithmetic, not a cluster. The compose runtime from T08 remains your rehearsal: burst 24 → sixteen honest 429s (T08), then a hand-driven «HPA tick» — raise the gateway replicas — and burst again; the journal compares the refusals.</p>`,
      ru: `<p>Один под vLLM уже обслуживает толпу: continuous batching (T05) собирает запросы в батчи на каждой границе шага, и крыша <code>1000 / b</code> из T06 никуда не делась. Поэтому <strong>«GPU занят на 90 %» — не сигнал перегрузки</strong>: батчинг и обязан держать GPU занятым, даже когда очередь пуста. Сигналы, которые действительно означают «масштабируй», — <strong>глубина очереди</strong>, давление на KV-кэш и TTFT: урок, который команда llm-d привезла с KubeCon NA 2026.</p>
<p><strong>Horizontal Pod Autoscaler (HPA)</strong> — контроллер, превращающий такой сигнал в реплики. Каждый тик (15 с) он считает одно число: <code>desired = ceil(replicas × metric / target)</code>, зажатое в <code>[min, max]</code>. Если отношение метрики к цели сидит в <strong>полосе tolerance</strong> ±10 % — он не делает ничего. А окна намеренно асимметричны: вверх — мгновенно (окно 0 с), вниз — ждёт в <strong>окне стабилизации 300 с</strong> и применяет <em>максимум</em> увиденных там рекомендаций; без него пилообразная метрика дёргает флот 1↔2↔1 и сжигает деньги на перемешивание.</p>
<p>Масштабировать LLM-поды дорого по времени, даже когда по бумагам бесплатно: свежий под снова платит загрузку весов (члены из T09, ~165 с на курсовом флоте) — поэтому осторожное направление именно скейл-даун. Всё здесь считается на заявленных числах и детерминированном симуляторе в песочнице — это арифметика контроллера, а не кластер. Compose-рантайм из T08 остаётся репетицией: бурст 24 → шестнадцать честных 429 (T08), потом «тик HPA» руками — поднять replicas шлюза — и снова бурст; журнал сравнит отказы.</p>`,
    },
    heroTag: { en: "queue depth, ceil, stabilization", ru: "глубина очереди, ceil, стабилизация" },
    glossary: [
      [{ en: "HPA", ru: "HPA" }, { en: "Horizontal Pod Autoscaler: a controller that adjusts replica count every tick from one formula.", ru: "Horizontal Pod Autoscaler: контроллер, меняющий число реплик каждый тик по одной формуле." }],
      [{ en: "signal vs metric", ru: "сигнал против метрики" }, { en: "GPU utilization misleads for LLMs (batching keeps it high); real signals: queue depth, KV-cache pressure, TTFT.", ru: "GPU-утилизация для LLM обманывает (батчинг держит её высокой); настоящие сигналы: глубина очереди, давление KV-кэша, TTFT." }],
      [{ en: "tolerance", ru: "полоса tolerance" }, { en: "±10 % band around the target: if the ratio is inside, the HPA does nothing (no flapping on noise).", ru: "полоса ±10 % вокруг цели: если отношение внутри — HPA не делает ничего (нет дёрганья на шуме)." }],
      [{ en: "stabilization window", ru: "окно стабилизации" }, { en: "scale-up is immediate (0 s); scale-down waits 300 s and takes the max recommendation seen in the window.", ru: "скейл-ап мгновенный (0 с); скейл-даун ждёт 300 с и берёт максимум рекомендаций за окно." }],
      [{ en: "custom metrics", ru: "кастомные метрики" }, { en: "LLM signals are not CPU: they reach the HPA via Prometheus Adapter, KEDA, or llm-d's WVA.", ru: "сигналы LLM — не CPU: до HPA они добираются через Prometheus Adapter, KEDA или llm-d WVA." }],
      [{ en: "queue depth", ru: "глубина очереди" }, { en: "requests waiting per pod; the teaching target here is 2 per pod.", ru: "заявок в очереди на под; учебная цель здесь — 2 на под." }],
      [{ en: "cold scale-up", ru: "холодный масштаб-ап" }, { en: "a fresh pod pays the weight load again (T09 members) — scale-up is instant on paper, slow in reality.", ru: "свежий под снова платит загрузку весов (члены T09) — на бумаге скейл-ап мгновенный, в реальности медленный." }],
      [{ en: "single-pod concurrency", ru: "конкурентность пода" }, { en: "continuous batching (T05) serves many clients per pod — that is why per-pod capacity is a roof, not a fixed rate.", ru: "continuous batching (T05) обслуживает многих клиентов на под — потому ёмкость пода это крыша, а не фиксированная ставка." }],
      [{ en: "PodDisruptionBudget", ru: "PodDisruptionBudget" }, { en: "a floor for voluntary disruptions (drains, updates): how many pods must stay up — the T11 rollout lesson, generalized.", ru: "нижняя граница для добровольных беспокойств (дрены, обновления): сколько подов обязаны жить — урок роллаутов из T11 в общем виде." }],
      [{ en: "failure drill", ru: "дрель отказа" }, { en: "kill a pod on purpose and measure what clients see: how much capacity vanished and for how long.", ru: "убить под нарочно и измерить, что увидят клиенты: сколько ёмкости пропало и на сколько." }],
    ],
    figures: [
      {
        id: "lab12-hpa-loop",
        title: { en: "The HPA loop: one formula, two windows", ru: "Цикл HPA: одна формула, два окна" },
        w: 760, h: 420,
        svg: `<svg viewBox="0 0 760 420" xmlns="http://www.w3.org/2000/svg">
  <g id="g-metric">
    <line x1="80" y1="300" x2="700" y2="300" stroke="var(--lab-muted)" stroke-width="1.5"/>
    <text x="700" y="324" text-anchor="end" font-size="13" fill="var(--lab-muted)" data-en="ticks (15 s each)" data-ru="тики (по 15 с)">ticks (15 s each)</text>
    <path d="M 80 300 C 180 296 280 240 380 170 C 480 110 580 100 700 96" fill="none" stroke="var(--lab-accent)" stroke-width="2.5" class="fig-flow"/>
    <text x="90" y="80" font-size="14" fill="var(--lab-accent)" data-en="metric: queue depth per pod" data-ru="метрика: глубина очереди на под">metric: queue depth per pod</text>
  </g>
  <g id="g-band">
    <line x1="80" y1="248" x2="700" y2="248" stroke="var(--fig-warm)" stroke-width="1.5" stroke-dasharray="5 4"/>
    <line x1="80" y1="286" x2="700" y2="286" stroke="var(--fig-warm)" stroke-width="1.5" stroke-dasharray="5 4"/>
    <text x="90" y="274" font-size="13" fill="var(--fig-warm)" data-en="target ±10 % — inside the band: do nothing" data-ru="цель ±10 % — внутри полосы: ничего не делать">target ±10 % — inside the band: do nothing</text>
  </g>
  <g id="g-ceil">
    <rect x="470" y="40" width="230" height="52" rx="9" fill="none" stroke="var(--lab-accent)" stroke-width="2"/>
    <text x="585" y="62" text-anchor="middle" font-size="14" fill="var(--lab-accent)" class="mono">ceil(2 × 6 / 2) = 6 → 4</text>
    <text x="585" y="82" text-anchor="middle" font-size="12" fill="var(--lab-muted)" data-en="clamped into [min, max]" data-ru="зажато в [min, max]">clamped into [min, max]</text>
    <text x="380" y="348" font-size="14" fill="var(--lab-ink)" data-en="outside the band and rising: scale up immediately (window 0 s)" data-ru="вне полосы и растёт: скейл-ап мгновенно (окно 0 с)">outside the band and rising: scale up immediately (window 0 s)</text>
  </g>
  <g id="g-window">
    <rect x="470" y="40" width="230" height="52" rx="9" fill="none" stroke="var(--fig-warm)" stroke-width="2"/>
    <text x="585" y="62" text-anchor="middle" font-size="14" fill="var(--fig-warm)" class="mono" data-en="scale-down: max of 300 s window" data-ru="скейл-даун: максимум за 300 с">scale-down: max of 300 s window</text>
    <text x="585" y="82" text-anchor="middle" font-size="12" fill="var(--lab-muted)" data-en="20 ticks of 15 s" data-ru="20 тиков по 15 с">20 ticks of 15 s</text>
    <text x="380" y="378" font-size="14" fill="var(--fig-warm)" data-en="metric falls: the window holds the fleet up" data-ru="метрика падает: окно держит флот наверху">metric falls: the window holds the fleet up</text>
    <g class="fig-ghost">
      <path d="M 100 40 L 140 76 L 180 40 L 220 76 L 260 40 L 300 76 L 340 40" fill="none" stroke="var(--fig-warm)" stroke-width="1.5"/>
      <text x="220" y="30" text-anchor="middle" font-size="12" fill="var(--fig-warm)" data-en="without the window: flapping 1↔4↔1" data-ru="без окна: флаттер 1↔4↔1">without the window: flapping 1↔4↔1</text>
    </g>
  </g>
</svg>`,
        stages: [
          { cap: { en: "The metric climbs: queue depth per pod, tick by tick.", ru: "Метрика растёт: глубина очереди на под, тик за тиком." }, show: ["g-metric"] },
          { cap: { en: "The tolerance band sits around the target; inside it the HPA does nothing.", ru: "Полоса tolerance вокруг цели; внутри неё HPA не делает ничего." }, show: ["g-metric", "g-band"] },
          { cap: { en: "Outside the band and rising: ceil(2 × 6 / 2) = 6, clamped to 4 — scale up now.", ru: "Вне полосы и растёт: ceil(2 × 6 / 2) = 6, зажато до 4 — скейл-ап немедленно." }, show: ["g-metric", "g-band", "g-ceil"] },
          { cap: { en: "The metric falls: scale-down reads its 300 s window and takes the max — no flapping.", ru: "Метрика падает: скейл-даун читает своё окно 300 с и берёт максимум — без флаттера." }, show: ["g-metric", "g-band", "g-window"] },
        ],
      },
      {
        id: "lab12-one-pod-crowd",
        title: { en: "One pod, a crowd of clients — and the honest gauge", ru: "Один под, толпа клиентов — и честный манометр" },
        w: 760, h: 420,
        svg: `<svg viewBox="0 0 760 420" xmlns="http://www.w3.org/2000/svg">
  <g id="g-clients">
    <circle cx="80" cy="90" r="7" fill="var(--lab-accent)"/>
    <circle cx="80" cy="150" r="7" fill="var(--lab-accent)"/>
    <circle cx="80" cy="210" r="7" fill="var(--lab-accent)"/>
    <circle cx="80" cy="270" r="7" fill="var(--lab-accent)"/>
    <circle cx="80" cy="330" r="7" fill="var(--lab-accent)"/>
    <text x="80" y="366" text-anchor="middle" font-size="13" fill="var(--lab-muted)" data-en="6 concurrent clients" data-ru="6 параллельных клиентов">6 concurrent clients</text>
    <path d="M 92 90 C 180 96 220 116 268 132" fill="none" stroke="var(--lab-accent)" stroke-width="2" class="fig-flow"/>
    <path d="M 92 210 C 180 208 220 198 268 188" fill="none" stroke="var(--lab-accent)" stroke-width="2" class="fig-flow"/>
    <path d="M 92 330 C 180 320 220 288 268 258" fill="none" stroke="var(--lab-accent)" stroke-width="2" class="fig-flow"/>
    <rect x="270" y="110" width="200" height="160" rx="12" fill="none" stroke="var(--lab-accent)" stroke-width="2"/>
    <text x="370" y="140" text-anchor="middle" font-size="15" fill="var(--lab-accent)" class="mono" data-en="one vLLM pod" data-ru="один под vLLM">one vLLM pod</text>
  </g>
  <g id="g-batch">
    <rect x="290" y="160" width="22" height="42" rx="4" fill="var(--lab-accent)" opacity="0.85"/>
    <rect x="316" y="160" width="22" height="42" rx="4" fill="var(--lab-accent)" opacity="0.85"/>
    <rect x="342" y="160" width="22" height="42" rx="4" fill="var(--lab-accent)" opacity="0.55"/>
    <rect x="368" y="160" width="22" height="42" rx="4" fill="var(--lab-accent)" opacity="0.25"/>
    <rect x="394" y="160" width="22" height="42" rx="4" fill="var(--lab-accent)" opacity="0.12"/>
    <text x="370" y="226" text-anchor="middle" font-size="13" fill="var(--lab-muted)" data-en="continuous batching fills slots at step boundaries (T05)" data-ru="continuous batching заполняет слоты на границах шага (T05)">continuous batching fills slots at step boundaries (T05)</text>
    <text x="370" y="248" text-anchor="middle" font-size="13" fill="var(--lab-muted)" class="mono" data-en="cap 30 · working point 250 tok/s (T06)" data-ru="кап 30 · рабочая точка 250 ток/с (T06)">cap 30 · working point 250 tok/s (T06)</text>
  </g>
  <g id="g-meters">
    <rect x="520" y="110" width="200" height="70" rx="9" fill="none" stroke="var(--fig-warm)" stroke-width="1.5"/>
    <text x="536" y="136" font-size="14" fill="var(--fig-warm)" class="mono" data-en="GPU util: 90 %" data-ru="GPU-утилизация: 90 %">GPU util: 90 %</text>
    <text x="536" y="160" font-size="12" fill="var(--fig-warm)" data-en="busy batching — calm, not overload" data-ru="занят батчингом — это спокойствие, не перегруз">busy batching — calm, not overload</text>
    <rect x="520" y="200" width="200" height="70" rx="9" fill="none" stroke="var(--lab-good)" stroke-width="1.5"/>
    <text x="536" y="226" font-size="14" fill="var(--lab-good)" class="mono" data-en="queue depth: 0 per pod" data-ru="очередь: 0 на под">queue depth: 0 per pod</text>
    <text x="536" y="250" font-size="12" fill="var(--lab-good)" data-en="nobody waiting — do not scale" data-ru="никто не ждёт — не масштабируй">nobody waiting — do not scale</text>
  </g>
  <g id="g-scale">
    <rect x="520" y="290" width="200" height="70" rx="9" fill="none" stroke="var(--lab-accent)" stroke-width="2"/>
    <text x="536" y="316" font-size="14" fill="var(--lab-accent)" class="mono" data-en="queue depth: 5 per pod" data-ru="очередь: 5 на под">queue depth: 5 per pod</text>
    <text x="536" y="340" font-size="13" fill="var(--lab-accent)" class="mono">ceil(2 × 5 / 2) = 5 → 4</text>
    <text x="536" y="356" font-size="12" fill="var(--lab-accent)" data-en="now the HPA acts" data-ru="вот теперь HPA действует">now the HPA acts</text>
    <text x="380" y="398" text-anchor="middle" font-size="14" fill="var(--lab-ink)" data-en="GPU util lies, the queue tells the truth" data-ru="GPU-утилизация врёт, очередь говорит правду">GPU util lies, the queue tells the truth</text>
  </g>
</svg>`,
        stages: [
          { cap: { en: "Six clients hit one vLLM pod at once.", ru: "Шесть клиентов бьют в один под vLLM одновременно." }, show: ["g-clients"] },
          { cap: { en: "Continuous batching packs them into slots at every step boundary.", ru: "Continuous batching упаковывает их в слоты на каждой границе шага." }, show: ["g-clients", "g-batch"] },
          { cap: { en: "The honest gauges: GPU 90 % is calm batching; queue 0 means do not scale.", ru: "Честные манометры: GPU 90 % — спокойный батчинг; очередь 0 — не масштабировать." }, show: ["g-clients", "g-batch", "g-meters"] },
          { cap: { en: "Queue 5 per pod: ceil(2 × 5 / 2) = 5 → clamp 4 — now the HPA acts.", ru: "Очередь 5 на под: ceil(2 × 5 / 2) = 5 → зажато до 4 — вот теперь HPA действует." }, show: ["g-batch", "g-meters", "g-scale"] },
        ],
      },
    ],
    outcomes: [
      { en: "Compute the HPA decision like the controller: ceil formula, tolerance band, clamp, and the stabilization windows that prevent flapping.", ru: "Считать решение HPA как контроллер: формула ceil, полоса tolerance, кламп и окна стабилизации, которые гасят флаттер." },
      { en: "Pick an LLM scaling signal and run a failure drill: explain why GPU utilization misleads and what a lost pod costs.", ru: "Выбирать сигнал масштабирования для LLM и проводить дрель отказа: объяснять, чем обманывает GPU-утилизация и во что обходится потерянный под." },
    ],
    model: [
      [{ en: "HPA formula", ru: "формула HPA" }, { en: "desired = ceil(replicas × metric / target)", ru: "desired = ceil(replicas × metric / target)" }, { en: "tolerance", ru: "tolerance" }, { en: "±10 % → no scaling", ru: "±10 % → не скейлим" }],
      [{ en: "windows (k8s defaults)", ru: "окна (дефолты k8s)" }, { en: "up 0 s · down 300 s", ru: "вверх 0 с · вниз 300 с" }, { en: "scale-down rule", ru: "правило скейл-дауна" }, { en: "max recommendation in window", ru: "максимум рекомендаций за окно" }],
      [{ en: "sync tick", ru: "тик синхронизации" }, "15 s", { en: "clamp", ru: "кламп" }, { en: "min ≤ desired ≤ max", ru: "min ≤ desired ≤ max" }],
      [{ en: "one pod's working point (T06)", ru: "рабочая точка пода (T06)" }, { en: "batch 30 → 250 tok/s", ru: "батч 30 → 250 ток/с" }, { en: "LLM scaling signals", ru: "сигналы масштабирования LLM" }, { en: "queue depth · KV pressure · TTFT", ru: "глубина очереди · давление KV · TTFT" }],
    ],
    scenario: null,
    quizzes: [
      {
        id: "q1",
        q: {
          en: "3 replicas, queue depth 8 per pod, target 2, maxReplicas 10. How many replicas after this HPA tick?",
          ru: "3 реплики, глубина очереди 8 на под, цель 2, maxReplicas 10. Сколько реплик будет после этого тика HPA?",
        },
        answer: 10, tol: 0.2, unit: { en: "replicas", ru: "реплик" },
        hint: {
          en: "ceil(3 × 8 / 2) = 12, then clamp into [min, max].",
          ru: "ceil(3 × 8 / 2) = 12, затем кламп в [min, max].",
        },
      },
      {
        id: "q2",
        q: {
          en: "4 replicas, metric 2.2, target 2, tolerance 0.1. What does the HPA set this tick?",
          ru: "4 реплики, метрика 2.2, цель 2, tolerance 0.1. Что HPA выставит этим тиком?",
        },
        answer: 4, tol: 0.2, unit: { en: "replicas", ru: "реплик" },
        hint: {
          en: "2.2 / 2 = 1.1 — exactly on the band edge; the band is inclusive, so: no change.",
          ru: "2.2 / 2 = 1.1 — ровно на краю полосы; полоса включительная, значит: без изменений.",
        },
      },
      {
        id: "q3",
        q: {
          en: "The scale-down stabilization window is 300 s and the sync tick is 15 s. How many ticks does a recommendation stay inside the window?",
          ru: "Окно стабилизации скейл-дауна — 300 с, тик синхронизации — 15 с. Сколько тиков рекомендация живёт внутри окна?",
        },
        answer: 20, tol: 0.2, unit: { en: "ticks", ru: "тиков" },
        hint: {
          en: "300 / 15 — and the window takes the max of everything it still holds.",
          ru: "300 / 15 — и окно берёт максимум всего, что ещё держит.",
        },
      },
    ],
    exercises: [
      {
        id: "ex1",
        title: { en: "Exercise 1 · The HPA formula", ru: "Упражнение 1 · Формула HPA" },
        brief: {
          en: "Implement <code>desired_replicas(replicas, metric, target, min_r=1, max_r=10)</code> — the controller's one number: <code>ceil(replicas × metric / target)</code>, clamped into <code>[min_r, max_r]</code>. Here <code>metric</code> is an LLM signal like queue depth per pod and <code>target</code> is its desired value (the tolerance band arrives in Exercise 2). Mind the ceiling: <code>int()</code> truncates, the controller rounds <em>up</em> — under-provisioning is the one mistake it never makes.",
          ru: "Реализуй <code>desired_replicas(replicas, metric, target, min_r=1, max_r=10)</code> — то самое число контроллера: <code>ceil(replicas × metric / target)</code>, зажатое в <code>[min_r, max_r]</code>. Здесь <code>metric</code> — LLM-сигнал вроде глубины очереди на под, а <code>target</code> — его желаемое значение (полоса tolerance появится в упражнении 2). Следи за потолком: <code>int()</code> усекает, а контроллер округляет <em>вверх</em> — недопровижининг — единственная ошибка, которую он никогда не делает.",
        },
        starter: `import math

def desired_replicas(replicas, metric, target, min_r=1, max_r=10):
    """The HPA's one number: ceil ratio, clamped into [min_r, max_r]."""
    # TODO: ceil the ratio, THEN clamp — under-provisioning is forbidden
`,
        tests: [
          { name: "double the load", hidden: false, code: "eq(desired_replicas(2, 5, 2), 5)" },
          { name: "half the load", hidden: false, code: "eq(desired_replicas(2, 1, 2), 1)" },
          { name: "clamp respects max", hidden: false, code: "eq(desired_replicas(2, 100, 2, 1, 10), 10)" },
          { name: "ceil, not truncation", hidden: true, code: "eq(desired_replicas(3, 5, 2), 8)" },
          { name: "clamp respects min on collapse", hidden: true, code: "eq(desired_replicas(10, 1, 100, 2, 10), 2)" },
        ],
        solution: `import math

def desired_replicas(replicas, metric, target, min_r=1, max_r=10):
    return min(max(math.ceil(replicas * metric / target), min_r), max_r)`,
        hints: [
          { en: "math.ceil first, clamp second: ceil(7.5) = 8, not 7.", ru: "Сначала math.ceil, кламп вторым: ceil(7.5) = 8, а не 7." },
        ],
        numpy: false,
        timeoutMs: 4000,
      },
      {
        id: "ex2",
        title: { en: "Exercise 2 · The tolerance band", ru: "Упражнение 2 · Полоса tolerance" },
        brief: {
          en: "Implement <code>hpa_step(replicas, metric, target, tol=0.1, min_r=1, max_r=10)</code> — one controller tick. If the ratio <code>metric / target</code> sits inside <code>[1 − tol, 1 + tol]</code> <strong>inclusive</strong>, the HPA keeps the replica count untouched (scaling on noise is how you burn money); outside the band, it applies Exercise 1's formula. The band edges themselves count as «inside».",
          ru: "Реализуй <code>hpa_step(replicas, metric, target, tol=0.1, min_r=1, max_r=10)</code> — один тик контроллера. Если отношение <code>metric / target</code> сидит в <code>[1 − tol, 1 + tol]</code> <strong>включительно</strong>, HPA не трогает число реплик (скейлить на шуме — жечь деньги); вне полосы — работает формула упражнения 1. Сами края полосы считаются «внутри».",
        },
        starter: `def hpa_step(replicas, metric, target, tol=0.1, min_r=1, max_r=10):
    """One HPA tick: no change inside the band, formula outside it."""
    # TODO: ratio = metric / target; band is inclusive [1-tol, 1+tol]
`,
        tests: [
          { name: "inside the band: hold", hidden: false, code: "eq(hpa_step(2, 2.1, 2), 2)" },
          { name: "above the band: scale up", hidden: false, code: "eq(hpa_step(2, 3, 2), 3)" },
          { name: "boundary 1.1 is inside", hidden: true, code: "eq(hpa_step(8, 110, 100), 8)" },
          { name: "boundary 0.9 is inside", hidden: true, code: "eq(hpa_step(8, 90, 100), 8)" },
          { name: "just outside: formula runs", hidden: true, code: "eq(hpa_step(8, 150, 100, 0.1, 1, 100), 12)\neq(hpa_step(8, 50, 100), 4)" },
        ],
        solution: `import math

def hpa_step(replicas, metric, target, tol=0.1, min_r=1, max_r=10):
    ratio = metric / target
    if 1 - tol <= ratio <= 1 + tol:
        return replicas
    return min(max(math.ceil(replicas * ratio), min_r), max_r)`,
        hints: [
          { en: "Reuse desired_replicas outside the band — do not re-derive it.", ru: "Вне полосы переиспользуй desired_replicas — не выводи формулу заново." },
          { en: "Import math at the top of the cell.", ru: "Импортируй math вверху клетки." },
        ],
        numpy: false,
        timeoutMs: 4000,
      },
      {
        id: "ex3",
        title: { en: "Exercise 3 · Fix the bug: the flapping fleet", ru: "Упражнение 3 · Почини баг: флаттерующий флот" },
        brief: {
          en: "This <code>stabilized(recs, window, current)</code> always applies the latest recommendation, so a saw-shaped metric flaps the fleet 1↔2↔1: every scale-down is instantly regretted. Kubernetes' fix is the stabilization window: scaling <strong>up</strong> applies immediately (the shortage hurts now), scaling <strong>down</strong> takes the <em>maximum</em> recommendation seen within the last <code>window</code> ticks. Fix it: latest recommendation when it does not shrink the fleet; otherwise the window max.",
          ru: "Эта <code>stabilized(recs, window, current)</code> всегда применяет последнюю рекомендацию, поэтому пилообразная метрика дёргает флот 1↔2↔1: каждый скейл-даун тут же приходится отменять. Фикс Kubernetes — окно стабилизации: скейл <strong>вверх</strong> применяется немедленно (дефицит болит сейчас), скейл <strong>вниз</strong> берёт <em>максимум</em> рекомендаций за последние <code>window</code> тиков. Почини: последняя рекомендация, если она не сжимает флот; иначе — максимум окна.",
        },
        starter: `def stabilized(recs, window, current):
    """Replica count to set now; recs is per-tick, oldest first."""
    # BUG: applies the latest recommendation always — the fleet
    # flaps 1<->2<->1 on a saw-shaped metric
    return recs[-1]
`,
        tests: [
          { name: "saw metric: the window holds the fleet", hidden: false, code: "eq(stabilized([1, 2, 1, 2, 1], 3, 2), 2)" },
          { name: "scale-up is immediate", hidden: false, code: "eq(stabilized([1, 1, 5], 3, 2), 5)" },
          { name: "the spike fell out of the window", hidden: true, code: "eq(stabilized([5, 1, 1, 1], 3, 4), 1)" },
          { name: "window max keeps current — held, not raised", hidden: true, code: "eq(stabilized([4, 2, 2], 3, 4), 4)" },
        ],
        solution: `def stabilized(recs, window, current):
    latest = recs[-1]
    if latest >= current:
        return latest
    return max(recs[-window:])`,
        hints: [
          { en: "Two branches: latest >= current → apply it; otherwise max of the last `window` recommendations.", ru: "Две ветки: latest >= current → применяем; иначе — максимум последних `window` рекомендаций." },
        ],
        numpy: false,
        timeoutMs: 4000,
      },
      {
        id: "ex4",
        title: { en: "Exercise 4 · Wrap it into a class: HPASim", ru: "Упражнение 4 · Собери в класс: HPASim" },
        brief: {
          en: "The lab's final boss: the controller loop as a class. <code>HPASim(w_ms=60.0, b_ms=2.0, cap=30, target_queue=2.0, min_r=1, max_r=4, window=20)</code> — the T06 step model per pod (cap 30 sequences, working point 250 tok/s). <code>tick(arrivals)</code>: add arrivals to the queue; the metric is <code>queue / replicas</code>; recommend <code>ceil(replicas × metric / target)</code> clamped (no tolerance band here — Exercise 2's job); scale-down runs through the stabilization window (max of the last <code>window</code> recommendations), scale-up is immediate; then serve <code>min(queue, replicas × cap)</code>. The tick returns <code>{'replicas', 'served', 'queue', 'step_ms'}</code> with <code>step_ms = w_ms + b_ms × batch</code> and <code>batch = ceil(served / replicas)</code> capped at <code>cap</code> (0 if nothing served). <code>report()</code> returns <code>{'ticks', 'held_ticks', 'unserved_ticks', 'final_replicas', 'final_queue'}</code> where <code>held_ticks</code> counts scale-downs suppressed by the window and <code>unserved_ticks</code> counts ticks that ended with a non-empty queue.",
          ru: "Финальный босс лабы: цикл контроллера как класс. <code>HPASim(w_ms=60.0, b_ms=2.0, cap=30, target_queue=2.0, min_r=1, max_r=4, window=20)</code> — модель шага из T06 на под (кап 30 последовательностей, рабочая точка 250 ток/с). <code>tick(arrivals)</code>: добавь arrivals в очередь; метрика — <code>queue / replicas</code>; рекомендация — <code>ceil(replicas × metric / target)</code> с клампом (без полосы tolerance — её работа была в упражнении 2); скейл-даун идёт через окно стабилизации (максимум последних <code>window</code> рекомендаций), скейл-ап мгновенный; затем обслужи <code>min(queue, replicas × cap)</code>. Тик возвращает <code>{'replicas', 'served', 'queue', 'step_ms'}</code>, где <code>step_ms = w_ms + b_ms × batch</code>, а <code>batch = ceil(served / replicas)</code> с потолком <code>cap</code> (0, если ничего не обслужено). <code>report()</code> возвращает <code>{'ticks', 'held_ticks', 'unserved_ticks', 'final_replicas', 'final_queue'}</code>, где <code>held_ticks</code> считает скейл-дауны, удержанные окном, а <code>unserved_ticks</code> — тики, кончившиеся непустой очередью.",
        },
        starter: `import math

class HPASim:
    """The HPA loop over the T06 step model; one tick = one controller pass."""

    def __init__(self, w_ms=60.0, b_ms=2.0, cap=30, target_queue=2.0,
                 min_r=1, max_r=4, window=20):
        # TODO: store the knobs; replicas = min_r; queue = 0; recs = []
        ...

    def tick(self, arrivals):
        # TODO: metric = queue / replicas; recommend ceil(...) clamped;
        # scale-down via window max, scale-up immediate; serve
        # min(queue, replicas * cap); step_ms = w + b * batch
        ...

    def report(self):
        # TODO: {'ticks', 'held_ticks', 'unserved_ticks',
        #        'final_replicas', 'final_queue'}
        ...`,
        tests: [
          { name: "burst scales up and serves", hidden: false, code: "sim = HPASim(target_queue=10, min_r=1, max_r=3, cap=30, window=3)\nr = sim.tick(60)\neq(r['replicas'], 3)\neq(r['served'], 60)\neq(r['queue'], 0)\neq(r['step_ms'], 100)" },
          { name: "scale-down is held by the window", hidden: false, code: "sim = HPASim(target_queue=10, min_r=1, max_r=3, cap=30, window=3)\nsim.tick(60)\nsim.tick(0)\nr = sim.tick(0)\neq(r['replicas'], 3)\nrep = sim.report()\neq(rep['held_ticks'], 2)" },
          { name: "after the window slides, it scales down", hidden: true, code: "sim = HPASim(target_queue=10, min_r=1, max_r=3, cap=30, window=3)\nsim.tick(60)\nsim.tick(0)\nsim.tick(0)\nr = sim.tick(0)\neq(r['replicas'], 1)\neq(sim.report()['held_ticks'], 2)" },
          { name: "single pod cannot serve: unserved ticks", hidden: true, code: "sim = HPASim(target_queue=1000, min_r=1, max_r=1, cap=30, window=2)\nsim.tick(50)\nsim.tick(0)\nrep = sim.report()\neq(rep['unserved_ticks'], 1)\neq(rep['final_queue'], 0)" },
        ],
        solution: `import math

class HPASim:
    def __init__(self, w_ms=60.0, b_ms=2.0, cap=30, target_queue=2.0,
                 min_r=1, max_r=4, window=20):
        self.w, self.b, self.cap, self.target = w_ms, b_ms, cap, target_queue
        self.lo, self.hi, self.window = min_r, max_r, window
        self.replicas = min_r
        self.queue = 0
        self.recs = []
        self.ticks = 0
        self.held = 0
        self.unserved = 0

    def tick(self, arrivals):
        self.queue += arrivals
        metric = self.queue / self.replicas
        rec = min(max(math.ceil(self.replicas * metric / self.target),
                      self.lo), self.hi)
        self.recs.append(rec)
        if rec >= self.replicas:
            self.replicas = rec
        else:
            new_r = max(self.recs[-self.window:])
            if new_r == self.replicas:
                self.held += 1
            self.replicas = new_r
        served = min(self.queue, self.replicas * self.cap)
        self.queue -= served
        if self.queue > 0:
            self.unserved += 1
        batch = min(self.cap, -(-served // self.replicas)) if served else 0
        step_ms = self.w + self.b * batch
        self.ticks += 1
        return {'replicas': self.replicas, 'served': served,
                'queue': self.queue, 'step_ms': step_ms}

    def report(self):
        return {'ticks': self.ticks, 'held_ticks': self.held,
                'unserved_ticks': self.unserved,
                'final_replicas': self.replicas,
                'final_queue': self.queue}`,
        hints: [
          { en: "Trace test 1 by hand first: queue 60, 1 replica → rec = ceil(60/10) = 6 → clamp 3; served min(60, 90); batch ceil(60/3) = 20 → step 60 + 2×20 = 100.", ru: "Сначала трассируй тест 1 руками: очередь 60, 1 реплика → rec = ceil(60/10) = 6 → кламп 3; обслужено min(60, 90); батч ceil(60/3) = 20 → шаг 60 + 2×20 = 100." },
          { en: "The recommendation is recorded BEFORE the window logic — the window reads recorded history, not the future.", ru: "Рекомендация записывается ДО логики окна — окно читает записанную историю, а не будущее." },
          { en: "-(-a // b) is an integer ceil without imports beyond math for the ratio.", ru: "-(-a // b) — целочисленный ceil без лишних импортов (math нужен только для отношения)." },
        ],
        numpy: false,
        timeoutMs: 4000,
      },
    ],
    posttest: [
      {
        id: "p1",
        q: { en: "The metric-to-target ratio is 1.05, tolerance 0.1. The HPA\u2026", ru: "Отношение метрики к цели — 1.05, tolerance 0.1. HPA\u2026" },
        options: [{ en: "keeps the replica count — the ratio is inside the band", ru: "оставляет число реплик — отношение внутри полосы" }, { en: "doubles the replicas", ru: "удваивает реплики" }, { en: "drops to minReplicas and waits", ru: "падает до minReplicas и ждёт" }],
        answer: 0,
        explain: { en: "The band ±10 % exists so the controller does not scale on noise: 1.05 is squarely inside, nothing happens this tick.", ru: "Полоса ±10 % существует, чтобы контроллер не скейлил на шуме: 1.05 прочно внутри — этим тиком ничего не происходит." },
      },
      {
        id: "p2",
        q: { en: "Why do LLM teams scale on queue depth instead of GPU utilization?", ru: "Почему LLM-команды скейлят по глубине очереди, а не по GPU-утилизации?" },
        options: [{ en: "batching keeps GPU utilization high even with an empty queue — only the queue shows real demand", ru: "батчинг держит GPU-утилизацию высокой даже при пустой очереди — настоящий спрос видна только очередь" }, { en: "GPU utilization is impossible to measure", ru: "GPU-утилизацию невозможно измерить" }, { en: "the HPA forbids GPU metrics", ru: "HPA запрещает GPU-метрики" }],
        answer: 0,
        explain: { en: "Continuous batching is doing its job exactly when the GPU is busy and the queue is empty; the queue (or KV pressure, or TTFT) is what says «more pods now».", ru: "Continuous batching делает свою работу ровно тогда, когда GPU занят, а очередь пуста; очередь (или давление KV, или TTFT) — то, что говорит «нужны ещё поды»." },
      },
      {
        id: "p3",
        q: { en: "Within the 300 s scale-down window the controller applies\u2026", ru: "Внутри окна скейл-дауна 300 с контроллер применяет\u2026" },
        options: [{ en: "the maximum recommendation seen in the window — anti-flapping", ru: "максимум рекомендаций за окно — анти-флаттер" }, { en: "the minimum, to save money fastest", ru: "минимум, чтобы быстрее сэкономить" }, { en: "the average over the window", ru: "среднее за окно" }],
        answer: 0,
        explain: { en: "Scale-up is instant because the shortage hurts now; scale-down waits for the window max so a saw-shaped metric cannot flap the fleet.", ru: "Скейл-ап мгновенный, потому что дефицит болит сейчас; скейл-даун ждёт максимум за окно, чтобы пилообразная метрика не дёргала флот." },
      },
    ],
    reward: {
      caption: { en: "You read the honest gauge, computed the ceil, and the fleet stopped flapping.", ru: "Ты читаешь честный манометр, считаешь ceil — и флот перестал дёргаться." },
    },
    footer: {
      en: "Declared controller arithmetic on course numbers (T06 step model, T08 burst envelope, T09 cold start) — not a cluster. Primary practice sources: Kubernetes HPA docs (formula, tolerance, windows), the llm-d autoscaling lesson from KubeCon NA 2026 (queue depth, KV pressure, TTFT — not GPU utilization), GKE's HPA-for-inference guides, KEDA and vLLM production stack as the modern custom-metric paths. The compose drill is a rehearsal of the HPA, not the HPA.",
      ru: "Заявленная арифметика контроллера на курсовых числах (модель шага из T06, конверт бурста из T08, холодный старт из T09) — не кластер. Первоисточники практики: доки Kubernetes HPA (формула, tolerance, окна), урок llm-d с KubeCon NA 2026 (глубина очереди, давление KV, TTFT — не GPU-утилизация), гайды GKE про HPA для инференса, KEDA и vLLM production stack как современные пути кастомных метрик. Compose-дрель — репетиция HPA, но не сам HPA.",
    },
  };
})();
