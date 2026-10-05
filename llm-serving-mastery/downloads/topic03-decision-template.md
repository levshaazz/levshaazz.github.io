# Topic 03 engineering decision

Fill this template using your own lab. The twelve synthetic tickets and five timing trials per condition do not certify production quality or tail latency. Submit privately; do not include names, accounts, credentials or model caches. This memo does not change the judge submission contract.

## Scope and prediction

- Model and immutable revision:
- GPU, host RAM, Torch/CUDA, Transformers and bitsandbytes versions:
- Batch, exact input IDs/prompt reference, stopping modes and trial count:
- Prediction made before inspecting results:
- Evidence that supports it, changes it or leaves it unresolved:

## Frozen layer decision

- Data SHA-256 and [out,in] shape; which positions and outputs were included:
- Candidate groups, the 4.30 ideal bits/weight budget, calibration criterion and frozen choice:
- Calibration versus held-out error; link to `topic03-layer-decision.json`:
- Separate clipping comparison: weight-MSE choice versus calibration-output choice; no joint group/clipping search:
- Uniform group64 versus supplied NF4 QDQ on the same weights and inputs:
- Why AWQ rescales two sides before rounding; how GPTQ uses inputs to compensate a fixed weight's error:
- What the histogram and scatter show, and what they cannot establish:

## Whole-model GPU comparison

Copy measurements without changing the original artifact. Report median and observed min–max in milliseconds, based on five raw wall-time trials per condition. Peak memory columns refer to the largest respective peak across the five trials; use MiB. Do not replace natural ticket answers with forced-length timing outputs.

| Format | Output IDs | Median ms | Min–max ms | Peak allocated MiB | Peak reserved MiB |
| --- | --- | --- | --- | --- | --- |
| FP16 | 24 | | | | |
| NF4 | 24 | | | | |
| FP16 | 96 | | | | |
| NF4 | 96 | | | | |

- Fresh attempt directory and original `result.json`:
- What stayed fixed; how representation and execution both changed:
- Natural quality counts out of twelve per format; invalid/truncated outputs and paired changes:
- Profile status; one observed operator change and a testable hypothesis, not a causal proof:
- Cleanup result; preserved incomplete attempts or infrastructure limitations:

## Decision and limits

- Keep FP16 as control, retain NF4 conditionally, reject both, or defer: which constraint and evidence justify the choice?
- What small layer error, allocated/reserved counters and the synthetic quality set do NOT prove:
- One next experiment that could change the decision:
- Location of the edited notebook, plots and original artifacts:

Do not manufacture a GPU result when GPU access fails. State the missing measurement and preserve real partial evidence. Full AWQ/GPTQ implementations and extra GPU runs are optional, not hidden acceptance conditions.
