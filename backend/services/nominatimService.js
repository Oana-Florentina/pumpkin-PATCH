const axios = require('axios');

const getLocationDetails = async (latitude, longitude) => {
  try {
    const response = await axios.get(`https://nominatim.openstreetmap.org/reverse`, {
      params: { 
        lat: latitude, 
        lon: longitude, 
        format: 'json' 
      },
      headers: {
        'User-Agent': 'PhoA-PhobiaApp/1.0'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Nominatim API error:', error.message);
    return null;
  }
};

module.exports = { getLocationDetails };
