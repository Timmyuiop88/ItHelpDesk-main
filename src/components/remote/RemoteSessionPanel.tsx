import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Loader2,
  MonitorSmartphone,
  MonitorUp,
  PhoneOff,
  RotateCcw,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useDevices } from "../../hooks/devices/useDevices";
import { useEndSession } from "../../hooks/remote-sessions/useEndSession";
import { useRequestSession } from "../../hooks/remote-sessions/useRequestSession";
import { useSaveSessionNotes } from "../../hooks/remote-sessions/useSaveSessionNotes";
import {
  isLiveStatus,
  setTechnicianSession,
  updateTechnicianSession,
  type TechnicianSessionState,
} from "../../hooks/technicianSessionStore";
import { formatDuration, useNow } from "../../hooks/useNow";
import { useTechnicianSession } from "../../hooks/useTechnicianSocket";
import { getApiErrorMessage } from "../../lib/apiError";
import { connectToSession, openRustdesk } from "../../lib/remoteConnect";
import type { Device } from "../../types/device.types";

interface RemoteSessionPanelProps {
  ticketId: string;
  defaultDeviceId?: string;
  disabled?: boolean;
}

const STEPS = ["Request", "Employee approval", "Connected"] as const;

function stepIndex(session: TechnicianSessionState | null): number {
  switch (session?.status) {
    case "REQUESTED":
    case "DENIED":
      return 1;
    case "APPROVED":
    case "ACTIVE":
    case "ENDED":
      return 2;
    default:
      return 0;
  }
}

export function RemoteSessionPanel({
  ticketId,
  defaultDeviceId,
  disabled = false,
}: RemoteSessionPanelProps) {
  const stored = useTechnicianSession();
  const session = stored?.ticketId === ticketId ? stored : null;
  const busyElsewhere =
    stored !== null && stored.ticketId !== ticketId && isLiveStatus(stored.status);
  const [pickerOpen, setPickerOpen] = useState(false);

  const current = stepIndex(session);
  const failed = session?.status === "DENIED";

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      <header className="flex items-center justify-between gap-4 border-b border-border bg-muted/50 px-5 py-3">
        <div className="flex items-center gap-2">
          <MonitorUp className="size-4 text-primary" />
          <h2 className="text-sm font-semibold">Remote support</h2>
        </div>
        <ol className="hidden items-center gap-2 text-xs sm:flex">
          {STEPS.map((label, index) => {
            const done = index < current || (index === current && session?.status === "ACTIVE");
            const active = index === current && !done;
            return (
              <li key={label} className="flex items-center gap-2">
                <span
                  className={`flex size-5 items-center justify-center rounded-full text-[10px] font-semibold transition-colors ${
                    done
                      ? "bg-primary text-primary-foreground"
                      : active && failed
                        ? "bg-destructive/15 text-destructive"
                        : active
                          ? "bg-primary/15 text-primary ring-1 ring-primary/40"
                          : "bg-muted text-muted-foreground"
                  }`}
                >
                  {done ? <Check className="size-3" /> : index + 1}
                </span>
                <span className={active || done ? "font-medium" : "text-muted-foreground"}>
                  {label}
                </span>
                {index < STEPS.length - 1 && (
                  <span className="h-px w-6 bg-border" aria-hidden />
                )}
              </li>
            );
          })}
        </ol>
      </header>

      <div className="p-5">
        {busyElsewhere && !session ? (
          <StateBlock
            tone="muted"
            icon={<MonitorSmartphone className="size-5" />}
            title="You have a remote session on another ticket"
            description="Finish or end it before starting a new one."
            actions={
              <Button asChild variant="outline" size="sm">
                <Link to={`/technician/tickets/${stored.ticketId}`}>Go to that ticket</Link>
              </Button>
            }
          />
        ) : !session ? (
          <IdleState disabled={disabled} onRequest={() => setPickerOpen(true)} />
        ) : session.status === "REQUESTED" ? (
          <WaitingState session={session} />
        ) : session.status === "APPROVED" ? (
          <ApprovedState session={session} />
        ) : session.status === "ACTIVE" ? (
          <ActiveState session={session} />
        ) : session.status === "DENIED" ? (
          <DeniedState session={session} onRetry={() => setPickerOpen(true)} />
        ) : (
          <EndedState session={session} onNew={() => setPickerOpen(true)} />
        )}
      </div>

      <DevicePickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        ticketId={ticketId}
        defaultDeviceId={defaultDeviceId}
      />
    </section>
  );
}

type Tone = "muted" | "waiting" | "success" | "danger";

const toneStyles: Record<Tone, string> = {
  muted: "bg-muted text-muted-foreground",
  waiting: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  success: "bg-primary/10 text-primary",
  danger: "bg-destructive/10 text-destructive",
};

function StateBlock({
  tone,
  icon,
  title,
  description,
  meta,
  actions,
  children,
}: {
  tone: Tone;
  icon: ReactNode;
  title: string;
  description?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-4">
        <div className={`flex size-11 shrink-0 items-center justify-center rounded-full ${toneStyles[tone]}`}>
          {icon}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium">{title}</p>
            {meta}
          </div>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {children}
      {actions && <div className="flex flex-wrap gap-2 sm:pl-15">{actions}</div>}
    </div>
  );
}

