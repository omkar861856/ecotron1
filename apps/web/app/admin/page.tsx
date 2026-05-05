'use client';

import { useState, useEffect } from 'react';

export default function AdminPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionStatus, setActionStatus] = useState('');

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000); // Faster refresh for admin
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('https://api.ecotron.co.in/api/admin/stats');
      const data = await res.json();
      setStats(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const triggerGen = async () => {
    setActionStatus('Triggering Nano Banana...');
    try {
      const res = await fetch('https://api.ecotron.co.in/api/admin/trigger-gen', { method: 'POST' });
      const data = await res.json();
      setActionStatus(`Gen Result: ${data.status}`);
      fetchStats();
    } catch (err) { setActionStatus('Gen Trigger Failed'); }
  };

  const seedElite = async () => {
    setActionStatus('Seeding Elite Collection...');
    try {
      const res = await fetch('https://api.ecotron.co.in/api/admin/seed-elite', { method: 'POST' });
      const data = await res.json();
      setActionStatus(`Seeded ${data.added} prompts successfully!`);
      fetchStats();
    } catch (err) { setActionStatus('Seeding Failed'); }
  };

  if (loading) return <div className="admin-loading">Loading Command Center...</div>;

  return (
    <main className="admin-container">
      <header className="admin-header">
        <div>
          <h1>ECOTRON <span style={{ color: 'var(--primary)' }}>AI</span> ADMIN</h1>
          <p className="subtitle">Infrastructure Control & Seedance 2.0 Hub</p>
        </div>
        <div className="action-bar">
          {actionStatus && <span className="status-msg">{actionStatus}</span>}
          <button className="btn-primary" onClick={triggerGen}>🚀 Force AI Gen</button>
          <button className="btn-outline" onClick={seedElite}>🎬 Seed Seedance 2.0</button>
        </div>
      </header>

      {stats && (
        <>
          <div className="stats-grid">
            <div className="stat-card glass">
              <span className="label">LIBRARY SIZE</span>
              <div className="value">{stats.overview.totalPrompts}</div>
            </div>
            <div className="stat-card glass">
              <span className="label">AI VISUALS</span>
              <div className="value">{stats.overview.totalGens}</div>
            </div>
            <div className="stat-card glass">
              <span className="label">NEXT GEN WINDOW</span>
              <div className="value">2 Hours</div>
            </div>
          </div>

          <div className="dashboard-sections">
            <section className="glass section">
              <h3>System Telemetry</h3>
              <table className="admin-table">
                <thead><tr><th>Endpoint</th><th>Hits</th><th>Last Pulse</th></tr></thead>
                <tbody>
                  {stats.apiHits.map((h: any, i: number) => (
                    <tr key={i}>
                      <td><code className="route">{h.route}</code></td>
                      <td className="count">{h.hits}</td>
                      <td className="time">{new Date(h.last_call).toLocaleTimeString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section className="glass section">
              <h3>Nano Banana Generation History</h3>
              <table className="admin-table">
                <thead><tr><th>Prompt Title</th><th>Status</th><th>Timestamp</th></tr></thead>
                <tbody>
                  {stats.recentGens.map((g: any, i: number) => (
                    <tr key={i}>
                      <td className="prompt-title">{g.title || 'System'}</td>
                      <td><span className={`status-badge ${g.status}`}>{g.status.toUpperCase()}</span></td>
                      <td className="time">{new Date(g.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </div>
        </>
      )}

      <style jsx>{`
        .admin-container { padding: 4rem; max-width: 1400px; margin: 0 auto; min-height: 100vh; color: #fff; }
        .admin-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 4rem; }
        .action-bar { display: flex; align-items: center; gap: 1rem; }
        .status-msg { font-size: 0.8rem; color: var(--primary); font-weight: bold; }
        
        .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; margin-bottom: 4rem; }
        .stat-card { padding: 2rem; border-radius: 20px; border: 1px solid rgba(255,255,255,0.05); }
        .stat-card .label { font-size: 0.65rem; font-weight: 800; color: var(--primary); letter-spacing: 0.1em; }
        .stat-card .value { font-size: 2.5rem; font-weight: 900; margin-top: 0.5rem; }

        .dashboard-sections { display: grid; gap: 3rem; }
        .section { padding: 2.5rem; border-radius: 24px; border: 1px solid rgba(255,255,255,0.05); }
        .admin-table { width: 100%; border-collapse: collapse; text-align: left; }
        .admin-table th { font-size: 0.7rem; opacity: 0.4; padding: 1rem 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .admin-table td { padding: 1.2rem 0; border-bottom: 1px solid rgba(255,255,255,0.02); }

        .route { color: var(--accent); background: rgba(59, 130, 246, 0.1); padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.8rem; }
        .status-badge { font-size: 0.6rem; font-weight: 900; padding: 0.3rem 0.6rem; border-radius: 50px; }
        .status-badge.success { background: rgba(16, 185, 129, 0.1); color: #10b981; }
        .status-badge.error { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
        .admin-loading { height: 100vh; display: flex; align-items: center; justify-content: center; opacity: 0.5; }
      `}</style>
    </main>
  );
}
