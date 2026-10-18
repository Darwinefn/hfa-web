/* =====================================================================
   HFA · LOGS del panel admin
   - Registra los movimientos de las personas con rol (admin, moderador,
     prueba moderador, árbitro, dueño de equipo) en MongoDB (colección
     "staff_logs") a través de /api/db.
   - Pinta la sección LOGS del panel admin (solo la ve el ADMIN).
   Se carga en seccion.html DESPUÉS del script principal.
   ===================================================================== */
(function () {
  'use strict';

  var API = '/api/db';
  var ROLE_LABEL = { admin: 'Administrador', moderador: 'Moderador', prueba_moderador: 'Prueba moderador', arbitro: 'Árbitro', dueno: 'Dueño de equipo' };
  var KEY_LABEL = {
    matches: 'partido', teams: 'equipo', news: 'noticia', palmares: 'palmarés', sponsors: 'patrocinador',
    offers: 'oferta de contrato', tournaments: 'torneo', cups: 'copa', competition: 'nombre de la competición',
    accounts: 'cuenta de usuario', profileComments: 'comentario de perfil', achievements: 'logro',
    achievementPins: 'logro fijado', achievementFeed: 'aviso de logro'
  };
  var SKIP_KEYS = { userRoles: 1 };
  var recent = {};

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ---------- Identidad de quien está logueado ---------- */
  function who() {
    try {
      var s = (typeof session !== 'undefined' && session) || JSON.parse(localStorage.getItem('hfa:session') || 'null');
      if (!s || !s.username || !s.role || s.role === 'pendiente') return null;
      var hash = localStorage.getItem('hfa:adminAuth') || '';
      return hash ? { username: s.username, role: s.role, hash: hash } : null;
    } catch (e) { return null; }
  }

  function post(body) {
    return fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().catch(function () { return { ok: false }; }); })
      .catch(function () { return { ok: false }; });
  }

  /* ---------- Enviar un movimiento ---------- */
  function sendLog(event, detail, target) {
    var me = who();
    if (!me) return;
    var sig = event + '|' + detail;
    var now = Date.now();
    if (recent[sig] && now - recent[sig] < 4000) return; // evita duplicados seguidos
    recent[sig] = now;
    post({ action: 'log', username: me.username, hash: me.hash, event: event, detail: detail, target: target || '' });
  }

  /* ---------- Descripción de cambios al guardar ---------- */
  function itemLabel(it) {
    if (it == null) return '';
    if (typeof it !== 'object') return String(it);
    if (it.home || it.away) return (it.home || '?') + ' vs ' + (it.away || '?');
    return it.name || it.title || it.headline || it.player || it.id || 'sin nombre';
  }
  function itemId(it, i) { return it && typeof it === 'object' && it.id != null ? String(it.id) : 'i' + i; }

  function changedFields(a, b) {
    var out = [];
    var keys = {};
    Object.keys(a || {}).concat(Object.keys(b || {})).forEach(function (k) { keys[k] = 1; });
    Object.keys(keys).forEach(function (k) {
      if (JSON.stringify((a || {})[k]) !== JSON.stringify((b || {})[k])) out.push(k);
    });
    return out;
  }

  function describe(key, beforeText, afterValue) {
    var label = KEY_LABEL[key] || key;
    var before = null;
    try { before = beforeText ? JSON.parse(beforeText) : null; } catch (e) {}
    var events = [];
    if (Array.isArray(afterValue) && (Array.isArray(before) || before === null)) {
      var prev = {};
      (before || []).forEach(function (it, i) { prev[itemId(it, i)] = it; });
      var seen = {};
      afterValue.forEach(function (it, i) {
        var id = itemId(it, i);
        seen[id] = 1;
        if (!(id in prev)) events.push([key === 'accounts' ? 'Nueva cuenta' : 'Creó ' + label, itemLabel(it)]);
        else if (JSON.stringify(prev[id]) !== JSON.stringify(it)) {
          var f = changedFields(prev[id], it).filter(function (n) { return !/hash|pass|^ips?$|lastIp|lastLogin/i.test(n); }).slice(0, 5).join(', ');
          if (key === 'accounts' && !f) return;
          events.push(['Editó ' + label, itemLabel(it) + (f ? ' (' + f + ')' : '')]);
        }
      });
      if (key !== 'accounts') Object.keys(prev).forEach(function (id) { if (!seen[id]) events.push(['Eliminó ' + label, itemLabel(prev[id])]); });
    } else if (JSON.stringify(before) !== JSON.stringify(afterValue)) {
      events.push(['Actualizó ' + label, typeof afterValue === 'string' ? afterValue : '']);
    }
    return events;
  }

  function watch(key, value, beforeText) {
    if (SKIP_KEYS[key]) return;
    if (!KEY_LABEL[key]) KEY_LABEL[key] = key;
    try {
      describe(key, beforeText, value).slice(0, 8).forEach(function (ev) { sendLog(ev[0], ev[1]); });
    } catch (e) {}
  }

  /* ---------- Enganchar los guardados de la web ---------- */
  function wrap(fn) {
    return async function (key, value) {
      var beforeText = null;
      try { beforeText = localStorage.getItem('hfa:' + key); } catch (e) {}
      var result = await fn.apply(this, arguments);
      watch(key, value, beforeText);
      return result;
    };
  }

  function install() {
    try {
      if (typeof setJSON === 'function' && !setJSON.__hfaLogs) {
        var w = wrap(setJSON); w.__hfaLogs = true;
        setJSON = w; // eslint-disable-line no-global-assign
      }
      if (typeof hfaSave === 'function' && !hfaSave.__hfaLogs) {
        var w2 = wrap(hfaSave); w2.__hfaLogs = true;
        hfaSave = w2; // eslint-disable-line no-global-assign
      }
      if (window.hfaApp && window.hfaApp.setJSON && !window.hfaApp.setJSON.__hfaLogs) {
        var w3 = wrap(window.hfaApp.setJSON); w3.__hfaLogs = true;
        window.hfaApp.setJSON = w3;
      }
    } catch (e) {}
  }
  install();

  /* ---------- Inicio de sesión de personas con rol (una vez por pestaña) ---------- */
  function trackLogin() {
    var me = who();
    if (!me) return;
    try {
      var flag = sessionStorage.getItem('hfa:logLogin');
      if (flag === me.username) return;
      sessionStorage.setItem('hfa:logLogin', me.username);
    } catch (e) {}
    post({ action: 'login', username: me.username });
  }
  setTimeout(trackLogin, 1500);

  /* ---------- Sección LOGS del panel ---------- */
  var timer = null;

  function fmtDate(iso) {
    try {
      return new Date(iso).toLocaleString('es-CO', { timeZone: 'America/Bogota', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch (e) { return iso; }
  }

  function ensureStyles() {
    if (document.getElementById('hfaLogsStyles')) return;
    var st = document.createElement('style');
    st.id = 'hfaLogsStyles';
    st.textContent =
      '.hfa-logs-bar{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr) auto;gap:10px;margin:14px 0}' +
      '.hfa-logs-meta{color:var(--text-low);font-size:12px;margin:0 0 10px}' +
      '.hfa-logs-list{display:flex;flex-direction:column;gap:8px}' +
      '.hfa-log-row{display:grid;grid-template-columns:150px 170px minmax(0,1fr);gap:12px;align-items:start;padding:11px 14px;border:1px solid var(--border);border-radius:12px;background:var(--panel-2)}' +
      '.hfa-log-time{color:var(--text-low);font:600 12px Inter,sans-serif}' +
      '.hfa-log-user{display:flex;flex-direction:column;gap:4px;font:700 13px Oswald,sans-serif;color:var(--text-hi);word-break:break-word}' +
      '.hfa-log-event{font:700 13px Inter,sans-serif;color:var(--green)}' +
      '.hfa-log-detail{margin-top:2px;color:var(--text-mid);font-size:12.5px;line-height:1.5;overflow-wrap:anywhere}' +
      '@media(max-width:760px){.hfa-logs-bar{grid-template-columns:1fr}.hfa-log-row{grid-template-columns:1fr;gap:6px}}';
    document.head.appendChild(st);
  }

  function badge(role) {
    return '<span class="role-badge role-' + esc(role) + '">' + esc(ROLE_LABEL[role] || role) + '</span>';
  }

  function mountMarkup(mount) {
    mount.innerHTML =
      '<div class="hfa-logs-bar">' +
      '<select class="input" id="hfaLogsRole"><option value="all">Todos los roles</option>' +
      Object.keys(ROLE_LABEL).map(function (k) { return '<option value="' + k + '">' + ROLE_LABEL[k] + '</option>'; }).join('') +
      '</select>' +
      '<input class="input" id="hfaLogsUser" placeholder="Filtrar por usuario">' +
      '<button class="btn" type="button" id="hfaLogsRefresh">↻ Actualizar</button>' +
      '</div><div class="hfa-logs-meta" id="hfaLogsMeta" role="status" aria-live="polite">Cargando…</div>' +
      '<div class="hfa-logs-list" id="hfaLogsList"></div>';
  }

  async function loadLogs() {
    var mount = document.getElementById('hfaLogsMount');
    if (!mount) return;
    ensureStyles();
    if (!document.getElementById('hfaLogsList')) mountMarkup(mount);
    var me = who();
    var meta = document.getElementById('hfaLogsMeta');
    var list = document.getElementById('hfaLogsList');
    if (!me || me.role !== 'admin') { list.innerHTML = '<div class="empty">Solo los administradores pueden ver los LOGS.</div>'; meta.textContent = ''; return; }
    var role = document.getElementById('hfaLogsRole').value;
    var user = document.getElementById('hfaLogsUser').value.trim();
    var data = await post({ action: 'getLogs', adminUser: me.username, adminHash: me.hash, role: role, user: user, limit: 300 });
    if (!data || !data.ok) {
      meta.textContent = '';
      var why = {
        no_db: 'El servidor no tiene MongoDB configurado (falta MONGODB_URI en Vercel).',
        bad_credentials: 'Tu contraseña guardada en este navegador no coincide con la de la base de datos. Cierra sesión y vuelve a entrar.',
        no_account: 'Tu cuenta no existe en la colección "accounts" de MongoDB.',
        not_admin: 'En MongoDB tu cuenta tiene el rol "' + ((data && data.role) || 'sin rol') + '", no admin.',
        server_error: 'Error del servidor al leer MongoDB.'
      };
      var reason = data && data.reason;
      list.innerHTML = '<div class="empty">No se pudieron cargar los logs. ' + esc(why[reason] || 'El servidor no reconoció la petición: comprueba que subiste el db.js nuevo a /api y que Vercel terminó de desplegar.') + '</div>';
      return;
    }
    var logs = data.logs || [];
    meta.textContent = logs.length + ' movimiento(s) · hora de Colombia · se actualiza solo cada 30 s';
    list.innerHTML = logs.length ? logs.map(function (l) {
      return '<div class="hfa-log-row"><div class="hfa-log-time">' + esc(fmtDate(l.at)) + '</div>' +
        '<div class="hfa-log-user"><span>' + esc(l.user) + '</span>' + badge(l.role) + '</div>' +
        '<div><div class="hfa-log-event">' + esc(l.event) + '</div>' +
        (l.detail ? '<div class="hfa-log-detail">' + esc(l.detail) + '</div>' : '') + '</div></div>';
    }).join('') : '<div class="empty">Todavía no hay movimientos registrados.</div>';
  }

  function startAuto() {
    clearInterval(timer);
    timer = setInterval(function () {
      var card = document.getElementById('adminLogs');
      if (!card || !card.classList.contains('admin-section-visible') || document.hidden) return;
      loadLogs();
    }, 30000);
  }

  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    if (t.closest('.admin-section-nav [data-admin-section="logs"]')) { loadLogs(); startAuto(); return; }
    var nb = t.closest('.admin-section-nav [data-admin-section]');
    if (nb) { sendLog('Abrió una sección del panel', (nb.textContent || '').trim()); }
    if (t.closest('#hfaLogsRefresh')) { loadLogs(); return; }
  });
  document.addEventListener('change', function (e) { if (e.target && e.target.id === 'hfaLogsRole') loadLogs(); });
  document.addEventListener('input', function (e) {
    if (e.target && e.target.id === 'hfaLogsUser') {
      clearTimeout(loadLogs._t);
      loadLogs._t = setTimeout(loadLogs, 400);
    }
  });

  // Si el panel se abre ya en LOGS (o se vuelve a pintar), cargar.
  setInterval(function () {
    install();
    var card = document.getElementById('adminLogs');
    if (card && card.classList.contains('admin-section-visible') && !document.getElementById('hfaLogsList')) { loadLogs(); startAuto(); }
  }, 1500);
})();
