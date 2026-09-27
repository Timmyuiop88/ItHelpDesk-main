import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../lib/queryClient";
import { ticketService } from "../../services/ticket.service";

export function useTicket(id: string) {
  return useQuery({
    queryKey: queryKeys.tickets.detail(id),
    queryFn: () => ticketService.getById(id),
    enabled: !!id,
  });
}
