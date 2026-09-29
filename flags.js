/* HFA · Banderas emoji en Windows (Chrome/Edge no las dibujan y salen como "ES", "MX"...).
   Solo se activa en Windows y solo se descarga la fuente si hay banderas en la página. */
(function () {
  if (!/Windows/i.test(navigator.userAgent)) return;
  var url = 'https://cdn.jsdelivr.net/npm/country-flag-emoji-polyfill@0.1.10/dist/TwemojiCountryFlags.woff2';
  var range = 'U+1F1E6-1F1FF,U+1F3F4,U+E0062-E0063,U+E0065,U+E0067,U+E006C,U+E006E,U+E0073-E0074,U+E0077,U+E007F';
  var css = ['Inter', 'Oswald'].map(function (f) {
    return "@font-face{font-family:'" + f + "';src:url('" + url + "') format('woff2');unicode-range:" + range + ";font-weight:100 900;font-display:swap}";
  }).join('');
  var s = document.createElement('style');
  s.textContent = css;
  document.head.appendChild(s);
})();
