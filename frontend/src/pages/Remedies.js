import React, { useState, useEffect } from 'react';

const API = 'https://x7v2x7sgsg.execute-api.us-east-1.amazonaws.com';

function Remedies({ selectedPhobias }) {
  const [phobias, setPhobias] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedPhobias.length > 0) {
      fetchPhobiasDetails();
    }
  }, [selectedPhobias]);

  const fetchPhobiasDetails = async () => {
    try {
      const res = await fetch(`${API}/api/phobias`);
      const data = await res.json();
      if (data.success) {
        const selected = data.data.filter(p => selectedPhobias.includes(p.id));
        setPhobias(selected);
      }
    } catch (err) {
      console.error('Failed to fetch:', err);
    } finally {
      setLoading(false);
    }
  };

  if (selectedPhobias.length === 0) {
    return (
      <div className="page-container">
        <h1>Remedies & Resources</h1>
        <p className="empty-state">Please select phobias from your dashboard first.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page-container">
        <h1>Loading remedies...</h1>
      </div>
    );
  }

  return (
    <div className="page-container" vocab="http://schema.org/">
      <h1>Remedies & Resources</h1>
      <p className="subtitle">Evidence-based treatments from NHS, medical databases, and support communities</p>

      {phobias.map(phobia => (
        <div key={phobia.id} className="remedy-section" typeof="MedicalCondition">
          <h2 property="name">{phobia.name}</h2>
          <p property="description">{phobia.description}</p>

          {phobia.possibleTreatment && phobia.possibleTreatment.length > 0 && (
            <div className="treatments-container">
              <h3>Recommended Treatments:</h3>
              {phobia.possibleTreatment.map((treatment, i) => (
                <div key={i} className="treatment-card" typeof={treatment['@type']}>
                  <h4 property="name">{treatment.name}</h4>
                  {treatment.description && (
                    <p property="description">{treatment.description}</p>
                  )}
                  {treatment.url && (
                    <a 
                      href={treatment.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      property="url"
                      className="btn-secondary"
                    >
                      Visit Resource →
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default Remedies;
