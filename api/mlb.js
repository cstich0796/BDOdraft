export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const { path, ids, type, season, ...rest } = req.query;

  // FULL STATS MODE: /api/mlb?path=stats&stats=season&group=hitting...
  if (path) {
    const params = new URLSearchParams(rest).toString();
    const url = `https://statsapi.mlb.com/api/v1/${path}${params ? '?' + params : ''}`;
    try {
      const r = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      const data = await r.json();
      res.status(200).json(data);
    } catch(e) {
      res.status(500).json({ error: e.message });
    }
    return;
  }

  // BATCH ID MODE: /api/mlb?ids=660271,677800,...
  if (ids) {
    const idList = ids.split(',').filter(Boolean);
    const yr = season || new Date().getFullYear();
    const results = {};
    await Promise.all(idList.map(async (mlbId) => {
      try {
        const url = `https://statsapi.mlb.com/api/v1/people/${mlbId}/stats?stats=season&group=hitting&season=${yr}&sportId=1`;
        const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (r.ok) results[mlbId] = await r.json();
      } catch(e) {}
    }));
    res.status(200).json(results);
    return;
  }

  res.status(400).json({ error: 'Missing path or ids' });
}
