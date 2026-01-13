import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getToken } from '../services/auth';

const API = 'https://x7v2x7sgsg.execute-api.us-east-1.amazonaws.com';

function JoinGroup() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('joining');

  useEffect(() => {
    const groupId = searchParams.get('id');
    const inviteCode = searchParams.get('code');

    if (!groupId || !inviteCode) {
      setStatus('error');
      return;
    }

    const joinGroup = async () => {
      try {
        const res = await fetch(`${API}/api/groups/${groupId}/join`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + getToken()
          },
          body: JSON.stringify({ inviteCode })
        });
        const data = await res.json();
        
        if (data.success) {
          setStatus('success');
          setTimeout(() => navigate('/groups'), 2000);
        } else {
          setStatus('error');
        }
      } catch (err) {
        setStatus('error');
      }
    };

    joinGroup();
  }, [searchParams, navigate]);

  return (
    <div className="page-container" style={{textAlign: 'center', paddingTop: '4rem'}}>
      {status === 'joining' && (
        <>
          <div className="spinner"></div>
          <h2>Joining group...</h2>
        </>
      )}
      {status === 'success' && (
        <>
          <h2 style={{color: '#4caf50'}}>✓ Successfully joined group!</h2>
          <p>Redirecting to groups page...</p>
        </>
      )}
      {status === 'error' && (
        <>
          <h2 style={{color: '#f44336'}}>✗ Failed to join group</h2>
          <p>Invalid invite link or you're already a member.</p>
          <button onClick={() => navigate('/groups')} className="btn-primary" style={{marginTop: '1rem'}}>
            Go to Groups
          </button>
        </>
      )}
    </div>
  );
}

export default JoinGroup;
