import { useQueryClient } from "@tanstack/react-query";
import { useSocketEvent } from "../../components/SocketProvider";
import { queryKeys } from "../../lib/queryClient";
import { chatService } from "../../services/chat.service";
import type { ChatMessageEvent } from "../../types/chat.types";

export function useChatSocket(activeConversationId: string | null) {
  const queryClient = useQueryClient();

  useSocketEvent<ChatMessageEvent>("chat:message", (event) => {
    void queryClient.invalidateQueries({
      queryKey: queryKeys.chat.messages(event.conversationId),
    });
    void queryClient.invalidateQueries({
      queryKey: queryKeys.chat.conversations,
    });

    if (activeConversationId === event.conversationId) {
      void chatService
        .markRead(event.conversationId)
        .then(() =>
          queryClient.invalidateQueries({
            queryKey: queryKeys.chat.conversations,
          }),
        )
        .catch(() => undefined);
    }
  });
}
