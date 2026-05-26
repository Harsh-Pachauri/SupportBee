import { useState, useRef } from 'react';
import { uploadDocument } from '../services/document.service.js';
import { useNavigate } from 'react-router-dom';

export default function Upload() {
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadingFileName, setUploadingFileName] = useState('');
  const fileRef = useRef(null);

  async function handleFile(file) {
    if (!file) return;
    setLoading(true);
    setUploadingFileName(file.name);
    setResult(null);
    try {
      const res = await uploadDocument(file);
      setResult({ fileName: res.fileName, chunks: res.chunkCount, storageUrl: res.storageUrl, status: 'Done' });
    } catch (err) {
      setResult({ fileName: file.name, chunks: 0, status: err.message });
    } finally {
      setLoading(false);
      setUploadingFileName('');
    }
  }

  function onFileInput(e) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function onDrop(e) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
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
      </nav>

      <main className="dash-main" style={{paddingTop:32}}>
        <section className="card" style={{maxWidth:720}}>
          <div className="card-header"><div className="card-title">Upload documents</div><div className="tag tag-yellow">PDF</div></div>
          <div className="card-body">
            <div className={`upload-zone ${loading ? 'dragging uploading' : ''}`} onDragOver={(e)=>e.preventDefault()} onDrop={onDrop}>
              <input type="file" accept=".pdf" ref={fileRef} onChange={onFileInput} />
              <div className="upload-icon">📄</div>
              <div className="upload-title">Drag & drop a PDF</div>
              <div className="upload-sub">or click to browse</div>
              <div className="upload-types">Accepted: .pdf · max 50MB</div>

              {loading ? (
                <div className="upload-status-card">
                  <div className="upload-status-row">
                    <div className="spinner spinner-light"></div>
                    <div>
                      <div className="upload-status-title">Uploading document…</div>
                      <div className="upload-status-sub">{uploadingFileName || 'Processing your PDF'}</div>
                    </div>
                  </div>
                  <div className="upload-progress-track">
                    <div className="upload-progress-bar"></div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className={`upload-result ${result ? 'visible' : ''}`} style={{marginTop:16}}>
              <div className="result-row"><div className="result-label">File</div><div className="result-val">{result?.fileName ?? '—'}</div></div>
              <div className="result-row"><div className="result-label">Chunks</div><div className="result-val green">{result?.chunks ?? '—'}</div></div>
              <div className="result-row"><div className="result-label">Storage</div><div className="result-val mono" style={{maxWidth:360,overflow:'hidden',textOverflow:'ellipsis'}}>{result?.storageUrl ?? '—'}</div></div>
              <div className="result-row"><div className="result-label">Status</div><div className="result-val green">{result?.status ?? '—'}</div></div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
