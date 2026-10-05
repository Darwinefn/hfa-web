
const URL_ = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
let mongoClientPromise;

// Roles válidos. Se asignan SOLO desde MongoDB (campo "role" de la colección "accounts").
const ROLES = ['pendiente', 'admin', 'prueba_moderador', 'moderador', 'arbitro', 'dueno'];

// Archivo opcional roles.json (en la raíz del proyecto): { "NombreHabbo": "admin", ... }
// Al desplegar, esos roles se aplican a las cuentas y se guardan en MongoDB.
function fileRoles() {
  try {
    const data = require('../roles.json');
    const map = {};
    Object.keys(data || {}).forEach(name => {
      const role = String(data[name] || '').trim().toLowerCase();
      if (ROLES.indexOf(role) !== -1) map[String(name).trim().toLowerCase()] = role;
    });
    return map;
  } catch (e) { return {}; }
}

async function dbRoles(names) {
  try {
    const filter = names ? { _id: { $in: names } } : {};
    const rows = await (await mongoDb()).collection('role_assignments').find(filter).toArray();
    const map = {};
    rows.forEach(row => {
      const role = String(row.role || '').trim().toLowerCase();
      if (ROLES.indexOf(role) !== -1) map[String(row._id).trim().toLowerCase()] = role;
    });
    return map;
  } catch (e) { return {}; }
}

async function applyFileRoles(collection, accounts) {
  const map = Object.assign({}, await dbRoles(), fileRoles());
  const changes = [];
  accounts.forEach(account => {
    const role = map[String(account.username || '').toLowerCase()];
    if (role && account.role !== role) {
      account.role = role;
      changes.push({ updateOne: { filter: { _id: String(account.username).toLowerCase() }, update: { $set: { role: role } } } });
    }
  });
  if (changes.length) await collection.bulkWrite(changes);
}

// Acepta variantes escritas a mano: "Admin", "ADMINISTRADOR", "Árbitro", "Dueño", "prueba moderador"...
function normalizeRole(value) {
  const key = String(value || '').trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s-]+/g, '_');
  const aliases = {
    administrador: 'admin',
    prueba_moderador: 'prueba_moderador',
    moderador_prueba: 'prueba_moderador',
    dueno_de_equipo: 'dueno',
    dueno_equipo: 'dueno'
  };
  const role = aliases[key] || key;
  return ROLES.indexOf(role) === -1 ? 'pendiente' : role;
}

// IP real del visitante (Vercel la envía en x-forwarded-for). No se puede falsear desde el navegador.
function clientIp(req) {
  const xf = req && req.headers && req.headers['x-forwarded-for'];
  return ((xf ? String(xf).split(',')[0].trim() : '') ||
    String((req && req.headers && req.headers['x-real-ip']) || '') ||
    (req && req.socket && req.socket.remoteAddress) || '').slice(0, 64);
}

async function redis(cmd) {
  const r = await fetch(URL_, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmd)
  });
  const d = await r.json();
  if (d.error) throw new Error(d.error);
  return d.result;
}

async function mongoCollection() {
  if (!mongoClientPromise) {
    const { MongoClient } = require('mongodb');
    const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
    mongoClientPromise = client.connect().catch(error => {
      mongoClientPromise = null;
      throw error;
    });
  }
  const client = await mongoClientPromise;
  return client.db(process.env.MONGODB_DATABASE || 'hfa').collection('app_data');
}

async function mongoDb() {
  await mongoCollection();
  const client = await mongoClientPromise;
  return client.db(process.env.MONGODB_DATABASE || 'hfa');
}

async function mongoAccountsCollection() {
  return (await mongoDb()).collection('accounts');
}

// Historial de accesos: una fila por registro / inicio de sesión (usuario, IP y hora).
async function logAccess(type, username, ip) {
  try {
    await (await mongoDb()).collection('access_log').insertOne({
      type: type, username: username, ip: ip, at: new Date()
    });
  } catch (e) {}
}

