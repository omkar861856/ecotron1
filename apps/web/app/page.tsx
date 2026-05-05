'use client';

import { useState, useEffect, useRef } from 'react';
import AdBanner from './components/AdBanner';

export default function Home() {
  const [activeTool, setActiveTool] = useState<'rewrite' | 'summarize' | 'email' | 'calc'>('rewrite');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [refining, setRefining] = useState(false);
  
  const [prompts, setPrompts] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedPrompt, setSelectedPrompt] = useState<any>(null);
  const [copyStatus, setCopyStatus] = useState('Copy');

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setPage(1);
    setPrompts([]);
    fetchPrompts(1, activeCategory);
  }, [activeCategory]);

  const fetchPrompts = async (pageNum: number, category: string) => {
    try {
      const res = await fetch(`https://api.ecotron.co.in/api/prompts?page=${pageNum}&category=${category}&limit=24`);
      const data = await res.json();
      if (pageNum === 1) {
        setPrompts(data.data);
      } else {
        setPrompts(prev => [...prev, ...data.data]);
      }
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error('Failed to fetch prompts', err);
    }
  };

  const handleGenerate = async () => {
    if (loading || !input) return;
    setLoading(true);
    try {
      const res = await fetch(`https://api.ecotron.co.in/api/${activeTool}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input, task: activeTool }),
      });
      const data = await res.json();
      setOutput(data.result || data.response || 'No response from AI.');
    } catch (err) {
      console.error(err);
      setOutput('Error generating response.');
    }
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  const handleRefine = async () => {
    if (!input || refining) return;
    setRefining(true);
    try {
      const res = await fetch('https://api.ecotron.co.in/api/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input }),
      });
      const data = await res.json();
      setInput(data.result);
    } catch (err) {
      console.error(err);
    }
    setRefining(false);
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
    textareaRef.current?.focus();
  };

  return (
    <main>
      <div className="bg-glow" />
      
      <div className="container">
        {/* Responsive Header Ad */}
        <AdBanner height={90} width={728} adKey="c25ecd0c0fe9d93f6cf66f0016cbd198" />
        <AdBanner height={250} width={300} adKey="eca2cd8a7fd561c8d9ddc9b4e1302ac9" className="mobile-only-header-ad" />

        <div style={{ textAlign: 'center', marginBottom: '4rem', marginTop: '3rem' }}>
          <h1>ECOTRON <span style={{ color: 'var(--primary)' }}>PRO</span></h1>
          <p className="subtitle">High-Performance AI Utilities & Global Prompt Engine.</p>
        </div>

        <div className="grid-layout">
          <section>
            <div className="glass-card" style={{ marginBottom: '3rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                <button className={`btn-outline ${activeTool === 'rewrite' ? 'active' : ''}`} onClick={() => setActiveTool('rewrite')}>Rewrite</button>
                <button className={`btn-outline ${activeTool === 'summarize' ? 'active' : ''}`} onClick={() => setActiveTool('summarize')}>Summarize</button>
                <button className={`btn-outline ${activeTool === 'email' ? 'active' : ''}`} onClick={() => setActiveTool('email')}>Email</button>
                <button className={`btn-outline ${activeTool === 'calc' ? 'active' : ''}`} onClick={() => setActiveTool('calc')}>Calculator</button>
              </div>

              <textarea 
                ref={textareaRef}
                placeholder={`Type your idea... Enter to Send, Shift+Enter for New Line`}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                style={{ marginBottom: '1.5rem', minHeight: '150px' }}
              />

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="btn-primary" onClick={handleGenerate} disabled={loading || !input} style={{ flex: 2 }}>
                  {loading ? 'Processing...' : `GENERATE OUTPUT`}
                </button>
                <button className="btn-outline" onClick={handleRefine} disabled={refining || !input} style={{ flex: 1, borderColor: 'var(--accent)', color: 'var(--accent)' }}>
                  {refining ? 'Refining...' : `⚡ REFINE`}
                </button>
              </div>

              {output && (
                <div className="glass-card" style={{ background: 'rgba(59, 130, 246, 0.05)', marginTop: '2rem', borderColor: 'var(--primary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <h3 style={{ color: 'var(--primary)' }}>Result</h3>
                    <button className="btn-outline" onClick={() => copyToClipboard(output)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Copy</button>
                  </div>
                  <div style={{ whiteSpace: 'pre-wrap', color: 'rgba(255,255,255,0.9)' }}>{output}</div>
                </div>
              )}
            </div>

            {/* CATEGORY & PROMPTS */}
            <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem' }}>
              <button className={`btn-outline ${activeCategory === 'all' ? 'active' : ''}`} onClick={() => setActiveCategory('all')}>All</button>
              <button className={`btn-outline ${activeCategory === 'chatgpt' ? 'active' : ''}`} onClick={() => setActiveCategory('chatgpt')}>ChatGPT</button>
              <button className={`btn-outline ${activeCategory === 'general' ? 'active' : ''}`} onClick={() => setActiveCategory('general')}>Nano Banana</button>
            </div>

            <div className="prompt-grid">
              {prompts.map((p, i) => (
                <>
                  <div key={i} className="glass-card prompt-item" onClick={() => setSelectedPrompt(p)}>
                    {p.image_url ? (
                      <div className="prompt-img" style={{ backgroundImage: `url(${p.image_url})` }} />
                    ) : (
                      <div className="prompt-img-placeholder">Generating...</div>
                    )}
                    <div style={{ padding: '1.5rem' }}>
                      <span className="prompt-cat">{p.category.toUpperCase()}</span>
                      <h4 className="prompt-title">{p.title}</h4>
                    </div>
                  </div>
                  {/* High frequency ads on mobile: every 8 prompts */}
                  {(i + 1) % 8 === 0 && (
                    <div className="mobile-inline-ad">
                      <AdBanner height={250} width={300} adKey="eca2cd8a7fd561c8d9ddc9b4e1302ac9" />
                    </div>
                  )}
                </>
              ))}
            </div>

            {page < totalPages && (
              <button className="btn-outline load-more" onClick={() => { setPage(page + 1); fetchPrompts(page + 1, activeCategory); }}>
                LOAD MORE PROMPTS
              </button>
            )}
          </section>

          <aside className="desktop-sidebar">
            <AdBanner height={250} width={300} adKey="eca2cd8a7fd561c8d9ddc9b4e1302ac9" />
            <div style={{ position: 'sticky', top: '2rem', marginTop: '2rem' }}>
              <AdBanner height={300} width={160} adKey="7f1e1c3d11870c7899ccce329cdd56e9" />
            </div>
          </aside>
        </div>

        {/* MODAL */}
        {selectedPrompt && (
          <div className="modal-overlay" onClick={() => setSelectedPrompt(null)}>
            <div className="modal-content glass-card" onClick={e => e.stopPropagation()}>
              {selectedPrompt.image_url && <img src={selectedPrompt.image_url} className="modal-img" alt="" />}
              <div style={{ padding: '2.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 'bold' }}>{selectedPrompt.category.toUpperCase()}</span>
                    <h2>{selectedPrompt.title}</h2>
                  </div>
                  <button onClick={() => setSelectedPrompt(null)} className="close-btn">&times;</button>
                </div>
                <div className="modal-prompt-text">{selectedPrompt.content}</div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button className="btn-primary" style={{ flex: 1 }} onClick={() => usePrompt(selectedPrompt)}>Load into Hub</button>
                  <button className="btn-outline" style={{ flex: 1 }} onClick={() => copyToClipboard(selectedPrompt.content)}>{copyStatus}</button>
                </div>
              </div>
            </div>
          </div>
        )}

        <footer style={{ marginTop: '8rem', paddingBottom: '4rem', textAlign: 'center' }}>
          <AdBanner height={90} width={728} adKey="c25ecd0c0fe9d93f6cf66f0016cbd198" />
          <p style={{ opacity: 0.3, fontSize: '0.8rem', marginTop: '2rem' }}>© 2026 ECOTRON PRO.</p>
        </footer>
      </div>

      <style jsx>{`
        .mobile-only-header-ad { display: none; }
        .mobile-inline-ad { display: none; }
        
        @media (max-width: 768px) {
          .desktop-sidebar { display: none; }
          .mobile-only-header-ad { display: flex; margin-bottom: 2rem; }
          .mobile-inline-ad { display: flex; grid-column: 1 / -1; margin: 1rem 0; justify-content: center; }
          .grid-layout { grid-template-columns: 1fr !important; }
        }

        .prompt-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; }
        .prompt-item { padding: 0; cursor: pointer; overflow: hidden; display: flex; flexDirection: column; }
        .prompt-img { height: 180px; width: 100%; background-position: center; background-size: cover; }
        .prompt-img-placeholder { height: 180px; width: 100%; background: rgba(255,255,255,0.03); display: flex; justify-content: center; alignItems: center; color: rgba(255,255,255,0.1); }
        .prompt-cat { fontSize: 0.7rem; color: var(--primary); fontWeight: bold; }
        .prompt-title { margin: 0.5rem 0; }
        .load-more { width: 100%; marginTop: 3rem; padding: 1.5rem; }

        .modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.9); backdropFilter: blur(10px); z-index: 1000; display: flex; justify-content: center; alignItems: center; padding: 2rem; }
        .modal-content { maxWidth: 800px; width: 100%; maxHeight: 90vh; overflowY: auto; background: #0a0a0a; padding: 0; }
        .modal-img { width: 100%; height: auto; maxHeight: 400px; objectFit: cover; }
        .modal-prompt-text { background: rgba(255,255,255,0.03); padding: 1.5rem; borderRadius: 12px; border: 1px solid var(--glass-border); marginBottom: 2.5rem; fontSize: 1.1rem; lineHeight: 1.6; color: white; }
        .close-btn { background: none; border: none; color: white; cursor: pointer; fontSize: 2rem; }
      `}</style>
    </main>
  );
}
