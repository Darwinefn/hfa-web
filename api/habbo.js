// Consulta el lema (motto) público de un usuario de Habbo.es para recuperar contraseña.
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const name = String((req.query && req.query.name) || '').trim();
  if (!/^[A-Za-z0-9._-]{3,25}$/.test(name)) return res.status(400).json({ ok: false });
  try {
    const r = await fetch('https://www.habbo.es/api/public/users?name=' + encodeURIComponent(name), {
      headers: { 'User-Agent': 'Mozilla/5.0 (HFA)', Accept: 'application/json' }
    });
    if (!r.ok) return res.status(502).json({ ok: false });
    const d = await r.json();
    return res.status(200).json({ ok: true, motto: String((d && d.motto) || '') });
  } catch (e) {
    return res.status(502).json({ ok: false });
  }
};
