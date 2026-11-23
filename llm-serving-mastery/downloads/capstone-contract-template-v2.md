# Capstone contract v2 · Контракт v2: две очереди (W/P/E/R/T + batch)

Mini-Infrathon capstone template, two-queue edition · LLM Serving Mastery, Topic 16.
Approved 2026-11-24 · Утверждён 24.11.2026.
The load is two queues: interactive (SLO, as in v1) + offline inference (batch, patient pool).
Нагрузка — две очереди: интерактив (SLO, как в v1) и офлайн-инференс (batch, терпеливый пул).
Заполните все поля по-своему; конкретика ценится выше объёма.
Fill every field concretely; specificity is graded, not length.
Submit as `capstone/CONTRACT.md` in your private submission repository.

---

## W — workspace · рабочее пространство

- Repository/branch (репо/ветка): …
- The single file or function being optimized (оптимизируемый файл/функция): …
  (example/пример: two-queue admission policy — `policies_v2.py`, one `policy(history)` function)
- Agent boundary of change (граница права агента — file ONLY / только этот файл): …
  Anything else — tests, thresholds, the journal, the evaluator, the profiles — rejects
  the whole submission. (Правки тестов, порогов, журнала, evaluator-а, профилей
  отклоняют сдачу целиком.)

## P — public tests · публичные тесты (видны агенту)

- Correctness (корректность): … (example/пример: rights respected — `q ≤ Q_MAX=12`,
  `b ≤ B_MAX=2`; determinism; honest 429; batch drops are honest non-events)
- Determinism (детерминизм): fixed seeds, same input → same output
  (одинаковый вход → одинаковый выход)
- What the tests do NOT check (что тесты НЕ проверяют — honest list / честно перечислить): …

## E — private evaluation · приватные испытания (агенту не видны)

- Load profile (профиль нагрузки): TWO arrival streams — interactive and batch chunks. …
  (derived from real layer-2 run journals; seeds declared BEFORE the run; the file is
  unavailable to the agent / два потока заявок — интерактивный и batch-чанки;
  seeds заявлены до прогона; файл агенту недоступен)
- Metric without a ceiling (метрика без потолка):
  M2 = served_inter − 2 × timed_out_inter + 0.5 × served_batch
  (ваша формулировка может уточнять веса — no ceiling / без потолка)
- Why M2 cannot be hacked without improving the system
  (почему метрику нельзя обойти без улучшения системы): …
  (the three no-hack questions / три вопроса нехакаемости:
  1. что будет с M2 при «улучшении», ломающем интерактивный SLA?
  2. какие параметры агент НЕ может трогать (SLOTS=4, SLA_TICKS=2, W_BATCH=10,
     профили — от железа и контракта, не от кода политики)?
  3. что будет с M2 при «улучшении», которое отдаёт все слоты батчу?)

## R — resources · ресурсы

- Compute (вычисления): your CPU or the layer-2 gateway 127.0.0.1:8760, no GPU
  (ваш CPU или слой-2 шлюз, без GPU; two-queue mechanics live in the course sandbox —
  шлюз исполняет одноочередной конверт, двухочередная механика — в песочнице курса)
- Policy rights (права политики): `policy(history) -> {"q": q_t, "b": b_t}`,
  chosen before arrivals each tick (решение до заявок каждого тика)
- Limits (лимиты): `q_t ≤ 12`, `b_t ≤ 2`, ≤ 200 ticks per run
  (≤ 200 тиков на прогон)

## T — budget and stop rule · бюджет и стоп-правило

- Wall-clock (время): ≤ … h total for the capstone week (суммарно за неделю капстоуна)
- Submissions (сабмишены): ≤ … (each = a commit + an M2 measurement on E through the
  evaluator / каждый = коммит + значение M2 на E через evaluator)
- Stop rule (стоп-правило): "plateau of ≥ k submissions without improving M2" OR budget
  exhausted («плато ≥ k сабмишенов без улучшения M2» ИЛИ исчерпан бюджет);
  "the agent says it is done" is NOT a stop criterion
  («агент сказал, что готов» — НЕ стоп-критерий)

## Declaration · Декларация разделения ролей

- Agent (кто агент): … (coding agent name/version, or "manual supervision" /
  название и версия кодинг-агента или «супервизия вручную»)
- How E is physically hidden from the agent (как E физически скрыта от агента): …
  (process separation / the course judge infrastructure /
  процессное разделение / judge-инфраструктура курса)

---

## Two-queue specifics to state explicitly · Двухочередное, что надо проговорить явно

- Routing economy (экономика роутинга): an SLA timeout costs ×2, a served batch job earns
  ×0.5 — state in your own words why "give every slot to batch" loses
  (таймаут интерактива стоит ×2, обслуженный batch — кредит ×0.5; сформулируйте своими
  словами, почему «отдать все слоты батчу» проигрывает).
- Idle-slot honesty (честность ленивых слотов): slots that interactive demand does not use
  are free batch capacity — but only when the queue is genuinely empty
  (слоты, которые интерактив не занимает, — бесплатная ёмкость батча, но только когда
  очередь реально пуста).
- Window semantics (семантика окна): a batch job served within W_BATCH = 10 ticks earns
  credit; a job past the window drops with no penalty and no credit
  (работа в окне 10 тиков приносит кредит; мимо окна — отпадает без штрафа и без кредита).

## Checklist before you commit · Чек-лист перед коммитом

- [ ] All five W/P/E/R/T fields are concrete (a file, a formula, numbers — not "the project").
      Все пять полей конкретны: файл, формула, числа — не «проект вообще».
- [ ] The metric answers the three no-hack questions (SLA-breaking "improvement",
      untouchable parameters, the all-batch "improvement").
      Метрика выдерживает три вопроса нехакаемости (ломающее SLA «улучшение»,
      нетрогаемые параметры, «улучшение» «всё в батч»).
- [ ] The controller rules are checkable, not decorative.
      Правила контролёра проверяемые, не декоративные.
- [ ] The declaration names the agent (or the manual track) explicitly.
      Декларация явно называет агента (или ручной трек).
- [ ] Both queues are described: who decides what, what the window rewards, what it drops.
      Обе очереди описаны: кто что решает, что поощряет окно, что оно отпускает.
