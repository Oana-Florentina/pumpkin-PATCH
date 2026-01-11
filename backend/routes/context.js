const express = require('express');
const router = express.Router();
const { alertToRdf } = require('../services/rdfService');

// Reguli simple pentru alerte (vor fi înlocuite cu Apache Jena)
const rules = [
  {
    phobiaId: 'pollenAllergy',
    condition: (ctx) => ctx.season === 'Spring' && ctx.pollenLevel === 'High',
    alert: {
      severity: 'high',
      message: 'High pollen levels detected in Spring',
      recommendations: ['Stay indoors', 'Take antihistamine', 'Keep windows closed']
    }
  },
  {
    phobiaId: 'claustrophobia',
    condition: (ctx) => ctx.roomSize === 'Small',
    alert: {
      severity: 'medium',
      message: 'You are in a confined space',
      recommendations: ['Practice deep breathing', 'Focus on exit points', 'Stay calm']
    }
  }
];

// POST /api/context
router.post('/', (req, res) => {
  const { userId, latitude, longitude, season, pollenLevel, roomSize } = req.body;
  const context = { latitude, longitude, season, pollenLevel, roomSize };
  
  // Evaluează regulile
  const alerts = rules
    .filter(rule => rule.condition(context))
    .map((rule, i) => ({
      id: `alert-${Date.now()}-${i}`,
      phobiaId: rule.phobiaId,
      severity: rule.alert.severity,
      message: rule.alert.message,
      recommendations: rule.alert.recommendations,
      createdAt: new Date().toISOString()
    }));

  if (req.query.format === 'jsonld') {
    res.set('Content-Type', 'application/ld+json');
    return res.json({
      '@context': { '@vocab': 'http://schema.org/', 'phoa': 'http://example.org/phoa#' },
      '@graph': alerts.map(a => alertToRdf(a))
    });
  }

  res.json({ success: true, data: { alerts } });
});

module.exports = router;
