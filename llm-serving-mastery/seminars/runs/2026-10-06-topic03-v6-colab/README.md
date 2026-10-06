# Topic 03 notebook v6 rehearsal on T4

The guided-investigation-v6 notebook completed on 6 October 2026 on Colab Tesla T4 with standard host RAM and High RAM off. All 25 student code cells ran with explicit private instructor solutions, plus a hash-checked student ZIP bootstrap and export cell: execution counts 1–27, no errors. Every executed code source matched the prepared copy. This verifies technical execution with solutions, not independent student understanding. No Drive was mounted.

## Layer investigation

Group 64 won under the declared 4.30 ideal bits/weight budget. Calibration relative output error was 11.7716%; held-out was 11.6888%. The separate clipping branch chose 99.5 by calibration output error, while weight MSE preferred 99. Same-matrix NF4 held-out error was 9.1702%. Choices were frozen before held-out. These norm ratios describe one reconstructed layer slice, not task accuracy or whole-model GPU performance.

The v6 readiness gate checked the complete answer-key sets and CPU artifacts before GPU setup. The instructor declared a classroom direct-routing screen of at least 10 correct labels out of 12 and zero invalid strings before inference. FP16 scored 6/12 and NF4 4/12, both with zero invalid strings; neither passed. This is a classroom screen, not a universal production threshold or a change to grading.

## GPU measurements

Five trials per format and forced output length produced these medians:

| Output IDs | FP16 ms | NF4 ms |
| --- | ---: | ---: |
| 24 | 772.14 | 1116.31 |
| 96 | 2682.29 | 4842.87 |

Peak allocated memory was 963.70–964.54 MiB for FP16 and 470.96 MiB for NF4. Peak reserved was 1220 and 1252 MiB respectively. Both separate profiles completed; the NF4 storage ledger contains 168 modules. The worker took 131.059 seconds including loading, warmups, timing, quality and profiles, not package installation. External GPU use after worker exit was 0 MiB.

This run used one pinned Qwen 0.5B model, batch one, greedy decoding, SDPA and KV cache. FP16 loaded before NF4, leaving a time-order confound. The five timings do not establish stable p95; twelve synthetic tickets do not establish representative task quality. NF4 reduced allocated memory but was slower here; the experiment does not prove a universal kernel-speed rule.

## Artifacts and provenance

- `result.json`: reviewed public projection of the downloaded export, excluding private explanation answers and solution code.
- `gpu-capture.json`: lossless extraction of the parsed worker object, not an independent download of original worker-file bytes.
- `layer-decision.json`: frozen choices and measured layer errors.
- `rehearsed-notebook.ipynb`: exact pristine student v6 template, without solutions or outputs.
- `provenance.json`: source and artifact hashes, private prepared/executed notebook hashes and all 27 ordered code-cell receipts.

The downloaded export was 196479 bytes and matched its displayed SHA-256. The student template SHA-256 is `7bc9cbd3719d98a602d42d9f2768dd7c53fc5c65edec76386584c75c18377c12`.

Before publication, the exact local student ZIP was uploaded through the Colab Files pane; its digest and both payload digests were verified in the bootstrap. This transport avoids relying on a stale published ZIP and does not replace execution of the student cells. The executed instructor notebook, personal Colab link and answers remain private. Historical v3/v4/v5 captures and their slide tables remain separate and unchanged. Learner validation is pending; a prepared pilot is not a conducted pilot.
