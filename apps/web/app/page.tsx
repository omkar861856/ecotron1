'use client';

import { useState, useEffect, useRef } from 'react';
import AdBanner from './components/AdBanner';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState('');
  
  const [prompts, setPrompts] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedPrompt, setSelectedPrompt] = useState<any>(null);
  const [copyStatus, setCopyStatus] = useState('Copy');

  const categories = [
    { id: 'all', label: 'All', icon: '✨' },
    { id: 'Video', label: 'Video', icon: '🎬' },
    { id: 'Coding', label: 'Coding', icon: '💻' },
    { id: 'Marketing', label: 'Marketing', icon: '📈' },
    { id: 'Art', label: 'Digital Art', icon: '🎨' },
    { id: 'Writing', label: 'Writing', icon: '📝' },
    { id: 'chatgpt', label: 'ChatGPT', icon: '🤖' },
  ];

  useEffect(() => {
    fetchQuote();
    fetchPrompts(1, 'all');
    fetchRecommendations();
  }, []);

  useEffect(() => {
    setPage(1);
    setPrompts([]);
    setSearchResults(null);
    fetchPrompts(1, activeCategory);
  }, [activeCategory]);

  const fetchQuote = async () => {
    try {
      const res = await fetch('https://api.ecotron.co.in/api/quote');
      const data = await res.json();
      setQuote(data.quote);
    } catch (err) { console.error(err); }
  };

  const fetchPrompts = async (pageNum: number, category: string) => {
    try {
      const res = await fetch(`https://api.ecotron.co.in/api/prompts?page=${pageNum}&category=${category}&limit=24`);
      const data = await res.json();
      if (pageNum === 1) setPrompts(data.data);
      else setPrompts(prev => [...prev, ...data.data]);
    } catch (err) { console.error(err); }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    setLoading(true);
    try {
      const res = await fetch('https://api.ecotron.co.in/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery }),
      });
      const data = await res.json();
      setSearchResults(data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const fetchRecommendations = async () => {
    const history = JSON.parse(localStorage.getItem('ecotron_history') || '[]');
    if (history.length === 0) return;
    try {
      const res = await fetch('https://api.ecotron.co.in/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history: history.slice(-5) }),
      });
      const data = await res.json();
      setRecommendations(data);
    } catch (err) { console.error(err); }
  };

  const openPrompt = (p: any) => {
    setSelectedPrompt(p);
    const history = JSON.parse(localStorage.getItem('ecotron_history') || '[]');
    const newHistory = [...history, p.title].slice(-10);
    localStorage.setItem('ecotron_history', JSON.stringify(newHistory));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopyStatus('Copied! ✅');
    setTimeout(() => setCopyStatus('Copy'), 2000);
  };

  return (
    <main className="premium-theme">
      <title>Ecotron AI | The Ultimate Prompt Engine</title>
      <div className="mesh-gradient" />
      
      <header className="main-header">
        <div className="nav-container">
          <h1 className="logo">ECOTRON <span className="accent-text">AI</span></h1>
          <div className="header-ad">
            <AdBanner height={60} width={468} adKey="c25ecd0c0fe9d93f6cf66f0016cbd198" />
          </div>
        </div>
      </header>

      <div className="layout-root">
        <div className="main-content">
          <section className="hero-section">
            <div className="quote-badge">
              <span className="pulse"></span> {quote}
            </div>
            <h2 className="hero-title">Unlock Universal Intelligence.</h2>
            <form onSubmit={handleSearch} className="neural-search-box">
              <input 
                type="text" 
                placeholder="Search for styles, code, or cinematic video prompts..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" disabled={loading}>
                {loading ? 'Analyzing...' : 'Neural Search'}
              </button>
            </form>
          </section>

          <nav className="category-scroller">
            {categories.map((cat) => (
              <button 
                key={cat.id}
                className={`cat-btn ${activeCategory === cat.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                <span className="cat-icon">{cat.icon}</span> {cat.label}
              </button>
            ))}
          </nav>

          {recommendations.length > 0 && !searchResults && (
            <section className="recommendations-row">
              <h3 className="sub-title">Personalized for you</h3>
              <div className="bento-grid-mini">
                {recommendations.map((p, i) => (
                  <div key={i} className="bento-card-mini" onClick={() => openPrompt(p)}>
                    <span className="mini-cat">{p.category}</span>
                    <h4>{p.title}</h4>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="library-section">
            <h3 className="sub-title">
              {searchResults ? `Results for "${searchQuery}"` : 'Discovery Hub'}
            </h3>
            <div className="bento-grid">
              {(searchResults || prompts).map((p, i) => (
                <div key={i} className="bento-card" onClick={() => openPrompt(p)}>
                  {p.image_url && (
                    <div className="card-media" style={{ backgroundImage: `url(${p.image_url})` }}>
                      <div className="media-overlay" />
                    </div>
                  )}
                  <div className="card-body">
                    <span className="card-cat">{p.category.toUpperCase()}</span>
                    <h4 className="card-title">{p.title}</h4>
                  </div>
                </div>
              ))}
            </div>

            {!searchResults && (
              <button className="load-more-btn" onClick={() => { setPage(page + 1); fetchPrompts(page + 1, activeCategory); }}>
                VIEW MORE
              </button>
            )}
          </section>
        </div>

        <aside className="right-rail">
          <div className="sticky-rail">
            <div className="ad-container-side">
              <AdBanner height={250} width={300} adKey="eca2cd8a7fd561c8d9ddc9b4e1302ac9" />
            </div>
            <div className="platform-info glass">
              <h4>System Status</h4>
              <div className="stat-line"><span>Engine</span> <span className="status-ok">Nano Banana 2.0</span></div>
              <div className="stat-line"><span>Uptime</span> <span>99.9%</span></div>
            </div>
            <div className="ad-container-side">
              <AdBanner height={600} width={300} adKey="7f1e1c3d11870c7899ccce329cdd56e9" />
            </div>
          </div>
        </aside>
      </div>

      <footer className="main-footer">
        <AdBanner height={90} width={728} adKey="c25ecd0c0fe9d93f6cf66f0016cbd198" />
        <p className="copyright">© 2026 ECOTRON AI — Pushing the boundaries of human potential.</p>
      </footer>

      {selectedPrompt && (
        <div className="modal-overlay" onClick={() => setSelectedPrompt(null)}>
          <div className="modal-window glass" onClick={e => e.stopPropagation()}>
            {selectedPrompt.image_url && <img src={selectedPrompt.image_url} className="modal-hero-img" alt="" />}
            <div className="modal-inner">
              <div className="modal-head">
                <div>
                  <span className="modal-cat">{selectedPrompt.category}</span>
                  <h2>{selectedPrompt.title}</h2>
                </div>
                <button onClick={() => setSelectedPrompt(null)} className="close-x">&times;</button>
              </div>
              <div className="modal-content-box">
                {selectedPrompt.content}
              </div>
              <div className="modal-footer">
                <button className="copy-btn" onClick={() => copyToClipboard(selectedPrompt.content)}>{copyStatus}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .premium-theme { color: #fff; min-height: 100vh; font-family: 'Inter', system-ui, sans-serif; overflow-x: hidden; }
        .mesh-gradient { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: radial-gradient(circle at 0% 0%, #0a0a0a 0%, #000 100%), radial-gradient(circle at 100% 100%, #111 0%, #000 100%); z-index: -1; }
        
        .main-header { padding: 1.5rem 0; border-bottom: 1px solid rgba(255,255,255,0.05); backdrop-filter: blur(20px); position: sticky; top: 0; z-index: 100; background: rgba(0,0,0,0.7); }
        .nav-container { max-width: 1600px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; padding: 0 2rem; }
        .logo { font-size: 1.5rem; font-weight: 900; letter-spacing: -0.05em; }
        .accent-text { color: var(--primary); }

        .layout-root { display: flex; max-width: 1600px; margin: 0 auto; gap: 4rem; padding: 0 2rem; }
        .main-content { flex: 1; min-width: 0; }
        .right-rail { width: 320px; flex-shrink: 0; padding-top: 4rem; border-left: 1px solid rgba(255,255,255,0.05); padding-left: 2rem; }
        .sticky-rail { position: sticky; top: 7rem; display: flex; flex-direction: column; gap: 3rem; }

        .hero-section { padding: 6rem 0; text-align: center; }
        .quote-badge { display: inline-flex; align-items: center; gap: 0.75rem; background: rgba(255,255,255,0.05); padding: 0.6rem 1.2rem; border-radius: 100px; font-size: 0.85rem; border: 1px solid rgba(255,255,255,0.1); margin-bottom: 2rem; color: rgba(255,255,255,0.7); }
        .pulse { width: 8px; height: 8px; background: var(--primary); border-radius: 50%; box-shadow: 0 0 10px var(--primary); }
        .hero-title { font-size: 4.5rem; font-weight: 800; letter-spacing: -0.05em; margin-bottom: 3rem; line-height: 1; }

        .neural-search-box { max-width: 800px; margin: 0 auto; position: relative; background: rgba(255,255,255,0.05); border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); padding: 0.5rem; display: flex; gap: 0.5rem; transition: all 0.3s; }
        .neural-search-box:focus-within { border-color: var(--primary); box-shadow: 0 0 30px rgba(59, 130, 246, 0.2); }
        .neural-search-box input { flex: 1; background: none; border: none; padding: 1.2rem 2rem; color: white; font-size: 1.2rem; }
        .neural-search-box input:focus { outline: none; }
        .neural-search-box button { padding: 0 2rem; border-radius: 15px; background: var(--primary); color: white; border: none; font-weight: 700; cursor: pointer; }

        .category-scroller { display: flex; gap: 1rem; overflow-x: auto; padding-bottom: 1.5rem; margin-bottom: 4rem; scrollbar-width: none; }
        .cat-btn { white-space: nowrap; padding: 0.8rem 1.5rem; border-radius: 100px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; cursor: pointer; transition: all 0.2s; font-size: 0.9rem; display: flex; align-items: center; gap: 0.6rem; }
        .cat-btn.active { background: #fff; color: #000; border-color: #fff; }
        .cat-btn:hover:not(.active) { background: rgba(255,255,255,0.1); }

        .sub-title { font-size: 1.5rem; margin-bottom: 2rem; font-weight: 700; }
        .bento-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem; }
        .bento-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 24px; overflow: hidden; transition: all 0.3s; cursor: pointer; }
        .bento-card:hover { transform: translateY(-8px); border-color: rgba(255,255,255,0.2); background: rgba(255,255,255,0.05); }
        .card-media { height: 220px; width: 100%; background-size: cover; background-position: center; position: relative; }
        .media-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.8)); }
        .card-body { padding: 1.5rem; }
        .card-cat { font-size: 0.7rem; color: var(--primary); font-weight: 800; letter-spacing: 0.1em; }
        .card-title { margin-top: 0.5rem; font-size: 1.2rem; line-height: 1.4; }

        .bento-grid-mini { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1rem; margin-bottom: 5rem; }
        .bento-card-mini { background: rgba(59, 130, 246, 0.05); border: 1px solid rgba(59, 130, 246, 0.1); padding: 1.5rem; border-radius: 20px; cursor: pointer; }
        .mini-cat { font-size: 0.6rem; color: var(--primary); font-weight: 800; }

        .load-more-btn { width: 100%; padding: 2rem; margin-top: 4rem; border-radius: 24px; border: 1px dashed rgba(255,255,255,0.2); background: none; color: rgba(255,255,255,0.5); font-weight: 700; cursor: pointer; transition: all 0.2s; }
        .load-more-btn:hover { background: rgba(255,255,255,0.05); color: #fff; }

        .main-footer { padding: 8rem 0 4rem; text-align: center; border-top: 1px solid rgba(255,255,255,0.05); }
        .copyright { margin-top: 3rem; opacity: 0.3; font-size: 0.8rem; }

        .platform-info { padding: 2rem; border-radius: 24px; border: 1px solid rgba(255,255,255,0.05); }
        .stat-line { display: flex; justify-content: space-between; margin-top: 1.5rem; font-size: 0.9rem; }
        .status-ok { color: #10b981; font-weight: 800; }

        @media (max-width: 1200px) {
          .layout-root { grid-template-columns: 1fr; }
          .right-rail { display: none; }
          .hero-title { font-size: 3rem; }
        }

        .modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.95); backdrop-filter: blur(20px); z-index: 1000; display: flex; justify-content: center; align-items: center; padding: 2rem; }
        .modal-window { max-width: 900px; width: 100%; background: #0a0a0a; border-radius: 32px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); }
        .modal-hero-img { width: 100%; max-height: 500px; object-fit: cover; }
        .modal-inner { padding: 3rem; }
        .modal-head { display: flex; justify-content: space-between; margin-bottom: 2rem; }
        .modal-cat { color: var(--primary); font-weight: 800; }
        .modal-content-box { background: rgba(255,255,255,0.03); padding: 2.5rem; border-radius: 20px; font-size: 1.2rem; line-height: 1.7; margin-bottom: 2rem; }
        .copy-btn { width: 100%; padding: 1.5rem; border-radius: 16px; background: var(--primary); color: white; border: none; font-weight: 700; cursor: pointer; }
        .close-x { background: none; border: none; color: white; font-size: 3rem; cursor: pointer; line-height: 0.5; }
      `}</style>
    </main>
  );
}
