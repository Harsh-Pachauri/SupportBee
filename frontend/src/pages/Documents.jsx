import { Link } from 'react-router-dom';

export default function Documents() {
  return (
    <main className="page-shell narrow">
      <section className="card">
        <p className="eyebrow">Documents</p>
        <h1>Document management</h1>
        <p className="hero-copy compact">
          V1 keeps this page intentionally simple. Uploads happen from the dashboard, and the backend handles storage plus ingestion.
        </p>
        <Link className="secondary-button" to="/dashboard">Go back to dashboard</Link>
      </section>
    </main>
  );
}
