// Sincronización del estado de Atlas entre dispositivos.
// Guarda un JSON por código de sincronización en un Redis REST (Upstash / Vercel KV).
// El cliente envía solo un hash derivado del código (x-sync-key); el código nunca llega al servidor.
const MAX_BYTES = 900 * 1024;

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return res.status(503).json({ error: 'storage_not_configured' });

  const hash = String(req.headers['x-sync-key'] || '');
  if (!/^[a-f0-9]{64}$/.test(hash)) return res.status(401).json({ error: 'bad_key' });
  const key = `atlas:state:${hash}`;
  const redis = async command => {
    const r = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(command) });
    if (!r.ok) throw new Error(`redis_${r.status}`);
    return (await r.json()).result;
  };

  try {
    if (req.method === 'GET') {
      const raw = await redis(['GET', key]);
      if (raw == null) return res.status(404).json({ error: 'empty' });
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).send(raw);
    }
    if (req.method === 'PUT') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (!body || typeof body.state !== 'object' || typeof body.updatedAt !== 'string') return res.status(400).json({ error: 'bad_body' });
      const payload = JSON.stringify({ state: body.state, updatedAt: body.updatedAt });
      if (Buffer.byteLength(payload) > MAX_BYTES) return res.status(413).json({ error: 'too_large' });
      const current = await redis(['GET', key]);
      if (current != null) {
        const remote = JSON.parse(current);
        if (remote.updatedAt > body.updatedAt) return res.status(409).send(current);
      }
      await redis(['SET', key, payload]);
      return res.status(200).json({ ok: true });
    }
    res.setHeader('Allow', 'GET, PUT');
    return res.status(405).json({ error: 'method' });
  } catch (e) {
    return res.status(502).json({ error: 'storage_error' });
  }
};
