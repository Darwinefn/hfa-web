// Base de datos compartida (Upstash Redis). SOLO úsalo si aún no tienes un /api/db funcionando.
// Vercel → Storage / Marketplace → Upstash Redis → conectar al proyecto (crea las variables solo).
const URL_ = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

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

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!URL_ || !TOKEN) return res.status(500).json({ ok: false, error: 'Falta conectar Upstash Redis' });
  try {
    if (req.method === 'GET') {
      const key = String((req.query && req.query.key) || '');
      if (!/^[A-Za-z0-9:_-]{1,60}$/.test(key)) return res.status(400).json({ ok: false });
      const value = await redis(['GET', 'hfa:' + key]);
      return res.status(200).json({ ok: true, value: value === undefined ? null : value });
    }
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const key = String(body.key || '');
      if (!/^[A-Za-z0-9:_-]{1,60}$/.test(key) || typeof body.value !== 'string') return res.status(400).json({ ok: false });
      await redis(['SET', 'hfa:' + key, body.value]);
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ ok: false });
  } catch (e) {
    return res.status(500).json({ ok: false });
  }
};
