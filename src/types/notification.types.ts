export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body?: string | null;
  read: boolean;
  createdAt?: string;
  ticketId?: string | null;
  metadata?: Record<string, unknown>;
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
