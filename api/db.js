// Almacenamiento compartido para la web HFA (Vercel Serverless Function).
// Guarda cada "clave" (accounts, teams, matches...) como texto JSON en Upstash Redis.
// Necesita las variables de entorno que crea la integración Upstash Redis de Vercel:
//   KV_REST_API_URL y KV_REST_API_TOKEN  (o UPSTASH_REDIS_REST_URL y UPSTASH_REDIS_REST_TOKEN)

const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

const ALLOWED_KEYS = new Set([
  'accounts', 'divisions', 'teams', 'matches', 'tournaments', 'sponsors',
  'news', 'competition', 'offers', 'palmares', 'profileComments'
]);
const MAX_VALUE_LENGTH = 900000; // ~0,9 MB por clave (límite de Upstash: 1 MB por petición)

async function redis(command) {
  const response = await fetch(REDIS_URL, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + REDIS_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(command)
  });
  const data = await response.json();
  if (!response.ok || data.error) throw new Error(data.error || 'Error de Redis');
  return data.result;
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!REDIS_URL || !REDIS_TOKEN) {
    return res.status(503).json({ ok: false, error: 'Base de datos no configurada' });
  }
  try {
    if (req.method === 'GET') {
      const key = String(req.query.key || '');
      if (!ALLOWED_KEYS.has(key)) return res.status(400).json({ ok: false, error: 'Clave no permitida' });
      const value = await redis(['GET', 'hfa:' + key]);
      return res.status(200).json({ ok: true, value: value === undefined ? null : value });
    }
    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') body = JSON.parse(body);
      const key = String((body && body.key) || '');
      const value = body && body.value;
      if (!ALLOWED_KEYS.has(key)) return res.status(400).json({ ok: false, error: 'Clave no permitida' });
      if (typeof value !== 'string' || value.length > MAX_VALUE_LENGTH) {
        return res.status(400).json({ ok: false, error: 'Valor no válido o demasiado grande' });
      }
      JSON.parse(value); // debe ser JSON válido
      await redis(['SET', 'hfa:' + key, value]);
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ ok: false, error: 'Método no permitido' });
  } catch (error) {
    return res.status(500).json({ ok: false, error: 'Error del servidor' });
  }
};
