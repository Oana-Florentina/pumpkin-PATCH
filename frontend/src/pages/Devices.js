import React, { useState, useEffect } from 'react';
import { getHeartbeat } from '../services/heartbeat';

function Devices() {
  const [devices, setDevices] = useState([
    { id: 1, name: 'Apple Watch Series 8', type: 'smartwatch', connected: true, battery: 85 },
    { id: 2, name: 'Fitbit Charge 5', type: 'fitness tracker', connected: false, battery: 0 },
    { id: 3, name: 'Samsung Galaxy Watch', type: 'smartwatch', connected: false, battery: 0 }
  ]);

  const [deviceData, setDeviceData] = useState({
    heartRate: 72,
    location: { lat: 40.7128, lng: -74.0060, name: 'New York, NY' },
    activity: 'Resting',
    stressLevel: 'Low',
    environmentalData: {
      roomSize: 'Medium (15m²)',
      altitude: '10m',
      temperature: '22°C'
    }
  });

  // Simulate real-time heart rate updates
  useEffect(() => {
    const interval = setInterval(() => {
      setDeviceData(prev => ({
        ...prev,
        heartRate: getHeartbeat()
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

  const connectedDevice = devices.find(d => d.connected);

  return (
    <div className="page-container" vocab="http://schema.org/">
      <h1>Connected Devices</h1>
      <p className="subtitle">Manage wearable devices for real-time phobia monitoring</p>

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
              {device.connected && (
                <div className="battery-info">
                  <span>🔋 Battery: {device.battery}%</span>
                </div>
              )}
              <button 
                onClick={() => toggleDevice(device.id)} 
                className={device.connected ? 'btn-disconnect' : 'btn-connect'}
              >
                {device.connected ? 'Disconnect' : 'Connect'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {connectedDevice && (
        <>
          <div className="device-data-section">
            <h2>Real-Time Health Data</h2>
            <div className="data-grid">
              <div className="data-card" typeof="MedicalObservation">
                <h3>❤️ Heart Rate</h3>
                <p className="data-value" property="value">{deviceData.heartRate} BPM</p>
                <span className="data-status">Normal</span>
              </div>

              <div className="data-card">
                <h3>📍 Location</h3>
                <p className="data-value">{deviceData.location.name}</p>
                <span className="data-status">Tracking</span>
              </div>

              <div className="data-card">
                <h3>🏃 Activity</h3>
                <p className="data-value">{deviceData.activity}</p>
                <span className="data-status">Monitored</span>
              </div>

              <div className="data-card">
                <h3>😌 Stress Level</h3>
                <p className="data-value">{deviceData.stressLevel}</p>
                <span className="data-status">Good</span>
              </div>
            </div>
          </div>

          <div className="environmental-section">
            <h2>Environmental Context</h2>
            <div className="env-grid">
              <div className="env-item">
                <span className="env-label">Room Size:</span>
                <span className="env-value">{deviceData.environmentalData.roomSize}</span>
              </div>
              <div className="env-item">
                <span className="env-label">Altitude:</span>
                <span className="env-value">{deviceData.environmentalData.altitude}</span>
              </div>
              <div className="env-item">
                <span className="env-label">Temperature:</span>
                <span className="env-value">{deviceData.environmentalData.temperature}</span>
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
