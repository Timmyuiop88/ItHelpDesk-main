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

export interface NotificationListResponse {
  items: NotificationItem[];
  total?: number;
  page?: number;
  limit?: number;
}

export interface UnreadCountResponse {
  count: number;
}

export interface NotificationNewEvent {
  notification: NotificationItem;
}
