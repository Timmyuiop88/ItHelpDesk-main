import { apiGet, apiPost } from "../api/config";
import { ENDPOINTS } from "../api/endpoints";
import { cleanParams } from "../lib/pagination";
import type { CursorPage, Page } from "../types/pagination.types";
import type {
  ChatConversation,
  ChatMessage,
  CreateChatConversationPayload,
  SendChatMessagePayload,
} from "../types/chat.types";

export interface ChatConversationListParams {
  page?: number;
  limit?: number;
}

export const chatService = {
  // listConversations: () =>
  //   apiGet<ChatConversation[]>(ENDPOINTS.chat.conversations),
  listConversations: (
    params: ChatConversationListParams = {},
    signal?: AbortSignal,
  ) =>
    apiGet<Page<ChatConversation>>(
      ENDPOINTS.chat.conversations,
      cleanParams(params as Record<string, unknown>),
      { signal },
    ),
  createConversation: (payload: CreateChatConversationPayload) =>
    apiPost<ChatConversation, CreateChatConversationPayload>(
      ENDPOINTS.chat.conversations,
      payload,
    ),
  getConversation: (id: string) =>
    apiGet<ChatConversation>(ENDPOINTS.chat.conversation(id)),
  listMessages: (
    conversationId: string,
    params?: { cursor?: string; limit?: number },
    signal?: AbortSignal,
  ) =>
    apiGet<CursorPage<ChatMessage>>(
      ENDPOINTS.chat.messages(conversationId),
      cleanParams((params ?? {}) as Record<string, unknown>),
      { signal },
    ),
  sendMessage: (conversationId: string, payload: SendChatMessagePayload) =>
    apiPost<ChatMessage, SendChatMessagePayload>(
      ENDPOINTS.chat.messages(conversationId),
      payload,
    ),
  markRead: (conversationId: string) =>
    apiPost<void, Record<string, never>>(ENDPOINTS.chat.read(conversationId), {}),
};
