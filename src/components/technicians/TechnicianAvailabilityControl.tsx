import { CalendarClock, Check, Loader2, PauseCircle, PlayCircle } from "lucide-react";
import { useState, type ReactNode } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCurrentTechnician } from "../../hooks/technicians/useCurrentTechnicianId";
import { useUpdateTechnicianAvailability } from "../../hooks/technicians/useTechnicianAvailability";
import { getApiErrorMessage } from "../../lib/apiError";
import {
  technicianAvailabilityState,
  type TechnicianAvailabilityPayload,
  type TechnicianAvailabilityState,
} from "../../types/technician.types";

interface TechnicianAvailabilityControlProps {
  collapsed?: boolean;
}

function formatUntil(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function stateLabel(state: TechnicianAvailabilityState): string {
  switch (state.kind) {
    case "away":
      return `Away until ${formatUntil(state.until)}`;
    case "paused":
      return "Paused new assignments";
    default:
      return "Available for new assignments";
  }
}

const DOT_CLASS: Record<TechnicianAvailabilityState["kind"], string> = {
  available: "bg-emerald-500",
  paused: "bg-amber-500",
  away: "bg-muted-foreground",
};

function toLocalInputValue(iso: string): string {
  const date = new Date(iso);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function OptionButton({
  active,
  icon,
  title,
  description,
  onClick,
  disabled,
}: {
  active: boolean;
  icon: ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-start gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors disabled:opacity-60 ${
        active ? "border-primary/40 bg-primary/5" : "border-border hover:bg-muted/50"
      }`}
    >
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{title}</span>
        <span className="block text-xs text-muted-foreground">{description}</span>
      </span>
      {active && <Check className="mt-0.5 size-4 shrink-0 text-primary" />}
    </button>
  );
}

export function TechnicianAvailabilityControl({
  collapsed = false,
}: TechnicianAvailabilityControlProps) {
  const technician = useCurrentTechnician();
  const update = useUpdateTechnicianAvailability();
  const state = technicianAvailabilityState(technician);

  const [open, setOpen] = useState(false);
  const [awayFormOpen, setAwayFormOpen] = useState(false);
  const [awayUntil, setAwayUntil] = useState("");
  const [awayReason, setAwayReason] = useState("");

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setAwayFormOpen(false);
      setAwayUntil(state.kind === "away" ? toLocalInputValue(state.until) : "");
      setAwayReason(state.kind === "away" ? (state.reason ?? "") : "");
    }
    setOpen(next);
  };

  const save = (payload: TechnicianAvailabilityPayload, message: string) => {
    update.mutate(payload, {
      onSuccess: () => {
        toast.success(message);
        setOpen(false);
      },
      onError: (e) => toast.error(getApiErrorMessage(e)),
    });
  };

  const setAvailable = () =>
    save(
      { acceptsAssignments: true, excludedUntil: null, excludedReason: null },
      "You're back in the rotation",
    );

  const setPaused = () =>
    save(
      { acceptsAssignments: false, excludedUntil: null, excludedReason: null },
      "New assignments paused",
    );

  const submitAway = () => {
    if (!awayUntil) {
      return;
    }
    const until = new Date(awayUntil);
    if (until.getTime() <= Date.now()) {
      toast.error("Pick a time in the future");
      return;
    }
    save(
      {
        acceptsAssignments: true,
        excludedUntil: until.toISOString(),
        excludedReason: awayReason.trim() || null,
      },
      `Away until ${formatUntil(until.toISOString())}`,
    );
  };

  const label = stateLabel(state);

  const trigger = (
    <Button
      variant="outline"
      size={collapsed ? "icon-lg" : "sm"}
      className={collapsed ? "relative size-9" : "w-full justify-start gap-2"}
      disabled={update.isPending}
      aria-label={collapsed ? `Availability: ${label}` : undefined}
      onClick={() => handleOpenChange(true)}
    >
      {update.isPending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <span className={`size-2.5 shrink-0 rounded-full ${DOT_CLASS[state.kind]}`} />
      )}
      {!collapsed && <span className="truncate">{label}</span>}
    </Button>
  );

  return (
    <>
      {collapsed ? (
        <Tooltip>
          <TooltipTrigger asChild>{trigger}</TooltipTrigger>
          <TooltipContent side="right">{label}</TooltipContent>
        </Tooltip>
      ) : (
        trigger
      )}

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Availability</DialogTitle>
            <DialogDescription>
              Controls whether new tickets are auto-assigned to you. Tickets you already hold
              stay with you.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <OptionButton
              active={state.kind === "available"}
              icon={<PlayCircle className="size-4" />}
              title="Available"
              description="Receive new tickets in the rotation"
              onClick={setAvailable}
              disabled={update.isPending}
            />
            <OptionButton
              active={state.kind === "paused"}
              icon={<PauseCircle className="size-4" />}
              title="Pause new assignments"
              description="Stay signed in but skip the rotation"
              onClick={setPaused}
              disabled={update.isPending}
            />
            <OptionButton
              active={state.kind === "away" || awayFormOpen}
              icon={<CalendarClock className="size-4" />}
              title={state.kind === "away" ? label : "Away until…"}
              description={
                state.kind === "away" && state.reason
                  ? state.reason
                  : "Skip the rotation until a date, e.g. leave"
              }
              onClick={() => setAwayFormOpen(true)}
              disabled={update.isPending}
            />

            {awayFormOpen && (
              <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="away-until">Back on</Label>
                  <Input
                    id="away-until"
                    type="datetime-local"
                    value={awayUntil}
                    onChange={(e) => setAwayUntil(e.currentTarget.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="away-reason">Reason (optional)</Label>
                  <Input
                    id="away-reason"
                    value={awayReason}
                    placeholder="On leave"
                    maxLength={200}
                    onChange={(e) => setAwayReason(e.currentTarget.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {awayFormOpen && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setAwayFormOpen(false)}>
                Cancel
              </Button>
              <Button onClick={submitAway} disabled={!awayUntil || update.isPending}>
                {update.isPending && <Loader2 className="size-4 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
