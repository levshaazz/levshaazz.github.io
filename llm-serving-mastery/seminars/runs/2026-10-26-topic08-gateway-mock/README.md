# Topic 08 — gateway mock validation run (CPU, FastAPI + declared mock engine)

Executed 26 October 2026 by the course assistant on Colab CPU (free tier), running
the Topic 08 teacher reference end to end: 23 code cells, 0 errors. The backend is
the declared synthetic MockEngine behind a REAL FastAPI/uvicorn gateway — mock
numbers are NOT measurements of vLLM; the live-engine demonstration is a separate
owner run and is not part of this record.

## What this run proves (contract level, mock timing)
- Admission envelope: the overload drill (24 clients against slots 4+4) yields
  8 completed / 16 rejected-with-429 — exactly the frozen Block-0 envelope.
- Cancellation: with the disconnect watcher attached, the leaving client's request
  ends `cancelled` and the wasted-token count is recorded (declared arithmetic);
  the orphan probe (watcher off) shows the same generation burning to completion.
- Honest errors: invalid request → 400; stopped engine → 503; never 200-with-error-body.
- Waves over the gateway: wave 8 → 75/0/25 % completed/rejected/cancelled,
  wave 24 → 29/67/4 % (7/16/1 of 24 rows; the single cancelled row is the cancel
  drill's r32). Run-to-run the shares jitter — the cancelled slice especially —
  so read the shape (a third completed, two-thirds refused), not the exact digits.

## Artifacts
- `mock/attempt-001/api-contract.json` — Block-0 prediction, frozen before any gateway code.
- `mock/attempt-001/overload-drill.json` — per-request outcomes of the 24-client drill.
- `mock/attempt-001/cancel-drill.json`, `error-drills.json` — failure-mode proofs.
- `mock/attempt-001/wave-shares.png` — outcome shares per wave (gateway decisions).
- `mock/attempt-001/metrics-snapshot.json`, `gateway-memo.json` — /metrics counters and the frozen SLO memo.
- `mock/attempt-001/manifest.json` — sha256 of the artifacts above.

## Limits
Declared synthetic latency knobs; single run; the memo's promise/refusal sentences
are intentional student-authoring fields (left as TODO in the teacher copy — there
is no single correct wording). GPU-profile demonstration (live vLLM behind the same
gateway) remains an owner-run record and is not claimed here.
