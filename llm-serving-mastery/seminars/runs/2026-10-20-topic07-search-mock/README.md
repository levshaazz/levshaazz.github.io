# Topic 07 — mock search validation run (CPU, burst waves)

Executed 20 October 2026 by the course assistant on Colab CPU (mock profile).
Pinned model identity declared; the mock tuning server is a declared synthetic
queue, NOT a measurement of vLLM.

## Search plan (frozen before execution)
| Config | seqs | mem | chunked | Reason |
|---|---|---|---|---|
| default | 256 | 0.9 | no | Baseline |
| seqs-32 | 32 | 0.9 | no | Tail over amortization |
| seqs-64 | 64 | 0.9 | no | Round 03 precedent |
| mem-085 | 256 | 0.85 | no | Free VRAM for activations |
| chunked | 256 | 0.9 | yes | Protect decode from prefill |

## Result (wave 64, mock)
| Config | thr (tok/s) | p95 (ms) | errors |
|---|---|---|---|
| default | 5157 | 566 | 0/192 |
| seqs-32 | 4439 | 460 | 0/192 |
| seqs-64 | 4790 | 497 | 0/192 |

Frozen profile: **seqs-32** (best p95, clears SLO 800ms).
Held-out (V-split texts): thr=4438, p95=460ms, 0 timeouts — **accept**.

## Limits
Mock profile: declared synthetic model. GPU profile (owner-run) produces the
measured evidence. Single run; burst waves of 3 requests per client.
