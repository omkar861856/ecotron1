'use client';

import { useState, useEffect } from 'react';

export default function Admin() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [gens, setGens] = useState<any[]>([]);

  const handleLogin = () => {
    if (user === 'admin' && pass === 'password') {
      setIsLoggedIn(true);
      fetchGens();
    } else {
      alert('Invalid credentials');
    }
  };

  const fetchGens = async () => {
    try {
      const res = await fetch('https://api.ecotron.co.in/api/admin/generations');
      const data = await res.json();
      setGens(data);
    } catch (err) {
      console.error(err);
    }
  };

  if (!isLoggedIn) {
    return (
      <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#050505' }}>
        <div className="glass-card" style={{ width: '350px' }}>
          <h2 style={{ marginBottom: '2rem', textAlign: 'center' }}>Admin Access</h2>
          <input 
            type="text" 
            placeholder="Username" 
            style={{ width: '100%', padding: '0.75rem', marginBottom: '1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '8px' }}
            onChange={(e) => setUser(e.target.value)}
          />
          <input 
            type="password" 
            placeholder="Password" 
            style={{ width: '100%', padding: '0.75rem', marginBottom: '2rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '8px' }}
            onChange={(e) => setPass(e.target.value)}
          />
          <button className="btn-primary" style={{ width: '100%' }} onClick={handleLogin}>Unlock Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '5rem' }}>
      <h1>ADMIN DASHBOARD</h1>
      <p style={{ opacity: 0.5, marginBottom: '3rem' }}>Monitoring AI Generations & Requests</p>

      <div className="glass-card">
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--glass-border)', opacity: 0.7 }}>
              <th style={{ padding: '1rem' }}>Prompt Title</th>
              <th style={{ padding: '1rem' }}>Status</th>
              <th style={{ padding: '1rem' }}>Created At</th>
              <th style={{ padding: '1rem' }}>Error (if any)</th>
            </tr>
          </thead>
          <tbody>
            {gens.map((g, i) => (
              <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <td style={{ padding: '1rem' }}>{g.title}</td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ color: g.status === 'success' ? 'var(--secondary)' : '#ef4444' }}>
                    {g.status.toUpperCase()}
                  </span>
                </td>
                <td style={{ padding: '1rem', opacity: 0.6 }}>{new Date(g.created_at).toLocaleString()}</td>
                <td style={{ padding: '1rem', opacity: 0.6, fontSize: '0.8rem' }}>{g.error_msg || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
