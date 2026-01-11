import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { fetchPhobias } from '../services/api';

function Dashboard({ selectedPhobias, setSelectedPhobias }) {
  const navigate = useNavigate();
  const [showQR, setShowQR] = useState(null);
  const [phobias, setPhobias] = useState([]);
  const currentSeason = 'Spring';
  const currentDate = new Date().toLocaleDateString();

  useEffect(() => {
    fetchPhobias().then(setPhobias).catch(err => {
      console.error('Failed to fetch phobias:', err);
      // Fallback to mock data if API fails
      setPhobias([
        { id: 1, name: 'Arachnophobia', description: 'Fear of spiders', trigger: 'presence', code: 'D001238' },
        { id: 2, name: 'Claustrophobia', description: 'Fear of enclosed spaces', trigger: 'location', code: 'D003027' },
        { id: 3, name: 'Acrophobia', description: 'Fear of heights', trigger: 'location', code: 'D000342' },
        { id: 4, name: 'Social Phobia', description: 'Fear of social situations', trigger: 'context', code: 'D012698' },
        { id: 5, name: 'Agoraphobia', description: 'Fear of open spaces', trigger: 'location', code: 'D000379' },
        { id: 6, name: 'Pollen Allergy', description: 'Allergic to pollen', trigger: 'seasonal', code: 'D006255' },
        { id: 7, name: 'Aerophobia', description: 'Fear of flying', trigger: 'context', code: 'D005239' },
        { id: 8, name: 'Cynophobia', description: 'Fear of dogs', trigger: 'presence', code: 'D010698' }
      ]);
    });
  }, []);

  const togglePhobia = (phobiaId) => {
    if (selectedPhobias.includes(phobiaId)) {
      setSelectedPhobias(selectedPhobias.filter(id => id !== phobiaId));
    } else {
      setSelectedPhobias([...selectedPhobias, phobiaId]);
    }
  };

  const handleViewRemedies = () => {
    navigate('/remedies');
  };

  const generatePhobiaURL = (phobia) => {
    return `${window.location.origin}/phobia/${phobia.id}?name=${encodeURIComponent(phobia.name)}&code=${phobia.code}`;
  };

  return (
    <div className="page-container" vocab="http://schema.org/">
      <div className="page-header">
        <h1 property="name">My Phobias Dashboard</h1>
        <div className="context-info" typeof="Place">
          <span property="dateCreated">📅 {currentDate}</span>
          <span property="additionalProperty">🌸 Season: {currentSeason}</span>
        </div>
      </div>

      <div className="phobia-grid">
        {phobias.map(phobia => (
          <div 
            key={phobia.id} 
            className={`phobia-card ${selectedPhobias.includes(phobia.id) ? 'selected' : ''}`}
            vocab="http://schema.org/"
            typeof="MedicalCondition"
            resource={`#phobia-${phobia.id}`}
          >
            <div onClick={() => togglePhobia(phobia.id)}>
              <h3 property="name">{phobia.name}</h3>
              <p property="description">{phobia.description}</p>
              <span className="trigger-badge" property="code" content={phobia.code}>{phobia.trigger}</span>
              <meta property="url" content={generatePhobiaURL(phobia)} />
            </div>
            <button 
              className="qr-btn" 
              onClick={(e) => {
                e.stopPropagation();
                setShowQR(showQR === phobia.id ? null : phobia.id);
              }}
            >
              📱 QR Code
            </button>
            {showQR === phobia.id && (
              <div className="qr-container">
                <QRCodeSVG value={generatePhobiaURL(phobia)} size={150} />
                <p className="qr-label">Scan to share</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedPhobias.length > 0 && (
        <div className="action-section">
          <p>Selected {selectedPhobias.length} phobia(s)</p>
          <button onClick={handleViewRemedies} className="btn-primary">
            View Remedies & Resources
          </button>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
