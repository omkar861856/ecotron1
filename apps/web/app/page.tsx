'use client';

import { useState, useEffect } from 'react';
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
      const newPrompts = Array.isArray(data.data) ? data.data : [];
      if (pageNum === 1) setPrompts(newPrompts);
      else setPrompts(prev => [...prev, ...newPrompts]);
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
      setSearchResults(Array.isArray(data) ? data : []);
    } catch (err) { 
      console.error(err);
      setSearchResults([]);
    }
    setLoading(false);
  };

  const fetchRecommendations = async () => {
    const history = JSON.parse(localStorage.getItem('ecotron_history') || '[]');
    try {
      const res = await fetch('https://api.ecotron.co.in/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history: history.slice(-5) }),
      });
      const data = await res.json();
      setRecommendations(Array.isArray(data) ? data : []);
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
      <title>Ecotron AI | Neural Intelligence Discovery</title>
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
            <h2 className="hero-title">Neural Discovery Engine.</h2>
            <form onSubmit={handleSearch} className="neural-search-box">
              <input 
                type="text" 
                placeholder="Search styles, code, or video prompts..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" disabled={loading}>
                {loading ? 'Analyzing...' : 'Search'}
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

          <section className="library-section">
            <h3 className="sub-title">
              {searchResults ? `Results for "${searchQuery}"` : 'Prompt Library'}
            </h3>
            
            <div className="bento-grid">
              {(searchResults || prompts).map((p: any, i: number) => (
                <div key={i} className="bento-card" onClick={() => openPrompt(p)}>
                  {p.image_url && <div className="card-media" style={{ backgroundImage: `url(${p.image_url})` }} />}
                  <div className="card-body">
                    <span className="card-cat">{p.category?.toUpperCase()}</span>
                    <h4 className="card-title">{p.title}</h4>
                  </div>
                </div>
              ))}
            </div>

            {!searchResults && prompts.length > 0 && (
              <button className="load-more-btn" onClick={() => { setPage(page + 1); fetchPrompts(page + 1, activeCategory); }}>
                VIEW MORE
              </button>
            )}
          </section>
        </div>

        <aside className="right-rail">
          <div className="sticky-rail">
            <AdBanner height={250} width={300} adKey="eca2cd8a7fd561c8d9ddc9b4e1302ac9" />
            <div className="platform-info glass">
              <h4>Platform Stats</h4>
              <div className="stat-line"><span>Models</span> <span>LLama3 / Gemini</span></div>
              <div className="stat-line"><span>Speed</span> <span>< 200ms</span></div>
            </div>
            <AdBanner height={600} width={300} adKey="7f1e1c3d11870c7899ccce329cdd56e9" />
          </div>
        </aside>
      </div>

      <footer className="main-footer">
        <AdBanner height={90} width={728} adKey="c25ecd0c0fe9d93f6cf66f0016cbd198" />
        <p className="copyright">© 2026 ECOTRON AI.</p>
      </footer>

      {selectedPrompt && (
        <div className="modal-overlay" onClick={() => setSelectedPrompt(null)}>
          <div className="modal-window glass" onClick={e => e.stopPropagation()}>
            <div className="modal-scroll-area">
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
                <button className="copy-btn" onClick={() => copyToClipboard(selectedPrompt.content)}>{copyStatus}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .premium-theme { color: #fff; min-height: 100vh; font-family: 'Inter', sans-serif; }
        .mesh-gradient { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: #000; z-index: -1; }
        
        .main-header { padding: 1.5rem 0; border-bottom: 1px solid rgba(255,255,255,0.05); position: sticky; top: 0; z-index: 100; background: rgba(0,0,0,0.8); backdrop-filter: blur(20px); }
        .nav-container { max-width: 1600px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; padding: 0 2rem; }
        .logo { font-size: 1.5rem; font-weight: 900; }
        .accent-text { color: var(--primary); }

        .layout-root { display: flex; max-width: 1600px; margin: 0 auto; gap: 4rem; padding: 0 2rem; }
        .main-content { flex: 1; min-width: 0; }
        .right-rail { width: 320px; flex-shrink: 0; padding-top: 4rem; }
        .sticky-rail { position: sticky; top: 7rem; display: flex; flex-direction: column; gap: 3rem; }

        .hero-section { padding: 4rem 0; text-align: center; }
        .hero-title { font-size: 3.5rem; font-weight: 800; margin-bottom: 2.5rem; letter-spacing: -0.05em; }
        .neural-search-box { max-width: 800px; margin: 0 auto; background: rgba(255,255,255,0.05); border-radius: 50px; border: 1px solid rgba(255,255,255,0.1); padding: 0.4rem; display: flex; }
        .neural-search-box input { flex: 1; background: none; border: none; padding: 1rem 2rem; color: white; font-size: 1.1rem; outline: none; }
        .neural-search-box button { padding: 0 2.5rem; border-radius: 40px; background: var(--primary); color: white; border: none; font-weight: 700; cursor: pointer; }

        .category-scroller { display: flex; gap: 0.8rem; overflow-x: auto; padding-bottom: 2rem; margin-bottom: 3rem; scrollbar-width: none; }
        .cat-btn { white-space: nowrap; padding: 0.7rem 1.4rem; border-radius: 50px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; }
        .cat-btn.active { background: #fff; color: #000; }

        .bento-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; }
        .bento-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 24px; overflow: hidden; cursor: pointer; transition: transform 0.2s; }
        .bento-card:hover { transform: translateY(-5px); border-color: var(--primary); }
        .card-media { height: 180px; background-size: cover; background-position: center; }
        .card-body { padding: 1.5rem; }
        .card-cat { font-size: 0.65rem; color: var(--primary); font-weight: 800; }
        .card-title { margin-top: 0.5rem; font-size: 1.1rem; line-height: 1.4; }

        .load-more-btn { width: 100%; padding: 1.5rem; margin-top: 3rem; border-radius: 20px; border: 1px dashed rgba(255,255,255,0.2); background: none; color: #fff; font-weight: 700; cursor: pointer; }

        .modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.9); backdrop-filter: blur(15px); z-index: 1000; display: flex; justify-content: center; align-items: center; padding: 2rem; }
        .modal-window { max-width: 800px; width: 100%; max-height: 90vh; background: #080808; border-radius: 32px; border: 1px solid rgba(255,255,255,0.1); position: relative; overflow: hidden; }
        .modal-scroll-area { height: 100%; overflow-y: auto; padding-bottom: 2rem; }
        .modal-hero-img { width: 100%; max-height: 400px; object-fit: cover; }
        .modal-inner { padding: 2.5rem; }
        .modal-head { display: flex; justify-content: space-between; margin-bottom: 2rem; }
        .modal-content-box { background: rgba(255,255,255,0.03); padding: 2rem; border-radius: 20px; font-size: 1.1rem; line-height: 1.7; margin-bottom: 2rem; white-space: pre-wrap; }
        .copy-btn { width: 100%; padding: 1.2rem; border-radius: 15px; background: var(--primary); color: white; border: none; font-weight: 700; cursor: pointer; }
        .close-x { background: none; border: none; color: white; font-size: 2.5rem; cursor: pointer; }

        .main-footer { padding: 6rem 0; text-align: center; border-top: 1px solid rgba(255,255,255,0.05); }
        .copyright { margin-top: 2rem; opacity: 0.3; font-size: 0.8rem; }
      `}</style>
    </main>
  );
}
