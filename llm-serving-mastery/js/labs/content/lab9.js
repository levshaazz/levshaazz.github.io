/* Lab 09 — Docker: the container as the production unit.
   Content module for the generic lab page (window.LABS_CONTENT['9']).
   Sources: seminars/09-docker-llm-inference.ipynb and its generator
   scripts/build-topic09-notebook.py (plan_cache_order, diagnose_exit,
   the crash-loop backoff of the OOM incident). Declared teaching model only. */
(function () {
  "use strict";
  window.LABS_CONTENT = window.LABS_CONTENT || {};

  LABS_CONTENT["9"] = {
    title: {
      en: "Docker: the production unit",
      ru: "Docker: производственная единица",
    },
    sub: {
      en: "Layer order and cache hits, exit 137 decoded as 128+SIGKILL, crash-loop backoff that grows, restart-to-ready as named members.",
      ru: "Порядок слоёв и cache hit, exit 137 как 128+SIGKILL, crash-loop backoff с растущими интервалами, рестарт-до-готовности как именованные члены.",
    },
    intro: {
      en: `<p>An image is an ordered stack of layers, and the build cache has one law: a layer hit survives only while neither it nor anything <em>below</em> it changed — editing a layer rebuilds it and everything above. For an LLM image the size accounting is brutal: the binary is megabytes, the weights (Qwen2.5-0.5B Q4_K_M — 0.491 GB) dominate whatever you do with the Dockerfile. And when a pod touches pages beyond its <code>--memory</code> wall, the kernel kills it: exit 137 is not an application code but 128 + 9 (SIGKILL), the restart policy brings it back with a <strong>growing backoff</strong> (100 ms → … → 1 min; Kubernetes calls it CrashLoopBackOff), and only the exit code, the log tail and <code>OOMKilled</code> tell the story.</p>
<p>The lab habit: freeze the build plan (layer order, per-edit invalidation, restart members) before the first build; diagnose from evidence, not vibes — code + log + inspect; treat "crashed → answering again" as a sum of named members: layer extract + weight loading + server init + first <code>/health</code>. Minimizing the image is recovery speed.</p>`,
      ru: `<p>Образ — упорядоченная стопка слоёв, и у build-кэша один закон: hit слоя живёт, пока не изменились ни он сам, ни что-либо <em>под</em> ним — правка слоя пересобирает его и всё выше. Для LLM-образа бухгалтерия размера жёсткая: бинарник — мегабайты, а веса (Qwen2.5-0.5B Q4_K_M — 0.491 ГБ) доминируют, что бы ты ни делал с Dockerfile. Когда под касается страниц за стеной <code>--memory</code>, ядро его убивает: exit 137 — не код приложения, а 128 + 9 (SIGKILL), restart-политика поднимает контейнер снова с <strong>растущим backoff</strong> (100 мс → … → 1 мин; в Kubernetes это CrashLoopBackOff), и только код выхода, хвост журнала и <code>OOMKilled</code> рассказывают историю.</p>
<p>Привычка лабы: заморозить план сборки (порядок слоёв, инвалидация по правке, члены рестарта) до первой сборки; диагностировать по доказательствам, а не по ощущениям — код + лог + inspect; считать «упал → снова отвечает» суммой именованных членов: extract слоёв + загрузка весов + init сервера + первый <code>/health</code>. Минимизация размера — это скорость восстановления.</p>`,
    },
    figures: [
      { id: "t9-layer-stack", caption: { en: "Layer stack: order decides the cache bill.", ru: "\u0421\u0442\u043e\u043f\u043a\u0430 \u0441\u043b\u043e\u0451\u0432: \u043f\u043e\u0440\u044f\u0434\u043e\u043a \u043e\u043f\u0440\u0435\u0434\u0435\u043b\u044f\u0435\u0442 \u0441\u0447\u0451\u0442 \u0437\u0430 \u043a\u044d\u0448." } },
      { id: "t9-startup-economics", caption: { en: "Startup economics: extract, weights, init, health.", ru: "\u042d\u043a\u043e\u043d\u043e\u043c\u0438\u043a\u0430 \u0441\u0442\u0430\u0440\u0442\u0430: extract, \u0432\u0435\u0441\u0430, init, health." } },
    ],
    outcomes: [
      { en: "Predict cache invalidation before a build and read exit codes like an incident.", ru: "\u041f\u0440\u0435\u0434\u0441\u043a\u0430\u0437\u044b\u0432\u0430\u0442\u044c \u0438\u043d\u0432\u0430\u043b\u0438\u0434\u0430\u0446\u0438\u044e \u043a\u044d\u0448\u0430 \u0434\u043e \u0441\u0431\u043e\u0440\u043a\u0438 \u0438 \u0447\u0438\u0442\u0430\u0442\u044c exit-\u043a\u043e\u0434\u044b \u043a\u0430\u043a \u0438\u043d\u0446\u0438\u0434\u0435\u043d\u0442." },
      { en: "Size recovery from resident memory and verify a measurement journal with your own hash walk.", ru: "\u0421\u0430\u0439\u0437\u0438\u0442\u044c \u0432\u043e\u0441\u0441\u0442\u0430\u043d\u043e\u0432\u043b\u0435\u043d\u0438\u0435 \u043e\u0442 \u0440\u0435\u0437\u0438\u0434\u0435\u043d\u0442\u043d\u043e\u0439 \u043f\u0430\u043c\u044f\u0442\u0438 \u0438 \u0432\u0435\u0440\u0438\u0444\u0438\u0446\u0438\u0440\u043e\u0432\u0430\u0442\u044c \u0436\u0443\u0440\u043d\u0430\u043b \u0441\u0432\u043e\u0438\u043c \u0445\u044d\u0448-\u0445\u043e\u0434\u043e\u043c." },
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
          en: "128 + 9 = SIGKILL: the kernel killed the process — the application never printed this code itself.",
          ru: "128 + 9 = SIGKILL: процесс убило ядро — приложение само этот код не печатало.",
        },
      },
      {
        id: "q2",
        q: {
          en: "Docker restarts a crash-looping container with backoff starting at 0.1 s and doubling each time (cap 60 s). The delay before the 6th restart, in seconds?",
          ru: "Docker перезапускает crash-loop контейнер с backoff от 0.1 с с удвоением каждый раз (cap 60 с). Задержка перед 6-м рестартом, в секундах?",
        },
        answer: 3.2, tol: 0.05, unit: { en: "s", ru: "с" },
        hint: {
          en: "0.1 × 2^5: the intervals grow — 0.1, 0.2, 0.4, 0.8, 1.6, 3.2.",
          ru: "0.1 × 2^5: интервалы растут — 0.1, 0.2, 0.4, 0.8, 1.6, 3.2.",
        },
      },
      {
        id: "q3",
        q: {
          en: "Baking the 0.491 GB weights into the 1.18 GB base image: the resulting image size, in GB?",
          ru: "Запечь веса 0.491 ГБ в базовый образ 1.18 ГБ: размер получившегося образа в ГБ?",
        },
        answer: 1.67, tol: 0.01, unit: { en: "GB", ru: "ГБ" },
        hint: {
          en: "1.18 + 0.491 = 1.671. The bake price is a heavy pull and a light start.",
          ru: "1.18 + 0.491 = 1.671. Цена bake — тяжёлый pull и лёгкий старт.",
        },
      },
    ],
    exercises: [
      {
        id: "ex3",
        title: { en: "Exercise 3 · Crash-loop backoff", ru: "Упражнение 3 · Backoff crash-loop" },
        brief: {
          en: "Implement <code>backoff_delays(restarts, base_s=0.1, cap_s=60.0)</code> — the crash-loop restart schedule: restart k (0-based) waits <code>min(base_s × 2^k, cap_s)</code>. The intervals GROW — that is the docker-side twin of Kubernetes <code>CrashLoopBackOff</code> (10 s → cap 5 min). Return the list of delays; zero restarts means an empty list. Try the docker knobs (0.1, cap 60) and the k8s knobs (10, cap 300) — the shape is the same.",
          ru: "Реализуй <code>backoff_delays(restarts, base_s=0.1, cap_s=60.0)</code> — расписание рестартов crash-loop: рестарт k (с нуля) ждёт <code>min(base_s × 2^k, cap_s)</code>. Интервалы РАСТУТ — это docker-версия kubernetes <code>CrashLoopBackOff</code> (10 с → cap 5 мин). Верни список задержек; ноль рестартов — пустой список. Примерь ручки docker (0.1, cap 60) и k8s (10, cap 300) — форма одна.",
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
          { en: "One list comprehension: min of the doubling base and the cap, over range(restarts).", ru: "Одно list comprehension: min от удвоенной базы и потолка, по range(restarts)." },
        ],
        numpy: false,
        timeoutMs: 4000,
      },
      {
        id: "ex1",
        title: { en: "Exercise 1 · Freeze the build plan", ru: "Упражнение 1 · Заморозь план сборки" },
        brief: {
          en: "Implement <code>plan_cache_order()</code> — freeze the build plan BEFORE the first build. Fill in <code>chosen_order</code> (one letter: 'A', 'B' or 'C' from <code>options</code>), the <code>predictions</code> dict (keys <code>edit_source</code>, <code>change_source_pin</code>, <code>change_base</code> — which layers rebuild and why), the <code>restart_terms</code> dict (<code>cold</code> = the members of “crashed → answering”, <code>dominant</code> = which member rules for 0.491 GB of weights) and <code>why</code> (one sentence about the cache). No <code>TODO</code> may survive in any string.",
          ru: "Реализуй <code>plan_cache_order()</code> — заморозь план сборки ДО первой сборки. Заполни <code>chosen_order</code> (одна буква: 'A', 'B' или 'C' из <code>options</code>), dict <code>predictions</code> (ключи <code>edit_source</code>, <code>change_source_pin</code>, <code>change_base</code> — какие слои пересоберутся и почему), dict <code>restart_terms</code> (<code>cold</code> = члены «упал → снова отвечает», <code>dominant</code> = какой член правит при 0.491 ГБ весов) и <code>why</code> (одно предложение про cache). Ни одного <code>TODO</code> в строках остаться не должно.",
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
`,
        tests: [
          { name: "order B wins", hidden: false, code: `eq(plan_cache_order()['chosen_order'], 'B')` },
          { name: "predictions are filled", hidden: false, code: `p = plan_cache_order()['predictions']
eq(sorted(p.keys()), ['change_base', 'change_source_pin', 'edit_source'])
eq(all(isinstance(v, str) and v and 'TODO' not in v for v in p.values()), True)` },
          { name: "restart terms are filled", hidden: true, code: `r = plan_cache_order()['restart_terms']
eq(sorted(r.keys()), ['cold', 'dominant'])
eq(all(isinstance(v, str) and v and 'TODO' not in v for v in r.values()), True)` },
          { name: "why names the cache", hidden: true, code: `why = plan_cache_order()['why']
eq(bool(why) and 'TODO' not in why, True)
eq('cache' in why.lower(), True)` },
        ],
        solution: `def plan_cache_order():
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
        why='rarely-changing context above the heavy layer keeps the dependency cache hit')`,
        hints: [
          { en: "Order B copies the rarely-changing manifest before the heavy install; a cache hit for a layer needs everything below it unchanged.", ru: "Порядок B копирует редко меняющийся манифест до тяжёлой установки; cache hit слоя возможен, только если всё под ним не менялось." },
        ],
        numpy: false,
        timeoutMs: 4000,
      },
      {
        id: "ex2",
        title: { en: "Exercise 2 · Fix the bug: 137 is not an app code", ru: "Упражнение 2 · Почини баг: 137 — это не код приложения" },
        brief: {
          en: "This <code>diagnose_exit(exit_code, log_tail, oomkilled=None)</code> treats 137 as an application exit code. It is not: codes ≥ 128 encode a signal death — 137 = 128 + 9 (SIGKILL), 143 = 128 + 15 (SIGTERM). Fix it to the contract: <code>oomkilled</code> true, exit 137, or an <code>oom</code>/<code>sigkill</code> hint in the log → kind <code>'oom'</code> with sig 9 (memory cgroup limit); any other signal death → <code>'sigterm'</code> for 15 (a graceful stop, not a crash; other signals → <code>'signalled'</code>); exit 1 with <code>manifest unknown</code> / <code>not found</code> in the log → <code>'tag_drift'</code>; 125 → <code>'daemon_error'</code>; 127 → <code>'command_not_found'</code>; otherwise <code>'unclassified'</code>. Return <code>{'kind': …, 'sig': signal or None, 'fix': …}</code> with a non-empty <code>fix</code>.",
          ru: "Эта <code>diagnose_exit(exit_code, log_tail, oomkilled=None)</code> трактует 137 как код приложения. Это не так: коды ≥ 128 кодируют смерть от сигнала — 137 = 128 + 9 (SIGKILL), 143 = 128 + 15 (SIGTERM). Починь по контракту: <code>oomkilled</code> истинно, exit 137 или подсказка <code>oom</code>/<code>sigkill</code> в логе → kind <code>'oom'</code> с sig 9 (лимит memory cgroup); любая другая смерть от сигнала → <code>'sigterm'</code> для 15 (штатная остановка, не падение; прочие сигналы → <code>'signalled'</code>); exit 1 с <code>manifest unknown</code> / <code>not found</code> в логе → <code>'tag_drift'</code>; 125 → <code>'daemon_error'</code>; 127 → <code>'command_not_found'</code>; иначе <code>'unclassified'</code>. Верни <code>{'kind': …, 'sig': сигнал или None, 'fix': …}</code> с непустым <code>fix</code>.",
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
          { en: "Decode the signal first: sig = exit − 128 for codes ≥ 128. Then 137 / oomkilled / oom-in-log → oom; remaining signal deaths → sigterm (15) or signalled; only after that the app-code branches.", ru: "Сначала декодируй сигнал: sig = exit − 128 для кодов ≥ 128. Затем 137 / oomkilled / oom-в-логе → oom; прочие смерти от сигналов → sigterm (15) или signalled; и только потом ветки кодов приложения." },
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
          { en: "Return the FIRST broken index — walk in order, not sorted by seq.", ru: "Возвращай ПЕРВЫЙ сломанный индекс — идём по порядку списка, а не по сортировке seq." },
        ],
        injectEntries: true,
        numpy: false,
        timeoutMs: 4000,
      },
    ],
    runtime: {
      title: {
        en: "Measure on your own engine: the practice runtime",
        ru: "Измерь на своём движке: practice-рантайм",
      },
      brief: {
        en: "Download the runtime ZIP, run <code>docker compose up -d</code>, and this page connects to a real llama.cpp server on your machine (pinned image digest, weights verified by sha256, hard <code>mem_limit: 1200m</code> — the Topic 09 lesson running live). Your student code still executes in the browser sandbox; the page only talks to the gateway at 127.0.0.1:8760 and journals every measurement into a hash chain.",
        ru: "Скачай ZIP рантайма, запусти <code>docker compose up -d</code> — и эта страница подключится к настоящему llama.cpp server на твоей машине (образ запинен по дайджесту, веса проверяются по sha256, жёсткий <code>mem_limit: 1200m</code> — урок Темы 09 вживую). Твой код по-прежнему исполняется в песочнице браузера; страница ходит только в шлюз на 127.0.0.1:8760 и журналирует каждое измерение в хэш-цепочку.",
      },
      experimentPrompt: {
        en: "In one short sentence, explain what an image digest pins.",
        ru: "Одним коротким предложением объясни, что пиннет дайджест образа.",
      },
      footer: {
        en: "Measurements are machine-local and honest — the course cites them only as your own. The chain-walk exercise above recomputes the gateway's journal with your Python; the gateway's own verifier is at GET /journal/verify.",
        ru: "Измерения машинно-локальные и честные — курс цитирует их только как твои собственные. Упражнение с проходом по цепочке пересчитывает журнал шлюза твоим Python; собственный верификатор шлюза — GET /journal/verify.",
      },
    },
    posttest: [
      {
        id: "p1",
        q: { en: "A container exits with code 137 after a memory limit. 137 means\u2026", ru: "\u041a\u043e\u043d\u0442\u0435\u0439\u043d\u0435\u0440 \u0432\u044b\u0448\u0435\u043b \u0441 \u043a\u043e\u0434\u043e\u043c 137 \u043f\u043e\u0441\u043b\u0435 \u043b\u0438\u043c\u0438\u0442\u0430 \u043f\u0430\u043c\u044f\u0442\u0438. 137 \u043e\u0437\u043d\u0430\u0447\u0430\u0435\u0442\u2026" },
        options: [{ en: "128 + SIGKILL(9): the kernel killed it", ru: "128 + SIGKILL(9): \u0443\u0431\u0438\u043b\u043e \u044f\u0434\u0440\u043e" }, { en: "an application error 137", ru: "\u043e\u0448\u0438\u0431\u043a\u0430 \u043f\u0440\u0438\u043b\u043e\u0436\u0435\u043d\u0438\u044f 137" }, { en: "a docker bug", ru: "\u0431\u0430\u0433 docker" }],
        answer: 0,
        explain: { en: "137 = 128 + 9: the cgroup OOM kill delivers SIGKILL \u2014 an incident, not an app crash.", ru: "137 = 128 + 9: cgroup OOM-kill \u0434\u043e\u0441\u0442\u0430\u0432\u043b\u044f\u0435\u0442 SIGKILL \u2014 \u044d\u0442\u043e \u0438\u043d\u0446\u0438\u0434\u0435\u043d\u0442, \u0430 \u043d\u0435 \u043f\u0430\u0434\u0435\u043d\u0438\u0435 \u043f\u0440\u0438\u043b\u043e\u0436\u0435\u043d\u0438\u044f." },
      },
      {
        id: "p2",
        q: { en: "Layer order \u00abB\u00bb (context before the heavy dependency layer) protects\u2026", ru: "\u041f\u043e\u0440\u044f\u0434\u043e\u043a \u0441\u043b\u043e\u0451\u0432 \u00abB\u00bb (\u043a\u043e\u043d\u0442\u0435\u043a\u0441\u0442 \u0434\u043e \u0442\u044f\u0436\u0451\u043b\u043e\u0433\u043e \u0441\u043b\u043e\u044f \u0437\u0430\u0432\u0438\u0441\u0438\u043c\u043e\u0441\u0442\u0435\u0439) \u0431\u0435\u0440\u0435\u0436\u0451\u0442\u2026" },
        options: [{ en: "the layer cache: source edits rebuild less", ru: "\u043a\u044d\u0448 \u0441\u043b\u043e\u0451\u0432: \u043f\u0440\u0430\u0432\u043a\u0438 \u0438\u0441\u0445\u043e\u0434\u043d\u0438\u043a\u043e\u0432 \u043f\u0435\u0440\u0435\u0441\u043e\u0431\u0438\u0440\u0430\u044e\u0442 \u043c\u0435\u043d\u044c\u0448\u0435" }, { en: "image size", ru: "\u0440\u0430\u0437\u043c\u0435\u0440 \u043e\u0431\u0440\u0430\u0437\u0430" }, { en: "the model weights", ru: "\u0432\u0435\u0441\u0430 \u043c\u043e\u0434\u0435\u043b\u0438" }],
        answer: 0,
        explain: { en: "Fewer-changing context above the heavy layer keeps cache hits for dependencies; the compile layer still rebuilds.", ru: "\u0420\u0435\u0436\u0435 \u043c\u0435\u043d\u044f\u044e\u0449\u0438\u0439\u0441\u044f \u043a\u043e\u043d\u0442\u0435\u043a\u0441\u0442 \u0432\u044b\u0448\u0435 \u0442\u044f\u0436\u0451\u043b\u043e\u0433\u043e \u0441\u043b\u043e\u044f \u0441\u043e\u0445\u0440\u0430\u043d\u044f\u0435\u0442 cache hit \u0437\u0430\u0432\u0438\u0441\u0438\u043c\u043e\u0441\u0442\u0435\u0439; \u0441\u043b\u043e\u0439 \u043a\u043e\u043c\u043f\u0438\u043b\u044f\u0446\u0438\u0438 \u0432\u0441\u0451 \u0440\u0430\u0432\u043d\u043e \u043f\u0435\u0440\u0435\u0441\u043e\u0431\u0438\u0440\u0430\u0435\u0442\u0441\u044f." },
      },
      {
        id: "p3",
        q: { en: "After the sizing fix the limit is set from\u2026", ru: "\u041f\u043e\u0441\u043b\u0435 \u043f\u043e\u0447\u0438\u043d\u043a\u0438 \u043b\u0438\u043c\u0438\u0442 \u0441\u0430\u0439\u0437\u0438\u0442\u0441\u044f \u043e\u0442\u2026" },
        options: [{ en: "measured resident memory \u00d7 ~1.5 headroom", ru: "\u0438\u0437\u043c\u0435\u0440\u0435\u043d\u043d\u043e\u0439 \u0440\u0435\u0437\u0438\u0434\u0435\u043d\u0442\u043d\u043e\u0439 \u043f\u0430\u043c\u044f\u0442\u0438 \u00d7 \u0437\u0430\u043f\u0430\u0441 ~1.5" }, { en: "a random 2 GB", ru: "\u0441\u043b\u0443\u0447\u0430\u0439\u043d\u044b\u0445 2 \u0413\u0411" }, { en: "the number of CPUs", ru: "\u0447\u0438\u0441\u043b\u0430 CPU" }],
        answer: 0,
        explain: { en: "Resident ~760 MiB \u2192 1200 m limit: room to live, cgroup OOM never fires, crash-loop stops.", ru: "\u0420\u0435\u0437\u0438\u0434\u0435\u043d\u0442 ~760 \u041c\u0438\u0411 \u2192 \u043b\u0438\u043c\u0438\u0442 1200 m: \u0435\u0441\u0442\u044c \u0433\u0434\u0435 \u0436\u0438\u0442\u044c, cgroup OOM \u043d\u0435 \u0441\u0442\u0440\u0435\u043b\u044f\u0435\u0442, crash-loop \u043f\u0440\u0435\u043a\u0440\u0430\u0449\u0430\u0435\u0442\u0441\u044f." },
      },
    ],
    reward: {
      caption: { en: "Pinned, lean, healthchecked — and you verified the journal with your own hash walk.", ru: "Пиннутый, компактный, с healthcheck — и ты пересчитал журнал своим хэш-ходом." },
    },
    footer: {
      en: "Teaching arithmetic with declared constants (137 = 128+9, backoff 0.1 s × 2^k cap 60 s, sizes from the course reference table) — not a measurement of your machine. The measured fleet runs live in the Topic 09 evidence runs (runs/2026-11-07-topic09-fleet-mac and runs/2026-11-14-topic09-fleet-mac); this lab does not execute them.",
      ru: "Учебная арифметика с заявленными константами (137 = 128+9, backoff 0.1 с × 2^k cap 60 с, размеры из эталонной таблицы курса) — не измерение твоей машины. Измеренные флет-прогоны живут в evidence-прогонах Темы 09 (runs/2026-11-07-topic09-fleet-mac и runs/2026-11-14-topic09-fleet-mac); эта лаба их не исполняет.",
    },
  };
})();
