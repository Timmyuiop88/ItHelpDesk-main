export interface NotificationItem {
  id: string;
  userId?: string;
  type: string;
  title: string;
  body?: string | null;
  read?: boolean;
  readAt?: string | null;
  createdAt?: string;
  resourceId?: string | null;
  resourceType?: string | null;
  data?: Record<string, unknown> | null;
  ticketId?: string | null;
  metadata?: Record<string, unknown>;
}

export function isNotificationRead(item: NotificationItem): boolean {
  return item.read ?? !!item.readAt;
}

function stringField(
  source: Record<string, unknown> | null | undefined,
  key: string,
): string | undefined {
  const value = source?.[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

/** Route the notification points at, or null if it has no target. */
export function notificationPath(
  item: NotificationItem,
  basePath: "/employee" | "/technician",
): string | null {
  const resourceType = item.resourceType?.toUpperCase();

  if (item.resourceId) {
    if (resourceType === "TICKET") {
      return `${basePath}/tickets/${item.resourceId}`;
    }
    if (resourceType?.includes("CONVERSATION") || resourceType?.includes("CHAT") || resourceType?.includes("MESSAGE")) {
      return `${basePath}/chat?conversation=${item.resourceId}`;
    }
  }

  const ticketId =
    item.ticketId ??
    stringField(item.data, "ticketId") ??
    stringField(item.metadata, "ticketId");
  if (ticketId) {
    return `${basePath}/tickets/${ticketId}`;
  }

  const conversationId =
    stringField(item.data, "conversationId") ??
    stringField(item.metadata, "conversationId");
  if (conversationId) {
    return `${basePath}/chat?conversation=${conversationId}`;
  }

  if (/CHAT|MESSAGE/i.test(item.type)) {
    return `${basePath}/chat`;
  }

  return null;
}

export interface NotificationListParams {
  cursor?: string;
  limit?: number;
  unread?: boolean;
}

export interface NotificationListResponse {
  items: NotificationItem[];
  nextCursor?: string | null;
}

export interface UnreadCountResponse {
  count: number;
}

export interface NotificationNewEvent {
  notification: NotificationItem;
}
