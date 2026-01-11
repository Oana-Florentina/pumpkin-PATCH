import React, { useState, useEffect } from 'react';

function Alerts({ selectedPhobias }) {
  const [alerts, setAlerts] = useState([]);
  const [deviceAlerts, setDeviceAlerts] = useState([]);
  const currentSeason = 'Spring';
  const location = 'New York';

  // Simulate device data
  const [heartRate, setHeartRate] = useState(72);

  useEffect(() => {
    // Simulate heart rate changes
    const interval = setInterval(() => {
      const newRate = 70 + Math.floor(Math.random() * 30);
      setHeartRate(newRate);

      // Generate device-based alerts
      const newDeviceAlerts = [];
      
      if (newRate > 90 && selectedPhobias.length > 0) {
        newDeviceAlerts.push({
          id: 'device-1',
          type: 'warning',
          title: 'Elevated Heart Rate Detected',
          message: `Heart rate at ${newRate} BPM. Possible anxiety trigger detected by smartwatch.`,
          timestamp: new Date().toLocaleString(),
          source: 'Apple Watch'
        });
      }

      if (selectedPhobias.includes(2)) { // Claustrophobia
        newDeviceAlerts.push({
          id: 'device-2',
          type: 'warning',
          title: 'Small Space Detected',
          message: 'GPS data indicates you are in a confined area. Claustrophobia alert activated.',
          timestamp: new Date().toLocaleString(),
          source: 'GPS Sensor'
        });
      }

      setDeviceAlerts(newDeviceAlerts);
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedPhobias]);

  useEffect(() => {
    // Generate context-aware alerts based on selected phobias
    const newAlerts = [];
    
    if (selectedPhobias.includes(6)) { // Pollen allergy
      if (currentSeason === 'Spring') {
        newAlerts.push({
          id: 1,
          type: 'warning',
          title: 'High Pollen Alert',
          message: `Pollen levels are high in ${location} during Spring. Consider taking antihistamines.`,
          timestamp: new Date().toLocaleString()
        });
      }
    }

    if (selectedPhobias.includes(2)) { // Claustrophobia
      newAlerts.push({
        id: 2,
        type: 'info',
        title: 'Location Context',
        message: 'Avoid small enclosed spaces. Practice breathing exercises if needed.',
        timestamp: new Date().toLocaleString()
      });
    }

    if (selectedPhobias.includes(4)) { // Social phobia
      newAlerts.push({
        id: 3,
        type: 'tip',
        title: 'Social Event Reminder',
        message: 'Prepare relaxation techniques before social gatherings.',
        timestamp: new Date().toLocaleString()
      });
    }

    setAlerts(newAlerts);
  }, [selectedPhobias]);

  const alertHistory = [
    { id: 4, type: 'warning', title: 'Previous Alert', message: 'High pollen detected yesterday', timestamp: 'Jan 10, 2026' },
    { id: 5, type: 'info', title: 'Reminder', message: 'Take your medication', timestamp: 'Jan 9, 2026' },
    { id: 6, type: 'warning', title: 'Device Alert', message: 'Elevated stress levels detected by smartwatch', timestamp: 'Jan 8, 2026' }
  ];

  const allActiveAlerts = [...deviceAlerts, ...alerts];

  return (
    <div className="page-container">
      <h1>Alerts & Notifications</h1>
      <div className="context-display">
        <p>📍 Location: {location}</p>
        <p>🌸 Season: {currentSeason}</p>
        <p>📅 {new Date().toLocaleDateString()}</p>
        <p>❤️ Heart Rate: {heartRate} BPM</p>
      </div>

      <section className="alerts-section">
        <h2>Active Alerts</h2>
        {allActiveAlerts.length === 0 ? (
          <div className="alert-card success">
            <h3>✓ No Active Triggers</h3>
            <p>You're all clear! No phobia triggers detected in your current context.</p>
          </div>
        ) : (
          allActiveAlerts.map(alert => (
            <div key={alert.id} className={`alert-card ${alert.type}`}>
              <h3>⚠️ {alert.title}</h3>
              <p>{alert.message}</p>
              {alert.source && <span className="alert-source">📱 Source: {alert.source}</span>}
              <span className="timestamp">{alert.timestamp}</span>
            </div>
          ))
        )}
      </section>

      <section className="alerts-section">
        <h2>Alert History</h2>
        {alertHistory.map(alert => (
          <div key={alert.id} className={`alert-card ${alert.type} history`}>
            <h3>{alert.title}</h3>
            <p>{alert.message}</p>
            <span className="timestamp">{alert.timestamp}</span>
          </div>
        ))}
      </section>

      <div className="device-info-box">
        <h3>📱 Connected Devices</h3>
        <p>Real-time monitoring from Apple Watch Series 8</p>
        <p className="device-note">
          💡 Your smartwatch monitors heart rate, location, and stress levels to provide context-aware phobia alerts
        </p>
      </div>
    </div>
  );
}

export default Alerts;
