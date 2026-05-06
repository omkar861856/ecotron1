import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [identity, setIdentity] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const u = JSON.parse(savedUser);
      setUser(u);
      fetchIdentity(u.id);
    }
    fetchStats();
    fetchCategories();
    const interval = setInterval(fetchStats, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchIdentity = async (userId: number) => {
    try {
      const res = await fetch(`https://api.ecotron.co.in/api/user/identity/${userId}`);
      const data = await res.json();
      setIdentity(data);
    } catch (err) { console.error(err); }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('https://api.ecotron.co.in/api/admin/stats');
      const data = await res.json();
      setStats(data);
    } catch (err) { console.error(err); }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('https://api.ecotron.co.in/api/categories');
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); }
  };

  return (
    <>
      <button 
        className="sidebar-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle Sidebar"
      >
        {isOpen ? '✕' : '☰'}
      </button>

      <aside className={`main-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-content">
          <nav className="sidebar-nav">
            <Link href="/" className="nav-item" onClick={() => setIsOpen(false)}>
              <span className="icon"></span>
              <span className="label">Home</span>
            </Link>
            <Link href="/blog" className="nav-item" onClick={() => setIsOpen(false)}>
              <span className="icon"></span>
              <span className="label">Blogs</span>
            </Link>

            {user && identity && (
              <>
                <div className="nav-divider">User Identity</div>
                <div className="identity-card glass">
                  <div className="id-signature">{identity.signature_hash}</div>
                  <h4 className="id-title">{identity.persona_title}</h4>
                  <p className="id-desc">{identity.persona_desc}</p>
                  <div className="id-badge">Verified Style DNA</div>
                </div>
              </>
            )}

            <div className="nav-divider">System Stats</div>
            {stats && (
              <div className="sidebar-stats">
                <div className="side-stat">
                  <span>Total Prompts</span>
                  <span className="side-val">{stats.overview.totalPrompts}</span>
                </div>
                <div className="side-stat">
                  <span>AI Visuals</span>
                  <span className="side-val">{stats.overview.totalGens}</span>
                </div>
                <div className="side-stat">
                  <span>Active Hubs</span>
                  <span className="side-val">{categories.length}</span>
                </div>
              </div>
            )}
            
            <div className="nav-divider">Upcoming</div>
            
            <div className="nav-item disabled">
              <span className="icon"></span>
              <span className="label">Ollama Prompt Gen</span>
              <span className="badge">Soon</span>
            </div>
            <div className="nav-item disabled">
              <span className="icon"></span>
              <span className="label">Style Mixer</span>
              <span className="badge">Soon</span>
            </div>
            <div className="nav-item disabled">
              <span className="icon"></span>
              <span className="label">Prompt Analytics</span>
              <span className="badge">Soon</span>
            </div>
          </nav>
        </div>
      </aside>

      <style jsx>{`
        .sidebar-toggle {
          position: fixed;
          top: 1.5rem;
          left: 1.5rem;
          z-index: 1001;
          background: var(--primary);
          border: none;
          color: white;
          width: 48px;
          height: 48px;
          border-radius: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 20px var(--primary-glow);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .sidebar-toggle:hover {
          transform: scale(1.1);
          filter: brightness(1.1);
        }

        .main-sidebar {
          position: fixed;
          top: 0;
          left: -300px;
          width: 300px;
          height: 100vh;
          background: rgba(10, 10, 10, 0.8);
          backdrop-filter: blur(20px);
          border-right: 1px solid rgba(255, 255, 255, 0.05);
          z-index: 1000;
          transition: left 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          padding-top: 5rem;
        }

        .main-sidebar.open {
          left: 0;
        }

        .sidebar-content {
          padding: 2rem;
        }

        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          border-radius: 12px;
          color: rgba(255, 255, 255, 0.7);
          text-decoration: none;
          transition: all 0.2s ease;
          position: relative;
        }

        .nav-item:hover:not(.disabled) {
          background: rgba(255, 255, 255, 0.05);
          color: white;
          padding-left: 1.25rem;
        }

        .nav-item.disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .nav-item .icon {
          font-size: 1.2rem;
        }

        .nav-item .label {
          font-weight: 600;
        }

        .nav-divider {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--primary);
          font-weight: 800;
          margin: 2rem 0 1rem 1rem;
        }

        .identity-card {
          margin: 0 1rem;
          padding: 1.5rem;
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 100%);
          position: relative;
          overflow: hidden;
        }

        .id-signature {
          font-family: monospace;
          font-size: 0.6rem;
          opacity: 0.3;
          letter-spacing: 2px;
          margin-bottom: 1rem;
        }

        .id-title {
          font-size: 1.2rem;
          font-weight: 900;
          margin-bottom: 0.5rem;
          color: white;
          text-transform: uppercase;
        }

        .id-desc {
          font-size: 0.8rem;
          line-height: 1.4;
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 1rem;
        }

        .id-badge {
          display: inline-block;
          font-size: 0.6rem;
          font-weight: 900;
          text-transform: uppercase;
          background: rgba(59, 130, 246, 0.2);
          color: #3b82f6;
          padding: 0.3rem 0.6rem;
          border-radius: 6px;
        }

        .sidebar-stats {
          padding: 0 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .side-stat {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.5);
        }

        .side-val {
          color: white;
          font-weight: 700;
        }

        .badge {
          position: absolute;
          right: 1rem;
          background: rgba(59, 130, 246, 0.2);
          color: var(--primary);
          font-size: 0.6rem;
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
          font-weight: 800;
          text-transform: uppercase;
        }
      `}</style>
    </>
  );
}
