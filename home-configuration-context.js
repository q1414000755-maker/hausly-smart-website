/* Carry homepage preferences into the catalogue and its enquiry link. */
(() => {
  const params = new URLSearchParams(location.search);
  if (params.get('home-config') !== '1') return;
  const model = (params.get('model') || '').trim().slice(0, 160);
  const configuration = (params.get('configuration') || '').trim().slice(0, 600);
  const filters = document.querySelector('.pc-filters');
  if (!model || !configuration || !filters) return;
  const context = document.createElement('aside');
  context.className = 'hc-context';
  context.setAttribute('aria-label', 'Your homepage configuration');
  const title = document.createElement('strong');
  title.textContent = 'Your configuration preferences';
  const summary = document.createElement('p');
  summary.textContent = configuration;
  const note = document.createElement('small');
  note.textContent = 'Review this series below. Exact configuration and wiring compatibility are confirmed with our team.';
  const link = document.createElement('a');
  link.className = 'hc-context__action';
  link.textContent = 'Enquire about this configuration →';
  link.href = `request-a-quote.html?${new URLSearchParams({model, configuration})}#new-content`;
  context.append(title, summary, note, link);
  filters.before(context);
})();
