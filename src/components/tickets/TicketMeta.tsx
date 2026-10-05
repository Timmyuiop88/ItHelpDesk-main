import { formatRelative } from "../../lib/format";
import {
  getAssigneeId,
  getAssigneeName,
  getRequesterName,
  ticketLabel,
} from "../../lib/tickets";
import type { Ticket } from "../../types/ticket.types";

interface TicketMetaProps {
  ticket: Ticket;
  showRequester?: boolean;
  showAssignee?: boolean;
  className?: string;
}

export function TicketMeta({
  ticket,
  showRequester = false,
  showAssignee = true,
  className = "",
}: TicketMetaProps) {
  const parts: string[] = [];

  if (ticket.ticketNumber !== undefined) {
    parts.push(ticketLabel(ticket));
  }
  if (showRequester) {
    const requester = getRequesterName(ticket);
    if (requester) parts.push(`from ${requester}`);
  }
  if (showAssignee) {
    const assignee = getAssigneeName(ticket);
    if (assignee) {
      parts.push(`assigned to ${assignee}`);
    } else if (!getAssigneeId(ticket) && ticket.status === "OPEN") {
      parts.push("unassigned");
    }
  }
  if (ticket.createdAt) {
    parts.push(`opened ${formatRelative(ticket.createdAt)}`);
  }

  if (parts.length === 0) {
    return null;
  }

  return (
    <p className={`text-xs text-muted-foreground ${className}`}>
      {parts.join(" · ")}
    </p>
  );
}
