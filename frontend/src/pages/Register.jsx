import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerCompany } from '../services/auth.service.js';
import { storeSession } from '../services/api.js';
import { formatCompanySlug } from '../utils/formatCompanySlug.js';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ companyName: '', slug: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await registerCompany(form);
      storeSession(result);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function onCompanyNameInput(val) {
    if (!val) return;
    if (!form.slug) {
      setForm((c) => ({ ...c, companyName: val, slug: formatCompanySlug(val) }));
    } else {
      setForm((c) => ({ ...c, companyName: val }));
    }
  }

  return (
    <div className="page active" id="page-register" style={{paddingTop:64}}>
      <nav>
        <a className="nav-logo" onClick={(e)=>{e.preventDefault(); navigate('/')}} href="#">
          <div className="logo-mark">🐝</div>
          SupportBee
        </a>
        <div className="nav-actions">
          <button className="btn btn-ghost" onClick={() => navigate('/login')}>Already a member? Sign in</button>
        </div>
      </nav>

      <div className="auth-page" style={{paddingTop:64,flex:1}}>
        <div className="auth-side">
          <div className="auth-side-bg"></div>
          <div className="auth-side-glow"></div>
          <div className="auth-side-content">
            <div className="nav-logo" style={{marginBottom:'2.5rem',cursor:'default'}}>
              <div className="logo-mark">🐝</div>
              SupportBee
            </div>
            <div className="auth-side-quote">From zero to live<br/><em>AI support in <span style={{fontStyle:'normal'}}>under 2 minutes.</span></em></div>
          </div>
          <div className="auth-side-content">
            <div className="auth-side-features">
              <div className="auth-feature"><div className="auth-feature-dot"></div><span>Unique public support URL per company</span></div>
              <div className="auth-feature"><div className="auth-feature-dot"></div><span>Auto-generated slug from company name</span></div>
              <div className="auth-feature"><div className="auth-feature-dot"></div><span>Instant JWT session on register</span></div>
              <div className="auth-feature"><div className="auth-feature-dot"></div><span>Fully isolated multi-tenant data</span></div>
            </div>
          </div>
        </div>

        <div className="auth-main">
          <div className="auth-form-wrap">
            <div className="auth-header">
              <button className="auth-back" onClick={() => navigate('/')}> <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M8 10L4 6L8 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> BACK TO HOME</button>
              <h1 className="auth-title">Create your company</h1>
              <p className="auth-sub">Already have an account? <span className="link" onClick={() => navigate('/login')}>Sign in →</span></p>
            </div>

            <div id="register-alert" style={{display:'none',marginBottom:'1.25rem'}}></div>

            <form className="form" onSubmit={handleSubmit}>
              <div className="field">
                <label htmlFor="reg-name">Company name</label>
                <input id="reg-name" type="text" value={form.companyName} onChange={(e) => onCompanyNameInput(e.target.value)} autoComplete="organization" />
              </div>

              <div className="field">
                <label htmlFor="reg-slug">Company slug <span className="slug-auto-badge">auto</span></label>
                <div className="slug-preview">
                  <span className="slug-prefix">/support/</span>
                  <input id="reg-slug" type="text" value={form.slug} onChange={(e) => setForm((c)=>({...c, slug: formatCompanySlug(e.target.value)}))} />
                </div>
                <div className="input-hint">Your public support URL will use this slug</div>
              </div>

              <div className="field">
                <label htmlFor="reg-email">Email</label>
                <input id="reg-email" type="email" value={form.email} onChange={(e) => setForm((c)=>({...c, email: e.target.value}))} />
              </div>

              <div className="field">
                <label htmlFor="reg-password">Password</label>
                <input id="reg-password" type="password" value={form.password} onChange={(e) => setForm((c)=>({...c, password: e.target.value}))} />
                <div className="input-hint">Min. 8 characters</div>
              </div>

              {error ? <div className="alert alert-error" style={{marginBottom:'1rem'}}>{error}</div> : null}

              <button className="btn btn-primary btn-full btn-lg" id="registerBtn" type="submit" disabled={loading}>{loading ? <div className="spinner"></div> : 'Create company →'}</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
