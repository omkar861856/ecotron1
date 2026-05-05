'use client';

import { useState } from 'react';

export default function Home() {
  const [activeTool, setActiveTool] = useState<'resume' | 'rewrite' | 'summarize'>('resume');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      // FIX: Use /api/generate instead of /generate
      const res = await fetch(`https://api.ecotron.co.in/api/${activeTool === 'resume' ? 'resume' : activeTool}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input, task: activeTool }),
      });
      const data = await res.json();
      setOutput(data.result || data.response || 'No response from AI.');
    } catch (err) {
      console.error(err);
      setOutput('Error generating response. Please try again.');
    }
    setLoading(false);
  };

  return (
    <main>
      <div className="bg-glow" />
      
      <div className="container">
        {/* Top Ad */}
        <div className="ad-container" style={{ height: '90px', marginBottom: '4rem' }}>
          Leaderboard Ad - 728x90
        </div>

        <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
          <h1>ECOTRON AI</h1>
          <p className="subtitle">Production-grade AI utilities for modern creators.</p>
        </div>

        {/* Added grid-layout class for responsiveness */}
        <div className="grid-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>
          <section className="glass-card">
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
              <button 
                className={`btn-outline ${activeTool === 'resume' ? 'active' : ''}`}
                onClick={() => setActiveTool('resume')}
              >
                Resume
              </button>
              <button 
                className={`btn-outline ${activeTool === 'rewrite' ? 'active' : ''}`}
                onClick={() => setActiveTool('rewrite')}
              >
                Rewrite
              </button>
              <button 
                className={`btn-outline ${activeTool === 'summarize' ? 'active' : ''}`}
                onClick={() => setActiveTool('summarize')}
              >
                Summarize
              </button>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', marginBottom: '1rem', color: 'rgba(255,255,255,0.8)' }}>
                Input Content
              </label>
              <textarea 
                placeholder={`Paste your ${activeTool} content here...`}
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
            </div>

            <button 
              className="btn-primary" 
              onClick={handleGenerate}
              disabled={loading || !input}
              style={{ width: '100%', marginBottom: '2rem' }}
            >
              {loading ? 'Generating...' : `GENERATE ${activeTool.toUpperCase()}`}
            </button>

            {output && (
              <div className="glass-card" style={{ background: 'rgba(255,255,255,0.02)', marginTop: '1rem' }}>
                <h3 style={{ marginBottom: '1rem', color: 'var(--secondary)' }}>Result</h3>
                <div style={{ whiteSpace: 'pre-wrap', color: 'rgba(255,255,255,0.9)' }}>{output}</div>
              </div>
            )}
          </section>

          <aside>
            <div className="glass-card" style={{ marginBottom: '2rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>Why Ecotron?</h3>
              <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)' }}>
                Local LLM inference means your data stays private and requests are lightning fast. No tracking, no latency.
              </p>
            </div>
            
            <div className="ad-container" style={{ height: '250px', marginBottom: '2rem' }}>
              Sidebar Ad - 300x250
            </div>

            <div className="ad-container" style={{ height: '600px' }}>
              Sticky Ad - 300x600
            </div>
          </aside>
        </div>

        <footer style={{ marginTop: '6rem', paddingBottom: '4rem', textAlign: 'center' }}>
          <div className="ad-container" style={{ height: '90px', marginBottom: '3rem' }}>
            Footer Ad - 728x90
          </div>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>
            © 2026 ECOTRON AI Platform. All rights reserved.
          </p>
        </footer>
      </div>
    </main>
  );
}
