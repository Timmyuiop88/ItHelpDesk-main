import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../lib/queryClient";
import { chatService } from "../../services/chat.service";
import type { SendChatMessagePayload } from "../../types/chat.types";

export function useChatConversations() {
  return useQuery({
    queryKey: queryKeys.chat.conversations,
    queryFn: () => chatService.listConversations(),
  });
}

export function useChatMessages(conversationId: string | null) {
  return useQuery({
    queryKey: conversationId
      ? queryKeys.chat.messages(conversationId)
      : ["chat", "messages", "none"],
    queryFn: () => chatService.listMessages(conversationId!, { limit: 50 }),
    enabled: !!conversationId,
  });
}

export function useSendChatMessage(conversationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SendChatMessagePayload) =>
      chatService.sendMessage(conversationId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.chat.messages(conversationId),
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.chat.conversations,
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
        queryKey: queryKeys.chat.conversations,
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.chat.messages(conversationId),
      });
    },
  });
}
