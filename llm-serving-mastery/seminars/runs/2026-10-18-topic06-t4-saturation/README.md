# Topic 06 — measured T4 saturation run (single, burst waves)

Executed 18 October 2026 by the course assistant under explicit owner authorization,
on a Colab Tesla T4 (15360 MiB), pinned Qwen/Qwen2.5-3B-Instruct revision
aa8e72537993ba99e69dfaafa59ed015b17504d1, vLLM 0.30.0, frozen public corpus
(topic06-purpose-v4, D-split, A-short bin), temperature 0, max 32 output tokens.

- Waves 8/32/64/128 closed-loop clients, 3 requests per client: output throughput
  68.4 / 105.5 / 346.6 / 459.9 tok/s; every request completed — zero timeouts.
- Natural-EOS classification replies carry ~2 output tokens: this workload did not
  saturate the GPU inside the tested range. Knee at wave 64 by the ≥50% gain rule.
- TTFT p50/p95 per wave (ms): 186/332, 306/1241, 334/358, 487/676 — single-run
  jitter retained (the wave-32 p95 spike is data, not an outlier to drop).
- S6 interference: dev pairs at K ∈ {1,2,4,8,16} and one held-out pair at frozen
  K=4 (A throughput ratio 0.11, p95 ratio 3.04 versus dev 0.38/1.07 — honest
  between-pair variance).

Limits: burst waves of 1–2 s wall, a single run, natural EOS — not the judge
protocol (sustained, ignore_eos 256) and not a capacity claim for other workloads.
Machine-readable copy: `waves.json`. Raw per-request journal and the executed
notebook remain private (instructor/reviews/.../colab-gpu-v1) because they embed
the full corpus render and runtime metadata.
