(() => {
  const text = (value) => value?.trim() || null;
  const setText = (root, selector, value, fallback) => root.querySelectorAll(selector).forEach((node) => { node.textContent = value || fallback; });
  document.querySelectorAll('[data-wholesale-workspace],[data-wholesale-overview]').forEach((root) => {
    const update = () => {
      const selected = [...root.querySelectorAll('[data-wholesale-family]')].flatMap((field) => {
        if (field instanceof HTMLInputElement && field.type === 'checkbox') return field.checked ? [field.closest('label')?.querySelector('span')?.textContent] : [];
        return field.value ? [field.options?.[field.selectedIndex]?.textContent || field.value] : [];
      }).filter(Boolean);
      const quantity = text(root.querySelector('[data-wholesale-quantity-input]')?.value);
      const destination = text(root.querySelector('[data-wholesale-destination-input]')?.value);
      setText(root, '[data-wholesale-products]', selected.join(', '), 'Not selected');
      setText(root, '[data-wholesale-quantity]', quantity, 'Not added');
      setText(root, '[data-wholesale-destination]', destination, 'Not added');
      const completed = [selected.length > 0, Boolean(quantity), Boolean(destination)].filter(Boolean).length;
      const readiness = root.querySelector('.wo-request-summary > p > strong');
      if (readiness) readiness.textContent = `${completed} / 3`;
      const progress = root.querySelector('.wo-progress > span');
      if (progress) progress.style.width = `${(completed / 3) * 100}%`;
    };
    root.addEventListener('input', update); root.addEventListener('change', update); update();
  });
})();
