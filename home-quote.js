/* Homepage enquiry handoff. This does not submit or change the saved Quote List. */
(() => {
  const form = document.querySelector('[data-home-quote-form]');
  if (!form) return;
  const feedback = form.querySelector('[data-home-quote-feedback]');
  const field = key => form.querySelector(`[data-enquiry-field="${key}"]`);
  const trim = key => field(key).value.trim();
  const key = 'gsl-home-enquiry-handoff-v1';
  form.addEventListener('submit', event => {
    event.preventDefault();
    feedback.textContent = '';
    field('company').value = trim('company');
    field('email').value = trim('email');
    field('country').value = trim('country');
    if (!form.reportValidity()) return;
    const includeQuote = form.querySelector('[data-enquiry-include-quote]').checked;
    if (includeQuote && (!window.QuoteCart || window.QuoteCart.hasPending?.() || !window.QuoteCart.lines().length)) {
      feedback.textContent = 'Open your Quote List to review or restore products first, or untick the option to continue with your project details.';
      return;
    }
    const token = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const draft = {
      version: 1,
      token,
      createdAt: Date.now(),
      company: trim('company'),
      email: trim('email'),
      country: trim('country'),
      category: trim('category'),
      application: trim('application'),
      type: form.querySelector('input[name="hq-enquiry-type"]:checked').value,
      notes: trim('notes')
    };
    try {
      sessionStorage.setItem(key, JSON.stringify(draft));
      const saved = JSON.parse(sessionStorage.getItem(key));
      if (saved?.token !== token) throw new Error('Draft could not be saved');
    } catch {
      feedback.textContent = 'Your browser could not carry these details to the next page. You can prepare the enquiry directly instead.';
      const fallback = document.createElement('a');
      fallback.href = './request-a-quote.html#new-content';
      fallback.textContent = 'Prepare your enquiry →';
      feedback.append(' ', fallback);
      return;
    }
    const destination = new URL('./request-a-quote.html', location.href);
    destination.searchParams.set('home-enquiry', token);
    if (draft.type === 'Sample evaluation') destination.searchParams.set('sample', '1');
    if (includeQuote) destination.searchParams.set('quote', '1');
    destination.hash = 'new-content';
    location.assign(destination.href);
  });
})();
