import { Loader2, LogOut, UserPlus, Users, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useDepartments } from "../../hooks/departments/useDepartments";
import { useEmployees } from "../../hooks/employees/useEmployees";
import { useTechnicians } from "../../hooks/technicians/useTechnicians";
import { useAddParticipant } from "../../hooks/tickets/useAddParticipant";
import { useRemoveParticipant } from "../../hooks/tickets/useRemoveParticipant";
import { useTicketParticipants } from "../../hooks/tickets/useTicketParticipants";
import { getApiErrorMessage } from "../../lib/apiError";
import { fullName } from "../../lib/format";
import { getParticipantUserId } from "../../lib/tickets";

const SELECT_CLASS =
  "h-8 rounded-lg border border-input bg-background px-2 text-sm";

interface ParticipantsPanelProps {
  ticketId: string;
  currentUserId?: string;
  canManage: boolean;
  onLeft?: () => void;
}

export function ParticipantsPanel({
  ticketId,
  currentUserId,
  canManage,
  onLeft,
}: ParticipantsPanelProps) {
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
        onError: (error) => toast.error(getApiErrorMessage(error)),
      },
    );
  };

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <Users className="size-4 text-muted-foreground" />
        <h2 className="flex-1 font-medium">People on this ticket</h2>
        {canManage && (
          <AddParticipantDialog ticketId={ticketId} excludeUserIds={memberIds} />
        )}
        {!canManage && isParticipant && (
          <Button
            variant="ghost"
            size="sm"
            disabled={remove.isPending}
            onClick={() => removeUser(currentUserId!, true)}
          >
            <LogOut />
            Leave
          </Button>
        )}
      </div>

      {participants.isLoading && (
        <p className="text-sm text-muted-foreground">Loading participants...</p>
      )}
      {participants.isError && (
        <p className="text-sm text-destructive">Failed to load participants.</p>
      )}
      {participants.data?.length === 0 && (
        <p className="text-sm text-muted-foreground">
          {canManage
            ? "Add someone from any department to bring them into the conversation."
            : "No one else has been added to this ticket."}
        </p>
      )}

      <ul className="flex flex-wrap gap-2">
        {participants.data?.map((participant) => {
          const userId = getParticipantUserId(participant);
          const isSelf = userId === currentUserId;
          return (
            <li
              key={userId ?? participant.id}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-background py-1 pr-1 pl-3 text-sm"
            >
              <span>
                {fullName(participant.user) || participant.user?.email || "Unknown user"}
                {isSelf && <span className="text-muted-foreground"> (you)</span>}
              </span>
              {participant.user?.role && (
                <span className="text-[10px] text-muted-foreground uppercase">
                  {participant.user.role}
                </span>
              )}
              {(canManage || isSelf) && userId ? (
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label={isSelf ? "Leave" : "Remove"}
                  disabled={remove.isPending}
                  onClick={() => removeUser(userId, isSelf)}
                >
                  <X />
                </Button>
              ) : (
                <span className="w-1" />
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

interface PersonOption {
  userId: string;
  name: string;
  detail: string;
}

function AddParticipantDialog({
  ticketId,
  excludeUserIds,
}: {
  ticketId: string;
  excludeUserIds: Set<string>;
}) {
  const [open, setOpen] = useState(false);
  const [departmentId, setDepartmentId] = useState("");
  const [kind, setKind] = useState<"employees" | "technicians">("employees");
  const [selectedUserId, setSelectedUserId] = useState("");
  const departments = useDepartments({ enabled: open });
  const listEnabled = open && !!departmentId;
  const employees = useEmployees(departmentId, {
    enabled: listEnabled && kind === "employees",
  });
  const technicians = useTechnicians(departmentId, {
    enabled: listEnabled && kind === "technicians",
  });
  const add = useAddParticipant();

  const source = kind === "employees" ? employees : technicians;
  const people: PersonOption[] = (source.data ?? [])
    .map((person) => ({
      userId: person.user?.id ?? person.userId ?? "",
      name: fullName(person.user) || person.employeeNumber || "Unnamed",
      detail: [
        "jobTitle" in person ? person.jobTitle : null,
        person.user?.email,
      ]
        .filter(Boolean)
        .join(" · "),
    }))
    .filter((person) => person.userId && !excludeUserIds.has(person.userId));

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setDepartmentId("");
      setSelectedUserId("");
    }
    setOpen(next);
  };

  const submit = () => {
    add.mutate(
      { id: ticketId, userId: selectedUserId },
      {
        onSuccess: () => {
          setOpen(false);
          toast.success("Added to the conversation");
        },
        onError: (error) => toast.error(getApiErrorMessage(error)),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus />
          Add person
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add someone to this ticket</DialogTitle>
          <DialogDescription>
            They'll be able to view the ticket and comment on it, but not close it.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="participant-department">Department</Label>
            <select
              id="participant-department"
              className={SELECT_CLASS}
              value={departmentId}
              onChange={(event) => {
                setDepartmentId(event.currentTarget.value);
                setSelectedUserId("");
              }}
            >
              <option value="">
                {departments.isLoading ? "Loading..." : "Choose a department"}
              </option>
              {departments.data?.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="participant-kind">Role</Label>
            <select
              id="participant-kind"
              className={SELECT_CLASS}
              value={kind}
              onChange={(event) => {
                setKind(event.currentTarget.value as typeof kind);
                setSelectedUserId("");
              }}
            >
              <option value="employees">Employees</option>
              <option value="technicians">Technicians</option>
            </select>
          </div>
        </div>

        <div className="flex max-h-64 flex-col gap-2 overflow-y-auto pr-1" role="radiogroup">
          {!departmentId && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Pick a department to see its people.
            </p>
          )}
          {departmentId && source.isLoading && (
            <p className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Loading people…
            </p>
          )}
          {departmentId && source.isError && (
            <p className="py-4 text-sm text-destructive">Failed to load people.</p>
          )}
          {departmentId && source.isSuccess && people.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No one else to add from this department.
            </p>
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
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!selectedUserId || add.isPending}>
            {add.isPending ? <Loader2 className="animate-spin" /> : <UserPlus />}
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
