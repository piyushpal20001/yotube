"use client";
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AuthSuccess() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      localStorage.setItem('token', token);
      setTimeout(() => {
        router.push('/');
      }, 2000);
    }
  }, [searchParams, router]);

  return (
    <div style={{ 
      height: '80vh', 
      display: 'flex', 
      flexDirection: 'column', 
      justifyContent: 'center', 
      alignItems: 'center',
      textAlign: 'center' 
    }}>
      <div style={{ 
        width: '50px', 
        height: '50px', 
        border: '4px solid var(--accent)', 
        borderTopColor: 'transparent', 
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginBottom: '20px'
      }}></div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <h1>Authentication Successful!</h1>
      <p style={{ color: 'var(--text-secondary)', marginTop: '10px' }}>Redirecting you to the dashboard...</p>
    </div>
  );
}