// trusted = true solo para migrar datos antiguos (se respetan rol/IP/fecha tal cual).
async function saveMongoAccounts(value, req, trusted) {
  const accounts = JSON.parse(value);
  if (!Array.isArray(accounts)) throw new Error('Invalid accounts data');
  const uniqueAccounts = new Map();
  accounts.forEach(account => {
    const username = String(account && account.username || '').trim();
    if (username) uniqueAccounts.set(username.toLowerCase(), { ...account, username: username });
  });
  if (!uniqueAccounts.size) return;

  const ip = trusted ? '' : clientIp(req);
  const nowIso = new Date().toISOString();
  const entries = [...uniqueAccounts.entries()];
  const preRoles = trusted ? {} : Object.assign({}, await dbRoles(entries.map(entry => entry[0])), fileRoles());
  const operations = entries.map(([id, account]) => {
    const { _id, ...fields } = account;
    if (trusted) {
      return { updateOne: { filter: { _id: id }, update: { $set: fields }, upsert: true } };
    }
    // Campos que el navegador NO puede escribir: los pone el servidor o se cambian en MongoDB.
    delete fields.role;
    delete fields.ip;
    delete fields.lastIp;
    delete fields.ips;
    delete fields.createdAt;
    delete fields.lastLoginAt;
    return {
      updateOne: {
        filter: { _id: id },
        update: {
          $set: fields,
          $setOnInsert: {
            role: preRoles[id] || 'pendiente',
            ip: ip,
            lastIp: ip,
            ips: ip ? [ip] : [],
            createdAt: nowIso,
            lastLoginAt: nowIso
          }
        },
        upsert: true
      }
    };
  });

  const collection = await mongoAccountsCollection();
  const result = await collection.bulkWrite(operations);

  // Cuentas nuevas de esta operación -> quedan en el historial con IP y hora.
  if (!trusted && result.upsertedIds) {
    for (const index of Object.keys(result.upsertedIds)) {
      const entry = entries[Number(index)];
      if (entry) await logAccess('register', entry[1].username, ip);
    }
  }
  // Ya no se borran cuentas que no vengan en la lista: un navegador con datos viejos
  // podía eliminar usuarios recién registrados. Para borrar un usuario, hazlo en MongoDB.
}

// Se llama al iniciar sesión: actualiza última IP y última hora de acceso.
async function recordLogin(username, req) {
  if (!process.env.MONGODB_URI) return false;
  const id = String(username || '').trim().toLowerCase();
  if (!/^[a-z0-9._-]{3,25}$/.test(id)) return false;
  const ip = clientIp(req);
  const collection = await mongoAccountsCollection();
  const update = { $set: { lastIp: ip, lastLoginAt: new Date().toISOString() } };
  if (ip) update.$addToSet = { ips: ip };
  const result = await collection.updateOne({ _id: id }, update);
  if (!result.matchedCount) return false;
  await logAccess('login', id, ip);
  return true;
}

// El admin cambia el rol de una cuenta desde la web. Se verifica que quien lo pide sea admin
// (usuario + hash de contraseña) y se guarda el rol en MongoDB (cuenta + asignaciones de rol).
async function setRole(body) {
  if (!process.env.MONGODB_URI) return false;
  const adminId = String(body.adminUser || '').trim().toLowerCase();
  const targetId = String(body.username || '').trim().toLowerCase();
  const role = String(body.role || '').trim().toLowerCase();
  if (!adminId || !targetId || ROLES.indexOf(role) === -1) return false;
  const collection = await mongoAccountsCollection();
  const admin = await collection.findOne({ _id: adminId });
  if (!admin || normalizeRole(admin.role) !== 'admin') return false;
  if (!admin.passHash || String(admin.passHash) !== String(body.adminHash || '')) return false;
  const result = await collection.updateOne({ _id: targetId }, { $set: { role: role } });
  if (!result.matchedCount) return false;
  try {
    await (await mongoDb()).collection('role_assignments').updateOne(
      { _id: targetId }, { $set: { role: role, updatedAt: new Date() } }, { upsert: true });
  } catch (e) {}
  return true;
}

// Comprueba la conexión de quien da "Presente": ¿VPN / proxy / IP de centro de datos (típico de ExitLag)?
// Solo devuelve señales (verdadero/falso, ISP y nº de cuentas con la misma IP); la IP nunca se guarda ni se devuelve.
async function lookupIp(ip) {
  if (!ip) return { checked: false };
  const clean = String(ip).replace(/^::ffff:/, '');
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const r = await fetch('https://api.ipapi.is/?q=' + encodeURIComponent(clean), { signal: controller.signal, headers: { Accept: 'application/json' } });
    clearTimeout(timer);
    if (r.ok) {
      const d = await r.json();
      if (d && typeof d === 'object' && !d.error && ('is_vpn' in d || 'is_datacenter' in d || 'is_proxy' in d)) {
        return {
          checked: true,
          vpn: !!d.is_vpn || !!d.is_tor,
          proxy: !!d.is_proxy,
          datacenter: !!d.is_datacenter,
          isp: String((d.company && d.company.name) || (d.asn && d.asn.org) || '').slice(0, 60)
        };
      }
    }
  } catch (e) {}
  return { checked: false };
}

