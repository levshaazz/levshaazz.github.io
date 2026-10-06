# Topic 03 engineering decision

Write about half a page using your own evidence. Detailed tables and mechanism answers stay in the notebook and attachments. Twelve synthetic tickets and five timing trials per condition do not certify production quality or tail latency. Submit privately; this does not change the judge contract.

## Short memo: fill these four paragraphs

**Question and prediction.** What constraint matters in your router scenario? Name one pre-run prediction and evidence that supports it, revises it or leaves it unresolved.

**Evidence.** State the frozen calibration group and held-out output error. Separately cite FP16/NF4 time and allocated/reserved memory at 24 and 96 IDs, and whether each meets your frozen classroom screening rule. The reconstructed layer was not installed into the GPU model.

**Decision.** Keep FP16 as experimental control, choose NF4 conditionally, reject both for the application, or defer. State which constraint decides the choice. Passing the small smoke check is not deployment approval.

**Limit and next test.** Name one unresolved issue and one controlled experiment that could change your decision.

## Evidence checklist: attach, do not repeat in the memo

- Edited notebook: predictions, tested quantizer/output metric, grouping comparisons, AWQ/GPTQ/NF4 explanations and plot readings.
- `topic03-layer-decision.json`: payload hash, calibration budget and frozen group/clipping choices, held-out and same-W/X NF4 results.
- `topic03-weights-full.png`, `topic03-weights-center.png`, `topic03-output-scatter.png`.
- `topic03-preflight.json`: context, minimum correct out of twelve, maximum invalid count and rationale, fixed before execution.
- `topic03-screening.json`: application of that rule, not a new production threshold.
- Original `evidence/<your attempt>/result.json`: model revision, GPU/runtime, all raw seconds, natural outputs and cleanup. Preserve failed attempts separately as partial.
- `topic03-timing.png`, both `topic03-confusion-*.png` plots; profiles and all mismatches remain in notebook/JSON.
- This completed memo as `topic03-decision.md`.

Download and open every deliverable before disconnecting Colab. Do not export credentials or model caches. If GPU access fails, say **not run**, preserve real partial evidence and name the missing measurement; do not substitute teacher results. Full method implementations and extra GPU runs remain optional.
