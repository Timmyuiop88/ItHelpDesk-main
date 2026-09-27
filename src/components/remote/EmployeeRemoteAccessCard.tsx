import { AlertTriangle, Loader2, Monitor, MonitorUp } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDuration, useNow } from "../../hooks/useNow";
import type { Ticket } from "../../types/ticket.types";
import { useDeviceAgentState } from "../DeviceAgentContext";
import {
  PermissionList,
  RequestCountdown,
  ResponseButtons,
} from "./AccessRequestParts";
import { useEmployeeRemote } from "./EmployeeRemoteContext";

export function EmployeeRemoteAccessCard({ ticket }: { ticket: Ticket }) {
  const remote = useEmployeeRemote();
  const agent = useDeviceAgentState();
  const request = remote.requestFor(ticket);
  const session = remote.sessionFor(ticket);
  const now = useNow(1000, session !== null);

  if (request) {
    return (
      <section className="overflow-hidden rounded-xl border-2 border-primary/40 bg-card shadow-sm ring-4 ring-primary/10 animate-in fade-in-0 slide-in-from-top-2">
        <div className="flex items-center gap-3 bg-primary/10 px-5 py-3">
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
            <span className="relative inline-flex size-2.5 rounded-full bg-primary" />
          </span>
          <p className="text-sm font-semibold">Remote access requested</p>
          <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Monitor className="size-3.5" />
            {request.deviceHostname || "This device"}
          </span>
        </div>
        <div className="flex flex-col gap-4 p-5">
          <p className="text-sm text-muted-foreground">
            The technician working on this ticket wants to view your screen. If you allow, they can:
          </p>
          <PermissionList compact />
          <RequestCountdown key={request.sessionId} expiresAt={request.expiresAt} />
          <div className="grid grid-cols-2 gap-3 sm:max-w-sm">
            <ResponseButtons
              pendingAction={remote.pendingAction}
              onAllow={remote.allow}
              onDecline={remote.decline}
            />
          </div>
        </div>
      </section>
    );
  }

  if (session) {
    const live = session.status === "LIVE";
    return (
      <section
        className={`flex items-center gap-4 rounded-xl border p-5 ${
          live ? "border-primary/30 bg-primary/5" : "border-amber-300/60 bg-amber-50 dark:bg-amber-500/10"
        }`}
      >
        <div
          className={`flex size-11 shrink-0 items-center justify-center rounded-full ${
            live ? "bg-primary/10 text-primary" : "bg-amber-100 text-amber-700 dark:bg-amber-500/20"
          }`}
        >
          {live ? (
            <span className="relative flex size-3">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
              <span className="relative inline-flex size-3 rounded-full bg-primary" />
            </span>
          ) : (
            <Loader2 className="size-5 animate-spin" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium">
            {live ? "IT Support is viewing your screen" : "Waiting for the technician to connect"}
          </p>
          <p className="text-sm text-muted-foreground">
            {live
              ? "Close the RustDesk window at any time to disconnect."
              : "You approved access. RustDesk will connect in a moment."}
          </p>
        </div>
        <span className="rounded-full bg-background px-2.5 py-1 font-mono text-xs tabular-nums text-muted-foreground ring-1 ring-border">
          {formatDuration(now - session.since)}
        </span>
      </section>
    );
  }

  if (ticket.status === "CLOSED") {
    return null;
  }

  const missingRustdesk = agent.device !== null && !agent.device.rustdeskId;

  return (
    <section className="flex items-start gap-4 rounded-xl border border-border bg-card p-5">
      <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <MonitorUp className="size-5" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="font-medium">Remote support</p>
        <p className="text-sm text-muted-foreground">
          If your technician needs to see your screen, they'll send a request and you'll be asked to approve it here. Nobody can connect without your permission.
        </p>
        {missingRustdesk && (
          <p className="mt-2 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <span>
              Your RustDesk ID isn't set up yet, so remote support won't work.{" "}
              <Link to="/employee/device" className="font-medium underline underline-offset-2">
                Add it on the Device page
              </Link>
              .
            </span>
          </p>
        )}
      </div>
    </section>
  );
}
