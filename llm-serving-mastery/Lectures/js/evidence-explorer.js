/* Shared deterministic evidence-state viewer. Native evidence canvas, no layout fork.
 * Inputs are a precomputed scientific state registry, not runtime benchmark claims.
 * Buttons retain keyboard semantics; reset and re-entry restore the first state.
 * A print-media source retains the final explanatory state.
 */
(function(){
  if(window.__evidenceExplorer)return;
  window.__evidenceExplorer=true;
  function init(root){
    if(root.dataset.explorerReady)return;
    const states=JSON.parse(root.dataset.evidenceStates);
    let index=0;
    function update(){
      const state=states[index];
      for(const theme of ['light','dark']){
        const image=root.querySelector('.evidence-'+theme);
        image.src=root.dataset.evidenceBase+state.id+'-'+theme+'.svg';
        image.alt=state.alt || state.label;
      }
      root.querySelector('[data-evidence-state-label]').textContent=(index+1)+' / '+states.length+': '+state.label;
      root.querySelector('[data-evidence-prev]').disabled=index===0;
      root.querySelector('[data-evidence-next]').disabled=index===states.length-1;
      root.dataset.evidenceIndex=String(index);
      window.Lecture?.refit(root.closest('.slide'));
    }
    root.querySelector('[data-evidence-prev]').addEventListener('click',()=>{index=Math.max(0,index-1);update();});
    root.querySelector('[data-evidence-next]').addEventListener('click',()=>{index=Math.min(states.length-1,index+1);update();});
    root.querySelector('[data-evidence-reset]').addEventListener('click',()=>{index=0;update();});
    root.closest('.slide')?.addEventListener('slide:enter',()=>{index=0;update();});
    root.dataset.explorerReady='1';update();
  }
  function inspect(root){
    if(root.dataset.inspectorReady)return;
    const heat=JSON.parse(root.dataset.evidenceHeat);
    function update(){
      const i=+root.querySelector('[data-evidence-channel]').value,j=+root.querySelector('[data-evidence-position]').value;
      root.querySelector('[data-evidence-cell]').textContent='Channel '+heat.channel_ids[i]+', position '+heat.positions[j]+', token '+JSON.stringify(heat.token_text[j])+': signed '+heat.signed_values[i][j].toFixed(6)+', absolute '+heat.values[i][j].toFixed(6)+'.';
    }
    root.querySelectorAll('select').forEach(el=>el.addEventListener('change',update));
    root.dataset.inspectorReady='1';update();
  }
  const all=()=>{document.querySelectorAll('[data-evidence-explorer]').forEach(init);document.querySelectorAll('[data-evidence-inspector]').forEach(inspect);};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',all);else all();
  document.addEventListener('deck:ready',all);
})();
