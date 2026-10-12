import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Pagination } from "../common/pagination/Pagination";
import { infinitePropsFromCursor } from "../common/pagination/paginationAdapters";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadNotificationCount,
} from "../../hooks/notifications/useNotifications";
import { formatRelative } from "../../lib/format";

interface NotificationBellProps {
  basePath: "/employee" | "/technician";
}

export function NotificationBell({ basePath }: NotificationBellProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const unread = useUnreadNotificationCount();
  const notifications = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const items = notifications.items;

  const openTicket = (ticketId?: string | null) => {
    if (ticketId) {
      setOpen(false);
      navigate(`${basePath}/tickets/${ticketId}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="relative shrink-0">
          <Bell className="size-4" />
          {(unread.data ?? 0) > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
              {unread.data! > 99 ? "99+" : unread.data}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="gap-0 p-0 sm:max-w-md">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 border-b border-border px-4 py-3">
          <DialogTitle className="text-base">Notifications</DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1 text-xs"
            disabled={markAll.isPending || items.length === 0}
            onClick={() => markAll.mutate()}
          >
            {markAll.isPending ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <CheckCheck className="size-3" />
            )}
            Mark all read
          </Button>
        </DialogHeader>
        <div className="flex items-center gap-2 border-b border-border px-4 py-2">
          <input
            id="unread-only"
            type="checkbox"
            checked={notifications.unreadOnly}
            onChange={(e) => notifications.setUnreadOnly(e.currentTarget.checked)}
            className="size-3.5 accent-primary"
          />
          <Label htmlFor="unread-only" className="text-xs font-normal">
            Unread only
          </Label>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.isLoading && (
            <p className="p-4 text-center text-xs text-muted-foreground">Loading…</p>
          )}
          {items.length === 0 && !notifications.isLoading && (
            <p className="p-4 text-center text-xs text-muted-foreground">
              No notifications yet.
            </p>
          )}
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`flex w-full flex-col gap-0.5 border-b border-border px-4 py-2.5 text-left text-sm transition-colors hover:bg-muted/50 ${
                item.read ? "opacity-70" : "bg-primary/5"
              }`}
              onClick={() => {
                if (!item.read) {
                  markRead.mutate(item.id);
                }
                openTicket(item.ticketId);
              }}
            >
              <span className="font-medium leading-snug">{item.title}</span>
              {item.body && (
                <span className="line-clamp-2 text-xs text-muted-foreground">
                  {item.body}
                </span>
              )}
              {item.createdAt && (
                <span className="text-[10px] text-muted-foreground">
                  {formatRelative(item.createdAt)}
                </span>
              )}
            </button>
          ))}
          <Pagination variant="infinite" {...infinitePropsFromCursor(notifications)} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
