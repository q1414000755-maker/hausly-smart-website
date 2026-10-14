(() => {
  const table = document.querySelector('[data-cmp-table]');
  const empty = document.querySelector('[data-cmp-empty]');
  const diff = document.querySelector('[data-cmp-diff]');
  const quote = document.querySelector('[data-cmp-quote]');
  const compare = window.Z02Compare;
  const catalog = () => window.Z02_CATALOG || { models: {}, dims: {} };
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const price = (model) => model.price?.amount == null ? 'Request quote' : `${model.price.currency} ${model.price.amount} / ${model.price.unit}`;
  const render = () => {
    const chosen = (compare?.get() || []).map((id) => catalog().models?.[id]).filter(Boolean);
    const ready = chosen.length >= 2 && chosen.every((model) => model.categoryPage === chosen[0].categoryPage);
    empty.hidden = ready;
    quote.hidden = !ready;
    if (!ready) { table.innerHTML = ''; return; }
    const dimInfo = catalog().dims?.[chosen[0].categoryPage] || {};
    const labels = dimInfo.labels || {};
    const rows = [
      { label: 'Image', value: (model) => `<img src="${esc(model.image)}" alt="">`, always: true },
      { label: 'Reference price', value: price },
      { label: 'Series', value: (model) => model.series || '—' },
      ...(dimInfo.dimensions || []).map((dimension) => ({ label: dimension.label, value: (model) => (model.attrs?.[dimension.key] || []).map((value) => labels[dimension.key]?.[value] || value).join(', ') || '—' }))
    ];
    const shown = diff.checked ? rows.filter((row) => row.always || new Set(chosen.map(row.value)).size > 1) : rows;
    table.innerHTML = `<table class="cmp-table"><thead><tr><th>Specification</th>${chosen.map((model) => `<th>${esc(model.name)}<br><small>${esc(model.sku)}</small></th>`).join('')}</tr></thead><tbody>${shown.map((row) => `<tr><th>${esc(row.label)}</th>${chosen.map((model) => `<td>${row.value(model)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  };
  diff.addEventListener('change', render);
  document.querySelector('[data-cmp-clear]').addEventListener('click', () => { compare?.clear(); render(); });
  quote.addEventListener('click', () => { (compare?.get() || []).forEach((model) => window.QuoteCart?.addLine({ model, qty: 1 })); quote.textContent = 'Added to Quote List'; quote.disabled = true; });
  render();
})();
