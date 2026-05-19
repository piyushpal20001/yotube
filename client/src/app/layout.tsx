import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Google Ads Automation | Premium Dashboard",
  description: "Scale your Google Ads with intelligent automation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="sidebar">
          <div style={{ marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', background: 'var(--accent)', borderRadius: '8px' }}></div>
            <h2 style={{ fontSize: '1.2rem' }}>AdsAuto</h2>
          </div>
          
          <nav>
            <ul style={{ listStyle: 'none' }}>
              <li style={{ padding: '12px 0' }}><a href="/" style={{ color: 'var(--text-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>Dashboard</a></li>
              <li style={{ padding: '12px 0' }}><a href="/campaigns" style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>Campaigns</a></li>
              <li style={{ padding: '12px 0' }}><a href="/accounts" style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>Google Accounts</a></li>
              <li style={{ padding: '12px 0' }}><a href="/reports" style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>Reports</a></li>
              <li style={{ padding: '12px 0' }}><a href="/leads" style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>Leads</a></li>
            </ul>
          </nav>

          <div style={{ position: 'absolute', bottom: '40px', width: 'calc(100% - 40px)' }}>
             <div className="card" style={{ padding: '15px' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Logged in as</p>
                <p style={{ fontWeight: '600' }}>Admin User</p>
             </div>
          </div>
        </div>
        
        <main className="main-content">
          {children}
        </main>
      </body>
    </html>
  );
}
