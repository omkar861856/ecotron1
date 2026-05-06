'use client';

import { useState, useEffect } from 'react';
import AdBanner from './components/AdBanner';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState('');
  
  const [prompts, setPrompts] = useState<any[]>([]);
  const [dynamicCategories, setDynamicCategories] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedPrompt, setSelectedPrompt] = useState<any>(null);
  const [copyStatus, setCopyStatus] = useState('Copy');

  useEffect(() => {
    fetchQuote();
    fetchCategories();
    fetchPrompts(1, 'all');
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

  const fetchCategories = async () => {
    try {
      const res = await fetch('https://api.ecotron.co.in/api/categories');
      const data = await res.json();
      setDynamicCategories(Array.isArray(data) ? data : []);
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
    } catch (err) { setSearchResults([]); }
    setLoading(false);
  };

  const openPrompt = (p: any) => {
    setSelectedPrompt(p);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopyStatus('Copied! ✅');
    setTimeout(() => setCopyStatus('Copy'), 2000);
  };

  return (
    <main className="premium-theme">
      <title>Ecotron AI | Content-First Prompt Engine</title>
      <div className="mesh-gradient" />
      
      <header className="main-header">
        <div className="nav-container">
          <h1 className="logo">ECOTRON <span className="accent-text">AI</span></h1>
        </div>
      </header>

      <div className="header-ad-below">
        <AdBanner height={90} width={728} adKey="c25ecd0c0fe9d93f6cf66f0016cbd198" />
      </div>

      <div className="layout-root">
        <div className="main-content">
          <section className="hero-section">
            <div className="quote-badge">
              <span className="pulse"></span> {quote}
            </div>
            <h2 className="hero-title">Discover. Create. Evolve.</h2>
            <form onSubmit={handleSearch} className="neural-search-box">
              <input 
                type="text" 
                placeholder="Find Seedance 2.0 or Nano Banana styles..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" disabled={loading}>
                {loading ? 'Searching...' : 'Search'}
              </button>
            </form>
          </section>

          <nav className="category-scroller">
            <button className={`cat-btn ${activeCategory === 'all' ? 'active' : ''}`} onClick={() => setActiveCategory('all')}>✨ All</button>
            {dynamicCategories.map((cat) => (
              <button 
                key={cat}
                className={`cat-btn ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat === 'Video' ? '🎬' : '💎'} {cat}
              </button>
            ))}
          </nav>

          <section className="library-section">
            <h3 className="sub-title">
              {searchResults ? `Results for "${searchQuery}"` : 'Active Library'}
            </h3>
            
            <div className="bento-grid">
              {(searchResults || prompts).map((p: any, i: number) => (
                <div key={i} className="bento-card" onClick={() => openPrompt(p)}>
                  {p.image_url && <div className="card-media" style={{ backgroundImage: `url(${p.image_url})` }} />}
                  <div className="card-body">
                    <span className="card-cat">{p.category?.toUpperCase()}</span>
                    <h4 className="card-title">{p.title}</h4>
                    <p className="card-prompt">{p.content}</p>
                  </div>
                </div>
              ))}
            </div>

            {!searchResults && prompts.length > 0 && (
              <button className="load-more-btn" onClick={() => { setPage(page + 1); fetchPrompts(page + 1, activeCategory); }}>
                LOAD MORE
              </button>
            )}
          </section>
        </div>

        <aside className="right-rail">
          <div className="sticky-rail">
            <AdBanner height={250} width={300} adKey="eca2cd8a7fd561c8d9ddc9b4e1302ac9" />
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
          <div className="modal-window" onClick={e => e.stopPropagation()}>
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
    </main>
  );
}
