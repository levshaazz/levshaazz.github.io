# Topic 04 v3 instructor GPU rehearsal

The corrected 32-cell notebook completed all 17 original code cells in order on
Tesla T4 / Colab High RAM on 8 October 2026. This is an instructor reference run,
not independent student completion or a speed benchmark. Two student functions,
explanations and a calibration-only selection rule were supplied privately.

## Calibration and held out results

Both candidates used the same 12 handwritten calibration tickets, pinned
Qwen2.5-0.5B-Instruct FP16, temperature zero and output cap eight. Only the system
instruction changed. The baseline produced 6/12 correct predictions; the clarified
prompt produced 5/12. Both were 100% complete and valid. Baseline recall was
billing 0/4, access 4/4 and bug 2/4; challenger recall was 0/4, 1/4 and 4/4.
The constant-access calibration baseline scores 4/12.

The rule chose baseline using calibration only. Its immutable decision was saved
before the six public held-out teaching cases were loaded. The second owned server
used identical weights, versions and launch flags. All six predictions were access:
2/6 correct, equal to the constant-access baseline, with 100% completion and validity.
This does not establish production accuracy or identify the cause of the errors.
The alternative structured-format challenger was not executed.

## Execution and retained evidence

Both servers stopped their own process groups normally (return code zero). Available
RAM was 48.69 GiB before calibration and 48.41 GiB after held-out. Post-run GPU memory
was 3 MiB and no compute processes remained. Standard-RAM Colab is not certified.
The service stages ran from 08:55:46 to 08:57:44 UTC; this interval includes startup,
probes and teardown, excludes installation and downloads, and is not request latency.

[Provenance](provenance.json) binds both [calibration](calibration-service.json) and
[held-out](capture.json) service captures, [task observations](task.json),
[saved decision](decision.json), exact [pristine student template](student-template.ipynb)
and runtime helper hashes. Current prose-only updates may retain this scoped run;
changed code, cell structure or execution metadata requires another rehearsal.
Private executed notebook, solutions, logs and original ZIP remain outside Pages.

The first v3 attempt failed before the held-out server started: both service stages
used the same exclusively created log filename. Its exact private archive is retained;
the audit receipt is `_research/audits/2026-10-08-topic04-v3-gpu-attempt-1.json`.
The corrected runner derives a separate log name from each service artifact, and
a regression test rejects the old collision. Historical v2 evidence is unchanged.

Independent learner validation is pending. No Pages publication accompanies this run.
