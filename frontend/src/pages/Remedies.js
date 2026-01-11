import React from 'react';

const REMEDIES = {
  1: { // Arachnophobia
    medications: [
      { name: 'Propranolol', source: 'DBpedia', url: 'http://dbpedia.org/resource/Propranolol' },
      { name: 'Benzodiazepines', source: 'Wikidata', url: 'https://www.wikidata.org/wiki/Q407972' }
    ],
    exercises: ['Exposure therapy', 'Cognitive behavioral therapy', 'Relaxation techniques'],
    games: ['Spider Phobia VR', 'Fearless - Exposure Game'],
    resources: ['https://www.apa.org/phobias', 'https://www.nimh.nih.gov/anxiety']
  },
  2: { // Claustrophobia
    medications: [
      { name: 'SSRIs', source: 'DBpedia', url: 'http://dbpedia.org/resource/Selective_serotonin_reuptake_inhibitor' },
      { name: 'Anti-anxiety medication', source: 'Wikidata', url: 'https://www.wikidata.org/wiki/Q1360' }
    ],
    exercises: ['Breathing exercises', 'Progressive muscle relaxation', 'Gradual exposure'],
    games: ['Claustrophobia VR Therapy', 'Mindfulness Space'],
    resources: ['https://www.anxietycentre.com', 'https://www.verywellmind.com']
  },
  6: { // Pollen Allergy
    medications: [
      { name: 'Antihistamines', source: 'DBpedia', url: 'http://dbpedia.org/resource/Antihistamine' },
      { name: 'Nasal corticosteroids', source: 'Wikidata', url: 'https://www.wikidata.org/wiki/Q422248' },
      { name: 'Cetirizine', source: 'DBpedia', url: 'http://dbpedia.org/resource/Cetirizine' }
    ],
    exercises: ['Indoor exercises during high pollen', 'Air purifier usage', 'Nasal irrigation'],
    games: ['Allergy Tracker App', 'Pollen Alert Game'],
    resources: ['https://www.aaaai.org', 'https://www.pollen.com']
  }
};

function Remedies({ selectedPhobias }) {
  if (selectedPhobias.length === 0) {
    return (
      <div className="page-container">
        <h1>Remedies & Resources</h1>
        <p className="empty-state">Please select phobias from your dashboard first.</p>
      </div>
    );
  }

  return (
    <div className="page-container" vocab="http://schema.org/">
      <h1 property="name">Remedies & Resources</h1>
      <p className="subtitle">Based on your selected phobias (Data from DBpedia & Wikidata)</p>

      {selectedPhobias.map(phobiaId => {
        const remedy = REMEDIES[phobiaId];
        if (!remedy) return null;

        return (
          <div key={phobiaId} className="remedy-section" typeof="MedicalTherapy">
            <h2 property="name">Treatment Options</h2>
            
            <div className="remedy-category">
              <h3>💊 Medications</h3>
              <ul>
                {remedy.medications.map((med, i) => (
                  <li key={i} typeof="Drug" property="drug">
                    <a href={med.url} target="_blank" rel="noopener noreferrer" property="url">
                      <span property="name">{med.name}</span>
                    </a>
                    <span> ({med.source})</span>
                    <meta property="source" content={med.source} />
                  </li>
                ))}
              </ul>
            </div>

            <div className="remedy-category">
              <h3>🧘 Exercises & Therapy</h3>
              <ul typeof="TherapeuticProcedure">
                {remedy.exercises.map((ex, i) => (
                  <li key={i} property="procedureType">{ex}</li>
                ))}
              </ul>
            </div>

            <div className="remedy-category">
              <h3>🎮 Serious Games & Apps</h3>
              <ul typeof="SoftwareApplication">
                {remedy.games.map((game, i) => (
                  <li key={i} property="name">{game}</li>
                ))}
              </ul>
            </div>

            <div className="remedy-category">
              <h3>🌐 Web Resources</h3>
              <ul>
                {remedy.resources.map((link, i) => (
                  <li key={i}>
                    <a href={link} target="_blank" rel="noopener noreferrer" property="url">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default Remedies;
