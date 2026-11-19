# Capstone contract · Контракт длинной оптимизации (W/P/E/R/T)

Mini-Infrathon capstone template · LLM Serving Mastery, Topic 16.
Заполните все поля по-своему; конкретика ценится выше объёма.
Fill every field concretely; specificity is graded, not length.
Submit as `capstone/CONTRACT.md` in your private submission repository.

---

## W — workspace · рабочее пространство

- Repository/branch (репо/ветка): …
- The single file or function being optimized (оптимизируемый файл/функция): …
  (example/пример: Lab 08 gateway admission policy — `runtime/gateway/app.py`, function `admit()`)
- Agent boundary of change (граница права агента — file ONLY / только этот файл): …
  Anything else — tests, thresholds, the journal, the evaluator — rejects the whole submission.
  (Правки тестов, порогов, журнала, evaluator-а отклоняют сдачу целиком.)

## P — public tests · публичные тесты (видны агенту)

- Correctness (корректность): … (example/пример: 200 on slot pass, 429 on overflow,
  honest Retry-After, queue ≤ limit invariant)
- Determinism (детерминизм): fixed seed, same input → same output (одинаковый вход → одинаковый выход)
- What the tests do NOT check (что тесты НЕ проверяют — honest list / честно перечислить): …

## E — private evaluation · приватные испытания (агенту не видны)

- Load profile (профиль нагрузки): … (derived from real layer-2 run journals;
  seed declared BEFORE the run; the file is unavailable to the agent /
  строится из журналов реальных прогонов layer-2; seed заявлен до прогона; файл агенту недоступен)
- Metric without a ceiling (метрика без потолка): M = … (formula/формула)
- Why M cannot be hacked without improving the system
  (почему метрику нельзя обойти без улучшения системы): …

## R — resources · ресурсы

- Compute (вычисления): your CPU or the layer-2 gateway 127.0.0.1:8760, no GPU
  (ваш CPU или слой-2 шлюз, без GPU)
- Limits (лимиты): … (example/пример: ≤ N requests per tick, ≤ 200 ticks per run)

## T — budget and stop rule · бюджет и стоп-правило

- Wall-clock (время): ≤ … h total for the capstone week (суммарно за неделю капстоуна)
- Submissions (сабмишены): ≤ … (each = a commit + an M measurement on E through the evaluator /
  каждый = коммит + значение M на E через evaluator)
- Stop rule (стоп-правило): "plateau of ≥ k submissions without improving M" OR budget exhausted
  («плато ≥ k сабмишенов без улучшения M» ИЛИ исчерпан бюджет);
  "the agent says it is done" is NOT a stop criterion
  («агент сказал, что готов» — НЕ стоп-критерий)

## Declaration · Декларация разделения ролей

- Agent (кто агент): … (coding agent name/version, or "manual supervision" /
  название и версия кодинг-агента или «супервизия вручную»)
- How E is physically hidden from the agent (как E физически скрыта от агента): …
  (process separation / the course judge infrastructure /
  процессное разделение / judge-инфраструктура курса)

---

## Checklist before you commit · Чек-лист перед коммитом

- [ ] All five W/P/E/R/T fields are concrete (a file, a formula, numbers — not "the project").
      Все пять полей конкретны: файл, формула, числа — не «проект вообще».
- [ ] The metric answers the three no-hack questions (SLA-breaking "improvement",
      untouchable parameters, exact-commit verification).
      Метрика выдерживает три вопроса нехакаемости (ломающее SLA «улучшение»,
      нетрогаемые параметры, проверка точного коммита).
- [ ] The controller rules are checkable, not decorative.
      Правила контролёра проверяемые, не декоративные.
- [ ] The declaration names the agent (or the manual track) explicitly.
      Декларация явно называет агента (или ручной трек).
