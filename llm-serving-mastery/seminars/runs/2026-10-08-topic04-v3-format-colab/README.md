# Topic 04 structured format rehearsal

On 8 October 2026 the 32-cell v3 instructor copy completed all 17 original code
cells in order on Tesla T4 / Colab High RAM. Supplied instructor answers,
GPU=True and the private CHALLENGER='format' override are recorded explicitly.
The canonical student code still defaults to prompt comparison and GPU=False.
This is a technical instructor test, not independent student completion.

## Calibration and held out

Baseline and structured choice used the same twelve handwritten tickets, system
instruction, pinned Qwen FP16 weights, temperature zero and output cap eight.
Only the format constraint changed. Both produced 6/12 correct, 12/12 valid and
12/12 complete answers, with identical matrices: [[0,3,1,0],[0,4,0,0],[0,2,2,0]].
Recall was billing0/4, access4/4 and bug2/4. The constant-access baseline is4/12.
The constraint demonstrated no task-quality improvement on this small set.

The calibration-only tie rule retained baseline before opening six public
held-out tickets. After restarting the same cached model/configuration, all
predictions were access: 2/6 correct, equal to the constant-access baseline,
and 6/6 valid/complete. Only selected baseline was tested on held-out; this
run does not certify held-out performance of the format policy.

## Evidence and limits

[Provenance](provenance.json) binds [calibration](calibration-service.json),
[held-out service](capture.json), [task](task.json), [frozen decision](decision.json),
the exact [pristine student template](student-template.ipynb) and helper hashes.
Both owned process groups stopped normally. The external check found 3 MiB GPU
memory and no compute processes. Available RAM was48.56GiB before calibration
and48.45GiB after held-out. Standard-RAM Colab remains uncertified.

09:41:00–09:43:13 UTC includes server startup, probes and teardown, not package
installation/downloads or a controlled latency comparison. The previous prompt
and historical v2 evidence remain unchanged. Private answers, executed notebook,
logs and raw ZIP are excluded from Pages. New notebook readiness prose may reuse
these results only while code, cell structure and metadata stay identical.
Independent learner validation is pending. No Pages deployment accompanied this run.
