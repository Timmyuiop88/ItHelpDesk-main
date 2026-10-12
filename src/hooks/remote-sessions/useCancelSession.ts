import { useMutation } from "@tanstack/react-query";
import { remoteSessionService } from "../../services/remote-session.service";

export function useCancelSession() {
  return useMutation({
    mutationFn: (id: string) => remoteSessionService.cancel(id),
  });
}
