'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateAdPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [customerId, setCustomerId] = useState('207-605-8042');
  const [adGroupName, setAdGroupName] = useState('');
  
  // YouTube specific sub-types
  // 'VIDEO_AND_IMAGE' = Video Ad with Companion Photo Banner
  // 'IMAGE_FEED_ONLY' = YouTube Feed Image Ad (Demand Gen)
  const [youtubeSubType, setYoutubeSubType] = useState<'VIDEO_AND_IMAGE' | 'IMAGE_FEED_ONLY'>('VIDEO_AND_IMAGE');

  // Search Ad fields
  const [headlines, setHeadlines] = useState(['Buy Best Bikes', 'Top Quality Cycles', 'Super Fast Delivery']);
  const [descriptions, setDescriptions] = useState(['Best bikes in the city', 'Quality assurance and fast delivery']);
  
  // Shared fields
  const [mediaUrl, setMediaUrl] = useState(''); // Uploaded image URL
  const [videoUrl, setVideoUrl] = useState('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  const [businessName, setBusinessName] = useState('Super Bikes Hub');
  const [videoHeadline, setVideoHeadline] = useState('Unleash the Ride - Buy Now!');
  const [videoDescription, setVideoDescription] = useState('Get the best premium sports bikes in the country today.');
  const [finalUrl, setFinalUrl] = useState('http://example.com');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setAdGroupName(`Ad Group ${Math.floor(100 + Math.random() * 900)}`);
    fetchCampaigns();
    
    // Handle URL parameters
    const params = new URLSearchParams(window.location.search);
    const campaignId = params.get('campaignId');
    const custId = params.get('customerId');
    if (campaignId) setSelectedCampaign(campaignId);
    if (custId) setCustomerId(custId);
  }, []);

  const fetchCampaigns = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/google-ads/campaigns', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setCampaigns(data);
        if (data.length > 0) setSelectedCampaign(data[0].googleCampaignId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const activeCampaign = campaigns.find(c => c.googleCampaignId === selectedCampaign);
  const isVideoCampaign = activeCampaign?.name?.startsWith('[VIDEO]') || activeCampaign?.name?.startsWith('[YOUTUBE_IMAGE]');

  useEffect(() => {
    if (!selectedCampaign) return;
    const active = campaigns.find(c => c.googleCampaignId === selectedCampaign);
    if (active?.name?.startsWith('[YOUTUBE_IMAGE]')) {
      setYoutubeSubType('IMAGE_FEED_ONLY');
    } else if (active?.name?.startsWith('[VIDEO]')) {
      setYoutubeSubType('VIDEO_AND_IMAGE');
    }
  }, [selectedCampaign, campaigns]);

  const handleCreateAd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const token = localStorage.getItem('token');

    // Make sure we prefix the ad group name with [VIDEO] if it is video campaign
    const finalAdGroupName = isVideoCampaign && !adGroupName.startsWith('[VIDEO]') 
      ? `[VIDEO] ${adGroupName}` 
      : adGroupName;

    try {
      // 1. Create Ad Group
      const agRes = await fetch('http://localhost:5000/api/google-ads/ad-groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          customerId,
          campaignResourceName: selectedCampaign,
          name: finalAdGroupName
        })
      });
      const adGroup = await agRes.json();
      if (!agRes.ok) {
        throw new Error(adGroup.message || adGroup.error || 'Failed to create Ad Group');
      }

      // 2. Prepare ad data
      const adDataPayload = isVideoCampaign ? {
        type: 'VIDEO',
        videoUrl: youtubeSubType === 'VIDEO_AND_IMAGE' ? videoUrl : '', // Empty videoUrl signifies image feed ad only
        businessName,
        headlines: [videoHeadline],
        descriptions: [videoDescription],
        mediaUrl, // Uploaded photo
        finalUrl
      } : {
        headlines,
        descriptions,
        mediaUrl,
        finalUrl
      };

      // 3. Create Ad
      const adRes = await fetch('http://localhost:5000/api/google-ads/ads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          customerId,
          adGroupId: adGroup.googleAdGroupId,
          adData: adDataPayload
        })
      });
      const ad = await adRes.json();
      if (!adRes.ok) {
        throw new Error(ad.message || ad.error || 'Failed to create Ad');
      }

      alert('✅ Ad Created and Launched Successfully!');
      router.push('/');
    } catch (err: any) {
      alert(`❌ Error: ${err.message || 'Failed to create Ad'}`);
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

  const videoId = getYoutubeId(videoUrl);

  return (
    <div className="main-content" style={{ padding: '40px 20px', minHeight: '100vh', background: 'var(--bg-dark)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '40px', maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Left Side: Form */}
        <div className="card" style={{ padding: '30px', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <h1 style={{ marginBottom: '10px', color: 'var(--accent)', fontSize: '2rem' }}>
            {isVideoCampaign ? '📺 Launch YouTube Ad' : '🔍 Launch Search Ad'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '25px', fontSize: '0.9rem' }}>
            {isVideoCampaign ? 'Deploy highly engaging Video & Image Ads on YouTube.' : 'Setup standard Google Search ad with image extensions.'}
          </p>

          <form onSubmit={handleCreateAd} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontWeight: '600' }}>Select Campaign</label>
              <select
                value={selectedCampaign}
                onChange={(e) => setSelectedCampaign(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'var(--bg-dark)',
                  border: '1px solid var(--border)',
                  color: 'white',
                  borderRadius: '8px',
                  outline: 'none'
                }}
              >
                {campaigns.map((c) => (
                  <option key={c.id} value={c.googleCampaignId}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sub-selector for YouTube ad types */}
            {isVideoCampaign && (
              <div style={{ padding: '15px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
                <label style={{ display: 'block', marginBottom: '10px', color: 'var(--accent)', fontWeight: '600', fontSize: '0.9rem' }}>
                  Select YouTube Ad Format:
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setYoutubeSubType('VIDEO_AND_IMAGE')}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      background: youtubeSubType === 'VIDEO_AND_IMAGE' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                      border: youtubeSubType === 'VIDEO_AND_IMAGE' ? '2px solid var(--accent)' : '1px solid var(--border)',
                      color: 'white',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    🎥 Video + Photo Banner
                  </button>
                  <button
                    type="button"
                    onClick={() => setYoutubeSubType('IMAGE_FEED_ONLY')}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      background: youtubeSubType === 'IMAGE_FEED_ONLY' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                      border: youtubeSubType === 'IMAGE_FEED_ONLY' ? '2px solid var(--accent)' : '1px solid var(--border)',
                      color: 'white',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    🖼️ YouTube Image Feed Ad
                  </button>
                </div>
              </div>
            )}

            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontWeight: '600' }}>Customer ID</label>
              <input
                type="text"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'var(--bg-dark)',
                  border: '1px solid var(--border)',
                  color: 'white',
                  borderRadius: '8px',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontWeight: '600' }}>Ad Group Name</label>
              <input
                type="text"
                value={adGroupName}
                onChange={(e) => setAdGroupName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'var(--bg-dark)',
                  border: '1px solid var(--border)',
                  color: 'white',
                  borderRadius: '8px',
                  outline: 'none'
                }}
              />
            </div>

            {/* Render conditional inputs */}
            {isVideoCampaign ? (
              // YouTube Video Ad Fields
              <>
                {youtubeSubType === 'VIDEO_AND_IMAGE' && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontWeight: '600' }}>YouTube Video URL</label>
                    <input
                      type="text"
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: 'var(--bg-dark)',
                        border: '1px solid var(--border)',
                        color: 'white',
                        borderRadius: '8px',
                        outline: 'none'
                      }}
                      required
                    />
                  </div>
                )}

                {/* Upload Image is shown in BOTH YouTube Sub-types now! */}
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                    {youtubeSubType === 'VIDEO_AND_IMAGE' ? 'Companion Ad Photo (1:1 Square Banner next to Video)' : 'Feed Ad Photo (Premium 1:1 or 1.91:1 Banner)'}
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        const formData = new FormData();
                        formData.append('media', file);
                        try {
                          const res = await fetch('http://localhost:5000/api/google-ads/upload', {
                            method: 'POST',
                            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                            body: formData
                          });
                          const data = await res.json();
                          if (data.url) {
                            setMediaUrl(data.url);
                          }
                        } catch (err) {
                          alert('Failed to upload image');
                        }
                      }
                    }}
                    style={{
                      padding: '10px',
                      background: 'var(--bg-dark)',
                      border: '1px dashed var(--border)',
                      color: 'white',
                      borderRadius: '8px',
                      width: '100%'
                    }}
                  />
                  {mediaUrl && (
                    <div style={{ marginTop: '10px' }}>
                      <p style={{ fontSize: '0.8rem', color: 'var(--accent)', marginBottom: '5px' }}>Uploaded Banner Photo:</p>
                      <img src={mediaUrl} alt="Companion" style={{ width: '100%', maxHeight: '150px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border)' }} />
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontWeight: '600' }}>Business Name</label>
                  <input
                    type="text"
                    placeholder="Super Bikes Store"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'var(--bg-dark)',
                      border: '1px solid var(--border)',
                      color: 'white',
                      borderRadius: '8px',
                      outline: 'none'
                    }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontWeight: '600' }}>Ad Headline</label>
                  <input
                    type="text"
                    placeholder="Get Your Dream Ride"
                    value={videoHeadline}
                    onChange={(e) => setVideoHeadline(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'var(--bg-dark)',
                      border: '1px solid var(--border)',
                      color: 'white',
                      borderRadius: '8px',
                      outline: 'none'
                    }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontWeight: '600' }}>Ad Description</label>
                  <textarea
                    placeholder="Explore premium sport and urban motorbikes..."
                    value={videoDescription}
                    onChange={(e) => setVideoDescription(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'var(--bg-dark)',
                      border: '1px solid var(--border)',
                      color: 'white',
                      borderRadius: '8px',
                      height: '80px',
                      outline: 'none'
                    }}
                    required
                  />
                </div>
              </>
            ) : (
              // Search Ad Fields
              <>
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontWeight: '600' }}>Upload Ad Image (1:1 Ratio for Google Ads)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        const formData = new FormData();
                        formData.append('media', file);
                        try {
                          const res = await fetch('http://localhost:5000/api/google-ads/upload', {
                            method: 'POST',
                            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                            body: formData
                          });
                          const data = await res.json();
                          if (data.url) {
                            setMediaUrl(data.url);
                          }
                        } catch (err) {
                          alert('Failed to upload image');
                        }
                      }
                    }}
                    style={{
                      padding: '10px',
                      background: 'var(--bg-dark)',
                      border: '1px dashed var(--border)',
                      color: 'white',
                      borderRadius: '8px',
                      width: '100%'
                    }}
                  />
                  {mediaUrl && (
                    <div style={{ marginTop: '10px' }}>
                      <p style={{ fontSize: '0.8rem', color: 'var(--accent)', marginBottom: '5px' }}>Preview:</p>
                      <img src={mediaUrl} alt="Preview" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border)' }} />
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>Headlines (Search Ads require multiple)</label>
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
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: 'var(--bg-dark)',
                        border: '1px solid var(--border)',
                        color: 'white',
                        borderRadius: '8px',
                        outline: 'none'
                      }}
                    />
                  ))}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>Descriptions</label>
                  {descriptions.map((d, i) => (
                    <textarea
                      key={i}
                      value={d}
                      onChange={(e) => {
                        const newD = [...descriptions];
                        newD[i] = e.target.value;
                        setDescriptions(newD);
                      }}
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: 'var(--bg-dark)',
                        border: '1px solid var(--border)',
                        color: 'white',
                        borderRadius: '8px',
                        height: '80px',
                        outline: 'none'
                      }}
                    />
                  ))}
                </div>
              </>
            )}

            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontWeight: '600' }}>Landing Page URL (Final Destination)</label>
              <input
                type="text"
                value={finalUrl}
                onChange={(e) => setFinalUrl(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'var(--bg-dark)',
                  border: '1px solid var(--border)',
                  color: 'white',
                  borderRadius: '8px',
                  outline: 'none'
                }}
              />
            </div>

            <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '20px', padding: '15px' }}>
              {loading ? 'Processing...' : '✨ Launch Ad'}
            </button>
          </form>
        </div>

        {/* Right Side: Visual Mockup Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', justifyContent: 'center' }}>
          <h3 style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '10px' }}>
            📱 Real-time Mobile Ad Preview
          </h3>

          {isVideoCampaign ? (
            // YouTube Previews
            youtubeSubType === 'VIDEO_AND_IMAGE' ? (
              // 1. YouTube Video Ad + Companion Photo Banner Preview
              <div style={{
                width: '100%',
                maxWidth: '360px',
                height: '620px',
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
                {/* Phone Camera Notch */}
                <div style={{ width: '120px', height: '18px', background: '#222', borderRadius: '0 0 12px 12px', margin: '0 auto', zIndex: 10 }}></div>

                {/* YouTube Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 15px', borderBottom: '1px solid #222' }}>
                  <span style={{ color: '#ff0000', fontWeight: 'bold', fontSize: '1.1rem', letterSpacing: '-1px' }}>
                    📺 YouTube <span style={{ color: 'white', fontSize: '0.6rem', padding: '1px 4px', background: '#333', borderRadius: '3px', marginLeft: '5px' }}>Premium</span>
                  </span>
                  <span style={{ color: '#aaa', fontSize: '1.2rem' }}>🔍</span>
                </div>

                {/* Video Player */}
                <div style={{ width: '100%', height: '200px', background: '#000', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
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
                  {/* Ad Label Overlay */}
                  <div style={{ position: 'absolute', bottom: '10px', left: '10px', background: 'rgba(0,0,0,0.7)', color: '#ffeb3b', padding: '2px 6px', fontSize: '0.75rem', fontWeight: 'bold', borderRadius: '4px' }}>
                    AD • 0:15
                  </div>
                </div>

                {/* Companion Photo Banner (Uploaded Custom Photo) */}
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
                      {businessName || 'Business Name'}
                    </div>
                    <div style={{ color: '#aaa', fontSize: '0.7rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {finalUrl || 'www.example.com'}
                    </div>
                  </div>
                  <button style={{ background: '#3ea6ff', color: '#0f0f0f', border: 'none', padding: '6px 12px', borderRadius: '18px', fontWeight: 'bold', fontSize: '0.75rem', cursor: 'pointer', marginLeft: 'auto' }}>
                    Visit
                  </button>
                </div>

                {/* Video Ad Metadata */}
                <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ color: '#fff', fontSize: '1rem', fontWeight: 'bold', lineHeight: '1.3' }}>
                    {videoHeadline || 'Ad Title headline'}
                  </div>
                  <div style={{ color: '#aaa', fontSize: '0.8rem', lineHeight: '1.4' }}>
                    {videoDescription || 'Ad description body details.'}
                  </div>
                </div>

                {/* Feed Divider */}
                <div style={{ height: '8px', background: '#212121', width: '100%' }}></div>

                {/* Simulated Feed video below */}
                <div style={{ padding: '15px', display: 'flex', gap: '10px' }}>
                  <div style={{ width: '100px', height: '60px', borderRadius: '4px', background: '#333' }}></div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1 }}>
                    <div style={{ height: '12px', background: '#333', borderRadius: '3px', width: '90%' }}></div>
                    <div style={{ height: '10px', background: '#222', borderRadius: '3px', width: '60%' }}></div>
                  </div>
                </div>

              </div>
            ) : (
              // 2. YouTube Home Feed Image Only Ad Preview (Demand Gen)
              <div style={{
                width: '100%',
                maxWidth: '360px',
                height: '620px',
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
                {/* Phone Camera Notch */}
                <div style={{ width: '120px', height: '18px', background: '#222', borderRadius: '0 0 12px 12px', margin: '0 auto', zIndex: 10 }}></div>

                {/* YouTube Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 15px', borderBottom: '1px solid #222', background: '#0f0f0f' }}>
                  <span style={{ color: '#ff0000', fontWeight: 'bold', fontSize: '1.1rem', letterSpacing: '-1px' }}>
                    📺 YouTube
                  </span>
                  <span style={{ color: '#aaa', fontSize: '1.2rem' }}>🔍</span>
                </div>

                {/* Large Companion Image Feed Card */}
                <div style={{ display: 'flex', flexDirection: 'column', background: '#151515', borderBottom: '4px solid #222' }}>
                  
                  {/* Big Image Banner */}
                  <div style={{ width: '100%', height: '220px', background: '#222', position: 'relative', overflow: 'hidden' }}>
                    {mediaUrl ? (
                      <img src={mediaUrl} alt="Ad Feed Banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ color: '#777', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', flexDirection: 'column', gap: '8px' }}>
                        <span>🖼️ Upload a Photo to see it in YouTube Feed!</span>
                      </div>
                    )}
                    {/* Sponsored Ad Badge */}
                    <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(0,0,0,0.8)', color: '#ffeb3b', padding: '3px 8px', fontSize: '0.7rem', fontWeight: 'bold', borderRadius: '3px' }}>
                      Sponsored • 🖼️ Image Ad
                    </div>
                  </div>

                  {/* Feed Card Action Row */}
                  <div style={{ padding: '12px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1e1e1e' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxWidth: '70%' }}>
                      <span style={{ color: 'white', fontSize: '0.85rem', fontWeight: 'bold' }}>{businessName || 'Business Name'}</span>
                      <span style={{ color: '#3ea6ff', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{finalUrl || 'www.example.com'}</span>
                    </div>
                    <button style={{ background: '#3ea6ff', color: '#0f0f0f', border: 'none', padding: '8px 16px', borderRadius: '18px', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer' }}>
                      Visit Site
                    </button>
                  </div>

                  {/* Card Description */}
                  <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <h4 style={{ color: 'white', fontSize: '0.95rem', margin: 0, fontWeight: 'bold' }}>{videoHeadline}</h4>
                    <p style={{ color: '#aaa', fontSize: '0.8rem', margin: 0, lineHeight: '1.4' }}>{videoDescription}</p>
                  </div>

                </div>

                {/* Normal YouTube Video Card below in the Home Feed */}
                <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ width: '100%', height: '120px', borderRadius: '8px', background: '#222' }}></div>
                  <div style={{ height: '14px', background: '#222', width: '90%', borderRadius: '3px' }}></div>
                </div>

              </div>
            )
          ) : (
            // Search Mobile Ad Preview (Original Cute Orange Cat)
            <div style={{
              width: '100%',
              maxWidth: '360px',
              height: '620px',
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
              {/* Phone Camera Notch */}
              <div style={{ width: '120px', height: '18px', background: '#222', borderRadius: '0 0 12px 12px', margin: '0 auto', zIndex: 10 }}></div>

              {/* Google Search Header */}
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
                  🔍 buy premium bikes...
                </div>
              </div>

              {/* Ad Card Result */}
              <div style={{ padding: '20px', background: 'white', margin: '12px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #eaeaea' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#4285F4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.6rem', fontWeight: 'bold' }}>G</div>
                  <span style={{ fontSize: '0.75rem', color: '#202124' }}>{finalUrl || 'www.example.com'}</span>
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

                  {/* Custom uploaded photo extension preview */}
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
          )}
        </div>

      </div>
    </div>
  );
}
