# Topics 01–04: instructor GPU rehearsal, 29 September 2026

All four **teaching** notebooks completed from source commit `98ee6e35652ca86ce2e79ac5ce775f0400eb19c9` between 18:01 and 18:07 UTC on WSL2, NVIDIA GeForce RTX 5070 Ti (16,303 MiB), driver 591.86, CUDA runtime 13.0, Python 3.12.13. Each ran alone, with `HF_HUB_OFFLINE=1`, a 24 GiB memory cgroup, no swap inside the cgroup, a wall timeout, and a resource check between code cells (at least 24 GiB system RAM available; at most 12,288 MiB GPU already used). The GPU returned to 0 MiB after every process; Topic 04 also shut down port 8000. No judge/reference process ran. These are local lab checks, **not** Round 01 grading calibration or serving-capacity claims.

The [sanitized results](results.json) contain the per-run UTC timestamps, source revision, model revisions, framework versions, workload shapes, raw timing trial arrays and observed outputs, and resource samples. Only source code and this reviewed projection are committed. The full executed notebooks, profiler trace, server log, local cache paths and weights stay in ignored `.cache/rehearsals` and `.cache/models`. To reproduce the projection from those local runs, use `scripts/publish_lab_rehearsal.py` with the four explicit run directories and `--check`.

## Reproduction boundary

The 0.5B Qwen2.5-Instruct model uses revision `7ae557604adf67be50417f59c2c2f167def9a775`; Topic 02 also uses the 1.5B revision `989aa7980e4cf806f80c7fef2b1adb7bc71aa306`. Both were downloaded once to the durable project-local cache and passed `HF_HUB_OFFLINE=1 python scripts/prefetch_lab_models.py --verify-only`. Topics 01–03 used PyTorch 2.14.0+cu130, Transformers 4.51.3, Accelerate 1.6.0, huggingface_hub 0.30.2 and safetensors 0.5.3; Topic 03 used bitsandbytes 0.50.2. Topic 04 used vLLM 0.29.0, PyTorch 2.13.0+cu130 and OpenAI Python SDK 3.20.0 in its isolated environment. Its WSL2 subprocess selected the vLLM V1 runner and native sampler. Student Colab hardware or software may differ.

The launch shape was `systemd-run --scope --property=MemoryMax=24G --property=MemorySwapMax=0 timeout -k 20s <wall-limit>s python scripts/rehearse_lab.py <topic> --cell-timeout <cell-limit> --require-clean`, with wall limits 1200/1800/1200/1500 seconds for 01/02/03/04 and cell limits 600/900/600/600 seconds. Topic 04's sanitized vLLM arguments are recorded in JSON: loopback-only port 8000, 2048 context, four sequences, 45% GPU utilization, FP16 and eager execution. Package and model caches were not cleared between runs. The course [operator guide](../../INSTRUCTOR_REHEARSAL.md) defines the weekly procedure.

| Topic | Completed code cells | Duration | Lowest sampled available RAM | Highest sampled GPU use | Result |
|---|---:|---:|---:|---:|---|
| 01 | 10 | 53.5 s | 67.78 GiB | 1,502 MiB | pass |
| 02 | 7 | 156.3 s | 65.99 GiB | 362 MiB* | pass |
| 03 | 6 | 83.1 s | 67.68 GiB | 1,478 MiB | pass |
| 04 | 7 | 31.2 s | 65.93 GiB | 7,530 MiB | pass |

*The Topic 02 notebook releases each model before the between-cell resource sample; the in-process peak for its 1.5B/4096-token case was 4.20 GiB allocated and 4.65 GiB reserved. The 362 MiB sample must **not** be interpreted as peak use. Samples are a safety gate, not a high-frequency memory trace.

## Measured teaching outcomes

Topic 01: one non-streaming and one streaming-proxy request completed with no unexpected failures. The 43-token input produced 63 tokens. Local model load was 4.51 s; the non-streaming request took 1.395 s (45.17 output tokens/s); the first nonempty streamed **text chunk** arrived at 0.036 s and the complete stream took 1.293 s. A text chunk is not necessarily a token. This single request does not yield a p95 or a concurrency estimate.

