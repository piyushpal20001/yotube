'use client';

import { useState, useEffect } from 'react';

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/google-ads/leads', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setLeads(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ color: 'var(--accent)' }}>Leads Management</h1>
        <p style={{ color: 'var(--text-secondary)' }}>View and manage the leads captured from your Google Ads.</p>
      </div>

      <div className="card">
        <h3>Captured Leads</h3>
        {loading ? (
          <p style={{ marginTop: '20px' }}>Loading leads...</p>
        ) : leads.length === 0 ? (
          <p style={{ marginTop: '20px', color: 'var(--text-secondary)' }}>No leads captured yet. Your active ads will generate leads here.</p>
        ) : (
          <div style={{ marginTop: '30px', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', background: 'var(--bg-dark)', borderRadius: '8px', overflow: 'hidden' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)' }}>
                  <th style={{ padding: '15px' }}>Name</th>
                  <th style={{ padding: '15px' }}>Email</th>
                  <th style={{ padding: '15px' }}>Phone</th>
                  <th style={{ padding: '15px' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead: any) => (
                  <tr key={lead.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '15px', fontWeight: '500' }}>{lead.name}</td>
                    <td style={{ padding: '15px' }}>{lead.email}</td>
                    <td style={{ padding: '15px' }}>{lead.phone}</td>
                    <td style={{ padding: '15px', color: 'var(--text-secondary)' }}>{new Date(lead.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
