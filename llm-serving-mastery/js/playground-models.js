/* Topic 05–08 teaching widgets for the Playground page. Deterministic models,
   never measured GPU runs; the provenance line under each widget says so. */
(function () {
  'use strict';
  if (window.__pg_models) return;
  window.__pg_models = 1;

  const fmt = (n, digits = 1) => Number(n).toLocaleString('en-US', { maximumFractionDigits: digits });
  const val = (root, name) => Number(root.querySelector(`[data-pm-input="${name}"]`)?.value || 0);
  const out = (root, name, value) => {
    const el = root.querySelector(`[data-pm-output="${name}"]`);
    if (el) el.textContent = value;
  };
  const reflect = (root) => root.querySelectorAll('[data-pm-input]').forEach((el) => {
    const o = root.querySelector(`[data-pm-value="${el.dataset.pmInput}"]`);
    if (o) o.textContent = el.value;
  });
  const ru = () => document.documentElement.lang === 'ru';
  const say = (en, ruText) => (ru() ? ruText : en);

  // Topic 05 — PagedAttention block budget: allocated = N × ceil(L / B) × B.
  // Block tails are allocated but never used; the waste is a prediction the
  // lab checks, not a vLLM measurement.
  function paging(root) {
    const sequences = Math.max(1, val(root, 'sequences'));
    const context = Math.max(1, val(root, 'context'));
    const block = Math.max(16, val(root, 'block'));
    const poolTokens = Number(root.dataset.poolTokens || 262144);
    const perTokenKiB = Number(root.dataset.perTokenKib || 36);
    const blocksPerSeq = Math.ceil(context / block);
    const allocated = sequences * blocksPerSeq * block;
    const used = sequences * context;
    const waste = allocated - used;
    out(root, 'blocks', `${blocksPerSeq} × ${block}`);
    out(root, 'allocated', `${fmt(allocated, 0)} tok`);
    out(root, 'used', `${fmt(used, 0)} tok`);
    out(root, 'waste', waste ? `${fmt(waste, 0)} tok · ${fmt(waste / Math.max(1, allocated) * 100, 1)}%` : '0 tok');
    out(root, 'waste-mib', `${fmt(waste * perTokenKiB / 1024, 0)} MiB`);
    const ratio = allocated / poolTokens;
    out(root, 'fit', ratio <= 1 ? say(`${fmt(poolTokens - allocated, 0)} tok headroom`, `запас ${fmt(poolTokens - allocated, 0)} токенов`) : say(`${fmt(allocated - poolTokens, 0)} tok over pool`, `перерасход ${fmt(allocated - poolTokens, 0)} токенов`));
    const fill = root.querySelector('.pm-capacity-fill');
    if (fill) {
      fill.style.width = `${Math.min(100, ratio * 100)}%`;
      fill.classList.toggle('is-warn', ratio > .75 && ratio <= 1);
      fill.classList.toggle('is-over', ratio > 1);
    }
  }

  // Topic 06 — saturation knee: one decode step costs W + b·batch ms. The
  // weight load W is paid once per step, each live sequence adds b.
  // Throughput = batch·1000/(W + b·batch): it flattens toward 1000/b tok/s.
  function knee(root) {
    const clients = Math.max(1, val(root, 'clients'));
    const maxSeqs = Math.max(1, val(root, 'maxseqs'));
    const weightMs = Math.max(1, val(root, 'weight'));
    const perSeqMs = Math.max(0, val(root, 'perseq'));
    const tokens = Number(root.dataset.probeTokens || 256);
    const throughputAt = (c) => { const batch = Math.min(c, maxSeqs); const step = weightMs + perSeqMs * batch; return batch * 1000 / step; };
    const batch = Math.min(clients, maxSeqs);
    const step = weightMs + perSeqMs * batch;
    const tps = throughputAt(clients);
    const doubled = throughputAt(clients * 2);
    out(root, 'batch', `${batch} / ${clients}`);
    out(root, 'step', `${fmt(step, 1)} ms`);
    out(root, 'throughput', `${fmt(tps, 0)} tok/s`);
    out(root, 'latency', `${fmt(tokens * step / 1000, 1)} s`);
    out(root, 'asymptote', `${fmt(1000 / Math.max(1e-6, perSeqMs), 0)} tok/s`);
    out(root, 'regime', batch < clients
      ? say(`capped by max_num_seqs; doubling clients adds only ${fmt(doubled - tps, 0)} tok/s`, `срезано max_num_seqs; удвоение клиентов даёт лишь +${fmt(doubled - tps, 0)} tok/s`)
      : tps > .9 * (1000 / Math.max(1e-6, perSeqMs))
        ? say('near the 1000/b roof: batch alone cannot help', 'у крыши 1000/b: батч больше не помогает')
        : say('still on the rising leg', 'ещё на растущем участке'));
  }

  // Topic 07 — pick a working point: illustrative configs, one SLO. Feasible =
  // throughput ≥ minimum AND p95 ≤ SLO. The Pareto front does not move; the
  // choice of point does.
  function pareto(root) {
    const minTps = val(root, 'mintps');
    const slo = val(root, 'slo') / 100;
    const cases = [
      { name: 'seq=32 · util=0.80', tps: 1180, p95: 1.9 },
      { name: 'seq=64 · util=0.85', tps: 1560, p95: 3.8 },
      { name: 'seq=64 · util=0.90', tps: 1730, p95: 6.4 },
      { name: 'seq=128 · util=0.90', tps: 1810, p95: 9.7 },
      { name: 'FP8 · seq=64 · util=0.85', tps: 2100, p95: 4.1 },
    ];
    const feasible = cases.filter((c) => c.tps >= minTps && c.p95 <= slo);
    const best = feasible.slice().sort((a, b) => b.tps - a.tps)[0];
    const front = cases.filter((c) => !cases.some((o) => o !== c && o.tps >= c.tps && o.p95 <= c.p95 && (o.tps > c.tps || o.p95 < c.p95)));
    out(root, 'feasible', feasible.length ? feasible.map((c) => c.name).join(', ') : say('none', 'нет подходящих'));
    out(root, 'choice', best ? `${best.name} · ${fmt(best.tps, 0)} tok/s` : say('revise the SLO or the floor', 'ослабьте SLO или порог'));
    out(root, 'margin', best ? say(`p95 headroom ${fmt(slo - best.p95, 1)} s`, `запас по p95 ${fmt(slo - best.p95, 1)} с`) : '—');
    out(root, 'front', `${front.length} / ${cases.length}`);
    root.querySelectorAll('[data-pm-candidate]').forEach((el) => {
      const item = cases.find((c) => c.name === el.dataset.pmCandidate);
      el.classList.toggle('is-infeasible', !feasible.includes(item));
    });
  }

  // Topic 08 — retry amplification with a bounded gateway. Attempts per
  // request = (1 − f^(k+1)) / (1 − f). Retries multiply offered load exactly
  // while the system is failing; the 429 cap protects the engine.
  function retry(root) {
    const offered = Math.max(1, val(root, 'offered'));
    const fail = Math.min(99, Math.max(0, val(root, 'fail'))) / 100;
    const retries = Math.max(0, val(root, 'retries'));
    const capacity = Math.max(1, val(root, 'capacity'));
    const attempts = fail >= 1 ? 1 + retries : (1 - Math.pow(fail, retries + 1)) / (1 - fail);
    const load = offered * attempts;
    const shed = Math.max(0, load - capacity);
    const downstream = Math.min(load, capacity);
    const success = (1 - Math.pow(fail, retries + 1)) * 100;
    out(root, 'attempts', `× ${fmt(attempts, 2)}`);
    out(root, 'load', `${fmt(load, 0)} rps`);
    out(root, 'decision', shed > 0
      ? say(`429: sheds ${fmt(shed, 0)} rps`, `429: сбрасывает ${fmt(shed, 0)} rps`)
      : say('passes all load', 'пропускает всю нагрузку'));
    out(root, 'waste', `${fmt(offered * (attempts - 1), 0)} rps`);
    out(root, 'downstream', `${fmt(downstream, 0)} rps`);
    out(root, 'success', `${fmt(success, 1)}%`);
  }

  function update(root) {
    reflect(root);
    const kind = root.dataset.kind;
    if (kind === 'paging') paging(root);
    else if (kind === 'knee') knee(root);
    else if (kind === 'pareto') pareto(root);
    else if (kind === 'retry') retry(root);
    root.dataset.pmReady = '1';
  }

  function init(root) {
    // Own bound flag: perfmodel.js also claims every .pm-widget[data-kind] on
    // deck:ready, and its pmBound must never leave these four kinds uncomputed.
    if (root.dataset.pgBound) return;
    root.dataset.pgBound = '1'; root.dataset.pmReady = '0';
    const defaults = [...root.querySelectorAll('[data-pm-input]')].map((el) => [el, el.value]);
    root.querySelectorAll('[data-pm-input]').forEach((el) => el.addEventListener('input', () => update(root)));
    root.querySelectorAll('[data-pm-reset]').forEach((button) => button.addEventListener('click', () => {
      defaults.forEach(([el, value]) => { el.value = value; });
      update(root);
    }));
    update(root);
  }
  const MINE = '.pm-widget[data-kind="paging"],.pm-widget[data-kind="knee"],.pm-widget[data-kind="pareto"],.pm-widget[data-kind="retry"]';
  const initAll = () => document.querySelectorAll(MINE).forEach(init);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initAll); else initAll();
  document.addEventListener('deck:ready', initAll);
})();
