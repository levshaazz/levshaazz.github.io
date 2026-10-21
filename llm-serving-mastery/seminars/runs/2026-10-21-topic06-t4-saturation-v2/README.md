# Topic 06 — measured T4 saturation run v2 (single, burst waves, owner-executed)

Executed 21 October 2026 by the course owner, on a Colab Tesla T4 (15360 MiB),
pinned Qwen/Qwen2.5-3B-Instruct revision aa8e72537993ba99e69dfaafa59ed015b17504d1,
vLLM 0.30.0, frozen public corpus (topic06-purpose-v4, D-split, A-short bin),
temperature 0, max 32 output tokens, current notebook revision (v3.6 teacher
reference execution, sha256 5b2eb062…b2e0e39).

- Waves 8/32/64/128 closed-loop clients, 3 requests per client: output throughput
  29.0 / 207.8 / 305.8 / 310.7 tok/s; every request completed — zero timeouts.
- Wave 8 is first-warmup data: wall 1.66 s (longest of all waves) and p95 TTFT
  1270 ms are CUDA-graph capture on the first wave, not steady state.
- After warmup the curve flattens: 32→64 gains +47%, 64→128 gains +2%. Knee at
  wave 32 by the ≥50% gain rule — identical to the frozen arithmetic prediction
  (ceiling 125 requests) written before the run.
- Throughput plateaus while the tail climbs: p95 TTFT 324 → 478 → 1076 ms across
  waves 32/64/128. The box fills where throughput alone cannot show it.
- S6 interference: dev K ∈ {1,2,4,8,16} A-throughput ratios
  0.11/0.39/0.55/0.83/1.11; frozen K=4; held-out pair (V-split) at K=4:
  A ratio 0.14, p95 ratio 2.27, B completed 48 — A degraded harder than dev
  predicted; between-pair variance is the point of held-out validation.

Versus the 18 October 2026 run (68.4 / 105.5 / 346.6 / 459.9 tok/s, knee 64):
both runs agree on zero timeouts and no collapse inside the tested range;
burst waves on a shared T4 moved both the points and the knee between runs.
Quote γ and the run count with every knee claim. The prior run stays published
unchanged at ../2026-10-18-topic06-t4-saturation/.

Limits: burst waves of 0.9–2.5 s wall, a single run, natural EOS (~2 output
tokens) — not the judge protocol (sustained, ignore_eos 256) and not a capacity
claim for other workloads. Machine-readable copy: `waves.json`. Raw per-request
journal and the executed notebook remain private
(instructor/reviews/topic06-authoring/student-notebook-v2/colab-gpu-v2) because
they embed the full corpus render and runtime metadata.
