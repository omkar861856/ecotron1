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
      // Ensure category matches DB (Seed script used 'Video')
      const catParam = category === 'Video' ? 'Video' : category;
      const res = await fetch(`https://api.ecotron.co.in/api/prompts?page=${pageNum}&category=${catParam}&limit=24`);
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
    <main>
      <title>Ecotron AI | Neural Prompt Discovery</title>
      <div className="bg-glow" />
      
      {/* TOP AD ZONE */}
      <div className="ad-zone-top">
        <AdBanner height={90} width={728} adKey="c25ecd0c0fe9d93f6cf66f0016cbd198" />
      </div>

      <div className="layout-wrapper">
        <div className="content-area">
          <div className="hero-section">
            <h1 className="main-logo">ECOTRON <span style={{ color: 'var(--primary)' }}>AI</span></h1>
            
            <div className="quote-banner glass-card">
              <span className="quote-label">QUOTE OF THE DAY</span>
              <p className="quote-text">"{quote}"</p>
            </div>

            <form onSubmit={handleSearch} className="search-container">
              <input 
                type="text" 
                placeholder="Describe what you want to create..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="neural-search-input"
              />
              <button type="submit" className="search-btn" disabled={loading}>
                {loading ? 'Searching...' : 'SEARCH'}
              </button>
            </form>
          </div>

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

          <div className="library-header">
            <h3 className="section-title">
              {searchResults ? `Results for "${searchQuery}"` : 'Library'}
            </h3>
            {!searchResults && (
              <div className="category-bar">
                <button className={`btn-outline ${activeCategory === 'all' ? 'active' : ''}`} onClick={() => setActiveCategory('all')}>All</button>
                <button className={`btn-outline ${activeCategory === 'Video' ? 'active' : ''}`} onClick={() => setActiveCategory('Video')}>🎬 Video</button>
                <button className={`btn-outline ${activeCategory === 'chatgpt' ? 'active' : ''}`} onClick={() => setActiveCategory('chatgpt')}>ChatGPT</button>
              </div>
            )}
            {searchResults && <button className="btn-outline" onClick={() => setSearchResults(null)}>Back</button>}
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
              </div>
            ))}
          </div>

          {!searchResults && page < 50 && (
            <button className="btn-outline load-more" onClick={() => { setPage(page + 1); fetchPrompts(page + 1, activeCategory); }}>
              LOAD MORE
            </button>
          )}
        </div>

        {/* RIGHT AD ZONE (20%) */}
        <aside className="ad-zone-right">
          <div className="sticky-ads">
            <AdBanner height={250} width={300} adKey="eca2cd8a7fd561c8d9ddc9b4e1302ac9" />
            <div style={{ height: '2rem' }} />
            <AdBanner height={600} width={300} adKey="7f1e1c3d11870c7899ccce329cdd56e9" />
          </div>
        </aside>
      </div>

      {/* BOTTOM AD ZONE */}
      <footer className="ad-zone-bottom">
        <AdBanner height={90} width={728} adKey="c25ecd0c0fe9d93f6cf66f0016cbd198" />
        <p>© 2026 ECOTRON AI.</p>
      </footer>

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

      <style jsx>{`
        .ad-zone-top { display: flex; justify-content: center; padding: 2rem 0; border-bottom: 1px solid var(--glass-border); background: rgba(0,0,0,0.2); }
        .ad-zone-bottom { margin-top: 5rem; padding: 4rem 0; border-top: 1px solid var(--glass-border); text-align: center; }
        .ad-zone-bottom p { opacity: 0.3; margin-top: 2rem; font-size: 0.8rem; }

        .layout-wrapper { display: flex; max-width: 1600px; margin: 0 auto; gap: 2rem; padding: 0 2rem; }
        .content-area { flex: 1; min-width: 0; padding: 3rem 0; }
        .ad-zone-right { width: 320px; flex-shrink: 0; padding-top: 3rem; }
        .sticky-ads { position: sticky; top: 2rem; }

        .hero-section { text-align: center; margin-bottom: 4rem; }
        .main-logo { font-size: 3.5rem; font-weight: 900; letter-spacing: -0.05em; margin-bottom: 1rem; }
        
        .quote-banner { max-width: 600px; margin: 0 auto 3rem; padding: 1rem 2rem; border-radius: 50px; background: rgba(59, 130, 246, 0.05); }
        .quote-label { font-size: 0.6rem; color: var(--primary); font-weight: 800; }
        .quote-text { font-size: 1rem; font-style: italic; opacity: 0.7; margin-top: 0.4rem; }

        .search-container { max-width: 700px; margin: 0 auto; display: flex; gap: 0.5rem; }
        .neural-search-input { flex: 1; padding: 1.2rem 2rem; border-radius: 50px; background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); color: white; }
        .search-btn { padding: 0 2.5rem; border-radius: 50px; background: var(--primary); color: white; border: none; font-weight: bold; cursor: pointer; }

        .prompt-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; }
        .prompt-item { padding: 0; cursor: pointer; overflow: hidden; height: 100%; transition: transform 0.2s; }
        .prompt-item:hover { transform: translateY(-5px); }
        .prompt-img { height: 180px; width: 100%; background-position: center; background-size: cover; }
        .prompt-info { padding: 1.5rem; }
        .prompt-cat { font-size: 0.65rem; color: var(--primary); font-weight: bold; }
        .prompt-title { margin: 0.4rem 0; font-size: 1rem; line-height: 1.4; }

        @media (max-width: 1200px) {
          .ad-zone-right { display: none; }
          .layout-wrapper { padding: 0 1.5rem; }
        }

        .modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.9); backdrop-filter: blur(10px); z-index: 1000; display: flex; justify-content: center; alignItems: center; padding: 2rem; }
        .modal-content { max-width: 800px; width: 100%; max-height: 90vh; overflow-y: auto; background: #050505; }
        .modal-img { width: 100%; max-height: 400px; object-fit: cover; }
        .modal-prompt-text { background: rgba(255,255,255,0.02); padding: 2rem; border-radius: 12px; margin-bottom: 2rem; font-size: 1.1rem; line-height: 1.6; }
        .close-btn { background: none; border: none; color: white; cursor: pointer; font-size: 2.5rem; }
      `}</style>
    </main>
  );
}
