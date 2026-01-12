import { getToken } from './auth';
const API = 'https://x7v2x7sgsg.execute-api.us-east-1.amazonaws.com';

export const fetchPhobias = () => fetch(`${API}/api/phobias`).then(r => r.json()).then(d => d.data);

export const fetchMyPhobias = () => fetch(`${API}/api/users/me/phobias`, {
  headers: { 'Authorization': 'Bearer ' + getToken() }
}).then(r => r.json()).then(d => d.data);

export const addMyPhobia = (phobiaId) => fetch(`${API}/api/users/me/phobias`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + getToken() },
  body: JSON.stringify({ phobiaId })
}).then(r => r.json());

export const sendContext = (ctx) => fetch(`${API}/api/context`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(ctx)
}).then(r => r.json()).then(d => {
  console.log('📍 Position:', ctx);
  console.log('📦 Full response:', d);
  console.log('🌤️ Weather data:', d.data.context.weather);
  console.log('🌅 Sunrise/Sunset data:', d.data.context.sun);
  console.log('🗺️ Location details:', d.data.context.location);
  return d.data;
});

export const getUserLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      (err) => reject(err)
    );
  });
};
