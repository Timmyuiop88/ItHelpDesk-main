import { useMutation } from "@tanstack/react-query";
import { useRef } from "react";
import { queryClient, queryKeys } from "../../lib/queryClient";
import { ticketService } from "../../services/ticket.service";
import type { CreateTicketPayload } from "../../types/ticket.types";
import { getAssigneeName } from "../../lib/tickets";

export function useCreateTicket() {
  const idempotencyKeyRef = useRef(crypto.randomUUID());

  return useMutation({
    mutationFn: (payload: CreateTicketPayload) =>
      ticketService.create(payload, idempotencyKeyRef.current),
    onSuccess: async () => {
      idempotencyKeyRef.current = crypto.randomUUID();
      await queryClient.invalidateQueries({ queryKey: queryKeys.tickets.all });
    },
  });
}

export function createTicketSuccessMessage(ticket: {
  assignedTechnician?: { user?: { firstName?: string; lastName?: string } } | null;
  technician?: { user?: { firstName?: string; lastName?: string } } | null;
}): string {
  const assignee = getAssigneeName(ticket as Parameters<typeof getAssigneeName>[0]);
  return assignee ? `Assigned to ${assignee}` : "Queued for a technician";
}
