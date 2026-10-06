# Topic 03 engineering decision

Write about half a page using your own evidence. Detailed tables and mechanism answers stay in the notebook and attachments. Twelve synthetic tickets and five timing trials per condition do not certify production quality or tail latency. Submit privately; this does not change the judge contract.

## Short memo: fill these four paragraphs

**Question and prediction.** What constraint matters in your router scenario? Name one pre-run prediction and evidence that supports it, revises it or leaves it unresolved.

**Evidence.** State the frozen calibration group and held-out output error. Separately cite FP16/NF4 time and allocated/reserved memory at 24 and 96 IDs, and whether each meets your frozen classroom screening rule. The reconstructed layer was not installed into the GPU model.

**Decision.** Keep FP16 as experimental control, choose NF4 conditionally, reject both for the application, or defer. State which constraint decides the choice. Passing the small smoke check is not deployment approval.

**Limit and next test.** Name one unresolved issue and one controlled experiment that could change your decision.

## Evidence checklist: attach, do not repeat in the memo

Use the [canonical Topic 03 acceptance checklist](https://levshaazz.github.io/llm-serving-mastery/en/topics/03/#acceptance-checklist), also embedded from the same source in your matching notebook. It includes the separate clipping and same-W/X NF4 investigations and the frozen pre-run screening rule. Do not maintain a second checklist in this memo.

Download and open every deliverable before disconnecting Colab. Do not export credentials or model caches. If GPU access fails, say **not run**, preserve real partial evidence and name the missing measurement; do not substitute teacher results. Full method implementations and extra GPU runs remain optional.
