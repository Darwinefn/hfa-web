/* =====================================================================
   HFA · Copas y Bracket (cuadro de eliminatorias)
   - Vista pública: sección "Torneos" (seccion.html?view=torneos)
   - Gestión: panel admin → "🏆 Copas y bracket"
   Depende de window.hfaApp (expuesto por seccion.html).
   Datos: clave "cups" (misma base de datos que el resto de la web).
   Los partidos de copa se crean como partidos normales (division:'copa'),
   así que se juegan y se cierran con las actas de siempre y el bracket
   avanza solo con el resultado final.
   ===================================================================== */
(function () {
  'use strict';
  var KEY = 'cups';
  var cups = [];
  var selectedId = null;
  var pubMode = null;            // 'bracket' | 'list'
  var draft = { name: '', ids: [], order: 'random' };
  var showForm = false;
  var adminHost = null;

  /* ---------- utilidades ---------- */
  function app() { return window.hfaApp; }
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function same(a, b) { return a != null && b != null && String(a) === String(b); }
  function teams() { return (app() && app().state.teams) || []; }
  function team(id) { return id == null ? null : teams().find(function (t) { return same(t.id, id); }) || null; }
  function matches() { return (app() && app().state.matches) || []; }
  function crestSrc(u) { return String(u || '').replace(/\/(tiny|small|preview|medium)$/i, ''); }
  function divCode(t) { return String(t.division == null ? '' : t.division).replace(/\D/g, '') || ''; }
  function uid(p) { return (p || '') + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }
  function pow2(n) { var s = 2; while (s < n) s *= 2; return s; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function fmtDate(d) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d || ''); return m ? m[3] + '/' + m[2] : (d || ''); }
  function badge(t) {
    var ini = t ? esc(String(t.name || '?').slice(0, 2).toUpperCase()) : '?';
    if (t && t.crest) return '<img class="cup-crest" src="' + esc(crestSrc(t.crest)) + '" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.outerHTML=\'<span class=&quot;cup-crest cup-crest-ini&quot;>' + ini + '</span>\'">';
    return '<span class="cup-crest cup-crest-ini">' + ini + '</span>';
  }
  function roundName(n) {
    return ({ 1: 'Final', 2: 'Semifinales', 4: 'Cuartos de final', 8: 'Octavos de final', 16: 'Dieciseisavos' })[n] || ('Ronda de ' + (n * 2));
  }

  /* ---------- persistencia ---------- */
  function load() {
    return app().getJSON(KEY, []).then(function (v) {
      cups = Array.isArray(v) ? v : [];
      if (!selectedId || !cups.some(function (c) { return same(c.id, selectedId); })) selectedId = cups.length ? cups[cups.length - 1].id : null;
    }).catch(function () { cups = cups || []; });
  }
  function save() { return app().setJSON(KEY, cups); }
  function current() { return cups.find(function (c) { return same(c.id, selectedId); }) || null; }

  /* ---------- modelo del bracket ---------- */
  function seedOrder(size) {
    var order = [1];
    while (order.length < size) {
      var n = order.length * 2;
      order = order.reduce(function (a, s) { a.push(s, n + 1 - s); return a; }, []);
    }
    return order;
  }
  function buildRounds(ids) {
    var size = pow2(ids.length), order = seedOrder(size), rounds = [], r, k;
    var first = [];
    for (k = 0; k < size / 2; k++) {
      first.push({ id: 'r0t' + k, a: ids[order[2 * k] - 1] != null ? ids[order[2 * k] - 1] : null, b: ids[order[2 * k + 1] - 1] != null ? ids[order[2 * k + 1] - 1] : null });
    }
    rounds.push(first);
    for (r = 1, k = size / 4; k >= 1; k /= 2, r++) {
      var rr = []; for (var i = 0; i < k; i++) rr.push({ id: 'r' + r + 't' + i });
      rounds.push(rr);
    }
    return rounds;
  }
  function outcome(tie, a, b, r) {
    var o = { tie: tie, a: a, b: b, sa: null, sb: null, pa: null, pb: null, winner: null, done: false, bye: false, pens: false, match: null };
    if (a != null && b == null && r === 0) { o.winner = a; o.done = true; o.bye = true; return o; }
    if (b != null && a == null && r === 0) { o.winner = b; o.done = true; o.bye = true; return o; }
    if (a == null || b == null) return o;
    var m = tie.matchId ? matches().find(function (x) { return same(x.id, tie.matchId); }) : null;
    var sa = null, sb = null;
    if (m) {
      o.match = m;
      if (m.finished) {
        var straight = same(m.teamAId, a), x = Number(m.scoreA) || 0, y = Number(m.scoreB) || 0;
        sa = straight ? x : y; sb = straight ? y : x;
      }
    } else if (tie.sa !== undefined && tie.sa !== null && tie.sa !== '' && tie.sb !== undefined && tie.sb !== null && tie.sb !== '') {
      sa = Number(tie.sa); sb = Number(tie.sb);
    }
    if (sa == null) return o;
    o.sa = sa; o.sb = sb;
    if (sa > sb) { o.winner = a; o.done = true; }
    else if (sb > sa) { o.winner = b; o.done = true; }
    else {
      o.pens = true;
      var pa = tie.pa, pb = tie.pb;
      if (pa !== undefined && pa !== null && pa !== '' && pb !== undefined && pb !== null && pb !== '' && Number(pa) !== Number(pb)) {
        o.pa = Number(pa); o.pb = Number(pb);
        o.winner = o.pa > o.pb ? a : b; o.done = true;
      }
    }
    return o;
  }
  function resolve(cup) {
    var res = [];
    cup.rounds.forEach(function (round, r) {
      res.push(round.map(function (tie, k) {
        var a, b;
        if (r === 0) { a = tie.a != null ? tie.a : null; b = tie.b != null ? tie.b : null; }
        else { a = res[r - 1][2 * k].winner; b = res[r - 1][2 * k + 1].winner; }
        var o = outcome(tie, a, b, r); o.r = r; o.k = k; return o;
      }));
    });
    return res;
  }
  function champion(cup) { var res = resolve(cup); return res[res.length - 1][0].winner; }

  /* ---------- HTML del bracket (compartido: público y vista previa admin) ---------- */
  function tieHTML(t) {
    var rows = ['a', 'b'].map(function (s) {
      var id = t[s], tm = team(id);
      var label = id != null ? (tm ? tm.name : 'Equipo') : (t.bye ? 'BYE' : 'Por definir');
      var score = t['s' + s] != null ? t['s' + s] : '';
      var pen = (t.pens && t['p' + s] != null) ? '<sup class="cup-pen">(' + t['p' + s] + ')</sup>' : '';
      var st = t.winner != null && id != null ? (same(t.winner, id) ? ' win' : ' lose') : '';
      return '<div class="cup-team' + st + (id == null ? ' tbd' : '') + '">' + (id != null ? badge(tm) : '<span class="cup-crest cup-crest-empty"></span>') +
        '<span class="cup-tname">' + esc(label) + '</span><span class="cup-score">' + esc(score) + pen + '</span></div>';
    }).join('');
    var foot = '';
    if (t.bye) foot = 'Pasa directo';
    else if (t.pens && !t.done) foot = 'Empate · define por penales';
    else if (t.match) foot = (t.match.date ? fmtDate(t.match.date) : '') + (t.match.time ? ' · ' + esc(t.match.time) + ' COL' : '') + (t.match.finished ? (t.match.date ? ' · ' : '') + 'Finalizado' : (t.match.date ? '' : 'Programado'));
    else if (t.sa != null) foot = 'Resultado';
    else if (t.a != null && t.b != null) foot = 'Por programar';
    return '<div class="cup-tie' + (t.done ? ' done' : '') + (t.bye ? ' bye' : '') + '">' + rows + (foot ? '<div class="cup-foot">' + foot + '</div>' : '') + '</div>';
  }
  function bracketHTML(cup, mode) {
    var res = resolve(cup), R = res.length, n0 = res[0].length, html = '';
    var champId = res[R - 1][0].winner;
    if (champId != null) {
      var ct = team(champId);
      html += '<div class="cup-champ"><span class="cup-trophy">🏆</span><span class="cup-champ-label">Campeón</span>' + badge(ct) + '<b>' + esc(ct ? ct.name : 'Equipo') + '</b></div>';
    }
    if (mode === 'list') {
      html += '<div class="cup-list">';
      res.forEach(function (round) {
        html += '<h4 class="cup-round-title">' + roundName(round.length) + '</h4><div class="cup-list-grid">' + round.map(tieHTML).join('') + '</div>';
      });
      return html + '</div>';
    }
    html += '<div class="cup-scroll"><div class="cup-bracket" style="--cols:' + R + ';--rows:' + n0 + '">';
    res.forEach(function (round, r) { html += '<div class="cup-head" style="grid-column:' + (r + 1) + ';grid-row:1">' + roundName(round.length) + '</div>'; });
    res.forEach(function (round, r) {
      var span = Math.pow(2, r);
      round.forEach(function (t, k) {
        html += '<div class="cup-cell ' + (k % 2 ? 'odd' : 'even') + (r === 0 ? ' first' : '') + (r === R - 1 ? ' last' : '') + '" style="grid-column:' + (r + 1) + ';grid-row:' + (2 + k * span) + ' / span ' + span + '">' + tieHTML(t) + '</div>';
      });
    });
    return html + '</div></div>';
  }
  function cupStatus(cup) {
    var res = resolve(cup), champId = res[res.length - 1][0].winner;
    if (champId != null) { var t = team(champId); return 'Campeón: ' + (t ? t.name : '—'); }
    for (var r = 0; r < res.length; r++) { if (res[r].some(function (x) { return !x.done && x.a != null && x.b != null; })) return 'En juego · ' + roundName(res[r].length); }
    return 'Por comenzar';
  }

  /* ---------- estilos ---------- */
  var CSS = '' +
    '.cup-public{margin-top:34px}.cup-public h2.cup-h{font:700 26px Oswald,sans-serif;margin:0 0 4px}.cup-sub{color:var(--text-low);font-size:13px;margin-bottom:16px}' +
    '.cup-toolbar{display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap;margin:0 0 14px}' +
    '.cup-chips{display:flex;gap:8px;flex-wrap:wrap}.cup-chip{padding:8px 14px;border-radius:999px;border:1px solid var(--border);background:var(--panel);color:var(--text-mid);font:600 12px Inter,sans-serif;cursor:pointer}' +
    '.cup-chip.active{border-color:var(--green);background:rgba(52,232,143,.12);color:var(--green)}.cup-chip small{display:block;font:500 10px Inter,sans-serif;color:var(--text-low);margin-top:2px}' +
    '.cup-modes{display:inline-flex;border:1px solid var(--border);border-radius:10px;overflow:hidden}.cup-modes button{padding:8px 14px;border:0;background:var(--panel);color:var(--text-mid);font:600 12px Inter,sans-serif;cursor:pointer}.cup-modes button.active{background:var(--green);color:#05130c}' +
    '.cup-card{border:1px solid var(--border);border-radius:16px;background:var(--panel);padding:18px}' +
    '.cup-scroll{overflow-x:auto;padding:6px 2px 14px;-webkit-overflow-scrolling:touch}' +
    '.cup-bracket{display:grid;grid-template-columns:repeat(var(--cols),minmax(220px,1fr));grid-template-rows:auto repeat(var(--rows),minmax(86px,auto));column-gap:28px;min-width:calc(var(--cols) * 248px)}' +
    '.cup-head{padding:0 2px 10px;font:700 11px Oswald,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:var(--text-low);text-align:center}' +
    '.cup-cell{position:relative;display:flex;align-items:center;padding:6px 0}.cup-cell>.cup-tie{width:100%}' +
    '.cup-cell::after,.cup-cell::before{content:"";position:absolute;width:14px;border:0 solid var(--border)}' +
    '.cup-cell.last::after,.cup-cell.first::before{display:none}' +
    '.cup-cell::before{left:-14px;top:50%;border-top-width:2px}' +
    '.cup-cell.even::after{right:-14px;top:50%;bottom:0;border-top-width:2px;border-right-width:2px}' +
    '.cup-cell.odd::after{right:-14px;top:0;bottom:50%;border-bottom-width:2px;border-right-width:2px}' +
    '.cup-tie{border:1px solid var(--border);border-radius:10px;background:var(--panel-2);overflow:hidden;min-width:0}' +
    '.cup-tie.done{border-color:rgba(52,232,143,.35)}' +
    '.cup-team{display:flex;align-items:center;gap:8px;padding:8px 10px;min-width:0}.cup-team+.cup-team{border-top:1px solid var(--border)}' +
    '.cup-team.win{background:rgba(52,232,143,.10)}.cup-team.win .cup-tname,.cup-team.win .cup-score{color:var(--green);font-weight:700}.cup-team.lose{opacity:.55}.cup-team.tbd .cup-tname{color:var(--text-low);font-style:italic}' +
    '.cup-crest{width:22px;height:22px;flex:0 0 22px;border-radius:50%;object-fit:contain;background:var(--panel);border:1px solid var(--border)}' +
    '.cup-crest-ini{display:inline-flex;align-items:center;justify-content:center;font:700 9px Oswald,sans-serif;color:var(--text-mid)}.cup-crest-empty{border-style:dashed}' +
    '.cup-tname{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font:600 13px Inter,sans-serif;color:var(--text-hi)}' +
    '.cup-score{font:700 15px Oswald,sans-serif;color:var(--text-hi);min-width:18px;text-align:right}.cup-pen{font-size:10px;color:var(--text-mid);margin-left:2px}' +
    '.cup-foot{padding:5px 10px;border-top:1px solid var(--border);font:500 10.5px Inter,sans-serif;color:var(--text-low);background:rgba(0,0,0,.12)}' +
    '.cup-champ{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:0 0 14px;padding:12px 16px;border:1px solid #806d1d;border-radius:12px;background:linear-gradient(90deg,rgba(255,212,70,.16),transparent)}' +
    '.cup-trophy{font-size:24px}.cup-champ-label{font:700 11px Oswald,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#ffd446}.cup-champ b{font:700 18px Oswald,sans-serif}.cup-champ .cup-crest{width:30px;height:30px;flex-basis:30px}' +
    '.cup-round-title{margin:18px 0 10px;font:700 13px Oswald,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:var(--green)}.cup-round-title:first-child{margin-top:4px}' +
    '.cup-list-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:10px}' +
    '.cup-empty{padding:26px 18px;border:1px dashed var(--border);border-radius:14px;color:var(--text-low);text-align:center;font-size:13px}' +
    '.cup-link{display:inline-block;margin-top:12px;color:var(--green);font:600 12px Inter,sans-serif}' +
    /* admin */
    '.cup-adm{display:flex;flex-direction:column;gap:18px}.cup-adm-top{display:flex;gap:10px;flex-wrap:wrap;align-items:center}.cup-adm-top select{flex:1 1 220px}' +
    '.cup-form{padding:16px;border:1px solid var(--border);border-radius:14px;background:var(--panel-2)}.cup-form h4,.cup-adm h4.cup-adm-h{font:700 15px Oswald,sans-serif;margin:0 0 10px}' +
    '.cup-row{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin:10px 0}.cup-row>.input{flex:1 1 240px;margin:0}' +
    '.cup-group{margin:12px 0}.cup-group-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px;font:700 11px Oswald,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:var(--text-low)}' +
    '.cup-group-head button{padding:4px 10px;border:1px solid var(--border);border-radius:999px;background:var(--panel);color:var(--text-mid);font:600 10px Inter,sans-serif;cursor:pointer}' +
    '.cup-picks{display:flex;gap:6px;flex-wrap:wrap}.cup-pick{display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border:1px solid var(--border);border-radius:999px;background:var(--panel);color:var(--text-mid);font:600 12px Inter,sans-serif;cursor:pointer}' +
    '.cup-pick.on{border-color:var(--green);background:rgba(52,232,143,.13);color:var(--green)}.cup-pick i{font-style:normal;display:inline-flex;align-items:center;justify-content:center;min-width:18px;height:18px;border-radius:9px;background:var(--green);color:#05130c;font:700 10px Oswald,sans-serif}' +
    '.cup-seg{display:inline-flex;border:1px solid var(--border);border-radius:10px;overflow:hidden}.cup-seg button{padding:8px 12px;border:0;background:var(--panel);color:var(--text-mid);font:600 12px Inter,sans-serif;cursor:pointer}.cup-seg button.on{background:var(--green);color:#05130c}' +
    '.cup-note{font-size:12px;color:var(--text-low)}.cup-bar{display:flex;gap:8px;flex-wrap:wrap;align-items:center;justify-content:space-between}.cup-bar .cup-actions{display:flex;gap:8px;flex-wrap:wrap}' +
    '.cup-danger{border-color:#ff6b6b!important;color:#ff8a8a!important}' +
    '.cup-ties{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px}' +
    '.cup-adm-tie{padding:14px;border:1px solid var(--border);border-radius:12px;background:var(--panel-2);display:flex;flex-direction:column;gap:10px;min-width:0}' +
    '.cup-adm-tie.done{border-color:rgba(52,232,143,.4)}.cup-adm-head{display:flex;justify-content:space-between;gap:8px;font:700 11px Oswald,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:var(--text-low)}' +
    '.cup-vs{display:flex;align-items:center;gap:8px;font:700 14px Oswald,sans-serif;min-width:0}.cup-vs span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.cup-vs em{font-style:normal;color:var(--text-low);font-size:11px}' +
    '.cup-mini{display:grid;grid-template-columns:1fr 1fr auto;gap:8px;align-items:end}.cup-mini label,.cup-adm-tie label{display:flex;flex-direction:column;gap:4px;font:600 10px Inter,sans-serif;color:var(--text-low);text-transform:uppercase;letter-spacing:.06em}' +
    '.cup-mini .input,.cup-adm-tie .input{margin:0;min-width:0;width:100%}.cup-adm-tie .btn{width:auto}' +
    '.cup-state{font-size:12px;color:var(--text-mid);line-height:1.5}.cup-state b{color:var(--green)}' +
    '.cup-two{display:grid;grid-template-columns:1fr 1fr;gap:8px}' +
    '@media(max-width:700px){.cup-card{padding:12px}.cup-bracket{grid-template-columns:repeat(var(--cols),78vw);min-width:0;column-gap:28px}.cup-scroll{scroll-snap-type:x proximity}.cup-cell{scroll-snap-align:start}.cup-ties{grid-template-columns:1fr}.cup-list-grid{grid-template-columns:1fr}.cup-public h2.cup-h{font-size:22px}.cup-mini{grid-template-columns:1fr 1fr}.cup-mini .btn{grid-column:1/-1;width:100%}}';
  function addCss() {
    if (document.getElementById('hfa-copa-css')) return;
    var s = document.createElement('style'); s.id = 'hfa-copa-css'; s.textContent = CSS; document.head.appendChild(s);
  }

  /* =====================================================================
     VISTA PÚBLICA
     ===================================================================== */
  function renderPublic(host) {
    if (!host.isConnected) return;
    if (!pubMode) pubMode = window.innerWidth <= 700 ? 'list' : 'bracket';
    var html = '<h2 class="cup-h">Copas y bracket</h2><div class="cup-sub">Cuadros de eliminatoria directa. Se actualizan solos con los resultados de las actas.</div>';
    if (!cups.length) { host.innerHTML = html + '<div class="cup-empty">Todavía no hay copas creadas.</div>'; return; }
    var cup = current() || cups[cups.length - 1];
    html += '<div class="cup-toolbar"><div class="cup-chips">' + cups.map(function (c) {
      return '<button type="button" class="cup-chip' + (same(c.id, cup.id) ? ' active' : '') + '" data-cup-pick="' + esc(c.id) + '">' + esc(c.name) + '<small>' + esc(cupStatus(c)) + '</small></button>';
    }).join('') + '</div><div class="cup-modes"><button type="button" class="' + (pubMode === 'bracket' ? 'active' : '') + '" data-cup-mode="bracket">🏆 Bracket</button><button type="button" class="' + (pubMode === 'list' ? 'active' : '') + '" data-cup-mode="list">☰ Lista</button></div></div>';
    html += '<div class="cup-card">' + bracketHTML(cup, pubMode) + '<a class="cup-link" href="seccion.html?view=partidos&tournament=' + encodeURIComponent(cup.tournamentId || '') + '">Ver los partidos de esta copa →</a></div>';
    host.innerHTML = html;
  }
  function mountPublic(el) {
    addCss();
    var old = el.querySelector('#cupPublic'); if (old) old.remove();
    var host = document.createElement('section'); host.id = 'cupPublic'; host.className = 'cup-public';
    host.innerHTML = '<h2 class="cup-h">Copas y bracket</h2><div class="cup-sub">Cargando…</div>';
    el.appendChild(host);
    host.addEventListener('click', function (e) {
      var p = e.target.closest('[data-cup-pick]'), m = e.target.closest('[data-cup-mode]');
      if (p) { selectedId = p.getAttribute('data-cup-pick'); renderPublic(host); }
      else if (m) { pubMode = m.getAttribute('data-cup-mode'); renderPublic(host); }
    });
    var refresh = function () {
      return Promise.all([load(), app().getJSON('matches', null)]).then(function (r) {
        if (Array.isArray(r[1])) app().state.matches = r[1];
        renderPublic(host);
      });
    };
    refresh();
    var timer = setInterval(function () { if (!host.isConnected) { clearInterval(timer); return; } if (!document.hidden) refresh(); }, 15000);
  }

  /* =====================================================================
     ADMINISTRACIÓN
     ===================================================================== */
  function adminTieHTML(t, cup) {
    var ta = team(t.a), tb = team(t.b), r = t.r, k = t.k;
    var head = '<div class="cup-adm-head"><span>' + roundName(cup.rounds[r].length) + ' · Partido ' + (k + 1) + '</span><span>' + (t.done ? '✔ Resuelto' : (t.a != null && t.b != null ? 'Pendiente' : 'En espera')) + '</span></div>';
    var vs = '<div class="cup-vs"><span>' + esc(ta ? ta.name : (t.bye && t.a == null ? 'BYE' : 'Por definir')) + '</span><em>vs</em><span>' + esc(tb ? tb.name : (t.bye && t.b == null ? 'BYE' : 'Por definir')) + '</span></div>';
    var body = '';
    if (r === 0) {
      var opts = function (sel) {
        return '<option value="">— BYE / vacío —</option>' + cup.teamIds.map(function (id) { var tm = team(id); return '<option value="' + esc(id) + '"' + (same(id, sel) ? ' selected' : '') + '>' + esc(tm ? tm.name : id) + '</option>'; }).join('');
      };
      body += '<div class="cup-two"><label>Equipo A<select class="input" data-cup-team="a"'+(cup.rounds[0][k].matchId?' disabled':'')+'>' + opts(cup.rounds[0][k].a) + '</select></label><label>Equipo B<select class="input" data-cup-team="b"'+(cup.rounds[0][k].matchId?' disabled':'')+'>' + opts(cup.rounds[0][k].b) + '</select></label></div>';
    }
    if (t.bye) {
      body += '<div class="cup-state">Pasa directo a la siguiente ronda.</div>';
    } else if (t.a != null && t.b != null) {
      if (t.match) {
        var m = t.match;
        body += '<div class="cup-state"><b>Partido creado</b> · ' + esc(m.date ? fmtDate(m.date) : 'sin fecha') + (m.time ? ' ' + esc(m.time) + ' COL' : '') + ' · ' + (m.finished ? 'finalizado <b>' + esc(t.sa) + ' - ' + esc(t.sb) + '</b>' : 'aún sin finalizar') + '.<br>Se cierra desde “Editar y finalizar actas”; el bracket se actualiza solo.</div><div><button type="button" class="btn" data-cup-act="unlink">Desvincular partido</button></div>';
      } else {
        body += '<div class="cup-mini"><label>Fecha<input class="input" type="date" data-f="date" value="' + esc(cup.rounds[r][k].date || '') + '"></label><label>Hora (COL)<input class="input" type="time" data-f="time" value="' + esc(cup.rounds[r][k].time || '') + '"></label><button type="button" class="btn btn-primary" data-cup-act="mk-match">Crear partido</button></div>' +
          '<div class="cup-mini"><label>Goles ' + esc(ta ? ta.name : 'A') + '<input class="input" type="number" min="0" data-f="sa" value="' + esc(cup.rounds[r][k].sa == null ? '' : cup.rounds[r][k].sa) + '"></label><label>Goles ' + esc(tb ? tb.name : 'B') + '<input class="input" type="number" min="0" data-f="sb" value="' + esc(cup.rounds[r][k].sb == null ? '' : cup.rounds[r][k].sb) + '"></label><button type="button" class="btn" data-cup-act="save-manual">Guardar resultado</button></div>' +
          '<div class="cup-note">Crea el partido para jugarlo con acta, o escribe el resultado a mano.</div>';
      }
      if (t.pens) {
        body += '<div class="cup-mini"><label>Penales ' + esc(ta ? ta.name : 'A') + '<input class="input" type="number" min="0" data-f="pa" value="' + esc(cup.rounds[r][k].pa == null ? '' : cup.rounds[r][k].pa) + '"></label><label>Penales ' + esc(tb ? tb.name : 'B') + '<input class="input" type="number" min="0" data-f="pb" value="' + esc(cup.rounds[r][k].pb == null ? '' : cup.rounds[r][k].pb) + '"></label><button type="button" class="btn btn-primary" data-cup-act="save-pens">Guardar penales</button></div><div class="cup-state"><b>Empate</b>: define quién avanza con los penales.</div>';
      }
    } else {
      body += '<div class="cup-state">Esperando a los ganadores de la ronda anterior.</div>';
    }
    return '<div class="cup-adm-tie' + (t.done ? ' done' : '') + '" data-r="' + r + '" data-k="' + k + '">' + head + vs + body + '</div>';
  }
  function formHTML() {
    var groups = {};
    teams().forEach(function (t) { var d = divCode(t) || '—'; (groups[d] = groups[d] || []).push(t); });
    var keys = Object.keys(groups).sort();
    var gh = keys.map(function (d) {
      return '<div class="cup-group"><div class="cup-group-head"><span>' + (d === '—' ? 'Sin división' : 'División ' + d + 'D') + '</span><span><button type="button" data-cup-act="grp-on" data-d="' + esc(d) + '">Elegir todos</button> <button type="button" data-cup-act="grp-off" data-d="' + esc(d) + '">Quitar</button></span></div><div class="cup-picks">' +
        groups[d].map(function (t) {
          var i = draft.ids.findIndex(function (x) { return same(x, t.id); });
          return '<button type="button" class="cup-pick' + (i > -1 ? ' on' : '') + '" data-cup-act="toggle" data-id="' + esc(t.id) + '">' + (i > -1 && draft.order === 'order' ? '<i>' + (i + 1) + '</i>' : '') + esc(t.name) + '</button>';
        }).join('') + '</div></div>';
    }).join('');
    var n = draft.ids.length, ok = n >= 2 && n <= 32;
    return '<div class="cup-form"><h4>Nueva copa</h4><div class="cup-row"><input class="input" id="cupNewName" placeholder="Nombre de la copa (ej. Copa HFA 2026)" maxlength="60" value="' + esc(draft.name) + '"></div>' +
      '<div class="cup-note">Elige los equipos que participan (2 a 32). Si no son potencia de 2, los mejor sembrados pasan directo (BYE).</div>' +
      (gh || '<div class="cup-empty">Primero crea equipos en “Equipos y jugadores”.</div>') +
      '<div class="cup-row"><span class="cup-note">Sorteo:</span><span class="cup-seg"><button type="button" class="' + (draft.order === 'random' ? 'on' : '') + '" data-cup-act="order" data-v="random">🎲 Aleatorio</button><button type="button" class="' + (draft.order === 'order' ? 'on' : '') + '" data-cup-act="order" data-v="order">① Orden en que los elegí</button></span></div>' +
      '<div class="cup-bar"><span class="cup-note"><b>' + n + '</b> equipos' + (n >= 2 ? ' · bracket de ' + pow2(n) + (pow2(n) > n ? ' (' + (pow2(n) - n) + ' BYE)' : '') : '') + '</span><div class="cup-actions">' + (cups.length ? '<button type="button" class="btn" data-cup-act="cancel-new">Cancelar</button>' : '') + '<button type="button" class="btn btn-primary" data-cup-act="create"' + (ok ? '' : ' disabled') + '>Crear copa y generar bracket</button></div></div></div>';
  }
  function renderAdmin() {
    var el = adminHost; if (!el || !el.isConnected) return;
    var cup = current(), html = '<div class="cup-adm">';
    html += '<div class="cup-adm-top">' + (cups.length ? '<select class="input" data-cup-act="pick">' + cups.map(function (c) { return '<option value="' + esc(c.id) + '"' + (cup && same(c.id, cup.id) ? ' selected' : '') + '>' + esc(c.name) + ' — ' + esc(cupStatus(c)) + '</option>'; }).join('') + '</select>' : '') +
      '<button type="button" class="btn ' + (cups.length ? '' : 'btn-primary') + '" data-cup-act="new">＋ Nueva copa</button></div>';
    if (showForm || !cups.length) html += formHTML();
    if (cup && !(showForm && !cups.length)) {
      var res = resolve(cup);
      html += '<div class="cup-bar"><h4 class="cup-adm-h" style="margin:0">' + esc(cup.name) + ' <span class="cup-note">· ' + cup.teamIds.length + ' equipos · ' + esc(cupStatus(cup)) + '</span></h4><div class="cup-actions"><button type="button" class="btn" data-cup-act="reshuffle">🎲 Resortear</button><button type="button" class="btn cup-danger" data-cup-act="delete">Eliminar copa</button></div></div>';
      html += '<div class="cup-card">' + bracketHTML(cup, 'bracket') + '</div>';
      res.forEach(function (round, r) {
        html += '<h4 class="cup-adm-h">' + roundName(round.length) + '</h4><div class="cup-ties">' + round.map(function (t) { return adminTieHTML(t, cup); }).join('') + '</div>';
      });
    }
    el.innerHTML = html + '</div>';
  }

  function resetCupMatches(cup) {
    var st = app().state;
    st.matches = st.matches.filter(function (m) { return !same(m.cupId, cup.id); });
    return app().setJSON('matches', st.matches);
  }
  function onAdminClick(e) {
    var btn = e.target.closest('[data-cup-act]'); if (!btn || btn.tagName === 'SELECT') return;
    var act = btn.getAttribute('data-cup-act'), cup = current(), card = btn.closest('.cup-adm-tie');
    var tie = card && cup ? cup.rounds[+card.dataset.r][+card.dataset.k] : null;
    var val = function (f) { var i = card && card.querySelector('[data-f="' + f + '"]'); return i ? i.value : ''; };
    var done = function () { return save().then(renderAdmin); };
    var st = app().state;
    if (act === 'new') { draft = { name: '', ids: [], order: 'random' }; showForm = true; renderAdmin(); return; }
    if (act === 'cancel-new') { showForm = false; renderAdmin(); return; }
    if (act === 'toggle') {
      var id = btn.getAttribute('data-id'), i = draft.ids.findIndex(function (x) { return same(x, id); });
      if (i > -1) draft.ids.splice(i, 1); else draft.ids.push(team(id) ? team(id).id : id);
      renderAdmin(); return;
    }
    if (act === 'grp-on' || act === 'grp-off') {
      var d = btn.getAttribute('data-d');
      teams().filter(function (t) { return (divCode(t) || '—') === d; }).forEach(function (t) {
        var j = draft.ids.findIndex(function (x) { return same(x, t.id); });
        if (act === 'grp-on' && j === -1) draft.ids.push(t.id);
        if (act === 'grp-off' && j > -1) draft.ids.splice(j, 1);
      });
      renderAdmin(); return;
    }
    if (act === 'order') { draft.order = btn.getAttribute('data-v'); renderAdmin(); return; }
    if (act === 'create') {
      var name = (draft.name || '').trim();
      if (!name) { alert('Escribe un nombre para la copa.'); return; }
      if (cups.some(function (c) { return String(c.name).toLowerCase() === name.toLowerCase(); })) { alert('Ya existe una copa con ese nombre.'); return; }
      if (draft.ids.length < 2 || draft.ids.length > 32) { alert('Elige entre 2 y 32 equipos.'); return; }
      var ids = draft.order === 'random' ? shuffle(draft.ids) : draft.ids.slice();
      var c = { id: uid('c'), name: name, teamIds: ids, createdAt: Date.now() };
      c.tournamentId = 'copa-' + c.id; c.rounds = buildRounds(ids);
      cups.push(c); selectedId = c.id; showForm = false; draft = { name: '', ids: [], order: 'random' };
      st.tournaments.push({ id: c.tournamentId, name: c.name, type: 'copa', cupId: c.id });
      Promise.all([app().setJSON('tournaments', st.tournaments), save()]).then(renderAdmin);
      return;
    }
    if (!cup) return;
    if (act === 'reshuffle') {
      if (!confirm('Se volverá a sortear el bracket. Se borrarán los resultados y los partidos creados de esta copa. ¿Continuar?')) return;
      cup.rounds = buildRounds(shuffle(cup.teamIds));
      resetCupMatches(cup).then(done); return;
    }
    if (act === 'delete') {
      if (!confirm('¿Eliminar la copa “' + cup.name + '”? Se borrarán también su torneo y todos sus partidos.')) return;
      cups = cups.filter(function (x) { return x !== cup; });
      st.tournaments = st.tournaments.filter(function (x) { return !same(x.id, cup.tournamentId); });
      selectedId = cups.length ? cups[cups.length - 1].id : null;
      Promise.all([resetCupMatches(cup), app().setJSON('tournaments', st.tournaments)]).then(done); return;
    }
    if (!tie) return;
    var o = resolve(cup)[+card.dataset.r][+card.dataset.k];
    if (act === 'mk-match') {
      if (o.a == null || o.b == null) return;
      var ta = team(o.a), tb = team(o.b);
      if (!ta || !tb) { alert('Alguno de los equipos ya no existe.'); return; }
      tie.date = val('date'); tie.time = val('time');
      var m = { id: uid('m'), teamAId: ta.id, teamBId: tb.id, home: ta.name, away: tb.name, date: tie.date, time: tie.time, round: +card.dataset.r + 1, division: 'copa', tz: 'COL', tournamentId: cup.tournamentId, finished: false, acta: '', attendance: {}, cupId: cup.id, cupRound: roundName(cup.rounds[+card.dataset.r].length) };
      st.matches.push(m); tie.matchId = m.id; delete tie.sa; delete tie.sb;
      app().setJSON('matches', st.matches).then(done); return;
    }
    if (act === 'unlink') {
      if (!confirm('Se desvinculará el partido de este cruce (el partido seguirá existiendo en Partidos). ¿Continuar?')) return;
      delete tie.matchId; delete tie.pa; delete tie.pb; done(); return;
    }
    if (act === 'save-manual') {
      var a = val('sa'), b = val('sb');
      if (a === '' || b === '') { delete tie.sa; delete tie.sb; delete tie.pa; delete tie.pb; done(); return; }
      tie.sa = Math.max(0, parseInt(a, 10) || 0); tie.sb = Math.max(0, parseInt(b, 10) || 0);
      if (tie.sa !== tie.sb) { delete tie.pa; delete tie.pb; }
      done(); return;
    }
    if (act === 'save-pens') {
      var pa = val('pa'), pb = val('pb');
      if (pa === '' || pb === '' || parseInt(pa, 10) === parseInt(pb, 10)) { alert('Escribe los penales de ambos equipos (no pueden quedar iguales).'); return; }
      tie.pa = Math.max(0, parseInt(pa, 10) || 0); tie.pb = Math.max(0, parseInt(pb, 10) || 0); done(); return;
    }
  }
  function onAdminChange(e) {
    var t = e.target, cup = current();
    if (t.matches('select[data-cup-act="pick"]')) { selectedId = t.value; showForm = false; renderAdmin(); return; }
    if (t.matches('[data-cup-team]') && cup) {
      var card = t.closest('.cup-adm-tie'), tie = cup.rounds[+card.dataset.r][+card.dataset.k], side = t.getAttribute('data-cup-team');
      tie[side] = t.value === '' ? null : (team(t.value) ? team(t.value).id : t.value);
      save().then(renderAdmin);
    }
  }
  function mountAdmin(el) {
    addCss();
    adminHost = el;
    if (!el.__cupBound) {
      el.__cupBound = true;
      el.addEventListener('click', onAdminClick);
      el.addEventListener('change', onAdminChange);
      el.addEventListener('input', function (e) { if (e.target.id === 'cupNewName') draft.name = e.target.value; });
    }
    el.innerHTML = '<div class="cup-note">Cargando copas…</div>';
    load().then(function () { showForm = !cups.length; renderAdmin(); });
  }

  window.hfaCopa = { mountPublic: mountPublic, mountAdmin: mountAdmin, _resolve: resolve, _build: buildRounds };
})();
