/* Lab 13 — LLMOps observability: the on-call journal drill.
   Content module for the generic lab page (window.LABS_CONTENT['13']).
   Sources: the Topic 13 lecture numbers (SLO 99 %, budget 1 %, burn 8.3x,
   the 21:00 breach trace), the lab 08 burst drill (24@4+4 -> 8+16), and the
   lab 09 hash-chain canonical form (runtime/gateway/app.py). The on-call
   stream and the journal fixture are a DECLARED teaching model; the live
   layer-2 journal is the student's own ground truth when connected. */
(function () {
  "use strict";
  window.LABS_CONTENT = window.LABS_CONTENT || {};

  LABS_CONTENT["13"] = {
    budget: 60,
    title: {
      en: "LLMOps observability: the on-call journal",
      ru: "LLMOps-наблюдаемость: журнал дежурного",
    },
    sub: {
      en: "Verify the chain, read the golden signals, burn the budget knowingly — page fast and severe, ticket slow and mild, and never quote a latency without its percentile and window.",
      ru: "Проверь цепочку, прочти золотые сигналы, потрать бюджет осознанно — пейдж за быстрое и тяжёлое, тикет за медленное и мягкое, и никогда не цитируй латентность без перцентиля и окна.",
    },
    intro: {
      en: `<p>The Topic 13 lecture made one promise actionable: a latency statement without a percentile and a window is not a number but a mood. This lab drills the on-call half of that promise on a <strong>declared teaching journal</strong> modeled on the real layer-2 gateway journal: same fields (<code>{seq, ts, kind, payload, prev, hash}</code>), same hash chain your lab 09 code already walks.</p>
<p>The declared service promise: <strong>SLO 99&nbsp;%</strong> — in any window, at most 1&nbsp;% of minutes may breach <em>p95 TTFT ≤ 2 s</em>. The error budget is the other 1&nbsp;%. The on-call policy is the lecture's alert table: <strong>burn ≥ 8.3&times; over a 10-minute window pages</strong>; otherwise <strong>burn ≥ 3&times; over a 60-minute window opens a ticket</strong>; edges are inclusive, and after a page the slow lane is suppressed for 60 minutes (one page, not seven). Everything else — the trace, the incident, the tampered entry — is declared arithmetic you can check by hand.</p>`,
      ru: `<p>Лекция Темы 13 сделала одно обещание действенным: заявление о латентности без перцентиля и окна — не число, а настроение. Эта лаба тренирует дежурную половину обещания на <strong>декларированном учебном журнале</strong>, смоделированном по настоящему журналу шлюза слой-2: те же поля (<code>{seq, ts, kind, payload, prev, hash}</code>), та же хэш-цепочка, которую ваш код лабы 09 уже проходит.</p>
<p>Декларированное обещание сервиса: <strong>SLO 99&nbsp;%</strong> — в любом окне не более 1&nbsp;% минут может нарушать <em>p95 TTFT ≤ 2 с</em>. Бюджет ошибки — остальные 1&nbsp;%. Политика дежурного — таблица алертов лекции: <strong>burn ≥ 8.3&times; на 10-минутном окне — пейдж</strong>; иначе <strong>burn ≥ 3&times; на 60-минутном окне — тикет</strong>; края включены, а после пейджа медленная дорожка подавлена на 60 минут (один пейдж, а не семь). Всё остальное — трейс, инцидент, правленая запись — декларированная арифметика, проверяемая руками.</p>`,
    },
    heroTag: { en: "journal, burn rate, page vs ticket", ru: "журнал, burn rate, пейдж против тикета" },
    glossary: [
      [{ en: "journal entry", ru: "запись журнала" }, { en: "one sealed event: {seq, ts, kind, payload, prev, hash}; the only source a dashboard is allowed to read.", ru: "одно запечатанное событие: {seq, ts, kind, payload, prev, hash}; единственный источник, который дашборду можно читать." }],
      [{ en: "SLI", ru: "SLI" }, { en: "the measured indicator — the number the journal actually records; the percentile and window are part of the number.", ru: "измеряемый показатель — число, которое журнал реально фиксирует; перцентиль и окно — часть числа." }],
      [{ en: "SLO", ru: "SLO" }, { en: "the promise over an SLI: p95 TTFT ≤ 2 s per 5-minute window; declared before incidents, not during them.", ru: "обещание поверх SLI: p95 TTFT ≤ 2 с на 5-минутное окно; декларируется до инцидентов, а не во время." }],
      [{ en: "error budget", ru: "бюджет ошибки" }, { en: "1 − SLO: the share of a window the promise may be missed; at SLO 99 % it is 1 % of minutes.", ru: "1 − SLO: доля окна, за которую обещание можно нарушить; при SLO 99 % это 1 % минут." }],
      [{ en: "burn rate", ru: "burn rate" }, { en: "how fast the budget is spent: (bad minutes / window) / budget; 1× means the month lasts exactly a month.", ru: "скорость траты бюджета: (плохие минуты / окно) / бюджет; 1× означает, что месяца хватает ровно на месяц." }],
      [{ en: "golden signals", ru: "золотые сигналы" }, { en: "latency, traffic, errors, saturation — four per-request views computed from one journal.", ru: "латентность, трафик, ошибки, насыщение — четыре взгляда на запросы из одного журнала." }],
      [{ en: "page vs ticket", ru: "пейдж против тикета" }, { en: "page = wake a human now (fast + severe); ticket = readable in the morning (slow + mild).", ru: "пейдж = разбуди человека сейчас (быстро + тяжело); тикет = прочитают утром (медленно + мягко)." }],
      [{ en: "alert fatigue", ru: "усталость от алертов" }, { en: "too many pages train the on-call to swipe them; every alert must name the SLO, the window and the lever.", ru: "слишком частые пейджи приучают дежурного их смахивать; каждый алерт обязан называть SLO, окно и рычаг." }],
      [{ en: "silent failure", ru: "тихий отказ" }, { en: "the opposite loss: the mean-latency alert that stayed green through the whole breach.", ru: "противоположная потеря: алерт по средней, который был зелёным весь breach." }],
      [{ en: "dedup window", ru: "окно дедупликации" }, { en: "after a page, the slow lane is suppressed for 60 minutes — one page, not a row of echoes.", ru: "после пейджа медленная дорожка подавлена на 60 минут — один пейдж, а не ряд эхо-тикетов." }],
    ],
    figures: [
      {
        id: "lab13-chain",
        title: { en: "The journal is a hash chain: every entry seals the previous one", ru: "Журнал — хэш-цепочка: каждая запись запечатывает предыдущую" },
        w: 760, h: 420,
        svg: `<svg viewBox="0 0 760 420" xmlns="http://www.w3.org/2000/svg">
  <g id="g-head">
    <text x="70" y="60" font-size="13" fill="var(--lab-muted)" class="mono" data-en="seq | ts | kind | payload" data-ru="seq | ts | kind | payload">seq | ts | kind | payload</text>
    <text x="560" y="60" font-size="13" fill="var(--lab-muted)" class="mono" data-en="prev -&gt; hash" data-ru="prev -&gt; hash">prev -&gt; hash</text>
    <line x1="55" y1="72" x2="705" y2="72" stroke="var(--lab-muted)" stroke-width="1"/>
  </g>
  <g id="g-chain">
    <rect x="70" y="96" width="440" height="52" rx="9" fill="var(--lab-accent)" opacity="0.12"/>
    <text x="86" y="118" font-size="14" fill="var(--lab-ink)" class="mono">#0 experiment ttft 810 ms</text>
    <text x="86" y="138" font-size="12" fill="var(--lab-muted)" class="mono">prev 000...0 -&gt; hash 5afd7406...</text>
    <rect x="70" y="168" width="440" height="52" rx="9" fill="var(--lab-accent)" opacity="0.12"/>
    <text x="86" y="190" font-size="14" fill="var(--lab-ink)" class="mono">#1 experiment ttft 790 ms</text>
    <text x="86" y="210" font-size="12" fill="var(--lab-muted)" class="mono">prev 5afd... -&gt; hash 88e1c04b...</text>
    <rect x="70" y="240" width="440" height="52" rx="9" fill="var(--lab-accent)" opacity="0.12"/>
    <text x="86" y="262" font-size="14" fill="var(--lab-ink)" class="mono">#2 burst admitted 8 / rejected 16</text>
    <text x="86" y="282" font-size="12" fill="var(--lab-muted)" class="mono">prev 88e1... -&gt; hash ...</text>
    <text x="530" y="130" font-size="15" fill="var(--lab-muted)" class="mono" data-en="seals" data-ru="запечатывает">seals</text>
    <text x="530" y="202" font-size="15" fill="var(--lab-muted)" class="mono" data-en="seals" data-ru="запечатывает">seals</text>
    <text x="530" y="274" font-size="15" fill="var(--lab-muted)" class="mono" data-en="seals" data-ru="запечатывает">seals</text>
  </g>
  <g id="g-tamper">
    <rect x="70" y="316" width="635" height="72" rx="9" fill="var(--lab-bad)" opacity="0.14"/>
    <text x="86" y="344" font-size="14" fill="var(--lab-bad)" data-en="Edit one payload byte without re-hashing:" data-ru="Правь один байт payload без пересчёта хэша:">Edit one payload byte without re-hashing:</text>
    <text x="86" y="368" font-size="14" fill="var(--lab-ink)" class="mono" data-en="verify_chain() -&gt; (False, broken_at=N)" data-ru="verify_chain() -&gt; (False, broken_at=N)">verify_chain() -&gt; (False, broken_at=N)</text>
  </g>
</svg>`,
        stages: [
          { cap: { en: "Each journal entry carries the hash of its predecessor — appending seals history.", ru: "Каждая запись журнала несёт хэш предыдущей — добавление запечатывает историю." }, show: ["g-head", "g-chain"] },
          { cap: { en: "A hand-edited payload no longer matches its own hash: verification names the first broken entry.", ru: "Правленный payload не сходится с собственным хэшем: проверка называет первую сломанную запись." }, show: ["g-head", "g-chain", "g-tamper"] },
        ],
      },
      {
        id: "lab13-bands",
        title: { en: "Burn rate zones: ok, ticket, page — the declared policy", ru: "Зоны burn rate: ok, тикет, пейдж — декларированная политика" },
        w: 760, h: 420,
        svg: `<svg viewBox="0 0 760 420" xmlns="http://www.w3.org/2000/svg">
  <g id="g-zones">
    <rect x="90" y="300" width="580" height="70" rx="9" fill="var(--lab-good)" opacity="0.14"/>
    <rect x="90" y="180" width="580" height="110" rx="9" fill="var(--fig-warm)" opacity="0.14"/>
    <rect x="90" y="60" width="580" height="110" rx="9" fill="var(--lab-bad)" opacity="0.16"/>
    <text x="110" y="342" font-size="15" fill="var(--lab-good)" data-en="ok: burn < 3x" data-ru="ok: burn < 3×">ok: burn &lt; 3x</text>
    <text x="110" y="240" font-size="15" fill="var(--fig-warm)" data-en="ticket: slow burn &gt;= 3x (60-min window)" data-ru="тикет: slow burn ≥ 3× (60-мин окно)">ticket: slow burn &gt;= 3x (60-min window)</text>
    <text x="110" y="118" font-size="15" fill="var(--lab-bad)" data-en="page: fast burn &gt;= 8.3x (10-min window)" data-ru="пейдж: fast burn ≥ 8.3× (10-мин окно)">page: fast burn &gt;= 8.3x (10-min window)</text>
    <line x1="90" y1="180" x2="670" y2="180" stroke="var(--fig-warm)" stroke-width="2" stroke-dasharray="5 4"/>
    <line x1="90" y1="300" x2="670" y2="300" stroke="var(--lab-good)" stroke-width="2" stroke-dasharray="5 4"/>
  </g>
  <g id="g-dots">
    <circle cx="560" cy="86" r="9" fill="var(--lab-bad)"/>
    <text x="578" y="92" font-size="14" fill="var(--lab-ink)" class="mono" data-en="15x -&gt; page" data-ru="15× -&gt; пейдж">15x -&gt; page</text>
    <circle cx="430" cy="212" r="9" fill="var(--fig-warm)"/>
    <text x="448" y="218" font-size="14" fill="var(--lab-ink)" class="mono" data-en="4x -&gt; ticket" data-ru="4× -&gt; тикет">4x -&gt; ticket</text>
    <circle cx="300" cy="336" r="9" fill="var(--lab-good)"/>
    <text x="318" y="342" font-size="14" fill="var(--lab-ink)" class="mono" data-en="1.2x -&gt; ok" data-ru="1.2× -&gt; ok">1.2x -&gt; ok</text>
  </g>
  <g id="g-ribbon">
    <rect x="55" y="380" width="650" height="32" rx="8" fill="var(--lab-muted)" opacity="0.12"/>
    <text x="380" y="401" text-anchor="middle" font-size="14" fill="var(--lab-ink)" data-en="edges inclusive: exactly 8.3x pages, exactly 3x tickets" data-ru="края включены: ровно 8.3× пейджит, ровно 3× тикетует">edges inclusive: exactly 8.3x pages, exactly 3x tickets</text>
  </g>
</svg>`,
        stages: [
          { cap: { en: "The declared policy as zones: page on fast+severe, ticket on slow+mild, silence below 3×.", ru: "Декларированная политика зонами: пейдж за быстрое+тяжёлое, тикет за медленное+мягкое, тишина ниже 3×." }, show: ["g-zones"] },
          { cap: { en: "The quiz numbers as dots: 15× pages, 4× tickets, 1.2× is a calm evening.", ru: "Числа квизов точками: 15× пейджит, 4× тикетует, 1.2× — спокойный вечер." }, show: ["g-zones", "g-dots"] },
          { cap: { en: "Inclusive edges come from T12: a parked metric on the line must not toggle the policy.", ru: "Включённые края пришли из T12: метрика, вставшая на линию, не должна переключать политику." }, show: ["g-zones", "g-dots", "g-ribbon"] },
        ],
      },
      {
        id: "lab13-timeline",
        title: { en: "The 24-hour stream: noise, a blip, and the 21:00 breach", ru: "Сутки потока: шум, вспышка и breach в 21:00" },
        w: 760, h: 420,
        svg: `<svg viewBox="0 0 760 420" xmlns="http://www.w3.org/2000/svg">
  <g id="g-axes">
    <line x1="70" y1="330" x2="700" y2="330" stroke="var(--lab-muted)" stroke-width="1.5"/>
    <line x1="70" y1="330" x2="70" y2="70" stroke="var(--lab-muted)" stroke-width="1.5"/>
    <text x="700" y="352" text-anchor="end" font-size="13" fill="var(--lab-muted)" class="mono" data-en="24 h, 10-min buckets" data-ru="24 ч, 10-минутные корзины">24 h, 10-min buckets</text>
    <text x="76" y="64" font-size="13" fill="var(--lab-muted)" data-en="bad minutes in the bucket" data-ru="плохие минуты в корзине">bad minutes in the bucket</text>
  </g>
  <g id="g-noise">
    <rect x="245" y="288" width="18" height="42" fill="var(--fig-warm)" opacity="0.75"/>
    <rect x="266" y="288" width="18" height="42" fill="var(--fig-warm)" opacity="0.75"/>
    <rect x="287" y="288" width="18" height="42" fill="var(--fig-warm)" opacity="0.75"/>
    <rect x="308" y="288" width="18" height="42" fill="var(--fig-warm)" opacity="0.75"/>
    <rect x="329" y="288" width="18" height="42" fill="var(--fig-warm)" opacity="0.75"/>
    <rect x="350" y="288" width="18" height="42" fill="var(--fig-warm)" opacity="0.75"/>
    <rect x="435" y="306" width="18" height="24" fill="var(--fig-warm)" opacity="0.55"/>
    <text x="258" y="278" font-size="13" fill="var(--fig-warm)" data-en="noisy lunch: slow burn 4x -&gt; tickets" data-ru="шумный обед: slow burn 4× -&gt; тикеты">noisy lunch: slow burn 4x -&gt; tickets</text>
    <text x="430" y="296" font-size="13" fill="var(--lab-muted)" data-en="one blip: 7x — below the page line" data-ru="одна вспышка: 7× — ниже линии пейджа">one blip: 7x -&gt; ok</text>
  </g>
  <g id="g-incident">
    <rect x="620" y="130" width="18" height="200" fill="var(--lab-bad)"/>
    <rect x="641" y="80" width="18" height="250" fill="var(--lab-bad)"/>
    <rect x="662" y="150" width="18" height="180" fill="var(--lab-bad)"/>
    <text x="600" y="106" font-size="13" fill="var(--lab-bad)" data-en="21:00 breach: 83x fast burn -&gt; page" data-ru="breach 21:00: fast burn 83× -&gt; пейдж">21:00 breach: 83x fast burn -&gt; page</text>
  </g>
  <g id="g-verdict">
    <rect x="55" y="372" width="650" height="36" rx="8" fill="var(--lab-accent)" opacity="0.14"/>
    <text x="380" y="395" text-anchor="middle" font-size="14" fill="var(--lab-ink)" data-en="declared trace: pages [125, 126, 127], tickets [64..66], 138 ok buckets" data-ru="декларированный трейс: пейджи [125, 126, 127], тикеты [64..66], 138 ok">declared trace: pages [125, 126, 127], tickets [64..66], 138 ok buckets</text>
  </g>
</svg>`,
        stages: [
          { cap: { en: "The day the capstone replays: quiet evening, noisy lunch, one blip, one breach.", ru: "Сутки, которые переигрывает капстоун: тихий вечер, шумный обед, одна вспышка, один breach." }, show: ["g-axes", "g-noise"] },
          { cap: { en: "The breach at 21:00 (deck numbers): 8.3 bad minutes in one bucket — fast burn 83×.", ru: "Breach в 21:00 (числа лекции): 8.3 плохой минуты в одной корзине — fast burn 83×." }, show: ["g-axes", "g-noise", "g-incident"] },
          { cap: { en: "The JournalSim verdict on the declared trace — the capstone's hidden tests pin it.", ru: "Вердикт JournalSim на декларированном трейсе — скрытые тесты капстоуна его пинуют." }, show: ["g-axes", "g-noise", "g-incident", "g-verdict"] },
        ],
      },
    ],

    scenario: null,
    quizzes: [
      {
        id: "q1",
        q: {
          en: "The promise is SLO 99 % for a 30-day month. How many minutes of the month may breach it — the whole error budget, in minutes?",
          ru: "Обещание — SLO 99 % на 30-дневный месяц. Сколько минут месяца могут нарушить его — весь бюджет ошибки, в минутах?",
        },
        answer: 432, tol: 0.5, unit: { en: "minutes", ru: "минут" },
        hint: {
          en: "30 · 24 · 60 minutes in a month; the budget is 1 % of them.",
          ru: "30 · 24 · 60 минут в месяце; бюджет — 1 % от них.",
        },
        followUp: {
          q: { en: "Why is the budget a share of minutes, not a count of incidents?", ru: "Почему бюджет — доля минут, а не счётчик инцидентов?" },
          options: [
            { en: "A breach has a duration: three 100-minute breaches and one 3-second one are not the same cost", ru: "У нарушения есть длительность: три стоминутных breach-а и один на три секунды — разная цена" },
            { en: "Because incidents are always exactly one minute long", ru: "Потому что инциденты всегда ровно минута длиной" },
            { en: "The budget counts requests, not minutes", ru: "Бюджет считает запросы, а не минуты" },
          ],
          answer: 0,
          explain: { en: "The budget is time-shaped because the promise is time-shaped: p95 over a window. Minutes generalize to seconds and hours; incident counts do not compose.", ru: "Бюджет измеряется временем, потому что обещание про время: p95 на окно. Минуты обобщаются в секунды и часы; счётчик инцидентов не составляется." },
        },
      },
      {
        id: "q2",
        q: {
          en: "A 10-minute fast window contains 1.5 breaching minutes. What is the burn rate (SLO 99 %)?",
          ru: "10-минутное fast-окно содержит 1.5 нарушающей минуты. Чему равен burn rate (SLO 99 %)?",
        },
        answer: 15, tol: 0.1, unit: { en: "×", ru: "×" },
        hint: {
          en: "burn = (bad / window) / budget = (1.5 / 10) / 0.01.",
          ru: "burn = (плохие / окно) / бюджет = (1.5 / 10) / 0.01.",
        },
        followUp: {
          q: { en: "15× means the month's budget burns in how long, at this pace?", ru: "15× означает, что месячный бюджет сгорит за какое время на таком темпе?" },
          options: [
            { en: "About two days: 30 days / 15", ru: "Около двух дней: 30 дней / 15" },
            { en: "Exactly half a month", ru: "Ровно полмесяца" },
            { en: "Fifteen hours", ru: "Пятнадцать часов" },
          ],
          answer: 0,
          explain: { en: "Burn rate is a speed: at 15× the budget lasts a fifteenth of the month — about two days. That is why 8.3× already pages: an evening at that pace eats a work-week of allowance.", ru: "Burn rate — скорость: на 15× бюджет живёт пятнадцатую часть месяца — около двух дней. Поэтому уже 8.3× пейджит: вечер на таком темпе съедает рабочую неделю allowance." },
        },
      },
      {
        id: "q3",
        q: {
          en: "A 60-minute slow window contains 5.4 breaching minutes. Burn rate — and what does the declared policy do with it?",
          ru: "60-минутное slow-окно содержит 5.4 нарушающей минуты. Burn rate — и что с ним делает декларированная политика?",
        },
        answer: 9, tol: 0.1, unit: { en: "×", ru: "×" },
        hint: {
          en: "burn = (5.4 / 60) / 0.01 = 9; then read the policy: fast first, then slow.",
          ru: "burn = (5.4 / 60) / 0.01 = 9; дальше читай политику: сперва fast, потом slow.",
        },
        followUp: {
          q: { en: "Burn 9× on the slow lane: why does the policy still not page on this window alone?", ru: "Burn 9× на медленной дорожке: почему политика всё же не пейджит по одному этому окну?" },
          options: [
            { en: "The slow lane only tickets: an hour of mild erosion is readable in the morning, and paging on every slow window is how alert fatigue starts", ru: "Медленная дорожка только тикетует: час мягкой эрозии читается утром, а пейджи на каждое slow-окно — так начинается усталость от алертов" },
            { en: "Because 9 is an even number", ru: "Потому что 9 — чётное число" },
            { en: "The slow lane does not exist in the policy", ru: "Медленной дорожки в политике нет" },
          ],
          answer: 0,
          explain: { en: "The pairing is the resolution of alert fatigue vs silent failure: fast+severe pages, slow+mild tickets. One window never pages on the slow lane; a page needs the fast window's evidence.", ru: "Пара — развязка усталости от алертов и тихого отказа: быстро+тяжело пейджит, медленно+мягко тикетует. Одно окно на медленной дорожке не пейджит; пейджу нужны доказательства fast-окна." },
        },
      },
    ],
    exercises: [
      {
        id: "ex1",
        title: { en: "Exercise 1 · Verify the journal with your own hash walk", ru: "Упражнение 1 · Проверь журнал своим хэш-ходом" },
        brief: {
          en: "The fixture below is a 12-entry journal in the <strong>same canonical form as the real layer-2 gateway</strong> (lab 09): <code>hash = sha256('{seq}|{ts}|{kind}|{payload_sorted}|{prev}')</code> with <code>payload_sorted = json.dumps(payload, sort_keys=True, ensure_ascii=False)</code> and the first entry pointing at 64 zeros. One entry was hand-edited <em>without</em> re-hashing. Implement <code>verify_chain(entries) -> (ok, broken_at)</code>: walk in order; <code>ok</code> is False at the first index where <code>seq != index</code>, the recomputed hash differs, or <code>prev</code> does not point at the previous hash. The tests also freeze a seq-gap and a prev-flip — the two other ways a journal can lie.",
          ru: "Фикстура ниже — журнал из 12 записей в <strong>том же каноническом виде, что и настоящий шлюз слой-2</strong> (лаба 09): <code>hash = sha256('{seq}|{ts}|{kind}|{payload_sorted}|{prev}')</code>, где <code>payload_sorted = json.dumps(payload, sort_keys=True, ensure_ascii=False)</code>, а первая запись указывает на 64 нуля. Одну запись правили вручную, <em>без</em> пересчёта хэша. Реализуй <code>verify_chain(entries) -> (ok, broken_at)</code>: иди по порядку; <code>ok</code> ложен на первом индексе, где <code>seq != index</code>, пересчитанный хэш разошёлся или <code>prev</code> не указывает на предыдущий хэш. Тесты дополнительно замораживают дыру в seq и подмену prev — два других способа, которыми журнал может лгать.",
        },
        starter: `import hashlib, json

# Declared teaching journal (gateway canonical form). One entry is tampered.
ENTRIES = [
    {"seq": 0, "ts": "2026-11-22T21:00:12Z", "kind": "experiment", "payload": {"prompt": "digest", "ttft_ms": 810, "wall_s": 1.44, "out_tokens": 38}, "prev": "0000000000000000000000000000000000000000000000000000000000000000", "hash": "5afd7406d67e2003902b6f3ce7e32d8d6782ae4e3bc1e77fb2188b761eea37ca"},
    {"seq": 1, "ts": "2026-11-22T21:00:41Z", "kind": "experiment", "payload": {"prompt": "digest", "ttft_ms": 790, "wall_s": 1.41, "out_tokens": 38}, "prev": "5afd7406d67e2003902b6f3ce7e32d8d6782ae4e3bc1e77fb2188b761eea37ca", "hash": "b26d745d01a0687a7761bd7c57371e519603f9cf110388b02413bd1c5e3f73fc"},
    {"seq": 2, "ts": "2026-11-22T21:01:05Z", "kind": "experiment", "payload": {"prompt": "digest", "ttft_ms": 805, "wall_s": 1.43, "out_tokens": 38}, "prev": "b26d745d01a0687a7761bd7c57371e519603f9cf110388b02413bd1c5e3f73fc", "hash": "2b7d9b1c1c82c402cd9fb3482858c0375baa813059313bb493b271ae5c49486c"},
    {"seq": 3, "ts": "2026-11-22T21:01:33Z", "kind": "experiment", "payload": {"prompt": "kv", "ttft_ms": 7700, "wall_s": 9.87, "out_tokens": 38}, "prev": "2b7d9b1c1c82c402cd9fb3482858c0375baa813059313bb493b271ae5c49486c", "hash": "b2c062f1963cf90e06411e60d71c64d039a970453cce33db5e67000d8ab8e55e"},
    {"seq": 4, "ts": "2026-11-22T21:02:02Z", "kind": "experiment", "payload": {"prompt": "kv", "ttft_ms": 7250, "wall_s": 9.51, "out_tokens": 38}, "prev": "b2c062f1963cf90e06411e60d71c64d039a970453cce33db5e67000d8ab8e55e", "hash": "fb6363922c9f618638f2d632dfb1807e5ad57c4c4ddd2c82a3b946370333b892"},
    {"seq": 5, "ts": "2026-11-22T21:02:30Z", "kind": "experiment", "payload": {"prompt": "digest", "ttft_ms": 820, "wall_s": 1.46, "out_tokens": 38}, "prev": "fb6363922c9f618638f2d632dfb1807e5ad57c4c4ddd2c82a3b946370333b892", "hash": "728e7f3ebfdbd47f99a51d845749558fb2620d53b5b34411ec81ed833e7a6c42"},
    {"seq": 6, "ts": "2026-11-22T21:03:10Z", "kind": "burst", "payload": {"arrivals": 24, "admitted": 8, "rejected": 16, "queue_slots": 8}, "prev": "728e7f3ebfdbd47f99a51d845749558fb2620d53b5b34411ec81ed833e7a6c42", "hash": "c9e8b01a27e742f655599550de5307e19ca6eddf53612161ac47ffa194c5aa1d"},
    {"seq": 7, "ts": "2026-11-22T21:03:41Z", "kind": "burst", "payload": {"arrivals": 24, "admitted": 8, "rejected": 12, "queue_slots": 8}, "prev": "c9e8b01a27e742f655599550de5307e19ca6eddf53612161ac47ffa194c5aa1d", "hash": "ecb27d9aeacd98fdf623f35fea8c7ac06b0da8e3e4d38c2d3bd8244352a9ce45"},
    {"seq": 8, "ts": "2026-11-22T21:04:12Z", "kind": "experiment", "payload": {"prompt": "digest", "ttft_ms": 830, "wall_s": 1.47, "out_tokens": 38}, "prev": "ecb27d9aeacd98fdf623f35fea8c7ac06b0da8e3e4d38c2d3bd8244352a9ce45", "hash": "3951b8782a8728f513bf6262a32d815b7fdb47a55a4cd8a0bff5639f3f3a3d89"},
    {"seq": 9, "ts": "2026-11-22T21:04:47Z", "kind": "experiment", "payload": {"prompt": "digest", "ttft_ms": 800, "wall_s": 1.42, "out_tokens": 38}, "prev": "3951b8782a8728f513bf6262a32d815b7fdb47a55a4cd8a0bff5639f3f3a3d89", "hash": "54d04c24bb82f4569f3ba4ff43b1e6361409e52972c476d036ad3228be5ba741"},
    {"seq": 10, "ts": "2026-11-22T21:05:16Z", "kind": "experiment", "payload": {"prompt": "kv", "ttft_ms": 7150, "wall_s": 9.34, "out_tokens": 38}, "prev": "54d04c24bb82f4569f3ba4ff43b1e6361409e52972c476d036ad3228be5ba741", "hash": "af9d7c830e501980af6921a3326cb776baefd53f16b39b9d48a80f9214f45ab6"},
    {"seq": 11, "ts": "2026-11-22T21:05:48Z", "kind": "experiment", "payload": {"prompt": "kv", "ttft_ms": 7600, "wall_s": 9.71, "out_tokens": 38}, "prev": "af9d7c830e501980af6921a3326cb776baefd53f16b39b9d48a80f9214f45ab6", "hash": "9f6f8fa0915d51d7ee5e46e93843395ba2e6a0ca0663a1f10cf2ebd2422acbe5"}
]

def verify_chain(entries):
    """Walk a hash-chained journal: return (ok, broken_at).
    broken_at is the list index of the first broken entry, None if ok."""
    # TODO: prev starts as 64 zeros; at each step recompute
    # hash = sha256(f"{seq}|{ts}|{kind}|{payload_sorted}|{prev}")
    # and compare seq, hash and prev. Return (True, None) or (False, index).
`,
        tests: [
          { name: "clean chain verifies; tamper breaks at 7; gap and prev-flip", hidden: true, code: `import hashlib, json

ENTRIES = [
    {"seq": 0, "ts": "2026-11-22T21:00:12Z", "kind": "experiment", "payload": {"prompt": "digest", "ttft_ms": 810, "wall_s": 1.44, "out_tokens": 38}, "prev": "0000000000000000000000000000000000000000000000000000000000000000", "hash": "5afd7406d67e2003902b6f3ce7e32d8d6782ae4e3bc1e77fb2188b761eea37ca"},
    {"seq": 1, "ts": "2026-11-22T21:00:41Z", "kind": "experiment", "payload": {"prompt": "digest", "ttft_ms": 790, "wall_s": 1.41, "out_tokens": 38}, "prev": "5afd7406d67e2003902b6f3ce7e32d8d6782ae4e3bc1e77fb2188b761eea37ca", "hash": "b26d745d01a0687a7761bd7c57371e519603f9cf110388b02413bd1c5e3f73fc"},
    {"seq": 2, "ts": "2026-11-22T21:01:05Z", "kind": "experiment", "payload": {"prompt": "digest", "ttft_ms": 805, "wall_s": 1.43, "out_tokens": 38}, "prev": "b26d745d01a0687a7761bd7c57371e519603f9cf110388b02413bd1c5e3f73fc", "hash": "2b7d9b1c1c82c402cd9fb3482858c0375baa813059313bb493b271ae5c49486c"},
    {"seq": 3, "ts": "2026-11-22T21:01:33Z", "kind": "experiment", "payload": {"prompt": "kv", "ttft_ms": 7700, "wall_s": 9.87, "out_tokens": 38}, "prev": "2b7d9b1c1c82c402cd9fb3482858c0375baa813059313bb493b271ae5c49486c", "hash": "b2c062f1963cf90e06411e60d71c64d039a970453cce33db5e67000d8ab8e55e"},
    {"seq": 4, "ts": "2026-11-22T21:02:02Z", "kind": "experiment", "payload": {"prompt": "kv", "ttft_ms": 7250, "wall_s": 9.51, "out_tokens": 38}, "prev": "b2c062f1963cf90e06411e60d71c64d039a970453cce33db5e67000d8ab8e55e", "hash": "fb6363922c9f618638f2d632dfb1807e5ad57c4c4ddd2c82a3b946370333b892"},
    {"seq": 5, "ts": "2026-11-22T21:02:30Z", "kind": "experiment", "payload": {"prompt": "digest", "ttft_ms": 820, "wall_s": 1.46, "out_tokens": 38}, "prev": "fb6363922c9f618638f2d632dfb1807e5ad57c4c4ddd2c82a3b946370333b892", "hash": "728e7f3ebfdbd47f99a51d845749558fb2620d53b5b34411ec81ed833e7a6c42"},
    {"seq": 6, "ts": "2026-11-22T21:03:10Z", "kind": "burst", "payload": {"arrivals": 24, "admitted": 8, "rejected": 16, "queue_slots": 8}, "prev": "728e7f3ebfdbd47f99a51d845749558fb2620d53b5b34411ec81ed833e7a6c42", "hash": "c9e8b01a27e742f655599550de5307e19ca6eddf53612161ac47ffa194c5aa1d"},
    {"seq": 7, "ts": "2026-11-22T21:03:41Z", "kind": "burst", "payload": {"arrivals": 24, "admitted": 8, "rejected": 12, "queue_slots": 8}, "prev": "c9e8b01a27e742f655599550de5307e19ca6eddf53612161ac47ffa194c5aa1d", "hash": "ecb27d9aeacd98fdf623f35fea8c7ac06b0da8e3e4d38c2d3bd8244352a9ce45"},
    {"seq": 8, "ts": "2026-11-22T21:04:12Z", "kind": "experiment", "payload": {"prompt": "digest", "ttft_ms": 830, "wall_s": 1.47, "out_tokens": 38}, "prev": "ecb27d9aeacd98fdf623f35fea8c7ac06b0da8e3e4d38c2d3bd8244352a9ce45", "hash": "3951b8782a8728f513bf6262a32d815b7fdb47a55a4cd8a0bff5639f3f3a3d89"},
    {"seq": 9, "ts": "2026-11-22T21:04:47Z", "kind": "experiment", "payload": {"prompt": "digest", "ttft_ms": 800, "wall_s": 1.42, "out_tokens": 38}, "prev": "3951b8782a8728f513bf6262a32d815b7fdb47a55a4cd8a0bff5639f3f3a3d89", "hash": "54d04c24bb82f4569f3ba4ff43b1e6361409e52972c476d036ad3228be5ba741"},
    {"seq": 10, "ts": "2026-11-22T21:05:16Z", "kind": "experiment", "payload": {"prompt": "kv", "ttft_ms": 7150, "wall_s": 9.34, "out_tokens": 38}, "prev": "54d04c24bb82f4569f3ba4ff43b1e6361409e52972c476d036ad3228be5ba741", "hash": "af9d7c830e501980af6921a3326cb776baefd53f16b39b9d48a80f9214f45ab6"},
    {"seq": 11, "ts": "2026-11-22T21:05:48Z", "kind": "experiment", "payload": {"prompt": "kv", "ttft_ms": 7600, "wall_s": 9.71, "out_tokens": 38}, "prev": "af9d7c830e501980af6921a3326cb776baefd53f16b39b9d48a80f9214f45ab6", "hash": "9f6f8fa0915d51d7ee5e46e93843395ba2e6a0ca0663a1f10cf2ebd2422acbe5"}
]

def _mk(rows):
    prev = "0" * 64
    out = []
    for i, (ts, kind, payload) in enumerate(rows):
        c = json.dumps(payload, sort_keys=True, ensure_ascii=False)
        hsh = hashlib.sha256(f"{i}|{ts}|{kind}|{c}|{prev}".encode()).hexdigest()
        out.append({"seq": i, "ts": ts, "kind": kind, "payload": payload, "prev": prev, "hash": hsh})
        prev = hsh
    return out

rows = [("2026-01-01T00:0%d:00Z" % i, "experiment", {"ttft_ms": 800 + i, "out_tokens": 38}) for i in range(5)]
clean = _mk(rows)
assert verify_chain(clean) == (True, None), "clean chain must verify"

assert verify_chain(ENTRIES) == (False, 7), "the tampered fixture breaks at index 7"

gapped = [dict(e) for e in clean]
gapped.pop(2)
assert verify_chain(gapped) == (False, 2), "a removed entry is a seq gap at its index"

flipped = [dict(e) for e in clean]
flipped[3]["prev"] = "f" * 64
assert verify_chain(flipped) == (False, 3), "a prev-flip breaks at the flipped entry"
` }
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
    return (True, None)
`,
        hints: [
          { en: "The canonical string is exactly the lab 09 form — reuse your own lab 9 solution; the fixture even reuses its fixture shape.", ru: "Каноническая строка — ровно форма лабы 09 — переиспользуй своё решение лабы 9; фикстура даже повторяет её форму." },
          { en: "Check order matters: seq first, then hash, then prev — the tests pin the first broken index.", ru: "Порядок проверок важен: сперва seq, затем хэш, затем prev — тесты пинуют первый сломанный индекс." },
        ],
        numpy: false, timeoutMs: 4000,
      },
      {
        id: "ex2",
        title: { en: "Exercise 2 · Golden signals: p95 and error rate from one journal", ru: "Упражнение 2 · Золотые сигналы: p95 и доля ошибок из одного журнала" },
        brief: {
          en: "Implement <code>golden_signals(entries) -> (p95_ttft_ms, err_rate)</code>. Take <code>payload.ttft_ms</code> from every <code>experiment</code> entry and the <code>payload.admitted</code>/<code>rejected</code> counts from every <code>burst</code> entry. p95 is <strong>nearest-rank</strong>: sort, take element <code>ceil(0.95 · n) − 1</code> — no interpolation. <code>err_rate = rejected / (admitted + rejected)</code> over all burst entries. On the fixture the answers are already known from the lecture trace: ten experiment timings with two burst-second outliers, two burst drills of 24 arrivals each meeting an 8-seat envelope. Careful: the tampered entry understates one drill's rejections, so the journal's own numbers give 28 of 44 — the golden signal inherits the lie until the chain is verified.",
          ru: "Реализуй <code>golden_signals(entries) -> (p95_ttft_ms, err_rate)</code>. Возьми <code>payload.ttft_ms</code> из каждой записи <code>experiment</code> и счётчики <code>payload.admitted</code>/<code>rejected</code> из каждой записи <code>burst</code>. p95 — <strong>nearest-rank</strong>: отсортируй, возьми элемент <code>ceil(0.95 · n) − 1</code> — без интерполяции. <code>err_rate = rejected / (admitted + rejected)</code> по всем burst-записям. На фикстуре ответы уже известны из трейса лекции: десять экспериментальных времён с двумя выбросами бурст-секунды, два burst-дрилла по 24 пришельца против конверта на 8 мест. Внимание: правленая запись занижает отказы одного дрилла, поэтому числа журнала дают 28 из 44 — золотой сигнал наследует ложь, пока цепочка не проверена.",
        },
        starter: `import math

# The same declared journal fixture as Exercise 1.
ENTRIES = [
    {"seq": 0, "ts": "2026-11-22T21:00:12Z", "kind": "experiment", "payload": {"prompt": "digest", "ttft_ms": 810, "wall_s": 1.44, "out_tokens": 38}, "prev": "0000000000000000000000000000000000000000000000000000000000000000", "hash": "5afd7406d67e2003902b6f3ce7e32d8d6782ae4e3bc1e77fb2188b761eea37ca"},
    {"seq": 1, "ts": "2026-11-22T21:00:41Z", "kind": "experiment", "payload": {"prompt": "digest", "ttft_ms": 790, "wall_s": 1.41, "out_tokens": 38}, "prev": "5afd7406d67e2003902b6f3ce7e32d8d6782ae4e3bc1e77fb2188b761eea37ca", "hash": "b26d745d01a0687a7761bd7c57371e519603f9cf110388b02413bd1c5e3f73fc"},
    {"seq": 2, "ts": "2026-11-22T21:01:05Z", "kind": "experiment", "payload": {"prompt": "digest", "ttft_ms": 805, "wall_s": 1.43, "out_tokens": 38}, "prev": "b26d745d01a0687a7761bd7c57371e519603f9cf110388b02413bd1c5e3f73fc", "hash": "2b7d9b1c1c82c402cd9fb3482858c0375baa813059313bb493b271ae5c49486c"},
    {"seq": 3, "ts": "2026-11-22T21:01:33Z", "kind": "experiment", "payload": {"prompt": "kv", "ttft_ms": 7700, "wall_s": 9.87, "out_tokens": 38}, "prev": "2b7d9b1c1c82c402cd9fb3482858c0375baa813059313bb493b271ae5c49486c", "hash": "b2c062f1963cf90e06411e60d71c64d039a970453cce33db5e67000d8ab8e55e"},
    {"seq": 4, "ts": "2026-11-22T21:02:02Z", "kind": "experiment", "payload": {"prompt": "kv", "ttft_ms": 7250, "wall_s": 9.51, "out_tokens": 38}, "prev": "b2c062f1963cf90e06411e60d71c64d039a970453cce33db5e67000d8ab8e55e", "hash": "fb6363922c9f618638f2d632dfb1807e5ad57c4c4ddd2c82a3b946370333b892"},
    {"seq": 5, "ts": "2026-11-22T21:02:30Z", "kind": "experiment", "payload": {"prompt": "digest", "ttft_ms": 820, "wall_s": 1.46, "out_tokens": 38}, "prev": "fb6363922c9f618638f2d632dfb1807e5ad57c4c4ddd2c82a3b946370333b892", "hash": "728e7f3ebfdbd47f99a51d845749558fb2620d53b5b34411ec81ed833e7a6c42"},
    {"seq": 6, "ts": "2026-11-22T21:03:10Z", "kind": "burst", "payload": {"arrivals": 24, "admitted": 8, "rejected": 16, "queue_slots": 8}, "prev": "728e7f3ebfdbd47f99a51d845749558fb2620d53b5b34411ec81ed833e7a6c42", "hash": "c9e8b01a27e742f655599550de5307e19ca6eddf53612161ac47ffa194c5aa1d"},
    {"seq": 7, "ts": "2026-11-22T21:03:41Z", "kind": "burst", "payload": {"arrivals": 24, "admitted": 8, "rejected": 12, "queue_slots": 8}, "prev": "c9e8b01a27e742f655599550de5307e19ca6eddf53612161ac47ffa194c5aa1d", "hash": "ecb27d9aeacd98fdf623f35fea8c7ac06b0da8e3e4d38c2d3bd8244352a9ce45"},
    {"seq": 8, "ts": "2026-11-22T21:04:12Z", "kind": "experiment", "payload": {"prompt": "digest", "ttft_ms": 830, "wall_s": 1.47, "out_tokens": 38}, "prev": "ecb27d9aeacd98fdf623f35fea8c7ac06b0da8e3e4d38c2d3bd8244352a9ce45", "hash": "3951b8782a8728f513bf6262a32d815b7fdb47a55a4cd8a0bff5639f3f3a3d89"},
    {"seq": 9, "ts": "2026-11-22T21:04:47Z", "kind": "experiment", "payload": {"prompt": "digest", "ttft_ms": 800, "wall_s": 1.42, "out_tokens": 38}, "prev": "3951b8782a8728f513bf6262a32d815b7fdb47a55a4cd8a0bff5639f3f3a3d89", "hash": "54d04c24bb82f4569f3ba4ff43b1e6361409e52972c476d036ad3228be5ba741"},
    {"seq": 10, "ts": "2026-11-22T21:05:16Z", "kind": "experiment", "payload": {"prompt": "kv", "ttft_ms": 7150, "wall_s": 9.34, "out_tokens": 38}, "prev": "54d04c24bb82f4569f3ba4ff43b1e6361409e52972c476d036ad3228be5ba741", "hash": "af9d7c830e501980af6921a3326cb776baefd53f16b39b9d48a80f9214f45ab6"},
    {"seq": 11, "ts": "2026-11-22T21:05:48Z", "kind": "experiment", "payload": {"prompt": "kv", "ttft_ms": 7600, "wall_s": 9.71, "out_tokens": 38}, "prev": "af9d7c830e501980af6921a3326cb776baefd53f16b39b9d48a80f9214f45ab6", "hash": "9f6f8fa0915d51d7ee5e46e93843395ba2e6a0ca0663a1f10cf2ebd2422acbe5"}
]

def golden_signals(entries):
    """Return (p95_ttft_ms, err_rate) for the journal.
    p95: nearest-rank over experiment ttft_ms; err_rate: rejected/(admitted+rejected)."""
    # TODO: collect ttfts from experiment entries, counts from burst entries.
`,
        tests: [
          { name: "fixture p95/err; nearest-rank mini; diluted burst", hidden: true, code: `import math

ENTRIES = [
    {"seq": 0, "ts": "2026-11-22T21:00:12Z", "kind": "experiment", "payload": {"prompt": "digest", "ttft_ms": 810, "wall_s": 1.44, "out_tokens": 38}, "prev": "0000000000000000000000000000000000000000000000000000000000000000", "hash": "5afd7406d67e2003902b6f3ce7e32d8d6782ae4e3bc1e77fb2188b761eea37ca"},
    {"seq": 1, "ts": "2026-11-22T21:00:41Z", "kind": "experiment", "payload": {"prompt": "digest", "ttft_ms": 790, "wall_s": 1.41, "out_tokens": 38}, "prev": "5afd7406d67e2003902b6f3ce7e32d8d6782ae4e3bc1e77fb2188b761eea37ca", "hash": "b26d745d01a0687a7761bd7c57371e519603f9cf110388b02413bd1c5e3f73fc"},
    {"seq": 2, "ts": "2026-11-22T21:01:05Z", "kind": "experiment", "payload": {"prompt": "digest", "ttft_ms": 805, "wall_s": 1.43, "out_tokens": 38}, "prev": "b26d745d01a0687a7761bd7c57371e519603f9cf110388b02413bd1c5e3f73fc", "hash": "2b7d9b1c1c82c402cd9fb3482858c0375baa813059313bb493b271ae5c49486c"},
    {"seq": 3, "ts": "2026-11-22T21:01:33Z", "kind": "experiment", "payload": {"prompt": "kv", "ttft_ms": 7700, "wall_s": 9.87, "out_tokens": 38}, "prev": "2b7d9b1c1c82c402cd9fb3482858c0375baa813059313bb493b271ae5c49486c", "hash": "b2c062f1963cf90e06411e60d71c64d039a970453cce33db5e67000d8ab8e55e"},
    {"seq": 4, "ts": "2026-11-22T21:02:02Z", "kind": "experiment", "payload": {"prompt": "kv", "ttft_ms": 7250, "wall_s": 9.51, "out_tokens": 38}, "prev": "b2c062f1963cf90e06411e60d71c64d039a970453cce33db5e67000d8ab8e55e", "hash": "fb6363922c9f618638f2d632dfb1807e5ad57c4c4ddd2c82a3b946370333b892"},
    {"seq": 5, "ts": "2026-11-22T21:02:30Z", "kind": "experiment", "payload": {"prompt": "digest", "ttft_ms": 820, "wall_s": 1.46, "out_tokens": 38}, "prev": "fb6363922c9f618638f2d632dfb1807e5ad57c4c4ddd2c82a3b946370333b892", "hash": "728e7f3ebfdbd47f99a51d845749558fb2620d53b5b34411ec81ed833e7a6c42"},
    {"seq": 6, "ts": "2026-11-22T21:03:10Z", "kind": "burst", "payload": {"arrivals": 24, "admitted": 8, "rejected": 16, "queue_slots": 8}, "prev": "728e7f3ebfdbd47f99a51d845749558fb2620d53b5b34411ec81ed833e7a6c42", "hash": "c9e8b01a27e742f655599550de5307e19ca6eddf53612161ac47ffa194c5aa1d"},
    {"seq": 7, "ts": "2026-11-22T21:03:41Z", "kind": "burst", "payload": {"arrivals": 24, "admitted": 8, "rejected": 12, "queue_slots": 8}, "prev": "c9e8b01a27e742f655599550de5307e19ca6eddf53612161ac47ffa194c5aa1d", "hash": "ecb27d9aeacd98fdf623f35fea8c7ac06b0da8e3e4d38c2d3bd8244352a9ce45"},
    {"seq": 8, "ts": "2026-11-22T21:04:12Z", "kind": "experiment", "payload": {"prompt": "digest", "ttft_ms": 830, "wall_s": 1.47, "out_tokens": 38}, "prev": "ecb27d9aeacd98fdf623f35fea8c7ac06b0da8e3e4d38c2d3bd8244352a9ce45", "hash": "3951b8782a8728f513bf6262a32d815b7fdb47a55a4cd8a0bff5639f3f3a3d89"},
    {"seq": 9, "ts": "2026-11-22T21:04:47Z", "kind": "experiment", "payload": {"prompt": "digest", "ttft_ms": 800, "wall_s": 1.42, "out_tokens": 38}, "prev": "3951b8782a8728f513bf6262a32d815b7fdb47a55a4cd8a0bff5639f3f3a3d89", "hash": "54d04c24bb82f4569f3ba4ff43b1e6361409e52972c476d036ad3228be5ba741"},
    {"seq": 10, "ts": "2026-11-22T21:05:16Z", "kind": "experiment", "payload": {"prompt": "kv", "ttft_ms": 7150, "wall_s": 9.34, "out_tokens": 38}, "prev": "54d04c24bb82f4569f3ba4ff43b1e6361409e52972c476d036ad3228be5ba741", "hash": "af9d7c830e501980af6921a3326cb776baefd53f16b39b9d48a80f9214f45ab6"},
    {"seq": 11, "ts": "2026-11-22T21:05:48Z", "kind": "experiment", "payload": {"prompt": "kv", "ttft_ms": 7600, "wall_s": 9.71, "out_tokens": 38}, "prev": "af9d7c830e501980af6921a3326cb776baefd53f16b39b9d48a80f9214f45ab6", "hash": "9f6f8fa0915d51d7ee5e46e93843395ba2e6a0ca0663a1f10cf2ebd2422acbe5"}
]

p95, err = golden_signals(ENTRIES)
assert abs(p95 - 7700.0) < 1e-9, f"p95 nearest-rank = 7700, got {p95}"
assert abs(err - 28/44) < 1e-3, f"the tampered payload lies: 28 of 44 arrivals rejected, got {err}"

mini = [
    {"seq": 0, "ts": "t", "kind": "experiment", "payload": {"ttft_ms": 100}, "prev": "0", "hash": "h"},
    {"seq": 1, "ts": "t", "kind": "experiment", "payload": {"ttft_ms": 200}, "prev": "0", "hash": "h"},
]
p95m, errm = golden_signals(mini)
assert p95m == 200.0, f"nearest-rank of [100, 200] is 200 (ceil(1.9)=2), not the interpolated 195 — got {p95m}"
assert errm == 0.0, "no burst entries -> err_rate 0.0"

full = list(ENTRIES) + [{"seq": 12, "ts": "t", "kind": "burst", "payload": {"arrivals": 10, "admitted": 10, "rejected": 0, "queue_slots": 8}, "prev": "0", "hash": "h"}]
_, errf = golden_signals(full)
assert abs(errf - 28/54) < 1e-3, "window semantics: total rejected / total arrivals over all bursts = 28/54"
` }
        ],
        solution: `import math

def golden_signals(entries):
    ttfts = sorted(e["payload"]["ttft_ms"] for e in entries if e["kind"] == "experiment")
    idx = math.ceil(0.95 * len(ttfts)) - 1
    p95 = float(ttfts[idx])
    admitted = sum(e["payload"]["admitted"] for e in entries if e["kind"] == "burst")
    rejected = sum(e["payload"]["rejected"] for e in entries if e["kind"] == "burst")
    err_rate = rejected / (admitted + rejected) if (admitted + rejected) else 0.0
    return (p95, err_rate)
`,
        hints: [
          { en: "Nearest-rank is a person counting from the sorted end: ceil(0.95·10) = 10 -> the 10th element.", ru: "Nearest-rank — человек, считающий от конца отсортированного: ceil(0.95·10) = 10 -> десятый элемент." },
          { en: "The burst pair on the fixture is the lab 08 drill: 24 arrivals, 8 admitted, 16 rejected.", ru: "Burst-пара на фикстуре — дрилл лабы 08: 24 пришельца, 8 допущено, 16 отклонено." },
        ],
        numpy: false, timeoutMs: 4000,
      },
      {
        id: "ex3",
        title: { en: "Exercise 3 · burn_rate: a fraction over a fraction, not a percent", ru: "Упражнение 3 · burn_rate: доля поверх доли, а не проценты" },
        brief: {
          en: "Implement <code>burn_rate(bad_min, window_min, slo=0.99)</code>: <code>(bad_min / window_min) / (1 - slo)</code>. The trap is unit confusion — returning <code>bad/window</code> as <em>percent</em> inflates every result by 100: 1.5 bad minutes of 10 is 15 % of the window, and against a 1 % budget the burn is <strong>15</strong>, not 1500 or 0.15. The lecture's own example must fall out of your function: 30 bad minutes of a 360-minute window at SLO 99 % is the burn 8.3× from slide 9.",
          ru: "Реализуй <code>burn_rate(bad_min, window_min, slo=0.99)</code>: <code>(bad_min / window_min) / (1 - slo)</code>. Ловушка — путаница единиц: вернуть <code>bad/window</code> как <em>проценты</em> — значит завысить всё в 100 раз: 1.5 плохой минуты из 10 — это 15 % окна, и против бюджета 1 % burn равен <strong>15</strong>, а не 1500 и не 0.15. Собственный пример лекции должен сходиться из твоей функции: 30 плохих минут из 360-минутного окна при SLO 99 % — тот самый burn 8.3× со слайда 9.",
        },
        starter: `def burn_rate(bad_min, window_min, slo=0.99):
    """Burn rate = fraction of the window breaching / the error budget."""
    # TODO: one line. Fractions in, speed out — no percents anywhere.
`,
        tests: [
          { name: "slide-9 burn; quiz windows; slo parameter; percent trap", hidden: true, code: `assert abs(burn_rate(30, 360) - 8.3333) < 1e-3, "the slide 9 example: 30/360 over a 1% budget"
assert abs(burn_rate(1.5, 10) - 15.0) < 1e-9, "1.5 of 10 minutes against 1% -> 15"
assert abs(burn_rate(5.4, 60) - 9.0) < 1e-9, "quiz q3's slow window"
assert abs(burn_rate(10, 100, slo=0.999) - 100.0) < 1e-6, "a 99.9% promise has a 0.1% budget: 10x tighter"
assert abs(burn_rate(50, 100) - 50.0) < 1e-9, "half the window breaching is burn 50, not 5000 or 0.5"
` }
        ],
        solution: `def burn_rate(bad_min, window_min, slo=0.99):
    return (bad_min / window_min) / (1 - slo)
`,
        hints: [
          { en: "Both inputs are minutes, the budget is a share — the result is dimensionless speed.", ru: "Оба входа — минуты, бюджет — доля; результат — безразмерная скорость." },
          { en: "If your q2 answer passed but q3 fails, check that you never multiply by 100.", ru: "Если q2 прошёл, а q3 падает — проверь, что ты нигде не умножил на 100." },
        ],
        numpy: false, timeoutMs: 3000,
      },
      {
        id: "ex4",
        title: { en: "Exercise 4 · decide: page, ticket, ok — with inclusive edges", ru: "Упражнение 4 · decide: пейдж, тикет, ok — с включёнными краями" },
        brief: {
          en: "Implement <code>decide(fast_burn, slow_burn)</code> under the declared policy: <strong>fast ≥ 8.3 → 'page'</strong>; otherwise <strong>slow ≥ 3 → 'ticket'</strong>; otherwise <strong>'ok'</strong>. The edges are inclusive — the T12 thermostat lesson: a metric parked exactly on the line must not toggle the policy. Order matters: a window pair where both fire is a page (the fast lane speaks for the incident), not a ticket.",
          ru: "Реализуй <code>decide(fast_burn, slow_burn)</code> по декларированной политике: <strong>fast ≥ 8.3 → 'page'</strong>; иначе <strong>slow ≥ 3 → 'ticket'</strong>; иначе <strong>'ok'</strong>. Края включены — урок термостата T12: метрика, вставшая ровно на линию, не должна переключать политику. Порядок важен: пара окон, где горят оба, — пейдж (fast говорит за инцидент), а не тикет.",
        },
        starter: `FAST_TH = 8.3   # 10-minute window, declared in the lecture's alert table
SLOW_TH = 3.0   # 60-minute window

def decide(fast_burn, slow_burn):
    """Return 'page', 'ticket' or 'ok' under the declared policy."""
    # TODO: fast lane first; both edges inclusive.
`,
        tests: [
          { name: "inclusive edges and lane order", hidden: true, code: `assert decide(8.3, 0.0) == "page", "exactly 8.3 on the fast lane pages"
assert decide(8.3, 3.0) == "page", "both lanes burning is a page — fast speaks first"
assert decide(0.0, 3.0) == "ticket", "exactly 3.0 on the slow lane tickets"
assert decide(3.0, 3.0) == "ticket", "fast below the page line: the slow lane decides"
assert decide(2.9, 2.9) == "ok", "just below both lines: a calm evening"
assert decide(9.0, 0.0) == "page" and decide(0.0, 9.0) == "ticket", "no lane mixes into the other"
` }
        ],
        solution: `FAST_TH = 8.3
SLOW_TH = 3.0

def decide(fast_burn, slow_burn):
    if fast_burn >= FAST_TH:
        return "page"
    if slow_burn >= SLOW_TH:
        return "ticket"
    return "ok"
`,
        hints: [
          { en: "Two ifs, no rounding: the tests park metrics exactly on both lines.", ru: "Два if-а, без округлений: тесты ставят метрики ровно на обе линии." },
          { en: "This is the T12 dead band again — inclusive edges are what make it a band, not a knife edge.", ru: "Это снова мёртвая полоса T12 — включённые края и делают её полосой, а не лезвием." },
        ],
        numpy: false, timeoutMs: 3000,
      },
      {
        id: "ex5",
        title: { en: "Capstone · JournalSim: a day of on-call in one function", ru: "Капстоун · JournalSim: сутки дежурства в одной функции" },
        brief: {
          en: "Implement <code>journalsim(bad_minutes, fast_th=8.3, slow_th=3.0)</code>. <code>bad_minutes</code> is a list of 144 ten-minute buckets (24 h) — the declared trace from the figure: a noisy lunch, one blip, and the 21:00 breach. For each bucket <code>t</code>: <strong>fast burn</strong> = <code>burn_rate(bad_minutes[t], 10)</code>; <strong>slow burn</strong> = <code>burn_rate(sum(bad_minutes[t-5..t]), 60)</code>. Fire a page when the fast lane crosses <code>fast_th</code> (a page suppresses tickets for the next 6 buckets — one page, not a row of echoes); otherwise fire a ticket when the slow lane crosses <code>slow_th</code> (also suppressed inside the dedup window). Return a dict: <code>{&quot;pages&quot;: [...], &quot;tickets&quot;: [...], &quot;ok&quot;: count}</code> with bucket indices. The declared trace's verdict is printed on the figure — your function must reproduce it exactly.",
          ru: "Реализуй <code>journalsim(bad_minutes, fast_th=8.3, slow_th=3.0)</code>. <code>bad_minutes</code> — список из 144 десяти минутных корзин (24 ч) — декларированный трейс с фигуры: шумный обед, одна вспышка и breach в 21:00. Для каждой корзины <code>t</code>: <strong>fast burn</strong> = <code>burn_rate(bad_minutes[t], 10)</code>; <strong>slow burn</strong> = <code>burn_rate(sum(bad_minutes[t-5..t]), 60)</code>. Пейдж — когда fast-дорожка пересекает <code>fast_th</code> (пейдж подавляет тикеты на следующие 6 корзин — один пейдж, а не ряд эхо); иначе тикет — когда slow-дорожка пересекает <code>slow_th</code> (тоже подавлен внутри окна дедупликации). Верни словарь: <code>{&quot;pages&quot;: [...], &quot;tickets&quot;: [...], &quot;ok&quot;: count}</code> с индексами корзин. Вердикт декларированного трейса напечатан на фигуре — твоя функция обязана воспроизвести его точно.",
        },
        starter: `# Declared 24 h trace: 10-minute buckets of breaching minutes.
# [0.0]*60            quiet night and morning
# [0.4]*6             noisy lunch (buckets 60-65)
# [0.7]               one blip (bucket 90)
# [1.0, 8.3, 1.0]     the 21:00 breach and its shoulders (buckets 125-127)
# then quiet until midnight
TRACE = [0.0]*60 + [0.4]*6 + [0.0]*24 + [0.7] + [0.0]*34 + [1.0, 8.3, 1.0] + [0.0]*16

def journalsim(bad_minutes, fast_th=8.3, slow_th=3.0):
    """Run the declared on-call policy over a day of 10-minute buckets.
    Returns {"pages": [t...], "tickets": [t...], "ok": int}.
    A page suppresses tickets for the next 6 buckets (dedup window)."""
    # TODO: fast burn from one bucket, slow burn from the last six;
    # fire pages first, suppress tickets inside the dedup window.

assert len(TRACE) == 144, "24 h of ten-minute buckets"
`,
        tests: [
          { name: "declared day; quiet day; raised fast line", hidden: true, code: `TRACE = [0.0]*60 + [0.4]*6 + [0.0]*24 + [0.7] + [0.0]*34 + [1.0, 8.3, 1.0] + [0.0]*16
assert len(TRACE) == 144

r = journalsim(TRACE)
assert r["pages"] == [125, 126, 127], f"the breach pages itself AND both shoulders (1.0 bad min of 10 is already burn 10x) — got {r['pages']}"
assert r["tickets"] == [64, 65, 66], f"the noisy lunch tickets only when the rolling hour carries 2+ bad minutes — got {r['tickets']}"
assert r["ok"] == 138, f"144 - 3 pages - 3 tickets — got {r['ok']}"

quiet = [0.0] * 144
rq = journalsim(quiet)
assert rq == {"pages": [], "tickets": [], "ok": 144}, "a quiet day never fires"

r2 = journalsim(TRACE, fast_th=12.0, slow_th=5.0)
assert r2["pages"] == [126], "raising the fast line to 12 spares the shoulders: only the breach itself pages"
` }
        ],
        solution: `def journalsim(bad_minutes, fast_th=8.3, slow_th=3.0):
    pages, tickets = [], []
    suppress_until = -1
    for t in range(len(bad_minutes)):
        fast_b = (bad_minutes[t] / 10.0) / 0.01
        lo = max(0, t - 5)
        slow_b = (sum(bad_minutes[lo:t + 1]) / 60.0) / 0.01
        if fast_b >= fast_th:
            pages.append(t)
            suppress_until = t + 6
        elif slow_b >= slow_th:
            if t <= suppress_until:
                continue
            tickets.append(t)
    return {"pages": pages, "tickets": tickets, "ok": len(bad_minutes) - len(pages) - len(tickets)}
`,
        hints: [
          { en: "The shoulders page too: 1.0 bad minute of a 10-minute bucket is burn 10× — stricter than the 8.3 page line. Read the hidden-test message twice before doubting your loop.", ru: "Плечи тоже пейджат: 1.0 плохой минуты в 10-минутной корзине — это burn 10× — строже линии пейджа 8.3. Перечитай сообщение скрытого теста дважды, прежде чем сомневаться в цикле." },
          { en: "The dedup window is what makes the breach ONE page: buckets after 126 stay silent even though their slow lane still burns.", ru: "Окно дедупликации — то, что делает breach ОДНИМ пейджем: корзины после 126 молчат, хотя их slow-дорожка ещё горит." },
          { en: "sum(bad_minutes[max(0, t-5):t+1]) — six buckets, edges inclusive.", ru: "sum(bad_minutes[max(0, t-5):t+1]) — шесть корзин, края включены." },
        ],
        numpy: false, timeoutMs: 5000,
      },
    ],
    challenge: {
      id: "challenge",
      word: { en: "challenge", ru: "челлендж" },
      title: { en: "★ Tune the policy: one page, zero tickets, no silence", ru: "★ Настрой политику: один пейдж, ноль тикетов и не ослепи" },
      brief: {
        en: "The same declared day, one decision left open: the thresholds. Choose <code>fast_th</code> from {6, 8.3, 12} and <code>slow_th</code> from {2, 3, 5} so that on TRACE the run <strong>pages exactly once — at bucket 126, the breach itself</strong> — and <strong>opens zero tickets</strong> (the dedup window does its part; the thresholds must do theirs). Print one line: <code>fast=&lt;value&gt; slow=&lt;value&gt;</code>. The page recomputes your verdict with the declared model and rejects invented numbers; any other (fast, slow) pair either pages the shoulders, drowns in tickets, or goes silent on the lunch.",
        ru: "Тот же декларированный день, одно решение открыто: пороги. Выбери <code>fast_th</code> из {6, 8.3, 12} и <code>slow_th</code> из {2, 3, 5} так, чтобы на TRACE прогон <strong>пейджил ровно один раз — по корзине 126, самому breach-у</strong> — и <strong>открывал ноль тикетов</strong> (окно дедупликации делает свою часть; пороги обязаны сделать свою). Напечатай одну строку: <code>fast=&lt;значение&gt; slow=&lt;значение&gt;</code>. Страница пересчитает твой вердикт по декларированной модели и отвергнет выдуманные числа; любая другая пара (fast, slow) либо пейджит плечи, либо тонет в тикетах, либо слепнет на обед.",
      },
      goal: { en: "Print one line: fast=<from {6, 8.3, 12}> slow=<from {2, 3, 5}> — pages == [126] and tickets == [] on TRACE.", ru: "Напечатай одну строку: fast=<из {6, 8.3, 12}> slow=<из {2, 3, 5}> — pages == [126] и tickets == [] на TRACE." },
      mode: "run", numpy: false, timeoutMs: 5000,
      starter: `# TRACE from the capstone is already defined (144 buckets).
# Declared model (page-side recompute uses exactly this):
#   fast_burn(t) = (TRACE[t] / 10) / 0.01
#   slow_burn(t) = (sum(TRACE[t-5..t]) / 60) / 0.01
#   page if fast_burn >= fast_th; else ticket if slow_burn >= slow_th
#   a page suppresses tickets for the next 6 buckets (dedup)
# Grids: fast_th in {6, 8.3, 12}; slow_th in {2, 3, 5}
# Goal: pages == [126] and tickets == []
# Print exactly one line, e.g.: fast=8.3 slow=3.0

# TODO: reason about which threshold spares the 1.0-min shoulders
# (their fast burn is 10x!) and which slow threshold stays silent
# on the lunch (its best rolling burn is 4x) while still not being "off".
`,
      check: (out) => {
        const trace = (window.LABS_CONTENT["13"].__trace || []);
        const m = String(out).match(/fast\s*=\s*([0-9.]+)\s+slow\s*=\s*([0-9.]+)/);
        if (!m) return { ok: false, note: { en: "Print one line: fast=<value> slow=<value>.", ru: "Напечатай одну строку: fast=<значение> slow=<значение>." } };
        const fast = Number(m[1]), slow = Number(m[2]);
        const gF = [6, 8.3, 12], gS = [2, 3, 5];
        if (!gF.includes(fast) || !gS.includes(slow)) return { ok: false, note: { en: "Both values must come from the declared grids: fast in {6, 8.3, 12}, slow in {2, 3, 5}.", ru: "Оба значения — из декларированных сеток: fast из {6, 8.3, 12}, slow из {2, 3, 5}." } };
        const budget = 0.01;
        const burn = (bad, win) => (bad / win) / budget;
        const pages = [], tickets = [];
        let suppress = -1;
        for (let t = 0; t < trace.length; t++) {
          const fb = burn(trace[t], 10);
          const lo = Math.max(0, t - 5);
          const sb = burn(trace.slice(lo, t + 1).reduce((a, b) => a + b, 0), 60);
          if (fb >= fast) { pages.push(t); suppress = t + 6; }
          else if (sb >= slow) { if (t <= suppress) continue; tickets.push(t); }
        }
        const verdict = "pages [" + pages.join(", ") + "], tickets [" + tickets.join(", ") + "]";
        if (pages.length !== 1 || pages[0] !== 126) return { ok: false, note: { en: "Your pair gives " + verdict + " — the goal is exactly one page, at bucket 126.", ru: "Твоя пара даёт " + verdict + " — цель ровно один пейдж, по корзине 126." } };
        if (tickets.length !== 0) return { ok: false, note: { en: "Your pair gives " + verdict + " — the goal is zero tickets.", ru: "Твоя пара даёт " + verdict + " — цель ноль тикетов." } };
        return { ok: true, note: { en: "fast=" + fast + " slow=" + slow + " gives pages [126], tickets [] — the breach pages alone, the lunch stays off the board, nothing is invented. This is alert design: severe enough to spare the shoulders, patient enough to spare the lunch.", ru: "fast=" + fast + " slow=" + slow + " даёт pages [126], tickets [] — breach пейджит в одиночку, обед не попадает на доску, ничего не выдумано. Это дизайн алертов: строго enough, чтобы пощадить плечи, терпеливо enough, чтобы пощадить обед." } };
      },
      reference: `# The unique grid answer, and why it is unique:
#   fast=6   -> the 1.0-minute shoulders (fast burn 10x) page too: pages [125.126.127]
#   fast=8.3 -> same three pages (10 >= 8.3)
#   fast=12  -> shoulders stay below the line; only the breach (83x) pages
#   slow=2 or 3 -> the lunch's best rolling burn (4x) opens tickets
#   slow=5  -> the lunch never reaches 5x: zero tickets
# So the only pair meeting pages == [126] and tickets == [] is fast=12 slow=5.
print("fast=12 slow=5")
`,
    },
    runtime: {
      title: {
        en: "Verify the live journal: your own layer-2 gateway",
        ru: "Проверь живой журнал: свой шлюз слой-2",
      },
      brief: {
        en: "Everything above ran on a <strong>declared teaching journal</strong>. Connect the practice runtime (<code>docker compose up -d</code>, gateway at <code>127.0.0.1:8760</code>), make a couple of measurements — and the same three views become real: your journal accumulates experiment and burst entries in the identical hash-chain form, <code>GET /journal/verify</code> runs the gateway's own verifier, and your <code>verify_chain()</code> from Exercise 1 must agree with it. Machine-local and honest: the course cites your journal only as your own.",
        ru: "Всё выше работало на <strong>декларированном учебном журнале</strong>. Подключи practice-рантайм (<code>docker compose up -d</code>, шлюз на <code>127.0.0.1:8760</code>), сделай пару измерений — и те же три взгляда станут настоящими: твой журнал копит записи experiment и burst в идентичной хэш-цепочке, <code>GET /journal/verify</code> гоняет собственный верификатор шлюза, а твоя <code>verify_chain()</code> из Упражнения 1 обязана с ним сойтись. Машинно-локально и честно: курс цитирует твой журнал только как твой собственный.",
      },
      experimentPrompt: {
        en: "Run two experiments and one burst, then press «Проверить цепочку»: the gateway's verdict and your own walk must agree.",
        ru: "Сделай два эксперимента и один бурст, затем нажми «Проверить цепочку»: вердикт шлюза и твой собственный ход обязаны сойтись.",
      },
      footer: {
        en: "The live journal is yours and machine-local; the declared fixture above stays the grading surface. If the runtime is offline, this section says so honestly — nothing here pretends.",
        ru: "Живой журнал — твой и машинно-локальный; декларированная фикстура выше остаётся оцениваемой поверхностью. Если рантайм офлайн, этот раздел говорит об этом честно — ничего здесь не притворяется.",
      },
    },
    posttest: [
      {
        id: "p1",
        q: { en: "SLI vs SLO — which line is the discipline?", ru: "SLI против SLO — какая формулировка дисциплины верна?" },
        options: [
          { en: "An SLI is the measured indicator (percentile and window included); an SLO is the promise you declare over it — before incidents", ru: "SLI — измеряемый показатель (с перцентилем и окном); SLO — обещание поверх него, декларированное до инцидентов" },
          { en: "An SLI is the promise; an SLO is the number the journal records", ru: "SLI — обещание; SLO — число из журнала" },
          { en: "They are synonyms for the dashboard's uptime row", ru: "Это синонимы для строки аптайма на дашборде" },
        ],
        answer: 0,
        explain: { en: "Measure first, promise second: the SLO borrows its meaning from the SLI's named percentile and window — that is what makes a breach falsifiable.", ru: "Сперва измерение, потом обещание: SLO заимствует смысл у перцентиля и окна SLI — именно это делает breach фальсифицируемым." },
      },
      {
        id: "p2",
        q: { en: "The 21:00 incident was invisible to the mean-latency chart because…", ru: "Инцидент 21:00 был невидим для графика средней латентности, потому что…" },
        options: [
          { en: "96 fast requests drown 4 slow ones: the mean is insensitive to a hot second, and health was defined as reachability, not as the SLO promise", ru: "96 быстрых запросов топят 4 медленных: средняя слепа к горячей секунде, а здоровье определяли как достижимость, а не как обещание SLO" },
          { en: "The chart had the wrong color scheme", ru: "У графика была неверная цветовая схема" },
          { en: "The users did not actually experience latency", ru: "Пользователи на самом деле не испытали латентность" },
        ],
        answer: 0,
        explain: { en: "The mean 1.06 s read acceptable while p95 sat at 7.2 s: percentile and window are part of the number — a latency statement without them is a mood.", ru: "Средняя 1.06 с читалась приемлемо, пока p95 сидел на 7.2 с: перцентиль и окно — часть числа; заявление о латентности без них — настроение." },
      },
      {
        id: "p3",
        q: { en: "Fast window burn 15×, slow window burn 4× — what does the declared policy do?", ru: "Fast-окно burn 15×, slow-окно burn 4× — что делает декларированная политика?" },
        options: [
          { en: "Page: the fast lane crossed 8.3 — fast+severe speaks first, and the page suppresses the slow lane's echo", ru: "Пейдж: fast-дорожка перевалила 8.3 — быстро+тяжело говорит первым, и пейдж подавляет эхо slow-дорожки" },
          { en: "Ticket: the slow lane is the louder one", ru: "Тикет: slow-дорожка громче" },
          { en: "Nothing: both numbers look small", ru: "Ничего: оба числа выглядят маленькими" },
        ],
        answer: 0,
        explain: { en: "One policy, two lanes: fast+severe pages, slow+mild tickets — and the dedup window keeps one incident from becoming a row of alerts.", ru: "Одна политика, две дорожки: быстро+тяжело пейджит, медленно+мягко тикетует — и окно дедупликации не даёт инциденту стать рядом алертов." },
      },
      {
        id: "b1",
        bridge: { en: "bridge · T08", ru: "мост · T08" },
        q: { en: "The journal you verified here is the same species as the Topic 08 terminal-outcome journal because…", ru: "Журнал, который вы проверяли здесь, — тот же вид, что журнал исходов Темы 08, потому что…" },
        options: [
          { en: "Both are append-only and hash-sealed: each entry hashes the previous one, so an edit is a detected event, not a silent rewrite", ru: "Оба append-only и запечатаны хэшами: каждая запись хэширует предыдущую, поэтому правка — обнаруживаемое событие, а не тихая перепись" },
          { en: "Both store their data in CSV files", ru: "Оба хранят данные в CSV-файлах" },
          { en: "Both were introduced in Topic 13", ru: "Оба появились в Теме 13" },
        ],
        answer: 0,
        explain: { en: "The chain is the reason dashboards may be believed: ground truth downstream of verification, rumor downstream of editable logs — the T08 contract wearing its observability hat.", ru: "Цепочка — причина, по которой дашбордам можно верить: источник истины ниже проверки, слух ниже правимых логов — контракт T08 в наблюдаемом головном уборе." },
      },
    ],
    footer: {
      en: "Declared teaching model of an on-call day: the trace, the journal fixture and the thresholds are declared arithmetic over the Topic 13 lecture numbers (SLO 99 %, budget 1 %, burn 8.3×, the 21:00 breach at p95 7.2 s) and the lab 08 drill (24 arrivals, 8 admitted, 16 × 429). The journal canonical form is the real layer-2 gateway's (runtime/gateway/app.py, lab 09); the live journal you can connect in the Layer-2 section is your own and machine-local.",
      ru: "Декларированная учебная модель суток дежурного: трейс, фикстура журнала и пороги — декларированная арифметика поверх чисел лекции Темы 13 (SLO 99 %, бюджет 1 %, burn 8.3×, breach 21:00 с p95 7.2 с) и дрилла лабы 08 (24 пришельца, 8 допущено, 16 × 429). Каноническая форма журнала — настоящая, от шлюза слой-2 (runtime/gateway/app.py, лаба 09); живой журнал, который можно подключить в секции Layer-2, — твой собственный и машинно-локальный.",
    },
  };
  /* The declared trace, also read by the challenge's page-side recompute. */
  LABS_CONTENT["13"].__trace = [].concat(Array(60).fill(0.0), Array(6).fill(0.4), Array(24).fill(0.0), [0.7], Array(34).fill(0.0), [1.0, 8.3, 1.0], Array(16).fill(0.0));
  window.LABS_CONTENT = LABS_CONTENT;
})();
