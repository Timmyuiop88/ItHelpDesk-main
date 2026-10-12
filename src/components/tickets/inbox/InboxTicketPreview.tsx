import { ExternalLink, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CommentFeed } from "../CommentFeed";
import { TicketMeta } from "../TicketMeta";
import { useAssignTicket } from "../../../hooks/tickets/useAssignTicket";
import { useCurrentTechnicianId } from "../../../hooks/technicians/useCurrentTechnicianId";
import { useTicket } from "../../../hooks/tickets/useTicket";
import { toastApiError } from "../../../lib/apiError";
import { priorityMeta, STATUS_META } from "../../../lib/ticketDisplay";
import { getAssigneeId, isEmailTicket, ticketLabel } from "../../../lib/tickets";

interface InboxTicketPreviewProps {
  ticketId: string | null;
  className?: string;
}

export function InboxTicketPreview({ ticketId, className = "" }: InboxTicketPreviewProps) {
  const navigate = useNavigate();
  const technicianId = useCurrentTechnicianId();
  const ticket = useTicket(ticketId ?? "");
  const assignTicket = useAssignTicket();

  if (!ticketId) {
    return (
      <div
        className={`flex min-w-0 flex-1 flex-col items-center justify-center bg-muted/20 p-8 text-center ${className}`}
      >
        <p className="text-sm font-medium text-muted-foreground">Select a ticket</p>
        <p className="mt-1 max-w-xs text-xs text-muted-foreground">
          Choose a conversation from the list to preview messages and take quick actions.
        </p>
      </div>
    );
  }

  if (ticket.isLoading) {
    return (
      <div className={`flex flex-1 items-center justify-center ${className}`}>
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (ticket.isError || !ticket.data) {
    return (
      <div className={`flex flex-1 items-center justify-center p-6 text-sm text-destructive ${className}`}>
        Failed to load ticket.
      </div>
    );
  }

  const data = ticket.data;
  const isClosed = data.status === "CLOSED";
  const unassigned = !getAssigneeId(data) && data.status === "OPEN";
  const status = STATUS_META[data.status];
  const priority = priorityMeta(data.priority);

  const handleAssign = () => {
    if (!technicianId) {
      toast.error("Could not match your technician profile.");
      return;
    }
    assignTicket.mutate(
      { id: data.id, payload: { technicianId } },
      {
        onSuccess: () => toast.success("Ticket assigned to you"),
        onError: (e) => toastApiError(e),
      },
    );
  };

  return (
    <div className={`flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background ${className}`}>
      <header className="shrink-0 space-y-3 border-b border-border px-4 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {data.ticketNumber !== undefined && (
              <p className="text-xs font-medium text-muted-foreground">{ticketLabel(data)}</p>
            )}
            <h2 className="text-lg font-semibold leading-tight">{data.title}</h2>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            {unassigned && (
              <Button size="sm" onClick={handleAssign} disabled={assignTicket.isPending}>
                Assign to me
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/technician/tickets/${data.id}`)}
            >
              <ExternalLink className="size-3.5" />
              Open full ticket
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline" className={status.pillClass}>
            {status.label}
          </Badge>
          <Badge variant="outline" className={priority.badgeClass}>
            {priority.label}
          </Badge>
          {data.category?.name && (
            <Badge variant="secondary">{data.category.name}</Badge>
          )}
          {isEmailTicket(data) && <Badge variant="outline">Via email</Badge>}
        </div>

        <TicketMeta ticket={data} showRequester showAssignee />

        {data.description && (
          <p className="text-sm text-muted-foreground">{data.description}</p>
        )}
      </header>

      <div className="flex min-h-0 flex-1 flex-col p-4 pt-3">
        <CommentFeed ticketId={data.id} isClosed={isClosed} role="technician" />
      </div>
    </div>
  );
}
