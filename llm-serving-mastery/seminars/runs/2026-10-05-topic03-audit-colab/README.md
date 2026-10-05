# Topic 03 audited notebook rehearsal on T4

The current audited-investigation-v4 notebook completed on 5 October 2026 on a fresh Colab Tesla T4 with standard host RAM, without mounting Drive. All fourteen student code cells ran with explicit instructor solutions, after a hash-checked public payload bootstrap. This verifies technical execution, not independent student learning or production suitability.

## Results

The real-layer exercise selected group 64 under the predeclared 4.30 ideal bits-per-weight budget. Calibration output error was 11.7716%; held-out error was 11.6888%. The separate clipping branch selected 99.5 using calibration outputs, although 99 had the lowest weight MSE. The same-matrix NF4 reconstruction achieved 9.1702% held-out output error. These numerical layer errors are not answer-error rates; choices were frozen before reading held-out inputs.

GPU worker time was 127.629 seconds. Five trials per format and forced output length gave FP16/NF4 medians of 627.29/1069.70 ms at 24 output IDs and 2447.63/4621.16 ms at 96 IDs. Peak allocated memory was 963.70–964.54 MiB for FP16 and 470.96 MiB for NF4. Reserved memory was 1220/1252 MiB. Natural synthetic ticket accuracy was 6/12 versus 4/12, with zero invalid labels. Both separate profiles completed. The external device query after worker exit recorded 0 MiB.

The new ledger records all 168 NF4 linear modules individually. For example, layer 0 `q_proj` has original [out,in] shape [896,896], 401408 packed uint8 bytes and 12544 FP32 absmax values occupying 50176 bytes, at block size 64. Double quantization is off; compute dtype is FP16. These actual metadata bytes differ from the exercise's ideal FP16-scale accounting and do not represent total device memory.

## Preserved artifacts

- `result.json`: exact integrated export, combining the real-layer decision and current GPU capture.
- `gpu-capture.json`: original worker JSON, preserved without reformatting. Its SHA-256 is embedded in the integrated export.
- `layer-decision.json`: original notebook output for the frozen choices.
- `rehearsed-notebook.ipynb`: exact pristine student template, without solutions or outputs.
- `provenance.json`: file hashes, execution counts and source hashes verified against the privately downloaded executed notebook. Only hashes of instructor solutions are public, not their code.

The private executed copy was downloaded from Colab; every prepared code cell matched its source and had a successful execution count, 1–15. A separate export-only cell was added after completion. The verified archive was also recovered from its visible data link when the browser download event did not fire; ordinary downloads subsequently appeared on disk. No timing or output was synthesized. Public notebook, runner and NPZ bytes did not change during this rehearsal.

## Limits

This is one pinned 0.5B model on one T4, with FP16 followed by NF4, five timing trials per condition and twelve synthetic tickets. It establishes neither representative accuracy, stable tail latency, a causal kernel explanation nor guaranteed free GPU access. Colab supplied Torch 2.11.0+cu130, CUDA 13.0 and driver 580.82.07; additional pinned packages were installed only in a dedicated worker environment. Earlier captures and slide/Book tables remain explicitly historical v3 measurements, not replaced with this run's numbers. Learner validation remains pending.
