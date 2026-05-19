"use client";
import { useState } from 'react';

export default function Accounts() {
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/auth/google');
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Failed to connect:', error);
      alert('Error connecting to Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px' }}>
      <h1>Google Ads Accounts</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '40px' }}>Manage your Google Ads account connections and MCC access.</p>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3>Connect New Account</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '5px' }}>
              We need access to your Google Ads API to manage campaigns on your behalf.
            </p>
          </div>
          <button 
            className="btn-primary" 
            onClick={handleConnect}
            disabled={loading}
          >
            {loading ? 'Connecting...' : 'Connect Google Ads'}
          </button>
        </div>
      </div>

      <div style={{ marginTop: '40px' }}>
        <h3>Linked Accounts</h3>
        <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <p style={{ color: 'var(--text-secondary)' }}>No accounts linked yet. Click the button above to start.</p>
        </div>
      </div>
    </div>
  );
}
