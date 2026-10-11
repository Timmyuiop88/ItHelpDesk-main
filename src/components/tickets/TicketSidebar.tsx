import { AlertCircle, Users, UserPlus, X, LogOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { TicketStatusPills } from "./TicketStatusPills";
import { TicketMeta } from "./TicketMeta";
import { TransferTicketDialog } from "./TransferTicketDialog";
import { EmployeeRemoteAccessCard } from "../remote/EmployeeRemoteAccessCard";
import { RemoteSessionPanel } from "../remote/RemoteSessionPanel";
import { useAssignTicket } from "../../hooks/tickets/useAssignTicket";
import { useUpdateTicket } from "../../hooks/tickets/useUpdateTicket";
import { useResolveTicket } from "../../hooks/tickets/useResolveTicket";
import { useCloseTicket } from "../../hooks/tickets/useCloseTicket";
import { useTicketParticipants } from "../../hooks/tickets/useTicketParticipants";
import { useAddParticipant } from "../../hooks/tickets/useAddParticipant";
import { useRemoveParticipant } from "../../hooks/tickets/useRemoveParticipant";
import { useCurrentTechnicianId } from "../../hooks/technicians/useCurrentTechnicianId";
import { useDepartments } from "../../hooks/departments/useDepartments";
// import { useEmployees } from "../../hooks/employees/useEmployees";
import { useTechnicians } from "../../hooks/technicians/useTechnicians";
import { getApiErrorMessage } from "../../lib/apiError";
import { fullName } from "../../lib/format";
import { getAssigneeId, getParticipantUserId } from "../../lib/tickets";
import type { Ticket, TicketStatus } from "../../types/ticket.types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { useState } from "react";
import { Loader2 } from "lucide-react";

const PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const;

const PRIORITY_COLOR: Record<string, string> = {
  HIGH: "text-red-600 border-red-200 bg-red-50 dark:bg-red-900/30 dark:text-red-300",
  MEDIUM: "text-amber-600 border-amber-200 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-300",
  LOW: "text-slate-600 border-slate-200 bg-slate-50 dark:bg-slate-800 dark:text-slate-300",
};

const SELECT_CLASS = "h-8 rounded-lg border border-input bg-background px-2 text-sm";

interface TicketSidebarProps {
  ticket: Ticket;
  ticketId: string;
  currentUserId?: string;
  role: "employee" | "technician";
  onLeft?: () => void;
}

export function TicketSidebar({
  ticket,
  ticketId,
  currentUserId,
  role,
  onLeft,
}: TicketSidebarProps) {
  const isClosed = ticket.status === "CLOSED";
  const technicianId = useCurrentTechnicianId();
  const assigneeId = getAssigneeId(ticket);
  const unassigned = !assigneeId && ticket.status === "OPEN";
  const assignedToMe = !!assigneeId && assigneeId === technicianId;
  const finished = ticket.status === "RESOLVED" || ticket.status === "CLOSED";
  const canWork =
    ticket.status === "IN_PROGRESS" || ticket.status === "WAITING_FOR_EMPLOYEE";

  const assignTicket = useAssignTicket();
  const updateTicket = useUpdateTicket();
  const resolveTicket = useResolveTicket();
  const closeTicket = useCloseTicket();

  const anyPending =
    assignTicket.isPending ||
    updateTicket.isPending ||
    resolveTicket.isPending ||
    closeTicket.isPending;

  // Which statuses the technician can transition to
  const clickableStatuses: TicketStatus[] = isClosed
    ? []
    : role === "technician"
      ? (["IN_PROGRESS", "WAITING_FOR_EMPLOYEE", "RESOLVED", "CLOSED"] as TicketStatus[]).filter(
          (s) => {
            if (s === "IN_PROGRESS" && !assignedToMe) return false;
            if (s === "WAITING_FOR_EMPLOYEE" && ticket.status !== "IN_PROGRESS") return false;
            if ((s === "RESOLVED" || s === "CLOSED") && !canWork && s !== "CLOSED") return false;
            return true;
          },
        )
      : [];

  const handleStatusSelect = (status: TicketStatus) => {
    if (status === "IN_PROGRESS") {
      // Assign to me then it becomes IN_PROGRESS
      if (!technicianId) return toast.error("Could not match your technician profile.");
      assignTicket.mutate(
        { id: ticketId, payload: { technicianId } },
        {
          onSuccess: () => toast.success("Ticket assigned to you"),
          onError: (e) => toast.error(getApiErrorMessage(e)),
        },
      );
      return;
    }
    if (status === "WAITING_FOR_EMPLOYEE") {
      updateTicket.mutate(
        { id: ticketId, payload: { status: "WAITING_FOR_EMPLOYEE" } },
        {
          onSuccess: () => toast.success("Status updated"),
          onError: (e) => toast.error(getApiErrorMessage(e)),
        },
      );
      return;
    }
    if (status === "RESOLVED") {
      resolveTicket.mutate(ticketId, {
        onSuccess: () => toast.success("Ticket resolved"),
        onError: (e) => toast.error(getApiErrorMessage(e)),
      });
      return;
    }
    if (status === "CLOSED") {
      closeTicket.mutate(ticketId, {
        onSuccess: () => toast.success("Ticket closed"),
        onError: (e) => toast.error(getApiErrorMessage(e)),
      });
      return;
    }
  };

  const handlePriority = (priority: string) => {
    updateTicket.mutate(
      { id: ticketId, payload: { priority } },
      { onError: (e) => toast.error(getApiErrorMessage(e)) },
    );
  };

  const handleEmployeeClose = () => {
    closeTicket.mutate(ticketId, {
      onSuccess: () => toast.success("Ticket closed"),
      onError: (e) => toast.error(getApiErrorMessage(e)),
    });
  };

  return (
    <aside className="flex w-80 shrink-0 flex-col gap-4 overflow-y-auto rounded-xl border border-border bg-card p-4 shadow-sm lg:w-72 xl:w-80">
      {/* Closed banner */}
      {isClosed && (
        <div className="flex items-start gap-2 rounded-lg bg-muted/70 p-3 text-sm text-muted-foreground">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>This ticket is closed — no further actions can be taken.</span>
        </div>
      )}

      {/* Status */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</span>
        <TicketStatusPills
          current={ticket.status}
          clickable={clickableStatuses}
          onSelect={handleStatusSelect}
          isPending={anyPending}
        />
      </div>

      <div className="border-t border-border" />

      {/* Priority */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Priority</span>
        {role === "technician" && !isClosed ? (
          <select
            className={`${SELECT_CLASS} w-full font-medium ${PRIORITY_COLOR[ticket.priority] ?? ""}`}
            value={ticket.priority}
            disabled={isClosed}
            onChange={(e) => handlePriority(e.currentTarget.value)}
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        ) : (
          <span
            className={`inline-flex max-w-max rounded-full border px-3 py-1 text-xs font-semibold ${PRIORITY_COLOR[ticket.priority] ?? "border-border text-foreground"}`}
          >
            {ticket.priority}
          </span>
        )}
      </div>

      <div className="border-t border-border" />

      {/* Meta */}
      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Details</span>
        <TicketMeta ticket={ticket} showRequester showAssignee className="text-xs" />
      </div>

      <div className="border-t border-border" />

      {/* Technician actions */}
      {role === "technician" && !isClosed && (
        <>
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</span>
            <div className="flex flex-col gap-2">
              {unassigned && (
                <Button
                  size="sm"
                  className="w-full"
                  disabled={assignTicket.isPending || !technicianId}
                  onClick={() => {
                    if (!technicianId) return toast.error("Could not match your technician profile.");
                    assignTicket.mutate(
                      { id: ticketId, payload: { technicianId } },
                      {
                        onSuccess: () => toast.success("Ticket assigned to you"),
                        onError: (e) => toast.error(getApiErrorMessage(e)),
                      },
                    );
                  }}
                >
                  Assign to me
                </Button>
              )}
              {assignedToMe && !finished && (
                <TransferTicketDialog ticketId={ticketId} currentTechnicianId={technicianId} />
              )}
              {ticket.status === "IN_PROGRESS" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  disabled={updateTicket.isPending}
                  onClick={() =>
                    updateTicket.mutate(
                      { id: ticketId, payload: { status: "WAITING_FOR_EMPLOYEE" } },
                      {
                        onSuccess: () => toast.success("Waiting for employee"),
                        onError: (e) => toast.error(getApiErrorMessage(e)),
                      },
                    )
                  }
                >
                  Waiting for employee
                </Button>
              )}
            </div>
          </div>
          <div className="border-t border-border" />
        </>
      )}

      {/* Employee close action */}
      {role === "employee" && !isClosed && (
        <>
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</span>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              disabled={closeTicket.isPending}
              onClick={handleEmployeeClose}
            >
              Close ticket
            </Button>
          </div>
          <div className="border-t border-border" />
        </>
      )}

      {/* Remote access */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Remote</span>
        {role === "employee" ? (
          <EmployeeRemoteAccessCard ticket={ticket} />
        ) : (
          <RemoteSessionPanel
            ticketId={ticketId}
            unavailableReason={
              isClosed || ticket.status === "RESOLVED"
                ? "Remote access isn't available once a ticket is resolved or closed."
                : !assignedToMe
                  ? "Assign this ticket to yourself to request remote access."
                  : undefined
            }
          />
        )}
      </div>

      <div className="border-t border-border" />

      {/* Participants */}
      <ParticipantsSidebarSection
        ticketId={ticketId}
        currentUserId={currentUserId}
        canManage={role === "technician" && assignedToMe && !isClosed}
        isClosed={isClosed}
        onLeft={onLeft}
      />
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Inline participants section (no card wrapping — it sits inside the sidebar)
// ─────────────────────────────────────────────────────────────────────────────

interface ParticipantsSidebarSectionProps {
  ticketId: string;
  currentUserId?: string;
  canManage: boolean;
  isClosed: boolean;
  onLeft?: () => void;
}

function ParticipantsSidebarSection({
  ticketId,
  currentUserId,
  canManage,
  onLeft,
}: ParticipantsSidebarSectionProps) {
  const participants = useTicketParticipants(ticketId);
  const remove = useRemoveParticipant();

  const memberIds = new Set(
    (participants.data ?? []).map(getParticipantUserId).filter(Boolean) as string[],
  );
  const isParticipant = !!currentUserId && memberIds.has(currentUserId);

  const removeUser = (userId: string, leaving: boolean) => {
    remove.mutate(
      { id: ticketId, userId },
      {
        onSuccess: () => {
          toast.success(leaving ? "You left the conversation" : "Participant removed");
          if (leaving) onLeft?.();
        },
        onError: (e) => toast.error(getApiErrorMessage(e)),
      },
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Users className="size-3.5 text-muted-foreground" />
        <span className="flex-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          People
        </span>
        {canManage && <AddParticipantButton ticketId={ticketId} excludeUserIds={memberIds} />}
        {!canManage && isParticipant && (
          <Button
            variant="ghost"
            size="icon-xs"
            disabled={remove.isPending}
            onClick={() => removeUser(currentUserId!, true)}
            aria-label="Leave ticket"
          >
            <LogOut className="size-3.5" />
          </Button>
        )}
      </div>

      {participants.isLoading && (
        <p className="text-xs text-muted-foreground">Loading…</p>
      )}
      {participants.data?.length === 0 && (
        <p className="text-xs text-muted-foreground">
          {canManage ? "No participants yet. Add someone." : "No participants."}
        </p>
      )}

      <ul className="flex flex-col gap-1.5">
        {participants.data?.map((participant) => {
          const userId = getParticipantUserId(participant);
          const isSelf = userId === currentUserId;
          const name = fullName(participant.user) || participant.user?.email || "Unknown";
          return (
            <li
              key={userId ?? participant.id}
              className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2 text-sm"
            >
              {/* Avatar */}
              <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-[9px] font-semibold uppercase text-muted-foreground">
                {name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("")}
              </div>
              <span className="min-w-0 flex-1 truncate text-xs font-medium">
                {name}
                {isSelf && <span className="text-muted-foreground"> (you)</span>}
              </span>
              {participant.user?.role && (
                <span className="shrink-0 text-[9px] uppercase tracking-wide text-muted-foreground">
                  {participant.user.role}
                </span>
              )}
              {(canManage || isSelf) && userId && (
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label={isSelf ? "Leave" : "Remove"}
                  disabled={remove.isPending}
                  onClick={() => removeUser(userId, isSelf)}
                >
                  <X className="size-3" />
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Add participant button + dialog
// ─────────────────────────────────────────────────────────────────────────────

function AddParticipantButton({
  ticketId,
  excludeUserIds,
}: {
  ticketId: string;
  excludeUserIds: Set<string>;
}) {
  const [open, setOpen] = useState(false);
  const [departmentId, setDepartmentId] = useState("");
  // Only technicians can be added for now; employee selection is disabled.
  // const [kind, setKind] = useState<"employees" | "technicians">("employees");
  const [selectedUserId, setSelectedUserId] = useState("");
  const departments = useDepartments({ enabled: open });
  const listEnabled = open && !!departmentId;
  // const employees = useEmployees(departmentId, { enabled: listEnabled && kind === "employees" });
  const technicians = useTechnicians(departmentId, { enabled: listEnabled });
  const add = useAddParticipant();

  // const source = kind === "employees" ? employees : technicians;
  const source = technicians;
  const people = (source.data ?? [])
    .map((person) => ({
      userId: person.user?.id ?? person.userId ?? "",
      name: fullName(person.user) || person.employeeNumber || "Unnamed",
      detail: [
        // "jobTitle" in person ? person.jobTitle : null,
        person.user?.email,
      ].filter(Boolean).join(" · "),
    }))
    .filter((p) => p.userId && !excludeUserIds.has(p.userId));

  const handleOpenChange = (next: boolean) => {
    if (next) { setDepartmentId(""); setSelectedUserId(""); }
    setOpen(next);
  };

  const submit = () => {
    add.mutate(
      { id: ticketId, userId: selectedUserId },
      {
        onSuccess: () => { setOpen(false); toast.success("Added to the conversation"); },
        onError: (e) => toast.error(getApiErrorMessage(e)),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon-xs" aria-label="Add technician">
          <UserPlus className="size-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a technician to this ticket</DialogTitle>
          <DialogDescription>
            They'll be able to view the ticket and comment, but not close it.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="dept">Department</Label>
            <select
              id="dept"
              className={SELECT_CLASS}
              value={departmentId}
              onChange={(e) => { setDepartmentId(e.currentTarget.value); setSelectedUserId(""); }}
            >
              <option value="">{departments.isLoading ? "Loading…" : "Choose department"}</option>
              {departments.data?.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          {/* <div className="flex flex-col gap-2">
            <Label htmlFor="kind">Role</Label>
            <select
              id="kind"
              className={SELECT_CLASS}
              value={kind}
              onChange={(e) => { setKind(e.currentTarget.value as typeof kind); setSelectedUserId(""); }}
            >
              <option value="employees">Employees</option>
              <option value="technicians">Technicians</option>
            </select>
          </div> */}
        </div>
        <div className="flex max-h-56 flex-col gap-2 overflow-y-auto pr-1" role="radiogroup">
          {!departmentId && (
            <p className="py-4 text-center text-sm text-muted-foreground">Pick a department to see its technicians.</p>
          )}
          {departmentId && source.isLoading && (
            <p className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Loading people…
            </p>
          )}
          {departmentId && source.isSuccess && people.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">No other technicians to add from this department.</p>
          )}
          {people.map((person) => {
            const selected = person.userId === selectedUserId;
            return (
              <button
                key={person.userId}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setSelectedUserId(person.userId)}
                className={`flex flex-col rounded-lg border p-3 text-left transition-all ${
                  selected
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-border hover:border-primary/40 hover:bg-muted/50"
                }`}
              >
                <span className="text-sm font-medium">{person.name}</span>
                {person.detail && (
                  <span className="text-xs text-muted-foreground">{person.detail}</span>
                )}
              </button>
            );
          })}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!selectedUserId || add.isPending}>
            {add.isPending ? <Loader2 className="animate-spin" /> : <UserPlus />}
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
