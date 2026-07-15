const KEY = '$2a$10$7k5GyBi5JWWRL/3kS6pYHOSII3d7rCU0DR2hIo4T2/8N.duZ9URf6';
const BIN = 'https://api.jsonbin.io/v3/b/69d16877856a682189fd0ec7';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const headers = {
    'X-Master-Key': KEY,
    'X-Bin-Meta': 'false',
    'Content-Type': 'application/json',
  };

  try {
    if (req.method === 'GET') {
      // Only return draft-relevant keys to keep payload small
      const r = await fetch(BIN + '/latest', { headers, cache: 'no-store' });
      const full = await r.json();
      // Return only what the draft app needs
      const draft = {
        claims: full.claims || {},
        lobby:  full.lobby  || { ready: [], keepers: {}, draftOpen: false },
        draft:  full.draft  || { picks: [], cur: 0 },
      };
      res.status(200).json(draft);
    } else if (req.method === 'PUT') {
      // Read current bin, merge only draft keys, write back
      const getR = await fetch(BIN + '/latest', { headers, cache: 'no-store' });
      const current = await getR.json();
      const incoming = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      // Merge: only update claims/lobby/draft, preserve everything else (league data)
      const merged = Object.assign({}, current, {
        claims: incoming.claims !== undefined ? incoming.claims : (current.claims || {}),
        lobby:  incoming.lobby  !== undefined ? incoming.lobby  : (current.lobby  || {}),
        draft:  incoming.draft  !== undefined ? incoming.draft  : (current.draft  || {}),
      });
      const putR = await fetch(BIN, { method: 'PUT', headers, body: JSON.stringify(merged) });
      const data = await putR.json();
      res.status(putR.status).json({ ok: putR.ok, status: putR.status });
    }
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
}