// Quien puede ver las IP de los presentes: admin y moderadores (se verifica usuario + hash de contraseña).
async function isStaff(body) {
  if (!process.env.MONGODB_URI) return false;
  const adminId = String((body && body.adminUser) || '').trim().toLowerCase();
  if (!adminId) return false;
  const account = await (await mongoAccountsCollection()).findOne({ _id: adminId });
  if (!account || !account.passHash || String(account.passHash) !== String((body && body.adminHash) || '')) return false;
  return ['admin', 'moderador', 'prueba_moderador'].indexOf(normalizeRole(account.role)) !== -1;
}

// La IP de cada presente se guarda en una colección privada (nunca en los datos públicos del partido).
async function logAttendance(body, ip, conn, geo, ipChanged, shared) {
  try {
    const matchId = String((body && body.matchId) || '').slice(0, 80);
    const username = String((body && body.username) || '').trim().toLowerCase();
    if (!matchId || !/^[a-z0-9._-]{3,25}$/.test(username)) return;
    const now = new Date();
    await (await mongoDb()).collection('attendance_log').updateOne(
      { matchId: matchId, username: username },
      {
        $set: { ip: ip, conn: conn, at: now, vpn: !!geo.vpn, proxy: !!geo.proxy, datacenter: !!geo.datacenter, isp: geo.isp || '', ipChanged: !!ipChanged, shared: shared || 0 },
        $addToSet: { ips: ip },
        $setOnInsert: { firstAt: now }
      },
      { upsert: true }
    );
  } catch (e) {}
}

async function attendanceIps(body) {
  if (!(await isStaff(body))) return { ok: false };
  const filter = body.matchId ? { matchId: String(body.matchId).slice(0, 80) } : {};
  const rows = await (await mongoDb()).collection('attendance_log').find(filter).sort({ at: -1 }).limit(2000).toArray();
  return {
    ok: true,
    rows: rows.map(row => ({ matchId: row.matchId, username: row.username, ip: row.ip || '', ips: row.ips || [], conn: row.conn || '', at: row.at }))
  };
}

// Temática global de la web (la ven todos los usuarios). Solo la cambia un administrador.
async function setSiteTheme(body) {
  if (!process.env.MONGODB_URI) return false;
  const theme = String((body && body.theme) || '').trim().toLowerCase();
  if (['mundial', 'normal'].indexOf(theme) === -1) return false;
  const adminId = String((body && body.adminUser) || '').trim().toLowerCase();
  if (!adminId) return false;
  const account = await (await mongoAccountsCollection()).findOne({ _id: adminId });
  if (!account || !account.passHash || String(account.passHash) !== String((body && body.adminHash) || '')) return false;
  if (normalizeRole(account.role) !== 'admin') return false;
  await setValue('sitetheme', JSON.stringify({ theme: theme, by: adminId, at: new Date().toISOString() }), null);
  return true;
}

async function checkConnection(body, req) {
  const ip = clientIp(req);
  const id = String((body && body.username) || '').trim().toLowerCase();
  let ipChanged = false;
  let shared = 0;
  if (process.env.MONGODB_URI && /^[a-z0-9._-]{3,25}$/.test(id)) {
    try {
      const collection = await mongoAccountsCollection();
      const account = await collection.findOne({ _id: id }, { projection: { ip: 1 } });
      if (account && account.ip && ip && String(account.ip) !== ip) ipChanged = true;
      if (ip) shared = await collection.countDocuments({ _id: { $ne: id }, $or: [{ ip: ip }, { lastIp: ip }, { ips: ip }] });
    } catch (e) {}
  }
  const geo = await lookupIp(ip);
  await logAttendance(body, ip, String((body && body.conn) || '').slice(0, 12), geo, ipChanged, shared);
  return { ok: true, checked: !!geo.checked, vpn: !!geo.vpn, proxy: !!geo.proxy, datacenter: !!geo.datacenter, isp: geo.isp || '', ipChanged: ipChanged, shared: shared };
}

async function getMongoAccounts() {
  const collection = await mongoAccountsCollection();
  const accounts = await collection.find({}, { projection: { _id: 0 } }).sort({ username: 1 }).toArray();
  if (accounts.length) {
    // Si alguien escribe un rol mal en MongoDB, la web lo trata como "sin rol".
    accounts.forEach(account => { account.role = normalizeRole(account.role); });
    try { await applyFileRoles(collection, accounts); } catch (e) {}
    return JSON.stringify(accounts);
  }

  let legacyValue = null;
  const legacyDocument = await (await mongoCollection()).findOne({ _id: 'hfa:accounts' }, { projection: { value: 1 } });
  if (legacyDocument) legacyValue = legacyDocument.value;
  if (legacyValue === null && URL_ && TOKEN) legacyValue = await redis(['GET', 'hfa:accounts']);
  if (typeof legacyValue !== 'string') return null;

  const legacyAccounts = JSON.parse(legacyValue);
  if (!Array.isArray(legacyAccounts)) return null;
  await saveMongoAccounts(legacyValue, null, true);
  return JSON.stringify(legacyAccounts);
}

