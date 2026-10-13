/* =====================================================================
   HFA · Copas: fase de grupos + bracket (eliminatorias)
   - Vista pública: seccion.html?view=torneos
   - Gestión: panel admin → "🏆 Copas y bracket"
   Depende de window.hfaApp (expuesto por seccion.html). Datos en la clave "cups".
   Formatos:
     'grupos'  → fase de grupos (todos contra todos) y después eliminatorias
                 (el bracket se rellena solo con los clasificados de cada grupo)
     'directo' → solo eliminatorias (y las copas antiguas, que siguen funcionando)
   Los partidos se crean como partidos normales (division:'copa'): se juegan y
   se cierran con las actas de siempre y la copa avanza sola con el resultado.
   ===================================================================== */
(function () {
  'use strict';
  var KEY = 'cups';
  var cups = [], selectedId = null;
  var pubMode = null, pubTab = null, pubTabFor = null, pubGroup = 'all', pubDiv = 'all', pubOnly = null, pubHost = null;
  var admTab = null, admTabFor = null;
  var DRAFT0 = { name: '', ids: [], order: 'random', format: 'grupos', groups: 2, q: 2, dbl: false, div: '1' };
  var draft = JSON.parse(JSON.stringify(DRAFT0));
  var showForm = false, adminHost = null;

  /* ---------- utilidades ---------- */
  function app() { return window.hfaApp; }
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function same(a, b) { return a != null && b != null && String(a) === String(b); }
  function teams() { return (app() && app().state.teams) || []; }
  function team(id) { return id == null ? null : teams().find(function (t) { return same(t.id, id); }) || null; }
  function teamName(id) { var t = team(id); return t ? String(t.name) : 'Equipo'; }
  function matches() { return (app() && app().state.matches) || []; }
  function crestSrc(u) { return String(u || '').replace(/\/(tiny|small|preview|medium)$/i, ''); }
  function divCode(t) { return String(t.division == null ? '' : t.division).replace(/\D/g, '') || ''; }
  function uid(p) { return (p || '') + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }
  function pow2(n) { var s = 2; while (s < n) s *= 2; return s; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function fmtDate(d) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d || ''); return m ? m[3] + '/' + m[2] : (d || ''); }
  function isNum(v) { return v !== undefined && v !== null && v !== '' && !isNaN(Number(v)); }
  function groupName(i) { return 'Grupo ' + String.fromCharCode(65 + i); }
  function badge(t) {
    var ini = t ? esc(String(t.name || '?').slice(0, 2).toUpperCase()) : '?';
    if (t && t.crest) return '<img class="cup-crest" src="' + esc(crestSrc(t.crest)) + '" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.outerHTML=\'<span class=&quot;cup-crest cup-crest-ini&quot;>' + ini + '</span>\'">';
    return '<span class="cup-crest cup-crest-ini">' + ini + '</span>';
  }
  function cupDiv(c) { return c && c.division ? String(c.division) : ''; }
  function divTag(c) { var d = cupDiv(c); return '<b class="cup-div">' + (d ? d + 'D' : 'Mixta') + '</b>'; }
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

  /* =====================================================================
     MODELO · construcción
     ===================================================================== */
  function seedOrder(size) {
    var order = [1];
    while (order.length < size) {
      var n = order.length * 2;
      order = order.reduce(function (a, s) { a.push(s, n + 1 - s); return a; }, []);
    }
    return order;
  }
  function laterRounds(size) {
    var rounds = [], r = 1, k;
    for (k = size / 4; k >= 1; k /= 2, r++) {
      var rr = []; for (var i = 0; i < k; i++) rr.push({ id: 'r' + r + 't' + i });
      rounds.push(rr);
    }
    return rounds;
  }
  /* eliminatoria directa: ids = equipos ordenados por siembra */
  function buildRounds(ids) {
    var size = pow2(ids.length), order = seedOrder(size), first = [], k;
    for (k = 0; k < size / 2; k++) {
      var a = ids[order[2 * k] - 1], b = ids[order[2 * k + 1] - 1];
      first.push({ id: 'r0t' + k, a: a != null ? a : null, b: b != null ? b : null });
    }
    return [first].concat(laterRounds(size));
  }
  /* eliminatoria tras grupos: los cruces guardan referencias {g, p} = posición p del grupo g */
  function buildGroupRounds(G, q) {
    var seeds = [], g, i;
    for (g = 0; g < G; g++) seeds.push({ g: g, p: 1 });
    if (q >= 2) {
      for (i = 1; i <= G; i++) seeds[2 * G - i] = { g: i % G, p: 2 };
    }
    var size = pow2(seeds.length), order = seedOrder(size), first = [], k;
    for (k = 0; k < size / 2; k++) {
      var ra = seeds[order[2 * k] - 1], rb = seeds[order[2 * k + 1] - 1];
      first.push({ id: 'r0t' + k, ra: ra || false, rb: rb || false });
    }
    return [first].concat(laterRounds(size));
  }
  function distribute(ids, G, mode) {
    var groups = [], i; for (i = 0; i < G; i++) groups.push([]);
    if (mode === 'random') {
      shuffle(ids).forEach(function (id, n) { groups[n % G].push(id); });
    } else {                                   // cabezas de serie en serpiente
      ids.forEach(function (id, n) { var row = Math.floor(n / G), pos = n % G; groups[row % 2 === 0 ? pos : G - 1 - pos].push(id); });
    }
    return groups;
  }
  function roundRobin(ids) {
    var arr = ids.slice(), rounds = [], r, i;
    if (arr.length % 2) arr.push(null);
    var n = arr.length;
    for (r = 0; r < n - 1; r++) {
      var pairs = [];
      for (i = 0; i < n / 2; i++) { var a = arr[i], b = arr[n - 1 - i]; if (a != null && b != null) pairs.push(r % 2 ? [b, a] : [a, b]); }
      rounds.push(pairs);
      arr.splice(1, 0, arr.pop());
    }
    return rounds;
  }
  function makeFixtures(groups, dbl) {
    var fx = [];
    groups.forEach(function (g, gi) {
      var rr = roundRobin(g.teamIds);
      rr.forEach(function (pairs, ri) { pairs.forEach(function (p, pi) { fx.push({ id: 'g' + gi + 'r' + (ri + 1) + 'p' + pi, g: gi, r: ri + 1, a: p[0], b: p[1] }); }); });
      if (dbl) rr.forEach(function (pairs, ri) { pairs.forEach(function (p, pi) { fx.push({ id: 'g' + gi + 'r' + (rr.length + ri + 1) + 'p' + pi, g: gi, r: rr.length + ri + 1, a: p[1], b: p[0] }); }); });
    });
    return fx;
  }
  /* (re)genera la estructura de una copa a partir de sus equipos y opciones */
  function structure(cup, ids, order) {
    cup.teamIds = ids;
    if (cup.format === 'grupos') {
      var G = cup.G, parts = distribute(ids, G, order);
      cup.groups = parts.map(function (arr, i) { return { id: 'g' + i, name: groupName(i), teamIds: arr }; });
      cup.fixtures = makeFixtures(cup.groups, cup.dbl);
      cup.rounds = buildGroupRounds(G, cup.q);
      cup.closed = false;
    } else {
      cup.rounds = buildRounds(order === 'random' ? shuffle(ids) : ids);
    }
  }

  /* =====================================================================
     MODELO · resultados
     ===================================================================== */
  function matchById(id) { return id ? matches().find(function (x) { return same(x.id, id); }) || null : null; }
  /* resultado de un partido (de grupo o cruce) desde el partido vinculado o el resultado manual */
  function scoreOf(item, a) {
    var m = matchById(item.matchId), r = { match: m, sa: null, sb: null };
    if (m) {
      if (m.finished) {
        var straight = same(m.teamAId, a), x = Number(m.scoreA) || 0, y = Number(m.scoreB) || 0;
        r.sa = straight ? x : y; r.sb = straight ? y : x;
      }
    } else if (isNum(item.sa) && isNum(item.sb)) { r.sa = Number(item.sa); r.sb = Number(item.sb); }
    return r;
  }
  function groupsData(cup) {
    var tables = cup.groups.map(function (g) {
      var rows = {}; g.teamIds.forEach(function (id) { rows[id] = { id: id, pj: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, dg: 0, pts: 0 }; });
      return { g: g, rows: rows, list: [] };
    });
    var played = 0;
    var outs = cup.fixtures.map(function (fx) {
      var s = scoreOf(fx, fx.a), o = { fx: fx, match: s.match, sa: s.sa, sb: s.sb, done: s.sa != null };
      if (o.done) {
        played++;
        var t = tables[fx.g], ra = t.rows[fx.a], rb = t.rows[fx.b];
        if (ra && rb) {
          ra.pj++; rb.pj++; ra.gf += o.sa; ra.ga += o.sb; rb.gf += o.sb; rb.ga += o.sa;
          if (o.sa > o.sb) { ra.w++; ra.pts += 3; rb.l++; } else if (o.sb > o.sa) { rb.w++; rb.pts += 3; ra.l++; } else { ra.d++; rb.d++; ra.pts++; rb.pts++; }
        }
      }
      return o;
    });
    tables.forEach(function (t) {
      t.list = Object.keys(t.rows).map(function (k) { var r = t.rows[k]; r.dg = r.gf - r.ga; return r; })
        .sort(function (a, b) { return b.pts - a.pts || b.dg - a.dg || b.gf - a.gf || teamName(a.id).localeCompare(teamName(b.id)); });
    });
    var total = outs.length;
    return { tables: tables, outs: outs, played: played, total: total, complete: (total > 0 && played === total) || !!cup.closed };
  }
  function refTeam(gd, ref) {
    if (!gd.complete) return null;
    var t = gd.tables[ref.g], row = t && t.list[ref.p - 1];
    return row ? row.id : null;
  }
  function outcome(tie, a, b, r, noA, noB) {
    var o = { tie: tie, a: a, b: b, noA: noA, noB: noB, sa: null, sb: null, pa: null, pb: null, winner: null, done: false, bye: false, pens: false, match: null };
    if (r === 0 && (noA || noB)) {
      o.bye = true;
      var only = noA ? b : a;
      if (only != null) { o.winner = only; o.done = true; }
      return o;
    }
    if (a == null || b == null) return o;
    var s = scoreOf(tie, a); o.match = s.match;
    if (s.sa == null) return o;
    o.sa = s.sa; o.sb = s.sb;
    if (s.sa > s.sb) { o.winner = a; o.done = true; }
    else if (s.sb > s.sa) { o.winner = b; o.done = true; }
    else {
      o.pens = true;
      if (isNum(tie.pa) && isNum(tie.pb) && Number(tie.pa) !== Number(tie.pb)) {
        o.pa = Number(tie.pa); o.pb = Number(tie.pb); o.winner = o.pa > o.pb ? a : b; o.done = true;
      }
    }
    return o;
  }
  function resolve(cup) {
    var gd = cup.format === 'grupos' ? groupsData(cup) : null, res = [];
    cup.rounds.forEach(function (round, r) {
      res.push(round.map(function (tie, k) {
        var a = null, b = null, noA = false, noB = false, la = '', lb = '', waiting = false;
        if (r === 0) {
          if (gd) {
            var sides = [tie.ra, tie.rb], out = [];
            sides.forEach(function (ref) {
              if (!ref) out.push({ t: null, no: true, l: '' });
              else { var t = refTeam(gd, ref); out.push({ t: t, no: false, l: t == null ? ref.p + 'º ' + (cup.groups[ref.g] ? cup.groups[ref.g].name : '') : '' }); if (t == null) waiting = true; }
            });
            a = out[0].t; noA = out[0].no; la = out[0].l; b = out[1].t; noB = out[1].no; lb = out[1].l;
          } else {
            a = tie.a != null ? tie.a : null; b = tie.b != null ? tie.b : null; noA = a == null; noB = b == null;
          }
        } else {
          a = res[r - 1][2 * k].winner; b = res[r - 1][2 * k + 1].winner;
        }
        var o = outcome(tie, a, b, r, noA, noB);
        o.la = la; o.lb = lb; o.r = r; o.k = k; o.waitingGroups = waiting;
        return o;
      }));
    });
    res.gd = gd;
    return res;
  }
  function champion(res) { return res[res.length - 1][0].winner; }
  function progress(cup, res) {
    var total = 0, played = 0;
    if (res.gd) { total += res.gd.total; played += res.gd.played; }
    res.forEach(function (round) { round.forEach(function (t) { if (!t.bye) { total++; if (t.done) played++; } }); });
    return { total: total, played: played, pct: total ? Math.round(played * 100 / total) : 0 };
  }
  function cupStatus(cup, res) {
    res = res || resolve(cup);
    var champId = champion(res);
    if (champId != null) return 'Campeón: ' + teamName(champId);
    if (res.gd && !res.gd.complete) return 'Fase de grupos · ' + res.gd.played + '/' + res.gd.total;
    for (var r = 0; r < res.length; r++) {
      if (res[r].some(function (x) { return !x.done && !x.bye; })) return 'Eliminatorias · ' + roundName(res[r].length);
    }
    return 'Por comenzar';
  }

  /* =====================================================================
     HTML compartido
     ===================================================================== */
  function tieHTML(t) {
    var rows = ['a', 'b'].map(function (s) {
      var id = t[s], tm = team(id), no = t[s === 'a' ? 'noA' : 'noB'], lab = t[s === 'a' ? 'la' : 'lb'];
      var label = id != null ? (tm ? tm.name : 'Equipo') : (no ? 'BYE' : (lab || 'Por definir'));
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
    else if (t.waitingGroups) foot = 'Tras la fase de grupos';
    else if (t.a != null && t.b != null) foot = 'Por programar';
    return '<div class="cup-tie' + (t.done ? ' done' : '') + (t.bye ? ' bye' : '') + '">' + rows + (foot ? '<div class="cup-foot">' + foot + '</div>' : '') + '</div>';
  }
  function bracketHTML(res, mode) {
    var R = res.length, n0 = res[0].length, html = '';
    if (mode === 'list') {
      html += '<div class="cup-list">';
      res.forEach(function (round) { html += '<h4 class="cup-round-title">' + roundName(round.length) + '</h4><div class="cup-list-grid">' + round.map(tieHTML).join('') + '</div>'; });
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
  function groupTableHTML(cup, gd, t) {
    var q = cup.q || 1, gi = cup.groups.indexOf(t.g);
    var body = t.list.map(function (r, i) {
      var tm = team(r.id), dg = r.dg > 0 ? '+' + r.dg : r.dg;
      return '<tr class="' + (i < q ? 'q' : '') + '"><td class="pos">' + (i + 1) + '</td><td class="tm"><div class="tmc">' + badge(tm) + '<span>' + esc(tm ? tm.name : 'Equipo') + '</span></div></td><td>' + r.pj + '</td><td>' + r.w + '</td><td>' + r.d + '</td><td>' + r.l + '</td><td>' + dg + '</td><td class="pts">' + r.pts + '</td></tr>';
    }).join('');
    var pj = t.list.reduce(function (s, r) { return s + r.pj; }, 0) / 2, tot = gd.outs.filter(function (o) { return o.fx.g === gi; }).length;
    return '<div class="cup-gcard"><div class="cup-ghead"><b>' + esc(t.g.name) + '</b><span>' + Math.round(pj) + '/' + tot + ' partidos</span></div>' +
      '<table class="cup-gt"><thead><tr><th></th><th class="tm">Equipo</th><th>PJ</th><th>G</th><th>E</th><th>P</th><th>DG</th><th>Pts</th></tr></thead><tbody>' + body + '</tbody></table></div>';
  }
  function matchRowHTML(a, b, sa, sb, done, extra, tag) {
    var ta = team(a), tb = team(b);
    return '<div class="cup-mr' + (done ? ' done' : '') + '"><span class="cup-mr-t r">' + esc(a != null ? (ta ? ta.name : 'Equipo') : 'Por definir') + badge(ta) + '</span><span class="cup-mr-s">' + (done ? esc(sa) + ' - ' + esc(sb) : 'vs') + '</span><span class="cup-mr-t">' + badge(tb) + esc(b != null ? (tb ? tb.name : 'Equipo') : 'Por definir') + '</span><span class="cup-mr-d">' + (tag ? '<i>' + esc(tag) + '</i>' : '') + extra + '</span></div>';
  }
  function dateText(m) { return m ? ((m.date ? fmtDate(m.date) : '') + (m.time ? ' ' + m.time + ' COL' : '')) : ''; }

  /* =====================================================================
     ESTILOS
     ===================================================================== */
  var CSS = '' +
    '.cup-public{margin-top:34px}.cup-public h2.cup-h{font:700 26px Oswald,sans-serif;margin:0 0 4px}.cup-sub{color:var(--text-low);font-size:13px;margin-bottom:16px}' +
    '.cup-chips{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 14px}.cup-chip{padding:8px 14px;border-radius:999px;border:1px solid var(--border);background:var(--panel);color:var(--text-mid);font:600 12px Inter,sans-serif;cursor:pointer;text-align:left}' +
    '.cup-chip.active{border-color:var(--green);background:rgba(52,232,143,.12);color:var(--green)}.cup-chip small{display:block;font:500 10px Inter,sans-serif;color:var(--text-low);margin-top:2px}' +
    /* hero */
    '.cup-hero{position:relative;overflow:hidden;display:flex;gap:18px;align-items:center;justify-content:space-between;flex-wrap:wrap;padding:20px 22px;border:1px solid var(--border);border-radius:18px;background:radial-gradient(ellipse 520px 200px at 0 0,rgba(52,232,143,.16),transparent 70%),var(--panel);margin-bottom:14px}' +
    '.cup-hero-main{display:flex;align-items:center;gap:14px;min-width:0}.cup-hero-ic{display:grid;place-items:center;width:52px;height:52px;flex:0 0 52px;border-radius:14px;background:rgba(52,232,143,.12);border:1px solid rgba(52,232,143,.3);font-size:26px}' +
    '.cup-hero h3{font:700 24px/1.1 Oswald,sans-serif;margin:0;overflow-wrap:anywhere}.cup-hero-meta{margin-top:5px;font-size:12px;color:var(--text-low)}' +
    '.cup-hero-side{display:flex;flex-direction:column;gap:7px;min-width:210px;flex:0 1 280px}.cup-pill{align-self:flex-start;padding:5px 12px;border-radius:999px;background:rgba(52,232,143,.14);border:1px solid rgba(52,232,143,.35);color:var(--green);font:700 11px Oswald,sans-serif;letter-spacing:.08em;text-transform:uppercase}' +
    '.cup-pill.gold{background:rgba(255,212,70,.14);border-color:#806d1d;color:#ffd446}' +
    '.cup-prog{height:7px;border-radius:5px;background:var(--panel-2);overflow:hidden}.cup-prog i{display:block;height:100%;border-radius:5px;background:linear-gradient(90deg,var(--green-dim),var(--green))}.cup-hero-side small{color:var(--text-low);font-size:11px}' +
    '.cup-champ{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:0 0 14px;padding:12px 16px;border:1px solid #806d1d;border-radius:14px;background:linear-gradient(90deg,rgba(255,212,70,.18),transparent)}' +
    '.cup-trophy{font-size:26px}.cup-champ-label{font:700 11px Oswald,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#ffd446}.cup-champ b{font:700 20px Oswald,sans-serif}.cup-champ .cup-crest{width:32px;height:32px;flex-basis:32px}' +
    /* pestañas */
    '.cup-tabs{display:flex;gap:4px;margin:0 0 16px;padding:4px;border:1px solid var(--border);border-radius:14px;background:var(--panel);overflow-x:auto;scrollbar-width:none}.cup-tabs::-webkit-scrollbar{display:none}' +
    '.cup-tab{flex:1 0 auto;padding:10px 16px;border:0;border-radius:10px;background:transparent;color:var(--text-mid);font:600 13px Inter,sans-serif;cursor:pointer;white-space:nowrap}.cup-tab:hover{color:var(--text-hi)}.cup-tab.active{background:var(--green);color:#05130c}' +
    '.cup-tab em{font-style:normal;opacity:.7;font-weight:500;margin-left:4px;font-size:11px}' +
    '.cup-card{border:1px solid var(--border);border-radius:16px;background:var(--panel);padding:18px}' +
    '.cup-toolbar{display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap;margin:0 0 12px}' +
    '.cup-modes{display:inline-flex;border:1px solid var(--border);border-radius:10px;overflow:hidden}.cup-modes button{padding:8px 14px;border:0;background:var(--panel);color:var(--text-mid);font:600 12px Inter,sans-serif;cursor:pointer}.cup-modes button.active{background:var(--green);color:#05130c}' +
    /* grupos */
    '.cup-groups{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:14px}' +
    '.cup-gcard{border:1px solid var(--border);border-radius:14px;background:var(--panel);overflow:hidden;min-width:0}' +
    '.cup-ghead{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:12px 14px;background:var(--panel-2);border-bottom:1px solid var(--border)}.cup-ghead b{font:700 15px Oswald,sans-serif;letter-spacing:.04em;text-transform:uppercase}.cup-ghead span{font-size:11px;color:var(--text-low)}' +
    '.cup-gt{width:100%;border-collapse:collapse;table-layout:fixed;font-size:12.5px}.cup-gt th{padding:8px 0;font:600 9.5px Inter,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:var(--text-low);text-align:center}' +
    '.cup-gt td{padding:9px 0;text-align:center;border-top:1px solid var(--border);color:var(--text-mid)}.cup-gt th.tm,.cup-gt td.tm{text-align:left;width:auto;padding-left:4px}' +
    '.cup-gt th:nth-child(1),.cup-gt td:nth-child(1){width:34px}.cup-gt th:nth-child(n+3),.cup-gt td:nth-child(n+3){width:27px}.cup-gt th:last-child,.cup-gt td:last-child{width:36px}.cup-gt th:nth-child(7),.cup-gt td:nth-child(7){width:32px}' +
    '.cup-gt td.pos{font:700 14px Oswald,sans-serif;color:var(--text-low)}.cup-gt tr.q td.pos{color:var(--green)}.cup-gt tr.q{background:rgba(52,232,143,.06)}.cup-gt tr.q td:first-child{box-shadow:inset 3px 0 0 var(--green)}' +
    '.cup-gt .tmc{display:flex;align-items:center;gap:7px;min-width:0}.cup-gt .tmc span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font:600 12.5px Inter,sans-serif;color:var(--text-hi)}' +
    '.cup-gt td.pts{font:700 15px Oswald,sans-serif;color:var(--green)}' +
    '.cup-legend{display:flex;gap:14px;flex-wrap:wrap;margin-top:12px;font-size:11px;color:var(--text-low)}.cup-legend i{display:inline-block;width:10px;height:10px;border-radius:3px;background:var(--green);margin-right:6px;vertical-align:-1px}' +
    /* partidos */
    '.cup-mhead{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:18px 0 8px}.cup-mhead:first-child{margin-top:0}.cup-mhead h4{margin:0;font:700 13px Oswald,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:var(--green)}' +
    '.cup-mr{display:grid;grid-template-columns:minmax(0,1fr) 62px minmax(0,1fr) 128px;align-items:center;gap:8px;padding:10px 12px;border:1px solid var(--border);border-radius:12px;background:var(--panel-2);margin-bottom:6px}' +
    '.cup-mr-t{display:flex;align-items:center;gap:8px;min-width:0;font:600 13px Inter,sans-serif;overflow:hidden;white-space:nowrap}.cup-mr-t.r{justify-content:flex-end;text-align:right}' +
    '.cup-mr-s{justify-self:center;min-width:54px;padding:5px 8px;border-radius:8px;background:var(--panel);border:1px solid var(--border);text-align:center;font:700 14px Oswald,sans-serif;color:var(--text-low)}.cup-mr.done .cup-mr-s{color:var(--green);border-color:rgba(52,232,143,.4)}' +
    '.cup-mr-d{text-align:right;font-size:11px;color:var(--text-low);line-height:1.4}.cup-mr-d i{display:inline-block;margin-right:6px;padding:2px 7px;border-radius:6px;background:var(--panel);border:1px solid var(--border);font-style:normal;font-weight:700;color:var(--text-mid)}' +
    '.cup-filter{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 14px}.cup-filter button{padding:6px 12px;border-radius:999px;border:1px solid var(--border);background:var(--panel);color:var(--text-mid);font:600 11px Inter,sans-serif;cursor:pointer}.cup-filter button.active{border-color:var(--green);color:var(--green);background:rgba(52,232,143,.1)}' +
    /* bracket */
    '.cup-scroll{overflow-x:auto;padding:6px 2px 14px;-webkit-overflow-scrolling:touch}' +
    '.cup-bracket{display:grid;grid-template-columns:repeat(var(--cols),minmax(220px,1fr));grid-template-rows:auto repeat(var(--rows),minmax(86px,auto));column-gap:28px;min-width:calc(var(--cols) * 248px)}' +
    '.cup-head{padding:0 2px 10px;font:700 11px Oswald,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:var(--text-low);text-align:center}' +
    '.cup-cell{position:relative;display:flex;align-items:center;padding:6px 0}.cup-cell>.cup-tie{width:100%}' +
    '.cup-cell::after,.cup-cell::before{content:"";position:absolute;width:14px;border:0 solid var(--border)}.cup-cell.last::after,.cup-cell.first::before{display:none}' +
    '.cup-cell::before{left:-14px;top:50%;border-top-width:2px}.cup-cell.even::after{right:-14px;top:50%;bottom:0;border-top-width:2px;border-right-width:2px}.cup-cell.odd::after{right:-14px;top:0;bottom:50%;border-bottom-width:2px;border-right-width:2px}' +
    '.cup-tie{border:1px solid var(--border);border-radius:10px;background:var(--panel-2);overflow:hidden;min-width:0}.cup-tie.done{border-color:rgba(52,232,143,.35)}' +
    '.cup-team{display:flex;align-items:center;gap:8px;padding:8px 10px;min-width:0}.cup-team+.cup-team{border-top:1px solid var(--border)}' +
    '.cup-team.win{background:rgba(52,232,143,.10)}.cup-team.win .cup-tname,.cup-team.win .cup-score{color:var(--green);font-weight:700}.cup-team.lose{opacity:.55}.cup-team.tbd .cup-tname{color:var(--text-low);font-style:italic}' +
    '.cup-crest{width:22px;height:22px;flex:0 0 22px;border-radius:50%;object-fit:contain;background:var(--panel);border:1px solid var(--border)}.cup-crest-ini{display:inline-flex;align-items:center;justify-content:center;font:700 9px Oswald,sans-serif;color:var(--text-mid)}.cup-crest-empty{border-style:dashed}' +
    '.cup-tname{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font:600 13px Inter,sans-serif;color:var(--text-hi)}' +
    '.cup-score{font:700 15px Oswald,sans-serif;color:var(--text-hi);min-width:18px;text-align:right}.cup-pen{font-size:10px;color:var(--text-mid);margin-left:2px}' +
    '.cup-foot{padding:5px 10px;border-top:1px solid var(--border);font:500 10.5px Inter,sans-serif;color:var(--text-low);background:rgba(0,0,0,.12)}' +
    '.cup-round-title{margin:18px 0 10px;font:700 13px Oswald,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:var(--green)}.cup-round-title:first-child{margin-top:4px}' +
    '.cup-list-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:10px}' +
    '.cup-empty{padding:26px 18px;border:1px dashed var(--border);border-radius:14px;color:var(--text-low);text-align:center;font-size:13px}.cup-link{display:inline-block;margin-top:12px;color:var(--green);font:600 12px Inter,sans-serif}' +
    '.cup-banner{margin:0 0 12px;padding:11px 14px;border:1px solid rgba(255,157,77,.35);border-radius:12px;background:rgba(255,157,77,.07);color:var(--text-mid);font-size:12.5px;line-height:1.5}' +
    /* admin */
    '.cup-adm{display:flex;flex-direction:column;gap:16px}.cup-adm-top{display:flex;gap:10px;flex-wrap:wrap;align-items:center}.cup-adm-top select{flex:1 1 220px}' +
    '.cup-form{padding:18px;border:1px solid var(--border);border-radius:16px;background:var(--panel-2)}.cup-form>h4{font:700 18px Oswald,sans-serif;margin:0 0 4px}' +
    '.cup-step{display:flex;align-items:center;gap:10px;margin:20px 0 10px;font:700 13px Oswald,sans-serif;letter-spacing:.08em;text-transform:uppercase}.cup-step b{display:grid;place-items:center;width:24px;height:24px;border-radius:50%;background:var(--green);color:#05130c;font:700 12px Oswald,sans-serif}' +
    '.cup-row{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin:10px 0}.cup-row>.input{flex:1 1 240px;margin:0}.cup-row .cup-lab{min-width:150px;font:600 12px Inter,sans-serif;color:var(--text-mid)}' +
    '.cup-formats{display:grid;grid-template-columns:1fr 1fr;gap:10px}.cup-fmt{padding:14px;text-align:left;border:1px solid var(--border);border-radius:12px;background:var(--panel);color:var(--text-mid);cursor:pointer;font:500 12px/1.5 Inter,sans-serif}.cup-fmt b{display:block;margin-bottom:3px;font:700 14px Oswald,sans-serif;color:var(--text-hi)}.cup-fmt.on{border-color:var(--green);background:rgba(52,232,143,.1)}.cup-fmt.on b{color:var(--green)}' +
    '.cup-group{margin:12px 0}.cup-group-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px;font:700 11px Oswald,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:var(--text-low)}' +
    '.cup-group-head button{padding:4px 10px;border:1px solid var(--border);border-radius:999px;background:var(--panel);color:var(--text-mid);font:600 10px Inter,sans-serif;cursor:pointer}' +
    '.cup-picks{display:flex;gap:6px;flex-wrap:wrap}.cup-pick{display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border:1px solid var(--border);border-radius:999px;background:var(--panel);color:var(--text-mid);font:600 12px Inter,sans-serif;cursor:pointer}' +
    '.cup-dtabs{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px}.cup-dtab{display:flex;flex-direction:column;align-items:center;gap:2px;padding:12px 6px;border:1px solid var(--border);border-radius:12px;background:var(--panel);color:var(--text-mid);cursor:pointer}.cup-dtab b{font:700 20px Oswald,sans-serif;color:var(--text-hi)}.cup-dtab small{font:500 10.5px Inter,sans-serif;color:var(--text-low)}.cup-dtab.on{border-color:var(--green);background:rgba(52,232,143,.12)}.cup-dtab.on b{color:var(--green)}' +
    '.cup-tgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:8px}.cup-tcard{position:relative;display:flex;align-items:center;gap:10px;padding:10px 12px;min-width:0;border:1px solid var(--border);border-radius:12px;background:var(--panel);color:var(--text-hi);text-align:left;cursor:pointer}.cup-tcard:hover{border-color:var(--green-dim)}.cup-tcard .cup-crest{width:34px;height:34px;flex-basis:34px}.cup-tn{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font:600 13px Inter,sans-serif}' +
    '.cup-tcard.on{border-color:var(--green);background:rgba(52,232,143,.12)}.cup-tcard.on .cup-div{background:var(--green);color:#05130c;border-color:var(--green)}.cup-chk{position:absolute;top:-7px;right:-7px;display:grid;place-items:center;min-width:20px;height:20px;padding:0 5px;border-radius:10px;background:var(--green);color:#05130c;font:700 11px Oswald,sans-serif;font-style:normal}' +
    '.cup-divbar{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 12px}.cup-divbar button{padding:7px 16px;border-radius:999px;border:1px solid var(--border);background:var(--panel);color:var(--text-mid);font:700 12px Oswald,sans-serif;letter-spacing:.06em;cursor:pointer}.cup-divbar button.on{background:var(--green);border-color:var(--green);color:#05130c}' +
    '.cup-hero h3 .cup-div{vertical-align:middle;margin-left:6px;font-size:12px}.cup-chip .cup-div{margin-right:4px;font-size:9px}' +
    '.cup-pick{padding:6px 12px 6px 6px;gap:8px}.cup-pick .cup-crest{width:26px;height:26px;flex-basis:26px}.cup-pn{min-width:0;max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
    '.cup-div{display:inline-flex;align-items:center;justify-content:center;min-width:26px;padding:2px 6px;border-radius:6px;background:rgba(52,232,143,.14);border:1px solid rgba(52,232,143,.35);color:var(--green);font:700 10px Oswald,sans-serif;letter-spacing:.06em}' +
    '.cup-divlab{display:inline-flex;align-items:center;gap:8px}.cup-divlab .cup-div{font-size:12px;padding:3px 8px}.cup-divlab em{font-style:normal;font-weight:600;color:var(--text-low);letter-spacing:0;text-transform:none}' +
    '.cup-pick.on .cup-div{background:var(--green);color:#05130c;border-color:var(--green)}.cup-pick.on .cup-crest{border-color:var(--green)}' +
    '.cup-pick.on{border-color:var(--green);background:rgba(52,232,143,.13);color:var(--green)}.cup-pick i{font-style:normal;display:inline-flex;align-items:center;justify-content:center;min-width:18px;height:18px;border-radius:9px;background:var(--green);color:#05130c;font:700 10px Oswald,sans-serif}' +
    '.cup-seg{display:inline-flex;flex-wrap:wrap;border:1px solid var(--border);border-radius:10px;overflow:hidden}.cup-seg button{padding:8px 13px;border:0;background:var(--panel);color:var(--text-mid);font:600 12px Inter,sans-serif;cursor:pointer}.cup-seg button.on{background:var(--green);color:#05130c}' +
    '.cup-note{font-size:12px;color:var(--text-low);line-height:1.5}.cup-sum{margin:14px 0 0;padding:12px 14px;border-radius:12px;border:1px dashed rgba(52,232,143,.45);background:rgba(52,232,143,.06);font-size:12.5px;color:var(--text-mid);line-height:1.6}.cup-sum b{color:var(--green)}.cup-sum.bad{border-color:#ff6b6b;background:rgba(255,107,107,.07)}.cup-sum.bad b{color:#ff8a8a}' +
    '.cup-bar{display:flex;gap:10px;flex-wrap:wrap;align-items:center;justify-content:space-between;margin-top:14px}.cup-bar .cup-actions{display:flex;gap:8px;flex-wrap:wrap}.cup-danger{border-color:#ff6b6b!important;color:#ff8a8a!important}' +
    '.cup-adm-head{display:flex;justify-content:space-between;gap:8px;font:700 11px Oswald,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:var(--text-low)}' +
    '.cup-ties{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px}' +
    '.cup-adm-tie{padding:14px;border:1px solid var(--border);border-radius:12px;background:var(--panel-2);display:flex;flex-direction:column;gap:10px;min-width:0}.cup-adm-tie.done{border-color:rgba(52,232,143,.4)}' +
    '.cup-vs{display:flex;align-items:center;gap:8px;font:700 14px Oswald,sans-serif;min-width:0}.cup-vs span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.cup-vs em{font-style:normal;color:var(--text-low);font-size:11px}' +
    '.cup-mini{display:grid;grid-template-columns:1fr 1fr auto;gap:8px;align-items:end}.cup-mini label,.cup-adm-tie label,.cup-fxc label{display:flex;flex-direction:column;gap:4px;font:600 10px Inter,sans-serif;color:var(--text-low);text-transform:uppercase;letter-spacing:.06em}' +
    '.cup-mini .input,.cup-adm-tie .input,.cup-fxc .input{margin:0;min-width:0;width:100%}.cup-adm-tie .btn{width:auto}.cup-state{font-size:12px;color:var(--text-mid);line-height:1.5}.cup-state b{color:var(--green)}.cup-two{display:grid;grid-template-columns:1fr 1fr;gap:8px}' +
    '.cup-jor{border:1px solid var(--border);border-radius:14px;background:var(--panel-2);overflow:hidden;margin-bottom:12px}.cup-jor-head{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:12px 14px;background:var(--panel);border-bottom:1px solid var(--border)}.cup-jor-head>b{font:700 15px Oswald,sans-serif;letter-spacing:.04em}' +
    '.cup-jor-ctl{display:flex;gap:8px;align-items:flex-end;flex-wrap:wrap}.cup-jor-ctl label{display:flex;flex-direction:column;gap:4px;font:600 10px Inter,sans-serif;color:var(--text-low);text-transform:uppercase}.cup-jor-ctl .input{margin:0;width:auto}' +
    '.cup-fx{padding:12px 14px;border-top:1px solid var(--border);display:flex;flex-direction:column;gap:10px}.cup-fx:first-of-type{border-top:0}.cup-fx-top{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.cup-fx-top .cup-vs{flex:1 1 220px}.cup-fx-g{padding:3px 8px;border-radius:6px;background:var(--panel);border:1px solid var(--border);font:700 10px Oswald,sans-serif;letter-spacing:.08em;color:var(--green);text-transform:uppercase}' +
    '.cup-fx-res{font:700 15px Oswald,sans-serif;color:var(--green)}.cup-fxc{display:flex;gap:8px;flex-wrap:wrap;align-items:flex-end}.cup-fxc .input{width:auto;min-width:0}.cup-fxc .sc{width:64px}.cup-fxc .btn{width:auto}' +
    '@media(max-width:700px){.cup-hero{padding:16px}.cup-hero h3{font-size:20px}.cup-hero-side{flex:1 1 100%}.cup-card{padding:12px}.cup-groups{grid-template-columns:1fr}' +
    '.cup-bracket{grid-template-columns:repeat(var(--cols),78vw);min-width:0}.cup-scroll{scroll-snap-type:x proximity}.cup-cell{scroll-snap-align:start}.cup-ties,.cup-list-grid{grid-template-columns:1fr}.cup-public h2.cup-h{font-size:22px}' +
    '.cup-mini{grid-template-columns:1fr 1fr}.cup-mini .btn{grid-column:1/-1;width:100%}.cup-formats{grid-template-columns:1fr}.cup-dtabs{grid-template-columns:repeat(5,minmax(0,1fr));gap:5px}.cup-dtab{padding:10px 2px}.cup-dtab b{font-size:16px}.cup-dtab small{display:none}.cup-tgrid{grid-template-columns:1fr 1fr}.cup-tcard{padding:9px 8px;gap:7px}.cup-tcard .cup-crest{width:28px;height:28px;flex-basis:28px}.cup-tcard .cup-div{display:none}.cup-tcard.on:after{content:none}.cup-tab{padding:10px 12px}' +
    '.cup-mr{grid-template-columns:minmax(0,1fr) 54px minmax(0,1fr);row-gap:4px}.cup-mr-d{grid-column:1/-1;text-align:center}.cup-mr-t{font-size:12px}.cup-mr-t .cup-crest{display:none}' +
    '.cup-fxc .input:not(.sc){flex:1 1 120px}.cup-jor-ctl{width:100%}.cup-jor-ctl .btn{flex:1 1 100%;width:100%}}';
  function addCss() {
    var s = document.getElementById('hfa-copa-css');
    if (!s) { s = document.createElement('style'); s.id = 'hfa-copa-css'; document.head.appendChild(s); }
    s.textContent = CSS;
  }

  /* =====================================================================
     VISTA PÚBLICA
     ===================================================================== */
  function tabsFor(cup, res) {
    var t = [];
    if (cup.format === 'grupos') t.push(['grupos', '📊 Grupos', cup.groups.length]);
    t.push(['elim', '🏆 Eliminatorias', '']);
    return t;
  }
  function heroHTML(cup, res) {
    var champId = champion(res), p = progress(cup, res), n = cup.teamIds.length;
    var meta = n + ' equipos · ' + (cup.format === 'grupos' ? cup.groups.length + ' grupos · clasifican ' + cup.q + ' por grupo' + (cup.dbl ? ' · ida y vuelta' : '') : 'eliminatoria directa');
    var html = '<div class="cup-hero"><div class="cup-hero-main"><span class="cup-hero-ic">🏆</span><div><h3>' + esc(cup.name) + ' ' + divTag(cup) + '</h3><div class="cup-hero-meta">' + esc(meta) + '</div></div></div>' +
      '<div class="cup-hero-side"><span class="cup-pill' + (champId != null ? ' gold' : '') + '">' + esc(cupStatus(cup, res)) + '</span><div class="cup-prog"><i style="width:' + p.pct + '%"></i></div><small>' + p.played + ' de ' + p.total + ' partidos jugados · ' + p.pct + '%</small></div></div>';
    if (champId != null) { var ct = team(champId); html += '<div class="cup-champ"><span class="cup-trophy">🏆</span><span class="cup-champ-label">Campeón</span>' + badge(ct) + '<b>' + esc(ct ? ct.name : 'Equipo') + '</b></div>'; }
    return html;
  }
  function groupsTabHTML(cup, res) {
    var gd = res.gd;
    return '<div class="cup-groups">' + gd.tables.map(function (t) { return groupTableHTML(cup, gd, t); }).join('') + '</div>' +
      '<div class="cup-legend"><span><i></i>Clasifican a eliminatorias (' + cup.q + ' por grupo)</span><span>PJ jugados · G ganados · E empatados · P perdidos · DG diferencia · Pts puntos</span></div>';
  }
  function matchesTabHTML(cup, res) {
    var html = '', gd = res.gd;
    if (gd) {
      var jors = {}; gd.outs.forEach(function (o) { (jors[o.fx.r] = jors[o.fx.r] || []).push(o); });
      var keys = Object.keys(jors).map(Number).sort(function (a, b) { return a - b; });
      html += '<div class="cup-filter"><button type="button" class="' + (pubGroup === 'all' ? 'active' : '') + '" data-cup-grp="all">Todos los grupos</button>' + cup.groups.map(function (g, i) { return '<button type="button" class="' + (pubGroup === String(i) ? 'active' : '') + '" data-cup-grp="' + i + '">' + esc(g.name) + '</button>'; }).join('') + '</div>';
      keys.forEach(function (r) {
        var list = jors[r].filter(function (o) { return pubGroup === 'all' || String(o.fx.g) === pubGroup; });
        if (!list.length) return;
        html += '<div class="cup-mhead"><h4>Fase de grupos · Jornada ' + r + '</h4></div>' + list.map(function (o) {
          return matchRowHTML(o.fx.a, o.fx.b, o.sa, o.sb, o.done, esc(dateText(o.match)), cup.groups[o.fx.g].name.replace('Grupo ', 'G'));
        }).join('');
      });
    }
    res.forEach(function (round) {
      var list = round.filter(function (t) { return !t.bye; });
      if (!list.length) return;
      html += '<div class="cup-mhead"><h4>' + roundName(round.length) + '</h4></div>' + list.map(function (t) {
        var sc = t.pens && t.pa != null ? ' (' + t.pa + '-' + t.pb + ' pen.)' : '';
        var row = matchRowHTML(t.a, t.b, t.sa, t.sb, t.sa != null, esc(dateText(t.match)) + esc(sc), '');
        if (t.a == null || t.b == null) {
          row = row.replace('Por definir', esc(t.la || 'Por definir')).replace('Por definir', esc(t.lb || 'Por definir'));
        }
        return row;
      }).join('');
    });
    return html || '<div class="cup-empty">Todavía no hay partidos.</div>';
  }
  function renderPublic(host) {
    if (!host.isConnected) return;
    if (!pubMode) pubMode = window.innerWidth <= 700 ? 'list' : 'bracket';
    var only = pubOnly ? (cups.find(function (c) { return same(c.id, pubOnly); }) || null) : null;
    var html = pubOnly ? '' : '<h2 class="cup-h">Copas</h2><div class="cup-sub">Fase de grupos y eliminatorias. Se actualizan solas con los resultados de las actas.</div>';
    if (pubOnly && !only) { host.innerHTML = '<div class="cup-empty">Esta copa todavía no está disponible.</div>'; return; }
    if (!cups.length) { host.innerHTML = html + '<div class="cup-empty">Todavía no hay copas creadas.</div>'; return; }
    var present = ['1', '2', '3', '4', ''].filter(function (d) { return cups.some(function (c) { return cupDiv(c) === d; }); });
    if (pubDiv !== 'all' && present.indexOf(pubDiv) === -1) pubDiv = 'all';
    var list = only ? [only] : cups.filter(function (c) { return pubDiv === 'all' || cupDiv(c) === pubDiv; });
    var cup = only || list.find(function (c) { return same(c.id, selectedId); }) || list[list.length - 1], res = resolve(cup);
    if (!only && present.length > 1) html += '<div class="cup-divbar"><button type="button" class="' + (pubDiv === 'all' ? 'on' : '') + '" data-cup-div="all">Todas</button>' + present.map(function (d) { return '<button type="button" class="' + (pubDiv === d ? 'on' : '') + '" data-cup-div="' + d + '">' + (d ? d + 'D' : 'Mixta') + '</button>'; }).join('') + '</div>';
    if (list.length > 1) html += '<div class="cup-chips">' + list.map(function (c) { return '<button type="button" class="cup-chip' + (same(c.id, cup.id) ? ' active' : '') + '" data-cup-pick="' + esc(c.id) + '">' + divTag(c) + ' ' + esc(c.name) + '<small>' + esc(cupStatus(c)) + '</small></button>'; }).join('') + '</div>';
    html += heroHTML(cup, res);
    var tabs = tabsFor(cup, res);
    if (pubTabFor !== cup.id || !tabs.some(function (t) { return t[0] === pubTab; })) {
      pubTabFor = cup.id; pubTab = (res.gd && !res.gd.complete) ? 'grupos' : 'elim';
    }
    html += '<div class="cup-tabs">' + tabs.map(function (t) { return '<button type="button" class="cup-tab' + (pubTab === t[0] ? ' active' : '') + '" data-cup-tab="' + t[0] + '">' + t[1] + (t[2] ? '<em>' + t[2] + '</em>' : '') + '</button>'; }).join('') + '</div>';
    if (pubTab === 'grupos') html += groupsTabHTML(cup, res);
    else if (pubTab === 'elim') {
      html += (res.gd && !res.gd.complete ? '<div class="cup-banner">Los cruces se rellenan automáticamente cuando termine la fase de grupos: <b>1º Grupo A</b>, <b>2º Grupo B</b>…</div>' : '') +
        '<div class="cup-toolbar"><span class="cup-note">Eliminatoria directa</span><div class="cup-modes"><button type="button" class="' + (pubMode === 'bracket' ? 'active' : '') + '" data-cup-mode="bracket">🏆 Bracket</button><button type="button" class="' + (pubMode === 'list' ? 'active' : '') + '" data-cup-mode="list">☰ Lista</button></div></div>' +
        '<div class="cup-card">' + bracketHTML(res, pubMode) + '</div>';
    }
    host.innerHTML = html;
  }
  function mountPublic(el, opts) {
    addCss();
    pubOnly = opts && opts.cupId != null ? String(opts.cupId) : null;
    var old = el.querySelector('#cupPublic'); if (old) old.remove();
    var host = document.createElement('section'); host.id = 'cupPublic'; host.className = 'cup-public';
    host.innerHTML = '<h2 class="cup-h">Copas</h2><div class="cup-sub">Cargando…</div>';
    el.appendChild(host); pubHost = host;
    host.addEventListener('click', function (e) {
      var p = e.target.closest('[data-cup-pick]'), m = e.target.closest('[data-cup-mode]'), t = e.target.closest('[data-cup-tab]'), g = e.target.closest('[data-cup-grp]'), dv = e.target.closest('[data-cup-div]');
      if (dv) { pubDiv = dv.getAttribute('data-cup-div'); pubGroup = 'all'; renderPublic(host); }
      else if (p) { selectedId = p.getAttribute('data-cup-pick'); pubGroup = 'all'; renderPublic(host); }
      else if (m) { pubMode = m.getAttribute('data-cup-mode'); renderPublic(host); }
      else if (t) { pubTab = t.getAttribute('data-cup-tab'); renderPublic(host); }
      else if (g) { pubGroup = g.getAttribute('data-cup-grp'); renderPublic(host); }
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
  function draftInfo() {
    var n = draft.ids.length, msg = '', ok = true, html = '';
    if (n < 2) { ok = false; msg = 'Elige al menos 2 equipos.'; }
    if (n > 32) { ok = false; msg = 'El máximo son 32 equipos.'; }
    if (draft.format === 'grupos') {
      var G = draft.groups, base = Math.floor(n / G), extra = n % G, qual = G * draft.q;
      if (ok && base < draft.q + 1) { ok = false; msg = 'Con ' + G + ' grupos y ' + draft.q + ' clasificado(s) por grupo necesitas al menos ' + (G * (draft.q + 1)) + ' equipos.'; }
      if (ok) {
        var size = pow2(qual);
        html = '<b>' + n + '</b> equipos → <b>' + G + ' grupos</b> de ' + (extra ? base + ' y ' + (base + 1) : base) + ' equipos · ' + (draft.dbl ? 'ida y vuelta' : 'solo ida') + '.<br>Clasifican <b>' + qual + '</b> a eliminatorias → bracket de <b>' + size + '</b>' + (size > qual ? ' (' + (size - qual) + ' BYE)' : '') + '.';
      }
    } else if (ok) {
      var s2 = pow2(n);
      html = '<b>' + n + '</b> equipos → bracket de <b>' + s2 + '</b>' + (s2 > n ? ' (' + (s2 - n) + ' BYE)' : '') + '.';
    }
    return { ok: ok, msg: msg, html: ok ? html : msg };
  }
  function shownTeams() {
    return teams().filter(function (t) { return draft.div === 'all' || divCode(t) === draft.div; });
  }
  function formHTML() {
    var all = teams(), shown = shownTeams();
    var divs = ['1', '2', '3', '4'];
    var tabs = divs.map(function (d) {
      var n = all.filter(function (t) { return divCode(t) === d; }).length;
      return '<button type="button" class="cup-dtab' + (draft.div === d ? ' on' : '') + '" data-cup-act="div" data-v="' + d + '"><b>' + d + 'D</b><small>' + n + ' equipos</small></button>';
    }).join('') + '<button type="button" class="cup-dtab' + (draft.div === 'all' ? ' on' : '') + '" data-cup-act="div" data-v="all"><b>Mixta</b><small>' + all.length + ' equipos</small></button>';
    var cards = shown.map(function (t) {
      var i = draft.ids.findIndex(function (x) { return same(x, t.id); });
      return '<button type="button" class="cup-tcard' + (i > -1 ? ' on' : '') + '" data-cup-act="toggle" data-id="' + esc(t.id) + '">' + badge(t) + '<span class="cup-tn">' + esc(t.name) + (t.cupOnly ? ' 🏆' : '') + '</span><small class="cup-div">' + (divCode(t) ? divCode(t) + 'D' : '—') + '</small>' + (i > -1 ? '<i class="cup-chk">' + (draft.order === 'order' ? (i + 1) : '✓') + '</i>' : '') + '</button>';
    }).join('');
    var sel = shown.filter(function (t) { return draft.ids.some(function (x) { return same(x, t.id); }); }).length;
    var seg = function (act, cur, opts) { return '<span class="cup-seg">' + opts.map(function (o) { return '<button type="button" class="' + (String(cur) === String(o[0]) ? 'on' : '') + '" data-cup-act="' + act + '" data-v="' + o[0] + '">' + o[1] + '</button>'; }).join('') + '</span>'; };
    var info = draftInfo(), g = draft.format === 'grupos';
    var gopts = []; for (var i = 2; i <= 8; i++) gopts.push([i, i]);
    var dlabel = draft.div === 'all' ? 'Mixta' : draft.div + 'D';
    return '<div class="cup-form"><h4>Nueva copa</h4><div class="cup-note">Crea la copa de una división en tres pasos. El bracket se rellena solo con los clasificados de cada grupo.</div>' +
      '<div class="cup-step"><b>1</b>División</div><div class="cup-dtabs">' + tabs + '</div>' +
      '<div class="cup-step"><b>2</b>Nombre y formato</div><div class="cup-row"><input class="input" id="cupNewName" placeholder="Nombre de la copa (ej. Copa HFA ' + esc(dlabel) + ')" maxlength="60" value="' + esc(draft.name) + '"></div>' +
      '<div class="cup-formats"><button type="button" class="cup-fmt' + (g ? ' on' : '') + '" data-cup-act="format" data-v="grupos"><b>🏟️ Fase de grupos + eliminatorias</b>Los equipos juegan en grupos y los mejores pasan al bracket.</button><button type="button" class="cup-fmt' + (!g ? ' on' : '') + '" data-cup-act="format" data-v="directo"><b>⚔️ Solo eliminatorias</b>Bracket de eliminación directa desde el primer partido.</button></div>' +
      '<div class="cup-step"><b>3</b>Equipos de ' + esc(dlabel) + '</div>' +
      '<div class="cup-bar" style="margin:0 0 10px"><span class="cup-note"><b>' + sel + '</b> de ' + shown.length + ' elegidos</span><span class="cup-actions"><button type="button" class="btn" data-cup-act="sel-all">Elegir todos</button><button type="button" class="btn" data-cup-act="sel-none">Quitar todos</button></span></div>' +
      '<div class="cup-row" style="flex-wrap:wrap;gap:8px;margin:0 0 8px"><input class="input" id="cupNewTeamName" placeholder="➕ Nuevo equipo solo de copa" maxlength="40" style="flex:1 1 190px"><input class="input" id="cupNewTeamCrest" placeholder="Escudo (URL, opcional)" style="flex:1 1 170px"><button type="button" class="btn" data-cup-act="new-team">Crear equipo de copa</button></div><div class="cup-note" style="margin:0 0 10px">Los equipos de copa solo existen en copas: no aparecen en la liga, en las divisiones ni en la lista de Equipos.</div>' +
      (cards ? '<div class="cup-tgrid">' + cards + '</div>' : '<div class="cup-empty">No hay equipos en ' + esc(dlabel) + '. Crea o asigna equipos a esta división en “Equipos y jugadores”.</div>') +
      '<div class="cup-step"><b>4</b>Configuración</div>' +
      (g ? '<div class="cup-row"><span class="cup-lab">Número de grupos</span>' + seg('groups', draft.groups, gopts) + '</div>' +
        '<div class="cup-row"><span class="cup-lab">Clasifican por grupo</span>' + seg('q', draft.q, [[1, '1 (solo el primero)'], [2, '2 (primero y segundo)']]) + '</div>' +
        '<div class="cup-row"><span class="cup-lab">Partidos del grupo</span>' + seg('dbl', draft.dbl ? 1 : 0, [[0, 'Solo ida'], [1, 'Ida y vuelta']]) + '</div>' : '') +
      '<div class="cup-row"><span class="cup-lab">Sorteo</span>' + seg('order', draft.order, [['random', '🎲 Aleatorio'], ['order', g ? '① Cabezas de serie (orden elegido)' : '① Orden en que los elegí']]) + '</div>' +
      '<div class="cup-sum' + (info.ok ? '' : ' bad') + '">' + info.html + '</div>' +
      '<div class="cup-bar"><span></span><div class="cup-actions">' + (cups.length ? '<button type="button" class="btn" data-cup-act="cancel-new">Cancelar</button>' : '') + '<button type="button" class="btn btn-primary" data-cup-act="create"' + (info.ok ? '' : ' disabled') + '>Crear copa de ' + esc(dlabel) + '</button></div></div></div>';
  }
  function adminTieHTML(t, cup) {
    var r = t.r, k = t.k, tie = cup.rounds[r][k], ta = team(t.a), tb = team(t.b);
    var nm = function (tm, no, lab) { return tm ? tm.name : (no ? 'BYE' : (lab || 'Por definir')); };
    var head = '<div class="cup-adm-head"><span>' + roundName(cup.rounds[r].length) + ' · Partido ' + (k + 1) + '</span><span>' + (t.done ? '✔ Resuelto' : (t.a != null && t.b != null ? 'Pendiente' : 'En espera')) + '</span></div>';
    var vs = '<div class="cup-vs"><span>' + esc(nm(ta, t.noA, t.la)) + '</span><em>vs</em><span>' + esc(nm(tb, t.noB, t.lb)) + '</span></div>';
    var body = '';
    if (r === 0 && cup.format !== 'grupos') {
      var dis = tie.matchId ? ' disabled' : '';
      var opts = function (sel) { return '<option value="">— BYE / vacío —</option>' + cup.teamIds.map(function (id) { return '<option value="' + esc(id) + '"' + (same(id, sel) ? ' selected' : '') + '>' + esc(teamName(id)) + '</option>'; }).join(''); };
      body += '<div class="cup-two"><label>Equipo A<select class="input" data-cup-team="a"' + dis + '>' + opts(tie.a) + '</select></label><label>Equipo B<select class="input" data-cup-team="b"' + dis + '>' + opts(tie.b) + '</select></label></div>';
    }
    if (t.bye) {
      body += '<div class="cup-state">Pasa directo a la siguiente ronda.</div>';
    } else if (t.a != null && t.b != null) {
      if (t.match) {
        var m = t.match;
        body += '<div class="cup-state"><b>Partido creado</b> · ' + esc(m.date ? fmtDate(m.date) : 'sin fecha') + (m.time ? ' ' + esc(m.time) + ' COL' : '') + ' · ' + (m.finished ? 'finalizado <b>' + esc(t.sa) + ' - ' + esc(t.sb) + '</b>' : 'aún sin finalizar') + '.<br>Se cierra desde “Editar y finalizar actas”; la copa se actualiza sola.</div>' + (m.finished ? '' : '<div class="cup-mini"><label>Fecha<input class="input" type="date" data-f="date" value="' + esc(m.date || '') + '"></label><label>Hora (COL)<input class="input" type="time" data-f="time" value="' + esc(m.time || '') + '"></label><button type="button" class="btn btn-primary" data-cup-act="tie-date">Guardar fecha</button></div>') + '<div><button type="button" class="btn" data-cup-act="unlink">Desvincular partido</button></div>';
      } else {
        body += '<div class="cup-mini"><label>Fecha<input class="input" type="date" data-f="date" value="' + esc(tie.date || '') + '"></label><label>Hora (COL)<input class="input" type="time" data-f="time" value="' + esc(tie.time || '') + '"></label><button type="button" class="btn btn-primary" data-cup-act="mk-match">Crear partido</button></div>' +
          '<div class="cup-mini"><label>Goles ' + esc(ta ? ta.name : 'A') + '<input class="input" type="number" min="0" data-f="sa" value="' + esc(tie.sa == null ? '' : tie.sa) + '"></label><label>Goles ' + esc(tb ? tb.name : 'B') + '<input class="input" type="number" min="0" data-f="sb" value="' + esc(tie.sb == null ? '' : tie.sb) + '"></label><button type="button" class="btn" data-cup-act="save-manual">Guardar resultado</button></div><div class="cup-note">Crea el partido para jugarlo con acta, o escribe el resultado a mano.</div>';
      }
      if (t.pens) {
        body += '<div class="cup-mini"><label>Penales ' + esc(ta ? ta.name : 'A') + '<input class="input" type="number" min="0" data-f="pa" value="' + esc(tie.pa == null ? '' : tie.pa) + '"></label><label>Penales ' + esc(tb ? tb.name : 'B') + '<input class="input" type="number" min="0" data-f="pb" value="' + esc(tie.pb == null ? '' : tie.pb) + '"></label><button type="button" class="btn btn-primary" data-cup-act="save-pens">Guardar penales</button></div><div class="cup-state"><b>Empate</b>: define quién avanza con los penales.</div>';
      }
    } else {
      body += '<div class="cup-state">' + (t.waitingGroups ? 'Esperando a que termine la fase de grupos.' : 'Esperando a los ganadores de la ronda anterior.') + '</div>';
    }
    return '<div class="cup-adm-tie' + (t.done ? ' done' : '') + '" data-r="' + r + '" data-k="' + k + '">' + head + vs + body + '</div>';
  }
  function adminFxHTML(o, cup) {
    var fx = o.fx, ta = team(fx.a), tb = team(fx.b), gname = cup.groups[fx.g].name.replace('Grupo ', 'G');
    var top = '<div class="cup-fx-top"><span class="cup-fx-g">' + esc(gname) + '</span><div class="cup-vs"><span>' + esc(ta ? ta.name : 'Equipo') + '</span><em>vs</em><span>' + esc(tb ? tb.name : 'Equipo') + '</span></div>' + (o.done ? '<span class="cup-fx-res">' + esc(o.sa) + ' - ' + esc(o.sb) + '</span>' : '') + '</div>';
    var body;
    if (o.match) {
      var m = o.match;
      body = '<div class="cup-state"><b>Partido creado</b> · ' + esc(m.date ? fmtDate(m.date) : 'sin fecha') + (m.time ? ' ' + esc(m.time) + ' COL' : '') + ' · ' + (m.finished ? 'finalizado' : 'aún sin finalizar (se cierra desde “Editar y finalizar actas”)') + '</div>' + (m.finished ? '' : '<div class="cup-fxc"><label>Fecha<input class="input" type="date" data-f="date" value="' + esc(m.date || '') + '"></label><label>Hora (COL)<input class="input" type="time" data-f="time" value="' + esc(m.time || '') + '"></label><button type="button" class="btn btn-primary" data-cup-act="fx-date">Guardar fecha</button></div>') + '<div><button type="button" class="btn" data-cup-act="fx-unlink">Desvincular partido</button></div>';
    } else {
      body = '<div class="cup-fxc"><label>Fecha<input class="input" type="date" data-f="date" value="' + esc(fx.date || '') + '"></label><label>Hora (COL)<input class="input" type="time" data-f="time" value="' + esc(fx.time || '') + '"></label><button type="button" class="btn btn-primary" data-cup-act="fx-mk">Crear partido</button></div>' +
        '<div class="cup-fxc"><label>Goles<input class="input sc" type="number" min="0" data-f="sa" value="' + esc(fx.sa == null ? '' : fx.sa) + '"></label><label>Goles<input class="input sc" type="number" min="0" data-f="sb" value="' + esc(fx.sb == null ? '' : fx.sb) + '"></label><button type="button" class="btn" data-cup-act="fx-save">Guardar resultado</button></div>';
    }
    return '<div class="cup-fx" data-fx="' + esc(fx.id) + '">' + top + body + '</div>';
  }
  function renderAdmin() {
    var el = adminHost; if (!el || !el.isConnected) return;
    var cup = current(), html = '<div class="cup-adm">';
    html += '<div class="cup-adm-top">' + (cups.length ? '<select class="input" data-cup-act="pick">' + cups.map(function (c) { return '<option value="' + esc(c.id) + '"' + (cup && same(c.id, cup.id) ? ' selected' : '') + '>[' + (cupDiv(c) ? cupDiv(c) + 'D' : 'Mixta') + '] ' + esc(c.name) + ' — ' + esc(cupStatus(c)) + '</option>'; }).join('') + '</select>' : '') +
      '<button type="button" class="btn ' + (cups.length ? '' : 'btn-primary') + '" data-cup-act="new">＋ Nueva copa</button></div>';
    if (showForm || !cups.length) html += formHTML();
    if (cup && !(showForm && !cups.length)) {
      var res = resolve(cup), gd = res.gd;
      html += heroHTML(cup, res);
      html += '<div class="cup-bar" style="margin-top:0"><span class="cup-note">Gestiona grupos, calendario y eliminatorias de esta copa.</span><div class="cup-actions">' +
        (gd && !gd.complete ? '<button type="button" class="btn" data-cup-act="close-groups">Cerrar fase de grupos</button>' : (gd && cup.closed ? '<button type="button" class="btn" data-cup-act="open-groups">Reabrir fase de grupos</button>' : '')) +
        '<button type="button" class="btn btn-primary" data-cup-act="go-matches">📅 Crear partidos en Jornadas y partidos</button><button type="button" class="btn" data-cup-act="reshuffle">🎲 Resortear</button><button type="button" class="btn cup-danger" data-cup-act="delete">Eliminar copa</button></div></div>';
      var tabs = tabsFor(cup, res);
      if (admTabFor !== cup.id || !tabs.some(function (t) { return t[0] === admTab; })) { admTabFor = cup.id; admTab = gd && !gd.complete ? 'grupos' : 'elim'; }
      if (tabs.length > 1) html += '<div class="cup-tabs">' + tabs.map(function (t) { return '<button type="button" class="cup-tab' + (admTab === t[0] ? ' active' : '') + '" data-cup-tab="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div>';
      if (admTab === 'grupos') html += groupsTabHTML(cup, res);
      else {
        html += (gd && !gd.complete ? '<div class="cup-banner">Los cruces se rellenan solos al terminar la fase de grupos (o al pulsar “Cerrar fase de grupos”).</div>' : '') + '<div class="cup-card">' + bracketHTML(res, 'bracket') + '</div>';
        res.forEach(function (round) { html += '<h4 class="cup-round-title">' + roundName(round.length) + '</h4><div class="cup-ties">' + round.map(function (t) { return adminTieHTML(t, cup); }).join('') + '</div>'; });
      }
    }
    var y = window.pageYOffset;
    el.innerHTML = html + '</div>';
    window.scrollTo(0, y);
  }

  function resetCupMatches(cup) {
    var st = app().state;
    st.matches = st.matches.filter(function (m) { return !same(m.cupId, cup.id); });
    return app().setJSON('matches', st.matches);
  }
  function groupRoundMax(cup) { return cup.fixtures ? cup.fixtures.reduce(function (m, f) { return Math.max(m, f.r); }, 0) : 0; }
  function newMatch(cup, a, b, date, time, round, label) {
    return { id: uid('m'), teamAId: a.id, teamBId: b.id, home: a.name, away: b.name, date: date || '', time: time || '', round: round, division: 'copa', tz: 'COL', tournamentId: cup.tournamentId, finished: false, acta: '', attendance: {}, cupId: cup.id, cupRound: label };
  }
  /* Vincula a la copa los partidos creados en “Jornadas y partidos” (y, si create=true, crea los que falten). */
  function samePair(m, a, b) { return (same(m.teamAId, a) && same(m.teamBId, b)) || (same(m.teamAId, b) && same(m.teamBId, a)); }
  function syncCupMatches(cup, create, grp, auto) {
    var st = app().state, changed = 0;
    if (!Array.isArray(st.matches)) st.matches = [];
    function used(id) { return (cup.fixtures || []).some(function (f) { return same(f.matchId, id); }) || cup.rounds.some(function (r) { return r.some(function (t) { return same(t.matchId, id); }); }); }
    function find(a, b, round, any) {
      var c = st.matches.filter(function (m) { return same(m.cupId, cup.id) && samePair(m, a, b) && !used(m.id); });
      var exact = c.find(function (m) { return Number(m.round) === round; });
      if (exact || !any) return exact;
      var gmax = groupRoundMax(cup);
      c = c.filter(function (m) { return !(Number(m.round) > gmax) || /grupo/i.test(m.cupRound || ''); }).sort(function (x, y) { return (Number(x.round) || 0) - (Number(y.round) || 0); });
      return c[0];
    }
    var doCreate = create;
    function mk(a, b, date, time, round, label, holder, any) {
      if (holder.matchId && matchById(holder.matchId)) return;
      if (holder.noAuto || (isNum(holder.sa) && isNum(holder.sb))) return;
      var m = find(a, b, round, any);
      if (!m && doCreate) {
        var ta = team(a), tb = team(b); if (!ta || !tb) return;
        m = newMatch(cup, ta, tb, date, time, round, label); st.matches.push(m);
      }
      if (!m) return;
      holder.matchId = m.id; delete holder.sa; delete holder.sb; changed++;
    }
    (cup.fixtures || []).forEach(function (f) { doCreate = create && !auto && (grp == null || f.g === grp); mk(f.a, f.b, f.date, f.time, f.r, cup.groups[f.g].name + ' · Jornada ' + f.r, f, true); });
    doCreate = create && grp == null;
    var res = resolve(cup), base = groupRoundMax(cup);
    res.forEach(function (round, rr) {
      round.forEach(function (o, kk) {
        if (o.bye || o.a == null || o.b == null) return;
        if (auto && rr === 0 && cup.format !== 'grupos') return;
        mk(o.a, o.b, cup.rounds[rr][kk].date, cup.rounds[rr][kk].time, base + rr + 1, roundName(round.length), cup.rounds[rr][kk]);
      });
    });
    return changed;
  }
  function syncAll() {
    var any = 0;
    cups.forEach(function (c) { any += syncCupMatches(c, false); });
    return any ? app().setJSON('matches', app().state.matches).then(function () { return true; }) : Promise.resolve(false);
  }
  /* API para seccion.html */
  function apiLink() { return load().then(function () { var ch = 0; cups.forEach(function (c) { ch += syncCupMatches(c, false); }); return ch ? save() : null; }); }
  function apiGenerate(cupId, grp) {
    return load().then(function () {
      var c = cups.find(function (x) { return same(x.id, cupId); }); if (!c) return 0;
      var n = syncCupMatches(c, true, grp);
      return n ? Promise.all([app().setJSON('matches', app().state.matches), save()]).then(function () { return n; }) : 0;
    });
  }
  /* Crea el partido de un cruce concreto de la fase de grupos (desde Jornadas y partidos) */
  function apiMakeFixture(cupId, fxId, date, time) {
    return load().then(function () {
      var c = cups.find(function (x) { return same(x.id, cupId); }); if (!c) return null;
      var fx = (c.fixtures || []).find(function (f) { return same(f.id, fxId); }); if (!fx) return null;
      if (fx.matchId && matchById(fx.matchId)) return null;
      var ta = team(fx.a), tb = team(fx.b); if (!ta || !tb) return null;
      var m = newMatch(c, ta, tb, date || '', time || '', fx.r, c.groups[fx.g].name + ' · Jornada ' + fx.r);
      app().state.matches.push(m); fx.matchId = m.id; fx.date = date || ''; fx.time = time || ''; delete fx.sa; delete fx.sb; delete fx.noAuto;
      return Promise.all([app().setJSON('matches', app().state.matches), save()]).then(function () { return m; });
    });
  }
  /* Al finalizar un acta: vincula el partido a su cruce, calcula grupos/bracket y crea el siguiente cruce ya decidido */
  function apiAfterActa(matchId) {
    return load().then(function () {
      var st = app().state, m = (st.matches || []).find(function (x) { return same(x.id, matchId); }), ch = 0;
      cups.forEach(function (c) {
        if (m && m.cupId && !same(m.cupId, c.id)) return;
        ch += syncCupMatches(c, false);
        ch += syncCupMatches(c, true, null, true);
      });
      return ch ? Promise.all([save(), app().setJSON('matches', st.matches)]) : null;
    });
  }
  /* Vuelve a leer y a dibujar la copa que está montada en la vista pública (Clasificación) */
  function apiRefreshPublic() {
    var host = pubHost; if (!host || !host.isConnected) return Promise.resolve();
    return Promise.all([load(), app().getJSON('matches', null)]).then(function (r) {
      if (Array.isArray(r[1])) app().state.matches = r[1];
      renderPublic(host);
    });
  }
  function tieOfMatch(matchId) {
    for (var ci = 0; ci < cups.length; ci++) {
      var c = cups[ci], res = resolve(c);
      for (var r = 0; r < c.rounds.length; r++) for (var k = 0; k < c.rounds[r].length; k++) {
        var t = c.rounds[r][k];
        if (t.matchId != null && same(t.matchId, matchId)) return { cup: c, tie: t, o: res[r][k] };
      }
    }
    return null;
  }
  /* ¿El acta terminó en empate en una eliminatoria sin penales cargados? */
  function apiNeedsPens(matchId) {
    return load().then(function () {
      var t = tieOfMatch(matchId);
      if (!t || !t.o.pens || t.o.done) return null;
      return { a: teamName(t.o.a), b: teamName(t.o.b) };
    });
  }
  function apiSetPens(matchId, pa, pb) {
    return load().then(function () {
      var t = tieOfMatch(matchId); if (!t) return null;
      var m = matchById(matchId), straight = m && same(m.teamAId, t.o.a);
      t.tie.pa = straight ? pa : pb; t.tie.pb = straight ? pb : pa;
      return save();
    });
  }
  function apiCups() { return cups.slice(); }
  function onAdminClick(e) {
    var tab = e.target.closest('[data-cup-tab]');
    if (tab) { admTab = tab.getAttribute('data-cup-tab'); renderAdmin(); return; }
    var btn = e.target.closest('[data-cup-act]'); if (!btn || btn.tagName === 'SELECT') return;
    var act = btn.getAttribute('data-cup-act'), cup = current(), st = app().state;
    var done = function () { return syncAll().then(save).then(renderAdmin); };
    var goMatches = function (id) { if (window.hfaCopa && typeof window.hfaCopa.goMatches === 'function') window.hfaCopa.goMatches(id); };
    var v = btn.getAttribute('data-v');
    if (act === 'new') { draft = JSON.parse(JSON.stringify(DRAFT0)); showForm = true; renderAdmin(); return; }
    if (act === 'cancel-new') { showForm = false; renderAdmin(); return; }
    if (act === 'toggle') {
      var id = btn.getAttribute('data-id'), i = draft.ids.findIndex(function (x) { return same(x, id); });
      if (i > -1) draft.ids.splice(i, 1); else draft.ids.push(team(id) ? team(id).id : id);
      renderAdmin(); return;
    }
    if (act === 'new-team') {
      var form = btn.closest('.cup-form'), nameEl = form && form.querySelector('#cupNewTeamName'), crestEl = form && form.querySelector('#cupNewTeamCrest');
      var tname = nameEl ? nameEl.value.trim() : '', tcrest = crestEl ? crestEl.value.trim() : '';
      if (!tname) { alert('Escribe el nombre del equipo de copa.'); return; }
      if (teams().some(function (x) { return String(x.name).toLowerCase() === tname.toLowerCase(); })) { alert('Ya existe un equipo con ese nombre.'); return; }
      var nt = { id: uid('e'), name: tname, division: draft.div === 'all' ? '' : draft.div, players: [], crest: tcrest, cupOnly: true };
      app().state.teams.push(nt); draft.ids.push(nt.id);
      app().setJSON('teams', app().state.teams).then(function () { renderAdmin(); });
      return;
    }
    if (act === 'div') {
      draft.div = v;
      draft.ids = draft.ids.filter(function (id) { var t = team(id); return t && (v === 'all' || divCode(t) === v); });
      renderAdmin(); return;
    }
    if (act === 'sel-all' || act === 'sel-none') {
      shownTeams().forEach(function (t) {
        var j = draft.ids.findIndex(function (x) { return same(x, t.id); });
        if (act === 'sel-all' && j === -1) draft.ids.push(t.id);
        if (act === 'sel-none' && j > -1) draft.ids.splice(j, 1);
      });
      renderAdmin(); return;
    }
    if (act === 'order') { draft.order = v; renderAdmin(); return; }
    if (act === 'format') { draft.format = v; renderAdmin(); return; }
    if (act === 'groups') { draft.groups = +v; renderAdmin(); return; }
    if (act === 'q') { draft.q = +v; renderAdmin(); return; }
    if (act === 'dbl') { draft.dbl = v === '1'; renderAdmin(); return; }
    if (act === 'create') {
      var name = (draft.name || '').trim();
      if (!name) { alert('Escribe un nombre para la copa.'); return; }
      if (cups.some(function (c) { return String(c.name).toLowerCase() === name.toLowerCase(); })) { alert('Ya existe una copa con ese nombre.'); return; }
      var info = draftInfo(); if (!info.ok) { alert(info.msg); return; }
      var c = { id: uid('c'), name: name, format: draft.format, division: draft.div === 'all' ? '' : draft.div, createdAt: Date.now() };
      c.tournamentId = 'copa-' + c.id;
      if (c.format === 'grupos') { c.G = draft.groups; c.q = draft.q; c.dbl = draft.dbl; }
      structure(c, draft.ids.slice(), draft.order);
      cups.push(c); selectedId = c.id; showForm = false; draft = JSON.parse(JSON.stringify(DRAFT0));
      st.tournaments.push({ id: c.tournamentId, name: c.name, type: 'copa', cupId: c.id, division: c.division });
      app().setJSON('tournaments', st.tournaments).then(done).then(function () { goMatches(c.id); });
      return;
    }
    if (!cup) return;
    if (act === 'close-groups') {
      if (!confirm('Se cerrará la fase de grupos con la clasificación actual y los cruces se rellenarán con los clasificados. ¿Continuar?')) return;
      cup.closed = true; done(); return;
    }
    if (act === 'go-matches') { goMatches(cup.id); return; }
    if (act === 'open-groups') { cup.closed = false; done(); return; }
    if (act === 'reshuffle') {
      if (!confirm('Se volverá a sortear la copa. Se borrarán los resultados y los partidos creados. ¿Continuar?')) return;
      structure(cup, shuffle(cup.teamIds), 'random');
      resetCupMatches(cup).then(done); return;
    }
    if (act === 'delete') {
      if (!confirm('¿Eliminar la copa “' + cup.name + '”? Se borrarán también su torneo y todos sus partidos.')) return;
      cups = cups.filter(function (x) { return x !== cup; });
      st.tournaments = st.tournaments.filter(function (x) { return !same(x.id, cup.tournamentId); });
      selectedId = cups.length ? cups[cups.length - 1].id : null;
      Promise.all([resetCupMatches(cup), app().setJSON('tournaments', st.tournaments)]).then(done); return;
    }
    /* ---- partidos de grupo ---- */
    var fxEl = btn.closest('.cup-fx'), jorEl = btn.closest('.cup-jor');
    var val = function (root, f) { var i = root && root.querySelector('[data-f="' + f + '"]'); return i ? i.value : ''; };
    if (act === 'jor-mk' && jorEl) {
      var jr = +jorEl.dataset.jor, date = val(jorEl, 'jdate'), time = val(jorEl, 'jtime'), n = 0;
      if (!date && !time) { alert('Elige una fecha u hora para aplicar a la jornada.'); return; }
      cup.fixtures.filter(function (f) { return f.r === jr; }).forEach(function (f) {
        var m = matchById(f.matchId); if (!m || m.finished) return;
        if (date) { m.date = date; f.date = date; } if (time) { m.time = time; f.time = time; } n++;
      });
      if (!n) { alert('No hay partidos pendientes en esta jornada.'); return; }
      app().setJSON('matches', st.matches).then(done); return;
    }
    if (fxEl) {
      var fx = cup.fixtures.find(function (f) { return f.id === fxEl.dataset.fx; }); if (!fx) return;
      if (act === 'fx-mk') {
        var ta = team(fx.a), tb = team(fx.b); if (!ta || !tb) { alert('Alguno de los equipos ya no existe.'); return; }
        fx.date = val(fxEl, 'date'); fx.time = val(fxEl, 'time');
        var m2 = newMatch(cup, ta, tb, fx.date, fx.time, fx.r, cup.groups[fx.g].name + ' · Jornada ' + fx.r);
        st.matches.push(m2); fx.matchId = m2.id; delete fx.sa; delete fx.sb;
        app().setJSON('matches', st.matches).then(done); return;
      }
      if (act === 'fx-unlink') { if (!confirm('Se desvinculará el partido (seguirá existiendo en Partidos). ¿Continuar?')) return; delete fx.matchId; fx.noAuto = true; done(); return; }
      if (act === 'fx-date') {
        var mf = matchById(fx.matchId); if (!mf) return;
        mf.date = val(fxEl, 'date'); mf.time = val(fxEl, 'time'); fx.date = mf.date; fx.time = mf.time;
        app().setJSON('matches', st.matches).then(done); return;
      }
      if (act === 'fx-save') {
        var a1 = val(fxEl, 'sa'), b1 = val(fxEl, 'sb');
        if (a1 === '' || b1 === '') { delete fx.sa; delete fx.sb; } else { fx.sa = Math.max(0, parseInt(a1, 10) || 0); fx.sb = Math.max(0, parseInt(b1, 10) || 0); }
        done(); return;
      }
    }
    /* ---- cruces de eliminatoria ---- */
    var card = btn.closest('.cup-adm-tie'); if (!card) return;
    var rr = +card.dataset.r, kk = +card.dataset.k, tie = cup.rounds[rr][kk];
    var o = resolve(cup)[rr][kk];
    var tv = function (f) { return val(card, f); };
    if (act === 'mk-match') {
      if (o.a == null || o.b == null) return;
      var xa = team(o.a), xb = team(o.b); if (!xa || !xb) { alert('Alguno de los equipos ya no existe.'); return; }
      tie.date = tv('date'); tie.time = tv('time');
      var label = roundName(cup.rounds[rr].length);
      var m3 = newMatch(cup, xa, xb, tie.date, tie.time, groupRoundMax(cup) + rr + 1, label);
      st.matches.push(m3); tie.matchId = m3.id; delete tie.sa; delete tie.sb;
      app().setJSON('matches', st.matches).then(done); return;
    }
    if (act === 'tie-date') {
      var mt = matchById(tie.matchId); if (!mt) return;
      mt.date = tv('date'); mt.time = tv('time'); tie.date = mt.date; tie.time = mt.time;
      app().setJSON('matches', st.matches).then(done); return;
    }
    if (act === 'unlink') { if (!confirm('Se desvinculará el partido de este cruce (el partido seguirá existiendo en Partidos). ¿Continuar?')) return; delete tie.matchId; tie.noAuto = true; delete tie.pa; delete tie.pb; done(); return; }
    if (act === 'save-manual') {
      var sa = tv('sa'), sb = tv('sb');
      if (sa === '' || sb === '') { delete tie.sa; delete tie.sb; delete tie.pa; delete tie.pb; done(); return; }
      tie.sa = Math.max(0, parseInt(sa, 10) || 0); tie.sb = Math.max(0, parseInt(sb, 10) || 0);
      if (tie.sa !== tie.sb) { delete tie.pa; delete tie.pb; }
      done(); return;
    }
    if (act === 'save-pens') {
      var pa = tv('pa'), pb = tv('pb');
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
    load().then(function () { showForm = !cups.length; return syncAll().then(function (ch) { return ch ? save() : null; }); }).then(renderAdmin, renderAdmin);
  }

  window.hfaCopa = { mountPublic: mountPublic, mountAdmin: mountAdmin, link: apiLink, generate: apiGenerate, makeFixture: apiMakeFixture, afterActa: apiAfterActa, needsPens: apiNeedsPens, setPens: apiSetPens, refreshPublic: apiRefreshPublic, cups: apiCups, load: load };
})();
