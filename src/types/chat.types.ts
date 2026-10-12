export interface ChatUser {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
}

export interface ChatParticipant {
  conversationId?: string;
  userId: string;
  joinedAt?: string;
  lastReadAt?: string | null;
  user?: ChatUser | null;
}

export interface ChatConversation {
  id: string;
  title?: string | null;
  isGroup?: boolean;
  unreadCount?: number;
  lastMessage?: ChatMessage | null;
  participants?: ChatParticipant[];
  updatedAt?: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  body: string;
  senderId?: string;
  sender?: ChatUser | null;
  createdAt?: string;
  readAt?: string | null;
}

export interface ChatMessagesResponse {
  items: ChatMessage[];
  nextCursor?: string | null;
}

export interface SendChatMessagePayload {
  body: string;
}

export interface ChatMessageEvent {
  conversationId: string;
  message: ChatMessage;
}
