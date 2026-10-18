const { MongoClient } = require('mongodb');

// Si renombraste tu db.js anterior a api/_db-original.js, todo lo que este archivo no maneja
// (copias de seguridad, mantenimiento, tema, etc.) se le pasa a él, para no perder funciones.
let originalHandler = null;
try { originalHandler = require('./_db-original.js'); } catch (e) { originalHandler = null; }
const OWN_ACTIONS = ['login', 'auth', 'changePassword', 'resetPassword', 'privateAccounts', 'setRole', 'log', 'getLogs'];

const URL_ = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
let mongoClientPromise;

// Roles válidos. Se asignan SOLO desde MongoDB (campo "role" de la colección "accounts").
const ROLES = ['pendiente', 'admin', 'prueba_moderador', 'moderador', 'arbitro', 'dueno'];
// Prioridad cuando una cuenta tiene varios roles (el primero manda).
const ROLE_PRIORITY = ['admin', 'moderador', 'prueba_moderador', 'arbitro', 'dueno'];
const STAFF_ROLES = ['admin', 'moderador', 'prueba_moderador', 'arbitro'];

// Acepta cómo lo escribas en MongoDB: "Admin", "ADMINISTRADOR", "Árbitro", "Dueño de equipo",
// "prueba moderador", "sin rol"... y lo convierte al valor interno.
function normalizeRole(value) {
  let r = String(value == null ? '' : value).trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s-]+/g, '_');
  const alias = {
    administrador: 'admin', administradora: 'admin', admin: 'admin',
    moderador: 'moderador', moderadora: 'moderador', mod: 'moderador',
    prueba_moderador: 'prueba_moderador', prueba_de_moderador: 'prueba_moderador', moderador_prueba: 'prueba_moderador', prueba_mod: 'prueba_moderador',
    arbitro: 'arbitro', arbitra: 'arbitro',
    dueno: 'dueno', dueno_de_equipo: 'dueno', dueno_equipo: 'dueno', owner: 'dueno',
    pendiente: 'pendiente', sin_rol: 'pendiente', ninguno: 'pendiente', ''  : 'pendiente'
  };
  return alias[r] || (ROLES.indexOf(r) !== -1 ? r : 'pendiente');
}

function normalizeRoleList(list) {
  const set = (Array.isArray(list) ? list : []).map(normalizeRole).filter(r => r !== 'pendiente');
  return ROLE_PRIORITY.filter(r => set.indexOf(r) !== -1);
}

// Rol(es) reales de una cuenta. "role" (lo que pones en MongoDB) manda siempre;
// "roles" (varios roles guardados por el panel) solo vale si sigue coincidiendo con "role".
function resolveRoles(account) {
  const primary = normalizeRole(account && account.role);
  const stored = normalizeRoleList(account && account.roles);
  if (primary === 'pendiente') return { role: 'pendiente', roles: [] };
  if (stored.length && stored[0] === primary) return { role: primary, roles: stored };
  return { role: primary, roles: [primary] };
}

// Archivo opcional roles.json (en la raíz del proyecto): { "NombreHabbo": "admin", ... }
// Al desplegar, esos roles se aplican a las cuentas y se guardan en MongoDB.
function fileRoles() {
  try {
    const data = require('../roles.json');
    const map = {};
    Object.keys(data || {}).forEach(name => {
      const role = normalizeRole(data[name]);
      if (role !== 'pendiente') map[String(name).trim().toLowerCase()] = role;
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
      const role = normalizeRole(row.role);
      if (role !== 'pendiente') map[String(row._id).trim().toLowerCase()] = role;
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
      account.roles = [role];
      changes.push({ updateOne: { filter: { _id: String(account.username).toLowerCase() }, update: { $set: { role: role, roles: [role] } } } });
    }
  });
  if (changes.length) await collection.bulkWrite(changes);
}

