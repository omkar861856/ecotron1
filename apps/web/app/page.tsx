import { useState, useEffect } from 'react';
import AdBanner from './components/AdBanner';
import Auth from './components/Auth';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newPrompt, setNewPrompt] = useState({ title: '', content: '', category: 'Art' });
  
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
    const savedUser = localStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));
    fetchQuote();
    fetchCategories();
    fetchPrompts(1, 'all');
  }, []);

  const handleCreatePrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('https://api.ecotron.co.in/api/prompts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newPrompt, author: user?.email, userId: user?.id }),
      });
      if (res.ok) {
        setShowCreate(false);
        fetchPrompts(1, activeCategory);
      }
    } catch (err) { console.error(err); }
  };

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
      else setPrompts(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const filtered = newPrompts.filter(p => !existingIds.has(p.id));
        return [...prev, ...filtered];
      });
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
    setCopyStatus('Copied!');
    setTimeout(() => setCopyStatus('Copy'), 2000);
  };

  const downloadImage = (url: string, title: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.replace(/\s+/g, '_')}_ecotron.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <main className="premium-theme">
      <title>Ecotron AI | Content-First Prompt Engine</title>
      <div className="mesh-gradient" />
      
      <header className="main-header">
        <div className="nav-container">
          <h1 className="logo" onClick={() => window.location.href='/'} style={{ cursor: 'pointer' }}>
            ECOTRON <span className="accent-text">AI</span>
          </h1>
          <div className="user-actions">
            {user ? (
              <div className="user-profile">
                <span className="user-email-display">{user.email}</span>
                <button className="btn-small logout-btn" onClick={() => { localStorage.removeItem('user'); setUser(null); }}>Logout</button>
              </div>
            ) : (
              <button className="btn-small login-btn" onClick={() => setShowAuth(true)}>Login</button>
            )}
          </div>
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
            <div className="hero-controls">
              <form onSubmit={handleSearch} className="neural-search-box">
                <input 
                  type="text" 
                  placeholder="Find styles..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button type="submit" disabled={loading}>
                  {loading ? 'Searching...' : 'Search'}
                </button>
              </form>
              <button 
                className="create-trigger-btn" 
                onClick={() => user ? setShowCreate(true) : setShowAuth(true)}
              >
                {user ? 'Create Prompt' : 'Login to Create'}
              </button>
            </div>
          </section>

          <nav className="category-scroller">
            <button className={`cat-btn ${activeCategory === 'all' ? 'active' : ''}`} onClick={() => setActiveCategory('all')}>All</button>
            {dynamicCategories.map((cat) => (
              <button 
                key={cat}
                className={`cat-btn ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </nav>

          <section className="library-section">
            <h3 className="sub-title">
              {searchResults ? `Results for "${searchQuery}"` : 'Active Library'}
            </h3>
            
            <div className="bento-grid">
              {(searchResults || prompts).map((p: any, i: number) => (
                <div key={p.id || i} className="bento-card" onClick={() => openPrompt(p)}>
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
          <div className="modal-window prompt-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-scroll-area">
              {selectedPrompt.image_url && (
                <div className="modal-media-container">
                  <img src={selectedPrompt.image_url} className="modal-hero-img" alt="" />
                  <button className="download-floating-btn" onClick={() => downloadImage(selectedPrompt.image_url, selectedPrompt.title)}>
                    Download Reference
                  </button>
                </div>
              )}
              <div className="modal-inner">
                <div className="modal-head">
                  <div>
                    <span className="modal-cat">{selectedPrompt.category}</span>
                    <h2>{selectedPrompt.title}</h2>
                  </div>
                  <button onClick={() => setSelectedPrompt(null)} className="close-x">&times;</button>
                </div>
                
                <div className="modal-scroll-content">
                  <p className="full-prompt-text">{selectedPrompt.content}</p>
                </div>

                <div className="modal-footer-actions">
                  <button className="copy-btn-large" onClick={() => copyToClipboard(selectedPrompt.content)}>
                    {copyStatus === 'Copied!' ? 'Prompt Copied ✅' : 'Copy Full Prompt'}
                  </button>
                  {selectedPrompt.image_url && (
                    <button className="download-btn-secondary" onClick={() => downloadImage(selectedPrompt.image_url, selectedPrompt.title)}>
                      Download Reference
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAuth && (
        <div className="modal-overlay" onClick={() => setShowAuth(false)}>
          <div className="modal-window auth-modal" onClick={e => e.stopPropagation()}>
            <Auth onAuthSuccess={(u) => { setUser(u); setShowAuth(false); }} />
          </div>
        </div>
      )}

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal-window glass create-modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Create New Prompt</h2>
            <form onSubmit={handleCreatePrompt} className="create-form">
              <input 
                className="modal-input" 
                placeholder="Prompt Title" 
                value={newPrompt.title} 
                onChange={e => setNewPrompt({...newPrompt, title: e.target.value})} 
                required 
              />
              <textarea 
                className="modal-input" 
                placeholder="Enter prompt content..." 
                style={{ height: '180px' }}
                value={newPrompt.content} 
                onChange={e => setNewPrompt({...newPrompt, content: e.target.value})} 
                required 
              />
              <select 
                className="modal-input" 
                value={newPrompt.category} 
                onChange={e => setNewPrompt({...newPrompt, category: e.target.value})}
              >
                <option>Art</option>
                <option>Video</option>
                <option>Sci-Fi</option>
                <option>Architecture</option>
                <option>Photography</option>
                <option>Cinema</option>
              </select>
              <button type="submit" className="btn-primary create-submit-btn">Publish Prompt</button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
