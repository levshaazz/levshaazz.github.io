# Topic 07 — mock search validation run v2 (CPU, declared synthetic engine)

Executed 26 October 2026 by the course assistant on Colab CPU (teacher reference,
27 code cells, 0 errors). Supersedes the 2026-10-20 record's NUMBERS: that earlier
run and this one disagree on absolute values because the mock's latency is a declared
synthetic model, not a measurement — run-to-run drift is expected and honest. The
DISCIPLINE (frozen plan, one confirmatory pair, Pareto front, freeze before held-out)
is the stable content.

## Search plan (frozen before execution, incl. machine-checked discipline)
| Config | seqs | mem | chunked | Reason |
|---|---|---|---|---|
| default | 256 | 0.9 | no | Baseline |
| seqs-32 | 32 | 0.9 | no | OFAT: tail over amortization |
| pair-seqs32-chunked | 32 | 0.9 | yes | Confirmatory pair |
| mem-085 | 256 | 0.85 | no | OFAT: free VRAM for activations |
| chunked | 256 | 0.9 | yes | OFAT: protect decode from prefill |

## Result (this run, mock)
- Frozen profile: **pair-seqs32-chunked** — fastest SLO-eligible front point.
- Held-out (declared synthetic V-set, different seed/lengths): accept per the frozen
  forecast; verdict and numbers in `heldout.json` and `memo.json`.
- Final default-vs-profile experiment: gain ≈ 1.39 judge tok/s (`final-experiment.json`).

## Limits
Mock profile: declared synthetic timing — NOT a vLLM measurement; GPU-profile numbers
are a separate owner-run record. Single run; burst waves of 3 requests per client.
Wave shares and absolute throughput vary between runs by design of the synthetic model.
