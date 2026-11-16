/* Lab 11 — Kubernetes for LLM serving: pods, probes and Helm.
   Content module for the generic lab page (window.LABS_CONTENT['11']).
   Kubernetes taught as a vocabulary over what the student already ran:
   compose fleet (T08–T09), pod ledger (T10), declared controllers simulated
   deterministically in the browser sandbox. Practice only, never evidence. */
(function () {
  "use strict";
  window.LABS_CONTENT = window.LABS_CONTENT || {};

  LABS_CONTENT["11"] = {
    title: {
      en: "Kubernetes for LLM serving: pods, probes and Helm",
      ru: "Kubernetes для LLM-сервинга: поды, пробы и Helm",
    },
    sub: {
      en: "Turn the ledger into a pod spec, gate readiness on the weight load, roll a release without dipping capacity — then drive Helm revisions and roll back.",
      ru: "Преврати ledger в спецификацию пода, гейтни готовность по загрузке весов, прокати релиз без ямы в ёмкости — а потом поведай историю Helm-ревизий и откатись.",
    },
    intro: {
      en: `<p>Kubernetes runs your fleet the way you already ran it in T09 — only declared. You state the <strong>desired state</strong> (how many pods, how much memory each, when a pod counts as ready), and controllers make reality match the declaration and keep it there. In compose you wrote <code>restart: on-failure</code> and restarted containers by hand; here a <strong>Deployment</strong> watches replicas for you, and a <strong>pod</strong> is one running engine together with its limits — exactly the container with a memory cap you raised in T09.</p>
<p>For LLM engines the vocabulary has to be more precise than for web apps. A pod loads weights first (T09's named members: extract + weight loading + init + <code>/health</code>), so it is <strong>not ready</strong> until the load finishes — that is what the startup/readiness probe gates. The pod's memory is the T10 ledger (weights + KV + fixed). And updating an engine is not the same as updating a stateless service: while the new pod loads weights, the old ones carry the capacity — the lesson behind <code>maxUnavailable 0, maxSurge 1</code>.</p>
<p>You have no real cluster, and none is needed: the lab drills the vocabulary and controller arithmetic on deterministic simulators in the sandbox. The numbers are this course's numbers: the pod ledger from T10, the 165 s cold start measured live by the T09-fleet run. The GPU Operator appears as vocabulary — what it installs (driver container, container toolkit, device plugin) and how one GPU is shared (time-slicing: logical replicas without memory isolation; MIG: hardware slices with isolation) — not as something you install here.</p>
<p>The lab habit: predict from the declared model, then let the tests check it — the model is printed in full, as always.</p>`,
      ru: `<p>Kubernetes управляет твоим флотом так же, как ты сам управлял им в T09 — только декларативно. Ты объявляешь <strong>желаемое состояние</strong> (сколько подов, сколько памяти каждому, когда под считается готовым), а контроллеры приводят реальность к объявлению и держат её там. В compose ты писал <code>restart: on-failure</code> и рестартовал контейнеры руками; здесь <strong>Deployment</strong> следит за репликами сам, а <strong>под</strong> — это один запущенный движок вместе со своими лимитами: ровно тот контейнер с потолком памяти, что ты поднимал в T09.</p>
<p>Для LLM-движков словарь приходится проговаривать точнее, чем для веб-приложений. Под сначала грузит веса (именованные члены из T09: extract + загрузка весов + init + <code>/health</code>), поэтому он <strong>не готов</strong>, пока груз не кончился, — это и гейтит startup/readiness-проба. Память пода — ledger из T10 (веса + KV + фикс). И обновлять движок — не то же самое, что обновлять stateless-сервис: пока новый под грузит веса, старые держат ёмкость, — за этим стоит <code>maxUnavailable 0, maxSurge 1</code>.</p>
<p>Настоящего кластера у тебя нет, и он не нужен: лаба тренирует словарь и арифметику контроллеров на детерминированных симуляторах в песочнице. Числа — курсовые: ledger пода из T10, холодный старт 165 с из живого прогона T09-fleet. GPU Operator присутствует как словарь — что он ставит (контейнер драйвера, container toolkit, device plugin) и как делят один GPU (time-slicing: логические реплики без изоляции памяти; MIG: аппаратные слайсы с изоляцией), — но не как установка.</p>
<p>Привычка лабы: сначала предскажи по заявленной модели, потом дай тестам проверить, — модель напечатана целиком, как всегда.</p>`,
    },
    heroTag: { en: "pods, probes, helm revisions", ru: "поды, пробы, helm-ревизии" },
    glossary: [
      [{ en: "pod", ru: "под" }, { en: "one running engine + its limits; in compose it was one container with mem_limit.", ru: "один запущенный движок + его лимиты; в compose это был один контейнер с mem_limit." }],
      [{ en: "Deployment", ru: "Deployment" }, { en: "declaration: how many pod replicas to keep alive; the controller keeps them (in compose you restarted by hand).", ru: "объявление: сколько реплик пода держать живыми; контроллер следит сам (в compose ты рестартовал руками)." }],
      [{ en: "replica", ru: "реплика" }, { en: "one pod of a Deployment; the T10 fleet cut into identical instances.", ru: "один под из набора Deployment; флот из T10, нарезанный одинаковыми экземплярами." }],
      [{ en: "Service", ru: "Service" }, { en: "a stable address for the fleet: clients hit one name, not changing pod IPs (lab08's gateway was exactly such a stable 127.0.0.1:8760).", ru: "стабильный адрес флота: клиенты бьют в одно имя, а не в меняющиеся IP подов (шлюз lab08 был таким же стабильным 127.0.0.1:8760)." }],
      [{ en: "requests / limits", ru: "requests / limits" }, { en: "how much memory/GPU a pod asks for and may use at most; the limit is the same cgroup cap as T09's mem_limit.", ru: "сколько памяти/GPU под просит и сколько ему максимум можно; лимит — тот же cgroup-потолок, что mem_limit в T09." }],
      [{ en: "QoS Guaranteed", ru: "QoS Guaranteed" }, { en: "requests == limits: the lowest eviction priority; for weight-bearing pods it is the mandatory setting.", ru: "requests == limits: наименьший приоритет выселения; для подов с весами — обязательная настройка." }],
      [{ en: "probe", ru: "проба" }, { en: "the controller's question «is this pod ready for traffic?»; for LLM pods — only after the weights load (T09 members).", ru: "вопрос контроллера «под готов принимать трафик?»; для LLM-пода — только после загрузки весов (члены из T09)." }],
      [{ en: "rollout", ru: "роллаут" }, { en: "the pace of version changes: maxUnavailable — how many old pods may die at once; maxSurge — how many extra new pods may start.", ru: "скорость смены версий: maxUnavailable — сколько старых можно убить сразу; maxSurge — сколько новых поднять сверх набора." }],
      [{ en: "Helm release", ru: "Helm-релиз" }, { en: "chart templates + a values table; every update appends a revision to history; rollback = a NEW revision with old content.", ru: "шаблоны чарта + таблица values; каждое обновление добавляет ревизию в историю; откат = НОВАЯ ревизия со старым содержимым." }],
      [{ en: "GPU Operator", ru: "GPU Operator" }, { en: "a cluster operator that installs the driver container, container toolkit and device plugin so pods can request nvidia.com/gpu.", ru: "оператор кластера: сам ставит контейнер драйвера, container toolkit и device plugin, чтобы поды могли просить nvidia.com/gpu." }],
      [{ en: "time-slicing vs MIG", ru: "time-slicing vs MIG" }, { en: "share one GPU as logical replicas (time-slicing, no memory isolation) or hardware slices (MIG, isolated, Ampere+).", ru: "разделить один GPU на логические реплики (time-slicing, без изоляции памяти) или аппаратные слайсы (MIG, с изоляцией, Ampere+)." }],
    ],
    figures: [
      {
        id: "lab11-manifest-fleet",
        title: { en: "The manifest becomes a fleet behind one Service", ru: "Манифест превращается во флот за одним Service" },
        w: 760, h: 420,
        svg: `<svg viewBox="0 0 760 420" xmlns="http://www.w3.org/2000/svg">
  <g id="g-manifest">
    <rect x="50" y="60" width="300" height="200" rx="10" fill="none" stroke="var(--lab-accent)" stroke-width="2"/>
    <text x="66" y="88" font-size="14" fill="var(--lab-accent)" class="mono">Deployment: llm-engine</text>
    <text x="66" y="114" font-size="14" fill="var(--lab-ink)" class="mono">replicas: 3</text>
    <text x="66" y="140" font-size="14" fill="var(--lab-ink)" class="mono">memory: 21.5 Gi (req = lim)</text>
    <text x="66" y="166" font-size="14" fill="var(--lab-ink)" class="mono">gpu: 1</text>
    <text x="66" y="192" font-size="14" fill="var(--lab-ink)" class="mono">startupProbe: 5 s × 40</text>
    <text x="66" y="222" font-size="13" fill="var(--lab-muted)" data-en="desired state, printed once" data-ru="желаемое состояние, напечатано один раз">desired state, printed once</text>
  </g>
  <g id="g-pods">
    <rect x="430" y="60" width="130" height="56" rx="8" fill="var(--lab-accent)" opacity="0.12"/>
    <rect x="430" y="60" width="130" height="56" rx="8" fill="none" stroke="var(--lab-accent)" stroke-width="1.5"/>
    <text x="445" y="84" font-size="13" fill="var(--lab-ink)" class="mono">pod 0</text>
    <circle cx="542" cy="76" r="5" fill="var(--lab-good)"/>
    <text x="445" y="104" font-size="12" fill="var(--lab-muted)" class="mono">16+4+1.5 Gi</text>
    <rect x="575" y="130" width="130" height="56" rx="8" fill="var(--lab-accent)" opacity="0.12"/>
    <rect x="575" y="130" width="130" height="56" rx="8" fill="none" stroke="var(--lab-accent)" stroke-width="1.5"/>
    <text x="590" y="154" font-size="13" fill="var(--lab-ink)" class="mono">pod 1</text>
    <circle cx="687" cy="146" r="5" fill="var(--lab-good)"/>
    <text x="590" y="174" font-size="12" fill="var(--lab-muted)" class="mono">16+4+1.5 Gi</text>
    <rect x="430" y="204" width="130" height="56" rx="8" fill="var(--lab-accent)" opacity="0.12"/>
    <rect x="430" y="204" width="130" height="56" rx="8" fill="none" stroke="var(--lab-accent)" stroke-width="1.5"/>
    <text x="445" y="228" font-size="13" fill="var(--lab-ink)" class="mono">pod 2</text>
    <circle cx="542" cy="220" r="5" fill="var(--lab-good)"/>
    <text x="445" y="248" font-size="12" fill="var(--lab-muted)" class="mono">16+4+1.5 Gi</text>
    <text x="430" y="290" font-size="13" fill="var(--lab-muted)" data-en="green dot = Ready (probe passed)" data-ru="зелёная точка = Ready (проба прошла)">green dot = Ready (probe passed)</text>
  </g>
  <g id="g-service">
    <rect x="430" y="330" width="280" height="42" rx="9" fill="none" stroke="var(--lab-good)" stroke-width="2"/>
    <text x="570" y="356" text-anchor="middle" font-size="14" fill="var(--lab-good)" class="mono">Service: llm-svc :8000</text>
    <path d="M 495 330 L 495 264" fill="none" stroke="var(--lab-good)" stroke-width="2" class="fig-flow"/>
    <path d="M 620 330 C 660 320 680 240 690 190" fill="none" stroke="var(--lab-good)" stroke-width="2" class="fig-flow"/>
    <path d="M 560 330 L 560 264" fill="none" stroke="var(--lab-good)" stroke-width="2" class="fig-flow"/>
    <text x="60" y="300" font-size="13" fill="var(--lab-muted)" data-en="clients hit one stable name;" data-ru="клиенты бьют в одно стабильное имя;">clients hit one stable name;</text>
    <text x="60" y="320" font-size="13" fill="var(--lab-muted)" data-en="pod IPs may churn underneath" data-ru="IP подов могут меняться под ним">pod IPs may churn underneath</text>
  </g>
  <g id="g-gpu">
    <rect x="50" y="340" width="300" height="56" rx="9" fill="none" stroke="var(--fig-warm)" stroke-width="1.5"/>
    <text x="66" y="362" font-size="13" fill="var(--fig-warm)" class="mono" data-en="time-slicing ×4: no mem isolation" data-ru="time-slicing ×4: без изоляции памяти">time-slicing ×4: no mem isolation</text>
    <text x="66" y="384" font-size="13" fill="var(--lab-muted)" class="mono" data-en="MIG: hardware slices, isolated" data-ru="MIG: аппаратные слайсы, изоляция">MIG: hardware slices, isolated</text>
  </g>
</svg>`,
        stages: [
          { cap: { en: "You declare the desired state once: 3 replicas, ledger-sized memory, one GPU each, a probe budget.", ru: "Желаемое состояние объявляется один раз: 3 реплики, память по ledger, по GPU каждой, бюджет пробы." }, show: ["g-manifest"] },
          { cap: { en: "The controller starts 3 pods; each becomes Ready only after the weights load and the probe passes.", ru: "Контроллер поднимает 3 пода; каждый становится Ready только после загрузки весов и прохождения пробы." }, show: ["g-manifest", "g-pods"] },
          { cap: { en: "One Service fronts the fleet — a stable address while pod IPs churn.", ru: "Один Service закрывает флот — стабильный адрес, пока IP подов меняются." }, show: ["g-manifest", "g-pods", "g-service"] },
          { cap: { en: "Sharing one GPU: time-slicing is logical replicas without isolation; MIG is isolated hardware slices.", ru: "Делёж одного GPU: time-slicing — логические реплики без изоляции; MIG — изолированные аппаратные слайсы." }, show: ["g-pods", "g-service", "g-gpu"] },
        ],
      },
      {
        id: "lab11-rolling-update",
        title: { en: "Rolling update: new Ready before old dies", ru: "Rolling update: новый Ready раньше смерти старого" },
        w: 760, h: 420,
        svg: `<svg viewBox="0 0 760 420" xmlns="http://www.w3.org/2000/svg">
  <g id="g-fleet">
    <text x="60" y="60" font-size="14" fill="var(--lab-muted)" data-en="fleet: 3 pods, capacity floor must stay 3" data-ru="флот: 3 пода, нижняя граница ёмкости — 3">fleet: 3 pods, capacity floor must stay 3</text>
    <rect x="60" y="76" width="150" height="60" rx="8" fill="var(--lab-accent)" opacity="0.14"/>
    <rect x="60" y="76" width="150" height="60" rx="8" fill="none" stroke="var(--lab-accent)" stroke-width="1.5"/>
    <text x="135" y="112" text-anchor="middle" font-size="14" fill="var(--lab-ink)" class="mono">pod 0 ✓</text>
    <rect x="226" y="76" width="150" height="60" rx="8" fill="var(--lab-accent)" opacity="0.14"/>
    <rect x="226" y="76" width="150" height="60" rx="8" fill="none" stroke="var(--lab-accent)" stroke-width="1.5"/>
    <text x="301" y="112" text-anchor="middle" font-size="14" fill="var(--lab-ink)" class="mono">pod 1 ✓</text>
    <rect x="392" y="76" width="150" height="60" rx="8" fill="var(--lab-accent)" opacity="0.14"/>
    <rect x="392" y="76" width="150" height="60" rx="8" fill="none" stroke="var(--lab-accent)" stroke-width="1.5"/>
    <text x="467" y="112" text-anchor="middle" font-size="14" fill="var(--lab-ink)" class="mono">pod 2 ✓</text>
    <text x="60" y="168" font-size="13" fill="var(--lab-muted)" class="mono" data-en="maxUnavailable: 0 · maxSurge: 1" data-ru="maxUnavailable: 0 · maxSurge: 1">maxUnavailable: 0 · maxSurge: 1</text>
  </g>
  <g id="g-surge">
    <rect x="558" y="76" width="150" height="60" rx="8" fill="none" stroke="var(--lab-accent)" stroke-width="1.5" stroke-dasharray="6 4" class="fig-ants"/>
    <text x="633" y="100" text-anchor="middle" font-size="14" fill="var(--lab-ink)" class="mono">pod 3s</text>
    <text x="633" y="122" text-anchor="middle" font-size="12" fill="var(--fig-warm)" data-en="loading weights · 165 s" data-ru="грузит веса · 165 с">loading weights · 165 s</text>
    <text x="60" y="216" font-size="14" fill="var(--lab-ink)" data-en="surge first: the new pod starts loading" data-ru="сначала surge: новый под начинает грузиться">surge first: the new pod starts loading</text>
    <text x="60" y="240" font-size="13" fill="var(--lab-muted)" data-en="until it is Ready, it serves nothing" data-ru="пока не Ready — он не обслуживает ни один запрос">until it is Ready, it serves nothing</text>
  </g>
  <g id="g-swap">
    <rect x="60" y="268" width="648" height="26" rx="6" fill="var(--lab-accent)" opacity="0.16"/>
    <rect x="60" y="268" width="648" height="26" rx="6" fill="none" stroke="var(--lab-good)" stroke-width="1.5"/>
    <text x="60" y="320" font-size="14" fill="var(--lab-good)" data-en="pod 3s turns Ready, THEN pod 0 dies — capacity never dips below 3" data-ru="pod 3s становится Ready, и только потом pod 0 умирает — ёмкость не ниже 3">pod 3s turns Ready, THEN pod 0 dies — capacity never dips below 3</text>
    <circle cx="620" cy="281" r="6" fill="var(--lab-good)" class="fig-pulse"/>
    <text x="60" y="352" font-size="13" fill="var(--lab-muted)" data-en="the floor is replicas − maxUnavailable; surge only adds speed" data-ru="нижняя граница — replicas − maxUnavailable; surge добавляет только скорость">the floor is replicas − maxUnavailable; surge only adds speed</text>
  </g>
  <g id="g-bad">
    <path d="M 60 300 L 200 300 L 230 386 L 330 386 L 360 300 L 708 300" fill="none" stroke="var(--fig-warm)" stroke-width="2.5" class="fig-ghost"/>
    <text x="280" y="378" text-anchor="middle" font-size="13" fill="var(--fig-warm)" class="fig-ghost" data-en="maxUnavailable 2: the dip — app alive, rollout stuck" data-ru="maxUnavailable 2: яма — приложение живо, роллаут завис">maxUnavailable 2: the dip — app alive, rollout stuck</text>
  </g>
</svg>`,
        stages: [
          { cap: { en: "The fleet serves at 3; the rollout must not dip below that.", ru: "Флот обслуживает на трёх; роллаут не должен провалиться ниже." }, show: ["g-fleet"] },
          { cap: { en: "Surge goes first: pod 3s starts, but until it is Ready it serves nothing.", ru: "Сначала surge: pod 3s стартует, но до Ready не обслуживает ни одного запроса." }, show: ["g-fleet", "g-surge"] },
          { cap: { en: "The swap: pod 3s turns Ready, only then pod 0 dies — the floor stays at 3.", ru: "Подмена: pod 3s становится Ready и лишь потом pod 0 умирает — граница держится на 3." }, show: ["g-fleet", "g-surge", "g-swap"] },
          { cap: { en: "maxUnavailable 2 digs the dip: the app works, the rollout is stuck — the failure OpenAI warned about.", ru: "maxUnavailable 2 роет яму: приложение живо, роллаут завис — тот самый провал из доклада OpenAI." }, show: ["g-swap", "g-bad"] },
        ],
      },
    ],
    outcomes: [
      { en: "Size an LLM pod from the ledger and roll a release without dipping capacity (Guaranteed QoS, probe gate, maxUnavailable 0).", ru: "Размерировать LLM-под из ledger и катить релиз без ямы в ёмкости (Guaranteed QoS, гейт пробы, maxUnavailable 0)." },
      { en: "Drive a Helm release history and roll back, knowing a rollback creates a new revision.", ru: "Вести историю Helm-релиза и откатываться, зная, что откат создаёт новую ревизию." },
    ],
    model: [
      [{ en: "pod memory (T10 ledger)", ru: "память пода (ledger из T10)" }, { en: "(16 + 4) / p + 1.5 GiB", ru: "(16 + 4) / p + 1.5 ГиБ" }, { en: "GPU per pod", ru: "GPU на под" }, "nvidia.com/gpu: 1"],
      [{ en: "cold start (T09-fleet run)", ru: "холодный старт (прогон T09-fleet)" }, { en: "165 s to /health", ru: "165 с до /health" }, { en: "startupProbe budget", ru: "бюджет startupProbe" }, { en: "period 5 s × failureThreshold", ru: "период 5 с × failureThreshold" }],
      [{ en: "rollout capacity floor", ru: "нижняя граница ёмкости роллаута" }, { en: "replicas − maxUnavailable", ru: "replicas − maxUnavailable" }, { en: "safe cadence", ru: "безопасный темп" }, { en: "maxUnavailable 0 · maxSurge 1", ru: "maxUnavailable 0 · maxSurge 1" }],
      [{ en: "helm revision", ru: "helm-ревизия" }, { en: "values snapshot in history", ru: "снимок values в истории" }, { en: "rollback N", ru: "откат к N" }, { en: "new revision == content of N", ru: "новая ревизия == содержимое N" }],
    ],
    scenario: null,
    quizzes: [
      {
        id: "q1",
        q: {
          en: "A pod hosts the engine at TP degree 2 (T10 ledger: weights 16, KV 4, fixed 1.5 GiB). How many GiB go into requests (memory)?",
          ru: "Под держит движок на TP-степени 2 (ledger из T10: веса 16, KV 4, фикс 1.5 ГиБ). Сколько ГиБ писать в requests (память)?",
        },
        answer: 11.5, tol: 0.1, unit: { en: "GiB", ru: "ГиБ" },
        hint: {
          en: "(16 + 4) / 2 + 1.5 — weights and KV divide, the fixed part does not.",
          ru: "(16 + 4) / 2 + 1.5 — веса и KV делятся, фикс нет.",
        },
      },
      {
        id: "q2",
        q: {
          en: "Cold start to /health is 165 s; the probe runs every 5 s. What failureThreshold gives a budget of exactly 200 s?",
          ru: "Холодный старт до /health — 165 с; проба ходит каждые 5 с. Какой failureThreshold даст бюджет ровно 200 с?",
        },
        answer: 40, tol: 0.2, unit: { en: "attempts", ru: "попыток" },
        hint: {
          en: "budget = period × failureThreshold; solve 5 × f = 200.",
          ru: "бюджет = период × failureThreshold; реши 5 × f = 200.",
        },
      },
      {
        id: "q3",
        q: {
          en: "A Deployment of 4 replicas rolls with maxUnavailable 1. What is the lowest serving capacity during the rollout?",
          ru: "Deployment из 4 реплик катится с maxUnavailable 1. Какова нижняя граница обслуживающей ёмкости при роллауте?",
        },
        answer: 3, tol: 0.2, unit: { en: "pods", ru: "пода" },
        hint: {
          en: "floor = replicas − maxUnavailable; maxSurge does not raise the floor.",
          ru: "граница = replicas − maxUnavailable; maxSurve границу не поднимает.",
        },
      },
    ],
    exercises: [
      {
        id: "ex1",
        title: { en: "Exercise 1 · Pod spec from the ledger", ru: "Упражнение 1 · Спецификация пода из ledger" },
        brief: {
          en: "Implement <code>pod_resources(p, weights_gib=16.0, kv_gib=4.0, fixed_gib=1.5)</code> — the Kubernetes resources block of one engine pod at TP degree <code>p</code> (the T10 ledger: weights and KV divide, the fixed part does not). Return <code>{'requests': {'memory_gib': x, 'gpu': 1}, 'limits': {...}}</code> with <strong>requests == limits</strong> — that equality is what makes the pod <strong>Guaranteed</strong> QoS (lowest eviction priority; you do not want the kernel evicting a pod that holds weights).",
          ru: "Реализуй <code>pod_resources(p, weights_gib=16.0, kv_gib=4.0, fixed_gib=1.5)</code> — блок resources одного движкового пода на TP-степени <code>p</code> (ledger из T10: веса и KV делятся, фикс нет). Верни <code>{'requests': {'memory_gib': x, 'gpu': 1}, 'limits': {...}}</code> со <strong>requests == limits</strong> — именно это равенство делает под <strong>Guaranteed</strong> QoS (наименьший приоритет выселения; ядро не должно выселять под, который держит веса).",
        },
        starter: `def pod_resources(p, weights_gib=16.0, kv_gib=4.0, fixed_gib=1.5):
    """Resources block of one engine pod: requests == limits (Guaranteed QoS)."""
    # TODO: memory = (weights + kv) / p + fixed; gpu 1; requests == limits
`,
        tests: [
          { name: "single GPU pod", hidden: false, code: "eq(pod_resources(1), {'requests': {'memory_gib': 21.5, 'gpu': 1}, 'limits': {'memory_gib': 21.5, 'gpu': 1}})" },
          { name: "TP degree 2 pod", hidden: false, code: "eq(pod_resources(2), {'requests': {'memory_gib': 11.5, 'gpu': 1}, 'limits': {'memory_gib': 11.5, 'gpu': 1}})" },
          { name: "another machine, same ledger", hidden: true, code: "eq(pod_resources(4, 40.0, 8.0, 2.0), {'requests': {'memory_gib': 14.0, 'gpu': 1}, 'limits': {'memory_gib': 14.0, 'gpu': 1}})" },
          { name: "requests equal limits is the whole point", hidden: true, code: "r = pod_resources(2)\neq(r['requests'] == r['limits'], True)" },
        ],
        solution: `def pod_resources(p, weights_gib=16.0, kv_gib=4.0, fixed_gib=1.5):
    mem = (weights_gib + kv_gib) / p + fixed_gib
    return {'requests': {'memory_gib': mem, 'gpu': 1},
            'limits': {'memory_gib': mem, 'gpu': 1}}`,
        hints: [
          { en: "One memory number, used twice: requests and limits must be the same dict content.", ru: "Одно число памяти, использованное дважды: requests и limits совпадают." },
        ],
        numpy: false,
        timeoutMs: 4000,
      },
      {
        id: "ex2",
        title: { en: "Exercise 2 · StartupProbe vs the cold start", ru: "Упражнение 2 · StartupProbe против холодного старта" },
        brief: {
          en: "Implement <code>pod_goes_ready(cold_start_s, period_s, failure_threshold)</code> — does the pod survive to Ready? The probe asks <code>/health</code> every <code>period_s</code> seconds and tolerates <code>failure_threshold</code> failures before killing the container, so the budget is <code>period_s × failure_threshold</code>. The pod goes Ready iff the budget is <strong>at least</strong> the cold start (the T09-fleet run measured 165 s). An LLM pod that is slow-but-loading must not be killed for being slow — the probe exists to gate traffic, not to murder weight loading.",
          ru: "Реализуй <code>pod_goes_ready(cold_start_s, period_s, failure_threshold)</code> — доживёт ли под до Ready? Проба стучится в <code>/health</code> каждые <code>period_s</code> секунд и терпит <code>failure_threshold</code> неудач, прежде чем убить контейнер; бюджет — <code>period_s × failure_threshold</code>. Под становится Ready тогда и только тогда, когда бюджет <strong>не меньше</strong> холодного старта (прогон T09-fleet измерил 165 с). Медленный, но грузящийся LLM-под нельзя убивать за медленность — проба гейтит трафик, а не казнит загрузку весов.",
        },
        starter: `def pod_goes_ready(cold_start_s, period_s, failure_threshold):
    """True iff the probe budget covers the cold start (>=, not >)."""
    # TODO: budget = period_s * failure_threshold; compare with >=
`,
        tests: [
          { name: "T09-fleet numbers fit", hidden: false, code: "eq(pod_goes_ready(165.0, 5, 40), True)" },
          { name: "thin budget dies", hidden: false, code: "eq(pod_goes_ready(165.0, 5, 20), False)" },
          { name: "boundary: budget exactly equals the cold start", hidden: true, code: "eq(pod_goes_ready(200.0, 5, 40), True)" },
          { name: "one attempt is still a budget", hidden: true, code: "eq(pod_goes_ready(5.0, 5, 1), True)\neq(pod_goes_ready(5.1, 5, 1), False)" },
        ],
        solution: `def pod_goes_ready(cold_start_s, period_s, failure_threshold):
    return period_s * failure_threshold >= cold_start_s`,
        hints: [
          { en: "The comparison is >=: a budget that exactly covers the start is enough.", ru: "Сравнение — >=: бюджет, ровно покрывающий старт, достаточен." },
        ],
        numpy: false,
        timeoutMs: 4000,
      },
      {
        id: "ex3",
        title: { en: "Exercise 3 · Fix the bug: the rollout dips", ru: "Упражнение 3 · Почини баг: роллаут роет яму" },
        brief: {
          en: "This <code>rollout_floor(replicas, max_unavailable, max_surge)</code> claims the rollout's capacity floor is <code>replicas − maxUnavailable + maxSurge</code> — wrong on two sides. A surged pod serves <strong>nothing</strong> until it is Ready (weights, 165 s), so surge never raises the floor; and killing <code>maxUnavailable</code> old pods before any new one is Ready dips the floor to <code>replicas − maxUnavailable</code> — the OpenAI KubeCon lesson: an inference rollout is not a stateless rollout. Fix the formula, and the safe cadence falls out: <code>maxUnavailable 0, maxSurge 1</code> keeps the floor at <code>replicas</code>.",
          ru: "Эта <code>rollout_floor(replicas, max_unavailable, max_surge)</code> утверждает, что нижняя граница ёмкости роллаута — <code>replicas − maxUnavailable + maxSurge</code>, и ошибается с двух сторон. Surge-под не обслуживает <strong>ничего</strong>, пока не Ready (веса, 165 с), поэтому surge границу не поднимает; а убийство <code>maxUnavailable</code> старых подов до готовности хоть одного нового роняет границу до <code>replicas − maxUnavailable</code> — урок KubeCon-доклада OpenAI: роллаут инференса — не роллаут stateless. Почини формулу, и безопасный темп получится сам: <code>maxUnavailable 0, maxSurge 1</code> держит границу на <code>replicas</code>.",
        },
        starter: `def rollout_floor(replicas, max_unavailable, max_surge):
    """Lowest serving capacity during a rolling update."""
    # BUG: counts the surged pod as capacity before it is Ready,
    # and hides the maxUnavailable dip
    return replicas - max_unavailable + max_surge
`,
        tests: [
          { name: "safe cadence keeps the floor", hidden: false, code: "eq(rollout_floor(3, 0, 1), 3)" },
          { name: "unavailable bites immediately", hidden: false, code: "eq(rollout_floor(4, 1, 1), 3)" },
          { name: "aggressive dip", hidden: true, code: "eq(rollout_floor(3, 2, 0), 1)" },
          { name: "floor may reach zero — honest worst case", hidden: true, code: "eq(rollout_floor(2, 2, 1), 0)" },
        ],
        solution: `def rollout_floor(replicas, max_unavailable, max_surge):
    return replicas - max_unavailable`,
        hints: [
          { en: "A pod that is still loading weights serves zero requests — surge is speed, not capacity.", ru: "Под, ещё грузящий веса, обслуживает ноль запросов — surge это скорость, не ёмкость." },
        ],
        numpy: false,
        timeoutMs: 4000,
      },
      {
        id: "ex4",
        title: { en: "Exercise 4 · Wrap it into a class: ReleaseSim", ru: "Упражнение 4 · Собери в класс: ReleaseSim" },
        brief: {
          en: "The lab's final boss: a Helm release as a class. <code>ReleaseSim()</code> with <code>upgrade(values)</code> — appends a revision (numbered from 1) and returns its number; <code>history()</code> — the list of <code>{'revision': n, 'values': dict}</code>; <code>rollback(revision)</code> — appends a <strong>new</strong> revision whose values are a copy of that revision's (history is never rewritten — the Helm rule) and returns its number; an unknown revision raises <code>ValueError</code>. Copy the values dicts — a release history that aliases its snapshots is a corrupt ledger.",
          ru: "Финальный босс лабы: Helm-релиз как класс. <code>ReleaseSim()</code> с <code>upgrade(values)</code> — добавляет ревизию (нумерация с 1) и возвращает её номер; <code>history()</code> — список <code>{'revision': n, 'values': dict}</code>; <code>rollback(revision)</code> — добавляет <strong>новую</strong> ревизию, значения которой — копия значений указанной (история никогда не переписывается — правило Helm), и возвращает её номер; неизвестная ревизия — <code>ValueError</code>. Копируй словари values — история релиза, алиасящая свои снимки, это испорченный журнал.",
        },
        starter: `class ReleaseSim:
    """Helm-style release: upgrade/history/rollback, revisions from 1."""

    def upgrade(self, values=None):
        # TODO: append {'revision': n, 'values': copy}, return n
        ...

    def history(self):
        # TODO: return the revision list
        ...

    def rollback(self, revision):
        # TODO: new revision with a COPY of that revision's values;
        # unknown revision -> ValueError
        ...`,
        tests: [
          { name: "three upgrades, three revisions", hidden: false, code: "rel = ReleaseSim()\neq(rel.upgrade({'memory_gib': 21.5}), 1)\neq(rel.upgrade({'memory_gib': 11.5}), 2)\neq(rel.upgrade({'memory_gib': 9.0}), 3)\neq(len(rel.history()), 3)" },
          { name: "rollback appends a new revision with old content", hidden: false, code: "rel = ReleaseSim()\nrel.upgrade({'memory_gib': 21.5})\nrel.upgrade({'memory_gib': 11.5})\neq(rel.rollback(1), 3)\nh = rel.history()\neq(h[-1]['revision'], 3)\neq(h[-1]['values'], {'memory_gib': 21.5})" },
          { name: "unknown revision raises ValueError", hidden: true, code: "rel = ReleaseSim()\nrel.upgrade({'memory_gib': 21.5})\nok = False\ntry:\n    rel.rollback(99)\nexcept ValueError:\n    ok = True\neq(ok, True)" },
          { name: "history does not alias snapshots", hidden: true, code: "rel = ReleaseSim()\nrel.upgrade({'memory_gib': 21.5})\nh = rel.history()\nh[0]['values']['memory_gib'] = 0.0\neq(rel.history()[0]['values']['memory_gib'], 21.5)" },
        ],
        solution: `import copy

class ReleaseSim:
    def __init__(self):
        self._history = []

    def upgrade(self, values=None):
        values = dict(values or {})
        rev = len(self._history) + 1
        self._history.append({'revision': rev, 'values': values})
        return rev

    def history(self):
        return copy.deepcopy(self._history)

    def rollback(self, revision):
        for entry in self._history:
            if entry['revision'] == revision:
                return self.upgrade(entry['values'])
        raise ValueError('unknown revision: %s' % revision)`,
        hints: [
          { en: "rollback(rev) is just upgrade(stored_values_of_rev) — plus the ValueError guard.", ru: "rollback(rev) — это просто upgrade(сохранённых_values_ревизии) — плюс защита ValueError." },
          { en: "Copy on the way in AND on the way out: history() returning live references lets a caller corrupt the ledger.", ru: "Копируй и на входе, и на выходе: history(), вернувшая живые ссылки, позволяет вызывающему испортить журнал." },
        ],
        numpy: false,
        timeoutMs: 4000,
      },
    ],
    posttest: [
      {
        id: "p1",
        q: { en: "A pod sets requests 11.5 GiB and limits 20 GiB of memory. Its QoS class is\u2026", ru: "Под пишет requests 11.5 ГиБ и лимиты 20 ГиБ памяти. Его класс QoS — это\u2026" },
        options: [{ en: "Burstable — requests and limits differ", ru: "Burstable — requests и limits различаются" }, { en: "Guaranteed — both fields are set", ru: "Guaranteed — оба поля заполнены" }, { en: "BestEffort — there is a limit", ru: "BestEffort — ведь есть лимит" }],
        answer: 0,
        explain: { en: "Guaranteed needs requests == limits on every container. Differing values mean Burstable — higher eviction priority, a bad home for weights.", ru: "Guaranteed требует requests == limits у всех контейнеров. Разные значения — Burstable: приоритет выселения выше, весам такое жильё не подходит." },
      },
      {
        id: "p2",
        q: { en: "A liveness probe with a 1 s timeout keeps killing pods during long generations. The right treatment is\u2026", ru: "Liveness-проба с таймаутом 1 с убивает поды во время длинных генераций. Правильное лечение —\u2026" },
        options: [{ en: "gate traffic with readiness and budget the startup; do not let liveness kill slow-but-busy pods", ru: "гейтить трафик readiness-пробой и дать бюджет старту; liveness не должен убивать медленно-занятые поды" }, { en: "remove all probes entirely", ru: "убрать все пробы совсем" }, { en: "just add more replicas", ru: "просто добавить реплик" }],
        answer: 0,
        explain: { en: "Probes exist to gate traffic and survive cold starts (weights, then /health). Killing busy-but-healthy engines turns every long generation into a restart — the model-aware readiness lesson.", ru: "Пробы существуют, чтобы гейтить трафик и переживать холодный старт (веса, потом /health). Убийство занятых, но здоровых движков превращает каждую длинную генерацию в рестарт — урок model-aware readiness." },
      },
      {
        id: "p3",
        q: { en: "A release history holds revisions [1, 2, 3]. After `helm rollback 1` the history is\u2026", ru: "История релиза хранит ревизии [1, 2, 3]. После `helm rollback 1` история — это\u2026" },
        options: [{ en: "[1, 2, 3, 4] where 4 has revision 1's content", ru: "[1, 2, 3, 4], где 4 несёт содержимое ревизии 1" }, { en: "[1] — the history is rewritten", ru: "[1] — история переписана" }, { en: "[2, 3] — revision 1 is consumed", ru: "[2, 3] — ревизия 1 израсходована" }],
        answer: 0,
        explain: { en: "Helm never rewrites history: a rollback appends a new revision whose content matches the target. That is why ReleaseSim.rollback() calls upgrade() under the hood.", ru: "Helm никогда не переписывает историю: откат добавляет новую ревизию с содержимым целевой. Поэтому ReleaseSim.rollback() под капотом вызывает upgrade()." },
      },
    ],
    reward: {
      caption: { en: "Ledger → pod spec, probe → readiness, rollout without the dip, and a release you can roll back.", ru: "Ledger → спецификация пода, проба → готовность, роллаут без ямы — и релиз, с которого можно откатиться." },
    },
    footer: {
      en: "A declared teaching model of a cluster (vocabulary + controller arithmetic on course numbers) — not your cluster and not a kubectl walkthrough. Real practice material: NVIDIA GPU Operator docs, Helm docs, llm-d model-aware readiness probes, the OpenAI KubeCon NA 2026 rollout talk. The T10 ledger and the T09-fleet 165 s cold start are the course's own measured numbers.",
      ru: "Заявленная учебная модель кластера (словарь + арифметика контроллеров на курсовых числах) — не твой кластер и не walkthrough по kubectl. Реальные первоисточники практики: доки NVIDIA GPU Operator, доки Helm, llm-d model-aware readiness probes, доклад OpenAI с KubeCon NA 2026 про роллауты. Ledger из T10 и холодный старт 165 с из T09-fleet — измеренные числа самого курса.",
    },
  };
})();
