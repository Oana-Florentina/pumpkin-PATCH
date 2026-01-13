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
      const details = await Promise.all(
        selectedPhobias.map(id => 
          fetch(`${API}/api/phobias/${id}`).then(r => r.json())
        )
      );
      const phobias = details.filter(d => d.success).map(d => d.data);
      setPhobias(phobias);
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
                  <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                    <span style={{fontSize: '24px'}}>
                      {treatment['@type'] === 'WebPage' ? '🔗' : 
                       treatment['@type'] === 'PsychologicalTreatment' ? '🧘' : '📄'}
                    </span>
                    <h4 property="name" style={{margin: 0}}>{treatment.name}</h4>
                  </div>
                  {treatment.description && (
                    <p property="description" style={{marginTop: '8px', color: '#666'}}>
                      {treatment.description}
                    </p>
                  )}
                  {treatment.url && (
                    <a 
                      href={treatment.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      property="url"
                      className="btn-secondary"
                      style={{marginTop: '10px', display: 'inline-block'}}
                    >
                      {treatment.url.includes('nhs.uk') ? '🏥 NHS Guide' :
                       treatment.url.includes('reddit') ? '💬 Community' : 
                       '🌐 Visit Resource'} →
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
