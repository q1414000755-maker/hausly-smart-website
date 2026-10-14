/* One-use homepage handoff and editable tab-only review, isolated from QuoteCart. */
document.addEventListener('DOMContentLoaded', () => {
  const token = new URLSearchParams(location.search).get('home-enquiry');
  if (!token) return;
  const field = document.getElementById('inquiry-requirements');
  const feedback = document.getElementById('inquiry-feedback');
  if (!field || !feedback) return;
  const handoffKey = 'gsl-home-enquiry-handoff-v1';
  const reviewKey = 'gsl-home-enquiry-review-v1:' + token;
  const ttl = 30 * 60 * 1000;
  const read = key => { try { return JSON.parse(sessionStorage.getItem(key)); } catch { return null; } };
  const remove = key => { try { sessionStorage.removeItem(key); } catch { /* Browser may deny storage. */ } };
  const expired = at => typeof at !== 'number' || !Number.isFinite(at) || Date.now() - at > ttl || at > Date.now() + 60000;
  const draft = read(handoffKey);
  const review = read(reviewKey);
  const validDraft = draft?.version === 1 && draft.token === token && !expired(draft.createdAt);
  const validReview = review?.version === 1 && review.token === token && !expired(review.updatedAt) && typeof review.value === 'string';
  if (draft?.token === token && expired(draft.createdAt)) remove(handoffKey);
  if (review?.token === token && expired(review.updatedAt)) remove(reviewKey);
  if (validReview) {
    field.value = review.value;
    feedback.textContent = 'Your editable enquiry draft has been restored for this tab. Review and copy it when ready. Nothing has been sent.';
    if (validDraft) remove(handoffKey);
  } else if (!validDraft) {
    feedback.textContent = 'This homepage brief is no longer available. Please enter your details in the draft below, or return to the homepage to prepare it again.';
    return;
  } else {
  const safe = (name, limit = 200) => typeof draft[name] === 'string' ? draft[name].slice(0, limit).trim() : '';
  const lines = [
    'ENQUIRY DETAILS',
    'Request type: ' + safe('type'),
    'Company: ' + safe('company'),
    'Business email: ' + safe('email', 254),
    'Country / region: ' + safe('country'),
    'Product interest: ' + safe('category'),
    'Application / business: ' + (safe('application') || 'To be discussed'),
    'Additional requirements: ' + (safe('notes', 2000) || 'To be discussed'),
    '',
    'PRODUCT REQUIREMENTS',
    field.value
  ];
    field.value = lines.join('\n');
    feedback.textContent = 'Your homepage details are ready. Review and edit this draft, then copy it. Nothing has been sent.';
    remove(handoffKey);
  }
  const saveReview = () => {
    try {
      sessionStorage.setItem(reviewKey, JSON.stringify({ version: 1, token, updatedAt: Date.now(), value: field.value }));
    } catch {
      feedback.textContent = 'You can edit and copy this draft here. Your browser could not keep edits for a page refresh, so copy them before leaving. Nothing has been sent.';
    }
  };
  saveReview();
  field.addEventListener('input', saveReview);
}, { once: true });
