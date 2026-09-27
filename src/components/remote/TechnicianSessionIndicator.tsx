import { Loader2, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { isLiveStatus } from "../../hooks/technicianSessionStore";
import { formatDuration, useNow } from "../../hooks/useNow";
import { useTechnicianSession } from "../../hooks/useTechnicianSocket";

const LABELS = {
  REQUESTED: "Awaiting approval",
  APPROVED: "Approved — connect",
  ACTIVE: "Live session",
} as const;

export function TechnicianSessionIndicator() {
  const session = useTechnicianSession();
  const live = session !== null && isLiveStatus(session.status);
  const now = useNow(1000, live);

  if (!live || !session.ticketId) {
    return null;
  }

  const status = session.status as keyof typeof LABELS;
  const active = status === "ACTIVE";

  return (
    <Link
      to={`/technician/tickets/${session.ticketId}`}
      className={`mb-3 flex items-center gap-3 rounded-lg border p-3 text-xs transition-colors ${
        active
          ? "border-primary/30 bg-primary/10 hover:bg-primary/15"
          : "border-amber-300/60 bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/10"
      }`}
    >
      {active ? (
        <span className="relative flex size-2.5 shrink-0">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
          <span className="relative inline-flex size-2.5 rounded-full bg-primary" />
        </span>
      ) : status === "APPROVED" ? (
        <ShieldCheck className="size-4 shrink-0 text-primary" />
      ) : (
        <Loader2 className="size-4 shrink-0 animate-spin text-amber-600" />
      )}
      <div className="min-w-0 flex-1">
        <p className="font-medium text-foreground">{LABELS[status]}</p>
        <p className="truncate text-muted-foreground">
          {session.deviceHostname || "Remote device"}
        </p>
      </div>
      <span className="font-mono tabular-nums text-muted-foreground">
        {formatDuration(now - session.since)}
      </span>
    </Link>
  );
}
