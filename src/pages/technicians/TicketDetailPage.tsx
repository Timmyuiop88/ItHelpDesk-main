import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RemoteSessionPanel } from "../../components/remote/RemoteSessionPanel";
import { CommentThread } from "../../components/tickets/CommentThread";
import { ParticipantsPanel } from "../../components/tickets/ParticipantsPanel";
import { TicketMeta } from "../../components/tickets/TicketMeta";
import { TransferTicketDialog } from "../../components/tickets/TransferTicketDialog";
import { useMe } from "../../hooks/auth/useMe";
import { useCloseTicket } from "../../hooks/tickets/useCloseTicket";
import { useAssignTicket } from "../../hooks/tickets/useAssignTicket";
import { useResolveTicket } from "../../hooks/tickets/useResolveTicket";
import { useTicket } from "../../hooks/tickets/useTicket";
import { useUpdateTicket } from "../../hooks/tickets/useUpdateTicket";
import { useCurrentTechnicianId } from "../../hooks/technicians/useCurrentTechnicianId";
import { getApiErrorMessage } from "../../lib/apiError";
import { getAssigneeId } from "../../lib/tickets";

const PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const;

export function TicketDetailPage() {
  const { id = "" } = useParams();
  const me = useMe();
  const ticket = useTicket(id);
  const assignTicket = useAssignTicket();
  const updateTicket = useUpdateTicket();
  const resolveTicket = useResolveTicket();
  const closeTicket = useCloseTicket();
  const technicianId = useCurrentTechnicianId();

  const status = ticket.data?.status;
  const assigneeId = ticket.data ? getAssigneeId(ticket.data) : null;
  const unassigned = !assigneeId && status === "OPEN";
  const assignedToMe = !!assigneeId && assigneeId === technicianId;
  const finished = status === "RESOLVED" || status === "CLOSED";
  const canWork =
    status === "IN_PROGRESS" || status === "WAITING_FOR_EMPLOYEE";

  const handleAssign = () => {
    if (!technicianId) {
      toast.error("Could not match your technician profile.");
      return;
    }
    assignTicket.mutate(
      { id, payload: { technicianId } },
      {
        onSuccess: () => toast.success("Ticket assigned to you"),
        onError: (error) => toast.error(getApiErrorMessage(error)),
      },
    );
  };

  const handleWaiting = () => {
    updateTicket.mutate(
      { id, payload: { status: "WAITING_FOR_EMPLOYEE" } },
      {
        onSuccess: () => toast.success("Waiting for employee"),
        onError: (error) => toast.error(getApiErrorMessage(error)),
      },
    );
  };

  const handlePriority = (priority: string) => {
    updateTicket.mutate(
      { id, payload: { priority } },
      {
        onError: (error) => toast.error(getApiErrorMessage(error)),
      },
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <Link to="/technician/tickets" className="text-sm text-muted-foreground">
        Back to tickets
      </Link>
      {ticket.isLoading && <p>Loading ticket...</p>}
      {ticket.isError && (
        <p className="text-destructive">Failed to load ticket.</p>
      )}
      {ticket.data && (
        <>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">{ticket.data.title}</h1>
              <TicketMeta ticket={ticket.data} showRequester className="mt-1" />
              <p className="mt-2 text-sm text-muted-foreground">
                {ticket.data.description}
              </p>
            </div>
            <Badge>{ticket.data.status}</Badge>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="priority">Priority</Label>
            <select
              id="priority"
              className="h-8 w-40 rounded-lg border border-input bg-background px-2 text-sm"
              value={ticket.data.priority}
              onChange={(event) => handlePriority(event.currentTarget.value)}
            >
              {PRIORITIES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-2">
            {unassigned && (
              <Button
                onClick={handleAssign}
                disabled={assignTicket.isPending || !technicianId}
              >
                Assign to me
              </Button>
            )}
            {assignedToMe && !finished && (
              <TransferTicketDialog ticketId={id} currentTechnicianId={technicianId} />
            )}
            {status === "IN_PROGRESS" && (
              <Button variant="outline" onClick={handleWaiting}>
                Waiting for employee
              </Button>
            )}
            {canWork && (
              <Button
                variant="outline"
                disabled={resolveTicket.isPending}
                onClick={() =>
                  resolveTicket.mutate(id, {
                    onSuccess: () => toast.success("Ticket resolved"),
                    onError: (error) => toast.error(getApiErrorMessage(error)),
                  })
                }
              >
                Resolve
              </Button>
            )}
            {status !== "CLOSED" && (
              <Button
                variant="outline"
                disabled={closeTicket.isPending}
                onClick={() =>
                  closeTicket.mutate(id, {
                    onSuccess: () => toast.success("Ticket closed"),
                    onError: (error) => toast.error(getApiErrorMessage(error)),
                  })
                }
              >
                Close
              </Button>
            )}
          </div>

          <RemoteSessionPanel
            ticketId={id}
            unavailableReason={
              status === "CLOSED" || status === "RESOLVED"
                ? "Remote access isn't available once a ticket is resolved or closed."
                : !assignedToMe
                  ? "Assign this ticket to yourself to request remote access."
                  : undefined
            }
          />

          <ParticipantsPanel
            ticketId={id}
            currentUserId={me.data?.id}
            canManage={assignedToMe && status !== "CLOSED"}
          />

          <CommentThread
            ticketId={id}
            currentUserId={me.data?.id}
            disabled={status === "CLOSED"}
          />
        </>
      )}
    </div>
  );
}
