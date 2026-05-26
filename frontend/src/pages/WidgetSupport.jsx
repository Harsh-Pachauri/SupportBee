import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { createPublicSupportRequest, getPublicCompanyInfo, sendPublicChat } from '../services/chat.service.js';
import '../styles/widget.css';

function buildVisitorKey(companyId) {
  return `supportbee:widget:visitor:${companyId}`;
}

function buildSessionKey(companyId, visitorId) {
  return `supportbee:widget:session:${companyId}:${visitorId}`;
}

function generateVisitorId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function WidgetSupport() {
  const { companyId } = useParams();
  const [company, setCompany] = useState(null);
  const [visitorId, setVisitorId] = useState('');
  const [conversationId, setConversationId] = useState('');
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showFollowUpPrompt, setShowFollowUpPrompt] = useState(false);
  const [followUpSubmitting, setFollowUpSubmitting] = useState(false);
  const [followUpError, setFollowUpError] = useState('');
  const [followUpSuccess, setFollowUpSuccess] = useState('');
  const [followUpSubmitted, setFollowUpSubmitted] = useState(false);
  const [followUpForm, setFollowUpForm] = useState({ email: '', phone: '', notes: '' });
  const scrollRef = useRef(null);

  const quickPrompts = useMemo(
    () => ['What is your refund policy?', 'How can I track my order?', 'How do I reset my password?'],
    []
  );

  useEffect(() => {
    if (!companyId) {
      return;
    }

    let mounted = true;

    async function loadCompany() {
      try {
        const result = await getPublicCompanyInfo(companyId);
        if (mounted) {
          setCompany(result.company || null);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message);
        }
      }
    }

    let existingVisitorId = '';
    try {
      existingVisitorId = localStorage.getItem(buildVisitorKey(companyId)) || '';
      if (!existingVisitorId) {
        existingVisitorId = generateVisitorId();
        localStorage.setItem(buildVisitorKey(companyId), existingVisitorId);
      }
      if (mounted) {
        setVisitorId(existingVisitorId);
      }

      const rawSession = localStorage.getItem(buildSessionKey(companyId, existingVisitorId));
      if (rawSession) {
        const parsed = JSON.parse(rawSession);
        if (mounted) {
          setConversationId(parsed.conversationId || '');
          setMessages(Array.isArray(parsed.messages) ? parsed.messages : []);
          setShowFollowUpPrompt(Boolean(parsed.showFollowUpPrompt));
          setFollowUpSubmitted(Boolean(parsed.followUpSubmitted));
        }
      }
    } catch (sessionErr) {
      console.warn('Failed to restore widget session', sessionErr);
    }

    loadCompany();

    return () => {
      mounted = false;
    };
  }, [companyId]);

  useEffect(() => {
    if (!companyId || !visitorId) {
      return;
    }

    try {
      localStorage.setItem(
        buildSessionKey(companyId, visitorId),
        JSON.stringify({
          conversationId,
          messages,
          showFollowUpPrompt,
          followUpSubmitted,
        })
      );
    } catch (sessionErr) {
      console.warn('Failed to persist widget session', sessionErr);
    }
  }, [companyId, visitorId, conversationId, messages, showFollowUpPrompt, followUpSubmitted]);

  useEffect(() => {
    if (!scrollRef.current) {
      return;
    }

    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading, showFollowUpPrompt, followUpSuccess, followUpError]);

  async function handleSend(event) {
    event.preventDefault();
    if (!message.trim() || loading) {
      return;
    }

    const userMessage = message.trim();
    setMessage('');
    setLoading(true);
    setError('');
    setMessages((current) => [...current, { role: 'user', message: userMessage }]);

    try {
      const result = await sendPublicChat(companyId, {
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
      setFollowUpError('Please send a message first so we can attach your request to this conversation.');
      return;
    }

    setFollowUpSubmitting(true);
    setFollowUpError('');
    setFollowUpSuccess('');

    try {
      const result = await createPublicSupportRequest(companyId, {
        conversationId,
        email: followUpForm.email,
        phone: followUpForm.phone,
        notes: followUpForm.notes,
      });

      setFollowUpSubmitted(true);
      setFollowUpSuccess(
        result.alreadySubmitted
          ? 'Your contact details are already on file for this conversation.'
          : 'Thanks. A support representative will follow up.'
      );
    } catch (err) {
      setFollowUpError(err.message);
    } finally {
      setFollowUpSubmitting(false);
    }
  }

  function applyPrompt(prompt) {
    setMessage(prompt);
  }

  return (
    <div className="widget-shell">
      <div className="widget-card">
        <header className="widget-header">
          <div className="widget-brand">
            <div className="widget-logo">SB</div>
            <div>
              <div className="widget-title">{company?.company_name || companyId || 'SupportBee'}</div>
              <div className="widget-subtitle">AI Support Assistant</div>
            </div>
          </div>
          <div className="widget-live-pill">Live</div>
        </header>

        <main className="widget-messages" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="widget-empty">
              <h2>How can we help today?</h2>
              <p>Ask a question based on the company knowledge base.</p>
              <div className="widget-quick-prompts">
                {quickPrompts.map((prompt) => (
                  <button key={prompt} type="button" className="widget-prompt" onClick={() => applyPrompt(prompt)}>
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {messages.map((entry, index) => (
            <article key={`${entry.role}-${index}`} className={`widget-message-row ${entry.role}`}>
              <div className="widget-message-bubble">{entry.message}</div>
            </article>
          ))}

          {loading ? (
            <article className="widget-message-row assistant">
              <div className="widget-message-bubble widget-typing">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </article>
          ) : null}

          {showFollowUpPrompt ? (
            <section className="widget-followup-card">
              <div className="widget-followup-title">Need human follow-up?</div>
              <p className="widget-followup-copy">Leave an email or phone number and our team can contact you.</p>
              <form className="widget-followup-form" onSubmit={handleFollowUpSubmit}>
                <input
                  type="email"
                  placeholder="Email (optional)"
                  value={followUpForm.email}
                  onChange={(event) => setFollowUpForm((current) => ({ ...current, email: event.target.value }))}
                  disabled={followUpSubmitting || followUpSubmitted}
                />
                <input
                  type="text"
                  placeholder="Phone (optional)"
                  value={followUpForm.phone}
                  onChange={(event) => setFollowUpForm((current) => ({ ...current, phone: event.target.value }))}
                  disabled={followUpSubmitting || followUpSubmitted}
                />
                <textarea
                  placeholder="Additional context (optional)"
                  value={followUpForm.notes}
                  onChange={(event) => setFollowUpForm((current) => ({ ...current, notes: event.target.value }))}
                  disabled={followUpSubmitting || followUpSubmitted}
                  rows={2}
                />
                <button className="widget-followup-submit" type="submit" disabled={followUpSubmitting || followUpSubmitted}>
                  {followUpSubmitting ? 'Submitting...' : followUpSubmitted ? 'Submitted' : 'Request Follow-up'}
                </button>
              </form>
              {followUpError ? <p className="widget-followup-error">{followUpError}</p> : null}
              {followUpSuccess ? <p className="widget-followup-success">{followUpSuccess}</p> : null}
            </section>
          ) : null}
        </main>

        <footer className="widget-input-wrap">
          {error ? <p className="widget-error">{error}</p> : null}
          <form className="widget-input-form" onSubmit={handleSend}>
            <input
              type="text"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Type your message..."
              disabled={loading}
            />
            <button type="submit" disabled={loading || !message.trim()}>
              {loading ? '...' : 'Send'}
            </button>
          </form>
          <p className="widget-footer-note">Powered by SupportBee</p>
        </footer>
      </div>
    </div>
  );
}
