/* Lab 16 (bonus) — Speculative decoding: when the draft helps and when it hurts.
   Content module for the generic lab page (window.LABS_CONTENT['16']).
   Declared teaching model only; the live A/B section runs on the student's own
   runtime (engine + engine-spec with a draft model) and produces honest,
   machine-local numbers — on a CPU the draft engine usually LOSES, and that
   measured contradiction with the formula is the core lesson. */
(function () {
  "use strict";
  window.LABS_CONTENT = window.LABS_CONTENT || {};

  LABS_CONTENT["16"] = {
    budget: 60,
    title: {
      en: "Speculative decoding: when the draft helps",
      ru: "Спекулятивное декодирование: когда draft помогает",
    },
    sub: {
      en: "The draft proposes, one verify pass confirms: predict the expected accepted tokens and the speedup before running, then measure a live A/B on your own engine and explain why CPU handles flip the answer.",
      ru: "Draft предлагает, один проход верификации подтверждает: предскажи матожидание принятых токенов и ускорение до запуска, затем измерь живой A/B на своём движке и объясни, почему CPU-ручки переворачивают ответ.",
    },
    intro: {
      en: `<p>Speculative decoding lets a small <strong>draft model</strong> propose the next few tokens; the big model then verifies them in <strong>one batched forward pass</strong> and accepts the matching prefix. A rejected token is cheap: the verify pass already produced the correction. If <code>p</code> is the acceptance rate (the probability that the next draft token matches greedy decoding) and <code>n</code> draft tokens are proposed per cycle, the expected tokens per cycle is <code>E = (1 − p^(n+1)) / (1 − p)</code> — capped at <code>n + 1</code> because a fully accepted cycle also earns the correction token.</p>
<p>Whether that wins depends on the handles. On GPU-class hardware the verify pass is nearly free next to token-by-token decode, and the formula promises real speedups. On a CPU the same verification costs almost like decoding that many tokens — and the live A/B below will measure exactly that on your machine. The lab habit: predict from the declared model first, measure second, and explain the gap with the one condition the formula silently assumes.</p>`,
      ru: `<p>Спекулятивное декодирование (speculative decoding) поручает маленькой <strong>draft-модели</strong> предложить следующие несколько токенов, а большая модель верифицирует их <strong>одним батчированным проходом</strong> и принимает совпавший префикс. Отказ дёшев: тот же verify-проход уже выдал коррекционный токен. Если <code>p</code> — acceptance rate (вероятность, что следующий draft-токен совпадёт с жадным декодированием), и за цикл предлагается <code>n</code> draft-токенов, то матожидание токенов за цикл <code>E = (1 − p^(n+1)) / (1 − p)</code> с потолком <code>n + 1</code>: полностью принятый цикл тоже приносит коррекционный токен.</p>
<p>Выигрыш зависит от ручек. На GPU-железе verify-проход почти бесплатен рядом с поточным декодированием, и формула обещает настоящее ускорение. На CPU та же верификация стоит почти как декодирование такого же числа токенов — и живой A/B ниже измерит ровно это на твоей машине. Привычка лабы: сначала предскажи по заявленной модели, потом измерь, потом объясни разрыв через то единственное условие, которое формула молча предполагает.</p>`,
    },
    heroTag: { en: "draft, verify, acceptance rate", ru: "draft, verify, acceptance rate" },
    figures: [
      {
        id: "lab16-spec-cycle",
        title: { en: "One draft cycle: propose → verify → accept/correct", ru: "Один draft-цикл: предложить → верифицировать → принять/исправить" },
        w: 760, h: 420,
        svg: `<svg viewBox="0 0 760 420" xmlns="http://www.w3.org/2000/svg">
  <g id="g-main">
    <rect x="60" y="70" width="300" height="52" rx="9" fill="var(--lab-accent)" opacity="0.14"/>
    <text x="78" y="102" font-size="15" fill="var(--lab-ink)" class="mono" data-en="… saturn, uranus ▌" data-ru="… сатурн, уран ▌">… saturn, uranus ▌</text>
    <text x="380" y="102" font-size="14" fill="var(--lab-muted)" data-en="big model, mid-decode" data-ru="большая модель, середина декода">big model, mid-decode</text>
  </g>
  <g id="g-draft">
    <text x="60" y="160" font-size="13" fill="var(--fig-warm)" data-en="draft proposes n = 4 tokens" data-ru="draft предлагает n = 4 токена">draft proposes n = 4 tokens</text>
    <rect x="60" y="172" width="66" height="40" rx="8" fill="var(--fig-warm)" opacity="0.16"/>
    <rect x="136" y="172" width="66" height="40" rx="8" fill="var(--fig-warm)" opacity="0.16"/>
    <rect x="212" y="172" width="66" height="40" rx="8" fill="var(--fig-warm)" opacity="0.16"/>
    <rect x="288" y="172" width="66" height="40" rx="8" fill="var(--fig-warm)" opacity="0.16"/>
    <text x="93" y="197" font-size="14" fill="var(--fig-warm)" text-anchor="middle" class="mono" data-en="nep" data-ru="неп">nep</text>
    <text x="169" y="197" font-size="14" fill="var(--fig-warm)" text-anchor="middle" class="mono" data-en="tun" data-ru="тун">tun</text>
    <text x="245" y="197" font-size="14" fill="var(--fig-warm)" text-anchor="middle" class="mono" data-en="e ▌" data-ru="а ▌">e ▌</text>
    <text x="321" y="197" font-size="14" fill="var(--fig-warm)" text-anchor="middle" class="mono">⊕?</text>
    <text x="380" y="232" font-size="13" fill="var(--lab-muted)" class="mono" data-en="cost: 4 × 4 ms (declared)" data-ru="цена: 4 × 4 мс (заявлено)">cost: 4 × 4 ms (declared)</text>
  </g>
  <g id="g-verify">
    <text x="60" y="286" font-size="13" fill="var(--lab-accent)" data-en="one verify pass over the candidate tail" data-ru="один verify-проход по кандидату">one verify pass over the candidate tail</text>
    <path d="M 60 300 L 700 300" stroke="var(--lab-accent)" stroke-width="2.5" class="fig-flow"/>
    <text x="380" y="326" font-size="13" fill="var(--lab-accent)" text-anchor="middle" class="mono" data-en="1 forward · 20 ms (declared GPU handles)" data-ru="1 проход · 20 мс (заявленные GPU-ручки)">1 forward · 20 ms (declared GPU handles)</text>
  </g>
  <g id="g-result">
    <rect x="60" y="348" width="380" height="46" rx="9" fill="var(--fig-ok)" opacity="0.14"/>
    <text x="78" y="377" font-size="15" fill="var(--lab-ink)" class="mono" data-en="3 accepted + 1 correction = 4 tokens" data-ru="3 принято + 1 коррекция = 4 токена">3 accepted + 1 correction = 4 tokens</text>
    <text x="470" y="377" font-size="14" fill="var(--lab-muted)" data-en="cycle: 36 ms — E over cycles = 3.05" data-ru="цикл: 36 мс — в среднем E = 3.05">cycle: 36 ms — E over cycles = 3.05</text>
  </g>
</svg>`,
        stages: [
          { cap: { en: "The big model is mid-decode; the draft fills in candidates.", ru: "Большая модель в декоде; draft подставляет кандидатов." }, show: ["g-main"] },
          { cap: { en: "The draft proposes n = 4 tokens for 4 × 4 ms (declared).", ru: "Draft предлагает n = 4 токена за 4 × 4 мс (заявлено)." }, show: ["g-main", "g-draft"] },
          { cap: { en: "One verify pass confirms or corrects them in 20 ms.", ru: "Один verify-проход подтверждает или исправляет их за 20 мс." }, show: ["g-main", "g-draft", "g-verify"] },
          { cap: { en: "4 tokens per 36 ms cycle; averaged over cycles E = 3.05.", ru: "4 токена за цикл 36 мс; в среднем по циклам E = 3.05." }, show: ["g-main", "g-draft", "g-verify", "g-result"] },
        ],
      },
      {
        id: "lab16-gpu-vs-cpu",
        title: { en: "Same formula, different handles: GPU vs CPU", ru: "Формула та же, ручки разные: GPU против CPU" },
        w: 760, h: 420,
        svg: `<svg viewBox="0 0 760 420" xmlns="http://www.w3.org/2000/svg">
  <g id="g-formula">
    <rect x="60" y="60" width="640" height="56" rx="9" fill="var(--lab-accent)" opacity="0.1"/>
    <text x="380" y="94" text-anchor="middle" font-size="16" fill="var(--lab-accent)" class="mono">speedup = E × decode_ms / (n × draft_ms + verify_ms)</text>
  </g>
  <g id="g-gpu">
    <rect x="60" y="140" width="300" height="110" rx="9" fill="var(--fig-ok)" opacity="0.12"/>
    <text x="78" y="168" font-size="14" fill="var(--lab-ink)" data-en="GPU handles (declared)" data-ru="GPU-ручки (заявлено)">GPU handles (declared)</text>
    <text x="78" y="194" font-size="14" fill="var(--lab-muted)" class="mono" data-en="verify = 1 pass = decode" data-ru="verify = 1 проход = decode">verify = 1 pass = decode</text>
    <text x="78" y="226" font-size="22" fill="var(--fig-ok)" class="mono">1.69×</text>
    <text x="170" y="226" font-size="13" fill="var(--lab-muted)" data-en="draft 4 ms, verify 20 ms" data-ru="draft 4 мс, verify 20 мс">draft 4 ms, verify 20 ms</text>
  </g>
  <g id="g-cpu">
    <rect x="400" y="140" width="300" height="110" rx="9" fill="var(--lab-bad)" opacity="0.12"/>
    <text x="418" y="168" font-size="14" fill="var(--lab-ink)" data-en="CPU handles (declared)" data-ru="CPU-ручки (заявлено)">CPU handles (declared)</text>
    <text x="418" y="194" font-size="14" fill="var(--lab-muted)" class="mono" data-en="verify grows with the chunk" data-ru="verify растёт с длиной куска">verify grows with the chunk</text>
    <text x="418" y="226" font-size="22" fill="var(--lab-bad)" class="mono">0.43×</text>
    <text x="510" y="226" font-size="13" fill="var(--lab-muted)" data-en="draft 70 ms, verify 650 ms" data-ru="draft 70 мс, verify 650 мс">draft 70 ms, verify 650 ms</text>
  </g>
  <g id="g-verdict">
    <rect x="60" y="274" width="640" height="110" rx="9" fill="var(--fig-warm)" opacity="0.1"/>
    <text x="78" y="304" font-size="15" fill="var(--fig-warm)" data-en="Measure it yourself: the live A/B below runs your prompt" data-ru="Измерь сам: живой A/B ниже гоняет твой промпт">Measure it yourself: the live A/B below runs your prompt</text>
    <text x="78" y="330" font-size="15" fill="var(--fig-warm)" data-en="with and without the draft. Your machine, honest numbers." data-ru="с draft-моделью и без. Твоя машина, честные числа.">with and without the draft. Your machine, honest numbers.</text>
    <text x="78" y="362" font-size="13" fill="var(--lab-muted)" data-en="The formula assumes verification is one batched pass — CPUs break that assumption." data-ru="Формула предполагает верификацию одним батч-проходом — CPU это предположение ломает.">The formula assumes verification is one batched pass — CPUs break that assumption.</text>
  </g>
</svg>`,
        stages: [
          { cap: { en: "The speedup formula — everything hangs on the handles.", ru: "Формула ускорения — всё держится на ручках." }, show: ["g-formula"] },
          { cap: { en: "GPU handles: verify costs one decode → 1.69×.", ru: "GPU-ручки: verify стоит как один decode → 1.69×." }, show: ["g-formula", "g-gpu"] },
          { cap: { en: "CPU handles: verify scales like decode → 0.43×, a slowdown.", ru: "CPU-ручки: verify растёт как decode → 0.43×, замедление." }, show: ["g-formula", "g-gpu", "g-cpu"] },
          { cap: { en: "Measure it yourself: the live A/B checks the formula on your machine.", ru: "Измерь сам: живой A/B проверяет формулу на твоей машине." }, show: ["g-formula", "g-gpu", "g-cpu", "g-verdict"] },
        ],
      },
    ],
    outcomes: [
      { en: "Compute the expected accepted tokens per draft cycle and the honest speedup — including when it is below 1.", ru: "Считать матожидание принятых токенов за draft-цикл и честное ускорение — включая случаи ниже 1." },
      { en: "Explain, from a measured A/B, which formula assumption CPU verification breaks — and where speculation actually wins.", ru: "Объяснять по измеренному A/B, какое предположение формулы ломает CPU-верификация — и где спекуляция выигрывает на самом деле." },
    ],
    model: [
      [{ en: "draft cycle cost", ru: "цена draft-цикла" }, { en: "n × draft_ms + verify_ms", ru: "n × draft_ms + verify_ms" }, { en: "n = 4, GPU handles (4 / 20)", ru: "n = 4, GPU-ручки (4 / 20)" }, { en: "36 ms", ru: "36 мс" }],
      [{ en: "expected tokens per cycle", ru: "ожидаемые токены за цикл" }, { en: "(1 − p^(n+1)) / (1 − p), ceiling n + 1", ru: "(1 − p^(n+1)) / (1 − p), потолок n + 1" }, { en: "p = 0.75, n = 4", ru: "p = 0.75, n = 4" }, { en: "3.05", ru: "3.05" }],
      [{ en: "speedup, GPU handles", ru: "ускорение, GPU-ручки" }, { en: "E × decode_ms / cycle_ms", ru: "E × decode_ms / cycle_ms" }, { en: "decode 20 · draft 4 · verify 20", ru: "decode 20 · draft 4 · verify 20" }, { en: "1.69×", ru: "1.69×" }],
      [{ en: "speedup, CPU handles", ru: "ускорение, CPU-ручки" }, { en: "same formula", ru: "та же формула" }, { en: "decode 130 · draft 70 · verify 650", ru: "decode 130 · draft 70 · verify 650" }, { en: "0.43× — slower", ru: "0.43× — медленнее" }],
    ],
    scenario: null,
    quizzes: [
      {
        id: "q1",
        q: {
          en: "Acceptance rate p = 0.75, the draft proposes n = 4 tokens per cycle. How many tokens does one cycle produce on average?",
          ru: "Acceptance rate p = 0.75, draft предлагает n = 4 токена за цикл. Сколько токенов производит цикл в среднем?",
        },
        answer: 3.05, tol: 0.03, unit: { en: "tokens", ru: "токена" },
        hint: {
          en: "E = (1 − p^(n+1)) / (1 − p) = (1 − 0.75^5) / 0.25. A fully accepted cycle earns n + 1 = 5.",
          ru: "E = (1 − p^(n+1)) / (1 − p) = (1 − 0.75^5) / 0.25. Полностью принятый цикл приносит n + 1 = 5.",
        },
        followUp: {
          q: { en: "Why does E cap at n + 1 as p → 1?", ru: "Почему E упирается в n + 1 при p → 1?" },
          options: [
            { en: "A cycle consumes at most n proposed tokens plus the correction from verify — beyond the draft window there is nothing to accept", ru: "Цикл потребляет максимум n предложенных токенов плюс коррекцию от verify — за пределами draft-окна принимать нечего" },
            { en: "Because rejected tokens are retried inside the same cycle without limit", ru: "Потому что отвергнутые токены пересматриваются в том же цикле без предела" },
            { en: "Because the verify pass processes only the last two positions", ru: "Потому что verify-проход обрабатывает только две последние позиции" },
          ],
          answer: 0,
          explain: { en: "The draft window bounds the cycle: n proposals + 1 correction is everything one verify pass can pay for. More tokens per cycle require a longer draft — and a longer cycle, which q2 prices.", ru: "Окно draft ограничивает цикл: n предложений + 1 коррекция — вот всё, что может оплатить один verify-проход. Больше токенов за цикл требует более длинного draft — и более длинного цикла, что цену выставит q2." },
        },
        // Вариативность №5 (contract: instructor/plans/quiz-variants-contract-20261125.ru.md).
        // variants[0] = base byte-equal; every answer is recomputed from the
        // lab's own declared formula E = (1 − p^(n+1)) / (1 − p), never invented:
        //   p = 0.85, n = 3 → (1 − 0.85^4) / 0.15 = 3.186625 → 3.19
        //   p = 0.9,  n = 5 → (1 − 0.9^6) / 0.1  = 4.68559  → 4.69
        // tol 0.03: ≥ the 0.01 rounding step of the hint, < the nearest trap
        // (exponent-n answer 2.57 / 4.10; ceiling 4 / 6). Answers pairwise
        // distinct; none matches a figure number (3.05 / 1.69 / 0.43 live there).
        variants: [
          {
            q: {
              en: "Acceptance rate p = 0.75, the draft proposes n = 4 tokens per cycle. How many tokens does one cycle produce on average?",
              ru: "Acceptance rate p = 0.75, draft предлагает n = 4 токена за цикл. Сколько токенов производит цикл в среднем?",
            },
            answer: 3.05, tol: 0.03,
          },
          {
            q: {
              en: "Acceptance rate p = 0.85, the draft proposes n = 3 tokens per cycle. How many tokens does one cycle produce on average?",
              ru: "Acceptance rate p = 0.85, draft предлагает n = 3 токена за цикл. Сколько токенов производит цикл в среднем?",
            },
            answer: 3.19, tol: 0.03,
            hint: {
              en: "E = (1 − p^(n+1)) / (1 − p) = (1 − 0.85^4) / 0.15. A fully accepted cycle earns n + 1 = 4.",
              ru: "E = (1 − p^(n+1)) / (1 − p) = (1 − 0.85^4) / 0.15. Полностью принятый цикл приносит n + 1 = 4.",
            },
          },
          {
            q: {
              en: "Acceptance rate p = 0.9, the draft proposes n = 5 tokens per cycle. How many tokens does one cycle produce on average?",
              ru: "Acceptance rate p = 0.9, draft предлагает n = 5 токенов за цикл. Сколько токенов производит цикл в среднем?",
            },
            answer: 4.69, tol: 0.03,
            hint: {
              en: "E = (1 − p^(n+1)) / (1 − p) = (1 − 0.9^6) / 0.1. A fully accepted cycle earns n + 1 = 6.",
              ru: "E = (1 − p^(n+1)) / (1 − p) = (1 − 0.9^6) / 0.1. Полностью принятый цикл приносит n + 1 = 6.",
            },
          },
        ],
      },
      {
        id: "q2",
        q: {
          en: "Declared GPU handles: decode 20 ms, draft 4 ms, verify 20 ms, p = 0.75, n = 4. What speedup over plain decode does the formula promise?",
          ru: "Заявленные GPU-ручки: decode 20 мс, draft 4 мс, verify 20 мс, p = 0.75, n = 4. Какое ускорение против простого декода обещает формула?",
        },
        answer: 1.69, tol: 0.05, unit: { en: "×", ru: "×" },
        hint: {
          en: "speedup = E × decode_ms / (n × draft_ms + verify_ms) = 3.05 × 20 / (16 + 20).",
          ru: "speedup = E × decode_ms / (n × draft_ms + verify_ms) = 3.05 × 20 / (16 + 20).",
        },
        followUp: {
          q: { en: "Why is a longer draft (bigger n) not automatically a bigger speedup?", ru: "Почему более длинный draft (больше n) — не автоматически большее ускорение?" },
          options: [
            { en: "The cycle cost grows linearly with n, while E grows slower and saturates at n + 1 — past the peak you drag dead draft weight", ru: "Цена цикла растёт линейно с n, а E растёт медленнее и насыщается на n + 1 — за пиком тащишь мёртвый груз draft-токенов" },
            { en: "Because verify passes get more expensive per token as n grows, even on GPU", ru: "Потому что verify-проходы дорожают за токен с ростом n даже на GPU" },
            { en: "Because p falls as n grows — the model gets tired of agreeing", ru: "Потому что p падает с ростом n — модель устаёт соглашаться" },
          ],
          answer: 0,
          explain: { en: "The n-trade-off is real: the ★-challenge sweeps n for several p values and the peak moves. For the declared GPU handles the peak sits at n = 3, not at the ceiling.", ru: "Размен n настоящий: ★-челлендж прогоняет n при нескольких p, и пик движется. Для заявленных GPU-ручек пик сидит на n = 3, а не на потолке." },
        },
        // Вариативность №5: GPU-ручки фиксированы (decode 20 / draft 4 / verify 20),
        // меняются p и n. Пересчёт по speedup = E × decode_ms / (n × draft_ms + verify_ms):
        //   p = 0.85, n = 3 → 3.186625 × 20 / 32 = 1.99164063 → 1.99 (цикл 12 + 20 = 32 мс)
        //   p = 0.9,  n = 5 → 4.68559  × 20 / 40 = 2.342795  → 2.34 (цикл 20 + 20 = 40 мс)
        // followUp-объяснение переписано: «пик сидит на n = 3» верен только для p = 0.75,
        // у вариантов пик свой (n = 5 / n = 7). Answers попарно различны, чисел фигур нет.
        variants: [
          {
            q: {
              en: "Declared GPU handles: decode 20 ms, draft 4 ms, verify 20 ms, p = 0.75, n = 4. What speedup over plain decode does the formula promise?",
              ru: "Заявленные GPU-ручки: decode 20 мс, draft 4 мс, verify 20 мс, p = 0.75, n = 4. Какое ускорение против простого декода обещает формула?",
            },
            answer: 1.69, tol: 0.05,
          },
          {
            q: {
              en: "Declared GPU handles: decode 20 ms, draft 4 ms, verify 20 ms, p = 0.85, n = 3. What speedup over plain decode does the formula promise?",
              ru: "Заявленные GPU-ручки: decode 20 мс, draft 4 мс, verify 20 мс, p = 0.85, n = 3. Какое ускорение против простого декода обещает формула?",
            },
            answer: 1.99, tol: 0.05,
            hint: {
              en: "speedup = E × decode_ms / (n × draft_ms + verify_ms) = 3.19 × 20 / (12 + 20).",
              ru: "speedup = E × decode_ms / (n × draft_ms + verify_ms) = 3.19 × 20 / (12 + 20).",
            },
            followUp: {
              q: { en: "Why is a longer draft (bigger n) not automatically a bigger speedup?", ru: "Почему более длинный draft (больше n) — не автоматически большее ускорение?" },
              options: [
                { en: "The cycle cost grows linearly with n, while E grows slower and saturates at n + 1 — past the peak you drag dead draft weight", ru: "Цена цикла растёт линейно с n, а E растёт медленнее и насыщается на n + 1 — за пиком тащишь мёртвый груз draft-токенов" },
                { en: "Because verify passes get more expensive per token as n grows, even on GPU", ru: "Потому что verify-проходы дорожают за токен с ростом n даже на GPU" },
                { en: "Because p falls as n grows — the model gets tired of agreeing", ru: "Потому что p падает с ростом n — модель устаёт соглашаться" },
              ],
              answer: 0,
              explain: { en: "The n-trade-off is real: the ★-challenge sweeps n for several p values and the peak moves with p. The winning draft length is found by sweeping, not by taking the longest window.", ru: "Размен n настоящий: ★-челлендж прогоняет n при нескольких p, и пик движется вместе с p. Выигрышную длину draft находят развёрткой, а не выбором самого длинного окна." },
            },
          },
          {
            q: {
              en: "Declared GPU handles: decode 20 ms, draft 4 ms, verify 20 ms, p = 0.9, n = 5. What speedup over plain decode does the formula promise?",
              ru: "Заявленные GPU-ручки: decode 20 мс, draft 4 мс, verify 20 мс, p = 0.9, n = 5. Какое ускорение против простого декода обещает формула?",
            },
            answer: 2.34, tol: 0.05,
            hint: {
              en: "speedup = E × decode_ms / (n × draft_ms + verify_ms) = 4.69 × 20 / (20 + 20).",
              ru: "speedup = E × decode_ms / (n × draft_ms + verify_ms) = 4.69 × 20 / (20 + 20).",
            },
            followUp: {
              q: { en: "Why is a longer draft (bigger n) not automatically a bigger speedup?", ru: "Почему более длинный draft (больше n) — не автоматически большее ускорение?" },
              options: [
                { en: "The cycle cost grows linearly with n, while E grows slower and saturates at n + 1 — past the peak you drag dead draft weight", ru: "Цена цикла растёт линейно с n, а E растёт медленнее и насыщается на n + 1 — за пиком тащишь мёртвый груз draft-токенов" },
                { en: "Because verify passes get more expensive per token as n grows, even on GPU", ru: "Потому что verify-проходы дорожают за токен с ростом n даже на GPU" },
                { en: "Because p falls as n grows — the model gets tired of agreeing", ru: "Потому что p падает с ростом n — модель устаёт соглашаться" },
              ],
              answer: 0,
              explain: { en: "The n-trade-off is real: the ★-challenge sweeps n for several p values and the peak moves with p. The winning draft length is found by sweeping, not by taking the longest window.", ru: "Размен n настоящий: ★-челлендж прогоняет n при нескольких p, и пик движется вместе с p. Выигрышную длину draft находят развёрткой, а не выбором самого длинного окна." },
            },
          },
        ],
      },
      {
        id: "q3",
        q: {
          en: "Same p = 0.75, n = 4, but CPU handles: decode 130 ms, draft 70 ms, verify 650 ms. What does the formula return now?",
          ru: "Те же p = 0.75, n = 4, но CPU-ручки: decode 130 мс, draft 70 мс, verify 650 мс. Что вернёт формула теперь?",
        },
        answer: 0.43, tol: 0.03, unit: { en: "×", ru: "×" },
        hint: {
          en: "Same formula, new handles: 3.05 × 130 / (280 + 650). Below 1 means the draft engine is a slowdown.",
          ru: "Формула та же, ручки новые: 3.05 × 130 / (280 + 650). Ниже 1 — draft-движок замедляет.",
        },
        followUp: {
          q: { en: "Which formula assumption do the CPU handles break?", ru: "Какое предположение формулы ломают CPU-ручки?" },
          options: [
            { en: "Verification in one batched pass: on a CPU checking 5 tokens costs like decoding them, so verify_ms grows with the chunk", ru: "Верификация одним батч-проходом: на CPU проверка 5 токенов стоит как их декодирование, поэтому verify_ms растёт с куском" },
            { en: "The acceptance probability p — CPU models agree less with their drafts", ru: "Вероятность принятия p — CPU-модели меньше соглашаются со своими draft" },
            { en: "The per-cycle ceiling n + 1 — on a CPU a cycle can earn more tokens", ru: "Потолок цикла n + 1 — на CPU цикл может заработать больше токенов" },
          ],
          answer: 0,
          explain: { en: "The formula is not wrong — the handles are. The GPU wins because one forward prices the whole candidate tail; a CPU pays per token, and the measured A/B in the live section will say exactly that on your machine.", ru: "Формула не врёт — врут ручки. GPU выигрывает, потому что один проход оценивает весь кусок кандидатов; CPU платит за каждый токен, и живой A/B в секции ниже скажет ровно это на твоей машине." },
        },
        // Вариативность №5: CPU-ручки фиксированы (decode 130 / draft 70 / verify 650),
        // меняются p и n — вердикт «ниже 1» сохраняется у всех вариантов.
        // Пересчёт по speedup = E × decode_ms / (n × draft_ms + verify_ms):
        //   p = 0.85, n = 3 → 3.186625 × 130 / 860  = 0.48169913 → 0.48 (цикл 210 + 650 = 860 мс)
        //   p = 0.9,  n = 5 → 4.68559  × 130 / 1000 = 0.60912670 → 0.61 (цикл 350 + 650 = 1000 мс)
        // followUp-опция переписана без чисел: в базе «checking 5 tokens» — это n + 1 = 5
        // только для базового n = 4. Answers попарно различны, чисел фигур нет.
        variants: [
          {
            q: {
              en: "Same p = 0.75, n = 4, but CPU handles: decode 130 ms, draft 70 ms, verify 650 ms. What does the formula return now?",
              ru: "Те же p = 0.75, n = 4, но CPU-ручки: decode 130 мс, draft 70 мс, verify 650 мс. Что вернёт формула теперь?",
            },
            answer: 0.43, tol: 0.03,
          },
          {
            q: {
              en: "CPU handles: decode 130 ms, draft 70 ms, verify 650 ms, p = 0.85, n = 3. What does the formula return now?",
              ru: "CPU-ручки: decode 130 мс, draft 70 мс, verify 650 мс, p = 0.85, n = 3. Что вернёт формула теперь?",
            },
            answer: 0.48, tol: 0.03,
            hint: {
              en: "Same formula, new handles: 3.19 × 130 / (210 + 650). Below 1 means the draft engine is a slowdown.",
              ru: "Формула та же, ручки новые: 3.19 × 130 / (210 + 650). Ниже 1 — draft-движок замедляет.",
            },
            followUp: {
              q: { en: "Which formula assumption do the CPU handles break?", ru: "Какое предположение формулы ломают CPU-ручки?" },
              options: [
                { en: "Verification in one batched pass: on a CPU checking the candidate tail costs like decoding it, so verify_ms grows with the chunk", ru: "Верификация одним батч-проходом: на CPU проверка куска кандидатов стоит как его декодирование, поэтому verify_ms растёт с куском" },
                { en: "The acceptance probability p — CPU models agree less with their drafts", ru: "Вероятность принятия p — CPU-модели меньше соглашаются со своими draft" },
                { en: "The per-cycle ceiling n + 1 — on a CPU a cycle can earn more tokens", ru: "Потолок цикла n + 1 — на CPU цикл может заработать больше токенов" },
              ],
              answer: 0,
              explain: { en: "The formula is not wrong — the handles are. The GPU wins because one forward prices the whole candidate tail; a CPU pays per token, and the measured A/B in the live section will say exactly that on your machine.", ru: "Формула не врёт — врут ручки. GPU выигрывает, потому что один проход оценивает весь кусок кандидатов; CPU платит за каждый токен, и живой A/B в секции ниже скажет ровно это на твоей машине." },
            },
          },
          {
            q: {
              en: "CPU handles: decode 130 ms, draft 70 ms, verify 650 ms, p = 0.9, n = 5. What does the formula return now?",
              ru: "CPU-ручки: decode 130 мс, draft 70 мс, verify 650 мс, p = 0.9, n = 5. Что вернёт формула теперь?",
            },
            answer: 0.61, tol: 0.03,
            hint: {
              en: "Same formula, new handles: 4.69 × 130 / (350 + 650). Below 1 means the draft engine is a slowdown.",
              ru: "Формула та же, ручки новые: 4.69 × 130 / (350 + 650). Ниже 1 — draft-движок замедляет.",
            },
            followUp: {
              q: { en: "Which formula assumption do the CPU handles break?", ru: "Какое предположение формулы ломают CPU-ручки?" },
              options: [
                { en: "Verification in one batched pass: on a CPU checking the candidate tail costs like decoding it, so verify_ms grows with the chunk", ru: "Верификация одним батч-проходом: на CPU проверка куска кандидатов стоит как его декодирование, поэтому verify_ms растёт с куском" },
                { en: "The acceptance probability p — CPU models agree less with their drafts", ru: "Вероятность принятия p — CPU-модели меньше соглашаются со своими draft" },
                { en: "The per-cycle ceiling n + 1 — on a CPU a cycle can earn more tokens", ru: "Потолок цикла n + 1 — на CPU цикл может заработать больше токенов" },
              ],
              answer: 0,
              explain: { en: "The formula is not wrong — the handles are. The GPU wins because one forward prices the whole candidate tail; a CPU pays per token, and the measured A/B in the live section will say exactly that on your machine.", ru: "Формула не врёт — врут ручки. GPU выигрывает, потому что один проход оценивает весь кусок кандидатов; CPU платит за каждый токен, и живой A/B в секции ниже скажет ровно это на твоей машине." },
            },
          },
        ],
      },
    ],
    exercises: [
      {
        id: "ex1",
        title: { en: "Exercise 1 · Expected tokens per cycle", ru: "Упражнение 1 · Матожидание токенов за цикл" },
        brief: {
          en: "One expression to start: implement <code>e_tokens(p, n)</code> — the declared model's expected tokens per draft cycle, <code>(1 − p^(n+1)) / (1 − p)</code>. The guard for <code>p &gt;= 1</code> is already there: a perfect draft earns the ceiling <code>n + 1</code> (n accepted + 1 correction), and the formula would divide by zero on the way.",
          ru: "Одно выражение для старта: реализуй <code>e_tokens(p, n)</code> — матожидание токенов за draft-цикл по заявленной модели, <code>(1 − p^(n+1)) / (1 − p)</code>. Защита для <code>p &gt;= 1</code> уже стоит: идеальный draft зарабатывает потолок <code>n + 1</code> (n принято + 1 коррекция), а формула по дороге делила бы на ноль.",
        },
        starter: `def e_tokens(p, n):
    """Expected tokens per draft cycle: (1 - p**(n+1)) / (1 - p).

    p >= 1 means every draft token is accepted: the cycle earns
    the ceiling n + 1 (n accepted + 1 correction token).
    """
    if p >= 1:
        return float(n + 1)
    # TODO: one expression
`,
        tests: [
          { name: "declared point p = 0.75, n = 4", hidden: false, code: `approx(e_tokens(0.75, 4), 3.05078125, 1e-9)` },
          { name: "small case by hand: p = 0.5, n = 2", hidden: false, code: `approx(e_tokens(0.5, 2), 1.75, 1e-9)` },
          { name: "another p: 0.9, 3", hidden: true, code: `approx(e_tokens(0.9, 3), 3.439, 1e-6)` },
          { name: "perfect draft earns the ceiling", hidden: true, code: `eq(e_tokens(1.0, 4), 5.0)
eq(e_tokens(1.0, 2), 3.0)` },
        ],
        solution: `def e_tokens(p, n):
    if p >= 1:
        return float(n + 1)
    return (1 - p ** (n + 1)) / (1 - p)`,
        hints: [
          { en: "One line: (1 − p**(n+1)) / (1 − p). Watch the exponent: n + 1, not n.", ru: "Одна строка: (1 − p**(n+1)) / (1 − p). Следи за степенью: n + 1, а не n." },
        ],
        numpy: false,
        timeoutMs: 4000,
      },
      {
        id: "ex2",
        title: { en: "Exercise 2 · The honest speedup", ru: "Упражнение 2 · Честное ускорение" },
        brief: {
          en: "Implement <code>speedup(p, n, decode_ms, draft_ms, verify_ms)</code>: expected tokens per cycle (your <code>e_tokens</code>, frozen below) divided by the cycle cost <code>n × draft_ms + verify_ms</code>, priced in plain-decode tokens <code>e / cycle × decode_ms</code>. The same function must return 1.69 on the declared GPU handles and 0.43 on the declared CPU handles — a number below 1 is a slowdown, not an error.",
          ru: "Реализуй <code>speedup(p, n, decode_ms, draft_ms, verify_ms)</code>: матожидание токенов за цикл (твоя <code>e_tokens</code>, заморожена ниже), делённое на цену цикла <code>n × draft_ms + verify_ms</code>, в ценах простого декода <code>e / cycle × decode_ms</code>. Та же функция должна вернуть 1.69 на заявленных GPU-ручках и 0.43 на CPU-ручках — число ниже 1 означает замедление, а не ошибку.",
        },
        starter: `def e_tokens(p, n):
    if p >= 1:
        return float(n + 1)
    return (1 - p ** (n + 1)) / (1 - p)


def speedup(p, n, decode_ms, draft_ms, verify_ms):
    """Speedup vs plain token-by-token decode (declared model).

    cycle = n * draft_ms + verify_ms; the plain baseline decodes
    exactly 1 token per decode_ms.
    """
    e = e_tokens(p, n)
    # TODO: cycle cost in ms
    # TODO: return e tokens per cycle, priced in decode_ms
`,
        tests: [
          { name: "declared GPU handles: a real win", hidden: false, code: `approx(speedup(0.75, 4, 20, 4, 20), 1.6948784722222222, 1e-9)` },
          { name: "declared CPU handles: below 1", hidden: false, code: `approx(speedup(0.75, 4, 130, 70, 650), 0.4264532930107527, 1e-9)` },
          { name: "perfect draft, GPU handles", hidden: true, code: `approx(speedup(1.0, 4, 20, 4, 20), 2.7777777777777777, 1e-9)` },
          { name: "a dead draft still pays the cycle cost", hidden: true, code: `approx(speedup(0.0, 4, 20, 4, 20), 0.5555555555555556, 1e-9)` },
        ],
        solution: `def e_tokens(p, n):
    if p >= 1:
        return float(n + 1)
    return (1 - p ** (n + 1)) / (1 - p)


def speedup(p, n, decode_ms, draft_ms, verify_ms):
    cycle = n * draft_ms + verify_ms
    return e_tokens(p, n) * decode_ms / cycle`,
        hints: [
          { en: "cycle = n × draft_ms + verify_ms; return e × decode_ms / cycle. Do not drop verify_ms — Exercise 3 is about exactly that bug.", ru: "cycle = n × draft_ms + verify_ms; верни e × decode_ms / cycle. Не теряй verify_ms — упражнение 3 ровно про этот баг." },
        ],
        numpy: false,
        timeoutMs: 4000,
      },
      {
        id: "ex3",
        title: { en: "Exercise 3 · Fix the bug: the report that forgot verification", ru: "Упражнение 3 · Почини баг: отчёт, забывший верификацию" },
        brief: {
          en: "This <code>spec_verdict(p, n, decode_ms, draft_ms, verify_ms)</code> promised the team <strong>3.81×</strong> on the declared GPU handles and shipped a slowdown. The bug: the cycle cost counts only the draft tokens — <code>verify_ms</code> never entered the bill, so the CPU verdict came out <code>'faster'</code>. Fix it to the docstring contract: cycle = <code>n × draft_ms + verify_ms</code>; verdict <code>'faster'</code> iff speedup &gt; 1.0 (strictly); the returned speedup is rounded to 2 decimals.",
          ru: "Эта <code>spec_verdict(p, n, decode_ms, draft_ms, verify_ms)</code> пообещала команде <strong>3.81×</strong> на заявленных GPU-ручках, а в проде вышло замедление. Баг: в цене цикла считаются только draft-токены — <code>verify_ms</code> в счёт не попал, поэтому CPU-вердикт вышел <code>'faster'</code>. Почини по контракту из docstring: цикл = <code>n × draft_ms + verify_ms</code>; вердикт <code>'faster'</code> тогда и только когда speedup &gt; 1.0 (строго); возвращаемое ускорение округляется до 2 знаков.",
        },
        starter: `def spec_verdict(p, n, decode_ms, draft_ms, verify_ms):
    """Honest report of one speculative config (declared model).

    Returns {'speedup': float (2 decimals), 'verdict': 'faster' | 'slower'};
    'faster' iff the speedup is strictly above 1.0.
    """
    def e_tokens(p, n):
        if p >= 1:
            return float(n + 1)
        return (1 - p ** (n + 1)) / (1 - p)

    # BUG: the verify pass is missing from the cycle cost. The report
    # promised 3.81x on the GPU handles and the CPU config slowed down
    # in production. Put verify_ms back into the bill.
    e = e_tokens(p, n)
    cycle = n * draft_ms
    raw = e * decode_ms / cycle
    return {'speedup': round(raw, 2), 'verdict': 'faster' if raw > 1.0 else 'slower'}
`,
        tests: [
          { name: "GPU handles: honestly faster, 1.69", hidden: false, code: `d = spec_verdict(0.75, 4, 20, 4, 20)
eq(d['verdict'], 'faster')
eq(d['speedup'], 1.69)` },
          { name: "CPU handles: honestly slower, 0.43", hidden: false, code: `d = spec_verdict(0.75, 4, 130, 70, 650)
eq(d['verdict'], 'slower')
eq(d['speedup'], 0.43)` },
          { name: "another config that wins", hidden: true, code: `eq(spec_verdict(0.5, 2, 20, 4, 20)['verdict'], 'faster')` },
          { name: "exactly 1.0 is NOT faster", hidden: true, code: `eq(spec_verdict(0.75, 4, 20, 4, 45.015625)['verdict'], 'slower')` },
        ],
        solution: `def spec_verdict(p, n, decode_ms, draft_ms, verify_ms):
    def e_tokens(p, n):
        if p >= 1:
            return float(n + 1)
        return (1 - p ** (n + 1)) / (1 - p)

    e = e_tokens(p, n)
    cycle = n * draft_ms + verify_ms
    raw = e * decode_ms / cycle
    return {'speedup': round(raw, 2), 'verdict': 'faster' if raw > 1.0 else 'slower'}`,
        hints: [
          { en: "One character-level fix: cycle = n * draft_ms + verify_ms. The verdict compares the RAW speedup with 1.0 — before rounding.", ru: "Починка на уровне одного выражения: cycle = n * draft_ms + verify_ms. Вердикт сравнивает СЫРОЙ speedup с 1.0 — до округления." },
        ],
        numpy: false,
        timeoutMs: 4000,
      },
      {
        id: "ex4",
        title: { en: "Exercise 4 · Capstone: the SpecSim class", ru: "Упражнение 4 · Капстоун: класс SpecSim" },
        brief: {
          en: "Bundle the declared model into a class. <code>SpecSim(p, draft_n, decode_ms, draft_ms, verify_ms)</code> with four methods: <code>e_tokens_per_cycle()</code>, <code>cycle_ms()</code>, <code>speedup()</code> and <code>best_n(max_n)</code> — the draft length from 1 to <code>max_n</code> that maximises <code>speedup()</code>; ties go to the smallest n. The interesting part is the sweep: for the declared GPU handles the peak sits at n = 3, and under CPU handles the best config is merely the least bad.",
          ru: "Упакуй заявленную модель в класс. <code>SpecSim(p, draft_n, decode_ms, draft_ms, verify_ms)</code> с четырьмя методами: <code>e_tokens_per_cycle()</code>, <code>cycle_ms()</code>, <code>speedup()</code> и <code>best_n(max_n)</code> — длина draft от 1 до <code>max_n</code>, максимизирующая <code>speedup()</code>; ничьи — в пользу меньшего n. Интересное в развёртке: на заявленных GPU-ручках пик сидит на n = 3, а на CPU-ручках лучшая конфигурация — просто наименее плохая.",
        },
        starter: `class SpecSim:
    """Declared teaching model of speculative decoding.

    p: acceptance rate (probability the next draft token matches greedy);
    draft_n: tokens proposed per cycle;
    decode_ms / draft_ms / verify_ms: declared per-pass costs.
    """

    def __init__(self, p, draft_n, decode_ms, draft_ms, verify_ms):
        self.p = p
        self.n = draft_n
        self.decode_ms = decode_ms
        self.draft_ms = draft_ms
        self.verify_ms = verify_ms

    def e_tokens_per_cycle(self):
        """(1 - p**(n+1)) / (1 - p); p >= 1 -> n + 1."""
        # TODO

    def cycle_ms(self):
        """n * draft_ms + verify_ms."""
        # TODO

    def speedup(self):
        """e_tokens_per_cycle * decode_ms / cycle_ms."""
        # TODO

    def best_n(self, max_n):
        """Draft length in 1..max_n maximising speedup(); ties -> smallest n."""
        # TODO
`,
        tests: [
          { name: "declared E", hidden: false, code: `approx(SpecSim(0.75, 4, 20, 4, 20).e_tokens_per_cycle(), 3.05078125, 1e-9)` },
          { name: "declared cycle", hidden: false, code: `approx(SpecSim(0.75, 4, 20, 4, 20).cycle_ms(), 36.0, 1e-9)` },
          { name: "declared speedup", hidden: false, code: `approx(SpecSim(0.75, 4, 20, 4, 20).speedup(), 1.6948784722222222, 1e-9)` },
          { name: "GPU peak is n = 3, not the ceiling", hidden: false, code: `eq(SpecSim(0.75, 4, 20, 4, 20).best_n(8), 3)` },
          { name: "short sweep: n = 2 beats n = 1", hidden: false, code: `eq(SpecSim(0.75, 4, 20, 4, 20).best_n(2), 2)` },
          { name: "perfect draft: longest window wins", hidden: true, code: `eq(SpecSim(1.0, 4, 20, 4, 20).best_n(8), 8)` },
          { name: "dead draft: shortest window wins", hidden: true, code: `eq(SpecSim(0.0, 4, 20, 4, 20).best_n(8), 1)` },
          { name: "CPU handles, high p: still under 1", hidden: true, code: `approx(SpecSim(0.9, 3, 130, 70, 650).speedup(), 0.5199, 2e-3)` },
          { name: "CPU sweep over full range", hidden: true, code: `eq(SpecSim(0.75, 4, 130, 70, 650).best_n(8), 5)` },
          { name: "CPU sweep, cut before the peak", hidden: true, code: `eq(SpecSim(0.75, 4, 130, 70, 650).best_n(4), 4)` },
        ],
        solution: `class SpecSim:
    def __init__(self, p, draft_n, decode_ms, draft_ms, verify_ms):
        self.p = p
        self.n = draft_n
        self.decode_ms = decode_ms
        self.draft_ms = draft_ms
        self.verify_ms = verify_ms

    def e_tokens_per_cycle(self):
        if self.p >= 1:
            return float(self.n + 1)
        return (1 - self.p ** (self.n + 1)) / (1 - self.p)

    def cycle_ms(self):
        return self.n * self.draft_ms + self.verify_ms

    def speedup(self):
        return self.e_tokens_per_cycle() * self.decode_ms / self.cycle_ms()

    def best_n(self, max_n):
        best, best_s = 1, None
        for cand in range(1, max_n + 1):
            sim = SpecSim(self.p, cand, self.decode_ms, self.draft_ms, self.verify_ms)
            s = sim.speedup()
            if best_s is None or s > best_s:
                best, best_s = cand, s
        return best`,
        hints: [
          { en: "best_n: sweep candidates 1..max_n with a STRICTLY greater comparison (s > best_s) — ties then keep the smallest n automatically.", ru: "best_n: разверни кандидатов 1..max_n со СТРОГИМ сравнением (s > best_s) — тогда ничьи автоматически сохраняют меньший n." },
        ],
        numpy: false,
        timeoutMs: 6000,
      },
    ],
    challenge: {
      id: "chal1",
      word: { en: "challenge", ru: "челлендж" },
      title: {
        en: "★ Sweep the draft length: six configs, six verdicts",
        ru: "★ Разверни длину draft: шесть конфигураций, шесть вердиктов",
      },
      brief: {
        en: "No tests guide you. Write <code>best_config()</code> that sweeps draft length n = 1…8 for all six configs below and prints exactly six lines, one per config, in this order: <code>p=… gpu|cpu n=… speedup=…</code> (speedup rounded to 2 decimals). Cases: p ∈ {0.5, 0.75, 0.9} × {gpu: decode 20, draft 4, verify 20; cpu: decode 130, draft 70, verify 650}. The page checks every line against the declared model — including which n wins and where the verdict flips to 'slower'.",
        ru: "Тестов-каркаса нет. Напиши <code>best_config()</code>, которая развернёт длину draft n = 1…8 для всех шести конфигураций ниже и напечатает ровно шесть строк, по одной на конфигурацию, в этом порядке: <code>p=… gpu|cpu n=… speedup=…</code> (ускорение с округлением до 2 знаков). Случаи: p ∈ {0.5, 0.75, 0.9} × {gpu: decode 20, draft 4, verify 20; cpu: decode 130, draft 70, verify 650}. Страница сверит каждую строку с заявленной моделью — включая то, какой n выигрывает и где вердикт переворачивается в «slower».",
      },
      goal: {
        en: "Six lines: p=… gpu|cpu n=… speedup=… — best n per config and its speedup.",
        ru: "Шесть строк: p=… gpu|cpu n=… speedup=… — лучший n на конфигурацию и его ускорение.",
      },
      mode: "run",
      check: (res) => {
        const rows = String(res.stdout || "").split("\n").map((s) => s.trim()).filter(Boolean);
        const CASES = [
          [0.5, "gpu", 1, 1.25], [0.5, "cpu", 2, 0.288],
          [0.75, "gpu", 3, 1.709], [0.75, "cpu", 5, 0.4275],
          [0.9, "gpu", 7, 2.3731], [0.9, "cpu", 8, 0.6581],
        ];
        if (rows.length !== 6) {
          return { ok: false, note: { en: "expected 6 lines, got " + rows.length, ru: "ожидалось 6 строк, получено " + rows.length } };
        }
        for (let i = 0; i < 6; i++) {
          const [p, kind, nExp, spExp] = CASES[i];
          const m = rows[i].match(/^p=([0-9.]+)\s+(gpu|cpu)\s+n=(\d+)\s+speedup=([0-9.]+)$/);
          if (!m) {
            return { ok: false, note: { en: "line " + (i + 1) + ": format p=… gpu|cpu n=… speedup=…, got \"" + rows[i] + "\"", ru: "строка " + (i + 1) + ": формат p=… gpu|cpu n=… speedup=…, получено «" + rows[i] + "»" } };
          }
          const pGot = parseFloat(m[1]), nGot = parseInt(m[3], 10), spGot = parseFloat(m[4]);
          if (Math.abs(pGot - p) > 1e-9 || m[2] !== kind) {
            return { ok: false, note: { en: "line " + (i + 1) + ": expected p=" + p + " " + kind, ru: "строка " + (i + 1) + ": ожидалось p=" + p + " " + kind } };
          }
          if (nGot !== nExp) {
            return { ok: false, note: { en: "line " + (i + 1) + ": best n for p=" + p + " " + kind + " is " + nExp + ", got " + nGot, ru: "строка " + (i + 1) + ": лучший n для p=" + p + " " + kind + " — " + nExp + ", получено " + nGot } };
          }
          if (Math.abs(spGot - spExp) > 0.03) {
            return { ok: false, note: { en: "line " + (i + 1) + ": speedup for p=" + p + " " + kind + ", n=" + nExp + " is " + spExp.toFixed(2) + ", got " + spGot, ru: "строка " + (i + 1) + ": ускорение для p=" + p + " " + kind + ", n=" + nExp + " — " + spExp.toFixed(2) + ", получено " + spGot } };
          }
        }
        return { ok: true, note: { en: "all six lines match the declared model — the peak moves with p and flips under CPU handles", ru: "все шесть строк совпали с заявленной моделью — пик движется с p и переворачивается на CPU-ручках" } };
      },
      reference: `# The declared model, swept. Note how the winning n moves with p and how
# every CPU verdict stays below 1 — best_n there is "the least bad".
def e_tokens(p, n):
    if p >= 1:
        return float(n + 1)
    return (1 - p ** (n + 1)) / (1 - p)

def speedup(p, n, decode_ms, draft_ms, verify_ms):
    return e_tokens(p, n) * decode_ms / (n * draft_ms + verify_ms)

for p in (0.5, 0.75, 0.9):
    for kind, dec, dr, ver in (("gpu", 20, 4, 20), ("cpu", 130, 70, 650)):
        n = max(range(1, 9), key=lambda k: (speedup(p, k, dec, dr, ver), -k))
        print(f"p={p} {kind} n={n} speedup={round(speedup(p, n, dec, dr, ver), 2)}")`,
    },
    runtime: {
      title: {
        en: "Live A/B on your runtime: with the draft vs without",
        ru: "Живой A/B на твоём рантайме: с draft и без",
      },
      brief: {
        en: "The practice runtime now carries TWO engines behind one gateway: the plain one, and engine-spec — the same pinned llama.cpp with a draft model (speculative decoding, draft-simple). Tick <strong>draft model</strong> to route the experiment to the speculative engine; untick for the plain one. Both runs land in the same hash-chained journal with a <code>spec</code> field, so the chain itself records which engine produced which number. First start may download ~0.4 GB of draft weights.",
        ru: "В practice-рантайме теперь ДВА движка за одним шлюзом: обычный и engine-spec — тот же запиненный llama.cpp, но с draft-моделью (спекулятивное декодирование, draft-simple). Отметь <strong>draft-модель</strong>, чтобы отправить эксперимент в спекулятивный движок; сними флажок — в обычный. Оба прогона попадают в одну хэш-цепочку журнала с полем <code>spec</code>: сама цепочка помнит, какой движок дал какое число. Первый старт может докачать ~0.4\u00a0ГБ draft-весов.",
      },
      experimentPrompt: {
        en: "List the planets of the Solar System in order from the Sun, then repeat the same list in reverse order.",
        ru: "List the planets of the Solar System in order from the Sun, then repeat the same list in reverse order.",
      },
      specToggle: { en: "draft model (speculative)", ru: "draft-модель (спекуляция)" },
      footer: {
        en: "Honest expectation: on a CPU this A/B usually LOSES with the toggle on — the measured slowdown is the lab's point, not a bug. Where speculation wins: GPU batch verification and prompt-reuse (n-gram lookup). The journal entry carries a spec field, and the gateway's verifier is GET /journal/verify.",
        ru: "Честное ожидание: на CPU этот A/B с флажком обычно ПРОИГРЫВАЕТ — измеренное замедление и есть смысл лабы, а не баг. Где спекуляция выигрывает: GPU-батч-верификация и переиспользование промпта (n-gram lookup). Запись журнала несёт поле spec; собственный верификатор шлюза — GET /journal/verify.",
      },
    },
    posttest: [
      {
        id: "p1",
        q: { en: "When can speculative decoding actually deliver its promised speedup?", ru: "Когда спекулятивное декодирование способно реально дать обещанное ускорение?" },
        options: [
          { en: "When verification is one batched pass (GPU-class hardware) and the acceptance rate is high", ru: "Когда верификация — один батч-проход (GPU-железо) и acceptance rate высокий" },
          { en: "On any hardware, as long as the draft model exists", ru: "На любом железе, лишь бы draft-модель существовала" },
          { en: "When the draft model is larger than the main model", ru: "Когда draft-модель больше основной модели" },
        ],
        answer: 0,
        explain: { en: "The formula's silent assumption is a cheap batched verify pass; CPU verification prices the candidate tail token-by-token, and the A/B measures the loss.", ru: "Молчаливое предположение формулы — дешёвый батч-verify; CPU-верификация оценивает кусок кандидатов потокенно, и A/B измеряет проигрыш." },
      },
      {
        id: "p2",
        q: { en: "The draft's token at position k is rejected. What does the cycle earn?", ru: "Draft-токен на позиции k отвергнут. Что зарабатывает цикл?" },
        options: [
          { en: "k accepted tokens plus the correction token from the verify pass — the cycle ends there", ru: "k принятых токенов плюс коррекционный токен от verify-прохода — на этом цикл кончается" },
          { en: "Nothing: all n draft tokens are discarded and the cycle is wasted", ru: "Ничего: все n draft-токенов выбрасываются, цикл впустую" },
          { en: "The whole n + 1 ceiling anyway — rejection costs nothing at all", ru: "Весь потолок n + 1 как ни в чём не бывало — отказ вообще ничего не стоит" },
        ],
        answer: 0,
        explain: { en: "Cheap rejection is the mechanism: verify already produced the correction token, so a cycle at first rejection still earns k + 1 tokens — that is exactly what E sums.", ru: "Дешёвый отказ — сам механизм: verify уже выдал коррекционный токен, поэтому цикл с отказом на первой позиции всё равно зарабатывает k + 1 токен — именно это суммирует E." },
      },
      {
        id: "p3",
        tag: { en: "bridge · T03", ru: "мост · T03" },
        context: { en: "T03 priced quantization: coarser scales, smaller weights. Our runtime's draft is the SAME Qwen2.5-0.5B weights in Q2_K — quantization reused as a draft.", ru: "T03 оценивала квантование: грубые масштабы, меньшие веса. Draft в нашем рантайме — ТЕ ЖЕ веса Qwen2.5-0.5B в Q2_K: квантование переиспользовано как draft." },
        q: { en: "Why must the draft model share the tokenizer vocabulary with the main model?", ru: "Почему draft-модель обязана делить словарь токенизатора с основной моделью?" },
        options: [
          { en: "Draft tokens are vocabulary ids the main model must verify directly — a different vocabulary would make every draft proposal unmatchable", ru: "Draft-токены — это id словаря, которые основная модель верифицирует напрямую: чужой словарь сделал бы каждое draft-предложение непроверяемым" },
          { en: "Because coarser quantization only works when vocabularies match", ru: "Потому что грубое квантование работает только при совпадающих словарях" },
          { en: "It does not have to — the gateway translates ids between models", ru: "Не обязана — шлюз переводит id между моделями" },
        ],
        answer: 0,
        explain: { en: "The verify pass compares id-by-id with greedy decoding of the main model; same family (Qwen2.5) guarantees the same vocabulary, and the coarser Q2_K quant only makes the draft cheaper per token.", ru: "Verify-проход сверяет id за id с жадным декодированием основной модели; одна семья (Qwen2.5) гарантирует общий словарь, а более грубое квантование Q2_K лишь удешевляет draft-токен." },
      },
    ],
    reward: {
      caption: { en: "Predicted, swept, measured: you can now say exactly when the draft helps — and prove it with your own A/B.", ru: "Предсказано, развёрнуто, измерено: ты теперь точно говоришь, когда draft помогает, — и доказываешь это собственным A/B." },
    },
    footer: {
      en: "Declared teaching model (i.i.d. acceptance, constant per-pass costs) — not a vLLM measurement. Live A/B numbers are your machine's, honest whatever they are; on a CPU the draft engine usually loses to the plain one. Runtime facts: both engines use the same pinned llama.cpp image; the draft is the same Qwen2.5-0.5B weights in Q2_K (sha256 9ee36184…), speculative type draft-simple.",
      ru: "Заявленная учебная модель (i.i.d. acceptance, постоянные цены проходов) — не измерение vLLM. Числа живого A/B — твоей машины, честные, какими бы ни были; на CPU draft-движок обычно проигрывает обычному. Факты рантайма: оба движка — один запиненный образ llama.cpp; draft — те же веса Qwen2.5-0.5B в Q2_K (sha256 9ee36184…), тип спекуляции draft-simple.",
    },
  };
})();
