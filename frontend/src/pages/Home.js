import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="home-page">
      <header className="header">
        <h1>🎃 PhoA - Phobia Assistant</h1>
        <p>Your personal guide to managing phobias</p>
      </header>
      
      <main className="main-content">
        <section className="hero">
          <h2>Welcome to PhoA</h2>
          <p>Get personalized remedies, exercises, and alerts for managing your phobias</p>
          <div className="hero-buttons">
            <Link to="/login" className="btn-primary">Login</Link>
            <Link to="/register" className="btn-secondary">Register</Link>
          </div>
        </section>

        <section className="features">
          <div className="feature-card">
            <h3>📚 Knowledge Base</h3>
            <p>Access remedies from DBpedia and Wikidata</p>
          </div>
          <div className="feature-card">
            <h3>🔔 Smart Alerts</h3>
            <p>Context-aware notifications based on location and season</p>
          </div>
          <div className="feature-card">
            <h3>👥 Group Support</h3>
            <p>Manage phobias for family and friends</p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Home;
