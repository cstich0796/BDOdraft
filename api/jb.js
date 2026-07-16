const NPOINT_ID = 'abd5efd56028a3ebc5ef';
const BASE = `https://api.npoint.io/${NPOINT_ID}`;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  try {
    if (req.method === 'GET') {
      const r = await fetch(BASE);
      const data = await r.json();
      res.status(200).json(data);

    } else if (req.method === 'PUT') {
      const incoming = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      // Read current state
      const getR = await fetch(BASE);
      const current = await getR.json();

      // Merge lobby granularly so concurrent writers (e.g. two people
      // readying up or saving keepers within the same moment) don't
      // clobber each other's changes — union ready[], merge keepers{} key
      // by key, and only overwrite draftOpen if the incoming value says so.
      const curLobby = current.lobby || {ready:[],keepers:{},draftOpen:false};
      const incLobby = incoming.lobby;
      let mergedLobby = curLobby;
      if (incLobby !== undefined) {
        const readySet = new Set([...(curLobby.ready||[]), ...(incLobby.ready||[])]);
        mergedLobby = {
          ready: Array.from(readySet),
          keepers: Object.assign({}, curLobby.keepers || {}, incLobby.keepers || {}),
          draftOpen: incLobby.draftOpen !== undefined ? incLobby.draftOpen : (curLobby.draftOpen || false),
        };
      }

      const merged = {
        claims: incoming.claims !== undefined ? incoming.claims : (current.claims || {}),
        lobby:  mergedLobby,
        draft:  incoming.draft  !== undefined ? incoming.draft  : (current.draft  || {picks:[],cur:0}),
      };
      const putR = await fetch(BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(merged)
      });
      res.status(200).json({ ok: putR.ok });
    }
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
}
