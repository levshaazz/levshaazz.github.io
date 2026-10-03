# Topic 03 Colab engineering pilot


> Historical execution scope: these two captures and the receipt cover the unchanged
> GPU runner and the archived 23-cell notebook template. The current
> mechanism-first-v2 notebook has 24 cells and different CPU assignments
> (scale derivation and grouped quantization). Its local CPU execution is checked,
> but it has NOT been rerun end-to-end on Colab. Do not transfer this integration
> receipt to the revised notebook. Raw captures and the archived template are unchanged.

The new laboratory ran successfully on a Tesla T4 with standard host RAM on 3 October 2026.
The four-bit path used fewer live tensor bytes but took longer, and neither candidate was a good
support-ticket router. This is a completed technical rehearsal, not a completed learner pilot.

[Raw capture](capture.json) and [provenance](provenance.json) retain exact identity and measurement
boundaries. The downloaded capture has 98,847 bytes; its SHA256 matches the value displayed in Colab.

## Recorded results

Five timed trials per format and output length; milliseconds below are synchronized generation
wall time, not HTTP latency. Model loading, tokenization and input transfer are outside that clock.

| Quantity | FP16 | NF4 |
|---|---:|---:|
| 24 output IDs, median ms | 601.27 | 1064.54 |
| 24 output IDs, min–max ms | 574.16–632.28 | 1052.37–1430.73 |
| 96 output IDs, median ms | 2365.81 | 4204.62 |
| 96 output IDs, min–max ms | 2335.40–3084.76 | 4120.19–4838.58 |
| Peak allocated across these conditions, MiB | 963.70–964.54 | 470.96 |
| Peak reserved across these conditions, MiB | 1220 | 1252 |
| Correct synthetic ticket labels | 6 of 12 | 4 of 12 |
| Invalid label strings | 0 of 12 | 0 of 12 |

The NF4 median was about 1.77–1.78 times the FP16 median across the two lengths. This is the ratio in one
recorded paired run, not a general speed prediction. Each allocator pool had already warmed up
at both lengths, so reserved figures are not independent fresh-memory experiments.

The literal duplicate-payment ticket expected `billing`. FP16 returned `bug` and NF4 returned
`access`: both were syntactically valid and wrong. NF4 returned `access` for all twelve tickets.
A model can pass a format check and still fail the application. Keeping FP16 as an experimental
reference does not endorse either candidate for production.

## Profile and scope

Both separate 24-ID profiles completed. NF4 includes `bitsandbytes::gemm_4bit` and a
`gemm_4bit_simt` kernel name. This establishes that those operations appeared in that profile;
it does not isolate the cause of the wall-time difference. Inclusive operator totals overlap.

The worker completed in 118.054 seconds, including its setup/download work, excluded warmups,
quality checks and profiles. Package preparation was outside that worker interval.
The external device query after worker exit showed 0 MiB used. Sampled available host memory
remained at least 9.519 GiB. Headroom checks are not an OS memory sandbox.

Both formats were loaded sequentially in FP16-then-NF4 order. The samples are few, the timing
prompt is synthetic, and the twelve tickets are handwritten. Do not claim robust p95,
production capacity, representative accuracy, a hardware-independent speedup or a causal
dequantization explanation. Historical RTX v3 captures remain separate and cannot be used as
controlled cross-machine timing comparisons.

## Setup issue caught by the pilot

Default venv creation failed on this Colab image because `ensurepip` was unavailable.
The corrected notebook always configures its dedicated venv with `--without-pip` and
`--system-site-packages`, verifies the interpreter and installation path, and reuses matching
pins. It does not modify Colab's base packages or reinstall Torch. Regression tests reject an
incomplete-venv shortcut and an installation target outside the venv.

## Student-notebook integration rehearsal

After the repair, every code cell of the exact student notebook was executed in a fresh Python
namespace, with instructor solutions inserted for the two TODO functions, lengths changed to
24 and 96, and `RUN_GPU` enabled. The second worker completed in **99.699 seconds**. This attempt
reused the dedicated venv and model cache; it is not a second clean-VM installation test.

[Second raw capture](notebook-capture.json) and [integration receipt](notebook-rehearsal.json)
retain the notebook, runner and result hashes. The receipt records the interventions, verified
venv prefix/install path, unchanged base Transformers version, and 0 MiB external GPU reading
after exit. CPU functions, the length intervention, student summaries, natural-output inspection
and both profiles completed. The table above remains the first capture; the two runs are not
pooled and the second capture does not replace the first.

The exact pristine template used for that rehearsal is retained as
[rehearsed-notebook.ipynb](rehearsed-notebook.ipynb), without saved outputs or filled solutions.
One Markdown sentence was corrected afterwards: a student must compare a prediction with evidence,
not invent a failed prediction. At that earlier prose-only revision, all code cells and protocol
metadata were identical; its full-file hash was not rerun on GPU. The later mechanism-first-v2
revision changes CPU code and does not inherit that equality or integration status. The evidence
gate now preserves the original receipt/archive and requires the current notebook status to be
pending until new integration evidence exists. The original downloaded receipt is unchanged.

After both results were downloaded and verified, the owner explicitly authorized deleting the
temporary Colab runtime. The T4 was disconnected and its VM files/cache were removed. The Drive
notebook and retained local results were not deleted.

## Readiness

The laboratory code is technically executable on this observed T4 runtime. A teacher account
having access does not guarantee that every student can obtain a free T4. No student has yet
completed the pilot under observation; workload estimates and independent transfer remain
unvalidated. Judge contracts, thresholds, deadlines and publication are unchanged.

Validate the retained capture without GPU access:

```sh
python teaching/topic03_pilot.py --validate seminars/runs/2026-10-03-topic03-engineering-pilot-colab/capture.json
python teaching/topic03_pilot.py --validate seminars/runs/2026-10-03-topic03-engineering-pilot-colab/notebook-capture.json
```
