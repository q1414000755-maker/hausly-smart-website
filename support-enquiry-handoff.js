/* One-use support brief and editable review in this tab, independent of QuoteCart. */
document.addEventListener('DOMContentLoaded', () => {
  const token = new URLSearchParams(location.search).get('support-enquiry');
  if (!token || !/^[a-zA-Z0-9-]{10,80}$/.test(token)) return;
  const field = document.querySelector('#inquiry-requirements');
  const feedback = document.querySelector('#inquiry-feedback');
  if (!field || !feedback) return;
  const sourceKey = 'hauslysmart-support-enquiry-v1:' + token;
  const reviewKey = 'hauslysmart-support-review-v1:' + token;
  const ttl = 30 * 60 * 1000;
  const read = key => {try {return JSON.parse(sessionStorage.getItem(key));} catch {return null;}};
  const valid = value => value?.version === 1 && typeof value.text === 'string' && value.text.length <= 20000 && Number.isFinite(value.createdAt) && value.createdAt <= Date.now()+60000 && Date.now()-value.createdAt < ttl;
  const saved = read(reviewKey), source = read(sourceKey);
  const payload = valid(saved) ? saved : valid(source) ? source : null;
  if (!payload) {
    feedback.textContent = 'This support brief is no longer available. Enter your requirements here, or return to Support to prepare a new brief.';
    return;
  }
  field.value = payload.text;
  feedback.textContent = 'Your support brief is ready. Review it and send it from your email application. Nothing has been sent.';
  try {sessionStorage.removeItem(sourceKey);} catch {}
  const save = () => {try {sessionStorage.setItem(reviewKey,JSON.stringify({version:1,createdAt:Date.now(),text:field.value}));} catch {feedback.textContent = 'Review and copy this brief before leaving; this browser could not keep edits for a refresh. Nothing has been sent.';}};
  save();
  field.addEventListener('input',save);
});
