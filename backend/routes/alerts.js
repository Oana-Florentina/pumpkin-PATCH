const express = require('express');
const router = express.Router();
const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

const lambda = new LambdaClient({ region: 'us-east-1' });

router.post('/', async (req, res) => {
  const { phobias, context, groupMessages } = req.body;
  
  try {
    const response = await lambda.send(new InvokeCommand({
      FunctionName: 'phoa-rules-engine',
      Payload: JSON.stringify({ phobias, context, groupMessages })
    }));
    
    const result = JSON.parse(Buffer.from(response.Payload).toString());
    res.json(result);
  } catch (err) {
    console.error('Rules engine error:', err.message);
    res.json({ success: false, alerts: [], error: err.message });
  }
});

module.exports = router;
