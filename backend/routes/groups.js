const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { createGroup, getGroup, addGroupMember, getUserGroups } = require('../services/dbService');

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

router.post('/', authMiddleware, async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Missing name' } });
  
  const id = `group-${Date.now()}`;
  const inviteCode = generateCode();
  await createGroup(id, name, inviteCode, req.userId);
  res.json({ success: true, data: { id, name, inviteCode } });
});

router.get('/me', authMiddleware, async (req, res) => {
  const groups = await getUserGroups(req.userId);
  res.json({ success: true, data: groups });
});

router.get('/:id', authMiddleware, async (req, res) => {
  const group = await getGroup(req.params.id);
  if (!group) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Group not found' } });
  if (!group.members.includes(req.userId)) return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Not a member' } });
  res.json({ success: true, data: group });
});

router.post('/:id/join', authMiddleware, async (req, res) => {
  const { inviteCode } = req.body;
  const group = await getGroup(req.params.id);
  if (!group) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Group not found' } });
  if (group.inviteCode !== inviteCode) return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Invalid invite code' } });
  
  await addGroupMember(req.params.id, req.userId);
  res.json({ success: true, data: { message: 'Joined group', groupId: req.params.id } });
});

module.exports = router;
