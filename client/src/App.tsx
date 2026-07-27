import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { api } from './api';
import type { Conversation, ConversationDetail, Persona, User } from './types';

type AuthMode = 'login' | 'register';

type AuthState = {
  token: string;
  user: User;
};

const TOKEN_STORAGE_KEY = 'megaminds-ai-chat-auth';

function formatDate(value: string) {
  return new Date(value).toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function App() {
  const [authMode, setAuthMode] = useState<AuthMode>('register');
  const [auth, setAuth] = useState<AuthState | null>(() => {
    const raw = localStorage.getItem(TOKEN_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthState) : null;
  });
  const [formState, setFormState] = useState({ displayName: '', email: '', password: '' });
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [selectedPersonaId, setSelectedPersonaId] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<ConversationDetail | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [appLoading, setAppLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages, sendingMessage]);


  useEffect(() => {
    api.getPersonas()
      .then((data) => {
        setPersonas(data);
        setSelectedPersonaId((current) => current || data[0]?.id || '');
      })
      .catch(() => {
        setError('Failed to load personas. Start the backend and refresh.');
      });
  }, []);

  useEffect(() => {
    if (!auth) {
      setConversations([]);
      setActiveConversation(null);
      return;
    }

    setAppLoading(true);
    api.getConversations(auth.token)
      .then(async (conversationList) => {
        setConversations(conversationList);
        if (conversationList[0]) {
          const detail = await api.getConversation(conversationList[0].id, auth.token);
          setActiveConversation(detail);
          setSelectedPersonaId(detail.persona.id);
        } else {
          setActiveConversation(null);
        }
      })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Failed to load conversations.'))
      .finally(() => setAppLoading(false));
  }, [auth]);

  const selectedPersona = useMemo(
    () => personas.find((persona) => persona.id === selectedPersonaId) ?? personas[0] ?? null,
    [personas, selectedPersonaId],
  );

  function persistAuth(nextAuth: AuthState | null) {
    setAuth(nextAuth);
    if (nextAuth) {
      localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(nextAuth));
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  }

  async function handleAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthLoading(true);
    setError('');

    try {
      const result =
        authMode === 'register'
          ? await api.register(formState)
          : await api.login({ email: formState.email, password: formState.password });
      persistAuth(result);
      setFormState({ displayName: '', email: '', password: '' });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Authentication failed.');
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleCreateConversation() {
    if (!auth || !selectedPersona) return;
    setAppLoading(true);
    setError('');

    try {
      const conversation = await api.createConversation({ personaId: selectedPersona.id }, auth.token);
      const conversationSummary: Conversation = {
        id: conversation.id,
        title: conversation.title,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        persona: conversation.persona,
        firstMessagePreview: '',
      };
      setConversations((current) => [conversationSummary, ...current]);
      setActiveConversation(conversation);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to create conversation.');
    } finally {
      setAppLoading(false);
    }
  }

  async function handleSelectConversation(conversationId: string) {
    if (!auth) return;
    setAppLoading(true);
    setError('');

    try {
      const conversation = await api.getConversation(conversationId, auth.token);
      setActiveConversation(conversation);
      setSelectedPersonaId(conversation.persona.id);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to load conversation.');
    } finally {
      setAppLoading(false);
    }
  }

  async function handleSendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!auth || !activeConversation || !messageInput.trim()) return;

    setSendingMessage(true);
    setError('');

    try {
      const content = messageInput.trim();
      setMessageInput('');
      const result = await api.sendMessage(activeConversation.id, { content }, auth.token);
      const updatedConversation = {
        ...activeConversation,
        title: activeConversation.messages.length === 0 ? content.slice(0, 48) : activeConversation.title,
        messages: [...activeConversation.messages, result.userMessage, result.assistantMessage],
        updatedAt: new Date().toISOString(),
      };
      setActiveConversation(updatedConversation);
      setConversations((current) => {
        const summary: Conversation = {
          id: updatedConversation.id,
          title: updatedConversation.title,
          createdAt: updatedConversation.createdAt,
          updatedAt: updatedConversation.updatedAt,
          persona: updatedConversation.persona,
          firstMessagePreview: content,
        };
        return [summary, ...current.filter((conversation) => conversation.id !== updatedConversation.id)];
      });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to send message.');
    } finally {
      setSendingMessage(false);
    }
  }

  if (!auth) {
    return (
      <main className="shell auth-shell">
        <section className="auth-card">
          <div>
            <p className="eyebrow">Megaminds Internship Assignment</p>
            <h1>AI Chat Dashboard</h1>
            <p className="subtle">
              Multi-turn conversations, authentication, persona switching, and persistent history.
            </p>
          </div>

          <form className="auth-form" onSubmit={handleAuthSubmit}>
            {authMode === 'register' ? (
              <label>
                Name
                <input
                  value={formState.displayName}
                  onChange={(event) => setFormState((current) => ({ ...current, displayName: event.target.value }))}
                  placeholder="Aman Sharma"
                  required
                />
              </label>
            ) : null}
            <label>
              Email
              <input
                type="email"
                value={formState.email}
                onChange={(event) => setFormState((current) => ({ ...current, email: event.target.value }))}
                placeholder="you@example.com"
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={formState.password}
                onChange={(event) => setFormState((current) => ({ ...current, password: event.target.value }))}
                placeholder="At least 6 characters"
                minLength={6}
                required
              />
            </label>
            <button type="submit" disabled={authLoading}>
              {authLoading ? 'Please wait...' : authMode === 'register' ? 'Create account' : 'Sign in'}
            </button>
          </form>

          <button
            type="button"
            className="text-button"
            onClick={() => setAuthMode((current) => (current === 'register' ? 'login' : 'register'))}
          >
            {authMode === 'register' ? 'Already have an account? Sign in' : 'Need an account? Register'}
          </button>

          {error ? <p className="error-banner">{error}</p> : null}
        </section>
      </main>
    );
  }

  return (
    <main className="shell app-shell">
      <aside className="sidebar">
        <div className="sidebar-top">
          <div>
            <p className="eyebrow">Signed in as</p>
            <h2>{auth.user.displayName}</h2>
            <p className="subtle small">{auth.user.email}</p>
          </div>
          <button type="button" className="ghost-button" onClick={() => persistAuth(null)}>
            Log out
          </button>
        </div>

        <div className="panel">
          <label className="stacked">
            Persona
            <select value={selectedPersonaId} onChange={(event) => setSelectedPersonaId(event.target.value)}>
              {personas.map((persona) => (
                <option key={persona.id} value={persona.id}>
                  {persona.name}
                </option>
              ))}
            </select>
          </label>
          <p className="subtle small">{selectedPersona?.description}</p>
          <button type="button" onClick={handleCreateConversation} disabled={!selectedPersona || appLoading}>
            + New conversation
          </button>
        </div>

        <div className="panel grow">
          <div className="panel-header">
            <h3>Conversation History</h3>
            {appLoading ? <span className="status-pill">Loading</span> : null}
          </div>
          <div className="conversation-list">
            {conversations.length === 0 ? <p className="subtle">No conversations yet. Start one with a persona.</p> : null}
            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                type="button"
                className={`conversation-item ${activeConversation?.id === conversation.id ? 'active' : ''}`}
                onClick={() => handleSelectConversation(conversation.id)}
              >
                <strong>{conversation.title}</strong>
                <span>{conversation.persona.name}</span>
                <small>{formatDate(conversation.updatedAt)}</small>
              </button>
            ))}
          </div>
        </div>
      </aside>

      <section className="chat-layout">
        <header className="chat-header">
          <div>
            <p className="eyebrow">Current persona</p>
            <h2>{activeConversation?.persona.name ?? selectedPersona?.name ?? 'Choose a persona'}</h2>
          </div>
          <p className="subtle max-width">
            {activeConversation?.persona.description ?? selectedPersona?.description ?? 'Create a conversation to begin chatting.'}
          </p>
        </header>

        <div className="chat-card">
          <div className="messages">
            {!activeConversation ? (
              <div className="empty-state">
                <h3>Ready to chat</h3>
                <p>Create a conversation from the left panel to start using the selected AI persona.</p>
              </div>
            ) : (
              activeConversation.messages.map((message) => (
                <article key={message.id} className={`message ${message.role}`}>
                  <span className="message-role">{message.role === 'user' ? 'You' : activeConversation.persona.name}</span>
                  <p>{message.content}</p>
                </article>
              ))
            )}
            {sendingMessage ? <p className="status-pill">Generating response...</p> : null}
            <div ref={messagesEndRef} />
          </div>

          <form className="composer" onSubmit={handleSendMessage}>
            <textarea
              value={messageInput}
              onChange={(event) => setMessageInput(event.target.value)}
              placeholder={activeConversation ? 'Ask a follow-up question...' : 'Create a conversation first.'}
              rows={4}
              disabled={!activeConversation || sendingMessage}
            />
            <div className="composer-footer">
              <p className="subtle small">
                Logged in as <strong>{auth.user.displayName}</strong>. Full multi-turn chat history is persisted per user account.
              </p>
              <button type="submit" disabled={!activeConversation || sendingMessage || !messageInput.trim()}>
                {sendingMessage ? 'Sending...' : 'Send message'}
              </button>
            </div>
          </form>

        </div>

        {error ? <p className="error-banner inline-error">{error}</p> : null}
      </section>
    </main>
  );
}
