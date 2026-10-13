import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../lib/queryClient";
import { chatService } from "../../services/chat.service";
import type {
  CreateChatConversationPayload,
  SendChatMessagePayload,
} from "../../types/chat.types";
import { usePagedInfiniteQuery } from "../common/usePagedInfiniteQuery";
import { useCursorQuery } from "../common/useCursorQuery";

const CONVERSATION_PAGE_SIZE = 20;
const MESSAGE_PAGE_SIZE = 50;

export function useChatConversations() {
  return usePagedInfiniteQuery({
    queryKey: queryKeys.chat.conversations({}),
    queryFn: ({ page, limit, signal }) =>
      chatService.listConversations({ page, limit }, signal),
    limit: CONVERSATION_PAGE_SIZE,
  });
}

export function useChatMessages(conversationId: string | null) {
  const params = { limit: MESSAGE_PAGE_SIZE };
  return useCursorQuery({
    queryKey: conversationId
      ? queryKeys.chat.messages(conversationId, params)
      : ["chat", "messages", "none"],
    queryFn: ({ cursor, limit, signal }) =>
      chatService.listMessages(conversationId!, { cursor, limit }, signal),
    limit: MESSAGE_PAGE_SIZE,
    enabled: !!conversationId,
    reverse: true,
  });
}

export function useCreateChatConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateChatConversationPayload) =>
      chatService.createConversation(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.chat.conversations({}),
      });
    },
  });
}

export function useSendChatMessage(conversationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SendChatMessagePayload) =>
      chatService.sendMessage(conversationId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.chat.messages(conversationId, {
          limit: MESSAGE_PAGE_SIZE,
        }),
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.chat.conversations({}),
      });
    },
  });
}

export function useMarkChatRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: string) => chatService.markRead(conversationId),
    onSuccess: async (_data, conversationId) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.chat.conversations({}),
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.chat.messages(conversationId, {
          limit: MESSAGE_PAGE_SIZE,
        }),
      });
    },
  });
}
