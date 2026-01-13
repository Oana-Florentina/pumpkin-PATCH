import React, { useState, useEffect } from 'react';
import { getHeartbeat, getNoiseLevel, startMicrophone, stopMicrophone, isMicrophoneEnabled } from '../services/deviceSimulator';
import { getUserLocation, sendContext } from '../services/api';

function Devices() {
  const [devices, setDevices] = useState([
    { id: 1, name: 'Apple Watch Series 8', type: 'smartwatch', connected: true, battery: 85 },
    { id: 2, name: 'Fitbit Charge 5', type: 'fitness tracker', connected: false, battery: 0 },
    { id: 3, name: 'Samsung Galaxy Watch', type: 'smartwatch', connected: false, battery: 0 }
  ]);

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

  const toggleDevice = (deviceId) => {
    setDevices(devices.map(device => 
      device.id === deviceId 
        ? { ...device, connected: !device.connected, battery: device.connected ? 0 : 85 }
        : device
    ));
  };

  const toggleMicrophone = async () => {
    if (isMicrophoneEnabled()) {
      stopMicrophone();
      setMicEnabled(false);
    } else {
      const ok = await startMicrophone();
      setMicEnabled(ok);
    }
  };

  const connectedDevice = devices.find(d => d.connected);

  return (
    <div className="page-container" vocab="http://schema.org/">
      <h1>Connected Devices</h1>
      <p className="subtitle">Manage wearable devices for phobia monitoring</p>

      <div className="devices-section">
        <h2>Available Devices</h2>
        <div className="devices-grid">
          {devices.map(device => (
            <div key={device.id} className={`device-card ${device.connected ? 'connected' : ''}`}>
              <div className="device-header">
                <h3>{device.type === 'smartwatch' ? '⌚' : '📱'} {device.name}</h3>
                <span className={`status-badge ${device.connected ? 'active' : 'inactive'}`}>
                  {device.connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <p className="device-type">{device.type}</p>
              {device.connected && <div className="battery-info"><span>🔋 Battery: {device.battery}%</span></div>}
              <button onClick={() => toggleDevice(device.id)} className={device.connected ? 'btn-disconnect' : 'btn-connect'}>
                {device.connected ? 'Disconnect' : 'Connect'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {connectedDevice && (
        <>
          <div className="device-data-section">
            <h2>Health Monitoring</h2>
            <div className="data-grid">
              <div className="data-card" typeof="MedicalObservation">
                <h3>❤️ Heart Rate</h3>
                <p className="data-value" property="value">{deviceData.heartRate} BPM</p>
              </div>
              <div className="data-card">
                <h3>📍 Location</h3>
                <p className="data-value">{deviceData.location.name}</p>
                <span className="data-status">{deviceData.location.type}</span>
              </div>
            </div>
          </div>

          <div className="environmental-section">
            <h2>Environmental Context</h2>
            <div className="env-grid">
              <div className="env-item">
                <span className="env-label">🕐 Current Time</span>
                <span className="env-value">{deviceData.currentTime} {deviceData.isNight ? '🌙 Night' : '☀️ Day'}</span>
              </div>
              <div className="env-item">
                <span className="env-label">📍 Location Type</span>
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
                <span className="env-value">
                  {deviceData.noiseLevel !== null ? `${deviceData.noiseLevel}dB` : 'Mic off'}
                </span>
                <button onClick={toggleMicrophone} className={micEnabled ? 'btn-disconnect' : 'btn-connect'} style={{marginTop: '5px', fontSize: '12px'}}>
                  {micEnabled ? '🎤 Stop' : '🎤 Start'}
                </button>
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
              💡 Environmental data helps detect phobia triggers like small spaces (claustrophobia) or high altitudes (acrophobia)
            </p>
          </div>
        </>
      )}

      {!connectedDevice && (
        <div className="empty-state">
          <p>⌚ Connect a device to start monitoring health data and receive context-aware phobia alerts</p>
        </div>
      )}
    </div>
  );
}

export default Devices;
