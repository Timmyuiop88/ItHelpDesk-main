import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../lib/queryClient";
import { ticketService } from "../../services/ticket.service";

export function useTicketDevices(ticketId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.tickets.devices(ticketId),
    queryFn: () => ticketService.getDevices(ticketId),
    enabled: enabled && !!ticketId,
    // Online status changes often and the picker is opened rarely.
    staleTime: 0,
  });
}
