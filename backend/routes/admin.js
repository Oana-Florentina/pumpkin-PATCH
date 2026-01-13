const express = require('express');
const router = express.Router();
const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

const lambda = new LambdaClient({ region: 'us-east-1' });

const ADMIN_EMAIL = 'briana.maftei@gmail.com';
let verificationCodes = {};

router.post('/request-code', async (req, res) => {
  const { email } = req.body;
  
  if (email !== ADMIN_EMAIL) {
    return res.status(403).json({ success: false, error: 'Unauthorized' });
  }
  
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  verificationCodes[email] = { code, expires: Date.now() + 5 * 60 * 1000 };
  
  console.log(`Admin code for ${email}: ${code}`);
  
  res.json({ success: true, message: 'Code sent (check Lambda logs)' });
});

router.post('/verify-code', (req, res) => {
  const { email, code } = req.body;
  
  const stored = verificationCodes[email];
  if (!stored || stored.code !== code || Date.now() > stored.expires) {
    return res.status(401).json({ success: false, error: 'Invalid or expired code' });
  }
  
  delete verificationCodes[email];
  
  const token = Buffer.from(JSON.stringify({ email, admin: true, exp: Date.now() + 24 * 60 * 60 * 1000 })).toString('base64');
  res.json({ success: true, token });
});

router.post('/sync-phobias', async (req, res) => {
  try {
    const response = await lambda.send(new InvokeCommand({
      FunctionName: 'phoa-sync-phobias',
      InvocationType: 'RequestResponse'
    }));
    
    const result = JSON.parse(Buffer.from(response.Payload).toString());
    res.json({ success: true, data: result });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

router.post('/generate-rules', async (req, res) => {
  try {
    const response = await lambda.send(new InvokeCommand({
      FunctionName: 'phoa-generate-rules',
      InvocationType: 'Event'
    }));
    
    res.json({ success: true, message: 'Rules generation started (async)' });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

router.post('/test-scenario', async (req, res) => {
  const { phobias, context, groupMessages } = req.body;
  
  const cleanContext = {};
  Object.keys(context).forEach(key => {
    if (context[key] !== '' && context[key] !== null && context[key] !== undefined) {
      cleanContext[key] = context[key];
    }
  });
  
  try {
    const response = await lambda.send(new InvokeCommand({
      FunctionName: 'phoa-rules-engine',
      Payload: JSON.stringify({ phobias, context: cleanContext, groupMessages })
    }));
    
    const result = JSON.parse(Buffer.from(response.Payload).toString());
    res.json({ success: true, context: cleanContext, alerts: result.alerts });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

module.exports = router;
