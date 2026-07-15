export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const { path, ids, type, season, ...rest } = req.query;

  // BATCH STATS MODE: /api/mlb?ids=660271,677800,...&type=season&season=2026
  if (ids) {
    const idList = ids.split(',').filter(Boolean);
    const yr = season || new Date().getFullYear();
    const results = {};
    await Promise.all(idList.map(async (mlbId) => {
      try {
        const statsType = type === 'monthly' ? 'byMonth' : 'season';
        const url = `https://statsapi.mlb.com/api/v1/people/${mlbId}/stats?stats=${statsType}&group=hitting&season=${yr}&sportId=1`;
        const r = await fetch(url);
        if (r.ok) results[mlbId] = await r.json();
      } catch(e) {}
    }));
    res.status(200).json(results);
    return;
  }

  // FULL STATS MODE: /api/mlb?path=stats&stats=season&group=hitting...
  if (!path) { res.status(400).json({ error: 'Missing path or ids' }); return; }
  const params = new URLSearchParams(rest).toString();
  const url = `https://statsapi.mlb.com/api/v1/${path}${params ? '?' + params : ''}`;
  try {
    const r = await fetch(url);
    const data = await r.json();
    res.status(200).json(data);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
}
