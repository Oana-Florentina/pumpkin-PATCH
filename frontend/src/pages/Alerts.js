import React, { useState, useEffect } from 'react';
import { getUserLocation, sendContext, getAlerts } from '../services/api';
import { getNoiseLevel, startMicrophone, stopMicrophone, isMicrophoneEnabled } from '../services/deviceSimulator';
import { getToken } from '../services/auth';

const API = 'https://x7v2x7sgsg.execute-api.us-east-1.amazonaws.com';

function Alerts({ selectedPhobias }) {
  const [alerts, setAlerts] = useState([]);
  const [context, setContext] = useState({});
  const [loading, setLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [heartRate, setHeartRate] = useState(70);
  const [baselineHeartRate, setBaselineHeartRate] = useState(70);
  const [micEnabled, setMicEnabled] = useState(false);
  const [groupMessages, setGroupMessages] = useState([]);
  const [sensorData, setSensorData] = useState({
    location: { name: 'Loading...', type: 'Loading...' },
    altitude: null,
    temperature: null,
    noiseLevel: null,
    sunrise: null,
    sunset: null,
    isNight: null,
    currentTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  });

  useEffect(() => {
    setNotificationsEnabled(Notification.permission === 'granted');
    
    const fetchGroupMessages = async () => {
      try {
        const groupsRes = await fetch(`${API}/api/groups/me`, {
          headers: { 'Authorization': 'Bearer ' + getToken() }
        });
        const groupsData = await groupsRes.json();
        
        if (groupsData.success && groupsData.data.length > 0) {
          const allMessages = [];
          for (const group of groupsData.data) {
            const messagesRes = await fetch(`${API}/api/groups/${group.id}/messages`, {
              headers: { 'Authorization': 'Bearer ' + getToken() }
            });
            const messagesData = await messagesRes.json();
            if (messagesData.success) {
              allMessages.push(...messagesData.data);
            }
          }
          setGroupMessages(allMessages);
          console.log('Group messages loaded:', allMessages.length);
        }
      } catch (err) {
        console.log('Failed to load group messages:', err.message);
      }
    };
    
    fetchGroupMessages();
  }, []);

  useEffect(() => {
    getUserLocation()
      .then(loc => sendContext({ ...loc, timestamp: new Date().toISOString() }))
      .then(data => {
        const weather = data.context?.weather;
        const sun = data.context?.sun;
        const loc = data.context?.location;
        
        setSensorData(prev => ({
          ...prev,
          location: {
            name: loc?.address?.city || loc?.address?.town || data.context?.locationName || 'Unknown',
            type: loc?.type || loc?.amenity || data.context?.locationType || 'Unknown'
          },
          altitude: weather?.elevation || data.context?.altitude || null,
          temperature: weather?.temperature_2m || null,
          isNight: data.context?.is_night || false,
          sunrise: sun?.sunrise ? new Date(sun.sunrise).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : null,
          sunset: sun?.sunset ? new Date(sun.sunset).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : null
        }));
        
        setContext({
          location_type: loc?.type || loc?.amenity || data.context?.locationType || null,
          locationName: loc?.address?.city || data.context?.locationName || 'Unknown',
          altitude: weather?.elevation || data.context?.altitude || null,
          temperature: weather?.temperature_2m || null,
          weather_code: weather?.weather_code || null,
          season: getSeason(),
          is_night: data.context?.is_night || false
        });
      })
      .catch(err => console.log('Location error:', err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setSensorData(prev => ({
        ...prev,
        noiseLevel: getNoiseLevel(),
        currentTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const toggleNotifications = async () => {
    if (Notification.permission === 'granted') {
      alert('Notifications already enabled. Disable them in browser settings.');
    } else {
      const permission = await Notification.requestPermission();
      setNotificationsEnabled(permission === 'granted');
    }
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

  const checkAlerts = async () => {
    const sensorContext = {
      ...context,
      heart_rate: heartRate,
      noise_level: isMicrophoneEnabled() ? getNoiseLevel() : null
    };

    console.log('🔍 Checking alerts at:', new Date().toLocaleTimeString());
    console.log('Phobias:', selectedPhobias);
    console.log('Context:', sensorContext);
    console.log('Group messages:', groupMessages.length);

    const startTime = Date.now();
    try {
      const newAlerts = await getAlerts(selectedPhobias, sensorContext, groupMessages);
      const duration = Date.now() - startTime;
      console.log(`✅ Alerts received in ${duration}ms:`, newAlerts);
      setAlerts(newAlerts);
      
      if (newAlerts.length > 0) {
        const alertMsg = newAlerts.map(a => 
          `⚠️ ${a.phobiaName}\n${a.message}${a.recommendations ? '\n\nRecommendations:\n• ' + a.recommendations.join('\n• ') : ''}`
        ).join('\n\n');
        alert(alertMsg);
        
        if (Notification.permission === 'granted') {
          console.log('Sending notifications for', newAlerts.length, 'alerts');
          newAlerts.forEach(alert => {
            const body = alert.message + 
              (alert.recommendations ? '\n\nRecommendations:\n• ' + alert.recommendations.join('\n• ') : '');
            console.log('Creating notification:', alert.phobiaName);
            new Notification('⚠️ Phobia Alert', {
              body,
              icon: '/logo192.png',
              tag: alert.phobiaId
            });
          });
        }
      } else {
        console.log('No notifications:', {alertCount: newAlerts.length, permission: Notification.permission});
      }
    } catch (e) {
      console.log('Alerts error:', e.message);
    }
  };

  const getSeason = () => {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'Spring';
    if (month >= 5 && month <= 7) return 'Summer';
    if (month >= 8 && month <= 10) return 'Fall';
    return 'Winter';
  };

  return (
    <div className="page-container" vocab="http://schema.org/">
      <h1>Monitoring & Alerts</h1>
      <p className="subtitle">Real-time sensor monitoring and phobia detection</p>

      <div className="environmental-section">
        <h2>Current Sensors</h2>
        
        <div style={{marginBottom: '20px', padding: '15px', borderRadius: '8px'}}>
          <span className="env-label" style={{display: 'block', marginBottom: '10px', fontSize: '16px', fontWeight: 'bold'}}>
            ❤️ Heart Rate: <span style={{color: '#f44336'}}>{heartRate} BPM</span>
          </span>
          <input 
            type="range" 
            value={heartRate} 
            onChange={(e) => {
              const newHR = Number(e.target.value);
              setHeartRate(newHR);
              
              if (newHR - baselineHeartRate >= 10 || newHR >= 95) {
                console.log('Heart rate spike detected:', newHR, 'baseline:', baselineHeartRate);
                checkAlerts();
                setBaselineHeartRate(newHR);
              }
            }}
            min="40" 
            max="200"
            style={{
              width: '100%',
              height: '10px',
              WebkitAppearance: 'none',
              appearance: 'none',
              background: 'linear-gradient(to right, #81C784 0%, #FFB74D 50%, #E57373 100%)',
              borderRadius: '5px',
              outline: 'none'
            }}
          />
          <style>{`
            input[type="range"]::-webkit-slider-thumb {
              -webkit-appearance: none;
              appearance: none;
              width: 20px;
              height: 20px;
              border-radius: 50%;
              background: #f44336;
              cursor: pointer;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            }
            input[type="range"]::-moz-range-thumb {
              width: 20px;
              height: 20px;
              border-radius: 50%;
              background: #f44336;
              cursor: pointer;
              border: none;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            }
          `}</style>
          <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#999', marginTop: '5px'}}>
            <span>40</span>
            <span>120</span>
            <span>200</span>
          </div>
        </div>
        
        <div className="env-grid">
          <div className="env-item">
            <span className="env-label">🌙 Time of Day</span>
            <span className="env-value">{sensorData.isNight ? 'Night' : 'Day'}</span>
          </div>
          <div className="env-item">
            <span className="env-label">📍 Location</span>
            <span className="env-value">{sensorData.location.name}</span>
          </div>
          <div className="env-item">
            <span className="env-label">🏷️ Location Type</span>
            <span className="env-value">{sensorData.location.type}</span>
          </div>
          <div className="env-item">
            <span className="env-label">⛰️ Altitude</span>
            <span className="env-value">{sensorData.altitude !== null ? `${sensorData.altitude}m` : 'N/A'}</span>
          </div>
          <div className="env-item">
            <span className="env-label">🌡️ Temperature</span>
            <span className="env-value">{sensorData.temperature !== null ? `${sensorData.temperature}°C` : 'N/A'}</span>
          </div>
          <div className="env-item">
            <span className="env-label">🔊 Noise Level</span>
            <span className="env-value">{sensorData.noiseLevel !== null ? `${sensorData.noiseLevel}dB` : 'Mic off'}</span>
          </div>
          <div className="env-item" onClick={toggleMicrophone} style={{cursor: 'pointer'}}>
            <span className="env-label">🎤 Microphone</span>
            <span className="env-value" style={{color: micEnabled ? '#4CAF50' : '#f44336'}}>
              {micEnabled ? 'ON' : 'OFF'}
            </span>
          </div>
          <div className="env-item">
            <span className="env-label">🌅 Sunrise</span>
            <span className="env-value">{sensorData.sunrise || 'N/A'}</span>
          </div>
          <div className="env-item">
            <span className="env-label">🌇 Sunset</span>
            <span className="env-value">{sensorData.sunset || 'N/A'}</span>
          </div>
        </div>
      </div>

      <section className="alerts-section">
        <h2>Active Alerts</h2>
        <button onClick={toggleNotifications} className={notificationsEnabled ? 'btn-disconnect' : 'btn-connect'} style={{marginBottom: '20px'}}>
          {notificationsEnabled ? '🔔 Notifications ON' : '🔕 Enable Notifications'}
        </button>
        {loading ? (
          <div className="alert-card info"><p>Loading...</p></div>
        ) : alerts.length === 0 ? (
          <div className="alert-card success">
            <h3>✓ No Active Triggers</h3>
            <p>You're all clear! No phobia triggers detected in your current context.</p>
          </div>
        ) : (
          alerts.map(alert => (
            <div key={alert.id} className={`alert-card ${alert.severity}`} vocab="http://schema.org/" typeof="MedicalRiskFactor">
              <h3 property="name">⚠️ {alert.phobiaName}</h3>
              <p property="description">{alert.message}</p>
              {alert.recommendations && alert.recommendations.length > 0 && (
                <div style={{marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.1)'}}>
                  <strong>Recommendations:</strong>
                  <ul style={{marginTop: '5px', paddingLeft: '20px'}}>
                    {alert.recommendations.map((rec, i) => {
                      const urlMatch = rec.match(/\[(https?:\/\/[^\]]+)\]/);
                      if (urlMatch) {
                        const text = rec.replace(urlMatch[0], '').trim();
                        return (
                          <li key={i}>
                            {text} <a href={urlMatch[1]} target="_blank" rel="noopener noreferrer" style={{color: '#4CAF50', textDecoration: 'underline'}}>View →</a>
                          </li>
                        );
                      }
                      return <li key={i}>{rec}</li>;
                    })}
                  </ul>
                </div>
              )}
            </div>
          ))
        )}
      </section>

      <div className="device-info-box">
        <h3>📱 How It Works</h3>
        <p>Adjust heart rate manually to simulate stress. When heart rate increases by 10+ BPM or exceeds 95 BPM, the system automatically checks for phobia triggers and sends alerts with recommendations.</p>
      </div>
    </div>
  );
}

export default Alerts;