Topic 02: two models × four shapes × five synchronized prefill trials and five decode trials per shape all completed; no trial failures were observed. The JSON preserves every phase trial, not just these medians. Input/output shapes are tokens, batch size is one; decode times cover `output_tokens - 1` autoregressive steps. The throughput column is those steps divided by median decode time, **not** end-to-end service goodput.

| Model | Input / output | Prefill median | Decode median | Decode steps/s |
|---|---:|---:|---:|---:|
| 0.5B | 128 / 32 | 25.3 ms | 721.2 ms | 43.0 |
| 0.5B | 4096 / 32 | 73.6 ms | 596.0 ms | 52.0 |
| 0.5B | 128 / 128 | 18.0 ms | 2652.4 ms | 47.9 |
| 0.5B | 4096 / 128 | 73.5 ms | 2921.7 ms | 43.5 |
| 1.5B | 128 / 32 | 27.8 ms | 1116.3 ms | 27.8 |
| 1.5B | 4096 / 32 | 185.6 ms | 965.7 ms | 32.1 |
| 1.5B | 128 / 128 | 36.4 ms | 4454.5 ms | 28.5 |
| 1.5B | 4096 / 128 | 186.6 ms | 4389.6 ms | 28.9 |

The model-config KV accounting is 12,288 bytes/token for 0.5B and 28,672 bytes/token for 1.5B at FP16. Allocation is much larger than KV alone because weights and temporary tensors are included. The short-prompt timings are visibly variable; no regression diagnosis or precision claim is justified by five samples. The local profiler trace is an exercise artifact, not a production latency trace.

Topic 03: FP16 and bitsandbytes NF4 each completed four natural-EOS quality samples and 12 fixed-24-token timing trials (32 successful generations, zero runtime failures). The JSON contains paired outputs and all timings. Peak allocated memory fell from 1.174 GiB (FP16) to 0.618 GiB (NF4), but peak **reserved** memory was 1.189 versus 1.221 GiB; it would be false to claim the whole process used less VRAM from parameter compression alone. For the four prompts, fixed-length per-prompt p95 wall times ranged 0.54–0.81 s for FP16 and 1.05–1.28 s for NF4. With only three trials per prompt, nearest-rank p95 is effectively the maximum; this is not a stable p95 estimate or proof about other kernels, models, or loads.

The qualitative smoke set exposed limitations of the tiny model and prompt cap: both formats gave the correct integer `45`; FP16 gave `blue`, NF4 gave `Blue.` (punctuation/case may violate a strict exact-format rule). Neither format supplied exactly three comma-separated measurement verbs; both one-sentence capacity answers reached the 24-token cap before finishing. Do not infer a population-level NF4 quality regression from four prompts. A production decision needs held-out paired tasks, explicit strict-format scoring, kernel verification, workload-specific latency and headroom.

Topic 04: `/v1/models` advertised `topic04`; ordinary chat returned content with `finish_reason=stop` in 0.748 s; SDK streaming returned content with `finish_reason=stop`, first content at 0.053 s and total 0.463 s; a raw SSE probe observed `[DONE]`. Wrong-model returned 404 and an actual 2,329-token chat prompt exceeded the 2,048-token limit with 400. All three positive and both expected-negative probes passed; unexpected failure rate was 0/5. The first request may include lazy initialization, and neither its wall time nor the stream's first-content time is a throughput/SLO measurement. The WSL V1 runner fallback is a host compatibility measure, not a general recommendation.

## Operator decision and limits

Topics 01–04 meet the **teaching-lab readiness** bar on this instructor machine: reproducible pinned inputs, bounded successful execution, recorded limitations, clean GPU teardown, and student-facing sources without outputs or secrets. Topic 03 remains a smoke comparison, and Topic 04 remains an API contract check; neither validates a production quantizer or high-concurrency serving. Repeat measurements on a student's actual hardware before interpreting their submissions. The private judge baseline and its thresholds are separate evidence and were not changed here.
