'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MultiChannelUnifiedDeployer() {
  const [selectedChannels, setSelectedChannels] = useState({
    search: true,
    video: true,
    banner: true,
  });

  const [formData, setFormData] = useState({
    name: '',
    budget: '500',
    customerId: '207-605-8042',
    businessName: 'Super Bikes Hub',
    finalUrl: 'http://example.com',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  });

  // Combined creative content
  const [headlines, setHeadlines] = useState(['Buy Best Bikes', 'Top Quality Cycles', 'Super Fast Delivery']);
  const [descriptions, setDescriptions] = useState(['Best bikes in the city', 'Quality assurance and fast delivery']);
  
  const [mediaUrl, setMediaUrl] = useState(''); // Uploaded photo (e.g. cute cat photo)
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  
  // Preview carousel state
  const [activePreviewTab, setActivePreviewTab] = useState<'SEARCH' | 'VIDEO' | 'BANNER'>('SEARCH');
  
  const router = useRouter();

  // Auto-set the active preview tab to the first checked channel
  useEffect(() => {
    if (selectedChannels.search) {
      setActivePreviewTab('SEARCH');
    } else if (selectedChannels.video) {
      setActivePreviewTab('VIDEO');
    } else if (selectedChannels.banner) {
      setActivePreviewTab('BANNER');
    }
  }, [selectedChannels.search, selectedChannels.video, selectedChannels.banner]);

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const data = new FormData();
      data.append('media', file);
      try {
        setStatus('Uploading photo...');
        const res = await fetch('http://localhost:5000/api/google-ads/upload', {
          method: 'POST',
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          body: data
        });
        const result = await res.json();
        if (result.url) {
          setMediaUrl(result.url);
          setStatus('✅ Photo uploaded successfully!');
        }
      } catch (err) {
        setStatus('❌ Failed to upload photo');
      }
    }
  };

  const handleMultiChannelLaunch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if at least one channel is selected
    if (!selectedChannels.search && !selectedChannels.video && !selectedChannels.banner) {
      setStatus('⚠️ Please select at least one channel to launch!');
      return;
    }

    setLoading(true);
    setStatus('🚀 Starting 1-Click Custom Launch...');
    const token = localStorage.getItem('token');

    try {
      const baseName = formData.name || 'Omnichannel Promo';
      let currentStep = 1;
      const totalSteps = Object.values(selectedChannels).filter(Boolean).length;

      // ==========================================
      // PART 1: SEARCH CAMPAIGN & AD
      // ==========================================
      if (selectedChannels.search) {
        setStatus(`⏳ Step ${currentStep}/${totalSteps}: Deploying Google Search Campaign...`);
        const searchRes = await fetch('http://localhost:5000/api/google-ads/campaigns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            customerId: formData.customerId,
            campaignData: {
              name: `${baseName} [SEARCH]`,
              type: 'SEARCH',
              budgetMicros: (parseInt(formData.budget) * 1_000_000).toString(),
            }
          })
        });
        const searchData = await searchRes.json();
        if (searchRes.ok) {
          const agRes = await fetch('http://localhost:5000/api/google-ads/ad-groups', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              customerId: formData.customerId,
              campaignResourceName: searchData.googleCampaignId,
              name: `Search Ad Group - ${baseName}`
            })
          });
          const agData = await agRes.json();
          if (agRes.ok) {
            await fetch('http://localhost:5000/api/google-ads/ads', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({
                customerId: formData.customerId,
                adGroupId: agData.googleAdGroupId,
                adData: {
                  headlines,
                  descriptions,
                  mediaUrl,
                  finalUrl: formData.finalUrl
                }
              })
            });
          }
        }
        currentStep++;
      }

      // ==========================================
      // PART 2: YOUTUBE BANNER AD (DISCOVERY/DEMAND GEN)
      // ==========================================
      if (selectedChannels.banner) {
        setStatus(`⏳ Step ${currentStep}/${totalSteps}: Deploying YouTube Image Banner Campaign...`);
        const bannerRes = await fetch('http://localhost:5000/api/google-ads/campaigns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            customerId: formData.customerId,
            campaignData: {
              name: `[YOUTUBE_IMAGE] ${baseName}`,
              type: 'DISCOVERY',
              budgetMicros: (parseInt(formData.budget) * 1_000_000).toString(),
            }
          })
        });
        const bannerData = await bannerRes.json();
        if (bannerRes.ok) {
          const agBannerRes = await fetch('http://localhost:5000/api/google-ads/ad-groups', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              customerId: formData.customerId,
              campaignResourceName: bannerData.googleCampaignId,
              name: `[VIDEO] Banner Group - ${baseName}`
            })
          });
          const agBannerData = await agBannerRes.json();
          if (agBannerRes.ok) {
            await fetch('http://localhost:5000/api/google-ads/ads', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({
                customerId: formData.customerId,
                adGroupId: agBannerData.googleAdGroupId,
                adData: {
                  type: 'VIDEO',
                  videoUrl: '', // signifies pure image ad
                  businessName: formData.businessName,
                  headlines: [headlines[0]],
                  descriptions: [descriptions[0]],
                  mediaUrl,
                  finalUrl: formData.finalUrl
                }
              })
            });
          }
        }
        currentStep++;
      }

      // ==========================================
      // PART 3: YOUTUBE VIDEO AD (VIDEO)
      // ==========================================
      if (selectedChannels.video && formData.videoUrl) {
        setStatus(`⏳ Step ${currentStep}/${totalSteps}: Deploying YouTube Responsive Video Campaign...`);
        const videoCampaignRes = await fetch('http://localhost:5000/api/google-ads/campaigns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            customerId: formData.customerId,
            campaignData: {
              name: `[VIDEO] ${baseName}`,
              type: 'VIDEO',
              budgetMicros: (parseInt(formData.budget) * 1_000_000).toString(),
            }
          })
        });
        const videoCampaignData = await videoCampaignRes.json();
        if (videoCampaignRes.ok) {
          const agVideoRes = await fetch('http://localhost:5000/api/google-ads/ad-groups', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              customerId: formData.customerId,
              campaignResourceName: videoCampaignData.googleCampaignId,
              name: `[VIDEO] Ad Group - ${baseName}`
            })
          });
          const agVideoData = await agVideoRes.json();
          if (agVideoRes.ok) {
            await fetch('http://localhost:5000/api/google-ads/ads', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({
                customerId: formData.customerId,
                adGroupId: agVideoData.googleAdGroupId,
                adData: {
                  type: 'VIDEO',
                  videoUrl: formData.videoUrl,
                  businessName: formData.businessName,
                  headlines: [headlines[0]],
                  descriptions: [descriptions[0]],
                  mediaUrl,
                  finalUrl: formData.finalUrl
                }
              })
            });
          }
        }
      }

      setStatus('🎉 Custom Multi-Channel Campaign Deployed Successfully!');
      setTimeout(() => {
        router.push('/');
      }, 3000);

    } catch (err: any) {
      setStatus(`❌ Error during custom deployment: ${err.message || 'Error occurred'}`);
    } finally {
      setLoading(false);
    }
  };

  // Helper to get YouTube Video ID
  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : '';
  };

  const videoId = getYoutubeId(formData.videoUrl);

  const showVideoUrlInput = selectedChannels.video;
  const showImageUploadInput = selectedChannels.search || selectedChannels.video || selectedChannels.banner;
  const showBusinessNameInput = selectedChannels.video || selectedChannels.banner;

  return (
    <div className="main-content" style={{ padding: '40px 20px', minHeight: '100vh', background: 'var(--bg-dark)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '40px', maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Left Side: Consolidated Omni-Channel Form */}
        <div className="card" style={{ padding: '30px', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <h1 style={{ marginBottom: '10px', color: 'var(--accent)', fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            🚀 Custom Multi-Channel Launcher
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '25px', fontSize: '0.9rem' }}>
            Select target ad formats, enter details once, and deploy to your selected channels with one single click!
          </p>

          <form onSubmit={handleMultiChannelLaunch} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* TICKET CHANNEL SELECTOR (CHECKBOXES) */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <label style={{ display: 'block', marginBottom: '15px', fontWeight: 'bold', color: 'var(--accent)', fontSize: '0.9rem' }}>
                🎯 Select Platforms to Deploy (Tick to Choose)
              </label>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '10px 15px', borderRadius: '8px', border: '1px solid var(--border)', background: selectedChannels.search ? 'rgba(56, 189, 248, 0.05)' : 'transparent', transition: 'all 0.2s' }}>
                  <input 
                    type="checkbox" 
                    checked={selectedChannels.search}
                    onChange={(e) => setSelectedChannels({...selectedChannels, search: e.target.checked})}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--accent)', cursor: 'pointer' }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.2rem' }}>🔍</span>
                    <div>
                      <span style={{ fontWeight: 'bold', color: 'white', fontSize: '0.9rem' }}>Google Search Ad</span>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Deploy text ads on Google Search Network</div>
                    </div>
                  </div>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '10px 15px', borderRadius: '8px', border: '1px solid var(--border)', background: selectedChannels.video ? 'rgba(56, 189, 248, 0.05)' : 'transparent', transition: 'all 0.2s' }}>
                  <input 
                    type="checkbox" 
                    checked={selectedChannels.video}
                    onChange={(e) => setSelectedChannels({...selectedChannels, video: e.target.checked})}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--accent)', cursor: 'pointer' }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.2rem' }}>📺</span>
                    <div>
                      <span style={{ fontWeight: 'bold', color: 'white', fontSize: '0.9rem' }}>YouTube Video Ad</span>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Deploy responsive video players on YouTube App</div>
                    </div>
                  </div>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '10px 15px', borderRadius: '8px', border: '1px solid var(--border)', background: selectedChannels.banner ? 'rgba(56, 189, 248, 0.05)' : 'transparent', transition: 'all 0.2s' }}>
                  <input 
                    type="checkbox" 
                    checked={selectedChannels.banner}
                    onChange={(e) => setSelectedChannels({...selectedChannels, banner: e.target.checked})}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--accent)', cursor: 'pointer' }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.2rem' }}>🖼️</span>
                    <div>
                      <span style={{ fontWeight: 'bold', color: 'white', fontSize: '0.9rem' }}>YouTube Image Banner Ad</span>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Deploy large native feed photo banners on YouTube Feed</div>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Standard Settings */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '600' }}>Campaign Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Cutest Cat Promotion"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  style={{ width: '100%', padding: '10px', background: 'var(--bg-dark)', border: '1px solid var(--border)', color: 'white', borderRadius: '8px' }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '600' }}>Daily Budget ($ / ₹)</label>
                <input 
                  type="number" 
                  value={formData.budget}
                  onChange={(e) => setFormData({...formData, budget: e.target.value})}
                  style={{ width: '100%', padding: '10px', background: 'var(--bg-dark)', border: '1px solid var(--border)', color: 'white', borderRadius: '8px' }}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: showBusinessNameInput ? '1.2fr 1fr' : '1fr', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '600' }}>Google Customer ID</label>
                <input 
                  type="text" 
                  value={formData.customerId}
                  onChange={(e) => setFormData({...formData, customerId: e.target.value})}
                  style={{ width: '100%', padding: '10px', background: 'var(--bg-dark)', border: '1px solid var(--border)', color: 'white', borderRadius: '8px' }}
                  required
                />
              </div>
              {showBusinessNameInput && (
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '600' }}>Business Name</label>
                  <input 
                    type="text" 
                    value={formData.businessName}
                    onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                    style={{ width: '100%', padding: '10px', background: 'var(--bg-dark)', border: '1px solid var(--border)', color: 'white', borderRadius: '8px' }}
                    required
                  />
                </div>
              )}
            </div>

            {/* Creative Texts */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.85rem' }}>Ad Headlines (Search Ad uses all three, YouTube uses the first)</label>
              {headlines.map((h, i) => (
                <input
                  key={i}
                  type="text"
                  value={h}
                  onChange={(e) => {
                    const newH = [...headlines];
                    newH[i] = e.target.value;
                    setHeadlines(newH);
                  }}
                  style={{ width: '100%', padding: '10px', background: 'var(--bg-dark)', border: '1px solid var(--border)', color: 'white', borderRadius: '8px' }}
                  required
                />
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.85rem' }}>Ad Descriptions</label>
              {descriptions.map((d, i) => (
                <textarea
                  key={i}
                  value={d}
                  onChange={(e) => {
                    const newD = [...descriptions];
                    newD[i] = e.target.value;
                    setDescriptions(newD);
                  }}
                  style={{ width: '100%', padding: '10px', background: 'var(--bg-dark)', border: '1px solid var(--border)', color: 'white', borderRadius: '8px', height: '60px' }}
                  required
                />
              ))}
            </div>

            {/* Dynamic Image Upload */}
            {showImageUploadInput && (
              <div>
                <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '600' }}>
                  Upload Ad Photo (1:1 Square - e.g. Cat / Product Photo)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUploadImage}
                  style={{ padding: '10px', background: 'var(--bg-dark)', border: '1px dashed var(--border)', color: 'white', borderRadius: '8px', width: '100%' }}
                />
                {mediaUrl && (
                  <div style={{ marginTop: '10px' }}>
                    <img src={mediaUrl} alt="Uploaded Banner" style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border)' }} />
                  </div>
                )}
              </div>
            )}

            {/* Dynamic Video Input */}
            {showVideoUrlInput && (
              <div>
                <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '600' }}>
                  YouTube Video URL
                </label>
                <input 
                  type="text" 
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={formData.videoUrl}
                  onChange={(e) => setFormData({...formData, videoUrl: e.target.value})}
                  style={{ width: '100%', padding: '10px', background: 'var(--bg-dark)', border: '1px solid var(--border)', color: 'white', borderRadius: '8px' }}
                  required
                />
              </div>
            )}

            {/* Final Landing Page Destination */}
            <div>
              <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '600' }}>Landing Page URL (Destination)</label>
              <input 
                type="text" 
                value={formData.finalUrl}
                onChange={(e) => setFormData({...formData, finalUrl: e.target.value})}
                style={{ width: '100%', padding: '10px', background: 'var(--bg-dark)', border: '1px solid var(--border)', color: 'white', borderRadius: '8px' }}
                required
              />
            </div>

            {status && (
              <div style={{
                padding: '12px',
                borderRadius: '8px',
                background: status.includes('❌') ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                border: status.includes('❌') ? '1px solid #ef4444' : '1px solid #10b981',
                color: 'white',
                fontSize: '0.85rem',
                textAlign: 'center',
                fontWeight: '600'
              }}>
                {status}
              </div>
            )}

            <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '10px', padding: '15px', fontSize: '1rem', fontWeight: 'bold' }}>
              {loading ? 'Omni-Deploying...' : '✨ Launch Selected Campaigns (1-Click)'}
            </button>

          </form>
        </div>

        {/* Right Side: Preview Tabs & Mobile device */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
          
          {/* Dynamic Preview Channels Carousel */}
          <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.03)', padding: '5px', borderRadius: '8px', border: '1px solid var(--border)' }}>
            {selectedChannels.search && (
              <button
                onClick={() => setActivePreviewTab('SEARCH')}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  background: activePreviewTab === 'SEARCH' ? 'var(--accent)' : 'transparent',
                  color: activePreviewTab === 'SEARCH' ? '#000' : 'white',
                  border: 'none',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  transition: 'all 0.3s ease'
                }}
              >
                🔍 Google Search
              </button>
            )}
            {selectedChannels.video && (
              <button
                onClick={() => setActivePreviewTab('VIDEO')}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  background: activePreviewTab === 'VIDEO' ? 'var(--accent)' : 'transparent',
                  color: activePreviewTab === 'VIDEO' ? '#000' : 'white',
                  border: 'none',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  transition: 'all 0.3s ease'
                }}
              >
                📺 YouTube Video
              </button>
            )}
            {selectedChannels.banner && (
              <button
                onClick={() => setActivePreviewTab('BANNER')}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  background: activePreviewTab === 'BANNER' ? 'var(--accent)' : 'transparent',
                  color: activePreviewTab === 'BANNER' ? '#000' : 'white',
                  border: 'none',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  transition: 'all 0.3s ease'
                }}
              >
                🖼️ YouTube Banner
              </button>
            )}
          </div>

          {activePreviewTab === 'SEARCH' && selectedChannels.search ? (
            // Search Mobile Ad Preview
            <div style={{
              width: '100%',
              maxWidth: '360px',
              height: '560px',
              border: '8px solid #222',
              borderRadius: '36px',
              background: '#f8f9fa',
              margin: '0 auto',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              position: 'relative'
            }}>
              <div style={{ width: '120px', height: '18px', background: '#222', borderRadius: '0 0 12px 12px', margin: '0 auto', zIndex: 10 }}></div>
              <div style={{ padding: '15px 20px 10px', borderBottom: '1px solid #e0e0e0', background: 'white' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
                  <span style={{ color: '#4285F4', fontWeight: 'bold', fontSize: '1.4rem' }}>G</span>
                  <span style={{ color: '#EA4335', fontWeight: 'bold', fontSize: '1.4rem' }}>o</span>
                  <span style={{ color: '#FBBC05', fontWeight: 'bold', fontSize: '1.4rem' }}>o</span>
                  <span style={{ color: '#4285F4', fontWeight: 'bold', fontSize: '1.4rem' }}>g</span>
                  <span style={{ color: '#34A853', fontWeight: 'bold', fontSize: '1.4rem' }}>l</span>
                  <span style={{ color: '#EA4335', fontWeight: 'bold', fontSize: '1.4rem' }}>e</span>
                </div>
                <div style={{ width: '100%', height: '36px', border: '1px solid #dfe1e5', borderRadius: '18px', padding: '0 15px', display: 'flex', alignItems: 'center', fontSize: '0.85rem', color: '#777' }}>
                  🔍 search Google...
                </div>
              </div>
              <div style={{ padding: '20px', background: 'white', margin: '12px', borderRadius: '16px', border: '1px solid #eaeaea' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#4285F4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.6rem', fontWeight: 'bold' }}>G</div>
                  <span style={{ fontSize: '0.75rem', color: '#202124' }}>{formData.finalUrl || 'www.example.com'}</span>
                  <span style={{ fontSize: '0.7rem', color: '#70757a', marginLeft: 'auto' }}>Sponsored • Ad</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '15px' }}>
                  <div>
                    <h4 style={{ color: '#1a0dab', fontSize: '1.05rem', margin: '0 0 6px 0', fontWeight: '500', lineHeight: '1.3' }}>
                      {headlines[0]} - {headlines[1]}
                    </h4>
                    <p style={{ color: '#4d5156', fontSize: '0.8rem', margin: 0, lineHeight: '1.4' }}>
                      {descriptions[0]}. {descriptions[1]}.
                    </p>
                  </div>
                  <div style={{ width: '100%', height: '80px', borderRadius: '8px', background: '#eaeaea', overflow: 'hidden', border: '1px solid #eaeaea' }}>
                    {mediaUrl ? (
                      <img src={mediaUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: '#ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#777', fontSize: '0.7rem' }}>No Photo</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : activePreviewTab === 'VIDEO' && selectedChannels.video ? (
            // YouTube Video Ad + Companion Photo Banner Preview
            <div style={{
              width: '100%',
              maxWidth: '360px',
              height: '560px',
              border: '8px solid #222',
              borderRadius: '36px',
              background: '#0f0f0f',
              margin: '0 auto',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              position: 'relative'
            }}>
              <div style={{ width: '120px', height: '18px', background: '#222', borderRadius: '0 0 12px 12px', margin: '0 auto', zIndex: 10 }}></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 15px', borderBottom: '1px solid #222' }}>
                <span style={{ color: '#ff0000', fontWeight: 'bold', fontSize: '1.1rem', letterSpacing: '-1px' }}>
                  📺 YouTube <span style={{ color: 'white', fontSize: '0.6rem', padding: '1px 4px', background: '#333', borderRadius: '3px', marginLeft: '5px' }}>Premium</span>
                </span>
                <span style={{ color: '#aaa', fontSize: '1.2rem' }}>🔍</span>
              </div>
              <div style={{ width: '100%', height: '180px', background: '#000', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                {videoId ? (
                  <iframe 
                    width="100%" 
                    height="100%" 
                    src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&loop=1`}
                    title="YouTube Ad Video" 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    style={{ border: 'none' }}
                  ></iframe>
                ) : (
                  <div style={{ color: '#555', textAlign: 'center' }}>Video Preview Placeholder</div>
                )}
                <div style={{ position: 'absolute', bottom: '10px', left: '10px', background: 'rgba(0,0,0,0.7)', color: '#ffeb3b', padding: '2px 6px', fontSize: '0.75rem', fontWeight: 'bold', borderRadius: '4px' }}>
                  AD • 0:15
                </div>
              </div>
              <div style={{ background: '#212121', padding: '10px 15px', display: 'flex', gap: '15px', alignItems: 'center', borderBottom: '1px solid #333' }}>
                <div style={{ width: '50px', height: '50px', borderRadius: '8px', background: '#333', overflow: 'hidden', flexShrink: 0, border: '1px solid #444' }}>
                  {mediaUrl ? (
                    <img src={mediaUrl} alt="Companion" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ color: '#777', fontSize: '0.6rem', textAlign: 'center', lineHeight: '50px' }}>No Photo</div>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxWidth: '55%' }}>
                  <div style={{ color: '#fff', fontSize: '0.8rem', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {formData.businessName || 'Business Name'}
                  </div>
                  <div style={{ color: '#aaa', fontSize: '0.7rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {formData.finalUrl || 'www.example.com'}
                  </div>
                </div>
                <button style={{ background: '#3ea6ff', color: '#0f0f0f', border: 'none', padding: '6px 12px', borderRadius: '18px', fontWeight: 'bold', fontSize: '0.75rem', cursor: 'pointer', marginLeft: 'auto' }}>
                  Visit
                </button>
              </div>
              <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 'bold', lineHeight: '1.3' }}>
                  {headlines[0] || 'Ad Title headline'}
                </div>
                <div style={{ color: '#aaa', fontSize: '0.75rem', lineHeight: '1.4' }}>
                  {descriptions[0] || 'Ad description body details.'}
                </div>
              </div>
            </div>
          ) : activePreviewTab === 'BANNER' && selectedChannels.banner ? (
            // YouTube Home Feed Image Only Ad Preview
            <div style={{
              width: '100%',
              maxWidth: '360px',
              height: '560px',
              border: '8px solid #222',
              borderRadius: '36px',
              background: '#0f0f0f',
              margin: '0 auto',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              position: 'relative'
            }}>
              <div style={{ width: '120px', height: '18px', background: '#222', borderRadius: '0 0 12px 12px', margin: '0 auto', zIndex: 10 }}></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 15px', borderBottom: '1px solid #222', background: '#0f0f0f' }}>
                <span style={{ color: '#ff0000', fontWeight: 'bold', fontSize: '1.1rem', letterSpacing: '-1px' }}>
                  📺 YouTube
                </span>
                <span style={{ color: '#aaa', fontSize: '1.2rem' }}>🔍</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', background: '#151515', borderBottom: '4px solid #222' }}>
                <div style={{ width: '100%', height: '200px', background: '#222', position: 'relative', overflow: 'hidden' }}>
                  {mediaUrl ? (
                    <img src={mediaUrl} alt="Ad Feed Banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ color: '#777', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', flexDirection: 'column', gap: '8px' }}>
                      <span>🖼️ Upload a Photo to see it in YouTube Feed!</span>
                    </div>
                  )}
                  <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(0,0,0,0.8)', color: '#ffeb3b', padding: '3px 8px', fontSize: '0.75rem', fontWeight: 'bold', borderRadius: '3px' }}>
                    Sponsored • Banner Ad
                  </div>
                </div>
                <div style={{ padding: '12px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1e1e1e' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxWidth: '70%' }}>
                    <span style={{ color: 'white', fontSize: '0.8rem', fontWeight: 'bold' }}>{formData.businessName || 'Business Name'}</span>
                    <span style={{ color: '#3ea6ff', fontSize: '0.7rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{formData.finalUrl || 'www.example.com'}</span>
                  </div>
                  <button style={{ background: '#3ea6ff', color: '#0f0f0f', border: 'none', padding: '8px 16px', borderRadius: '18px', fontWeight: 'bold', fontSize: '0.75rem', cursor: 'pointer' }}>
                    Visit Site
                  </button>
                </div>
                <div style={{ padding: '12px 15px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <h4 style={{ color: 'white', fontSize: '0.9rem', margin: 0, fontWeight: 'bold' }}>{headlines[0]}</h4>
                  <p style={{ color: '#aaa', fontSize: '0.75rem', margin: 0, lineHeight: '1.4' }}>{descriptions[0]}</p>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ color: '#777', fontSize: '0.9rem', textAlign: 'center', marginTop: '100px' }}>
              Please select at least one target channel above to see real-time mockups!
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