async function getValue(key) {
  if (process.env.MONGODB_URI) {
    if (key === 'accounts') return getMongoAccounts();
    const document = await (await mongoCollection()).findOne({ _id: 'hfa:' + key }, { projection: { value: 1 } });
    return document ? document.value : null;
  }
  if (URL_ && TOKEN) {
    const value = await redis(['GET', 'hfa:' + key]);
    return value === undefined ? null : value;
  }
  throw new Error('Database is not configured');
}

async function setValue(key, value, req) {
  if (process.env.MONGODB_URI) {
    if (key === 'accounts') {
      await saveMongoAccounts(value, req, false);
      return;
    }
    await (await mongoCollection()).updateOne(
      { _id: 'hfa:' + key },
      { $set: { value: value, updatedAt: new Date() } },
      { upsert: true }
    );
    return;
  }
  if (URL_ && TOKEN) {
    await redis(['SET', 'hfa:' + key, value]);
    return;
  }
  throw new Error('Database is not configured');
}

/* =====================================================================
   HFA COIN · wallet virtual (cuenta bancaria), apuestas y copias de seguridad
   Todo se valida en el servidor: el navegador nunca decide saldos ni cuotas.
   Requiere MongoDB (MONGODB_URI).
   ===================================================================== */
const crypto = require('crypto');
const COIN_CFG = { welcome: 500, daily: 100, minBet: 10, maxBet: 2000, margin: 0.08, maxTransfer: 100000 };
const BACKUP_COLLS = ['app_data', 'accounts', 'role_assignments', 'wallets', 'wallet_tx', 'bets'];
let indexesReady = false;

function rid() { return Date.now().toString(36) + crypto.randomBytes(4).toString('hex'); }
function nowIso() { return new Date().toISOString(); }
function unwrap(r) { return r && Object.prototype.hasOwnProperty.call(r, 'value') && Object.prototype.hasOwnProperty.call(r, 'ok') ? r.value : r; }
async function dbc(name) { return (await mongoDb()).collection(name); }

async function ensureIndexes() {
  if (indexesReady) return;
  try {
    await (await dbc('bets')).createIndex({ username: 1, matchId: 1 }, { unique: true });
    await (await dbc('bets')).createIndex({ status: 1 });
    await (await dbc('wallet_tx')).createIndex({ username: 1, at: -1 });
    indexesReady = true;
  } catch (e) {}
}

// Usuario normal: usuario + hash de contraseña (el mismo sistema que setRole / isStaff).
async function authUser(body, userKey, hashKey) {
  if (!process.env.MONGODB_URI) return null;
  const id = String((body && body[userKey || 'user']) || '').trim().toLowerCase();
  if (!/^[a-z0-9._-]{3,25}$/.test(id)) return null;
  const account = await (await mongoAccountsCollection()).findOne({ _id: id });
  if (!account || !account.passHash || String(account.passHash) !== String((body && body[hashKey || 'hash']) || '')) return null;
  return account;
}
async function authAdmin(body) {
  const account = await authUser(body, 'adminUser', 'adminHash');
  return account && normalizeRole(account.role) === 'admin' ? account : null;
}

function accountNumber(id) {
  const h = crypto.createHash('sha256').update('hfa:' + id).digest();
  let digits = '';
  for (let i = 0; i < 16; i++) digits += String(h[i] % 10);
  return 'HFA ' + digits.match(/.{4}/g).join(' ');
}

async function addTx(id, type, amount, balance, note, ref) {
  await (await dbc('wallet_tx')).insertOne({ _id: rid(), username: id, type: type, amount: amount, balance: balance, note: String(note || '').slice(0, 140), ref: ref || '', at: nowIso() });
}
async function openWallet(account, bonus) {
  const id = String(account._id || account.username).toLowerCase();
  const col = await dbc('wallets');
  const give = bonus === false ? 0 : COIN_CFG.welcome;
  const r = await col.updateOne({ _id: id }, { $setOnInsert: { username: account.username || id, number: accountNumber(id), balance: give, createdAt: nowIso(), lastDaily: null } }, { upsert: true });
  if ((r.upsertedCount || r.upsertedId) && give > 0) await addTx(id, 'deposit', give, give, 'Bono de bienvenida · apertura de cuenta');
  return col.findOne({ _id: id });
}
async function debit(id, amount) {
  return unwrap(await (await dbc('wallets')).findOneAndUpdate({ _id: id, balance: { $gte: amount } }, { $inc: { balance: -amount } }, { returnDocument: 'after' }));
}
async function credit(id, amount) {
  return unwrap(await (await dbc('wallets')).findOneAndUpdate({ _id: id }, { $inc: { balance: amount } }, { returnDocument: 'after' }));
}

