import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { getToken } from '../services/auth';

const API = 'https://x7v2x7sgsg.execute-api.us-east-1.amazonaws.com';

function Groups() {
  const [groups, setGroups] = useState([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [showQR, setShowQR] = useState(null);
  const [reportTrigger, setReportTrigger] = useState('');

  useEffect(() => {
    fetchMyGroups();
  }, []);

  const fetchMyGroups = async () => {
    try {
      const res = await fetch(`${API}/api/groups/me`, {
        headers: { 'Authorization': 'Bearer ' + getToken() }
      });
      const data = await res.json();
      if (data.success) setGroups(data.data);
    } catch (err) {
      console.error('Failed to fetch groups:', err);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName) return;
    
    try {
      const res = await fetch(`${API}/api/groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + getToken()
        },
        body: JSON.stringify({ name: newGroupName })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Group created! Invite code: ${data.data.inviteCode}`);
        setNewGroupName('');
        fetchMyGroups();
      }
    } catch (err) {
      alert('Failed to create group: ' + err.message);
    }
  };

  const handleJoinGroup = async (e) => {
    e.preventDefault();
    if (!joinCode) return;
    
    const groupId = prompt('Enter group ID:');
    if (!groupId) return;
    
    try {
      const res = await fetch(`${API}/api/groups/${groupId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + getToken()
        },
        body: JSON.stringify({ inviteCode: joinCode })
      });
      const data = await res.json();
      if (data.success) {
        alert('Joined group successfully!');
        setJoinCode('');
        fetchMyGroups();
      }
    } catch (err) {
      alert('Failed to join group: ' + err.message);
    }
  };

  const generateGroupURL = (group) => {
    return `${window.location.origin}/join-group?id=${group.id}&code=${group.inviteCode || 'INVITE'}`;
  };

  const [copiedGroup, setCopiedGroup] = useState(null);

  const copyLink = (url, groupId) => {
    navigator.clipboard.writeText(url);
    setCopiedGroup(groupId);
    setTimeout(() => setCopiedGroup(null), 2000);
  };

  const handleReportTrigger = async (groupId) => {
    if (!reportTrigger) return alert('Please enter a trigger');
    
    try {
      const res = await fetch(`${API}/api/groups/${groupId}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + getToken()
        },
        body: JSON.stringify({ trigger: reportTrigger })
      });
      const data = await res.json();
      if (data.success) {
        alert('Alert sent to group members!');
        setReportTrigger('');
      }
    } catch (err) {
      alert('Failed to report: ' + err.message);
    }
  };

  return (
    <div className="page-container">
      <h1>Group Management</h1>
      <p className="subtitle">Share phobias with family, friends, and coworkers</p>

      <div className="add-member-section">
        <h2>Create New Group</h2>
        <form onSubmit={handleCreateGroup} className="add-member-form">
          <input
            type="text"
            placeholder="Group name (e.g., My Family)"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            required
          />
          <button type="submit" className="btn-primary">Create Group</button>
        </form>
      </div>

      <div className="add-member-section">
        <h2>Report Trigger to Group</h2>
        <p style={{fontSize: '14px', color: '#666', marginBottom: '10px'}}>
          Alert group members about potential triggers (e.g., "spider", "small room", "dog")
        </p>
        <div className="add-member-form" style={{display: 'flex', gap: '10px'}}>
          <input
            type="text"
            placeholder="Trigger (e.g., spider, confined space)"
            value={reportTrigger}
            onChange={(e) => setReportTrigger(e.target.value)}
          />
          <select onChange={(e) => e.target.value && handleReportTrigger(e.target.value)} className="btn-primary">
            <option value="">Select Group</option>
            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
      </div>

      <div className="add-member-section">
        <h2>Join Group</h2>
        <form onSubmit={handleJoinGroup} className="add-member-form">
          <input
            type="text"
            placeholder="Invite code"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            required
          />
          <button type="submit" className="btn-primary">Join Group</button>
        </form>
      </div>

      <div className="members-section">
        <h2>My Groups ({groups.length})</h2>
        <div className="members-grid">
          {groups.map(group => (
            <div key={group.id} className="member-card">
              <div className="member-header">
                <h3>👥 {group.name}</h3>
              </div>
              <button 
                onClick={() => setShowQR(showQR === group.id ? null : group.id)}
                className="btn-secondary"
              >
                {showQR === group.id ? '✕ Hide QR' : '📱 Share QR Code'}
              </button>
              {showQR === group.id && (
                <div className="qr-modal">
                  <QRCodeSVG value={generateGroupURL(group)} size={180} />
                  <p style={{margin: '10px 0', fontWeight: 'bold'}}>Scan to join group</p>
                  <div className="share-link-container">
                    <input 
                      type="text" 
                      value={generateGroupURL(group)} 
                      readOnly 
                      className="share-link-input"
                    />
                    <button 
                      onClick={() => copyLink(generateGroupURL(group), group.id)} 
                      className="btn-copy-link"
                    >
                      {copiedGroup === group.id ? '✓ Link Copied!' : '📋 Copy Link'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Groups;
