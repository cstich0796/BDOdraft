const KEY = '$2a$10$7k5GyBi5JWWRL/3kS6pYHOSII3d7rCU0DR2hIo4T2/8N.duZ9URf6';
const BIN = 'https://api.jsonbin.io/v3/b/69d16877856a682189fd0ec7';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const headers = {
    'X-Master-Key': KEY,
    'X-Bin-Meta': 'false',
    'Content-Type': 'application/json'
  };

  try {
    if (req.method === 'GET') {
      const r = await fetch(BIN + '/latest', { headers });
      const data = await r.json();
      res.status(200).json(data);
    } else if (req.method === 'PUT') {
      const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      const r = await fetch(BIN, { method: 'PUT', headers, body });
      const data = await r.json();
      res.status(200).json(data);
    }
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
}
