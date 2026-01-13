const express = require('express');
const router = express.Router();
const { alertToRdf } = require('../services/rdfService');
const { getTimeBasedAlerts, getSeasonName, getTimeOfDay } = require('../services/timeService');
const { getWeatherData } = require('../services/weatherService');
const { getSunriseSunset } = require('../services/sunriseSunsetService');
const { getLocationDetails } = require('../services/nominatimService');

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
router.post('/', async (req, res) => {
  const { userId, latitude, longitude, season, pollenLevel, roomSize } = req.body;
  const context = { 
    latitude, 
    longitude, 
    season: season || getSeasonName(), 
    pollenLevel, 
    roomSize,
    timeOfDay: getTimeOfDay()
  };
  
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

  // Add time-based alerts (always available)
  const timeAlerts = getTimeBasedAlerts();
  timeAlerts.forEach((alert, i) => {
    alerts.push({
      id: `time-${Date.now()}-${i}`,
      phobiaId: 'time-based',
      severity: alert.type === 'warning' ? 'high' : 'medium',
      message: alert.message,
      title: alert.title,
      source: alert.source,
      createdAt: alert.timestamp
    });
  });

  // Get weather data
  if (latitude && longitude) {
    const weatherData = await getWeatherData(latitude, longitude);
    context.weather = weatherData;
    context.altitude = weatherData?.elevation || 0;
    
    const sunData = await getSunriseSunset(latitude, longitude);
    context.sun = sunData;
    
    const now = new Date();
    const sunrise = sunData?.sunrise ? new Date(sunData.sunrise) : null;
    const sunset = sunData?.sunset ? new Date(sunData.sunset) : null;
    context.is_night = sunrise && sunset ? (now < sunrise || now > sunset) : false;
    
    const locationDetails = await getLocationDetails(latitude, longitude);
    context.locationType = locationDetails?.type || locationDetails?.amenity || 'unknown';
    context.locationName = locationDetails?.address?.city || locationDetails?.address?.town || 'Unknown';
    context.location = locationDetails;
  }

  if (req.query.format === 'jsonld') {
    res.set('Content-Type', 'application/ld+json');
    return res.json({
      '@context': { '@vocab': 'http://schema.org/', 'phoa': 'http://example.org/phoa#' },
      '@graph': alerts.map(a => alertToRdf(a))
    });
  }

  res.json({ success: true, data: { alerts, context } });
});

module.exports = router;