// Datos que NUNCA salen en la lista pública de cuentas.
const PRIVATE_FIELDS = ['passHash', 'password', 'pass', 'ip', 'lastIp', 'ips', '_id'];
function publicAccount(account) {
  const out = {};
  Object.keys(account || {}).forEach(k => { if (PRIVATE_FIELDS.indexOf(k) === -1) out[k] = account[k]; });
  return out;
}
function sanitizeAccountsJson(value) {
  try {
    const list = JSON.parse(value);
    return Array.isArray(list) ? JSON.stringify(list.map(publicAccount)) : value;
  } catch (e) { return value; }
}
const HASH_RE = /^[0-9a-f]{64}$/;
const authAttempts = new Map();
function tooManyAttempts(key) {
  const now = Date.now();
  const list = (authAttempts.get(key) || []).filter(t => now - t < 10 * 60 * 1000);
  authAttempts.set(key, list);
  return list.length >= 10;
}
function noteAttempt(key) { const l = authAttempts.get(key) || []; l.push(Date.now()); authAttempts.set(key, l); }

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
    const newHash = fields.passHash;
    delete fields.passHash;
    delete fields.password;
    delete fields.role;
    delete fields.roles;
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
            passHash: HASH_RE.test(String(newHash || '')) ? newHash : '',
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
  try {
    const doc = await collection.findOne({ _id: id }, { projection: { role: 1, roles: 1, username: 1 } });
    const resolved = resolveRoles(doc || {});
    if (resolved.role !== 'pendiente') {
      await writeStaffLog({ user: (doc && doc.username) || id, role: resolved.role, event: 'Inició sesión', detail: 'Inicio de sesión desde la IP ' + (ip || 'desconocida'), ip: ip });
    }
  } catch (e) {}
  return true;
}


// ---------- LOGS de movimientos de los roles (colección "staff_logs") ----------
// Comprueba usuario + hash de contraseña contra MongoDB y devuelve la cuenta con su rol REAL
// (el rol nunca se toma de lo que diga el navegador).
async function authAccount(username, hash) {
  if (!process.env.MONGODB_URI) return { error: 'no_db' };
  const id = String(username || '').trim().toLowerCase();
  if (!/^[a-z0-9._-]{3,25}$/.test(id)) return { error: 'bad_user' };
  if (!hash) return { error: 'no_hash' };
  const doc = await (await mongoAccountsCollection()).findOne({ _id: id });
  if (!doc) return { error: 'no_account' };
  if (!doc.passHash || String(doc.passHash) !== String(hash)) return { error: 'bad_credentials' };
  const resolved = resolveRoles(doc);
  // roles.json y la colección role_assignments también pueden asignar el rol.
  const override = fileRoles()[id] || (await dbRoles([id]))[id];
  if (override) { resolved.role = override; resolved.roles = [override]; }
  return { id: id, username: doc.username || id, role: resolved.role, roles: resolved.roles };
}

async function writeStaffLog(entry) {
  try {
    await (await mongoDb()).collection('staff_logs').insertOne({
      at: new Date(),
      user: String(entry.user || '').slice(0, 40),
      role: String(entry.role || '').slice(0, 40),
      event: String(entry.event || '').slice(0, 60),
      detail: String(entry.detail || '').slice(0, 400),
      target: String(entry.target || '').slice(0, 40),
      ip: String(entry.ip || '').slice(0, 64)
    });
  } catch (e) {}
}

