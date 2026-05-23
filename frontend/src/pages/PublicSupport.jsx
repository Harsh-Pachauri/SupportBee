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
    <main className="page-shell">
      <section className="card support-card">
        <p className="eyebrow">Public support page</p>
        <h1>{company?.company_name || companySlug}</h1>
        <p className="hero-copy compact">
          Ask questions grounded only in this company&apos;s uploaded documents.
        </p>
        {conversationId ? <p className="muted-line">Conversation session active: {conversationId}</p> : null}

        <div className="chat-thread">
          {messages.length === 0 ? <p className="muted-line">No messages yet.</p> : null}
          {messages.map((entry, index) => (
            <article key={`${entry.role}-${index}`} className={`chat-bubble ${entry.role}`}>
              <strong>{entry.role}</strong>
              <p>{entry.message}</p>
            </article>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="chat-form">
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows="4" placeholder="Ask about refunds, shipping, support..." />
          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? 'Thinking...' : 'Send'}
          </button>
        </form>

        {error ? <p className="error-text">{error}</p> : null}
      </section>
    </main>
  );
}
