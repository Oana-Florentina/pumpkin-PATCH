import React, { useState } from 'react';
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
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [selectedPhobias, setSelectedPhobias] = useState([]);

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
