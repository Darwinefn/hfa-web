
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

// Modo mantenimiento: lo activa solo un administrador. Mientras está activo, la web solo se muestra a los admins.
async function setMaintenance(body) {
  const admin = await authAdmin(body);
  if (!admin) return false;
  const enabled = !!(body && body.enabled);
  const message = String((body && body.message) || '').trim().slice(0, 220);
  await setValue('maintenance', JSON.stringify({ enabled: enabled, message: message, by: admin.username, at: new Date().toISOString() }), null);
  return true;
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
   Copias de seguridad
   Todo se valida en el servidor: el navegador nunca decide saldos ni cuotas.
   Requiere MongoDB (MONGODB_URI).
   ===================================================================== */
const crypto = require('crypto');
const BACKUP_COLLS = ['app_data', 'accounts', 'role_assignments'];

function rid() { return Date.now().toString(36) + crypto.randomBytes(4).toString('hex'); }
function nowIso() { return new Date().toISOString(); }
function unwrap(r) { return r && Object.prototype.hasOwnProperty.call(r, 'value') && Object.prototype.hasOwnProperty.call(r, 'ok') ? r.value : r; }
async function dbc(name) { return (await mongoDb()).collection(name); }

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

/* ---------- Datos de vídeos de YouTube (API Data v3 con YOUTUBE_API_KEY; sin clave solo título y canal) ---------- */
const ytCache = new Map();
async function ytInfo(body) {
  const id = String((body && body.id) || '');
  if (!/^[A-Za-z0-9_-]{11}$/.test(id)) return { ok: false, error: 'id' };
  const hit = ytCache.get(id);
  if (hit && Date.now() - hit.t < 30 * 60 * 1000) return hit.v;
  let out = { ok: true, id: id, title: '', channel: '', views: null, duration: '', publishedAt: '', full: false };
  try {
    const key = process.env.YOUTUBE_API_KEY;
    if (key) {
      const r = await fetch('https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=' + id + '&key=' + encodeURIComponent(key));
      const j = await r.json();
      const it = j && j.items && j.items[0];
      if (it) {
        out = { ok: true, id: id, title: it.snippet.title || '', channel: it.snippet.channelTitle || '', views: it.statistics && it.statistics.viewCount != null ? Number(it.statistics.viewCount) : null, duration: it.contentDetails.duration || '', publishedAt: it.snippet.publishedAt || '', full: true };
      }
    }
    if (!out.title) {
      const r = await fetch('https://www.youtube.com/oembed?format=json&url=' + encodeURIComponent('https://www.youtube.com/watch?v=' + id));
      if (r.ok) { const j = await r.json(); out.title = j.title || ''; out.channel = j.author_name || ''; }
    }
  } catch (e) {}
  ytCache.set(id, { t: Date.now(), v: out });
  return out;
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
      if (body.action === 'setMaintenance') {
        const ok = await setMaintenance(body);
        return res.status(ok ? 200 : 403).json({ ok: ok });
      }
      if (body.action === 'setSiteTheme') {
        const ok = await setSiteTheme(body);
        return res.status(ok ? 200 : 403).json({ ok: ok });
      }
      if (body.action === 'ytInfo') { return res.status(200).json(await ytInfo(body)); }
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
      if (key === 'sitetheme' || key === 'maintenance') return res.status(403).json({ ok: false });
      await setValue(key, body.value, req);
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ ok: false });
  } catch (e) {
    console.error('HFA db error:', e && e.message);
    return res.status(500).json({ ok: false });
  }
};
