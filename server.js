const express = require('express');
const cors    = require('cors');
const path    = require('path');
const fetch   = (...a) => import('node-fetch').then(({default:f}) => f(...a));

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const REPLICATE_BASE = 'https://api.replicate.com/v1';

// ── Sert CamIA.html directement ──
app.use(express.static(path.join(__dirname, 'public')));
app.get('/app', (_, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// ── Middleware clé ──
function needKey(req, res, next) {
  const key = req.headers['x-replicate-key'];
  if (!key) return res.status(401).json({ error: 'Clé manquante' });
  req.repKey = key;
  next();
}

// ── POST /predict ──
app.post('/predict', needKey, async (req, res) => {
  try {
    const r = await fetch(`${REPLICATE_BASE}/predictions`, {
      method:  'POST',
      headers: { 'Authorization': `Bearer ${req.repKey}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify(req.body),
    });
    res.json(await r.json());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── GET /predict/:id ──
app.get('/predict/:id', needKey, async (req, res) => {
  try {
    const r = await fetch(`${REPLICATE_BASE}/predictions/${req.params.id}`, {
      headers: { 'Authorization': `Bearer ${req.repKey}`, 'Content-Type': 'application/json' },
    });
    res.json(await r.json());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Health ──
app.get('/', (_, res) => res.json({ status: 'CamIA Backend OK 🚀', version: '1.0' }));

app.listen(PORT, () => console.log(`CamIA sur le port ${PORT}`));
