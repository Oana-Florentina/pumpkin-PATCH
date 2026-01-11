import React, { useState } from 'react';

function Groups() {
  const [members, setMembers] = useState([
    { id: 1, name: 'John Doe', email: 'john@example.com', relation: 'Family', phobias: ['Arachnophobia'] },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', relation: 'Friend', phobias: ['Social Phobia'] }
  ]);
  const [newEmail, setNewEmail] = useState('');

  const handleAddMember = (e) => {
    e.preventDefault();
    if (newEmail) {
      const newMember = {
        id: members.length + 1,
        name: newEmail.split('@')[0],
        email: newEmail,
        relation: 'Friend',
        phobias: []
      };
      setMembers([...members, newMember]);
      setNewEmail('');
    }
  };

  return (
    <div className="page-container">
      <h1>Group Management</h1>
      <p className="subtitle">Manage phobias for family, friends, and coworkers</p>

      <div className="add-member-section">
        <h2>Add New Member</h2>
        <form onSubmit={handleAddMember} className="add-member-form">
          <input
            type="email"
            placeholder="Enter email address"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            required
          />
          <button type="submit" className="btn-primary">Add Member</button>
        </form>
      </div>

      <div className="members-section">
        <h2>Group Members ({members.length})</h2>
        <div className="members-grid">
          {members.map(member => (
            <div key={member.id} className="member-card">
              <div className="member-header">
                <h3>👤 {member.name}</h3>
                <span className="relation-badge">{member.relation}</span>
              </div>
              <p className="member-email">{member.email}</p>
              <div className="member-phobias">
                <strong>Phobias:</strong>
                {member.phobias.length > 0 ? (
                  <ul>
                    {member.phobias.map((phobia, i) => (
                      <li key={i}>{phobia}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="no-phobias">No phobias recorded</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="group-alerts">
        <h2>Group Alerts</h2>
        <div className="alert-card info">
          <p>📢 John Doe may be affected by high pollen levels in their area</p>
        </div>
      </div>
    </div>
  );
}

export default Groups;
