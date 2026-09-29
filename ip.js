// Devuelve la IP real del visitante (Vercel la pone en x-forwarded-for).
module.exports = (req, res) => {
  const xf = req.headers['x-forwarded-for'];
  const ip = (xf ? String(xf).split(',')[0].trim() : '') ||
    String(req.headers['x-real-ip'] || '') ||
    (req.socket && req.socket.remoteAddress) || '';
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({ ok: true, ip });
};
