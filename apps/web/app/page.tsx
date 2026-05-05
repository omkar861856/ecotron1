'use client';

import { useState, useEffect } from 'react';
import AdBanner from './components/AdBanner';

export default function Home() {
  const [activeTool, setActiveTool] = useState<'rewrite' | 'summarize' | 'email' | 'calc'>('rewrite');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Prompt Library & UI State
  const [prompts, setPrompts] = useState<any[]>([]);
  const [filteredPrompts, setFilteredPrompts] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedPrompt, setSelectedPrompt] = useState<any>(null);
  const [copyStatus, setCopyStatus] = useState('Copy');

  useEffect(() => {
    fetchPrompts();
  }, []);

  useEffect(() => {
    if (activeCategory === 'all') {
      setFilteredPrompts(prompts);
    } else {
      setFilteredPrompts(prompts.filter(p => p.category === activeCategory));
    }
  }, [activeCategory, prompts]);

  const fetchPrompts = async () => {
    try {
      const res = await fetch('https://api.ecotron.co.in/api/prompts');
      const data = await res.json();
      setPrompts(data);
      setFilteredPrompts(data);
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopyStatus('Copied! ✅');
    setTimeout(() => setCopyStatus('Copy'), 2000);
  };

  const usePrompt = (p: any) => {
    setInput(p.content);
    setSelectedPrompt(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <main>
      <div className="bg-glow" />
      
      <div className="container">
        {/* Header Ad */}
        <AdBanner height={90} width={728} adKey="c25ecd0c0fe9d93f6cf66f0016cbd198" />

        <div style={{ textAlign: 'center', marginBottom: '4rem', marginTop: '3rem' }}>
          <h1>ECOTRON <span style={{ color: 'var(--primary)' }}>PRO</span></h1>
          <p className="subtitle">The World's Most Powerful AI Prompt Library & Utility Hub.</p>
        </div>

        <div className="grid-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '2rem' }}>
          <section>
            <div className="glass-card" style={{ marginBottom: '3rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                <button className={`btn-outline ${activeTool === 'rewrite' ? 'active' : ''}`} onClick={() => setActiveTool('rewrite')}>Professional Rewrite</button>
                <button className={`btn-outline ${activeTool === 'summarize' ? 'active' : ''}`} onClick={() => setActiveTool('summarize')}>Summarize</button>
                <button className={`btn-outline ${activeTool === 'email' ? 'active' : ''}`} onClick={() => setActiveTool('email')}>Email Generator</button>
                <button className={`btn-outline ${activeTool === 'calc' ? 'active' : ''}`} onClick={() => setActiveTool('calc')}>AI Calculator</button>
              </div>

              <textarea 
                placeholder={`Type or paste content here...`}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                style={{ marginBottom: '1.5rem' }}
              />

              <button className="btn-primary" onClick={handleGenerate} disabled={loading || !input} style={{ width: '100%' }}>
                {loading ? 'Processing with AI...' : `GENERATE INSTANT OUTPUT`}
              </button>

              {output && (
                <div className="glass-card" style={{ background: 'rgba(59, 130, 246, 0.05)', marginTop: '2rem', borderColor: 'var(--primary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <h3 style={{ color: 'var(--primary)' }}>Result</h3>
                    <button className="btn-outline" onClick={() => copyToClipboard(output)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                      Copy Result
                    </button>
                  </div>
                  <div style={{ whiteSpace: 'pre-wrap', color: 'rgba(255,255,255,0.9)', fontSize: '1.05rem' }}>{output}</div>
                </div>
              )}
            </div>

            {/* CATEGORY FILTER */}
            <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem' }}>
              <button className={`btn-outline ${activeCategory === 'all' ? 'active' : ''}`} onClick={() => setActiveCategory('all')}>All Prompts</button>
              <button className={`btn-outline ${activeCategory === 'chatgpt' ? 'active' : ''}`} onClick={() => setActiveCategory('chatgpt')}>ChatGPT Prompts</button>
              <button className={`btn-outline ${activeCategory === 'general' ? 'active' : ''}`} onClick={() => setActiveCategory('general')}>Nano Banana</button>
            </div>

            {/* PROMPT GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {filteredPrompts.slice(0, 50).map((p, i) => (
                <div key={i} className="glass-card" style={{ padding: '1.5rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }} onClick={() => setSelectedPrompt(p)}>
                  <div>
                    <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '0.1em', fontWeight: 'bold' }}>{p.category}</span>
                    <h4 style={{ margin: '0.5rem 0 1rem 0', lineHeight: '1.4' }}>{p.title}</h4>
                  </div>
                  <button className="btn-outline" style={{ width: 'fit-content', alignSelf: 'flex-start', fontSize: '0.8rem' }}>View Prompt</button>
                </div>
              ))}
            </div>
            
            {filteredPrompts.length > 50 && (
              <p style={{ textAlign: 'center', marginTop: '2rem', opacity: 0.4 }}>Showing top 50 results...</p>
            )}
          </section>

          <aside>
            <AdBanner height={250} width={300} adKey="eca2cd8a7fd561c8d9ddc9b4e1302ac9" />
            
            <div className="glass-card" style={{ margin: '2rem 0' }}>
              <h4>Why Pro?</h4>
              <p style={{ fontSize: '0.85rem', opacity: 0.6, marginTop: '0.5rem' }}>
                Access thousands of expertly crafted prompts designed to get the most out of LLMs. No engineering required.
              </p>
            </div>

            <div style={{ position: 'sticky', top: '2rem' }}>
              <AdBanner height={300} width={160} adKey="7f1e1c3d11870c7899ccce329cdd56e9" />
            </div>
          </aside>
        </div>

        {/* PROMPT MODAL */}
        {selectedPrompt && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem' }} onClick={() => setSelectedPrompt(null)}>
            <div className="glass-card" style={{ maxWidth: '700px', width: '100%', maxHeight: '90vh', overflowY: 'auto', background: '#0a0a0a' }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 'bold' }}>{selectedPrompt.category.toUpperCase()}</span>
                  <h2 style={{ marginTop: '0.5rem' }}>{selectedPrompt.title}</h2>
                </div>
                <button onClick={() => setSelectedPrompt(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.5rem' }}>&times;</button>
              </div>
              
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--glass-border)', marginBottom: '2rem', fontSize: '1.1rem', lineHeight: '1.6' }}>
                {selectedPrompt.content}
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="btn-primary" style={{ flex: 1 }} onClick={() => usePrompt(selectedPrompt)}>Load into AI Hub</button>
                <button className="btn-outline" style={{ flex: 1 }} onClick={() => copyToClipboard(selectedPrompt.content)}>{copyStatus}</button>
              </div>
            </div>
          </div>
        )}

        <footer style={{ marginTop: '8rem', paddingBottom: '4rem', textAlign: 'center', borderTop: '1px solid var(--glass-border)', paddingTop: '4rem' }}>
          <AdBanner height={90} width={728} adKey="c25ecd0c0fe9d93f6cf66f0016cbd198" />
          <p style={{ opacity: 0.3, fontSize: '0.8rem', marginTop: '2rem' }}>© 2026 ECOTRON PRO. The Ultimate AI Utility Suite.</p>
        </footer>
      </div>
    </main>
  );
}
