import {
  Bell,
  CheckCheck,
  CheckCircle2,
  Loader2,
  MessageCircle,
  MessageSquare,
  MonitorSmartphone,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Pagination } from "../../components/common/pagination/Pagination";
import { infinitePropsFromCursor } from "../../components/common/pagination/paginationAdapters";
import { RefreshButton } from "../../components/common/RefreshButton";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadNotificationCount,
} from "../../hooks/notifications/useNotifications";
import { formatRelative } from "../../lib/format";
import {
  isNotificationRead,
  notificationPath,
  type NotificationItem,
} from "../../types/notification.types";

function notificationIcon(type: string): LucideIcon {
  const t = type.toUpperCase();
  if (t.includes("COMMENT")) return MessageSquare;
  if (t.includes("CHAT") || t.includes("MESSAGE")) return MessageCircle;
  if (t.includes("RESOLV") || t.includes("CLOSE")) return CheckCircle2;
  if (t.includes("SESSION") || t.includes("REMOTE")) return MonitorSmartphone;
  if (t.includes("ASSIGN") || t.includes("TRANSFER") || t.includes("PARTICIPANT")) {
    return UserRound;
  }
  return Bell;
}

export function NotificationsPage() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const basePath = pathname.startsWith("/technician") ? "/technician" : "/employee";

  const notifications = useNotifications();
  const unread = useUnreadNotificationCount();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const items = notifications.items;
  const unreadCount = unread.data ?? 0;

  const openNotification = (item: NotificationItem) => {
    if (!isNotificationRead(item)) {
      markRead.mutate(item.id);
    }
    const path = notificationPath(item, basePath);
    if (path) {
      navigate(path);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            Everything important is saved here, even while you were offline.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <input
              id="notifications-unread-only"
              type="checkbox"
              checked={notifications.unreadOnly}
              onChange={(e) => notifications.setUnreadOnly(e.currentTarget.checked)}
              className="size-4 accent-primary"
            />
            <Label htmlFor="notifications-unread-only" className="font-normal">
              Unread only
            </Label>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={markAll.isPending || unreadCount === 0}
            onClick={() => markAll.mutate()}
          >
            {markAll.isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <CheckCheck className="size-3.5" />
            )}
            Mark all read
          </Button>
          <RefreshButton
            onRefresh={async () => {
              await Promise.all([notifications.refetch(), unread.refetch()]);
            }}
            iconOnly
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-border bg-card">
        {notifications.isLoading && (
          <div className="flex justify-center p-8">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        )}
        {notifications.isError && !notifications.isLoading && (
          <p className="p-8 text-center text-sm text-muted-foreground">
            Couldn&apos;t load this list. Try again.
          </p>
        )}
        {!notifications.isLoading && !notifications.isError && items.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 p-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <Bell className="size-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">
              {notifications.unreadOnly ? "You're all caught up" : "No notifications yet"}
            </p>
            <p className="text-xs text-muted-foreground">
              Updates on your tickets and messages will show up here.
            </p>
          </div>
        )}

        {items.map((item) => {
          const Icon = notificationIcon(item.type);
          const read = isNotificationRead(item);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => openNotification(item)}
              className={`flex w-full items-start gap-3 border-b border-border px-4 py-3.5 text-left transition-colors hover:bg-muted/40 ${
                read ? "" : "bg-primary/5"
              }`}
            >
              <div
                className={`flex size-9 shrink-0 items-center justify-center rounded-full ${
                  read ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
                }`}
              >
                <Icon className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-sm leading-snug ${read ? "" : "font-semibold"}`}>
                  {item.title}
                </p>
                {item.body && (
                  <p className="line-clamp-2 text-sm text-muted-foreground">{item.body}</p>
                )}
                {item.createdAt && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatRelative(item.createdAt)}
                  </p>
                )}
              </div>
              {!read && (
                <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />
              )}
            </button>
          );
        })}

        <Pagination variant="infinite" {...infinitePropsFromCursor(notifications)} />
      </div>
    </div>
  );
}
