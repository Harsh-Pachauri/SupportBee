import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStoredCompany, clearSession } from '../services/api.js';
import { uploadDocument } from '../services/document.service.js';

export default function Dashboard() {
  const navigate = useNavigate();
  const company = getStoredCompany();
  const [activeTab, setActiveTab] = useState('overview');

  // Quick upload state
  const [quickResult, setQuickResult] = useState(null);
  const [mainResult, setMainResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const mainFileRef = useRef(null);

  function setDashTab(tab, ev) {
    setActiveTab(tab);
  }

  async function handleQuickUpload(input) {
    const file = input.files?.[0] ?? null;
    if (!file) return;
    setLoading(true);
    setQuickResult(null);
    try {
      const result = await uploadDocument(file);
      setQuickResult({ fileName: result.fileName, chunks: result.chunkCount, status: 'Done' });
    } catch (err) {
      setQuickResult({ fileName: file.name, chunks: 0, status: err.message });
    } finally {
      setLoading(false);
    }
  }

  async function handleMainUploadFile(file) {
    if (!file) return;
    setLoading(true);
    setMainResult(null);
    try {
      const result = await uploadDocument(file);
      setMainResult({ fileName: result.fileName, chunks: result.chunkCount, status: 'Done', storageUrl: result.storageUrl });
    } catch (err) {
      setMainResult({ fileName: file.name, chunks: 0, status: err.message });
    } finally {
      setLoading(false);
    }
  }

  function handleMainUpload(input) {
    const file = input.files?.[0] ?? null;
    if (!file) return;
    handleMainUploadFile(file);
  }

  function handleDrop(ev) {
    ev.preventDefault();
    const file = ev.dataTransfer.files?.[0];
    if (file) handleMainUploadFile(file);
  }

  function copyUrl() {
    const url = `${window.location.origin}/support/${company?.slug || ''}`;
    navigator.clipboard?.writeText(url);
  }

  function openSupportPage() {
    const url = `/support/${company?.slug || ''}`;
    window.open(url, '_blank');
  }

  function copySlug() {
    navigator.clipboard?.writeText(company?.slug || '');
  }

  function copyId() {
    navigator.clipboard?.writeText(company?.id || '');
  }

  function handleLogout() {
    clearSession();
    navigate('/login');
  }

  return (
    <div className="page active">
      <nav>
        <a className="nav-logo" onClick={(e) => { e.preventDefault(); navigate('/'); }} href="#">
          <div className="logo-mark">🐝</div>
          SupportBee
        </a>
        <div className="nav-actions">
          <span className="tag tag-yellow" id="nav-company-name">{company?.company_name || 'Company'}</span>
          <button className="btn btn-ghost" onClick={handleLogout}>Sign out</button>
        </div>
      </nav>

      <div className="dashboard-layout">
        <aside className="sidebar">
          <div className="sidebar-section">
            <div className="sidebar-label">Main</div>
            <button className={`sidebar-item ${activeTab==='overview'?'active':''}`} onClick={() => setDashTab('overview')}>▦ Overview</button>
            <button className={`sidebar-item ${activeTab==='upload'?'active':''}`} onClick={() => setDashTab('upload')}>↑ Upload docs</button>
            <button className={`sidebar-item ${activeTab==='documents'?'active':''}`} onClick={() => setDashTab('documents')}>☰ Documents</button>
          </div>
          <div className="sidebar-section">
            <div className="sidebar-label">Support</div>
            <button className="sidebar-item" onClick={() => setDashTab('chat')}>◉ Test chat</button>
            <button className="sidebar-item" onClick={openSupportPage}>↗ Public page</button>
          </div>
          <div className="sidebar-bottom">
            <div className="user-pill">
              <div className="user-avatar">{(company?.company_name||'').split(' ').map(s=>s[0]).slice(0,2).join('').toUpperCase()}</div>
              <div className="user-info">
                <div className="user-name">{company?.company_name || 'Company'}</div>
                <div className="user-role">admin</div>
              </div>
            </div>
          </div>
        </aside>

        <main className="dash-main">
          {activeTab === 'overview' && (
            <div id="dash-tab-overview">
              <div className="dash-header">
                <div className="dash-welcome">Good day, <span id="dash-company-name">{company?.company_name}</span></div>
                <h1 className="dash-title">Dashboard</h1>
                <p className="dash-sub">Your AI support platform overview</p>
              </div>

              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-label">Documents</div>
                  <div className="stat-val yellow">{company?.documentCount ?? 0}</div>
                  <div className="stat-delta">PDFs processed</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Chunks indexed</div>
                  <div className="stat-val">—</div>
                  <div className="stat-delta">pgvector embeddings</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Support URL</div>
                  <div className="stat-val" style={{fontSize:'1.2rem',marginTop:4}}><span className="tag tag-yellow">live</span></div>
                  <div className="stat-delta">Public · No auth needed</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">LLM Provider</div>
                  <div className="stat-val" style={{fontSize:'1.2rem',marginTop:4}}>Groq</div>
                  <div className="stat-delta">llama-3.1-8b-instant</div>
                </div>
              </div>

              <div className="url-card">
                <div className="url-card-header">
                  <div className="url-card-title">// Your public support URL</div>
                  <div className="status-badge"><div className="status-dot"></div> Live</div>
                </div>
                <div className="url-display">
                  <div className="url-text" id="dash-url">{window.location.origin}/support/{company?.slug}</div>
                  <div className="url-actions">
                    <button className="url-btn" onClick={copyUrl}>⎘ Copy</button>
                    <button className="url-btn" onClick={openSupportPage}>↗ Open</button>
                  </div>
                </div>
              </div>

              <div className="dash-grid">
                <div className="card">
                  <div className="card-header">
                    <div className="card-title">Company info</div>
                    <div className="tag tag-gray">JWT session</div>
                  </div>
                  <div className="card-body">
                    <div className="info-row">
                      <div className="info-item">
                        <div className="info-key">Company name</div>
                        <div className="info-val" id="info-company-name">{company?.company_name}</div>
                      </div>
                      <div className="info-item">
                        <div className="info-key">Slug</div>
                        <div className="copy-row">
                          <div className="copy-val" id="info-slug">{company?.slug}</div>
                          <button className="copy-btn-sm" onClick={copySlug}>copy</button>
                        </div>
                      </div>
                      <div className="info-item">
                        <div className="info-key">Email</div>
                        <div className="info-val" id="info-email">{company?.email}</div>
                      </div>
                      <div className="info-item">
                        <div className="info-key">Company ID</div>
                        <div className="copy-row">
                          <div className="copy-val mono" id="info-id">{company?.id}</div>
                          <button className="copy-btn-sm" onClick={copyId}>copy</button>
                        </div>
                      </div>
                      <div className="info-item">
                        <div className="info-key">Member since</div>
                        <div className="info-val" id="info-created">{company?.created_at ? new Date(company.created_at).toDateString() : ''}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <div className="card-title">Quick upload</div>
                    <div className="tag tag-yellow">PDF only</div>
                  </div>
                  <div className="card-body">
                    <div id="quick-upload-zone" className={`upload-zone ${loading? 'dragging':''}`}>
                      <input type="file" accept=".pdf" onChange={(e) => handleQuickUpload(e.target)} />
                      <div className="upload-icon">📄</div>
                      <div className="upload-title">Drop a PDF here</div>
                      <div className="upload-sub">or click to browse</div>
                      <div className="upload-types">Accepts: .pdf — max 50MB</div>
                    </div>
                    <div className={`upload-result ${quickResult ? 'visible' : ''}`}>
                      <div className="result-row"><div className="result-label">File</div><div className="result-val" id="qr-filename">{quickResult?.fileName ?? '—'}</div></div>
                      <div className="result-row"><div className="result-label">Chunks indexed</div><div className="result-val green" id="qr-chunks">{quickResult?.chunks ?? '—'}</div></div>
                      <div className="result-row"><div className="result-label">Status</div><div className="result-val green" id="qr-status">{quickResult?.status ?? '—'}</div></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'upload' && (
            <div id="dash-tab-upload">
              <div className="dash-header">
                <div className="dash-welcome">Knowledge base</div>
                <h1 className="dash-title">Upload Documents</h1>
                <p className="dash-sub">PDF files are chunked, embedded, and indexed into pgvector</p>
              </div>

              <div className="card" style={{maxWidth:640}}>
                <div className="card-header">
                  <div className="card-title">PDF Upload</div>
                  <div className="tag tag-yellow">multipart/form-data · field: file</div>
                </div>
                <div className="card-body">
                  <div className="upload-zone" id="main-upload-zone" onDragOver={(e)=>e.preventDefault()} onDrop={handleDrop} onDragLeave={(e)=>{}}>
                    <input type="file" accept=".pdf" id="main-file-input" ref={mainFileRef} onChange={(e)=>handleMainUpload(e.target)} />
                    <div className="upload-icon">📄</div>
                    <div className="upload-title">Drag & drop your PDF</div>
                    <div className="upload-sub">or click to browse your files</div>
                    <div className="upload-types">Accepted: .pdf · Field name: <code style={{color:'var(--yellow)',fontFamily:'var(--font-mono)'}}>file</code></div>
                  </div>

                  <div className={`upload-result ${mainResult ? 'visible' : ''}`} style={{marginTop:'1.25rem'}}>
                    <div className="result-row"><div className="result-label">File name</div><div className="result-val" id="mr-filename">{mainResult?.fileName ?? '—'}</div></div>
                    <div className="result-row"><div className="result-label">Chunks saved</div><div className="result-val green" id="mr-chunks">{mainResult?.chunks ?? '—'}</div></div>
                    <div className="result-row"><div className="result-label">Storage URL</div><div className="result-val" id="mr-storage" style={{fontFamily:'var(--font-mono)',fontSize:'0.78rem',color:'var(--gray-3)',maxWidth:260,overflow:'hidden',textOverflow:'ellipsis'}}>{mainResult?.storageUrl ?? '—'}</div></div>
                    <div className="result-row"><div className="result-label">Status</div><div className="result-val green" id="mr-status">{mainResult?.status ?? '—'}</div></div>
                  </div>
                </div>
              </div>

              <div style={{marginTop:'1.5rem',padding:'1rem 1.25rem',background:'var(--black-2)',border:'1px solid var(--border)',borderRadius:'var(--radius)',fontSize:'0.8rem',color:'var(--gray-4)',fontFamily:'var(--font-mono)',maxWidth:640}}>
                <span style={{color:'var(--yellow)'}}>POST</span> /api/documents/upload &nbsp;·&nbsp; Authorization: Bearer &lt;token&gt; &nbsp;·&nbsp; Content-Type: multipart/form-data
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div id="dash-tab-documents">
              <div className="dash-header">
                <div className="dash-welcome">Knowledge base</div>
                <h1 className="dash-title">Documents</h1>
                <p className="dash-sub">Manage your uploaded knowledge base</p>
              </div>
              <div className="card" style={{maxWidth:640}}>
                <div className="card-header"><div className="card-title">Document library</div><div className="tag tag-gray">coming soon</div></div>
                <div className="docs-placeholder"><div className="docs-placeholder-icon">☰</div><div className="docs-placeholder-title">Document listing not yet implemented</div><div className="docs-placeholder-sub">GET /api/documents and DELETE /api/documents/:id currently return 501. Use the Upload tab to add documents.</div><div className="docs-coming-badge">501 · NOT IMPLEMENTED</div></div>
              </div>
            </div>
          )}

          {activeTab === 'chat' && (
            <div id="dash-tab-chat">
              <div className="dash-header"><div className="dash-welcome">Internal test</div><h1 className="dash-title">Test Chat</h1><p className="dash-sub">Send messages to the authenticated chat endpoint</p></div>
              <div className="card" style={{maxWidth:640}}>
                <div className="card-header"><div className="card-title">POST /api/chat</div><div className="tag tag-yellow">authenticated</div></div>
                <div style={{height:340,overflowY:'auto',padding:'1.25rem',display:'flex',flexDirection:'column',gap:12}} id="chat-messages">
                  <div style={{textAlign:'center',fontSize:'0.78rem',color:'var(--gray-5)',fontFamily:'var(--font-mono)',padding:'2rem 0'}}>Start a conversation — ask anything about your uploaded documents</div>
                </div>
                <div style={{borderTop:'1px solid var(--border)',padding:'1rem 1.25rem',display:'flex',gap:10}}>
                  <input type="text" id="chat-input" placeholder="Ask about your documents…" style={{flex:1}} onKeyDown={(e)=>{ if(e.key==='Enter'){ /* sendChat placeholder */ } }} />
                  <button className="btn btn-primary" id="chat-send-btn">Send</button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
