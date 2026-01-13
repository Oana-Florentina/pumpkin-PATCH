const axios = require('axios');

const getWeatherData = async (latitude, longitude) => {
  try {
    const response = await axios.get(`https://api.open-meteo.com/v1/forecast`, {
      params: { 
        latitude: latitude,
        longitude: longitude,
        current: 'temperature_2m,relative_humidity_2m,precipitation,cloud_cover,wind_speed_10m,uv_index,weather_code'
      }
    });
    return {
      ...response.data.current,
      elevation: response.data.elevation
    };
  } catch (error) {
    console.error('Open-Meteo API error:', error.message);
    return null;
  }
};

module.exports = { getWeatherData };

