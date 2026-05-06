'use client';

import Link from 'next/link';

const BLOG_POSTS = [
  {
    id: 1,
    title: "Mastering Seedance 2.0: The Ultimate Guide",
    excerpt: "Learn how to craft perfect cinematic prompts for the latest Seedance 2.0 model...",
    date: "May 5, 2026",
    category: "Tutorial"
  },
  {
    id: 2,
    title: "Nano Banana vs. Imagen-3: Which is Better?",
    excerpt: "A deep dive into the technical differences between these two powerhouse image generators...",
    date: "May 4, 2026",
    category: "Comparison"
  },
  {
    id: 3,
    title: "The Art of Negative Prompting",
    excerpt: "How to use negative constraints to refine your AI visuals and remove artifacts...",
    date: "May 3, 2026",
    category: "Pro Tips"
  }
];

export default function BlogPage() {
  return (
    <main className="premium-theme">
      <div className="mesh-gradient" />
      
      <header className="main-header">
        <div className="nav-container">
          <Link href="/" className="logo">ECOTRON <span className="accent-text">AI</span></Link>
          <span className="page-title">Prompting Blog</span>
        </div>
      </header>

      <div className="container">
        <section className="hero-section">
          <h1 className="hero-title">Insights from the <span className="accent-text">Frontier</span></h1>
          <p className="subtitle">Expert guides, technical deep-dives, and prompting secrets.</p>
        </section>

        <div className="blog-grid">
          {BLOG_POSTS.map(post => (
            <article key={post.id} className="glass-card blog-card">
              <div className="blog-meta">
                <span className="blog-cat">{post.category}</span>
                <span className="blog-date">{post.date}</span>
              </div>
              <h2 className="blog-title">{post.title}</h2>
              <p className="blog-excerpt">{post.excerpt}</p>
              <button className="read-more">Read Full Post →</button>
            </article>
          ))}
        </div>
      </div>

      <style jsx>{`
        .container { max-width: 1200px; margin: 0 auto; padding: 4rem 2rem; }
        .page-title { font-weight: 800; font-size: 1.2rem; opacity: 0.5; }
        
        .blog-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 2rem; }
        .blog-card { display: flex; flex-direction: column; gap: 1rem; }
        
        .blog-meta { display: flex; justify-content: space-between; align-items: center; }
        .blog-cat { font-size: 0.7rem; font-weight: 900; color: var(--primary); text-transform: uppercase; letter-spacing: 0.1em; }
        .blog-date { font-size: 0.8rem; opacity: 0.4; }
        
        .blog-title { font-size: 1.8rem; font-weight: 800; line-height: 1.2; }
        .blog-excerpt { font-size: 1rem; opacity: 0.6; line-height: 1.6; }
        
        .read-more { background: none; border: none; color: var(--primary); font-weight: 800; cursor: pointer; padding: 0; text-align: left; margin-top: auto; }
        .read-more:hover { text-decoration: underline; }
      `}</style>
    </main>
  );
}
