import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import './App.css';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Documents from './pages/Documents.jsx';
import PublicSupport from './pages/PublicSupport.jsx';
import { clearSession, getStoredCompany } from './services/api.js';

function Landing() {
  return (
    <main className="app-shell">
      <section className="hero-card">
        <p className="eyebrow">SupportBee</p>
        <h1>Multi-tenant AI support, built as a V1 SaaS.</h1>
        <p className="hero-copy">
          Companies upload PDFs, the backend processes them into company-scoped chunks,
          and customers use a public support page for grounded answers.
        </p>

        <div className="hero-actions">
          <Link className="primary-button" to="/register">Create company</Link>
          <Link className="secondary-button" to="/login">Sign in</Link>
        </div>
      </section>
    </main>
  );
}

function TopBar() {
  const company = getStoredCompany();
  const location = useLocation();

  return (
    <header className="topbar">
      <div>
        <strong>SupportBee</strong>
        <span>V1 backend-first build</span>
      </div>
      <nav>
        <Link to="/dashboard" className={location.pathname === '/dashboard' ? 'active' : ''}>Dashboard</Link>
        <Link to="/documents" className={location.pathname === '/documents' ? 'active' : ''}>Documents</Link>
        <Link to="/login">Login</Link>
        <button
          type="button"
          className="ghost-button"
          onClick={() => {
            clearSession();
            window.location.href = '/';
          }}
        >
          Logout{company?.company_name ? ` (${company.company_name})` : ''}
        </button>
      </nav>
    </header>
  );
}

function App() {
  const company = getStoredCompany();

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/dashboard"
        element={company ? <><TopBar /><Dashboard /></> : <Navigate to="/login" replace />}
      />
      <Route
        path="/documents"
        element={company ? <><TopBar /><Documents /></> : <Navigate to="/login" replace />}
      />
      <Route path="/support/:companySlug" element={<PublicSupport />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
