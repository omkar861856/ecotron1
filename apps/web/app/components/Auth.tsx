'use client';

import { useState } from 'react';

export default function Auth({ onAuthSuccess }: { onAuthSuccess: (user: any) => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
    try {
      const res = await fetch(`https://api.ecotron.co.in${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('user', JSON.stringify(data.user));
        onAuthSuccess(data.user);
      } else {
        setError(data.message || 'Authentication failed');
      }
    } catch (err) {
      setError('Connection error');
    }
  };

  return (
    <div className="auth-card glass">
      <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
      <form onSubmit={handleSubmit}>
        <input 
          type="email" 
          placeholder="Email" 
          value={email} 
          onChange={e => setEmail(e.target.value)} 
          required 
        />
        <input 
          type="password" 
          placeholder="Password" 
          value={password} 
          onChange={e => setPassword(e.target.value)} 
          required 
        />
        {error && <p className="error-msg">{error}</p>}
        <button type="submit" className="btn-primary">
          {isLogin ? 'Login' : 'Signup'}
        </button>
      </form>
      <button className="switch-btn" onClick={() => setIsLogin(!isLogin)}>
        {isLogin ? "Don't have an account? Signup" : "Already have an account? Login"}
      </button>

      <style jsx>{`
        .auth-card { padding: 2rem; width: 100%; max-width: 400px; border-radius: 24px; text-align: center; }
        h2 { margin-bottom: 2rem; font-weight: 800; }
        form { display: flex; flex-direction: column; gap: 1rem; }
        input { padding: 1rem; border-radius: 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; outline: none; }
        .error-msg { color: #ef4444; font-size: 0.8rem; margin-top: 0.5rem; }
        .switch-btn { background: none; border: none; color: var(--primary); margin-top: 1.5rem; cursor: pointer; font-size: 0.9rem; }
      `}</style>
    </div>
  );
}
