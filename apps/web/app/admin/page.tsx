'use client';

import { useState, useEffect } from 'react';

export default function AdminPage() {
  const [stats, setStats] = useState<any>(null);
  const [ollamaStatus, setOllamaStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionStatus, setActionStatus] = useState('');

  useEffect(() => {
    fetchStats();
    fetchOllamaStatus();
    const interval = setInterval(() => {
      fetchStats();
      fetchOllamaStatus();
    }, 10000);
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

  const fetchOllamaStatus = async () => {
    try {
      const res = await fetch('https://api.ecotron.co.in/api/admin/ollama-status');
      const data = await res.json();
      setOllamaStatus(data);
    } catch (err) { setOllamaStatus({ status: 'offline', error: 'Connection failed' }); }
  };

  const triggerGen = async () => {
    setActionStatus('Triggering Nano Banana...');
    try {
      const res = await fetch('https://api.ecotron.co.in/api/admin/trigger-gen', { method: 'POST' });
      const data = await res.json();
      setActionStatus(`Gen Status: ${data.status} ${data.error ? '('+data.error+')' : ''}`);
      fetchStats();
    } catch (err) { setActionStatus('Gen Trigger Failed'); }
  };

  const seedElite = async () => {
    setActionStatus('Seeding Massive Elite Collection...');
    try {
      const res = await fetch('https://api.ecotron.co.in/api/admin/seed-elite', { method: 'POST' });
      const data = await res.json();
      setActionStatus(`Success! Injected ${data.added} Elite prompts.`);
      fetchStats();
    } catch (err) { setActionStatus('Seeding Failed'); }
  };

  if (loading) return <div className="admin-loading">Connecting to Command Center...</div>;

  return (
    <main className="admin-container">
      <header className="admin-header">
        <div>
          <h1>ECOTRON <span style={{ color: 'var(--primary)' }}>AI</span> OPERATOR</h1>
          <p className="subtitle">Infrastructure Health & Mass Ingestion Hub</p>
        </div>
        <div className="action-bar">
          {actionStatus && <span className="status-msg">{actionStatus}</span>}
          <button className="btn-primary" onClick={triggerGen}>🚀 Force Gen</button>
          <button className="btn-outline" onClick={seedElite}>🎬 Seed Elite Prompts</button>
        </div>
      </header>

      {stats && (
        <>
          <div className="stats-grid">
            <div className="stat-card glass">
              <span className="label">TOTAL PROMPTS</span>
              <div className="value">{stats.overview.totalPrompts}</div>
            </div>
            <div className="stat-card glass">
              <span className="label">AI VISUALS</span>
              <div className="value">{stats.overview.totalGens}</div>
            </div>
            <div className="stat-card glass">
              <span className="label">SYSTEM STATUS</span>
              <div className="value" style={{ color: '#10b981' }}>ACTIVE</div>
            </div>
            <div className="stat-card glass">
              <span className="label">OLLAMA NODE</span>
              <div className="value" style={{ 
                color: ollamaStatus?.status === 'online' ? '#10b981' : (ollamaStatus?.status === 'offline' ? '#ef4444' : '#f59e0b') 
              }}>
                {ollamaStatus?.status?.toUpperCase() || 'CHECKING...'}
                {ollamaStatus?.models > 0 && <span style={{ fontSize: '1rem', marginLeft: '10px', opacity: 0.5 }}>({ollamaStatus.models} models)</span>}
              </div>
            </div>
          </div>

          <div className="dashboard-sections">
            <section className="glass section">
              <h3>Live Telemetry</h3>
              <table className="admin-table">
                <thead><tr><th>Endpoint</th><th>Hits</th><th>Last Active</th></tr></thead>
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
              <h3>Generation Intelligence (Logs)</h3>
              <table className="admin-table">
                <thead><tr><th>Target Prompt</th><th>Status</th><th>Log / Error</th><th>Time</th></tr></thead>
                <tbody>
                  {stats.recentGens.map((g: any, i: number) => (
                    <tr key={i}>
                      <td className="prompt-title">{g.title || 'System Task'}</td>
                      <td><span className={`status-badge ${g.status}`}>{g.status.toUpperCase()}</span></td>
                      <td className="error-log">{g.error_msg || 'Success'}</td>
                      <td className="time">{new Date(g.created_at).toLocaleTimeString()}</td>
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
        .action-bar { display: flex; align-items: center; gap: 1.5rem; }
        .status-msg { font-size: 0.8rem; color: var(--primary); font-weight: 700; background: rgba(255,107,0,0.1); padding: 0.5rem 1rem; border-radius: 10px; }
        
        .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; margin-bottom: 4rem; }
        .stat-card { padding: 2.5rem; border-radius: 24px; border: 1px solid rgba(255,255,255,0.05); }
        .stat-card .label { font-size: 0.7rem; font-weight: 800; color: var(--primary); letter-spacing: 0.1em; }
        .stat-card .value { font-size: 3rem; font-weight: 900; margin-top: 0.5rem; }

        .dashboard-sections { display: grid; gap: 3rem; }
        .section { padding: 2.5rem; border-radius: 24px; border: 1px solid rgba(255,255,255,0.05); }
        .admin-table { width: 100%; border-collapse: collapse; text-align: left; }
        .admin-table th { font-size: 0.75rem; opacity: 0.4; padding: 1rem 0; border-bottom: 1px solid rgba(255,255,255,0.05); text-transform: uppercase; }
        .admin-table td { padding: 1.5rem 0; border-bottom: 1px solid rgba(255,255,255,0.02); }

        .route { color: var(--accent); background: rgba(59, 130, 246, 0.1); padding: 0.3rem 0.6rem; border-radius: 6px; font-size: 0.85rem; }
        .error-log { font-size: 0.8rem; opacity: 0.5; max-width: 300px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-family: monospace; }
        .status-badge { font-size: 0.65rem; font-weight: 900; padding: 0.4rem 0.8rem; border-radius: 100px; }
        .status-badge.success { background: rgba(16, 185, 129, 0.1); color: #10b981; }
        .status-badge.error { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
        .prompt-title { font-weight: 600; font-size: 0.95rem; }
        .admin-loading { height: 100vh; display: flex; align-items: center; justify-content: center; opacity: 0.5; font-size: 1.2rem; }
      `}</style>
    </main>
  );
}
