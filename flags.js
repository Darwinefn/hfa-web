/* HFA · Fuente de banderas para Chrome/Edge en Windows. */
(function () {
  if (!/Windows/i.test(navigator.userAgent)) return;
  var url = 'https://cdn.jsdelivr.net/npm/country-flag-emoji-polyfill@0.1.10/dist/TwemojiCountryFlags.woff2';
  var range = 'U+1F1E6-1F1FF,U+1F3F4,U+E0062-E0063,U+E0065,U+E0067,U+E006C,U+E006E,U+E0073-E0074,U+E0077,U+E007F';
  var css = "@font-face{font-family:'Twemoji Country Flags';src:url('" + url + "') format('woff2');unicode-range:" + range + ";font-weight:100 900;font-display:swap}";
  var s = document.createElement('style');
  s.textContent = css + "body,button,input,select,option,.country-option,.country-selected,.profile-country,.player-directory-name,.hfa-user-main b,.roster-player-choice>span,.roster-selected-copy>strong{font-family:'Twemoji Country Flags',Inter,Arial,sans-serif}";
  document.head.appendChild(s);
})();