/* ---------- partidos, cuotas y horario ---------- */
async function loadMatches() {
  try {
    const raw = await getValue('matches');
    const list = JSON.parse(raw || 'null');
    return Array.isArray(list) ? list : null;
  } catch (e) { return null; }
}
function madridOffsetMin(utcMs) {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Madrid', hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(new Date(utcMs));
  const o = {}; parts.forEach(p => { o[p.type] = p.value; });
  return Math.round((Date.UTC(+o.year, +o.month - 1, +o.day, (+o.hour) % 24, +o.minute, +o.second) - utcMs) / 60000);
}
// Fecha y hora del partido (hora de España). null = sin horario definido.
function kickoffMs(m) {
  const dm = /^(\d{4})-(\d{2})-(\d{2})/.exec(String((m && m.date) || ''));
  if (!dm) return null;
  const tm = /^(\d{1,2}):(\d{2})/.exec(String((m && m.time) || '')) || [0, '0', '0'];
  const naive = Date.UTC(+dm[1], +dm[2] - 1, +dm[3], +tm[1], +tm[2]);
  return naive - madridOffsetMin(naive) * 60000;
}
function matchState(m, now) {
  if (m.finished) return 'finished';
  const k = kickoffMs(m);
  if (k !== null && now >= k) return 'live';
  return 'open';
}
function teamKey(m, side) {
  const id = side === 'A' ? m.teamAId : m.teamBId;
  const name = side === 'A' ? m.home : m.away;
  return id ? 'id:' + id : 'n:' + String(name || '').trim().toLowerCase();
}
function teamForm(matches) {
  const t = {};
  matches.forEach(m => {
    if (!m.finished) return;
    const sa = Number(m.scoreA) || 0, sb = Number(m.scoreB) || 0;
    [[teamKey(m, 'A'), sa, sb], [teamKey(m, 'B'), sb, sa]].forEach(row => {
      const x = t[row[0]] || (t[row[0]] = { pts: 0, n: 0, gf: 0, ga: 0 });
      x.n++; x.gf += row[1]; x.ga += row[2];
      x.pts += row[1] > row[2] ? 3 : row[1] === row[2] ? 1 : 0;
    });
  });
  return t;
}
function strength(x) {
  if (!x || !x.n) return 0.5;
  const v = (x.pts + 1.5) / (x.n * 3 + 3) + ((x.gf - x.ga) / (x.n + 2)) * 0.03;
  return Math.min(0.95, Math.max(0.05, v));
}
// Cuotas calculadas con el rendimiento real de cada equipo en la competición (+ margen de la casa).
function computeOdds(form, m) {
  const sa = strength(form[teamKey(m, 'A')]), sb = strength(form[teamKey(m, 'B')]);
  const pA0 = sa / (sa + sb);
  const pD = Math.min(0.30, Math.max(0.14, 0.28 - Math.abs(sa - sb) * 0.16));
  const f = p => Math.min(12, Math.max(1.15, Math.round((1 - COIN_CFG.margin) / p * 100) / 100));
  return { '1': f((1 - pD) * pA0), 'X': f(pD), '2': f((1 - pD) * (1 - pA0)) };
}
const PICK_LABEL = { '1': 'Gana local', 'X': 'Empate', '2': 'Gana visitante' };

async function betOdds() {
  const matches = await loadMatches();
  if (!matches) return { ok: false };
  const now = Date.now(), form = teamForm(matches), list = [];
  matches.forEach(m => {
    if (!m || !m.id) return;
    const state = matchState(m, now);
    list.push({ id: String(m.id), state: state, kickoff: kickoffMs(m), odds: computeOdds(form, m) });
  });
  return { ok: true, now: now, matches: list, config: { minBet: COIN_CFG.minBet, maxBet: COIN_CFG.maxBet, daily: COIN_CFG.daily } };
}

