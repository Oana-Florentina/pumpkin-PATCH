import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { fetchPhobias } from '../services/api';

function Dashboard({ selectedPhobias, setSelectedPhobias }) {
  const navigate = useNavigate();
  const [phobias, setPhobias] = useState([]);
  const currentSeason = 'Spring';
  const currentDate = new Date().toLocaleDateString();

  useEffect(() => {
    fetchPhobias()
      .then(data => {
        // Sortează după completitudine (mai multe proprietăți = mai sus)
        const sorted = data.sort((a, b) => {
          const scoreA = [a.image, a.nhsUrl, a.subreddit, a.trigger, a.description !== 'No description available'].filter(Boolean).length;
          const scoreB = [b.image, b.nhsUrl, b.subreddit, b.trigger, b.description !== 'No description available'].filter(Boolean).length;
          if (scoreA !== scoreB) return scoreB - scoreA;
          return a.name.localeCompare(b.name);
        });
        setPhobias(sorted);
      })
      .catch(err => console.error('Failed to fetch phobias:', err));
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
        {phobias && phobias.map(phobia => (
          <div 
            key={phobia.id} 
            className={`phobia-card ${selectedPhobias.includes(phobia.id) ? 'selected' : ''}`}
            vocab="http://schema.org/"
            typeof="MedicalCondition"
            resource={`#phobia-${phobia.id}`}
          >
            {phobia.image ? (
              <img 
                src={phobia.image} 
                alt={phobia.name}
                property="image"
                style={{width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px 8px 0 0'}}
              />
            ) : (
              <div style={{
                width: '100%', 
                height: '150px', 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px 8px 0 0',
                fontSize: '48px'
              }}>
                🧠
              </div>
            )}
            <div onClick={() => togglePhobia(phobia.id)} style={{padding: '15px'}}>
              <h3 property="name">{phobia.name}</h3>
              <p property="description">{phobia.description}</p>
              {phobia.trigger && <span className="trigger-badge" property="code">{phobia.trigger}</span>}
            </div>
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
