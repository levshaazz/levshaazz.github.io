# Topic 02: one concrete prompt, recorded token by token

This is an **instrumented teaching replay, not a benchmark**. It does not replace
the 50-trial [protocol-v2 experiment](../2026-09-30-topic02-protocol-v2/README.md),
the private judge reference, or any quality evaluation.

## Exact request and answer

System message:

```text
You are a helpful assistant. Reply with only the requested numbers.
```

User message:

```text
Continue the sequence with three numbers: 2, 4, 6,
```

Actual pinned tokenizer chat wrapper (`add_generation_prompt=True`):

```text
<|im_start|>system
You are a helpful assistant. Reply with only the requested numbers.<|im_end|>
<|im_start|>user
Continue the sequence with three numbers: 2, 4, 6,<|im_end|>
<|im_start|>assistant
```

The final assistant-prefix newline is part of the input. The model receives
**42 input tokens**, not just the visible user sentence. `replay.json` records
every input ID, tokenizer piece and decoded text, including whitespace and
special tokens. No token strings or IDs were manually fabricated.

Actual user-visible answer:

```text
8, 10, 12
```

Actual selected output IDs: `[23, 11, 220, 16, 15, 11, 220, 16, 17, 151645]`.
They decode to `8`, `,`, space, `1`, `0`, `,`, space, `1`, `2`, `<|im_end|>`.
The tokenizer piece `Ġ` represents a space in this example; it is not a literal
character printed to the user. There are **three numbers but ten output tokens
including EOS**. The numbers `10` and `12` each occupy two digit tokens here.
Generation stopped naturally at `<|im_end|>` on token 10, below the cap of 24.
This is an observation for this request/runtime, not a guarantee for other prompts.

## Read the replay

The full prompt is processed once with input shape `[1, 42]`. That forward selects
the first output token, `8` (ID 23), and leaves 42 positions in KV. The next
forward consumes **that ID 23**, with input shape `[1, 1]`, selects the comma,
and leaves 43 positions in KV. Continue this dependency chain to EOS:

| Selected output | Input to this forward | KV before → after | Synchronized wall (ms) |
|---|---|---|---:|
| `8` | Full 42-token chat | 0 → 42 | 19.63 |
| `,` | `8` / ID 23 | 42 → 43 | 81.22 |
| space | `,` / ID 11 | 43 → 44 | 28.60 |
| `1` | space / ID 220 | 44 → 45 | 20.45 |
| `0` | `1` / ID 16 | 45 → 46 | 33.23 |
| `,` | `0` / ID 15 | 46 → 47 | 16.89 |
| space | `,` / ID 11 | 47 → 48 | 68.21 |
| `1` | space / ID 220 | 48 → 49 | 17.70 |
| `2` | `1` / ID 16 | 49 → 50 | 55.27 |
| `<|im_end|>` | `2` / ID 17 | 50 → 51 | 16.75 |

**Final KV is 51 = 42 + 10 − 1**, not 52: EOS was selected but never fed back
through another forward. Nine decode forwards follow the first selection from
prefill. The model has 28 layers, two KV heads, head dimension 128 and FP16 cache,
so the logical KV payload is `2 × 28 × 2 × 128 × 2 = 28,672 B/token`.
At 51 retained positions that is 1,462,272 B (1.3945 MiB), a configuration-derived
payload, **not** the whole measured allocator footprint.

The JSON also records current/peak allocated and reserved bytes after each step.
Peaks are reset before each forward+argmax and include the loaded model.
For the first selection: current allocated 3,123,106,304 B; peak allocated
3,125,901,824 B; reserved 3,323,985,920 B. Allocated is a subset of reserved;
never add these counters. After in-process release, 32 MiB remained allocated
and reserved; do not label that stage zero-memory. After process exit,
`nvidia-smi` reported **0 MiB and no GPU compute process**.

## Method, provenance and limitations

