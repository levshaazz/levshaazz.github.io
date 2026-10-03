# Visual investigation: current notebook rehearsal

All current student code cells were executed with explicit instructor TODO solutions on a fresh Colab Tesla T4, standard host RAM (12.67 GB), without Drive mounting. This is a technical rehearsal, not learner validation. Folder date is Moscow local time; raw timestamps are UTC on 3 October.

- `result.json`: exact exported bytes; includes the real-layer decision and complete GPU capture with raw timings, outputs, profiler rows and runtime versions.
- `rehearsed-notebook.ipynb`: exact pristine student template, deliberately without solutions or outputs. Its SHA256 is embedded in the result.
- Instructor preparation: `scripts/prepare-topic03-rehearsal.py` in the private source repository; it substitutes explicit solutions and materializes the same public payloads. The executed instructor notebook is not public.

Publication follow-up changed only the first delivery paragraph and notebook receipt metadata. Every code cell is identical to the archived template and checked in CI. The embedded archived SHA identifies the bytes used for the run, not a claim that later prose was executed. The model license was added to the download package; runner, NPZ and executable notebook code stayed unchanged.

The real-layer slice selected group 64 under 4.30 ideal bits/weight, using calibration only: 11.7716% calibration relative output error and 11.6888% held-out. These are numerical layer errors, not answer-error rates. Full-layer CPU FP32 and 64-row float64 notebook values must not be conflated; arithmetic near rounding boundaries can also change codes.

GPU worker completed in 134.36 s. Five trials per output length: FP16 median 648.68/2555.15 ms and NF4 1080.75/4741.07 ms for 24/96 tokens. Peak allocated across timing trials: FP16 963.70–964.54 MiB, NF4 470.96 MiB; reserved 1220/1252 MiB. Correct synthetic tickets: 6/12 versus 4/12, zero invalid outputs. Both separate profiles completed. External device check after worker exit: Tesla T4, 0 MiB.

Limits: one device/model, fixed FP16→NF4 format order, five trials, twelve synthetic tickets; no production-quality claim or guaranteed free Colab availability. Runtime used Colab Torch 2.11.0+cu130; the capture records actual versions. Historical captures remain immutable.

Export: browser output was zlib/base64 encoded, transferred through TextEdit, decoded and verified against SHA256 `9c4832c6f1cde4d544b6521f824320fb4fa89dd161dd17f2699ae286eb330d0a` (108825 bytes). No fabricated or substituted measurements.
