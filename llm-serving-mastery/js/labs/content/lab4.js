/* Lab 04 — Inside vLLM: the serving lifecycle.
   Content module for the generic lab page (window.LABS_CONTENT['4']).
   Declared constant service model (TTFT, decode rate) plus a synthetic token
   arrival log; real Python tests run in the browser sandbox. Practice
   arithmetic only — no server is started here. */
(function () {
  "use strict";
  window.LABS_CONTENT = window.LABS_CONTENT || {};

  LABS_CONTENT["4"] = {
    budget: 40,
    title: {
      en: "Inside vLLM: the serving lifecycle",
      ru: "Внутри vLLM: жизненный цикл сервинга",
    },
    sub: {
      en: "Predict nominal latency from a declared TTFT/decode model, read a token arrival log, then defend the measured rate in real Python tests.",
      ru: "Предскажи номинальную задержку по заявленной модели TTFT/decode, прочитай лог прихода токенов и защити измеренную скорость настоящими Python-тестами.",
    },
    intro: {
      en: `<p>A served request lives in two phases. <strong>Prefill</strong> reads the whole prompt and produces the first token — the client sees it after the <strong>TTFT</strong>. Then <strong>decode</strong> emits the remaining tokens roughly one per step at a near-constant rate. The declared nominal model is <code>wall = TTFT + (n − 1) / decode</code>, and the <strong>n − 1</strong> is the whole point: the first token is already paid for inside TTFT, so only the remaining gaps belong to the decode rate. Getting this wrong inflates tok/s on short answers and hides the prefill cost on long ones.</p>
<p>A streaming log gives the measured side of the same contract: measured TTFT is the first token's arrival time, and the measured rate is <code>(n − 1) / (t_last − t_first)</code> — the gaps, not the whole window. The lab habit: predict with declared constants first, then read the log, then explain any difference. Reading the log also means knowing how it ends: the finish reason and DONE tell you whether the stream actually completed (the second figure follows this thought). Everything here runs on declared numbers and a synthetic log — it is not an HTTP measurement.</p>`,
      ru: `<p>Жизненный цикл запроса — две фазы. <strong>Prefill</strong> читает весь промпт и выдаёт первый токен — клиент видит его после <strong>TTFT</strong>. Затем <strong>decode</strong> выдаёт оставшиеся токены примерно по одному за шаг, с почти постоянной скоростью. Заявленная номинальная модель: <code>wall = TTFT + (n − 1) / decode</code>, и <strong>n − 1</strong> здесь — главное: первый токен уже оплачен внутри TTFT, поэтому decode платит только за оставшиеся промежутки. Ошибка здесь раздувает tok/s на коротких ответах и прячет стоимость prefill на длинных.</p>
<p>Стриминговый лог даёт измеренную сторону того же контракта: измеренный TTFT — момент прихода первого токена, а измеренная скорость — <code>(n − 1) / (t_last − t_first)</code>: промежутки, а не всё окно. Привычка лабы: сначала предскажи по заявленным константам, потом прочитай лог, потом объясни разницу. Читать лог — значит знать, чем он кончился: finish-причина и DONE говорят, завершился ли стрим на самом деле (вторая фигура продолжает эту мысль). Всё здесь считается на заявленных числах и синтетическом логе — это не HTTP-измерение.</p>`,
    },
    heroTag: { en: "TTFT, decode cadence", ru: "TTFT, каденс decode" },
    figures: [
      {
        id: "lab4-stream-clock",
        title: { en: "The client's stream clock: TTFT, then gaps", ru: "Часы стрима у клиента: TTFT, потом промежутки" },
        w: 760, h: 420,
        svg: `<svg viewBox="0 0 760 420" xmlns="http://www.w3.org/2000/svg">
  <g id="g-axis">
    <line x1="80" y1="230" x2="700" y2="230" stroke="var(--lab-muted)" stroke-width="1.5"/>
    <text x="700" y="256" text-anchor="end" font-size="14" fill="var(--lab-muted)" data-en="client time, s" data-ru="время клиента, с">client time, s</text>
    <text x="80" y="256" font-size="13" fill="var(--lab-muted)" class="mono">0</text>
    <text x="204" y="256" font-size="13" fill="var(--lab-muted)" class="mono">0.2</text>
    <text x="452" y="256" font-size="13" fill="var(--lab-muted)" class="mono">0.6</text>
    <circle cx="80" cy="230" r="7" fill="var(--lab-muted)"/>
    <text x="80" y="196" text-anchor="middle" font-size="13" fill="var(--lab-muted)" data-en="request sent" data-ru="запрос отправлен">request sent</text>
  </g>
  <g id="g-ttft">
    <circle cx="204" cy="230" r="8" fill="var(--lab-accent)"/>
    <text x="204" y="196" text-anchor="middle" font-size="13" fill="var(--lab-accent)" data-en="first token" data-ru="первый токен">first token</text>
    <line x1="80" y1="150" x2="204" y2="150" stroke="var(--lab-accent)" stroke-width="2" class="fig-flow"/>
    <line x1="80" y1="144" x2="80" y2="156" stroke="var(--lab-accent)" stroke-width="2"/>
    <line x1="204" y1="144" x2="204" y2="156" stroke="var(--lab-accent)" stroke-width="2"/>
    <text x="142" y="136" text-anchor="middle" font-size="16" fill="var(--lab-accent)" class="mono">TTFT = 0.2 s</text>
    <text x="142" y="118" text-anchor="middle" font-size="13" fill="var(--lab-muted)" data-en="prefill + one step" data-ru="prefill + один шаг">prefill + one step</text>
  </g>
  <g id="g-gaps">
    <circle cx="328" cy="230" r="8" fill="var(--lab-accent)"/>
    <circle cx="452" cy="230" r="8" fill="var(--lab-accent)"/>
    <text x="328" y="196" text-anchor="middle" font-size="13" fill="var(--lab-muted)" class="mono">b</text>
    <text x="452" y="196" text-anchor="middle" font-size="13" fill="var(--lab-muted)" class="mono">c</text>
    <line x1="204" y1="286" x2="328" y2="286" stroke="var(--fig-warm)" stroke-width="2" class="fig-flow"/>
    <line x1="328" y1="286" x2="452" y2="286" stroke="var(--fig-warm)" stroke-width="2" class="fig-flow"/>
    <text x="328" y="312" text-anchor="middle" font-size="15" fill="var(--fig-warm)" data-en="2 gaps in 0.4 s" data-ru="2 промежутка за 0.4 с">2 gaps in 0.4 s</text>
  </g>
  <g id="g-rate">
    <text x="380" y="366" text-anchor="middle" font-size="21" fill="var(--lab-ink)" class="mono">rate = (n − 1) / (t_last − t_first) = 2 / 0.4 = 5.0 tok/s</text>
    <text x="380" y="392" text-anchor="middle" font-size="14" fill="var(--lab-good)" data-en="the first token is already paid for by TTFT" data-ru="первый токен уже оплачен внутри TTFT">the first token is already paid for by TTFT</text>
  </g>
  <g id="g-ghost">
    <text x="380" y="366" text-anchor="middle" font-size="19" fill="var(--fig-warm)" class="fig-ghost" data-en="charging every token: 3 / 0.4 = 7.5 tok/s — a lie" data-ru="платим за каждый токен: 3 / 0.4 = 7.5 ток/с — ложь">charging every token: 3 / 0.4 = 7.5 tok/s — a lie</text>
    <text x="380" y="392" text-anchor="middle" font-size="14" fill="var(--lab-good)" data-en="count the gaps, not the window" data-ru="считай промежутки, а не всё окно">count the gaps, not the window</text>
  </g>
</svg>`,
        stages: [
          { cap: { en: "Request sent at 0; the first token arrives at 0.2 s.", ru: "Клиент отправляет запрос в нуле; первый токен приходит через 0.2 с." }, show: ["g-axis"] },
          { cap: { en: "Measured TTFT = 0.2 s: prefill plus one decode step.", ru: "Измеренный TTFT = 0.2 с: prefill плюс один decode-шаг." }, show: ["g-axis", "g-ttft"] },
          { cap: { en: "Tokens b and c: two gaps in a 0.4 s window.", ru: "Токены b и c: два промежутка в окне 0.4 с." }, show: ["g-axis", "g-ttft", "g-gaps"] },
          { cap: { en: "Rate = 2 / 0.4 = 5.0 tok/s — gaps, not window.", ru: "Скорость = 2 / 0.4 = 5.0 ток/с — не всё окно." }, show: ["g-axis", "g-ttft", "g-gaps", "g-rate"] },
          { cap: { en: "Charging every token gives 7.5 tok/s — the starter's lie.", ru: "Платить за каждый токен — 7.5 ток/с: ложь стартера." }, show: ["g-axis", "g-ttft", "g-gaps", "g-ghost"] },
        ],
      },
      {
        id: "lab4-finish-map",
        title: { en: "Finish reasons: how a stream really ends", ru: "Причины завершения: чем стрим кончается на самом деле" },
        w: 760, h: 420,
        svg: `<svg viewBox="0 0 760 420" xmlns="http://www.w3.org/2000/svg">
  <g id="g-head">
    <text x="90" y="70" font-size="13" fill="var(--lab-muted)" class="mono" data-en="OBSERVED" data-ru="НАБЛЮДАЕМ">OBSERVED</text>
    <text x="410" y="70" font-size="13" fill="var(--lab-muted)" class="mono" data-en="MEANING" data-ru="СМЫСЛ">MEANING</text>
    <line x1="70" y1="82" x2="740" y2="82" stroke="var(--lab-muted)" stroke-width="1"/>
  </g>
  <g id="g-r1">
    <text x="90" y="120" font-size="15" fill="var(--lab-ink)" class="mono">stop + DONE</text>
    <text x="410" y="120" font-size="15" fill="var(--lab-good)" data-en="protocol complete" data-ru="протокол завершён">protocol complete</text>
    <circle cx="730" cy="115" r="8" fill="var(--lab-good)"/>
  </g>
  <g id="g-r2">
    <text x="90" y="180" font-size="15" fill="var(--lab-ink)" class="mono">length + DONE</text>
    <text x="410" y="180" font-size="15" fill="var(--fig-warm)" data-en="generation capped by max_tokens" data-ru="генерация срезана max_tokens">generation capped by max_tokens</text>
    <circle cx="730" cy="175" r="8" fill="var(--fig-warm)"/>
  </g>
  <g id="g-r34">
    <text x="90" y="240" font-size="15" fill="var(--lab-ink)" class="mono">content, then EOF</text>
    <text x="410" y="240" font-size="15" fill="var(--lab-bad)" data-en="connection died — partial response" data-ru="соединение умерло — частичный ответ">connection died — partial response</text>
    <text x="90" y="300" font-size="15" fill="var(--lab-ink)" class="mono">error + DONE</text>
    <text x="410" y="300" font-size="15" fill="var(--lab-bad)" data-en="terminal frame ≠ success" data-ru="терминальный кадр ≠ успех">terminal frame ≠ success</text>
    <circle cx="730" cy="235" r="8" fill="var(--lab-bad)"/>
    <circle cx="730" cy="295" r="8" fill="var(--lab-bad)"/>
  </g>
  <g id="g-verdict">
    <text x="380" y="366" text-anchor="middle" font-size="16" fill="var(--lab-ink)" data-en="no single check suffices: read the pair, not one badge" data-ru="одной проверки мало: читай пару, а не один бейдж">no single check suffices: read the pair, not one badge</text>
    <text x="380" y="394" text-anchor="middle" font-size="14" fill="var(--lab-muted)" data-en="DONE + finish reason + stream health, always together" data-ru="DONE + finish-причина + здоровье стрима, всегда вместе">DONE + finish reason + stream health, always together</text>
  </g>
</svg>`,
        stages: [
          { cap: { en: "Two columns: what the client observes, and what it actually means.", ru: "Две колонки: что клиент наблюдает и что это значит на самом деле." }, show: ["g-head"] },
          { cap: { en: "stop + DONE: the model finished — the healthy ending.", ru: "stop + DONE: модель закончила — здоровый финал." }, show: ["g-head", "g-r1"] },
          { cap: { en: "length + DONE: the cap cut the generation — expected, but truncated.", ru: "length + DONE: потолок срезал генерацию — ожидаемо, но обрыв." }, show: ["g-head", "g-r1", "g-r2"] },
          { cap: { en: "content-then-EOF and error+DONE look final too — both are failures.", ru: "content-then-EOF и error+DONE тоже выглядят финалом — оба — это провал." }, show: ["g-head", "g-r1", "g-r2", "g-r34"] },
          { cap: { en: "No single check suffices: read the pair, not one badge.", ru: "Одной проверки мало: читай пару, а не один бейдж." }, show: ["g-head", "g-r1", "g-r2", "g-r34", "g-verdict"] },
        ],
      },
    ],
    outcomes: [
      { en: "Separate a response wall time into TTFT and decode contributions.", ru: "\u0420\u0430\u0437\u043b\u0430\u0433\u0430\u0442\u044c \u0432\u0440\u0435\u043c\u044f \u043e\u0442\u0432\u0435\u0442\u0430 \u043d\u0430 TTFT \u0438 decode-\u0432\u043a\u043b\u0430\u0434." },
      { en: "Read a streaming log the way a client sees it: first chunk, cadence, measured rate.", ru: "\u0427\u0438\u0442\u0430\u0442\u044c \u0441\u0442\u0440\u0438\u043c\u0438\u043d\u0433\u043e\u0432\u044b\u0439 \u043b\u043e\u0433 \u0433\u043b\u0430\u0437\u0430\u043c\u0438 \u043a\u043b\u0438\u0435\u043d\u0442\u0430: \u043f\u0435\u0440\u0432\u044b\u0439 \u0447\u0430\u043d\u043a, \u043a\u0430\u0434\u0435\u043d\u0441, \u0438\u0437\u043c\u0435\u0440\u0435\u043d\u043d\u0430\u044f \u0441\u043a\u043e\u0440\u043e\u0441\u0442\u044c." },
    ],
    model: [
      [{ en: "declared service", ru: "заявленный сервис" }, { en: "TTFT = 180 ms", ru: "TTFT = 180 мс" }, "decode", { en: "55 tok/s", ru: "55 ток/с" }],
      [{ en: "nominal wall", ru: "номинальное wall-время" }, { en: "TTFT + (n − 1) / decode", ru: "TTFT + (n − 1) / decode" }, { en: "prefill share", ru: "доля prefill" }, { en: "TTFT / wall", ru: "TTFT / wall" }],
      [{ en: "measured TTFT", ru: "измеренный TTFT" }, { en: "first token arrival", ru: "приход первого токена" }, { en: "measured rate", ru: "измеренная скорость" }, { en: "(n − 1) / (t_last − t_first)", ru: "(n − 1) / (t_last − t_first)" }],
    ],
    scenario: null,
    quizzes: [
      {
        id: "q1",
        q: {
          en: "Nominal wall time of a 256-token answer on the declared service (TTFT 180 ms, decode 55 tok/s), in seconds?",
          ru: "Номинальное время 256-токенного ответа на заявленном сервисе (TTFT 180 мс, decode 55 tok/s), в секундах?",
        },
        answer: 4.8164, tol: 0.01, unit: { en: "s", ru: "с" },
        hint: {
          en: "wall = 0.18 + (256 − 1) / 55. The first of the 256 tokens is inside TTFT.",
          ru: "wall = 0.18 + (256 − 1) / 55. Первый из 256 токенов уже внутри TTFT.",
        },
        followUp: {
          q: { en: "Why 255 gaps and not 256?", ru: "Почему 255 промежутков, а не 256?" },
          options: [
            { en: "The first token arrives together with the TTFT: only the remaining 255 pay the decode cadence", ru: "Первый токен приходит вместе с TTFT: каденс decode оплачивают только оставшиеся 255" },
            { en: "The engine drops every 256th token as padding", ru: "Движок отбрасывает каждый 256-й токен как паддинг" },
            { en: "256 is the wall seconds, so the gaps are 256 − TTFT", ru: "256 — это секунды wall, поэтому промежутков 256 − TTFT" },
          ],
          answer: 0,
          explain: { en: "TTFT already contains prefill + one decode step. Charging 256 gaps pays the first token twice — the model breaks exactly on short answers, where the double-charge is the largest share.", ru: "TTFT уже содержит prefill и один decode-шаг. Плата за 256 промежутков дважды оплачивает первый токен — модель ломается ровно на коротких ответах, где двойной платёж и есть наибольшая доля." },
        },
      },
      {
        id: "q2",
        q: {
          en: "Nominal wall time of a forced 24-token reply (like the notebook's forced-length trials), in seconds?",
          ru: "Номинальное время принудительного 24-токенного ответа (как у форсированных прогонов в тетради), в секундах?",
        },
        answer: 0.5982, tol: 0.005, unit: { en: "s", ru: "с" },
        hint: {
          en: "0.18 + (24 − 1) / 55 = 0.18 + 23/55. Charging 24 gaps instead of 23 breaks the model.",
          ru: "0.18 + (24 − 1) / 55 = 0.18 + 23/55. Посчитать 24 промежутка вместо 23 — сломать модель.",
        },
        followUp: {
          q: { en: "Why is a single-token answer exactly TTFT, with zero decode time?", ru: "Почему однотокенный ответ — это ровно TTFT, с нулевым decode-временем?" },
          options: [
            { en: "The first token is produced inside TTFT (prefill + one step), and there are no further gaps to pay", ru: "Первый токен производится внутри TTFT (prefill + один шаг), и дальше платить за промежутки не за что" },
            { en: "Decode is skipped entirely for short answers", ru: "Для коротких ответов decode пропускается целиком" },
            { en: "A single token answers instantly — TTFT applies only to long prompts", ru: "Один токен отвечается мгновенно — TTFT касается только длинных промптов" },
          ],
          answer: 0,
          explain: { en: "TTFT = prefill + the first decode step. With n = 1 there are n − 1 = 0 gaps after it: the formula collapses to TTFT, as the tests of Exercise 1 pin.", ru: "TTFT = prefill + первый decode-шаг. При n = 1 после него n − 1 = 0 промежутков: формула схлопывается в TTFT, что и закрепляют тесты упражнения 1." },
        },
      },
      {
        id: "q3",
        q: {
          en: "A stream log: first token arrives at t = 0.30 s, the 11th token at t = 2.30 s. Measured decode rate, in tok/s?",
          ru: "Лог стрима: первый токен пришёл при t = 0.30 с, 11-й токен при t = 2.30 с. Измеренная скорость decode, в tok/s?",
        },
        answer: 5, tol: 0.01, unit: { en: "tok/s", ru: "tok/s" },
        hint: {
          en: "(11 − 1) gaps in (2.30 − 0.30) s. Dividing 11 by the window would charge TTFT to decode.",
          ru: "(11 − 1) промежутков за (2.30 − 0.30) с. Делить 11 на всё окно — приписывать TTFT к decode.",
        },
        followUp: {
          q: { en: "Why is the measured window (t_last − t_first) and not the full 2.30 s?", ru: "Почему измеренное окно — это (t_last − t_first), а не все 2.30 с?" },
          options: [
            { en: "The window before the first token is prefill, already reported as TTFT — decode owns only the gaps after it", ru: "Окно до первого токена — это prefill, уже отчитанный как TTFT; decode владеет только промежутками после него" },
            { en: "The server clock starts at 2.30 s", ru: "Часы сервера стартуют в 2.30 с" },
            { en: "The first token does not count as a token at all", ru: "Первый токен вообще не считается токеном" },
          ],
          answer: 0,
          explain: { en: "Charging decode the full window quietly moves 0.30 s of prefill into the decode rate: 10/2.30 = 4.3 instead of 10/2.0 = 5.0. The stream clock starts at the first chunk.", ru: "Платя decode всё окно, ты тихо переносишь 0.30 с prefill в скорость decode: 10/2.30 = 4.3 вместо 10/2.0 = 5.0. Часы стрима стартуют на первом чанке." },
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
          { en: "token_count − 1, not token_count: the first token arrives with the TTFT.", ru: "token_count − 1, а не token_count: первый токен приходит вместе с TTFT." },
        ],
        numpy: false,
        timeoutMs: 4000,
      },
      {
        id: "ex2",
        title: { en: "Exercise 2 · Prefill vs decode share", ru: "Упражнение 2 · Доля prefill против decode" },
        brief: {
          en: "Implement <code>prefill_share(ttft_s, token_count, decode_tps)</code> — the TTFT fraction of the nominal wall: <code>ttft / response_time</code>. It is small for long answers and 1.0 for a single token, where prefill is the whole story.",
          ru: "Реализуй <code>prefill_share(ttft_s, token_count, decode_tps)</code> — долю TTFT в номинальном времени: <code>ttft / response_time</code>. Для длинных ответов она мала, а для одного токена равна 1.0 — там prefill и есть вся история.",
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
          { name: "empty log contract", hidden: true, code: "eq(stream_metrics([]), (0.0, 0.0))" },
        ],
        solution: `def stream_metrics(samples):
    if not samples:
        return (0.0, 0.0)
    ttft = samples[0][0]
    if len(samples) < 2:
        return (ttft, 0.0)
    return (ttft, (len(samples) - 1) / (samples[-1][0] - ttft))`,
        hints: [
          { en: "Three tokens span two gaps: the rate is (n − 1) / window, not n / window.", ru: "Три токена — это два промежутка: скорость равна (n − 1) / окно, а не n / окно." },
          { en: "Guard the single-token case before dividing: one token means zero gaps.", ru: "Защитись от случая одного токена до деления: один токен — ноль промежутков." },
        ],
        numpy: false,
        timeoutMs: 4000,
      },
    ],
    challenge: {
      id: "chal1",
      word: { en: "challenge", ru: "челлендж" },
      title: {
        en: "★ Find the answer length where prefill stops mattering",
        ru: "★ Найди длину ответа, с которой prefill перестаёт значить",
      },
      brief: {
        en: "On the declared service (TTFT 180 ms, decode 55 tok/s) the prefill share <code>ttft / wall</code> shrinks as answers grow. No tests guide you: derive, search or scan — the page recomputes everything from your numbers and additionally verifies <strong>minimality</strong>: n − 1 must NOT satisfy the goal (otherwise a smaller answer already did).",
        ru: "На заявленном сервисе (TTFT 180 мс, decode 55 ток/с) доля prefill <code>ttft / wall</code> падает с ростом ответа. Тестов-каркаса нет: выводи, ищи или сканируй — страница пересчитывает всё по твоим числам и дополнительно проверяет <strong>минимальность</strong>: n − 1 уже НЕ должен удовлетворять цели (иначе меньший ответ справился бы раньше).",
      },
      goal: {
        en: "Print one line: <code>n=… share_pct=…</code> — the MINIMAL n whose prefill share drops below 5 %.",
        ru: "Напечатай одну строку: <code>n=… share_pct=…</code> — МИНИМАЛЬНОЕ n, при котором доля prefill падает ниже 5 %.",
      },
      mode: "run",
      numpy: false,
      timeoutMs: 30000,
      starter: `# Declared service: TTFT = 0.18 s, decode = 55 tok/s.
# Nominal wall: wall = 0.18 + (n - 1) / 55.
# Prefill share: ttft / wall. Goal: the share drops below 5 %.
# The page reads ONE summary line in exactly this shape:
#   n=<token count> share_pct=<share in percent>
# Find the MINIMAL such n - the page checks n-1 fails the goal.

# TODO: derive or scan for the minimal n, then print the line.
`,
      check: (res) => {
        const out = String(res.stdout || "");
        const mm = out.match(/n\s*=\s*([0-9]+)[\s\S]*?share_pct\s*=\s*([0-9]+(?:\.[0-9]+)?)/i);
        if (!mm) {
          return { ok: false, note: { en: "no summary line found - print exactly: n=… share_pct=…", ru: "итоговой строки нет — напечатай ровно: n=… share_pct=…" } };
        }
        const n = parseInt(mm[1], 10), shareClaimed = parseFloat(mm[2]);
        if (!(n >= 2)) {
          return { ok: false, note: { en: "n must be a whole number >= 2", ru: "n — целое ≥ 2" } };
        }
        const shareAt = (k) => 0.18 / (0.18 + (k - 1) / 55) * 100;
        const share = shareAt(n);
        if (Math.abs(share - shareClaimed) > 0.2) {
          return { ok: false, note: { en: "share_pct must follow the declared model: n " + n + " gives " + share.toFixed(2) + " %", ru: "share_pct обязан следовать заявленной модели: n " + n + " даёт " + share.toFixed(2) + " %" } };
        }
        if (share >= 5) {
          return { ok: false, note: { en: "at n " + n + " the share is " + share.toFixed(2) + " % - still at or above 5 %", ru: "при n " + n + " доля равна " + share.toFixed(2) + " % — всё ещё не ниже 5 %" } };
        }
        if (shareAt(n - 1) < 5) {
          return { ok: false, note: { en: "not minimal: n − 1 = " + (n - 1) + " already reaches " + shareAt(n - 1).toFixed(2) + " %", ru: "не минимально: n − 1 = " + (n - 1) + " уже даёт " + shareAt(n - 1).toFixed(2) + " %" } };
        }
        return { ok: true, note: { en: "n = " + n + " is the first length below 5 % prefill (" + share.toFixed(2) + " %); n − 1 = " + (n - 1) + " still sits at " + shareAt(n - 1).toFixed(2) + " %", ru: "n = " + n + " — первая длина с долей prefill ниже 5 % (" + share.toFixed(2) + " %); n − 1 = " + (n - 1) + " ещё на " + shareAt(n - 1).toFixed(2) + " %" } };
      },
      reference: `# Solve the inequality directly:
#   0.18 / (0.18 + (n-1)/55) < 0.05
#   0.18 < 0.009 + (n-1)/1100  ->  n - 1 > 188.1  ->  n >= 190
n = 190
wall = 0.18 + (n - 1) / 55
share = 0.18 / wall * 100
print(f"n={n} share_pct={share:.2f}")
# n = 190: share 4.98 % (first below 5 %); n = 189: 5.00 % - still at the line.
# A grid walk finds the same boundary; the page also proves n-1 fails.`,
    },
    posttest: [
      {
        id: "p1",
        q: { en: "Nominal wall time for 256 tokens at TTFT 180 ms and 55 tok/s is\u2026", ru: "\u041d\u043e\u043c\u0438\u043d\u0430\u043b\u044c\u043d\u043e\u0435 \u0432\u0440\u0435\u043c\u044f \u043e\u0442\u0432\u0435\u0442\u0430 \u0438\u0437 256 \u0442\u043e\u043a\u0435\u043d\u043e\u0432 \u043f\u0440\u0438 TTFT 180\u00a0\u043c\u0441 \u0438 55\u00a0\u0442\u043e\u043a/\u0441 \u2014 \u044d\u0442\u043e\u2026" },
        options: [{ en: "256 / 55", ru: "256 / 55" }, { en: "0.18 + 255 / 55", ru: "0.18 + 255 / 55" }, { en: "0.18 + 256 / 55", ru: "0.18 + 256 / 55" }],
        answer: 1,
        explain: { en: "The first token arrives inside TTFT; only the remaining 255 pay the decode cadence.", ru: "\u041f\u0435\u0440\u0432\u044b\u0439 \u0442\u043e\u043a\u0435\u043d \u043f\u0440\u0438\u0445\u043e\u0434\u0438\u0442 \u0432\u043d\u0443\u0442\u0440\u0438 TTFT; \u043e\u0441\u0442\u0430\u043b\u044c\u043d\u044b\u0435 255 \u043f\u043b\u0430\u0442\u044f\u0442 \u043a\u0430\u0434\u0435\u043d\u0441 decode." },
      },
      {
        id: "p2",
        q: { en: "What has already happened by the time the first token arrives?", ru: "\u0427\u0442\u043e \u0443\u0436\u0435 \u043f\u0440\u043e\u0438\u0437\u043e\u0448\u043b\u043e \u043a\u00a0\u043c\u043e\u043c\u0435\u043d\u0442\u0443 \u043f\u0440\u0438\u0445\u043e\u0434\u0430 \u043f\u0435\u0440\u0432\u043e\u0433\u043e \u0442\u043e\u043a\u0435\u043d\u0430?" },
        options: [{ en: "prefill of the prompt + one decode step", ru: "prefill \u043f\u0440\u043e\u043c\u043f\u0442\u0430 + \u043e\u0434\u0438\u043d decode-\u0448\u0430\u0433" }, { en: "the whole generation", ru: "\u0432\u0441\u044f \u0433\u0435\u043d\u0435\u0440\u0430\u0446\u0438\u044f" }, { en: "decode of the whole prompt", ru: "decode всего промпта" }],
        answer: 0,
        explain: { en: "TTFT = prefill + a single step; everything after that is decode cadence.", ru: "TTFT = prefill + \u043e\u0434\u0438\u043d \u0448\u0430\u0433; \u0432\u0441\u0451 \u0434\u0430\u043b\u044c\u043d\u0435\u0439\u0448\u0435\u0435 \u2014 \u043a\u0430\u0434\u0435\u043d\u0441 decode." },
      },
      {
        id: "p3",
        q: { en: "A log shows the first chunk at 0.30 s and the 11th at 2.30 s. The measured decode rate is\u2026", ru: "\u041b\u043e\u0433: \u043f\u0435\u0440\u0432\u044b\u0439 \u0447\u0430\u043d\u043a \u043d\u0430 0.30\u00a0\u0441, 11-\u0439 \u043d\u0430 2.30\u00a0\u0441. \u0418\u0437\u043c\u0435\u0440\u0435\u043d\u043d\u0430\u044f \u0441\u043a\u043e\u0440\u043e\u0441\u0442\u044c decode \u2014 \u044d\u0442\u043e\u2026" },
        options: [{ en: "11 / 2.30", ru: "11 / 2.30" }, { en: "(11\u22121) / (2.30\u22120.30)", ru: "(11\u22121) / (2.30\u22120.30)" }, { en: "10 / 2.30", ru: "10 / 2.30" }],
        answer: 1,
        explain: { en: "Client-observed rate counts gaps BETWEEN chunks: 10 gaps over 2.0 s = 5 tok/s. TTFT is not decode time.", ru: "\u041a\u043b\u0438\u0435\u043d\u0442\u0441\u043a\u0430\u044f \u0441\u043a\u043e\u0440\u043e\u0441\u0442\u044c \u0441\u0447\u0438\u0442\u0430\u0435\u0442 \u043f\u0440\u043e\u043c\u0435\u0436\u0443\u0442\u043a\u0438 \u041c\u0415\u0416\u0414\u0423 \u0447\u0430\u043d\u043a\u0430\u043c\u0438: 10 \u043f\u0440\u043e\u043c\u0435\u0436\u0443\u0442\u043a\u043e\u0432 \u0437\u0430 2.0\u00a0\u0441 = 5\u00a0\u0442\u043e\u043a/\u0441. TTFT \u2014 \u043d\u0435 \u0432\u0440\u0435\u043c\u044f decode." },
      },
    ],
    reward: {
      caption: { en: "One request walked end to end: prefill, decode, and the streaming timeline.", ru: "\u041e\u0434\u0438\u043d \u0437\u0430\u043f\u0440\u043e\u0441 \u043f\u0440\u043e\u0448\u0451\u043b \u043e\u0442 \u043d\u0430\u0447\u0430\u043b\u0430 \u0434\u043e \u043a\u043e\u043d\u0446\u0430: prefill, decode \u0438 \u0441\u0442\u0440\u0438\u043c\u0438\u043d\u0433\u043e\u0432\u0430\u044f \u0448\u043a\u0430\u043b\u0430." },
    },
    footer: {
      en: "Nominal arithmetic on declared constants plus a synthetic arrival log — not an HTTP measurement, and no server is started here. The recorded vLLM greeting stream and launch settings live in the Topic 04 evidence run (seminars/runs/2026-10-02-topic04-serving); this lab does not execute it.",
      ru: "Номинальная арифметика на заявленных константах плюс синтетический лог прихода токенов — не HTTP-измерение, и сервер здесь не запускается. Записанный vLLM-стрим с приветствием и настройки запуска живут в evidence-прогоне Темы 04 (seminars/runs/2026-10-02-topic04-serving); эта лаба его не исполняет.",
    },
  };
})();
