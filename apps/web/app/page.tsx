'use client';

import { useState, useEffect } from 'react';
import AdBanner from './components/AdBanner';

export default function Home() {
  const [activeTool, setActiveTool] = useState<'resume' | 'rewrite' | 'summarize' | 'email' | 'calc'>('resume');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [prompts, setPrompts] = useState<any[]>([]);
  const [showPromptForm, setShowPromptForm] = useState(false);
  const [newPrompt, setNewPrompt] = useState({ title: '', content: '' });

  useEffect(() => {
    fetchPrompts();
  }, []);

  const fetchPrompts = async () => {
    try {
      const res = await fetch('https://api.ecotron.co.in/api/prompts');
      const data = await res.json();
      setPrompts(data);
    } catch (err) {
      console.error('Failed to fetch prompts', err);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const endpoint = activeTool === 'calc' ? 'generate' : activeTool;
      const res = await fetch(`https://api.ecotron.co.in/api/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: activeTool === 'calc' ? `Solve and explain: ${input}` : input, 
          task: activeTool 
        }),
      });
      const data = await res.json();
      setOutput(data.result || data.response || 'No response from AI.');
    } catch (err) {
      console.error(err);
      setOutput('Error generating response. Please try again.');
    }
    setLoading(false);
  };

  const handleAddPrompt = async () => {
    if (!newPrompt.title || !newPrompt.content) return;
    try {
      await fetch('https://api.ecotron.co.in/api/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPrompt),
      });
      setNewPrompt({ title: '', content: '' });
      setShowPromptForm(false);
      fetchPrompts();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <main>
      <div className="bg-glow" />
      
      <div className="container">
        {/* TOP AD: 728x90 */}
        <AdBanner height={90} width={728} adKey="c25ecd0c0fe9d93f6cf66f0016cbd198" />

        <div style={{ textAlign: 'center', marginBottom: '4rem', marginTop: '2rem' }}>
          <h1>ECOTRON AI</h1>
          <p className="subtitle">Daily problems solved in seconds. Fast. Secure. Instant.</p>
        </div>

        <div className="grid-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>
          <section>
            <div className="glass-card" style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                <button className={`btn-outline ${activeTool === 'resume' ? 'active' : ''}`} onClick={() => setActiveTool('resume')}>Resume</button>
                <button className={`btn-outline ${activeTool === 'rewrite' ? 'active' : ''}`} onClick={() => setActiveTool('rewrite')}>Rewrite</button>
                <button className={`btn-outline ${activeTool === 'summarize' ? 'active' : ''}`} onClick={() => setActiveTool('summarize')}>Summarize</button>
                <button className={`btn-outline ${activeTool === 'email' ? 'active' : ''}`} onClick={() => setActiveTool('email')}>Email</button>
                <button className={`btn-outline ${activeTool === 'calc' ? 'active' : ''}`} onClick={() => setActiveTool('calc')}>Calculator</button>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <textarea 
                  placeholder={`Example: ${activeTool === 'calc' ? 'What is the EMI for 50L at 8.5% for 20 years?' : 'Paste your content here...'}`}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
              </div>

              <button className="btn-primary" onClick={handleGenerate} disabled={loading || !input} style={{ width: '100%', marginBottom: '1rem' }}>
                {loading ? 'Processing...' : `SOLVE INSTANTLY`}
              </button>

              {output && (
                <div className="glass-card" style={{ background: 'rgba(255,255,255,0.02)', marginTop: '2rem' }}>
                  <h3 style={{ marginBottom: '1rem', color: 'var(--secondary)' }}>Result</h3>
                  <div style={{ whiteSpace: 'pre-wrap', color: 'rgba(255,255,255,0.9)' }}>{output}</div>
                </div>
              )}
            </div>

            <div className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2>📚 Community Prompt Library</h2>
                <button className="btn-outline" onClick={() => setShowPromptForm(!showPromptForm)}>
                  {showPromptForm ? 'Cancel' : '+ Add Prompt'}
                </button>
              </div>

              {showPromptForm && (
                <div className="glass-card" style={{ background: 'rgba(255,255,255,0.05)', marginBottom: '2rem' }}>
                  <input 
                    type="text" 
                    placeholder="Prompt Title" 
                    style={{ width: '100%', background: 'transparent', border: '1px solid var(--glass-border)', padding: '0.75rem', borderRadius: '8px', color: 'white', marginBottom: '1rem' }}
                    value={newPrompt.title}
                    onChange={(e) => setNewPrompt({ ...newPrompt, title: e.target.value })}
                  />
                  <textarea 
                    placeholder="The actual prompt..." 
                    style={{ minHeight: '100px', marginBottom: '1rem' }}
                    value={newPrompt.content}
                    onChange={(e) => setNewPrompt({ ...newPrompt, content: e.target.value })}
                  />
                  <button className="btn-primary" onClick={handleAddPrompt}>Publish</button>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                {prompts.map((p, i) => (
                  <div key={i} className="glass-card" style={{ padding: '1rem', fontSize: '0.85rem', cursor: 'pointer' }} onClick={() => { setInput(p.content); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                    <h4 style={{ marginBottom: '0.5rem' }}>{p.title}</h4>
                    <p style={{ opacity: 0.6, fontSize: '0.75rem' }}>By {p.author}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <aside>
            <AdBanner height={250} width={300} adKey="eca2cd8a7fd561c8d9ddc9b4e1302ac9" />

            <div className="glass-card" style={{ marginBottom: '2rem', marginTop: '2rem' }}>
              <h3>Instant ROI</h3>
              <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', marginTop: '0.5rem' }}>
                Why wait for ChatGPT? Use our focused tools for instant results with zero fluff.
              </p>
            </div>
            
            <div style={{ position: 'sticky', top: '2rem' }}>
              <AdBanner height={300} width={160} adKey="7f1e1c3d11870c7899ccce329cdd56e9" />
            </div>
          </aside>
        </div>

        <footer style={{ marginTop: '6rem', paddingBottom: '4rem', textAlign: 'center' }}>
          <AdBanner height={90} width={728} adKey="c25ecd0c0fe9d93f6cf66f0016cbd198" />
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', marginTop: '2rem' }}>
            © 2026 ECOTRON AI Platform. All rights reserved.
          </p>
        </footer>
      </div>
    </main>
  );
}
