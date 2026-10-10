# Topic 04 v2: exact notebook rehearsal on T4

On 8 October 2026 Moscow time, the 27-cell v2 notebook was executed on Tesla T4
in Colab High RAM. The 14 original code cells executed in order without errors.
Two instructor implementations, four written explanations and `RUN_GPU=True`
were supplied for this technical rehearsal. This is not an independent student pilot.

The frozen configuration used pinned Qwen2.5-0.5B-Instruct, FP16, vLLM 0.29.0,
temperature 0, output cap 8 and no structured-output constraint. Calibration:
6/12 correct, 12/12 valid and complete. Held-out: 2/6 correct, 6/6 valid and
complete. Every held-out prediction was `access`, matching a constant-access
baseline on this balanced six-ticket teaching set. No paired configuration A/B
or production-quality conclusion is supported.

`capture.json` retains the validated v3 service contract and auxiliary task
probe. `task.json` retains all 18 observations and the two scored matrices.
`student-template.ipynb` is the exact pristine notebook before preparation;
it contains TODOs, GPU disabled and no outputs or instructor implementations.
`provenance.json` records hashes, environment, supplied-answer exceptions and
the exact export verification. The measured available RAM was 48.6 GiB:
this run does not certify standard-RAM Colab. The course 24 GiB gate was unchanged.

The server exited normally. Post-worker verification found no compute processes
and 3 MiB device use. The 74.283-second service run includes startup and teardown;
it is not a request latency. Installation and model preparation are outside that clock.

The private executed notebook, original ZIP, logs and instructor CPU-decision
answers are excluded from Git and Pages. The provenance's `client.json` hash
identifies a private retained export, not a public downloadable artifact.
Later student prose may describe this result; the execution guard requires all
14 code sources, notebook metadata and cell structure to remain identical to
this archived template. A code change invalidates the scoped pass.