/* ---------- liquidación automática (sincronizada con los resultados) ---------- */
async function finishBet(b, status, payout, note, result) {
  const bets = await dbc('bets');
  const r = await bets.updateOne({ _id: b._id, status: 'open' }, { $set: { status: status, payout: payout, settledAt: nowIso(), result: result || '' } });
  if (!r.modifiedCount) return;               // otro proceso ya la liquidó: nunca se paga dos veces
  if (payout > 0) {
    const w = await credit(b.username, payout);
    await addTx(b.username, status === 'void' ? 'refund' : 'bet_win', payout, w ? w.balance : 0, note, b._id);
  }
}
async function settleBets(onlyUser) {
  if (!process.env.MONGODB_URI) return;
  const bets = await dbc('bets');
  const filter = { status: 'open' };
  if (onlyUser) filter.username = onlyUser;
  const open = await bets.find(filter).limit(500).toArray();
  if (!open.length) return;
  const matches = await loadMatches();
  if (!matches || !matches.length) return;
  const byId = {}; matches.forEach(m => { if (m && m.id) byId[String(m.id)] = m; });
  for (const b of open) {
    const m = byId[b.matchId];
    if (!m) { await finishBet(b, 'void', b.stake, 'Partido cancelado · apuesta devuelta', 'cancelado'); continue; }
    if (!m.finished) continue;
    const sa = Number(m.scoreA) || 0, sb = Number(m.scoreB) || 0;
    const res = sa > sb ? '1' : sa < sb ? '2' : 'X';
    const score = sa + '-' + sb;
    if (res === b.pick) await finishBet(b, 'won', Math.floor(b.stake * b.odds), 'Apuesta ganada · ' + b.home + ' ' + score + ' ' + b.away, score);
    else await finishBet(b, 'lost', 0, '', score);
  }
}

/* ---------- acciones ---------- */
async function walletGet(body) {
  const account = await authUser(body);
  if (!account) return { ok: false, error: 'auth' };
  await ensureIndexes();
  const id = String(account._id);
  await openWallet(account);
  await settleBets(id);
  const wallet = await (await dbc('wallets')).findOne({ _id: id });
  const tx = await (await dbc('wallet_tx')).find({ username: id }).sort({ at: -1 }).limit(80).toArray();
  const bets = await (await dbc('bets')).find({ username: id }).sort({ placedAt: -1 }).limit(80).toArray();
  const sums = await (await dbc('wallet_tx')).aggregate([{ $match: { username: id } }, { $group: { _id: { $gt: ['$amount', 0] }, total: { $sum: '$amount' } } }]).toArray();
  let income = 0, expense = 0;
  sums.forEach(s => { if (s._id) income = s.total; else expense = -s.total; });
  const nextDaily = wallet.lastDaily ? new Date(wallet.lastDaily).getTime() + 86400000 : 0;
  return { ok: true, wallet: { username: wallet.username, number: wallet.number, balance: wallet.balance, createdAt: wallet.createdAt, nextDaily: nextDaily }, income: income, expense: expense, tx: tx, bets: bets, config: { minBet: COIN_CFG.minBet, maxBet: COIN_CFG.maxBet, daily: COIN_CFG.daily }, now: Date.now() };
}

async function walletDaily(body) {
  const account = await authUser(body);
  if (!account) return { ok: false, error: 'auth' };
  const id = String(account._id);
  const w = await openWallet(account);
  const now = Date.now(), cutoff = new Date(now - 86400000).toISOString();
  const r = unwrap(await (await dbc('wallets')).findOneAndUpdate(
    { _id: id, $or: [{ lastDaily: null }, { lastDaily: { $lte: cutoff } }] },
    { $inc: { balance: COIN_CFG.daily }, $set: { lastDaily: new Date(now).toISOString() } }, { returnDocument: 'after' }));
  if (!r) return { ok: false, error: 'wait', nextDaily: new Date(w.lastDaily).getTime() + 86400000 };
  await addTx(id, 'deposit', COIN_CFG.daily, r.balance, 'Ingreso diario HFA');
  return { ok: true, balance: r.balance };
}

async function walletTransfer(body) {
  const account = await authUser(body);
  if (!account) return { ok: false, error: 'auth' };
  const from = String(account._id);
  const to = String((body && body.to) || '').trim().toLowerCase();
  const amount = Math.floor(Number(body && body.amount));
  const note = String((body && body.note) || '').trim().slice(0, 80);
  if (!/^[a-z0-9._-]{3,25}$/.test(to) || to === from) return { ok: false, error: 'dest' };
  if (!(amount >= 1 && amount <= COIN_CFG.maxTransfer)) return { ok: false, error: 'amount' };
  const target = await (await dbc('wallets')).findOne({ _id: to });
  if (!target) return { ok: false, error: 'nodest' };
  await openWallet(account);
  const after = await debit(from, amount);
  if (!after) return { ok: false, error: 'funds' };
  const got = await credit(to, amount);
  await addTx(from, 'transfer_out', -amount, after.balance, 'Transferencia a ' + target.username + (note ? ' · ' + note : ''), to);
  await addTx(to, 'transfer_in', amount, got ? got.balance : 0, 'Transferencia de ' + account.username + (note ? ' · ' + note : ''), from);
  return { ok: true, balance: after.balance };
}