function Timer({ since, prefix }: { since: number; prefix?: string }) {
  const now = useNow();
  return (
    <span className="font-mono text-xs tabular-nums text-muted-foreground">
      {prefix}
      {formatDuration(now - since)}
    </span>
  );
}

function IdleState({ disabled, onRequest }: { disabled: boolean; onRequest: () => void }) {
  return (
    <StateBlock
      tone="muted"
      icon={<MonitorUp className="size-5" />}
      title="View the employee's screen"
      description={
        disabled
          ? "Remote access isn't available for closed tickets."
          : "The employee gets a prompt to approve. Once they accept, RustDesk opens automatically."
      }
      actions={
        <Button onClick={onRequest} disabled={disabled}>
          <MonitorUp />
          Request remote access
        </Button>
      }
    />
  );
}

function WaitingState({ session }: { session: TechnicianSessionState }) {
  return (
    <StateBlock
      tone="waiting"
      icon={
        <span className="relative flex size-5 items-center justify-center">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-400/50" />
          <Loader2 className="relative size-5 animate-spin" />
        </span>
      }
      title="Waiting for the employee to respond"
      meta={<Timer since={session.since} prefix="Waiting " />}
      description={
        <>
          A prompt is showing on{" "}
          <span className="font-medium text-foreground">
            {session.deviceHostname || "the employee's device"}
          </span>
          . The request expires automatically if nobody answers.
        </>
      }
    />
  );
}

function ApprovedState({ session }: { session: TechnicianSessionState }) {
  const [connecting, setConnecting] = useState(false);

  const connect = async () => {
    if (!session.rustdeskLink) return;
    setConnecting(true);
    await connectToSession(session.id, session.rustdeskLink);
    setConnecting(false);
  };

  return (
    <StateBlock
      tone="success"
      icon={<ShieldCheck className="size-5" />}
      title="Access approved"
      description="Open RustDesk to connect to the employee's screen."
      actions={
        <>
          <Button onClick={() => void connect()} disabled={connecting || !session.rustdeskLink}>
            {connecting ? <Loader2 className="animate-spin" /> : <ExternalLink />}
            Connect with RustDesk
          </Button>
          <CopyLinkButton link={session.rustdeskLink} />
        </>
      }
    />
  );
}

function ActiveState({ session }: { session: TechnicianSessionState }) {
  const endSession = useEndSession();

  const handleEnd = () => {
    endSession.mutate(session.id, {
      onSuccess: () => {
        updateTechnicianSession(session.id, { status: "ENDED" });
        toast.success("Session ended");
      },
      onError: (error) => toast.error(getApiErrorMessage(error)),
    });
  };

  return (
    <StateBlock
      tone="success"
      icon={
        <span className="relative flex size-3">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
          <span className="relative inline-flex size-3 rounded-full bg-primary" />
        </span>
      }
      title="Live session"
      meta={
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2 py-0.5 font-mono text-xs tabular-nums text-primary">
          <Timer since={session.since} />
        </span>
      }
      description={
        <>
          Connected to{" "}
          <span className="font-medium text-foreground">
            {session.deviceHostname || "the employee's device"}
          </span>{" "}
          through RustDesk.
        </>
      }
      actions={
        <>
          {session.rustdeskLink && (
            <Button variant="outline" onClick={() => void openRustdesk(session.rustdeskLink!)}>
              <ExternalLink />
              Reopen RustDesk
            </Button>
          )}
          <CopyLinkButton link={session.rustdeskLink} />
          <Button variant="destructive" onClick={handleEnd} disabled={endSession.isPending}>
            {endSession.isPending ? <Loader2 className="animate-spin" /> : <PhoneOff />}
            End session
          </Button>
        </>
      }
    />
  );
}

function DeniedState({
  session,
  onRetry,
}: {
  session: TechnicianSessionState;
  onRetry: () => void;
}) {
  return (
    <StateBlock
      tone="danger"
      icon={<XCircle className="size-5" />}
      title="Request declined"
      description={`The employee${session.deviceHostname ? ` on ${session.deviceHostname}` : ""} declined remote access. Consider adding a comment to explain why you need it.`}
      actions={
        <>
          <Button onClick={onRetry}>
            <RotateCcw />
            Try again
          </Button>
          <Button variant="ghost" onClick={() => setTechnicianSession(null)}>
            Dismiss
          </Button>
        </>
      }
    />
  );
}

