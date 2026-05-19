'use client';

import { useState, useEffect } from 'react';

export default function Dashboard() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [leadFormAdId, setLeadFormAdId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  
  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/google-ads/campaigns', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setCampaigns(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLeadSubmit = async (e: any) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      adId: leadFormAdId
    };
    
    try {
      const res = await fetch('http://localhost:5000/api/google-ads/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        alert('Lead submitted successfully!');
        setLeadFormAdId(null);
      } else {
        alert('Failed to submit lead');
      }
    } catch(err) {
      console.error(err);
    }
  };

  return (
    <>
    <div className="main-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h1 style={{ color: 'var(--accent)' }}>Dashboard Overview</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Welcome back, here's your live Google Ads data.</p>
        </div>
        <div style={{ display: 'flex', gap: '15px' }}>
            <a href="/ads/create" className="btn-primary" style={{ textDecoration: 'none', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>+ Create Ad</a>
            <a href="/campaigns/create" className="btn-primary" style={{ textDecoration: 'none' }}>+ Create Campaign</a>
        </div>
      </div>

      <div className="stat-grid">
        <div className="card">
          <p style={{ color: 'var(--text-secondary)', marginBottom: '10px' }}>Total Campaigns</p>
          <h2 style={{ fontSize: '2rem' }}>{campaigns.length}</h2>
        </div>
        <div className="card">
          <p style={{ color: 'var(--text-secondary)', marginBottom: '10px' }}>Active Budget</p>
          <h2 style={{ fontSize: '2rem' }}>${campaigns.reduce((acc, c) => acc + (Number(c.budgetMicros) / 1000000), 0).toFixed(2)}</h2>
        </div>
      </div>

      <div className="card" style={{ marginTop: '40px' }}>
        <h3>Your Campaigns & Ads</h3>
        {loading ? (
          <p style={{ marginTop: '20px' }}>Loading data...</p>
        ) : campaigns.length === 0 ? (
          <p style={{ marginTop: '20px', color: 'var(--text-secondary)' }}>No campaigns found. Create one to get started!</p>
        ) : (
          <div style={{ marginTop: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {campaigns.map((c) => (
              <div key={c.id} className="glass" style={{ padding: '25px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                    <div>
                        <p style={{ fontWeight: '700', fontSize: '1.2rem' }}>{c.name}</p>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ID: {c.googleCampaignId}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <p style={{ fontWeight: '600', color: 'var(--accent)' }}>${(Number(c.budgetMicros) / 1000000).toFixed(2)}/day</p>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{c.status}</p>
                    </div>
                </div>
                
                {/* Display Ads under this campaign */}
                <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid var(--border)' }}>
                    <p style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '10px' }}>Associated Ads:</p>
                    <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                        {c.adGroups?.map((ag: any) => 
                          ag.ads?.map((ad: any) => (
                            <div key={ad.id} style={{ display: 'flex', flexDirection: 'column', background: '#ffffff', maxWidth: '300px', overflow: 'hidden', border: '1px solid #dadce0', boxShadow: '0 1px 2px 0 rgba(60,64,67,0.3)', borderRadius: '4px', fontFamily: 'Arial, sans-serif' }}>
                                {/* Google Ad Header */}
                                <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #f1f3f4', background: '#ffffff' }}>
                                    <div style={{ width: '24px', height: '24px', background: '#e8eaed', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5f6368', fontSize: '12px', fontWeight: 'bold' }}>W</div>
                                    <div style={{ flexGrow: 1 }}>
                                        <p style={{ fontWeight: '600', color: '#202124', fontSize: '0.75rem', margin: 0, lineHeight: '1' }}>yourwebsite.com</p>
                                        <p style={{ color: '#5f6368', fontSize: '0.65rem', margin: 0, marginTop: '2px' }}>Sponsored</p>
                                    </div>
                                    <div style={{ cursor: 'pointer' }}>
                                        <svg focusable="false" viewBox="0 0 24 24" fill="#5f6368" width="16px" height="16px"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path></svg>
                                    </div>
                                </div>
                                
                                {/* Ad Media */}
                                {ad.mediaUrl && (
                                  <div style={{ width: '100%', background: '#f8f9fa', position: 'relative' }}>
                                    {ad.mediaUrl.match(/\.(mp4|webm|ogg)$/i) ? (
                                      <video src={ad.mediaUrl} controls style={{ width: '100%', display: 'block', maxHeight: '250px', objectFit: 'contain' }} />
                                    ) : (
                                      <img src={ad.mediaUrl} alt="Ad Media" style={{ width: '100%', height: '200px', objectFit: 'cover', display: 'block' }} />
                                    )}
                                  </div>
                                )}

                                {/* Ad Content */}
                                <div style={{ padding: '16px', background: '#ffffff', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                  <p style={{ fontWeight: '400', fontSize: '1.1rem', color: '#1a0dab', marginBottom: '6px', lineHeight: '1.3', margin: '0 0 8px 0' }}>{ad.headline}</p>
                                  <p style={{ color: '#4d5156', marginBottom: '16px', lineHeight: '1.4', fontSize: '0.85rem', margin: '0 0 16px 0' }}>{ad.description}</p>
                                  
                                  {/* CTA Button */}
                                  <div style={{ marginTop: 'auto', textAlign: 'right' }}>
                                    <button 
                                      onClick={() => setLeadFormAdId(ad.id)}
                                      style={{ background: '#1a73e8', color: '#ffffff', border: 'none', padding: '8px 24px', borderRadius: '4px', fontWeight: '500', fontSize: '0.85rem', cursor: 'pointer', transition: 'background 0.2s' }} 
                                      onMouseOver={(e) => e.currentTarget.style.background = '#1b66c9'} 
                                      onMouseOut={(e) => e.currentTarget.style.background = '#1a73e8'}
                                    >
                                        Apply Now
                                    </button>
                                  </div>
                                </div>
                            </div>
                          ))
                        )}
                        {(!c.adGroups || c.adGroups.length === 0 || c.adGroups.every((ag: any) => ag.ads.length === 0)) && (
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>No ads created yet.</p>
                        )}
                    </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>

      {/* Lead Form Modal */}
      {leadFormAdId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card glass" style={{ width: '90%', maxWidth: '400px', padding: '30px', position: 'relative' }}>
            <button 
              onClick={() => setLeadFormAdId(null)} 
              style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '1.5rem', cursor: 'pointer' }}
            >
              &times;
            </button>
            <h2 style={{ color: 'var(--accent)', marginBottom: '10px' }}>Get a Quote</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '25px', fontSize: '0.9rem' }}>Leave your details and our team will contact you shortly.</p>
            
            <form onSubmit={handleLeadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Full Name</label>
                <input type="text" name="name" required placeholder="John Doe" style={{ width: '100%', padding: '10px', background: 'var(--bg-dark)', border: '1px solid var(--border)', color: 'white', borderRadius: '6px' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Email Address</label>
                <input type="email" name="email" required placeholder="john@example.com" style={{ width: '100%', padding: '10px', background: 'var(--bg-dark)', border: '1px solid var(--border)', color: 'white', borderRadius: '6px' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Phone Number</label>
                <input type="tel" name="phone" required placeholder="+1 234 567 8900" style={{ width: '100%', padding: '10px', background: 'var(--bg-dark)', border: '1px solid var(--border)', color: 'white', borderRadius: '6px' }} />
              </div>
              <button type="submit" className="btn-primary" style={{ marginTop: '10px', width: '100%' }}>Submit Details</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
