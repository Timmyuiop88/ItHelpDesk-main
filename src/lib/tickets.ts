import type {
  Ticket,
  TicketComment,
  TicketParticipant,
  TicketUser,
} from "../types/ticket.types";
import { fullName } from "./format";

export function ticketLabel(ticket: {
  ticketNumber?: string | number;
  title?: string;
}): string {
  if (ticket.ticketNumber === undefined || ticket.ticketNumber === "") {
    return ticket.title ?? "Ticket";
  }
  const number = String(ticket.ticketNumber);
  return number.startsWith("#") ? number : `#${number}`;
}

export function getAssignee(ticket: Ticket) {
  return ticket.assignedTechnician ?? ticket.technician ?? null;
}

export function getAssigneeId(ticket: Ticket): string | null {
  return (
    ticket.assignedTechnicianId ??
    ticket.technicianId ??
    getAssignee(ticket)?.id ??
    null
  );
}

export function getAssigneeName(ticket: Ticket): string {
  return fullName(getAssignee(ticket)?.user);
}

export function getRequesterName(ticket: Ticket): string {
  return fullName(ticket.employee?.user);
}

export function getCommentAuthor(comment: TicketComment): TicketUser | null {
  return comment.author ?? comment.user ?? null;
}

export function getCommentAuthorId(comment: TicketComment): string | null {
  return comment.authorId ?? comment.userId ?? getCommentAuthor(comment)?.id ?? null;
}

export function getParticipantUserId(participant: TicketParticipant): string | null {
  return participant.userId ?? participant.user?.id ?? null;
}
