(() => {
  const compare = window.Z02Compare;
  const search = document.querySelector('[data-pc-search]');
  const category = document.querySelector('[data-pc-category]');
  const protocol = document.querySelector('[data-pc-protocol]');
  const filters = document.querySelector('.pc-filters');
  const resultBar = document.querySelector('.pc-resultbar');
  const cards = [...document.querySelectorAll('.pc-grid .cat-card')];
  const count = document.querySelector('[data-pc-count]');
  const empty = document.querySelector('[data-pc-empty]');
  const moreButton = document.querySelector('[data-pc-more]');
  const initialQuery = new URLSearchParams(window.location.search);
  const pageSize = 16;
  let shown = pageSize;
  const productTypes = {
    'cat-smart-switches': 'Smart Switches',
    'cat-mechanical-switches': 'Mechanical Switches',
    'cat-hotel-switches': 'Hotel Controls',
    'cat-control-panels': 'Control Panels',
    'cat-sockets': 'Sockets',
    'cat-low-voltage-data-panels': 'Low-Voltage & Data Panels',
    'cat-thermostats': 'Thermostats',
    'cat-controllers': 'Controllers & Gateways',
    'cat-sensors': 'Sensors',
    'cat-lighting': 'Lighting',
    'cat-smart-door-locks': 'Smart Door Locks',
    'cat-cameras': 'Cameras',
    'cat-curtains': 'Smart Curtains',
    'cat-accessories': 'Accessories'
  };
  const rawModelPattern = /^[A-Z]+\d*(?:-\d+)+$/i;
  const typeOf = (card) => productTypes[card.dataset.category] || 'Other';
  const decorateCards = () => cards.forEach((card) => {
    const name = card.querySelector('.cat-card-name');
    const nameLink = name?.querySelector('a');
    const rawName = nameLink?.textContent.trim() || card.dataset.name || '';
    const isCollection = /collection$/i.test(rawName) || /^src\d+-hotel-/i.test(card.dataset.model || '');

    if (rawModelPattern.test(rawName)) {
      const publicName = `${typeOf(card).replace(/s$/, '')} — ${rawName}`;
      nameLink.textContent = publicName;
      card.dataset.name = publicName;
      card.dataset.search = `${card.dataset.search || ''} ${publicName}`;
    }

    const spec = card.querySelector('[data-spec]');
    if (spec && !spec.textContent.trim()) {
      spec.textContent = '—';
      spec.hidden = false;
    }

    const terms = card.querySelector('[data-terms]');
    if (terms && !terms.textContent.trim()) {
      terms.textContent = 'MOQ —';
      terms.hidden = false;
    }

    if (isCollection) {
      card.classList.add('cat-card--collection');
      const detail = card.querySelector('.cat-detail-link[data-detail]');
      const quote = card.querySelector('[data-quote]');
      const compare = card.querySelector('[data-compare]');
      if (detail) detail.textContent = 'Explore Collection';
      if (quote) quote.remove();
      if (compare) compare.closest('label')?.remove();
      card.querySelector('.cat-card-buy')?.setAttribute('hidden', '');
      if (spec) {
        spec.textContent = 'Project collection — individual model details being added.';
        spec.hidden = false;
      }
    }
  });
  decorateCards();
  const select = (label, values, parent = filters, allLabel = `All ${label.toLowerCase()}s`) => {
    const control = document.createElement('select');
    control.setAttribute('aria-label', label);
    control.innerHTML = `<option value="">${allLabel}</option>${values.map((value) => `<option>${value}</option>`).join('')}`;
    parent.append(control);
    return control;
  };
  const applicationOf = (card) => { const raw=card.dataset.applications || card.dataset.application || ''; try{const values=JSON.parse(raw);if(Array.isArray(values))return values.filter(v=>typeof v==='string').map(v=>v.trim());}catch{} return raw.split(/[|,;]/).map(v=>v.trim()).filter(Boolean); };
  const priceOf = (card) => { const node=card.querySelector('[data-price]'); const raw=node?.textContent.trim() || ''; if(/pending|confirm|request|placeholder/i.test(raw))return null; if(node?.dataset.currency && node.dataset.currency.toUpperCase()!=='USD')return null; const match=raw.match(/^USD\s+([0-9]+(?:\.[0-9]+)?)(?:\s*\/\s*unit)?$/i); return match ? Number(match[1]) : null; };
  const productType = select('Product Type', [...new Set(cards.map(typeOf))].sort());
  const application = select('Application', ['Residential', 'Hotel', 'Commercial']);
  const more = select('More Filters', ['Price: Under USD 20', 'Price: USD 20 and above'], filters, 'More filters');
  const sort = select('Sort', ['Recommended', 'Model A-Z', 'Price: low to high'], resultBar);
  const active = document.createElement('div');
  active.className = 'pc-active';
  filters.after(active);
  const compareBar = document.createElement('aside');
  compareBar.className = 'pc-compare-bar';
  document.body.append(compareBar);
  const syncCompare = () => {
    const selected = compare.get();
    document.querySelectorAll('.pc-grid [data-compare]').forEach((box) => { box.checked = selected.includes(box.value); });
    compareBar.hidden = !selected.length;
    compareBar.innerHTML = selected.length ? `<span>${selected.length} product${selected.length === 1 ? '' : 's'} selected</span><button type="button" data-pc-compare-clear>Clear</button><a href="compare.html">Compare products →</a>` : '';
    compareBar.querySelector('[data-pc-compare-clear]')?.addEventListener('click', () => {
      compare.clear();
      syncCompare();
    });
  };
  document.querySelectorAll('.pc-grid [data-compare]').forEach((box) => box.addEventListener('change', () => {
    const model = box.value;
    const result = box.checked ? compare.add(model) : compare.remove(model);
    if (!result.ok) {
      box.checked = false;
      compareBar.innerHTML = result.reason === 'category'
        ? '<span>Compare products from the same category.</span>'
        : '<span>You can compare up to 4 products.</span>';
    }
    syncCompare();
  }));
  const restoreUrlState = () => {
    search.value = initialQuery.get('q') || '';
    category.value = initialQuery.get('category') || '';
    protocol.value = initialQuery.get('protocol') || '';
    productType.value = initialQuery.get('type') || '';
    application.value = initialQuery.get('application') || '';
    more.value = initialQuery.get('more') || '';
    sort.value = initialQuery.get('sort') || '';
  };
  const syncUrlState = () => {
    const params = new URLSearchParams();
    if (initialQuery.get('home-config') === '1') {
      ['home-config', 'model', 'configuration'].forEach((key) => {
        const value = initialQuery.get(key);
        if (value) params.set(key, value.slice(0, 600));
      });
    }
    [[search, 'q'], [category, 'category'], [protocol, 'protocol'], [productType, 'type'], [application, 'application'], [more, 'more'], [sort, 'sort']].forEach(([control, key]) => {
      if (control.value) params.set(key, control.value);
    });
    const query = params.toString();
    history.replaceState(null, '', `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`);
  };
  const update = () => {
    let visible = cards.filter((card) =>
      (!search.value || card.dataset.search.toLowerCase().includes(search.value.toLowerCase())) &&
      (!category.value || card.dataset.category === category.value) &&
      (!protocol.value || card.dataset.protocol.includes(protocol.value)) &&
      (!productType.value || typeOf(card) === productType.value) &&
      (!application.value || applicationOf(card).includes(application.value)) &&
      (!more.value || (priceOf(card) !== null && (more.value === 'Price: Under USD 20' ? priceOf(card) < 20 : priceOf(card) >= 20))));
    if (sort.value === 'Model A-Z') visible.sort((a, b) => a.querySelector('.cat-card-name').textContent.localeCompare(b.querySelector('.cat-card-name').textContent));
    if (sort.value === 'Price: low to high') visible.sort((a, b) => (priceOf(a) ?? Infinity) - (priceOf(b) ?? Infinity));
    visible.forEach((card) => card.parentElement.appendChild(card));
    cards.forEach((card) => { card.hidden = !visible.includes(card) || visible.indexOf(card) >= shown; });
    const collectionCount = visible.filter((card) => card.classList.contains('cat-card--collection')).length;
    const modelCount = visible.length - collectionCount;
    count.textContent = collectionCount
      ? `${modelCount} Product Models + ${collectionCount} Collection${collectionCount === 1 ? '' : 's'}`
      : `${modelCount} Product Models`;
    empty.hidden = Boolean(visible.length);
    moreButton.hidden = visible.length <= shown;
    active.innerHTML = '';
    [[search, 'Search'], [category, 'Category'], [protocol, 'Protocol'], [productType, 'Product Type'], [application, 'Application'], [more, 'More filters']].forEach(([control, label]) => {
      if (!control.value) return;
      const chip = document.createElement('button');
      chip.textContent = `${label}: ${control.value} ×`;
      chip.addEventListener('click', () => { control.value = ''; update(); });
      active.append(chip);
    });
    syncUrlState();
  };
  [search, category, protocol, productType, application, more].forEach((control) => control.addEventListener(control === search ? 'input' : 'change', () => { shown = pageSize; update(); }));
  sort.addEventListener('change', update);
  document.querySelector('[data-pc-clear]').addEventListener('click', () => {
    [search, category, protocol, productType, application, more, sort].forEach((control) => { control.value = ''; });
    shown = pageSize;
    update();
  });
  moreButton.addEventListener('click', () => { shown += pageSize; update(); });
  const syncQuote = () => {
    document.querySelectorAll('.pc-grid [data-quote]').forEach(button => {
      const added = Boolean(window.QuoteCart?.hasModel(button.dataset.quote));
      button.textContent = added ? 'In Quote List' : 'Add to Quote';
      button.setAttribute('aria-pressed', String(added));
    });
  };
  document.querySelectorAll('.pc-grid [data-quote]').forEach((button) => button.addEventListener('click', () => {
    if (!window.QuoteCart) return;
    window.QuoteCart.addLine({ model: button.dataset.quote, qty: 1 });
    syncQuote();
  }));
  window.QuoteCart?.subscribe(syncQuote);
  syncQuote();
  syncCompare();
  restoreUrlState();
  update();
})();

if(location.pathname==='/products.html') document.querySelectorAll('.pc-grid [data-detail],.pc-grid .cat-card-name a').forEach(a=>{if(a.getAttribute('href')?.startsWith('products/'))a.setAttribute('href',a.getAttribute('href')+'index.html')});
