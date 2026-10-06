# Topic 03 guided v5 notebook rehearsal on T4

The guided-investigation-v5 notebook completed on 6 October 2026 on Colab Tesla T4 with standard host RAM (High RAM off). All 25 student code cells ran with explicit private instructor solutions, plus the hash-checked public ZIP bootstrap and final evidence-export cell: execution counts 1–27, no errors. Every executed code source matched the prepared copy. This is technical execution, not independent student learning or production approval. No personal Drive was mounted.

## What was checked

The staged matrix investigation selected group 64 under the declared 4.30 ideal bits/weight budget. Calibration relative output error was 11.7716%; held-out error was 11.6888%. The independent clipping branch selected 99.5 by calibration output error, while weight MSE preferred 99. Same-matrix NF4 held-out error was 9.1702%. Choices were frozen before held-out. These are layer-output norm ratios, not task accuracy, and the reconstructed matrix was not installed in the GPU model.

Readiness validated the completed CPU work and saved layer artifacts before GPU setup. The instructor declared a classroom screen before inference: at least 10 correct labels out of 12 and no invalid strings, for a hypothetical direct-routing application. This is not a universal production threshold or a judge change. The new analysis applied the frozen rule and saved timing/confusion plots and screening results. FP16 scored 6/12; NF4 4/12; neither passed that classroom screen. Rejecting both for this context is a valid investigation outcome.

The GPU worker completed in 134.601 seconds. Five trials per format and forced length gave FP16/NF4 medians of 645.79/1168.15 ms at 24 output IDs and 2635.72/5009.75 ms at 96 IDs. Both separate profiles completed; the NF4 storage ledger contains 168 modules. External GPU use after worker exit was 0 MiB. The duration includes loading, warmups, quality and profiles, not just measured generation or installation time.

## Preserved artifacts and privacy

- `result.json`: reviewed public projection of the downloaded instructor export, omitting private explanation answers and solution code; includes the frozen classroom screen and its results.
- `gpu-capture.json`: lossless extraction of the parsed worker object from that export. Its published byte hash does not claim a second independent download of original worker-file bytes.
- `layer-decision.json`: frozen layer decisions and measured errors, extracted from the same export.
- `rehearsed-notebook.ipynb`: exact pristine student template without solutions or outputs.
- `provenance.json`: hashes of the private export, prepared/executed notebook and every executed code cell, ordered execution counts, and hashes of published artifacts. The downloaded export matched its displayed SHA-256 and byte count.

The executed notebook, instructor answers, local paths and personal Colab link remain private. Original v3/v4 captures are immutable and are not receipts for v5. Existing slide/Book timing tables remain explicitly historical examples, not silently replaced by this run.

## Limits

One pinned Qwen 0.5B model, one T4, FP16 then NF4, five raw timings per condition and twelve synthetic tickets per format. No representative quality, robust p95, HTTP latency, guaranteed free GPU availability or causal kernel-speed claim follows. Ordinary host RAM was 12.67 GiB; the worker used the recorded host Torch/CUDA and a dedicated package environment. This does not establish a fresh-VM installation rehearsal. Learner validation remains pending.
