import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { createPublicSupportRequest, getPublicCompanyInfo, sendPublicChat } from '../services/chat.service.js';

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
  const [showFollowUpPrompt, setShowFollowUpPrompt] = useState(false);
  const [followUpSubmitting, setFollowUpSubmitting] = useState(false);
  const [followUpError, setFollowUpError] = useState('');
  const [followUpSuccess, setFollowUpSuccess] = useState('');
  const [followUpSubmitted, setFollowUpSubmitted] = useState(false);
  const [followUpForm, setFollowUpForm] = useState({ email: '', phone: '', notes: '' });

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

      if (result?.escalation?.needed) {
        setShowFollowUpPrompt(true);
      }

      setMessages((current) => [...current, { role: 'assistant', message: result.answer }]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleFollowUpSubmit(event) {
    event.preventDefault();

    if (!conversationId) {
      setFollowUpError('Conversation is not ready yet. Please send one message first.');
      return;
    }

    setFollowUpSubmitting(true);
    setFollowUpError('');
    setFollowUpSuccess('');

    try {
      const result = await createPublicSupportRequest(companySlug, {
        conversationId,
        email: followUpForm.email,
        phone: followUpForm.phone,
        notes: followUpForm.notes,
      });

      setFollowUpSubmitted(true);
      setFollowUpSuccess(result.alreadySubmitted
        ? 'You already shared contact details for this conversation. Our team will follow up.'
        : 'Thanks. Your follow-up request has been submitted. A support representative may contact you soon.');
    } catch (err) {
      setFollowUpError(err.message);
    } finally {
      setFollowUpSubmitting(false);
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

          {showFollowUpPrompt ? (
            <div className="followup-card">
              <div className="followup-card-head">
                <div className="followup-card-title">Need human follow-up?</div>
                <div className="tag tag-yellow">optional</div>
              </div>
              <p className="followup-card-sub">
                If you&apos;d like a support representative to contact you, share an email or phone number below.
              </p>

              <form className="followup-form" onSubmit={handleFollowUpSubmit}>
                <input
                  type="email"
                  placeholder="Email (optional)"
                  value={followUpForm.email}
                  onChange={(e) => setFollowUpForm((current) => ({ ...current, email: e.target.value }))}
                  disabled={followUpSubmitted || followUpSubmitting}
                />
                <input
                  type="text"
                  placeholder="Phone (optional)"
                  value={followUpForm.phone}
                  onChange={(e) => setFollowUpForm((current) => ({ ...current, phone: e.target.value }))}
                  disabled={followUpSubmitted || followUpSubmitting}
                />
                <textarea
                  placeholder="Anything else we should know? (optional)"
                  value={followUpForm.notes}
                  onChange={(e) => setFollowUpForm((current) => ({ ...current, notes: e.target.value }))}
                  disabled={followUpSubmitted || followUpSubmitting}
                  rows={2}
                />

                <div className="followup-actions">
                  <button className="btn btn-primary" type="submit" disabled={followUpSubmitted || followUpSubmitting}>
                    {followUpSubmitting ? 'Submitting…' : followUpSubmitted ? 'Submitted' : 'Request Follow-up'}
                  </button>
                  {followUpSubmitted ? (
                    <button className="btn btn-ghost" type="button" onClick={() => setShowFollowUpPrompt(false)}>
                      Hide
                    </button>
                  ) : null}
                </div>
              </form>

              {followUpError ? <p className="error-text">{followUpError}</p> : null}
              {followUpSuccess ? <p className="followup-success">{followUpSuccess}</p> : null}
            </div>
          ) : null}
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
