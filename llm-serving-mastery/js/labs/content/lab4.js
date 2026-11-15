/* Lab 04 — Inside vLLM: the serving lifecycle.
   Content module for the generic lab page (window.LABS_CONTENT['4']).
   Declared constant service model (TTFT, decode rate) plus a synthetic token
   arrival log; real Python tests run in the browser sandbox. Practice
   arithmetic only — no server is started here. */
(function () {
  "use strict";
  window.LABS_CONTENT = window.LABS_CONTENT || {};

  LABS_CONTENT["4"] = {
    title: {
      en: "Inside vLLM: the serving lifecycle",
      ru: "Ядро vLLM: жизненный цикл сервинга",
    },
    sub: {
      en: "Predict nominal latency from a declared TTFT/decode model, read a token arrival log, then defend the measured rate in real Python tests.",
      ru: "Предскажи номинальную задержку по заявленной модели TTFT/decode, прочитай лог прихода токенов и защити измеренную скорость настоящими Python-тестами.",
    },
    intro: {
      en: `<p>A served request lives in two phases. <strong>Prefill</strong> reads the whole prompt and produces the first token — the client sees it after the <strong>TTFT</strong>. Then <strong>decode</strong> emits the remaining tokens roughly one per step at a near-constant rate. The declared nominal model is <code>wall = TTFT + (n − 1) / decode</code>, and the <strong>n − 1</strong> is the whole point: the first token is already paid for inside TTFT, so only the remaining gaps belong to the decode rate. Getting this wrong inflates tok/s on short answers and hides the prefill cost on long ones.</p>
<p>A streaming log gives the measured side of the same contract: measured TTFT is the first token's arrival time, and the measured rate is <code>(n − 1) / (t_last − t_first)</code> — the gaps, not the whole window. The lab habit: predict with declared constants first, then read the log, then explain any difference. Everything here runs on declared numbers and a synthetic log — it is not an HTTP measurement.</p>`,
      ru: `<p>Жизненный цикл запроса — две фазы. <strong>Prefill</strong> читает весь промпт и выдаёт первый токен — клиент видит его после <strong>TTFT</strong>. Затем <strong>decode</strong> выдаёт оставшиеся токены примерно по одному за шаг, с почти постоянной скоростью. Заявленная номинальная модель: <code>wall = TTFT + (n − 1) / decode</code>, и <strong>n − 1</strong> здесь — главное: первый токен уже оплачен внутри TTFT, поэтому декодируются только оставшиеся промежутки. Ошибка здесь раздувает tok/s на коротких ответах и прячет стоимость prefill на длинных.</p>
<p>Стриминговый лог даёт измеренную сторону того же контракта: измеренный TTFT — момент прихода первого токена, а измеренная скорость — <code>(n − 1) / (t_last − t_first)</code>: промежутки, а не всё окно. Привычка лабы: сначала предскажи по заявленным константам, потом прочитай лог, потом объясни разницу. Всё здесь считается на заявленных числах и синтетическом логе — это не HTTP-измерение.</p>`,
    },
    outcomes: [
      { en: "Separate a response wall time into TTFT and decode contributions.", ru: "\u0420\u0430\u0437\u043b\u0430\u0433\u0430\u0442\u044c \u0432\u0440\u0435\u043c\u044f \u043e\u0442\u0432\u0435\u0442\u0430 \u043d\u0430 TTFT \u0438 decode-\u0432\u043a\u043b\u0430\u0434." },
      { en: "Read a streaming log the way a client sees it: first chunk, cadence, measured rate.", ru: "\u0427\u0438\u0442\u0430\u0442\u044c \u0441\u0442\u0440\u0438\u043c\u0438\u043d\u0433\u043e\u0432\u044b\u0439 \u043b\u043e\u0433 \u0433\u043b\u0430\u0437\u0430\u043c\u0438 \u043a\u043b\u0438\u0435\u043d\u0442\u0430: \u043f\u0435\u0440\u0432\u044b\u0439 \u0447\u0430\u043d\u043a, \u043a\u0430\u0434\u0435\u043d\u0441, \u0438\u0437\u043c\u0435\u0440\u0435\u043d\u043d\u0430\u044f \u0441\u043a\u043e\u0440\u043e\u0441\u0442\u044c." },
    ],
    model: [
      ["declared service", "TTFT = 180 ms", "decode", "55 tok/s"],
      ["nominal wall", "TTFT + (n − 1) / decode", "prefill share", "TTFT / wall"],
      ["measured TTFT", "first token arrival", "measured rate", "(n − 1) / (t_last − t_first)"],
    ],
    scenario: null,
    quizzes: [
      {
        id: "q1",
        q: {
          en: "Nominal wall time of a 256-token answer on the declared service (TTFT 180 ms, decode 55 tok/s), in seconds?",
          ru: "Номинальное время 256-токенного ответа на заявленном сервисе (TTFT 180 мс, decode 55 tok/s), в секундах?",
        },
        answer: 4.8164, tol: 0.01, unit: { en: "s", ru: "с" },
        hint: {
          en: "wall = 0.18 + (256 − 1) / 55. The first of the 256 tokens is inside TTFT.",
          ru: "wall = 0.18 + (256 − 1) / 55. Первый из 256 токенов уже внутри TTFT.",
        },
      },
      {
        id: "q2",
        q: {
          en: "Nominal wall time of a forced 24-token reply (like the notebook's forced-length trials), in seconds?",
          ru: "Номинальное время принудительного 24-токенного ответа (как форсированные прогоны в тетради), в секундах?",
        },
        answer: 0.5982, tol: 0.001, unit: { en: "s", ru: "с" },
        hint: {
          en: "0.18 + (24 − 1) / 55 = 0.18 + 23/55. Charging 24 gaps instead of 23 breaks the model.",
          ru: "0.18 + (24 − 1) / 55 = 0.18 + 23/55. Посчитать 24 промежутка вместо 23 — сломать модель.",
        },
      },
      {
        id: "q3",
        q: {
          en: "A stream log: first token arrives at t = 0.30 s, the 11th token at t = 2.30 s. Measured decode rate, in tok/s?",
          ru: "Лог стрима: первый токен пришёл при t = 0.30 с, 11-й токен при t = 2.30 с. Измеренная скорость decode, в tok/s?",
        },
        answer: 5, tol: 0.01, unit: { en: "tok/s", ru: "tok/s" },
        hint: {
          en: "(11 − 1) gaps in (2.30 − 0.30) s. Dividing 11 by the window would charge TTFT to decode.",
          ru: "(11 − 1) промежутков за (2.30 − 0.30) с. Делить 11 на всё окно — приписывать TTFT к decode.",
        },
      },
    ],
    exercises: [
      {
        id: "ex1",
        title: { en: "Exercise 1 · Nominal response time", ru: "Упражнение 1 · Номинальное время ответа" },
        brief: {
          en: "Implement <code>response_time_s(ttft_s, token_count, decode_tps)</code> — nominal wall seconds: <code>ttft + (token_count − 1) / decode_tps</code>. A single-token answer pays TTFT only: zero decode gaps.",
          ru: "Реализуй <code>response_time_s(ttft_s, token_count, decode_tps)</code> — номинальные секунды ответа: <code>ttft + (token_count − 1) / decode_tps</code>. Однотокенный ответ платит только TTFT: декодируемых промежутков ноль.",
        },
        starter: `def response_time_s(ttft_s, token_count, decode_tps):
    """Nominal wall seconds: TTFT plus the remaining decode gaps."""
    # TODO: declared model — the first token is inside TTFT
`,
        tests: [
          { name: "256-token nominal answer", hidden: false, code: "approx(response_time_s(0.18, 256, 55), 0.18 + 255 / 55, 1e-9)" },
          { name: "single token pays only TTFT", hidden: false, code: "eq(response_time_s(0.18, 1, 55), 0.18)" },
          { name: "one decode gap", hidden: true, code: "approx(response_time_s(0.1, 2, 50), 0.12, 1e-12)" },
          { name: "another machine", hidden: true, code: "approx(response_time_s(0.05, 65, 40), 1.65, 1e-9)" },
        ],
        solution: `def response_time_s(ttft_s, token_count, decode_tps):
    return ttft_s + (token_count - 1) / decode_tps`,
        hints: [
          { en: "token_count − 1, not token_count: the first token arrives with the TTFT.", ru: "token_count − 1, а не token_count: первый токен приходит вместе с TTFT." },
        ],
        numpy: false,
        timeoutMs: 4000,
      },
      {
        id: "ex2",
        title: { en: "Exercise 2 · Prefill vs decode share", ru: "Упражнение 2 · Доля prefill против decode" },
        brief: {
          en: "Implement <code>prefill_share(ttft_s, token_count, decode_tps)</code> — the TTFT fraction of the nominal wall: <code>ttft / response_time</code>. It is small for long answers and 1.0 for a single token, where prefill is the whole story.",
          ru: "Реализуй <code>prefill_share(ttft_s, token_count, decode_tps)</code> — долю TTFT в номинальном времени: <code>ttft / response_time</code>. Для длинных ответов она мала, а для одного токена равна 1.0 — там prefill и есть вся история.",
        },
        starter: `def prefill_share(ttft_s, token_count, decode_tps):
    """TTFT fraction of the nominal wall time, in [0, 1]."""
    # TODO: divide TTFT by the nominal wall from exercise 1's formula
`,
        tests: [
          { name: "prefill is small for long answers", hidden: false, code: "approx(prefill_share(0.18, 256, 55), 0.18 / (0.18 + 255 / 55), 1e-9)" },
          { name: "prefill dominates tiny answers", hidden: false, code: "approx(prefill_share(0.9, 3, 50), 0.9 / 0.94, 1e-9)" },
          { name: "single token: all prefill", hidden: true, code: "eq(prefill_share(0.3, 1, 55), 1.0)" },
          { name: "1024-token answer", hidden: true, code: "approx(prefill_share(0.18, 1024, 55), 0.18 / (0.18 + 1023 / 55), 1e-9)" },
        ],
        solution: `def prefill_share(ttft_s, token_count, decode_tps):
    total = ttft_s + (token_count - 1) / decode_tps
    return ttft_s / total`,
        hints: [
          { en: "Reuse response_time_s: share = ttft / total. One division.", ru: "Переиспользуй response_time_s: share = ttft / total. Одно деление." },
        ],
        numpy: false,
        timeoutMs: 4000,
      },
      {
        id: "ex3",
        title: { en: "Exercise 3 · Fix the bug: measured stream rate", ru: "Упражнение 3 · Почини баг: измеренная скорость стрима" },
        brief: {
          en: "This <code>stream_metrics(samples)</code> reads a token arrival log <code>[(t_s, token), ...]</code> and returns <code>(ttft_s, decode_tps)</code>. The starter charges <em>every</em> token — including the first, which TTFT already paid for — to the decode window, inflating tok/s. Fix it: the rate counts only the <strong>n − 1</strong> gaps after the first token. Contracts: empty log → <code>(0.0, 0.0)</code>; single token → <code>(ttft, 0.0)</code> — no gaps, no rate.",
          ru: "Эта <code>stream_metrics(samples)</code> читает лог прихода токенов <code>[(t_s, token), ...]</code> и возвращает <code>(ttft_s, decode_tps)</code>. Стартер приписывает <em>каждому</em> токену — включая первый, за который уже заплатил TTFT, — всё окно decode и завышает tok/s. Почини: скорость считают только <strong>n − 1</strong> промежутков после первого токена. Контракты: пустой лог → <code>(0.0, 0.0)</code>; один токен → <code>(ttft, 0.0)</code> — промежутков нет, скорости нет.",
        },
        starter: `def stream_metrics(samples):
    """Measured (TTFT s, decode tok/s) from a [(t_s, token), ...] arrival log."""
    # BUG: every token, including the first, is charged to the decode
    # window, so TTFT is silently counted as decode time
    if not samples:
        return (0.0, 0.0)
    n = len(samples)
    total = samples[-1][0] - samples[0][0]
    return (samples[0][0], n / total)
`,
        tests: [
          { name: "ttft is the first arrival", hidden: false, code: "eq(stream_metrics([(0.2, 'a'), (0.4, 'b'), (0.6, 'c')])[0], 0.2)" },
          { name: "rate counts gaps only", hidden: false, code: "approx(stream_metrics([(0.2, 'a'), (0.4, 'b'), (0.6, 'c')])[1], 5.0, 1e-12)" },
          { name: "uneven arrivals", hidden: false, code: "approx(stream_metrics([(0.18, '<s>'), (0.236, 'x'), (0.254, 'y')])[1], 2 / 0.074, 1e-9)" },
          { name: "single token has no gaps", hidden: true, code: "eq(stream_metrics([(0.25, '<s>')]), (0.25, 0.0))" },
        ],
        solution: `def stream_metrics(samples):
    if not samples:
        return (0.0, 0.0)
    ttft = samples[0][0]
    if len(samples) < 2:
        return (ttft, 0.0)
    return (ttft, (len(samples) - 1) / (samples[-1][0] - ttft))`,
        hints: [
          { en: "Three tokens span two gaps: the rate is (n − 1) / window, not n / window.", ru: "Три токена — это два промежутка: скорость равна (n − 1) / окно, а не n / окно." },
          { en: "Guard the single-token case before dividing: one token means zero gaps.", ru: "Защитись от случая одного токена до деления: один токен — ноль промежутков." },
        ],
        numpy: false,
        timeoutMs: 4000,
      },
    ],
    reward: {
      caption: { en: "One request walked end to end: prefill, decode, and the streaming timeline.", ru: "\u041e\u0434\u0438\u043d \u0437\u0430\u043f\u0440\u043e\u0441 \u043f\u0440\u043e\u0448\u0451\u043b \u043e\u0442 \u043d\u0430\u0447\u0430\u043b\u0430 \u0434\u043e \u043a\u043e\u043d\u0446\u0430: prefill, decode \u0438 \u0441\u0442\u0440\u0438\u043c\u0438\u043d\u0433\u043e\u0432\u0430\u044f \u0448\u043a\u0430\u043b\u0430." },
    },
    footer: {
      en: "Nominal arithmetic on declared constants plus a synthetic arrival log — not an HTTP measurement, and no server is started here. The recorded vLLM greeting stream and launch settings live in the Topic 04 evidence run (seminars/runs/2026-10-02-topic04-serving); this lab does not execute it.",
      ru: "Номинальная арифметика на заявленных константах плюс синтетический лог прихода токенов — не HTTP-измерение, и сервер здесь не запускается. Записанный vLLM-стрим с приветствием и настройки запуска живут в evidence-прогоне Темы 04 (seminars/runs/2026-10-02-topic04-serving); эта лаба его не исполняет.",
    },
  };
})();
