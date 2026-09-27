import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../lib/queryClient";
import { ticketService } from "../../services/ticket.service";

export function useTickets() {
  return useQuery({
    queryKey: queryKeys.tickets.all,
    queryFn: () => ticketService.getAll(),
  });
}
