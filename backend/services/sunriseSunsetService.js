const axios = require('axios');

const getSunriseSunset = async (latitude, longitude) => {
  try {
    const response = await axios.get(`https://api.sunrise-sunset.org/json`, {
      params: { lat: latitude, lng: longitude, formatted: 0 }
    });
    return response.data.results;
  } catch (error) {
    console.error('Sunrise-Sunset API error:', error.message);
    return null;
  }
};

module.exports = { getSunriseSunset };
