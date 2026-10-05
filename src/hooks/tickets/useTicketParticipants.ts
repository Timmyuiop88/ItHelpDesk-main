import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../lib/queryClient";
import { ticketService } from "../../services/ticket.service";

export function useTicketParticipants(id: string) {
  return useQuery({
    queryKey: queryKeys.tickets.participants(id),
    queryFn: () => ticketService.getParticipants(id),
    enabled: !!id,
  });
}
