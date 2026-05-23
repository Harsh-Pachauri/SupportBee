import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

  return (
    <main className="page-shell narrow">
      <section className="card form-card">
        <p className="eyebrow">Create company</p>
        <h1>Register your tenant</h1>
        <form onSubmit={handleSubmit} className="form-grid">
          <label>
            Company name
            <input
              value={form.companyName}
              onChange={(e) => {
                const companyName = e.target.value;
                setForm((current) => ({
                  ...current,
                  companyName,
                  slug: current.slug || formatCompanySlug(companyName),
                }));
              }}
              type="text"
              required
            />
          </label>
          <label>
            Slug
            <input value={form.slug} onChange={(e) => setForm({ ...form, slug: formatCompanySlug(e.target.value) })} type="text" required />
          </label>
          <label>
            Email
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} type="email" required />
          </label>
          <label>
            Password
            <input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} type="password" required />
          </label>
          {error ? <p className="error-text">{error}</p> : null}
          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create company'}
          </button>
        </form>
        <p className="muted-line">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </section>
    </main>
  );
}