// Cambio de rol hecho desde el panel admin. Solo un admin válido puede hacerlo.
async function handleSetRole(body, req) {
  const admin = await authAccount(body.adminUser, body.adminHash);
  if (!admin || admin.error || admin.roles.indexOf('admin') === -1) return { status: 403, ok: false, reason: (admin && admin.error) || 'not_admin' };
  const targetId = String(body.username || '').trim().toLowerCase();
  if (!/^[a-z0-9._-]{3,25}$/.test(targetId)) return { status: 400, ok: false };
  const list = Array.isArray(body.roles) ? normalizeRoleList(body.roles) : normalizeRoleList([body.role]);
  const primary = list[0] || 'pendiente';
  const collection = await mongoAccountsCollection();
  const before = await collection.findOne({ _id: targetId }, { projection: { role: 1, roles: 1, username: 1 } });
  if (!before) return { status: 404, ok: false };
  await collection.updateOne({ _id: targetId }, { $set: { role: primary, roles: list } });
  const prev = resolveRoles(before).roles;
  await writeStaffLog({
    user: admin.username, role: admin.role, event: 'Cambió roles', target: before.username || targetId,
    detail: (before.username || targetId) + ': ' + (prev.join(', ') || 'sin rol') + ' → ' + (list.join(', ') || 'sin rol'),
    ip: clientIp(req)
  });
  return { status: 200, ok: true, role: primary, roles: list };
}

// Un movimiento que hace una persona con rol (partido, acta, equipo, noticia...).
async function handleStaffLog(body, req) {
  const who = await authAccount(body.username, body.hash);
  if (!who || who.error || who.role === 'pendiente') return { status: 403, ok: false, reason: (who && who.error) || 'no_role' };
  await writeStaffLog({
    user: who.username, role: who.role, event: body.event, detail: body.detail, target: body.target, ip: clientIp(req)
  });
  return { status: 200, ok: true };
}

// Inicio de sesión: la comprobación de la contraseña se hace aquí, nunca en el navegador.
async function handleAuth(body, req) {
  const id = String(body.username || '').trim().toLowerCase();
  const throttleKey = clientIp(req) + '|' + id;
  if (tooManyAttempts(throttleKey)) return { status: 429, ok: false, reason: 'too_many' };
  const who = await authAccount(body.username, body.hash);
  if (!who || who.error) {
    noteAttempt(throttleKey);
    return { status: 200, ok: false, reason: (who && who.error) === 'no_account' ? 'no_account' : 'bad_credentials' };
  }
  const doc = await (await mongoAccountsCollection()).findOne({ _id: who.id });
  const account = publicAccount(doc || {});
  account.role = who.role;
  account.roles = who.roles;
  try { await recordLogin(who.id, req); } catch (e) {}
  return { status: 200, ok: true, account: account };
}

// Cambio de contraseña propio (pide la contraseña actual).
async function handleChangePassword(body) {
  if (!HASH_RE.test(String(body.newHash || ''))) return { status: 400, ok: false };
  const who = await authAccount(body.username, body.oldHash);
  if (!who || who.error) return { status: 403, ok: false, reason: 'bad_credentials' };
  await (await mongoAccountsCollection()).updateOne({ _id: who.id }, { $set: { passHash: body.newHash } });
  await writeStaffLog({ user: who.username, role: who.role, event: 'Cambió su contraseña', detail: '' });
  return { status: 200, ok: true };
}

// Restablecer la contraseña de otra persona: solo admin.
async function handleResetPassword(body, req) {
  if (!HASH_RE.test(String(body.newHash || ''))) return { status: 400, ok: false };
  const admin = await authAccount(body.adminUser, body.adminHash);
  if (!admin || admin.error || admin.roles.indexOf('admin') === -1) return { status: 403, ok: false };
  const targetId = String(body.username || '').trim().toLowerCase();
  const res = await (await mongoAccountsCollection()).updateOne({ _id: targetId }, { $set: { passHash: body.newHash } });
  if (!res.matchedCount) return { status: 404, ok: false };
  await writeStaffLog({ user: admin.username, role: admin.role, event: 'Restableció una contraseña', target: targetId, detail: 'Cuenta: ' + targetId, ip: clientIp(req) });
  return { status: 200, ok: true };
}

