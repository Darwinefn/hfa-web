/* HFA · Selector de apariencia + guías (tour) de primera visita, para el sitio y el panel admin. */
(function () {
  'use strict';
  var THEME_KEY = 'hfa:theme';
  var TOUR_KEY = 'hfa:tours';

  /* ---------- Apariencia ---------- */
  var THEMES = {
    oscuro:  { label: 'Oscuro (verde)', swatch: '#34e88f', vars: null },
    claro:   { label: 'Claro', swatch: '#f4f7f5', vars: { '--bg': '#eef3f0', '--panel': '#ffffff', '--panel-2': '#f3f7f5', '--border': '#cfdcd5', '--green': '#12935a', '--green-dim': '#8fcdb2', '--text-hi': '#10201a', '--text-mid': '#3f5a4f', '--text-low': '#6c8478' }, light: true },
    azul:    { label: 'Azul', swatch: '#4aa3ff', vars: { '--bg': '#080d14', '--panel': '#0f1722', '--panel-2': '#131e2c', '--border': '#1f3047', '--green': '#4aa3ff', '--green-dim': '#235b94', '--text-mid': '#9db3c9', '--text-low': '#5b7088' } },
    morado:  { label: 'Morado', swatch: '#a87bff', vars: { '--bg': '#0c0a14', '--panel': '#151124', '--panel-2': '#1a1530', '--border': '#2b2447', '--green': '#a87bff', '--green-dim': '#5a3f99', '--text-mid': '#aaa0c7', '--text-low': '#6a6288' } },
    naranja: { label: 'Naranja', swatch: '#ff9d4d', vars: { '--bg': '#100b07', '--panel': '#1a130d', '--panel-2': '#211810', '--border': '#38281a', '--green': '#ff9d4d', '--green-dim': '#995a22', '--text-mid': '#c7b09b', '--text-low': '#8a735f' } }
  };

  function readTheme() { try { return localStorage.getItem(THEME_KEY) || 'oscuro'; } catch (e) { return 'oscuro'; } }

  function applyTheme(name) {
    var theme = THEMES[name] || THEMES.oscuro;
    var tag = document.getElementById('hfaThemeStyle');
    if (!tag) { tag = document.createElement('style'); tag.id = 'hfaThemeStyle'; document.head.appendChild(tag); }
    var css = '';
    if (theme.vars) {
      css = ':root{' + Object.keys(theme.vars).map(function (k) { return k + ':' + theme.vars[k] + ' !important'; }).join(';') + '}';
      css += 'body{background:var(--bg) !important;color:var(--text-hi)}';
      if (theme.light) css += '.admin-section-nav{background:var(--panel) !important}.admin-section-nav button:hover,.admin-section-nav button.active{background:rgba(18,147,90,.12) !important}header,footer{background:var(--panel) !important}input,select,textarea,.input{background:#fff !important;color:var(--text-hi) !important;border-color:var(--border) !important}.btn-primary,.btn.btn-primary{color:#fff !important}';
    }
    tag.textContent = css;
    document.documentElement.setAttribute('data-hfa-theme', name);
    try { localStorage.setItem(THEME_KEY, name); } catch (e) {}
  }

  applyTheme(readTheme());

  var BASE_CSS = '.hfa-x-fab{position:fixed;left:16px;bottom:16px;z-index:9990;display:flex;gap:8px}.hfa-x-fab button{border:1px solid var(--border,#22302a);background:var(--panel,#121a17);color:var(--text-hi,#f2f6f4);border-radius:8px;padding:10px 13px;font:600 13px Inter,Arial,sans-serif;cursor:pointer;box-shadow:0 6px 18px #0005}.hfa-x-fab button:hover{border-color:var(--green,#34e88f)}.hfa-x-theme-panel{position:fixed;left:16px;bottom:64px;z-index:9991;min-width:210px;padding:12px;border:1px solid var(--border,#22302a);border-radius:10px;background:var(--panel,#121a17);color:var(--text-hi,#f2f6f4);font:13px Inter,Arial,sans-serif;box-shadow:0 14px 40px #0008}.hfa-x-theme-panel[hidden]{display:none}.hfa-x-theme-panel strong{display:block;margin-bottom:8px}.hfa-x-theme-opt{display:flex;align-items:center;gap:10px;width:100%;padding:8px 9px;margin-top:4px;border:1px solid transparent;border-radius:7px;background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer}.hfa-x-theme-opt:hover{background:var(--panel-2,#16201c)}.hfa-x-theme-opt[aria-pressed=true]{border-color:var(--green,#34e88f)}.hfa-x-dot{width:16px;height:16px;border-radius:50%;border:1px solid #0006;flex:none}.hfa-tour-back{position:fixed;inset:0;z-index:30000;background:rgba(0,0,0,.62)}.hfa-tour-hole{position:fixed;z-index:30001;border-radius:8px;box-shadow:0 0 0 9999px rgba(0,0,0,.62),0 0 0 2px var(--green,#34e88f);pointer-events:none;transition:all .2s ease}.hfa-tour-card{position:fixed;z-index:30002;width:min(340px,calc(100vw - 24px));padding:16px;border:1px solid var(--green,#34e88f);border-radius:10px;background:var(--panel,#121a17);color:var(--text-hi,#f2f6f4);font:14px/1.5 Inter,Arial,sans-serif;box-shadow:0 18px 50px #000a}.hfa-tour-card h4{margin:0 0 6px;font-size:15px;color:var(--green,#34e88f)}.hfa-tour-card p{margin:0 0 14px;color:var(--text-mid,#9fb3ac)}.hfa-tour-row{display:flex;align-items:center;justify-content:space-between;gap:8px}.hfa-tour-row small{color:var(--text-low,#5c706a)}.hfa-tour-row button{border:1px solid var(--border,#22302a);background:var(--panel-2,#16201c);color:var(--text-hi,#f2f6f4);border-radius:6px;padding:7px 12px;font:600 12px Inter,Arial,sans-serif;cursor:pointer}.hfa-tour-row button.primary{background:var(--green,#34e88f);border-color:var(--green,#34e88f);color:#05130c}.hfa-tour-skip{background:none !important;border:0 !important;color:var(--text-low,#5c706a) !important;text-decoration:underline}@media(max-width:520px){.hfa-x-fab{bottom:76px}.hfa-x-theme-panel{bottom:124px}}';

  function addCss() { var s = document.createElement('style'); s.textContent = BASE_CSS; document.head.appendChild(s); }

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
      applyTheme(opt.dataset.theme);
      renderPanel();
    });
    document.addEventListener('click', function (e) {
      if (!panel.hidden && !e.target.closest('.hfa-x-theme-panel') && !e.target.closest('[data-x-theme]')) panel.hidden = true;
    });
  }

  /* ---------- Guías (tour) ---------- */
  function readSession() { try { return JSON.parse(localStorage.getItem('hfa:session') || 'null'); } catch (e) { return null; } }
  function seenTours() { try { return JSON.parse(localStorage.getItem(TOUR_KEY) || '{}') || {}; } catch (e) { return {}; } }
  function markSeen(id) { var t = seenTours(); t[id] = 1; try { localStorage.setItem(TOUR_KEY, JSON.stringify(t)); } catch (e) {} }

  var STAFF = ['admin', 'prueba_moderador', 'moderador', 'arbitro'];

  function pageKey() {
    var page = (location.pathname.split('/').pop() || 'afh-liga.html').toLowerCase();
    var params = new URLSearchParams(location.search);
    if (page.indexOf('seccion') === 0) {
      var view = params.get('view') || 'comunidad';
      var sub = view === 'comunidad' && params.get('sub') ? ':' + params.get('sub') : '';
      return 'seccion:' + view + sub;
    }
    if (page.indexOf('clasificacion') === 0) return 'clasificacion';
    return 'inicio';
  }

  var TOURS = {
    'inicio': [
      { sel: 'header nav, #mainNav', title: 'Menú principal', text: 'Desde aquí vas a Comunidad, Clasificación, Torneos, Estadísticas, Partidos y tu Cuenta.' },
      { sel: '#navRight', title: 'Tu cuenta', text: 'Inicia sesión o crea tu cuenta con tu nombre de Habbo. Después verás tu perfil y tus notificaciones.' },
      { sel: '#homeNews', title: 'Noticias', text: 'Las novedades más recientes de la liga aparecen aquí.' },
      { sel: '#resumen', title: 'Resumen de la liga', text: 'Próximo partido, equipos y últimos resultados de un vistazo.' },
      { sel: '#adminSubTabs', title: 'Panel de administración', text: 'Las pestañas del panel: divisiones, equipos, partidos, actas y usuarios. Solo las ve el personal con rol.', optional: true }
    ],
    'clasificacion': [
      { sel: '#classificationNav', title: 'Menú', text: 'Navega por el resto de secciones de la web.' },
      { sel: 'main', title: 'Clasificación', text: 'Aquí ves la tabla por división y torneo. Cambia de división o de torneo con los selectores de la página.' }
    ],
    'seccion:comunidad': [
      { sel: '#content', title: 'Comunidad', text: 'Palmarés, noticias, equipos y jugadores de la asociación. Usa el menú «Comunidad» de arriba para moverte entre ellas.' }
    ],
    'seccion:jugadores': [
      { sel: '.players-filters', title: 'Buscador de jugadores', text: 'Busca por nombre y filtra por país, posición, GRL o si está libre de equipo.' },
      { sel: '.players-grid', title: 'Jugadores registrados', text: 'Todas las cuentas registradas aparecen aquí. Pulsa un jugador para ver su perfil.' }
    ],
    'seccion:torneos': [{ sel: '#content', title: 'Torneos', text: 'Consulta los torneos activos y pasados de la asociación.' }],
    'seccion:estadisticas': [{ sel: '#content', title: 'Estadísticas', text: 'Goleadores, asistencias y más. Cambia la categoría y la división para filtrar.' }],
    'seccion:partidos': [{ sel: '#content', title: 'Partidos', text: 'Filtra por torneo, división y jornada. Pulsa «Ver resumen» en un partido terminado para ver el acta.' }],
    'seccion:album': [{ sel: '#content', title: 'Álbum', text: 'Colección de cromos y recuerdos de la liga.' }],
    'seccion:cuenta': [{ sel: '#content', title: 'Tu cuenta', text: 'Edita tu perfil, tu posición, tu país y revisa tus ofertas.' }],
    'seccion:buzon': [{ sel: '#content', title: 'Buzón', text: 'Aquí llegan las ofertas de equipos y los avisos para ti.' }],
    'seccion:admin': [
      { sel: '.admin-section-nav', title: 'Panel de administración', text: 'Cada botón abre una zona del panel: competición, plantilla, comunidad y actas.' },
      { sel: '[data-admin-section="users"]', title: 'Usuarios y divisiones', text: 'Todas las cuentas con su IP y división. Aquí puedes marcar a quien da presente con VPN o ExitLag.', optional: true },
      { sel: '[data-admin-section="roles"]', title: 'Roles', text: 'Asigna Administrador, Moderador, Árbitro, Dueño de equipo o Sin rol. El cambio se guarda en la base de datos.', optional: true },
      { sel: '[data-admin-section="teams"]', title: 'Equipos y jugadores', text: 'Usa «Buscar y agregar jugadores» para añadir cuentas registradas a un equipo.', optional: true },
      { sel: '[data-admin-section="acts"]', title: 'Actas', text: 'Aquí se suben y finalizan las actas de los partidos.', optional: true },
      { sel: '[data-open-admin-tutorial]', title: 'Tutorial completo', text: 'Para una explicación más larga del panel, pulsa este botón cuando quieras.', optional: true }
    ]
  };

  var running = false;
  function visible(el) { return el && el.offsetParent !== null && el.getBoundingClientRect().width > 0; }

  function startTour(force) {
    if (running) return;
    var key = pageKey();
    var steps = (TOURS[key] || []).filter(function (s) {
      var el = document.querySelector(s.sel);
      return visible(el);
    });
    if (!steps.length) {
      if (force) {
        steps = [{ sel: 'body', title: 'Guía', text: 'Todavía no hay guía específica para esta sección. Usa el menú de arriba para explorar la web.' }];
      } else return;
    }
    running = true;
    var i = 0;
    var back = document.createElement('div'); back.className = 'hfa-tour-back'; back.style.background = 'transparent';
    var hole = document.createElement('div'); hole.className = 'hfa-tour-hole';
    var card = document.createElement('div'); card.className = 'hfa-tour-card'; card.setAttribute('role', 'dialog');
    document.body.append(back, hole, card);

    function end() {
      back.remove(); hole.remove(); card.remove(); running = false;
      markSeen(key);
      window.removeEventListener('resize', place);
    }
    function place() {
      var s = steps[i], el = document.querySelector(s.sel);
      if (!visible(el)) { hole.style.display = 'none'; card.style.left = '12px'; card.style.top = '80px'; return; }
      if (s.sel !== 'body') el.scrollIntoView({ block: 'center', behavior: 'instant' in window ? 'instant' : 'auto' });
      var r = el.getBoundingClientRect();
      var pad = 6;
      hole.style.display = s.sel === 'body' ? 'none' : 'block';
      hole.style.left = (r.left - pad) + 'px'; hole.style.top = (r.top - pad) + 'px';
      hole.style.width = (r.width + pad * 2) + 'px'; hole.style.height = (r.height + pad * 2) + 'px';
      var cw = Math.min(340, window.innerWidth - 24), ch = card.offsetHeight || 150;
      var left = Math.max(12, Math.min(r.left, window.innerWidth - cw - 12));
      var top = r.bottom + 14;
      if (top + ch > window.innerHeight - 12) top = Math.max(12, r.top - ch - 14);
      if (s.sel === 'body' || top < 12) top = Math.max(12, (window.innerHeight - ch) / 2);
      card.style.left = left + 'px'; card.style.top = top + 'px';
    }
    function render() {
      var s = steps[i], last = i === steps.length - 1;
      card.innerHTML = '<h4></h4><p></p><div class="hfa-tour-row"><small>' + (i + 1) + ' / ' + steps.length + '</small><span><button type="button" class="hfa-tour-skip" data-t="skip">Saltar</button> ' + (i > 0 ? '<button type="button" data-t="prev">Atrás</button> ' : '') + '<button type="button" class="primary" data-t="next">' + (last ? 'Entendido' : 'Siguiente') + '</button></span></div>';
      card.querySelector('h4').textContent = s.title;
      card.querySelector('p').textContent = s.text;
      place();
      card.querySelector('[data-t="next"]').focus();
    }
    card.addEventListener('click', function (e) {
      var b = e.target.closest('[data-t]'); if (!b) return;
      if (b.dataset.t === 'skip') return end();
      if (b.dataset.t === 'prev') { i = Math.max(0, i - 1); return render(); }
      if (i >= steps.length - 1) return end();
      i++; render();
    });
    back.addEventListener('click', function () { /* bloquea clics detrás de la guía */ });
    window.addEventListener('resize', place);
    render();
  }

  /* Primera visita: espera a que la sección tenga contenido y lanza la guía una sola vez. */
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
      var loader = document.getElementById('hfaPageLoader');
      var ready = !loader;
      var overlay = document.getElementById('accountCreatedOverlay');
      if (ready && !overlay && (key !== 'seccion:admin' || document.querySelector('.admin-section-nav'))) {
        clearInterval(timer);
        setTimeout(function () { startTour(false); }, 400);
      } else if (tries > 60) clearInterval(timer);
    }, 500);
  }

  function init() {
    addCss();
    buildFab();
    autoTour();
    /* El panel admin se dibuja después: si se entra al panel sin recargar, lanza su guía al aparecer. */
    if (pageKey() === 'seccion:admin') return;
  }

  window.HFAExtras = { startTour: function () { startTour(true); }, applyTheme: applyTheme };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
