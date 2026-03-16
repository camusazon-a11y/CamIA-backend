const express = require('express');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');
const fetch   = (...a) => import('node-fetch').then(({default:f}) => f(...a));

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const REPLICATE_BASE = 'https://api.replicate.com/v1';

// ── Sert CamIA ──
app.get('/app', (_, res) => {
  const files = ['index-4-3.html','index-4-3.txt','CamIA-new.html','index-4.html'];
  for(const f of files){
    const fp = path.join(__dirname, f);
    if(fs.existsSync(fp)){
      const content = fs.readFileSync(fp, 'utf8');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(content);
    }
  }
  res.status(404).send('Fichier CamIA non trouvé');
});

// ── /chat → proxy Anthropic ──
app.post('/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_KEY || '',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        system: "Tu es l'assistant IA de CamIA, application créative africaine créée par Camus Azon — Entrepreneur IA. Réponds en français avec Markdown : **gras**, ## titres, - listes. Sois concis et utile.",
        messages: messages
      })
    });
    const data = await r.json();
    const reply = data.content?.[0]?.text || "Désolé, je ne peux pas répondre pour l'instant.";
    res.json({ reply });
  } catch(e) {
    res.json({ reply: "Désolé, une erreur s'est produite. Réessayez !" });
  }
});

// ── Middleware clé Replicate ──
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
      method: 'POST',
      headers: { 'Authorization': `Bearer ${req.repKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
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

app.get('/', (_, res) => res.json({ status: 'CamIA Backend OK 🚀', version: '1.0' }));
app.listen(PORT, () => console.log(`CamIA sur le port ${PORT}`));