async function betPlace(body) {
  const account = await authUser(body);
  if (!account) return { ok: false, error: 'auth' };
  await ensureIndexes();
  const id = String(account._id);
  const pick = String((body && body.pick) || '');
  const stake = Math.floor(Number(body && body.stake));
  if (['1', 'X', '2'].indexOf(pick) === -1) return { ok: false, error: 'pick' };
  if (!(stake >= COIN_CFG.minBet && stake <= COIN_CFG.maxBet)) return { ok: false, error: 'stake', min: COIN_CFG.minBet, max: COIN_CFG.maxBet };
  const matches = await loadMatches();
  const matchId = String((body && body.matchId) || '');
  const m = matches && matches.find(x => x && String(x.id) === matchId);
  if (!m) return { ok: false, error: 'match' };
  if (matchState(m, Date.now()) !== 'open') return { ok: false, error: 'closed' };
  const home = String(m.home || '').trim(), away = String(m.away || '').trim();
  if (!home || !away) return { ok: false, error: 'match' };
  await openWallet(account);
  const odds = computeOdds(teamForm(matches), m)[pick];
  const after = await debit(id, stake);
  if (!after) return { ok: false, error: 'funds' };
  const bet = { _id: rid(), username: id, display: account.username, matchId: matchId, home: home, away: away, pick: pick, odds: odds, stake: stake, status: 'open', payout: 0, placedAt: nowIso(), kickoff: kickoffMs(m) };
  try {
    await (await dbc('bets')).insertOne(bet);
  } catch (e) {
    await credit(id, stake);                   // ya tenía una apuesta en este partido: se devuelve el dinero
    return { ok: false, error: 'dup' };
  }
  await addTx(id, 'bet', -stake, after.balance, 'Apuesta · ' + home + ' vs ' + away + ' · ' + PICK_LABEL[pick], bet._id);
  return { ok: true, bet: bet, balance: after.balance };
}

async function walletTop() {
  const rows = await (await dbc('wallets')).find({}).sort({ balance: -1 }).limit(10).toArray();
  return { ok: true, rows: rows.map(r => ({ username: r.username, balance: r.balance })) };
}

// Solo admin: ingresar o retirar HFA COIN a una cuenta (premios, correcciones...).
async function walletAdmin(body) {
  const admin = await authAdmin(body);
  if (!admin) return { ok: false, error: 'auth' };
  const targetId = String((body && body.target) || '').trim().toLowerCase();
  const amount = Math.trunc(Number(body && body.amount));
  const note = String((body && body.note) || '').trim().slice(0, 80);
  if (!amount || Math.abs(amount) > 1000000) return { ok: false, error: 'amount' };
  const target = await (await mongoAccountsCollection()).findOne({ _id: targetId });
  if (!target) return { ok: false, error: 'nodest' };
  await openWallet(target, false);
  const after = amount > 0 ? await credit(targetId, amount) : await debit(targetId, -amount);
  if (!after) return { ok: false, error: 'funds' };
  await addTx(targetId, 'admin', amount, after.balance, (amount > 0 ? 'Ingreso de la HFA' : 'Retirada de la HFA') + (note ? ' · ' + note : ''), admin.username);
  return { ok: true, balance: after.balance };
}

/* ---------- copias de seguridad (solo administradores) ---------- */
async function makeSnapshot(by, label) {
  const db = await mongoDb();
  const id = rid(), counts = {};
  for (const name of BACKUP_COLLS) {
    const docs = await db.collection(name).find({}).toArray();
    counts[name] = docs.length;
    for (let i = 0; i < docs.length; i += 100) {
      await db.collection('backup_items').insertMany(docs.slice(i, i + 100).map(d => ({ backupId: id, coll: name, doc: d })));
    }
  }
  await db.collection('backups').insertOne({ _id: id, at: nowIso(), by: by, label: String(label || '').slice(0, 80), counts: counts });
  const old = await db.collection('backups').find({}).sort({ at: -1 }).skip(15).toArray();   // se conservan las 15 últimas
  for (const b of old) {
    await db.collection('backup_items').deleteMany({ backupId: b._id });
    await db.collection('backups').deleteOne({ _id: b._id });
  }
  return { id: id, counts: counts };
}