// IPs de las cuentas: solo admin y moderadores (panel de IPs).
async function handlePrivateAccounts(body) {
  const who = await authAccount(body.adminUser, body.adminHash);
  if (!who || who.error || !(who.roles.indexOf('admin') !== -1 || who.roles.indexOf('moderador') !== -1 || who.roles.indexOf('prueba_moderador') !== -1)) return { status: 403, ok: false };
  const rows = await (await mongoAccountsCollection()).find({}, { projection: { _id: 0, username: 1, ip: 1, lastIp: 1, ips: 1 } }).toArray();
  return { status: 200, ok: true, accounts: rows };
}

// ---------- Quién hace la petición (cabeceras x-hfa-user / x-hfa-hash) ----------
async function requester(req) {
  try {
    const u = req && req.headers && req.headers['x-hfa-user'];
    const h = req && req.headers && req.headers['x-hfa-hash'];
    if (!u || !h) return null;
    const who = await authAccount(decodeURIComponent(String(u)), String(h));
    return who && !who.error ? who : null;
  } catch (e) { return null; }
}
const PUBLIC_KEYS = ['divisions', 'teams', 'matches', 'tournaments', 'sponsors', 'news', 'maintenance', 'competition', 'palmares', 'cups',
  'achievements', 'achievementPins', 'achievementFeed', 'profileComments', 'siteTheme', 'theme'];
// Solo personal con rol puede escribir estas claves.
const STAFF_WRITE_KEYS = ['news', 'sponsors', 'competition', 'palmares', 'tournaments', 'cups', 'divisions'];
function isOfferMine(offer, who) {
  const me = String(who.username || '').toLowerCase();
  return String(offer && offer.player || '').toLowerCase() === me || String(offer && offer.ownerUsername || '').toLowerCase() === me;
}
function parseList(text) { try { const v = JSON.parse(text); return Array.isArray(v) ? v : []; } catch (e) { return []; } }

// Lectura de una clave con sus reglas de privacidad.
async function readKey(key, req) {
  if (key === 'offers') {
    const who = await requester(req);
    if (!who) return '[]';
    const all = parseList(await getValue('offers'));
    return JSON.stringify(who.roles.indexOf('admin') !== -1 ? all : all.filter(o => isOfferMine(o, who)));
  }
  if (key === 'userRoles') {
    const who = await requester(req);
    return who && who.roles.indexOf('admin') !== -1 ? getValue(key) : '{}';
  }
  return getValue(key);
}

// Escritura de una clave: hay que haber iniciado sesión (salvo registrarse en "accounts").
async function writeKey(key, value, req) {
  if (typeof value !== 'string' || value.length > 4 * 1024 * 1024) return { status: 400, ok: false };
  if (key === 'accounts') { await setValue(key, value, req); return { status: 200, ok: true }; }
  const who = await requester(req);
  if (!who) return { status: 403, ok: false, reason: 'login_required' };
  const isAdmin = who.roles.indexOf('admin') !== -1;
  const isStaff = who.roles.some(r => STAFF_ROLES.indexOf(r) !== -1);
  if (key === 'userRoles' && !isAdmin) return { status: 403, ok: false, reason: 'not_admin' };
  if (STAFF_WRITE_KEYS.indexOf(key) !== -1 && !isStaff) return { status: 403, ok: false, reason: 'not_staff' };
  if (key === 'offers' && !isAdmin) {
    // Cada persona solo ve sus ofertas, así que se fusiona sin borrar las de los demás.
    const incoming = parseList(value).filter(o => isOfferMine(o, who));
    const current = parseList(await getValue('offers'));
    const merged = current.filter(o => !isOfferMine(o, who)).concat(incoming);
    await setValue('offers', JSON.stringify(merged), req);
    return { status: 200, ok: true };
  }
  await setValue(key, value, req);
  return { status: 200, ok: true };
}

