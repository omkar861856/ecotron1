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

  const trackActivity = (title: string) => {
    const history = JSON.parse(localStorage.getItem('ecotron_history') || '[]');
    const newHistory = [...history, title].slice(-10); // Keep last 10
    localStorage.setItem('ecotron_history', JSON.stringify(newHistory));
    localStorage.setItem('ecotron_last_activity', Date.now().toString());
  };

  const openPrompt = (p: any) => {
    setSelectedPrompt(p);
    trackActivity(p.title);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopyStatus('Copied! ✅');
    setTimeout(() => setCopyStatus('Copy'), 2000);
  };

  return (
    <main>
      <title>Ecotron AI | Neural Prompt Discovery Engine</title>
      <div className="bg-glow" />
      
      <div className="container">
        <div className="language-bar">
          <img src="https://img.shields.io/badge/English-Current-brightgreen" alt="English" />
          <img src="https://img.shields.io/badge/%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87-View-lightgrey" alt="Chinese" />
          <img src="https://img.shields.io/badge/%E6%97%A5%E6%9C%AC%E8%AA%9E-View-lightgrey" alt="Japanese" />
          <img src="https://img.shields.io/badge/%ED%95%9C%EA%B5%AD%EC%96%B4-View-lightgrey" alt="Korean" />
          <img src="https://img.shields.io/badge/%E0%A4%B9%E0%A4%BF%E0%A4%A8%E0%A5%8D%E0%A4%A6%E0%A5%80-View-lightgrey" alt="Hindi" />
        </div>

        <AdBanner height={90} width={728} adKey="c25ecd0c0fe9d93f6cf66f0016cbd198" />

        <div className="hero-section">
          <h1 className="main-logo">ECOTRON <span style={{ color: 'var(--primary)' }}>AI</span></h1>
          
          <div className="quote-banner glass-card">
            <span className="quote-label">QUOTE OF THE DAY</span>
            <p className="quote-text">"{quote}"</p>
          </div>

          <form onSubmit={handleSearch} className="search-container">
            <input 
              type="text" 
              placeholder="Search for styles, ideas, or topics using AI..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="neural-search-input"
            />
            <button type="submit" className="search-btn" disabled={loading}>
              {loading ? 'Searching...' : 'NEURAL SEARCH'}
            </button>
          </form>
        </div>

        <div className="grid-layout">
          <section>
            {/* RECOMMENDATIONS SECTION */}
            {recommendations.length > 0 && !searchResults && (
              <div className="rec-section">
                <h3 className="section-title">Personalized for You</h3>
                <div className="prompt-grid small-grid">
                  {recommendations.map((p, i) => (
                    <div key={i} className="glass-card prompt-item rec-item" onClick={() => openPrompt(p)}>
                      <div className="prompt-info">
                        <span className="prompt-cat">{p.category.toUpperCase()}</span>
                        <h4 className="prompt-title">{p.title}</h4>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SEARCH RESULTS OR FULL LIBRARY */}
            <div className="library-header">
              <h3 className="section-title">
                {searchResults ? `Results for "${searchQuery}"` : 'Global Prompt Library'}
              </h3>
              {!searchResults && (
                <div className="category-bar">
                  <button className={`btn-outline ${activeCategory === 'all' ? 'active' : ''}`} onClick={() => setActiveCategory('all')}>All</button>
                  <button className={`btn-outline ${activeCategory === 'Video' ? 'active' : ''}`} onClick={() => setActiveCategory('Video')}>🎬 Video</button>
                  <button className={`btn-outline ${activeCategory === 'chatgpt' ? 'active' : ''}`} onClick={() => setActiveCategory('chatgpt')}>ChatGPT</button>
                </div>
              )}
              {searchResults && <button className="btn-outline" onClick={() => setSearchResults(null)}>Back to Library</button>}
            </div>

            <div className="prompt-grid">
              {(searchResults || prompts).map((p, i) => (
                <div key={i} className="prompt-item-container">
                  <div className="glass-card prompt-item" onClick={() => openPrompt(p)}>
                    {p.image_url && <div className="prompt-img" style={{ backgroundImage: `url(${p.image_url})` }} />}
                    <div className="prompt-info">
                      <span className="prompt-cat">{p.category.toUpperCase()}</span>
                      <h4 className="prompt-title">{p.title}</h4>
                    </div>
                  </div>
                  {(i + 1) % 12 === 0 && (
                    <div className="mobile-inline-ad">
                      <AdBanner height={250} width={300} adKey="eca2cd8a7fd561c8d9ddc9b4e1302ac9" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {!searchResults && page < 50 && (
              <button className="btn-outline load-more" onClick={() => { setPage(page + 1); fetchPrompts(page + 1, activeCategory); }}>
                LOAD MORE
              </button>
            )}
          </section>

          <aside className="sticky-sidebar">
            <AdBanner height={250} width={300} adKey="eca2cd8a7fd561c8d9ddc9b4e1302ac9" />
            <div className="sidebar-sticky-unit">
              <div className="glass-card sidebar-stat">
                <h4>Platform Stats</h4>
                <div className="stat-row"><span>Prompts</span> <span>2,572+</span></div>
                <div className="stat-row"><span>Daily Views</span> <span>12.4k</span></div>
              </div>
              <AdBanner height={300} width={160} adKey="7f1e1c3d11870c7899ccce329cdd56e9" />
            </div>
          </aside>
        </div>

        {selectedPrompt && (
          <div className="modal-overlay" onClick={() => setSelectedPrompt(null)}>
            <div className="modal-content glass-card" onClick={e => e.stopPropagation()}>
              {selectedPrompt.image_url && <img src={selectedPrompt.image_url} className="modal-img" alt="" />}
              <div style={{ padding: '2.5rem' }}>
                <div className="modal-header">
                  <div>
                    <span className="prompt-cat">{selectedPrompt.category.toUpperCase()}</span>
                    <h2>{selectedPrompt.title}</h2>
                  </div>
                  <button onClick={() => setSelectedPrompt(null)} className="close-btn">&times;</button>
                </div>
                <div className="modal-prompt-text">{selectedPrompt.content}</div>
                <button className="btn-primary" style={{ width: '100%' }} onClick={() => copyToClipboard(selectedPrompt.content)}>{copyStatus}</button>
              </div>
            </div>
          </div>
        )}

        <footer>
          <AdBanner height={90} width={728} adKey="c25ecd0c0fe9d93f6cf66f0016cbd198" />
          <p>© 2026 ECOTRON AI. Neural Discovery Engine.</p>
        </footer>
      </div>

      <style jsx>{`
        .hero-section { text-align: center; margin-bottom: 5rem; margin-top: 3rem; }
        .quote-banner { max-width: 600px; margin: 2rem auto 3rem; padding: 1rem 2rem; border-radius: 50px; background: rgba(59, 130, 246, 0.05); border: 1px solid rgba(59, 130, 246, 0.2); }
        .quote-label { font-size: 0.6rem; color: var(--primary); font-weight: 800; letter-spacing: 2px; }
        .quote-text { font-size: 1.1rem; font-style: italic; opacity: 0.8; margin-top: 0.5rem; }
        
        .search-container { position: relative; max-width: 800px; margin: 0 auto; display: flex; gap: 0.5rem; }
        .neural-search-input { width: 100%; padding: 1.5rem 2rem; border-radius: 50px; background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); color: white; font-size: 1.1rem; transition: all 0.3s ease; }
        .neural-search-input:focus { background: rgba(255,255,255,0.06); border-color: var(--primary); outline: none; box-shadow: 0 0 20px rgba(59, 130, 246, 0.2); }
        .search-btn { padding: 0 2rem; border-radius: 50px; background: var(--primary); color: white; border: none; font-weight: bold; cursor: pointer; transition: transform 0.2s; }
        .search-btn:hover { transform: scale(1.05); }

        .rec-section { margin-bottom: 4rem; padding: 2rem; background: rgba(255,255,255,0.02); border-radius: 20px; border: 1px solid var(--glass-border); }
        .section-title { font-size: 1.5rem; margin-bottom: 2rem; letter-spacing: -0.01em; }
        .small-grid { grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)) !important; gap: 1rem !important; }
        .rec-item { padding: 1rem !important; min-height: auto !important; }
        
        .main-logo { font-size: 4rem; font-weight: 900; letter-spacing: -0.05em; }
        .grid-layout { display: grid; grid-template-columns: 1fr 320px; gap: 2rem; }
        .sidebar-stat { padding: 1.5rem; margin-bottom: 1.5rem; }
        .stat-row { display: flex; justify-content: space-between; margin-top: 1rem; font-size: 0.9rem; opacity: 0.6; }

        .prompt-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; }
        .prompt-item { padding: 0; cursor: pointer; overflow: hidden; height: 100%; display: flex; flex-direction: column; transition: all 0.3s ease; }
        .prompt-img { height: 200px; width: 100%; background-position: center; background-size: cover; }
        .prompt-info { padding: 1.5rem; flex-grow: 1; }
        .prompt-cat { font-size: 0.7rem; color: var(--primary); font-weight: bold; }
        .prompt-title { margin: 0.5rem 0; font-size: 1.1rem; line-height: 1.4; }

        @media (max-width: 992px) {
          .grid-layout { grid-template-columns: 1fr; }
          .sticky-sidebar { display: none; }
          .main-logo { font-size: 3rem; }
          .search-container { flex-direction: column; }
          .search-btn { padding: 1.2rem; }
        }

        .modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.95); backdrop-filter: blur(15px); z-index: 1000; display: flex; justify-content: center; alignItems: center; padding: 2rem; }
        .modal-content { max-width: 800px; width: 100%; max-height: 95vh; overflow-y: auto; background: #070707; padding: 0; }
        .modal-img { width: 100%; height: auto; max-height: 450px; object-fit: cover; }
        .modal-prompt-text { background: rgba(255,255,255,0.03); padding: 2rem; border-radius: 12px; border: 1px solid var(--glass-border); margin-bottom: 2.5rem; font-size: 1.15rem; line-height: 1.7; color: #fff; }
        .close-btn { background: none; border: none; color: white; cursor: pointer; font-size: 2.5rem; }
      `}</style>
    </main>
  );
}
