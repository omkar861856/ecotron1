'use client';

import { useState, useEffect } from 'react';

export default function AdminPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('https://api.ecotron.co.in/api/admin/stats');
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch admin stats', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="admin-loading">Initializing Command Center...</div>;

  return (
    <main className="admin-container">
      <header className="admin-header">
        <div>
          <h1>ECOTRON <span style={{ color: 'var(--primary)' }}>AI</span> OPERATOR</h1>
          <p className="subtitle">Infrastructure Health & AI Diagnostics</p>
        </div>
        <button className="btn-outline" onClick={fetchStats}>Refresh Data</button>
      </header>

      {stats && (
        <>
          <div className="stats-grid">
            <div className="stat-card glass">
              <span className="label">TOTAL PROMPTS</span>
              <div className="value">{stats.overview.totalPrompts}</div>
            </div>
            <div className="stat-card glass">
              <span className="label">AI GENERATED</span>
              <div className="value">{stats.overview.totalGens}</div>
            </div>
            <div className="stat-card glass">
              <span className="label">GEN FREQUENCY</span>
              <div className="value">1 / 2h</div>
            </div>
          </div>

          <div className="dashboard-sections">
            <div className="side-by-side">
              <section className="glass section half">
                <h3>System Health (Envs)</h3>
                <div className="env-grid">
                  {Object.entries(stats.envStatus).map(([key, ok]) => (
                    <div key={key} className="env-item">
                      <span className="env-key">{key}</span>
                      <span className={`status-indicator ${ok ? 'ok' : 'missing'}`}>
                        {ok ? 'CONNECTED' : 'MISSING'}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="glass section half">
                <h3>API Telemetry</h3>
                <table className="admin-table">
                  <thead>
                    <tr><th>Route</th><th>Hits</th></tr>
                  </thead>
                  <tbody>
                    {stats.apiHits.map((h: any, i: number) => (
                      <tr key={i}>
                        <td><code className="route">{h.route}</code></td>
                        <td className="count">{h.hits}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            </div>

            <section className="glass section">
              <h3>Nano Banana Generation Logs</h3>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Prompt</th>
                    <th>Status</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentGens.map((g: any, i: number) => (
                    <tr key={i}>
                      <td className="prompt-title">{g.title || 'Unknown'}</td>
                      <td>
                        <span className={`status-badge ${g.status}`}>
                          {g.status.toUpperCase()}
                        </span>
                      </td>
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
        .admin-container { padding: 4rem; max-width: 1400px; margin: 0 auto; min-height: 100vh; color: #fff; font-family: 'Inter', sans-serif; }
        .admin-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 4rem; }
        .admin-header h1 { font-size: 2rem; font-weight: 900; letter-spacing: -0.05em; }
        .subtitle { opacity: 0.5; margin-top: 0.5rem; }

        .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; margin-bottom: 4rem; }
        .stat-card { padding: 2.5rem; border-radius: 24px; border: 1px solid rgba(255,255,255,0.05); }
        .stat-card .label { font-size: 0.7rem; font-weight: 800; color: var(--primary); letter-spacing: 0.1em; }
        .stat-card .value { font-size: 3rem; font-weight: 900; margin-top: 0.5rem; letter-spacing: -0.02em; }

        .dashboard-sections { display: grid; grid-template-columns: 1fr; gap: 3rem; }
        .side-by-side { display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; }
        .section { padding: 2.5rem; border-radius: 24px; border: 1px solid rgba(255,255,255,0.05); }
        .section h3 { margin-bottom: 2rem; font-size: 1.3rem; }

        .env-grid { display: flex; flex-direction: column; gap: 1.5rem; }
        .env-item { display: flex; justify-content: space-between; align-items: center; padding-bottom: 1rem; border-bottom: 1px solid rgba(255,255,255,0.02); }
        .env-key { font-family: monospace; font-size: 0.85rem; opacity: 0.6; }
        .status-indicator { font-size: 0.7rem; font-weight: 900; padding: 0.3rem 0.6rem; border-radius: 4px; }
        .status-indicator.ok { color: #10b981; background: rgba(16, 185, 129, 0.1); }
        .status-indicator.missing { color: #ef4444; background: rgba(239, 68, 68, 0.1); }

        .admin-table { width: 100%; border-collapse: collapse; text-align: left; }
        .admin-table th { font-size: 0.7rem; opacity: 0.4; text-transform: uppercase; padding: 1rem 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .admin-table td { padding: 1.5rem 0; border-bottom: 1px solid rgba(255,255,255,0.02); }

        .route { color: var(--accent); background: rgba(59, 130, 246, 0.1); padding: 0.3rem 0.6rem; border-radius: 6px; font-size: 0.85rem; }
        .count { font-weight: 700; font-family: monospace; }
        .time { font-size: 0.8rem; opacity: 0.5; }
        .prompt-title { max-width: 400px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.9rem; }

        .status-badge { font-size: 0.6rem; font-weight: 900; padding: 0.4rem 0.8rem; border-radius: 100px; letter-spacing: 0.05em; }
        .status-badge.success { background: rgba(16, 185, 129, 0.1); color: #10b981; }
        .status-badge.error { background: rgba(239, 68, 68, 0.1); color: #ef4444; }

        .admin-loading { height: 100vh; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; opacity: 0.5; }
      `}</style>
    </main>
  );
}
