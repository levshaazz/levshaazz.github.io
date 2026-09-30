# Topic 02 — bounded protocol-v2 teaching rehearsal

Source: clean `8074c6a7260e533af0d88e5ba42e3b671a0766dd`, 30 September 2026.
RTX 5070 Ti, driver 591.86, PyTorch 2.14.0+cu130, Transformers 4.51.3, FP16,
requested SDPA, last-position logits. Pinned model revisions are in `results.json`.

- `results.json`: all 50 raw core trials, model/config details and resource samples.
- `summary.json`: medians and min/max, deterministically derived from those trials.
- `provenance.json`: allowlisted source/runtime/resource provenance; no machine paths.
- `profiles.json`: sanitized aggregates from two focused traces, with hashes of local originals.

The offline notebook completed all seven code cells in **190.248 seconds**, including a small-model
smoke, the two-model core and two short profiles. Maximum core allocated memory was **3.271 GiB**.
Between-cell GPU samples remained at or below 333 MiB after model release; these are **not peaks**.
After process exit, a separate device query returned to **14 MiB**, its pre-run state.
Execution used a 24-GiB host-memory scope, no extra swap and a 2400-second external wall timeout.
The runner's 24-GiB host-free / 12-GiB device-used gates were retained. No downloads or judge runs.

## What it establishes

Both models completed the specified B1 input 128/4096 × output 32/128 matrix and the matched
B4/128/32 case, five trials each. Output counts, final KV length, rate arithmetic and all required
cases passed the CPU artifact validator. Results are synchronized wall and CUDA-event intervals,
not HTTP TTFT/TPOT. Decode numerator is `B × (O−1)`.

The 1.5B B1/128/32 row has median decode 839.2 ms (range 834.5–1255.3), or 36.9 aggregate tokens/s.
B4/128/32 has 799.1 ms (762.9–1200.4), or 155.2 tokens/s. Do not generalize the median ratio:
per-sequence cadence ranges overlap and five trials have substantial variation. The B1/128 prefill
medians also differ between output-label groups (22.3 versus 64.6 ms), although future decode
length is not an input to that prefill call. That unresolved variation is a teaching finding,
not a reason to select a flattering subgroup or declare a stable capacity baseline.

## Focused trace boundary

Each profile uses only 0.5B, B1, P=128 or 4096, O=8. The publisher selects physical Chrome-trace
`cat=kernel`, `ph=X` intervals and computes their union, avoiding double-counting overlap.
For P128: 8304 kernel events, union 33.331 ms inside a 322.362 ms first-to-last-kernel span.
For P4096: 8400 events, union 82.421 ms inside a 300.923 ms span.
The remainder is **outside recorded kernel events**, not necessarily idle GPU time: copies and
other activity are excluded, and profiling perturbs execution. This motivates investigating
launch/host scheduling, but does not prove a particular root cause or production improvement.

Selected `aten::` attributions are separate representations of work, not additional disjoint time
buckets. Do not add them to the physical-kernel union. Raw traces and executed notebook remain in
ignored local storage because they contain machine metadata; hashes permit operator-side audit.

## Limits

This is one teaching rehearsal, not a judge reference, sustainable-capacity benchmark, quality
evaluation, fleet result or p95 estimate. Inputs are repeated synthetic token IDs; EOS is ignored;
static equal-length batches have no real arrival/queue/padding behavior. Timing variance remains
unresolved. Protocol v1 used different logits/warmup/order/clock handling: cross-version numbers
are not a controlled speedup. No Round 01 configuration, seed or threshold changed.
