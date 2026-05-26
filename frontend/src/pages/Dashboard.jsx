import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStoredCompany, clearSession } from '../services/api.js';
import { fetchDocuments, removeDocument, uploadDocument } from '../services/document.service.js';
import { fetchConversationDetail, fetchConversations } from '../services/conversation.service.js';
import { fetchSupportRequests, updateSupportRequest } from '../services/supportRequest.service.js';

export default function Dashboard() {
  const navigate = useNavigate();
  const company = getStoredCompany();
  const [activeTab, setActiveTab] = useState('overview');

  // Quick upload state
  const [quickResult, setQuickResult] = useState(null);
  const [mainResult, setMainResult] = useState(null);
  const [quickUploadLoading, setQuickUploadLoading] = useState(false);
  const [mainUploadLoading, setMainUploadLoading] = useState(false);
  const [quickUploadingFileName, setQuickUploadingFileName] = useState('');
  const [mainUploadingFileName, setMainUploadingFileName] = useState('');
  const mainFileRef = useRef(null);
  const [documents, setDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentsError, setDocumentsError] = useState('');
  const [conversationFilter, setConversationFilter] = useState('all');
  const [conversationPage, setConversationPage] = useState(1);
  const [conversations, setConversations] = useState([]);
  const [conversationMeta, setConversationMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [conversationsError, setConversationsError] = useState('');
  const [selectedConversationId, setSelectedConversationId] = useState('');
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [selectedConversationMessages, setSelectedConversationMessages] = useState([]);
  const [selectedConversationLoading, setSelectedConversationLoading] = useState(false);
  const [selectedConversationError, setSelectedConversationError] = useState('');
  const [selectedSupportRequest, setSelectedSupportRequest] = useState(null);
  const [supportRequests, setSupportRequests] = useState([]);
  const [supportRequestsLoading, setSupportRequestsLoading] = useState(false);
  const [supportRequestsError, setSupportRequestsError] = useState('');
  const [supportRequestUpdateLoading, setSupportRequestUpdateLoading] = useState(false);

  function setDashTab(tab, ev) {
    setActiveTab(tab);
  }

  async function handleQuickUpload(input) {
    const file = input.files?.[0] ?? null;
    if (!file) return;
    setQuickUploadLoading(true);
    setQuickUploadingFileName(file.name);
    setQuickResult(null);
    try {
      const result = await uploadDocument(file);
      setQuickResult({ fileName: result.fileName, chunks: result.chunkCount, status: 'Done' });
    } catch (err) {
      setQuickResult({ fileName: file.name, chunks: 0, status: err.message });
    } finally {
      setQuickUploadLoading(false);
      setQuickUploadingFileName('');
    }
  }

  async function handleMainUploadFile(file) {
    if (!file) return;
    setMainUploadLoading(true);
    setMainUploadingFileName(file.name);
    setMainResult(null);
    try {
      const result = await uploadDocument(file);
      setMainResult({ fileName: result.fileName, chunks: result.chunkCount, status: 'Done', storageUrl: result.storageUrl });
    } catch (err) {
      setMainResult({ fileName: file.name, chunks: 0, status: err.message });
    } finally {
      setMainUploadLoading(false);
      setMainUploadingFileName('');
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

  function getWidgetUrl() {
    return `${window.location.origin}/widget/${company?.id || company?.slug || ''}`;
  }

  function getWidgetIframeCode() {
    return [
      '<iframe',
      `  src="${getWidgetUrl()}"`,
      '  width="400"',
      '  height="700"',
      '  style="border:0;border-radius:14px;overflow:hidden"',
      '  loading="lazy"',
      '  allow="clipboard-write"',
      '></iframe>',
    ].join('\n');
  }

  function copyWidgetUrl() {
    navigator.clipboard?.writeText(getWidgetUrl());
  }

  function copyWidgetEmbedCode() {
    navigator.clipboard?.writeText(getWidgetIframeCode());
  }

  function getWidgetScriptCode() {
    return [
      '<script',
      `  src="${window.location.origin}/widget.js"`,
      `  data-company-id="${company?.id || ''}"`,
      '></script>',
    ].join('\n');
  }

  function copyWidgetScriptCode() {
    navigator.clipboard?.writeText(getWidgetScriptCode());
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

  async function loadDocuments() {
    setDocumentsLoading(true);
    setDocumentsError('');

    try {
      const result = await fetchDocuments();
      setDocuments(Array.isArray(result.documents) ? result.documents : []);
    } catch (err) {
      setDocuments([]);
      setDocumentsError(err.message);
    } finally {
      setDocumentsLoading(false);
    }
  }

  async function loadConversations(nextPage = conversationPage, nextFilter = conversationFilter) {
    setConversationsLoading(true);
    setConversationsError('');

    try {
      const result = await fetchConversations({
        status: nextFilter,
        page: nextPage,
        limit: 10,
        escalatedOnly: nextFilter === 'escalated',
      });

      const list = Array.isArray(result.conversations) ? result.conversations : [];
      setConversations(list);
      setConversationMeta(result.meta || { page: nextPage, limit: 10, total: list.length, totalPages: 1 });
      setConversationPage(result.meta?.page ?? nextPage);

      if (list.length > 0) {
        const currentSelectedExists = list.some((conversation) => conversation.conversation_id === selectedConversationId);
        if (!selectedConversationId || !currentSelectedExists) {
          setSelectedConversationId(list[0].conversation_id);
        }
      } else {
        setSelectedConversationId('');
        setSelectedConversation(null);
        setSelectedConversationMessages([]);
        setSelectedSupportRequest(null);
      }
    } catch (err) {
      setConversations([]);
      setConversationsError(err.message);
    } finally {
      setConversationsLoading(false);
    }
  }

  async function loadConversationDetail(conversationId) {
    if (!conversationId) {
      setSelectedConversation(null);
      setSelectedConversationMessages([]);
      return;
    }

    setSelectedConversationLoading(true);
    setSelectedConversationError('');

    try {
      const result = await fetchConversationDetail(conversationId);
      setSelectedConversation(result.conversation || result.summary || null);
      setSelectedConversationMessages(Array.isArray(result.messages) ? result.messages : []);
      setSelectedSupportRequest(result.supportRequest || null);
    } catch (err) {
      setSelectedConversation(null);
      setSelectedConversationMessages([]);
      setSelectedSupportRequest(null);
      setSelectedConversationError(err.message);
    } finally {
      setSelectedConversationLoading(false);
    }
  }

  async function loadSupportRequests() {
    setSupportRequestsLoading(true);
    setSupportRequestsError('');

    try {
      const result = await fetchSupportRequests({ page: 1, limit: 30, status: 'all' });
      setSupportRequests(Array.isArray(result.supportRequests) ? result.supportRequests : []);
    } catch (err) {
      setSupportRequests([]);
      setSupportRequestsError(err.message);
    } finally {
      setSupportRequestsLoading(false);
    }
  }

  useEffect(() => {
    if (activeTab === 'documents') {
      loadDocuments();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'conversations') {
      loadConversations(conversationPage, conversationFilter);
      loadSupportRequests();
    }
  }, [activeTab, conversationFilter, conversationPage]);

  useEffect(() => {
    if (activeTab === 'conversations' && selectedConversationId) {
      loadConversationDetail(selectedConversationId);
    }
  }, [activeTab, selectedConversationId]);

  async function handleDeleteDocument(documentId) {
    try {
      await removeDocument(documentId);
      await loadDocuments();
    } catch (err) {
      setDocumentsError(err.message);
    }
  }

  function formatConversationTime(value) {
    if (!value) return '—';
    return new Date(value).toLocaleString();
  }

  async function handleSupportRequestStatus(status) {
    if (!selectedSupportRequest?.id) return;

    setSupportRequestUpdateLoading(true);
    setSelectedConversationError('');

    try {
      const result = await updateSupportRequest(selectedSupportRequest.id, { status });
      setSelectedSupportRequest(result.supportRequest || null);
      await loadSupportRequests();
      if (selectedConversationId) {
        await loadConversationDetail(selectedConversationId);
      }
    } catch (err) {
      setSelectedConversationError(err.message);
    } finally {
      setSupportRequestUpdateLoading(false);
    }
  }

  function openConversation(conversationId) {
    setSelectedConversationId(conversationId);
  }

  function changeConversationFilter(nextFilter) {
    setConversationFilter(nextFilter);
    setConversationPage(1);
  }

  function changeConversationPage(delta) {
    setConversationPage((current) => {
      const totalPages = conversationMeta.totalPages || 1;
      const next = Math.min(Math.max(1, current + delta), totalPages);
      return next;
    });
  }

  return (
    <div className="page active">
      <nav>
        <a className="nav-logo" onClick={(e) => { e.preventDefault(); navigate('/'); }} href="#">
          <div className="logo-mark logo-mark-image">
            <img className="logo-image" src="/Logo.PNG" alt="SupportBee logo" />
          </div>
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
            <button className={`sidebar-item ${activeTab==='conversations'?'active':''}`} onClick={() => setDashTab('conversations')}>☍ Conversations</button>
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

              <div className="url-card" style={{marginTop: '1rem'}}>
                <div className="url-card-header">
                  <div className="url-card-title">// Embed widget code</div>
                  <div className="tag tag-yellow">v2 iframe</div>
                </div>
                <div className="widget-embed-card-body">
                  <div className="widget-embed-url-row">
                    <div className="url-text" style={{border: '1px solid var(--border)', borderRadius: '8px'}}>{getWidgetUrl()}</div>
                    <button className="url-btn" onClick={copyWidgetUrl}>Copy URL</button>
                  </div>

                  <pre className="widget-embed-code">
{getWidgetIframeCode()}
                  </pre>

                  <div className="widget-embed-actions">
                    <button className="btn btn-outline" onClick={copyWidgetEmbedCode}>Copy iframe code</button>
                    <button className="btn btn-ghost" onClick={() => window.open(getWidgetUrl(), '_blank')}>Open widget</button>
                  </div>

                  <div className="widget-embed-script-block">
                    <div className="widget-embed-script-label">Script launcher</div>
                    <pre className="widget-embed-code">
{getWidgetScriptCode()}
                    </pre>
                    <div className="widget-embed-actions">
                      <button className="btn btn-outline" onClick={copyWidgetScriptCode}>Copy script code</button>
                    </div>
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
                    <div id="quick-upload-zone" className={`upload-zone ${quickUploadLoading ? 'dragging uploading' : ''}`}>
                      <input type="file" accept=".pdf" onChange={(e) => handleQuickUpload(e.target)} />
                      <div className="upload-icon">📄</div>
                      <div className="upload-title">Drop a PDF here</div>
                      <div className="upload-sub">or click to browse</div>
                      <div className="upload-types">Accepts: .pdf — max 50MB</div>

                      {quickUploadLoading ? (
                        <div className="upload-status-card">
                          <div className="upload-status-row">
                            <div className="spinner spinner-light"></div>
                            <div>
                              <div className="upload-status-title">Uploading document…</div>
                              <div className="upload-status-sub">{quickUploadingFileName || 'Processing your PDF'}</div>
                            </div>
                          </div>
                          <div className="upload-progress-track">
                            <div className="upload-progress-bar"></div>
                          </div>
                        </div>
                      ) : null}
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
                    <div className={`upload-zone ${mainUploadLoading ? 'dragging uploading' : ''}`} id="main-upload-zone" onDragOver={(e)=>e.preventDefault()} onDrop={handleDrop} onDragLeave={(e)=>{}}>
                    <input type="file" accept=".pdf" id="main-file-input" ref={mainFileRef} onChange={(e)=>handleMainUpload(e.target)} />
                    <div className="upload-icon">📄</div>
                    <div className="upload-title">Drag & drop your PDF</div>
                    <div className="upload-sub">or click to browse your files</div>
                    <div className="upload-types">Accepted: .pdf · Field name: <code style={{color:'var(--yellow)',fontFamily:'var(--font-mono)'}}>file</code></div>

                      {mainUploadLoading ? (
                        <div className="upload-status-card">
                          <div className="upload-status-row">
                            <div className="spinner spinner-light"></div>
                            <div>
                              <div className="upload-status-title">Uploading document…</div>
                              <div className="upload-status-sub">{mainUploadingFileName || 'Processing your PDF'}</div>
                            </div>
                          </div>
                          <div className="upload-progress-track">
                            <div className="upload-progress-bar"></div>
                          </div>
                        </div>
                      ) : null}
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
              <div className="card" style={{maxWidth:900}}>
                <div className="card-header">
                  <div className="card-title">Document library</div>
                  <div className="tag tag-gray">{documents.length} items</div>
                </div>
                <div className="card-body">
                  {documentsLoading ? <p className="muted-line">Loading documents...</p> : null}
                  {documentsError ? <p className="error-text">{documentsError}</p> : null}
                  {!documentsLoading && !documentsError && documents.length === 0 ? (
                    <div className="docs-placeholder" style={{padding:'2rem 1rem'}}>
                      <div className="docs-placeholder-icon">☰</div>
                      <div className="docs-placeholder-title">No documents uploaded yet</div>
                      <div className="docs-placeholder-sub">Use the Upload tab to add PDFs. Once uploaded, they appear here automatically.</div>
                    </div>
                  ) : null}

                  {documents.length > 0 ? (
                    <div className="docs-grid">
                      {documents.map((doc) => (
                        <article className="doc-card" key={doc.id}>
                          <div className="doc-card-top">
                            <div className="doc-card-pdf">📄</div>
                            <div className="doc-card-info">
                              <div className="doc-card-name">{doc.file_name}</div>
                              <div className="doc-card-date">{doc.created_at ? new Date(doc.created_at).toLocaleString() : ''}</div>
                            </div>
                          </div>
                          <div className="doc-card-body">
                            <div className="doc-card-chunks">
                              <span className="doc-card-chunks-num">{doc.chunkCount ?? 0}</span>
                              chunks indexed
                            </div>
                            <div className="doc-card-embed">
                              <div className="doc-card-embed-fill" style={{ width: `${Math.min((doc.chunkCount ?? 0) * 8, 100)}%` }}></div>
                            </div>
                          </div>
                          <div className="doc-card-footer">
                            <div className="doc-card-status">
                              <div className="status-dot"></div>
                              {doc.status || 'ready'}
                            </div>
                            <div className="doc-card-actions">
                              <button className="doc-action-btn" type="button" onClick={() => navigator.clipboard?.writeText(doc.storage_url || '')} title="Copy storage URL">⎘</button>
                              <button className="doc-action-btn danger" type="button" onClick={() => handleDeleteDocument(doc.id)} title="Delete document">🗑</button>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : null}
                </div>
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

          {activeTab === 'conversations' && (
            <div id="dash-tab-conversations">
              <div className="dash-header">
                <div className="dash-welcome">Human-in-the-loop</div>
                <h1 className="dash-title">Conversations</h1>
                <p className="dash-sub">Review company-scoped support chats, confidence, and escalation state</p>
              </div>

              <div className="card" style={{marginBottom:'1rem'}}>
                <div className="card-header">
                  <div className="card-title">Conversation review panel</div>
                  <div className="tag tag-gray">read-only</div>
                </div>
                <div className="card-body">
                  <div className="conversation-toolbar">
                    <div className="conversation-filter-row">
                      {['all', 'active', 'escalated', 'resolved'].map((filter) => (
                        <button
                          key={filter}
                          type="button"
                          className={`filter-pill ${conversationFilter === filter ? 'active' : ''}`}
                          onClick={() => changeConversationFilter(filter)}
                        >
                          {filter}
                        </button>
                      ))}
                    </div>
                    <div className="conversation-count">
                      {conversationMeta.total || 0} conversations · page {conversationMeta.page || 1} of {conversationMeta.totalPages || 1}
                    </div>
                  </div>

                  {conversationsError ? <p className="error-text">{conversationsError}</p> : null}

                  <div className="conversation-shell">
                    <div className="card">
                      <div className="card-header">
                        <div className="card-title">Conversation list</div>
                        <div className="tag tag-yellow">company scoped</div>
                      </div>
                      <div className="card-body">
                        {conversationsLoading ? <p className="muted-line">Loading conversations...</p> : null}
                        {!conversationsLoading && conversations.length === 0 && !conversationsError ? (
                          <div className="conversation-placeholder">
                            <h3>No conversations yet</h3>
                            <p>When customers send messages, the latest conversations and their confidence signals will appear here.</p>
                          </div>
                        ) : null}

                        <div className="conversation-list">
                          {conversations.map((conversation) => (
                            <button
                              key={conversation.conversation_id}
                              type="button"
                              className={`conversation-item ${selectedConversationId === conversation.conversation_id ? 'active' : ''}`}
                              onClick={() => openConversation(conversation.conversation_id)}
                            >
                              <div className="conversation-item-top">
                                <div>
                                  <div className="conversation-id">{conversation.conversation_id}</div>
                                  <div className="conversation-preview">{conversation.latest_message_preview || 'No messages yet'}</div>
                                </div>
                                <div className={`conversation-status ${conversation.status || 'active'}`}>
                                  <span className="conversation-status-dot"></span>
                                  {conversation.status || 'active'}
                                </div>
                              </div>

                              <div className="conversation-meta-row">
                                <div className="conversation-badges">
                                  <span className="tag tag-gray">{conversation.message_count || 0} messages</span>
                                  {conversation.needs_human ? <span className="tag tag-yellow">escalated</span> : null}
                                  {conversation.support_request_submitted ? <span className="tag tag-yellow">follow-up requested</span> : null}
                                  {conversation.latest_confidence_level ? (
                                    <span className={`confidence-badge ${conversation.latest_confidence_level}`}>
                                      {conversation.latest_confidence_level}
                                    </span>
                                  ) : null}
                                </div>
                                <div className="conversation-meta">Updated {formatConversationTime(conversation.updated_at)}</div>
                              </div>
                            </button>
                          ))}
                        </div>

                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,marginTop:'1rem',flexWrap:'wrap'}}>
                          <button className="btn btn-ghost" type="button" onClick={() => loadConversations(conversationPage, conversationFilter)}>
                            Refresh
                          </button>
                          <div style={{display:'flex',gap:8,alignItems:'center'}}>
                            <button className="btn btn-ghost" type="button" disabled={conversationPage <= 1} onClick={() => changeConversationPage(-1)}>
                              Prev
                            </button>
                            <button className="btn btn-ghost" type="button" disabled={conversationPage >= (conversationMeta.totalPages || 1)} onClick={() => changeConversationPage(1)}>
                              Next
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="card conversation-detail">
                      <div className="card-header">
                        <div className="card-title">Conversation detail</div>
                        <div className="tag tag-gray">review only</div>
                      </div>
                      <div className="card-body">
                        {selectedConversationLoading ? <p className="muted-line">Loading conversation detail...</p> : null}
                        {selectedConversationError ? <p className="error-text">{selectedConversationError}</p> : null}
                        {!selectedConversationLoading && !selectedConversation && !selectedConversationError ? (
                          <div className="conversation-placeholder">
                            <h3>Select a conversation</h3>
                            <p>Pick a conversation on the left to inspect the full message history, confidence score, and escalation state.</p>
                          </div>
                        ) : null}

                        {selectedConversation ? (
                          <>
                            <div className="conversation-detail-header">
                              <div className="conversation-id">{selectedConversation.conversation_id}</div>
                              <div className="conversation-detail-meta">
                                <span className={`confidence-badge ${selectedConversation.latest_confidence_level || 'low'}`}>
                                  confidence {selectedConversation.latest_confidence_level || 'low'}
                                </span>
                                <span className="tag tag-gray">{selectedConversation.message_count || 0} messages</span>
                                <span className={selectedConversation.needs_human ? 'tag tag-yellow' : 'tag tag-gray'}>
                                  {selectedConversation.needs_human ? 'escalated' : 'active'}
                                </span>
                                {selectedConversation.support_request_submitted ? (
                                  <span className="tag tag-yellow">follow-up requested</span>
                                ) : null}
                                <span className="tag tag-gray">Created {formatConversationTime(selectedConversation.created_at)}</span>
                                <span className="tag tag-gray">Updated {formatConversationTime(selectedConversation.updated_at)}</span>
                              </div>
                              <div className="conversation-preview">{selectedConversation.latest_message_preview || 'No recent preview available.'}</div>
                            </div>

                            <div className="support-request-panel">
                              <div className="support-request-panel-head">
                                <div className="card-title">Human follow-up request</div>
                                <div className="tag tag-gray">async workflow</div>
                              </div>
                              {selectedSupportRequest ? (
                                <div className="support-request-content">
                                  <div className="support-request-row"><span>Email</span><strong>{selectedSupportRequest.email || '—'}</strong></div>
                                  <div className="support-request-row"><span>Phone</span><strong>{selectedSupportRequest.phone || '—'}</strong></div>
                                  <div className="support-request-row"><span>Status</span><strong>{selectedSupportRequest.status || 'pending'}</strong></div>
                                  <div className="support-request-row"><span>Created</span><strong>{formatConversationTime(selectedSupportRequest.created_at)}</strong></div>
                                  {selectedSupportRequest.notes ? (
                                    <div className="support-request-notes">{selectedSupportRequest.notes}</div>
                                  ) : null}
                                  <div className="support-request-actions">
                                    <button className="btn btn-ghost" type="button" disabled={supportRequestUpdateLoading} onClick={() => handleSupportRequestStatus('contacted')}>
                                      Mark contacted
                                    </button>
                                    <button className="btn btn-primary" type="button" disabled={supportRequestUpdateLoading} onClick={() => handleSupportRequestStatus('resolved')}>
                                      Mark resolved
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <p className="muted-line">No contact request has been submitted for this conversation yet.</p>
                              )}
                            </div>

                            <div className="conversation-message-list">
                              {selectedConversationMessages.map((message) => (
                                <article key={message.id} className={`conversation-message ${message.role}`}>
                                  <div className="conversation-message-top">
                                    <div className="conversation-message-role">{message.role}</div>
                                    <div className="conversation-message-time">{formatConversationTime(message.created_at)}</div>
                                  </div>
                                  <div className="conversation-message-body">{message.message}</div>
                                  {message.role === 'assistant' && message.confidence_score !== null && message.confidence_score !== undefined ? (
                                    <div className="conversation-message-footer">
                                      <div className={`conversation-message-confidence ${message.confidence_score >= 0.8 ? 'high' : message.confidence_score >= 0.6 ? 'medium' : 'low'}`}>
                                        confidence {Number(message.confidence_score).toFixed(2)}
                                      </div>
                                    </div>
                                  ) : null}
                                </article>
                              ))}
                            </div>

                            <div className="support-request-list-panel">
                              <div className="support-request-panel-head">
                                <div className="card-title">Recent support requests</div>
                                <div className="tag tag-gray">{supportRequests.length} items</div>
                              </div>
                              {supportRequestsLoading ? <p className="muted-line">Loading support requests...</p> : null}
                              {supportRequestsError ? <p className="error-text">{supportRequestsError}</p> : null}
                              {!supportRequestsLoading && !supportRequestsError && supportRequests.length === 0 ? (
                                <p className="muted-line">No follow-up requests received yet.</p>
                              ) : null}
                              {supportRequests.length > 0 ? (
                                <div className="support-request-list">
                                  {supportRequests.slice(0, 8).map((request) => (
                                    <button
                                      key={request.id}
                                      type="button"
                                      className={`support-request-item ${selectedConversationId === request.conversation_id ? 'active' : ''}`}
                                      onClick={() => openConversation(request.conversation_id)}
                                    >
                                      <div className="support-request-item-top">
                                        <span className="support-request-item-status">{request.status}</span>
                                        <span className="support-request-item-date">{formatConversationTime(request.created_at)}</span>
                                      </div>
                                      <div className="support-request-item-contact">{request.email || request.phone || 'Contact not available'}</div>
                                      <div className="support-request-item-conversation">{request.conversation_id}</div>
                                    </button>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
