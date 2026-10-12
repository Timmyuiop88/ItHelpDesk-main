import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../lib/queryClient";
import { notificationService } from "../../services/notification.service";
import { useCursorQuery } from "../common/useCursorQuery";

const NOTIFICATION_LIMIT = 30;

export function useNotifications() {
  const [unreadOnly, setUnreadOnly] = useState(false);

  const query = useCursorQuery({
    queryKey: queryKeys.notifications.list({ unread: unreadOnly }),
    queryFn: ({ cursor, limit, signal }) =>
      notificationService.list({ cursor, limit, unread: unreadOnly || undefined }, signal),
    limit: NOTIFICATION_LIMIT,
  });

  return {
    ...query,
    unreadOnly,
    setUnreadOnly,
  };
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: queryKeys.notifications.unread,
    queryFn: () => notificationService.unreadCount(),
    select: (data) => data.count,
    refetchInterval: 60_000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationService.markRead(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}
