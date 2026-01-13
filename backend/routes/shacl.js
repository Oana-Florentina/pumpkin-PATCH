const express = require('express');
const router = express.Router();
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const db = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'us-east-1' }));

const PHOBIA_SHAPE = {
  required: ['id', 'name', 'description'],
  optional: ['trigger', 'image', 'possibleTreatment'],
  types: {
    id: 'string',
    name: 'string',
    description: 'string',
    trigger: 'string',
    image: 'string',
    possibleTreatment: 'array'
  }
};

const RULE_SHAPE = {
  required: ['phobiaId', 'phobiaName', 'sensorRules'],
  optional: ['mainTrigger'],
  types: {
    phobiaId: 'string',
    phobiaName: 'string',
    mainTrigger: 'string',
    sensorRules: 'array'
  },
  sensorRuleShape: {
    required: ['@type', 'name', 'value'],
    types: {
      '@type': 'PropertyValue',
      name: ['location_type', 'heart_rate', 'noise_level', 'temperature', 'altitude', 'weather_code', 'season', 'is_night']
    }
  }
};

function validatePhobia(phobia) {
  const errors = [];
  
  for (const field of PHOBIA_SHAPE.required) {
    if (!phobia[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }
  
  for (const [field, type] of Object.entries(PHOBIA_SHAPE.types)) {
    if (phobia[field]) {
      const actualType = Array.isArray(phobia[field]) ? 'array' : typeof phobia[field];
      if (actualType !== type) {
        errors.push(`Invalid type for ${field}: expected ${type}, got ${actualType}`);
      }
    }
  }
  
  if (phobia.name && phobia.name.length < 2) {
    errors.push('Name must be at least 2 characters');
  }
  
  return errors;
}

function validateRule(rule) {
  const errors = [];
  
  for (const field of RULE_SHAPE.required) {
    if (!rule[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }
  
  if (rule.sensorRules && Array.isArray(rule.sensorRules)) {
    if (rule.sensorRules.length !== 7) {
      errors.push(`Expected 7 sensor rules, got ${rule.sensorRules.length}`);
    }
    
    rule.sensorRules.forEach((sr, i) => {
      if (sr['@type'] !== 'PropertyValue') {
        errors.push(`Sensor rule ${i}: invalid @type, expected PropertyValue`);
      }
      if (!RULE_SHAPE.sensorRuleShape.types.name.includes(sr.name)) {
        errors.push(`Sensor rule ${i}: invalid sensor name "${sr.name}"`);
      }
    });
  }
  
  return errors;
}

router.post('/validate', async (req, res) => {
  try {
    const phobiasResult = await db.send(new ScanCommand({
      TableName: 'phoa-data',
      FilterExpression: 'begins_with(PK, :pk)',
      ExpressionAttributeValues: { ':pk': 'PHOBIA#' }
    }));
    
    const rulesResult = await db.send(new ScanCommand({
      TableName: 'phoa-triggers'
    }));
    
    const phobiaValidation = {
      total: phobiasResult.Items.length,
      valid: 0,
      invalid: 0,
      errors: []
    };
    
    const ruleValidation = {
      total: rulesResult.Items.length,
      valid: 0,
      invalid: 0,
      errors: []
    };
    
    phobiasResult.Items.forEach(item => {
      const errors = validatePhobia(item);
      if (errors.length === 0) {
        phobiaValidation.valid++;
      } else {
        phobiaValidation.invalid++;
        phobiaValidation.errors.push({
          phobia: item.name,
          errors
        });
      }
    });
    
    rulesResult.Items.forEach(item => {
      const errors = validateRule(item);
      if (errors.length === 0) {
        ruleValidation.valid++;
      } else {
        ruleValidation.invalid++;
        ruleValidation.errors.push({
          phobia: item.phobiaName,
          errors
        });
      }
    });
    
    res.json({
      success: true,
      validation: {
        phobias: phobiaValidation,
        rules: ruleValidation,
        summary: `Validated ${phobiaValidation.total} phobias and ${ruleValidation.total} rules. Total valid: ${phobiaValidation.valid + ruleValidation.valid}/${phobiaValidation.total + ruleValidation.total}`
      }
    });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

module.exports = router;
