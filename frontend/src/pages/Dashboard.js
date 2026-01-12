import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchPhobias } from '../services/api';
import { requestNotificationPermission } from '../services/notifications';

function Dashboard({ selectedPhobias, setSelectedPhobias }) {
  const navigate = useNavigate();
  const [phobias, setPhobias] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const currentSeason = 'Spring';
  const currentDate = new Date().toLocaleDateString();

  useEffect(() => {
    fetchPhobias()
      .then(data => {
        const withDesc = data.filter(p => p.description && p.description !== 'No description available');
        const sorted = withDesc.sort((a, b) => {
          const scoreA = [a.image, a.nhsUrl, a.subreddit, a.trigger].filter(Boolean).length;
          const scoreB = [b.image, b.nhsUrl, b.subreddit, b.trigger].filter(Boolean).length;
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

  const enableNotifications = async () => {
    const sub = await requestNotificationPermission();
    if (sub) alert('Notifications enabled! You will receive alerts.');
  };

  const filteredPhobias = phobias.filter(phobia =>
    phobia.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (phobia.description && phobia.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const mySelectedPhobias = phobias.filter(p => selectedPhobias.includes(p.id));

  return (
    <div className="page-container" vocab="http://schema.org/">
      <div className="page-header">
        <h1 property="name">Phobia Management Dashboard</h1>
        <div className="context-info" typeof="Place">
          <span property="dateCreated">📅 {currentDate}</span>
          <span property="additionalProperty">🌸 Season: {currentSeason}</span>
        </div>
      </div>

      {/* My Selected Phobias Section */}
      <div className="my-phobias-section">
        <h2>My Phobias ({selectedPhobias.length})</h2>
        {selectedPhobias.length === 0 ? (
          <div className="empty-state-box">
            <p>You haven't selected any phobias yet. Choose from the list below to get personalized remedies and alerts.</p>
          </div>
        ) : (
          <>
            <div className="selected-phobias-list">
              {mySelectedPhobias.map(phobia => (
                <div key={phobia.id} className="selected-phobia-item">
                  <div className="phobia-info">
                    <h3>{phobia.name}</h3>
                    <p>{phobia.description}</p>
                  </div>
                  <button 
                    className="btn-remove" 
                    onClick={() => togglePhobia(phobia.id)}
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <div className="action-buttons">
              <button onClick={handleViewRemedies} className="btn-primary">
                View Remedies & Resources →
              </button>
              <button onClick={enableNotifications} className="btn-secondary">
                🔔 Enable Alerts
              </button>
            </div>
          </>
        )}
      </div>

      {/* Available Phobias Section */}
      <div className="available-phobias-section">
        <h2>Add Phobias to Track</h2>
        <div className="search-bar">
          <input
            type="text"
            placeholder="🔍 Search phobias by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="phobia-list">
          {filteredPhobias.map(phobia => (
            <div 
              key={phobia.id} 
              className={`phobia-list-item ${selectedPhobias.includes(phobia.id) ? 'selected' : ''}`}
              vocab="http://schema.org/"
              typeof="MedicalCondition"
              resource={`#phobia-${phobia.id}`}
              onClick={() => togglePhobia(phobia.id)}
            >
              <div className="phobia-list-content">
                <div className="phobia-list-info">
                  <h3 property="name">{phobia.name}</h3>
                  <p property="description">{phobia.description}</p>
                  {phobia.trigger && <span className="trigger-badge">{phobia.trigger}</span>}
                </div>
                <div className="phobia-list-checkbox">
                  {selectedPhobias.includes(phobia.id) ? '✓' : '+'}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredPhobias.length === 0 && (
          <div className="empty-state-box">
            <p>No phobias found matching "{searchTerm}"</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
