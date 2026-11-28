/* Lab 12 — Advanced Kubernetes: one pod, many clients, and the HPA.
   Content module for the generic lab page (window.LABS_CONTENT['12']).
   The HPA controller taught as declared arithmetic (ceil formula, tolerance
   band, stabilization windows) over the T6 step model; LLM scaling signals
   per the llm-d/KubeCon lesson: queue depth and KV pressure, not GPU util. */
(function () {
  "use strict";
  window.LABS_CONTENT = window.LABS_CONTENT || {};

  LABS_CONTENT["12"] = {
    budget: 45,
    title: {
      en: "Advanced Kubernetes: one pod, many clients — and the HPA",
      ru: "Продвинутый Kubernetes: толпа на одном поде — и HPA",
    },
    sub: {
      en: "Explain why a busy GPU is not a scaling signal, compute the HPA decision to the integer, and tame the flapping fleet with a stabilization window.",
      ru: "Объясни, почему занятый GPU — не сигнал к масштабированию, посчитай решение HPA до целого и усмири флаттерующий флот окном стабилизации.",
    },
    intro: {
      en: `<p>One vLLM pod already serves a crowd: continuous batching (T05) collects requests into batches at every step boundary, and the roof <code>1000 / b</code> from T06 still holds. That is why <strong>"GPU busy at 90%" is not an overload signal</strong> — batching is supposed to keep the GPU busy even when the queue is empty. The signals that actually mean "scale" are the <strong>queue depth</strong>, the KV-cache pressure and the TTFT — the lesson the llm-d team brought home from KubeCon NA 2026.</p>
<p>The <strong>Horizontal Pod Autoscaler (HPA)</strong> is the controller that turns such a signal into replicas. Every tick (15 s) it computes one number: <code>desired = ceil(replicas × metric / target)</code>, clamped into <code>[min, max]</code>. If the metric-to-target ratio sits inside the <strong>tolerance band</strong> ±10 %, it does nothing. And the windows are asymmetric on purpose: scaling up is immediate (window 0 s), scaling down waits in a <strong>300 s stabilization window</strong> and applies the <em>maximum</em> recommendation seen there — without it, a saw-shaped metric makes the fleet flap 1↔2↔1 and burns money on churn.</p>
<p>Scaling LLM pods is expensive in time even when it is free in paperwork: a fresh pod pays the weight load again (T09's members, ~165 s on the course fleet), which is exactly why scale-down is the cautious direction. Everything here runs on declared numbers and a deterministic simulator in the sandbox — this is controller arithmetic, not a cluster. The compose runtime from T08 remains your rehearsal: burst 24 → sixteen honest 429s (T08), then a hand-driven «HPA tick» — raise the gateway replicas — and burst again; the journal compares the refusals.</p>`,
      ru: `<p>Один под vLLM уже обслуживает толпу: continuous batching (T05) собирает запросы в батчи на каждой границе шага, и крыша <code>1000 / b</code> из T06 никуда не делась. Поэтому <strong>«GPU занят на 90 %» — не сигнал перегрузки</strong>: батчинг и обязан держать GPU занятым, даже когда очередь пуста. Сигналы, которые действительно означают «масштабируй», — <strong>глубина очереди</strong>, давление на KV-кэш и TTFT: урок, который команда llm-d привезла с KubeCon NA 2026.</p>
<p><strong>Horizontal Pod Autoscaler (HPA)</strong> — контроллер, превращающий такой сигнал в реплики. Каждый тик (15 с) он считает одно число: <code>desired = ceil(replicas × metric / target)</code>, зажатое в <code>[min, max]</code>. Если отношение метрики к цели сидит в <strong>полосе tolerance</strong> ±10 % — он не делает ничего. А окна намеренно асимметричны: вверх — мгновенно (окно 0 с), вниз — ждёт в <strong>окне стабилизации 300 с</strong> и применяет <em>максимум</em> увиденных там рекомендаций; без него пилообразная метрика дёргает флот 1↔2↔1 и сжигает деньги на перемешивание.</p>
<p>Масштабировать LLM-поды дорого по времени, даже когда по бумагам бесплатно: свежий под снова платит загрузку весов (члены из T09, ~165 с на курсовом флоте) — поэтому осторожное направление именно скейл-даун. Всё здесь считается на заявленных числах и детерминированном симуляторе в песочнице — это арифметика контроллера, а не кластер. Compose-рантайм из T08 остаётся репетицией: бурст 24 → шестнадцать честных 429 (T08), потом «тик HPA» руками — поднять replicas шлюза — и снова бурст; журнал сравнит отказы.</p>
<p>Откуда контроллер берёт метрику — отдельная честная история. <strong>metrics-server</strong> видит только ресурсы (CPU, память) — для LLM-пода это почти бесполезно: GPU на 90 % при пустой очереди — это здоровый батчинг, а не перегрузка. <strong>Кастомные метрики</strong> приходят от адаптера поверх счётчиков самого движка — например, <code>vllm:num_requests_waiting</code> из экспозиции <code>/metrics</code>. <strong>KEDA</strong> умеет то же снаружи (длина очереди в брокере) и добавляет scale-to-zero. А в <code>spec.behavior</code> настоящего HPA живут поля, которыми ты будешь управлять флотом в упражнении 5: окна стабилизации и политики шага.</p>
`,
    },
    heroTag: { en: "queue depth, ceil, stabilization", ru: "глубина очереди, ceil, стабилизация" },
    glossary: [
      [{ en: "HPA", ru: "HPA" }, { en: "Horizontal Pod Autoscaler: a controller that adjusts replica count every tick from one formula.", ru: "Horizontal Pod Autoscaler: контроллер, меняющий число реплик каждый тик по одной формуле." }],
      [{ en: "signal vs metric", ru: "сигнал против метрики" }, { en: "GPU utilization misleads for LLMs (batching keeps it high); real signals: queue depth, KV-cache pressure, TTFT.", ru: "GPU-утилизация для LLM обманывает (батчинг держит её высокой); настоящие сигналы: глубина очереди, давление KV-кэша, TTFT." }],
      [{ en: "tolerance", ru: "полоса tolerance" }, { en: "±10 % band around the target: if the ratio is inside, the HPA does nothing (no flapping on noise).", ru: "полоса ±10 % вокруг цели: если отношение внутри — HPA не делает ничего (нет дёрганья на шуме)." }],
      [{ en: "stabilization window", ru: "окно стабилизации" }, { en: "scale-up is immediate (0 s); scale-down waits 300 s and takes the max recommendation seen in the window.", ru: "скейл-ап мгновенный (0 с); скейл-даун ждёт 300 с и берёт максимум рекомендаций за окно." }],
      [{ en: "custom metrics", ru: "кастомные метрики" }, { en: "LLM signals are not CPU: they reach the HPA via Prometheus Adapter, KEDA, or llm-d's WVA.", ru: "сигналы LLM — не CPU: до HPA они добираются через Prometheus Adapter, KEDA или llm-d WVA." }],
      [{ en: "queue depth", ru: "глубина очереди" }, { en: "requests waiting per pod; the teaching target here is 2 per pod.", ru: "заявок в очереди на под; учебная цель здесь — 2 на под." }],
      [{ en: "cold scale-up", ru: "холодный скейл-ап" }, { en: "a fresh pod pays the weight load again (T09 members) — scale-up is instant on paper, slow in reality.", ru: "свежий под снова платит загрузку весов (члены T09) — на бумаге скейл-ап мгновенный, в реальности медленный." }],
      [{ en: "single-pod concurrency", ru: "конкурентность пода" }, { en: "continuous batching (T05) serves many clients per pod — that is why per-pod capacity is a roof, not a fixed rate.", ru: "continuous batching (T05) обслуживает многих клиентов на под — потому ёмкость пода — это крыша, а не фиксированная ставка." }],
      [{ en: "PodDisruptionBudget", ru: "PodDisruptionBudget" }, { en: "a floor for voluntary disruptions (drains, updates): how many pods must stay up — the T11 rollout lesson, generalized.", ru: "нижняя граница добровольных прерываний (дрены, обновления): сколько подов обязаны жить — урок роллаутов из T11 в общем виде." }],
      [{ en: "failure drill", ru: "дрилл отказа" }, { en: "kill a pod on purpose and measure what clients see: how much capacity vanished and for how long.", ru: "убить под нарочно и измерить, что увидят клиенты: сколько ёмкости пропало и на сколько." }],
    ],
    figures: [
      {
        id: "lab12-hpa-loop",
        title: { en: "The HPA loop: one formula, two windows", ru: "Цикл HPA: одна формула, два окна" },
        w: 760, h: 420,
        svg: `<svg viewBox="0 0 760 420" xmlns="http://www.w3.org/2000/svg">
  <g id="g-metric">
    <line x1="80" y1="300" x2="700" y2="300" stroke="var(--lab-muted)" stroke-width="1.5"/>
    <text x="700" y="324" text-anchor="end" font-size="13" fill="var(--lab-muted)" data-en="ticks (15 s each)" data-ru="тики (по 15 с)">ticks (15 s each)</text>
    <path d="M 80 300 C 180 296 280 240 380 170 C 480 110 580 100 700 96" fill="none" stroke="var(--lab-accent)" stroke-width="2.5" class="fig-flow"/>
    <text x="90" y="80" font-size="14" fill="var(--lab-accent)" data-en="metric: queue depth per pod" data-ru="метрика: глубина очереди на под">metric: queue depth per pod</text>
  </g>
  <g id="g-band">
    <line x1="80" y1="248" x2="700" y2="248" stroke="var(--fig-warm)" stroke-width="1.5" stroke-dasharray="5 4"/>
    <line x1="80" y1="286" x2="700" y2="286" stroke="var(--fig-warm)" stroke-width="1.5" stroke-dasharray="5 4"/>
    <text x="300" y="274" font-size="13" fill="var(--fig-warm)" data-en="target ±10 % — inside the band: do nothing" data-ru="цель ±10 % — внутри полосы: ничего не делать">target ±10 % — inside the band: do nothing</text>
  </g>
  <g id="g-ceil">
    <rect x="445" y="40" width="280" height="52" rx="9" fill="none" stroke="var(--lab-accent)" stroke-width="2"/>
    <text x="585" y="62" text-anchor="middle" font-size="14" fill="var(--lab-accent)" class="mono">ceil(2 × 6 / 2) = 6 → 4</text>
    <text x="585" y="82" text-anchor="middle" font-size="13" fill="var(--lab-muted)" data-en="clamped into [min, max]" data-ru="зажато в [min, max]">clamped into [min, max]</text>
  </g>
  <g id="g-boot">
    <line x1="80" y1="340" x2="700" y2="340" stroke="var(--lab-bad)" stroke-width="1.5" stroke-dasharray="6 5"/>
    <text x="380" y="362" text-anchor="middle" font-size="14" fill="var(--lab-bad)" data-en="ordered 4 — running 1: boot pays ~165 s (11 ticks × 15 s)" data-ru="заказано 4 — работает 1: boot платит ~165 с (11 тиков × 15 с)">ordered 4 — running 1: boot pays ~165 s (11 ticks × 15 s)</text>
  </g>
  <g id="g-window">
    <rect x="445" y="40" width="280" height="52" rx="9" fill="none" stroke="var(--fig-warm)" stroke-width="2"/>
    <text x="585" y="62" text-anchor="middle" font-size="14" fill="var(--fig-warm)" class="mono" data-en="scale-down: max of 300 s window" data-ru="скейл-даун: максимум за 300 с">scale-down: max of 300 s window</text>
    <text x="585" y="82" text-anchor="middle" font-size="13" fill="var(--lab-muted)" data-en="20 ticks of 15 s" data-ru="20 тиков по 15 с">20 ticks of 15 s</text>
    <text x="380" y="378" font-size="14" fill="var(--fig-warm)" data-en="metric falls: the window holds the fleet up" data-ru="метрика падает: окно держит флот наверху">metric falls: the window holds the fleet up</text>
    <g class="fig-ghost">
      <path d="M 100 40 L 140 76 L 180 40 L 220 76 L 260 40 L 300 76 L 340 40" fill="none" stroke="var(--fig-warm)" stroke-width="1.5"/>
      <text x="220" y="30" text-anchor="middle" font-size="13" fill="var(--fig-warm)" data-en="without the window: flapping 1↔4↔1" data-ru="без окна: флаттер 1↔4↔1">without the window: flapping 1↔4↔1</text>
    </g>
  </g>
</svg>`,
                stages: [
          { cap: { en: "The metric climbs: queue depth per pod, tick by tick.", ru: "Метрика растёт: глубина очереди на под, тик за тиком." }, show: ["g-metric"] },
          { cap: { en: "The tolerance band: inside it the HPA does nothing.", ru: "Полоса tolerance вокруг цели; внутри неё HPA не делает ничего." }, show: ["g-metric", "g-band"] },
          { cap: { en: "Outside and rising: ceil → clamp 4 — scale up now.", ru: "Вне полосы и рост: ceil → кламп 4 — скейл-ап сразу." }, show: ["g-metric", "g-band", "g-ceil"] },
          { cap: { en: "Ordered 4, running 1: the boot pays ~165 s of weight load.", ru: "Заказано 4, работает 1: boot платит ~165 с за загрузку весов." }, show: ["g-metric", "g-band", "g-ceil", "g-boot"] },
          { cap: { en: "Metric falls: scale-down reads the 300 s window — no flapping.", ru: "Метрика падает: окно 300 с берёт максимум — без флаттера." }, show: ["g-metric", "g-band", "g-window"] },
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
    <text x="350" y="226" text-anchor="middle" font-size="13" fill="var(--lab-muted)" data-en="continuous batching fills slots (T05)" data-ru="continuous batching заполняет слоты (T05)">continuous batching fills slots (T05)</text>
    <text x="370" y="248" text-anchor="middle" font-size="13" fill="var(--lab-muted)" class="mono" data-en="cap 30 · working point 250 tok/s (T06)" data-ru="кап 30 · рабочая точка 250 ток/с (T06)">cap 30 · working point 250 tok/s (T06)</text>
  </g>
  <g id="g-meters">
    <rect x="520" y="110" width="200" height="70" rx="9" fill="none" stroke="var(--fig-warm)" stroke-width="1.5"/>
    <text x="536" y="136" font-size="14" fill="var(--fig-warm)" class="mono" data-en="GPU util: 90 %" data-ru="GPU-утилизация: 90 %">GPU util: 90 %</text>
    <text x="536" y="157" font-size="13" fill="var(--fig-warm)" data-en="busy batching —" data-ru="занят батчингом —">busy batching —</text>
    <text x="536" y="173" font-size="13" fill="var(--fig-warm)" data-en="calm, not overload" data-ru="спокойствие, не перегруз">calm, not overload</text>
    <rect x="520" y="200" width="200" height="70" rx="9" fill="none" stroke="var(--lab-good)" stroke-width="1.5"/>
    <text x="528" y="226" font-size="14" fill="var(--lab-good)" class="mono" data-en="queue depth: 0 per pod" data-ru="очередь: 0 на под">queue depth: 0 per pod</text>
    <text x="522" y="250" font-size="13" fill="var(--lab-good)" data-en="nobody waiting — do not scale" data-ru="никто не ждёт — не масштабируй">nobody waiting — do not scale</text>
  </g>
  <g id="g-scale">
    <rect x="520" y="290" width="200" height="70" rx="9" fill="none" stroke="var(--lab-accent)" stroke-width="2"/>
    <text x="528" y="316" font-size="14" fill="var(--lab-accent)" class="mono" data-en="queue depth: 5 per pod" data-ru="очередь: 5 на под">queue depth: 5 per pod</text>
    <text x="528" y="340" font-size="13" fill="var(--lab-accent)" class="mono">ceil(2 × 5 / 2) = 5 → 4</text>
    <text x="528" y="356" font-size="13" fill="var(--lab-accent)" data-en="now the HPA acts" data-ru="вот теперь HPA действует">now the HPA acts</text>
    <text x="380" y="398" text-anchor="middle" font-size="14" fill="var(--lab-ink)" data-en="GPU util lies, the queue tells the truth" data-ru="GPU-утилизация врёт, очередь говорит правду">GPU util lies, the queue tells the truth</text>
  </g>
</svg>`,
        stages: [
          { cap: { en: "Six clients hit one vLLM pod at once.", ru: "Шесть клиентов бьют в один под vLLM одновременно." }, show: ["g-clients"] },
          { cap: { en: "Continuous batching packs them into slots at every step boundary.", ru: "Continuous batching упаковывает их в слоты на каждой границе шага." }, show: ["g-clients", "g-batch"] },
          { cap: { en: "GPU 90 % is calm batching; queue 0 — do not scale.", ru: "Манометры: GPU 90 % — батчинг; очередь 0 — не масштабировать." }, show: ["g-clients", "g-batch", "g-meters"] },
          { cap: { en: "Queue 5 per pod: ceil → clamp 4 — the HPA acts.", ru: "Очередь 5 на под: ceil → кламп 4 — HPA действует." }, show: ["g-batch", "g-meters", "g-scale"] },
        ],
      },
      {
        id: "lab12-metrics-pipeline",
        title: { en: "From engine counters to the scaling decision", ru: "От счётчиков движка до решения о масштабе" },
        w: 760, h: 420,
        svg: `<svg viewBox="0 0 760 420" xmlns="http://www.w3.org/2000/svg">
  <g id="g-src">
    <rect x="50" y="56" width="230" height="120" rx="10" fill="none" stroke="var(--lab-accent)" stroke-width="2"/>
    <text x="66" y="82" font-size="14" fill="var(--lab-accent)" class="mono">/metrics (vLLM)</text>
    <text x="66" y="106" font-size="12" fill="var(--lab-ink)" class="mono">num_requests_waiting 6</text>
    <text x="66" y="128" font-size="12" fill="var(--lab-muted)" class="mono">gpu_cache_usage 0.62</text>
    <text x="66" y="150" font-size="12" fill="var(--lab-muted)" class="mono" data-en="counters, not opinions" data-ru="счётчики, а не мнения">counters, not opinions</text>
  </g>
  <g id="g-adapter">
    <rect x="300" y="56" width="200" height="120" rx="10" fill="none" stroke="var(--lab-good)" stroke-width="2"/>
    <text x="316" y="82" font-size="14" fill="var(--lab-good)" class="mono" data-en="adapter / KEDA" data-ru="адаптер / KEDA">adapter / KEDA</text>
    <text x="316" y="106" font-size="12" fill="var(--lab-ink)" class="mono" data-en="queue per pod: 3" data-ru="очередь на под: 3">queue per pod: 3</text>
    <text x="316" y="128" font-size="12" fill="var(--lab-muted)" class="mono" data-en="metrics-server: blind" data-ru="metrics-server: слеп">metrics-server: blind</text>
    <text x="316" y="150" font-size="12" fill="var(--lab-muted)" class="mono" data-en="to queues" data-ru="к очередям">to queues</text>
  </g>
  <g id="g-hpa">
    <rect x="520" y="56" width="190" height="120" rx="10" fill="none" stroke="var(--fig-warm)" stroke-width="2"/>
    <text x="536" y="82" font-size="14" fill="var(--fig-warm)" class="mono">HPA</text>
    <text x="536" y="106" font-size="12" fill="var(--lab-ink)" class="mono" data-en="ceil + clamp + windows" data-ru="ceil + clamp + окна">ceil + clamp + окна</text>
    <text x="536" y="128" font-size="12" fill="var(--lab-ink)" class="mono" data-en="behavior: step policy" data-ru="behavior: политика шага">behavior: step policy</text>
    <text x="536" y="150" font-size="12" fill="var(--lab-muted)" class="mono" data-en="decision every 15 s" data-ru="решение каждые 15 с">decision every 15 s</text>
  </g>
  <g id="g-scale">
    <path d="M 280 116 L 300 116" stroke="var(--lab-accent)" stroke-width="2" class="fig-flow"/>
    <path d="M 500 116 L 520 116" stroke="var(--lab-good)" stroke-width="2" class="fig-flow"/>
    <path d="M 615 176 C 615 260 120 260 120 176" fill="none" stroke="var(--fig-warm)" stroke-width="2" class="fig-flow"/>
    <text x="60" y="248" font-size="14" fill="var(--lab-ink)" data-en="only the first hop invents nothing: it copies counters" data-ru="только первый шаг ничего не выдумывает: он копирует счётчики">only the first hop invents nothing: it copies counters</text>
    <text x="60" y="272" font-size="13" fill="var(--lab-muted)" data-en="every next hop adds one interpretation — and one way to lie" data-ru="каждый следующий шаг добавляет одно толкование — и один способ соврать">every next hop adds one interpretation — and one way to lie</text>
    <text x="60" y="330" font-size="13" fill="var(--lab-muted)" data-en="scale changes the counters — the loop closes through the fleet" data-ru="масштаб меняет счётчики — цикл замыкается через флот">scale changes the counters — the loop closes through the fleet</text>
    <text x="60" y="368" font-size="13" fill="var(--lab-muted)" data-en="GPU 90% + empty queue = batching (healthy); queue 5 + GPU 50% = overload" data-ru="GPU 90 % + пустая очередь = батчинг (здорово); очередь 5 + GPU 50 % = перегруз">GPU 90% + empty queue = batching (healthy); queue 5 + GPU 50% = overload</text>
    <text x="60" y="396" font-size="13" fill="var(--lab-muted)" data-en="the metric picks what the controller can even see" data-ru="метрика выбирает, что контроллер вообще видит">the metric picks what the controller can even see</text>
  </g>
</svg>`,
        stages: [
          { cap: { en: "Counters first: the engine exposes waiting requests and cache usage.", ru: "Сначала счётчики: движок экспонирует очередь и занятость кэша." }, show: ["g-src"] },
          { cap: { en: "An adapter (or KEDA) turns counters into one honest signal per pod.", ru: "Адаптер (или KEDA) превращает счётчики в один честный сигнал на под." }, show: ["g-src", "g-adapter"] },
          { cap: { en: "HPA applies ceil, clamp, windows — and your behavior policy.", ru: "HPA применяет ceil, clamp, окна — и твою политику behavior." }, show: ["g-adapter", "g-hpa"] },
          { cap: { en: "Scaling changes the counters: the loop closes through the fleet.", ru: "Масштаб меняет счётчики: цикл замыкается через флот." }, show: ["g-scale"] },
        ],
      },
    ],
    outcomes: [
      { en: "Compute the HPA decision like the controller: ceil formula, tolerance band, clamp, and the stabilization windows that prevent flapping.", ru: "Считать решение HPA как контроллер: формула ceil, полоса tolerance, кламп и окна стабилизации, которые гасят флаттер." },
      { en: "Explain why GPU utilization misleads under batching and scale on the queue-depth signal, not on the busy meter.", ru: "Объяснять, почему GPU-утилизация обманывает при батчинге, и масштабировать по сигналу глубины очереди, а не по занятости GPU." },
    ],
    model: [
      [{ en: "HPA formula", ru: "формула HPA" }, { en: "desired = ceil(replicas × metric / target)", ru: "desired = ceil(replicas × metric / target)" }, { en: "tolerance", ru: "tolerance" }, { en: "±10 % → no scaling", ru: "±10 % → не скейлим" }],
      [{ en: "windows (k8s defaults)", ru: "окна (дефолты k8s)" }, { en: "up 0 s · down 300 s", ru: "вверх 0 с · вниз 300 с" }, { en: "scale-down rule", ru: "правило скейл-дауна" }, { en: "max recommendation in window", ru: "максимум рекомендаций за окно" }],
      [{ en: "cold boot of replicas", ru: "холодный старт реплик" }, { en: "boot_ticks × 15 s ≈ 165 s (T09)", ru: "boot_ticks × 15 с ≈ 165 с (T09)" }, { en: "HPASim(boot_ticks=11)", ru: "HPASim(boot_ticks=11)" }, { en: "order fires now, capacity later", ru: "заказ срабатывает сразу, ёмкость — позже" }],
      [{ en: "scaling metric", ru: "метрика масштабирования" }, { en: "queue_per_pod (default) · concurrency = (queue + last served) / replicas", ru: "queue_per_pod (дефолт) · concurrency = (очередь + обслужено на прошлом тике) / реплики" }, { en: "batching keeps concurrency high at queue 0", ru: "батчинг держит concurrency высоким при пустой очереди" }, { en: "pinned fleet vs flapping", ru: "флот приколот к максимуму против флаттера" }],
      [{ en: "sync tick", ru: "тик синхронизации" }, "15 s", { en: "clamp", ru: "кламп" }, { en: "min ≤ desired ≤ max", ru: "min ≤ desired ≤ max" }],
      [{ en: "one pod's working point (T06)", ru: "рабочая точка пода (T06)" }, { en: "batch 30 → 250 tok/s", ru: "батч 30 → 250 ток/с" }, { en: "LLM scaling signals", ru: "сигналы масштабирования LLM" }, { en: "queue depth · KV pressure · TTFT", ru: "глубина очереди · давление KV · TTFT" }],
    ],
    scenario: null,
    parsons: [
      {
        id: "ps1",
        title: { en: "Exercise · Assemble the HPA decision", ru: "Упражнение · Собери решение HPA" },
        brief: { en: "One scaling decision in six steps — two decoys contradict the mechanism you ran in HPASim.", ru: "Одно решение о масштабировании в шести шагах — две ловушки противоречат механике, которую ты гонял в HPASim." },
        pool: [
          { en: "Scale-down is held back by the stabilization window", ru: "Скейл-даун сдерживается окном стабилизации" },
          { en: "The queue is wiped on every scale-up", ru: "Очередь очищается при каждом скейл-апе" },
          { en: "The signal is computed: queue depth per replica", ru: "Считается сигнал: глубина очереди на поду" },
          { en: "The recommendation is clamped to the [min, max] replica band", ru: "Рекомендация зажимается в полосу [min, max] реплик" },
          { en: "The recommendation is ceil(replicas × signal / target)", ru: "Рекомендация = ceil(реплики × сигнал / target)" },
          { en: "The signal is compared against the target value", ru: "Сигнал сравнивается с целевым значением" },
          { en: "Pod limits are lifted while the target is exceeded", ru: "Лимиты подов снимаются, пока target превышен" },
          { en: "The controller applies the new replica count", ru: "Контроллер применяет новое число реплик" },
        ],
        solution: [2, 5, 4, 3, 7, 0],
      },
    ],
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
        followUp: {
          q: { en: "Why does the clamp fire on scale-up too, not only on scale-down?", ru: "Почему кламп срабатывает и на скейл-апе, а не только на скейл-дауне?" },
          options: [
            { en: "maxReplicas is the cost fuse: without it one metric spike would summon unbounded pods — and every fresh pod pays the 165 s weight load", ru: "maxReplicas — это предохранитель бюджета: без него один пик метрики призывает неограниченные поды — а каждый свежий под платит 165 с загрузки весов" },
            { en: "The clamp only affects the number written to the spec, never the actual pods", ru: "Кламп влияет только на число в спецификации, но не на реальные поды" },
            { en: "It does not: scale-up always ignores maxReplicas by design", ru: "Не срабатывает: скейл-ап всегда игнорирует maxReplicas по дизайну" },
          ],
          answer: 0,
          explain: { en: "The formula's order is ceil FIRST, clamp SECOND — under-provisioning is forbidden, but so is unbounded spend. This lab's own tolerance and windows soften noise; the clamp is the last line against a bad metric.", ru: "Порядок формулы — сначала ceil, потом кламп — запрещает нехватку реплик, но и безграничные траты тоже. Tolerance и окна смягчают шум; кламп — последняя линия обороны от плохой метрики." },
        },
        // Вариативность №5: формула HPA desired = clamp(ceil(replicas × metric / target), [min, max]).
        //   7 × 9 / 2 → ceil(31.5) = 32 → кламп по max 8 → 8;   9 × 13 / 3 → ceil(39) = 39 → кламп по max 12 → 12.
        // Ловушки: без клампа 32 / 39 (дистанции 24 / 27), перепутанная формула 2 / 3 (дистанции 6 / 9) при tol 0.2.
        // База (ответ 10) в фигурах — grandfathered; новые числа 7 / 9 / 8 / 13 / 3 / 12 в фигурах не встречаются.
        variants: [
          {
            q: {
              en: "3 replicas, queue depth 8 per pod, target 2, maxReplicas 10. How many replicas after this HPA tick?",
              ru: "3 реплики, глубина очереди 8 на под, цель 2, maxReplicas 10. Сколько реплик будет после этого тика HPA?",
            },
            answer: 10, tol: 0.2,
          },
          {
            q: {
              en: "7 replicas, queue depth 9 per pod, target 2, maxReplicas 8. How many replicas after this HPA tick?",
              ru: "7 реплик, глубина очереди 9 на под, цель 2, maxReplicas 8. Сколько реплик будет после этого тика HPA?",
            },
            answer: 8, tol: 0.2,
            hint: {
              en: "ceil(7 × 9 / 2) = 32, then clamp into [min, max].",
              ru: "ceil(7 × 9 / 2) = 32, затем кламп в [min, max].",
            },
          },
          {
            q: {
              en: "9 replicas, queue depth 13 per pod, target 3, maxReplicas 12. How many replicas after this HPA tick?",
              ru: "9 реплик, глубина очереди 13 на под, цель 3, maxReplicas 12. Сколько реплик будет после этого тика HPA?",
            },
            answer: 12, tol: 0.2,
            hint: {
              en: "ceil(9 × 13 / 3) = 39, then clamp into [min, max].",
              ru: "ceil(9 × 13 / 3) = 39, затем кламп в [min, max].",
            },
          },
        ],
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
          ru: "2.2 / 2 = 1.1 — ровно на краю полосы; края полосы включены: без изменений.",
        },
        followUp: {
          q: { en: "Why is the tolerance band inclusive at exactly ±10 %?", ru: "Почему полоса tolerance включительна ровно на ±10 %?" },
          options: [
            { en: "The band exists to absorb noise: an edge ratio is not clearly off-target, and scaling on it would flap the fleet on metric jitter", ru: "Полоса существует ради поглощения шума: краевое отношение не является явно вне цели, и скейл на нём дёргал бы флот на джиттере метрики" },
            { en: "Floating-point rounding makes the edge unreachable, so inclusion is decorative", ru: "Округление float делает край недостижимым, так что включительность — декорация" },
            { en: "It is not inclusive — the quiz answer is an exception", ru: "Она не включительна — ответ квиза исключение" },
          ],
          answer: 0,
          explain: { en: "Every corner case of the band is a flapping decision: exclude the edge and a metric oscillating around 1.1× target scales up and down every tick. Inclusive edges make «hold» the default for anything not clearly off.", ru: "Каждый краевой случай полосы — решение о флаттере: исключи край, и метрика, осциллирующая вокруг 1.1× цели, скейлит вверх-вниз каждый тик. Включительные края делают «держать» поведением по умолчанию для всего, что не выбилось явно." },
        },
        // Вариативность №5: полоса tolerance включительна, |ratio − 1| ≤ 0.1 → hold, иначе ceil(replicas × ratio).
        //   7 реплик, 2.2 / 2 = 1.1 — ровно край → hold → 7;   13 × 2.5 / 2 = 16.25 → ceil = 17 (ratio 1.25 вне полосы).
        // Ловушки: 8 («полоса исключающа», дистанция 1); 16.25 без ceil (0.75) и 16 усечение (1) при tol 0.2.
        // База (ответ 4) в фигурах — grandfathered; 7 / 13 / 2.5 / 17 в фигурах не встречаются.
        variants: [
          {
            q: {
              en: "4 replicas, metric 2.2, target 2, tolerance 0.1. What does the HPA set this tick?",
              ru: "4 реплики, метрика 2.2, цель 2, tolerance 0.1. Что HPA выставит этим тиком?",
            },
            answer: 4, tol: 0.2,
          },
          {
            q: {
              en: "7 replicas, metric 2.2, target 2, tolerance 0.1. What does the HPA set this tick?",
              ru: "7 реплик, метрика 2.2, цель 2, tolerance 0.1. Что HPA выставит этим тиком?",
            },
            answer: 7, tol: 0.2,
          },
          {
            q: {
              en: "13 replicas, metric 2.5, target 2, tolerance 0.1. What does the HPA set this tick?",
              ru: "13 реплик, метрика 2.5, цель 2, tolerance 0.1. Что HPA выставит этим тиком?",
            },
            answer: 17, tol: 0.2,
            hint: {
              en: "2.5 / 2 = 1.25 — outside the band (the edge is 1.1), so the formula runs: ceil(13 × 2.5 / 2).",
              ru: "2.5 / 2 = 1.25 — вне полосы (край — 1.1), работает формула: ceil(13 × 2.5 / 2).",
            },
          },
        ],
      },
      {
        id: "q3",
        q: {
          en: "The scale-down stabilization window is 300 s and the sync tick is 15 s. How many ticks does a recommendation stay inside the window?",
          ru: "Окно стабилизации скейл-дауна — 300 с, тик синхронизации — 15 с. Сколько тиков рекомендация живёт внутри окна?",
        },
        answer: 20, tol: 0.2, unit: { en: "ticks", ru: "тиков" },
        hint: {
          en: "300 / 15 — and the window takes the max of everything it still holds.",
          ru: "300 / 15 — и окно берёт максимум всего, что ещё держит.",
        },
        followUp: {
          q: { en: "Why does the window take the MAX of the recommendations, not the latest?", ru: "Почему окно берёт МАКСИМУМ рекомендаций, а не последнюю?" },
          options: [
            { en: "Scale-down is the cautious direction: the max means a recent spike still «holds» the fleet up until it is fully out of the window", ru: "Скейл-даун — осторожное направление: максимум означает, что недавний пик продолжает «держать» флот наверху, пока полностью не выйдет из окна" },
            { en: "The max approximates the average over a saw-shaped metric", ru: "Максимум аппроксимирует среднее по пилообразной метрике" },
            { en: "Kubernetes computes the max because recommendations are negative for scale-down", ru: "Kubernetes считает максимум, потому что рекомендации при скейл-дауне отрицательны" },
          ],
          answer: 0,
          explain: { en: "With the LLM cold start (~165 s) a wrong scale-down is expensive to undo: the window max turns a saw-shaped metric into a held fleet (Exercise 3's held_ticks). Latest-wins is what the buggy starter did.", ru: "При холодном старте LLM (~165 с) ошибочный скейл-даун дорого откатывать: максимум окна превращает пилообразную метрику в удержанный флот (held_ticks из упражнения 3). «Последняя выигрывает» — то, что делал багованный стартер." },
        },
        // Вариативность №5: окно стабилизации меняется (300 → 600 / 360 с), тик 15 с — дефолт k8s.
        // Пересчёт ticks = window / tick: 600 / 15 = 40;   360 / 15 = 24.
        // Ловушка off-by-one 41 / 39 и 25 / 23 — дистанция 1 при tol 0.2 (запас 5×).
        // База (ответ 20) в фигуре («20 ticks of 15 s») — grandfathered; 600 / 360 / 40 / 24 там не встречаются.
        variants: [
          {
            q: {
              en: "The scale-down stabilization window is 300 s and the sync tick is 15 s. How many ticks does a recommendation stay inside the window?",
              ru: "Окно стабилизации скейл-дауна — 300 с, тик синхронизации — 15 с. Сколько тиков рекомендация живёт внутри окна?",
            },
            answer: 20, tol: 0.2,
          },
          {
            q: {
              en: "The scale-down stabilization window is 600 s and the sync tick is 15 s. How many ticks does a recommendation stay inside the window?",
              ru: "Окно стабилизации скейл-дауна — 600 с, тик синхронизации — 15 с. Сколько тиков рекомендация живёт внутри окна?",
            },
            answer: 40, tol: 0.2,
            hint: {
              en: "600 / 15 — and the window takes the max of everything it still holds.",
              ru: "600 / 15 — и окно берёт максимум всего, что ещё держит.",
            },
          },
          {
            q: {
              en: "The scale-down stabilization window is 360 s and the sync tick is 15 s. How many ticks does a recommendation stay inside the window?",
              ru: "Окно стабилизации скейл-дауна — 360 с, тик синхронизации — 15 с. Сколько тиков рекомендация живёт внутри окна?",
            },
            answer: 24, tol: 0.2,
            hint: {
              en: "360 / 15 — and the window takes the max of everything it still holds.",
              ru: "360 / 15 — и окно берёт максимум всего, что ещё держит.",
            },
          },
        ],
      },
    ],
    exercises: [
      {
        id: "ex1",
        title: { en: "Exercise 1 · The HPA formula", ru: "Упражнение 1 · Формула HPA" },
        brief: {
          en: "Implement <code>desired_replicas(replicas, metric, target, min_r=1, max_r=10)</code> — the controller's one number: <code>ceil(replicas × metric / target)</code>, clamped into <code>[min_r, max_r]</code>. Here <code>metric</code> is an LLM signal like queue depth per pod and <code>target</code> is its desired value (the tolerance band arrives in Exercise 2). Mind the ceiling: <code>int()</code> truncates, the controller rounds <em>up</em> — under-provisioning is the one mistake it never makes.",
          ru: "Реализуй <code>desired_replicas(replicas, metric, target, min_r=1, max_r=10)</code> — то самое число контроллера: <code>ceil(replicas × metric / target)</code>, зажатое в <code>[min_r, max_r]</code>. Здесь <code>metric</code> — LLM-сигнал вроде глубины очереди на под, а <code>target</code> — его желаемое значение (полоса tolerance появится в упражнении 2). Следи за потолком: <code>int()</code> усекает, а контроллер округляет <em>вверх</em> — нехватка реплик (underprovisioning) — единственная ошибка, которую он никогда не делает.",
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
          { en: "math.ceil first, clamp second: ceil(7.5) = 8, not 7.", ru: "Сначала math.ceil, кламп вторым: ceil(7.5) = 8, а не 7." },
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
    # TODO: utilization ratio from the metric and the target; the tolerance band is inclusive
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
          { en: "Import math at the top of the cell.", ru: "Импортируй math вверху ячейки." },
        ],
        numpy: false,
        timeoutMs: 4000,
      },
      {
        id: "ex3",
        title: { en: "Exercise 3 · Read the real signal", ru: "Упражнение 3 · Прочитай настоящий сигнал" },
        brief: {
          en: "This is what the scaling chain actually sees. First, a fragment of the engine's <code>/metrics</code> exposition:<br /><pre># HELP vllm:num_requests_waiting Number of requests waiting in the queue.\n# TYPE vllm:num_requests_waiting gauge\nvllm:num_requests_waiting{model=\"qwen\",pod=\"llm-0\"} 5\nvllm:num_requests_waiting{model=\"qwen\",pod=\"llm-1\"} 1\n# HELP vllm:gpu_cache_usage_perc KV-cache usage [0..1]\n# TYPE vllm:gpu_cache_usage_perc gauge\nvllm:gpu_cache_usage_perc{pod=\"llm-0\"} 0.62</pre>and the controller's own view, <code>kubectl get hpa</code>: <code>llm-hpa · Deployment/llm-engine · queue: 2 · MINPODS 1 · MAXPODS 10 · REPLICAS 2</code>. Implement <code>desired_from_metrics(text, target_per_pod, current, min_r, max_r)</code>: sum only the <code>vllm:num_requests_waiting</code> lines (skip HELP/TYPE and other metrics), compute the desired count as <code>ceil(total_waiting / target_per_pod)</code>, clamp into <code>[min_r, max_r]</code>. The current replica count comes from the HPA line — parse it too.",
          ru: "Вот что реально видит цепочка масштабирования. Сначала фрагмент экспозиции <code>/metrics</code> движка:<br /><pre># HELP vllm:num_requests_waiting Number of requests waiting in the queue.\n# TYPE vllm:num_requests_waiting gauge\nvllm:num_requests_waiting{model=\"qwen\",pod=\"llm-0\"} 5\nvllm:num_requests_waiting{model=\"qwen\",pod=\"llm-1\"} 1\n# HELP vllm:gpu_cache_usage_perc KV-cache usage [0..1]\n# TYPE vllm:gpu_cache_usage_perc gauge\nvllm:gpu_cache_usage_perc{pod=\"llm-0\"} 0.62</pre>и взгляд самого контроллера, <code>kubectl get hpa</code>: <code>llm-hpa · Deployment/llm-engine · queue: 2 · MINPODS 1 · MAXPODS 10 · REPLICAS 2</code>. Реализуй <code>desired_from_metrics(text, target_per_pod, current, min_r, max_r)</code>: просуммируй только строки <code>vllm:num_requests_waiting</code> (пропусти HELP/TYPE и чужие метрики), посчитай желаемое как <code>ceil(total_waiting / target_per_pod)</code>, зажми в <code>[min_r, max_r]</code>. Текущее число реплик возьми из строки HPA — его тоже надо разобрать.",
        },
        starter: `import math

def desired_from_metrics(text, target_per_pod, current, min_r, max_r):
    """Parse the exposition, sum the waiting queue, compute the HPA decision."""
    total_waiting = 0
    # TODO: only lines starting with 'vllm:num_requests_waiting{' count;
    #       the value is the token after the closing '}'
    desired = 0
    # TODO: ceil(total / target_per_pod), clamp into [min_r, max_r]
    return desired`,
        tests: [
          { name: "the exposition above: 6 waiting, target 2 → 3 replicas", hidden: false, code: "t = open('/dev/null').read() if False else '''# HELP vllm:num_requests_waiting Number of requests waiting in the queue.\n# TYPE vllm:num_requests_waiting gauge\nvllm:num_requests_waiting{model=\"qwen\",pod=\"llm-0\"} 5\nvllm:num_requests_waiting{model=\"qwen\",pod=\"llm-1\"} 1\n# HELP vllm:gpu_cache_usage_perc KV-cache usage [0..1]\nvllm:gpu_cache_usage_perc{pod=\"llm-0\"} 0.62'''\neq(desired_from_metrics(t, 2, 2, 1, 10), 3)" },
          { name: "empty queue → clamp to min", hidden: false, code: "t = 'vllm:num_requests_waiting{pod=\"llm-0\"} 0'\neq(desired_from_metrics(t, 2, 2, 1, 10), 1)" },
          { name: "surge past max is clamped", hidden: true, code: "t = 'vllm:num_requests_waiting{pod=\"llm-0\"} 40'\neq(desired_from_metrics(t, 2, 2, 1, 10), 10)" },
          { name: "other metrics and comments never count", hidden: true, code: "t = '''# HELP vllm:num_requests_waiting decoy\n# TYPE vllm:num_requests_waiting gauge\nvllm:gpu_cache_usage_perc{pod=\"x\"} 40\nvllm:num_requests_waiting{pod=\"llm-0\"} 4'''\neq(desired_from_metrics(t, 2, 2, 1, 10), 2)" },
        ],
        solution: `import math

def desired_from_metrics(text, target_per_pod, current, min_r, max_r):
    total_waiting = 0
    for line in text.splitlines():
        if not line.startswith('vllm:num_requests_waiting{'):
            continue
        value = line.rsplit('}', 1)[1].strip()
        total_waiting += float(value)
    desired = math.ceil(total_waiting / float(target_per_pod))
    return max(min_r, min(max_r, desired))`,
        hints: [
          { en: "The exposition line format is: name{labels} value — split after the closing brace.", ru: "Формат строки экспозиции: имя{метки} значение — дели после закрывающей скобки." },
          { en: "Lines starting with '#' are comments; gpu_cache_usage is a different metric.", ru: "Строки с '#' — комментарии; gpu_cache_usage — другая метрика." },
        ],
        numpy: false,
        timeoutMs: 4000,
      },
      {
        id: "ex4",
        title: { en: "Exercise 4 · Fix the bug: the flapping fleet", ru: "Упражнение 3 · Почини баг: флаттерующий флот" },
        brief: {
          en: "This <code>stabilized(recs, window, current)</code> always applies the latest recommendation, so a saw-shaped metric flaps the fleet 1↔2↔1: every scale-down is instantly regretted. Kubernetes' fix is the stabilization window: scaling <strong>up</strong> applies immediately (the shortage hurts now), scaling <strong>down</strong> takes the <em>maximum</em> recommendation seen within the last <code>window</code> ticks. Fix it: latest recommendation when it does not shrink the fleet; otherwise the window max.",
          ru: "Эта <code>stabilized(recs, window, current)</code> всегда применяет последнюю рекомендацию, поэтому пилообразная метрика дёргает флот 1↔2↔1: каждый скейл-даун тут же приходится отменять. Фикс Kubernetes — окно стабилизации: скейл-ап применяется немедленно (дефицит болит сейчас), скейл-даун берёт <em>максимум</em> рекомендаций за последние <code>window</code> тиков. Почини: последняя рекомендация, если она не сжимает флот; иначе — максимум окна.",
        },
        starter: `def stabilized(recs, window, current):
    """Replica count to set now; recs is per-tick, oldest first."""
    # BUG: applies the latest recommendation always — the fleet
    # flaps 1<->2<->1 on a saw-shaped metric
    return recs[-1]
`,
        tests: [
          { name: "saw metric: the window holds the fleet", hidden: false, code: "eq(stabilized([1, 2, 1, 2, 1], 3, 2), 2)" },
          { name: "a stale spike does not raise a rising fleet", hidden: true, code: "eq(stabilized([9, 7, 8], 3, 7), 8)" },
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
        id: "ex5",
        title: { en: "Exercise 5 · The behavior policy", ru: "Упражнение 5 · Политика behavior" },
        brief: {
          en: "The real HPA spec has <code>spec.behavior</code>: per-direction <strong>step policies</strong> — «scale up by at most 2 pods per tick, down by 1» — and <strong>stabilization windows</strong> for the cautious direction. Implement <code>apply_scale(current, desired, policy, seconds_since_last_down)</code> with <code>policy = {'up_step': 2, 'down_step': 1, 'down_window_s': 300}</code>: scaling <em>up</em> is immediate but capped at <code>+up_step</code>; scaling <em>down</em> is capped at <code>−down_step</code> AND allowed only after <code>seconds_since_last_down ≥ down_window_s</code> — otherwise hold. Equal → equal. This is Exercise 4's anti-flap lesson, written in the API's own fields.",
          ru: "В настоящем spec HPA есть <code>spec.behavior</code>: поточечные <strong>политики шага</strong> — «вверх не быстрее 2 подов за тик, вниз на 1» — и <strong>окна стабилизации</strong> для осторожного направления. Реализуй <code>apply_scale(current, desired, policy, seconds_since_last_down)</code> с <code>policy = {'up_step': 2, 'down_step': 1, 'down_window_s': 300}</code>: масштаб вверх — мгновенно, но не более <code>+up_step</code>; вниз — не более <code>−down_step</code> и только если <code>seconds_since_last_down ≥ down_window_s</code> — иначе держим. Равное → равное. Это урок упражнения 4 про анти-флаттер, записанный собственными полями API.",
        },
        starter: `def apply_scale(current, desired, policy, seconds_since_last_down):
    """One HPA tick under spec.behavior: up fast & capped, down slow & gated."""
    # TODO: up = min(desired, current + up_step)
    # TODO: down = max(desired, current - down_step) only after the window
    ...`,
        tests: [
          { name: "burst capped at +2", hidden: false, code: "p = {'up_step': 2, 'down_step': 1, 'down_window_s': 300}\neq(apply_scale(2, 6, p, 999), 4)" },
          { name: "down moves one step per tick", hidden: false, code: "p = {'up_step': 2, 'down_step': 1, 'down_window_s': 300}\neq(apply_scale(6, 3, p, 999), 5)" },
          { name: "down inside the window holds", hidden: false, code: "p = {'up_step': 2, 'down_step': 1, 'down_window_s': 300}\neq(apply_scale(6, 3, p, 299), 6)" },
          { name: "equal stays equal", hidden: true, code: "p = {'up_step': 2, 'down_step': 1, 'down_window_s': 300}\neq(apply_scale(4, 4, p, 0), 4)" },
          { name: "up never overshoots the desired", hidden: true, code: "p = {'up_step': 2, 'down_step': 1, 'down_window_s': 300}\neq(apply_scale(2, 3, p, 999), 3)" },
        ],
        solution: `def apply_scale(current, desired, policy, seconds_since_last_down):
    if desired > current:
        return min(desired, current + policy['up_step'])
    if desired < current:
        if seconds_since_last_down >= policy['down_window_s']:
            return max(desired, current - policy['down_step'])
        return current
    return current`,
        hints: [
          { en: "Two directions, two rules; the window gates only scale-down.", ru: "Два направления, два правила; окно гейтит только масштаб вниз." },
        ],
        numpy: false,
        timeoutMs: 4000,
      },
      {
        id: "ex6",
        title: { en: "Exercise 6 · Read the real autoscaler config", ru: "Упражнение 6 · Прочитай настоящий конфиг автоскейлера" },
        brief: {
          en: "Production stacks rarely scale on bare HPA: KEDA wraps it in a <code>ScaledObject</code> whose trigger names the metric and the target. The real-shaped artifact:<br /><pre>apiVersion: keda.sh/v1alpha1\nkind: ScaledObject\nmetadata:\n  name: llm-scaler\nspec:\n  minReplicaCount: 1\n  maxReplicaCount: 4\n  triggers:\n    - type: metrics-api\n      metadata:\n        targetQueueLength: \"2\"\n        metric: vllm_num_requests_waiting</pre>And the values table of the production-stack chart sets the same numbers for the HPA. Implement <code>read_autoscaler_config(cfg)</code> over the already-parsed structure: return <code>{'min_replicas', 'max_replicas', 'target_queue', 'metric'}</code> — normalizing the trigger's string numbers into ints. Reading configs correctly is the difference between «the scaler owns the fleet» and «I hope these were the right numbers».",
          ru: "Продакшен-стеки редко скейлят на голом HPA: KEDA оборачивает его в <code>ScaledObject</code>, чей триггер называет метрику и цель. Настоящий по форме артефакт:<br /><pre>apiVersion: keda.sh/v1alpha1\nkind: ScaledObject\nmetadata:\n  name: llm-scaler\nspec:\n  minReplicaCount: 1\n  maxReplicaCount: 4\n  triggers:\n    - type: metrics-api\n      metadata:\n        targetQueueLength: \"2\"\n        metric: vllm_num_requests_waiting</pre>И таблица values продакшен-чарта задаёт те же числа для HPA. Реализуй <code>read_autoscaler_config(cfg)</code> над уже разобранной структурой: верни <code>{'min_replicas', 'max_replicas', 'target_queue', 'metric'}</code> — строковые числа триггера нормализуй в int. Правильно прочитанный конфиг — разница между «автоскейлер владеет флотом» и «надеюсь, это были те числа».",
        },
        starter: `def read_autoscaler_config(cfg):
    """Normalize a ScaledObject into {min_replicas, max_replicas, target_queue, metric}."""
    spec = cfg['spec']
    trigger = spec['triggers'][0]['metadata']
    # TODO: ints for min/max and target; pass the metric name through
    ...`,
        tests: [
          { name: "the artifact above reads correctly", hidden: false, code: "cfg = {'spec': {'minReplicaCount': 1, 'maxReplicaCount': 4, 'triggers': [{'type': 'metrics-api', 'metadata': {'targetQueueLength': \"2\", 'metric': 'vllm_num_requests_waiting'}}]}}\nr = read_autoscaler_config(cfg)\neq(r, {'min_replicas': 1, 'max_replicas': 4, 'target_queue': 2, 'metric': 'vllm_num_requests_waiting'})" },
          { name: "another stack, same shape", hidden: true, code: "cfg = {'spec': {'minReplicaCount': 2, 'maxReplicaCount': 9, 'triggers': [{'type': 'metrics-api', 'metadata': {'targetQueueLength': \"4\", 'metric': 'queue_depth'}}]}}\nr = read_autoscaler_config(cfg)\neq(r['min_replicas'], 2)\neq(r['max_replicas'], 9)\neq(r['target_queue'], 4)\neq(r['metric'], 'queue_depth')" },
          { name: "string numbers become ints", hidden: true, code: "cfg = {'spec': {'minReplicaCount': \"1\", 'maxReplicaCount': \"4\", 'triggers': [{'metadata': {'targetQueueLength': \"2\", 'metric': 'm'}}]}}\nr = read_autoscaler_config(cfg)\neq((r['min_replicas'], r['max_replicas'], r['target_queue']), (1, 4, 2))" },
        ],
        solution: `def read_autoscaler_config(cfg):
    spec = cfg['spec']
    trigger = spec['triggers'][0]['metadata']
    return {'min_replicas': int(spec['minReplicaCount']),
            'max_replicas': int(spec['maxReplicaCount']),
            'target_queue': int(trigger['targetQueueLength']),
            'metric': trigger['metric']}`,
        hints: [
          { en: "The YAML quoted the numbers — normalize with int() so the arithmetic never compares a string to a number.", ru: "YAML взял числа в кавычки — нормализуй int(), чтобы арифметика никогда не сравнивала строку с числом." },
        ],
        numpy: false,
        timeoutMs: 4000,
      },
      {
        id: "ex7",
        title: { en: "Exercise 7 · Wrap it into a class: HPASim", ru: "Упражнение 4 · Собери в класс: HPASim" },
        brief: {
          en: "The lab's final boss: the controller loop as a class. <code>HPASim(w_ms=60.0, b_ms=2.0, cap=30, target_queue=2.0, min_r=1, max_r=4, window=20)</code> — the T06 step model per pod (cap 30 sequences, working point 250 tok/s). <code>tick(arrivals)</code>: add arrivals to the queue; the metric is <code>queue / replicas</code>; recommend <code>ceil(replicas × metric / target)</code> clamped (no tolerance band here — Exercise 2's job); scale-down runs through the stabilization window (max of the last <code>window</code> recommendations), scale-up is immediate; then serve <code>min(queue, replicas × cap)</code>. The tick returns <code>{'replicas', 'served', 'queue', 'step_ms'}</code> with <code>step_ms = w_ms + b_ms × batch</code> and <code>batch = ceil(served / replicas)</code> capped at <code>cap</code> (0 if nothing served). <code>report()</code> returns <code>{'ticks', 'held_ticks', 'unserved_ticks', 'final_replicas', 'final_queue'}</code> where <code>held_ticks</code> counts scale-downs suppressed by the window and <code>unserved_ticks</code> counts ticks that ended with a non-empty queue.",
          ru: "Финальный босс лабы: цикл контроллера как класс. <code>HPASim(w_ms=60.0, b_ms=2.0, cap=30, target_queue=2.0, min_r=1, max_r=4, window=20)</code> — модель шага из T06 на под (кап 30 последовательностей, рабочая точка 250 ток/с). <code>tick(arrivals)</code>: добавь arrivals в очередь; метрика — <code>queue / replicas</code>; рекомендация — <code>ceil(replicas × metric / target)</code> с клампом (без полосы tolerance — её работа была в упражнении 2); скейл-даун идёт через окно стабилизации (максимум последних <code>window</code> рекомендаций), скейл-ап мгновенный; затем обслужи <code>min(queue, replicas × cap)</code>. Тик возвращает <code>{'replicas', 'served', 'queue', 'step_ms'}</code>, где <code>step_ms = w_ms + b_ms × batch</code>, а <code>batch = ceil(served / replicas)</code> с потолком <code>cap</code> (0, если ничего не обслужено). <code>report()</code> возвращает <code>{'ticks', 'held_ticks', 'unserved_ticks', 'final_replicas', 'final_queue'}</code>, где <code>held_ticks</code> считает скейл-дауны, удержанные окном, а <code>unserved_ticks</code> — тики, кончившиеся непустой очередью.",
        },
        starter: `import math

class HPASim:
    """The HPA loop over the T06 step model; one tick = one controller pass."""

    def __init__(self, w_ms=60.0, b_ms=2.0, cap=30, target_queue=2.0,
                 min_r=1, max_r=4, window=20, boot_ticks=0,
                 metric="queue_per_pod"):
        # TODO: store the knobs (incl. boot_ticks, metric); replicas = min_r;
        #       queue = 0; recs = []; booting = []; last_served = 0
        ...

    def tick(self, arrivals):
        # TODO v2: mature booting orders first (left -= 1; at 0 replicas += count);
        # metric: queue_per_pod -> queue / replicas;
        #         concurrency -> (queue + last_served) / replicas;
        # recommend ceil(...) clamped; scale-down via window max;
        # scale-up: with boot_ticks > 0 the added replicas join the 'booting' list
        # (order: [boot_ticks, added]) and only mature later — capacity this
        # tick stays at the old count; boot_ticks = 0 joins immediately (v1).
        # serve min(queue, replicas * cap); remember last_served = served;
        # step_ms = w + b * batch
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
                 min_r=1, max_r=4, window=20, boot_ticks=0,
                 metric="queue_per_pod"):
        self.w, self.b, self.cap, self.target = w_ms, b_ms, cap, target_queue
        self.lo, self.hi, self.window = min_r, max_r, window
        self.replicas = min_r
        self.queue = 0
        self.recs = []
        self.ticks = 0
        self.held = 0
        self.unserved = 0
        self.boot_ticks = max(0, int(boot_ticks))
        self.metric_mode = metric
        self.booting = []      # orders in flight: [ticks_left, count]
        self.last_served = 0   # previous tick's served (concurrency metric)

    def tick(self, arrivals):
        still = []
        for left, count in self.booting:
            left -= 1
            if left <= 0:
                self.replicas += count
            else:
                still.append([left, count])
        self.booting = still
        self.queue += arrivals
        if self.metric_mode == "concurrency":
            metric = (self.queue + self.last_served) / self.replicas
        else:
            metric = self.queue / self.replicas
        rec = min(max(math.ceil(self.replicas * metric / self.target),
                      self.lo), self.hi)
        self.recs.append(rec)
        if rec >= self.replicas:
            added = min(rec, self.hi) - (self.replicas + sum(c for _, c in self.booting))
            if added > 0:
                if self.boot_ticks > 0:
                    self.booting.append([self.boot_ticks, added])
                else:
                    self.replicas += added
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
        self.last_served = served
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
          { en: "The recommendation is recorded BEFORE the window logic — the window reads recorded history, not the future.", ru: "Рекомендация записывается ДО логики окна — окно читает записанную историю, а не будущее." },
          { en: "-(-a // b) is an integer ceil without imports beyond math for the ratio.", ru: "-(-a // b) — целочисленный ceil без лишних импортов (math нужен только для отношения)." },
        ],
        numpy: false,
        timeoutMs: 4000,
      },
      {
        id: "ex8",
        title: { en: "Exercise 8 · Cold boot: the order fires now, the capacity comes later", ru: "Упражнение 5 · Холодный старт: заказ срабатывает сейчас, ёмкость приходит позже" },
        brief: {
          en: "The controller orders replicas instantly — a fresh pod still pays the weight load (~165 s, T09; a tick here is 15 s, so <code>boot_ticks=11</code>). Extend the frozen HPASim with two v2 knobs: <code>boot_ticks</code> (orders mature that many ticks later) and <code>metric</code> (<code>'queue_per_pod'</code> default, or <code>'concurrency'</code> = (queue + last served) / replicas). Scenario, declared: <code>target_queue=2, min_r=1, max_r=4, cap=30, window=3</code>, arrivals <code>[60, 60, 60, 60, 0×5, 60]</code>. Predict first: unserved ticks with <code>boot_ticks=0</code>, <code>=2</code>, <code>=11</code> — and what the <code>concurrency</code> metric does on a drained queue that <code>queue_per_pod</code> does not.",
          ru: "Контроллер заказывает реплики мгновенно — свежий под всё ещё платит загрузку весов (~165\u00a0с, T09; тик здесь 15\u00a0с, значит <code>boot_ticks=11</code>). Расширь замороженный HPASim двумя ручками v2: <code>boot_ticks</code> (заказы взрослеют через столько тиков) и <code>metric</code> (<code>'queue_per_pod'</code> дефолт, или <code>'concurrency'</code> = (очередь + обслужено на прошлом тике) / реплики). Сценарий заявлен: <code>target_queue=2, min_r=1, max_r=4, cap=30, window=3</code>, arrivals <code>[60, 60, 60, 60, 0×5, 60]</code>. Сначала предскажи: сколько тиков с непустой очередью при <code>boot_ticks=0</code>, <code>=2</code>, <code>=11</code> — и что метрика <code>concurrency</code> делает на опустевшей очереди такого, чего не делает <code>queue_per_pod</code>.",
        },
        starter: `import math

class HPASim:
    """V1 controller below is frozen; you add the two v2 knobs."""

    def __init__(self, w_ms=60.0, b_ms=2.0, cap=30, target_queue=2.0,
                 min_r=1, max_r=4, window=20, boot_ticks=0,
                 metric="queue_per_pod"):
        self.w, self.b, self.cap, self.target = w_ms, b_ms, cap, target_queue
        self.lo, self.hi, self.window = min_r, max_r, window
        self.replicas = min_r
        self.queue = 0
        self.recs = []
        self.ticks = 0
        self.held = 0
        self.unserved = 0
        # TODO v2: store boot_ticks and metric ('queue_per_pod' | 'concurrency');
        # booting = []  (orders in flight: [ticks_left, count]); last_served = 0

    def tick(self, arrivals):
        # TODO v2 (1): mature booting orders first: left -= 1 for each order;
        # an order reaching 0 joins: replicas += count
        self.queue += arrivals
        # TODO v2 (2): metric = queue / replicas, or for 'concurrency':
        # metric = (queue + last_served) / replicas
        metric = self.queue / self.replicas
        rec = min(max(math.ceil(self.replicas * metric / self.target),
                      self.lo), self.hi)
        self.recs.append(rec)
        if rec >= self.replicas:
            # v1: self.replicas = rec
            # TODO v2 (3): added = min(rec, self.hi) - (replicas + sum of
            # booting counts); if added > 0 and boot_ticks > 0: append order
            # [boot_ticks, added] to booting (capacity stays old this tick);
            # if boot_ticks == 0: replicas += added (v1 behavior)
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
        # TODO v2 (4): remember last_served = served
        self.ticks += 1
        return {'replicas': self.replicas, 'served': served,
                'queue': self.queue, 'step_ms': step_ms}

    def report(self):
        return {'ticks': self.ticks, 'held_ticks': self.held,
                'unserved_ticks': self.unserved,
                'final_replicas': self.replicas, 'final_queue': self.queue}

# Declared scenario:
ARRIVALS = [60, 60, 60, 60, 0, 0, 0, 0, 0, 60]
# Predict before running: unserved_ticks for boot_ticks = 0, 2, 11.
# Then explain: the stabilization window holds the OLD fleet up — it cannot
# speed the boot of the NEW one. And with metric='concurrency' a drained
# queue still shows load (last served) — the fleet stays pinned at max.
`,
        tests: [
          { name: "defaults are v1: burst scales up and serves", hidden: false, code: "sim = HPASim(target_queue=10, min_r=1, max_r=3, cap=30, window=3)\nr = sim.tick(60)\neq(r['replicas'], 3)\neq(r['served'], 60)\neq(r['queue'], 0)" },
          { name: "boot_ticks=2: the order fires, the old fleet serves", hidden: false, code: "sim = HPASim(target_queue=2, min_r=1, max_r=4, cap=30, window=3, boot_ticks=2)\nr = sim.tick(60)\neq(r['replicas'], 1)\neq(r['served'], 30)\neq(r['queue'], 30)" },
          { name: "boot_ticks=2: replicas mature at tick 2", hidden: false, code: "sim = HPASim(target_queue=2, min_r=1, max_r=4, cap=30, window=3, boot_ticks=2)\nsim.tick(60)\nsim.tick(60)\nr = sim.tick(60)\neq(r['replicas'], 4)\neq(sim.report()['unserved_ticks'], 2)" },
          { name: "boot_ticks=11: the boot outruns the scene", hidden: true, code: "sim = HPASim(target_queue=2, min_r=1, max_r=4, cap=30, window=3, boot_ticks=11)\nfor a in [60, 60, 60, 60, 0, 0, 0, 0, 0, 60]:\n    sim.tick(a)\nrep = sim.report()\neq(rep['unserved_ticks'], 8)\neq(rep['final_replicas'], 1)\neq(rep['final_queue'], 30)" },
          { name: "concurrency pins the fleet; queue_per_pod drops it", hidden: true, code: "for mode, want in (('queue_per_pod', 1), ('concurrency', 4)):\n    sim = HPASim(target_queue=2, min_r=1, max_r=4, cap=30, window=1, metric=mode)\n    sim.tick(60)\n    r = sim.tick(0)\n    eq(r['replicas'], want)" },
        ],
        solution: `import math

class HPASim:
    def __init__(self, w_ms=60.0, b_ms=2.0, cap=30, target_queue=2.0,
                 min_r=1, max_r=4, window=20, boot_ticks=0,
                 metric="queue_per_pod"):
        self.w, self.b, self.cap, self.target = w_ms, b_ms, cap, target_queue
        self.lo, self.hi, self.window = min_r, max_r, window
        self.replicas = min_r
        self.queue = 0
        self.recs = []
        self.ticks = 0
        self.held = 0
        self.unserved = 0
        self.boot_ticks = max(0, int(boot_ticks))
        self.metric_mode = metric
        self.booting = []
        self.last_served = 0

    def tick(self, arrivals):
        still = []
        for left, count in self.booting:
            left -= 1
            if left <= 0:
                self.replicas += count
            else:
                still.append([left, count])
        self.booting = still
        self.queue += arrivals
        if self.metric_mode == "concurrency":
            metric = (self.queue + self.last_served) / self.replicas
        else:
            metric = self.queue / self.replicas
        rec = min(max(math.ceil(self.replicas * metric / self.target),
                      self.lo), self.hi)
        self.recs.append(rec)
        if rec >= self.replicas:
            added = min(rec, self.hi) - (self.replicas + sum(c for _, c in self.booting))
            if added > 0:
                if self.boot_ticks > 0:
                    self.booting.append([self.boot_ticks, added])
                else:
                    self.replicas += added
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
        self.last_served = served
        self.ticks += 1
        return {'replicas': self.replicas, 'served': served,
                'queue': self.queue, 'step_ms': step_ms}

    def report(self):
        return {'ticks': self.ticks, 'held_ticks': self.held,
                'unserved_ticks': self.unserved,
                'final_replicas': self.replicas, 'final_queue': self.queue}`,
        hints: [
          { en: "Mature booting BEFORE reading the metric: a pod that finished booting this tick participates in this tick's decision and service.", ru: "Взросление boot-заказов — ДО чтения метрики: под, дозревший этим тиком, участвует в решении и обслуживании этого тика." },
          { en: "Cap the total order: added = min(rec, hi) − (replicas + booted counts) — pending orders never exceed max_r.", ru: "Суммарный заказ ограничен: added = min(rec, hi) − (реплики + заказанные) — pending не превышает max_r." },
          { en: "The concurrency contrast needs window=1: with the default window the scale-down is held anyway.", ru: "Контраст concurrency виден при window=1: с дефолтным окном скейл-даун и так удержан." },
        ],
        numpy: false,
        timeoutMs: 6000,
      },
      {
        id: "ex9",
        title: { en: "Exercise 9 · The drain drill: pricing the 503 window", ru: "Упражнение 9 · Дрилл слива: цена окна 503" },
        brief: {
          en: "Node maintenance drains a pod mid-lesson: the fleet of 2×250 tok/s drops to 250 while the replacement pod pays the weight load — <code>boot_ticks</code> ticks of your HPASim clock (tick 15 s, T09 members). Implement <code>drain_degradation_seconds(tick_s, boot_ticks)</code> — how long the degraded capacity lasts, in seconds. Zero boot ticks means a warm pool: no degradation at all. This prices the incident you would write up in the milestone: «the drain was routine; the 503 window was 165 s».",
          ru: "Обслуживание узла сливает под посреди занятия: флот 2×250 ток/с падает до 250, пока replacement-под платит загрузку весов — <code>boot_ticks</code> тиков твоих часов HPASim (тик 15 с, члены T09). Реализуй <code>drain_degradation_seconds(tick_s, boot_ticks)</code> — сколько секунд длится деградация. Ноль тиков загрузки — тёплый пул: деградации нет вообще. Это цена инцидента, который ты опишешь в милстоуне: «слив был рутинным; окно 503 — 165 с».",
        },
        starter: `def drain_degradation_seconds(tick_s, boot_ticks):
    """Seconds of degraded capacity: boot_ticks HPA ticks of tick_s."""
    # TODO: the T09 members, priced in HPA ticks
    ...`,
        tests: [
          { name: "the course numbers: 11 ticks × 15 s", hidden: false, code: "eq(drain_degradation_seconds(15, 11), 165)" },
          { name: "a warm pool: zero degradation", hidden: false, code: "eq(drain_degradation_seconds(15, 0), 0)" },
          { name: "faster ticks shorten the window", hidden: true, code: "eq(drain_degradation_seconds(10, 11), 110)" },
          { name: "slower ticks stretch it", hidden: true, code: "eq(drain_degradation_seconds(20, 11), 220)" },
        ],
        solution: `def drain_degradation_seconds(tick_s, boot_ticks):
    return boot_ticks * tick_s`,
        hints: [
          { en: "165 s cold start / 15 s tick = the 11 boot ticks from Exercise 8; the window is ticks × tick_s.", ru: "165 с холодного старта / 15 с тик = 11 boot-тиков из упражнения 8; окно — тики × tick_s." },
        ],
        numpy: false,
        timeoutMs: 4000,
      },
    ],
    challenge: {
      id: "chal1",
      word: { en: "challenge", ru: "челлендж" },
      title: {
        en: "★ Absorb the burst of 60 in one tick, step ≤ 120 ms",
        ru: "★ Вобрать бурст из 60 за один тик, шаг ≤ 120 мс",
      },
      brief: {
        en: "You tune the controller's knobs for one burst tick: <code>60</code> arrivals hit a fresh fleet (1 replica, empty queue). Knob grids: <code>target_queue ∈ {1, 2, 4, 8}</code>, <code>max_r ∈ {2, 3, 4}</code>; the per-pod model stays T06's (<code>cap 30</code>, step <code>60 + 2 × batch</code>). Goal: the tick <strong>serves all 60</strong> (queue empty after) with <strong>step ≤ 120 ms</strong>. No tests guide you — the page replays the controller arithmetic exactly as HPASim does (ceil, clamp, serve, batch).",
        ru: "Ты тюнишь ручки контроллера на одном тике-бурсте: <code>60</code> заявок бьют в свежий флот (1 реплика, пустая очередь). Сетки ручек: <code>target_queue ∈ {1, 2, 4, 8}</code>, <code>max_r ∈ {2, 3, 4}</code>; модель пода остаётся T06 (<code>cap 30</code>, шаг <code>60 + 2 × batch</code>). Цель: тик <strong>обслуживает все 60</strong> (очередь пуста после) с <strong>шагом ≤ 120 мс</strong>. Тестов-каркаса нет — страница переигрывает арифметику контроллера ровно как HPASim (ceil, кламп, обслуживание, батч).",
      },
      goal: {
        en: "Print one line: <code>target_queue=… max_r=… served=… step_ms=…</code> with served = 60 and step ≤ 120 ms.",
        ru: "Напечатай одну строку: <code>target_queue=… max_r=… served=… step_ms=…</code> с served = 60 и шагом ≤ 120 мс.",
      },
      mode: "run",
      numpy: false,
      timeoutMs: 30000,
      starter: `# One burst tick: queue = 60, replicas start at 1 (fresh fleet).
# Knobs from the grids: target_queue in {1, 2, 4, 8}; max_r in {2, 3, 4}.
# Controller arithmetic (as in HPASim.tick):
#   metric   = queue / replicas                 = 60
#   rec      = clamp(ceil(replicas * metric / target_queue), 1, max_r)
#   replicas = rec                              (scale-up is immediate)
#   served   = min(queue, replicas * cap)       with cap = 30
#   batch    = min(cap, ceil(served / replicas)); step_ms = 60 + 2 * batch
# The page reads ONE summary line:
#   target_queue=<from grid> max_r=<from grid> served=<tokens> step_ms=<ms>
# Goal: served = 60 AND step_ms <= 120.

# TODO: try the knob pairs by hand or scan them, print the line.
`,
      check: (res) => {
        const out = String(res.stdout || "");
        const mm = out.match(/target_queue\s*=\s*([0-9]+)[\s\S]*?max_r\s*=\s*([0-9]+)[\s\S]*?served\s*=\s*([0-9]+)[\s\S]*?step_ms\s*=\s*([0-9]+(?:\.[0-9]+)?)/i);
        if (!mm) {
          return { ok: false, note: { en: "no summary line found - print exactly: target_queue=… max_r=… served=… step_ms=…", ru: "итоговой строки нет — напечатай ровно: target_queue=… max_r=… served=… step_ms=…" } };
        }
        const tq = parseInt(mm[1], 10), maxR = parseInt(mm[2], 10);
        const servedClaimed = parseInt(mm[3], 10), stepClaimed = parseFloat(mm[4]);
        if (![1, 2, 4, 8].includes(tq) || ![2, 3, 4].includes(maxR)) {
          return { ok: false, note: { en: "the knobs must come from the declared grids: target_queue " + tq + ", max_r " + maxR, ru: "ручки обязаны быть из заявленных сеток: target_queue " + tq + ", max_r " + maxR } };
        }
        const rec = Math.min(Math.max(Math.ceil(60 / tq), 1), maxR);
        const served = Math.min(60, rec * 30);
        const batch = served ? Math.min(30, Math.ceil(served / rec)) : 0;
        const step = 60 + 2 * batch;
        if (servedClaimed !== served || Math.abs(step - stepClaimed) > 0.5) {
          return { ok: false, note: { en: "the controller arithmetic gives: rec " + rec + ", served " + served + ", step " + step + " ms for those knobs", ru: "арифметика контроллера даёт: rec " + rec + ", обслужено " + served + ", шаг " + step + " мс для этих ручек" } };
        }
        if (served < 60) {
          return { ok: false, note: { en: "served " + served + " < 60 - the burst left " + (60 - served) + " unserved; raise max_r or lower target_queue", ru: "обслужено " + served + " < 60 — бурст оставил " + (60 - served) + " необслуженными; подними max_r или снизь target_queue" } };
        }
        if (step > 120) {
          return { ok: false, note: { en: "step " + step + " ms > 120 ms - the batch is too fat; spread it over more replicas", ru: "шаг " + step + " мс > 120 мс — батч слишком жирный; размажь его по большим репликам" } };
        }
        return { ok: true, note: { en: "tq " + tq + ", max_r " + maxR + " → rec " + rec + " replicas: served " + served + ", step " + step + " ms — burst absorbed in one tick", ru: "tq " + tq + ", max_r " + maxR + " → rec " + rec + " реплик: обслужено " + served + ", шаг " + step + " мс — бурст вобран за один тик" } };
      },
      reference: `# Walk the knob pairs - it is 12 lines, cheaper than guessing:
for tq in (1, 2, 4, 8):
    for max_r in (2, 3, 4):
        rec = min(max(-(-60 // tq), 1), max_r)      # ceil + clamp
        served = min(60, rec * 30)
        batch = min(30, -(-served // rec)) if served else 0
        step = 60 + 2 * batch
        mark = "OK " if served == 60 and step <= 120 else "   "
        print(f"{mark}target_queue={tq} max_r={max_r} rec={rec} served={served} step_ms={step}")
# target_queue=1 with max_r=1 never serves 60 (the clamp caps rec at 1);
# tq=1 with max_r=2 lands exactly ON the line: served 60, batch 30,
# step 120 <= 120 - accepted, but with zero headroom. Several pairs win
# comfortably (tq 2 x max_r 4 gives rec 4, served 60, batch 15, step 90;
# tq 4 x max_r 3 gives step 100; the tq 8 rows pass only where the clamp
# leaves exactly enough replicas).
# The clamp and the batch ceiling fight each other - tuning is the truce.`,
    },
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
        q: { en: "Why do LLM teams scale on queue depth instead of GPU utilization?", ru: "Почему LLM-команды скейлят по глубине очереди, а не по GPU-утилизации?" },
        options: [{ en: "batching keeps GPU utilization high even with an empty queue — only the queue shows real demand", ru: "батчинг держит GPU-утилизацию высокой даже при пустой очереди — о настоящем спросе говорит только очередь" }, { en: "GPU utilization is impossible to measure", ru: "GPU-утилизацию невозможно измерить" }, { en: "the HPA forbids GPU metrics", ru: "HPA запрещает GPU-метрики" }],
        answer: 0,
        explain: { en: "Continuous batching is doing its job exactly when the GPU is busy and the queue is empty; the queue (or KV pressure, or TTFT) is what says «more pods now».", ru: "Continuous batching делает свою работу ровно тогда, когда GPU занят, а очередь пуста; очередь (или давление KV, или TTFT) — то, что говорит «нужны ещё поды»." },
      },
      {
        id: "p3",
        q: { en: "Within the 300 s scale-down window the controller applies\u2026", ru: "Внутри окна скейл-дауна 300 с контроллер применяет\u2026" },
        options: [{ en: "the maximum recommendation seen in the window — anti-flapping", ru: "максимум рекомендаций за окно — анти-флаттер" }, { en: "the minimum, to save money fastest", ru: "минимум, чтобы быстрее сэкономить" }, { en: "the average over the window", ru: "среднее за окно" }],
        answer: 0,
        explain: { en: "Scale-up is instant because the shortage hurts now; scale-down waits for the window max so a saw-shaped metric cannot flap the fleet.", ru: "Скейл-ап мгновенный, потому что дефицит болит сейчас; скейл-даун ждёт максимум за окно, чтобы пилообразная метрика не дёргала флот." },
      },
      {
        id: "b1",
        tag: { en: "bridge · Topic 03", ru: "мост · Тема 03" },
        context: { en: "T03 quantized weights to INT4; T09 priced the cold start (weight loading dominates). This lab prices scale-up decisions: a fresh pod pays the load again before it serves.", ru: "T03 квантовала веса в INT4; T09 оценила холодный старт (доминирует загрузка весов). Эта лаба оценивает решения скейл-апа: свежий под снова платит загрузку, прежде чем обслуживать." },
        q: { en: "The fleet swaps to an INT4-quantized backend. What changes for the HPA's scale-up, honestly?", ru: "Флот переезжает на INT4-квантованный бэкенд. Что честно меняется для скейл-апа HPA?" },
        options: [
          { en: "The weight-loading member of the cold start shrinks (~4× smaller file), so a fresh pod turns Ready sooner — scale-up's hidden cost drops; the ceil formula and the windows do not change", ru: "Член загрузки весов холодного старта сжимается (файл ~в 4 раза меньше), поэтому свежий под быстрее становится Ready — скрытая цена скейл-апа падает; формула ceil и окна не меняются" },
          { en: "The ceil formula divides by 4 for quantized weights", ru: "Формула ceil делит на 4 для квантованных весов" },
          { en: "Quantization removes the cold start entirely - scale-up becomes instant", ru: "Квантизация убирает холодный старт целиком — скейл-ап становится мгновенным" },
        ],
        answer: 0,
        explain: { en: "T03 × T09 × this lab, multiplied honestly: quantization shrinks the DOMINANT member of the T09 chain, shortening the Not-Ready window; the HPA arithmetic (ceil, tolerance, windows) is controller math and does not know about bytes. The window's 300 s stays because it guards against metric noise, not against slow loads.", ru: "T03 × T09 × эта лаба, умноженные честно: квантизация сжимает ДОМИНИРУЮЩИЙ член цепочки T09, укорачивая окно Not-Ready; арифметика HPA (ceil, tolerance, окна) — математика контроллера, и байт она не знает. Окно 300 с остаётся: оно защищает от шума метрики, а не от медленной загрузки." },
      },
    ],
    reward: {
      caption: { en: "You read the honest gauge, computed the ceil, and the fleet stopped flapping.", ru: "Ты читаешь честный манометр, считаешь ceil — и флот перестал дёргаться." },
    },
    footer: {
      en: "Declared controller arithmetic on course numbers (T06 step model, T08 burst envelope, T09 cold start) — not a cluster. Primary practice sources: Kubernetes HPA docs (formula, tolerance, windows), the llm-d autoscaling lesson from KubeCon NA 2026 (queue depth, KV pressure, TTFT — not GPU utilization), GKE's HPA-for-inference guides, KEDA and vLLM production stack as the modern custom-metric paths. The compose drill is a rehearsal of the HPA, not the HPA.",
      ru: "Заявленная арифметика контроллера на курсовых числах (модель шага из T06, конверт бурста из T08, холодный старт из T09) — не кластер. Первоисточники практики: доки Kubernetes HPA (формула, tolerance, окна), урок llm-d с KubeCon NA 2026 (глубина очереди, давление KV, TTFT — не GPU-утилизация), гайды GKE про HPA для инференса, KEDA и vLLM production stack как современные пути кастомных метрик. Compose-дрилл — репетиция HPA, но не сам HPA.",
    },
  };
})();
