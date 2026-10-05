import { useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useSocketEvent } from "../../components/SocketProvider";
import { fullName } from "../../lib/format";
import { queryKeys } from "../../lib/queryClient";
import { getCommentAuthor, ticketLabel } from "../../lib/tickets";
import type {
  TicketAssignedEvent,
  TicketCommentEvent,
  TicketParticipantAddedEvent,
  TicketParticipantRemovedEvent,
  TicketTransferredEvent,
} from "../../types/ticket.types";

export function useTicketSocket(basePath: "/employee" | "/technician") {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const pathRef = useRef(location.pathname);
  pathRef.current = location.pathname;

  const ticketPath = (ticketId: string) => `${basePath}/tickets/${ticketId}`;
  const isViewing = (ticketId: string) => pathRef.current === ticketPath(ticketId);
  const openAction = (ticketId: string) => ({
    label: "Open",
    onClick: () => navigate(ticketPath(ticketId)),
  });

  const refreshTicket = (ticketId: string) => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.tickets.detail(ticketId) });
    void queryClient.invalidateQueries({ queryKey: queryKeys.tickets.all, exact: true });
  };

  useSocketEvent<TicketCommentEvent>("ticket:comment", (event) => {
    void queryClient.invalidateQueries({
      queryKey: queryKeys.tickets.comments(event.ticketId),
    });
    if (isViewing(event.ticketId)) {
      return;
    }
    const author = fullName(getCommentAuthor(event.comment));
    toast.message(`New comment on ${ticketLabel(event)}`, {
      description: author
        ? `${author}: ${event.comment.message}`
        : event.comment.message,
      action: openAction(event.ticketId),
    });
  });

  useSocketEvent<TicketAssignedEvent>("ticket:assigned", (event) => {
    refreshTicket(event.ticketId);
    toast.success(`${ticketLabel(event)} assigned to you`, {
      description: event.title,
      action: openAction(event.ticketId),
    });
  });

  useSocketEvent<TicketTransferredEvent>("ticket:transferred", (event) => {
    refreshTicket(event.ticketId);
    void queryClient.invalidateQueries({
      queryKey: queryKeys.tickets.comments(event.ticketId),
    });
    toast.message(`${ticketLabel(event)} transferred to ${event.toTechnicianName}`, {
      description: event.note || event.title,
      action: isViewing(event.ticketId) ? undefined : openAction(event.ticketId),
    });
  });

  useSocketEvent<TicketParticipantAddedEvent>("ticket:participant-added", (event) => {
    refreshTicket(event.ticketId);
    toast.message(`You were added to ${ticketLabel(event)}`, {
      description: event.title,
      action: openAction(event.ticketId),
    });
  });

  useSocketEvent<TicketParticipantRemovedEvent>("ticket:participant-removed", (event) => {
    refreshTicket(event.ticketId);
    void queryClient.invalidateQueries({
      queryKey: queryKeys.tickets.participants(event.ticketId),
    });
    toast.message(`You were removed from ${ticketLabel(event)}`, {
      description: event.title,
    });
    if (isViewing(event.ticketId)) {
      navigate(`${basePath}/tickets`, { replace: true });
    }
  });
}
