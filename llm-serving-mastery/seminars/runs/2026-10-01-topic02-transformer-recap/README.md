# Topic 02: a real decoder block, one prompt and two forwards

This is **educational activation evidence, not a performance benchmark**. A single
bounded offline run executed exactly one prefill and one decode, with no warmup,
retry, downloads, full generation, synthetic matrix or judge work.

## Literal request and observed selections

```text
System: You are a helpful assistant. Reply with only the requested numbers.
User: Continue the sequence with three numbers: 2, 4, 6,
```

The complete rendered chat and all 42 actual input IDs are in `capture.json`.
The last prompt position is **41 (zero-based), token ID 198, newline `\n`**, the
newline after the assistant-role prefix. It is not the user digit `6`.

| Forward | Input IDs | Prediction row | Greedy choice | Retained KV positions per layer |
|---|---|---|---|---|
| Prefill | all 42 chat IDs | position 41 | `8`, ID 23 | 42 |
| Decode | `[23]` | position 42 | `,`, ID 11 | 43 |

The `8` enters the cache only when it is fed into the second forward. The selected
comma has **not** been fed back and has no K/V entry at the end of this capture.
The full `8, 10, 12` response belongs to the separately recorded concrete-prompt
replay, not to these two forwards.

After prefill, top-1 logit is 30.21875 and its full-vocabulary FP32-softmax
probability is 0.9910440444946289. After decode, comma's logit is 27.40625 and its
probability is 0.999904990196228. `top5` retains actual IDs, pieces, decoded text,
logits and probabilities. The probabilities were normalized over all **151,936**
vocabulary entries, not re-normalized over the five displayed candidates. Greedy
selection uses argmax logits; the probabilities are an explanatory readout, not a
sampling operation or a calibrated confidence claim.

## Configuration and observation boundary

- Model: `Qwen/Qwen2.5-1.5B-Instruct` at immutable revision
  `989aa7980e4cf806f80c7fef2b1adb7bc71aa306`.
- RTX 5070 Ti, FP16 weights/activations, Transformers 4.51.3, PyTorch
  2.14.0+cu130. The checkpoint's default BF16 was explicitly overridden to FP16.
- 28 separately parameterized decoder layers; width 1536; MLP width 8960;
  12 query heads, 2 KV heads; head width 128; RMSNorm epsilon 1e-6.
- The requested and selected backend was SDPA. `output_attentions=False` remained
  explicit. A transparent wrapper called the original SDPA function unchanged,
  then copied small layer-0 observations to CPU. No eager-attention fallback was
  requested and no attention implementation was replaced by the reconstruction.
- Module hooks copied layer-0 input/norm/projection/attention/residual/MLP values.
  The exact 42/1-position tensors were inspected in memory; the public file keeps
  only selected first-eight-feature slices and one reconstructed attention row.
  Other decoder layers retain only K/V shapes and lengths.
- **`steps[*].layer0.tensors.final_norm` is the final model norm after all 28
  decoder layers**, not a norm inside layer 0. Its placement in the shared tensor
  ledger is a schema convenience. Logits follow this final norm.

## How to read the data

`steps[0]` is prefill and `steps[1]` is decode. Each tensor record contains its
full logical shape, `slice_prefix_indices`, explicit feature indices `[0..7]`,
and actual FP16 values converted losslessly to JSON numbers in `first8`.

- `[0, 41]` means batch 0, input position 41; `[0, 0]` in decode means the only
  local input row, whose absolute position is 42.
- `[0, 0, 41]` means batch 0, head 0, input position 41. Q/K/V head slices are
  head 0, not a flattened mixture of heads. The query-to-KV mapping is Q heads
  0–5 to KV head 0, and Q heads 6–11 to KV head 1.
- `q_projection/k_projection/v_projection` are actual affine outputs including
  biases. `*_heads` are reshape/transpose views before RoPE.
- `q_rotated/k_rotated` are post-RoPE states; K/V cache records span 42 then 43
  positions, whereas the new rotated K tensor spans 42 then 1 positions.
- `attention_heads` is actual SDPA output before head concatenation;
  `attention_concat` is the actual input to the output projection;
  `attention_output` is the output projection result before the first residual.