function EndedState({
  session,
  onNew,
}: {
  session: TechnicianSessionState;
  onNew: () => void;
}) {
  const saveNotes = useSaveSessionNotes();
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(false);

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    saveNotes.mutate(
      { id: session.id, notes },
      {
        onSuccess: () => {
          setSaved(true);
          toast.success("Session notes saved");
        },
        onError: (error) => toast.error(getApiErrorMessage(error)),
      },
    );
  };

  return (
    <StateBlock
      tone="muted"
      icon={<CheckCircle2 className="size-5" />}
      title="Session ended"
      description={saved ? "Notes saved to the session record." : "Write down what you did so the next person has context."}
      actions={
        saved ? (
          <>
            <Button variant="outline" onClick={onNew}>
              <MonitorUp />
              New session
            </Button>
            <Button variant="ghost" onClick={() => setTechnicianSession(null)}>
              Done
            </Button>
          </>
        ) : undefined
      }
    >
      {!saved && (
        <form className="flex flex-col gap-2 sm:pl-15" onSubmit={handleSave}>
          <Textarea
            value={notes}
            onChange={(event) => setNotes(event.currentTarget.value)}
            placeholder="What did you check or fix? Any follow-up needed?"
            className="min-h-24"
            required
          />
          <div className="flex gap-2">
            <Button type="submit" disabled={saveNotes.isPending || !notes.trim()}>
              {saveNotes.isPending && <Loader2 className="animate-spin" />}
              Save notes
            </Button>
            <Button type="button" variant="ghost" onClick={() => setTechnicianSession(null)}>
              Skip
            </Button>
          </div>
        </form>
      )}
    </StateBlock>
  );
}

function CopyLinkButton({ link }: { link?: string }) {
  const [copied, setCopied] = useState(false);
  if (!link) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Could not copy the link");
    }
  };

  return (
    <Button variant="outline" onClick={() => void copy()}>
      {copied ? <Check /> : <Copy />}
      {copied ? "Copied" : "Copy link"}
    </Button>
  );
}

function DevicePickerDialog({
  open,
  onOpenChange,
  ticketId,
  defaultDeviceId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketId: string;
  defaultDeviceId?: string;
}) {
  const devices = useDevices();
  const requestSession = useRequestSession();
  const [selectedId, setSelectedId] = useState("");

  const handleOpenChange = (next: boolean) => {
    if (next) setSelectedId(defaultDeviceId ?? "");
    onOpenChange(next);
  };

  const list = [...(devices.data ?? [])].sort((a, b) => {
    if (a.id === defaultDeviceId) return -1;
    if (b.id === defaultDeviceId) return 1;
    return Number(b.status === "ONLINE") - Number(a.status === "ONLINE");
  });
  const selected = list.find((device) => device.id === selectedId);

  const submit = () => {
    if (!selected) return;
    requestSession.mutate(
      { ticketId, deviceId: selected.id },
      {
        onSuccess: (created) => {
          setTechnicianSession({
            id: created.id,
            status: "REQUESTED",
            ticketId,
            deviceHostname: selected.hostname,
            since: Date.now(),
          });
          onOpenChange(false);
          toast.success("Request sent", {
            description: `Waiting for approval on ${selected.hostname || "the device"}.`,
          });
        },
        onError: (error) => toast.error(getApiErrorMessage(error)),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="gap-5 p-6 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Request remote access</DialogTitle>
          <DialogDescription>
            Choose the device to connect to. The employee must approve before you can see their screen.
          </DialogDescription>
        </DialogHeader>

        <div className="flex max-h-72 flex-col gap-2 overflow-y-auto pr-1" role="radiogroup">
          {devices.isLoading && (
            <p className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Loading devices…
            </p>
          )}
          {!devices.isLoading && list.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">No devices registered yet.</p>
          )}
          {list.map((device) => (
            <DeviceOption
              key={device.id}
              device={device}
              linked={device.id === defaultDeviceId}
              selected={device.id === selectedId}
              onSelect={() => setSelectedId(device.id)}
            />
          ))}
        </div>

        {selected && !selected.rustdeskId && (
          <p className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            This device hasn't reported a RustDesk ID, so the connection may fail. Ask the employee to open the Device page in the app.
          </p>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!selected || requestSession.isPending}>
            {requestSession.isPending ? <Loader2 className="animate-spin" /> : <MonitorUp />}
            Send request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeviceOption({
  device,
  linked,
  selected,
  onSelect,
}: {
  device: Device;
  linked: boolean;
  selected: boolean;
  onSelect: () => void;
}) {
  const online = device.status === "ONLINE";

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-all ${
        selected
          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
          : "border-border hover:border-primary/40 hover:bg-muted/50"
      }`}
    >
      <div className="relative flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
        <MonitorSmartphone className="size-4 text-muted-foreground" />
        <span
          className={`absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full ring-2 ring-card ${
            online ? "bg-emerald-500" : "bg-muted-foreground/40"
          }`}
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 truncate text-sm font-medium">
          {device.hostname || device.id}
          {linked && (
            <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
              On ticket
            </span>
          )}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {online ? "Online" : "Offline"}
          {device.operatingSystem ? ` · ${device.operatingSystem}` : ""}
          {!device.rustdeskId ? " · No RustDesk ID" : ""}
        </p>
      </div>
      <span
        className={`flex size-4 shrink-0 items-center justify-center rounded-full border ${
          selected ? "border-primary bg-primary" : "border-input"
        }`}
      >
        {selected && <span className="size-1.5 rounded-full bg-primary-foreground" />}
      </span>
    </button>
  );
}
