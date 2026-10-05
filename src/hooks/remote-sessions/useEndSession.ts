import { useMutation } from "@tanstack/react-query";
import { queryClient, queryKeys } from "../../lib/queryClient";
import { remoteSessionService } from "../../services/remote-session.service";

export function useEndSession() {
  return useMutation({
    mutationFn: (id: string) => remoteSessionService.end(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.tickets.all });
    },
  });
}
