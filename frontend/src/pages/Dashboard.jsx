import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getStoredCompany } from '../services/api.js';
import { uploadDocument } from '../services/document.service.js';

export default function Dashboard() {
  const company = getStoredCompany();
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleUpload(event) {
    event.preventDefault();
    if (!file) return;

    setLoading(true);
    setStatus('');

    try {
      const result = await uploadDocument(file);
      setStatus(`Uploaded ${result.fileName}. Chunks: ${result.chunkCount}.`);
    } catch (err) {
      setStatus(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page-shell">
      <section className="card dashboard-card">
        <p className="eyebrow">Company dashboard</p>
        <h1>{company?.company_name || 'Company'}</h1>
        <p className="hero-copy compact">
          Upload PDFs, track your support page, and keep documents scoped to your tenant.
        </p>

        <div className="info-panel">
          <span>Support URL</span>
          <Link to={`/support/${company?.slug || 'company-slug'}`}>/support/{company?.slug || 'company-slug'}</Link>
        </div>

        <form className="form-grid upload-form" onSubmit={handleUpload}>
          <label>
            PDF document
            <input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>
          <button className="primary-button" type="submit" disabled={loading || !file}>
            {loading ? 'Uploading...' : 'Upload and process'}
          </button>
        </form>

        {status ? <p className="status-line">{status}</p> : null}
      </section>
    </main>
  );
}
