const express = require('express');
const router = express.Router();
const { getPhobiaFromWikidata } = require('../services/sparqlService');

const phobias = [
  {
    id: 'claustrophobia',
    name: 'Claustrophobia',
    description: 'Fear of confined spaces',
    wikidataId: 'Q186892',
    symptoms: ['Panic attacks', 'Sweating', 'Rapid heartbeat'],
    triggers: ['Elevators', 'Small rooms', 'Crowded spaces']
  },
  {
    id: 'arachnophobia',
    name: 'Arachnophobia',
    description: 'Fear of spiders',
    wikidataId: 'Q148028',
    symptoms: ['Anxiety', 'Avoidance', 'Panic'],
    triggers: ['Seeing spiders', 'Webs', 'Dark places']
  },
  {
    id: 'acrophobia',
    name: 'Acrophobia',
    description: 'Fear of heights',
    wikidataId: 'Q188552',
    symptoms: ['Dizziness', 'Sweating', 'Nausea'],
    triggers: ['Tall buildings', 'Bridges', 'Mountains']
  }
];

const remedies = {
  claustrophobia: [
    { id: 'rem-1', type: 'exercise', name: 'Deep breathing', description: '4-4-4 breathing technique' },
    { id: 'rem-2', type: 'resource', name: 'NHS Guide', description: 'Official NHS guide', url: 'https://www.nhs.uk/conditions/claustrophobia/' }
  ],
  arachnophobia: [
    { id: 'rem-3', type: 'exercise', name: 'Gradual exposure', description: 'Start with pictures' },
    { id: 'rem-4', type: 'game', name: 'Spider VR', description: 'VR exposure therapy' }
  ],
  acrophobia: [
    { id: 'rem-5', type: 'exercise', name: 'Grounding technique', description: 'Focus on 5 things you can see' }
  ]
};

router.get('/', (req, res) => {
  res.json({ success: true, data: phobias.map(({ id, name, description, wikidataId }) => ({ id, name, description, wikidataId })) });
});

router.get('/:id', async (req, res) => {
  const phobia = phobias.find(p => p.id === req.params.id);
  if (!phobia) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Phobia not found' } });
  
  // Îmbogățește cu date din Wikidata
  try {
    const wikidata = await getPhobiaFromWikidata(phobia.wikidataId);
    if (wikidata) {
      phobia.wikidataLabel = wikidata.label;
      phobia.wikidataDescription = wikidata.description;
    }
  } catch (e) { /* fallback la date locale */ }
  
  res.json({ success: true, data: phobia });
});

router.get('/:id/remedies', (req, res) => {
  const r = remedies[req.params.id];
  if (!r) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Phobia not found' } });
  res.json({ success: true, data: r });
});

module.exports = router;
