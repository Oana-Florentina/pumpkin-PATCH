const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

const userPhobias = {};
const userAlerts = {};

router.get('/me/phobias', authMiddleware, (req, res) => {
  const phobias = userPhobias[req.userId] || [];
  res.json({ success: true, data: phobias });
});

router.post('/me/phobias', authMiddleware, (req, res) => {
  const { phobiaId } = req.body;
  if (!phobiaId) {
    return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Missing phobiaId' } });
  }
  if (!userPhobias[req.userId]) userPhobias[req.userId] = [];
  if (!userPhobias[req.userId].find(p => p.id === phobiaId)) {
    userPhobias[req.userId].push({ id: phobiaId, addedAt: new Date().toISOString() });
  }
  res.json({ success: true, data: { message: 'Phobia added', phobiaId } });
});

router.delete('/me/phobias/:id', authMiddleware, (req, res) => {
  if (userPhobias[req.userId]) {
    userPhobias[req.userId] = userPhobias[req.userId].filter(p => p.id !== req.params.id);
  }
  res.json({ success: true, data: { message: 'Phobia removed', phobiaId: req.params.id } });
});

router.get('/me/alerts', authMiddleware, (req, res) => {
  const alerts = userAlerts[req.userId] || [];
  res.json({ success: true, data: alerts });
});

module.exports = router;
