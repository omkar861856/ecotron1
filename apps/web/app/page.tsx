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
      <title>Ecotron AI | Advanced Prompt Engine & Video Generation</title>
      
      <div className="bg-glow" />
      
      <div className="container">
        {/* Language Badges Bar */}
        <div className="language-bar">
          <img src="https://img.shields.io/badge/English-Current-brightgreen" alt="English" />
          <img src="https://img.shields.io/badge/%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87-View-lightgrey" alt="Simplified Chinese" />
          <img src="https://img.shields.io/badge/%E6%97%A5%E6%9C%AC%E8%AA%9E-View-lightgrey" alt="Japanese" />
          <img src="https://img.shields.io/badge/%ED%95%9C%EA%B5%AD%EC%96%B4-View-lightgrey" alt="Korean" />
          <img src="https://img.shields.io/badge/%E0%A4%B9%E0%A4%BF%E0%A4%A8%E0%A5%8D%E0%A4%A6%E0%A5%80-View-lightgrey" alt="Hindi" />
          <img src="https://img.shields.io/badge/Espa%C3%B1ol-View-lightgrey" alt="Spanish" />
          <img src="https://img.shields.io/badge/Fran%C3%A7ais-View-lightgrey" alt="French" />
          <img src="https://img.shields.io/badge/T%C3%BCrk%C3%A7e-View-lightgrey" alt="Turkish" />
        </div>

        <AdBanner height={90} width={728} adKey="c25ecd0c0fe9d93f6cf66f0016cbd198" />

        <div style={{ textAlign: 'center', marginBottom: '4rem', marginTop: '2rem' }}>
          <h1 className="main-logo">ECOTRON <span style={{ color: 'var(--primary)' }}>AI</span></h1>
          <p className="subtitle">Global Seedance 2.0 Video Hub & Advanced Prompt Engine.</p>
        </div>

        <div className="grid-layout">
          <section>
            <div className="glass-card" style={{ marginBottom: '3rem' }}>
              <div className="tool-bar">
                <button className={`btn-outline ${activeTool === 'rewrite' ? 'active' : ''}`} onClick={() => setActiveTool('rewrite')}>Rewrite</button>
                <button className={`btn-outline ${activeTool === 'summarize' ? 'active' : ''}`} onClick={() => setActiveTool('summarize')}>Summarize</button>
                <button className={`btn-outline ${activeTool === 'email' ? 'active' : ''}`} onClick={() => setActiveTool('email')}>Email</button>
                <button className={`btn-outline ${activeTool === 'calc' ? 'active' : ''}`} onClick={() => setActiveTool('calc')}>Calculator</button>
              </div>

              <textarea 
                ref={textareaRef}
                placeholder={`Type your prompt idea... Enter to Send, Shift+Enter for New Line`}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />

              <div className="action-buttons">
                <button className="btn-primary" onClick={handleGenerate} disabled={loading || !input}>
                  {loading ? 'Processing...' : `GENERATE OUTPUT`}
                </button>
                <button className="btn-outline refine-btn" onClick={handleRefine} disabled={refining || !input}>
                  {refining ? 'Refining...' : `⚡ REFINE`}
                </button>
              </div>

              {output && (
                <div className="result-card glass-card">
                  <div className="result-header">
                    <h3>Result</h3>
                    <button className="btn-outline" onClick={() => copyToClipboard(output)}>Copy</button>
                  </div>
                  <div className="result-text">{output}</div>
                </div>
              )}
            </div>

            {/* CATEGORY BAR */}
            <div className="category-bar">
              <button className={`btn-outline ${activeCategory === 'all' ? 'active' : ''}`} onClick={() => setActiveCategory('all')}>All</button>
              <button className={`btn-outline ${activeCategory === 'Video' ? 'active' : ''}`} onClick={() => setActiveCategory('Video')}>🎬 Video</button>
              <button className={`btn-outline ${activeCategory === 'chatgpt' ? 'active' : ''}`} onClick={() => setActiveCategory('chatgpt')}>ChatGPT</button>
              <button className={`btn-outline ${activeCategory === 'general' ? 'active' : ''}`} onClick={() => setActiveCategory('general')}>Nano Banana</button>
            </div>

            {/* PROMPT GRID */}
            <div className="prompt-grid">
              {prompts.map((p, i) => (
                <div key={i} className="prompt-item-container">
                  <div className="glass-card prompt-item" onClick={() => setSelectedPrompt(p)}>
                    {p.image_url && (
                      <div className="prompt-img" style={{ backgroundImage: `url(${p.image_url})` }} />
                    )}
                    <div className="prompt-info">
                      <span className="prompt-cat">{p.category.toUpperCase()}</span>
                      <h4 className="prompt-title">{p.title}</h4>
                    </div>
                  </div>
                  {(i + 1) % 8 === 0 && (
                    <div className="mobile-inline-ad">
                      <AdBanner height={250} width={300} adKey="eca2cd8a7fd561c8d9ddc9b4e1302ac9" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {page < totalPages && (
              <button className="btn-outline load-more" onClick={() => { setPage(page + 1); fetchPrompts(page + 1, activeCategory); }}>
                LOAD MORE PROMPTS
              </button>
            )}
          </section>

          <aside className="sticky-sidebar">
            <AdBanner height={250} width={300} adKey="eca2cd8a7fd561c8d9ddc9b4e1302ac9" />
            <div className="sidebar-sticky-unit">
              <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ marginBottom: '0.5rem' }}>Stats</h4>
                <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>
                  <div>Total Prompts: 2,572+</div>
                  <div>Last Updated: 2026-05-05</div>
                </div>
              </div>
              <AdBanner height={300} width={160} adKey="7f1e1c3d11870c7899ccce329cdd56e9" />
            </div>
          </aside>
        </div>

        {selectedPrompt && (
          <div className="modal-overlay" onClick={() => setSelectedPrompt(null)}>
            <div className="modal-content glass-card" onClick={e => e.stopPropagation()}>
              {selectedPrompt.image_url && <img src={selectedPrompt.image_url} className="modal-img" alt={selectedPrompt.title} />}
              <div style={{ padding: '2.5rem' }}>
                <div className="modal-header">
                  <div>
                    <span className="prompt-cat">{selectedPrompt.category.toUpperCase()}</span>
                    <h2>{selectedPrompt.title}</h2>
                  </div>
                  <button onClick={() => setSelectedPrompt(null)} className="close-btn">&times;</button>
                </div>
                <div className="modal-prompt-text">{selectedPrompt.content}</div>
                <div className="modal-actions">
                  <button className="btn-primary" onClick={() => usePrompt(selectedPrompt)}>Load into Hub</button>
                  <button className="btn-outline" onClick={() => copyToClipboard(selectedPrompt.content)}>{copyStatus}</button>
                </div>
              </div>
            </div>
          </div>
        )}

        <footer>
          <AdBanner height={90} width={728} adKey="c25ecd0c0fe9d93f6cf66f0016cbd198" />
          <p>© 2026 ECOTRON AI. Global AI Intelligence.</p>
        </footer>
      </div>

      <style jsx>{`
        .language-bar { display: flex; gap: 0.5rem; justify-content: center; margin-bottom: 2rem; flex-wrap: wrap; opacity: 0.8; }
        .language-bar img { height: 20px; cursor: pointer; transition: opacity 0.2s; }
        .language-bar img:hover { opacity: 1; }
        
        .main-logo { font-size: 3rem; letter-spacing: -0.02em; font-weight: 800; }
        .grid-layout { display: grid; grid-template-columns: 1fr 320px; gap: 2rem; }
        .sticky-sidebar { display: flex; flex-direction: column; gap: 2rem; }
        .sidebar-sticky-unit { position: sticky; top: 2rem; }
        
        .tool-bar { display: flex; gap: 0.75rem; margin-bottom: 2rem; flex-wrap: wrap; }
        textarea { margin-bottom: 1.5rem; min-height: 180px; }
        .action-buttons { display: flex; gap: 1rem; }
        .refine-btn { flex: 1; border-color: var(--accent); color: var(--accent); }
        .result-card { background: rgba(59, 130, 246, 0.05); margin-top: 2rem; border-color: var(--primary); }
        .result-header { display: flex; justify-content: space-between; margin-bottom: 1.5rem; }
        .result-text { white-space: pre-wrap; color: rgba(255,255,255,0.9); }
        
        .category-bar { margin-bottom: 2rem; display: flex; gap: 1rem; overflow-x: auto; padding-bottom: 1rem; }
        .prompt-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; }
        .prompt-item { padding: 0; cursor: pointer; overflow: hidden; height: 100%; display: flex; flex-direction: column; transition: transform 0.2s ease; }
        .prompt-item:hover { transform: translateY(-5px); }
        .prompt-img { height: 200px; width: 100%; background-position: center; background-size: cover; }
        .prompt-info { padding: 1.5rem; flex-grow: 1; }
        .prompt-cat { font-size: 0.7rem; color: var(--primary); font-weight: bold; letter-spacing: 0.05em; }
        .prompt-title { margin: 0.5rem 0; font-size: 1.1rem; line-height: 1.4; }
        .load-more { width: 100%; margin-top: 3rem; padding: 1.5rem; }

        .mobile-inline-ad { display: none; }

        @media (max-width: 992px) {
          .grid-layout { grid-template-columns: 1fr; }
          .sticky-sidebar { display: none; }
          .mobile-inline-ad { display: flex; justify-content: center; margin: 1rem 0; width: 100%; grid-column: 1 / -1; }
        }

        .modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.95); backdrop-filter: blur(15px); z-index: 1000; display: flex; justify-content: center; alignItems: center; padding: 2rem; }
        .modal-content { max-width: 800px; width: 100%; max-height: 95vh; overflow-y: auto; background: #070707; padding: 0; border: 1px solid var(--glass-border); }
        .modal-img { width: 100%; height: auto; max-height: 450px; object-fit: cover; border-bottom: 1px solid var(--glass-border); }
        .modal-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2.5rem; }
        .modal-prompt-text { background: rgba(255,255,255,0.03); padding: 2rem; border-radius: 12px; border: 1px solid var(--glass-border); margin-bottom: 2.5rem; font-size: 1.15rem; line-height: 1.7; color: #fff; }
        .modal-actions { display: flex; gap: 1rem; }
        .close-btn { background: none; border: none; color: white; cursor: pointer; font-size: 2.5rem; line-height: 1; }

        footer { margin-top: 8rem; padding-bottom: 4rem; text-align: center; border-top: 1px solid var(--glass-border); padding-top: 4rem; }
        footer p { opacity: 0.3; font-size: 0.8rem; margin-top: 2rem; }
      `}</style>
    </main>
  );
}
