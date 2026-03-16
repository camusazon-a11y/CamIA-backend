const express = require('express');
const cors    = require('cors');
const fetch   = (...a) => import('node-fetch').then(({default:f}) => f(...a));

const app = express();
app.use(cors()); // autorise tous les origines
app.use(express.json());

const PORT = process.env.PORT || 3000;
const REPLICATE_BASE = 'https://api.replicate.com/v1';

// ── Middleware : vérifie que la clé Replicate est présente ──
function needKey(req, res, next) {
  const key = req.headers['x-replicate-key'];
  if (!key) return res.status(401).json({ error: 'Clé Replicate manquante (header x-replicate-key)' });
  req.repKey = key;
  next();
}

// ── POST /predict  →  créer une prédiction Replicate ──
app.post('/predict', needKey, async (req, res) => {
  try {
    const r = await fetch(`${REPLICATE_BASE}/predictions`, {
      method:  'POST',
      headers: { 'Authorization': `Bearer ${req.repKey}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify(req.body),
    });
    const data = await r.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── GET /predict/:id  →  vérifier le statut d'une prédiction ──
app.get('/predict/:id', needKey, async (req, res) => {
  try {
    const r = await fetch(`${REPLICATE_BASE}/predictions/${req.params.id}`, {
      headers: { 'Authorization': `Bearer ${req.repKey}`, 'Content-Type': 'application/json' },
    });
    const data = await r.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Health check ──
app.get('/', (_, res) => res.json({ status: 'CamIA Backend OK 🚀', version: '1.0' }));

app.listen(PORT, () => console.log(`CamIA backend démarré sur le port ${PORT}`));
