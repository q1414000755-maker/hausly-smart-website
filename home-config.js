/* Homepage section 04. Catalogue-backed choices; installation is a project requirement. */
(() => {
  const section = document.querySelector('[data-home-config]');
  const catalog = window.Z02_CATALOG;
  if (!section || !catalog) return;
  const families = [
    { id: 'src03-m6', label: 'M6 Series', material: 'Skin-feel PC' },
    { id: 'src03-m10-glass', label: 'M10 Glass', material: 'Skin-feel glass' },
    { id: 'src03-m12s', label: 'M12 / S', material: 'Display control' },
    { id: 'src03-z7', label: 'Z7 Series', material: 'Touch control' }
  ].filter(family => catalog.models[family.id]);
  if (!families.length) return;
  const colors = {
    'm6-premium-gray': ['Premium', 'linear-gradient(135deg,#adb2b7,#636970)'],
    'm6-skin-gray': ['Gray', 'linear-gradient(135deg,#b8bfc6,#78828c)'],
    'm6-skin-silver': ['Silver', 'linear-gradient(135deg,#ebedef,#a8afb7)'],
    'm6-skin-white': ['White', 'linear-gradient(135deg,#fff,#e8ebee)'],
    'm6-skin-black': ['Black', 'linear-gradient(135deg,#48515a,#17212b)'],
    'm6-skin-gold': ['Gold', 'linear-gradient(135deg,#e5d4b3,#b39461)'],
    'm6-cream-gold': ['Cream', 'linear-gradient(135deg,#f3e9d5,#cfb990)'],
    'glass-white': ['White', 'linear-gradient(135deg,#fff,#e3e8ee)'],
    'glass-black': ['Black', 'linear-gradient(135deg,#68717b 0%,#141b23 56%,#39424d)']
  };
  const finishLabels = catalog.dims['cat-smart-switches']?.labels?.finish || {};
  const state = { family: families[0].id, finish: '', gang: '2', protocol: 'zigbee', installation: 'not-sure' };
  const installations = { neutral: 'Neutral wire available', 'no-neutral': 'No neutral wire', 'not-sure': 'Wiring to confirm' };
  const current = () => catalog.models[state.family];
  const variants = () => current().variants?.length ? current().variants : [current()];
  const values = (key, candidates = variants()) => [...new Set(candidates.flatMap(variant => variant.attrs?.[key] || []))].filter(value => value !== 'source-pending');
  const supports = (variant, key, value) => !value || (variant.attrs?.[key] || []).includes(value);
  const gangLabel = value => value === '4-2-scene' ? '4 + 2 Scene' : `${value} Gang`;
  const makeButton = (key, value, label) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'hc-config__choice';
    button.dataset.hcChoice = key;
    button.dataset.hcValue = value;
    button.setAttribute('aria-pressed', String(state[key] === value));
    button.textContent = label;
    return button;
  };
  const renderOptions = () => {
    const focused = section.contains(document.activeElement) && document.activeElement.dataset.hcChoice
      ? { key: document.activeElement.dataset.hcChoice, value: document.activeElement.dataset.hcValue }
      : null;
    const finishes = values('finish');
    if (!finishes.includes(state.finish)) state.finish = finishes.includes('m6-skin-black') ? 'm6-skin-black' : finishes[0] || '';
    const finishVariants = variants().filter(variant => supports(variant, 'finish', state.finish));
    const gangs = values('gang', finishVariants);
    if (!gangs.includes(state.gang)) state.gang = gangs[0] || '';
    const protocols = values('protocol', finishVariants.filter(variant => supports(variant, 'gang', state.gang)));
    if (!protocols.includes(state.protocol)) state.protocol = protocols[0] || '';
    const finishList = section.querySelector('[data-hc-finishes]');
    finishList.replaceChildren();
    if (!finishes.length) {
      const note = document.createElement('p');
      note.className = 'hc-config__finish-note';
      note.textContent = 'Explore finish options with our team for this series.';
      finishList.append(note);
    }
    finishes.forEach(value => {
      let [shortLabel, swatch] = colors[value] || [finishLabels[value] || value, '#cbd5e1'];
      if (value.startsWith('glass-') && finishes.some(item => item.startsWith('m6-'))) shortLabel = `Glass ${shortLabel.toLowerCase()}`;
      const button = makeButton('finish', value, '');
      button.classList.add('hc-config__finish');
      button.setAttribute('aria-label', finishLabels[value] || shortLabel);
      button.title = finishLabels[value] || shortLabel;
      const chip = document.createElement('span');
      chip.className = 'hc-config__swatch';
      chip.style.setProperty('--hc-swatch', swatch);
      chip.setAttribute('aria-hidden', 'true');
      const label = document.createElement('span');
      label.textContent = shortLabel;
      button.append(chip, label);
      finishList.append(button);
    });
    const gangList = section.querySelector('[data-hc-gangs]');
    gangList.replaceChildren();
    gangs.forEach(value => {
      const button = makeButton('gang', value, '');
      const icon = document.createElement('span');
      icon.className = 'hc-config__gang-icon';
      icon.setAttribute('aria-hidden', 'true');
      for (let i = 0; i < Math.min(4, parseInt(value, 10) || 1); i++) icon.append(document.createElement('i'));
      button.append(icon, document.createTextNode(gangLabel(value)));
      gangList.append(button);
    });
    const protocolList = section.querySelector('[data-hc-protocols]');
    protocolList.replaceChildren();
    protocols.forEach(value => {
      const label = catalog.dims['cat-smart-switches']?.labels?.protocol?.[value] || ({ zigbee: 'Zigbee', 'bluetooth-mesh': 'Bluetooth Mesh' })[value] || value;
      const button = makeButton('protocol', value, '');
      const icon = document.createElement('img');
      icon.className = 'hc-config__protocol-icon';
      icon.src = `assets/images/connectivity-icons/${value === 'bluetooth-mesh' ? 'bluetooth' : value}.png`;
      icon.alt = '';
      icon.width = 16;
      icon.height = 16;
      button.append(icon, document.createTextNode(label));
      protocolList.append(button);
    });
    if (focused) {
      const group = Array.from(section.querySelectorAll('[data-hc-choice]')).filter(button => button.dataset.hcChoice === focused.key);
      (group.find(button => button.dataset.hcValue === focused.value) || group[0])?.focus({ preventScroll: true });
    }
  };
  const sync = () => {
    const model = current();
    const family = families.find(item => item.id === state.family);
    section.querySelectorAll('[data-hc-choice]').forEach(button => button.setAttribute('aria-pressed', String(state[button.dataset.hcChoice] === button.dataset.hcValue)));
    section.querySelectorAll('[data-hc-series]').forEach(button => button.setAttribute('aria-pressed', String(state.family === button.dataset.hcSeries)));
    const image = section.querySelector('[data-hc-image]');
    image.src = model.image;
    image.alt = `${family.label} smart switch series preview`;
    section.querySelector('[data-hc-material]').textContent = state.family === 'src03-m6' && state.finish.startsWith('glass-') ? 'Glass finish' : family.material;
    section.querySelector('[data-hc-title]').textContent = `${family.label}. More ways to fit.`;
    const configuration = [family.label, state.finish ? finishLabels[state.finish] || state.finish : 'Finish to confirm', gangLabel(state.gang), state.protocol === 'bluetooth-mesh' ? 'Bluetooth Mesh' : 'Zigbee', installations[state.installation]].join(' · ');
    section.querySelector('[data-hc-summary]').textContent = configuration;
    const parameters = new URLSearchParams({ q: model.name, category: 'cat-smart-switches', protocol: state.protocol === 'bluetooth-mesh' ? 'Bluetooth' : 'Zigbee', 'home-config': '1', model: model.name, configuration });
    section.querySelector('[data-hc-results]').href = `finder.html?${parameters}`;
    const enquiry = section.querySelector('[data-hc-enquire]');
    if (enquiry) enquiry.href = `request-a-quote.html?${new URLSearchParams({model: model.name, configuration})}#new-content`;
    section.querySelector('[data-hc-product]').href = `products/${state.family}/`;
  };
  section.addEventListener('click', event => {
    const familyButton = event.target.closest('[data-hc-series]');
    if (familyButton) {
      if (!families.some(family => family.id === familyButton.dataset.hcSeries)) return;
      state.family = familyButton.dataset.hcSeries;
      renderOptions();
      sync();
      return;
    }
    const choice = event.target.closest('[data-hc-choice]');
    if (!choice) return;
    const key = choice.dataset.hcChoice;
    if (!['finish', 'gang', 'protocol', 'installation'].includes(key)) return;
    state[key] = choice.dataset.hcValue;
    if (key !== 'installation') renderOptions();
    sync();
  });
  renderOptions();
  sync();
  // Mobile users can expand the less frequently used choices when needed.
  const advanced = section.querySelector('[data-hc-advanced]');
  const mobile = window.matchMedia('(max-width:900px)');
  const syncAdvanced = () => { if (advanced) advanced.open = !mobile.matches; };
  syncAdvanced();
  mobile.addEventListener('change', syncAdvanced);
})();
