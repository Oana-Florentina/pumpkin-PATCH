const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const db = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'us-east-1' }));

const LOCATIONS = "hospital, school, restaurant, place_of_worship, university, park, museum, apartments, building, bridge";
const WEATHER_CODES = "0, 3, 45, 61, 71, 95";
const SEASONS = "Spring, Summer, Fall, Winter";

async function generateRules(phobiaName, mainTrigger, description) {
  const apiKey = process.env.GEMINI_API_KEY;
  
  const prompt = `ACT AS A SPECIALIST PSYCHOLOGIST AND DATA ENGINEER.
CONTEXT: Phobia detection system. Map "${phobiaName}" (Trigger: "${mainTrigger}") to sensors.
TASK: Imagine a panic episode and determine sensor thresholds.

AVAILABLE SENSORS (USE ONLY THESE):
- location_type: MUST be one of [${LOCATIONS}]
- weather_code: MUST be one of [${WEATHER_CODES}]
- temperature: -30 to 50 °C
- altitude: 0 to 3000 m
- heart_rate: 40 to 200 BPM
- noise_level: 0 to 120 dB
- is_night: true or false
- season: MUST be one of [${SEASONS}]

CONSTRAINTS:
- Return EXACTLY 7 Schema.org PropertyValue objects
- Use ONLY sensor names from the list above
- Set value to null if sensor NOT relevant
- Output ONLY JSON array. NO MARKDOWN.

STRUCTURE:
[
  {"@type": "PropertyValue", "name": "location_type", "value": "hospital"},
  {"@type": "PropertyValue", "name": "weather_code", "value": 61},
  {"@type": "PropertyValue", "name": "heart_rate", "value": 100, "unitText": "BPM"},
  {"@type": "PropertyValue", "name": "noise_level", "value": 80, "unitText": "dB"},
  {"@type": "PropertyValue", "name": "altitude", "value": 50, "unitText": "m"},
  {"@type": "PropertyValue", "name": "is_night", "value": true},
  {"@type": "PropertyValue", "name": "season", "value": "Spring"}
]`;

  const res = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2 }
    })
  });
  
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  const text = data.candidates[0].content.parts[0].text;
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
}

exports.handler = async () => {
  if (!process.env.GEMINI_API_KEY) {
    return { statusCode: 400, body: 'GEMINI_API_KEY not set' };
  }

  const { Items } = await db.send(new ScanCommand({
    TableName: 'phoa-data',
    FilterExpression: 'begins_with(PK, :pk)',
    ExpressionAttributeValues: { ':pk': 'PHOBIA#' }
  }));
  
  const phobiasWithData = Items
    .filter(p => p.name && p.trigger && p.description !== 'No description available')
    .sort((a, b) => {
      const scoreA = [a.image, a.nhsUrl, a.subreddit].filter(Boolean).length;
      const scoreB = [b.image, b.nhsUrl, b.subreddit].filter(Boolean).length;
      return scoreB - scoreA;
    })
    .slice(0, 15);
  
  console.log(`Processing top 15 phobias out of ${Items.length}...`);
  let count = 0;
  
  for (const p of phobiasWithData) {
    if (!p.name) continue;
    
    try {
      const rules = await generateRules(p.name, p.trigger || 'general', p.description || '');
      
      await db.send(new PutCommand({
        TableName: 'phoa-triggers',
        Item: { 
          phobiaId: p.id, 
          phobiaName: p.name, 
          mainTrigger: p.trigger, 
          sensorRules: rules, 
          generatedAt: new Date().toISOString() 
        }
      }));
      count++;
      console.log(`✓ ${p.name}`);
    } catch (err) {
      console.error(`✗ ${p.name}:`, err.message);
    }
    
    await new Promise(r => setTimeout(r, 15000));
  }
  
  return { statusCode: 200, body: JSON.stringify({ processed: count, total: phobiasWithData.length }) };
};
