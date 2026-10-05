import { Clock, Eye, Loader2, MousePointerClick, ShieldCheck, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { formatDuration, useNow } from "../../hooks/useNow";

export function PermissionList({ compact = false }: { compact?: boolean }) {
  return (
    <ul className={`flex flex-col ${compact ? "gap-2" : "gap-2.5"}`}>
      <Permission icon={<Eye />} compact={compact}>
        See everything on your screen
      </Permission>
      <Permission icon={<MousePointerClick />} compact={compact}>
        Use your mouse and keyboard to fix the issue
      </Permission>
      <Permission icon={<ShieldCheck />} compact={compact}>
        Only while connected — close RustDesk anytime to disconnect
      </Permission>
    </ul>
  );
}

function Permission({
  icon,
  compact,
  children,
}: {
  icon: ReactNode;
  compact: boolean;
  children: ReactNode;
}) {
  return (
    <li className="flex items-center gap-3 text-sm">
      <span
        className={`flex shrink-0 items-center justify-center rounded-lg bg-muted text-primary [&_svg]:size-4 ${
          compact ? "size-7" : "size-8"
        }`}
      >
        {icon}
      </span>
      {children}
    </li>
  );
}

export function RequestCountdown({ expiresAt }: { expiresAt: string }) {
  const now = useNow(1000);
  const expiry = new Date(expiresAt).getTime();
  const [total] = useState(() => Math.max(expiry - Date.now(), 1));

  const left = expiry - now;
  if (Number.isNaN(left)) return null;

  const fraction = Math.min(Math.max(left / total, 0), 1);
  const urgent = left < 60_000;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs">
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <Clock className="size-3.5" />
          Request expires in
        </span>
        <span
          className={`font-mono font-medium tabular-nums ${urgent ? "text-destructive" : "text-foreground"}`}
        >
          {formatDuration(left)}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-[width] duration-1000 ease-linear ${
            urgent ? "bg-destructive" : "bg-primary"
          }`}
          style={{ width: `${fraction * 100}%` }}
        />
      </div>
    </div>
  );
}

export function ResponseButtons({
  pendingAction,
  onAllow,
  onDecline,
  autoFocus = false,
}: {
  pendingAction: "approve" | "deny" | null;
  onAllow: () => void;
  onDecline: () => void;
  autoFocus?: boolean;
}) {
  return (
    <>
      <Button
        variant="outline"
        size="lg"
        className="h-10"
        disabled={pendingAction !== null}
        onClick={onDecline}
      >
        {pendingAction === "deny" ? <Loader2 className="animate-spin" /> : <X />}
        Decline
      </Button>
      <Button
        size="lg"
        className="h-10"
        disabled={pendingAction !== null}
        onClick={onAllow}
        autoFocus={autoFocus}
      >
        {pendingAction === "approve" ? (
          <Loader2 className="animate-spin" />
        ) : (
          <ShieldCheck />
        )}
        Allow access
      </Button>
    </>
  );
}