// Lectura de logs: solo administradores.
async function handleGetLogs(body) {
  const admin = await authAccount(body.adminUser, body.adminHash);
  if (!admin || admin.error) return { status: 403, ok: false, reason: (admin && admin.error) || 'bad_credentials' };
  if (admin.roles.indexOf('admin') === -1) return { status: 403, ok: false, reason: 'not_admin', role: admin.role };
  const filter = {};
  const roleFilter = normalizeRole(body.role);
  if (body.role && body.role !== 'all' && roleFilter !== 'pendiente') filter.role = roleFilter;
  if (body.user) filter.user = String(body.user).slice(0, 40);
  const limit = Math.max(1, Math.min(Number(body.limit) || 200, 500));
  const rows = await (await mongoDb()).collection('staff_logs').find(filter, { projection: { _id: 0 } }).sort({ at: -1 }).limit(limit).toArray();
  return { status: 200, ok: true, logs: rows.map(r => ({ ...r, at: r.at instanceof Date ? r.at.toISOString() : r.at })) };
}

async function getMongoAccounts() {
  const collection = await mongoAccountsCollection();
  const accounts = await collection.find({}, { projection: { _id: 0 } }).sort({ username: 1 }).toArray();
  if (accounts.length) {
    // Si alguien escribe un rol mal en MongoDB, la web lo trata como "sin rol".
    try { await applyFileRoles(collection, accounts); } catch (e) {}
    accounts.forEach(account => {
      const resolved = resolveRoles(account);
      account.role = resolved.role;
      account.roles = resolved.roles;
    });
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
    if (key === 'accounts') return sanitizeAccountsJson(await getMongoAccounts());
    const document = await (await mongoCollection()).findOne({ _id: 'hfa:' + key }, { projection: { value: 1 } });
    return document ? document.value : null;
  }
  if (URL_ && TOKEN) {
    const value = await redis(['GET', 'hfa:' + key]);
    if (value === undefined) return null;
    return key === 'accounts' && typeof value === 'string' ? sanitizeAccountsJson(value) : value;
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

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    if (req.method === 'GET') {
      const key = String((req.query && req.query.key) || '');
      if (!/^[A-Za-z0-9:_-]{1,60}$/.test(key)) return res.status(400).json({ ok: false });
      const known = key === 'accounts' || key === 'offers' || key === 'userRoles' || PUBLIC_KEYS.indexOf(key) !== -1;
      if (!known) {
        if (originalHandler) return originalHandler(req, res);
        return res.status(200).json({ ok: true, value: null });
      }
      const value = await readKey(key, req);
      return res.status(200).json({ ok: true, value: value });
    }
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      if (originalHandler && body.action && OWN_ACTIONS.indexOf(body.action) === -1) {
        return originalHandler(req, res);
      }
      if (body.action === 'login') {
        const ok = await recordLogin(body.username, req);
        return res.status(200).json({ ok: ok });
      }
      if (body.action === 'auth') {
        const r = await handleAuth(body, req);
        return res.status(r.status).json(r);
      }
      if (body.action === 'changePassword') {
        const r = await handleChangePassword(body);
        return res.status(r.status).json(r);
      }
      if (body.action === 'resetPassword') {
        const r = await handleResetPassword(body, req);
        return res.status(r.status).json(r);
      }
      if (body.action === 'privateAccounts') {
        const r = await handlePrivateAccounts(body);
        return res.status(r.status).json(r);
      }
      if (body.action === 'setRole') {
        const r = await handleSetRole(body, req);
        return res.status(r.status).json(r);
      }
      if (body.action === 'log') {
        const r = await handleStaffLog(body, req);
        return res.status(r.status).json(r);
      }
      if (body.action === 'getLogs') {
        const r = await handleGetLogs(body);
        return res.status(r.status).json(r);
      }
      const key = String(body.key || '');
      if (body.action || !/^[A-Za-z0-9:_-]{1,60}$/.test(key) || typeof body.value !== 'string') return res.status(400).json({ ok: false });
      const written = await writeKey(key, body.value, req);
      return res.status(written.status).json(written);
    }
    return res.status(405).json({ ok: false });
  } catch (e) {
    return res.status(500).json({ ok: false, reason: 'server_error' });
  }
};
