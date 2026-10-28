# Topic 07 — first measured GPU owner-run (T4, vLLM 0.30.0, Qwen2.5-3B-Instruct): the mock's pick was refuted

Executed 28 October 2026 by the course owner on Colab T4 (owner-run; the free-CPU runs
stay with the course assistant). Teacher reference at commit `f8223e8` (40 cells, the
post-audit-3 package with the A–G visual pass), Run all, **0 cell errors** end to end,
clean teardown (`server exit code 0`), export `8 артефактов хэшировано; profile=gpu`.

This record documents the run's **measured** results and one honest headline: the
mock-calibrated search choice did **not** survive contact with the real engine. The
notebook's honesty machinery worked exactly as designed — the forecast was falsified,
the badge turned red, and the memo recorded `verdict: reject`.

## Provenance caveat (read first)
The numbers below were **captured from the live notebook console outputs** during the
run (verified in-session by the course assistant), not copied from the artifact JSONs.
The JSON artifacts themselves (`heldout.json`, `final-experiment.json`, `memo.json`,
`manifest.json` with sha256s, etc.) live in the owner's downloaded bundle
`t07-gpu-bundle.tar.gz`; they should be dropped into `gpu/attempt-001/` to complete
this record. Until then this is a **console-captured record, artifacts pending**.
Single run; one engine; not a benchmark.

## Environment
- Colab T4 GPU (owner-run), 28 Oct 2026.
- vLLM 0.30.0 (pinned), installed on pip attempt 1; server pid 4230.
- Served model: `Qwen/Qwen2.5-3B-Instruct` @ revision `aa8e7253…504d1`,
  `--max-model-len 2048`, dtype float16, port 8017.

## What was measured
### Held-out (the honest failure)
- Load: **real corpus V-split texts** (not the mock's synthetic V-set), wave 64,
  frozen profile, one run: **thr = 152.7 tok/s, p95 = 1585 ms, timeouts 0/192**.
- SLO badge: ❌ **1585 ms > 800 ms — вне бюджета**.
- Memo: **`verdict: reject`**, reason «held-out p95 = 1585 мс против прогноза: …».
  (The reason string is visibly cut mid-word — the known `_forecast[:60]` truncation,
  carried finding from the audits, still unfixed by owner decision.)

### Final experiment: default vs frozen profile (real engine, judge waves 32/64)
- Judge gain: **×0.63** — the frozen profile (seqs 32 + chunked prefill) was *slower*
  than default on the real engine.
- SLO-вердикт printed by the final cell: **PASS** (judge waves are lighter than the
  wave-64 held-out; exact per-wave numbers are in `final-experiment.json` in the
  bundle). The contrast between this PASS and the held-out REJECT is itself the
  lesson: SLO verdicts are conditional on the load they were measured under.
- Health during the final: default ≈ 11%, profile ≈ 15% (console lines).

### Search (unchanged, still mock by design)
The sweep runs on the declared synthetic engine **on both profiles** — the search
numbers in this run are the same mock story as `2026-10-26-topic07-search-mock-v2`
(default 2372.7@862, seqs-32 4285.2@468, pair 4438.4@450, front = pair). Only the
held-out and the final experiment produce vLLM measurements.

## What this means (the teaching point)
The mock promised ×1.39 and a comfortable SLO pass; the engine answered ×0.63 and a
1585 ms tail. The mechanism story "fewer seqs → shorter ticks → gentler tail" did not
transfer: real vLLM on T4/Qwen-3B pays the small-batch amortization cost faster than
the mock's quadratic queue penalty pays off. The record is the first measured instance
of the book's rule "when the mock and the gpu profile disagree, the gpu wins" — and
the pipeline (plan → sweep → freeze → forecast → held-out → memo) caught the
disagreement exactly as designed. A refuted forecast recorded honestly is a result,
not a failure.

## Limits
One run, one engine (T4), one model (Qwen2.5-3B-Instruct at context 2048); the judge
gain is a single-sample ratio. Nothing here establishes that pair-seqs32-chunked is
universally bad — only that on this engine, at this context, under these loads, the
mock's choice failed its own SLO. The artifact JSONs are pending from the owner's
bundle; until they are dropped in, treat every number here as console-captured.
