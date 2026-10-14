/* Home hero video (Z02).
 *
 * Plays assets/video/banner-video.mp4 once over the poster image, then
 * crossfades back. The poster is always present, so every failure mode
 * (blocked autoplay, slow link, no H.264) leaves the hero as a still.
 *
 * Progress bar fill = currentTime / duration. Loading waits until window
 * load so the poster keeps the LCP slot.
 *
 * Gating: reduced-motion, save-data / 2G–3G, viewports under 1180px
 * (Z02 is PC-only), and engines without H.264.
 */
(() => {
  const video = document.querySelector('.home-hero-media--video');
  if (!video) return;

  const stage = video.closest('.home-hero');
  const bar = stage && stage.querySelector('.home-hero-progress');

  const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)');
  const conn = navigator.connection || {};
  const slowLink = conn.saveData === true || /^(slow-2g|2g|3g)$/.test(conn.effectiveType || '');
  const smallScreen = window.innerWidth < 1180;
  const canDecodeH264 = video.canPlayType('video/mp4; codecs="avc1.42E01E"') !== '';

  if (prefersReduced.matches || slowLink || smallScreen || !canDecodeH264) return;

  let started = false;
  let raf = 0;

  const setProgress = (value) => {
    if (bar) bar.style.setProperty('--home-hero-progress', String(value));
  };

  const tick = () => {
    if (video.paused || video.ended || !video.duration) return;
    setProgress(Math.min(1, video.currentTime / video.duration));
    raf = requestAnimationFrame(tick);
  };

  const stop = (complete) => {
    cancelAnimationFrame(raf);
    raf = 0;
    setProgress(complete ? 1 : 0);
    video.classList.remove('is-playing');
    if (stage) stage.classList.remove('is-intro-playing');
  };

  const start = () => {
    if (started) return;
    started = true;

    video.addEventListener('playing', () => {
      video.classList.add('is-playing');
      if (stage) stage.classList.add('is-intro-playing');
      tick();
    }, { once: true });
    video.addEventListener('ended', () => stop(true));
    video.addEventListener('error', () => stop(false));

    video.src = video.dataset.src;
    const played = video.play();
    if (played && typeof played.catch === 'function') played.catch(() => stop(false));
  };

  const defer = () => {
    if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(start, { timeout: 300 });
    else window.setTimeout(start, 200);
  };

  if (document.readyState === 'complete') defer();
  else window.addEventListener('load', defer, { once: true });
})();
