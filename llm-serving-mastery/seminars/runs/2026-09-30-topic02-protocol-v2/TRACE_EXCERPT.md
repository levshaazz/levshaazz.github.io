# An actual CPU-launch / GPU-kernel window

[`trace-excerpt.json`](trace-excerpt.json) is a sanitized chronological excerpt of the **existing
30 September trace**, not a new GPU run and not a constructed timeline. It supplements the full-trace
aggregates in [`profiles.json`](profiles.json). The parent [rehearsal README](README.md) defines the
runtime and limits.

## Workload and provenance

- Model: pinned Qwen2.5-0.5B-Instruct, FP16, requested SDPA; RTX 5070 Ti.
- Shape: B=1, P=128, O=8, with repeated synthetic input-token IDs. This is **not** the natural-language
  prompt demonstration; do not put the new demo's prompt above this trace as if it produced it.
- Source revision: `8074c6a7260e533af0d88e5ba42e3b671a0766dd`.
- Original trace SHA-256:
  `6ce71deef55694c0749119698daa09ed7f56a1075d357a44af7710cd2489bb2b`.
- This hash matches the P128 entry in `profiles.json`. The raw original stays ignored because it
  contains machine metadata. No absolute timestamps, paths, PID/TID, original stream/correlation
  identifiers or host metadata are copied into the public excerpt.

## Reproducible selection rule

1. Parse the original Chrome trace and retain physical intervals with `cat="kernel"`, `ph="X"`.
   Sort by the original `ts` timestamp.
2. Find the CPU `user_annotation` named `topic02_decode_7_steps`.
3. For each physical kernel, find its unique matching launch interval through equal
   `args.correlation`. Only `cat="cuda_runtime"` / `"cuda_driver"`, `ph="X"`, with names
   `cudaLaunchKernel`, `cuLaunchKernel` or `cuLaunchKernelEx` qualify. Missing or ambiguous matches
   do not establish membership.
4. Find the first kernel whose matched launch interval is fully inside that CPU annotation.
   Retain it and the next seven **consecutive** physical kernels. For this original, they are
   zero-based kernel ordinals **1101 through 1108**. Verify all eight matched launches belong to
   the annotation and that every short label is a literal substring of its full retained symbol.
5. Set time zero to the earliest retained event: the first matched CPU launch. Subtract that origin
   before interval arithmetic. Publish only exact symbol/API names, abbreviated labels, relative
   microseconds, durations and allowlisted provenance. Relative timestamps are rounded to six
   decimals for serialization, not to claim nanosecond measurement accuracy.

This is the beginning of one profiled decode region, **not a random or representative sample**.
CPU annotation boundaries are not synchronized GPU boundaries; the launch correlation establishes
which submitted work the kernels belong to. The excerpt's time zero is 28,710.845 microseconds after
the first physical kernel in the complete trace.

## What can be read directly

The table is in chronological **GPU-kernel** order. CPU launches use the same clock origin; their
order happens to agree in this window. The JSON retains every full symbol name.

| Short symbol | CPU launch start (µs) | CPU API duration (µs) | GPU start (µs) | GPU duration (µs) |
|---|---:|---:|---:|---:|
| `indexSelectSmallIndex` | 0.000 | 35.809 | 47.801 | 1.440 |
| `arange_cuda_out` | 104.562 | 31.881 | 148.668 | 0.768 |
| `direct_copy_kernel_cuda` | 245.964 | 37.002 | 295.040 | 1.408 |
| `_bmm_outer_product_kernel` | 444.146 | 33.275 | 493.446 | 1.120 |
| `CatArrayBatchedCopy_vectorized` | 554.970 | 33.094 | 600.873 | 0.992 |
| `cos_kernel_cuda` | 642.599 | 43.644 | 705.036 | 1.376 |
| `MulFunctor` | 770.917 | 30.388 | 814.415 | 0.928 |
| `sin_kernel_cuda` | 872.152 | 30.088 | 914.994 | 1.408 |

The whole excerpt is **916.402 µs** from first retained CPU launch to last kernel end. The eight
physical kernels occupy a union of **9.440 µs** on one recorded stream. Their first-to-last-kernel
span is **868.601 µs**. No recorded `gpu_memcpy`/`gpu_memset` interval overlaps this selected window;
that does not establish absence of all other device activity.

For one concrete reading: the first `cudaLaunchKernel` call lasts **35.809 µs** on the CPU, while
its associated `indexSelectSmallIndex` kernel lasts **1.440 µs** on the GPU and starts **47.801 µs**
after that API call began. These are three different intervals, not three interchangeable timings
of the operation. The 11.992 µs between this API return and kernel start is not automatically a
queue delay caused by one identified component.

## How to render and discuss it

Show aligned CPU-launch and GPU-kernel lanes with a common 0–1000 µs axis; connect only the matched
pairs. At ordinary slide width, a 1 µs interval is narrower than one pixel. Use a precisely placed
event marker plus a printed duration, or a clearly labeled zoom inset. Do not silently widen tiny
rectangles and then ask students to compare their apparent durations.

Ask: **"Which interval did our timer measure? What additional evidence would justify calling this
a host bottleneck?"** A useful observation is that very short recorded kernels are separated in
this profiled trace. A specific root cause or expected speedup does not follow from that observation.

- API spans, operator attribution and physical kernels are different representations; never add
  their durations as disjoint buckets.
- Profiling changes execution. This window does not measure unprofiled launch overhead or predict
  production throughput, utilization, batch behavior or HTTP latency.
- Time outside the selected physical kernels is not automatically idle GPU time. Other categories,
  other processes and incomplete instrumentation remain outside this evidence.
- The full-profile 33.331 ms kernel union / 322.362 ms span is a different scope. Do not substitute
  the small-window ratio for the full-profile ratio or label either one measured SM utilization.
