/* Shared Compare selection state. A first-release comparison is meaningful only
   within one product category, so this is the single policy gate for PLPs and
   the Product Center. */
(() => {
  const key = 'z02-compare:global';
  const max = 4;
  const read = () => { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; } };
  const write = (ids) => localStorage.setItem(key, JSON.stringify(ids));
  const categoryOf = (id) => window.Z02_CATALOG?.models?.[id]?.categoryPage || null;
  const normalise = (ids = read()) => {
    const first = ids.find((id) => categoryOf(id));
    const category = first ? categoryOf(first) : null;
    const selected = ids.filter((id) => category && categoryOf(id) === category).slice(0, max);
    if (JSON.stringify(selected) !== JSON.stringify(ids)) write(selected);
    return { selected, category };
  };
  window.Z02Compare = {
    get: () => normalise().selected,
    clear: () => { localStorage.removeItem(key); return []; },
    remove: (id) => { const next = normalise().selected.filter((item) => item !== id); write(next); return { ok: true, selected: next, category: next[0] ? categoryOf(next[0]) : null }; },
    add: (id) => {
      const { selected, category } = normalise();
      const candidateCategory = categoryOf(id);
      if (!candidateCategory) return { ok: false, reason: 'unavailable', selected, category };
      if (category && candidateCategory !== category) return { ok: false, reason: 'category', selected, category };
      if (selected.includes(id)) return { ok: true, selected, category: category || candidateCategory };
      if (selected.length >= max) return { ok: false, reason: 'max', selected, category };
      const next = [...selected, id];
      write(next);
      return { ok: true, selected: next, category: category || candidateCategory };
    }
  };
})();
