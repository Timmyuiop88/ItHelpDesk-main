import { apiGet, apiPatch, apiPost } from "../api/config";
import { ENDPOINTS } from "../api/endpoints";
import type {
  NotificationItem,
  NotificationListResponse,
  UnreadCountResponse,
} from "../types/notification.types";

export const notificationService = {
  list: (params?: { page?: number; limit?: number }) =>
    apiGet<NotificationListResponse>(ENDPOINTS.notifications.base, params),
  unreadCount: () =>
    apiGet<UnreadCountResponse>(ENDPOINTS.notifications.unreadCount),
  markRead: (id: string) =>
    apiPatch<void, Record<string, never>>(ENDPOINTS.notifications.read(id), {}),
  markAllRead: () =>
    apiPost<void, Record<string, never>>(ENDPOINTS.notifications.readAll, {}),
};

export type { NotificationItem };
