const express = require('express');
const router = express.Router();

// Stocare temporară în memorie (va fi înlocuită cu DB)
const userPhobias = {};
const userAlerts = {};

// GET /api/users/me/phobias
router.get('/me/phobias', (req, res) => {
  const userId = req.headers['x-user-id'] || 'demo-user';
  const phobias = userPhobias[userId] || [];
  res.json({ success: true, data: phobias });
});

// POST /api/users/me/phobias
router.post('/me/phobias', (req, res) => {
  const userId = req.headers['x-user-id'] || 'demo-user';
  const { phobiaId } = req.body;
  if (!phobiaId) {
    return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Missing phobiaId' } });
  }
  if (!userPhobias[userId]) userPhobias[userId] = [];
  if (!userPhobias[userId].find(p => p.id === phobiaId)) {
    userPhobias[userId].push({ id: phobiaId, addedAt: new Date().toISOString() });
  }
  res.json({ success: true, data: { message: 'Phobia added', phobiaId } });
});

// DELETE /api/users/me/phobias/:id
router.delete('/me/phobias/:id', (req, res) => {
  const userId = req.headers['x-user-id'] || 'demo-user';
  if (userPhobias[userId]) {
    userPhobias[userId] = userPhobias[userId].filter(p => p.id !== req.params.id);
  }
  res.json({ success: true, data: { message: 'Phobia removed', phobiaId: req.params.id } });
});

// GET /api/users/me/alerts
router.get('/me/alerts', (req, res) => {
  const userId = req.headers['x-user-id'] || 'demo-user';
  const alerts = userAlerts[userId] || [];
  res.json({ success: true, data: alerts });
});

module.exports = router;
