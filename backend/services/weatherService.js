const axios = require('axios');

const getWeatherData = async (latitude, longitude) => {
  const apiKey = process.env.WEATHER_API_KEY;
  if (!apiKey) {
    console.warn('WEATHER_API_KEY not set');
    return null;
  }

  try {
    const response = await axios.get(`http://api.weatherapi.com/v1/current.json`, {
      params: { key: apiKey, q: `${latitude},${longitude}`, aqi: 'no' }
    });
    return response.data;
  } catch (error) {
    console.error('Weather API error:', error.message);
    return null;
  }
};

module.exports = { getWeatherData };
