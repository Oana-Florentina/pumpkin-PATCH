import React, { useState, useEffect } from 'react';

function Alerts({ selectedPhobias }) {
  const [alerts, setAlerts] = useState([]);
  const currentSeason = 'Spring';
  const location = 'New York';

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
    { id: 5, type: 'info', title: 'Reminder', message: 'Take your medication', timestamp: 'Jan 9, 2026' }
  ];

  return (
    <div className="page-container">
      <h1>Alerts & Notifications</h1>
      <div className="context-display">
        <p>📍 Location: {location}</p>
        <p>🌸 Season: {currentSeason}</p>
        <p>📅 {new Date().toLocaleDateString()}</p>
      </div>

      <section className="alerts-section">
        <h2>Active Alerts</h2>
        {alerts.length === 0 ? (
          <div className="alert-card success">
            <h3>✓ No Active Triggers</h3>
            <p>You're all clear! No phobia triggers detected in your current context.</p>
          </div>
        ) : (
          alerts.map(alert => (
            <div key={alert.id} className={`alert-card ${alert.type}`}>
              <h3>⚠️ {alert.title}</h3>
              <p>{alert.message}</p>
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
    </div>
  );
}

export default Alerts;
