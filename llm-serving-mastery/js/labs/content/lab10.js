/* Lab 10 — Multi-GPU inference: tensor parallelism.
   Content module for the generic lab page (window.LABS_CONTENT['10']).
   Sources: seminars/10-multi-gpu-tensor-parallelism.ipynb (column_parallel,
   row_parallel, allreduce_sum, the declared step model with the sync beat).
   The split mechanics are real NumPy; every millisecond is declared arithmetic. */
(function () {
  "use strict";
  window.LABS_CONTENT = window.LABS_CONTENT || {};

  LABS_CONTENT["10"] = {
    title: {
      en: "Multi-GPU inference: tensor parallelism",
      ru: "Инференс на нескольких GPU: тензорный параллелизм",
    },
    sub: {
      en: "Split the weight matrices, prove split == full to 1e-9, then let the sync beat bend the scaling curve.",
      ru: "Разрежь матрицы весов, докажи, что разбитое равно целому с точностью до 1e-9, и посмотри, как такт синхронизации гнёт кривую масштабирования.",
    },
    intro: {
      en: `<p>One GPU ends twice: the memory wall (8B fp16 weights ≈ 16 GB plus KV against a 15 GB budget) and the latency floor of a sequential decode. Tensor parallelism (TP) answers by cutting the weight matrices: <strong>column-parallel</strong> splits <code>W</code> by output columns — every shard sees all of <code>X</code> and returns its own columns of <code>Y</code>, no joining inside the block; <strong>row-parallel</strong> splits <code>W</code> by rows (and <code>X</code> by columns on the same parts) — each shard produces a <strong>partial sum</strong>, and the all-reduce joins them with an exact elementwise sum. The split is not an illustration: assembled shards equal the full matmul within float noise (≤ 1e-10 in the notebook, 1e-9 here).</p>
<p>The step model is declared: <code>t(p) = C/p + B·(p−1)/p + beat·(p−1)</code>. Compute divides by the degree, the all-reduce byte share grows toward <code>B</code>, and every extra GPU adds sync beats — the member the clean plan forgets. The lab habit: freeze the plan (knee, minimal fitting degree) before the sweep, prove the split numerically, and treat the beat as a named member, not noise.</p>`,
      ru: `<p>Один GPU заканчивается дважды: стена памяти (веса 8B fp16 ≈ 16 ГБ плюс KV против бюджета 15 ГБ) и пол латентности последовательного decode. Тензорный параллелизм (TP) отвечает разрезом матриц весов: <strong>column-parallel</strong> режет <code>W</code> по выходным столбцам — каждый шард видит весь <code>X</code> и возвращает свои столбцы <code>Y</code>, стыковать внутри блока не надо; <strong>row-parallel</strong> режет <code>W</code> по строкам (и <code>X</code> по столбцам на те же части) — каждый шард даёт <strong>частичную сумму</strong>, и all-reduce соединяет их точной поэлементной суммой. Разрез — не иллюстрация: собранные шарды равны полному matmul с точностью до float-шума (≤ 1e-10 в тетради, здесь 1e-9).</p>
<p>Модель шага заявлена: <code>t(p) = C/p + B·(p−1)/p + beat·(p−1)</code>. Вычисления делятся на степень, байтовая доля all-reduce растёт к <code>B</code>, и каждый лишний GPU добавляет такты синхронизации — член, которого забывает чистый план. Привычка лабы: заморозить план (колено, минимальная подходящая степень) до свипа, доказать разрез числом и считать такт именованным членом, а не шумом.</p>`,
    },
    outcomes: [
      { en: "Prove split equals full within tolerance for column- and row-parallel layers.", ru: "\u0414\u043e\u043a\u0430\u0437\u044b\u0432\u0430\u0442\u044c \u0440\u0430\u0432\u0435\u043d\u0441\u0442\u0432\u043e \u0441\u043f\u043b\u0438\u0442\u0430 \u0438 \u043f\u043e\u043b\u043d\u043e\u0433\u043e \u043f\u0440\u043e\u0445\u043e\u0434\u0430 \u0432 \u0434\u043e\u043f\u0443\u0441\u043a\u0435 \u0434\u043b\u044f column/row-parallel \u0441\u043b\u043e\u0451\u0432." },
      { en: "Predict the TP knee from the sync beat and keep an honest per-GPU ledger.", ru: "\u041f\u0440\u0435\u0434\u0441\u043a\u0430\u0437\u044b\u0432\u0430\u0442\u044c \u043a\u043e\u043b\u0435\u043d\u043e TP \u0438\u0437 \u0442\u0430\u043a\u0442\u0430 \u0441\u0438\u043d\u0445\u0440\u043e\u043d\u0438\u0437\u0430\u0446\u0438\u0438 \u0438 \u0432\u0435\u0441\u0442\u0438 \u0447\u0435\u0441\u0442\u043d\u044b\u0439 per-GPU ledger." },
    ],
    model: [
      ["step model", "t(p) = C/p + B·(p−1)/p + beat·(p−1)", "declared knobs", "C = 800 ms, B = 120 ms, beat = 25 ms"],
      ["column-parallel", "W split by columns (axis=1)", "every shard reads all of X", "own columns of Y"],
      ["row-parallel", "W split by rows (axis=0), X by columns", "partials x_j @ w_j", "all-reduce = exact sum"],
      ["memory per GPU", "16/p + 4/p + 1.5 GB ≤ 15 GB", "weights + KV divide", "fixed does not"],
    ],
    scenario: null,
    quizzes: [
      {
        id: "q1",
        q: {
          en: "Declared step at tp = 4 with C = 800 ms, B = 120 ms, beat = 25 ms: what is t(4), in ms?",
          ru: "Заявленный шаг при tp = 4 с C = 800 мс, B = 120 мс, beat = 25 мс: чему равно t(4), в мс?",
        },
        answer: 365, tol: 0.5, unit: { en: "ms", ru: "мс" },
        hint: {
          en: "800/4 + 120·3/4 + 25·3 = 200 + 90 + 75.",
          ru: "800/4 + 120·3/4 + 25·3 = 200 + 90 + 75.",
        },
      },
      {
        id: "q2",
        q: {
          en: "Same knobs at tp = 8: t(8), in ms? Compare with t(4) — this is where “add more GPUs” stops paying.",
          ru: "Те же ручки при tp = 8: t(8), в мс? Сравни с t(4) — именно здесь «бери больше GPU» перестаёт платить.",
        },
        answer: 380, tol: 0.5, unit: { en: "ms", ru: "мс" },
        hint: {
          en: "800/8 + 120·7/8 + 25·7 = 100 + 105 + 175 — more than t(4): the beats ate the division.",
          ru: "800/8 + 120·7/8 + 25·7 = 100 + 105 + 175 — больше, чем t(4): такты съели деление.",
        },
      },
      {
        id: "q3",
        q: {
          en: "8B fp16 weights (16 GB) + KV (4 GB) divide by tp; 1.5 GB fixed per GPU does not; budget 15 GB. The minimal degree that fits?",
          ru: "Веса 8B fp16 (16 ГБ) + KV (4 ГБ) делятся на tp; 1.5 ГБ фиксированных на GPU — нет; бюджет 15 ГБ. Минимальная подходящая степень?",
        },
        answer: 2, tol: 0.2, unit: { en: "GPUs", ru: "GPU" },
        hint: {
          en: "(16+4)/1 + 1.5 = 21.5 > 15; (16+4)/2 + 1.5 = 11.5 ≤ 15.",
          ru: "(16+4)/1 + 1.5 = 21.5 > 15; (16+4)/2 + 1.5 = 11.5 ≤ 15.",
        },
      },
    ],
    exercises: [
      {
        id: "ex1",
        title: { en: "Exercise 1 · Column-parallel split", ru: "Упражнение 1 · Разрез column-parallel" },
        brief: {
          en: "Implement <code>column_parallel(x, w, parts)</code> — split <code>w</code> by output columns (<code>np.array_split(w, parts, axis=1)</code>); every shard sees ALL of <code>x</code> and returns its own columns of the product: <code>x @ w_j</code>. Return the list of shard outputs — stacked sideways (<code>np.hstack</code>) they must reproduce the full <code>x @ w</code> within 1e-9.",
          ru: "Реализуй <code>column_parallel(x, w, parts)</code> — разрежь <code>w</code> по выходным столбцам (<code>np.array_split(w, parts, axis=1)</code>); каждый шард видит ВЕСЬ <code>x</code> и возвращает свои столбцы произведения: <code>x @ w_j</code>. Верни список выходов шардов — при стыковке бок о бок (<code>np.hstack</code>) они обязаны воспроизвести полный <code>x @ w</code> с точностью до 1e-9.",
        },
        starter: `import numpy as np

def column_parallel(x, w, parts):
    """Split the weight matrix by output columns; return per-shard outputs.

    x: (batch, features); w: (features, out) split along axis=1.
    Returns a list of arrays: x @ w_j - own columns of Y per shard.
    """
    # TODO: np.array_split(w, parts, axis=1); each shard computes x @ w_j
    raise NotImplementedError('TODO: split w by columns and compute shard outputs')
`,
        tests: [
          { name: "two shards, own columns", hidden: false, code: `import numpy as np
x = np.arange(8.0).reshape(2, 4)
w = np.arange(16.0).reshape(4, 4)
shards = column_parallel(x, w, 2)
eq(len(shards), 2)
eq(np.shape(shards[0]), (2, 2))` },
          { name: "stacked shards equal the full product", hidden: false, code: `import numpy as np
rng = np.random.default_rng(7)
x = rng.normal(size=(3, 6)); w = rng.normal(size=(6, 8))
got = np.hstack(column_parallel(x, w, 4))
err = float(np.max(np.abs(got - x @ w)))
approx(err, 0.0, 1e-9)` },
          { name: "parts=1 is the full matmul", hidden: true, code: `import numpy as np
rng = np.random.default_rng(3)
x = rng.normal(size=(2, 5)); w = rng.normal(size=(5, 7))
got = np.hstack(column_parallel(x, w, 1))
approx(float(np.max(np.abs(got - x @ w))), 0.0, 1e-9)` },
          { name: "every shard reads all of x", hidden: true, code: `import numpy as np
x = np.ones((2, 4)); w = np.ones((4, 8))
shards = column_parallel(x, w, 4)
eq([np.shape(s) for s in shards], [(2, 2), (2, 2), (2, 2), (2, 2)])
approx(float(np.sum(shards[1])), 16.0, 1e-9)` },
        ],
        solution: `import numpy as np

def column_parallel(x, w, parts):
    return [x @ w_j for w_j in np.array_split(w, parts, axis=1)]`,
        hints: [
          { en: "One line: a list comprehension over np.array_split(w, parts, axis=1). The axis is 1 — output features.", ru: "Одна строка: list comprehension по np.array_split(w, parts, axis=1). Ось — 1, выходные признаки." },
        ],
        numpy: true,
        timeoutMs: 4000,
      },
      {
        id: "ex2",
        title: { en: "Exercise 2 · Declared step time", ru: "Упражнение 2 · Заявленное время шага" },
        brief: {
          en: "Implement <code>plan_tp_knee(compute_ms, bytes_term_ms, degree, beat_ms=25.0)</code> — the declared step time in ms at one TP degree: <code>compute_ms/degree + bytes_term_ms×(degree−1)/degree + beat_ms×(degree−1)</code>. Compute divides by the degree, the all-reduce byte share grows toward <code>bytes_term_ms</code>, and every extra GPU adds a sync beat — the member the clean plan forgets. With the course knobs (800, 120, beat 25) t(4) = 365 ms but t(8) = 380 ms: past the knee, more GPUs make the step slower.",
          ru: "Реализуй <code>plan_tp_knee(compute_ms, bytes_term_ms, degree, beat_ms=25.0)</code> — заявленное время шага в мс при одной степени TP: <code>compute_ms/degree + bytes_term_ms×(degree−1)/degree + beat_ms×(degree−1)</code>. Вычисления делятся на степень, байтовая доля all-reduce растёт к <code>bytes_term_ms</code>, и каждый лишний GPU добавляет такт синхронизации — член, которого забывает чистый план. С ручками курса (800, 120, beat 25) t(4) = 365 мс, но t(8) = 380 мс: за коленом больше GPU — медленнее шаг.",
        },
        starter: `def plan_tp_knee(compute_ms, bytes_term_ms, degree, beat_ms=25.0):
    """Declared step time (ms) at one TP degree: compute share + byte share + beats.

    t(p) = compute_ms / p + bytes_term_ms * (p - 1) / p + beat_ms * (p - 1)
    """
    # TODO: three terms; the beat is the member the clean plan forgot
    raise NotImplementedError('TODO: evaluate the declared step model')
`,
        tests: [
          { name: "one GPU pays no sync", hidden: false, code: `approx(plan_tp_knee(800, 120, 1), 800.0, 1e-9)` },
          { name: "four GPUs: 200 + 90 + 75", hidden: false, code: `approx(plan_tp_knee(800, 120, 4), 365.0, 1e-9)` },
          { name: "eight GPUs slower than four", hidden: false, code: `approx(plan_tp_knee(800, 120, 8), 380.0, 1e-9)
eq(plan_tp_knee(800, 120, 8) > plan_tp_knee(800, 120, 4), True)` },
          { name: "another machine", hidden: true, code: `approx(plan_tp_knee(400, 80, 2, beat_ms=10.0), 250.0, 1e-9)` },
        ],
        solution: `def plan_tp_knee(compute_ms, bytes_term_ms, degree, beat_ms=25.0):
    return (compute_ms / degree
            + bytes_term_ms * (degree - 1) / degree
            + beat_ms * (degree - 1))`,
        hints: [
          { en: "Three terms, no branches: C/p shrinks, B·(p−1)/p and beat·(p−1) grow.", ru: "Три члена, без ветвлений: C/p убывает, B·(p−1)/p и beat·(p−1) растут." },
        ],
        numpy: false,
        timeoutMs: 4000,
      },
      {
        id: "ex3",
        title: { en: "Exercise 3 · Fix the bug: partials need the all-reduce", ru: "Упражнение 3 · Почини баг: частичным нужен all-reduce" },
        brief: {
          en: "This <code>mlp_forward_tp(x, w_up, w_down, parts)</code> runs one MLP step under TP: up-projection column-parallel, down-projection row-parallel. The bug: the down-projection joins its partials by CONCATENATION, as if they were independent columns. Row-parallel partials are partial sums — the join is the all-reduce, the exact elementwise sum. Fix the join so that <code>mlp_forward_tp(x, w_up, w_down, parts)</code> equals <code>tanh(x @ w_up) @ w_down</code> within 1e-9 (the tanh is elementwise, so column-parallel passes through it exactly).",
          ru: "Эта <code>mlp_forward_tp(x, w_up, w_down, parts)</code> исполняет один MLP-шаг под TP: up-projection — column-parallel, down-projection — row-parallel. Баг: down-projection стыкует частичные результаты КОНКАТЕНАЦИЕЙ, как будто это независимые столбцы. Частичные результаты row-parallel — это частичные суммы; стыковка — all-reduce, точная поэлементная сумма. Почини стыковку так, чтобы <code>mlp_forward_tp(x, w_up, w_down, parts)</code> равнялось <code>tanh(x @ w_up) @ w_down</code> с точностью до 1e-9 (tanh поэлементный, поэтому column-parallel проходит сквозь него точно).",
        },
        starter: `import numpy as np

def mlp_forward_tp(x, w_up, w_down, parts):
    """One MLP step under TP: column-parallel up, row-parallel down + all-reduce.

    Must equal tanh(x @ w_up) @ w_down within float tolerance.
    """
    # BUG: the down-projection joins its partials by CONCATENATION, as if
    # they were independent columns. Row-parallel partials are partial
    # SUMS: the join is the all-reduce (exact elementwise sum), not a stack.
    h_shards = [np.tanh(x @ w_j)
                for w_j in np.array_split(w_up, parts, axis=1)]
    d_shards = [h_j @ w_j
                for h_j, w_j in zip(h_shards, np.array_split(w_down, parts, axis=0))]
    return np.hstack(d_shards)
`,
        tests: [
          { name: "output keeps the full shape", hidden: false, code: `import numpy as np
rng = np.random.default_rng(2026)
x = rng.normal(size=(2, 6)); w_up = rng.normal(size=(6, 12)); w_down = rng.normal(size=(12, 6))
eq(np.shape(mlp_forward_tp(x, w_up, w_down, 2)), (2, 6))` },
          { name: "split equals the full block", hidden: false, code: `import numpy as np
rng = np.random.default_rng(2026)
x = rng.normal(size=(2, 6)); w_up = rng.normal(size=(6, 12)); w_down = rng.normal(size=(12, 6))
y = mlp_forward_tp(x, w_up, w_down, 4)
ref = np.tanh(x @ w_up) @ w_down
approx(float(np.max(np.abs(y - ref))), 0.0, 1e-9)` },
          { name: "parts=2 on another block", hidden: true, code: `import numpy as np
rng = np.random.default_rng(4)
x = rng.normal(size=(3, 5)); w_up = rng.normal(size=(5, 8)); w_down = rng.normal(size=(8, 4))
y = mlp_forward_tp(x, w_up, w_down, 2)
eq(np.shape(y), (3, 4))
approx(float(np.max(np.abs(y - np.tanh(x @ w_up) @ w_down))), 0.0, 1e-9)` },
          { name: "uneven shards still sum up", hidden: true, code: `import numpy as np
rng = np.random.default_rng(15)
x = rng.normal(size=(2, 6)); w_up = rng.normal(size=(6, 8)); w_down = rng.normal(size=(8, 6))
y = mlp_forward_tp(x, w_up, w_down, 3)
approx(float(np.max(np.abs(y - np.tanh(x @ w_up) @ w_down))), 0.0, 1e-9)` },
        ],
        solution: `import numpy as np

def mlp_forward_tp(x, w_up, w_down, parts):
    up_shards = np.array_split(w_up, parts, axis=1)
    down_shards = np.array_split(w_down, parts, axis=0)
    h_shards = [np.tanh(x @ w_j) for w_j in up_shards]
    partials = [h_j @ w_j
                for h_j, w_j in zip(h_shards, down_shards)]
    out = partials[0].copy()
    for p in partials[1:]:
        out += p
    return out`,
        hints: [
          { en: "Keep both splits; replace np.hstack with the elementwise sum of the partials (start from partials[0], add the rest).", ru: "Оба разреза оставь; замени np.hstack на поэлементную сумму частичных результатов (начни с partials[0], добавь остальные)." },
        ],
        numpy: true,
        timeoutMs: 4000,
      },
      {
        id: "ex4",
        title: { en: "Exercise 4 · Wrap it into a class: TPSim", ru: "Упражнение 4 · Собери в класс: TPSim" },
        brief: {
          en: "The lab's final boss: wrap the declared model into a class. <code>new TPSim(compute_ms, bytes_term_ms, beat_ms)</code> with two methods: <code>step_time(degree)</code> — the knee formula you already know — and <code>fits(degree, weights_gib, per_gpu_gib)</code> — the per-GPU ledger from the quizzes: <code>(16 + 4) / degree + 1.5 &lt;= per_gpu_gib</code>. Real classes, real NumPy, real tests.",
          ru: "Финальный босс лабы: заверши заявленную модель в класс. <code>new TPSim(compute_ms, bytes_term_ms, beat_ms)</code> с двумя методами: <code>step_time(degree)</code> — уже знакомая формула колена — и <code>fits(degree, weights_gib, per_gpu_gib)</code> — per-GPU ledger из квизов: <code>(16 + 4) / degree + 1.5 &lt;= per_gpu_gib</code>. Настоящие классы, настоящий NumPy, настоящие тесты.",
        },
        starter: `class TPSim:
    def __init__(self, compute_ms, bytes_term_ms, beat_ms):
        # TODO: сохрани три константы модели
        ...

    def step_time(self, degree):
        # TODO: t(p) = C/p + B*(p-1)/p + beat*(p-1)
        ...

    def fits(self, degree, weights_gib, per_gpu_gib):
        # TODO: (16 + 4) / degree + 1.5 <= per_gpu_gib
        ...`,
        tests: [
          { name: "single GPU: no split, no sync", hidden: false, code: "sim = TPSim(800, 120, 25);\napprox(sim.step_time(1), 800, 1e-9)" },
          { name: "four GPUs: the known knee number", hidden: false, code: "sim = TPSim(800, 120, 25);\napprox(sim.step_time(4), 365, 1e-9)" },
          { name: "ledger admits degree 2 at 15 GiB", hidden: false, code: "sim = TPSim(800, 120, 25);\neq(sim.fits(2, 16, 15), True)" },
          { name: "ledger rejects degree 1", hidden: true, code: "sim = TPSim(800, 120, 25);\neq(sim.fits(1, 16, 15), False)" },
          { name: "another machine, same class", hidden: true, code: "sim = TPSim(400, 80, 10);\napprox(sim.step_time(2), 250, 1e-9)" },
        ],
        solution: `class TPSim:
    def __init__(self, compute_ms, bytes_term_ms, beat_ms):
        self.compute = compute_ms
        self.bytes_term = bytes_term_ms
        self.beat = beat_ms

    def step_time(self, degree):
        p = degree
        return self.compute / p + self.bytes_term * (p - 1) / p + self.beat * (p - 1)

    def fits(self, degree, weights_gib, per_gpu_gib):
        return (16 + 4) / degree + 1.5 <= per_gpu_gib`,
        hints: [
          { en: "Store the three constants in __init__; both methods read them from self.", ru: "Сохрани три константы в __init__; оба метода читают их из self." },
          { en: "fits is a single boolean expression — no if needed.", ru: "fits — одно булево выражение, if не нужен." },
        ],
        injectEntries: false,
        numpy: true,
        timeoutMs: 4000,
      },
    ],
    reward: {
      caption: { en: "Split equals full, the knee predicted \u2014 tensor parallelism is arithmetic you own.", ru: "\u0421\u043f\u043b\u0438\u0442 \u0440\u0430\u0432\u0435\u043d \u043f\u043e\u043b\u043d\u043e\u043c\u0443 \u043f\u0440\u043e\u0445\u043e\u0434\u0443, \u043a\u043e\u043b\u0435\u043d\u043e \u043f\u0440\u0435\u0434\u0441\u043a\u0430\u0437\u0430\u043d\u043e \u2014 \u0442\u0435\u043d\u0437\u043e\u0440\u043d\u044b\u0439 \u043f\u0430\u0440\u0430\u043b\u043b\u0435\u043b\u0438\u0437\u043c \u044d\u0442\u043e \u0442\u0432\u043e\u044f \u0430\u0440\u0438\u0444\u043c\u0435\u0442\u0438\u043a\u0430." },
    },
    footer: {
      en: "The split mechanics are real NumPy (checked to 1e-9 here, 1e-10 in the notebook); every millisecond is declared arithmetic with named knobs, not a GPU measurement. The recorded sweep and ledger live in the Topic 10 evidence run (runs/2026-11-01-topic10-tp-sim); this lab does not execute it.",
      ru: "Механика разреза — настоящий NumPy (здесь проверка до 1e-9, в тетради до 1e-10); каждая миллисекунда — объявленная арифметика с именованными ручками, а не измерение GPU. Свип и ведомость записаны в evidence-прогоне Темы 10 (runs/2026-11-01-topic10-tp-sim); эта лаба его не исполняет.",
    },
  };
})();
