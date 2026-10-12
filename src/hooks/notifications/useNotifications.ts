import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../lib/queryClient";
import { notificationService } from "../../services/notification.service";

export function useNotifications() {
  return useInfiniteQuery({
    queryKey: queryKeys.notifications.all,
    queryFn: ({ pageParam }) =>
      notificationService.list({ page: pageParam, limit: 20 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const page = lastPage.page ?? 1;
      const limit = lastPage.limit ?? 20;
      const total = lastPage.total ?? lastPage.items.length;
      if (page * limit >= total) {
        return undefined;
      }
      return page + 1;
    },
  });
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
      await queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unread });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      await queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unread });
    },
  });
}
