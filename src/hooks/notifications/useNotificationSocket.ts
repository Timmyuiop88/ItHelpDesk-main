import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useSocketEvent } from "../../components/SocketProvider";
import { queryKeys } from "../../lib/queryClient";
import {
  notificationPath,
  type NotificationNewEvent,
} from "../../types/notification.types";
import { useMarkNotificationRead } from "./useNotifications";

export function useNotificationSocket(basePath: "/employee" | "/technician") {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const markRead = useMarkNotificationRead();

  useSocketEvent<NotificationNewEvent>("notification:new", (event) => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unread });
    void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });

    const notification = event.notification;
    const path = notificationPath(notification, basePath);
    toast.message(notification.title, {
      description: notification.body ?? undefined,
      action: path
        ? {
            label: "Open",
            onClick: () => {
              markRead.mutate(notification.id);
              navigate(path);
            },
          }
        : undefined,
    });
  });
}
