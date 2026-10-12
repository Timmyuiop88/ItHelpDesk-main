import { useQueryClient } from "@tanstack/react-query";
import { useSocketEvent } from "../../components/SocketProvider";
import { queryKeys } from "../../lib/queryClient";
import { chatService } from "../../services/chat.service";
import type { ChatMessageEvent } from "../../types/chat.types";

const MESSAGE_LIST_PARAMS = { limit: 50 };

export function useChatSocket(activeConversationId: string | null) {
  const queryClient = useQueryClient();

  useSocketEvent<ChatMessageEvent>("chat:message", (event) => {
    void queryClient.invalidateQueries({
      queryKey: queryKeys.chat.messages(event.conversationId, MESSAGE_LIST_PARAMS),
    });
    void queryClient.invalidateQueries({
      queryKey: queryKeys.chat.conversations({}),
    });

    if (activeConversationId === event.conversationId) {
      void chatService
        .markRead(event.conversationId)
        .then(() =>
          queryClient.invalidateQueries({
            queryKey: queryKeys.chat.conversations({}),
          }),
        )
        .catch(() => undefined);
    }
  });
}
