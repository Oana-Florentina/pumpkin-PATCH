const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { getUserPhobias, addUserPhobia, removeUserPhobia } = require('../services/dbService');

router.get('/me/phobias', authMiddleware, async (req, res) => {
  const phobias = await getUserPhobias(req.userId);
  res.json({ success: true, data: phobias });
});

router.post('/me/phobias', authMiddleware, async (req, res) => {
  const { phobiaId } = req.body;
  if (!phobiaId) return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Missing phobiaId' } });
  await addUserPhobia(req.userId, phobiaId);
  res.json({ success: true, data: { message: 'Phobia added', phobiaId } });
});

router.delete('/me/phobias/:id', authMiddleware, async (req, res) => {
  await removeUserPhobia(req.userId, req.params.id);
  res.json({ success: true, data: { message: 'Phobia removed', phobiaId: req.params.id } });
});

router.get('/me/alerts', authMiddleware, (req, res) => {
  res.json({ success: true, data: [] });
});

module.exports = router;
