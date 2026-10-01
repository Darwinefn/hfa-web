(function () {
  'use strict';

  var startedAt = performance.now();
  var finished = false;
  var style = document.createElement('style');
  style.textContent = '#hfaPageLoader{position:fixed;inset:0;z-index:20000;display:grid;place-content:center;justify-items:center;gap:18px;background:rgba(7,12,10,.97);color:#f2f6f4;font:600 15px Inter,Arial,sans-serif;opacity:1;visibility:visible;transition:opacity .24s ease,visibility .24s ease}#hfaPageLoader.is-hidden{opacity:0;visibility:hidden;pointer-events:none}#hfaPageLoader img{width:104px;height:104px;object-fit:contain;animation:hfaLoaderSpin 1.35s linear infinite;filter:drop-shadow(0 0 18px rgba(52,232,143,.32))}#hfaPageLoader span{color:#dbe7df}@keyframes hfaLoaderSpin{to{transform:rotate(360deg)}}@media(prefers-reduced-motion:reduce){#hfaPageLoader img{animation-duration:4s}}';
  document.head.appendChild(style);

  var loader = document.createElement('div');
  loader.id = 'hfaPageLoader';
  loader.setAttribute('role', 'status');
  loader.setAttribute('aria-live', 'polite');
  loader.innerHTML = '<img src="EDITABLE_HF.png" alt=""><span>Cargando...</span>';
  document.body.prepend(loader);

  function hideLoader() {
    if (finished) return;
    finished = true;
    var minimumTimeLeft = Math.max(0, 350 - (performance.now() - startedAt));
    setTimeout(function () {
      loader.classList.add('is-hidden');
      setTimeout(function () { loader.remove(); }, 260);
    }, minimumTimeLeft);
  }

  window.hfaLoadingReady = hideLoader;
  window.addEventListener('pageshow', function (event) {
    if (event.persisted) hideLoader();
  }, { once: true });
  setTimeout(hideLoader, 15000);
})();