async function backupAction(body) {
  const admin = await authAdmin(body);
  if (!admin) return { ok: false, error: 'auth' };
  const db = await mongoDb();
  const what = String(body.op || '');

  if (what === 'save') {
    const snap = await makeSnapshot(admin.username, body.label || 'Copia manual');
    return { ok: true, id: snap.id, counts: snap.counts };
  }
  if (what === 'list') {
    const rows = await db.collection('backups').find({}).sort({ at: -1 }).limit(15).toArray();
    return { ok: true, rows: rows };
  }
  if (what === 'delete') {
    const id = String(body.id || '');
    await db.collection('backup_items').deleteMany({ backupId: id });
    await db.collection('backups').deleteOne({ _id: id });
    return { ok: true };
  }
  if (what === 'restoreSnapshot') {
    const id = String(body.id || '');
    const meta = await db.collection('backups').findOne({ _id: id });
    if (!meta) return { ok: false, error: 'nobackup' };
    await makeSnapshot(admin.username, 'Automática · antes de restaurar');   // red de seguridad
    for (const name of BACKUP_COLLS) {
      const items = await db.collection('backup_items').find({ backupId: id, coll: name }).toArray();
      await db.collection(name).deleteMany({});
      for (let i = 0; i < items.length; i += 100) {
        await db.collection(name).insertMany(items.slice(i, i + 100).map(x => x.doc), { ordered: false });
      }
    }
    return { ok: true };
  }
  if (what === 'export') {                       // descarga por páginas (límite de tamaño de Vercel)
    const name = String(body.coll || '');
    if (BACKUP_COLLS.indexOf(name) === -1) return { ok: false, error: 'coll' };
    const skip = Math.max(0, Number(body.skip) || 0);
    const col = db.collection(name);
    const total = await col.countDocuments({});
    const page = await col.find({}).sort({ _id: 1 }).skip(skip).limit(300).toArray();
    const docs = []; let size = 0;
    for (const d of page) {
      const s = JSON.stringify(d).length;
      if (docs.length && size + s > 2800000) break;
      docs.push(d); size += s;
    }
    return { ok: true, coll: name, docs: docs, next: skip + docs.length, total: total, done: skip + docs.length >= total };
  }
  if (what === 'import') {                       // restaurar desde un archivo, por trozos
    const name = String(body.coll || '');
    if (BACKUP_COLLS.indexOf(name) === -1 || !Array.isArray(body.docs)) return { ok: false, error: 'coll' };
    if (body.pre) await makeSnapshot(admin.username, 'Automática · antes de restaurar archivo');
    const col = db.collection(name);
    if (body.reset) await col.deleteMany({});
    const ops = body.docs.filter(d => d && typeof d._id === 'string').map(d => ({ replaceOne: { filter: { _id: d._id }, replacement: d, upsert: true } }));
    if (ops.length) await col.bulkWrite(ops, { ordered: false });
    return { ok: true, n: ops.length };
  }
  return { ok: false, error: 'op' };
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    if (req.method === 'GET') {
      const key = String((req.query && req.query.key) || '');
      if (!/^[A-Za-z0-9:_-]{1,60}$/.test(key)) return res.status(400).json({ ok: false });
      const value = await getValue(key);
      return res.status(200).json({ ok: true, value: value });
    }
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      if (body.action === 'setRole') {
        const ok = await setRole(body);
        return res.status(ok ? 200 : 403).json({ ok: ok });
      }
      if (body.action === 'setSiteTheme') {
        const ok = await setSiteTheme(body);
        return res.status(ok ? 200 : 403).json({ ok: ok });
      }
      if (body.action === 'walletGet') { const r = await walletGet(body); return res.status(r.ok ? 200 : 403).json(r); }
      if (body.action === 'walletDaily') { const r = await walletDaily(body); return res.status(r.ok ? 200 : 403).json(r); }
      if (body.action === 'walletTransfer') { const r = await walletTransfer(body); return res.status(r.ok ? 200 : 400).json(r); }
      if (body.action === 'walletAdmin') { const r = await walletAdmin(body); return res.status(r.ok ? 200 : 403).json(r); }
      if (body.action === 'walletTop') { return res.status(200).json(await walletTop()); }
      if (body.action === 'betOdds') { return res.status(200).json(await betOdds()); }
      if (body.action === 'betPlace') { const r = await betPlace(body); return res.status(r.ok ? 200 : 400).json(r); }
      if (body.action === 'backup') { const r = await backupAction(body); return res.status(r.ok ? 200 : 403).json(r); }
      if (body.action === 'attendanceIps') {
        const result = await attendanceIps(body);
        return res.status(result.ok ? 200 : 403).json(result);
      }
      if (body.action === 'checkConn') {
        return res.status(200).json(await checkConnection(body, req));
      }
      if (body.action === 'login') {
        const ok = await recordLogin(body.username, req);
        return res.status(200).json({ ok: ok });
      }
      const key = String(body.key || '');
      if (!/^[A-Za-z0-9:_-]{1,60}$/.test(key) || typeof body.value !== 'string') return res.status(400).json({ ok: false });
      if (key === 'sitetheme') return res.status(403).json({ ok: false });
      await setValue(key, body.value, req);
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ ok: false });
  } catch (e) {
    console.error('HFA db error:', e && e.message);
    return res.status(500).json({ ok: false });
  }
};