- `gate`, `up`, `silu`, `product`, `down` and both residual sums are hook-observed
  tensors from the actual MLP/block forward, not invented illustrative values.
- `rmsnorm` contains the full-width mean-square and inverse RMS plus scale
  weights for the displayed features. Do not calculate RMS from only first8.
- `rope_pairs` uses the implementation's paired features **0 and 64**, not 0
  and 1. The first-half/second-half convention follows `rotate_half`.

`attention_reconstruction` is expressly labeled **CPU FP32 reconstruction; not
observed SDPA weights**. It uses captured post-RoPE Q/K and cached V for query
head 0 / KV head 0. The final query can attend to every currently cached key;
there are no padding or future-key entries in this row. Its scores, stable
softmax and weighted V explain the mathematics. They do not expose native
kernel intermediates, identify a specific CUDA SDPA kernel, or explain the
model's semantic reasoning. The toy example separately demonstrates masked
future entries for an earlier query.

## Numerical checks and tolerances

Sixteen invariants passed on each forward. Residual sums, SiLU, gated product,
and RoPE matched the corresponding FP16 reconstruction exactly in this run.
The maximum RMSNorm absolute discrepancy was 0.0009765625. The largest checked
linear-projection discrepancy was 0.0026369094848632812; these checks recompute
only the last row's first eight outputs in CPU FP32 using actual weights and
biases. They are not complete all-feature GEMM checks.

The selected attention-row CPU FP32 reconstruction differed from actual SDPA
output by at most 0.0003616809844970703 (prefill) and 0.0008528232574462891
(decode). Recorded tolerances were fixed in the clean source **before** the
run: exact residual sums, 0.004 norm/SiLU/product, 0.008 RoPE, 0.05 checked
linear slices and 0.025 attention row. FP16 fused/reduction arithmetic need not
be bit-identical to CPU FP32 explanatory calculations.

The CPU-only public validator subsequently gained stricter inventory, phase,
position, finite-value, resource, privacy and failing-fixture tests. This did
not change or repeat the capture. Its FP64 scale cross-check allows the derived
FP32 scalar-conversion/division error bound, not an empirically fitted tolerance.

## Safety, provenance and limits

Clean measured source: `17a8cbc74ee572656f1053d4b6a14141b4572eb0`; exact source
hashes are in `provenance.json`. The capture's normalized-LF SHA-256 is
`a906a242fb9ab3e781f639ae516e9ff1904b26f111df1830d112b3bf3783b694`.

Read-only preflight passed with 69.35 GiB host RAM available and 0 MiB GPU use.
The effective cgroup—not just command flags—was checked as 24 GiB memory max
and zero swap; an external 180-second wall timeout and the unchanged >=24 GiB
host-headroom / <=12 GiB device-used gates bounded execution. Persistent model
and package caches were reused offline. The complete runner took 48.024 seconds
including loading, hooks, CPU copies, checks and cleanup; this is not TTFT/TPOT.

Peak PyTorch allocated memory was 3,125,901,824 bytes (2.91123 GiB). Allocated
memory is inside reserved memory; neither should be added to device-used memory.
After in-process cleanup, 32 MiB of allocated/reserved tensors remained; we do
not claim in-process zero. After process exit, `nvidia-smi` showed **0 MiB and
no compute process**. CUDA context/device totals during the process can differ
from the external post-exit `nvidia-smi` view on WSL.

The pinned implementation printed its generic sliding-window warning because
`sliding_window=32768` is configured, although `use_sliding_window=false`. The
42/43-position unpadded request remained ordinary causal SDPA; the warning was
not hidden and did not trigger another run.

Primary source:
[pinned model configuration](https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct/blob/989aa7980e4cf806f80c7fef2b1adb7bc71aa306/config.json),
[Transformers v4.51.3 Qwen2 implementation](https://github.com/huggingface/transformers/blob/v4.51.3/src/transformers/models/qwen2/modeling_qwen2.py),
[its SDPA integration](https://github.com/huggingface/transformers/blob/v4.51.3/src/transformers/integrations/sdpa_attention.py).
