import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../lib/queryClient";
import { ticketService } from "../../services/ticket.service";

export function useTicketComments(id: string) {
  return useQuery({
    queryKey: queryKeys.tickets.comments(id),
    queryFn: () => ticketService.getComments(id),
    enabled: !!id,
  });
}
