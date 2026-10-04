/* Reusable quantitative widgets for inference-performance lectures. */
(function () {
  'use strict';
  if (window.__lec_perfmodel) return;
  window.__lec_perfmodel = 1;

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

  function shape(root) {
    const phase = root.dataset.phase || 'prefill';
    const batch = Math.max(1, val(root, 'batch'));
    const prompt = Math.max(1, val(root, 'prompt'));
    const history = Math.max(1, val(root, 'history'));
    const q = phase === 'prefill' ? prompt : 1;
    const k = phase === 'prefill' ? prompt : history;
    out(root, 'phase', phase);
    out(root, 'queries', `${batch} × ${q}`);
    const attention = root.querySelector('[data-pm-output="attention"]');
    if(attention){
      const shape = document.createElement('span');
      // This is a mathematical shape, not a literal programming identifier.
      shape.innerHTML = `${batch} × H<sub>q</sub> × ${q} × ${k}`;
      attention.replaceChildren(shape);
    }
    for (const name of ['prompt','history']) {
      const input = root.querySelector(`[data-pm-input="${name}"]`);
      input.disabled = (name === 'prompt') !== (phase === 'prefill');
      input.setAttribute('aria-disabled', String(input.disabled));
      const label = input.closest('.pm-control')?.querySelector('label');
      if(label) label.innerHTML = name === 'prompt'
        ? (input.disabled ? 'Prompt (inactive)' : 'Prompt positions S<sub>q</sub>')
        : (input.disabled ? 'Key length (inactive)' : 'Total keys S<sub>kv</sub> (incl. new)');
    }
    out(root, 'gemm', phase === 'prefill' ? `M = ${batch * prompt}` : `M = ${batch}`);
    root.querySelectorAll('[data-pm-phase]').forEach((b) => b.classList.toggle('is-active', b.dataset.pmPhase === phase));
    const bars = root.querySelectorAll('.pm-tensor-bar');
    if (bars[0]) bars[0].style.width = `${Math.min(100, 34 + Math.log2(batch * q + 1) * 8)}%`;
    if (bars[1]) bars[1].style.width = `${Math.min(100, 30 + Math.log2(q * k + 1) * 5)}%`;
    if (bars[2]) bars[2].style.width = `${Math.min(100, 32 + Math.log2(batch + 1) * 10)}%`;
  }

  function roofline(root) {
    const intensity = Math.max(.1, val(root, 'intensity'));
    const compute = Number(root.dataset.compute || 60);
    const bandwidth = Number(root.dataset.bandwidth || 600);
    const memoryRoof = bandwidth * intensity / 1000;
    const attainable = Math.min(compute, memoryRoof);
    const ridge = compute * 1000 / bandwidth;
    const regime = Math.abs(intensity - ridge) < 1e-10 ? 'ridge: both ceilings equal' : intensity < ridge ? 'bandwidth-bound ceiling' : 'compute-bound ceiling';
    out(root, 'intensity', `${fmt(intensity)} FLOP/B`);
    out(root, 'attainable', `${fmt(attainable)} TFLOP/s`);
    out(root, 'ridge', `${fmt(ridge)} FLOP/B`);
    out(root, 'regime', regime);
    // Point, roofs and grid must use the same log transform. The former static
    // path had a different ridge than the independently positioned workload point.
    const input = root.querySelector('[data-pm-input="intensity"]');
    const lo = Math.max(.01, Number(input.min)), hi = Math.max(lo * 10, Number(input.max));
    const floor = Math.min(bandwidth * lo / 1000, compute / 100);
    const xAt = value => 90 + Math.log10(value / lo) / Math.log10(hi / lo) * 740;
    const yAt = value => 330 - Math.log10(value / floor) / Math.log10(compute / floor) * 250;
    const boundedRidge = Math.max(lo, Math.min(hi, ridge));
    const ceilingAt = value => Math.min(compute, bandwidth * value / 1000);
    const x = xAt(intensity), y = yAt(attainable);
    root.querySelector('.roof-memory')?.setAttribute('d', `M90 ${yAt(ceilingAt(lo))} L${xAt(boundedRidge)} ${yAt(ceilingAt(boundedRidge))}`);
    root.querySelector('.roof-compute')?.setAttribute('d', `M${xAt(boundedRidge)} ${yAt(ceilingAt(boundedRidge))} L830 ${yAt(ceilingAt(hi))}`);
    const grid = root.querySelector('.pm-roof .grid');
    grid?.setAttribute('x1', String(xAt(boundedRidge))); grid?.setAttribute('x2', String(xAt(boundedRidge)));
    const svg = root.querySelector('.pm-roof');
    if (svg) {
      svg.setAttribute('aria-label', `Log roofline: ${compute} TFLOP/s compute, ${bandwidth} GB/s memory; workload ${intensity} FLOP/B, ceiling ${attainable} TFLOP/s`);
      svg.querySelector('text[x="340"]')?.replaceChildren(document.createTextNode('intensity · FLOP/B (log)'));
      svg.querySelector('text[transform]')?.replaceChildren(document.createTextNode('TFLOP/s (log)'));
      // Leave clear space above the sloped roof; its former static label crossed it.
      svg.querySelector('text[x="145"]')?.setAttribute('y', '170');
      if (!svg.querySelector('[data-roof-ticks]')) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('data-roof-ticks', '');
        const tick = (x, y, text, anchor) => { const el = document.createElementNS(group.namespaceURI, 'text'); el.setAttribute('x', x); el.setAttribute('y', y); el.setAttribute('text-anchor', anchor); el.textContent = text; group.append(el); };
        for (let value = lo; value <= hi; value *= 10) tick(xAt(value), 360, fmt(value), 'middle');
        for (const value of [floor, Math.sqrt(floor * compute), compute]) tick(70, yAt(value) + 6, fmt(value), 'end');
        svg.append(group);
      }
    }
    const p = root.querySelector('.pm-point');
    if (p) { p.setAttribute('cx', String(Math.max(90, Math.min(830, x)))); p.setAttribute('cy', String(Math.max(80, Math.min(330, y)))); }
  }

  function kv(root) {
    const seq = Math.max(1, val(root, 'sequences'));
    const context = Math.max(1, val(root, 'context'));
    const kvHeads = Math.max(1, val(root, 'kvheads'));
    const bytes = Math.max(1, val(root, 'bytes'));
    const layers = Number(root.dataset.layers || 36);
    const headDim = Number(root.dataset.headDim || 128);
    const capacity = Number(root.dataset.capacityGib || 8);
    const perToken = 2 * layers * kvHeads * headDim * bytes;
    const total = perToken * seq * context;
    const gib = total / (2 ** 30);
    const ratio = gib / capacity;
    out(root, 'per-token', `${fmt(perToken / 1024, 0)} KiB/token`);
    out(root, 'tokens', fmt(seq * context, 0));
    out(root, 'total', `${fmt(gib, 2)} GiB`);
    out(root, 'fit', ratio <= 1 ? `${fmt(capacity - gib, 2)} GiB headroom` : `${fmt(gib - capacity, 2)} GiB over budget`);
    const fill = root.querySelector('.pm-capacity-fill');
    if (fill) {
      fill.style.width = `${Math.min(100, ratio * 100)}%`;
      fill.classList.toggle('is-warn', ratio > .75 && ratio <= 1);
      fill.classList.toggle('is-over', ratio > 1);
    }
  }

  // Deterministic fluid burst model, not a measured GPU scheduler. Each slot
  // completes one equal-duration request per wave; admitted requests keep FIFO.
  function burst(root) {
    const arrivals = Math.max(1, val(root, 'arrivals'));
    const slots = Math.max(1, val(root, 'slots'));
    const queue = Math.max(0, val(root, 'queue'));
    const service = Math.max(1, val(root, 'service'));
    const deadline = Math.max(1, val(root, 'deadline'));
    const admitted = Math.min(arrivals, slots + queue);
    const rejected = arrivals - admitted;
    const onTime = Math.min(admitted, Math.floor(deadline / service) * slots);
    const expired = admitted - onTime;
    const last = Math.ceil(admitted / slots) * service;
    out(root, 'admitted', String(admitted));
    out(root, 'rejected', String(rejected));
    out(root, 'on-time', String(onTime));
    out(root, 'expired', String(expired));
    out(root, 'last', `${fmt(last, 0)} ms`);
    out(root, 'decision', rejected ? 'explicitly shed' : expired ? 'accepted work expires' : 'all admitted fit');
  }

  // Teaching model: signed symmetric integer quantization, deliberately not NF4/AWQ.
  // The CPU toy uses nearest-even, including negative ties. Math.round instead
  // resolves half-integers toward +infinity and would disagree at 2.5 and -3.5.
  function roundEven(value) {
    const lower = Math.floor(value), fraction = value - lower;
    return fraction === .5 ? (lower % 2 === 0 ? lower : lower + 1) : Math.round(value);
  }
  function quant(root) {
    const x = val(root, 'value') / 100;
    const scale = Math.max(.01, val(root, 'scale') / 100);
    const bits = Math.max(2, val(root, 'bits'));
    const lo = -(2 ** (bits - 1));
    const hi = 2 ** (bits - 1) - 1;
    const unclipped = roundEven(x / scale);
    const code = Math.max(lo, Math.min(hi, unclipped));
    const reconstructed = code * scale;
    out(root, 'code', String(code));
    out(root, 'reconstructed', fmt(reconstructed, 2));
    out(root, 'error', fmt(Math.abs(x - reconstructed), 2));
    out(root, 'clipped', unclipped !== code ? 'clipped' : 'in range');
  }

  function weights(root) {
    const params = Math.max(.1, val(root, 'params')) * 1e9;
    const bits = Math.max(2, val(root, 'bits'));
    const group = Math.max(16, val(root, 'group'));
    const reserve = Math.max(0, val(root, 'reserve'));
    const kvGib = Math.max(0, val(root, 'kv')) / 100;
    const weightBytes = params * bits / 8;
    // The 16-bit branch represents plain BF16 weights, not a scaled integer code.
    const scaleBytes = bits === 16 ? 0 : Math.ceil(params / group) * 2;
    const capacity = Number(root.dataset.capacityGib || 16);
    const budget = Math.max(0, capacity - reserve - kvGib);
    const totalGib = (weightBytes + scaleBytes) / (2 ** 30);
    out(root, 'payload', `${fmt(weightBytes / 1e9, 2)} GB`);
    out(root, 'scales', `${fmt(scaleBytes / 1e6, 2)} MB`);
    out(root, 'weights', `${fmt(totalGib, 2)} GiB`);
    out(root, 'fit', totalGib <= budget ? `${fmt(budget - totalGib, 2)} GiB left` : `${fmt(totalGib - budget, 2)} GiB over`);
    const fill = root.querySelector('.pm-capacity-fill');
    if (fill) {
      fill.style.width = `${Math.min(100, totalGib / Math.max(.01, budget) * 100)}%`;
      fill.classList.toggle('is-over', totalGib > budget);
    }
  }

  function candidate(root) {
    const qualityFloor = val(root, 'quality');
    const ttftCeiling = val(root, 'ttft') / 100;
    const headroomFloor = val(root, 'headroom');
    // Hypothetical classroom data; no candidate represents a measured GPU run.
    const cases = [
      { name: 'FP16', quality: 98, ttft: .42, headroom: 2, goodput: 840 },
      { name: 'FP8', quality: 97, ttft: .35, headroom: 5, goodput: 1010 },
      { name: 'W4A16', quality: 91, ttft: .49, headroom: 8, goodput: 960 },
    ];
    const feasible = cases.filter((c) => c.quality >= qualityFloor && c.ttft <= ttftCeiling && c.headroom >= headroomFloor);
    const best = feasible.sort((a, b) => b.goodput - a.goodput)[0];
    out(root, 'feasible', feasible.length ? feasible.map((c) => c.name).join(', ') : 'none');
    out(root, 'choice', best ? `${best.name} · ${best.goodput} tok/s` : 'revise constraints');
    root.querySelectorAll('[data-pm-candidate]').forEach((el) => {
      const item = cases.find((c) => c.name === el.dataset.pmCandidate);
      el.classList.toggle('is-infeasible', !feasible.includes(item));
    });
  }

  function update(root) {
    reflect(root);
    const kind = root.dataset.kind;
    if (kind === 'shape') shape(root);
    else if (kind === 'roofline') roofline(root);
    else if (kind === 'kv') kv(root);
    else if (kind === 'burst') burst(root);
    else if (kind === 'quant') quant(root);
    else if (kind === 'weights') weights(root);
    else if (kind === 'candidate') candidate(root);
    root.dataset.pmReady = '1';
    window.Lecture?.refit(root.closest('.slide'));
  }

  function init(root) {
    if (root.dataset.pmBound) return;
    root.dataset.pmBound = '1'; root.dataset.pmReady = '0';
    const defaults = [...root.querySelectorAll('[data-pm-input]')].map((el) => [el, el.value]);
    const initialPhase = root.dataset.phase;
    root.querySelectorAll('[data-pm-input]').forEach((el) => el.addEventListener('input', () => update(root)));
    root.querySelectorAll('[data-pm-phase]').forEach((b) => b.addEventListener('click', () => { root.dataset.phase = b.dataset.pmPhase; update(root); }));
    root.querySelectorAll('[data-pm-reset]').forEach((button) => button.addEventListener('click', () => {
      defaults.forEach(([el, value]) => { el.value = value; });
      if (initialPhase) root.dataset.phase = initialPhase;
      update(root);
    }));
    update(root);
  }
  const initAll = () => document.querySelectorAll('.pm-widget[data-kind]').forEach(init);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initAll); else initAll();
  document.addEventListener('deck:ready', initAll);
})();
