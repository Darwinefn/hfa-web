
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

async function getMongoAccounts() {
  const collection = await mongoAccountsCollection();
  const accounts = await collection.find({}, { projection: { _id: 0 } }).sort({ username: 1 }).toArray();
  if (accounts.length) {
    // Si alguien escribe un rol mal en MongoDB, la web lo trata como "sin rol".
    accounts.forEach(account => { if (ROLES.indexOf(account.role) === -1) account.role = 'pendiente'; });
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
      if (body.action === 'login') {
        const ok = await recordLogin(body.username, req);
        return res.status(200).json({ ok: ok });
      }
      const key = String(body.key || '');
      if (!/^[A-Za-z0-9:_-]{1,60}$/.test(key) || typeof body.value !== 'string') return res.status(400).json({ ok: false });
      await setValue(key, body.value, req);
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ ok: false });
  } catch (e) {
    console.error('HFA db error:', e && e.message);
    return res.status(500).json({ ok: false });
  }
};
