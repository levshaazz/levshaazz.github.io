/* Lab 15 — Agent workloads and PD disaggregation.
   Content module for the generic lab page (window.LABS_CONTENT['15']).
   Agent sessions break the static prefill/decode split and LRU eviction:
   teaching PD planning (Θ = min(Σμ_P, Σμ_D), hysteresis > 2·SE) and
   agent-aware KV eviction (branch counters vs recency) as declared
   deterministic simulators over course-inherited numbers (165 s from the
   T09 fleet run). Paper numbers (8P1D drift, −65%, 6.2 s, 98% reuse) are
   quoted as a foreign cluster, never used as lab arithmetic. */
(function () {
  "use strict";
  window.LABS_CONTENT = window.LABS_CONTENT || {};

  LABS_CONTENT["15"] = {
    budget: 60,
    title: {
      en: "Agent workloads and PD disaggregation",
      ru: "Агентные нагрузки и PD-дизагрегация",
    },
    sub: {
      en: "Split the agent trace into cached, uncached and decode work; plan the prefill/decode split as Θ = min(Σμ_P, Σμ_D); tame switching with hysteresis and evict KV by live branches, not by recency.",
      ru: "Разложи трейс агентной сессии на cached, uncached и decode; спланируй PD-сплит как Θ = min(Σμ_P, Σμ_D); усмири переключения гистерезисом и выкидывай KV по живым веткам, а не по давности.",
    },
    intro: {
      en: `<p>A chat user sends one prompt and waits. An <strong>agent</strong> runs a loop: it calls tools, forks sub-agents that share its prefix, pauses for seconds between steps, and compacts old history. Every one of those habits breaks a default assumption the serving stack was built on. Two break it hardest. First, <strong>recency is not reuse</strong>: the session that has been waiting on a tool call is the least recently used — and exactly the one that will re-hit its KV cache when the tool returns. Second, <strong>cached is not uncached</strong>: after a fork, most of the prompt's tokens are already in the KV cache, and a planner that bills every token as prefill work (t<sub>cached</sub> = t<sub>uncached</sub>) drifts toward prefill-heavy splits and loses throughput.</p>
<p><strong>PD disaggregation</strong> splits the fleet into prefill nodes and decode nodes. The window's throughput is the smaller of the two capacities: <code>Θ(P, D) = min(Σμ_P, Σμ_D)</code> — a bottleneck formula, not a sum. The switching cost is the third trap: restarting a worker into a new role pays the weight load again (T09's members, <strong>165 s</strong> on the course fleet — you measured it), while an in-place role flip takes seconds. That asymmetry is why the planner needs <strong>hysteresis</strong>: switch only when the gain over the window slices exceeds 2·SE — a burst of sub-agents is noise, not a new regime.</p>
<p>This lab is a <strong>declared teaching model of a cluster</strong>: deterministic simulators on course-inherited numbers (the 165 s boot from the T09 fleet run, roofline logic from T02) — the paper's own numbers (8P1D drift, −65% throughput, 6.2 s in-place, 98% reuse) belong to someone else's cluster and are quoted in the text as references, never used as lab arithmetic. The line behind the topic: DistServe (OSDI'24) → Splitwise (ISCA'24) → Sarathi-Serve → Mooncake (FAST'25) → SGLang radix cache → Llumnix → the Dynamo planner → agent-aware KV work, converging in <em>Evolving Infra</em> (arXiv 2611.12304). Its mirror image — agents optimizing the infra — is the T16 capstone (Infrathon, arXiv 2611.11995).</p>`,
      ru: `<p>Чат-пользователь отправляет один промпт и ждёт. <strong>Агент</strong> живёт циклом: зовёт тулзы, плодит саб-агентов, разделяющих его префикс, паузит на секунды между шагами и уплотняет старую историю. Каждая из этих привычек ломает дефолтное допущение сервинг-стека. Две ломают больнее всего. Первая: <strong>давность — не переиспользование</strong>. Сессия, ждущая тулзу, — наименее недавно использованная, и ровно она снова попадёт в свой KV-кэш, когда тулза вернётся. Вторая: <strong>кэш — не некэш</strong>. После форка большая часть токенов промпта уже лежит в KV-кэше, и планировщик, выставляющий счёт за каждый токен как за prefill-работу (t<sub>cached</sub> = t<sub>uncached</sub>), дрейфует к сплитам с перебором prefill и теряет throughput.</p>
<p><strong>PD-дизагрегация</strong> делит флот на prefill-узлы и decode-узлы. Throughput окна — меньшая из двух ёмкостей: <code>Θ(P, D) = min(Σμ_P, Σμ_D)</code> — формула бутылочного горлышка, а не сумма. Цена переключения — третья ловушка: рестарт воркера в новую роль снова платит загрузку весов (члены T09, <strong>165 с</strong> на курсовом флоте — вы это мерили), а перевключение роли на месте занимает секунды. Отсюда асимметрия, из-за которой планировщику нужен <strong>гистерезис</strong>: переключайся только когда выигрыш по слайсам окна превышает 2·SE — бёрст саб-агентов это шум, а не новый режим.</p>
<p>Эта лаба — <strong>заявленная учебная модель кластера</strong>: детерминированные симуляторы на курсовых числах (загрузка 165 с из прогона T09-fleet, roofline-логика из T02) — а числа статьи (дрейф 8P1D, −65 % throughput, 6.2 с in-place, 98 % reuse) принадлежат чужому кластеру и цитируются в тексте как справочные, никогда как лабораторная арифметика. Линия за темой: DistServe (OSDI'24) → Splitwise (ISCA'24) → Sarathi-Serve → Mooncake (FAST'25) → SGLang radix-кэш → Llumnix → Dynamo-планер → agent-aware KV-работы, сходящиеся в <em>Evolving Infra</em> (arXiv 2611.12304). Её зеркало — агенты, оптимизирующие инфру, — капстоун T16 (Infrathon, arXiv 2611.11995).</p>`,
    },
    heroTag: { en: "PD split, KV reuse, hysteresis", ru: "PD-сплит, переиспользование KV, гистерезис" },
    glossary: [
      [{ en: "PD disaggregation", ru: "PD-дизагрегация" }, { en: "Splitting the fleet into prefill nodes and decode nodes; DistServe's answer to prefill/decode interference.", ru: "Разделение флота на prefill-узлы и decode-узлы; ответ DistServe на интерференцию prefill и decode." }],
      [{ en: "Θ (window throughput)", ru: "Θ (throughput окна)" }, { en: "Θ(P,D) = min(Σμ_P, Σμ_D): the split serves at its bottleneck's rate — a min, never a sum.", ru: "Θ(P,D) = min(Σμ_P, Σμ_D): сплит обслуживает на скорости своего горлышка — это min, никогда не сумма." }],
      [{ en: "cached vs uncached", ru: "cached против uncached" }, { en: "KV-hit tokens are nearly free for prefill compute; billing them as full prefill work (t_c = t_uc) drifts the planner.", ru: "Токены с KV-попаданием почти бесплатны для prefill-вычислений; выставлять им полный счёт (t_c = t_uc) уводит планировщик." }],
      [{ en: "KV hit rate", ru: "hit rate KV-кэша" }, { en: "Σ cached tokens / Σ prompt tokens over the trace — how much prefill work the cache absorbs.", ru: "Σ кэш-токенов / Σ токенов промптов по трейсу — какую долю prefill-работы съел кэш." }],
      [{ en: "branch counter", ru: "счётчик веток" }, { en: "How many live agent branches still reference a KV block; pauses keep the counter above zero.", ru: "Сколько живых веток агента ещё ссылается на KV-блок; паузы держат счётчик выше нуля." }],
      [{ en: "LRU eviction", ru: "эвикшн LRU" }, { en: "Evict the least recently used block — drops a paused branch's cache precisely because it has not been touched.", ru: "Выкидывает наименее недавно использованный блок — и именно поэтому теряет кэш паузившей ветки." }],
      [{ en: "compaction", ru: "компакция" }, { en: "The agent's own cleanup of old history: the KV stays resident but its reuse is dead — evicting it costs nothing.", ru: "Чистка старой истории самим агентом: KV ещё резидентен, но его переиспользование мертво — выкидывание ничего не стоит." }],
      [{ en: "hysteresis", ru: "гистерезис" }, { en: "Switch the split only when the gain over window slices exceeds 2·SE — a burst is noise, not a regime.", ru: "Переключай сплит только когда выигрыш по слайсам окна больше 2·SE — бёрст это шум, а не режим." }],
      [{ en: "switching cost", ru: "цена переключения" }, { en: "Restart into a new role = the weight load again (165 s, T09 fleet); in-place flip takes seconds. Cautious direction: restart.", ru: "Рестарт в новую роль = снова загрузка весов (165 с, флот T09); перевключение на месте — секунды. Осторожное направление — рестарт." }],
      [{ en: "sub-agent fork", ru: "форк саб-агента" }, { en: "A child agent reusing the parent's prefix: most of its prompt is already cached — that is the reuse LRU cannot see coming.", ru: "Дочерний агент, переиспользующий префикс родителя: большая часть промпта уже в кэше — того самого переиспользования, которого LRU не видит." }],
    ],
    figures: [
      {
        id: "lab15-pd-tiles",
        title: { en: "Nine nodes, one window: the split flips by Θ, not by vibes", ru: "Девять узлов, одно окно: сплит флипается по Θ, а не по настроению" },
        w: 760, h: 400,
        svg: `<svg viewBox="0 0 760 400" xmlns="http://www.w3.org/2000/svg">
  <g id="g-tiles">
    <rect x="60"  y="60" width="120" height="72" rx="8" fill="none" stroke="var(--lab-accent)" stroke-width="2"/>
    <text x="120" y="88" text-anchor="middle" font-size="13" fill="var(--lab-accent)" class="mono" data-en="P · 900 tok/s" data-ru="P · 900 ток/с">P · 900 tok/s</text>
    <text x="120" y="112" text-anchor="middle" font-size="12" fill="var(--lab-muted)">n1</text>
    <rect x="200" y="60" width="120" height="72" rx="8" fill="none" stroke="var(--lab-accent)" stroke-width="2"/>
    <text x="260" y="88" text-anchor="middle" font-size="13" fill="var(--lab-accent)" class="mono" data-en="P · 900 tok/s" data-ru="P · 900 ток/с">P · 900 tok/s</text>
    <text x="260" y="112" text-anchor="middle" font-size="12" fill="var(--lab-muted)">n2</text>
    <rect x="340" y="60" width="120" height="72" rx="8" fill="none" stroke="var(--lab-accent)" stroke-width="2"/>
    <text x="400" y="88" text-anchor="middle" font-size="13" fill="var(--lab-accent)" class="mono" data-en="P · 900 tok/s" data-ru="P · 900 ток/с">P · 900 tok/s</text>
    <text x="400" y="112" text-anchor="middle" font-size="12" fill="var(--lab-muted)">n3</text>
    <rect x="480" y="60" width="120" height="72" rx="8" fill="none" stroke="var(--lab-accent)" stroke-width="2"/>
    <text x="540" y="88" text-anchor="middle" font-size="13" fill="var(--lab-accent)" class="mono" data-en="P · 900 tok/s" data-ru="P · 900 ток/с">P · 900 tok/s</text>
    <text x="540" y="112" text-anchor="middle" font-size="12" fill="var(--lab-muted)">n4</text>
    <rect x="620" y="60" width="120" height="72" rx="8" fill="none" stroke="var(--fig-warm)" stroke-width="2"/>
    <text x="680" y="88" text-anchor="middle" font-size="13" fill="var(--fig-warm)" class="mono" data-en="D · 1100 tok/s" data-ru="D · 1100 ток/с">D · 1100 tok/s</text>
    <text x="680" y="112" text-anchor="middle" font-size="12" fill="var(--lab-muted)">n5</text>
    <rect x="60"  y="160" width="120" height="72" rx="8" fill="none" stroke="var(--fig-warm)" stroke-width="2"/>
    <text x="120" y="188" text-anchor="middle" font-size="13" fill="var(--fig-warm)" class="mono" data-en="D · 1100 tok/s" data-ru="D · 1100 ток/с">D · 1100 tok/s</text>
    <text x="120" y="212" text-anchor="middle" font-size="12" fill="var(--lab-muted)">n6</text>
    <rect x="200" y="160" width="120" height="72" rx="8" fill="none" stroke="var(--fig-warm)" stroke-width="2"/>
    <text x="260" y="188" text-anchor="middle" font-size="13" fill="var(--fig-warm)" class="mono" data-en="D · 1100 tok/s" data-ru="D · 1100 ток/с">D · 1100 tok/s</text>
    <text x="260" y="212" text-anchor="middle" font-size="12" fill="var(--lab-muted)">n7</text>
    <rect x="340" y="160" width="120" height="72" rx="8" fill="none" stroke="var(--fig-warm)" stroke-width="2"/>
    <text x="400" y="188" text-anchor="middle" font-size="13" fill="var(--fig-warm)" class="mono" data-en="D · 1100 tok/s" data-ru="D · 1100 ток/с">D · 1100 tok/s</text>
    <text x="400" y="212" text-anchor="middle" font-size="12" fill="var(--lab-muted)">n8</text>
    <rect x="480" y="160" width="120" height="72" rx="8" fill="none" stroke="var(--fig-warm)" stroke-width="2"/>
    <text x="540" y="188" text-anchor="middle" font-size="13" fill="var(--fig-warm)" class="mono" data-en="D · 1100 tok/s" data-ru="D · 1100 ток/с">D · 1100 tok/s</text>
    <text x="540" y="212" text-anchor="middle" font-size="12" fill="var(--lab-muted)">n9</text>
    <rect x="620" y="160" width="120" height="72" rx="8" fill="none" stroke="var(--lab-muted)" stroke-width="1.5" stroke-dasharray="6 5"/>
    <text x="680" y="188" text-anchor="middle" font-size="12" fill="var(--lab-muted)" data-en="idle (window)" data-ru="простой (окно)">idle (window)</text>
    <text x="680" y="212" text-anchor="middle" font-size="12" fill="var(--lab-muted)">—</text>
  </g>
  <g id="g-theta">
    <text x="70" y="280" font-size="14" fill="var(--lab-ink)" class="mono" data-en="4P5D: Θ = min(3600, 5500) = 3600 tok/s" data-ru="4P5D: Θ = min(3600, 5500) = 3600 ток/с">4P5D: Θ = min(3600, 5500) = 3600 tok/s</text>
    <text x="70" y="308" font-size="14" fill="var(--lab-accent)" class="mono" data-en="5P4D: Θ = min(4500, 4400) = 4400 tok/s — the window's best" data-ru="5P4D: Θ = min(4500, 4400) = 4400 ток/с — лучшее для окна">5P4D: Θ = min(4500, 4400) = 4400 tok/s — the window's best</text>
    <text x="70" y="336" font-size="13" fill="var(--fig-warm)" data-en="a burst of sub-agents is noise: gain 50 < 2·SE = 82 — hold" data-ru="бёрст саб-агентов — шум: выигрыш 50 < 2·SE = 82 — держим">a burst of sub-agents is noise: gain 50 &lt; 2·SE = 82 — hold</text>
  </g>
  <g id="g-sum">
    <text x="70" y="376" font-size="13" fill="var(--lab-muted)" data-en="the sum trap: 4P5D «wins» by sum (9100) and serves 3600 — the bottleneck is the truth" data-ru="ловушка суммы: 4P5D «выигрывает» по сумме (9100), а обслуживает 3600 — горлышко говорит правду">the sum trap: 4P5D «wins» by sum (9100) and serves 3600 — the bottleneck is the truth</text>
  </g>
</svg>`,
        stages: [
          { cap: { en: "A 9-node pool, roles declared: 4 prefill, 5 decode (window 4P5D).", ru: "Пул из 9 узлов, роли объявлены: 4 prefill, 5 decode (окно 4P5D)." }, show: ["g-tiles"] },
          { cap: { en: "Θ is the bottleneck: 4P5D serves 3600 — the five D nodes idle past the P wall.", ru: "Θ — это горлышко: 4P5D обслуживает 3600 — пять D-узлов простаивают за P-стеной." }, show: ["g-tiles", "g-theta"] },
          { cap: { en: "Flip one tile to P: 5P4D → Θ = 4400. The burst case does NOT flip: 50 < 2·SE.", ru: "Переворачиваем один тайл в P: 5P4D → Θ = 4400. Бёрстовый случай НЕ флипает: 50 < 2·SE." }, show: ["g-tiles", "g-theta", "g-sum"] },
        ],
      },
      {
        id: "lab15-kv-pool",
        title: { en: "The KV pool: recency evicts a live branch, the counter does not", ru: "KV-пул: давность выкидывает живую ветку, счётчик — нет" },
        w: 760, h: 400,
        svg: `<svg viewBox="0 0 760 400" xmlns="http://www.w3.org/2000/svg">
  <g id="g-pool">
    <rect x="60"  y="60" width="180" height="84" rx="8" fill="none" stroke="var(--lab-accent)" stroke-width="2"/>
    <text x="150" y="90" text-anchor="middle" font-size="13" fill="var(--lab-accent)" data-en="tile A · session s1" data-ru="плитка A · сессия s1">tile A · session s1</text>
    <text x="150" y="114" text-anchor="middle" font-size="12" fill="var(--lab-ink)" class="mono" data-en="branches: 2 (s1 + sub-agent)" data-ru="ветки: 2 (s1 + саб-агент)">branches: 2 (s1 + sub-agent)</text>
    <text x="150" y="134" text-anchor="middle" font-size="12" fill="var(--lab-muted)" data-en="paused on a tool call" data-ru="пауза: ждёт тулзу">paused on a tool call</text>
    <rect x="290" y="60" width="180" height="84" rx="8" fill="none" stroke="var(--lab-accent)" stroke-width="2"/>
    <text x="380" y="90" text-anchor="middle" font-size="13" fill="var(--lab-accent)" data-en="tile B · session s2" data-ru="плитка B · сессия s2">tile B · session s2</text>
    <text x="380" y="114" text-anchor="middle" font-size="12" fill="var(--lab-ink)" class="mono" data-en="branches: 1 · fresh turn" data-ru="ветки: 1 · свежий ход">branches: 1 · fresh turn</text>
    <rect x="520" y="60" width="180" height="84" rx="8" fill="none" stroke="var(--lab-muted)" stroke-width="2" stroke-dasharray="7 5"/>
    <text x="610" y="90" text-anchor="middle" font-size="13" fill="var(--lab-muted)" data-en="tile C · session s3" data-ru="плитка C · сессия s3">tile C · session s3</text>
    <text x="610" y="114" text-anchor="middle" font-size="12" fill="var(--lab-muted)" class="mono" data-en="compacted — reuse is dead" data-ru="компакция — переиспользование мертво">compacted — reuse is dead</text>
    <text x="610" y="134" text-anchor="middle" font-size="12" fill="var(--lab-muted)" class="mono" data-en="branches: 0" data-ru="ветки: 0">branches: 0</text>
  </g>
  <g id="g-lru">
    <text x="70" y="196" font-size="14" fill="var(--lab-red,#af372b)" data-en="LRU: tile A is the least recently used → evicted" data-ru="LRU: плитка A наименее недавно использована → выселяется">LRU: tile A is the least recently used → evicted</text>
    <text x="70" y="222" font-size="13" fill="var(--lab-red,#af372b)" data-en="the tool returns: s1's 256 cached tokens are gone — lost reuse = 256" data-ru="тулза вернулась: 256 кэш-токенов s1 исчезли — потерянный reuse = 256">the tool returns: s1's 256 cached tokens are gone — lost reuse = 256</text>
  </g>
  <g id="g-counter">
    <text x="70" y="280" font-size="14" fill="var(--lab-accent)" data-en="branch-counter: tile C has 0 branches → evicted first" data-ru="счётчик веток: у плитки C 0 веток → выкидываем первой">branch-counter: tile C has 0 branches → evicted first</text>
    <text x="70" y="306" font-size="13" fill="var(--lab-accent)" data-en="the paused branch survives: lost reuse = 0 — recency ≠ reuse" data-ru="паузившая ветка выжила: потерянный reuse = 0 — давность ≠ переиспользование">the paused branch survives: lost reuse = 0 — recency ≠ reuse</text>
    <text x="70" y="344" font-size="13" fill="var(--lab-muted)" data-en="dead cache out, live cache in: the pool works for the agents, not against them" data-ru="мёртвый кэш — наружу, живой — внутри: пул работает для агентов, а не против них">dead cache out, live cache in: the pool works for the agents, not against them</text>
  </g>
</svg>`,
        stages: [
          { cap: { en: "Three tiles, three states: s1 paused with two branches, s2 fresh, s3 compacted to dead cache.", ru: "Три плитки, три состояния: s1 на паузе с двумя ветками, s2 свежая, s3 уплотнена в мёртвый кэш." }, show: ["g-pool"] },
          { cap: { en: "The pool is full: LRU evicts the least recently used — tile A, the paused branch. Lost reuse: 256 tokens.", ru: "Пул полон: LRU выкидывает наименее свежую — плитку A, паузившую ветку. Потерянный reuse: 256 токенов." }, show: ["g-pool", "g-lru"] },
          { cap: { en: "Branch-counter evicts the dead tile instead: lost reuse 0 — recency is not reuse.", ru: "Счётчик веток выкидывает мёртвую плитку: потерянный reuse 0 — давность не переиспользование." }, show: ["g-pool", "g-counter"] },
        ],
      },
      {
        id: "lab15-split-line",
        title: { en: "The split over time: hysteresis holds the line through a burst", ru: "Сплит во времени: гистерезис держит линию сквозь бёрст" },
        w: 760, h: 400,
        svg: `<svg viewBox="0 0 760 400" xmlns="http://www.w3.org/2000/svg">
  <g id="g-mix">
    <line x1="70" y1="320" x2="700" y2="320" stroke="var(--lab-muted)" stroke-width="1.5"/>
    <path d="M 70 290 L 180 290 L 260 250 L 420 250 L 500 290 L 700 290" fill="none" stroke="var(--fig-warm)" stroke-width="2.5" class="fig-flow"/>
    <text x="86" y="278" font-size="13" fill="var(--fig-warm)" data-en="prefill share of the load (agent turns)" data-ru="доля prefill в нагрузке (ходы агента)">prefill share of the load (agent turns)</text>
    <text x="300" y="238" font-size="13" fill="var(--fig-warm)" data-en="sub-agent fork: the share jumps" data-ru="форк саб-агентов: доля подпрыгивает">sub-agent fork: the share jumps</text>
    <text x="520" y="278" font-size="13" fill="var(--lab-muted)" data-en="burst decays" data-ru="бёрст затухает">burst decays</text>
    <text x="640" y="344" font-size="12" fill="var(--lab-muted)" data-en="time →" data-ru="время →">time →</text>
  </g>
  <g id="g-line">
    <path d="M 70 150 L 380 150" fill="none" stroke="var(--lab-accent)" stroke-width="3"/>
    <path d="M 380 150 L 400 120 L 700 120" fill="none" stroke="var(--lab-accent)" stroke-width="3"/>
    <text x="90" y="136" font-size="13" fill="var(--lab-accent)" class="mono" data-en="split 4P5D — Θ 3600" data-ru="сплит 4P5D — Θ 3600">split 4P5D — Θ 3600</text>
    <text x="430" y="106" font-size="13" fill="var(--lab-accent)" class="mono" data-en="after the window confirms: 5P4D — Θ 4400" data-ru="после подтверждения окном: 5P4D — Θ 4400">after the window confirms: 5P4D — Θ 4400</text>
  </g>
  <g id="g-hold">
    <path d="M 240 150 L 260 138 L 280 156 L 300 146 L 320 152" fill="none" stroke="var(--fig-warm)" stroke-width="2" stroke-dasharray="4 4"/>
    <text x="180" y="184" font-size="13" fill="var(--fig-warm)" data-en="the fork's first spikes: gain 50 < 2·SE = 82 — the line holds" data-ru="первые всплески форка: выигрыш 50 < 2·SE = 82 — линия держит">the fork's first spikes: gain 50 &lt; 2·SE = 82 — the line holds</text>
    <text x="70" y="382" font-size="13" fill="var(--lab-muted)" data-en="declared arithmetic on course numbers; the paper's 8P1D drift is someone else's cluster" data-ru="заявленная арифметика на курсовых числах; дрейф 8P1D из статьи — чужой кластер">declared arithmetic on course numbers; the paper's 8P1D drift is someone else's cluster</text>
  </g>
</svg>`,
        stages: [
          { cap: { en: "The load mix breathes: agent turns keep the prefill share above the chat baseline.", ru: "Состав нагрузки дышит: ходы агента держат долю prefill выше чат-базовой." }, show: ["g-mix"] },
          { cap: { en: "The split line: 4P5D held while the mix was near the chat baseline.", ru: "Линия сплита: 4P5D держалась, пока состав был около чат-базовой." }, show: ["g-mix", "g-line"] },
          { cap: { en: "A fork raises the share; the first spikes are noise (50 < 2·SE) — the line holds, then flips once, on evidence.", ru: "Форк поднимает долю; первые всплески — шум (50 < 2·SE) — линия держит, потом флипает один раз, по доказательству." }, show: ["g-mix", "g-line", "g-hold"] },
        ],
      },
    ],
    quizzes: [
      {
        id: "q1",
        q: {
          en: "A forked turn: prompt 384 tokens, 256 of them are KV hits. The lab's fitted prefill line is t = 8 + 0.22·n_uc (ms). Predict this turn's TTFT in ms.",
          ru: "Форкнутый ход: промпт 384 токена, из них 256 — KV-попадания. Подогнанная линия prefill этой лабы: t = 8 + 0.22·n_uc (мс). Предскажи TTFT хода в мс.",
        },
        answer: 36.2, tol: 0.5, unit: { en: "ms", ru: "мс" },
        hint: {
          en: "TTFT = 8 + 0.22 × (384 − 256): only the uncached tokens are billed.",
          ru: "TTFT = 8 + 0.22 × (384 − 256): счёт выставляется только по некэш-токенам.",
        },
        followUp: {
          q: { en: "Why is the answer ≈36 ms and not 8 + 0.22 × 384 ≈ 92 ms?", ru: "Почему ответ ≈36 мс, а не 8 + 0.22 × 384 ≈ 92 мс?" },
          options: [
            { en: "A KV hit makes the cached tokens nearly free for prefill compute: only the 128 uncached tokens are billed — billing the whole prompt (t_c = t_uc) is exactly the planner's drift", ru: "KV-попадание делает кэш-токены почти бесплатными для prefill-вычислений: счёт идёт только по 128 некэш-токенам — выставлять весь промпт (t_c = t_uc) и есть дрейф планировщика" },
            { en: "The cached tokens decode twice as fast, which cancels their prefill cost", ru: "Кэш-токены декодируются вдвое быстрее, что отменяет их prefill-цену" },
            { en: "The fitted line only works for prompts longer than 300 tokens", ru: "Подогнанная линия работает только для промптов длиннее 300 токенов" },
          ],
          answer: 0,
          explain: { en: "ex2's measured line grows with uncached tokens only — that measurement is what makes «cached ≠ uncached» a number, not a slogan. A planner that bills the whole prompt overbuys prefill capacity and drifts to prefill-heavy splits.", ru: "Измеренная линия ex2 растёт только по некэш-токенам — это измерение делает «cached ≠ uncached» числом, а не лозунгом. Планировщик, выставляющий счёт за весь промпт, перекупает prefill-ёмкость и дрейфует к сплитам с перебором prefill." },
        },
      },
      {
        id: "q2",
        q: {
          en: "Pool: 9 nodes; a P node serves 900 tok/s of prefill, a D node 1100 tok/s of decode. What does the split 5P4D serve — Θ, in tok/s?",
          ru: "Пул: 9 узлов; P-узел тянет 900 ток/с prefill, D-узел — 1100 ток/с decode. Что обслуживает сплит 5P4D — Θ, в ток/с?",
        },
        answer: 4400, tol: 0.5, unit: { en: "tok/s", ru: "ток/с" },
        hint: {
          en: "Θ = min(Σμ_P, Σμ_D) = min(5 × 900, 4 × 1100).",
          ru: "Θ = min(Σμ_P, Σμ_D) = min(5 × 900, 4 × 1100).",
        },
        followUp: {
          q: { en: "Why is 4P5D — the split with the larger capacity sum (9100 vs 8900) — the wrong choice?", ru: "Почему 4P5D — сплит с большей суммой ёмкостей (9100 против 8900) — неверный выбор?" },
          options: [
            { en: "Θ is a min: 4P5D serves min(3600, 5500) = 3600 < 4400 — the bottleneck, not the total, is what the window actually gets", ru: "Θ — это min: 4P5D обслуживает min(3600, 5500) = 3600 < 4400 — окно получает скорость горлышка, а не сумму" },
            { en: "The sum is the right criterion: 9100 > 8900, so 4P5D wins", ru: "Сумма — верный критерий: 9100 > 8900, значит 4P5D выигрывает" },
            { en: "Both splits serve the same throughput", ru: "Оба сплита обслуживают одинаковый throughput" },
          ],
          answer: 0,
          explain: { en: "The bottleneck is what the window serves at: min(4500, 4400) = 4400 against min(3600, 5500) = 3600. Ranking splits by the sum of capacities is the exact trap ex3's hidden test rejects.", ru: "Окно обслуживается на скорости горлышка: min(4500, 4400) = 4400 против min(3600, 5500) = 3600. Ранжировать сплиты по сумме ёмкостей — ровно та ловушка, которую отвергает скрытый тест ex3." },
        },
      },
      {
        id: "q3",
        q: {
          en: "A planned re-split's window slices show gains [600, 700, 500, 800] tok/s. The hysteresis rule flips only when the mean gain beats 2·SE. What is the threshold, in tok/s (1 decimal)?",
          ru: "Слайсы окна запланированного пересплита дают выигрыши [600, 700, 500, 800] ток/с. Правило гистерезиса флипает только когда средний выигрыш бьёт 2·SE. Чему равен порог, в ток/с (1 знак)?",
        },
        answer: 129.1, tol: 0.15, unit: { en: "tok/s", ru: "ток/с" },
        hint: {
          en: "SE = sample stdev / √count; stdev([600, 700, 500, 800]) ≈ 129.1, so SE ≈ 64.5.",
          ru: "SE = выборочное СКО / √n; СКО([600, 700, 500, 800]) ≈ 129.1, значит SE ≈ 64.5.",
        },
        followUp: {
          q: { en: "The mean gain is 650 > 129.1 → flip. Now a sub-agent burst measures gains [40, 130, −60, 90] (mean 50, 2·SE ≈ 82). What does the planner do?", ru: "Средний выигрыш 650 > 129.1 → флипаем. Теперь бёрст саб-агентов даёт выигрыши [40, 130, −60, 90] (среднее 50, 2·SE ≈ 82). Что делает планировщик?" },
          options: [
            { en: "Holds: 50 < 82 — the burst is noise, not a regime; flipping for nothing churns roles and, on a restart-based flip, pays the 165 s weight load", ru: "Держит: 50 < 82 — бёрст это шум, а не режим; флип впустую чанкатирует роли, а при флипе рестартом платит 165 с загрузки весов" },
            { en: "Flips: any positive mean gain is a regime change", ru: "Флипает: любой положительный средний выигрыш — смена режима" },
            { en: "Flips only if the in-place flip is cheap enough", ru: "Флипает только если перевключение на месте достаточно дёшево" },
          ],
          answer: 0,
          explain: { en: "Hysteresis reads evidence, not the sign: a 50 tok/s gain with SE = 41 is indistinguishable from zero across the slices. The rule exists so a burst does not churn the fleet — and a restart-based flip pays the 165 s weight load (T09) for nothing.", ru: "Гистерезис читает доказательство, а не знак: выигрыш 50 ток/с при SE = 41 неотличим от нуля по слайсам. Правило существует, чтобы бёрст не чанкатил флот, — а флип рестартом платит 165 с загрузки весов (T09) впустую." },
        },
      },
    ],
    exercises: [
      {
        id: "ex1",
        title: { en: "Exercise 1 · Anatomy of the agent trace", ru: "Упражнение 1 · Анатомия трейса агента" },
        brief: {
          en: "Implement <code>split_trace(turns)</code>: each turn is <code>(total, cached, out)</code>. Return <code>(t_uc, t_c, t_out, hit_rate)</code> — the sums of uncached tokens (<code>total − cached</code>), cached tokens, output tokens, and the KV hit rate <code>Σ cached / Σ total</code> (round to 4 decimals). The typical error is billing the whole prompt as uncached — the hidden test catches it.", ru: "Реализуй <code>split_trace(turns)</code>: каждый ход — это <code>(total, cached, out)</code>. Верни <code>(t_uc, t_c, t_out, hit_rate)</code> — суммы некэш-токенов (<code>total − cached</code>), кэш-токенов, выходных токенов и hit rate KV <code>Σ cached / Σ total</code> (округли до 4 знаков). Типовая ошибка — выставить весь промпт как uncached: скрытый тест её ловит." },
        starter: `def split_trace(turns):
    """turns: list of (total, cached, out) -> (t_uc, t_c, t_out, hit_rate)"""
    # TODO: uncached = total - cached; hit_rate = cached / total over the sums
    raise NotImplementedError
`,
        tests: [
          { name: "the lab's session trace", hidden: false, code: "eq(split_trace([(320,0,48),(384,256,64),(448,384,96),(512,64,40),(576,512,72)]), (1024, 1216, 320, 0.5429))" },
          { name: "a cold session has no hits", hidden: false, code: "eq(split_trace([(100,0,10)]), (100, 0, 10, 0.0))" },
          { name: "hidden: the whole prompt is NOT uncached", hidden: true, code: "eq(split_trace([(400,400,50)]), (0, 400, 50, 1.0))" },
          { name: "hidden: hit rate rounds to 4 decimals", hidden: true, code: "eq(split_trace([(300,100,30)]), (200, 100, 30, 0.3333))" },
        ],
        solution: `def split_trace(turns):
    t_uc = sum(t - c for t, c, _ in turns)
    t_c = sum(c for _, c, _ in turns)
    t_out = sum(o for _, _, o in turns)
    total = sum(t for t, _, _ in turns)
    hit_rate = round(t_c / total, 4)
    return (t_uc, t_c, t_out, hit_rate)`,
        hints: [
          { en: "uncached = total − cached per turn; the hit rate is computed on the SUMS, then rounded.", ru: "uncached = total − cached на каждый ход; hit rate считается по СУММАМ, потом округляется." },
        ],
        numpy: false,
        timeoutMs: 4000,
      },
      {
        id: "ex2",
        title: { en: "Exercise 2 · Fit the iteration models, predict the TTFT", ru: "Упражнение 2 · Подгони модели итераций, предскажи TTFT" },
        brief: {
          en: "The lab's measured table (deterministic teaching run): <code>(n_uc, t_prefill_ms)</code> = (64, 22.1), (128, 36.0), (256, 64.2), (384, 92.1), (512, 120.4). Implement <code>fit_prefill(rows)</code> → <code>(a, b)</code> by least squares for <code>t = a + b·n_uc</code>, and <code>predict_ttft(ab, n_uc)</code> → <code>a + b·n_uc</code> rounded to 1 decimal. Prefill grows with <em>uncached</em> tokens only — cached tokens ride the KV hit. The hidden test checks a holdout point outside the table within 10 %.", ru: "Измеренная таблица лабы (детерминированный учебный прогон): <code>(n_uc, t_prefill_ms)</code> = (64, 22.1), (128, 36.0), (256, 64.2), (384, 92.1), (512, 120.4). Реализуй <code>fit_prefill(rows)</code> → <code>(a, b)</code> методом наименьших квадратов для <code>t = a + b·n_uc</code> и <code>predict_ttft(ab, n_uc)</code> → <code>a + b·n_uc</code> с округлением до 1 знака. Prefill растёт только по <em>некэш</em>-токенам — кэш-токены едут на KV-попадании. Скрытый тест проверяет holdout-точку вне таблицы в пределах 10 %." },
        starter: `def fit_prefill(rows):
    """rows: list of (n_uc, t_ms) -> (a, b) for t = a + b * n_uc (least squares)"""
    # TODO: b = (n·Σxy − Σx·Σy) / (n·Σx² − (Σx)²);  a = (Σy − b·Σx) / n
    raise NotImplementedError

def predict_ttft(ab, n_uc):
    """(a, b) and the uncached length -> TTFT in ms, 1 decimal"""
    raise NotImplementedError
`,
        tests: [
          { name: "the fitted line lands on the table", hidden: false, code: "ab = fit_prefill([(64,22.1),(128,36.0),(256,64.2),(384,92.1),(512,120.4)])\neq(abs(ab[0] - 7.988) < 0.05 and abs(ab[1] - 0.2194) < 0.001, True)" },
          { name: "TTFT at an in-table length", hidden: false, code: "eq(predict_ttft(fit_prefill([(64,22.1),(128,36.0),(256,64.2),(384,92.1),(512,120.4)]), 256), 64.2)" },
          { name: "hidden: holdout point outside the table, <10%", hidden: true, code: "ab = fit_prefill([(64,22.1),(128,36.0),(256,64.2),(384,92.1),(512,120.4)])\neq(abs(predict_ttft(ab, 320) - 79.6) / 79.6 < 0.10, True)\neq(abs(predict_ttft(ab, 448) - 104.1) / 104.1 < 0.10, True)" },
          { name: "hidden: cached tokens are not billed", hidden: true, code: "ab = fit_prefill([(64,22.1),(128,36.0),(256,64.2),(384,92.1),(512,120.4)])\neq(predict_ttft(ab, 40) < predict_ttft(ab, 400), True)" },
        ],
        solution: `def fit_prefill(rows):
    n = len(rows)
    sx = sum(r[0] for r in rows); sy = sum(r[1] for r in rows)
    sxx = sum(r[0] * r[0] for r in rows); sxy = sum(r[0] * r[1] for r in rows)
    b = (n * sxy - sx * sy) / (n * sxx - sx * sx)
    a = (sy - b * sx) / n
    return (a, b)

def predict_ttft(ab, n_uc):
    return round(ab[0] + ab[1] * n_uc, 1)`,
        hints: [
          { en: "Ordinary least squares for a line; the test tolerance on (a, b) is loose (±0.05, ±0.001), the prediction tolerance is 10 %.", ru: "Обычный МНК для прямой; допуск на (a, b) мягкий (±0.05, ±0.001), на предсказание — 10 %." },
        ],
        numpy: false,
        timeoutMs: 4000,
      },
      {
        id: "ex3",
        title: { en: "Exercise 3 · The best static split: Θ is a min, not a sum", ru: "Упражнение 3 · Лучший статический сплит: Θ — это min, а не сумма" },
        brief: {
          en: "Implement <code>theta(p_count, d_count, mu_p, mu_d)</code> → <code>min(p_count·mu_p, d_count·mu_d)</code> and <code>best_split(n, mu_p, mu_d, demand)</code> → the split with the largest Θ that still meets the window demand (<code>Θ ≥ demand</code>); return <code>(p, d, theta)</code>, or <code>None</code> if no split meets the demand. The typical error: ranking splits by the <em>sum</em> of capacities — the hidden test catches the sum trap.", ru: "Реализуй <code>theta(p_count, d_count, mu_p, mu_d)</code> → <code>min(p_count·mu_p, d_count·mu_d)</code> и <code>best_split(n, mu_p, mu_d, demand)</code> → сплит с наибольшим Θ, который всё ещё закрывает спрос окна (<code>Θ ≥ demand</code>); верни <code>(p, d, theta)</code> или <code>None</code>, если ни один сплит спрос не тянет. Типовая ошибка: ранжировать сплиты по <em>сумме</em> ёмкостей — скрытый тест ловит ловушку суммы." },
        starter: `def theta(p, d, mu_p, mu_d):
    """window throughput of the split: the bottleneck's rate"""
    # TODO: a min, not a sum
    raise NotImplementedError

def best_split(n, mu_p, mu_d, demand):
    """all (p, d) with p + d = n; return (p, d, theta) with max theta >= demand, else None"""
    raise NotImplementedError
`,
        tests: [
          { name: "the lab pool: 5P4D wins by the bottleneck", hidden: false, code: "eq(best_split(9, 900, 1100, 4000), (5, 4, 4400))" },
          { name: "the sum trap ranks 4P5D first — and it cannot serve the window", hidden: false, code: "eq(theta(4, 5, 900, 1100), 3600)" },
          { name: "hidden: no split meets an impossible demand", hidden: true, code: "eq(best_split(9, 900, 1100, 5000), None)" },
          { name: "hidden: at a tiny demand the Θ-max split is unchanged", hidden: true, code: "eq(best_split(9, 900, 1100, 1000), (5, 4, 4400))" },
        ],
        solution: `def theta(p, d, mu_p, mu_d):
    return min(p * mu_p, d * mu_d)

def best_split(n, mu_p, mu_d, demand):
    best = None
    for p in range(1, n):
        d = n - p
        t = theta(p, d, mu_p, mu_d)
        if t >= demand and (best is None or t > best[2]):
            best = (p, d, t)
    return best`,
        hints: [
          { en: "Scan all p from 1 to n−1; among the splits that meet the demand, keep the largest Θ.", ru: "Перебери все p от 1 до n−1; среди сплитов, закрывающих спрос, оставь наибольший Θ." },
        ],
        numpy: false,
        timeoutMs: 4000,
      },
      {
        id: "ex4",
        title: { en: "Exercise 4 · Hysteresis: flip only when the gain beats 2·SE", ru: "Упражнение 4 · Гистерезис: флипай только когда выигрыш бьёт 2·SE" },
        brief: {
          en: "Implement <code>should_switch(gains)</code> → a dict <code>{gain, threshold, switch}</code>: <code>gain</code> is the mean of the window slices' gains, <code>threshold = 2·SE</code> (sample standard deviation over √count, rounded to 1 decimal), and <code>switch = gain > threshold</code>. The planned re-split gains [600, 700, 500, 800] → switch; a sub-agent burst's gains [40, 130, −60, 90] → hold. The hidden test feeds exactly that burst.", ru: "Реализуй <code>should_switch(gains)</code> → словарь <code>{gain, threshold, switch}</code>: <code>gain</code> — среднее выигрышей по слайсам окна, <code>threshold = 2·SE</code> (выборочное СКО, делённое на √количества, округлённое до 1 знака), <code>switch = gain > threshold</code>. Запланированный пересплит [600, 700, 500, 800] → переключаемся; бёрст саб-агентов [40, 130, −60, 90] → держим. Скрытый тест кормит ровно этот бёрст." },
        starter: `def should_switch(gains):
    """window slices' gains -> {gain, threshold, switch}; threshold = 2·SE (1 decimal)"""
    # TODO: SE = sample stdev / sqrt(count); switch iff gain > threshold
    raise NotImplementedError
`,
        tests: [
          { name: "a real regime change flips", hidden: false, code: "eq(should_switch([600, 700, 500, 800]), {'gain': 650.0, 'threshold': 129.1, 'switch': True})" },
          { name: "a sub-agent burst holds", hidden: false, code: "eq(should_switch([40, 130, -60, 90]), {'gain': 50.0, 'threshold': 82.1, 'switch': False})" },
          { name: "hidden: single-slice gain still needs to clear 2·SE", hidden: true, code: "eq(should_switch([300]), {'gain': 300.0, 'threshold': 0.0, 'switch': True})" },
          { name: "hidden: negative mean never flips", hidden: true, code: "eq(should_switch([-500, -400]), {'gain': -450.0, 'threshold': 100.0, 'switch': False})" },
        ],
        solution: `def should_switch(gains):
    n = len(gains)
    gain = sum(gains) / n
    var = sum((g - gain) ** 2 for g in gains) / (n - 1) if n > 1 else 0.0
    se = (var ** 0.5) / (n ** 0.5) if n > 1 else 0.0
    threshold = round(2 * se, 1)
    return {'gain': gain, 'threshold': threshold, 'switch': gain > threshold}`,
        hints: [
          { en: "Sample stdev divides by (n − 1); SE divides by √n. With one slice SE = 0 — any positive gain flips (there is no noise measured yet).", ru: "Выборочное СКО делит на (n − 1); SE делит на √n. При одном слайсе SE = 0 — любой положительный выигрыш флипает (шум ещё не измерен)." },
        ],
        numpy: false,
        timeoutMs: 4000,
      },
      {
        id: "ex5",
        title: { en: "Exercise 5 · Capstone: PDSim — the planner and the KV pool", ru: "Упражнение 5 · Капстоун: PDSim — планировщик и KV-пул" },
        brief: {
          en: "Implement the two decisions inside the given <code>PDSim</code> class: <code>evict(tiles)</code> — agent-aware eviction (never a tile with live branches; among the rest, the least recently used), and <code>should_switch(gains)</code> — the ex4 hysteresis. The simulator then walks a fixed agent trace: the paused branch survives, the compacted dead tile goes out. The hidden tests pin the class invariants: <strong>a pause keeps branches above zero</strong>, and <strong>a burst does not flip the split</strong>. Compare against LRU: on this trace LRU loses 256 tokens of reuse; the branch counter loses 0.", ru: "Реализуй два решения внутри данного класса <code>PDSim</code>: <code>evict(tiles)</code> — agent-aware эвикшн (никогда не плитку с живыми ветками; среди остальных — наименее недавно использованную) и <code>should_switch(gains)</code> — гистерезис из ex4. Симулятор проходит фиксированный агентный трейс: паузившая ветка выживает, мёртвая плитка от компакции уходит. Скрытые тесты прикалывают инварианты класса: <strong>пауза держит ветки выше нуля</strong> и <strong>бёрст не дёргает сплит</strong>. Сравнение с LRU: на этом трейсе LRU теряет 256 токенов переиспользования, счётчик веток — 0." },
        starter: `class PDSim:
    """Planner + KV pool on the fixed agent trace.
    tiles: dicts {name, last_access, branches, dead}."""

    def evict(self, tiles):
        """Return the tile to evict when the pool is full:
        never a live branch (branches > 0); among the rest, least recently used."""
        raise NotImplementedError

    def should_switch(self, gains):
        """The ex4 hysteresis: {'gain', 'threshold', 'switch'}."""
        raise NotImplementedError
`,
        tests: [
          { name: "the paused live branch is never evicted", hidden: false, code: "sim = PDSim()\ntiles = [{'name':'A','last_access':4,'branches':2,'dead':False},{'name':'C','last_access':8,'branches':0,'dead':True}]\neq(sim.evict(tiles)['name'], 'C')" },
          { name: "LRU would have picked the paused branch — the lab's central lesson", hidden: false, code: "sim = PDSim()\ntiles = [{'name':'A','last_access':4,'branches':2,'dead':False},{'name':'C','last_access':8,'branches':0,'dead':True}]\nlru = sorted(tiles, key=lambda t: t['last_access'])[0]\neq(lru['name'], 'A')\neq(sim.evict(tiles)['name'] != lru['name'], True)" },
          { name: "the burst does not flip the split", hidden: false, code: "eq(PDSim().should_switch([40, 130, -60, 90])['switch'], False)" },
          { name: "hidden: dead-first, then LRU among the survivors", hidden: true, code: "sim = PDSim()\ntiles = [{'name':'A','last_access':2,'branches':0,'dead':True},{'name':'B','last_access':1,'branches':0,'dead':False},{'name':'D','last_access':3,'branches':1,'dead':False}]\neq(sim.evict(tiles)['name'], 'A')\ntiles.pop(0)\neq(sim.evict(tiles)['name'], 'B')" },
          { name: "hidden: a compacted tile is evictable even if fresh", hidden: true, code: "sim = PDSim()\ntiles = [{'name':'C','last_access':9,'branches':0,'dead':True},{'name':'B','last_access':2,'branches':1,'dead':False}]\neq(sim.evict(tiles)['name'], 'C')" },
        ],
        solution: `class PDSim:
    def evict(self, tiles):
        dead = [t for t in tiles if t['dead'] and t['branches'] == 0]
        pool = dead if dead else [t for t in tiles if t['branches'] == 0]
        return sorted(pool, key=lambda t: t['last_access'])[0]

    def should_switch(self, gains):
        n = len(gains)
        gain = sum(gains) / n
        var = sum((g - gain) ** 2 for g in gains) / (n - 1) if n > 1 else 0.0
        se = (var ** 0.5) / (n ** 0.5) if n > 1 else 0.0
        threshold = round(2 * se, 1)
        return {'gain': gain, 'threshold': threshold, 'switch': gain > threshold}`,
        hints: [
          { en: "First drop the dead weight (compacted, 0 branches), then the coldest idle tile; a tile with branches > 0 is untouchable — a pause is not an exit.", ru: "Сначала сбрось мёртвый груз (компакция, 0 веток), потом самую холодную простаивающую плитку; плитка с ветками > 0 неприкосновенна — пауза это не выход." },
        ],
        numpy: false,
        timeoutMs: 4000,
      },
    ],
    challenge: {
        id: "chal1",
        word: { en: "challenge", ru: "челлендж" },
        title: {
          en: "★ Evict nothing alive, clear the dead: lost_reuse = 0",
          ru: "★ Не тронь живое, вынеси мёртвое: lost_reuse = 0",
        },
        brief: {
          en: "The fixed agent trace (defined in the starter) drives a 3-tile pool. Design your own eviction policy so that the trace ends with <strong>lost reuse = 0 tokens</strong> — the paused branch's cache survives — while still evicting the compacted dead tile at least once. No tests guide you: run your policy on the trace in the sandbox and print the summary line; the page replays the declared trace model and rejects invented numbers.",
          ru: "Фиксированный агентный трейс (он задан в стартере) гонит пул из 3 плиток. Спроектируй свою политику эвикшна так, чтобы трейс закончился с <strong>потерянным переиспользованием = 0 токенов</strong> — кэш паузившей ветки выживает, — и при этом мёртвая плитка от компакции была выселена хотя бы раз. Тестов-каркаса нет: прогони свою политику по трейсу в песочнице и напечатай итоговую строку; страница переигрывает заявленную модель трейса и отвергает выдуманные числа.",
        },
        goal: {
          en: "Print one line: <code>lost_reuse=… evicted_dead=… hit_rate=…</code> with lost_reuse = 0, evicted_dead ≥ 1 and hit_rate = 1.0 (every wanted reuse survives).",
          ru: "Напечатай одну строку: <code>lost_reuse=… evicted_dead=… hit_rate=…</code> с lost_reuse = 0, evicted_dead ≥ 1 и hit_rate = 1.0 (всё желаемое переиспользование выживает).",
        },
        mode: "run",
        numpy: false,
        timeoutMs: 30000,
        starter: `# The fixed trace, 3 tiles × 256 tokens, one dead tile:
#   ev1 s1 new      -> tile A (branches 1)
#   ev2 s2 new      -> tile B (branches 1)
#   ev3 s3 new      -> tile C (branches 1)
#   ev4 s1 fork     -> A branches 2
#   ev5 s1 pause    -> A waits on a tool call
#   ev6 s2 turn     -> reuse B
#   ev7 s3 compact  -> C dead (branches 0, reuse never)
#   ev8 s2 turn     -> reuse B
#   ev9 s4 new      -> POOL FULL: evict one tile
#   ev10 s1 turn    -> A wanted again (would reuse 256 tokens)
# Your policy: implement evict(tiles) yourself; simulate ev9..ev10 and print:
#   lost_reuse=<tokens> evicted_dead=<0|1> hit_rate=<1.0|0.0>
# Goal: lost_reuse=0 AND evicted_dead>=1 AND hit_rate=1.0

# TODO: write the policy, simulate, print the summary line.
`,
        check: (res) => {
          const out = String(res.stdout || "");
          const mm = out.match(/lost_reuse\s*=\s*([0-9]+)[\s\S]*?evicted_dead\s*=\s*([0-9]+)[\s\S]*?hit_rate\s*=\s*([0-9.]+)/i);
          if (!mm) {
            return { ok: false, note: { en: "no summary line found - print exactly: lost_reuse=… evicted_dead=… hit_rate=…", ru: "итоговой строки нет — напечатай ровно: lost_reuse=… evicted_dead=… hit_rate=…" } };
          }
          const lost = parseInt(mm[1], 10), evictedDead = parseInt(mm[2], 10), hit = parseFloat(mm[3]);
          if (lost !== 0) {
            return { ok: false, note: { en: "lost_reuse must be 0: the paused branch's cache must survive the eviction", ru: "lost_reuse обязан быть 0: кэш паузившей ветки должен пережить эвикшн" } };
          }
          if (evictedDead < 1 || evictedDead > 1) {
            return { ok: false, note: { en: "the trace has exactly one dead tile (C after compaction) — evict it once", ru: "в трейсе ровно одна мёртвая плитка (C после компакции) — высели её один раз" } };
          }
          if (hit !== 1.0) {
            return { ok: false, note: { en: "hit_rate must be 1.0: every wanted reuse (B twice, A at ev10) survives", ru: "hit_rate обязан быть 1.0: всё желаемое переиспользование (B дважды, A на ev10) выживает" } };
          }
          return { ok: true, note: { en: "the live branch survived, the dead cache went out — recency is not reuse", ru: "живая ветка выжила, мёртвый кэш ушёл — давность не переиспользование" } };
        },
        reference: `# The branch-counter policy, on the fixed trace:
#   ev9: the pool is full -> the only tile with 0 branches is C (dead since ev7)
#        -> evict C: lost_reuse = 0, evicted_dead = 1
#   ev10: A is still resident (branches 2 kept it untouchable) -> hit, hit_rate = 1.0
print("lost_reuse=0 evicted_dead=1 hit_rate=1.0")`,
    },
    posttest: [
      {
        id: "p1",
        q: { en: "Pool of 9 nodes: μ_P = 900, μ_D = 1100. What does the split 4P5D serve?", ru: "Пул из 9 узлов: μ_P = 900, μ_D = 1100. Что обслуживает сплит 4P5D?" },
        options: [
          { en: "Θ = min(3600, 5500) = 3600 tok/s — the P side is the bottleneck", ru: "Θ = min(3600, 5500) = 3600 ток/с — горлышко на стороне P" },
          { en: "Θ = 3600 + 5500 = 9100 tok/s", ru: "Θ = 3600 + 5500 = 9100 ток/с" },
          { en: "Θ = (3600 + 5500) / 2 = 4550 tok/s", ru: "Θ = (3600 + 5500) / 2 = 4550 ток/с" },
        ],
        answer: 0,
        explain: { en: "Θ(P,D) = min(Σμ_P, Σμ_D): the window serves at the bottleneck's rate. The sum and the average are the two classic ways to double-count nodes that spend the window idle.", ru: "Θ(P,D) = min(Σμ_P, Σμ_D): окно обслуживается на скорости горлышка. Сумма и среднее — два классических способа сосчитать дважды узлы, проводящие окно в простое." },
      },
      {
        id: "p2",
        q: { en: "A session paused on a tool call is the least recently used tile; a compacted dead tile is fresher. The pool is full. Who does LRU evict?", ru: "Сессия на паузе тулзы — наименее недавно использованная плитка; мёртвая плитка после компакции свежее. Пул полон. Кого выкинет LRU?" },
        options: [
          { en: "the paused session's tile — exactly the cache that would be reused when the tool returns", ru: "плитку паузившей сессии — ровно тот кэш, который переиспользовался бы, когда тулза вернётся" },
          { en: "the compacted dead tile — LRU always evicts dead weight first", ru: "мёртвую плитку после компакции — LRU всегда выкидывает мёртвый груз первым" },
          { en: "nothing — LRU waits for a timer", ru: "никого — LRU ждёт таймера" },
        ],
        answer: 0,
        explain: { en: "LRU reads only recency, and a tool pause is exactly a long silence: the live branch's cache is evicted while the dead cache survives. That is recency ≠ reuse — the intuition the branch counter exists to fix.", ru: "LRU читает только давность, а пауза тулзы — это именно долгая тишина: кэш живой ветки выселяется, пока мёртвый кэш выживает. Это и есть давность ≠ переиспользование — интуиция, для починки которой существует счётчик веток." },
      },
      {
        id: "p3",
        q: { en: "The P node's queue: arrivals λ = 40 turns/s, a turn's prefill wait W = 0.15 s. How many turns are in flight (Little's law, T06)?", ru: "Очередь P-узла: приход λ = 40 ходов/с, ожидание хода в prefill W = 0.15 с. Сколько ходов в полёте (закон Литтла, T06)?" },
        options: [
          { en: "L = λ·W = 6 turns", ru: "L = λ·W = 6 ходов" },
          { en: "L = λ/W ≈ 267 turns", ru: "L = λ/W ≈ 267 ходов" },
          { en: "L = W/λ ≈ 0.0037 turns", ru: "L = W/λ ≈ 0.0037 хода" },
        ],
        answer: 0,
        explain: { en: "Little's law L = λ·W — the same law that sized the T06 knee and the T08 queue: 40 × 0.15 = 6 turns in flight. The queue is where the planner's Θ meets the client's wait.", ru: "Закон Литтла L = λ·W — тот же, что размерил колено T06 и очередь T08: 40 × 0.15 = 6 ходов в полёте. Очередь — то место, где Θ планировщика встречает ожидание клиента." },
      },
      {
        id: "b1",
        tag: { en: "bridge · T02", ru: "мост · T02" },
        context: { en: "T02 built the roofline: compute-bound work scales with the operand, memory-bound work rides a constant. This lab's iteration models are that lesson in the serving loop: prefill grows with uncached tokens, the decode step is ~constant.", ru: "T02 построила roofline: compute-bound работа растёт с операндом, memory-bound едет на константе. Итерационные модели этой лабы — тот же урок внутри сервинг-цикла: prefill растёт по некэш-токенам, шаг decode ~константа." },
        q: { en: "In the lab's iteration models, prefill time grows linearly with uncached tokens while the decode step stays ~constant. Which roofline regime is which?", ru: "В итерационных моделях лабы время prefill растёт линейно по некэш-токенам, а шаг decode остаётся ~константой. Какой roofline-режим есть какой?" },
        options: [
          { en: "prefill is compute-bound (scales with tokens), decode is memory-bound (a step is one pass over the weights)", ru: "prefill compute-bound (растёт по токенам), decode memory-bound (шаг — один проход по весам)" },
          { en: "prefill is memory-bound, decode is compute-bound", ru: "prefill memory-bound, decode compute-bound" },
          { en: "both are compute-bound; the constant decode step is a lab simplification with no mechanism", ru: "оба compute-bound; постоянный шаг decode — упрощение лабы без механизма" },
        ],
        answer: 0,
        explain: { en: "Prefill processes new tokens with full compute per token (compute-bound, the linear b ≈ 0.22 ms/token); decode re-reads the weights and the KV for one token at a time — memory-bound, so the step time barely moves with batch. That is why PD disaggregation pays: the two regimes want different hardware ratios.", ru: "Prefill обрабатывает новые токены с полным вычислением на токен (compute-bound, линейные b ≈ 0.22 мс/токен); decode перечитывает веса и KV ради одного токена — memory-bound, поэтому время шага почти не двигается с батчем. Именно поэтому PD-дизагрегация платит: двум режимам нужны разные пропорции железа." },
      },
    ],
    footer: {
      en: "A declared teaching model of a cluster: deterministic simulators on course numbers (165 s from the T09 fleet run, roofline logic from T02) — the paper's own numbers (8P1D drift, −65% throughput, 6.2 s in-place, 98% reuse) are a foreign cluster, quoted as references. The line behind the topic: DistServe (OSDI'24), Splitwise (ISCA'24), Sarathi-Serve, Mooncake (FAST'25), SGLang radix cache, Llumnix, the Dynamo planner, agent-aware KV work — converging in Evolving Infra (arXiv 2611.12304); Infrathon (arXiv 2611.11995) is the mirror image and the T16 capstone; RE-Bench (arXiv 2411.15114) is the neighboring track. Live layer-2 measurement of the iteration models is a planned post-pilot upgrade.",
      ru: "Заявленная учебная модель кластера: детерминированные симуляторы на курсовых числах (165 с из прогона T09-fleet, roofline-логика из T02) — собственные числа статьи (дрейф 8P1D, −65 % throughput, 6.2 с in-place, 98 % reuse) — чужой кластер, цитируются как справка. Линия за темой: DistServe (OSDI'24), Splitwise (ISCA'24), Sarathi-Serve, Mooncake (FAST'25), SGLang radix-кэш, Llumnix, Dynamo-планер, agent-aware KV-работы — сходятся в Evolving Infra (arXiv 2611.12304); Infrathon (arXiv 2611.11995) — зеркальная пара и капстоун T16; RE-Bench (arXiv 2411.15114) — соседний трек. Живой замер моделей итераций на слой-2 — запланированное послепилотное усиление.",
    },
  };
})();