- Clean measured source: `a621fdd35d5ac6bd15bb2f9d193f7d5def3eacb6`.
- Pinned `Qwen/Qwen2.5-1.5B-Instruct`, revision
  `989aa7980e4cf806f80c7fef2b1adb7bc71aa306`; local persistent cache only.
- RTX 5070 Ti, driver 591.86, Python 3.12.13, PyTorch 2.14.0+cu130,
  Transformers 4.51.3, FP16, requested/selected SDPA, `logits_to_keep=1`.
- One untimed same-prompt natural-EOS warmup and one instrumented replay;
  greedy argmax, batch 1, maximum 24 generated tokens.
- Each interval contains the forward and argmax, synchronized before starting
  and after ending. CPU token extraction, string decoding, resource checks and
  model loading are outside each interval. CUDA-event time spans host launch
  gaps; it is not the sum of kernel durations.
- Per-token synchronization, event creation and observation perturb execution.
  The 16.75–81.22 ms decode-step variation is retained, not smoothed away.
  Do not infer punctuation cost, bottleneck cause, HTTP TTFT/TPOT, p95,
  production capacity or a throughput improvement from this single replay.
- The runtime emitted its SDPA/sliding-window support warning. We record the
  requested/selected backend, not an independently verified kernel choice.
- A read-only preflight verified an idle GPU, cached snapshot and 69.34 GiB
  available RAM. The measured process ran inside a verified 24 GiB cgroup with
  zero swap and external `timeout -k 10s 180s`. Per-step gates require at least
  24 GiB available host RAM and no more than 12 GiB device-used memory.
- End-to-end runner duration was 47.669 s including model loading, warmup and
  cleanup. This is not the answer latency.

### Prompt refinement is explicit

The first design attempt used only `You are a helpful assistant.` as the system
message. It reached the 24-token cap while explaining the sequence:
`The sequence you provided is an arithmetic sequence where each term increases by 2. Therefore, the next three numbers in the`.
Its source was `ff80bfd7b4c9c226d321d228ef6310a57caa36ce`; the raw attempt remains
in the ignored rehearsal cache. We added the explicit answer-format instruction
and made **one** further bounded run. The user message was unchanged. This
refinement was for a complete, teachable answer, not to select a favorable timing.
Neither the first attempt nor the final request measures model quality.

## Files and safe reproduction

- `replay.json`: sanitized input/output tokens, every dependency/cache step,
  exact measured intervals and allocator counters, and resource samples.
- `provenance.json`: clean source and source-file hashes, pinned environment,
  verified cgroup limits, duration and the replay SHA-256.
- `teaching/topic02_prompt_demo.py`: CPU-importable replay validation and live
  `run_demo(model_path)` implementation; no downloads.
- `scripts/run_topic02_prompt_demo.py`: read-only preflight by default;
  `--execute` also requires a clean checkout and a verified limited cgroup.
- `scripts/test_topic02_prompt_demo.py`: CPU regression checks for token
  dependency, EOS, cache lag, allocator nesting and recorded replay validity.

For class presentation, use the committed replay: no model load, network or GPU
is necessary. A fresh optional instructor replay follows the host procedure in
`seminars/INSTRUCTOR_REHEARSAL.md`; do not schedule it alongside another GPU job.
Activate the persistent Transformers environment, set `LSM_MODEL_CACHE` to the
existing cache, and use a new ignored output path:

```bash
HF_HUB_OFFLINE=1 python scripts/run_topic02_prompt_demo.py
systemd-run --scope --property=MemoryMax=24G --property=MemorySwapMax=0 \
  env HF_HUB_OFFLINE=1 LSM_MODEL_CACHE="$LSM_MODEL_CACHE" \
  timeout -k 10s 180s python scripts/run_topic02_prompt_demo.py \
  --execute --output .cache/rehearsals/topic02-prompt-new-attempt
```

The output directory must not already exist. Do not remove persistent weights,
package environments or prior evidence. Stop on any resource/validation failure.
