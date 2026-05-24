import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getPublicCompanyInfo, sendPublicChat } from '../services/chat.service.js';

function getSessionKey(companySlug) {
  return `supportbee:public-chat:${companySlug}`;
}

export default function PublicSupport() {
  const { companySlug } = useParams();
  const [company, setCompany] = useState(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    async function loadCompany() {
      try {
        const result = await getPublicCompanyInfo(companySlug);
        if (mounted) setCompany(result.company);
      } catch (err) {
        if (mounted) setError(err.message);
      }
    }

    if (companySlug) {
      loadCompany();

      try {
        const stored = sessionStorage.getItem(getSessionKey(companySlug));
        if (stored) {
          const parsed = JSON.parse(stored);
          if (mounted) {
            setConversationId(parsed.conversationId || '');
            setMessages(Array.isArray(parsed.messages) ? parsed.messages : []);
          }
        }
      } catch (err) {
        console.warn('Failed to restore public chat session', err);
      }
    }

    return () => {
      mounted = false;
    };
  }, [companySlug]);

  useEffect(() => {
    if (!companySlug) return;

    try {
      sessionStorage.setItem(
        getSessionKey(companySlug),
        JSON.stringify({ conversationId, messages })
      );
    } catch (err) {
      console.warn('Failed to persist public chat session', err);
    }
  }, [companySlug, conversationId, messages]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!message.trim()) return;

    const userMessage = message.trim();
    setMessage('');
    setLoading(true);
    setError('');
    setMessages((current) => [...current, { role: 'user', message: userMessage }]);

    try {
      const result = await sendPublicChat(companySlug, {
        message: userMessage,
        conversationId: conversationId || undefined,
      });

      if (result?.conversationId) {
        setConversationId(result.conversationId);
      }

      setMessages((current) => [...current, { role: 'assistant', message: result.answer }]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page active chat-page">
      <div className="chat-ambient"></div>
      <div className="chat-grid"></div>

      <header className="chat-header">
        <div className="chat-header-brand">
          <div className="chat-logo-mark">🐝</div>
          <div>
            <div className="chat-company-name">{company?.company_name || companySlug}</div>
            <div className="chat-company-slug">/{company?.slug || companySlug}</div>
          </div>
        </div>
        <div className="chat-header-status">
          <div className="status-chip"><div className="status-chip-dot"></div>Live</div>
          <div className="powered-badge">Powered by <span>SupportBee</span></div>
        </div>
      </header>

      <div className="chat-body" id="chat-body">
        <div className="chat-inner">
          {messages.length === 0 ? (
            <div className="chat-welcome">
              <div className="chat-welcome-icon">💬</div>
              <h2>Welcome — ask me anything</h2>
              <p>Ask questions grounded only in this company&apos;s uploaded documents.</p>
              <div className="chat-welcome-chips">
                <button type="button" className="chat-chip" onClick={() => { setMessage("What's your refund policy?"); }}>What's your refund policy?</button>
                <button type="button" className="chat-chip" onClick={() => { setMessage('How do I reset my password?'); }}>How do I reset my password?</button>
                <button type="button" className="chat-chip" onClick={() => { setMessage('Where do I track my order?'); }}>Where do I track my order?</button>
                <button type="button" className="chat-chip" onClick={() => { setMessage('Do you offer free shipping?'); }}>Do you offer free shipping?</button>
              </div>
            </div>
          ) : (
            messages.map((m, i) => (
              <div className={`msg-row ${m.role}`} key={i}>
                <div className={`msg-avatar ${m.role==='user'?'user-av':'ai-av'}`}>{m.role==='user' ? 'U' : 'AI'}</div>
                <div className="msg-bubble-wrap">
                  <div className="msg-bubble">{m.message}</div>
                  {m.sources && m.sources.length ? (
                    <div className="msg-sources">
                      {m.sources.map((s, idx) => <span className="source-tag" key={idx}>{s}</span>)}
                    </div>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <form className="chat-input-bar" onSubmit={handleSubmit}>
        <div className="chat-input-inner">
          <div className="chat-input-wrap">
            <textarea id="chat-textarea" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Ask about your documents…" rows={1} />
            <button className="chat-send-btn" type="submit" disabled={loading}>{loading ? '…' : '➤'}</button>
          </div>
          <div className="chat-footer-hint">Responses are generated from uploaded documents only.</div>
        </div>
      </form>
    </div>
  );
}
