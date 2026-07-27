export type User = {
  id: string;
  email: string;
  displayName: string;
};

export type Persona = {
  id: string;
  key: string;
  name: string;
  description: string;
};

export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
};

export type Conversation = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  persona: Persona;
  firstMessagePreview?: string;
};

export type ConversationDetail = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  persona: Persona;
  messages: Message[];
};
