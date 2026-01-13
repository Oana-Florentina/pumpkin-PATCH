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
  console.log('📍 Context:', d.data);
  return d.data;
});

export const getAlerts = (phobias, context, groupMessages = []) => fetch(`${API}/api/alerts`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + getToken() },
  body: JSON.stringify({ phobias, context, groupMessages })
}).then(r => r.json()).then(d => d.alerts || []);

export const getUserLocation = () => new Promise((resolve, reject) => {
  if (!navigator.geolocation) return reject(new Error('Geolocation not supported'));
  navigator.geolocation.getCurrentPosition(
    pos => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
    err => reject(err)
  );
});
