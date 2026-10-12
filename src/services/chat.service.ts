import { apiGet, apiPatch, apiPost } from "../api/config";
import { ENDPOINTS } from "../api/endpoints";
import type {
  ChatConversation,
  ChatMessage,
  ChatMessagesResponse,
  SendChatMessagePayload,
} from "../types/chat.types";

export const chatService = {
  listConversations: () =>
    apiGet<ChatConversation[]>(ENDPOINTS.chat.conversations),
  getConversation: (id: string) =>
    apiGet<ChatConversation>(ENDPOINTS.chat.conversation(id)),
  listMessages: (conversationId: string, params?: { cursor?: string; limit?: number }) =>
    apiGet<ChatMessagesResponse>(
      ENDPOINTS.chat.messages(conversationId),
      params,
    ),
  sendMessage: (conversationId: string, payload: SendChatMessagePayload) =>
    apiPost<ChatMessage, SendChatMessagePayload>(
      ENDPOINTS.chat.messages(conversationId),
      payload,
    ),
  markRead: (conversationId: string) =>
    apiPatch<void, Record<string, never>>(ENDPOINTS.chat.read(conversationId), {}),
};
