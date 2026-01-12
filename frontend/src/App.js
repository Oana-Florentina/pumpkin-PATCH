import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Remedies from './pages/Remedies';
import Alerts from './pages/Alerts';
import Groups from './pages/Groups';
import Devices from './pages/Devices';
import { getUserLocation, sendContext } from './services/api';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [selectedPhobias, setSelectedPhobias] = useState([]);

  // Test location and weather
  useEffect(() => {
    getUserLocation()
      .then(loc => sendContext({ ...loc, timestamp: new Date().toISOString() }))
      .catch(err => console.log('❌ Error:', err.message));
  }, []);

  // Auto-adjust theme based on phobias
  useEffect(() => {
    if (selectedPhobias.length === 0) return;

    // Check for dark-related phobias (nyctophobia)
    const hasDarkPhobia = selectedPhobias.some(id => 
      id === 'nyctophobia' || id === 9 // nyctophobia ID
    );

    // Check for light-related phobias (heliophobia, photophobia)
    const hasLightPhobia = selectedPhobias.some(id => 
      id === 'heliophobia' || id === 'photophobia' || id === 10 || id === 11
    );

    // If has both, don't change theme
    if (hasDarkPhobia && hasLightPhobia) {
      return;
    }

    // If has dark phobia, use light mode (remove dark mode)
    if (hasDarkPhobia) {
      document.body.classList.remove('dark-mode');
    }

    // If has light phobia, use dark mode
    if (hasLightPhobia) {
      document.body.classList.add('dark-mode');
    }
  }, [selectedPhobias]);

  return (
    <Router>
      <div className="App">
        {user && <Navbar user={user} setUser={setUser} />}
        <Routes>
          <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Home />} />
          <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login setUser={setUser} />} />
          <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register setUser={setUser} />} />
          <Route path="/dashboard" element={user ? <Dashboard selectedPhobias={selectedPhobias} setSelectedPhobias={setSelectedPhobias} /> : <Navigate to="/login" />} />
          <Route path="/remedies" element={user ? <Remedies selectedPhobias={selectedPhobias} /> : <Navigate to="/login" />} />
          <Route path="/alerts" element={user ? <Alerts selectedPhobias={selectedPhobias} /> : <Navigate to="/login" />} />
          <Route path="/groups" element={user ? <Groups /> : <Navigate to="/login" />} />
          <Route path="/devices" element={user ? <Devices /> : <Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
