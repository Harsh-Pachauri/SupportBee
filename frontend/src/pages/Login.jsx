import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginCompany } from '../services/auth.service.js';
import { storeSession } from '../services/api.js';

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await loginCompany(form);
      storeSession(result);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page active" id="page-login" style={{ paddingTop: 64 }}>
      <nav>
        <a className="nav-logo" onClick={(e) => { e.preventDefault(); navigate('/'); }} href="#">
          <div className="logo-mark">🐝</div>
          SupportBee
        </a>
        <div className="nav-actions">
          <button className="btn btn-ghost" onClick={() => navigate('/register')}>No account? Register →</button>
        </div>
      </nav>

      <div className="auth-page" style={{ paddingTop: 64, flex: 1 }}>
        <div className="auth-side">
          <div className="auth-side-bg"></div>
          <div className="auth-side-glow"></div>
          <div className="auth-side-content">
            <div className="nav-logo" style={{ marginBottom: '2.5rem', cursor: 'default' }}>
              <div className="logo-mark">🐝</div>
              SupportBee
            </div>
            <div className="auth-side-quote">Your AI support agent is<br /><em>one login away.</em></div>
          </div>
          <div className="auth-side-content">
            <div className="auth-side-features">
              <div className="auth-feature"><div className="auth-feature-dot"></div><span>Company-scoped JWT session</span></div>
              <div className="auth-feature"><div className="auth-feature-dot"></div><span>Persistent across tabs via localStorage</span></div>
              <div className="auth-feature"><div className="auth-feature-dot"></div><span>Secure Bearer token auth</span></div>
              <div className="auth-feature"><div className="auth-feature-dot"></div><span>Auto-restore on page refresh</span></div>
            </div>
          </div>
        </div>

        <div className="auth-main">
          <div className="auth-form-wrap">
            <div className="auth-header">
              <button className="auth-back" onClick={() => navigate('/')}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M8 10L4 6L8 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                BACK TO HOME
              </button>
              <h1 className="auth-title">Welcome back</h1>
              <p className="auth-sub">Don't have an account? <span className="link" onClick={() => navigate('/register')}>Create one →</span></p>
            </div>

            <div id="login-alert" style={{ display: 'none', marginBottom: '1.25rem' }}></div>

            {/* Using markup from login.html to match design exactly; use button onclick for sign-in to preserve layout */}
            <div className="form" id="loginForm">
              <div className="field">
                <label htmlFor="login-email">Email</label>
                <input id="login-email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} type="email" placeholder="admin@yourcompany.com" autoComplete="email" />
              </div>
              <div className="field">
                <label htmlFor="login-password">Password</label>
                <input id="login-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} type="password" placeholder="••••••••" autoComplete="current-password" />
              </div>

              {error ? <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div> : null}

              <button className="btn btn-primary btn-full btn-lg" id="loginBtn" onClick={handleSubmit} disabled={loading}>
                {loading ? <div className="spinner"></div> : 'Sign in'}
              </button>

              <div className="form-divider">or</div>

              <button className="btn btn-ghost btn-full" onClick={() => { setForm({ email: 'admin@acme.com', password: 'password123' }); }}>
                Fill demo credentials
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
