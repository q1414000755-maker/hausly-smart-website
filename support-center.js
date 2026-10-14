/* Support forms prepare a local draft; they never submit an email. */
(() => {
  const rail = document.querySelector('.sp-subnav__scroll');
  const active = rail?.querySelector('[aria-current="page"]');
  const revealActive = () => {
    if (!rail || !active) return;
    if (rail.scrollWidth <= rail.clientWidth) {rail.scrollLeft = 0;return;}
    const left = active.getBoundingClientRect().left - rail.getBoundingClientRect().left + rail.scrollLeft;
    rail.scrollLeft = left - Math.max(0,(rail.clientWidth-active.clientWidth)/2);
  };
  requestAnimationFrame(revealActive);
  window.addEventListener('resize',revealActive);
  const modelList = document.querySelector('#sp-model-options');
  if (modelList) {
    const names = [...new Set(Object.values(window.Z02_CATALOG?.models || {}).map(model => model.name).filter(Boolean))].sort();
    names.forEach(name => { const option = document.createElement('option'); option.value = name; modelList.append(option); });
  }
  document.querySelectorAll('[data-support-form]').forEach(form => {
    form.addEventListener('submit', event => {
      event.preventDefault();
      const feedback = form.querySelector('[data-support-feedback]');
      feedback.textContent = '';
      form.querySelectorAll('input,textarea').forEach(field => { field.value = field.value.trim(); });
      if (!form.reportValidity()) return;
      const get = name => form.querySelector(`[data-support-field="${name}"]`)?.value.trim() || '';
      const topic = get('topic') || form.dataset.supportTopic;
      const rows = [
        'HAUSLYSMART SUPPORT ENQUIRY', 'Topic: ' + topic,
        'Company: ' + get('company'), 'Business email: ' + get('email'),
        'Country / region: ' + get('country'),
        'Product model / series: ' + (get('model') || 'To be discussed')
      ];
      form.querySelectorAll('[data-support-detail]').forEach(field => {
        rows.push(field.dataset.supportDetail + ': ' + (field.value.trim() || 'To be discussed'));
      });
      rows.push('', 'Please confirm the applicable product details, document availability and next steps for this request.');
      const token = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const key = 'hauslysmart-support-enquiry-v1:' + token;
      try {
        sessionStorage.setItem(key, JSON.stringify({version:1,createdAt:Date.now(),text:rows.join('\n')}));
        if (JSON.parse(sessionStorage.getItem(key))?.version !== 1) throw new Error('Draft not saved');
      } catch {
        feedback.textContent = 'Your browser could not carry this brief to the next page. ';
        const link = document.createElement('a');
        link.href = './request-a-quote.html#new-content';
        link.textContent = 'Prepare the enquiry directly →';
        feedback.append(link);
        return;
      }
      const destination = new URL('./request-a-quote.html', location.href);
      destination.searchParams.set('support-enquiry', token);
      destination.hash = 'new-content';
      location.assign(destination.href);
    });
  });
  const buttons = [...document.querySelectorAll('[data-resource-filter]')];
  const resources = [...document.querySelectorAll('[data-resource-category]')];
  const count = document.querySelector('[data-resource-count]');
  buttons.forEach(button => button.addEventListener('click', () => {
    const selected = button.dataset.resourceFilter;
    buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    resources.forEach(item => { item.hidden = selected !== 'all' && item.dataset.resourceCategory !== selected; });
    const visible = resources.filter(item => !item.hidden).length;
    if (count) count.textContent = `${visible} ${visible === 1 ? 'resource' : 'resources'} available`;
  }));
})();
