/* HFA · Selector de apariencia + guías (tour) por sección, para el sitio y el panel admin. */
(function () {
  'use strict';
  var THEME_KEY = 'hfa:theme';
  var TOUR_KEY = 'hfa:tours';
  var STAFF = ['admin', 'prueba_moderador', 'moderador', 'arbitro'];

  /* ---------- Apariencia ---------- */
  function accent(name, swatch, bg, panel, panel2, border, main, dim, mid, low) {
    return { label: name, swatch: swatch, vars: { '--bg': bg, '--panel': panel, '--panel-2': panel2, '--border': border, '--green': main, '--green-dim': dim, '--text-mid': mid, '--text-low': low } };
  }
  var THEMES = {
    oscuro:     { label: 'Oscuro (verde)', swatch: '#34e88f', vars: null },
    claro:      { label: 'Claro', swatch: '#f4f7f5', light: true, vars: { '--bg': '#eef3f0', '--panel': '#ffffff', '--panel-2': '#f3f7f5', '--border': '#cfdcd5', '--green': '#12935a', '--green-dim': '#8fcdb2', '--text-hi': '#10201a', '--text-mid': '#3f5a4f', '--text-low': '#6c8478' } },
    medianoche: { label: 'Medianoche (negro)', swatch: '#111', vars: { '--bg': '#000000', '--panel': '#0b0b0b', '--panel-2': '#121212', '--border': '#252525', '--green': '#34e88f', '--green-dim': '#1f7a52', '--text-mid': '#a5a5a5', '--text-low': '#666666' } },
    azul:       accent('Azul', '#4aa3ff', '#080d14', '#0f1722', '#131e2c', '#1f3047', '#4aa3ff', '#235b94', '#9db3c9', '#5b7088'),
    cian:       accent('Cian', '#2fd6e6', '#070f12', '#0d1a1e', '#112228', '#1c3a42', '#2fd6e6', '#1b7883', '#9cbcc2', '#5a7b82'),
    morado:     accent('Morado', '#a87bff', '#0c0a14', '#151124', '#1a1530', '#2b2447', '#a87bff', '#5a3f99', '#aaa0c7', '#6a6288'),
    rosa:       accent('Rosa', '#ff7ab8', '#120a0f', '#1d1219', '#251720', '#3d2431', '#ff7ab8', '#99466f', '#c9a3b4', '#8a6677'),
    rojo:       accent('Rojo', '#ff5d5d', '#120808', '#1c1111', '#241616', '#3d2222', '#ff5d5d', '#992f2f', '#c9a5a5', '#8a6666'),
    naranja:    accent('Naranja', '#ff9d4d', '#100b07', '#1a130d', '#211810', '#38281a', '#ff9d4d', '#995a22', '#c7b09b', '#8a735f'),
    dorado:     accent('Dorado', '#ffd54a', '#100e06', '#1a170c', '#211d0f', '#383117', '#ffd54a', '#99801f', '#c7bd98', '#8a8160'),
    lima:       accent('Lima', '#b6f03c', '#0b1005', '#141c0b', '#19230e', '#2b3a17', '#b6f03c', '#6d8f1f', '#b4c492', '#74855a'),
    turquesa:   accent('Turquesa', '#1de9b6', '#06100e', '#0c1b18', '#0f2420', '#17403a', '#1de9b6', '#12806a', '#97c4bb', '#5a8279'),
    indigo:     accent('Índigo', '#7c8cff', '#080a16', '#0f1224', '#141830', '#232a52', '#7c8cff', '#3f4ba3', '#a3a9d1', '#646a96'),
    coral:      accent('Coral', '#ff6f61', '#130908', '#1e100e', '#271512', '#42241f', '#ff6f61', '#9c3f36', '#cfa9a4', '#8f6c67'),
    vino:       accent('Vino', '#e8587f', '#12060b', '#1e0c14', '#27101a', '#43192a', '#e8587f', '#8f2d49', '#cfa3b2', '#8f6676'),
    grafito:    accent('Grafito', '#cfd8dc', '#0d0e10', '#16181b', '#1c1f23', '#2c3036', '#cfd8dc', '#7b868c', '#a4acb1', '#6b7378'),
    clarozul:   { label: 'Claro azul', swatch: '#cfe0fb', light: true, vars: { '--bg': '#eaf1fb', '--panel': '#ffffff', '--panel-2': '#f2f6fd', '--border': '#c9d8ee', '--green': '#1d6fe0', '--green-dim': '#9dbcf0', '--text-hi': '#0f1c33', '--text-mid': '#41567a', '--text-low': '#6f82a3' } },
    clarocalido:{ label: 'Claro cálido', swatch: '#f3e3cf', light: true, vars: { '--bg': '#f7f1e8', '--panel': '#fffdf9', '--panel-2': '#faf4ea', '--border': '#e3d5c0', '--green': '#c2570c', '--green-dim': '#e3b48c', '--text-hi': '#2a1d10', '--text-mid': '#6b5238', '--text-low': '#9a8266' } }
  };

  /* ---------- Temática global de la web (la decide el administrador) ---------- */
  var SITE_KEY = 'hfa:siteTheme';
  function readSiteCache() { try { return 'normal'; } catch (e) { return 'normal'; } }
  var siteTheme = readSiteCache();

  function readTheme() { try { return localStorage.getItem(THEME_KEY) || 'oscuro'; } catch (e) { return 'oscuro'; } }

  function applyTheme(name) {
    if (siteTheme === 'mundial') { var own = document.getElementById('hfaThemeStyle'); if (own) own.textContent = ''; return; }
    var theme = THEMES[name] || THEMES.oscuro;
    var tag = document.getElementById('hfaThemeStyle');
    if (!tag) { tag = document.createElement('style'); tag.id = 'hfaThemeStyle'; document.head.appendChild(tag); }
    var css = '';
    if (theme.vars) {
      css = ':root{' + Object.keys(theme.vars).map(function (k) { return k + ':' + theme.vars[k] + ' !important'; }).join(';') + '}';
      css += 'body{background:var(--bg) !important;color:var(--text-hi)}';
      if (theme.light) css += '.profile-header-card,.profile-meta-item,.profile-metric-card,.profile-metric-card.highlight,.profile-tab{background:var(--panel) !important;background-image:none !important;border-color:var(--border) !important;color:var(--text-hi) !important}.profile-tab{color:var(--text-mid) !important}.profile-tab.active{background:var(--green) !important;color:#fff !important}.profile-header-card *,.profile-metric-card *{text-shadow:none !important}.profile-header-card h2,.profile-header-card h1,.profile-header-card strong,.profile-metric-card strong{color:var(--text-hi) !important}.admin-section-nav{background:var(--panel) !important}.admin-section-nav button:hover,.admin-section-nav button.active{background:rgba(120,120,120,.14) !important}header,footer{background:var(--panel) !important}input,select,textarea,.input{background:#fff !important;color:var(--text-hi) !important;border-color:var(--border) !important}.btn-primary,.btn.btn-primary{color:#fff !important}';
    }
    tag.textContent = css;
    document.documentElement.setAttribute('data-hfa-theme', name);
    try { localStorage.setItem(THEME_KEY, name); } catch (e) {}
  }
  applyTheme(readTheme());

  var MUNDIAL_CSS = ''; // la temática Mundial se ha retirado


  function applySiteTheme(name, persist) {
    siteTheme = 'normal';
    var tag = document.getElementById('hfaSiteThemeStyle');
    if (!tag) { tag = document.createElement('style'); tag.id = 'hfaSiteThemeStyle'; (document.head || document.documentElement).appendChild(tag); }
    tag.textContent = siteTheme === 'mundial' ? MUNDIAL_CSS : '';
    document.documentElement.setAttribute('data-hfa-site', siteTheme);
    if (persist !== false) { try { localStorage.setItem(SITE_KEY, siteTheme); } catch (e) {} }
    applyTheme(readTheme());
    var btn = document.querySelector('[data-x-theme]'); if (btn) btn.style.display = siteTheme === 'mundial' ? 'none' : '';
    var panel = document.querySelector('.hfa-x-theme-panel'); if (panel && siteTheme === 'mundial') panel.hidden = true;
    try { window.dispatchEvent(new CustomEvent('hfa:sitetheme', { detail: siteTheme })); } catch (e) {}
  }

  function fetchSiteTheme() { /* sin temática global: todos ven la web normal */ }

  var BASE_CSS = '.hfa-x-fab{position:fixed;left:16px;bottom:16px;z-index:9990;display:flex;gap:8px}.hfa-x-fab button{border:1px solid var(--border,#22302a);background:var(--panel,#121a17);color:var(--text-hi,#f2f6f4);border-radius:8px;padding:10px 13px;font:600 13px Inter,Arial,sans-serif;cursor:pointer;box-shadow:0 6px 18px #0005}.hfa-x-fab button:hover{border-color:var(--green,#34e88f)}.hfa-x-theme-panel{position:fixed;left:16px;bottom:64px;z-index:9991;min-width:220px;max-height:min(70vh,430px);overflow:auto;padding:12px;border:1px solid var(--border,#22302a);border-radius:10px;background:var(--panel,#121a17);color:var(--text-hi,#f2f6f4);font:13px Inter,Arial,sans-serif;box-shadow:0 14px 40px #0008}.hfa-x-theme-panel[hidden]{display:none}.hfa-x-theme-panel strong{display:block;margin-bottom:8px}.hfa-x-theme-opt{display:flex;align-items:center;gap:10px;width:100%;padding:8px 9px;margin-top:4px;border:1px solid transparent;border-radius:7px;background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer}.hfa-x-theme-opt:hover{background:var(--panel-2,#16201c)}.hfa-x-theme-opt[aria-pressed=true]{border-color:var(--green,#34e88f)}.hfa-x-dot{width:16px;height:16px;border-radius:50%;border:1px solid #0006;flex:none}' +
    '.hfa-staff-toast{position:fixed;right:16px;bottom:16px;z-index:9995;width:min(340px,calc(100vw - 32px));padding:14px 16px;border:1px solid #ff7a7a;border-left-width:5px;border-radius:10px;background:var(--panel,#121a17);color:var(--text-hi,#f2f6f4);font:13px/1.45 Inter,Arial,sans-serif;box-shadow:0 14px 40px #000a}.hfa-staff-toast b{display:block;color:#ff9a9a;font-size:14px}.hfa-staff-toast span{display:block;margin:4px 0 10px;color:var(--text-mid,#9fb3ac)}.hfa-staff-toast div{display:flex;gap:8px}.hfa-staff-toast a,.hfa-staff-toast button{padding:7px 12px;border-radius:6px;border:1px solid var(--border,#22302a);background:var(--panel-2,#16201c);color:inherit;font:600 12px Inter,Arial,sans-serif;text-decoration:none;cursor:pointer}.hfa-staff-toast a{background:#ff7a7a;border-color:#ff7a7a;color:#1a0707}@media(max-width:520px){.hfa-staff-toast{bottom:76px}}.hfa-tour-shield{position:fixed;inset:0;z-index:30000;background:transparent}.hfa-tour-hole{position:fixed;z-index:30001;border-radius:8px;box-shadow:0 0 0 9999px rgba(0,0,0,.66),0 0 0 3px var(--green,#34e88f);pointer-events:none}.hfa-tour-hole.full{box-shadow:none;background:rgba(0,0,0,.66);border-radius:0}.hfa-tour-card{position:fixed;z-index:30002;width:min(350px,calc(100vw - 24px));padding:16px;border:1px solid var(--green,#34e88f);border-radius:10px;background:var(--panel,#121a17);color:var(--text-hi,#f2f6f4);font:14px/1.5 Inter,Arial,sans-serif;box-shadow:0 18px 50px #000a}.hfa-tour-card h4{margin:0 0 6px;font-size:15px;color:var(--green,#34e88f)}.hfa-tour-card p{margin:0 0 14px;color:var(--text-mid,#9fb3ac)}.hfa-tour-row{display:flex;align-items:center;justify-content:space-between;gap:8px}.hfa-tour-row small{color:var(--text-low,#5c706a)}.hfa-tour-row button{border:1px solid var(--border,#22302a);background:var(--panel-2,#16201c);color:var(--text-hi,#f2f6f4);border-radius:6px;padding:7px 12px;font:600 12px Inter,Arial,sans-serif;cursor:pointer}.hfa-tour-row button.primary{background:var(--green,#34e88f);border-color:var(--green,#34e88f);color:#05130c}.hfa-tour-row button.hfa-tour-skip{background:none;border:0;color:var(--text-low,#5c706a);text-decoration:underline}@media(max-width:520px){.hfa-x-fab{bottom:76px}.hfa-x-theme-panel{bottom:124px}}';


  /* ---- Móvil: menú siempre accesible, botones flotantes compactos, cuerpo sin desbordes ---- */
  var MOBILE_CSS = '@media(max-width:900px){' +
    'html,body{max-width:100%;overflow-x:hidden}' +
    'header .nav-left{display:contents!important}header .brand{order:1;margin-right:auto}header .nav-right{order:2}' +
    'header{flex-wrap:wrap!important;row-gap:8px!important;padding:10px 14px!important}' +
    'header nav,header nav.links,nav#nav,nav#mainNav{display:flex!important;order:5;flex:0 0 100%;width:100%;max-width:100%;overflow-x:auto;white-space:nowrap;gap:6px!important;padding:2px 0 4px;margin:0;scrollbar-width:none;-webkit-overflow-scrolling:touch}' +
    'header nav::-webkit-scrollbar{display:none}' +
    'header nav>a,header nav .community-nav-wrap{flex:0 0 auto}' +
    'header nav>a,header nav button{min-height:0!important}header nav>a{padding:8px 12px!important;border:1px solid var(--border,#22302a)!important;border-radius:999px;font-size:13px!important;line-height:1}' +
    'header nav>a.active{border-color:var(--green,#34e88f)!important;color:var(--green,#34e88f)!important;background:rgba(52,232,143,.08)}' +
    '.community-nav-wrap{position:static!important}' +
    '.community-nav-trigger{padding:8px 12px!important;font-size:13px!important;line-height:1!important;font-weight:400!important;min-height:0!important;height:auto}' +
    '.community-nav-menu{position:fixed!important;left:14px!important;right:14px!important;top:var(--hfa-menu-top,120px)!important;min-width:0!important;z-index:9000!important;display:none!important}' +
    '.community-nav-wrap.open .community-nav-menu{display:flex!important}' +
    '.community-nav-menu a{padding:13px 12px!important;font-size:14px!important}' +
    '}' +
    '@media(max-width:640px){' +
    'main{padding-left:16px!important;padding-right:16px!important}' +
    '.title,h1.title{font-size:clamp(28px,9vw,40px)!important;line-height:1.1}' +
    'table{display:block;max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}' +
    'img,video,iframe{max-width:100%}' +
    '.btn,button,.input,select,input,textarea{min-height:42px}' +
    'input,select,textarea{font-size:16px!important}' +
    '.hfa-x-fab{left:auto!important;right:12px!important;bottom:calc(12px + env(safe-area-inset-bottom))!important;gap:6px!important;opacity:.92}' +
    '.hfa-x-fab button{padding:9px 11px!important;font-size:12px!important;border-radius:999px!important}' +
    '.hfa-staff-toast{left:12px!important;right:12px!important;width:auto!important;bottom:64px!important}' +
    'footer,.hfa-footer{padding-bottom:70px!important}' +
    '.modal,.hfa-popup,.hfa-pop{max-width:calc(100vw - 20px)!important;max-height:90vh;overflow-y:auto}' +
    '}';

  /* Álbum: siempre en una pestaña nueva, nunca dentro de la web (también para enlaces antiguos). */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]'); if (!a) return;
    var h = a.getAttribute('href') || '';
    if (/[?&]view=album(&|$)/.test(h) || h.indexOf('cards.hfasociacion.com') !== -1) {
      e.preventDefault(); e.stopPropagation();
      window.open('https://cards.hfasociacion.com/', '_blank', 'noopener');
    }
  }, true);
  function addCss() { var s = document.createElement('style'); s.textContent = BASE_CSS + MOBILE_CSS; document.head.appendChild(s); }
  document.addEventListener('click', function (e) { var t = e.target.closest && e.target.closest('[data-community-menu]'); if (t) { var r = t.closest('header') ? t.closest('header').getBoundingClientRect() : t.getBoundingClientRect(); document.documentElement.style.setProperty('--hfa-menu-top', Math.round(r.bottom + 6) + 'px'); } }, true);

  function buildFab() {
    var wrap = document.createElement('div');
    wrap.className = 'hfa-x-fab';
    wrap.innerHTML = '<button type="button" data-x-theme aria-haspopup="true" title="Cambiar apariencia">🎨 Tema</button><button type="button" data-x-tour title="Ver la guía de esta sección">❔ Guía</button>';
    var panel = document.createElement('div');
    panel.className = 'hfa-x-theme-panel';
    panel.hidden = true;
    function renderPanel() {
      var cur = readTheme();
      panel.innerHTML = '<strong>Apariencia</strong>' + Object.keys(THEMES).map(function (k) {
        return '<button type="button" class="hfa-x-theme-opt" data-theme="' + k + '" aria-pressed="' + (k === cur) + '"><span class="hfa-x-dot" style="background:' + THEMES[k].swatch + '"></span>' + THEMES[k].label + '</button>';
      }).join('');
    }
    renderPanel();
    document.body.appendChild(wrap);
    document.body.appendChild(panel);
    wrap.addEventListener('click', function (e) {
      if (e.target.closest('[data-x-theme]')) { panel.hidden = !panel.hidden; return; }
      if (e.target.closest('[data-x-tour]')) { panel.hidden = true; startTour(true); }
    });
    panel.addEventListener('click', function (e) {
      var opt = e.target.closest('[data-theme]');
      if (!opt) return;
      e.stopPropagation();
      applyTheme(opt.dataset.theme);
      renderPanel();
    });
    document.addEventListener('click', function (e) {
      if (!panel.hidden && !e.target.closest('.hfa-x-theme-panel') && !e.target.closest('[data-x-theme]')) panel.hidden = true;
    });
  }

  /* ---------- Guías ---------- */
  function readSession() { try { return JSON.parse(localStorage.getItem('hfa:session') || 'null'); } catch (e) { return null; } }
  function seenTours() { try { return JSON.parse(localStorage.getItem(TOUR_KEY) || '{}') || {}; } catch (e) { return {}; } }
  function markSeen(id) { var t = seenTours(); t[id] = 1; try { localStorage.setItem(TOUR_KEY, JSON.stringify(t)); } catch (e) {} }

  function pageKey() {
    var page = (location.pathname.split('/').pop() || 'afh-liga.html').toLowerCase();
    var params = new URLSearchParams(location.search);
    if (page.indexOf('seccion') === 0) {
      var view = params.get('view') || 'comunidad';
      return 'seccion:' + view + (view === 'comunidad' && params.get('sub') ? ':' + params.get('sub') : '');
    }
    if (page.indexOf('clasificacion') === 0) return 'clasificacion';
    return 'inicio';
  }

  /* Localiza un elemento: selector CSS, o "card:Texto" = tarjeta visible del panel admin cuyo título contiene ese texto. */
  function find(sel) {
    if (typeof sel === 'function') { try { return sel(); } catch (e) { return null; } }
    if (typeof sel === 'string' && sel.indexOf('card:') === 0) {
      var text = sel.slice(5).toLowerCase();
      var cards = document.querySelectorAll('.admin-section-visible, .admin-tools > .content-card');
      for (var i = 0; i < cards.length; i++) {
        var t = cards[i].querySelector('.admin-title');
        if (t && t.textContent.toLowerCase().indexOf(text) !== -1 && visible(cards[i])) return cards[i];
      }
      return null;
    }
    var list = document.querySelectorAll(sel);
    for (var j = 0; j < list.length; j++) if (visible(list[j])) return list[j];
    return null;
  }
  function visible(el) { if (!el) return false; var r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; }

  var TOURS = {
    'inicio': [
      { sel: '#mainNav', title: 'Menú principal', text: 'Desde aquí vas a Comunidad, Clasificación, Torneos, Estadísticas, Partidos, tu Cuenta y el Buzón.' },
      { sel: '#navRight', title: 'Tu cuenta', text: 'Inicia sesión o crea tu cuenta con tu nombre de Habbo. Con la sesión iniciada verás tu perfil y tus notificaciones.' },
      { sel: '.hero', title: 'Portada de la liga', text: 'Resumen rápido de la liga: cuántos equipos y partidos hay y un saludo para ti si ya iniciaste sesión.' },
      { sel: '.hero-actions', title: 'Accesos rápidos', text: 'Botones directos a las secciones más usadas. El acceso al panel de administración solo aparece al personal con rol.' },
      { sel: function () { var t = document.getElementById('tickerTrack'); return t && t.parentElement; }, title: 'Cinta de novedades', text: 'Aquí pasan las jornadas de cada división a medida que se van creando, con su estado: finalizada, en curso o próxima.' },
      { sel: '#homeNews', title: 'Noticias', text: 'Las novedades más recientes publicadas por la administración. Usa las flechas para ver más.' },
      { sel: '#retiroGiova', title: 'Retiro Giova', text: 'Cuenta atrás en días, horas, minutos y segundos hasta el 31 de diciembre de 2026, con el mensaje de agradecimiento a Giova.' },
      { sel: '#resumenNextMatch', title: 'Próximo partido', text: 'El siguiente encuentro programado, con fecha y hora.' },
      { sel: '#resumenTeams', title: 'Equipos', text: 'Los equipos de cada división de un vistazo.' },
      { sel: '#resumenFinished', title: 'Últimos resultados', text: 'Los partidos ya jugados. Pulsa uno para ver el acta completa.' }
    ],
    'clasificacion': [
      { sel: '#classificationNav', title: 'Menú', text: 'Navega por el resto de secciones de la web.' },
      { sel: '.title-row', title: 'Clasificación', text: 'Tabla de posiciones de la liga. Puedes cambiar de torneo desde aquí si hay varios.' },
      { sel: '#divisionTabs', title: 'Divisiones', text: 'Cambia entre 1D, 2D, 3D y 4D para ver la tabla de cada una.' },
      { sel: '.table-wrap', title: 'Tabla de posiciones', text: 'Puntos, partidos jugados, goles a favor y en contra y diferencia, ordenados por posición.' },
      { sel: '.legend', title: 'Leyenda', text: 'Explica los colores: zonas de ascenso, descenso y demás.' }
    ],
    'seccion:comunidad': [
      { sel: '.community-nav-wrap', title: 'Menú Comunidad', text: 'Despliégalo para ir a Palmarés, Noticias, Equipos o Jugadores.' },
      { sel: '.community-shell', title: 'Comunidad', text: 'Aquí aparece el contenido de la subsección que elijas en el menú Comunidad.' }
    ],
    'seccion:comunidad:palmares': [
      { sel: '.community-shell', title: 'Palmarés', text: 'Los títulos y reconocimientos de la asociación, con sus ganadores.' }
    ],
    'seccion:comunidad:noticias': [
      { sel: '.community-shell', title: 'Noticias', text: 'Las novedades de la liga. Pulsa una noticia para leerla completa.' }
    ],
    'seccion:comunidad:equipos': [
      { sel: '.community-shell .panel-card', title: 'Equipos por división', text: 'Cada tarjeta es una división con sus equipos.' },
      { sel: '.community-shell [data-team-id]', title: 'Ver jugadores de un equipo', text: 'Pulsa un equipo para ver su plantilla.' }
    ],
    'seccion:comunidad:jugadores': [
      { sel: '.players-count', title: 'Total de jugadores', text: 'Cuántos jugadores coinciden con los filtros que tengas aplicados.' },
      { sel: '#playerDirectorySearch', title: 'Buscador', text: 'Escribe el nombre de un jugador para encontrarlo.' },
      { sel: '.players-filters', title: 'Filtros', text: 'Filtra por país, rango GRL y si el jugador está libre o ya tiene equipo.' },
      { sel: '.players-filter-buttons', title: 'Posiciones', text: 'Quédate solo con porteros, medios, bandas, delanteros o neutros.' },
      { sel: '.players-grid', title: 'Jugadores registrados', text: 'Todas las cuentas registradas aparecen aquí. Pulsa una para ver su perfil.' }
    ],
    'seccion:torneos': [
      { sel: '.panel-grid', title: 'Torneos', text: 'Los torneos de la asociación. Pulsa uno para verlo.' },
      { sel: '.notice', title: 'Aviso', text: 'Información importante sobre los torneos.' }
    ],
    'seccion:estadisticas': [
      { sel: '.stats-filter-row', title: 'Filtros', text: 'Elige la división y la categoría: goleadores, asistencias, MVP y más.' },
      { sel: '.stats-shell', title: 'Estadísticas', text: 'Los mejores jugadores de la categoría elegida, ordenados de mayor a menor.' }
    ],
    'seccion:partidos': [
      { sel: '.public-match-toolbar', title: 'Filtros de partidos', text: 'Filtra por torneo y división para encontrar un partido.' },
      { sel: '.public-match-rounds', title: 'Jornadas', text: 'Salta a una jornada concreta o ve todas.' },
      { sel: '.fixtures-list', title: 'Lista de partidos', text: 'Cada tarjeta es un partido con fecha, hora y resultado.' },
      { sel: '.attendance-rosters', title: 'Dar presente', text: 'Si juegas, pulsa «Presente» junto a tu nombre. Te preguntaremos si entras con conexión normal, ExitLag o VPN, y además la web comprueba si tu conexión parece una VPN. Los administradores lo verán.' },
      { sel: '.fixture-prediction', title: 'Predicción', text: 'Vota quién crees que ganará el partido.' },
      { sel: '[data-view-summary]', title: 'Resumen del partido', text: 'En partidos terminados verás el acta: goles, tarjetas, alineaciones y premios.' }
    ],
    'seccion:album': [
      { sel: '.panel-grid', title: 'Álbum', text: 'Tu colección de cromos y recuerdos de la liga.' }
    ],
    'seccion:cuenta': [
      { sel: '.account-layout', title: 'Tu cuenta', text: 'Tu perfil: avatar, posición, país y datos de juego.' },
      { sel: '.profile-avatar', title: 'Tu keko', text: 'Tu avatar de Habbo tal como lo verán los demás.' },
      { sel: '#hfaPassOpen', title: 'Cambiar contraseña', text: 'Pulsa este botón para cambiar tu contraseña: te pedirá la actual y la nueva dos veces.' },
      { sel: '.mailbox-panel', title: 'Ofertas', text: 'Aquí llegan las ofertas de los equipos para que las aceptes o rechaces.', optional: true }
    ],
    'seccion:buzon': [
      { sel: '.mailbox-page', title: 'Buzón', text: 'Aquí llegan las ofertas de equipos y los avisos para ti.' }
    ],
    'seccion:admin': [
      { sel: '.title-row', title: 'Panel de administración', text: 'Zona privada del personal. Arriba tienes el título y el botón de tutorial extendido.' },
      { sel: '.admin-section-nav', title: 'Menú del panel', text: 'Cada botón abre una zona: competición, plantilla, comunidad y actas. Te las enseño una a una.' },
      { click: '[data-admin-section="competition"]', sel: '#adminActiveTournamentCard', title: 'Torneo activo', text: 'Elige sobre qué torneo vas a crear y gestionar partidos.' },
      { after: true, sel: '#adminMatchBuilder', title: 'Jornadas y partidos', text: 'Crea jornadas y arrastra los equipos a Local y Visitante, o genera todas las jornadas de una división de una vez.' },
      { click: '[data-admin-section="matches"]', sel: '#adminMatchList', title: 'Gestión de partidos', text: 'Todos los partidos con su resultado y estado. El botón ⚽ abre el acta de cada partido.' },
      { click: '[data-admin-section="attendance"]', sel: '#adminAttendanceList', title: 'Presentes por partido', text: 'Cada partido con cuántos jugadores dieron presente. Pulsa «Ver presentes» para ver quién fue, a qué hora y si usó ExitLag o VPN, y quién falta por confirmar.' },
      { click: '[data-admin-section="tournaments"]', sel: '#tournamentManagement', title: 'Temporadas y torneos', text: 'Crea torneos, elige el activo y elimina los que ya no uses.' },
      { click: '[data-admin-section="teams"]', sel: 'card:Agregar equipo', title: 'Equipos', text: 'Crea un equipo con su nombre, escudo y división.' },
      { after: true, sel: '#rosterManagement', title: 'Buscar y agregar jugadores', text: 'Busca una cuenta registrada, púlsala y elige el equipo. Solo se pueden agregar jugadores con división asignada.' },
      { after: true, sel: '#ownerManagement', title: 'Dueño de equipo', text: 'Asigna a una cuenta como dueño de un equipo para que pueda enviar ofertas.' },
      { click: '[data-admin-section="users"]', sel: '#divisionManagement', title: 'Usuarios y divisiones', text: 'Todas las cuentas con su IP. Pulsa un nombre para asignarle divisiones.' },
      { after: true, sel: '#adminDivisionSearch', title: 'Buscar usuario', text: 'Filtra la lista por nombre.' },
      { after: true, sel: '.hfa-users-toolbar', title: 'Actualizar y filtrar', text: 'Recarga la lista de cuentas o muéstrale solo las que comparten IP.' },
      { click: '[data-admin-section="roles"]', sel: '#roleManagement', title: 'Roles', text: 'Asigna Administrador, Moderador, Árbitro, Dueño de equipo o Sin rol. El cambio se guarda en la base de datos.' },
      { click: '[data-admin-section="community"]', sel: 'card:Palmar', title: 'Palmarés', text: 'Añade o borra los reconocimientos de la comunidad.' },
      { after: true, sel: 'card:Noticias', title: 'Noticias', text: 'Publica noticias con imagen; salen en la portada.' },
      { click: '[data-admin-section="sponsors"]', sel: 'card:Sponsors', title: 'Patrocinadores', text: 'Gestiona los patrocinadores que se muestran en la web.' },
      { click: '[data-admin-section="maintenance"]', sel: '#adminMaintenance', title: 'Modo mantenimiento', text: 'Solo los administradores. Oculta la web a todos los demás y muestra el aviso de mantenimiento con el logo de HFA.' },
      { click: '[data-admin-section="acts"]', sel: '#actaManagement', title: 'Actas', text: 'Elige un partido y registra goles, tarjetas, cambios, alineación y menciones. Arriba verás quién dio presente y con qué conexión.' },
      { sel: '[data-open-admin-tutorial]', title: 'Tutorial completo', text: 'Para una explicación más larga del panel, pulsa este botón cuando quieras.' }
    ]
  };

  var running = false;

  function startTour(force) {
    if (running) return;
    var key = pageKey();
    var all = TOURS[key] || [];
    var steps = [], lastClickOk = false;
    all.forEach(function (s) {
      if (s.click) { lastClickOk = !!document.querySelector(s.click); if (lastClickOk) steps.push(s); }
      else if (visible(find(s.sel)) || (s.after && lastClickOk)) steps.push(s);
    });
    if (!steps.length) {
      if (!force) return;
      steps = [{ sel: 'body', title: 'Guía', text: 'Todavía no hay guía específica para esta sección. Usa el menú de arriba para explorar la web.' }];
    }
    running = true;
    var i = 0, raf = 0, token = 0;
    var activeBtn = document.querySelector('.admin-section-nav button.active');
    var shield = document.createElement('div'); shield.className = 'hfa-tour-shield';
    var hole = document.createElement('div'); hole.className = 'hfa-tour-hole';
    var card = document.createElement('div'); card.className = 'hfa-tour-card'; card.setAttribute('role', 'dialog'); card.setAttribute('aria-live', 'polite');
    document.body.append(shield, hole, card);
    var target = null;

    function end() {
      cancelAnimationFrame(raf); running = false;
      shield.remove(); hole.remove(); card.remove();
      document.removeEventListener('keydown', onKey, true);
      markSeen(key);
      if (activeBtn) activeBtn.click();
      window.scrollTo(0, 0);
    }
    function onKey(e) {
      if (e.key === 'Escape') { e.preventDefault(); end(); }
      else if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); next(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
    }
    function headerBottom() { var h = document.querySelector('header'); if (!h) return 0; var r = h.getBoundingClientRect(); return r.bottom > 0 && r.top <= 0 && getComputedStyle(h).position !== 'static' ? r.bottom : 0; }

    function layout() {
      if (!running) return;
      var vw = window.innerWidth, vh = window.innerHeight, pad = 6;
      var cw = card.offsetWidth, ch = card.offsetHeight, gap = 14, margin = 12;
      if (!target || !visible(target) || target === document.body) {
        hole.className = 'hfa-tour-hole full';
        hole.style.cssText = 'left:0;top:0;width:100%;height:100%';
        card.style.left = Math.max(margin, (vw - cw) / 2) + 'px';
        card.style.top = Math.max(margin, (vh - ch) / 2) + 'px';
      } else {
        hole.className = 'hfa-tour-hole';
        var r = target.getBoundingClientRect();
        var l = Math.max(0, r.left - pad), t = Math.max(0, r.top - pad);
        var rr = Math.min(vw, r.right + pad), bb = Math.min(vh, r.bottom + pad);
        hole.style.left = l + 'px'; hole.style.top = t + 'px';
        hole.style.width = Math.max(0, rr - l) + 'px'; hole.style.height = Math.max(0, bb - t) + 'px';
        var cx = Math.max(margin, Math.min(l, vw - cw - margin));
        var cy = null, cl = cx;
        if (bb + gap + ch <= vh - margin) cy = bb + gap;                 /* debajo */
        else if (t - gap - ch >= margin) cy = t - gap - ch;              /* encima */
        else if (rr + gap + cw <= vw - margin) { cl = rr + gap; cy = Math.max(margin, Math.min(t, vh - ch - margin)); } /* a la derecha */
        else if (l - gap - cw >= margin) { cl = l - gap - cw; cy = Math.max(margin, Math.min(t, vh - ch - margin)); }   /* a la izquierda */
        else { cl = Math.max(margin, (vw - cw) / 2); cy = vh - ch - margin; } /* objetivo enorme: tarjeta abajo */
        card.style.left = cl + 'px'; card.style.top = cy + 'px';
      }
      raf = requestAnimationFrame(layout);
    }

    function show(idx, dir) {
      var my = ++token;
      i = idx;
      var s = steps[i];
      function go() {
        if (my !== token || !running) return;
        var el = s.sel === 'body' ? document.body : find(s.sel);
        if (!el && s.sel !== 'body') { /* no existe: salta al siguiente paso */
          var n = i + (dir || 1);
          if (n < 0 || n >= steps.length) return end();
          return show(n, dir);
        }
        target = el;
        if (el !== document.body) {
          var r0 = el.getBoundingClientRect(), tall = r0.height > window.innerHeight * 0.7;
          el.scrollIntoView({ block: tall ? 'start' : 'center', inline: 'nearest', behavior: 'instant' });
          var hb = headerBottom(), r1 = el.getBoundingClientRect();
          if (r1.top < hb + 10) window.scrollBy({ top: r1.top - hb - 14, left: 0, behavior: 'instant' });
        }
        var last = i === steps.length - 1;
        card.innerHTML = '<h4></h4><p></p><div class="hfa-tour-row"><small>' + (i + 1) + ' / ' + steps.length + '</small><span><button type="button" class="hfa-tour-skip" data-t="skip">Saltar</button> ' + (i > 0 ? '<button type="button" data-t="prev">Atrás</button> ' : '') + '<button type="button" class="primary" data-t="next">' + (last ? 'Entendido' : 'Siguiente') + '</button></span></div>';
        card.querySelector('h4').textContent = s.title;
        card.querySelector('p').textContent = s.text;
        cancelAnimationFrame(raf); layout();
        var nb = card.querySelector('[data-t="next"]'); if (nb) nb.focus({ preventScroll: true });
      }
      if (s.click) {
        var b = document.querySelector(s.click);
        if (b) b.click();
        setTimeout(go, 320);
      } else go();
    }
    function next() { if (i >= steps.length - 1) end(); else show(i + 1, 1); }
    function prev() { if (i > 0) show(i - 1, -1); }
    card.addEventListener('click', function (e) {
      var b = e.target.closest('[data-t]'); if (!b) return;
      if (b.dataset.t === 'skip') end(); else if (b.dataset.t === 'prev') prev(); else next();
    });
    document.addEventListener('keydown', onKey, true);
    show(0, 1);
  }

  /* Primera visita: espera a que la sección esté dibujada y lanza la guía una sola vez. */
  function autoTour() {
    var key = pageKey();
    if (seenTours()[key]) return;
    if (key === 'seccion:admin') {
      var s = readSession();
      if (!s || STAFF.indexOf(s.role) === -1) return;
    }
    var tries = 0;
    var timer = setInterval(function () {
      tries++;
      var ready = !document.getElementById('hfaPageLoader') && !document.getElementById('accountCreatedOverlay');
      if (key === 'seccion:admin') ready = ready && !!document.querySelector('.admin-section-nav');
      if (ready) { clearInterval(timer); setTimeout(function () { startTour(false); }, 500); }
      else if (tries > 60) clearInterval(timer);
    }, 500);
  }

  function init() {
    addCss(); buildFab(); applySiteTheme(siteTheme, false); autoTour(); staffToast(); setupFooter();
    fetchSiteTheme();
    setInterval(fetchSiteTheme, 60000);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) fetchSiteTheme(); });
  }
  /* se aplica ya, antes del primer pintado, con la última temática conocida */
  applySiteTheme(siteTheme, false);
  /* ---------- Aviso al personal: presentes con VPN / ExitLag (en cualquier página) ---------- */
  function staffToast() {
    var s = readSession();
    if (!s || ['admin', 'moderador', 'prueba_moderador'].indexOf(s.role) === -1) return;
    if (pageKey() === 'seccion:admin') return; /* en el panel ya hay un aviso propio */
    function seen() { try { return JSON.parse(localStorage.getItem('hfa:attSeen') || '[]') || []; } catch (e) { return []; } }
    function check() {
      if (document.hidden) return;
      fetch('/api/db?key=matches', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (res) {
        if (!res || !res.ok || typeof res.value !== 'string') return;
        var matches = []; try { matches = JSON.parse(res.value) || []; } catch (e) { return; }
        var done = {}; seen().forEach(function (k) { done[k] = 1; });
        var fresh = [];
        matches.forEach(function (m) {
          var att = m.attendance || {}, info = m.attendanceInfo || {};
          Object.keys(att).forEach(function (name) {
            if (!att[name]) return;
            var rec = info[name] || {}, d = rec.detected;
            var risky = rec.conn === 'exitlag' || rec.conn === 'vpn' || (d && d.checked && (d.vpn || d.proxy || d.datacenter));
            var key = m.id + '|' + name + '|' + (rec.at || att[name]);
            if (risky && !done[key]) fresh.push({ key: key, name: name });
          });
        });
        var old = document.getElementById('hfaStaffToast');
        if (!fresh.length) { if (old) old.remove(); return; }
        if (!old) { old = document.createElement('div'); old.id = 'hfaStaffToast'; old.setAttribute('role', 'alert'); document.body.appendChild(old); }
        old.className = 'hfa-staff-toast';
        old.innerHTML = '<b>⚠ ' + fresh.length + (fresh.length === 1 ? ' presente' : ' presentes') + ' con VPN o ExitLag</b><span></span><div><a class="hfa-toast-go" href="seccion.html?view=admin#presentes">Ver presentes</a><button type="button" data-toast-close>Cerrar</button></div>';
        old.querySelector('span').textContent = fresh.slice(0, 3).map(function (f) { return f.name; }).join(', ') + (fresh.length > 3 ? '…' : '');
        old.querySelector('[data-toast-close]').onclick = function () {
          var list = seen(); fresh.forEach(function (f) { list.push(f.key); });
          try { localStorage.setItem('hfa:attSeen', JSON.stringify(list.slice(-800))); } catch (e) {}
          old.remove();
        };
      }).catch(function () {});
    }
    setTimeout(check, 2500);
    setInterval(check, 60000);
  }

  /* ---------- Pie de página común + copias de seguridad (solo ADMIN) ---------- */
  var FOOT_CSS = 'footer.hfa-footer{border-top:1px solid var(--border,#22302a);padding:34px 28px;text-align:center}' +
    'footer.hfa-footer .foot-brand{font-family:Oswald,sans-serif;color:var(--text-mid,#9fb3ac);font-size:13px;margin-bottom:10px;font-weight:500}' +
    'footer.hfa-footer p{font-size:11.5px;color:var(--text-low,#5c706a);line-height:1.7;max-width:640px;margin:0 auto}' +
    '.hfa-backup-btn{margin-top:16px;padding:8px 16px;border:1px solid var(--amber,#ff9d4d);border-radius:999px;background:transparent;color:var(--amber,#ff9d4d);font:600 12px Inter,Arial,sans-serif;cursor:pointer}.hfa-backup-btn:hover{background:rgba(255,157,77,.12)}' +
    '.hfa-bk-over{position:fixed;inset:0;z-index:30010;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(3,8,6,.78);backdrop-filter:blur(4px)}' +
    '.hfa-bk{width:min(560px,100%);max-height:90vh;overflow:auto;padding:22px;border:1px solid var(--amber,#ff9d4d);border-radius:14px;background:var(--panel,#121a17);color:var(--text-hi,#f2f6f4);font:13px/1.5 Inter,Arial,sans-serif;box-shadow:0 24px 70px #000a;text-align:left}' +
    '.hfa-bk h3{margin:0 0 4px;font:700 19px Oswald,sans-serif;letter-spacing:.04em;color:var(--amber,#ff9d4d)}.hfa-bk .sub{margin:0 0 14px;color:var(--text-mid,#9fb3ac)}' +
    '.hfa-bk h4{margin:16px 0 8px;font:600 13px Inter,Arial,sans-serif;color:var(--text-hi,#f2f6f4)}' +
    '.hfa-bk-row{display:flex;gap:8px;flex-wrap:wrap}.hfa-bk button{padding:9px 14px;border:1px solid var(--border,#22302a);border-radius:8px;background:var(--panel-2,#16201c);color:inherit;font:600 12px Inter,Arial,sans-serif;cursor:pointer}.hfa-bk button:hover{border-color:var(--green,#34e88f)}.hfa-bk button.primary{background:var(--green,#34e88f);border-color:var(--green,#34e88f);color:#05130c}.hfa-bk button.danger{border-color:#ff7a7a;color:#ff9a9a}.hfa-bk button:disabled{opacity:.5;cursor:wait}' +
    '.hfa-bk-list{display:flex;flex-direction:column;gap:6px}.hfa-bk-item{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:9px 11px;border:1px solid var(--border,#22302a);border-radius:8px;background:var(--panel-2,#16201c)}.hfa-bk-item small{display:block;color:var(--text-low,#5c706a)}' +
    '.hfa-bk-status{min-height:20px;margin-top:12px;color:var(--green,#34e88f);font-size:12px}.hfa-bk-status.err{color:#ff8a8a}.hfa-bk-close{float:right;border:0!important;background:none!important;font-size:20px!important;padding:0 4px!important}';

  function bkAuth() {
    var s = readSession(), h = ''; try { h = localStorage.getItem('hfa:adminAuth') || ''; } catch (e) {}
    return s && s.role === 'admin' && h ? { adminUser: s.username, adminHash: h } : null;
  }
  function bkCall(payload) {
    var a = bkAuth(); if (!a) return Promise.reject(new Error('Necesitas iniciar sesión como administrador.'));
    var body = Object.assign({ action: 'backup' }, a, payload);
    return fetch('/api/db', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().catch(function () { return { ok: false }; }); })
      .then(function (d) { if (!d || !d.ok) throw new Error('El servidor rechazó la operación (¿sesión de admin caducada o API sin actualizar?).'); return d; });
  }
  var BK_COLLS = ['app_data', 'accounts', 'role_assignments'];

  function openBackupModal() {
    var old = document.getElementById('hfaBackup'); if (old) old.remove();
    var over = document.createElement('div'); over.id = 'hfaBackup'; over.className = 'hfa-bk-over';
    over.innerHTML = '<div class="hfa-bk" role="dialog" aria-modal="true"><button class="hfa-bk-close" type="button" data-bk-close aria-label="Cerrar">&times;</button>' +
      '<h3>🛡️ Copias de seguridad</h3><p class="sub">Solo administradores. Incluye partidos, equipos, cuentas y roles.</p>' +
      '<h4>En el servidor</h4><div class="hfa-bk-row"><button type="button" class="primary" data-bk-save>Guardar copia ahora</button></div>' +
      '<div class="hfa-bk-list" id="hfaBkList" style="margin-top:10px"><small>Cargando copias…</small></div>' +
      '<h4>En tu ordenador</h4><div class="hfa-bk-row"><button type="button" data-bk-download>⬇ Descargar copia (.json)</button><button type="button" data-bk-upload>⬆ Restaurar desde archivo</button><input type="file" id="hfaBkFile" accept="application/json,.json" hidden></div>' +
      '<div class="hfa-bk-status" id="hfaBkStatus" role="status"></div></div>';
    document.body.appendChild(over);
    var status = over.querySelector('#hfaBkStatus');
    function say(t, err) { status.textContent = t; status.className = 'hfa-bk-status' + (err ? ' err' : ''); }
    function busy(on) { over.querySelectorAll('button').forEach(function (b) { b.disabled = on; }); }
    function fmt(iso) { try { return new Date(iso).toLocaleString('es-ES'); } catch (e) { return iso; } }
    function total(counts) { var n = 0; Object.keys(counts || {}).forEach(function (k) { n += counts[k]; }); return n; }

    function loadList() {
      bkCall({ op: 'list' }).then(function (d) {
        var box = over.querySelector('#hfaBkList');
        if (!d.rows.length) { box.innerHTML = '<small>Aún no hay copias guardadas en el servidor.</small>'; return; }
        box.innerHTML = d.rows.map(function (r) {
          return '<div class="hfa-bk-item"><div><b>' + (r.label || 'Copia').replace(/</g, '&lt;') + '</b><small>' + fmt(r.at) + ' · ' + (r.by || '') + ' · ' + total(r.counts) + ' registros</small></div>' +
            '<div class="hfa-bk-row"><button type="button" class="danger" data-bk-restore="' + r._id + '">Restaurar</button><button type="button" data-bk-del="' + r._id + '" title="Borrar">🗑</button></div></div>';
        }).join('');
      }).catch(function (e) { over.querySelector('#hfaBkList').innerHTML = '<small>' + e.message + '</small>'; });
    }
    loadList();

    function download() {
      busy(true); say('Preparando copia…');
      var data = {};
      var chain = Promise.resolve();
      BK_COLLS.forEach(function (name) {
        chain = chain.then(function () {
          data[name] = [];
          function page(skip) {
            return bkCall({ op: 'export', coll: name, skip: skip }).then(function (d) {
              data[name] = data[name].concat(d.docs);
              say('Descargando ' + name + '… ' + Math.min(d.next, d.total) + '/' + d.total);
              if (!d.done && d.docs.length) return page(d.next);
            });
          }
          return page(0);
        });
      });
      chain.then(function () {
        var file = { app: 'HFA', version: 1, createdAt: new Date().toISOString(), data: data };
        var blob = new Blob([JSON.stringify(file)], { type: 'application/json' });
        var a = document.createElement('a'); a.href = URL.createObjectURL(blob);
        a.download = 'hfa-backup-' + new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-') + '.json';
        document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
        say('✔ Copia descargada. Guárdala en un lugar seguro.');
      }).catch(function (e) { say(e.message, true); }).then(function () { busy(false); });
    }

    function restoreFile(file) {
      var reader = new FileReader();
      reader.onload = function () {
        var parsed; try { parsed = JSON.parse(reader.result); } catch (e) { say('El archivo no es una copia válida.', true); return; }
        if (!parsed || parsed.app !== 'HFA' || !parsed.data) { say('El archivo no es una copia de HFA.', true); return; }
        if (!window.confirm('Se REEMPLAZARÁN los datos actuales por los del archivo (' + fmt(parsed.createdAt) + ').\n\nAntes se guardará una copia automática en el servidor. ¿Continuar?')) return;
        busy(true);
        var chain = Promise.resolve(), first = true;
        BK_COLLS.forEach(function (name) {
          if (!Array.isArray(parsed.data[name])) return;
          var docs = parsed.data[name], chunks = [], cur = [], size = 0;
          docs.forEach(function (d) { var s = JSON.stringify(d).length; if (cur.length && size + s > 2500000) { chunks.push(cur); cur = []; size = 0; } cur.push(d); size += s; });
          chunks.push(cur);
          chunks.forEach(function (chunk, i) {
            chain = chain.then(function () {
              say('Restaurando ' + name + '… (' + (i + 1) + '/' + chunks.length + ')');
              var p = bkCall({ op: 'import', coll: name, docs: chunk, reset: i === 0, pre: first });
              first = false; return p;
            });
          });
        });
        chain.then(function () { say('✔ Copia restaurada. Recargando…'); setTimeout(function () { location.reload(); }, 1200); })
          .catch(function (e) { say(e.message + ' — Se guardó una copia automática antes de empezar.', true); busy(false); });
      };
      reader.readAsText(file);
    }

    over.addEventListener('click', function (e) {
      if (e.target === over || e.target.closest('[data-bk-close]')) { over.remove(); return; }
      if (e.target.closest('[data-bk-save]')) {
        busy(true); say('Guardando copia en el servidor…');
        bkCall({ op: 'save', label: 'Copia manual' }).then(function () { say('✔ Copia guardada en el servidor.'); loadList(); }).catch(function (er) { say(er.message, true); }).then(function () { busy(false); });
        return;
      }
      if (e.target.closest('[data-bk-download]')) { download(); return; }
      if (e.target.closest('[data-bk-upload]')) { over.querySelector('#hfaBkFile').click(); return; }
      var rs = e.target.closest('[data-bk-restore]');
      if (rs) {
        if (!window.confirm('Se REEMPLAZARÁN los datos actuales por esta copia. Antes se guardará una copia automática. ¿Restaurar?')) return;
        busy(true); say('Restaurando… no cierres la página.');
        bkCall({ op: 'restoreSnapshot', id: rs.getAttribute('data-bk-restore') }).then(function () { say('✔ Restaurado. Recargando…'); setTimeout(function () { location.reload(); }, 1200); }).catch(function (er) { say(er.message, true); busy(false); });
        return;
      }
      var del = e.target.closest('[data-bk-del]');
      if (del && window.confirm('¿Borrar esta copia del servidor?')) {
        bkCall({ op: 'delete', id: del.getAttribute('data-bk-del') }).then(loadList).catch(function (er) { say(er.message, true); });
      }
    });
    over.querySelector('#hfaBkFile').addEventListener('change', function (e) { if (e.target.files[0]) restoreFile(e.target.files[0]); e.target.value = ''; });
  }

  var FOOT_HTML = '<div class="foot-brand">HFA· Habbo Fútbol Asociación</div><p>© 2026 HFA. Comunidad de rol futbolístico independiente para Habbo.es. No está afiliada, patrocinada ni respaldada por Sulake Corporation ni por Habbo.</p>';
  function setupFooter() {
    var st = document.createElement('style'); st.textContent = FOOT_CSS; document.head.appendChild(st);
    var foot = document.querySelector('footer');
    if (!foot) { foot = document.createElement('footer'); document.body.appendChild(foot); }
    foot.classList.add('hfa-footer');
    if (foot.textContent.replace(/\s+/g, ' ').indexOf('Habbo Fútbol Asociación') === -1 || foot.textContent.indexOf('Sulake Corporation ni por Habbo.') === -1) foot.innerHTML = FOOT_HTML;
    // El acceso a las copias de seguridad ahora está solo en el panel de administración.
    var old = foot.querySelector('.hfa-backup-wrap'); if (old) old.remove();

  }


  /* ---------- Cerrar sesión (funciona en todas las secciones) + caras de los avatares ---------- */
  function doLogout() {
    try { ['hfa:session', 'hfa:adminAuth', 'hfa:loginWelcome'].forEach(function (k) { localStorage.removeItem(k); }); } catch (e) {}
    location.href = 'afh-liga.html';
  }
  document.addEventListener('click', function (e) {
    var t = e.target && e.target.closest ? e.target.closest('#logoutButton,#navLogoutBtn,[data-hfa-logout]') : null;
    if (!t) return;
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    doLogout();
  }, true);
  document.addEventListener('click', function (e) {
    if (e.target && e.target.closest && e.target.closest('[data-open-backup]')) { e.preventDefault(); openBackupModal(); }
  });
  function syncLogoutFab() {
    var wrap = document.querySelector('.hfa-x-fab'); if (!wrap) return;
    var btn = wrap.querySelector('[data-hfa-logout]'), s = readSession();
    if (s && !btn) { btn = document.createElement('button'); btn.type = 'button'; btn.setAttribute('data-hfa-logout', ''); btn.title = 'Cerrar sesión'; btn.textContent = '⏻ Salir'; wrap.appendChild(btn); }
    else if (!s && btn) btn.remove();
  }
  /* los avatares redondos pasan a mostrar solo la cara, más grande */
  function fixFaces() {
    var imgs = document.querySelectorAll('img[src*="habbo-imaging/avatarimage"]');
    for (var i = 0; i < imgs.length; i++) {
      var im = imgs[i], src = im.getAttribute('src');
      if (src.indexOf('headonly=1') !== -1) continue;
      var r = ''; try { r = getComputedStyle(im).borderRadius; } catch (e) {}
      if (r.indexOf('50%') === -1 && !/avatar|mini|comment/i.test(im.className)) continue;
      im.setAttribute('src', src.replace(/([?&])size=[a-z]/, '$1size=l') + '&headonly=1');
      im.style.objectFit = 'cover'; im.style.objectPosition = 'center';
    }
  }
  /* si un avatar no carga, reintenta con tamaños más pequeños (l -> m -> s) */
  document.addEventListener('error', function (ev) {
    var im = ev.target;
    if (!im || im.tagName !== 'IMG' || (im.src || '').indexOf('habbo-imaging/avatarimage') === -1) return;
    var step = Number(im.getAttribute('data-fb') || 0);
    var sizes = ['m', 's'];
    if (step >= sizes.length) return;
    im.setAttribute('data-fb', String(step + 1));
    im.src = im.src.replace(/([?&])size=[a-z]/, '$1size=' + sizes[step]);
  }, true);
  setInterval(function () { var f = document.querySelector('.hfa-x-fab [data-hfa-logout]'); if (f) f.remove(); fixFaces(); }, 1200);

  /* ---------- MODO MANTENIMIENTO (solo los administradores ven la web) ---------- */
  var MAINT_KEY = 'hfa:maint';
  var maint = { enabled: false, message: '' }, maintOverlayShown = false;
  var MAINT_CSS = 'html.hfa-maint body>*:not(#hfaMaint){display:none!important}html.hfa-maint{overflow:hidden}' +
    '#hfaMaint{position:fixed;inset:0;z-index:2147483000;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:28px;text-align:center;color:#f2f6f4;font-family:Inter,Arial,sans-serif;background:radial-gradient(ellipse 700px 460px at 50% 38%,rgba(52,232,143,.16),transparent 65%),#070c0a;overflow:auto}' +
    '.hm-logo{position:relative;width:min(240px,56vw);aspect-ratio:1;display:grid;place-items:center;margin-bottom:26px}' +
    '.hm-logo img{position:relative;width:78%;height:78%;object-fit:contain;animation:hmFloat 3.4s ease-in-out infinite;filter:drop-shadow(0 12px 30px rgba(52,232,143,.35))}' +
    '.hm-ring{position:absolute;inset:0;border-radius:50%;border:2px dashed rgba(52,232,143,.45);animation:hmSpin 14s linear infinite}' +
    '.hm-ring.r2{inset:9%;border-style:solid;border-color:rgba(52,232,143,.16);border-top-color:#34e88f;animation:hmSpin 2.4s linear infinite}' +
    '.hm-pulse{position:absolute;inset:14%;border-radius:50%;background:radial-gradient(circle,rgba(52,232,143,.28),transparent 70%);animation:hmPulse 2.6s ease-in-out infinite}' +
    '.hm-t{font:700 clamp(30px,7vw,56px)/1.05 Oswald,Arial,sans-serif;letter-spacing:.06em;text-transform:uppercase}.hm-t span{color:#34e88f}' +
    '.hm-s{margin-top:14px;max-width:520px;font-size:15px;line-height:1.7;color:#9fb3ac}' +
    '.hm-bar{margin-top:26px;width:min(260px,70vw);height:4px;border-radius:4px;background:rgba(255,255,255,.08);overflow:hidden}.hm-bar i{display:block;width:40%;height:100%;border-radius:4px;background:linear-gradient(90deg,transparent,#34e88f,transparent);animation:hmBar 1.6s ease-in-out infinite}' +
    '.hm-admin{margin-top:34px;font-size:12px;color:#5c706a}.hm-admin button{background:none;border:0;color:#5c706a;text-decoration:underline;cursor:pointer;font:inherit;padding:2px 6px}.hm-admin button:hover{color:#9fb3ac}' +
    '.hm-form{display:none;margin:14px auto 0;gap:8px;flex-direction:column;width:min(280px,80vw)}.hm-form.open{display:flex}.hm-form input{padding:10px 12px;border:1px solid #22302a;border-radius:8px;background:#0d1512;color:#f2f6f4;font:14px Inter,Arial,sans-serif}.hm-form button{padding:10px;border:0;border-radius:8px;background:#34e88f;color:#05130c;font:700 13px Inter,Arial,sans-serif;cursor:pointer}.hm-err{min-height:16px;color:#ff8a8a;font-size:12px}' +
    '@keyframes hmFloat{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-10px) scale(1.03)}}@keyframes hmSpin{to{transform:rotate(360deg)}}@keyframes hmPulse{0%,100%{opacity:.45;transform:scale(.92)}50%{opacity:1;transform:scale(1.08)}}@keyframes hmBar{0%{transform:translateX(-120%)}100%{transform:translateX(280%)}}' +
    '@media(prefers-reduced-motion:reduce){.hm-logo img,.hm-ring,.hm-pulse,.hm-bar i{animation:none!important}}' +
    '.hm-badge{position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:9996;padding:8px 16px;border:1px solid #ff9d4d;border-radius:999px;background:#121a17;color:#ff9d4d;font:600 12px Inter,Arial,sans-serif;box-shadow:0 8px 24px #0009;white-space:nowrap}';
  (function () { var st = document.createElement('style'); st.textContent = MAINT_CSS; (document.head || document.documentElement).appendChild(st); })();

  function isAdminNow() { var s = readSession(); return !!(s && s.role === 'admin'); }
  function setMaintClass(on) { document.documentElement.classList.toggle('hfa-maint', !!on); }
  // Decisión inmediata con el último estado conocido, para no enseñar la web ni un instante.
  try { if (localStorage.getItem(MAINT_KEY) === '1' && !isAdminNow()) setMaintClass(true); } catch (e) {}

  function maintText() { return maint.message || 'Estamos mejorando HFA para ti. Volveremos muy pronto, gracias por tu paciencia. ⚽'; }
  function sha256(t) { return crypto.subtle.digest('SHA-256', new TextEncoder().encode(t)).then(function (b) { return Array.prototype.map.call(new Uint8Array(b), function (x) { return x.toString(16).padStart(2, '0'); }).join(''); }); }
  function maintAdminLogin(user, pass, errEl) {
    errEl.textContent = 'Comprobando…';
    fetch('/api/db?key=accounts', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (res) {
      var accs = []; try { accs = JSON.parse(res.value || '[]'); } catch (e) {}
      var acc = accs.find(function (a) { return String(a.username).toLowerCase() === String(user).trim().toLowerCase(); });
      return sha256(pass).then(function (h) {
        if (!acc || acc.passHash !== h || acc.role !== 'admin') { errEl.textContent = 'Acceso solo para administradores.'; return; }
        try { localStorage.setItem('hfa:session', JSON.stringify({ username: acc.username, role: acc.role })); localStorage.setItem('hfa:adminAuth', acc.passHash); } catch (e) {}
        location.reload();
      });
    }).catch(function () { errEl.textContent = 'No se pudo conectar. Inténtalo de nuevo.'; });
  }
  function buildMaintOverlay() {
    var box = document.getElementById('hfaMaint');
    if (box) { var p = box.querySelector('.hm-s'); if (p) p.textContent = maintText(); return; }
    box = document.createElement('div'); box.id = 'hfaMaint'; box.setAttribute('role', 'alert');
    var logged = !!readSession();
    box.innerHTML = '<div class="hm-logo"><div class="hm-pulse"></div><div class="hm-ring"></div><div class="hm-ring r2"></div><img src="EDITABLE_HF.png" alt="HFA"></div>' +
      '<h1 class="hm-t">Estamos en <span>mantenimiento</span></h1><p class="hm-s"></p><div class="hm-bar"><i></i></div>' +
      '<div class="hm-admin"><button type="button" data-hm-open>Acceso administrador</button>' + (logged ? '<button type="button" data-hfa-logout>Cerrar sesión</button>' : '') +
      '<form class="hm-form" novalidate><input name="u" placeholder="Usuario" autocomplete="username"><input name="p" type="password" placeholder="Contraseña" autocomplete="current-password"><div class="hm-err" role="status"></div><button type="submit">Entrar</button></form></div>';
    box.querySelector('.hm-s').textContent = maintText();
    document.body.appendChild(box);
    box.querySelector('[data-hm-open]').addEventListener('click', function () { box.querySelector('.hm-form').classList.toggle('open'); });
    box.querySelector('.hm-form').addEventListener('submit', function (ev) { ev.preventDefault(); var f = ev.target; maintAdminLogin(f.u.value, f.p.value, f.querySelector('.hm-err')); });
    maintOverlayShown = true;
  }
  function removeMaintOverlay() { var box = document.getElementById('hfaMaint'); if (box) box.remove(); }
  function applyMaint() {
    var show = maint.enabled && !isAdminNow();
    setMaintClass(show);
    if (show) { if (document.body) buildMaintOverlay(); else document.addEventListener('DOMContentLoaded', buildMaintOverlay); }
    else {
      if (maintOverlayShown) { maintOverlayShown = false; removeMaintOverlay(); location.reload(); return; }   // el mantenimiento terminó: recarga la web
      removeMaintOverlay();
    }
    var badge = document.getElementById('hfaMaintBadge');
    if (maint.enabled && isAdminNow()) {
      if (!badge && document.body) { badge = document.createElement('div'); badge.id = 'hfaMaintBadge'; badge.className = 'hm-badge'; badge.textContent = '🛠️ Modo mantenimiento ACTIVO · solo los admins ven la web'; document.body.appendChild(badge); }
    } else if (badge) badge.remove();
  }
  function fetchMaint() {
    fetch('/api/db?key=maintenance', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (res) {
      if (!res || !res.ok) return;
      var v = { enabled: false, message: '' };
      if (typeof res.value === 'string') { try { var p = JSON.parse(res.value); v.enabled = !!p.enabled; v.message = p.message || ''; } catch (e) {} }
      maint = v;
      try { localStorage.setItem(MAINT_KEY, v.enabled ? '1' : '0'); } catch (e) {}
      applyMaint(); syncMaintCard();
    }).catch(function () {});
  }
  function syncMaintCard() {
    var st = document.getElementById('maintStatus'); if (!st) return;
    st.textContent = maint.enabled ? '🔴 ACTIVO · solo los administradores ven la web' : '🟢 Desactivado · la web es visible para todos';
    var btn = document.querySelector('[data-maint-toggle]');
    if (btn) { btn.textContent = maint.enabled ? 'Desactivar mantenimiento' : 'Activar modo mantenimiento'; btn.classList.toggle('btn-primary', !maint.enabled); }
    var ta = document.getElementById('maintMsg');
    if (ta && !ta.getAttribute('data-touched') && document.activeElement !== ta) ta.value = maint.message || '';
  }
  document.addEventListener('input', function (e) { if (e.target && e.target.id === 'maintMsg') e.target.setAttribute('data-touched', '1'); });
  document.addEventListener('click', function (e) {
    var tg = e.target.closest ? e.target.closest('[data-maint-toggle],[data-maint-save]') : null; if (!tg) return;
    var a = bkAuth(); if (!a) { window.alert('Necesitas iniciar sesión como administrador.'); return; }
    var ta = document.getElementById('maintMsg'), msg = ta ? ta.value : '';
    var enable = tg.hasAttribute('data-maint-toggle') ? !maint.enabled : maint.enabled;
    if (tg.hasAttribute('data-maint-toggle') && enable && !window.confirm('Se ocultará la web para TODOS los usuarios y roles. Solo los administradores podrán entrar. ¿Activar el modo mantenimiento?')) return;
    tg.disabled = true;
    fetch('/api/db', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'setMaintenance', adminUser: a.adminUser, adminHash: a.adminHash, enabled: enable, message: msg }) })
      .then(function (r) { return r.json().catch(function () { return { ok: false }; }); })
      .then(function (d) {
        tg.disabled = false;
        if (!d || !d.ok) { window.alert('No se pudo cambiar el modo mantenimiento. Comprueba que has iniciado sesión como administrador.'); return; }
        maint = { enabled: enable, message: msg.trim().slice(0, 220) };
        try { localStorage.setItem(MAINT_KEY, enable ? '1' : '0'); } catch (er) {}
        applyMaint(); syncMaintCard();
      }).catch(function () { tg.disabled = false; window.alert('No se pudo conectar con el servidor.'); });
  });
  fetchMaint(); setInterval(fetchMaint, 30000); setInterval(syncMaintCard, 1500);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) fetchMaint(); });
  window.addEventListener('storage', function (ev) { if (ev.key === 'hfa:session') applyMaint(); });

  window.HFAExtras = { openBackup: function () { openBackupModal(); }, logout: doLogout, startTour: function () { startTour(true); }, applyTheme: applyTheme, setSiteTheme: function (n) { applySiteTheme(n); }, getSiteTheme: function () { return siteTheme; } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
