import { useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { queryKeys } from "../../lib/queryClient";
import { notificationService } from "../../services/notification.service";
import type { NotificationItem, UnreadCountResponse } from "../../types/notification.types";
import { isNotificationRead } from "../../types/notification.types";
import type { CursorPage } from "../../types/pagination.types";
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

type NotificationPages = InfiniteData<CursorPage<NotificationItem>>;

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationService.markRead(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.all });

      const listKey = ["notifications", "list"];
      const previousLists = queryClient.getQueriesData<NotificationPages>({ queryKey: listKey });
      const previousUnread = queryClient.getQueryData<UnreadCountResponse>(
        queryKeys.notifications.unread,
      );

      let wasUnread = false;
      const readAt = new Date().toISOString();
      queryClient.setQueriesData<NotificationPages>({ queryKey: listKey }, (data) => {
        if (!data) return data;
        return {
          ...data,
          pages: data.pages.map((page) => ({
            ...page,
            items: page.items.map((item) => {
              if (item.id !== id || isNotificationRead(item)) return item;
              wasUnread = true;
              return { ...item, read: true, readAt };
            }),
          })),
        };
      });

      if (wasUnread && previousUnread) {
        queryClient.setQueryData<UnreadCountResponse>(queryKeys.notifications.unread, {
          count: Math.max(0, previousUnread.count - 1),
        });
      }

      return { previousLists, previousUnread };
    },
    onError: (_err, _id, context) => {
      context?.previousLists.forEach(([key, data]) => queryClient.setQueryData(key, data));
      if (context?.previousUnread) {
        queryClient.setQueryData(queryKeys.notifications.unread, context.previousUnread);
      }
    },
    onSettled: async () => {
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
