import { useNavigate } from 'react-router-dom';
import '../styles/design.css';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="page active" id="page-home" style={{paddingTop:64}}>
      <nav>
        <a className="nav-logo" onClick={(e)=>{e.preventDefault(); navigate('/')}} href="#">
          <div className="logo-mark">🐝</div>
          SupportBee
        </a>
        <div className="nav-actions">
          <button className="btn btn-ghost" onClick={() => navigate('/login')}>Sign in</button>
          <button className="btn btn-primary" onClick={() => navigate('/register')}>Get started →</button>
        </div>
      </nav>

      <main>
        <section className="hero">
          <div className="hero-bg">
            <div className="hero-bg-grid"></div>
            <div className="hero-bg-glow"></div>
          </div>

          <div className="hero-badge">
            <div className="badge-dot"></div>
            RAG-POWERED AI SUPPORT
          </div>

          <h1>Your docs.<br/><em>Your AI.</em><br/>Zero friction.</h1>

          <p className="hero-sub">
            Upload your knowledge base. SupportBee builds a private AI assistant that answers your customers — instantly, accurately, 24/7.
          </p>

          <div className="hero-cta">
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/register')}>Start free →</button>
            <button className="btn btn-outline btn-lg" onClick={() => navigate('/login')}>Sign in</button>
          </div>

          <div className="hero-scroll">
            <div className="hero-scroll-label">scroll</div>
            <div className="scroll-line"></div>
          </div>
        </section>

        {/* For brevity, other homepage sections are simplified but use the same classes so CSS matches */}
        <section className="features-strip">
          <div className="features-strip-inner">
            <div className="section-label">// What you get</div>
            <h2 className="section-title">Everything a support team<br/>needs, minus the team.</h2>
            <div className="features-grid">
              <div className="feature-card"><div className="feature-icon">📄</div><h3>PDF Knowledge Base</h3><p>Upload any PDF — manuals, policies, FAQs. SupportBee extracts, chunks, and embeds your content automatically.</p></div>
              <div className="feature-card"><div className="feature-icon">🧠</div><h3>RAG-Powered Answers</h3><p>Vector similarity search retrieves the most relevant context before every response. No hallucinations, just your docs.</p></div>
              <div className="feature-card"><div className="feature-icon">💬</div><h3>Conversational Memory</h3><p>Session-scoped conversation history gives every visitor a coherent, contextual chat — without logging in.</p></div>
              <div className="feature-card"><div className="feature-icon">🔗</div><h3>Public Support URL</h3><p>Every company gets a unique <code style={{fontFamily:'var(--font-mono)',fontSize:'0.8em',color:'var(--yellow)'}}>/support/:slug</code> URL. Share it anywhere.</p></div>
              <div className="feature-card"><div className="feature-icon">🔒</div><h3>Multi-Tenant Isolation</h3><p>JWT auth + company-scoped data. Your documents, conversations, and settings never bleed across tenants.</p></div>
              <div className="feature-card"><div className="feature-icon">⚡</div><h3>Groq / Gemini LLM</h3><p>Plug in your preferred LLM provider. Llama 3 via Groq or Gemini Flash — fast, cheap, production-ready.</p></div>
            </div>
          </div>
        </section>

        <section className="how-section">
          <div className="section-label">// How it works</div>
          <h2 className="section-title">Live in three steps.</h2>
          <div className="steps-list">
            <div className="step"><div className="step-num">01</div><div className="step-body"><h3>Register your company</h3><p>Create an account with your company name, choose a unique slug, and get a JWT session instantly. No credit card required.</p></div></div>
            <div className="step"><div className="step-num">02</div><div className="step-body"><h3>Upload your knowledge base</h3><p>Drop any PDF into your dashboard. SupportBee extracts text, chunks it into semantic pieces, generates embeddings, and stores them in pgvector — in seconds.</p></div></div>
            <div className="step"><div className="step-num">03</div><div className="step-body"><h3>Share your support URL</h3><p>Copy your public <code style={{fontFamily:'var(--font-mono)',fontSize:'0.85em',color:'var(--yellow)'}}>/support/your-slug</code> URL and embed it anywhere. Customers get AI-powered answers around the clock.</p></div></div>
          </div>
        </section>

        <section className="cta-section">
          <h2>Ready to deploy your<br/><span style={{color:'var(--yellow)'}}>AI support agent?</span></h2>
          <p>It takes under two minutes to go from sign-up to a live public support page.</p>
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/register')}>Create your account →</button>
        </section>

        <footer>
          <div className="nav-logo" style={{fontSize:'0.9rem',cursor:'default'}}>
            <div className="logo-mark" style={{width:24,height:24,fontSize:13}}>🐝</div>
            SupportBee
          </div>
          <div>Built on pgvector · RAG · LLM · JWT</div>
        </footer>
      </main>
    </div>
  );
}
