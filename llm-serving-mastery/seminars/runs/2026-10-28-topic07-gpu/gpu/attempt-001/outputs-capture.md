# Console capture — 2026-10-28 GPU owner-run (attempt-001)

Provenance: transcribed from the live notebook console outputs of the owner's T4 run
(teacher reference @ `f8223e8`, 40 cells, 0 errors), verified in-session by the course
assistant on 28 Oct 2026. These are console lines, not the artifact JSONs — the JSONs
(`knob-table.json`, `search-plan.json`, `sweep-table.json`, `profile.json`,
`raw-journal.jsonl`, `heldout.json`, `memo.json`, `final-experiment.json`,
`manifest.json`, `rollback-plan.json`) are in the owner's bundle
`t07-gpu-bundle.tar.gz` and should be copied here verbatim to complete the record.

## Setup / profile
```
profile=gpu  results dir=results/gpu/attempt-001
```

## Bootstrap (t07-gpu-bootstrap)
```
pip: vllm==0.30.0 установлен с попытки 1; server pid 4230 — следующая клетка ждёт /health
```
Server command (from the cell source): `vllm.entrypoints.openai.api_server --model
Qwen/Qwen2.5-3B-Instruct --revision aa8e72537993ba99ec69dfaa6a59ed015b17504d1
--served-model-name 'submission' --port 8017 --dtype float16 --max-model-len 2048`.

## Search (mock by design on both profiles — t07-plan-check / sweep / freeze)
```
план корректен: default + 3 OFAT + 1 пара; бюджет и дисциплина соблюдены
```
Sweep table (wave 64, declared synthetic engine — same numbers as the CPU mock record):
```
default              2372.700000   862   0.000000
seqs-32              4285.200000   468   0.000000
pair-seqs32-chunked  4438.400000   450   0.000000
```
(mem-085 and chunked rows executed but their numbers were not captured in this console
pass; they sit in `sweep-table.json` in the bundle.)

## Freeze (t07-profile-todo, teacher solution)
```
❄ Замороженный профиль: pair-seqs32-chunked
```

## Held-out (t07-heldout) — REAL corpus V-split texts, wave 64
```
held-out (нагрузка V: настоящие тексты V-сплита корпуса): thr=152.7, p95=1585 мс, timeouts=0/192
❌ против SLO 800 мс — вне бюджета. Итоговый вердикт (против прогноза) — в memo, следующая клетка.
```

## Memo (t07-memo)
```
мемо записан: {'verdict': 'reject', 'reason': 'held-out p95 = 1585 мс против прогноза:
pair-seqs32-chunked: на нагрузке V жду thr в пределах ±15% о', 'promise': 'pair-seqs32-chunked: p95 <= …'}
```
(The reason ends mid-word — the known `_forecast[:60]` truncation, carried finding.)

## Final experiment (t07-final-experiment) — real engine, judge waves 32/64
```
health: default: 11%
health: pair-seqs32-chunked: 15%
GPU: прирост judge-метрики x0.63; SLO-вердикт замороженного профиля: PASS (final-experiment.json)
```

## Export (t07-export)
```
8 артефактов хэшировано; profile=gpu; bundle: /content/t07-gpu-bundle.tar.gz
```

## Teardown (t07-gpu-stop)
```
server exit code 0 - delete the runtime only after the bundle is downloaded
```
