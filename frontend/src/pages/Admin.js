import React, { useState } from 'react';
import { CognitoUser, AuthenticationDetails } from 'amazon-cognito-identity-js';
import { login } from '../services/auth';

const API = 'https://x7v2x7sgsg.execute-api.us-east-1.amazonaws.com';
const ADMIN_EMAIL = 'briana.maftei+admin@gmail.com';

function Admin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(
    localStorage.getItem('adminAuth') === 'true'
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [validationResult, setValidationResult] = useState(null);
  
  const [scenario, setScenario] = useState({
    phobias: 'Q886731,Q220783,Q186892',
    location_type: '',
    heart_rate: '',
    noise_level: '',
    temperature: '',
    altitude: '',
    weather_code: '',
    season: '',
    is_night: '',
    mainTrigger: ''
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (email !== ADMIN_EMAIL) {
      alert('Unauthorized email');
      return;
    }
    
    setLoading(true);
    
    try {
      await login(email, password);
      localStorage.setItem('adminAuth', 'true');
      setAuthenticated(true);
    } catch (err) {
      alert('Login failed: ' + err.message);
    }
    setLoading(false);
  };

  const syncPhobias = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`${API}/api/admin/sync-phobias`, { method: 'POST' });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ error: err.message });
    }
    setLoading(false);
  };

  const generateRules = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`${API}/api/admin/generate-rules`, { method: 'POST' });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ error: err.message });
    }
    setLoading(false);
  };

  const validateData = async () => {
    setLoading(true);
    setValidationResult(null);
    try {
      const res = await fetch(`${API}/api/shacl/validate`, { method: 'POST' });
      const data = await res.json();
      setValidationResult(data.validation);
    } catch (err) {
      setValidationResult({ error: err.message });
    }
    setLoading(false);
  };

  const testScenario = async () => {
    setLoading(true);
    setResult(null);
    
    const groupMessages = scenario.mainTrigger ? [{ text: scenario.mainTrigger }] : [];
    
    try {
      const res = await fetch(`${API}/api/admin/test-scenario`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phobias: scenario.phobias.split(',').map(p => p.trim()),
          context: {
            location_type: scenario.location_type || undefined,
            heart_rate: scenario.heart_rate ? Number(scenario.heart_rate) : undefined,
            noise_level: scenario.noise_level ? Number(scenario.noise_level) : undefined,
            temperature: scenario.temperature ? Number(scenario.temperature) : undefined,
            altitude: scenario.altitude ? Number(scenario.altitude) : undefined,
            weather_code: scenario.weather_code ? Number(scenario.weather_code) : undefined,
            season: scenario.season || undefined,
            is_night: scenario.is_night === 'true' ? true : scenario.is_night === 'false' ? false : undefined
          },
          groupMessages
        })
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ error: err.message });
    }
    setLoading(false);
  };

  if (!authenticated) {
    return (
      <div className="page-container">
        <h1>Admin Panel</h1>
        <div style={{maxWidth: '400px', margin: '50px auto'}}>
          <h2>Admin Login</h2>
          <form onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="Admin email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{width: '100%', padding: '10px', marginBottom: '10px'}}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{width: '100%', padding: '10px', marginBottom: '10px'}}
              required
            />
            <button type="submit" disabled={loading} className="btn-primary" style={{width: '100%'}}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h1>Admin Panel</h1>
      <p className="subtitle">Demonstration tools for phobia detection system</p>

      <div className="environmental-section">
        <h2>Lambda Functions</h2>
        <div style={{display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap'}}>
          <button onClick={syncPhobias} disabled={loading} className="btn-connect">
            🔄 Sync Phobias from Wikidata
          </button>
          <button onClick={generateRules} disabled={loading} className="btn-connect">
            🤖 Generate Rules
          </button>
          <button onClick={validateData} disabled={loading} className="btn-connect">
            ✓ Validate RDF Data (SHACL)
          </button>
        </div>
      </div>

      {validationResult && (
        <div className="environmental-section">
          <h2>SHACL Validation Results</h2>
          <div style={{background: '#f5f5f5', padding: '15px', borderRadius: '8px', marginBottom: '20px'}}>
            <h3>{validationResult.summary}</h3>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px', marginTop: '15px'}}>
              <div>
                <h4>Phobias</h4>
                <p>✅ Valid: {validationResult.phobias?.valid || 0}</p>
                <p>❌ Invalid: {validationResult.phobias?.invalid || 0}</p>
              </div>
              <div>
                <h4>Rules</h4>
                <p>✅ Valid: {validationResult.rules?.valid || 0}</p>
                <p>❌ Invalid: {validationResult.rules?.invalid || 0}</p>
              </div>
            </div>
            {validationResult.phobias?.errors?.length > 0 && (
              <details style={{marginTop: '15px'}}>
                <summary style={{cursor: 'pointer', fontWeight: 'bold'}}>View Phobia Errors ({validationResult.phobias.errors.length})</summary>
                <pre style={{marginTop: '10px', maxHeight: '300px', overflow: 'auto', color: '#000'}}>
                  {JSON.stringify(validationResult.phobias.errors, null, 2)}
                </pre>
              </details>
            )}
            {validationResult.rules?.errors?.length > 0 && (
              <details style={{marginTop: '15px'}}>
                <summary style={{cursor: 'pointer', fontWeight: 'bold'}}>View Rule Errors ({validationResult.rules.errors.length})</summary>
                <pre style={{marginTop: '10px', maxHeight: '300px', overflow: 'auto', color: '#000'}}>
                  {JSON.stringify(validationResult.rules.errors, null, 2)}
                </pre>
              </details>
            )}
          </div>
        </div>
      )}

      <div className="environmental-section">
        <h2>Test Scenario</h2>
        <p style={{fontSize: '14px', color: '#666', marginBottom: '15px'}}>
          Create custom scenarios to demonstrate phobia detection. Leave fields empty to ignore them.
        </p>
        
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px', marginBottom: '15px'}}>
          <div>
            <label style={{display: 'block', marginBottom: '5px', fontSize: '14px'}}>Phobia IDs (comma-separated)</label>
            <input
              type="text"
              value={scenario.phobias}
              onChange={(e) => setScenario({...scenario, phobias: e.target.value})}
              placeholder="Q886731,Q220783"
              style={{width: '100%', padding: '8px'}}
            />
          </div>
          <div>
            <label style={{display: 'block', marginBottom: '5px', fontSize: '14px'}}>Location Type</label>
            <input
              type="text"
              value={scenario.location_type}
              onChange={(e) => setScenario({...scenario, location_type: e.target.value})}
              placeholder="hospital, park, forest..."
              style={{width: '100%', padding: '8px'}}
            />
          </div>
          <div>
            <label style={{display: 'block', marginBottom: '5px', fontSize: '14px'}}>Heart Rate (BPM)</label>
            <input
              type="number"
              value={scenario.heart_rate}
              onChange={(e) => setScenario({...scenario, heart_rate: e.target.value})}
              placeholder="40-200"
              style={{width: '100%', padding: '8px'}}
            />
          </div>
          <div>
            <label style={{display: 'block', marginBottom: '5px', fontSize: '14px'}}>Noise Level (dB)</label>
            <input
              type="number"
              value={scenario.noise_level}
              onChange={(e) => setScenario({...scenario, noise_level: e.target.value})}
              placeholder="0-120"
              style={{width: '100%', padding: '8px'}}
            />
          </div>
          <div>
            <label style={{display: 'block', marginBottom: '5px', fontSize: '14px'}}>Temperature (°C)</label>
            <input
              type="number"
              value={scenario.temperature}
              onChange={(e) => setScenario({...scenario, temperature: e.target.value})}
              placeholder="-30 to 50"
              style={{width: '100%', padding: '8px'}}
            />
          </div>
          <div>
            <label style={{display: 'block', marginBottom: '5px', fontSize: '14px'}}>Altitude (m)</label>
            <input
              type="number"
              value={scenario.altitude}
              onChange={(e) => setScenario({...scenario, altitude: e.target.value})}
              placeholder="0-3000"
              style={{width: '100%', padding: '8px'}}
            />
          </div>
          <div>
            <label style={{display: 'block', marginBottom: '5px', fontSize: '14px'}}>Weather Code</label>
            <input
              type="number"
              value={scenario.weather_code}
              onChange={(e) => setScenario({...scenario, weather_code: e.target.value})}
              placeholder="0, 3, 45, 61, 71, 95"
              style={{width: '100%', padding: '8px'}}
            />
          </div>
          <div>
            <label style={{display: 'block', marginBottom: '5px', fontSize: '14px'}}>Season</label>
            <select
              value={scenario.season}
              onChange={(e) => setScenario({...scenario, season: e.target.value})}
              style={{width: '100%', padding: '8px'}}
            >
              <option value="">-- Select --</option>
              <option value="Spring">Spring</option>
              <option value="Summer">Summer</option>
              <option value="Fall">Fall</option>
              <option value="Winter">Winter</option>
            </select>
          </div>
          <div>
            <label style={{display: 'block', marginBottom: '5px', fontSize: '14px'}}>Is Night</label>
            <select
              value={scenario.is_night}
              onChange={(e) => setScenario({...scenario, is_night: e.target.value})}
              style={{width: '100%', padding: '8px'}}
            >
              <option value="">-- Select --</option>
              <option value="true">True</option>
              <option value="false">False</option>
            </select>
          </div>
          <div>
            <label style={{display: 'block', marginBottom: '5px', fontSize: '14px'}}>Main Trigger (text)</label>
            <input
              type="text"
              value={scenario.mainTrigger}
              onChange={(e) => setScenario({...scenario, mainTrigger: e.target.value})}
              placeholder="blood, spider, dog..."
              style={{width: '100%', padding: '8px'}}
            />
          </div>
        </div>
        
        <button onClick={testScenario} disabled={loading} className="btn-primary" style={{width: '100%'}}>
          {loading ? 'Testing...' : '🧪 Test Scenario'}
        </button>
      </div>

      {result && (
        <div className="environmental-section">
          <h2>Results</h2>
          <pre style={{background: '#f5f5f5', padding: '15px', borderRadius: '8px', overflow: 'auto', maxHeight: '400px', color: '#000'}}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export default Admin;
