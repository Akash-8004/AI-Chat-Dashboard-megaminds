import type { Conversation, ConversationDetail, Persona, User } from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api';

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Request failed.' }));
    const errorMessage =
      typeof errorData.detail === 'string'
        ? errorData.detail
        : Array.isArray(errorData.detail)
          ? errorData.detail.map((e: { msg?: string }) => e.msg).join(', ')
          : errorData.message || 'Request failed.';
    throw new Error(errorMessage);
  }

  return response.json() as Promise<T>;

}

export const api = {
  register: (payload: { displayName: string; email: string; password: string }) =>
    request<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  login: (payload: { email: string; password: string }) =>
    request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getPersonas: () => request<Persona[]>('/personas'),
  getConversations: (token: string) => request<Conversation[]>('/conversations', {}, token),
  createConversation: (payload: { title?: string; personaId: string }, token: string) =>
    request<ConversationDetail>(
      '/conversations',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      token,
    ),
  getConversation: (conversationId: string, token: string) =>
    request<ConversationDetail>(`/conversations/${conversationId}/messages`, {}, token),
  sendMessage: (conversationId: string, payload: { content: string }, token: string) =>
    request<{ userMessage: ConversationDetail['messages'][number]; assistantMessage: ConversationDetail['messages'][number] }>(
      `/conversations/${conversationId}/messages`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      token,
    ),
};
