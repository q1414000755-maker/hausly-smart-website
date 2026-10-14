(function () {
  'use strict';

  function setup(root) {
    if (root.dataset.factoryMediaReady === 'true') return;
    var viewport = root.querySelector('[data-media-viewport]');
    var track = root.querySelector('[data-media-track]');
    var original = root.querySelector('[data-media-original]');
    var toggle = root.querySelector('[data-media-toggle]');
    var dialog = root.querySelector('[data-media-dialog]');
    if (!viewport || !track || !original || !toggle || !dialog) return;
    root.dataset.factoryMediaReady = 'true';

    var cards = Array.from(original.querySelectorAll('[data-media-index]'));
    var hint = root.querySelector('[data-media-hint]');
    var toggleLabel = root.querySelector('[data-media-toggle-label]');
    var pauseIcon = root.querySelector('[data-media-pause-icon]');
    var playIcon = root.querySelector('[data-media-play-icon]');
    var modalImage = root.querySelector('[data-media-dialog-image]');
    var modalTitle = root.querySelector('[data-media-dialog-title]');
    var mobileQuery = window.matchMedia('(max-width: 900px), (pointer: coarse)');
    var reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    var manualPaused = false;
    var hoverPaused = false;
    var focusPaused = false;
    var modalPaused = false;
    var visible = !('IntersectionObserver' in window);
    var loopWidth = 0;
    var frame = 0;
    var previousTime = 0;
    var scrollPosition = 0;
    var automatic = false;
    var returnFocus = null;
    var previousBodyOverflow = null;
    var resizeFrame = 0;

    function updateControl() {
      toggle.hidden = !automatic;
      toggle.setAttribute('aria-pressed', String(manualPaused));
      toggleLabel.textContent = manualPaused ? 'Resume' : 'Pause';
      pauseIcon.toggleAttribute('hidden', manualPaused);
      playIcon.toggleAttribute('hidden', !manualPaused);
      hint.textContent = automatic ? 'Slow-moving gallery' : (mobileQuery.matches ? 'Swipe to explore' : 'Scroll to explore');
    }

    function canMove() {
      return automatic && visible && !document.hidden && !manualPaused && !hoverPaused && !focusPaused && !modalPaused && loopWidth > 0;
    }

    function tick(time) {
      if (!canMove()) {
        frame = 0;
        previousTime = 0;
        return;
      }
      if (previousTime) {
        scrollPosition = (scrollPosition + Math.min(time - previousTime, 80) * 0.027) % loopWidth;
        viewport.scrollLeft = scrollPosition;
      }
      previousTime = time;
      frame = window.requestAnimationFrame(tick);
    }

    function syncMotion() {
      if (!canMove()) {
        if (frame) window.cancelAnimationFrame(frame);
        frame = 0;
        previousTime = 0;
      } else if (!frame) {
        previousTime = 0;
        scrollPosition = viewport.scrollLeft;
        frame = window.requestAnimationFrame(tick);
      }
    }

    function rebuild() {
      track.querySelectorAll('[data-media-copy]').forEach(function (copy) { copy.remove(); });
      automatic = !mobileQuery.matches && !reducedQuery.matches;
      root.dataset.mediaMode = automatic ? 'auto' : 'manual';
      var gap = parseFloat(window.getComputedStyle(track).columnGap) || 14;
      loopWidth = original.getBoundingClientRect().width + gap;
      if (automatic && loopWidth > 0) {
        var copies = Math.max(1, Math.ceil(viewport.clientWidth / loopWidth));
        for (var i = 0; i < copies; i += 1) {
          var copy = original.cloneNode(true);
          copy.removeAttribute('data-media-original');
          copy.setAttribute('data-media-copy', '');
          copy.setAttribute('aria-hidden', 'true');
          copy.querySelectorAll('a').forEach(function (link) { link.tabIndex = -1; });
          copy.querySelectorAll('[id]').forEach(function (node) { node.removeAttribute('id'); });
          track.appendChild(copy);
        }
        viewport.scrollLeft %= loopWidth;
      } else {
        viewport.scrollLeft = Math.min(viewport.scrollLeft, Math.max(0, viewport.scrollWidth - viewport.clientWidth));
      }
      scrollPosition = viewport.scrollLeft;
      updateControl();
      syncMotion();
    }

    function onResize() {
      if (resizeFrame) window.cancelAnimationFrame(resizeFrame);
      resizeFrame = window.requestAnimationFrame(function () { resizeFrame = 0; rebuild(); });
    }

    function releaseDialog() {
      if (previousBodyOverflow !== null) {
        document.body.style.overflow = previousBodyOverflow;
        previousBodyOverflow = null;
      }
      modalPaused = false;
      if (returnFocus && returnFocus.isConnected) {
        var cardLeft = returnFocus.getBoundingClientRect().left - original.getBoundingClientRect().left;
        viewport.scrollLeft = Math.max(0, Math.min(cardLeft - 12, viewport.scrollWidth - viewport.clientWidth));
        returnFocus.focus({ preventScroll: true });
      }
      returnFocus = null;
      syncMotion();
    }

    root.addEventListener('click', function (event) {
      var card = event.target.closest('.hfm-media__card');
      if (!card || !root.contains(card) || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (typeof dialog.showModal !== 'function') return;
      var photo = card.querySelector('img');
      var sourceCard = cards[Number(card.dataset.mediaIndex)];
      if (!photo || !sourceCard) return;
      event.preventDefault();
      returnFocus = sourceCard;
      modalImage.src = sourceCard.href;
      modalImage.alt = photo.alt;
      modalTitle.textContent = sourceCard.dataset.mediaTitle || 'Factory Photo';
      modalPaused = true;
      syncMotion();
      try {
        dialog.showModal();
        previousBodyOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        dialog.querySelector('[data-media-close]').focus({ preventScroll: true });
      } catch (error) {
        releaseDialog();
        window.location.assign(sourceCard.href);
      }
    });

    root.querySelector('[data-media-close]').addEventListener('click', function () { dialog.close(); });
    dialog.addEventListener('close', releaseDialog);
    dialog.addEventListener('click', function (event) {
      if (event.target !== dialog) return;
      var bounds = dialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
    });
    toggle.addEventListener('click', function () { manualPaused = !manualPaused; updateControl(); syncMotion(); });
    viewport.addEventListener('mouseenter', function () { hoverPaused = true; syncMotion(); });
    viewport.addEventListener('mouseleave', function () { hoverPaused = false; syncMotion(); });
    root.addEventListener('focusin', function (event) {
      focusPaused = event.target.matches(':focus-visible');
      syncMotion();
    });
    root.addEventListener('focusout', function (event) {
      if (!root.contains(event.relatedTarget)) { focusPaused = false; syncMotion(); }
    });
    document.addEventListener('visibilitychange', syncMotion);
    window.addEventListener('resize', onResize, { passive: true });
    [mobileQuery, reducedQuery].forEach(function (query) {
      if (query.addEventListener) query.addEventListener('change', rebuild);
      else if (query.addListener) query.addListener(rebuild);
    });
    if ('ResizeObserver' in window) new ResizeObserver(onResize).observe(viewport);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) cards.slice(0, 5).forEach(function (card) { card.querySelector('img').loading = 'eager'; });
        syncMotion();
      }, { rootMargin: '100px 0px' }).observe(root);
    }
    rebuild();
  }

  function initialize() { document.querySelectorAll('[data-factory-media]').forEach(setup); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true });
  else initialize();
})();
