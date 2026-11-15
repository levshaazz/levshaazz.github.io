/* Lab 07 — Tuning for the SLO.
   Content module for the generic lab page (window.LABS_CONTENT['7']).
   Declared teaching numbers and a declared decision rule from the Topic 07
   notebook: a bounded frozen search plan, feasibility = throughput floor AND
   p95 SLO, max-throughput pick, margins. Practice, not a measurement. */
(function () {
  "use strict";
  window.LABS_CONTENT = window.LABS_CONTENT || {};

  LABS_CONTENT["7"] = {
    title: {
      en: "Tuning for the SLO",
      ru: "Тюнинг под SLO",
    },
    sub: {
      en: "Run a bounded plan of configs, keep the ones that clear the throughput floor and the p95 SLO, then freeze the fastest with its margins.",
      ru: "Прогони ограниченный план конфигураций, отбери те, что пробили порог throughput и SLO по p95, и заморозь быстрейшую вместе с её запасами.",
    },
    intro: {
      en: `<p>You cannot sweep 4 knobs × 3 values × 4 waves, so the search is bounded by a frozen plan: a default baseline, one-factor-at-a-time (OFAT) branches, and one confirmatory pair — five configs, no more; failed configs stay in the table as rows, not erased footnotes. Feasibility is a declared conjunction: <strong>feasible = thr ≥ floor AND p95 ≤ SLO</strong>, both bounds inclusive. Nothing qualifies? Freezing nothing is a legitimate outcome.</p>
<p>Among feasible configs the working point is the max-throughput one, and the margins — <code>thr − floor</code> and <code>SLO − p95</code> — tell you how brittle the choice is: a point sitting exactly on the SLO breaks at the first held-out run. Units bite here: p95 arrives in milliseconds, and comparing it against a threshold in different units flips every decision by 1000× — a slow profile sails through as "eligible".</p>`,
      ru: `<p>Полный перебор невозможен (4 ручки × 3 значения × 4 волны), поэтому поиск ограничен замороженным планом: baseline default, по одной OFAT-ветке на ручку и одна подтверждающая пара — пять конфигураций, ни больше; неудачные конфигурации остаются строками таблицы, а не стёртыми сносками. Допустимость — заявленная конъюнкция: <strong>feasible = thr ≥ floor AND p95 ≤ SLO</strong>, обе границы включительные. Не прошло ничего? «Замораживать нечего» — полноценный исход.</p>
<p>Рабочая точка среди допустимых — самая быстрая по throughput, а запасы — <code>thr − floor</code> и <code>SLO − p95</code> — показывают, насколько выбор хрупок: точка, сидящая ровно на SLO, сломается на первом же held-out. Здесь кусаются единицы: p95 приходит в миллисекундах, и сравнение его с порогом в других единицах переворачивает все решения в 1000 раз — медленный профиль проходит как «допустимый».</p>`,
    },
    outcomes: [
      { en: "Formulate feasibility as a testable predicate (throughput floor AND p95 ceiling).", ru: "\u0424\u043e\u0440\u043c\u0443\u043b\u0438\u0440\u043e\u0432\u0430\u0442\u044c \u0434\u043e\u043f\u0443\u0441\u0442\u0438\u043c\u043e\u0441\u0442\u044c \u043a\u0430\u043a \u043f\u0440\u043e\u0432\u0435\u0440\u044f\u0435\u043c\u044b\u0439 \u043f\u0440\u0435\u0434\u0438\u043a\u0430\u0442 (\u043f\u043e\u043b \u043f\u043e throughput \u0418 \u043f\u043e\u0442\u043e\u043b\u043e\u043a p95)." },
      { en: "Pick a working point with named margins and freeze it before held-out.", ru: "\u0412\u044b\u0431\u0438\u0440\u0430\u0442\u044c \u0440\u0430\u0431\u043e\u0447\u0443\u044e \u0442\u043e\u0447\u043a\u0443 \u0441 \u0438\u043c\u0435\u043d\u043e\u0432\u0430\u043d\u043d\u044b\u043c\u0438 \u0437\u0430\u043f\u0430\u0441\u0430\u043c\u0438 \u0438 \u0437\u0430\u043c\u043e\u0440\u0430\u0436\u0438\u0432\u0430\u0442\u044c \u0435\u0451 \u0434\u043e held-out." },
    ],
    model: [
      ["feasible", "thr ≥ floor AND p95 ≤ SLO", "teaching thresholds", "floor 1200 tok/s, SLO 800 ms"],
      ["working point", "max-throughput feasible config, first on ties", "search plan", "default + 3 OFAT + 1 pair = 5 configs"],
      ["margins", "thr − floor, SLO − p95", "no feasible config", "freeze nothing (None)"],
    ],
    scenario: null,
    quizzes: [
      {
        id: "q1",
        q: {
          en: "Config «pair»: thr 1650 tok/s, p95 450 ms. Floor 1200 tok/s, SLO 800 ms. How many tok/s of throughput margin above the floor?",
          ru: "Конфигурация «pair»: thr 1650 ток/с, p95 450 мс. Floor 1200 ток/с, SLO 800 мс. Каков запас по throughput над floor, в ток/с?",
        },
        answer: 450, tol: 0.5, unit: { en: "tok/s", ru: "ток/с" },
        hint: {
          en: "Margin = thr − floor = 1650 − 1200. It clears the SLO too: 450 ≤ 800, so the config is feasible.",
          ru: "Запас = thr − floor = 1650 − 1200. SLO тоже выдержан: 450 ≤ 800, значит конфигурация допустима.",
        },
      },
      {
        id: "q2",
        q: {
          en: "Same config (thr 1650, p95 450): how many ms of p95 headroom remain to the SLO 800 ms?",
          ru: "Та же конфигурация (thr 1650, p95 450): сколько миллисекунд запаса по p95 остаётся до SLO 800 мс?",
        },
        answer: 350, tol: 0.5, unit: { en: "ms", ru: "мс" },
        hint: {
          en: "Tail margin = SLO − p95 = 800 − 450. A negative value here would be an SLO violation you can read before the held-out run.",
          ru: "Запас по хвосту = SLO − p95 = 800 − 450. Отрицательное значение здесь — нарушение SLO, которое видно ещё до held-out.",
        },
      },
      {
        id: "q3",
        q: {
          en: "The bounded plan of the notebook: default + one OFAT branch per varied knob (3 of them) + one confirmatory pair. How many configurations does the plan contain?",
          ru: "Ограниченный план тетради: default + по одной OFAT-ветке на каждую варьируемую ручку (их 3) + одна подтверждающая пара. Сколько конфигураций в плане?",
        },
        answer: 5, tol: 0.1, unit: { en: "configs", ru: "конфигураций" },
        hint: {
          en: "1 + 3 + 1 = 5 — the notebook freezes exactly this budget and forbids more.",
          ru: "1 + 3 + 1 = 5 — тетрадь замораживает именно этот бюджет и больше не разрешает.",
        },
      },
    ],
    exercises: [
      {
        id: "ex1",
        title: { en: "Exercise 1 · Feasibility conjunction", ru: "Упражнение 1 · Конъюнкция допустимости" },
        brief: {
          en: "Implement <code>is_feasible(config, floor_tps, slo_p95_ms)</code> — the declared conjunction: <code>config['thr_64'] >= floor_tps</code> AND <code>config['p95_64'] <= slo_p95_ms</code>. Both bounds are inclusive: a config exactly on the floor or exactly on the SLO still counts. The config dict carries <code>thr_64</code> (tok/s) and <code>p95_64</code> (ms) measured at wave 64.",
          ru: "Реализуй <code>is_feasible(config, floor_tps, slo_p95_ms)</code> — заявленную конъюнкцию: <code>config['thr_64'] >= floor_tps</code> AND <code>config['p95_64'] <= slo_p95_ms</code>. Обе границы включительные: конфигурация ровно на floor или ровно на SLO всё ещё считается. В словаре конфига — <code>thr_64</code> (ток/с) и <code>p95_64</code> (мс), измеренные на волне 64.",
        },
        starter: `def is_feasible(config, floor_tps, slo_p95_ms):
    """True when throughput clears the floor and p95 meets the SLO."""
    # TODO: one conjunction, both bounds inclusive
`,
        tests: [
          { name: "fast and soft enough", hidden: false, code: "eq(is_feasible({'thr_64': 1650, 'p95_64': 450}, 1200.0, 800.0), True)" },
          { name: "too slow for the SLO", hidden: false, code: "eq(is_feasible({'thr_64': 1250, 'p95_64': 840}, 1200.0, 800.0), False)" },
          { name: "exactly on the floor", hidden: true, code: "eq(is_feasible({'thr_64': 1200, 'p95_64': 700}, 1200.0, 800.0), True)" },
          { name: "exactly on the SLO", hidden: true, code: "eq(is_feasible({'thr_64': 1300, 'p95_64': 800}, 1200.0, 800.0), True)" },
        ],
        solution: `def is_feasible(config, floor_tps, slo_p95_ms):
    return config["thr_64"] >= floor_tps and config["p95_64"] <= slo_p95_ms`,
        hints: [
          { en: "One line: thr >= floor and p95 <= slo. Both comparisons are inclusive (>=, <=).", ru: "Одна строка: thr >= floor and p95 <= slo. Оба сравнения включительные (>=, <=)." },
        ],
        numpy: false,
        timeoutMs: 4000,
      },
      {
        id: "ex2",
        title: { en: "Exercise 2 · Freeze the working point", ru: "Упражнение 2 · Заморозь рабочую точку" },
        brief: {
          en: "Implement <code>pick_working_point(configs, floor_tps, slo_p95_ms)</code> — the frozen profile: among feasible configs (Exercise 1's conjunction) return the one with the max <code>thr_64</code>; ties go to the first in the list. When nothing qualifies, return <code>None</code> — «замораживать нечего» is a legitimate freeze.",
          ru: "Реализуй <code>pick_working_point(configs, floor_tps, slo_p95_ms)</code> — замороженный профиль: среди допустимых конфигураций (конъюнкция из упражнения 1) верни ту, у которой максимум <code>thr_64</code>; при равенстве — первую в списке. Если не прошло ничего, верни <code>None</code> — «замораживать нечего» тоже заморозка.",
        },
        starter: `def pick_working_point(configs, floor_tps, slo_p95_ms):
    """Best-by-throughput feasible config, or None when nothing qualifies."""
    # TODO: filter by feasibility, then keep the max thr_64 (first on ties)
`,
        tests: [
          { name: "picks the fastest feasible", hidden: false, code: "eq(pick_working_point([{'name': 'default', 'thr_64': 1200, 'p95_64': 860}, {'name': 'seqs-32', 'thr_64': 1600, 'p95_64': 470}, {'name': 'pair', 'thr_64': 1650, 'p95_64': 450}, {'name': 'mem-085', 'thr_64': 1150, 'p95_64': 880}, {'name': 'chunked', 'thr_64': 1250, 'p95_64': 840}], 1200.0, 800.0)['name'], 'pair')" },
          { name: "nothing feasible freezes nothing", hidden: false, code: "eq(pick_working_point([{'name': 'slow', 'thr_64': 900, 'p95_64': 300}], 1200.0, 800.0), None)" },
          { name: "ties keep the first", hidden: true, code: "eq(pick_working_point([{'name': 'a', 'thr_64': 1500, 'p95_64': 500}, {'name': 'b', 'thr_64': 1500, 'p95_64': 600}], 1200.0, 800.0)['name'], 'a')" },
          { name: "empty plan", hidden: true, code: "eq(pick_working_point([], 1200.0, 800.0), None)" },
        ],
        solution: `def pick_working_point(configs, floor_tps, slo_p95_ms):
    best = None
    for cfg in configs:
        if cfg["thr_64"] >= floor_tps and cfg["p95_64"] <= slo_p95_ms:
            if best is None or cfg["thr_64"] > best["thr_64"]:
                best = cfg
    return best`,
        hints: [
          { en: "Feasible on the teaching table: seqs-32 (1600/470) and pair (1650/450); max thr wins — pair. default fails on the SLO, chunked on the SLO, mem-085 on both.", ru: "Допустимы на учебной таблице: seqs-32 (1600/470) и pair (1650/450); побеждает максимум thr — pair. default и chunked падают на SLO, mem-085 — на обоих." },
        ],
        numpy: false,
        timeoutMs: 4000,
      },
      {
        id: "ex3",
        title: { en: "Exercise 3 · Fix the bug: units in the count", ru: "Упражнение 3 · Почини баг: единицы в подсчёте" },
        brief: {
          en: "This <code>feasible_count(configs, floor_tps, slo_p95_ms)</code> over-admits: it divides <code>p95_64</code> — reported in <strong>milliseconds</strong> — by 1000 before comparing with the SLO, which is also in milliseconds. Then every p95 looks tiny and only the throughput floor filters: on the teaching sweep it counts 4 instead of 2, waving slow profiles through as eligible. Fix the units.",
          ru: "Эта <code>feasible_count(configs, floor_tps, slo_p95_ms)</code> пропускает лишних: она делит <code>p95_64</code> — а он в <strong>миллисекундах</strong> — на 1000 перед сравнением с SLO, который тоже в миллисекундах. Тогда любой p95 выглядит крошечным, и фильтрует только порог throughput: на учебном свипе она насчитает 4 вместо 2 и пропустит медленные профили как допустимые. Почини единицы.",
        },
        starter: `def feasible_count(configs, floor_tps, slo_p95_ms):
    """How many configs clear both the throughput floor and the p95 SLO."""
    n = 0
    for cfg in configs:
        # BUG: p95_64 is in milliseconds, but the code divides it by 1000
        # before comparing with slo_p95_ms (also milliseconds).
        if cfg["thr_64"] >= floor_tps and cfg["p95_64"] / 1000 <= slo_p95_ms:
            n += 1
    return n
`,
        tests: [
          { name: "teaching sweep counts 2", hidden: false, code: "eq(feasible_count([{'thr_64': 1200, 'p95_64': 860}, {'thr_64': 1600, 'p95_64': 470}, {'thr_64': 1650, 'p95_64': 450}, {'thr_64': 1150, 'p95_64': 880}, {'thr_64': 1250, 'p95_64': 840}], 1200.0, 800.0), 2)" },
          { name: "tighter SLO 460 ms", hidden: false, code: "eq(feasible_count([{'thr_64': 1200, 'p95_64': 860}, {'thr_64': 1600, 'p95_64': 470}, {'thr_64': 1650, 'p95_64': 450}, {'thr_64': 1150, 'p95_64': 880}, {'thr_64': 1250, 'p95_64': 840}], 1200.0, 460.0), 1)" },
          { name: "boundary on both bounds", hidden: true, code: "eq(feasible_count([{'thr_64': 1200, 'p95_64': 800}], 1200.0, 800.0), 1)" },
          { name: "empty plan", hidden: true, code: "eq(feasible_count([], 1200.0, 800.0), 0)" },
        ],
        solution: `def feasible_count(configs, floor_tps, slo_p95_ms):
    n = 0
    for cfg in configs:
        if cfg["thr_64"] >= floor_tps and cfg["p95_64"] <= slo_p95_ms:
            n += 1
    return n`,
        hints: [
          { en: "The starter's diff: expected 2, got 4 — the /1000 turned 860 ms into 0.86 and every p95 passed. Compare milliseconds with milliseconds.", ru: "Диф стартера: ожидалось 2, получено 4 — деление на 1000 превратило 860 мс в 0.86, и все p95 прошли. Сравнивай миллисекунды с миллисекундами." },
        ],
        numpy: false,
        timeoutMs: 4000,
      },
      {
        id: "ex4",
        title: { en: "Exercise 4 · Margins of the choice", ru: "Упражнение 4 · Запасы выбора" },
        brief: {
          en: "Implement <code>slo_margins(config, floor_tps, slo_p95_ms)</code> — how much headroom the choice has: return a tuple <code>(config['thr_64'] - floor_tps, slo_p95_ms - config['p95_64'])</code> — tok/s and ms. Margins may be negative: a negative tail margin is an SLO violation you can read off the sweep table before any held-out run breaks it.",
          ru: "Реализуй <code>slo_margins(config, floor_tps, slo_p95_ms)</code> — сколько запаса у выбора: верни кортеж <code>(config['thr_64'] - floor_tps, slo_p95_ms - config['p95_64'])</code> — ток/с и мс. Запасы могут быть отрицательными: минус по хвосту — нарушение SLO, которое видно по sweep-таблице ещё до того, как его сломает held-out.",
        },
        starter: `def slo_margins(config, floor_tps, slo_p95_ms):
    """(throughput margin tok/s, tail margin ms); negative means violated."""
    # TODO: thr - floor and SLO - p95
`,
        tests: [
          { name: "pair: throughput margin", hidden: false, code: "eq(slo_margins({'thr_64': 1650, 'p95_64': 450}, 1200.0, 800.0)[0], 450)" },
          { name: "pair: tail margin", hidden: false, code: "eq(slo_margins({'thr_64': 1650, 'p95_64': 450}, 1200.0, 800.0)[1], 350)" },
          { name: "on the floor the margin is zero", hidden: true, code: "eq(slo_margins({'thr_64': 1200, 'p95_64': 700}, 1200.0, 800.0)[0], 0)" },
          { name: "SLO violation is a negative margin", hidden: true, code: "eq(slo_margins({'thr_64': 1300, 'p95_64': 840}, 1200.0, 800.0)[1], -40)" },
        ],
        solution: `def slo_margins(config, floor_tps, slo_p95_ms):
    return (config["thr_64"] - floor_tps, slo_p95_ms - config["p95_64"])`,
        hints: [
          { en: "Two subtractions in a tuple. Zero margin means the choice sits exactly on the bound — brittle by definition.", ru: "Две разности в кортеже. Нулевой запас значит, что точка сидит ровно на границе — хрупкая по определению." },
        ],
        numpy: false,
        timeoutMs: 4000,
      },
    ],
    reward: {
      caption: { en: "Feasible, margin, freeze \u2014 tuning with an SLO is a decision, not a vibe.", ru: "\u0414\u043e\u043f\u0443\u0441\u0442\u0438\u043c\u043e\u0441\u0442\u044c, \u0437\u0430\u043f\u0430\u0441, \u0437\u0430\u043c\u043e\u0440\u043e\u0437\u043a\u0430 \u2014 \u0442\u044e\u043d\u0438\u043d\u0433 \u043f\u043e\u0434 SLO \u044d\u0442\u043e \u0440\u0435\u0448\u0435\u043d\u0438\u0435, \u0430 \u043d\u0435 \u043d\u0430\u0441\u0442\u0440\u043e\u0435\u043d\u0438\u0435." },
    },
    footer: {
      en: "Declared teaching numbers and a declared decision rule — not a vLLM measurement and not a production recommendation. The stable content of the Topic 07 validation run is the discipline (frozen plan, OFAT + one confirmatory pair, Pareto front, freeze before held-out); its numbers live in seminars/runs/2026-10-26-topic07-search-mock-v2 and are synthetic by design.",
      ru: "Заявленные учебные числа и заявленное правило решения — не измерение vLLM и не продакшен-рекомендация. Стабильное содержание прогона-валидации Темы 07 — дисциплина (замороженный план, OFAT + одна подтверждающая пара, фронт Парето, заморозка до held-out); его числа живут в seminars/runs/2026-10-26-topic07-search-mock-v2 и по построению синтетические.",
    },
  };
})();
