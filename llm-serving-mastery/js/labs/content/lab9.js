/* Lab 09 — Docker: the container as the production unit.
   Content module for the generic lab page (window.LABS_CONTENT['9']).
   Sources: seminars/09-docker-llm-inference.ipynb and its generator
   scripts/build-topic09-notebook.py (plan_cache_order, diagnose_exit,
   the crash-loop backoff of the OOM incident). Declared teaching model only. */
(function () {
  "use strict";
  window.LABS_CONTENT = window.LABS_CONTENT || {};

  LABS_CONTENT["9"] = {
    budget: 120,
    title: {
      en: "Docker: the production unit",
      ru: "Docker: производственная единица",
    },
    sub: {
      en: "Layer order and cache hits, exit 137 decoded as 128+SIGKILL, crash-loop backoff that grows, restart-to-ready as named members.",
      ru: "Порядок слоёв и попадания в кэш, exit 137 как 128 + 9 (SIGKILL), crash-loop backoff с растущими интервалами, рестарт-до-готовности как именованные члены.",
    },
    intro: {
      en: `<p>An image is an ordered stack of layers, and the build cache has one law: a layer hit survives only while neither it nor anything <em>below</em> it changed — editing a layer rebuilds it and everything above. For an LLM image the size accounting is brutal: the binary is megabytes, the weights (Qwen2.5-0.5B Q4_K_M — 0.491 GB) dominate whatever you do with the Dockerfile. And when a container touches pages beyond its <code>--memory</code> wall, the kernel kills it: exit 137 is not an application code but 128 + 9 (SIGKILL), the restart policy brings it back with a <strong>growing backoff</strong> (100 ms → … → 1 min; Kubernetes calls it CrashLoopBackOff), and only the exit code, the log tail and <code>OOMKilled</code> tell the story.</p>
<p>The lab habit: freeze the build plan (layer order, per-edit invalidation, restart members) before the first build; diagnose from evidence, not vibes — code + log + inspect; treat "crashed → answering again" as a sum of named members: layer extract + weight loading + server init + first <code>/health</code>. Minimizing the image is recovery speed.</p>`,
      ru: `<p>Образ — упорядоченная стопка слоёв, и у build-кэша один закон: попадание слоя живёт, пока не изменились ни он сам, ни что-либо <em>под</em> ним — правка слоя пересобирает его и всё выше. Для LLM-образа бухгалтерия размера жёсткая: бинарник — мегабайты, а веса (Qwen2.5-0.5B Q4_K_M — 0.491 ГБ) доминируют, что бы ты ни делал с Dockerfile. Когда контейнер касается страниц за стеной <code>--memory</code>, ядро его убивает: exit 137 — не код приложения, а 128 + 9 (SIGKILL), restart-политика поднимает контейнер снова с <strong>растущим backoff</strong> (100 мс → … → 1 мин; в Kubernetes это CrashLoopBackOff), и только код выхода, хвост журнала и <code>OOMKilled</code> рассказывают историю.</p>
<p>Привычка лабы: заморозить план сборки (порядок слоёв, инвалидация по правке, члены рестарта) до первой сборки; диагностировать по доказательствам, а не по ощущениям — код + лог + inspect; считать «упал → снова отвечает» суммой именованных членов: extract слоёв + загрузка весов + init сервера + первый <code>/health</code>. Минимизация размера — это скорость восстановления.</p>`,
    },
    heroTag: { en: "layers, exit codes, backoff", ru: "слои, exit-коды, backoff" },
    glossary: [
      [{ en: "image", ru: "образ" }, { en: "an ordered stack of layers — the artifact you build once and pull many times; its size is the sum of the layer bytes.", ru: "упорядоченная стопка слоёв — артефакт, который собирают один раз и тянут много раз; его размер — сумма байтов слоёв." }],
      [{ en: "layer", ru: "слой" }, { en: "one diff of the image; editing a layer rebuilds it together with everything above it — the invalidation wave climbs.", ru: "один диф образа; правка слоя пересобирает его вместе со всем, что выше него, — волна инвалидации поднимается." }],
      [{ en: "cache hit", ru: "попадание в кэш" }, { en: "the build cache reuses a layer only while neither it nor anything below it changed — that is why rarely-changing layers go low.", ru: "build-кэш переиспользует слой, только пока не изменились ни он сам, ни что-либо под ним, — поэтому редко меняющиеся слои кладут вниз." }],
      [{ en: "signal death (exit ≥ 128)", ru: "смерть от сигнала (exit ≥ 128)" }, { en: "codes from 128 up are not application results: the runtime encodes 128 + signal, so 137 decodes to SIGKILL(9) and 143 to SIGTERM(15).", ru: "коды от 128 и выше — не результаты приложения: рантайм кодирует 128 + сигнал, поэтому 137 раскладывается в SIGKILL(9), а 143 — в SIGTERM(15)." }],
      [{ en: "OOM-kill", ru: "OOM-kill" }, { en: "the kernel's memory-cgroup kill: the container touches pages beyond its <code>--memory</code> wall and gets SIGKILL — an incident, not an application crash.", ru: "убийство по memory-cgroup: контейнер трогает страницы за стеной <code>--memory</code> и получает SIGKILL — инцидент, а не падение приложения." }],
      [{ en: "crash-loop backoff", ru: "backoff crash-loop" }, { en: "the restart schedule with growing delays, base × 2^k capped (docker 0.1 s → 60 s); Kubernetes calls the same loop CrashLoopBackOff.", ru: "расписание рестартов с растущими интервалами, base × 2^k с потолком (docker 0.1 с → 60 с); в Kubernetes тот же цикл зовут CrashLoopBackOff." }],
      [{ en: "cold restart members", ru: "члены холодного рестарта" }, { en: "«crashed → answering again» is a sum of named members: layer extract + weight loading + server init + first /health.", ru: "«упал → снова отвечает» — сумма именованных членов: extract слоёв + загрузка весов + init сервера + первый /health." }],
      [{ en: "warm restart", ru: "тёплый рестарт" }, { en: "layers are already local, so extract shrinks to ~0 — but the weights are paid every time; minimizing the image is recovery speed.", ru: "слои уже локальны, поэтому extract сжимается к ~0, — но за веса платят каждый раз; минимизация образа — это скорость восстановления." }],
      [{ en: "bake", ru: "запекание весов" }, { en: "COPY the weights into the image: a heavy pull once, a light start every time — layers stack, they do not merge.", ru: "COPY весов в образ: тяжёлый pull один раз, лёгкий старт каждый раз — слои складываются стопкой, а не сливаются." }],
      [{ en: "hash-chained journal", ru: "хэш-цепочка журнала" }, { en: "every entry hashes the previous one (sha256 over seq|ts|kind|payload|prev), so any tampering with history breaks the chain.", ru: "каждая запись считает хэш от предыдущей (sha256 от seq|ts|kind|payload|prev), поэтому любая подделка истории ломает цепочку." }],
    ],
    figures: [
      {
        id: "lab9-layer-stack",
        title: { en: "Layer order decides the cache bill", ru: "Порядок слоёв определяет счёт за кэш" },
        w: 760, h: 420,
        svg: `<svg viewBox="0 0 760 420" xmlns="http://www.w3.org/2000/svg">
  <g id="g-stack">
    <text x="60" y="60" font-size="14" fill="var(--lab-muted)" data-en="an image is an ordered stack" data-ru="образ — упорядоченная стопка">an image is an ordered stack</text>
    <rect x="60" y="286" width="300" height="48" rx="8" fill="none" stroke="var(--lab-muted)" stroke-width="2"/>
    <text x="210" y="316" text-anchor="middle" font-size="15" fill="var(--lab-ink)" class="mono" data-en="base (llama.cpp 1.18 GB)" data-ru="база (llama.cpp 1.18 ГБ)">base (llama.cpp 1.18 GB)</text>
    <rect x="60" y="232" width="300" height="48" rx="8" fill="none" stroke="var(--lab-muted)" stroke-width="2"/>
    <text x="210" y="262" text-anchor="middle" font-size="15" fill="var(--lab-ink)" class="mono" data-en="os libs" data-ru="системные библиотеки">os libs</text>
    <rect x="60" y="178" width="300" height="48" rx="8" fill="none" stroke="var(--lab-muted)" stroke-width="2"/>
    <text x="210" y="208" text-anchor="middle" font-size="15" fill="var(--lab-ink)" class="mono" data-en="deps (requirements.txt)" data-ru="зависимости (requirements.txt)">deps (requirements.txt)</text>
    <rect x="60" y="124" width="300" height="48" rx="8" fill="none" stroke="var(--lab-accent)" stroke-width="2"/>
    <text x="210" y="154" text-anchor="middle" font-size="15" fill="var(--lab-accent)" class="mono" data-en="app code" data-ru="код приложения">app code</text>
  </g>
  <g id="g-edit-app">
    <circle cx="210" cy="148" r="11" fill="none" stroke="var(--lab-bad)" stroke-width="2.5" class="fig-pulse"/>
    <text x="390" y="140" font-size="15" fill="var(--lab-bad)" data-en="edit app → app rebuilds" data-ru="правка app → пересборка app">edit app → app rebuilds</text>
    <text x="390" y="166" font-size="14" fill="var(--lab-good)" data-en="everything below: cache hit" data-ru="всё ниже: cache hit">everything below: cache hit</text>
    <path d="M 372 132 L 286 140" fill="none" stroke="var(--lab-bad)" stroke-width="2" class="fig-flow"/>
    <text x="390" y="196" font-size="14" fill="var(--lab-good)" class="mono" data-en="✓ deps · os · base" data-ru="✓ зависимости · ос · база">✓ deps · os · base</text>
  </g>
  <g id="g-edit-deps">
    <circle cx="210" cy="202" r="11" fill="none" stroke="var(--lab-bad)" stroke-width="2.5" class="fig-pulse"/>
    <circle cx="210" cy="148" r="11" fill="none" stroke="var(--lab-bad)" stroke-width="2.5" class="fig-pulse"/>
    <text x="390" y="230" font-size="15" fill="var(--lab-bad)" data-en="edit deps → deps + app rebuild" data-ru="правка deps → пересборка deps и app">edit deps → deps + app rebuild</text>
    <text x="390" y="256" font-size="14" fill="var(--lab-good)" class="mono">✓ os · base</text>
    <path d="M 372 222 L 292 250" fill="none" stroke="var(--lab-bad)" stroke-width="2" class="fig-flow"/>
    <path d="M 372 226 L 292 202" fill="none" stroke="var(--lab-bad)" stroke-width="2" class="fig-flow"/>
  </g>
  <g id="g-law">
    <text x="380" y="316" font-size="16" fill="var(--lab-ink)" data-en="the law: a hit survives while nothing below changed" data-ru="закон: hit живёт, пока низ не менялся">the law: a hit survives while nothing below changed</text>
    <text x="380" y="344" font-size="14" fill="var(--lab-muted)" data-en="rarely-changing layers go low — order decides the bill" data-ru="редко меняющиеся слои — вниз; порядок решает счёт">rarely-changing layers go low — order decides the bill</text>
  </g>
</svg>`,
        stages: [
          { cap: { en: "The image stack: base → os → deps → app.", ru: "Стопка образа: base → os → deps → app." }, show: ["g-stack"] },
          { cap: { en: "Edit the app: one layer rebuilds; everything below stays a cache hit.", ru: "Правка app: пересобирается один слой; всё ниже остаётся попаданием в кэш." }, show: ["g-stack", "g-edit-app"] },
          { cap: { en: "Edit deps: the invalidation wave climbs — deps and app rebuild.", ru: "Правка deps: волна инвалидации поднимается — пересобираются deps и app." }, show: ["g-stack", "g-edit-app", "g-edit-deps"] },
          { cap: { en: "The law: a hit survives while nothing below it changed.", ru: "Закон: попадание живёт, пока не изменилось ничего ниже него." }, show: ["g-stack", "g-edit-app", "g-edit-deps", "g-law"] },
        ],
      },
      {
        id: "lab9-startup-economics",
        title: { en: "Crashed → answering again, member by member", ru: "«Упал → снова отвечает», член за членом" },
        w: 760, h: 420,
        svg: `<svg viewBox="0 0 760 420" xmlns="http://www.w3.org/2000/svg">
  <g id="g-cold">
    <text x="60" y="72" font-size="15" fill="var(--lab-ink)" data-en="cold restart = the sum of named members" data-ru="холодный рестарт = сумма именованных членов">cold restart = the sum of named members</text>
    <rect x="60" y="90" width="90" height="40" rx="7" fill="var(--lab-accent)" opacity="0.55"/>
    <text x="105" y="115" text-anchor="middle" font-size="14" fill="var(--lab-ink)" data-en="extract" data-ru="extract">extract</text>
    <rect x="154" y="90" width="330" height="40" rx="7" fill="var(--fig-warm)" opacity="0.75"/>
    <text x="319" y="115" text-anchor="middle" font-size="14" fill="var(--lab-bg)" class="mono" data-en="weight loading 0.491 GB" data-ru="загрузка весов 0.491 ГБ">weight loading 0.491 GB</text>
    <rect x="488" y="90" width="110" height="40" rx="7" fill="var(--lab-accent)" opacity="0.35"/>
    <text x="543" y="115" text-anchor="middle" font-size="14" fill="var(--lab-ink)" data-en="server init" data-ru="init сервера">server init</text>
    <rect x="602" y="90" width="98" height="40" rx="7" fill="var(--lab-good)" opacity="0.45"/>
    <text x="651" y="115" text-anchor="middle" font-size="14" fill="var(--lab-ink)" class="mono">/health</text>
    <text x="60" y="156" font-size="13" fill="var(--lab-muted)" data-en="the dominant member is whatever you do with the weights" data-ru="доминирующий член — то, что ты делаешь с весами">the dominant member is whatever you do with the weights</text>
  </g>
  <g id="g-warm">
    <text x="60" y="206" font-size="15" fill="var(--lab-ink)" data-en="warm restart: layers are local — extract shrinks" data-ru="тёплый рестарт: слои локальны — extract сжимается">warm restart: layers are local — extract shrinks</text>
    <rect x="60" y="224" width="36" height="40" rx="7" fill="var(--lab-muted)" opacity="0.5"/>
    <text x="78" y="249" text-anchor="middle" font-size="13" fill="var(--lab-muted)" class="mono">~0</text>
    <rect x="100" y="224" width="330" height="40" rx="7" fill="var(--fig-warm)" opacity="0.75"/>
    <text x="265" y="249" text-anchor="middle" font-size="14" fill="var(--lab-bg)" class="mono" data-en="weights 0.491 GB" data-ru="веса 0.491 ГБ">weights 0.491 GB</text>
    <rect x="434" y="224" width="110" height="40" rx="7" fill="var(--lab-accent)" opacity="0.35"/>
    <rect x="548" y="224" width="98" height="40" rx="7" fill="var(--lab-good)" opacity="0.45"/>
    <text x="60" y="284" font-size="13" fill="var(--lab-muted)" data-en="still pays weights" data-ru="веса платить всё равно">still pays weights</text>
  </g>
  <g id="g-bake">
    <text x="60" y="308" font-size="15" fill="var(--lab-ink)" data-en="bake the weights into the image" data-ru="запечь веса в образ">bake the weights into the image</text>
    <text x="60" y="342" font-size="16" fill="var(--lab-ink)" class="mono">1.18 + 0.491 ≈ 1.67 GB</text>
    <text x="330" y="342" font-size="14" fill="var(--lab-good)" data-en="heavy pull once, light start every time" data-ru="тяжёлый pull один раз, лёгкий старт каждый раз">heavy pull once, light start every time</text>
    <text x="60" y="376" font-size="15" fill="var(--fig-warm)" data-en="minimizing the image is recovery speed" data-ru="минимизация образа — это скорость восстановления">minimizing the image is recovery speed</text>
  </g>
</svg>`,
        stages: [
          { cap: { en: "Crashed → answering again = extract + weights + init + /health.", ru: "«Упал → снова отвечает» = extract + веса + init + /health." }, show: ["g-cold"] },
          { cap: { en: "Warm restart: extract is already local; the weights still get paid.", ru: "Тёплый рестарт: extract уже локален; за веса платить всё равно." }, show: ["g-cold", "g-warm"] },
          { cap: { en: "Baked: 1.18 + 0.491 ≈ 1.67 GB — heavy pull once.", ru: "Запечь: 1.18 + 0.491 ≈ 1.67 ГБ — тяжёлый pull один раз." }, show: ["g-cold", "g-warm", "g-bake"] },
        ],
      },
    ],
    outcomes: [
      { en: "Predict cache invalidation before a build and read exit codes like an incident.", ru: "\u041f\u0440\u0435\u0434\u0441\u043a\u0430\u0437\u044b\u0432\u0430\u0442\u044c \u0438\u043d\u0432\u0430\u043b\u0438\u0434\u0430\u0446\u0438\u044e \u043a\u044d\u0448\u0430 \u0434\u043e \u0441\u0431\u043e\u0440\u043a\u0438 \u0438\u00a0\u0447\u0438\u0442\u0430\u0442\u044c exit-\u043a\u043e\u0434\u044b \u043a\u0430\u043a \u0438\u043d\u0446\u0438\u0434\u0435\u043d\u0442." },
      { en: "Size recovery from resident memory and verify a measurement journal with your own hash walk.", ru: "\u041e\u0446\u0435\u043d\u0438\u0432\u0430\u0442\u044c \u0432\u043e\u0441\u0441\u0442\u0430\u043d\u043e\u0432\u043b\u0435\u043d\u0438\u0435 \u043f\u043e \u0440\u0435\u0437\u0438\u0434\u0435\u043d\u0442\u043d\u043e\u0439 \u043f\u0430\u043c\u044f\u0442\u0438 \u0438\u00a0\u0432\u0435\u0440\u0438\u0444\u0438\u0446\u0438\u0440\u043e\u0432\u0430\u0442\u044c \u0436\u0443\u0440\u043d\u0430\u043b \u0441\u0432\u043e\u0438\u043c \u0445\u044d\u0448-\u0445\u043e\u0434\u043e\u043c." },
    ],
    model: [
      ["signal deaths", "exit ≥ 128 → killed by signal (exit − 128)", "137 = 128 + 9 (SIGKILL)", "143 = 128 + 15 (SIGTERM)"],
      ["crash-loop backoff", "docker: 0.1 s × 2^k, cap 60 s", "k8s CrashLoopBackOff", "10 s → cap 300 s"],
      ["cache invalidation", "edit source → compile layer and above", "change pin → fetch and above", "change base → whole stack"],
      ["image size", "base llama.cpp:server 1.18 GB", "weights Q4_K_M 0.491 GB", "bake = 1.18 + 0.491 ≈ 1.67 GB"],
    ],
    scenario: null,
    quizzes: [
      {
        id: "q1",
        q: {
          en: "The container exit code is 137. Which signal number does it encode (exit − 128)?",
          ru: "Код выхода контейнера — 137. Какой номер сигнала он кодирует (exit − 128)?",
        },
        answer: 9, tol: 0.2, unit: { en: "signal number", ru: "номер сигнала" },
        hint: {
          en: "137 is past 128: codes that big are not printed by the application — the kernel killed the process.",
          ru: "137 больше 128: такие коды приложение само не печатает — процесс убило ядро.",
        },
        followUp: {
          q: { en: "Why can't 137 be an application exit code?", ru: "Почему 137 не может быть кодом приложения?" },
          options: [
            { en: "Exit codes ≥ 128 are reserved for signal deaths: the shell/docker encodes 128 + signal, and an application's own exit statuses live below 128", ru: "Коды выхода ≥ 128 зарезервированы за смертями от сигналов: shell/docker кодирует 128 + сигнал, а собственные статусы приложения живут ниже 128" },
            { en: "Applications cannot print numbers above 100", ru: "Приложения не могут печатать числа выше 100" },
            { en: "137 is reserved by POSIX for OOM kills only", ru: "137 зарезервирован POSIX специально под OOM-kill" },
          ],
          answer: 0,
          explain: { en: "The 128-offset convention is how the runtime layer tells «the kernel killed it» from «the program returned it». That is why diagnose_exit decodes the signal FIRST and only then reads application branches.", ru: "Соглашение о смещении 128 — способ слоя рантайма отличить «убило ядро» от «программа вернула сама». Именно поэтому diagnose_exit сначала декодирует сигнал и лишь потом читает ветки приложения." },
        },
        // Вариативность №5: формула лабы sig = exit − 128, меняется вход-код выхода.
        //   137 → 9 (база, SIGKILL), 143 → 15 (SIGTERM), 139 → 11 (SIGSEGV).
        // 143 — константа модели лабы (мост 128 + 15); 139 и ответы 15 / 11 — числа
        // фигур (1.18 / 0.491 / 1.67) не трогают. Ловушка off-by-one (exit − 127 или
        // exit − 129) на расстоянии 1 ≫ tol 0.2 (запас 5×). followUp переписан: в базе
        // он говорит «137» — это вход базы. Answers попарно различны.
        variants: [
          {
            q: {
              en: "The container exit code is 137. Which signal number does it encode (exit − 128)?",
              ru: "Код выхода контейнера — 137. Какой номер сигнала он кодирует (exit − 128)?",
            },
            answer: 9, tol: 0.2,
          },
          {
            q: {
              en: "The container exit code is 143. Which signal number does it encode (exit − 128)?",
              ru: "Код выхода контейнера — 143. Какой номер сигнала он кодирует (exit − 128)?",
            },
            answer: 15, tol: 0.2,
            hint: {
              en: "128 + the signal = 143: this one came from a graceful stop (SIGTERM), not from the application.",
              ru: "128 + сигнал = 143: этот код пришёл от штатной остановки (SIGTERM), а не от приложения.",
            },
            followUp: {
              q: { en: "Why can't 143 be an application exit code?", ru: "Почему 143 не может быть кодом приложения?" },
              options: [
                { en: "Exit codes ≥ 128 are reserved for signal deaths: the shell/docker encodes 128 + signal, and an application's own exit statuses live below 128", ru: "Коды выхода ≥ 128 зарезервированы за смертями от сигналов: shell/docker кодирует 128 + сигнал, а собственные статусы приложения живут ниже 128" },
                { en: "Applications cannot print numbers above 100", ru: "Приложения не могут печатать числа выше 100" },
                { en: "143 is reserved by POSIX for OOM kills only", ru: "143 зарезервирован POSIX специально под OOM-kill" },
              ],
              answer: 0,
              explain: { en: "The 128-offset convention is how the runtime layer tells «the kernel killed it» from «the program returned it». That is why diagnose_exit decodes the signal FIRST and only then reads application branches.", ru: "Соглашение о смещении 128 — способ слоя рантайма отличить «убило ядро» от «программа вернула сама». Именно поэтому diagnose_exit сначала декодирует сигнал и лишь потом читает ветки приложения." },
            },
          },
          {
            q: {
              en: "The container exit code is 139. Which signal number does it encode (exit − 128)?",
              ru: "Код выхода контейнера — 139. Какой номер сигнала он кодирует (exit − 128)?",
            },
            answer: 11, tol: 0.2,
            hint: {
              en: "128 + the signal = 139: the kernel killed the process on a memory fault — the application never printed this code itself.",
              ru: "128 + сигнал = 139: процесс убило ядро из-за сбоя доступа к памяти — приложение само этот код не печатало.",
            },
            followUp: {
              q: { en: "Why can't 139 be an application exit code?", ru: "Почему 139 не может быть кодом приложения?" },
              options: [
                { en: "Exit codes ≥ 128 are reserved for signal deaths: the shell/docker encodes 128 + signal, and an application's own exit statuses live below 128", ru: "Коды выхода ≥ 128 зарезервированы за смертями от сигналов: shell/docker кодирует 128 + сигнал, а собственные статусы приложения живут ниже 128" },
                { en: "Applications cannot print numbers above 100", ru: "Приложения не могут печатать числа выше 100" },
                { en: "139 is reserved by POSIX for OOM kills only", ru: "139 зарезервирован POSIX специально под OOM-kill" },
              ],
              answer: 0,
              explain: { en: "The 128-offset convention is how the runtime layer tells «the kernel killed it» from «the program returned it». That is why diagnose_exit decodes the signal FIRST and only then reads application branches.", ru: "Соглашение о смещении 128 — способ слоя рантайма отличить «убило ядро» от «программа вернула сама». Именно поэтому diagnose_exit сначала декодирует сигнал и лишь потом читает ветки приложения." },
            },
          },
        ],
      },
      {
        id: "q2",
        q: {
          en: "Docker restarts a crash-looping container with backoff starting at 0.1 s and doubling each time (cap 60 s). The delay before the 6th restart, in seconds?",
          ru: "Docker перезапускает crash-loop контейнер с backoff от 0.1 с и удвоением при каждом рестарте (cap 60 с). Задержка перед 6-м рестартом, в секундах?",
        },
        answer: 3.2, tol: 0.05, unit: { en: "s", ru: "с" },
        hint: {
          en: "0.1 × 2^(k−1): the intervals double — 0.1, 0.2, 0.4, 0.8, 1.6, … (k counts attempts from 1).",
          ru: "0.1 × 2^(k−1): интервалы удваиваются — 0.1, 0.2, 0.4, 0.8, 1.6, … (k — номер попытки с 1).",
        },
        followUp: {
          q: { en: "Why is the exponent 5 and not 6 for the 6th restart?", ru: "Почему показатель 5, а не 6 для 6-го рестарта?" },
          options: [
            { en: "The schedule is 0-based: restart k waits base × 2^k, so restarts 0..5 are the first six, and the 6th waits 0.1 × 2^5", ru: "Расписание нумеруется с нуля: рестарт k ждёт base × 2^k, поэтому первые шесть — это рестарты 0..5, и 6-й ждёт 0.1 × 2^5" },
            { en: "The exponent is always restarts − 1 divided by 2", ru: "Показатель всегда равен (рестарты − 1) / 2" },
            { en: "The first restart has no delay, so it is skipped in the count", ru: "У первого рестарта нет задержки, поэтому он пропускается в счёте" },
          ],
          answer: 0,
          explain: { en: "Count the sequence: 0.1, 0.2, 0.4, 0.8, 1.6, 3.2 — six values, exponents 0..5. Off-by-one here is the classic bug, which is why Exercise 1's tests trace the whole list, not one value.", ru: "Посчитай последовательность: 0.1, 0.2, 0.4, 0.8, 1.6, 3.2 — шесть значений, показатели 0..5. Off-by-one здесь — классический баг, поэтому тесты упражнения 1 трассируют весь список, а не одно значение." },
        },
        // Вариативность №5: база backoff 0.1 с и cap 60 с — константы модели лабы,
        // меняется номер рестарта: задержка = 0.1 × 2^(k−1):
        //   6-й → 0.1 × 2^5 = 3.2 (база), 8-й → 0.1 × 2^7 = 12.8, 4-й → 0.1 × 2^3 = 0.8.
        // Ловушка «показатель k вместо k−1» на расстоянии ≥ 0.8 ≫ tol 0.05 (запас 16×);
        // cap не участвует (все ответы < 60). followUp переписан под свой номер
        // (в базе «показатель 5, а не 6» — это вход базы). Answers попарно различны.
        variants: [
          {
            q: {
              en: "Docker restarts a crash-looping container with backoff starting at 0.1 s and doubling each time (cap 60 s). The delay before the 6th restart, in seconds?",
              ru: "Docker перезапускает crash-loop контейнер с backoff от 0.1\u00a0с и\u00a0удвоением при каждом рестарте (cap 60\u00a0с). Задержка перед 6-м рестартом, в\u00a0секундах?",
            },
            answer: 3.2, tol: 0.05,
          },
          {
            q: {
              en: "Docker restarts a crash-looping container with backoff starting at 0.1 s and doubling each time (cap 60 s). The delay before the 8th restart, in seconds?",
              ru: "Docker перезапускает crash-loop контейнер с backoff от 0.1\u00a0с и\u00a0удвоением при каждом рестарте (cap 60\u00a0с). Задержка перед 8-м рестартом, в\u00a0секундах?",
            },
            answer: 12.8, tol: 0.05,
            hint: {
              en: "0.1 × 2^7: the intervals grow — 0.1, 0.2, 0.4, 0.8, 1.6, 3.2, 6.4 — and one more doubling for the eighth.",
              ru: "0.1 × 2^7: интервалы растут — 0.1, 0.2, 0.4, 0.8, 1.6, 3.2, 6.4 — и ещё одно удвоение для восьмого.",
            },
            followUp: {
              q: { en: "Why is the exponent 7 and not 8 for the 8th restart?", ru: "Почему показатель 7, а не 8 для 8-го рестарта?" },
              options: [
                { en: "The schedule is 0-based: restart k waits base × 2^k, so restarts 0..7 are the first eight, and the 8th waits 0.1 × 2^7", ru: "Расписание нумеруется с нуля: рестарт k ждёт base × 2^k, поэтому первые восемь — это рестарты 0..7, и 8-й ждёт 0.1 × 2^7" },
                { en: "The exponent is always restarts − 1 divided by 2", ru: "Показатель всегда равен (рестарты − 1) / 2" },
                { en: "The first restart has no delay, so it is skipped in the count", ru: "У первого рестарта нет задержки, поэтому он пропускается в счёте" },
              ],
              answer: 0,
              explain: { en: "Count the sequence: 0.1, 0.2, 0.4, 0.8, 1.6, 3.2, 6.4, 12.8 — eight values, exponents 0..7. Off-by-one here is the classic bug, which is why Exercise 1's tests trace the whole list, not one value.", ru: "Посчитай последовательность: 0.1, 0.2, 0.4, 0.8, 1.6, 3.2, 6.4, 12.8 — восемь значений, показатели 0..7. Off-by-one здесь — классический баг, поэтому тесты упражнения 1 трассируют весь список, а не одно значение." },
            },
          },
          {
            q: {
              en: "Docker restarts a crash-looping container with backoff starting at 0.1 s and doubling each time (cap 60 s). The delay before the 4th restart, in seconds?",
              ru: "Docker перезапускает crash-loop контейнер с backoff от 0.1\u00a0с и\u00a0удвоением при каждом рестарте (cap 60\u00a0с). Задержка перед 4-м рестартом, в\u00a0секундах?",
            },
            answer: 0.8, tol: 0.05,
            hint: {
              en: "0.1 × 2^3: the intervals grow — 0.1, 0.2, 0.4 — and one more doubling for the fourth.",
              ru: "0.1 × 2^3: интервалы растут — 0.1, 0.2, 0.4 — и ещё одно удвоение для четвёртого.",
            },
            followUp: {
              q: { en: "Why is the exponent 3 and not 4 for the 4th restart?", ru: "Почему показатель 3, а не 4 для 4-го рестарта?" },
              options: [
                { en: "The schedule is 0-based: restart k waits base × 2^k, so restarts 0..3 are the first four, and the 4th waits 0.1 × 2^3", ru: "Расписание нумеруется с нуля: рестарт k ждёт base × 2^k, поэтому первые четыре — это рестарты 0..3, и 4-й ждёт 0.1 × 2^3" },
                { en: "The exponent is always restarts − 1 divided by 2", ru: "Показатель всегда равен (рестарты − 1) / 2" },
                { en: "The first restart has no delay, so it is skipped in the count", ru: "У первого рестарта нет задержки, поэтому он пропускается в счёте" },
              ],
              answer: 0,
              explain: { en: "Count the sequence: 0.1, 0.2, 0.4, 0.8 — four values, exponents 0..3. Off-by-one here is the classic bug, which is why Exercise 1's tests trace the whole list, not one value.", ru: "Посчитай последовательность: 0.1, 0.2, 0.4, 0.8 — четыре значения, показатели 0..3. Off-by-one здесь — классический баг, поэтому тесты упражнения 1 трассируют весь список, а не одно значение." },
            },
          },
        ],
      },
      {
        id: "q3",
        q: {
          en: "Baking the 0.491 GB weights into the 1.18 GB base image: the resulting image size, in GB?",
          ru: "Запечь веса 0.491 ГБ в базовый образ 1.18 ГБ: размер получившегося образа в ГБ?",
        },
        answer: 1.67, tol: 0.01, unit: { en: "GB", ru: "ГБ" },
        hint: {
          en: "bake = base + weights: a heavy pull and a light start. Sum the two numbers.",
          ru: "bake = база + веса: тяжёлый pull и лёгкий старт. Сложи два числа.",
        },
        followUp: {
          q: { en: "Why do the two sizes ADD instead of the weights hiding inside the base layer?", ru: "Почему размеры СКЛАДЫВАЮТСЯ, а не веса прячутся внутри базового слоя?" },
          options: [
            { en: "Layers stack, they do not merge: the weights COPY layer adds its own bytes on top of the base bytes — every layer's data lives in the image", ru: "Слои складываются стопкой, а не сливаются: слой с копией весов добавляет свои байты поверх байтов базы — данные каждого слоя живут в образе" },
            { en: "Docker deduplicates identical bytes, and the weights are new bytes — so they add", ru: "Docker дедуплицирует одинаковые байты, а веса — новые байты, поэтому они складываются" },
            { en: "The weights compress inside the layer, so the sum is approximate", ru: "Веса сжимаются внутри слоя, поэтому сумма приблизительна" },
          ],
          answer: 0,
          explain: { en: "Union layers share files by layer, never shrink them: baking the weights trades pull time for start time, and the bill 1.67 GB is exactly why «minimizing the image is recovery speed».", ru: "Union-слои делят файлы по слоям и никогда не сжимают их: запекание весов меняет время pull на время старта, и счёт 1.67 ГБ — точная причина, почему «минимизация образа — это скорость восстановления»." },
        },
        // Вариативность №5: ответ базы 1.67 живёт в фигуре, поэтому варианты меняют
        // входы (размер базы / весов); 0.491 и 1.18 — константы модели, они легальны.
        // bake = база + веса:
        //   1.18 + 0.491 = 1.671 ≈ 1.67 (база), 0.92 + 0.491 = 1.411 ≈ 1.41,
        //   1.18 + 0.75 = 1.93.
        // Ловушки — числа фигур (1.67 / 1.18) на расстоянии ≥ 0.23 ≫ tol 0.01.
        // followUp переписан: счёт в объяснении — свой у каждого варианта.
        // Answers попарно различны.
        variants: [
          {
            q: {
              en: "Baking the 0.491 GB weights into the 1.18 GB base image: the resulting image size, in GB?",
              ru: "Запечь веса 0.491\u00a0ГБ в\u00a0базовый образ 1.18\u00a0ГБ: размер получившегося образа в\u00a0ГБ?",
            },
            answer: 1.67, tol: 0.01,
          },
          {
            q: {
              en: "Baking the 0.491 GB weights into the 0.92 GB base image: the resulting image size, in GB?",
              ru: "Запечь веса 0.491\u00a0ГБ в\u00a0базовый образ 0.92\u00a0ГБ: размер получившегося образа в\u00a0ГБ?",
            },
            answer: 1.41, tol: 0.01,
            hint: {
              en: "0.92 + 0.491: the bake price is a heavy pull and a light start.",
              ru: "0.92 + 0.491: цена bake — тяжёлый pull и лёгкий старт.",
            },
            followUp: {
              q: { en: "Why do the two sizes ADD instead of the weights hiding inside the base layer?", ru: "Почему размеры СКЛАДЫВАЮТСЯ, а не веса прячутся внутри базового слоя?" },
              options: [
                { en: "Layers stack, they do not merge: the weights COPY layer adds its own bytes on top of the base bytes — every layer's data lives in the image", ru: "Слои складываются стопкой, а не сливаются: слой с копией весов добавляет свои байты поверх байтов базы — данные каждого слоя живут в образе" },
                { en: "Docker deduplicates identical bytes, and the weights are new bytes — so they add", ru: "Docker дедуплицирует одинаковые байты, а веса — новые байты, поэтому они складываются" },
                { en: "The weights compress inside the layer, so the sum is approximate", ru: "Веса сжимаются внутри слоя, поэтому сумма приблизительна" },
              ],
              answer: 0,
              explain: { en: "Union layers share files by layer, never shrink them: baking the weights trades pull time for start time, and the bill 1.41 GB is exactly why «minimizing the image is recovery speed».", ru: "Union-слои делят файлы по слоям и никогда не сжимают их: запекание весов меняет время pull на время старта, и счёт 1.41 ГБ — точная причина, почему «минимизация образа — это скорость восстановления»." },
            },
          },
          {
            q: {
              en: "Baking the 0.75 GB weights into the 1.18 GB base image: the resulting image size, in GB?",
              ru: "Запечь веса 0.75\u00a0ГБ в\u00a0базовый образ 1.18\u00a0ГБ: размер получившегося образа в\u00a0ГБ?",
            },
            answer: 1.93, tol: 0.01,
            hint: {
              en: "1.18 + 0.75: the bake price is a heavy pull and a light start.",
              ru: "1.18 + 0.75: цена bake — тяжёлый pull и лёгкий старт.",
            },
            followUp: {
              q: { en: "Why do the two sizes ADD instead of the weights hiding inside the base layer?", ru: "Почему размеры СКЛАДЫВАЮТСЯ, а не веса прячутся внутри базового слоя?" },
              options: [
                { en: "Layers stack, they do not merge: the weights COPY layer adds its own bytes on top of the base bytes — every layer's data lives in the image", ru: "Слои складываются стопкой, а не сливаются: слой с копией весов добавляет свои байты поверх байтов базы — данные каждого слоя живут в образе" },
                { en: "Docker deduplicates identical bytes, and the weights are new bytes — so they add", ru: "Docker дедуплицирует одинаковые байты, а веса — новые байты, поэтому они складываются" },
                { en: "The weights compress inside the layer, so the sum is approximate", ru: "Веса сжимаются внутри слоя, поэтому сумма приблизительна" },
              ],
              answer: 0,
              explain: { en: "Union layers share files by layer, never shrink them: baking the weights trades pull time for start time, and the bill 1.93 GB is exactly why «minimizing the image is recovery speed».", ru: "Union-слои делят файлы по слоям и никогда не сжимают их: запекание весов меняет время pull на время старта, и счёт 1.93 ГБ — точная причина, почему «минимизация образа — это скорость восстановления»." },
            },
          },
        ],
      },
    ],
    exercises: [
      {
        id: "ex1",
        title: { en: "Exercise 1 · Crash-loop backoff", ru: "Упражнение 1 · Backoff crash-loop" },
        brief: {
          en: "Implement <code>backoff_delays(restarts, base_s=0.1, cap_s=60.0)</code> — the crash-loop restart schedule: restart k (0-based) waits <code>min(base_s × 2^k, cap_s)</code>. The intervals GROW — that is the docker-side twin of Kubernetes <code>CrashLoopBackOff</code> (10 s → cap 5 min). Return the list of delays; zero restarts means an empty list. Try the docker knobs (0.1, cap 60) and the k8s knobs (10, cap 300) — the shape is the same.",
          ru: "Реализуй <code>backoff_delays(restarts, base_s=0.1, cap_s=60.0)</code> — расписание рестартов crash-loop: рестарт k (с нуля) ждёт <code>min(base_s × 2^k, cap_s)</code>. Интервалы РАСТУТ — это docker-версия kubernetes-механизма <code>CrashLoopBackOff</code> (10 с → cap 5 мин). Верни список задержек; ноль рестартов — пустой список. Подставь параметры docker (0.1, cap 60) и k8s (10, cap 300) — форма одна.",
        },
        starter: `def backoff_delays(restarts, base_s=0.1, cap_s=60.0):
    """Delays between crash-loop restarts: doubling, capped.

    Returns a list of restarts delays in seconds.
    """
    # TODO: restart k waits min(base_s * 2**k, cap_s), k = 0..restarts-1
    return []
`,
        tests: [
          { name: "docker-style first five", hidden: false, code: `d = backoff_delays(5, 0.1, 60.0)
eq([round(x, 2) for x in d], [0.1, 0.2, 0.4, 0.8, 1.6])` },
          { name: "capped at one minute", hidden: false, code: `d = backoff_delays(12, 0.1, 60.0)
eq(len(d), 12)
eq([round(x, 1) for x in d[-3:]], [51.2, 60.0, 60.0])` },
          { name: "k8s-style backoff", hidden: true, code: `d = backoff_delays(6, 10.0, 300.0)
eq([round(x, 1) for x in d], [10.0, 20.0, 40.0, 80.0, 160.0, 300.0])` },
          { name: "zero restarts, zero waiting", hidden: true, code: `eq(backoff_delays(0, 0.1, 60.0), [])
eq(len(backoff_delays(1, 0.1, 60.0)), 1)` },
        ],
        solution: `def backoff_delays(restarts, base_s=0.1, cap_s=60.0):
    return [min(base_s * 2 ** k, cap_s) for k in range(restarts)]`,
        hints: [
          { en: "One list comprehension: min of the doubling base and the cap, over range(restarts).", ru: "Одно list comprehension: min от удвоенной базы и потолка, по range(restarts)." },
        ],
        numpy: false,
        timeoutMs: 4000,
      },
      {
        id: "ex2",
        title: { en: "Exercise 2 · Freeze the build plan", ru: "Упражнение 2 · Заморозь план сборки" },
        brief: {
          en: "Implement <code>plan_cache_order()</code> — freeze the build plan BEFORE the first build. Fill in <code>chosen_order</code> (one letter: 'A', 'B' or 'C' from <code>options</code>), the <code>predictions</code> dict (keys <code>edit_source</code>, <code>change_source_pin</code>, <code>change_base</code> — which layers rebuild and why), the <code>restart_terms</code> dict (<code>cold</code> = the members of “crashed → answering”, <code>dominant</code> = which member rules for 0.491 GB of weights) and <code>why</code> (one sentence about the cache). No <code>TODO</code> may survive in any string. Then bring the plan alive in code: implement <code>rebuild_on_edit(layers, edited_layer)</code> — the layers from the edited one up (order kept); an unknown layer yields an empty list.",
          ru: "Реализуй <code>plan_cache_order()</code> — заморозь план сборки ДО первой сборки. Заполни <code>chosen_order</code> (одна буква: 'A', 'B' или 'C' из <code>options</code>), dict <code>predictions</code> (ключи <code>edit_source</code>, <code>change_source_pin</code>, <code>change_base</code> — какие слои пересоберутся и почему), dict <code>restart_terms</code> (<code>cold</code> = члены «упал → снова отвечает», <code>dominant</code> = какой член правит при 0.491 ГБ весов) и <code>why</code> (одно предложение про cache). Ни одного <code>TODO</code> в строках остаться не должно. Затем оживи план кодом: реализуй <code>rebuild_on_edit(layers, edited_layer)</code> — список слоёв от отредактированного и выше (порядок сохраняется); неизвестный слой — пустой список.",
        },
        starter: `def plan_cache_order():
    """Freeze the build plan BEFORE the first build: layer order and predictions."""
    options = {
        'A': ['COPY . .', 'RUN pip install -r requirements.txt'],
        'B': ['COPY requirements.txt requirements.txt',
              'RUN pip install -r requirements.txt',
              'COPY app/ app/'],
        'C': ['RUN pip install -r requirements.txt', 'COPY . .'],
    }
    # TODO: pick the layer order - one letter.
    chosen_order = 'TODO'
    return dict(
        chosen_order=chosen_order,
        options=options,
        predictions=dict(
            edit_source='TODO: which layers rebuild and why?',
            change_source_pin='TODO: which layers rebuild and why?',
            change_base='TODO: which layers rebuild and why?'),
        restart_terms=dict(
            cold='TODO: members of "crashed -> answering" joined with +',
            dominant='TODO: which member dominates for 0.491 GB of weights and why'),
        why='TODO: one sentence - why the chosen order protects the cache')

def rebuild_on_edit(layers, edited_layer):
    """Layers from the edited one to the top (order kept); unknown -> []."""
    # TODO: the edited layer and everything above it
    ...
`,
        tests: [
          { name: "order B wins", hidden: false, code: `eq(plan_cache_order()['chosen_order'], 'B')` },
          { name: "predictions are filled", hidden: false, code: `p = plan_cache_order()['predictions']
eq(sorted(p.keys()), ['change_base', 'change_source_pin', 'edit_source'])
eq(all(isinstance(v, str) and v and 'TODO' not in v for v in p.values()), True)` },
          { name: "restart terms are filled", hidden: true, code: `r = plan_cache_order()['restart_terms']
eq(sorted(r.keys()), ['cold', 'dominant'])
eq(all(isinstance(v, str) and v and 'TODO' not in v for v in r.values()), True)
eq('weight' in r['dominant'].lower() or '0.491' in r['dominant'], True)
eq('+' in r['cold'], True)` },
          { name: "why names the cache", hidden: true, code: `why = plan_cache_order()['why']
eq(bool(why) and 'TODO' not in why, True)
eq('cache' in why.lower(), True)` },
        ],
        solution: `def rebuild_on_edit(layers, edited_layer):
    i = layers.index(edited_layer) if edited_layer in layers else len(layers)
    return layers[i:]


def plan_cache_order():
    options = {
        'A': ['COPY . .', 'RUN pip install -r requirements.txt'],
        'B': ['COPY requirements.txt requirements.txt',
              'RUN pip install -r requirements.txt',
              'COPY app/ app/'],
        'C': ['RUN pip install -r requirements.txt', 'COPY . .'],
    }
    return dict(
        chosen_order='B',
        options=options,
        predictions=dict(
            edit_source='compile layer and above; fetch and below stay cache hits',
            change_source_pin='fetch layer and above: a new commit means new tree bytes',
            change_base='the whole stack: the foundation changed'),
        restart_terms=dict(
            cold='extract layers + load weights + server init + first /health',
            dominant='weight loading (0.491 GB): the only hundred-megabyte member'),
        rebuild_on_edit=rebuild_on_edit,
        why='rarely-changing context above the heavy layer keeps the dependency cache hit')
`,
        hints: [
          { en: "Order B copies the rarely-changing manifest before the heavy install; a cache hit for a layer needs everything below it unchanged.", ru: "Порядок B копирует редко меняющийся манифест до тяжёлой установки; попадание в кэш слоя возможно, только если всё под ним не менялось." },
        ],
        numpy: false,
        timeoutMs: 4000,
      },
      {
        id: "ex3",
        title: { en: "Exercise 3 · Fix the bug: 137 is not an app code", ru: "Упражнение 3 · Почини баг: 137 — это не код приложения" },
        brief: {
          en: "This <code>diagnose_exit(exit_code, log_tail, oomkilled=None)</code> treats 137 as an application exit code. It is not: codes ≥ 128 encode a signal death — 137 = 128 + 9 (SIGKILL), 143 = 128 + 15 (SIGTERM). Fix it to the contract: <code>oomkilled</code> true, exit 137, or an <code>oom</code>/<code>sigkill</code> hint in the log → kind <code>'oom'</code> with sig 9 (memory cgroup limit); any other signal death → <code>'sigterm'</code> for 15 (a graceful stop, not a crash; other signals → <code>'signalled'</code>); exit 1 with <code>manifest unknown</code> / <code>not found</code> in the log → <code>'tag_drift'</code>; 125 → <code>'daemon_error'</code>; 127 → <code>'command_not_found'</code>; otherwise <code>'unclassified'</code>. Return <code>{'kind': …, 'sig': signal or None, 'fix': …}</code> with a non-empty <code>fix</code>.",
          ru: "Эта <code>diagnose_exit(exit_code, log_tail, oomkilled=None)</code> трактует 137 как код приложения. Это не так: коды ≥ 128 кодируют смерть от сигнала — 137 = 128 + 9 (SIGKILL), 143 = 128 + 15 (SIGTERM). Починь по контракту: <code>oomkilled</code> истинно, exit 137 или подсказка <code>oom</code>/<code>sigkill</code> в логе → kind <code>'oom'</code> с sig 9 (лимит memory cgroup); любая другая смерть от сигнала → <code>'sigterm'</code> для 15 (штатная остановка, не падение; прочие сигналы → <code>'signalled'</code>); exit 1 с <code>manifest unknown</code> / <code>not found</code> в логе → <code>'tag_drift'</code>; 125 → <code>'daemon_error'</code>; 127 → <code>'command_not_found'</code>; иначе <code>'unclassified'</code>. Верни <code>{'kind': …, 'sig': сигнал или None, 'fix': …}</code> с непустым <code>fix</code>.",
        },
        starter: `def diagnose_exit(exit_code, log_tail, oomkilled=None):
    """Classify one container failure from exit code, log tail and inspect flag.

    Returns {'kind': str, 'sig': int or None, 'fix': str}.
    """
    # BUG: 137 is treated as an application exit code. It is not:
    # codes >= 128 mean the kernel killed the process with signal
    # (code - 128). A bare 137 must still read as SIGKILL / OOM.
    low = log_tail.lower()
    if oomkilled is True and 'oom' in low:
        return {'kind': 'oom', 'sig': 9,
                'fix': 'raise --memory to resident x1.5'}
    if exit_code == 137:
        return {'kind': 'app_exit', 'sig': None,
                'fix': 'read the application traceback for exit 137'}
    if exit_code == 1 and ('manifest unknown' in low or 'not found' in low):
        return {'kind': 'tag_drift', 'sig': None,
                'fix': 'pin the image digest, not a floating tag'}
    if exit_code == 125:
        return {'kind': 'daemon_error', 'sig': None,
                'fix': 'read the daemon error; check the run flags'}
    if exit_code == 127:
        return {'kind': 'command_not_found', 'sig': None,
                'fix': 'check CMD/entrypoint and PATH'}
    return {'kind': 'unclassified', 'sig': None,
            'fix': 'read docker logs and docker inspect'}
`,
        tests: [
          { name: "OOMKilled + oom log is oom", hidden: false, code: `log = "srv load_model: loading model /models/model.gguf\\nkernel: oom-kill:memcg limit exceeded, victim killed by SIGKILL\\nexit status 137"
d = diagnose_exit(137, log, oomkilled=True)
eq(d['kind'], 'oom')
eq(d['sig'], 9)` },
          { name: "bare 137 is still 128+SIGKILL", hidden: false, code: `d = diagnose_exit(137, "srv listening on 8080", None)
eq(d['kind'], 'oom')
eq(d['sig'], 9)` },
          { name: "143 is SIGTERM, not a crash", hidden: true, code: `d = diagnose_exit(143, "srv shutting down on request", None)
eq(d['kind'], 'sigterm')
eq(d['sig'], 15)` },
          { name: "manifest unknown is tag drift", hidden: true, code: `d = diagnose_exit(1, "Error response from daemon: manifest unknown", None)
eq(d['kind'], 'tag_drift')
eq(d['sig'], None)` },
        ],
        solution: `def diagnose_exit(exit_code, log_tail, oomkilled=None):
    low = log_tail.lower()
    sig = exit_code - 128 if exit_code >= 128 else None
    if oomkilled or exit_code == 137 or (sig == 9 and ('oom' in low or 'sigkill' in low)):
        return {'kind': 'oom', 'sig': 9,
                'fix': 'limit = resident x1.5; the memory limit is admission control'}
    if sig is not None:
        kind = 'sigterm' if sig == 15 else 'signalled'
        return {'kind': kind, 'sig': sig,
                'fix': 'a signal death, not an application exit code'}
    if exit_code == 1 and ('manifest unknown' in low or 'not found' in low):
        return {'kind': 'tag_drift', 'sig': None,
                'fix': 'pin the image digest, not a floating tag'}
    if exit_code == 125:
        return {'kind': 'daemon_error', 'sig': None,
                'fix': 'read the daemon error; check the run flags'}
    if exit_code == 127:
        return {'kind': 'command_not_found', 'sig': None,
                'fix': 'check CMD/entrypoint and PATH'}
    return {'kind': 'unclassified', 'sig': None,
            'fix': 'read docker logs and docker inspect'}`,
        hints: [
          { en: "Decode the signal first: sig = exit − 128 for codes ≥ 128. Then 137 / oomkilled / oom-in-log → oom; remaining signal deaths → sigterm (15) or signalled; only after that the app-code branches.", ru: "Сначала декодируй сигнал: sig = exit − 128 для кодов ≥ 128. Затем 137 / oomkilled / oom-в-логе → oom; прочие смерти от сигналов → sigterm (15) или signalled; и только потом ветки кодов приложения." },
        ],
        numpy: false,
        timeoutMs: 4000,
      },
      {
        id: "rt1",
        title: { en: "Exercise 4 · Verify the runtime journal with your own hash walk", ru: "Упражнение 4 · Пересчитай журнал рантайма своим хэш-ходом" },
        brief: {
          en: "Requires the local runtime (Layer 2 section below). Your gateway journals every measurement as an entry <code>{seq, ts, kind, payload, prev, hash}</code> where <code>hash = sha256(\"{seq}|{ts}|{kind}|{payload_sorted}|{prev}\")</code>, <code>payload_sorted = json.dumps(payload, sort_keys=True, ensure_ascii=False)</code>, and the first entry points at 64 zeros. Running the tests injects your <em>actual</em> journal as <code>entries</code> (a list of dicts). Implement <code>verify_chain(entries) -> (ok, broken_at)</code>: walk the list in order; <code>ok</code> is False at the first index where <code>seq != index</code>, the recomputed hash differs, or <code>prev</code> does not point at the previous hash. Tests use fixed fixtures, not your live journal — but after passing, run your function on <code>entries</code> yourself and compare with the gateway's own verdict.",
          ru: "Требуется локальный рантайм (секция Layer 2 ниже). Шлюз журналирует каждое измерение записью <code>{seq, ts, kind, payload, prev, hash}</code>, где <code>hash = sha256(\"{seq}|{ts}|{kind}|{payload_sorted}|{prev}\")</code>, <code>payload_sorted = json.dumps(payload, sort_keys=True, ensure_ascii=False)</code>, а первая запись указывает на 64 нуля. Запуск тестов подставляет твой <em>настоящий</em> журнал как <code>entries</code> (список словарей). Реализуй <code>verify_chain(entries) -> (ok, broken_at)</code>: идём по списку; <code>ok</code> — False на первом индексе, где <code>seq != index</code>, пересчитанный хэш отличается или <code>prev</code> не указывает на предыдущий хэш. Тесты используют фикстуры, а не твой живой журнал — но после прохождения запусти свою функцию на <code>entries</code> и сравни с вердиктом самого шлюза.",
        },
        starter: `import hashlib, json

def verify_chain(entries):
    """Walk a hash-chained journal: return (ok, broken_at).
    broken_at is the list index of the first broken entry, None if ok."""
    # TODO: prev starts as 64 zeros; at each step recompute
    # hash = sha256(f"{seq}|{ts}|{kind}|{payload_sorted}|{prev}")
    # and compare seq, hash and prev. Return (True, None) or (False, index).
`,
        tests: [
          { name: "intact chain verifies", hidden: false, code: (
            "import hashlib, json\n" +
            "def _h(seq, ts, kind, payload, prev):\n" +
            "    canon = json.dumps(payload, sort_keys=True, ensure_ascii=False)\n" +
            "    return hashlib.sha256(f\"{seq}|{ts}|{kind}|{canon}|{prev}\".encode()).hexdigest()\n" +
            "P = '0'*64\n" +
            "chain = []\n" +
            "for i, (ts, kind, payload) in enumerate([('2026-11-14T10:00:00Z','genesis',{'note':'n'}),('2026-11-14T10:01:00Z','experiment',{'wall_s':0.9}),('2026-11-14T10:02:00Z','note',{'note':'x'})]):\n" +
            "    e = {'seq': i, 'ts': ts, 'kind': kind, 'payload': payload, 'prev': P}\n" +
            "    e['hash'] = _h(i, ts, kind, payload, P); chain.append(e); P = e['hash']\n" +
            "ok, at = verify_chain(chain)\n" +
            "eq(ok, True)\n" +
            "eq(at, None)"
          )},
          { name: "tampered payload is caught at its index", hidden: false, code: (
            "import hashlib, json\n" +
            "def _h(seq, ts, kind, payload, prev):\n" +
            "    canon = json.dumps(payload, sort_keys=True, ensure_ascii=False)\n" +
            "    return hashlib.sha256(f\"{seq}|{ts}|{kind}|{canon}|{prev}\".encode()).hexdigest()\n" +
            "P = '0'*64\n" +
            "chain = []\n" +
            "for i, (ts, kind, payload) in enumerate([('t0','genesis',{'note':'n'}),('t1','experiment',{'wall_s':0.9}),('t2','note',{'note':'x'})]):\n" +
            "    e = {'seq': i, 'ts': ts, 'kind': kind, 'payload': payload, 'prev': P}\n" +
            "    e['hash'] = _h(i, ts, kind, payload, P); chain.append(e); P = e['hash']\n" +
            "chain[1]['payload']['wall_s'] = 0.0001  # someone 'speeds up' history\n" +
            "ok, at = verify_chain(chain)\n" +
            "eq(ok, False)\n" +
            "eq(at, 1)"
          )},
          { name: "seq gap is caught", hidden: true, code: (
            "import hashlib, json\n" +
            "def _h(seq, ts, kind, payload, prev):\n" +
            "    canon = json.dumps(payload, sort_keys=True, ensure_ascii=False)\n" +
            "    return hashlib.sha256(f\"{seq}|{ts}|{kind}|{canon}|{prev}\".encode()).hexdigest()\n" +
            "P = '0'*64\n" +
            "chain = []\n" +
            "for seq, (ts, kind, payload) in zip([0, 1, 3], [('t0','genesis',{}),('t1','note',{}),('t3','note',{})]):\n" +
            "    e = {'seq': seq, 'ts': ts, 'kind': kind, 'payload': payload, 'prev': P}\n" +
            "    e['hash'] = _h(seq, ts, kind, payload, P); chain.append(e); P = e['hash']\n" +
            "ok, at = verify_chain(chain)\n" +
            "eq(ok, False)\n" +
            "eq(at, 2)"
          )},
          { name: "prev-link broken but hashes self-consistent is caught", hidden: true, code: (
            "import hashlib, json\n" +
            "def _h(seq, ts, kind, payload, prev):\n" +
            "    canon = json.dumps(payload, sort_keys=True, ensure_ascii=False)\n" +
            "    return hashlib.sha256((f\"{seq}|{ts}|{kind}|{canon}|{prev}\").encode()).hexdigest()\n" +
            "P = '0'*64\n" +
            "chain = []\n" +
            "for i, (ts, kind, payload) in enumerate([('t0','genesis',{'note':'n'}),('t1','experiment',{'wall_s':0.9}),('t2','note',{'note':'x'})]):\n" +
            "    e = {'seq': i, 'ts': ts, 'kind': kind, 'payload': payload, 'prev': P}\n" +
            "    e['hash'] = _h(i, ts, kind, payload, P); chain.append(e); P = e['hash']\n" +
            "chain[2]['prev'] = 'f'*64\n" +
            "ok, at = verify_chain(chain)\n" +
            "eq(ok, False)\n" +
            "eq(at, 2)"
          )},
          { name: "first breakage wins (seq hole at 1, tamper at 3)", hidden: true, code: (
            "import hashlib, json\n" +
            "def _h(seq, ts, kind, payload, prev):\n" +
            "    canon = json.dumps(payload, sort_keys=True, ensure_ascii=False)\n" +
            "    return hashlib.sha256((f\"{seq}|{ts}|{kind}|{canon}|{prev}\").encode()).hexdigest()\n" +
            "P = '0'*64\n" +
            "chain = []\n" +
            "for seq, (ts, kind, payload) in zip([0, 2, 3, 4], [('t0','genesis',{}),('t2','note',{}),('t3','note',{}),('t4','note',{})]):\n" +
            "    e = {'seq': seq, 'ts': ts, 'kind': kind, 'payload': payload, 'prev': P}\n" +
            "    e['hash'] = _h(seq, ts, kind, payload, P); chain.append(e); P = e['hash']\n" +
            "chain[3]['payload']['note'] = 'rewritten'\n" +
            "ok, at = verify_chain(chain)\n" +
            "eq(ok, False)\n" +
            "eq(at, 1)"
          )},
          { name: "genesis-only chain verifies", hidden: true, code: (
            "import hashlib, json\n" +
            "def _h(seq, ts, kind, payload, prev):\n" +
            "    canon = json.dumps(payload, sort_keys=True, ensure_ascii=False)\n" +
            "    return hashlib.sha256(f\"{seq}|{ts}|{kind}|{canon}|{prev}\".encode()).hexdigest()\n" +
            "chain = [{'seq': 0, 'ts': 't0', 'kind': 'genesis', 'payload': {}, 'prev': '0'*64, 'hash': _h(0, 't0', 'genesis', {}, '0'*64)}]\n" +
            "ok, at = verify_chain(chain)\n" +
            "eq((ok, at), (True, None))"
          )},
        ],
        solution: `import hashlib, json

def verify_chain(entries):
    prev = "0" * 64
    for i, e in enumerate(entries):
        if e["seq"] != i:
            return (False, i)
        canon = json.dumps(e["payload"], sort_keys=True, ensure_ascii=False)
        expected = hashlib.sha256(f'{e["seq"]}|{e["ts"]}|{e["kind"]}|{canon}|{prev}'.encode()).hexdigest()
        if e["hash"] != expected:
            return (False, i)
        if e["prev"] != prev:
            return (False, i)
        prev = e["hash"]
    return (True, None)`,
        hints: [
          { en: "Seed prev with 64 zeros; at each index recompute sha256 of seq|ts|kind|payload_sorted|prev and compare all three: seq == index, hash, prev.", ru: "Инициализируй prev 64 нулями; на каждом индексе пересчитай sha256 от seq|ts|kind|payload_sorted|prev и сверь три вещи: seq == index, hash, prev." },
          { en: "Return the FIRST broken index — walk in order, not sorted by seq.", ru: "Возвращай ПЕРВЫЙ сломанный индекс — идём по порядку списка, а не по сортировке seq." },
        ],
        injectEntries: true,
        fixtureEntries: [{"seq": 0, "ts": "2026-11-14T10:00:00Z", "kind": "genesis", "payload": {"note": "fixture build"}, "prev": "0000000000000000000000000000000000000000000000000000000000000000", "hash": "25b4d9889cf032d0ac61e44733c49c521a24f150175c6e4fff3cb37320037655"}, {"seq": 1, "ts": "2026-11-14T10:01:12Z", "kind": "experiment", "payload": {"wall_s": 1.2}, "prev": "25b4d9889cf032d0ac61e44733c49c521a24f150175c6e4fff3cb37320037655", "hash": "77c50a7e2bfd4e0a46c12a0d24db6a05d9190b2da167463d185ce157a2bb4a1a"}, {"seq": 2, "ts": "2026-11-14T10:02:03Z", "kind": "note", "payload": {"note": "gateway up"}, "prev": "77c50a7e2bfd4e0a46c12a0d24db6a05d9190b2da167463d185ce157a2bb4a1a", "hash": "e5ab4d6b1f22ceaf059e4d4b3e0f457a32292a400a7b7dcc36f1362b99402957"}, {"seq": 3, "ts": "2026-11-14T10:03:40Z", "kind": "burst", "payload": {"admitted": 8, "rejected": 16}, "prev": "e5ab4d6b1f22ceaf059e4d4b3e0f457a32292a400a7b7dcc36f1362b99402957", "hash": "616675fd803a5e669b930c9bea04aa0f89c5100acb4cb40945cfd0274b2c6222"}],
        numpy: false,
        timeoutMs: 4000,
      },
    ],
    challenge: {
      id: "chal1",
      word: { en: "challenge", ru: "челлендж" },
      title: {
        en: "★ Grow the chain on your own engine",
        ru: "★ Вырасти цепочку на своём движке",
      },
      brief: {
        en: "Needs the Layer 2 runtime. Make <strong>at least two measured experiments</strong> with the «Run experiment» button, then press «Journal» and «Verify chain». Report what you saw: the gateway must hold <strong>≥ 2 experiment entries</strong>, the chain must verify clean, and the last sequence number must match the entry count (every entry appends exactly one seq). No tests guide you — the numbers are your own journal's.",
        ru: "Нужен рантайм слоя 2. Сделай <strong>минимум два измеренных эксперимента</strong> кнопкой «Эксперимент», затем нажми «Журнал» и «Проверить цепочку». Отчитайся, что видел: в шлюзе должно быть <strong>≥ 2 записей-экспериментов</strong>, цепочка обязана верифицироваться чисто, а последний seq должен соответствовать числу записей (каждая запись добавляет ровно один seq). Тестов-каркаса нет — числа из твоего собственного журнала.",
      },
      goal: {
        en: "Report your live journal: total entries ≥ 2 (with ≥ 2 experiments), chain verified, last_seq = entries − 1.",
        ru: "Отчитайся по живому журналу: записей ≥ 2 (из них ≥ 2 эксперимента), цепочка верна, last_seq = записей − 1.",
      },
      mode: "report",
      fields: [
        { key: "n", label: { en: "entries (journal line)", ru: "записей (строка журнала)" }, type: "number" },
        { key: "experiments", label: { en: "experiments you ran", ru: "экспериментов сделано" }, type: "number" },
        { key: "last_seq", label: { en: "last seq (# of the newest entry)", ru: "последний seq (# новейшей записи)" }, type: "number" },
        { key: "chain", label: { en: "chain verify (true/false)", ru: "проверка цепочки (true/false)" }, type: "text", placeholder: { en: "true", ru: "true" } },
      ],
      check: (v) => {
        const n = parseInt(String(v.n || ""), 10);
        const exp = parseInt(String(v.experiments || ""), 10);
        const last = parseInt(String(v.last_seq || ""), 10);
        const chain = String(v.chain || "").trim().toLowerCase();
        if (![n, exp, last].every((x) => Number.isFinite(x)) || !["true", "1", "да", "ok"].includes(chain)) {
          return { ok: false, note: { en: "fill every field; chain must be true — a broken chain is an incident, not a report", ru: "заполни все поля; chain обязан быть true — сломанная цепь это инцидент, а не отчёт" } };
        }
        if (exp < 2) {
          return { ok: false, note: { en: "run at least 2 experiments - one data point is an anecdote", ru: "сделай минимум 2 эксперимента — одна точка это анекдот" } };
        }
        if (n < 3) {
          return { ok: false, note: { en: "at least 3 entries: the genesis + your two experiments", ru: "минимум 3 записи: genesis + твои два эксперимента" } };
        }
        if (last !== n - 1) {
          return { ok: false, note: { en: "seqs are 0-based and append-only: last_seq must be entries − 1 (" + (n - 1) + "), got " + last, ru: "seq нумеруется с нуля и только растёт: last_seq должен быть записей − 1 (" + (n - 1) + "), а не " + last } };
        }
        return { ok: true, note: { en: n + " entries, " + exp + " experiments, chain verified, head seq " + last + " — your journal is a real hash chain now", ru: n + " записей, " + exp + " эксперимента, цепочка верна, головной seq " + last + " — твой журнал теперь настоящая хэш-цепочка" } };
      },
      reference: {
        en: `# A walk you already know from Exercise 4, on YOUR data:
#   1) press "Run experiment" twice (different prompts if you like);
#   2) press "Journal" - note the entry count and the head hash prefix;
#   3) press "Verify chain" - expect «chain verified».
# Report: entries (the count), experiments (>= 2), last_seq (entries - 1,
# seqs start at the genesis 0), chain = true.
# The point: the chain's head hash commits to ALL history - the number you
# report is unforgeable without redoing every measurement.`,
        ru: `# Этот маршрут ты уже знаешь из Упражнения 4, но на СВОИХ данных:
#   1) нажми «Эксперимент» дважды (можно с разными промптами);
#   2) нажми «Журнал» - заметь число записей и префикс головного хеша;
#   3) нажми «Проверить цепочку» - ожидай «chain verified».
# Отчет: записи (число), эксперименты (>= 2), last_seq (записи - 1,
# seq с нуля), chain = true.
# Смысл: головный хеш цепочки фиксирует всю историю - число, которое ты
# сообщаешь, неподделаешь без повторения каждого измерения.`,
      },
    },
    runtime: {
      title: {
        en: "Measure on your own engine: the practice runtime",
        ru: "Измерь на своём движке: practice-рантайм",
      },
      brief: {
        en: "Download the runtime ZIP, run <code>docker compose up -d</code>, and this page connects to a real llama.cpp server on your machine (pinned image digest, weights verified by sha256, hard <code>mem_limit: 1200m</code> — the Topic 09 lesson running live). Your student code still executes in the browser sandbox; the page only talks to the gateway at 127.0.0.1:8760 and journals every measurement into a hash chain: each entry hashes the previous one, so a tamper cannot go unnoticed.",
        ru: "Скачай ZIP рантайма, запусти <code>docker compose up -d</code> — и эта страница подключится к настоящему llama.cpp server на твоей машине (образ запинен по дайджесту, веса проверяются по sha256, жёсткий <code>mem_limit: 1200m</code> — урок Темы 09 вживую). Твой код по-прежнему исполняется в песочнице браузера; страница ходит только в шлюз на 127.0.0.1:8760 и журналирует каждое измерение в хэш-цепочку: хэш каждой записи считается от хэша предыдущей, так что подделка не может остаться незамеченной.",
      },
      experimentPrompt: {
        en: "In one short sentence, explain what an image digest pins.",
        ru: "Одним коротким предложением объясни, что даёт пин дайджеста образа.",
      },
      footer: {
        en: "Measurements are machine-local and honest — the course cites them only as your own. The chain-walk exercise above recomputes the gateway's journal with your Python; the gateway's own verifier is at GET /journal/verify.",
        ru: "Измерения машинно-локальные и честные — курс цитирует их только как твои собственные. Упражнение с проходом по цепочке пересчитывает журнал шлюза твоим Python; собственный верификатор шлюза — GET /journal/verify.",
      },
    },
    posttest: [
      {
        id: "p1",
        q: { en: "A container exits with code 137 after a memory limit. 137 means\u2026", ru: "\u041a\u043e\u043d\u0442\u0435\u0439\u043d\u0435\u0440 \u0432\u044b\u0448\u0435\u043b \u0441\u00a0\u043a\u043e\u0434\u043e\u043c 137 \u043f\u043e\u0441\u043b\u0435 \u0441\u0440\u0430\u0431\u0430\u0442\u044b\u0432\u0430\u043d\u0438\u044f \u043b\u0438\u043c\u0438\u0442\u0430 \u043f\u0430\u043c\u044f\u0442\u0438. 137 \u043e\u0437\u043d\u0430\u0447\u0430\u0435\u0442\u2026" },
        options: [{ en: "128 + SIGKILL(9): the kernel killed it", ru: "128 + SIGKILL(9): \u0443\u0431\u0438\u043b\u043e \u044f\u0434\u0440\u043e" }, { en: "an application error 137", ru: "\u043e\u0448\u0438\u0431\u043a\u0430 \u043f\u0440\u0438\u043b\u043e\u0436\u0435\u043d\u0438\u044f 137" }, { en: "a docker bug", ru: "\u0431\u0430\u0433 docker" }],
        answer: 0,
        explain: { en: "137 = 128 + 9: the cgroup OOM kill delivers SIGKILL \u2014 an incident, not an app crash.", ru: "137 = 128 + 9: cgroup OOM-kill \u0434\u043e\u0441\u0442\u0430\u0432\u043b\u044f\u0435\u0442 SIGKILL \u2014 \u044d\u0442\u043e \u0438\u043d\u0446\u0438\u0434\u0435\u043d\u0442, \u0430\u00a0\u043d\u0435 \u043f\u0430\u0434\u0435\u043d\u0438\u0435 \u043f\u0440\u0438\u043b\u043e\u0436\u0435\u043d\u0438\u044f." },
      },
      {
        id: "p2",
        q: { en: "Layer order \u00abB\u00bb (context before the heavy dependency layer) protects\u2026", ru: "\u041f\u043e\u0440\u044f\u0434\u043e\u043a \u0441\u043b\u043e\u0451\u0432 \u00abB\u00bb (\u043a\u043e\u043d\u0442\u0435\u043a\u0441\u0442 \u0434\u043e \u0442\u044f\u0436\u0451\u043b\u043e\u0433\u043e \u0441\u043b\u043e\u044f \u0437\u0430\u0432\u0438\u0441\u0438\u043c\u043e\u0441\u0442\u0435\u0439) \u0431\u0435\u0440\u0435\u0436\u0451\u0442\u2026" },
        options: [{ en: "the layer cache: source edits rebuild less", ru: "\u043a\u044d\u0448 \u0441\u043b\u043e\u0451\u0432: \u043f\u0440\u0430\u0432\u043a\u0438 \u0438\u0441\u0445\u043e\u0434\u043d\u0438\u043a\u043e\u0432 \u043f\u0435\u0440\u0435\u0441\u043e\u0431\u0438\u0440\u0430\u044e\u0442 \u043c\u0435\u043d\u044c\u0448\u0435" }, { en: "image size", ru: "\u0440\u0430\u0437\u043c\u0435\u0440 \u043e\u0431\u0440\u0430\u0437\u0430" }, { en: "the model weights", ru: "\u0432\u0435\u0441\u0430 \u043c\u043e\u0434\u0435\u043b\u0438" }],
        answer: 0,
        explain: { en: "Fewer-changing context above the heavy layer keeps cache hits for dependencies; the compile layer still rebuilds.", ru: "\u0420\u0435\u0436\u0435 \u043c\u0435\u043d\u044f\u044e\u0449\u0438\u0439\u0441\u044f \u043a\u043e\u043d\u0442\u0435\u043a\u0441\u0442 \u0432\u044b\u0448\u0435 \u0442\u044f\u0436\u0451\u043b\u043e\u0433\u043e \u0441\u043b\u043e\u044f \u0441\u043e\u0445\u0440\u0430\u043d\u044f\u0435\u0442 \u043f\u043e\u043f\u0430\u0434\u0430\u043d\u0438\u044f \u0432\u00a0\u043a\u044d\u0448 \u0437\u0430\u0432\u0438\u0441\u0438\u043c\u043e\u0441\u0442\u0435\u0439; \u0441\u043b\u043e\u0439 \u043a\u043e\u043c\u043f\u0438\u043b\u044f\u0446\u0438\u0438 \u0432\u0441\u0451 \u0440\u0430\u0432\u043d\u043e \u043f\u0435\u0440\u0435\u0441\u043e\u0431\u0438\u0440\u0430\u0435\u0442\u0441\u044f." },
      },
      {
        id: "p3",
        q: { en: "After the sizing fix the limit is set from\u2026", ru: "\u041f\u043e\u0441\u043b\u0435 \u043f\u043e\u0447\u0438\u043d\u043a\u0438 \u043b\u0438\u043c\u0438\u0442 \u0432\u044b\u0447\u0438\u0441\u043b\u044f\u0435\u0442\u0441\u044f \u0438\u0437\u2026" },
        options: [{ en: "measured resident memory \u00d7 ~1.5 headroom", ru: "\u0438\u0437\u043c\u0435\u0440\u0435\u043d\u043d\u043e\u0439 \u0440\u0435\u0437\u0438\u0434\u0435\u043d\u0442\u043d\u043e\u0439 \u043f\u0430\u043c\u044f\u0442\u0438 \u00d7 \u0437\u0430\u043f\u0430\u0441 ~1.5" }, { en: "budget ÷ 2 with no KV headroom", ru: "budget ÷ 2 без запаса на KV" }, { en: "peak RSS with zero headroom", ru: "пиковый RSS без запаса" }],
        answer: 0,
        explain: { en: "Resident ~760 MiB \u00d7 1.5 = 1140 \u2192 rounded up to the 1200 m limit: room to live, cgroup OOM never fires, crash-loop stops.", ru: "\u0420\u0435\u0437\u0438\u0434\u0435\u043d\u0442 ~760\u00a0\u041c\u0438\u0411 \u00d7 1.5 = 1140 \u2192 docker-\u043b\u0438\u043c\u0438\u0442 1200m (\u043e\u043a\u0440\u0443\u0433\u043b\u0438\u043b\u0438 \u0432\u0432\u0435\u0440\u0445): \u0435\u0441\u0442\u044c \u0433\u0434\u0435 \u0436\u0438\u0442\u044c, cgroup OOM \u043d\u0435 \u0441\u0442\u0440\u0435\u043b\u044f\u0435\u0442, crash-loop \u043f\u0440\u0435\u043a\u0440\u0430\u0449\u0430\u0435\u0442\u0441\u044f." },
      },
    ],
    reward: {
      caption: { en: "Pinned, lean, healthchecked — and you verified the journal with your own hash walk.", ru: "Запиненный, компактный, с healthcheck — и ты пересчитал журнал своим хэш-ходом." },
    },
    footer: {
      en: "Teaching arithmetic with declared constants (137 = 128+9, backoff 0.1 s × 2^k cap 60 s, sizes from the course reference table) — not a measurement of your machine. The measured fleet runs live in the Topic 09 evidence runs (runs/2026-11-07-topic09-fleet-mac and runs/2026-11-14-topic09-fleet-mac); this lab does not execute them.",
      ru: "Учебная арифметика с заявленными константами (137 = 128+9, backoff 0.1 с × 2^k cap 60 с, размеры из эталонной таблицы курса) — не измерение твоей машины. Измеренные прогоны флота живут в evidence-прогонах Темы 09 (runs/2026-11-07-topic09-fleet-mac и runs/2026-11-14-topic09-fleet-mac); эта лаба их не исполняет.",
    },
  };
})();
