// Progressive enhancement: all materials remain visible without JavaScript.
(() => {
  document.querySelectorAll('[data-course-filter]').forEach(root => {
    const controls=[...root.querySelectorAll('[data-filter-key]')];
    const items=[...root.querySelectorAll('[data-filter-item]')];
    const params=new URL(location.href).searchParams;
    controls.forEach(el=>{const v=params.get(el.dataset.filterKey);if(v !== null && (el.tagName !== 'SELECT' || [...el.options].some(o=>o.value===v))) el.value=v;});
    const update=()=>{
      let count=0;
      for(const item of items){
        item.hidden=!controls.every(control=>{
          const key=control.dataset.filterKey,value=control.value.trim().toLowerCase();
          if(!value || value==='all') return true;
          if(key==='q') return value.split(/\s+/).every(word=>item.dataset.filterText.toLowerCase().includes(word));
          return (item.getAttribute('data-filter-'+key)||'').split(' ').includes(value);
        });
        if(!item.hidden) count++;
      }
      root.querySelector('[data-filter-count]').textContent=`${count} of ${items.length} entries`;
      root.querySelector('[data-filter-empty]').hidden=count!==0;
      const url=new URL(location.href);
      controls.forEach(el=>{const value=el.value.trim();if(value && value!=='all')url.searchParams.set(el.dataset.filterKey,value);else url.searchParams.delete(el.dataset.filterKey);});
      history.replaceState(null,'',url);
    };
    controls.forEach(el=>el.addEventListener('input',update));
    root.querySelector('[data-filter-reset]').addEventListener('click',()=>{controls.forEach(el=>el.value=el.tagName==='SELECT'?'all':'');update();});
    update();root.dataset.filterReady='true';
  });
})();
