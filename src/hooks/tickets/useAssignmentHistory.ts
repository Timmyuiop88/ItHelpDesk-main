import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../lib/queryClient";
import { ticketService } from "../../services/ticket.service";

export function useAssignmentHistory(ticketId: string) {
  return useQuery({
    queryKey: queryKeys.tickets.assignmentHistory(ticketId),
    queryFn: () => ticketService.getAssignmentHistory(ticketId),
    enabled: !!ticketId,
  });
}
