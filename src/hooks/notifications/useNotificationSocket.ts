import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useSocketEvent } from "../../components/SocketProvider";
import { queryKeys } from "../../lib/queryClient";
import type { NotificationNewEvent } from "../../types/notification.types";

export function useNotificationSocket(basePath: "/employee" | "/technician") {
  const queryClient = useQueryClient();

  useSocketEvent<NotificationNewEvent>("notification:new", (event) => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unread });
    void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });

    const ticketId = event.notification.ticketId;
    toast.message(event.notification.title, {
      description: event.notification.body ?? undefined,
      action:
        ticketId !== undefined && ticketId !== null && ticketId !== ""
          ? {
              label: "Open",
              onClick: () => {
                window.location.assign(`${basePath}/tickets/${ticketId}`);
              },
            }
          : undefined,
    });
  });
}
