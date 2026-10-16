export type MessageRole = 'user' | 'assistant' | 'system';

export interface Attachment {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  url?: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  attachments?: Attachment[];
  taskId?: string;
  createdAt: string;
  status: 'SENDING' | 'SENT' | 'STREAMING' | 'ERROR';
  isStreaming?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
  lastMessageSnippet?: string;
}
