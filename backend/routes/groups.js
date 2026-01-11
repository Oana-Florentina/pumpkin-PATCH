const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

const groups = {};
const userGroups = {};

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Creează grup
router.post('/', authMiddleware, (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Missing name' } });
  
  const id = `group-${Date.now()}`;
  const inviteCode = generateCode();
  groups[id] = { id, name, inviteCode, ownerId: req.userId, members: [req.userId], createdAt: new Date().toISOString() };
  if (!userGroups[req.userId]) userGroups[req.userId] = [];
  userGroups[req.userId].push(id);
  
  res.json({ success: true, data: { id, name, inviteCode } });
});

// Grupurile mele
router.get('/me', authMiddleware, (req, res) => {
  const ids = userGroups[req.userId] || [];
  const data = ids.map(id => ({ id, name: groups[id]?.name })).filter(g => g.name);
  res.json({ success: true, data });
});

// Detalii grup
router.get('/:id', authMiddleware, (req, res) => {
  const group = groups[req.params.id];
  if (!group) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Group not found' } });
  if (!group.members.includes(req.userId)) return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Not a member' } });
  
  res.json({ success: true, data: group });
});

// Join grup
router.post('/:id/join', authMiddleware, (req, res) => {
  const { inviteCode } = req.body;
  const group = groups[req.params.id];
  if (!group) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Group not found' } });
  if (group.inviteCode !== inviteCode) return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Invalid invite code' } });
  
  if (!group.members.includes(req.userId)) {
    group.members.push(req.userId);
    if (!userGroups[req.userId]) userGroups[req.userId] = [];
    userGroups[req.userId].push(group.id);
  }
  res.json({ success: true, data: { message: 'Joined group', groupId: group.id } });
});

module.exports = router;
