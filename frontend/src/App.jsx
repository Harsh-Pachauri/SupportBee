import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import '../src/styles/design.css';
import './styles/chat.css';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Documents from './pages/Documents.jsx';
import PublicSupport from './pages/PublicSupport.jsx';
import WidgetSupport from './pages/WidgetSupport.jsx';
import Components from './pages/Components.jsx';
import Upload from './pages/Upload.jsx';
import { clearSession, getStoredCompany } from './services/api.js';

function TopBar() {
  const company = getStoredCompany();
  const location = useLocation();

  return (
    <header className="topbar" role="banner">
      <a className="nav-logo" href="/" onClick={(e) => { e.preventDefault(); window.location.href = '/'; }}>
        <span className="logo-mark">SB</span>
        <span>SupportBee</span>
      </a>
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
      <Route
        path="/upload"
        element={company ? <><TopBar /><Upload /></> : <Navigate to="/login" replace />}
      />
      <Route
        path="/components"
        element={<><TopBar /><Components /></>}
      />
      <Route path="/support/:companySlug" element={<PublicSupport />} />
      <Route path="/widget/:companyId" element={<WidgetSupport />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
