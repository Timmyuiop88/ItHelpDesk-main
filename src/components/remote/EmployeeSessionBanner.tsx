import { ChevronRight, Loader2, Monitor } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import type { EmployeeActiveSession } from "../../hooks/useEmployeeSocket";
import { formatDuration, useNow } from "../../hooks/useNow";

interface EmployeeSessionBannerProps {
  session: EmployeeActiveSession | null;
}

export function EmployeeSessionBanner({ session }: EmployeeSessionBannerProps) {
  const now = useNow(1000, session !== null);

  if (!session) {
    return null;
  }

  const live = session.status === "LIVE";

  return (
    <div
      role="status"
      className={`mb-6 flex items-center gap-4 rounded-xl border px-4 py-3 shadow-sm animate-in fade-in-0 slide-in-from-top-2 ${
        live
          ? "border-primary/30 bg-primary text-primary-foreground"
          : "border-amber-300/60 bg-amber-50 text-amber-900 dark:bg-amber-500/10 dark:text-amber-200"
      }`}
    >
      <div
        className={`flex size-9 shrink-0 items-center justify-center rounded-full ${
          live ? "bg-primary-foreground/15" : "bg-amber-100 dark:bg-amber-500/20"
        }`}
      >
        {live ? (
          <span className="relative flex size-3">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary-foreground opacity-60" />
            <span className="relative inline-flex size-3 rounded-full bg-primary-foreground" />
          </span>
        ) : (
          <Loader2 className="size-4 animate-spin" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">
          {live
            ? "IT Support is viewing your screen"
            : "Access approved — waiting for the technician to connect"}
        </p>
        <p
          className={`flex items-center gap-1.5 truncate text-xs ${
            live ? "text-primary-foreground/80" : "text-amber-800/80 dark:text-amber-200/70"
          }`}
        >
          <Monitor className="size-3" />
          {session.deviceHostname || "This device"}
          {live && " · Close RustDesk at any time to disconnect"}
        </p>
      </div>
      <span
        className={`rounded-full px-2.5 py-1 font-mono text-xs tabular-nums ${
          live ? "bg-primary-foreground/15" : "bg-amber-100 dark:bg-amber-500/20"
        }`}
      >
        {formatDuration(now - session.since)}
      </span>
      {session.ticketId && (
        <Button
          asChild
          variant="ghost"
          size="sm"
          className={live ? "text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground" : ""}
        >
          <Link to={`/employee/tickets/${session.ticketId}`}>
            View ticket
            <ChevronRight />
          </Link>
        </Button>
      )}
    </div>
  );
}
