import { apiGet, apiPatch, apiPost } from "../api/config";
import { ENDPOINTS } from "../api/endpoints";
import { cleanParams } from "../lib/pagination";
import type { CursorPage } from "../types/pagination.types";
import type {
  NotificationItem,
  NotificationListParams,
  UnreadCountResponse,
} from "../types/notification.types";

export const notificationService = {
  list: (params?: NotificationListParams, signal?: AbortSignal) =>
    apiGet<CursorPage<NotificationItem>>(
      ENDPOINTS.notifications.base,
      cleanParams({
        ...params,
        unread: params?.unread ? true : undefined,
      } as Record<string, unknown>),
      { signal },
    ),
  unreadCount: () =>
    apiGet<UnreadCountResponse>(ENDPOINTS.notifications.unreadCount),
  markRead: (id: string) =>
    apiPatch<void, Record<string, never>>(ENDPOINTS.notifications.read(id), {}),
  markAllRead: () =>
    apiPost<void, Record<string, never>>(ENDPOINTS.notifications.readAll, {}),
};

export type { NotificationItem };
