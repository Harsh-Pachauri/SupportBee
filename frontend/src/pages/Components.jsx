import { Link } from 'react-router-dom';

export default function Components() {
  return (
    <main className="page active">
      <section className="card">
        <p className="eyebrow">Components</p>
        <h1>UI components</h1>
        <p className="hero-copy compact">A living style guide for visual elements used across SupportBee.</p>

        <div style={{display:'flex',gap:12,flexWrap:'wrap',marginTop:12}}>
          <button className="primary-button">Primary</button>
          <button className="secondary-button">Secondary</button>
          <button className="btn btn-ghost">Ghost</button>
          <button className="url-btn">URL</button>
        </div>

        <div style={{marginTop:18}}>
          <div style={{display:'flex',gap:12,alignItems:'center'}}>
            <div className="tag tag-yellow">tag-yellow</div>
            <div className="tag tag-gray">tag-gray</div>
            <div className="tag">tag</div>
          </div>
        </div>

        <div style={{marginTop:18}}>
          <div className="card" style={{maxWidth:640}}>
            <div className="card-header"><div className="card-title">Card</div><div className="tag tag-gray">example</div></div>
            <div className="card-body">
              <p className="muted-line">Card body text — used for informational blocks.</p>
              <div style={{marginTop:12}}>
                <input placeholder="Text input" style={{padding:'0.5rem 0.75rem',width:240,borderRadius:6,border:'1px solid var(--border)'}} />
                <select style={{marginLeft:8,padding:'0.5rem',borderRadius:6}}><option>Option A</option><option>Option B</option></select>
              </div>
            </div>
          </div>
        </div>

        <div style={{marginTop:18}}>
          <Link to="/dashboard" className="secondary-button">Back to Dashboard</Link>
        </div>
      </section>
    </main>
  );
}
