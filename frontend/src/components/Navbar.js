import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Navbar({ user, setUser }) {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    setUser(null);
    navigate('/');
    setIsMenuOpen(false);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/dashboard" className="nav-logo">🎃 PhoA</Link>
        
        <button className="hamburger" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div className={`nav-content ${isMenuOpen ? 'open' : ''}`}>
          <ul className="nav-menu">
            <li><Link to="/dashboard" onClick={closeMenu}>Dashboard</Link></li>
            <li><Link to="/remedies" onClick={closeMenu}>Remedies</Link></li>
            <li><Link to="/alerts" onClick={closeMenu}>Alerts</Link></li>
            <li><Link to="/devices" onClick={closeMenu}>Devices</Link></li>
            <li><Link to="/groups" onClick={closeMenu}>Groups</Link></li>
          </ul>
          <div className="nav-user">
            <span className="user-name">👤 {user.name}</span>
            <button onClick={handleLogout} className="btn-logout">Logout</button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
