import React, { useState, useEffect } from 'react';
import { getHeartbeat, getNoiseLevel, startMicrophone, stopMicrophone, isMicrophoneEnabled } from '../services/deviceSimulator';
import { getUserLocation, sendContext } from '../services/api';

function Devices() {
  const [micEnabled, setMicEnabled] = useState(false);
  const [deviceData, setDeviceData] = useState({
    heartRate: 72,
    location: { name: 'Loading...', type: 'Loading...' },
    altitude: null,
    temperature: null,
    noiseLevel: null,
    sunrise: null,
    sunset: null,
    weatherCode: null,
    isNight: null,
    currentTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  });

  useEffect(() => {
    getUserLocation()
      .then(loc => sendContext({ ...loc, timestamp: new Date().toISOString() }))
      .then(data => {
        const weather = data.context?.weather;
        const sun = data.context?.sun;
        const loc = data.context?.location;
        
        setDeviceData(prev => ({
          ...prev,
          location: {
            name: loc?.address?.city || loc?.address?.town || data.context?.locationName || 'Unknown',
            type: loc?.type || loc?.amenity || data.context?.locationType || 'Unknown'
          },
          altitude: weather?.elevation || data.context?.altitude || null,
          temperature: weather?.temperature_2m || null,
          weatherCode: weather?.weather_code || null,
          isNight: data.context?.is_night || false,
          sunrise: sun?.sunrise ? new Date(sun.sunrise).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : null,
          sunset: sun?.sunset ? new Date(sun.sunset).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : null
        }));
      })
      .catch(err => console.log('Location error:', err.message));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setDeviceData(prev => ({
        ...prev,
        heartRate: getHeartbeat(),
        noiseLevel: getNoiseLevel(),
        currentTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const toggleMicrophone = async () => {
    if (isMicrophoneEnabled()) {
      stopMicrophone();
      setMicEnabled(false);
    } else {
      const ok = await startMicrophone();
      setMicEnabled(ok);
    }
  };

  return (
    <div className="page-container" vocab="http://schema.org/">
      <h1>Sensor Monitoring</h1>
      <p className="subtitle">Real-time environmental and health data for phobia detection</p>

      <div className="environmental-section">
        <h2>Current Sensors</h2>
        <div className="env-grid">
          <div className="env-item">
            <span className="env-label">🕐 Current Time</span>
            <span className="env-value">{deviceData.currentTime} {deviceData.isNight ? '🌙 Night' : '☀️ Day'}</span>
          </div>
          <div className="env-item">
            <span className="env-label">❤️ Heart Rate</span>
            <span className="env-value">{deviceData.heartRate} BPM</span>
          </div>
          <div className="env-item">
            <span className="env-label">📍 Location</span>
            <span className="env-value">{deviceData.location.name}</span>
          </div>
          <div className="env-item">
            <span className="env-label">🏷️ Location Type</span>
            <span className="env-value">{deviceData.location.type}</span>
          </div>
          <div className="env-item">
            <span className="env-label">⛰️ Altitude</span>
            <span className="env-value">{deviceData.altitude !== null ? `${deviceData.altitude}m` : 'N/A'}</span>
          </div>
          <div className="env-item">
            <span className="env-label">🌡️ Temperature</span>
            <span className="env-value">{deviceData.temperature !== null ? `${deviceData.temperature}°C` : 'N/A'}</span>
          </div>
          <div className="env-item">
            <span className="env-label">🔊 Noise Level</span>
            <span className="env-value">{deviceData.noiseLevel !== null ? `${deviceData.noiseLevel}dB` : 'Mic off'}</span>
          </div>
          <div className="env-item" onClick={toggleMicrophone} style={{cursor: 'pointer'}}>
            <span className="env-label">🎤 Microphone</span>
            <span className="env-value" style={{color: micEnabled ? '#4CAF50' : '#f44336'}}>
              {micEnabled ? 'ON' : 'OFF'}
            </span>
          </div>
          <div className="env-item">
            <span className="env-label">🌅 Sunrise</span>
            <span className="env-value">{deviceData.sunrise || 'N/A'}</span>
          </div>
          <div className="env-item">
            <span className="env-label">🌇 Sunset</span>
            <span className="env-value">{deviceData.sunset || 'N/A'}</span>
          </div>
        </div>
        <p className="env-note">
          💡 Sensor data helps detect phobia triggers like confined spaces, high altitudes, or darkness
        </p>
      </div>
    </div>
  );
}

export default Devices;
